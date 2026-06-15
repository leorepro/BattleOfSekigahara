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

  /* ---------- 外圍延伸地面（純視覺，海/陸大平面） ----------
   * 在 DEM 小片四周補一圈遠大平面，消除地形孤立浮空的突兀感。
   * 以世界座標 z 對應緯度判定海（北/外海）或陸（南/內陸）色，
   * 過渡帶設在灘頭一線（config.shorelineLat，預設 49.37）。
   * 整片置於 DEM 底面略下方，DEM 真實地形自然蓋於其上，只露出四周。
   * 完全不參與 project()/heightAt()，不影響任何單位/標籤對位。 */
  function addExtendedGround({ lngMin, lngMax, latMin, latMax, o, mPerDegLng, baseY }) {
    const eng = S.engine;
    const cfg = S.config || {};
    const seaColor  = new THREE.Color(cfg.seaColor  != null ? cfg.seaColor  : 0x21425e);
    const landColor = new THREE.Color(cfg.landColor != null ? cfg.landColor : 0x5d6a3a);
    const shoreLat  = cfg.shorelineLat != null ? cfg.shorelineLat : 49.37;

    // 平面尺寸：取 DEM 跨幅，再放大數倍向四周延伸
    const SIZE = (cfg.extendGroundSize != null ? cfg.extendGroundSize : 3600);
    const SEG = 48;
    // DEM 中心的世界座標（沿用與 project 相同的對應，僅用於擺放，不改公式）
    const cLng = (lngMin + lngMax) / 2, cLat = (latMin + latMax) / 2;
    const cx = (cLng - o.lng) * mPerDegLng * WS;
    const cz = -(cLat - o.lat) * M_PER_DEG_LAT * WS;
    // 灘頭一線的世界 z（海/陸過渡）與每單位 z 對應的緯度跨度
    const shoreZ = -(shoreLat - o.lat) * M_PER_DEG_LAT * WS;

    const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
    geo.rotateX(-Math.PI / 2);                       // 攤平於 XZ
    const p = geo.attributes.position;
    const col = new Float32Array(p.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const wz = cz + p.getZ(i);                     // 該頂點的世界 z
      // wz < shoreZ → 偏北（外海）；wz > shoreZ → 偏南（內陸）
      const t = Math.max(0, Math.min(1, (wz - shoreZ) / 26 + 0.5)); // 約 26 單位寬過渡
      c.copy(seaColor).lerp(landColor, t);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true, roughness: 0.96, metalness: 0 });
    const mesh = new THREE.Mesh(geo, mat);
    // 置於 DEM 底面略下方，避免與真實地形 z-fighting；DEM 自然蓋住中央
    mesh.position.set(cx, baseY - 0.8, cz);
    mesh.receiveShadow = true;
    mesh.renderOrder = -1;
    eng.scene.add(mesh);
    return mesh;
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

    // 古海岸線（溫泉關等）：config.ancientCoast.seaLevel 以下的低地夾平為古海面 + 海藍，
    // 重建「一邊大海、一邊陡崖」的窄道。未設則為 null → 維持原行為（前三場不受影響）。
    const ac = (S.config && S.config.ancientCoast) || null;
    const seaLv = ac ? (ac.seaLevel != null ? ac.seaLevel : 0) : null;
    const seaCol = new THREE.Color((S.config && S.config.seaColor != null) ? S.config.seaColor : 0x21405e);
    const clampSea = e => (seaLv != null && e < seaLv) ? seaLv : e;

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
        const eRaw = data[r * cols + c];
        const e = clampSea(eRaw);                       // 古海岸：低地夾平為海面
        const i = (r * cols + c) * 3, j = (r * cols + c) * 2;
        pos[i] = x; pos[i + 1] = sceneY(e); pos[i + 2] = z;
        const cc = (seaLv != null && eRaw < seaLv) ? seaCol : colorByElev(e);
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

    // 外圍延伸面：在 DEM 小片四周補一圈大平面（海/陸），消除孤立浮空感。
    // 預設於現代戰役（config.modern，即諾曼第）自動啟用；可由 config.extendGround
    // 顯式覆寫（true/false）。關原/桶狹間無 modern 旗標，故不受影響。
    // 不改 project()，純視覺；延伸面遠在 DEM 外、且略低，不擾動單位對位。
    const wantGround = ('extendGround' in (S.config || {}))
      ? S.config.extendGround : !!(S.config && S.config.modern);
    if (wantGround) {
      addExtendedGround({
        lngMin, lngMax, latMin, latMax, o, mPerDegLng, baseY: sceneY(0),
      });
    }

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
      return sceneY(seaLv != null && h < seaLv ? seaLv : h);   // 古海岸夾平
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
