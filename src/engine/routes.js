/* =========================================================================
 * src/engine/routes.js — 大軍行軍路線（隨時間漸進顯示的精緻貼地緞帶）
 *   路線像彗星尾跟著部隊推進：尚未行經的不顯示，剛走過最亮，
 *   走遠（超過 uWindow 小時）後淡出。如此戰前不會提早出現整條路線，
 *   決戰時長程行軍線也會自然淡掉、不擋畫面。
 *
 *   精緻化重點（全部在 shader/uniform 完成，不每幀重建幾何）：
 *     1) 平滑      — Catmull-Rom 重取樣 + 更高段數，沿地形平滑貼地、略抬離地避 z-fighting。
 *     2) 漸層淡出  — 朝目的地漸亮（頭暗尾亮），配合時窗的彗星尾。
 *     3) 柔邊      — 以橫向 aEdge(0~1) 在 fragment 做羽化，邊緣半透明不死硬。
 *     4) 寬度漸變  — 頭寬尾窄（尾端收成箭頭），由幾何頂點寬度體現。
 *     5) 流動感    — 沿路徑流動的亮帶（uFlow 動畫），朝行進方向流動，疊在底色上。
 *
 *   每個頂點帶：
 *     aTime — 該點被行經的時刻（漸進顯示 / 時窗淡出）
 *     aEdge — 橫向座標 -1(右) ~ +1(左)，用來做柔邊羽化
 *     aProg — 沿路徑 0(起點) ~ 1(終點) 的歸一化進度，用來做朝目的地漸亮 + 流動相位
 * ======================================================================= */
window.SEKI = window.SEKI || {};

(function (S) {
  const EAST = 0x3a78ff, WEST = 0xff3b3b;
  const LIFT = 1.0, HALF = 1.6, WINDOW = 3.5;   // 緞帶離地/半寬/淡出時窗(小時,走遠即淡出)
  let _routes = [];
  let _clock = 0;                                // 流動動畫相位（由 updateRoutes 推進）

  /* ---- Shaders -----------------------------------------------------------
   * 頂點：算出時窗透明度 vBase、朝目的地漸亮係數 vProg、柔邊用 vEdge、流動相位 vPhase。
   * 片段：底色 + 朝終點漸亮 + 橫向柔邊羽化 + 沿路徑流動亮帶。
   */
  const VERT = `
    attribute float aTime;
    attribute float aEdge;
    attribute float aProg;
    varying float vBase;   // 時窗透明度(彗星尾)
    varying float vEdge;   // 橫向座標(柔邊)
    varying float vProg;   // 沿路徑進度(漸亮/流動)
    uniform float uTime, uWindow, uMaxOp;
    void main(){
      float dt = uTime - aTime;
      // 尚未行經 -> 0；剛走過 -> 1；走遠 -> 線性淡出
      vBase = (dt < 0.0) ? 0.0 : uMaxOp * clamp(1.0 - dt / uWindow, 0.0, 1.0);
      vEdge = aEdge;
      vProg = aProg;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`;

  const FRAG = `
    precision mediump float;
    varying float vBase;
    varying float vEdge;
    varying float vProg;
    uniform vec3  uColor;
    uniform float uFlow;   // 流動相位(隨時間遞增)
    void main(){
      if (vBase < 0.004) discard;

      // 柔邊：中心(vEdge≈0)最實，邊緣(|vEdge|→1)羽化淡出
      float edge = 1.0 - smoothstep(0.55, 1.0, abs(vEdge));

      // 朝目的地漸亮：尾端(vProg→1)較亮，頭端較暗(保底 0.45)
      float dirGrad = mix(0.45, 1.0, vProg);

      // 沿路徑流動的亮帶：相位沿 vProg 推進，朝行進方向掃動
      float flow = sin((vProg * 26.0) - uFlow);
      float band = smoothstep(0.55, 1.0, flow);          // 細亮帶
      vec3  col  = uColor + band * 0.55;                 // 流動處提亮(偏白)

      float alpha = vBase * edge * dirGrad;
      alpha += vBase * edge * band * 0.35;               // 流動處再加一點透明度
      if (alpha < 0.004) discard;
      gl_FragColor = vec4(col, alpha);
    }`;

  function terrainPt(lng, lat) {
    const p = S.engine.project(lng, lat, 0);
    const y = (S.terrain ? S.terrain.heightAt(p.x, p.z) : 0) + LIFT;
    return new THREE.Vector3(p.x, y, p.z);
  }

  // Catmull-Rom：在 p1~p2 之間插值（不依賴 BufferGeometryUtils，純手寫）
  function catmullRom(p0, p1, p2, p3, k, out) {
    const k2 = k * k, k3 = k2 * k;
    out.x = 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * k +
      (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * k2 +
      (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * k3);
    out.y = 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * k +
      (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * k2 +
      (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * k3);
    out.z = 0.5 * ((2 * p1.z) + (-p0.z + p2.z) * k +
      (2 * p0.z - 5 * p1.z + 4 * p2.z - p3.z) * k2 +
      (-p0.z + 3 * p1.z - 3 * p2.z + p3.z) * k3);
    return out;
  }

  // 由 (中心線點, 對應時刻) 建漸進緞帶
  //  - 寬度沿路徑漸變：頭寬尾窄，尾端再收成箭頭
  //  - 每頂點寫入 aEdge(柔邊) / aProg(漸亮+流動)
  function buildRibbon(pts, times, color) {
    const n = pts.length, verts = [], aT = [], aE = [], aP = [], idx = [];
    const up = new THREE.Vector3(0, 1, 0), tan = new THREE.Vector3(), perp = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(i - 1, 0)], b = pts[Math.min(i + 1, n - 1)];
      tan.subVectors(b, a); tan.y = 0; tan.normalize();
      perp.crossVectors(tan, up).normalize();
      const prog = n > 1 ? i / (n - 1) : 0;                 // 0(起)~1(終)
      // 寬度沿路徑漸變：頭寬(1.05)→尾窄(0.4)，平滑收束
      const taper = 1.05 - 0.65 * prog * prog;
      const w = HALF * (i === n - 1 ? 0.35 : taper);
      const L = new THREE.Vector3().copy(pts[i]).addScaledVector(perp, w);
      const R = new THREE.Vector3().copy(pts[i]).addScaledVector(perp, -w);
      verts.push(L.x, L.y, L.z, R.x, R.y, R.z);
      aT.push(times[i], times[i]);
      aE.push(1.0, -1.0);                                   // 左 +1 / 右 -1（柔邊）
      aP.push(prog, prog);
    }
    for (let i = 0; i < n - 1; i++) {
      const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
      idx.push(a, c, b, b, c, d);
    }
    // 末端箭頭（aTime 取終點時刻；aEdge 用 0 讓箭頭較實；aProg 取 1 最亮）
    const tip = pts[n - 1], pa = pts[n - 2];
    tan.subVectors(tip, pa); tan.y = 0; tan.normalize();
    perp.crossVectors(tan, up).normalize();
    const baseI = verts.length / 3, hl = HALF * 3.2, hw = HALF * 2.4, tEnd = times[n - 1];
    const apex = new THREE.Vector3().copy(tip).addScaledVector(tan, hl);
    const wL = new THREE.Vector3().copy(tip).addScaledVector(perp, hw);
    const wR = new THREE.Vector3().copy(tip).addScaledVector(perp, -hw);
    verts.push(wL.x, wL.y, wL.z, wR.x, wR.y, wR.z, apex.x, apex.y, apex.z);
    aT.push(tEnd, tEnd, tEnd);
    aE.push(0.6, -0.6, 0.0);                                // 箭頭兩翼略羽化、尖端最實
    aP.push(1.0, 1.0, 1.0);
    idx.push(baseI, baseI + 2, baseI + 1);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geo.setAttribute('aTime', new THREE.Float32BufferAttribute(aT, 1));
    geo.setAttribute('aEdge', new THREE.Float32BufferAttribute(aE, 1));
    geo.setAttribute('aProg', new THREE.Float32BufferAttribute(aP, 1));
    geo.setIndex(idx);
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: -99 }, uWindow: { value: WINDOW }, uMaxOp: { value: 0.6 },
                  uFlow: { value: 0 }, uColor: { value: new THREE.Color(color) } },
      vertexShader: VERT, fragmentShader: FRAG,
      transparent: true, side: THREE.DoubleSide, depthWrite: false });
    return new THREE.Mesh(geo, mat);
  }

  S.buildRoutes = function () {
    const eng = S.engine;
    _routes = [];
    for (const a of S.armies) {
      const tk = a.track;
      if (!tk || tk.length < 2) continue;

      // 1) 先把 track 投影成世界座標控制點(含時刻)
      const ctrl = [], ctrlT = [];
      for (const w of tk) { ctrl.push(terrainPt(w.lng, w.lat)); ctrlT.push(w.t); }

      // 2) Catmull-Rom 重取樣 -> 更平滑曲線（提高段數，沿地形平滑貼地）
      const SUB = 18, pts = [], times = [];
      const tmp = new THREE.Vector3();
      const m = ctrl.length;
      for (let i = 0; i < m - 1; i++) {
        const p0 = ctrl[Math.max(i - 1, 0)], p1 = ctrl[i],
              p2 = ctrl[i + 1], p3 = ctrl[Math.min(i + 2, m - 1)];
        for (let s = 0; s < SUB; s++) {
          const k = s / SUB;
          const v = catmullRom(p0, p1, p2, p3, k, new THREE.Vector3());
          // 平滑貼地：重新取地形高度，避免曲線插值穿地/浮空
          if (S.terrain) v.y = S.terrain.heightAt(v.x, v.z) + LIFT;
          pts.push(v);
          times.push(ctrlT[i] + (ctrlT[i + 1] - ctrlT[i]) * k);
        }
      }
      pts.push(ctrl[m - 1].clone()); times.push(ctrlT[m - 1]);

      let len = 0; for (let i = 1; i < pts.length; i++) len += pts[i].distanceTo(pts[i - 1]);
      if (len < 4) continue;
      const mesh = buildRibbon(pts, times, a.side === 'east' ? EAST : WEST);
      mesh.frustumCulled = false;
      mesh.renderOrder = 2;                                  // 壓在地形之上、單位之下
      eng.scene.add(mesh);
      _routes.push({ mesh });
    }
    return _routes;
  };

  S.updateRoutes = function (t) {
    // 流動相位：以實際幀推進，獨立於戰役時刻，產生穩定流動感
    _clock += 0.06;
    for (const r of _routes) {
      const u = r.mesh.material.uniforms;
      u.uTime.value = t;
      u.uFlow.value = _clock;
    }
  };

  S.setRoutesVisible = function (v) { for (const r of _routes) r.mesh.visible = v; };
})(window.SEKI);
