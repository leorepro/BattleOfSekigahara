/* =========================================================================
 * src/main.js — 啟動點 + 播放狀態 + 主迴圈
 *   S.player 為共享播放狀態（時間/播放/倍速/節目模式），由 ui.js 操控。
 *   主迴圈推進戰場時刻並驅動：部隊內插、幟旗、天氣、特效、自動運鏡、UI。
 * ======================================================================= */
(function (S) {
  S.player = { time: 8, playing: true, speed: 0.35, program: true, T_START: 8, T_END: 14 };

  function clockJP(t) {
    const tbl = [[8,'辰刻'],[10,'巳刻'],[12,'午刻'],[13,'未刻']];
    let n = '辰刻'; for (const [h, nm] of tbl) if (t >= h) n = nm;
    const hh = Math.floor(t), mm = Math.floor((t - hh) * 60);
    return `${n} ${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
  }
  function phase(t) {
    if (t < 9)    return '兩軍對峙，晨霧未散';
    if (t < 11)   return '井伊抜け駆け，福島・宇喜多激戰';
    if (t < 12)   return '戰線膠著，西軍佔優';
    if (t < 12.9) return '★ 小早川秀秋倒戈，殺向大谷隊';
    if (t < 13.5) return '大谷潰滅，西軍動搖';
    return '西軍總崩，島津敵中突破';
  }

  function boot() {
    const eng = S.engine.init();
    S.buildTerrain();
    S.buildGeoLabels();
    S.buildUnits();
    S.buildRoutes();
    S.initEffects();
    S.initWeather();
    S.initUI();
    S.setProgramMode(true);                 // 預設進入節目模式（自動運鏡）

    const clockEl = document.getElementById('clock');
    const phaseEl = document.getElementById('phase');
    const titlecard = document.getElementById('titlecard');

    const loading = document.getElementById('loading');
    if (loading) { loading.style.opacity = '0'; setTimeout(() => loading.remove(), 800); }
    if (titlecard) setTimeout(() => { titlecard.style.opacity = '0'; }, 3800); // 開場標題淡出

    function animate() {
      requestAnimationFrame(animate);
      const dt = Math.min(eng.clock.getDelta(), 0.1);
      const elapsed = eng.clock.elapsedTime;

      if (S.player.program) {
        S.updateStoryboard(dt);                    // 程式模式：storyboard 擁有時刻
      } else if (S.player.playing) {
        S.player.time += dt * S.player.speed;       // 自由模式：依倍速推進
        if (S.player.time > S.player.T_END) S.player.time = S.player.T_START;
      }
      const t = S.player.time;

      S.updateUnits(t);
      S.updateRoutes(t);
      S.waveFlags(elapsed);
      S.updateWeather(t, elapsed);
      S.updateEffects(t, dt);
      S.updateUI(t);

      clockEl.textContent = clockJP(t);
      phaseEl.textContent = phase(t);

      eng.render();
    }
    animate();
  }

  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', boot);
  else boot();
})(window.SEKI);
