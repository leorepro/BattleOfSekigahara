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
    // 冬季天色（霧白偏灰）
    skyColor: 0xc8ccce, fogColor: 0xcdd2d4,
    fogNear: 200, fogFar: 1600, maxDistance: 1800,
    // 扎錢湖冰面：湖盆標高閾值以下著冰色（terrain.js 讀 seaColor/elevStops，Phase 1 Task 1.4 精修）
    frozenPond: { seaLevel: 200 },
    seaColor: 0xcfe0e6,
    // 冬季雪地色階：低地枯草灰綠 → 緩坡 → 雪線白
    elevStops: [
      [205, 0xcfe0e6], [230, 0x9aa48c], [280, 0x8e9a82], [340, 0xa8a890],
      [420, 0xb8b6a4], [520, 0xcfcdc2],
    ],
    satelliteTexture: 'assets/terrain/austerlitz-sat.jpg',
    // 有界公轉：每段只掃固定小角度
    boundedOrbit: true, orbitSpan: 32,
  };

  S.player = { time: -8, playing: true, speed: 0.35, program: true, T_START: -8, T_END: 12 };

  function phase(t) {
    if (t < -5)   return '部署 · 法軍自維也納方向西側集結 · 聯軍自奧洛穆茨東來';
    if (t < -1)   return '設餌 · 拿破崙主動放棄普拉欽高地、示弱右翼，誘聯軍南下';
    if (t < 0)    return '對峙 · 聯軍亞歷山大一世否決庫圖佐夫持重之議，定主攻南線';
    if (t < 2)    return '★ 第一日拂曉 · 濃霧中南線塔爾尼茲/索科爾尼茲爆發激戰';
    if (t < 3)    return '咬餌 · 聯軍四個縱隊主力南調，中央普拉欽高地兵力空虛';
    if (t < 5)    return '★ 09:00 太陽破雲 · 蘇爾特軍衝上普拉欽高地，中央突破';
    if (t < 7)    return '斬腰 · 法軍控制高地、俄國近衛軍孤注一擲反攻被擊退';
    if (t < 9)    return '★ 切斷 · 聖海拉爾師南下抄截，聯軍被切成兩半';
    if (t < 11)   return '★ 冰湖潰敗 · 南線聯軍奔向扎錢湖，高地火砲轟冰面';
    return '終局 · 普雷斯堡和約 · 第三次反法同盟瓦解 · 神聖羅馬帝國次年解體';
  }

  /* ---------- 飄雪粒子（午後 4:30 天降小雪，沿用 rain 粒子改白色雪片低速） ---------- */
  let snow = null;
  function initSnow() {
    const N = 1200, SPAN = 175, TOP = 95;
    const pos = new Float32Array(N * 3);
    const flakes = [];
    for (let i = 0; i < N; i++)
      flakes.push({ x: (Math.random()*2-1)*SPAN, y: Math.random()*TOP, z: (Math.random()*2-1)*SPAN,
        ph: Math.random()*6.28 });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color: 0xeef2f6, size: 1.1, transparent: true, opacity: 0, depthWrite: false });
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
    const fall = 14 * dt, p = snow.pos, { flakes, N, SPAN, TOP } = snow;
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
    const y = (S.terrain ? S.terrain.heightAt(c.x, c.z) : 0) + 0.25;
    // 冰面（淺青白、半透、微反光）
    const geo = new THREE.PlaneGeometry(46, 30, 1, 1);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshStandardMaterial({ color: 0xcfe0e6, roughness: 0.25, metalness: 0.1,
      transparent: true, opacity: 0.72 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(c.x, y, c.z);
    mesh.receiveShadow = true;
    S.engine.scene.add(mesh);
    // 裂紋線段（初始隱藏，砲擊時漸顯）
    const cgeo = new THREE.BufferGeometry();
    const segs = 9, pts = [];
    for (let i = 0; i < segs; i++) {
      const a0 = Math.random() * 6.28, len = 6 + Math.random() * 12;
      const x0 = (Math.random() * 2 - 1) * 18, z0 = (Math.random() * 2 - 1) * 11;
      pts.push(x0, 0.03, z0, x0 + Math.cos(a0) * len, 0.03, z0 + Math.sin(a0) * len);
    }
    cgeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts), 3));
    const cmat = new THREE.LineBasicMaterial({ color: 0x4a6b78, transparent: true, opacity: 0 });
    const cracks = new THREE.LineSegments(cgeo, cmat);
    cracks.position.copy(mesh.position);
    S.engine.scene.add(cracks);
    ice = { mesh, mat, cracks, cmat, c, y, acc: 0 };
  }
  function updateIce(t, dt) {
    if (!ice) return;
    // finale：t∈[8,11.5] 高地火砲轟冰面 → 砲擊 FX + 裂紋漸顯
    const active = t >= 8 && t <= 11.5;
    const k = active ? Math.min(1, (t - 8) / 1.5) : (t > 11.5 ? 1 : 0);
    ice.cmat.opacity = 0.55 * k;
    if (active && S.cannonadePond) {
      ice.acc += dt;
      if (ice.acc >= 0.5) {
        ice.acc = 0;
        const ox = (Math.random() * 2 - 1) * 20, oz = (Math.random() * 2 - 1) * 13;
        S.cannonadePond(ice.c.x + ox, ice.y, ice.c.z + oz);
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
