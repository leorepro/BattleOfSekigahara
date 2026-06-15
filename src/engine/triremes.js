/* =========================================================================
 * src/engine/triremes.js — 波斯艦隊（三列槳戰船 trireme）浮於馬利亞灣海面
 *   低面數合併幾何 + 頂點色，InstancedMesh 一次渲染整支艦隊；隨海浪輕微起伏。
 *   僅溫泉關使用：thermopylae-main.js 於 boot 呼叫 S.initTriremes()/每幀 updateTriremes(t)。
 *   向後相容：前三場不載入本檔。
 * ======================================================================= */
window.SEKI = window.SEKI || {};

(function (S) {
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(),
        _s = new THREE.Vector3(1, 1, 1), _e = new THREE.Euler();
  const C = { hull: 0x6e4a29, hullDk: 0x533618, wood: 0x7d5a30, bronze: 0xb6924e,
              sail: 0xcdbb95, sailBand: 0x6a3d9a, eye: 0xf2efe6, dark: 0x2a2018 };

  function box(w, h, d, x, y, z, color) { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z); return { geo: g, color }; }
  function merge(parts) {
    let vc = 0; parts.forEach(p => vc += p.geo.attributes.position.count);
    const pos = new Float32Array(vc * 3), nor = new Float32Array(vc * 3), colr = new Float32Array(vc * 3), idx = [];
    let vo = 0;
    for (const { geo, color } of parts) {
      pos.set(geo.attributes.position.array, vo * 3);
      nor.set(geo.attributes.normal.array, vo * 3);
      const col = new THREE.Color(color), n = geo.attributes.position.count;
      for (let k = 0; k < n; k++) { const o = (vo + k) * 3; colr[o] = col.r; colr[o + 1] = col.g; colr[o + 2] = col.b; }
      const gi = geo.index.array; for (let i = 0; i < gi.length; i++) idx.push(gi[i] + vo);
      vo += n;
    }
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    out.setAttribute('color', new THREE.BufferAttribute(colr, 3));
    out.setIndex(idx); return out;
  }

  // 船身沿 +X（船首），龍骨在 y≈0
  function triremeGeo() {
    return merge([
      box(6.0, 0.5, 1.0, 0, 0.25, 0, C.hull),          // 船腹
      box(5.4, 0.32, 1.16, 0, 0.6, 0, C.hullDk),        // 舷側
      box(1.1, 0.28, 0.5, 3.25, 0.18, 0, C.bronze),     // 青銅衝角 ram（船首水線）
      box(0.8, 0.9, 0.92, -2.8, 0.7, 0, C.wood),        // 船尾上翹
      box(0.5, 0.5, 0.64, -3.15, 1.25, 0, C.wood),      // 尾飾
      box(0.13, 2.5, 0.13, 0.2, 1.85, 0, C.wood),       // 桅
      box(0.1, 0.1, 2.4, 0.2, 2.9, 0, C.wood),          // 帆桁
      box(0.07, 1.6, 2.2, 0.22, 2.05, 0, C.sail),       // 帆
      box(0.075, 0.4, 2.2, 0.24, 2.6, 0, C.sailBand),   // 帆上紫帶（波斯）
      box(5.0, 0.08, 0.1, 0, 0.42, 0.64, C.dark),       // 槳排 L（示意）
      box(5.0, 0.08, 0.1, 0, 0.42, -0.64, C.dark),      // 槳排 R
      box(0.16, 0.3, 0.05, 2.65, 0.72, 0.5, C.eye),     // 船首眼 L
      box(0.16, 0.3, 0.05, 2.65, 0.72, -0.5, C.eye),    // 船首眼 R
    ]);
  }

  let mesh = null, ships = [], baseY = 0;

  S.initTriremes = function () {
    const cfg = (S.config && S.config.triremes) || {};
    const N = cfg.count != null ? cfg.count : 34;
    // 海面 y：以 seaLevel 經 terrain 取樣（古海岸夾平後的水面高度）
    baseY = S.terrain ? S.terrain.heightAt(0, 0) : 0;
    mesh = new THREE.InstancedMesh(triremeGeo(),
      new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.78, metalness: 0.06 }), N);
    mesh.frustumCulled = false; mesh.castShadow = true;
    // 灣內散佈（北面海域 lat 38.865~38.918、lng 22.40~22.72），錨泊朝南（向岸）
    for (let i = 0; i < N; i++) {
      const lng = 22.40 + (i % 9) * 0.038 + (Math.random() * 0.02 - 0.01);
      const lat = 38.868 + Math.floor(i / 9) * 0.016 + (Math.random() * 0.01 - 0.005);
      const p = S.engine.project(lng, lat, 0);
      const y = (S.terrain ? S.terrain.heightAt(p.x, p.z) : baseY);
      ships.push({ x: p.x, z: p.z, y, yaw: Math.PI * 0.5 + (Math.random() * 0.5 - 0.25),
        ph: Math.random() * Math.PI * 2, sc: 1.0 + (Math.random() * 0.25 - 0.1) });
    }
    writeAll(0);
    S.engine.scene.add(mesh);
  };

  function writeAll(elapsed) {
    if (!mesh) return;
    for (let i = 0; i < ships.length; i++) {
      const sh = ships[i];
      const bob = Math.sin(elapsed * 1.1 + sh.ph) * 0.18;             // 海浪起伏
      const roll = Math.sin(elapsed * 0.9 + sh.ph * 1.3) * 0.04;      // 輕微側傾
      _e.set(roll, sh.yaw, Math.sin(elapsed * 0.7 + sh.ph) * 0.02);
      _q.setFromEuler(_e);
      _s.set(sh.sc, sh.sc, sh.sc);
      _m.compose(_p.set(sh.x, sh.y + 0.2 + bob, sh.z), _q, _s);
      mesh.setMatrixAt(i, _m);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }

  S.updateTriremes = function (/* t */) {
    const elapsed = (S.engine && S.engine.clock) ? S.engine.clock.getElapsedTime() : 0;
    writeAll(elapsed);
  };
})(window.SEKI);
