/* =========================================================================
 * src/okehazama-main.js — 桶狹間之戰 啟動點 + 戰役設定 + 主迴圈
 *   沿用關原引擎（src/engine/*），僅以 SEKI.config 覆寫戰役專屬參數：
 *     時刻換算（五月十九日）、陣營名稱（織田/今川）、家紋名、地形誇張、海岸色階。
 *   並自帶暴雨雨絲粒子系統（桶狹間決戰前的標誌性天候）。
 * ======================================================================= */
(function (S) {
  /* ---------- 戰役專屬設定（須在 boot/buildTerrain 之前就緒） ---------- */
  S.config = {
    // 時刻：距「永祿三年五月十九日 00:00」的小時數 → 五月十八/十九日 時辰
    fmtTime(t, JIKOKU) {
      const day = 19 + Math.floor(t / 24);
      const h = ((Math.floor(t) % 24) + 24) % 24;
      const mm = Math.floor(((t % 1) + 1) % 1 * 60);
      const jk = JIKOKU[Math.floor(((h + 1) % 24) / 2)];
      const dayZh = day === 18 ? '十八日' : day === 19 ? '十九日' : `${day}日`;
      return `五月${dayZh} ${jk}刻 ${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
    },
    sideName:  { east: '織田軍', west: '今川軍' },
    sideShort: { east: '織田', west: '今川' },
    crestNames: {
      mokkou: '織田木瓜（五瓜に唐花）', futatsuhikiryo: '足利二つ引両',
      hikiryo: '丸に三つ引', mitsubaAoi: '三つ葉葵', tachibana: '井伊橘',
    },
    kindArms: {
      command:   ['本陣 · 旗本', '總大將直屬精銳，馬廻・旗本眾'],
      cavalry:   ['騎馬隊', '騎馬武者突擊'],
      infantry:  ['足軽 · 長槍 · 弓', '長槍足軽為主，配屬弓與少量鉄砲'],
      matchlock: ['鉄砲（火縄銃）', '永祿年間火器尚少，配屬鉄砲'],
      artillery: ['鉄砲隊', '鉄砲齊射'],
    },
    // 桶狹間丘陵低矮（0~82m），需更大垂直誇張才見微地形
    exag: 9,
    // 低海拔海岸色階：海面海藍 → 灘地 → 陸綠 → 丘陵土黃
    elevStops: [
      [0, 0x21405e], [1.5, 0x355f78], [4, 0x5d7048], [18, 0x6f7440],
      [40, 0x7d6e49], [62, 0x8a7559], [82, 0x9a8a72],
    ],
    // 真實衛星影像（EOX Sentinel-2 cloudless，bbox 對齊 DEM 範圍）
    satelliteTexture: 'assets/terrain/okehazama-sat.jpg',
  };

  S.player = { time: -8, playing: true, speed: 0.35, program: true, T_START: -8, T_END: 14 };

  function phase(t) {
    if (t < -6)    return '今川大軍西上 · 沓掛布陣';
    if (t < -1)    return '松平元康 大高城兵糧入';
    if (t < 4)     return '信長舞「敦盛」· 清洲出陣';
    if (t < 7)     return '鷲津・丸根二砦攻防';
    if (t < 9)     return '信長熱田參拜 · 善照寺集結';
    if (t < 11)    return '今川義元 桶狹間山休整';
    if (t < 12.4)  return '信長前進中島砦 · 正面推進';
    if (t < 13)    return '★ 天驟變 · 暴雨夾雹';
    if (t < 13.6)  return '★ 桶狹間突擊 · 直衝本陣';
    if (t < 13.9)  return '★ 今川義元 討死';
    return '今川軍潰散 · 信長崛起';
  }

  /* ---------- 暴雨雨絲粒子（風自西向東，呼應「楠木倒向東」） ---------- */
  let rain = null;
  function initRain() {
    const N = 1400, SPAN = 175, TOP = 95, LEN = 3.4;
    const pos = new Float32Array(N * 2 * 3);
    const drops = [];
    for (let i = 0; i < N; i++)
      drops.push({ x: (Math.random() * 2 - 1) * SPAN, y: Math.random() * TOP, z: (Math.random() * 2 - 1) * SPAN });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.LineBasicMaterial({ color: 0xb6c6d6, transparent: true, opacity: 0, depthWrite: false });
    const mesh = new THREE.LineSegments(geo, mat);
    mesh.frustumCulled = false;
    S.engine.scene.add(mesh);
    rain = { mesh, mat, geo, pos, drops, N, SPAN, TOP, LEN };
  }
  function rainAmount(t) {
    if (t < 12.0 || t > 13.4) return 0;
    if (t < 12.4) return (t - 12.0) / 0.4;
    if (t < 12.9) return 1;
    if (t < 13.4) return 1 - (t - 12.9) / 0.5;
    return 0;
  }
  function updateRain(t, dt) {
    if (!rain) return;
    const amt = rainAmount(t);
    rain.mat.opacity = amt * 0.55;
    rain.mesh.visible = amt > 0.01;
    if (!rain.mesh.visible) return;
    const tgt = S.engine.controls.target, cx = tgt.x, cz = tgt.z;
    const fall = 130 * dt, drift = 0.34;
    const p = rain.pos, { drops, N, SPAN, TOP, LEN } = rain;
    for (let i = 0; i < N; i++) {
      const d = drops[i];
      d.y -= fall; d.x += fall * drift;                 // 隨風東移
      if (d.y < 0 || d.x > SPAN) { d.y = TOP; d.x = (Math.random() * 2 - 1) * SPAN; d.z = (Math.random() * 2 - 1) * SPAN; }
      const ax = cx + d.x, az = cz + d.z, j = i * 6;
      p[j] = ax;       p[j + 1] = d.y;       p[j + 2] = az;
      p[j + 3] = ax + 1.3; p[j + 4] = d.y - LEN; p[j + 5] = az + 0.3;   // 斜雨
    }
    rain.geo.attributes.position.needsUpdate = true;
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
    initRain();
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
      updateRain(t, dt);
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
