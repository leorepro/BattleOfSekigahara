/* =========================================================================
 * src/engine/routes.js — 大軍行軍路線（隨時間漸進顯示的貼地緞帶）
 *   路線像彗星尾跟著部隊推進：尚未行經的不顯示，剛走過最亮，
 *   走遠（超過 uWindow 小時）後淡出。如此戰前不會提早出現整條路線，
 *   決戰時長程行軍線也會自然淡掉、不擋畫面。
 *   每個頂點帶 aTime（該點被行經的時刻），由 shader 依當前時刻控制透明度。
 * ======================================================================= */
window.SEKI = window.SEKI || {};

(function (S) {
  const EAST = 0x3a78ff, WEST = 0xff3b3b;
  const LIFT = 1.0, HALF = 1.6, WINDOW = 8.0;   // 緞帶離地/半寬/淡出時窗(小時)
  let _routes = [];

  const VERT = `
    attribute float aTime; varying float vA;
    uniform float uTime, uWindow, uMaxOp;
    void main(){
      float dt = uTime - aTime;
      vA = (dt < 0.0) ? 0.0 : uMaxOp * clamp(1.0 - dt / uWindow, 0.0, 1.0);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`;
  const FRAG = `
    varying float vA; uniform vec3 uColor;
    void main(){ if (vA < 0.01) discard; gl_FragColor = vec4(uColor, vA); }`;

  function terrainPt(lng, lat) {
    const p = S.engine.project(lng, lat, 0);
    const y = (S.terrain ? S.terrain.heightAt(p.x, p.z) : 0) + LIFT;
    return new THREE.Vector3(p.x, y, p.z);
  }

  // 由 (中心線點, 對應時刻) 建漸進緞帶
  function buildRibbon(pts, times, color) {
    const n = pts.length, verts = [], aT = [], idx = [];
    const up = new THREE.Vector3(0, 1, 0), tan = new THREE.Vector3(), perp = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(i - 1, 0)], b = pts[Math.min(i + 1, n - 1)];
      tan.subVectors(b, a); tan.y = 0; tan.normalize();
      perp.crossVectors(tan, up).normalize();
      const w = HALF * (i === n - 1 ? 0.4 : 1);
      const L = new THREE.Vector3().copy(pts[i]).addScaledVector(perp, w);
      const R = new THREE.Vector3().copy(pts[i]).addScaledVector(perp, -w);
      verts.push(L.x, L.y, L.z, R.x, R.y, R.z);
      aT.push(times[i], times[i]);
    }
    for (let i = 0; i < n - 1; i++) {
      const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
      idx.push(a, c, b, b, c, d);
    }
    // 末端箭頭（aTime 取終點時刻）
    const tip = pts[n - 1], pa = pts[n - 2];
    tan.subVectors(tip, pa); tan.y = 0; tan.normalize();
    perp.crossVectors(tan, up).normalize();
    const baseI = verts.length / 3, hl = HALF * 3.2, hw = HALF * 2.4, tEnd = times[n - 1];
    const apex = new THREE.Vector3().copy(tip).addScaledVector(tan, hl);
    const wL = new THREE.Vector3().copy(tip).addScaledVector(perp, hw);
    const wR = new THREE.Vector3().copy(tip).addScaledVector(perp, -hw);
    verts.push(wL.x, wL.y, wL.z, wR.x, wR.y, wR.z, apex.x, apex.y, apex.z);
    aT.push(tEnd, tEnd, tEnd);
    idx.push(baseI, baseI + 2, baseI + 1);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geo.setAttribute('aTime', new THREE.Float32BufferAttribute(aT, 1));
    geo.setIndex(idx);
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: -99 }, uWindow: { value: WINDOW }, uMaxOp: { value: 0.6 },
                  uColor: { value: new THREE.Color(color) } },
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
      const SUB = 8, pts = [], times = [];
      for (let i = 0; i < tk.length - 1; i++) {
        for (let s = 0; s < SUB; s++) {
          const k = s / SUB;
          pts.push(terrainPt(tk[i].lng + (tk[i+1].lng - tk[i].lng) * k,
                             tk[i].lat + (tk[i+1].lat - tk[i].lat) * k));
          times.push(tk[i].t + (tk[i+1].t - tk[i].t) * k);
        }
      }
      const last = tk[tk.length - 1];
      pts.push(terrainPt(last.lng, last.lat)); times.push(last.t);

      let len = 0; for (let i = 1; i < pts.length; i++) len += pts[i].distanceTo(pts[i-1]);
      if (len < 4) continue;
      const mesh = buildRibbon(pts, times, a.side === 'east' ? EAST : WEST);
      mesh.frustumCulled = false;
      eng.scene.add(mesh);
      _routes.push({ mesh });
    }
    return _routes;
  };

  S.updateRoutes = function (t) {
    for (const r of _routes) r.mesh.material.uniforms.uTime.value = t;
  };

  S.setRoutesVisible = function (v) { for (const r of _routes) r.mesh.visible = v; };
})(window.SEKI);
