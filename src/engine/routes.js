/* =========================================================================
 * src/engine/routes.js — 大軍行軍路線（貼地緞帶 + 箭頭）
 *   仿電視節目風格：每支部隊的完整 track 路徑畫成貼地的寬緞帶，
 *   末端漸寬成箭頭指出前進方向。藍=東軍 紅=西軍。
 *   隨時間推進：已行進的路線較亮、未到的較淡。
 *   幾乎未移動的部隊（如南宮山毛利）不繪製。
 * ======================================================================= */
window.SEKI = window.SEKI || {};

(function (S) {
  const EAST = 0x3a78ff, WEST = 0xff3b3b;
  const LIFT = 1.0, HALF = 1.6;          // 緞帶離地高度 / 半寬
  let _routes = [];

  function terrainPt(lng, lat) {
    const p = S.engine.project(lng, lat, 0);
    const y = (S.terrain ? S.terrain.heightAt(p.x, p.z) : 0) + LIFT;
    return new THREE.Vector3(p.x, y, p.z);
  }

  // 由中心線點序列建貼地緞帶（含末端箭頭）
  function buildRibbon(pts, color) {
    const n = pts.length;
    const verts = [], idx = [];
    const up = new THREE.Vector3(0, 1, 0);
    const tan = new THREE.Vector3(), perp = new THREE.Vector3();

    // 主體：每點左右各推半寬
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(i - 1, 0)], b = pts[Math.min(i + 1, n - 1)];
      tan.subVectors(b, a); tan.y = 0; tan.normalize();
      perp.crossVectors(tan, up).normalize();
      const w = HALF * (i === n - 1 ? 0.4 : 1);    // 末點收窄，銜接箭頭
      const L = new THREE.Vector3().copy(pts[i]).addScaledVector(perp,  w);
      const R = new THREE.Vector3().copy(pts[i]).addScaledVector(perp, -w);
      verts.push(L.x, L.y, L.z, R.x, R.y, R.z);
    }
    for (let i = 0; i < n - 1; i++) {
      const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
      idx.push(a, c, b, b, c, d);
    }
    // 箭頭：在末端外推一個寬三角
    const tip = pts[n - 1], pa = pts[n - 2];
    tan.subVectors(tip, pa); tan.y = 0; tan.normalize();
    perp.crossVectors(tan, up).normalize();
    const baseI = verts.length / 3;
    const headLen = HALF * 3.2, headW = HALF * 2.4;
    const apex = new THREE.Vector3().copy(tip).addScaledVector(tan, headLen);
    const wingL = new THREE.Vector3().copy(tip).addScaledVector(perp,  headW);
    const wingR = new THREE.Vector3().copy(tip).addScaledVector(perp, -headW);
    verts.push(wingL.x, wingL.y, wingL.z, wingR.x, wingR.y, wingR.z, apex.x, apex.y, apex.z);
    idx.push(baseI, baseI + 2, baseI + 1);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geo.setIndex(idx); geo.computeVertexNormals();
    const mat = new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false });
    return new THREE.Mesh(geo, mat);
  }

  S.buildRoutes = function () {
    const eng = S.engine;
    _routes = [];
    for (const a of S.armies) {
      const tk = a.track;
      if (!tk || tk.length < 2) continue;

      const SUB = 8, pts = [];
      for (let i = 0; i < tk.length - 1; i++) {
        for (let s = 0; s < SUB; s++) {
          const k = s / SUB;
          pts.push(terrainPt(tk[i].lng + (tk[i+1].lng - tk[i].lng) * k,
                             tk[i].lat + (tk[i+1].lat - tk[i].lat) * k));
        }
      }
      const last = tk[tk.length - 1];
      pts.push(terrainPt(last.lng, last.lat));

      let len = 0; for (let i = 1; i < pts.length; i++) len += pts[i].distanceTo(pts[i-1]);
      if (len < 4) continue;                          // 按兵不動者不畫

      const color = a.side === 'east' ? EAST : WEST;
      const mesh = buildRibbon(pts, color);
      eng.scene.add(mesh);
      _routes.push({ mesh, data: a, tStart: tk[0].t, tEnd: last.t });
    }
    return _routes;
  };

  S.updateRoutes = function (t) {
    for (const r of _routes) {
      const started = t >= r.tStart - 0.01;
      r.mesh.material.opacity = started ? 0.6 : 0.16;
    }
  };

  S.setRoutesVisible = function (v) { for (const r of _routes) r.mesh.visible = v; };
})(window.SEKI);
