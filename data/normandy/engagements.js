/* =========================================================================
 * data/normandy/engagements.js — 交戰配對（誰在跟誰打）
 *   a, b   交戰雙方 unit id      from,to  交戰時段(campaign 小時)
 *   交戰標記只在「當前鏡頭聚焦的兩軍之間」顯示，與旁白連動，並驅動「交戰中」拉鋸條。
 *   t = 距 1944/6/6 00:00 小時數（H時=06:30, t=6.5）。
 * ======================================================================= */
window.SEKI = window.SEKI || {};

SEKI.engagements = [
  { a:'wn72',    b:'co_a_116', from:6.5, to:13.5 },  // WN72 交叉火網屠殺 Dog Green 的116團A連
  { a:'wn71',    b:'co_a_116', from:6.5, to:7.5  },  // WN71 一同封鎖 Dog Green
  { a:'wn62',    b:'inf_16th', from:6.5, to:13   },  // WN62 俯瞰 Easy Red/Fox Green·16團最致命交戰
  { a:'wn61',    b:'dd_741',   from:6.5, to:11   },  // WN61 88mm 砲擊毀上灘 DD 戰車
  { a:'wn61',    b:'inf_16th', from:7,   to:11   },  // WN61 對 16團封鎖 E-3 東側
  { a:'mortar_352', b:'engineers', from:6.6, to:11 }, // 迫擊砲拋射壓制灘頭工兵
  { a:'rangers', b:'flak_colleville', from:6.0, to:7 }, // 攀崖前對空火力（示意：航渡受對空射擊）
  { a:'rangers', b:'wn70',     from:7.1, to:12   },  // 奧克角攀崖突擊（崖頂砲廓守軍）
  { a:'destroyers', b:'wn62',  from:9.5, to:13   },  // 驅逐艦抵近直射 WN62
  { a:'destroyers', b:'wn61',  from:8.5, to:11   },  // 驅逐艦抵近直射 WN61
  { a:'usstexas', b:'wn72',    from:12,  to:13.5 },  // 德州號主砲轟擊 D-1 隘口 WN72
  { a:'engineers', b:'wn68',   from:11,  to:12   },  // 工兵肅清 E-1·WN68 失守
  { a:'inf_16th', b:'inf_352', from:11,  to:14   },  // 16團突破崖頂·遭352師局部反擊
];
