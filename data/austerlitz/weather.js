/* =========================================================================
 * data/austerlitz/weather.js — 奧斯特利茨天氣時間軸（「奧斯特利茨的太陽」）
 *   史載 12/2 凌晨濃霧，上午約 9 點陽光破雲散霧，正逢中央突破。午後 4:30 降小雪。
 *   ※ Phase 0 placeholder；Phase 6 (Task 6.1) 精修霧→晴曲線與中央突破同步。
 * ======================================================================= */
window.SEKI = window.SEKI || {};

// ※霧近/遠距已配合 worldScale 1/30（放大 2 倍）×2，避免放大後遠景被霧吃成灰白。
SEKI.weatherTrack = [
  { t:-8, fog:'#c8ccce', near:240, far:1560, bg:'#aab2b8', sun:0.70, exp:0.96, bank:0.10 },
  { t:0,  fog:'#9aa4ac', near:140, far:680,  bg:'#7c868e', sun:0.45, exp:0.88, bank:0.50 }, // 06:00 拂曉濃霧
  { t:1,  fog:'#94a0a8', near:110, far:600,  bg:'#79838b', sun:0.42, exp:0.86, bank:0.55 }, // 07-08時 霧最濃·南線血戰(能見度<10米)
  { t:2,  fog:'#aeb6bc', near:180, far:920,  bg:'#8e98a0', sun:0.58, exp:0.92, bank:0.38 },
  { t:3,  fog:'#cdd6dc', near:400, far:2000, bg:'#bcc8d2', sun:1.20, exp:1.05, bank:0.04 }, // ★09:00 太陽破雲·中央突破
  { t:5,  fog:'#c8d2da', near:440, far:2080, bg:'#b6c2cc', sun:1.15, exp:1.04, bank:0.03 }, // 11:00 霧完全散去·視野全恢復
  { t:8,  fog:'#c2ccd2', near:360, far:1840, bg:'#b0bcc6', sun:1.10, exp:1.02, bank:0.06 },
  { t:12, fog:'#b8bec4', near:240, far:1280, bg:'#9aa4ac', sun:0.80, exp:0.94, bank:0.18 }, // 午後16:30·降小雪
];
