/* =========================================================================
 * src/thermopylae-main.js — 溫泉關之戰（480 BC）啟動點 + 戰役設定 + 主迴圈
 *   沿用共用引擎（src/engine/*），以 SEKI.config 覆寫戰役專屬參數。
 *   ※ Phase 0 骨架：暫用 okehazama 之 data/ 作 placeholder（地形/單位待後續 Phase 取代），
 *     先確保頁面可載入、四頁切換可運作；史觀文字已改希臘/波斯。
 * ======================================================================= */
(function (S) {
  /* ---------- 戰役專屬設定（須在 boot/buildTerrain 之前就緒） ---------- */
  S.config = {
    // 時刻：三日跨度，無精確鐘點 → 以「會戰第N日 · 晨/午/午後/夜」分段
    fmtTime(t) {
      const day = Math.max(0, Math.min(3, Math.floor((t + 8) / 8)));
      const dayZh = ['布陣', '第一日', '第二日', '第三日'][day];
      const h = ((Math.floor(t) % 24) + 24) % 24;
      const seg = h < 6 ? '拂曉' : h < 11 ? '上午' : h < 14 ? '正午' : h < 18 ? '午後' : '入夜';
      return `會戰${dayZh} · ${seg}`;
    },
    sideName:  { east: '波斯帝國', west: '希臘聯軍' },
    sideShort: { east: '波斯', west: '希臘' },
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
    // 溫泉關：北面馬利亞灣(海) + 南面卡利德羅莫山(~760m) → 中等誇張凸顯峽谷封閉感
    exag: 2.8,
    // 古海岸線：seaLevel 以下低地夾平為古海面（重建窄道），terrain.js 讀此鍵
    ancientCoast: { seaLevel: 15 },
    seaColor: 0x1a4a6e,   // 愛琴海深藍
    // 海拔色階（seaLevel 以上）：出水窄灘沙黃 → 乾草綠 → 山坡土黃 → 高坡灰褐 → 裸岩灰
    elevStops: [
      [15, 0xcdb88c], [60, 0x8a9a55], [200, 0x7d7048],
      [450, 0x8a7d63], [760, 0x9a958a],
    ],
    // 純海拔著色（無衛星圖：今日地貌含現代公路/農田，與古戰場不符）
    satelliteTexture: null,
  };

  S.player = { time: -8, playing: true, speed: 0.35, program: true, T_START: -8, T_END: 14 };

  function phase(t) {
    if (t < -2)    return '波斯大軍壓境 · 希臘聯軍據守中門 · 重修福基斯牆';
    if (t < 4)     return '第一日 · 米底軍正面強攻 · 方陣盾牆輾壓';
    if (t < 8)     return '第二日 · 不死軍投入仍不得寸進';
    if (t < 11)    return '第三日 · 埃菲亞特斯獻安諾派亞山徑 · 不死軍迂迴';
    if (t < 12.4)  return '佛西斯守軍被破 · 希臘遭包抄';
    if (t < 13.6)  return '★ 列奧尼達遣散聯軍 · 298 斯巴達殿後死戰';
    if (t < 13.9)  return '★ 列奧尼達戰死 · 奪回遺體';
    return '溫泉關陷落 · 拖延換得薩拉米斯之機';
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
    return 0;   // 溫泉關（盛夏希臘）無雨 — Phase 0 停用雨絲；後續以塵土/熱浪取代
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
