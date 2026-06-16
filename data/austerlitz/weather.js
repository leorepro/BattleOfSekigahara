/* =========================================================================
 * data/austerlitz/weather.js — 奧斯特利茨天氣時間軸（「奧斯特利茨的太陽」）
 *   史載 12/2 凌晨濃霧，上午約 9 點陽光破雲散霧，正逢中央突破。午後 4:30 降小雪。
 *   ※ Phase 0 placeholder；Phase 6 (Task 6.1) 精修霧→晴曲線與中央突破同步。
 * ======================================================================= */
window.SEKI = window.SEKI || {};

SEKI.weatherTrack = [
  { t:-8, fog:'#c8ccce', near:120, far:780, bg:'#aab2b8', sun:0.70, exp:0.96, bank:0.10 },
  { t:0,  fog:'#9aa4ac', near:70,  far:340, bg:'#7c868e', sun:0.45, exp:0.88, bank:0.50 }, // 拂曉濃霧
  { t:2,  fog:'#aeb6bc', near:90,  far:460, bg:'#8e98a0', sun:0.58, exp:0.92, bank:0.38 },
  { t:3,  fog:'#cdd6dc', near:200, far:1000,bg:'#bcc8d2', sun:1.20, exp:1.05, bank:0.04 }, // 09:00 太陽破雲·中央突破
  { t:8,  fog:'#c2ccd2', near:180, far:920, bg:'#b0bcc6', sun:1.10, exp:1.02, bank:0.06 },
  { t:12, fog:'#b8bec4', near:120, far:640, bg:'#9aa4ac', sun:0.80, exp:0.94, bank:0.18 }, // 午後·降雪
];
