/* =========================================================================
 * src/engine/engage.js — 交戰呈現（脈動交戰帶 + 衝突區光暈 + 集中砲火）
 *   兩軍接觸處以一條會脈動的交戰帶連結，帶寬依交戰強度（較弱一方兵力）變化：
 *   大兵團激戰＝粗帶、小規模＝細帶；砲火集中於接觸點。
 *   接觸中點再疊一組「衝突區」視覺：柔邊脈動衝突圈 + 交鋒光核 + 旋轉火花環，
 *   強度隨雙方兵力與時間脈動，讓「哪裡正在交鋒」一目了然。
 *   「誰打誰」的文字改由右側軍隊面板呈現，3D 場景僅留視覺交戰帶以免擁擠。
 *   相容三場戰役（關原/桶狹間/諾曼第）：僅依賴 S.engagements + S.unitById +
 *   各 unit 的 group.position / cur.s 與時間窗，未綁定任何單一戰役設定。
 * ======================================================================= */
window.SEKI = window.SEKI || {};

(function (S) {
  let _eng = [], _acc = 0, _t = 0;
  const _mid = new THREE.Vector3();

  // 以程式產生「柔邊放射光暈」貼圖（中心亮、邊緣透明），供衝突圈/光核共用。
  // 只建一次並快取，避免重複生成；不依賴外部圖檔，三場戰役通用。
  let _glowTex = null;
  function _getGlowTexture() {
    if (_glowTex) return _glowTex;
    const N = 128, cv = document.createElement('canvas');
    cv.width = cv.height = N;
    const ctx = cv.getContext('2d');
    const g = ctx.createRadialGradient(N / 2, N / 2, 0, N / 2, N / 2, N / 2);
    g.addColorStop(0.0, 'rgba(255,255,255,1)');
    g.addColorStop(0.25, 'rgba(255,236,190,0.85)');
    g.addColorStop(0.55, 'rgba(255,150,60,0.35)');
    g.addColorStop(1.0, 'rgba(255,120,40,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, N, N);
    _glowTex = new THREE.CanvasTexture(cv);
    _glowTex.needsUpdate = true;
    return _glowTex;
  }

  // 以程式產生「環形（甜甜圈）」柔邊貼圖，供衝突圈擴張波使用。
  let _ringTex = null;
  function _getRingTexture() {
    if (_ringTex) return _ringTex;
    const N = 128, cv = document.createElement('canvas');
    cv.width = cv.height = N;
    const ctx = cv.getContext('2d');
    const g = ctx.createRadialGradient(N / 2, N / 2, 0, N / 2, N / 2, N / 2);
    // 內外透明、中段亮 → 形成發光圈
    g.addColorStop(0.00, 'rgba(255,120,40,0)');
    g.addColorStop(0.55, 'rgba(255,120,40,0)');
    g.addColorStop(0.78, 'rgba(255,210,140,0.9)');
    g.addColorStop(0.90, 'rgba(255,140,50,0.5)');
    g.addColorStop(1.00, 'rgba(255,120,40,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, N, N);
    _ringTex = new THREE.CanvasTexture(cv);
    _ringTex.needsUpdate = true;
    return _ringTex;
  }

  S.buildEngagements = function () {
    const eng = S.engine;
    _eng = [];
    const bandGeo = new THREE.PlaneGeometry(1, 1); bandGeo.rotateX(-Math.PI / 2);
    // 衝突區三個構件共用同一張水平面幾何（已旋轉成 XZ 平面，朝上）
    const flatGeo = new THREE.PlaneGeometry(1, 1); flatGeo.rotateX(-Math.PI / 2);
    const glowTex = _getGlowTexture();
    const ringTex = _getRingTexture();

    for (const e of (S.engagements || [])) {
      // (1) 交戰帶：沿雙方連線的脈動長條（既有效果，保留）
      const band = new THREE.Mesh(bandGeo, new THREE.MeshBasicMaterial({
        color: 0xff7a2a, transparent: true, opacity: 0, depthWrite: false,
        blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
      band.frustumCulled = false; eng.scene.add(band);

      // (2) 衝突光核：中點處的柔邊發光圓盤，呈現「交鋒熱點」
      const core = new THREE.Mesh(flatGeo, new THREE.MeshBasicMaterial({
        map: glowTex, color: 0xffd6a0, transparent: true, opacity: 0,
        depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
      core.frustumCulled = false; eng.scene.add(core);

      // (3) 衝突圈：自中點向外擴張的脈動發光環，強調「衝突區範圍」
      const ring = new THREE.Mesh(flatGeo, new THREE.MeshBasicMaterial({
        map: ringTex, color: 0xff8a3a, transparent: true, opacity: 0,
        depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
      ring.frustumCulled = false; eng.scene.add(ring);

      // (4) 火花環：較小、旋轉的亮環，製造交鋒火花/震動感
      const spark = new THREE.Mesh(flatGeo, new THREE.MeshBasicMaterial({
        map: ringTex, color: 0xfff0c0, transparent: true, opacity: 0,
        depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
      spark.frustumCulled = false; eng.scene.add(spark);

      _eng.push({
        data: e, band, core, ring, spark, idx: _eng.length,
        // 每組獨立相位，避免全場同步脈動而顯得整齊呆板
        phase: Math.random() * Math.PI * 2,
        op: 0,                                  // 平滑後的整體顯示係數（淡入淡出用）
      });
    }
    return _eng;
  };

  S.updateEngagements = function (t, dt) {
    _t += dt; _acc += dt;
    const doBurst = _acc >= 0.07; if (doBurst) _acc = 0;
    // 淡入淡出速度（每秒趨近目標值的比例），讓開始/結束都柔順
    const fade = Math.min(dt * 6, 1);

    for (const o of _eng) {
      const e = o.data;
      const A = S.unitById(e.a), B = S.unitById(e.b);
      const sA = A && A.cur ? A.cur.s : 0, sB = B && B.cur ? B.cur.s : 0;
      // 帶子顯示所有當前交戰（不限聚焦），讓全場戰況都看得到
      const active = A && B && t >= e.from && t <= e.to && sA > 1 && sB > 1;

      // 整體顯示係數平滑趨近：active→1、否則→0；結束時所有構件一起淡出
      o.op += ((active ? 1 : 0) - o.op) * fade;
      if (o.op < 0.003) {
        // 幾乎不可見時直接歸零並隱藏，省去逐幀運算
        if (o.band.material.opacity !== 0) {
          o.op = 0;
          o.band.material.opacity = 0;
          o.core.material.opacity = 0;
          o.ring.material.opacity = 0;
          o.spark.material.opacity = 0;
        }
        if (!active) continue;
      }

      const pa = A.group.position, pb = B.group.position;
      const dx = pb.x - pa.x, dz = pb.z - pa.z;
      const dist = Math.max(Math.hypot(dx, dz), 0.1);
      _mid.set((pa.x + pb.x) / 2, (pa.y + pb.y) / 2 + 1.0, (pa.z + pb.z) / 2);

      const intensity = Math.min(sA, sB);
      const inorm = Math.min(intensity / 20000, 1);             // 0~1 正規化強度
      const width = 2 + Math.min(intensity / 2500, 12);         // 寬度＝交戰強度
      const ang = Math.atan2(-dz, dx);
      const op = o.op;

      // ── (1) 交戰帶：沿連線脈動長條（保留既有外觀，疊上整體淡入淡出）──
      const bandPulse = 0.3 + 0.16 * Math.sin(_t * 6 + o.phase);
      o.band.position.copy(_mid);
      o.band.rotation.y = ang;
      o.band.scale.set(dist, 1, width);
      o.band.material.opacity = bandPulse * op;

      // 衝突區三件構件落在連線中點略上方，避免與地形 z-fighting
      const cy = _mid.y + 0.15;

      // ── (2) 衝突光核：交鋒熱點，呼吸式脈動 + 隨強度放大 ──
      const coreSize = (width * 1.6) * (0.9 + 0.18 * Math.sin(_t * 5.0 + o.phase));
      o.core.position.set(_mid.x, cy, _mid.z);
      o.core.scale.set(coreSize, 1, coreSize);
      o.core.material.opacity = (0.4 + 0.45 * inorm) * (0.7 + 0.3 * Math.sin(_t * 5.0 + o.phase)) * op;

      // ── (3) 衝突圈：週期性向外擴張的衝擊波（0→1 循環，外擴同時變淡）──
      const wave = (_t * 0.9 + o.phase * 0.16) % 1;             // 0~1 鋸齒循環
      const ringSize = width * (1.4 + wave * 3.2);              // 隨循環向外擴張
      o.ring.position.set(_mid.x, cy, _mid.z);
      o.ring.scale.set(ringSize, 1, ringSize);
      // 擴張到邊緣時淡出，形成一波波衝擊感；強度越高波越明顯
      o.ring.material.opacity = (0.5 + 0.4 * inorm) * (1 - wave) * op;

      // ── (4) 火花環：較小、反向旋轉並快速明滅，呈現交鋒火花/震動 ──
      const sparkPulse = 0.5 + 0.5 * Math.sin(_t * 14 + o.phase * 2.0);
      const sparkSize = width * (0.8 + 0.25 * sparkPulse);
      o.spark.position.set(_mid.x, cy + 0.1, _mid.z);
      o.spark.rotation.y = -_t * 2.2 + o.phase;                // 旋轉製造躁動感
      o.spark.scale.set(sparkSize, 1, sparkSize);
      o.spark.material.opacity = (0.25 + 0.5 * inorm) * sparkPulse * op;

      // ── 集中砲火：沿用既有 combatBurst（強度越高、越頻繁）──
      if (active && doBurst && S.combatBurst &&
          Math.random() < 0.5 + Math.min(intensity / 20000, 0.45)) {
        const sy = S.terrain ? S.terrain.heightAt(_mid.x, _mid.z) : _mid.y;
        S.combatBurst(_mid.x, sy, _mid.z);
      }
    }
  };
})(window.SEKI);
