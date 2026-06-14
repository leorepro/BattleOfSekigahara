/* =========================================================================
 * data/okehazama/engagements.js — 交戰配對（誰在跟誰打）
 *   a, b   交戰雙方 unit id      from,to  交戰時段(campaign 小時)
 *   交戰標記只在「當前鏡頭聚焦的兩軍之間」顯示，與旁白連動。
 * ======================================================================= */
window.SEKI = window.SEKI || {};

SEKI.engagements = [
  { a:'asahina',    b:'washizu',   from:4,    to:6    },  // 朝比奈 攻 鷲津砦
  { a:'matsudaira', b:'marune',    from:4,    to:5.5  },  // 松平元康 攻 丸根砦
  { a:'sassa',      b:'yoshimoto', from:11,   to:11.4 },  // 佐佐・千秋 前衛突擊（戰死）
  { a:'nobunaga',   b:'yoshimoto', from:13,   to:13.7 },  // 信長 正面突擊 義元本陣
  { a:'nobunaga',   b:'ii',        from:13,   to:13.6 },  // 突入·討井伊直盛
  { a:'nobunaga',   b:'matsui',    from:13,   to:13.6 },  // 突入·討松井宗信
];
