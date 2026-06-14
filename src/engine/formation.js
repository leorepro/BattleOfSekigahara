/* =========================================================================
 * src/engine/formation.js — 兵團陣型（Total War / 幕府將軍 風）
 *   每支部隊以 InstancedMesh 渲染數十~上百名士兵排成方陣，
 *   每名士兵背插 sashimono（背旗，亮色陣營旗）——整個方陣成「一片色旗」。
 *   陣型朝敵/前進方向、隨部隊移動；兵力下降士兵數隨之減少（mesh.count）。
 * ======================================================================= */
window.SEKI = window.SEKI || {};

(function (S) {
  const ARMOR_E = 0x2e3a5e, ARMOR_W = 0x5e2e2e;   // 軍裝暗色
  const FLAG_E = 0x3a78ff,  FLAG_W = 0xff3b3b;     // 背旗亮色（陣營）
  const SP = 0.9, BODY_H = 1.5;
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(),
        _p = new THREE.Vector3(), _s = new THREE.Vector3(1, 1, 1), _up = new THREE.Vector3(0, 1, 0);
  let _forms = [];

  // 合併多個 box geometry 成一個 BufferGeometry
  function mergeBoxes(boxes) {
    let vc = 0; boxes.forEach(g => vc += g.attributes.position.count);
    const pos = new Float32Array(vc*3), nor = new Float32Array(vc*3), idx = [];
    let vo = 0;
    boxes.forEach(g => {
      pos.set(g.attributes.position.array, vo*3);
      nor.set(g.attributes.normal.array, vo*3);
      const gi = g.index.array; for (let i=0;i<gi.length;i++) idx.push(gi[i]+vo);
      vo += g.attributes.position.count;
    });
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    out.setIndex(idx); return out;
  }
  function soldierGeo() {
    const body = new THREE.BoxGeometry(0.42, BODY_H, 0.36); body.translate(0, BODY_H/2, 0);
    const head = new THREE.BoxGeometry(0.3, 0.3, 0.3); head.translate(0, BODY_H + 0.15, 0);
    return mergeBoxes([body, head]);
  }
  function sashimonoGeo() {
    const pole = new THREE.BoxGeometry(0.05, 1.1, 0.05); pole.translate(0, BODY_H + 0.2, -0.22);
    const flag = new THREE.BoxGeometry(0.44, 0.56, 0.04); flag.translate(0, BODY_H + 0.55, -0.22);
    return mergeBoxes([pole, flag]);
  }

  function maxSoldiersFor(troops) { return Math.max(20, Math.min(200, Math.round(troops/90))); }

  S.buildFormations = function () {
    const eng = S.engine;
    _forms = [];
    const sGeo = soldierGeo(), fGeo = sashimonoGeo();
    for (const a of S.armies) {
      const east = a.side === 'east';
      const max = maxSoldiersFor(a.troops);
      const cols = Math.max(5, Math.round(Math.sqrt(max * 1.8)));
      const rows = Math.ceil(max / cols);
      const body = new THREE.InstancedMesh(sGeo,
        new THREE.MeshStandardMaterial({ color: east?ARMOR_E:ARMOR_W, roughness: 0.85 }), max);
      const sashi = new THREE.InstancedMesh(fGeo,
        new THREE.MeshStandardMaterial({ color: east?FLAG_E:FLAG_W, roughness: 0.6,
          emissive: east?FLAG_E:FLAG_W, emissiveIntensity: 0.22 }), max);
      body.castShadow = true; body.frustumCulled = false; sashi.frustumCulled = false;
      for (let i = 0; i < max; i++) {
        const c = i % cols, r = Math.floor(i / cols);
        const x = (c - (cols-1)/2) * SP + Math.sin(i*12.9)*0.16;
        const z = (r - (rows-1)/2) * SP + Math.cos(i*7.7)*0.16;
        _m.compose(_p.set(x, 0, z), _q.setFromAxisAngle(_up, Math.sin(i*4.1)*0.22), _s);
        body.setMatrixAt(i, _m); sashi.setMatrixAt(i, _m);
      }
      body.instanceMatrix.needsUpdate = true; sashi.instanceMatrix.needsUpdate = true;
      eng.scene.add(body); eng.scene.add(sashi);
      _forms.push({ data: a, body, sashi, max, facing: 0, strengthPer: a.troops / max });
    }
    return _forms;
  };

  S.updateFormations = function (t) {
    for (const f of _forms) {
      const u = S.unitById(f.data.id); if (!u) continue;
      const gp = u.group.position;
      let dx = u.moveDir ? u.moveDir.dx : 0, dz = u.moveDir ? u.moveDir.dz : 0;
      if (Math.hypot(dx, dz) < 1e-4) { dx = -gp.x; dz = -gp.z; }
      const want = Math.atan2(dx, dz);
      f.facing += ((want - f.facing + Math.PI*3) % (Math.PI*2) - Math.PI) * 0.1;
      const s = u.cur ? u.cur.s : f.data.troops;
      const n = Math.max(0, Math.min(f.max, Math.round(s / f.strengthPer)));
      for (const mesh of [f.body, f.sashi]) {
        mesh.position.set(gp.x, gp.y, gp.z);
        mesh.rotation.y = f.facing;
        mesh.count = n;
      }
    }
  };

  S.setFormationsVisible = function (v) { for (const f of _forms) { f.body.visible = v; f.sashi.visible = v; } };
})(window.SEKI);
