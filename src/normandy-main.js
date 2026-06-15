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
    // 時刻：距「1944年6月6日 00:00」的小時數 → 跨兩天(D-Day 6/6 → D+1 6/7 → 6/8)自動換日
    fmtTime(t) {
      const total = Math.max(0, Math.floor(t));
      const day = 6 + Math.floor(total / 24);
      const h = total % 24;
      const mm = Math.floor(((t % 1) + 1) % 1 * 60);
      return `1944年6月${day}日 ${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
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
    // 非線性時間軸刻度分配 [時刻, 位置比例]：決戰白天(5~18)最寬，凌晨空降/夜間/D+1 壓縮
    timelineAnchors: [[0.5, 0], [5, 0.08], [18, 0.62], [24, 0.74], [48, 1]],
  };

  S.player = { time: 0.5, playing: true, speed: 0.4, program: true, T_START: 0.5, T_END: 48 };

  function phase(t) {
    if (t < 1.0)   return '★ 空降序幕 · C-47 運輸機群跨海進場空投';
    if (t < 1.5)   return '★ 空降 · 漫天傘花·傘兵夜降諾曼第內陸';
    if (t < 2.2)   return '傘兵張傘落地 · 蟋蟀器集結建立臨時陣地';
    if (t < 3.2)   return '傘兵集結奪鎮 · 路口設障切斷公路';
    if (t < 5.0)   return '★ 截斷德軍增援 · 炸橋遲滯裝甲推進';
    if (t < 5.5)   return '增援被截於內陸 · 灘頭德軍孤立無援';
    if (t < 6.0)   return '★ 艦砲齊射 · 戰艦驅逐艦轟擊岸防';
    if (t < 6.5)   return '空襲 · 轟炸機掃射灘頭縱深';
    if (t < 7.0)   return '★ 搶灘 · 首波登陸艇放跳板';
    if (t < 8.5)   return '釘死卵石堤 · 步兵被火網壓制';
    if (t < 11.0)  return '驅逐艦抵近 · 直射摧毀抵抗巢';
    if (t < 13.0)  return '★ 隘道打通 · 工兵爆破障礙';
    if (t < 16.0)  return '突破灘頭 · 向內陸推進';
    if (t < 20.0)  return '鞏固登陸場 · 灘頭堡縱深推進';
    if (t < 24.0)  return '入夜固守 · 工兵清障·擊退滲透與反撲';
    if (t < 32.0)  return 'D+1 · 五灘連線 · 後續梯隊(2步兵師)上陸';
    if (t < 40.0)  return 'D+1 · 向內陸 Trévières / Isigny 推進';
    return 'D+1 · 縱深轉穩固 · 奧馬哈成通往內陸的橋頭堡';
  }

  /* ---------- 海空戰場煙幕粒子（搶灘後沿灘頭升起、隨風飄移） ---------- */
  let smoke = null;
  function initSmoke() {
    const N = 280, SPAN = 165, BASE = 0, TOP = 14, RISE = 0.4;   // 貼地戰場低空煙(不再填滿天空)
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
      map: S.softTexture, color: 0x9a958c, size: 17, sizeAttenuation: true,   // 柔邊圓煙(非硬方塊)
      transparent: true, opacity: 0, depthWrite: false, blending: THREE.NormalBlending,
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
    smoke.mat.opacity = amt * 0.30;
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

  /* ---------- 奧克角攀崖突擊（2 遊騎兵營）：誇張化繩索 + 沿繩上攀的人形 ---------- */
  let cliff = null;
  function initCliffAssault() {
    const eng = S.engine;
    const base = eng.project(-1.005, 49.3985, 0);                 // 崖腳(海側)
    const baseY = S.terrain ? S.terrain.heightAt(base.x, base.z) : 0;
    const topY = baseY + 9;                                       // 誇張崖高，讓攀爬可見
    const grp = new THREE.Group();
    const ropeMat = new THREE.LineBasicMaterial({ color: 0x202020, transparent: true, opacity: 0.85 });
    const ropes = [];
    for (let i = 0; i < 6; i++) {
      const ox = (i - 2.5) * 1.5;
      const bx = base.x + ox, bz = base.z + 1.4;                  // 崖腳略偏海
      const tx = base.x + ox * 0.7, tz = base.z - 0.6;           // 崖頂略偏陸
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(bx, baseY, bz), new THREE.Vector3(tx, topY, tz)]);
      grp.add(new THREE.Line(geo, ropeMat));
      ropes.push({ bx, bz, tx, tz });
    }
    const cmat = new THREE.MeshStandardMaterial({ color: 0x4d5a48, roughness: 0.9 });
    const climbers = [];
    for (let i = 0; i < 10; i++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.0, 0.5), cmat);
      grp.add(m);
      climbers.push({ mesh: m, rope: ropes[i % ropes.length], off: Math.random() });
    }
    grp.visible = false; eng.scene.add(grp);
    cliff = { grp, climbers, baseY, topY };
  }
  function updateCliffAssault(t) {
    if (!cliff) return;
    const on = t > 6.6 && t < 11;                                 // 攀崖時段
    cliff.grp.visible = on;
    if (!on) return;
    const prog = Math.max(0, Math.min(1, (t - 7.1) / 2.9));       // 整體攀爬進度
    for (const c of cliff.climbers) {
      const k = Math.max(0, Math.min(1, prog * 1.3 - c.off * 0.3)); // 各人錯開先後
      const r = c.rope;
      c.mesh.position.set(r.bx + (r.tx - r.bx) * k,
        cliff.baseY + (cliff.topY - cliff.baseY) * k + 0.5,
        r.bz + (r.tz - r.bz) * k);
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
    if (S.initSectors) S.initSectors();     // 灘段不規則閃光框（隨運鏡標出當前焦點灘段）
    if (S.initAirdrop) S.initAirdrop();     // 凌晨空降序列：C-47 運輸機 + 傘兵緩降 + 臨時陣地
    if (S.initFleet) S.initFleet();         // 外海背景入侵艦隊（運輸船/驅逐艦/登陸艇，營造規模感）
    S.buildEngagements();
    S.initWeather();
    initSmoke();
    initCliffAssault();
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
      updateCliffAssault(t);
      if (S.updateSectors) S.updateSectors(t);   // 灘段閃光框脈動 + 焦點切換
      if (S.updateAirdrop) S.updateAirdrop(t);   // 空降動畫：機群進場/投放/傘兵緩降/飛離
      if (S.updateFleet) S.updateFleet(t);       // 背景艦隊：淡入淡出/海浪起伏/登陸艇推進
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
