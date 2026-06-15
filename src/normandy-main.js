/* =========================================================================
 * src/normandy-main.js — 諾曼第登陸·奧馬哈海灘 啟動點 + 戰役設定 + 主迴圈
 *   沿用關原引擎（src/engine/*），以 SEKI.config 覆寫戰役專屬參數：
 *     現代戰役（modern:true）、24 小時時刻、陣營名稱（盟軍/德軍）、
 *     現代軍種圖示/說明、地形誇張、海岸→灘→崖色階。
 *   並自帶海空戰場煙幕粒子系統（搶灘後灘頭升起的標誌性硝煙）。
 * ======================================================================= */
(function (S) {
  /* ---------- 戰役專屬設定（須在 boot/buildTerrain 之前就緒） ---------- */
  S.config = {
    modern: true,
    // 時刻：距「1944年6月6日 00:00」的小時數 → 24 小時制
    fmtTime(t) {
      const h = ((Math.floor(t) % 24) + 24) % 24;
      const mm = Math.floor(((t % 1) + 1) % 1 * 60);
      return `1944年6月6日 ${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
    },
    sideName:  { east: '盟軍', west: '德軍' },
    sideShort: { east: '盟軍', west: '德軍' },
    kindIcons: { warship: '艦', landingcraft: '登', aircraft: '機', armor: '戰', bunker: '堡', flak: '砲', infantry: '步' },
    kindArms: {
      warship:      ['海軍艦砲', '戰艦/驅逐艦艦砲火力支援'],
      landingcraft: ['登陸艇', 'LCVP 搶灘運兵、放下跳板'],
      aircraft:     ['航空兵', '轟炸/掃射支援'],
      armor:        ['裝甲', 'DD 雪曼戰車'],
      bunker:       ['岸防工事', 'WN 抵抗巢 MG42 火網'],
      flak:         ['高射砲', '地對空 flak'],
      infantry:     ['步兵', '搶灘步兵/遊騎兵'],
    },
    // 奧馬哈灘頭低平、後接卵石堤與斷崖，需中等垂直誇張
    exag: 3.5,
    // 海面海藍 → 灘沙 → 崖綠色階
    elevStops: [
      [0, 0x1c3a55], [1, 0x355f78], [3, 0xae9a6e], [8, 0x8f8a55],
      [20, 0x6f7440], [35, 0x6a6b3c], [45, 0x77704a],
    ],
    // 真實衛星影像（bbox 對齊 DEM 範圍）；若資產缺失於 normandy.html 端處理
    satelliteTexture: 'assets/terrain/normandy-sat.jpg',
  };

  S.player = { time: 5.5, playing: true, speed: 0.4, program: true, T_START: 5.5, T_END: 18 };

  function phase(t) {
    if (t < 6.0)   return '★ 艦砲齊射 · 戰艦驅逐艦轟擊岸防';
    if (t < 6.5)   return '空襲 · 轟炸機掃射灘頭縱深';
    if (t < 7.0)   return '★ 搶灘 · 首波登陸艇放跳板';
    if (t < 8.5)   return '釘死卵石堤 · 步兵被火網壓制';
    if (t < 11.0)  return '驅逐艦抵近 · 直射摧毀抵抗巢';
    if (t < 13.0)  return '★ 隘道打通 · 工兵爆破障礙';
    if (t < 16.0)  return '突破灘頭 · 向內陸推進';
    return '鞏固登陸場 · 後續梯隊上岸';
  }

  /* ---------- 海空戰場煙幕粒子（搶灘後沿灘頭升起、隨風飄移） ---------- */
  let smoke = null;
  function initSmoke() {
    const N = 900, SPAN = 175, BASE = 0, TOP = 60, RISE = 0.4;
    const pos = new Float32Array(N * 3);
    const puffs = [];
    for (let i = 0; i < N; i++)
      puffs.push({
        x: (Math.random() * 2 - 1) * SPAN,
        y: BASE + Math.random() * TOP,
        z: (Math.random() * 2 - 1) * SPAN,
        spd: 0.4 + Math.random() * 0.8,
      });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xc4c0b8, size: 9, sizeAttenuation: true,
      transparent: true, opacity: 0, depthWrite: false,
    });
    const mesh = new THREE.Points(geo, mat);
    mesh.frustumCulled = false;
    S.engine.scene.add(mesh);
    smoke = { mesh, mat, geo, pos, puffs, N, SPAN, BASE, TOP, RISE };
  }
  // 搶灘後(t6.5)灘頭升起，隨戰鬥峰值濃淡
  function smokeAmount(t) {
    if (t < 6.5)  return 0;
    if (t < 7.5)  return (t - 6.5) / 1.0;          // 搶灘後迅速升起
    if (t < 13.0) return 1;                         // 灘頭膠著期最濃
    if (t < 16.0) return 1 - (t - 13.0) / 3.0 * 0.6; // 突破後漸散
    return 0.4;                                     // 鞏固期殘煙
  }
  function updateSmoke(t, dt) {
    if (!smoke) return;
    const amt = smokeAmount(t);
    smoke.mat.opacity = amt * 0.42;
    smoke.mesh.visible = amt > 0.01;
    if (!smoke.mesh.visible) return;
    const tgt = S.engine.controls.target, cx = tgt.x, cz = tgt.z;
    const rise = 6 * dt, drift = 4 * dt;            // 升起 + 沿灘頭飄移
    const p = smoke.pos, { puffs, N, SPAN, BASE, TOP } = smoke;
    for (let i = 0; i < N; i++) {
      const f = puffs[i];
      f.y += rise * f.spd;
      f.x += drift * f.spd;                          // 隨海風沿灘頭飄
      if (f.y > BASE + TOP || f.x > SPAN) {          // 回收：自灘頭低處重生
        f.y = BASE + Math.random() * 6;
        f.x = (Math.random() * 2 - 1) * SPAN;
        f.z = (Math.random() * 2 - 1) * SPAN;
      }
      const j = i * 3;
      p[j] = cx + f.x; p[j + 1] = f.y; p[j + 2] = cz + f.z;
    }
    smoke.geo.attributes.position.needsUpdate = true;
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
    S.initWeather();
    initSmoke();
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
      S.updateFormations(t);
      S.updateRoutes(t);
      S.waveFlags(elapsed);
      S.updateWeather(t, elapsed);
      updateSmoke(t, dt);
      S.updateEffects(t, dt);
      S.updateEngagements(t, dt);
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
