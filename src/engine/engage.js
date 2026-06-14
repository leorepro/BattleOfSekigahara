/* =========================================================================
 * src/engine/engage.js — 交戰呈現（脈動交戰帶 + 集中砲火）
 *   兩軍接觸處以一條會脈動的交戰帶連結，帶寬依交戰強度（較弱一方兵力）變化：
 *   大兵團激戰＝粗帶、小規模＝細帶；砲火集中於接觸點。
 *   「誰打誰」的文字改由右側軍隊面板呈現，3D 場景僅留視覺交戰帶以免擁擠。
 * ======================================================================= */
window.SEKI = window.SEKI || {};

(function (S) {
  let _eng = [], _acc = 0, _t = 0;
  const _mid = new THREE.Vector3();

  S.buildEngagements = function () {
    const eng = S.engine;
    _eng = [];
    const bandGeo = new THREE.PlaneGeometry(1, 1); bandGeo.rotateX(-Math.PI / 2);
    for (const e of (S.engagements || [])) {
      const band = new THREE.Mesh(bandGeo, new THREE.MeshBasicMaterial({
        color: 0xff7a2a, transparent: true, opacity: 0, depthWrite: false,
        blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
      band.frustumCulled = false; eng.scene.add(band);
      _eng.push({ data: e, band, idx: _eng.length });
    }
    return _eng;
  };

  S.updateEngagements = function (t, dt) {
    _t += dt; _acc += dt;
    const doBurst = _acc >= 0.07; if (doBurst) _acc = 0;

    for (const o of _eng) {
      const e = o.data;
      const A = S.unitById(e.a), B = S.unitById(e.b);
      const sA = A && A.cur ? A.cur.s : 0, sB = B && B.cur ? B.cur.s : 0;
      // 帶子顯示所有當前交戰（不限聚焦），讓全場戰況都看得到
      const active = A && B && t >= e.from && t <= e.to && sA > 1 && sB > 1;
      if (!active) { if (o.band.material.opacity !== 0) o.band.material.opacity = 0; continue; }

      const pa = A.group.position, pb = B.group.position;
      const dx = pb.x - pa.x, dz = pb.z - pa.z;
      const dist = Math.max(Math.hypot(dx, dz), 0.1);
      _mid.set((pa.x+pb.x)/2, (pa.y+pb.y)/2 + 1.0, (pa.z+pb.z)/2);

      const intensity = Math.min(sA, sB);
      const width = 2 + Math.min(intensity / 2500, 12);        // 寬度＝交戰強度
      o.band.position.copy(_mid);
      o.band.rotation.y = Math.atan2(-dz, dx);
      o.band.scale.set(dist, 1, width);
      o.band.material.opacity = 0.3 + 0.16 * Math.sin(_t * 6 + o.idx);

      if (doBurst && S.combatBurst && Math.random() < 0.5 + Math.min(intensity/20000, 0.45)) {
        const sy = S.terrain ? S.terrain.heightAt(_mid.x, _mid.z) : _mid.y;
        S.combatBurst(_mid.x, sy, _mid.z);
      }
    }
  };
})(window.SEKI);
