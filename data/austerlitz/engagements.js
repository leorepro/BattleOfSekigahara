/* =========================================================================
 * data/austerlitz/engagements.js — 交戰配對（誰在跟誰打）
 *   a, b   交戰雙方 unit id（見 armies.js）   from,to  交戰時段（會戰時數，鐘點＝6+t）
 *   驅動 engage.js 交戰帶/光暈/combatBurst 與 melee.js 接戰帶火花/拉鋸/堆屍。
 *   from/to 取雙方 track 皆存活且實際接觸的區間（對齊 armies.js 各 track 的時刻與 st）。
 * ======================================================================= */
window.SEKI = window.SEKI || {};

SEKI.engagements = [
  /* ===== 南線（塔爾尼茲／索科爾尼茲）：達武急行軍死守，反覆易手 ===== */
  // 基恩米亞前鋒最先撲塔爾尼茲(t-0.5起)，達武前鋒抵達(t0.5)後接戰
  { a:'davout', b:'kienmayer', from:0.5, to:6   },
  // 多克托洛夫第一縱隊主攻塔爾尼茲，與達武反覆爭奪直到中央被斷後南線崩
  { a:'davout', b:'dokhturov', from:0.8, to:6.5 },
  // 蘇爾特(聖海拉爾師)t6 南下抄截，夾擊南線朗熱隆第二縱隊背後
  { a:'soult',  b:'langeron',  from:6,   to:8   },

  /* ===== 中央（普拉欽高地）：★突破與近衛軍對決 ===== */
  // ★蘇爾特 t3 衝上普拉欽，克羅拉瑟第四縱隊 t3.5 回師反撲被擊退(t6 rout)
  { a:'soult',      b:'kollowrat',   from:3,   to:6   },
  // 貝爾納多特第一軍團增援中央，迎擊康斯坦丁俄國近衛軍反攻
  { a:'bernadotte', b:'const_guard', from:3.5, to:6   },
  // ★近衛對決：貝西埃爾近衛軍 t4.5 上普拉欽，迎擊俄近衛騎兵對衝至被擊退
  { a:'guard',      b:'const_guard', from:4.5, to:6   },

  /* ===== 北線（桑頓山）：防守反擊＋騎兵對衝 ===== */
  // 拉納第五軍團防守反擊巴格拉季昂右翼前鋒，將其逐出北場(t5 rout)
  { a:'lannes', b:'bagration',     from:1,   to:5   },
  // ★繆拉騎兵預備軍與列支敦斯登奧騎大規模對衝(t1.5 charge 起)
  { a:'murat',  b:'liechtenstein', from:1.5, to:5   },
];
