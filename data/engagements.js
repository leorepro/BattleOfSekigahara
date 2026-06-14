/* =========================================================================
 * data/engagements.js — 交戰配對（誰在跟誰打）
 *   a, b   交戰雙方 unit id      from,to  交戰時段(campaign 小時)
 *   交戰標記只在「當前鏡頭聚焦的兩軍之間」顯示，與旁白連動；
 *   砲火硝煙集中在兩軍接觸點，使對戰一目了然。
 * ======================================================================= */
window.SEKI = window.SEKI || {};

SEKI.engagements = [
  { a:'fukushima',  b:'ukita',     from:9,    to:13.5 },  // 福島 ⚔ 宇喜多（正面主戰）
  { a:'ii',         b:'ukita',     from:9,    to:12   },  // 井伊 抜け駆け 攻宇喜多
  { a:'matsudaira', b:'ukita',     from:9,    to:12   },  // 松平忠吉 與井伊共打第一槍
  { a:'kuroda',     b:'ishida',    from:10,   to:14   },  // 黑田 ⚔ 石田（笹尾山·狙擊島左近）
  { a:'hosokawa',   b:'ishida',    from:10,   to:14   },  // 細川 ⚔ 石田
  { a:'tanaka',     b:'ishida',    from:10,   to:14   },  // 田中 ⚔ 石田
  { a:'kato',       b:'konishi',   from:10,   to:13.3 },  // 加藤 ⚔ 小西
  { a:'todo',       b:'otani',     from:10,   to:12.8 },  // 藤堂 ⚔ 大谷
  { a:'kyogoku',    b:'otani',     from:10,   to:12.8 },  // 京極 ⚔ 大谷
  { a:'kobayakawa', b:'otani',     from:12,   to:13   },  // 小早川倒戈 ⚔ 大谷
  { a:'wakisaka',   b:'otani',     from:12,   to:13   },  // 脇坂倒戈 ⚔ 大谷
  { a:'shimazu',    b:'tokugawa',  from:13.7, to:14   },  // 島津 敵中突破（正面穿德川陣）
];
