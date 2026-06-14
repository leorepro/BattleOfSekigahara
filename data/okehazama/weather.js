/* =========================================================================
 * data/okehazama/weather.js — 桶狹間天氣時間軸
 *   史載決戰當日午後突降暴雨夾雹（《信長公記》：石冰打敵面、楠木倒向東），
 *   雨止後信長始下令正面突擊。此暴雨為桶狹間最具戲劇性的史實元素。
 *   keyframes 依時刻 t 內插：
 *     fog 霧色 / near / far（far 越小視野越窄）
 *     bg 天空底色  sun 太陽光強度  exp 電影色調曝光  bank 貼地霧/雨雲層不透明度
 *   ※ 雨絲粒子由 okehazama-main.js 依 t 另行驅動（暴雨高峰 t≈12.4~13.1）。
 * ======================================================================= */
window.SEKI = window.SEKI || {};

SEKI.weatherTrack = [
  { t:-8,   fog:'#c2ccd2', near:120, far:780, bg:'#a8b8c4', sun:0.88, exp:1.00, bank:0.08 }, // 十八日午後
  { t:-3,   fog:'#5b6470', near:90,  far:560, bg:'#3e4856', sun:0.45, exp:0.95, bank:0.16 }, // 十八日夜
  { t:1,    fog:'#6a7682', near:100, far:640, bg:'#4e5a68', sun:0.52, exp:0.98, bank:0.14 }, // 十九日未明
  { t:4,    fog:'#9aa6ae', near:110, far:660, bg:'#84939e', sun:0.72, exp:1.00, bank:0.20 }, // 拂曉·砦戰硝煙
  { t:7,    fog:'#cdd6dc', near:160, far:820, bg:'#bccad2', sun:1.05, exp:1.03, bank:0.06 }, // 朝·晴
  { t:10,   fog:'#c6d0d6', near:180, far:920, bg:'#b4c2cc', sun:1.22, exp:1.05, bank:0.04 }, // 午前·晴朗
  { t:11.8, fog:'#aab2b8', near:130, far:640, bg:'#959fa8', sun:0.92, exp:1.00, bank:0.14 }, // 黑雲聚集
  { t:12.4, fog:'#474d57', near:60,  far:300, bg:'#333944', sun:0.40, exp:0.84, bank:0.58 }, // 暴雨驟降
  { t:12.9, fog:'#343943', near:40,  far:220, bg:'#252a33', sun:0.30, exp:0.80, bank:0.72 }, // 暴雨頂峰·夾雹
  { t:13.1, fog:'#586069', near:70,  far:380, bg:'#434c57', sun:0.52, exp:0.90, bank:0.40 }, // 雨歇
  { t:13.4, fog:'#9fb0bc', near:160, far:760, bg:'#8ea0ac', sun:1.02, exp:1.04, bank:0.10 }, // 放晴·正面突擊
  { t:14,   fog:'#aebfca', near:200, far:900, bg:'#9bb0bd', sun:1.16, exp:1.05, bank:0.04 }, // 午後晴
];
