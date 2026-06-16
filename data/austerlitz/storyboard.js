/* =========================================================================
 * data/austerlitz/storyboard.js — 奧斯特利茨運鏡腳本（逐鏡停留 + 旁白）
 *   t        對應戰場時刻（campaign 小時；會戰日鐘點 = 6 + t）
 *              -8~0 部署序幕 / 0 拂曉06:00 濃霧 / 3 09:00「奧斯特利茨的太陽」破雲+中央突破 /
 *              8 切斷·冰湖 / 12 終局
 *   hold     此鏡停留秒數
 *   cam      lng,lat 注視點 / dist 距離 / az 方位 / el 仰角 / orbit 環繞
 *   ── 電影化運鏡欄位（皆向後相容，未設則照舊）──
 *     cam.fov          : 鏡頭視角變焦（平滑插值；cam2.fov 為終點）
 *     cam.orbitSweep   : hold 期間以 ease 掃過的固定方位角度（取代每幀緩慢 orbit）
 *     cam.push         : hold 期間 dolly 推近的世界距離（正=推近 / 負=拉遠；被 cam2.dist 覆蓋）
 *     cam.cinemaScale  : 子彈時間係數 0~1（起始值）；cam2.cinemaScale 為終點目標
 *                        → 引擎平滑驅動 S.player.cinemaScale，主迴圈讀它乘 dt 做慢動作
 *     focusUnit        : 執行期以 S.unitById(id).group.position 為活體焦點（覆寫 lng/lat）
 *     cam2             : 鏡頭終點（az/dist/el/fov/cinemaScale 等，hold 期間平滑插值）
 *   地理：普拉欽高地中央(16.762,49.118)、桑頓山北(16.72,49.152)、Telnitz 南(16.74,49.09)、
 *     Sokolnitz(16.755,49.10)、扎錢湖南緣(16.78,49.073)、拿破崙本陣 Žuráň(16.72,49.156)。
 *   敘事以「設餌→咬餌→霧中開戰→中央突破→斬腰→冰湖→終局」謀略主線為軸。
 * ======================================================================= */
window.SEKI = window.SEKI || {};

SEKI.storyboard = [
  /* ---------------- 1. 部署序幕：三皇會戰佈局 · 設餌（t -7） ---------------- */
  { t:-7, hold:15, cam:{lng:16.760, lat:49.125, dist:360, az:205, el:36, orbit:0.40, fov:50}, cam2:{az:245, dist:340},
    dateLabel:"1805 年 12 月 2 日 · 摩拉維亞 · 奧斯特利茨", title_zh:"三皇會戰 · 拿破崙的陷阱",
    title_en:"The Battle of the Three Emperors — Napoleon's Trap",
    narration_zh:"1805 年 12 月 2 日，摩拉維亞的奧斯特利茨原野上，法蘭西、俄羅斯、奧地利三位皇帝親臨對陣。拿破崙的法軍僅七萬餘，聯軍卻有近九萬。然而拿破崙刻意示弱——他主動讓出戰場中央的普拉欽高地，又把右翼南線擺得單薄殘破，引誘聯軍把主力南調，去包抄他『脆弱』的側翼。這片霧鎖的原野，是一座精心設計的陷阱。",
    commanders:[{zh:"拿破崙一世",en:"Napoleon I"},{zh:"蘇爾特元帥",en:"Marshal Soult"}], focus:["soult","guard","davout"], side:"east" },

  /* ---------------- 2. 推鏡普拉欽高地：中央誘餌（t -3） ---------------- */
  { t:-3, hold:14, cam:{lng:16.764, lat:49.119, dist:240, az:95, el:34, orbit:0.22, fov:46}, cam2:{az:135, dist:210},
    dateLabel:"會戰前 · 03:00 · 普拉欽高地", title_zh:"普拉欽高地 · 空虛的誘餌",
    title_en:"The Pratzen Heights — The Bait",
    narration_zh:"普拉欽高地是整片戰場的脊樑，居高臨下、俯瞰四方，誰據此處誰就掌握全局。聯軍第四縱隊兩萬四千人正駐守於此，米羅拉多維奇與克羅拉瑟的奧俄聯軍據險而立。法軍中央在高地腳下顯得異常單薄——這正是拿破崙故意留下的破綻。他要聯軍相信中央唾手可得，誘他們離開這道脊樑南下。",
    commanders:[{zh:"克羅拉瑟",en:"Kollowrat"},{zh:"米羅拉多維奇",en:"Miloradovich"}], focusUnit:"kollowrat", focus:["kollowrat"], side:"west" },

  /* ---------------- 3. 跟拍聯軍南調：咬餌（t 0.5） ---------------- */
  { t:0.5, hold:14, cam:{lng:16.752, lat:49.095, dist:300, az:25, el:32, orbit:0.18, fov:50}, cam2:{az:60, dist:270},
    dateLabel:"會戰日 · 06:30 · 南線 Telnitz / Sokolnitz", title_zh:"聯軍南下咬餌 · 四縱隊離山",
    title_en:"The Allies Take the Bait — Columns March South",
    narration_zh:"拂曉時分，聯軍的計畫展開：多克托洛夫、朗熱隆、普雷斯比斯維斯基三個縱隊，連同基恩米亞的左翼前鋒，渡過戈爾德巴赫溪，撲向南線的塔爾尼茲與索科爾尼茲。更致命的是——連據守中央的第四縱隊也奉命離開普拉欽高地，南調支援。聯軍主力如潮水般湧向南方，正一步步走進拿破崙的口袋。中央，就此空了。",
    commanders:[{zh:"多克托洛夫",en:"Dokhturov"},{zh:"朗熱隆",en:"Langeron"},{zh:"基恩米亞",en:"Kienmayer"}], focus:["dokhturov","langeron","kienmayer"], side:"west" },

  /* ---------------- 4. 北線騎兵對衝：繆拉 vs 列支敦斯登（t 1.5 · 子彈時間） ---------------- */
  { t:1.5, hold:14, cam:{lng:16.748, lat:49.150, dist:200, az:240, el:30, orbit:0.50, fov:44, orbitSweep:120}, cam2:{az:300, dist:160, cinemaScale:0.5}, span:0.5,
    dateLabel:"會戰日 · 07:30 · 北線", title_zh:"北線騎兵對衝 · 繆拉的鐵騎",
    title_en:"The Cavalry Clash in the North",
    narration_zh:"戰場北端，巴格拉季昂猛攻桑頓山，列支敦斯登親王率四千六百奧地利騎兵殺向法軍接合部。拿破崙的騎兵預備軍司令——『歐洲第一勇士』繆拉親王，率七千四百鐵騎迎頭撞上。胸甲騎兵的鋼鐵洪流與奧地利驃騎兵在平原上轟然對撞，馬蹄踏起的塵土遮蔽了北場。鏡頭環繞著這場騎兵的對決，時間在刀光中緩緩凝滯。",
    commanders:[{zh:"繆拉親王",en:"Marshal Murat"},{zh:"列支敦斯登親王",en:"Prince Liechtenstein"}], focusUnit:"murat", focus:["murat","liechtenstein","bagration"], side:"both" },

  /* ---------------- 5. ★霧散瞬間 · 太陽破雲 · 中央突破（t 3 · 最高潮 · 子彈時間） ---------------- */
  { t:3, hold:15, cam:{lng:16.762, lat:49.118, dist:170, az:250, el:28, orbit:0, fov:38, push:64, cinemaScale:0.35}, cam2:{cinemaScale:0.12, el:34, az:285}, span:0.3,
    dateLabel:"會戰日 · 09:00 · 普拉欽高地", title_zh:"★ 奧斯特利茨的太陽 · 中央突破",
    title_en:"The Sun of Austerlitz — The Breakthrough",
    narration_zh:"上午九時，籠罩原野整夜的濃霧驟然撕裂，一輪冬陽自雲層中噴薄而出——這就是傳奇的『奧斯特利茨的太陽』。霧散的剎那，蘇爾特元帥的兩萬三千大軍，旺達姆師與聖海拉爾師，如出鞘利刃自高地腳下猛然湧現，直撲已被聯軍放空的普拉欽高地。拿破崙立於 Žuráň 本陣冷冷下令：『一個猛攻，戰爭就結束了。』法軍的軍刺如潮水般漫上脊樑——陷阱，合攏了。",
    commanders:[{zh:"蘇爾特元帥",en:"Marshal Soult"},{zh:"拿破崙一世",en:"Napoleon I"}], focusUnit:"soult", focus:["soult","kollowrat","bernadotte"], side:"east" },

  /* ---------------- 6. 俄國近衛軍反攻普拉欽 · 被擊退（t 4.5 · orbit 環繞） ---------------- */
  { t:4.5, hold:14, cam:{lng:16.768, lat:49.122, dist:185, az:60, el:30, orbit:0.50, fov:42, orbitSweep:200}, cam2:{dist:150, cinemaScale:0.4}, span:0.45,
    dateLabel:"會戰日 · 10:30 · 普拉欽高地", title_zh:"俄國近衛軍反撲 · 孤注一擲",
    title_en:"The Russian Guard's Desperate Charge",
    narration_zh:"眼見中央崩潰，沙皇之弟康斯坦丁大公投入了帝國最後的王牌——俄國近衛軍。一萬餘步騎悍然反撲，近衛騎兵的鐵蹄一度衝散了法軍陣線，奪回部分高地。千鈞一髮之際，拿破崙令貝西埃爾的法蘭西近衛軍與貝爾納多特軍迎擊。兩支歐洲最精銳的衛隊在普拉欽之巔正面對撞，俄國近衛軍終被擊潰退下。鏡頭環繞著這場帝王衛隊的決鬥。",
    commanders:[{zh:"康斯坦丁大公",en:"Grand Duke Constantine"},{zh:"貝西埃爾元帥",en:"Marshal Bessières"}], focusUnit:"const_guard", focus:["const_guard","guard","bernadotte"], side:"both" },

  /* ---------------- 7. 斬腰：法軍控制高地 · 聯軍被切兩半（t 6.5 · 俯瞰） ---------------- */
  { t:6.5, hold:14, cam:{lng:16.762, lat:49.110, dist:320, az:200, el:42, orbit:0.16, fov:50}, cam2:{az:245, dist:300},
    dateLabel:"會戰日 · 12:30 · 全局俯瞰", title_zh:"斬腰 · 聯軍被切成兩半",
    title_en:"Cutting the Allied Army in Two",
    narration_zh:"法軍牢牢掌控了普拉欽高地——這道脊樑如一柄利刃，將聯軍攔腰斬斷。北面的巴格拉季昂被拉納與繆拉逐出戰場，向奧洛穆茨退卻；而南線那三個咬餌的縱隊，此刻發現後路與中央俱失，徹底被孤立在戰場南端。蘇爾特的聖海拉爾師更掉頭南下，自高地居高臨下抄向聯軍背後。一張大網，正從高地向南收緊。",
    commanders:[{zh:"蘇爾特元帥",en:"Marshal Soult"},{zh:"拿破崙一世",en:"Napoleon I"}], focus:["soult","kollowrat","dokhturov"], side:"east" },

  /* ---------------- 8. ★冰湖潰敗 · 破除迷思（t 8.5 · 高 el 俯瞰） ---------------- */
  { t:8.5, hold:15, cam:{lng:16.776, lat:49.080, dist:340, az:330, el:48, orbit:0.14, fov:52}, cam2:{az:295, dist:320},
    dateLabel:"會戰日 · 14:30 · 扎錢湖", title_zh:"★ 冰湖潰敗 · 火砲轟冰面",
    title_en:"The Frozen Lakes — The Rout",
    narration_zh:"被切斷的南線聯軍全面崩潰，數萬俄奧官兵向南奔逃，唯一的退路是結著薄冰的扎錢湖。法軍在普拉欽高地架起火砲，砲彈轟向冰面。歷史上拿破崙宣稱兩萬人葬身冰湖、數千人溺斃；然而後世學者考證湖底，戰後實際打撈起的屍體僅二、三具——所謂『萬人沉湖』，多是勝利者誇大的傳奇。但聯軍南線就此灰飛煙滅，已是不爭的事實。",
    commanders:[{zh:"多克托洛夫",en:"Dokhturov"},{zh:"基恩米亞",en:"Kienmayer"}], focus:["dokhturov","langeron","kienmayer"], side:"west" },

  /* ---------------- 9. 終局：雪中巡視 · 普雷斯堡和約（t 11） ---------------- */
  { t:11, hold:15, cam:{lng:16.758, lat:49.120, dist:330, az:60, el:44, orbit:0.16, fov:52}, cam2:{az:25, dist:360},
    dateLabel:"尾聲 · 黃昏 · 奧斯特利茨戰場", title_zh:"終局 · 拿破崙的巔峰之作",
    title_en:"The Aftermath — Napoleon's Masterpiece",
    narration_zh:"日落時分，雪花飄落在屍橫遍野的原野上，拿破崙策馬巡視戰場。此役聯軍傷亡與被俘逾兩萬七千，法軍僅損約九千。三皇會戰以拿破崙的全勝告終——這被公認為他軍事生涯最完美的傑作。四日後，奧皇法蘭茲二世求和，簽下《普雷斯堡和約》；俄軍殘部黯然東撤，第三次反法同盟就此瓦解。奧斯特利茨的太陽，照亮了法蘭西帝國的頂峰。",
    commanders:[{zh:"拿破崙一世",en:"Napoleon I"},{zh:"法蘭茲二世",en:"Emperor Francis II"}], focus:["soult","guard","murat"], side:"east" },
];
