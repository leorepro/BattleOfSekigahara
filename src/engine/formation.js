/* =========================================================================
 * src/engine/formation.js — 兵團陣型（Total War 風：成群士兵組成方陣）
 *   每支部隊以 InstancedMesh 渲染數十~上百名士兵排成方陣，朝敵方向。
 *   兵力下降時士兵數隨之減少（mesh.count）；陣型隨部隊移動、轉向。
 *   軍旗（家紋）縮小為陣型上方的識別旗。
 * ======================================================================= */
window.SEKI = window.SEKI || {};

(function (S) {
  const EAST = 0x33457e, WEST = 0x7e3333;       // 兵團暗色(藍/紅軍裝)
  const SP = 0.92, BODY_H = 1.6;                 // 士兵間距 / 身高
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(),
        _p = new THREE.Vector3(), _s = new THREE.Vector3(1, 1, 1), _up = new THREE.Vector3(0, 1, 0);
  let _forms = [];

  // 單兵幾何：身體 + 頭（合併成一個 BufferGeometry）
  function soldierGeo() {
    const body = new THREE.BoxGeometry(0.5, BODY_H, 0.42); body.translate(0, BODY_H/2, 0);
    const head = new THREE.BoxGeometry(0.34, 0.34, 0.34); head.translate(0, BODY_H + 0.17, 0);
    // 手動合併兩個 box 的 position/normal/index
    const geos = [body, head];
    let vc = 0, ic = 0;
    geos.forEach(g => { vc += g.attributes.position.count; ic += g.index.count; });
    const pos = new Float32Array(vc*3), nor = new Float32Array(vc*3), idx = [];
    let vo = 0;
    geos.forEach(g => {
      pos.set(g.attributes.position.array, vo*3);
      nor.set(g.attributes.normal.array, vo*3);
      const gi = g.index.array; for (let i=0;i<gi.length;i++) idx.push(gi[i]+vo);
      vo += g.attributes.position.count;
    });
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    out.setIndex(idx);
    return out;
  }

  function maxSoldiersFor(troops) { return Math.max(16, Math.min(160, Math.round(troops/120))); }

  S.buildFormations = function () {
    const eng = S.engine;
    _forms = [];
    const geo = soldierGeo();
    for (const a of S.armies) {
      const max = maxSoldiersFor(a.troops);
      const cols = Math.max(4, Math.round(Math.sqrt(max * 1.7)));
      const rows = Math.ceil(max / cols);
      const mat = new THREE.MeshStandardMaterial({
        color: a.side === 'east' ? EAST : WEST, roughness: 0.85, metalness: 0 });
      const inst = new THREE.InstancedMesh(geo, mat, max);
      inst.castShadow = true; inst.frustumCulled = false;
      // 預先寫入每名士兵的「方陣內」局部位置（含些微抖動，較自然）
      const offs = [];
      for (let i = 0; i < max; i++) {
        const c = i % cols, r = Math.floor(i / cols);
        const x = (c - (cols-1)/2) * SP + (Math.sin(i*12.9)*0.18);
        const z = (r - (rows-1)/2) * SP + (Math.cos(i*7.7)*0.18);
        const ry = Math.sin(i*4.1) * 0.25;
        offs.push({ x, z, ry });
        _m.compose(_p.set(x, 0, z), _q.setFromAxisAngle(_up, ry), _s);
        inst.setMatrixAt(i, _m);
      }
      inst.instanceMatrix.needsUpdate = true;
      eng.scene.add(inst);
      _forms.push({ data: a, inst, max, offs, facing: 0,
        strengthPer: a.troops / max });
    }
    return _forms;
  };

  S.updateFormations = function (t) {
    for (const f of _forms) {
      const u = S.unitById(f.data.id); if (!u) continue;
      const gp = u.group.position;
      f.inst.position.set(gp.x, gp.y, gp.z);
      // 朝向：移動時面向前進方向，否則面向戰場中央
      let dx = u.moveDir ? u.moveDir.dx : 0, dz = u.moveDir ? u.moveDir.dz : 0;
      if (Math.hypot(dx, dz) < 1e-4) { dx = -gp.x; dz = -gp.z; }
      const want = Math.atan2(dx, dz);
      f.facing += ((want - f.facing + Math.PI*3) % (Math.PI*2) - Math.PI) * 0.1; // 平滑轉向
      f.inst.rotation.y = f.facing;
      // 兵力 → 士兵數
      const s = u.cur ? u.cur.s : f.data.troops;
      f.inst.count = Math.max(0, Math.min(f.max, Math.round(s / f.strengthPer)));
    }
  };

  S.setFormationsVisible = function (v) { for (const f of _forms) f.inst.visible = v; };
})(window.SEKI);
