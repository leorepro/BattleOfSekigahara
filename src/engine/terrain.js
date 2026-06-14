/* =========================================================================
 * src/engine/terrain.js — 地形網格
 *   優先使用 SEKI.heightmap（真實 SRTM 30m DEM）建構地形與著色；
 *   若無 heightmap 則退回程序化高斯山頭（fallback）。
 *   heightAt(sx,sz) 供部隊/標籤貼地，回傳場景 y（含垂直誇張）。
 * ======================================================================= */
window.SEKI = window.SEKI || {};

(function (S) {
  const M_PER_DEG_LAT = 111320;
  const WS = 1 / 60;          // 必須與 scene.js WORLD_SCALE 一致
  // 垂直誇張：可由 SEKI.config.exag 覆寫（桶狹間丘陵低矮，需更大誇張）
  function exag() { return (S.config && S.config.exag) || 2.4; }

  // 依真實海拔(公尺)著色；色階可由 SEKI.config.elevStops 覆寫（如低海拔海岸線）
  function colorByElev(e) {
    const stops = (S.config && S.config.elevStops) || [
      [120, 0x586a39], [180, 0x6f7440], [260, 0x7d6e49],
      [360, 0x8a7559], [520, 0x94836b], [900, 0xa99f8c],
    ];
    if (e <= stops[0][0]) return new THREE.Color(stops[0][1]);
    for (let i = 0; i < stops.length - 1; i++) {
      const [e0, c0] = stops[i], [e1, c1] = stops[i + 1];
      if (e <= e1) {
        const k = (e - e0) / (e1 - e0);
        return new THREE.Color(c0).lerp(new THREE.Color(c1), k);
      }
    }
    return new THREE.Color(stops[stops.length - 1][1]);
  }

  /* ---------- 真實 DEM 版 ---------- */
  function buildFromDEM(hm) {
    const eng = S.engine;
    const { lngMin, lngMax, latMin, latMax, cols, rows, data } = hm;
    const o = S.geography.origin;
    const mPerDegLng = M_PER_DEG_LAT * Math.cos(o.lat * Math.PI / 180);
    const base = Math.min.apply(null, data);

    const EXAG = exag();
    const sceneY = e => (e - base) * WS * EXAG;

    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(cols * rows * 3);
    const col = new Float32Array(cols * rows * 3);
    const uv  = new Float32Array(cols * rows * 2);

    for (let r = 0; r < rows; r++) {
      const lat = latMin + (latMax - latMin) * r / (rows - 1);
      const z = -(lat - o.lat) * M_PER_DEG_LAT * WS;
      for (let c = 0; c < cols; c++) {
        const lng = lngMin + (lngMax - lngMin) * c / (cols - 1);
        const x = (lng - o.lng) * mPerDegLng * WS;
        const e = data[r * cols + c];
        const i = (r * cols + c) * 3, j = (r * cols + c) * 2;
        pos[i] = x; pos[i + 1] = sceneY(e); pos[i + 2] = z;
        const cc = colorByElev(e);
        col[i] = cc.r; col[i + 1] = cc.g; col[i + 2] = cc.b;
        uv[j] = c / (cols - 1);            // 西→東
        uv[j + 1] = r / (rows - 1);        // 南→北（配合 texture flipY 預設）
      }
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));

    // 索引
    const idx = [];
    for (let r = 0; r < rows - 1; r++) {
      for (let c = 0; c < cols - 1; c++) {
        const a = r * cols + c, b = a + 1, d = a + cols, e2 = d + 1;
        idx.push(a, b, d, b, e2, d);   // CCW，法線朝上
      }
    }
    geo.setIndex(idx);
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true, roughness: 0.97, metalness: 0, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    eng.scene.add(mesh);

    // 貼真實衛星影像（成功後關閉頂點著色，純用衛星紋理）
    // 貼圖路徑可由 SEKI.config.satelliteTexture 覆寫；設為 null/'' 則純用海拔著色
    const texPath = (S.config && 'satelliteTexture' in S.config)
      ? S.config.satelliteTexture : 'assets/terrain/satellite.jpg';
    if (texPath) new THREE.TextureLoader().load(texPath, tex => {
      tex.encoding = THREE.sRGBEncoding;
      tex.anisotropy = 8;
      mat.map = tex; mat.vertexColors = false; mat.color.set(0xffffff);
      mat.needsUpdate = true;
    });

    // 雙線性取樣高度
    function heightAt(sx, sz) {
      const lng = o.lng + sx / (mPerDegLng * WS);
      const lat = o.lat - sz / (M_PER_DEG_LAT * WS);
      const fc = (lng - lngMin) / (lngMax - lngMin) * (cols - 1);
      const fr = (lat - latMin) / (latMax - latMin) * (rows - 1);
      if (fc < 0 || fc > cols - 1 || fr < 0 || fr > rows - 1) return 0;
      const c0 = Math.floor(fc), r0 = Math.floor(fr);
      const c1 = Math.min(c0 + 1, cols - 1), r1 = Math.min(r0 + 1, rows - 1);
      const tx = fc - c0, tz = fr - r0;
      const h00 = data[r0 * cols + c0], h10 = data[r0 * cols + c1];
      const h01 = data[r1 * cols + c0], h11 = data[r1 * cols + c1];
      const h = (h00 * (1 - tx) + h10 * tx) * (1 - tz) + (h01 * (1 - tx) + h11 * tx) * tz;
      return sceneY(h);
    }
    return { mesh, heightAt, source: 'dem' };
  }

  /* ---------- 程序化 fallback ---------- */
  function buildProcedural() {
    const eng = S.engine, SIZE = 320, SEG = 200;
    const peaks = S.geography.features
      .filter(f => f.type === 'hill' || f.type === 'mountain')
      .map(f => { const p = eng.project(f.lng, f.lat, f.h);
        return { x: p.x, z: p.z, y: p.y * 1.6 + 6, radius: f.type === 'mountain' ? 34 : 24 }; });
    const bump = (sx, sz) => { let h = 0;
      for (const pk of peaks) { const dx = sx - pk.x, dz = sz - pk.z;
        h += pk.y * Math.exp(-(dx*dx+dz*dz) / (2*pk.radius*pk.radius)); } return h; };
    const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG); geo.rotateX(-Math.PI/2);
    const p = geo.attributes.position, colors = []; let maxH = 1;
    const hs = new Float32Array(p.count);
    for (let i=0;i<p.count;i++){ const h=bump(p.getX(i),p.getZ(i)); hs[i]=h; if(h>maxH)maxH=h; }
    for (let i=0;i<p.count;i++){ p.setY(i,hs[i]); const c=colorByElev(120+hs[i]/maxH*300); colors.push(c.r,c.g,c.b); }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors,3)); geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors:true, roughness:0.95 }));
    mesh.receiveShadow = true; eng.scene.add(mesh);
    return { mesh, heightAt: bump, source: 'procedural' };
  }

  S.buildTerrain = function () {
    S.terrain = (S.heightmap && S.heightmap.data) ? buildFromDEM(S.heightmap) : buildProcedural();
    return S.terrain;
  };
})(window.SEKI);
