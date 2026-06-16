/* =========================================================================
 * data/austerlitz/armies.js — 奧斯特利茨雙方部隊
 *   side(色彩通道): 'east'(法軍/藍/勝) | 'west'(俄奧聯軍/紅 accent；軍服另由 factionColor 俄綠/奧白)
 *   kind: command/infantry/cavalry/artillery；track {t,lng,lat,s,st}
 *   ※ Phase 0 placeholder：2 單位讓頁面可載入；Phase 3 (Task 3.1) 補全 15 單位。
 * ======================================================================= */
window.SEKI = window.SEKI || {};

SEKI.armies = [
  { id:"soult", name_zh:"蘇爾特第四軍", name_ja:"IV Corps · Soult", side:'east', faction:'french_line', factionColor:0x2a4a9a, kind:'infantry',
    title:"中央突破主角 · 旺達姆＋聖海拉爾師", troops:23600,
    track:[
      { t:-8, lng:16.71, lat:49.14, s:23600, st:'march' },
      { t:0,  lng:16.745,lat:49.123,s:23600, st:'hold' },
      { t:3,  lng:16.762,lat:49.118,s:23600, st:'breakthrough' },
      { t:12, lng:16.78, lat:49.10, s:21000, st:'hold' },
    ]},
  { id:"kutuzov_iv", name_zh:"第四縱隊", name_ja:"IV Column · Kolowrat", side:'west', faction:'austrian_line', factionColor:0xcdd2da, kind:'infantry',
    title:"普拉欽高地守軍 · 南調中計", troops:24000,
    track:[
      { t:-8,  lng:16.86, lat:49.13, s:24000, st:'march' },
      { t:0,   lng:16.762,lat:49.120,s:24000, st:'hold' },
      { t:1.5, lng:16.75, lat:49.10, s:24000, st:'march' },
      { t:8,   lng:16.78, lat:49.075,s:16000, st:'rout' },
    ]},
];
