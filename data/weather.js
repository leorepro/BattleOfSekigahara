/* =========================================================================
 * data/weather.js — 關原天氣時間軸（朝霧 → 放晴）
 *   史載決戰當日清晨濃霧，巳刻前後散去。
 *   keyframes 依時刻 t 內插：
 *     fog   霧色 / near / far（far 越小霧越濃）
 *     bg    天空底色
 *     sun   太陽光強度    exp 電影色調曝光
 *     bank  貼地霧層不透明度（0~1）
 * ======================================================================= */
window.SEKI = window.SEKI || {};

SEKI.weatherTrack = [
  { t:8,    fog:'#cdd5da', near:60,  far:330,  bg:'#b9c6cf', sun:0.78, exp:0.96, bank:0.32 }, // 朝霧（仍見地形）
  { t:9,    fog:'#c6cfd6', near:90,  far:430,  bg:'#aebdc8', sun:0.92, exp:0.99, bank:0.22 },
  { t:10,   fog:'#bdc9d3', near:130, far:600,  bg:'#a4b6c4', sun:1.05, exp:1.02, bank:0.12 },
  { t:11,   fog:'#b2c2d0', near:200, far:820,  bg:'#9cb0c0', sun:1.18, exp:1.05, bank:0.05 }, // 霧散
  { t:12,   fog:'#aebfcb', near:260, far:1000, bg:'#97acbd', sun:1.25, exp:1.06, bank:0.01 }, // 放晴
  { t:13.5, fog:'#b3bcc4', near:230, far:900,  bg:'#9aaab8', sun:1.20, exp:1.05, bank:0.03 }, // 硝煙微濁
  { t:14,   fog:'#b0bac3', near:230, far:900,  bg:'#98a8b6', sun:1.16, exp:1.04, bank:0.03 },
];
