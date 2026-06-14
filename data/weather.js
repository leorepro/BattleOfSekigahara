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
  { t:-16,  fog:'#c6d0d8', near:120, far:760,  bg:'#a8bac8', sun:1.00, exp:1.00, bank:0.10 }, // 十四日朝
  { t:-6,   fog:'#bdb6b0', near:110, far:620,  bg:'#9a96a0', sun:0.70, exp:0.95, bank:0.14 }, // 十四日夕
  { t:-3,   fog:'#6b727b', near:45,  far:230,  bg:'#3b424b', sun:0.24, exp:0.82, bank:0.40 }, // 雨夜（昏暗濃雲）
  { t:1,    fog:'#7b838c', near:55,  far:300,  bg:'#4a525b', sun:0.34, exp:0.85, bank:0.36 }, // 凌晨
  { t:6,    fog:'#ccd4da', near:60,  far:330,  bg:'#b7c4ce', sun:0.66, exp:0.94, bank:0.34 }, // 拂曉濃霧
  { t:8,    fog:'#cdd5da', near:60,  far:330,  bg:'#b9c6cf', sun:0.78, exp:0.96, bank:0.32 }, // 朝霧（仍見地形）
  { t:9,    fog:'#c6cfd6', near:90,  far:430,  bg:'#aebdc8', sun:0.92, exp:0.99, bank:0.22 },
  { t:10,   fog:'#bdc9d3', near:130, far:600,  bg:'#a4b6c4', sun:1.05, exp:1.02, bank:0.12 },
  { t:11,   fog:'#b2c2d0', near:200, far:820,  bg:'#9cb0c0', sun:1.18, exp:1.05, bank:0.05 }, // 霧散
  { t:12,   fog:'#aebfcb', near:260, far:1000, bg:'#97acbd', sun:1.25, exp:1.06, bank:0.01 }, // 放晴
  { t:13.5, fog:'#b3bcc4', near:230, far:900,  bg:'#9aaab8', sun:1.20, exp:1.05, bank:0.03 }, // 硝煙微濁
  { t:14,   fog:'#b0bac3', near:230, far:900,  bg:'#98a8b6', sun:1.16, exp:1.04, bank:0.03 },
];
