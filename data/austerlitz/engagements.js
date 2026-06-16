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
  { a:'davout', b:'kienmayer', from:0.5, to:6.5 },
  // 多克托洛夫第一縱隊主攻塔爾尼茲，與達武反覆爭奪直到中央被斷後南線崩
  { a:'davout', b:'dokhturov', from:0.8, to:6.5 },
  // 索科爾尼茲：普熱比舍夫斯基第三縱隊與達武反覆爭奪，t7.5 達武反擊反包圍其於村中
  { a:'davout', b:'przyby',    from:2.6, to:7.8 },
  // 索科爾尼茲：朗熱隆第二縱隊主攻；t7.5 達武五千大反擊
  { a:'davout', b:'langeron',  from:5.3, to:8   },
  // 蘇爾特(聖海拉爾師)t6 南下抄截，夾擊南線朗熱隆第二縱隊背後
  { a:'soult',  b:'langeron',  from:6,   to:8   },

  /* ===== 中央（普拉欽高地）：★突破與近衛軍對決 ===== */
  // ★蘇爾特 t3 衝上普拉欽，克羅拉瑟第四縱隊 t3.5 回師反撲被擊退(t6 rout)
  { a:'soult',      b:'kollowrat',   from:3,   to:6   },
  // 列支敦斯登胸甲騎兵 t5 撲襲貝爾納多特(戴爾龍師)左翼，被火力壓制
  { a:'bernadotte', b:'liechtenstein', from:5, to:6   },
  // ★近衛對決：俄國近衛軍 t7 反撲普拉欽，貝西埃爾近衛軍＋貝爾納多特迎擊至擊退(t7.8 rout)
  { a:'guard',      b:'const_guard', from:7,   to:8   },
  { a:'bernadotte', b:'const_guard', from:7,   to:8   },

  /* ===== 北線（桑頓山）：防守反擊＋騎兵對衝 ===== */
  // 拉納第五軍團防守反擊巴格拉季昂右翼前鋒，將其逐出北場(t5 rout)
  { a:'lannes', b:'bagration',     from:1,   to:5   },
  // ★繆拉騎兵預備軍與列支敦斯登奧騎大規模對衝(t1.5 charge 起)
  { a:'murat',  b:'liechtenstein', from:1.5, to:5   },
];
