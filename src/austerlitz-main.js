/* =========================================================================
 * src/austerlitz-main.js — 奧斯特利茨之戰（1805）啟動點 + 戰役設定 + 主迴圈
 *   沿用共用引擎（src/engine/*），以 SEKI.config 覆寫戰役專屬參數。
 *   時間映射：會戰日鐘點 = 6 + t（t=0→06:00 拂曉濃霧；t=3→09:00「奧斯特利茨的太陽」
 *     破雲＋中央突破；t=8→14:00 切斷聯軍；t<0＝11/21–12/1 部署誘敵序幕，壓縮）。
 *   敘事主線：A 拿破崙的陷阱（設餌→咬餌→突破→斬腰→冰湖）。
 * ======================================================================= */
(function (S) {
  /* ---------- 戰役專屬設定（須在 boot/buildTerrain 之前就緒） ---------- */
  S.config = {
    // 會戰日鐘點 = 6 + t；t<0 為部署序幕
    fmtTime(t) {
      if (t < 0) return '會戰前 · 部署誘敵（11/21–12/1）';
      const hour = 6 + t;
      const h = Math.floor(hour), m = Math.round((hour - h) * 60);
      const seg = h < 8 ? '拂曉' : h < 11 ? '上午' : h < 14 ? '正午' : h < 17 ? '午後' : '入夜';
      return `12月2日 · ${seg} ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    },
    // 色彩通道：法軍=east=藍系(勝方藍慣例，沿用引擎 east=0x1c46d2)；聯軍=west=紅系 accent(軍服另以 factionColor 俄綠/奧白)
    sideName:  { east: '法蘭西帝國', west: '俄奧聯軍' },
    sideShort: { east: '法軍', west: '聯軍' },
    kindIcons: { command:'帥', infantry:'步', cavalry:'騎', artillery:'砲' },
    kindArms: {
      command:    ['主帥 · 本陣', '元帥與直屬精銳'],
      infantry:   ['線列步兵', '燧發槍排槍齊射；行軍縱隊↔展開橫隊↔抗騎空心方陣'],
      cavalry:    ['騎兵', '胸甲騎兵/驃騎兵 · 成隊衝鋒撞擊敵線、追擊潰兵'],
      artillery:  ['野戰砲兵', '成排火砲齊射、砲煙；普拉欽高地火砲砲擊冰湖'],
    },
    // 逐部隊配色（史實軍服：法軍藍家族 / 俄軍綠 / 奧軍白）。armies 各單位帶 factionColor。
    factionColors: {
      french_guard:0x1c2f6e, french_line:0x2a4a9a, french_cav:0x3a5ab0, french_arty:0x24407a,
      french_grenadier:0x223a82,
      russian_guard:0x2c5436, russian_line:0x3a6a44, russian_cav:0x46784e,
      austrian_line:0xcdd2da, austrian_cav:0xb9c0cc,
    },
    // 拿破崙時代陣型：步/騎/砲分兵種幾何（formation.js 走 napoleonic 分支）
    formationStyle: 'napoleonic',
    // 大地圖誇張係數（待真實 DEM 後微調）
    exag: 2.0,
    // ★戰場放大 2 倍呈現：worldScale 1/30（預設 1/60）。僅影響本戰役（config 驅動），
    //   連動：霧距/maxDistance/火線間距 ×2、weather.js 霧近遠 ×2、雪/冰裝飾 ×2、storyboard 相機 dist ×~2。
    worldScale: 1 / 30,
    // ★相機整體拉近呈現(放大畫面、部隊與地形一起變大)：<1 = 拉近。0.33≈放大 3 倍。可即時微調。
    camDistScale: 0.33,
    // 冬季天色（霧白偏灰）
    skyColor: 0xc8ccce, fogColor: 0xcdd2d4,
    fogNear: 400, fogFar: 3200, maxDistance: 3600,
    // 扎錢湖冰面：湖盆標高閾值以下著冰色（terrain.js 讀 seaColor/elevStops，Phase 1 Task 1.4 精修）
    frozenPond: { seaLevel: 200 },
    seaColor: 0xcfe0e6,
    // 冬季雪地色階：低地枯草灰綠 → 緩坡 → 雪線白
    elevStops: [
      [205, 0xcfe0e6], [230, 0x9aa48c], [280, 0x8e9a82], [340, 0xa8a890],
      [420, 0xb8b6a4], [520, 0xcfcdc2],
    ],
    satelliteTexture: 'assets/terrain/austerlitz-sat.jpg?v=3x',
    // 有界公轉：每段只掃固定小角度
    boundedOrbit: true, orbitSpan: 32,
    // 敵對雙方火線間距：線列步兵/砲兵隔開互轟、不互相穿插覆蓋（衝鋒/突破/潰逃者貼身接戰除外）
    //   隨 worldScale 1/30 放大 ×2（原 20）
    standoff: 40,
    // 時間軸節點用運鏡章節(46 鏡電影分鏡,每點都會切換鏡頭呈現)而非零散事件(避免大量無鏡頭的點)
    timelineMarkers: 'storyboard',
  };

  // ★時間軸節點均勻分散：46 鏡中多數擠在 t≤7（原非線性軸把 t≤7 壓進左 25%→節點黏成一團難點擊）。
  //   改用「依分鏡索引等距」的 anchors（每鏡 t → 等距位置 i/(n-1)），讓節點等距排開、
  //   且播放頭(timeToPos)與節點(buildMarkers 同用 timeToPos)始終對齊。t 嚴格遞增→映射單調合法。
  if (S.storyboard && S.storyboard.length > 1) {
    const n = S.storyboard.length;
    S.config.timelineAnchors = S.storyboard.map((s, i) => [s.t, i / (n - 1)]);
  }

  S.player = { time: -8, playing: true, speed: 0.35, program: true, T_START: -8, T_END: 12 };

  function phase(t) {
    if (t < -5)   return '部署 · 雙方向奧斯特利茨集結';
    if (t < -1)   return '設餌 · 法軍讓出普拉欽高地誘敵';
    if (t < 0)    return '對峙 · 聯軍定主攻南線';
    if (t < 2)    return '★ 拂曉 · 南線塔爾尼茲激戰';
    if (t < 3)    return '咬餌 · 聯軍主力南調、中央空虛';
    if (t < 5)    return '★ 中央突破 · 蘇爾特衝上普拉欽';
    if (t < 7)    return '斬腰 · 近衛軍反攻被擊退';
    if (t < 9)    return '★ 切斷 · 聯軍被切成兩半';
    if (t < 11)   return '★ 冰湖潰敗 · 砲擊扎錢湖';
    return '終局 · 普雷斯堡和約 · 同盟瓦解';
  }

  /* ---------- 飄雪粒子（午後 4:30 天降小雪，沿用 rain 粒子改白色雪片低速） ---------- */
  let snow = null;
  function initSnow() {
    const N = 1600, SPAN = 330, TOP = 180;   // 隨 worldScale ×2 放大覆蓋範圍
    const pos = new Float32Array(N * 3);
    const flakes = [];
    for (let i = 0; i < N; i++)
      flakes.push({ x: (Math.random()*2-1)*SPAN, y: Math.random()*TOP, z: (Math.random()*2-1)*SPAN,
        ph: Math.random()*6.28 });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color: 0xeef2f6, size: 1.7, transparent: true, opacity: 0, depthWrite: false });
    const mesh = new THREE.Points(geo, mat);
    mesh.frustumCulled = false;
    S.engine.scene.add(mesh);
    snow = { mesh, mat, geo, pos, flakes, N, SPAN, TOP };
  }
  function snowAmount(t) { return t > 9 ? Math.min(1, (t - 9) / 1.5) : 0; }  // 午後漸起
  function updateSnow(t, dt) {
    if (!snow) return;
    const amt = snowAmount(t);
    snow.mat.opacity = amt * 0.75;
    snow.mesh.visible = amt > 0.01;
    if (!snow.mesh.visible) return;
    const tgt = S.engine.controls.target, cx = tgt.x, cz = tgt.z;
    const fall = 26 * dt, p = snow.pos, { flakes, N, SPAN, TOP } = snow;
    for (let i = 0; i < N; i++) {
      const f = flakes[i];
      f.y -= fall; f.ph += dt;
      f.x += Math.sin(f.ph) * 0.18;                        // 雪花飄盪
      if (f.y < 0) { f.y = TOP; f.x = (Math.random()*2-1)*SPAN; f.z = (Math.random()*2-1)*SPAN; }
      const j = i * 3;
      p[j] = cx + f.x; p[j+1] = f.y; p[j+2] = cz + f.z;
    }
    snow.geo.attributes.position.needsUpdate = true;
  }

  /* ---------- 扎錢湖冰面 + 冰湖砲擊 finale ---------- */
  //   史實名場面：南線聯軍潰逃越扎錢湖冰面，高地火砲轟冰、冰裂。沿用「破除迷思」史觀
  //   （UI sources caveat 並陳：拿破崙宣稱數千溺斃 vs 史學家考證僅撈 2-3 具）。
  let ice = null;
  const POND = { lng: 16.780, lat: 49.073 };   // 扎錢湖南緣
  function initIce() {
    if (!S.engine || !S.engine.project) return;
    const c = S.engine.project(POND.lng, POND.lat, 0);
    const cy = (S.terrain ? S.terrain.heightAt(c.x, c.z) : 0);
    const y = cy + 0.5;                       // 湖面水位(略高於窪底);岸邊由地形自然遮擋成有機湖岸
    // 自然不規則湖形(非方塊!)：橢圓基底 + 多頻半徑雜訊生成有機外輪廓,水平湖面。
    const RX = 48, RZ = 31, SEG = 56;
    const shape = new THREE.Shape();
    for (let i = 0; i <= SEG; i++) {
      const a = i / SEG * Math.PI * 2;
      const nz = 1 + 0.20 * Math.sin(a * 3 + 0.6) + 0.13 * Math.sin(a * 5 + 1.7)
                   + 0.07 * Math.sin(a * 8 + 0.3) - 0.05 * Math.cos(a * 2 + 2.1);
      const px = Math.cos(a) * RX * nz, pz = Math.sin(a) * RZ * nz;
      if (i === 0) shape.moveTo(px, pz); else shape.lineTo(px, pz);
    }
    const geo = new THREE.ShapeGeometry(shape);
    geo.rotateX(-Math.PI / 2);                // XY → XZ 水平湖面
    geo.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({ color: 0xbcd2dc, roughness: 0.18, metalness: 0.25,
      transparent: true, opacity: 0.5, depthWrite: false });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(c.x, y, c.z);
    mesh.renderOrder = 1;
    S.engine.scene.add(mesh);
    // 裂紋線段（初始隱藏，砲擊時漸顯）
    const cgeo = new THREE.BufferGeometry();
    const segs = 9, pts = [];
    for (let i = 0; i < segs; i++) {
      const a0 = Math.random() * 6.28, len = 12 + Math.random() * 24;
      const x0 = (Math.random() * 2 - 1) * 36, z0 = (Math.random() * 2 - 1) * 22;
      pts.push(x0, 0.06, z0, x0 + Math.cos(a0) * len, 0.06, z0 + Math.sin(a0) * len);
    }
    cgeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts), 3));
    const cmat = new THREE.LineBasicMaterial({ color: 0x4a6b78, transparent: true, opacity: 0 });
    const cracks = new THREE.LineSegments(cgeo, cmat);
    cracks.position.copy(mesh.position);
    cracks.scale.set(0.35, 1, 0.35);          // 由小漸長(updateIce 撐大→裂紋向外擴散)
    S.engine.scene.add(cracks);
    // 破冰孔洞池：砲擊命中處浮現暗色「open water」圓孔並漸長，讓冰湖真的「破開」見水
    const HOLE_N = 16, holes = [];
    const holeGeo = new THREE.CircleGeometry(1, 16); holeGeo.rotateX(-Math.PI / 2);
    for (let i = 0; i < HOLE_N; i++) {
      const hm = new THREE.Mesh(holeGeo,
        new THREE.MeshStandardMaterial({ color: 0x07101a, roughness: 0.35, metalness: 0.35,
          transparent: true, opacity: 0, depthWrite: false }));
      hm.visible = false; hm.renderOrder = 2; hm.rotation.y = Math.random() * 6.28;
      S.engine.scene.add(hm);
      holes.push({ mesh: hm, age: -1, rMax: 1 });
    }
    ice = { mesh, mat, cracks, cmat, c, y, acc: 0, holes, holeIdx: 0, baseOpacity: 0.5 };
  }
  function updateIce(t, dt) {
    if (!ice) return;
    // finale：t∈[8,11.5] 高地火砲轟冰面 → 砲擊 FX + 裂紋擴散 + 破冰孔洞浮現 + 冰面漸沉變透
    const active = t >= 8 && t <= 11.5;
    const k = active ? Math.min(1, (t - 8) / 1.5) : (t > 11.5 ? 1 : 0);
    // 倒帶/循環回到 finale 之前 → 復原冰面、清空孔洞，避免重播時殘留破冰
    if (!active && t < 8) {
      if (ice._broken) {
        for (const h of ice.holes) { h.age = -1; h.mesh.visible = false; h.mesh.material.opacity = 0; }
        ice.mesh.position.y = ice.y; ice.mat.opacity = ice.baseOpacity;
        ice.cracks.scale.set(0.35, 1, 0.35); ice.cmat.opacity = 0; ice._broken = false;
      }
      return;
    }
    ice._broken = true;
    // 裂紋:漸顯 + 由 0.35 撐大到 1.0(向外擴散)
    ice.cmat.opacity = 0.6 * k;
    const cs = 0.35 + 0.65 * k; ice.cracks.scale.set(cs, 1, cs);
    // 冰面:破裂後略沉、更透(露出底下暗水)
    ice.mat.opacity = ice.baseOpacity * (1 - 0.4 * k);
    ice.mesh.position.y = ice.y - 0.6 * k;
    // 破冰孔洞:已啟用者持續長大、加深
    for (const h of ice.holes) {
      if (h.age < 0) continue;
      h.age += dt;
      const r = h.rMax * Math.min(1, h.age / 1.4);
      h.mesh.scale.set(r, 1, r);
      h.mesh.material.opacity = Math.min(0.92, h.age * 1.1);
    }
    if (active) {
      ice.acc += dt;
      if (ice.acc >= 0.45) {
        ice.acc = 0;
        const ox = (Math.random() * 2 - 1) * 40, oz = (Math.random() * 2 - 1) * 26;
        if (S.cannonadePond) S.cannonadePond(ice.c.x + ox, ice.y, ice.c.z + oz);
        // 命中處浮現破冰孔(輪替孔洞池),從無到有長成 open water
        const h = ice.holes[ice.holeIdx]; ice.holeIdx = (ice.holeIdx + 1) % ice.holes.length;
        const hy = ice.y + 0.06;             // 緊貼冰面(破冰見水)
        h.mesh.position.set(ice.c.x + ox, hy, ice.c.z + oz);
        h.mesh.visible = true; h.age = 0; h.rMax = 4 + Math.random() * 6;
      }
    }
  }

  /* ---------- 啟動 ---------- */
  function boot() {
    const eng = S.engine.init();
    S.buildTerrain();
    S.buildGeoLabels();
    S.buildUnits();
    S.buildFormations();
    S.buildRoutes();
    S.initEffects();
    S.buildEngagements();
    if (S.initManeuver) S.initManeuver();   // 移動 state→formMode
    if (S.initMelee) S.initMelee();         // 騎兵衝擊/混戰倒地
    if (S.initVolley) S.initVolley();       // 排槍/砲兵齊射 FX
    S.initWeather();
    initSnow();
    initIce();
    S.initUI();
    S.setProgramMode(true);

    const clockEl = document.getElementById('clock');
    const phaseEl = document.getElementById('phase');
    const titlecard = document.getElementById('titlecard');

    const loading = document.getElementById('loading');
    if (loading) { loading.style.opacity = '0'; setTimeout(() => loading.remove(), 800); }
    if (titlecard) setTimeout(() => { titlecard.style.opacity = '0'; }, 3800);

    function animate() {
      requestAnimationFrame(animate);
      const dt = Math.min(eng.clock.getDelta(), 0.1);
      const elapsed = eng.clock.elapsedTime;

      if (S.player.program) {
        S.updateStoryboard(dt);
      } else if (S.player.playing) {
        S.player.time += dt * S.player.speed;
        if (S.player.time > S.player.T_END) S.player.time = S.player.T_START;
      }
      const t = S.player.time;

      S.updateUnits(t);
      if (S.updateManeuver) S.updateManeuver(t);   // 在 updateUnits 後、updateFormations 前
      S.updateFormations(t);
      S.updateRoutes(t);
      S.waveFlags(elapsed);
      S.updateWeather(t, elapsed);
      updateSnow(t, dt);
      // 子彈時間：storyboard 把慢動作係數寫到 S.player.cinemaScale，乘入動畫/特效的 dt
      const cdt = dt * ((S.player.cinemaScale != null) ? S.player.cinemaScale : 1);
      if (S.tickAnim) S.tickAnim(cdt);   // 單兵肢體動畫時間(乘子彈時間)
      updateIce(t, cdt);
      S.updateEffects(t, cdt);
      S.updateEngagements(t, cdt);
      if (S.updateMelee) S.updateMelee(t, cdt);
      if (S.updateVolley) S.updateVolley(t, cdt);
      S.updateEvents(t);
      S.updateUI(t);

      clockEl.textContent = S.fmtTime ? S.fmtTime(t) : '';
      phaseEl.textContent = phase(t);

      eng.render();
    }
    animate();
  }

  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', boot);
  else boot();
})(window.SEKI);
