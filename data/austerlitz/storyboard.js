/* =========================================================================
 * data/austerlitz/storyboard.js — 奧斯特利茨運鏡腳本（逐鏡停留 + 旁白）
 *   ※ Phase 0 placeholder（1 鏡讓節目模式可跑）；Phase 7 (Task 7.1) 補全謀略主線運鏡。
 * ======================================================================= */
window.SEKI = window.SEKI || {};

SEKI.storyboard = [
  { t:-8, hold:14, cam:{lng:16.76, lat:49.13, dist:340, az:200, el:34, orbit:0.4, fov:50}, cam2:{az:235, dist:360},
    dateLabel:"1805 年 12 月 2 日 · 摩拉維亞 · 奧斯特利茨", title_zh:"三皇會戰 · 拿破崙的陷阱",
    title_en:"The Battle of the Three Emperors",
    narration_zh:"1805 年 12 月 2 日清晨，摩拉維亞的奧斯特利茨原野籠罩在濃霧之中。法蘭西、俄羅斯、奧地利三位皇帝親臨戰場。拿破崙故意讓出戰場中央的普拉欽高地，示弱右翼，誘使聯軍主力南下——這是一個精心設計的陷阱。",
    commanders:[{zh:"拿破崙一世",en:"Napoleon I"}], focus:["soult"], side:"west" },
];
