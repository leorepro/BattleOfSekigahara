/* =========================================================================
 * data/thermopylae/engagements.js — 交戰配對（誰在跟誰打）
 *   a, b   交戰雙方 unit id      from,to  交戰時段（會戰時數）
 *   驅動 engage.js 交戰帶/光暈/combatBurst 與 melee.js 接戰帶火花/堆屍。
 * ======================================================================= */
window.SEKI = window.SEKI || {};

SEKI.engagements = [
  /* 第一日：米底軍正面強攻，斯巴達方陣輾壓 */
  { a:'medes',           b:'leonidas',  from:1,    to:7    },
  { a:'medes',           b:'thespiae',  from:1.5,  to:7    },
  { a:'medes',           b:'arcadia',   from:2,    to:6.5  },
  /* 第一日：不死軍投入仍受挫 */
  { a:'immortals',       b:'leonidas',  from:5,    to:8    },
  /* 第二日：波斯本軍輪番猛攻 */
  { a:'persian_main',    b:'leonidas',  from:9,    to:16   },
  { a:'persian_main',    b:'thespiae',  from:9,    to:16   },
  { a:'persian_main',    b:'tegea_mant',from:9,    to:14   },
  { a:'persian_archers', b:'leonidas',  from:1,    to:16   },  // 弓兵齊射掩護
  /* 第三日：山徑迂迴——不死軍過佛西斯、背後包抄 */
  { a:'immortals',       b:'phocis',    from:16,   to:16.5 },
  { a:'immortals',       b:'leonidas',  from:21,   to:23   },  // 背後夾擊殿後軍
  /* 第三日殿後死戰 + 科洛諾斯箭雨 */
  { a:'persian_main',    b:'leonidas',  from:20,   to:23   },
  { a:'persian_main',    b:'thespiae',  from:20,   to:23   },
  { a:'persian_archers', b:'leonidas',  from:21,   to:23.5 },  // 箭雨覆蓋全滅
];
