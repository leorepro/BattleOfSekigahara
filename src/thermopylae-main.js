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
    // 名牌兵種 icon（戰國 fallback 為文字；此處覆寫為希臘/波斯兵種字）
    kindIcons: { command:'帥', infantry:'重', archer:'弓', cavalry:'騎' },
    kindArms: {
      command:   ['主帥 · 親衛', '統帥與直屬精銳'],
      infantry:  ['重裝步兵（hoplite）', '圓盾Aspis + 長矛Dory + 科林斯盔，密集方陣盾牆'],
      archer:    ['弓兵', '波斯弓兵齊射，「箭矢遮天蔽日」'],
      cavalry:   ['騎兵', '機動部隊'],
    },
    // 逐邦/民族專屬色（方案A 色系分群；暖色=希臘、冷色=波斯）。armies 各單位亦帶 factionColor。
    factionColors: {
      sparta:0xb11f2a, thespiae:0xc8842e, thebes:0xd4a82a, phocis:0xb08a3a,
      arcadia:0x9c5a33, corinth:0xd9533a, tegea:0xa01f28, phlius:0xd9772a,
      persia_royal:0x6a3d9a, immortals:0x2a4a8a, medes:0x4a6a8a,
      persia:0x3a3a8a, persia_archer:0x2f6a72, persia_subjects:0x5a6a7a,
    },
    // 兵力儀表「雙數字並陳」：波斯方同時顯示現代估計 vs 希羅多德宣稱（把數字爭議當賣點）
    troopsClaim: {
      east: { estimate: 110000, claim: 1700000, estLabel: '現代估計', claimLabel: '希羅多德宣稱' },
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
    // 希臘方陣：士兵以 hoplite 盾牆密集排列（formation.js 走 phalanx 分支）
    formationStyle: 'phalanx',
  };

  S.player = { time: -6, playing: true, speed: 0.5, program: true, T_START: -6, T_END: 26 };

  function phase(t) {
    if (t < 0)     return '波斯大軍壓境 · 希臘聯軍據守中門 · 重修福基斯牆';
    if (t < 4)     return '第一日 · 米底軍正面強攻 · 方陣盾牆輾壓';
    if (t < 8)     return '第一日 · 不死軍投入仍不得寸進 · 薛西斯三度驚起';
    if (t < 16)    return '第二日 · 波斯輪番猛攻 · 督戰隊以鞭驅前 · 仍突不破方陣';
    if (t < 18)    return '第三日 · 埃菲亞特斯獻安諾派亞山徑 · 不死軍夜越山徑包抄';
    if (t < 20)    return '佛西斯守軍被繞過 · 列奧尼達遣散聯軍 · 298 斯巴達殿後';
    if (t < 22.5)  return '★ 殿後死戰 · 長矛折斷改短劍肉搏 · 列奧尼達戰死·奪回遺體';
    if (t < 24)    return '★ 科洛諾斯小丘 · 殘軍據守 · 波斯箭雨覆蓋全滅';
    return '溫泉關陷落 · 拖延換得薩拉米斯之機 → 普拉提亞終局勝利';
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
    if (S.initMelee) S.initMelee();   // 近戰：倒地堆屍 + 箭雨
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
      // 子彈時間：storyboard 把慢動作係數寫到 S.player.cinemaScale，乘入動畫/特效的 dt
      const cdt = dt * ((S.player.cinemaScale != null) ? S.player.cinemaScale : 1);
      S.updateEffects(t, cdt);
      S.updateEngagements(t, cdt);
      if (S.updateMelee) S.updateMelee(t, cdt);
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
