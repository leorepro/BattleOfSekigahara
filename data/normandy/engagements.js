/* =========================================================================
 * data/normandy/engagements.js — 交戰配對（誰在跟誰打）
 *   a, b   交戰雙方 unit id      from,to  交戰時段(campaign 小時)
 *   交戰標記只在「當前鏡頭聚焦的兩軍之間」顯示，與旁白連動，並驅動「交戰中」拉鋸條。
 *   t = 距 1944/6/6 00:00 小時數（H時=06:30, t=6.5）。
 * ======================================================================= */
window.SEKI = window.SEKI || {};

SEKI.engagements = [
  /* ---- 凌晨空降·截斷德軍增援（t≈1.5~14，先於搶灘） ---- */
  { a:'us_82',  b:'reinf_352',   from:3.0, to:14 },   // 82空降師設路障·截停352師增援縱隊
  { a:'us_101', b:'reinf_352',   from:5.0, to:11 },   // 101空降師扼守路口·夾擊352師增援
  { a:'uk_6',   b:'reinf_panzer',from:4.0, to:12 },   // 英6空降師炸橋·遲滯德軍裝甲推進
  { a:'us_82',  b:'reinf_panzer',from:7.0, to:12 },   // 傘兵反戰車火力阻擊改道之裝甲

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

  /* ---- D-Day 夜 ~ D+1（6/7）：擴大登陸場·擊退德軍反擊（t18~36） ---- */
  { a:'us_82',  b:'reinf_352',     from:18, to:30 },  // D+1 82空降師肅清潰散之352增援殘部
  { a:'uk_6',   b:'reinf_panzer',  from:18, to:34 },  // D+1 英6空降師持續遲滯德軍殘存裝甲
  { a:'inf_16th', b:'inf_352',     from:18, to:24 },  // D-Day 夜 16團擊退352師夜間反撲
  { a:'ger_d1_counter', b:'inf_16th',   from:26, to:30 }, // D+1 德軍反擊縱隊撞上 Colleville 一線的16團
  { a:'ger_d1_counter', b:'us_2nd_div', from:28, to:36 }, // D+1 反擊遭新登陸的第2步兵師擊退
  { a:'ger_d1_counter', b:'destroyers', from:26, to:30 }, // D+1 驅逐艦抵近以艦砲擊退德軍反擊縱隊
  { a:'us_2nd_div', b:'inf_352',   from:36, to:44 },  // D+1 第2步兵師向 Trévières 推進·逼退352師殘部
];
