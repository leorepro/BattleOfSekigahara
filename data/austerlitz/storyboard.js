/* =========================================================================
 * data/austerlitz/storyboard.js — 奧斯特利茨運鏡腳本（46 鏡電影化分鏡 + 旁白）
 *   依「凱旋·三皇會戰」逐字稿（含戰前佈局篇＋會戰篇），把跳躍於南/中/北三線、
 *   且穿插沙皇／拿破崙雙視角的敘事，重整為一條「嚴格時序」的單一時間軸。
 *   ── 結構 ──
 *     序幕 10 鏡（t -7.5 ~ -0.5）：考察設陷→動態部署→沙皇撤帥誤判→定計→咬餌→隱藏底牌
 *     會戰 36 鏡（t 0 ~ 11）：拂曉霧戰→中央突破→近衛軍對決→斬腰→冰湖→北線收網→終局
 *
 *   t        對應戰場時刻（campaign 小時；會戰日鐘點 = 6 + t；t<0 為部署序幕壓縮）
 *   hold     此鏡停留秒數
 *   cam      lng,lat 注視點 / dist 距離 / az 方位 / el 仰角 / orbit 環繞 / fov 視角
 *
 *   ★地圖已放大 2 倍呈現（austerlitz config.worldScale = 1/30）：所有 dist / push
 *     皆已按 ×2 重算；近拍鏡刻意取相對更近（約 ×1.7）以更貼近單兵與接戰。
 *
 *   ── 電影化運鏡欄位（皆向後相容，未設則照舊）──
 *     cam.fov / cam2.fov : 變焦——cam2.fov<cam.fov＝zoom in（拉近壓縮）；>＝zoom out（廣角張開）
 *     cam.orbitSweep     : hold 期間以 ease 掃過的固定方位角度（旋轉運鏡，可與 fov 並用＝zoom+旋轉）
 *     cam.push           : hold 期間 dolly 推近的世界距離（正=推近 / 負=拉遠；被 cam2.dist 覆蓋）
 *     cam2.el            : 仰角終點（升＝crane up 拉升俯瞰；降＝crane down 俯衝貼地）
 *     cam2.dist          : 距離終點（大＝pull-out 拉遠；小＝dolly-in 推近）
 *     cam2.lng/lat       : 注視點平移終點（truck 橫移／跟進；僅在「未設 focusUnit」時生效）
 *     cam2.az            : 方位終點（pan 搖鏡；優先於 orbitSweep）
 *     cam.cinemaScale / cam2.cinemaScale : 子彈時間係數 0~1（慢動作）
 *     focusUnit          : 以 S.unitById(id) 活體座標為焦點（跟拍移動部隊；會覆寫 lng/lat→不可同時 truck）
 *     span               : 子彈時間鏡頭在 hold 期間推進的戰場時間跨度（小時）
 *
 *   ── 運鏡語彙（每鏡註解標出所用手法，全片用滿 26 種、避免相鄰重複）──
 *     ESTABLISH_ORBIT 廣角定場環繞 · CRANE_DOWN 俯衝降臨 · CRANE_UP 拉升揭幕
 *     TOP_DOWN_TACTICAL 戰術俯瞰搖鏡 · LOW_ANGLE_HERO 英雄低角 · PUSH_TELE 長焦推近特寫
 *     DOLLY_IN 推軌進 · DOLLY_OUT 推軌退 · DOLLY_IN_CRANE_DOWN 俯衝推近 · DOLLY_OUT_CRANE_UP 拉升退場
 *     ZOOM_IN 變焦拉近 · ZOOM_OUT 變焦張開 · ZOOM_IN_ORBIT 拉近＋旋轉 · ZOOM_OUT_ORBIT 張開＋旋轉
 *     ORBIT_SWEEP 環繞掃掠 · ORBIT_SWEEP_FAST 快速環掃 · PAN_LR 水平搖鏡 · TRUCK 橫移跟進
 *     LOW_SKIM 貼地低掠 · FOLLOW_UNIT_ORBIT 跟拍環繞 · FOLLOW_DOLLY 跟拍推進
 *     BULLET_ORBIT 子彈時間環繞 · BULLET_PUSH 子彈時間推近 · BULLET_PUSH_CRANE 子彈俯衝
 *     CRANE_DOWN_ZOOM 俯衝＋變焦 · RISE_REVEAL_ZOOMOUT 升空張開揭幕（終章）
 *   地理：普拉欽高地中央(16.762,49.118)、老葡萄園(16.772,49.128)、桑頓山(16.722,49.152)、
 *     波索里茲(16.730,49.158)、布拉奇奧維茨(16.756,49.140)、Telnitz(16.740,49.090)、
 *     Sokolnitz(16.755,49.100)、戈爾德巴赫溪(16.742,49.115)、扎錢湖(16.780,49.073)、
 *     莫尼茲湖(16.762,49.068)、Žuráň 本陣(16.722,49.156)、奧斯特利茨城堡(16.876,49.153)。
 * ======================================================================= */
window.SEKI = window.SEKI || {};

SEKI.storyboard = [
  /* ======================= 序幕·設陷·誤判·定計（t -7.5 ~ -0.5） ======================= */

  /* 01 — 三皇會戰序幕·兵力對比〔ESTABLISH_ORBIT〕 */
  { t:-7.5, hold:16, cam:{lng:16.762, lat:49.118, dist:800, az:200, el:46, orbit:0.30, fov:54}, cam2:{az:250, dist:760},
    dateLabel:"1805 年 12 月 2 日 · 摩拉維亞 · 奧斯特利茨", title_zh:"三皇會戰 · 拿破崙的陷阱",
    title_en:"The Battle of the Three Emperors",
    narration_zh:"1805 年 12 月 2 日，摩拉維亞的奧斯特利茨原野，法、俄、奧三位皇帝親臨對陣，史稱『三皇會戰』。反法聯軍由沙皇亞歷山大一世掛帥，總兵力八萬六千、火砲二七八門；法軍由拿破崙親征，僅七萬三千、火砲一三九門。兵力與砲火皆居下風的拿破崙，卻在這片濃霧鎖野之上，佈下了他軍事生涯最精巧的一座陷阱。",
    commanders:[{zh:"拿破崙一世",en:"Napoleon I"},{zh:"沙皇亞歷山大一世",en:"Tsar Alexander I"}], focus:["soult","guard","kollowrat"], side:"both" },

  /* 02 — 11/21 拿破崙親勘普拉欽·構想陷阱〔CRANE_DOWN〕 */
  { t:-7.0, hold:15, cam:{lng:16.762, lat:49.119, dist:620, az:95, el:54, orbit:0.10, fov:50}, cam2:{el:30, dist:440, az:120},
    dateLabel:"會戰前 11 天 · 11/21 · 普拉欽高地", title_zh:"十一天前的勘察 · 陷阱的雛形",
    title_en:"Eleven Days Before — Reading the Ground",
    narration_zh:"早在會戰十一天前的十一月廿一日，拿破崙便親自策馬來到普拉欽高地一帶勘察地形。在旁人眼裡這不過是一片普通高地，他卻將高地、南面的湖泊水網、西側的 Žuráň 丘與北面的桑頓山視為一個有機整體。一個巧妙的構想就此成形：故意讓出高地誘敵，待聯軍主力南調，再自中央突破、攔腰斬斷。",
    commanders:[{zh:"拿破崙一世",en:"Napoleon I"}], focus:["soult"], side:"east" },

  /* 03 — 動態部署·繆拉三梯隊前哨·腹背受敵的彈性防禦〔TOP_DOWN_TACTICAL〕 */
  { t:-6.5, hold:15, cam:{lng:16.755, lat:49.122, dist:780, az:175, el:58, orbit:0.10, fov:50}, cam2:{az:215, dist:740},
    dateLabel:"會戰前 · 法軍動態部署", title_zh:"動態部署 · 彈性的防禦系統",
    title_en:"Napoleon's Elastic Deployment",
    narration_zh:"腹背受敵的拿破崙——北有庫圖佐夫九萬、南有卡爾大公九萬，夾在中間的他僅十萬——設計了一套極富彈性的動態部署。他以繆拉五個騎兵師分成三梯隊作為前哨警戒，各軍依布爾諾至維也納間的真實路況分層配置，精算彼此支援所需的時間。無論敵人從哪個方向攻來，他都能以最快速度集中兵力迎戰。",
    commanders:[{zh:"拿破崙一世",en:"Napoleon I"},{zh:"繆拉親王",en:"Marshal Murat"}], focus:["murat","soult","lannes"], side:"east" },

  /* 04 — 雙方計畫：南包抄 vs 設餌斬腰〔TOP_DOWN_TACTICAL·pan〕 */
  { t:-6.0, hold:15, cam:{lng:16.760, lat:49.120, dist:820, az:180, el:56, orbit:0.10, fov:50}, cam2:{az:148, dist:780},
    dateLabel:"會戰前 · 雙方作戰計畫", title_zh:"我，預判了你的預判",
    title_en:"The Plans — A Trap Within a Trap",
    narration_zh:"聯軍計畫以北線牽制，集結五萬主力自普拉欽高地南下，包抄法軍單薄的右翼，切斷其通往維也納的生命線。而拿破崙早已預判此著——他以右翼少量兵力依托地形牽制，待聯軍主力盡離高地，再以中央突襲奪取制高點，將聯軍攔腰斬斷、回身南下包抄。一句話：我，預判了你的預判。",
    commanders:[{zh:"拿破崙一世",en:"Napoleon I"},{zh:"魏羅特爾",en:"Weyrother"}], focus:["dokhturov","langeron","soult"], side:"both" },

  /* 05 — 11/24 沙皇撤庫圖佐夫·親自掛帥·誆報法軍僅4-5萬〔LOW_ANGLE_HERO〕 */
  { t:-5.0, hold:15, cam:{lng:16.800, lat:49.124, dist:360, az:300, el:16, orbit:0.12, fov:42}, cam2:{az:265, dist:330},
    dateLabel:"會戰前 8 天 · 11/24 · 奧爾米茨", title_zh:"沙皇撤帥 · 致命的誤判",
    title_en:"The Tsar Dismisses Kutuzov",
    narration_zh:"二十八歲、從未上過戰場的沙皇亞歷山大一世求勝心切。十一月廿四日，他不顧老將庫圖佐夫『持重待援』的力勸，斥其怯戰，竟解除其指揮權、親自掛帥。參謀更向他保證：當面法軍最多四到五萬，而聯軍可投入八萬有餘。數量優勢的幻象，讓年輕的沙皇下定了主動進攻的決心。",
    commanders:[{zh:"沙皇亞歷山大一世",en:"Tsar Alexander I"},{zh:"庫圖佐夫",en:"Kutuzov"}], focus:["kollowrat","const_guard"], side:"west" },

  /* 06 — 三方案抉擇·選迂回右翼·參謀魏羅特爾〔DOLLY_IN〕 */
  { t:-4.2, hold:14, cam:{lng:16.764, lat:49.118, dist:460, az:100, el:34, orbit:0.10, fov:48, push:120}, cam2:{az:130},
    dateLabel:"會戰前 · 聯軍定計", title_zh:"三案取其險 · 迂回切退路",
    title_en:"The Allied Plan — Cut the Vienna Road",
    narration_zh:"擺在沙皇面前的有三案：北繞波西米亞會師、正面強攻布爾諾、或以主力迂回法軍右翼切斷其維也納退路。求功心切的他選了最具野心的第三案，並指派熟悉地形的奧地利參謀魏羅特爾草擬計畫。然而魏羅特爾並無獨立統籌十萬大軍之能，諸將更不滿其臨時編制與冗長的德語命令——無形中拖慢了全軍的行動。",
    commanders:[{zh:"沙皇亞歷山大一世",en:"Tsar Alexander I"},{zh:"魏羅特爾",en:"Weyrother"}], focusUnit:"kollowrat", focus:["kollowrat","dokhturov"], side:"west" },

  /* 07 — 11/28 巴格拉季昂突襲法軍前哨·拿破崙判主力將至·示弱〔FOLLOW_UNIT_ORBIT〕 */
  { t:-3.0, hold:14, cam:{lng:16.760, lat:49.150, dist:420, az:250, el:26, orbit:0.40, fov:46, orbitSweep:120}, cam2:{dist:360},
    dateLabel:"會戰前 4 天 · 11/28 · 北線前哨", title_zh:"黎明突襲 · 拿破崙的示弱",
    title_en:"Bagration's Dawn Probe",
    narration_zh:"十一月廿八日拂曉，巴格拉季昂率上萬人突襲法軍前哨。拿破崙早令前哨『稍作抵抗即撤』，輕騎兵迅速後退。經驗老到的他從這場黎明突襲判定：聯軍主力即將大舉來犯。於是他將計就計，刻意對沙皇的使者示弱、佯作怯戰，誘這位自信的年輕皇帝下定決心，與他決戰。",
    commanders:[{zh:"巴格拉季昂",en:"Bagration"},{zh:"拿破崙一世",en:"Napoleon I"}], focusUnit:"bagration", focus:["bagration","murat"], side:"both" },

  /* 08 — 達武 48hr/130km 強行軍·隱藏底牌〔FOLLOW_DOLLY〕 */
  { t:-2.0, hold:14, cam:{lng:16.745, lat:49.100, dist:560, az:300, el:24, orbit:0.18, fov:46, push:160}, cam2:{az:338},
    dateLabel:"決戰前夜 · 達武第三軍急行軍", title_zh:"隱藏的底牌 · 達武的行軍奇蹟",
    title_en:"Davout's Hidden March",
    narration_zh:"拿破崙的另一張底牌，是達武的第三軍。早在凌晨四點，遠在百里外的達武便奉命馳援南線——他的福利揚師在過去兩天裡強行軍一百三十公里，士兵躺下未及數小時又再度出發。這場行軍奇蹟，將為拿破崙在南線保留決勝的伏筆。",
    commanders:[{zh:"達武元帥",en:"Marshal Davout"},{zh:"拿破崙一世",en:"Napoleon I"}], focusUnit:"davout", focus:["davout"], side:"east" },

  /* 09 — 隱藏兵力於 Žuráň 視野盲區·加冕週年火把夜〔DOLLY_IN_CRANE_DOWN〕 */
  { t:-1.2, hold:15, cam:{lng:16.722, lat:49.156, dist:520, az:210, el:40, orbit:0.10, fov:48, push:170}, cam2:{el:24, az:185},
    dateLabel:"決戰前夜 · Žuráň 本陣", title_zh:"視野盲區 · 我一生中最美的夜晚",
    title_en:"Hidden Reserves & the Torchlight Night",
    narration_zh:"決戰前夜，拿破崙的底牌悄然就位。早在十天前勘察時，他便發現 Žuráň 丘後方正是高地觀察者的視野盲區，遂將第一軍、近衛軍與一個擲彈兵師共兩萬餘人盡藏其中，聯軍對其兵力暴增毫不知情。是夜恰逢他加冕一週年，士兵自發點起大片草束火把、夾道高呼萬歲——『老伯，這是我一生中最美的夜晚。』",
    commanders:[{zh:"拿破崙一世",en:"Napoleon I"},{zh:"貝西埃爾元帥",en:"Marshal Bessières"}], focus:["guard","bernadotte","oudinot"], side:"east" },

  /* 10 — 拂曉前·憑槍聲判敵·連夜加強兩村〔PAN_LR〕 */
  { t:-0.5, hold:14, cam:{lng:16.732, lat:49.140, dist:520, az:205, el:28, orbit:0.10, fov:48}, cam2:{az:165, dist:560},
    dateLabel:"拂曉前 · Žuráň 本陣", title_zh:"憑槍聲斷敵 · 連夜增防",
    title_en:"Reading the Guns in the Dark",
    narration_zh:"拂曉之前，剛巡視完近衛軍的拿破崙忽聞南線傳來零星槍聲。經驗老到的他僅憑槍聲方向，便判斷交火在塔爾尼茲至索科爾尼茲一帶——比預期更靠北。他即刻派偵察確認敵情，連夜將兩座村莊的守軍加強至兩千人。當聯軍前鋒拂曉撲來時，迎接他們的遠比情報所說的要頑強。",
    commanders:[{zh:"拿破崙一世",en:"Napoleon I"},{zh:"達武元帥",en:"Marshal Davout"}], focus:["davout","kienmayer"], side:"east" },

  /* ======================= 拂曉·南線血戰（t 0 ~ 2.6；鐘點 06:00 ~ 08:30） ======================= */

  /* 11 — 06:00 拂曉濃霧〔LOW_SKIM 貼地低掠〕 */
  { t:0, hold:15, cam:{lng:16.748, lat:49.108, dist:480, az:30, el:16, orbit:0.10, fov:50}, cam2:{lng:16.744, lat:49.095, az:55},
    dateLabel:"會戰日 · 06:00 · 戈爾德巴赫河谷", title_zh:"拂曉濃霧 · 戰幕在混沌中拉開",
    title_en:"Dawn — The Fog of Goldbach",
    narration_zh:"十二月二日清晨，戈爾德巴赫河谷籠罩在一片濃得化不開的冬霧中，部分低地能見度不足十米。只有桑頓山與普拉欽高地等少數制高點略可視物。在這白茫茫的霧海裡，你不知道大霧中何時會冒出敵人，連友軍的誤傷都成了真實的威脅。三皇會戰，就在這片混沌的霧氣中悄然打響。",
    commanders:[{zh:"庫圖佐夫",en:"Kutuzov"},{zh:"達武元帥",en:"Marshal Davout"}], focus:["kienmayer","davout"], side:"both" },

  /* 12 — 07:00 金邁爾攻塔爾尼茲：500→2000 首攻受挫〔FOLLOW_UNIT_ORBIT〕 */
  { t:0.4, hold:14, cam:{lng:16.740, lat:49.090, dist:400, az:20, el:26, orbit:0.40, fov:46, orbitSweep:130}, cam2:{dist:350},
    dateLabel:"會戰日 · 07:00 · 塔爾尼茲", title_zh:"南線首攻 · 五百變兩千",
    title_en:"Telnitz — The First Assault Repelled",
    narration_zh:"上午七時，金邁爾的五千奧軍前鋒最先撲向南線最南端的塔爾尼茲。情報說守軍不過五百，金邁爾以為半小時可下；豈料連夜增援後村中已有兩千法軍嚴陣以待。第一波猛攻被乾淨俐落地擊退——這個開場，遠不如聯軍所想的順利。",
    commanders:[{zh:"基恩米亞",en:"Kienmayer"},{zh:"達武元帥",en:"Marshal Davout"}], focusUnit:"kienmayer", focus:["kienmayer","davout"], side:"west" },

  /* 13 — 逐屋巷戰〔BULLET_PUSH 子彈時間推近·近拍〕 */
  { t:1, hold:13, cam:{lng:16.740, lat:49.091, dist:300, az:340, el:18, orbit:0.10, fov:40, push:120, cinemaScale:0.6}, cam2:{az:10, cinemaScale:0.5}, span:0.3,
    dateLabel:"會戰日 · 07:30 · 塔爾尼茲村內", title_zh:"逐屋爭奪 · 斷垣間的短兵相接",
    title_en:"House to House",
    narration_zh:"受挫的金邁爾不得不投入全部三千步兵。連續數波強攻後，奧軍終於在一小時後攻入村莊，法軍卻就地展開逐屋爭奪的短兵相接。雙方在塔爾尼茲的斷垣殘壁間反覆拉鋸，鮮血浸透了每一條巷弄。",
    commanders:[{zh:"基恩米亞",en:"Kienmayer"},{zh:"達武元帥",en:"Marshal Davout"}], focusUnit:"davout", focus:["davout","kienmayer"], side:"both" },

  /* 14 — 08:30 法軍北撤·奧軍代價慘重〔DOLLY_OUT〕 */
  { t:1.3, hold:13, cam:{lng:16.742, lat:49.094, dist:380, az:70, el:28, orbit:0.12, fov:48}, cam2:{az:108, dist:520},
    dateLabel:"會戰日 · 08:30 · 塔爾尼茲北緣", title_zh:"釘死南場 · 達武的彈性防禦",
    title_en:"Pinning the Allied Main Force",
    narration_zh:"上午八時半，法軍才逐步退出塔爾尼茲、轉向西北撤離。奧軍雖奪下村莊，卻足足耗去一個半小時、傷亡遠超預期。聯軍南線的攻勢，從一開始就被達武的彈性防禦死死拖住——而這正是拿破崙要的：把聯軍主力，牢牢釘死在南場。",
    commanders:[{zh:"達武元帥",en:"Marshal Davout"},{zh:"基恩米亞",en:"Kienmayer"}], focusUnit:"davout", focus:["davout"], side:"east" },

  /* 15 — 08:00 Žuráň 見聯軍離山·旭日加冕憶〔ZOOM_IN 望遠鏡〕 */
  { t:1.5, hold:14, cam:{lng:16.722, lat:49.156, dist:560, az:120, el:24, orbit:0.06, fov:52}, cam2:{az:104, fov:30},
    dateLabel:"會戰日 · 08:00 · Žuráň 本陣", title_zh:"望遠鏡裡的離山 · 加冕的旭日",
    title_en:"The Bait Taken — The Coronation Sun",
    narration_zh:"立於 Žuráň 本陣的拿破崙，透過望遠鏡看見大批聯軍正南離普拉欽高地，南線塔爾尼茲也傳來交火——一切正如他所料。此刻金色旭日自東面奧斯特利茨方向升起，溫暖灑遍全身，他想起今天正是加冕一週年。他要用一場大勝，作為最好的紀念。",
    commanders:[{zh:"拿破崙一世",en:"Napoleon I"},{zh:"庫圖佐夫",en:"Kutuzov"}], focus:["kollowrat","soult"], side:"east" },

  /* 16 — 蘇爾特「二十分鐘」「再等一刻鐘」〔PUSH_TELE 長焦推近特寫〕 */
  { t:1.8, hold:12, cam:{lng:16.726, lat:49.150, dist:300, az:140, el:20, orbit:0.06, fov:38, push:70}, cam2:{az:118},
    dateLabel:"會戰日 · 08:15 · Žuráň 本陣", title_zh:"那我們再等一刻鐘",
    title_en:"\"Then We Shall Wait a Quarter Hour\"",
    narration_zh:"拿破崙問第四軍軍長蘇爾特：『拿下高地，你需要多少時間？』蘇爾特答：『二十分鐘。』拿破崙微微一笑：『那我們再等一刻鐘。』——他要確認聯軍主力是否真的走得夠遠。穩妥起見，這位棋手寧可再多等片刻，讓陷阱徹底張開。",
    commanders:[{zh:"拿破崙一世",en:"Napoleon I"},{zh:"蘇爾特元帥",en:"Marshal Soult"}], focusUnit:"soult", focus:["soult"], side:"east" },

  /* 17 — 08:30 蘇爾特 17000 向高地·貝爾納多特渡溪〔FOLLOW_DOLLY〕 */
  { t:2, hold:14, cam:{lng:16.745, lat:49.122, dist:540, az:250, el:30, orbit:0.16, fov:48, push:150}, cam2:{az:286},
    dateLabel:"會戰日 · 08:30 · 戈爾德巴赫東岸", title_zh:"第四軍開進 · 直指空虛的中央",
    title_en:"Soult Advances on the Heights",
    narration_zh:"上午八時半，拿破崙判斷敵人已走得差不多，向蘇爾特下達進攻令。第四軍的旺達姆師與聖海拉爾師共一萬七千人，悄然向普拉欽高地開進；同時貝爾納多特第一軍兩個師一萬一千人向戈爾德巴赫河運動，隨時策應。然而高地上，庫圖佐夫的第四縱隊一萬三千人其實尚未下完山。",
    commanders:[{zh:"蘇爾特元帥",en:"Marshal Soult"},{zh:"貝爾納多特元帥",en:"Marshal Bernadotte"}], focusUnit:"soult", focus:["soult","bernadotte"], side:"east" },

  /* 18 — 歐德雷 900 奇襲塔爾尼茲南·碾退聯軍〔ORBIT_SWEEP_FAST〕 */
  { t:2.2, hold:14, cam:{lng:16.740, lat:49.088, dist:340, az:200, el:24, orbit:0.50, fov:44, orbitSweep:170}, cam2:{dist:300},
    dateLabel:"會戰日 · 08:30 · 塔爾尼茲南側", title_zh:"歐德雷九百人 · 霧中逆襲",
    title_en:"Heudelet's 900 Storm the Village",
    narration_zh:"達武麾下歐德雷率九百先頭部隊全速趕到，恰在塔爾尼茲失守的同一刻抵達。他循著槍聲自村莊南側殺入，此時村中兩千聯軍正搜索殘敵、順手劫掠，冷不防遭突襲。霧中辨不清來敵多少，只見法軍端起刺刀狂呼衝殺——兩千聯軍竟被九百人一路碾出了村莊。",
    commanders:[{zh:"歐德雷",en:"Heudelet"},{zh:"達武元帥",en:"Marshal Davout"}], focusUnit:"davout", focus:["davout","kienmayer"], side:"east" },

  /* 19 — 09:00 歐德雷撤·700龍騎兵反衝鋒〔BULLET_ORBIT〕 */
  { t:2.5, hold:14, cam:{lng:16.748, lat:49.097, dist:360, az:300, el:24, orbit:0.45, fov:44, orbitSweep:120, cinemaScale:0.55}, cam2:{az:350, dist:320, cinemaScale:0.45}, span:0.4,
    dateLabel:"會戰日 · 09:00 · 戈爾德巴赫河畔", title_zh:"龍騎兵反衝鋒 · 河岸的拉鋸",
    title_en:"The Dragoons' Countercharge",
    narration_zh:"聯軍很快憑數量回過神來，以驃騎兵衝擊歐德雷側翼、迫其收縮，再以步兵反攻。上午九時，激戰半小時後歐德雷被迫退向索科爾尼茲。聯軍大隊騎兵窮追過河，眼看就要將其殲滅；千鈞一髮間，南線預備隊七百龍騎兵驟然反衝鋒，將聯軍暫壓回河岸。",
    commanders:[{zh:"歐德雷",en:"Heudelet"},{zh:"基恩米亞",en:"Kienmayer"}], focusUnit:"davout", focus:["davout","kienmayer"], side:"both" },

  /* 20 — 索科爾尼茲死守·僵持〔FOLLOW_UNIT_ORBIT〕 */
  { t:2.6, hold:13, cam:{lng:16.755, lat:49.100, dist:400, az:30, el:28, orbit:0.40, fov:46, orbitSweep:110}, cam2:{dist:356},
    dateLabel:"會戰日 · 08:30 · 索科爾尼茲", title_zh:"索科爾尼茲 · 依地形死守",
    title_en:"Sokolnitz — The Stubborn Defence",
    narration_zh:"上午八時半，第二、第三縱隊的俄軍轉攻更北的索科爾尼茲村與城堡。守軍同樣約兩千法軍，靈活運用農場、樹林、沼澤為掩護，砲兵依托陣地持續輸出。儘管聯軍兵力龐大，戰局卻陷入僵持——南線，正被一寸寸地拖入泥沼。",
    commanders:[{zh:"朗熱隆",en:"Langeron"},{zh:"普熱比舍夫斯基",en:"Przybyszewski"}], focusUnit:"langeron", focus:["langeron","przyby","davout"], side:"west" },

  /* 21 — 普拉欽遭遇戰·雙方驚見彼此〔DOLLY_IN〕 */
  { t:2.8, hold:14, cam:{lng:16.760, lat:49.116, dist:440, az:250, el:26, orbit:0.12, fov:44, push:130}, cam2:{az:280},
    dateLabel:"會戰日 · 08:50 · 普拉欽高地腳", title_zh:"遭遇戰 · 霧中對視的兩軍",
    title_en:"Collision at the Foot of the Heights",
    narration_zh:"隨氣溫上升，霧氣稍散。正向普拉欽開進的法軍第四軍，與高地上的聯軍第四縱隊，幾乎同時驚見了彼此。但相比措手不及的聯軍，主動來攻的法軍顯然更有準備——拿破崙當機立斷，令已抵戈爾德巴赫河岸的第一軍一萬一千人出擊增援，蘇爾特亦調十二磅重砲火力支援。",
    commanders:[{zh:"蘇爾特元帥",en:"Marshal Soult"},{zh:"克羅拉瑟",en:"Kollowrat"}], focusUnit:"soult", focus:["soult","kollowrat"], side:"both" },

  /* 22 — ★09:00 奧斯特利茨的太陽·中央突破〔BULLET_PUSH_CRANE 招牌鏡〕 */
  { t:3, hold:16, cam:{lng:16.762, lat:49.118, dist:340, az:250, el:24, orbit:0, fov:40, push:132, cinemaScale:0.3}, cam2:{cinemaScale:0.12, el:34, az:288}, span:0.3,
    dateLabel:"會戰日 · 09:00 · 普拉欽高地", title_zh:"★ 奧斯特利茨的太陽 · 中央突破",
    title_en:"The Sun of Austerlitz — The Breakthrough",
    narration_zh:"上午九時，籠罩原野整夜的濃霧驟然撕裂，一輪冬陽自雲層噴薄而出——這便是傳奇的『奧斯特利茨的太陽』。霧散剎那，蘇爾特的旺達姆師與聖海拉爾師如出鞘利刃自高地腳下猛然湧現，直撲已被聯軍放空的普拉欽。軍刺如潮漫上脊樑——拿破崙的陷阱，就此合攏。",
    commanders:[{zh:"蘇爾特元帥",en:"Marshal Soult"},{zh:"拿破崙一世",en:"Napoleon I"}], focusUnit:"soult", focus:["soult","kollowrat","bernadotte"], side:"east" },

  /* 23 — 法軍奪普拉城堡·米羅拉多維奇反擊〔ORBIT_SWEEP〕 */
  { t:3.2, hold:14, cam:{lng:16.762, lat:49.118, dist:370, az:80, el:28, orbit:0.40, fov:44, orbitSweep:150}, cam2:{dist:320},
    dateLabel:"會戰日 · 09:10 · 普拉欽村", title_zh:"楔入的釘子 · 庫圖佐夫沉著應戰",
    title_en:"The Wedge — Miloradovich Counterattacks",
    narration_zh:"措手不及的聯軍只能臨時變陣，法軍卻搶先奪下高地南側要點普拉城堡，在高地聯軍與南線聯軍之間楔入一枚釘子。危急關頭，庫圖佐夫沉著指揮，米羅拉多維奇率六千俄軍奮力反擊，一度擊退進攻普拉欽村的法軍一個步兵營。但越來越多法軍踏上高地，壓力正排山倒海而來。",
    commanders:[{zh:"米羅拉多維奇",en:"Miloradovich"},{zh:"庫圖佐夫",en:"Kutuzov"}], focusUnit:"kollowrat", focus:["kollowrat","soult"], side:"west" },

  /* 24 — 09:20 拉納攻北·騎兵預備軍展開〔ESTABLISH_ORBIT 北線〕 */
  { t:3.33, hold:14, cam:{lng:16.730, lat:49.150, dist:560, az:230, el:32, orbit:0.16, fov:50}, cam2:{az:272, dist:520},
    dateLabel:"會戰日 · 09:20 · 北線", title_zh:"北線開打 · 拉納與繆拉的鐵騎",
    title_en:"Lannes Strikes North",
    narration_zh:"上午九時二十分，拿破崙令北線的拉納向巴格拉季昂發起進攻、伺機包抄聯軍最左翼。投入的卡法列利師與蓄歇師共一萬三千人，由小克勒曼一千二百輕騎在前開路，繆拉麾下五個騎兵師、約八千鐵騎則作為預備隊壓陣。北場的騎兵風暴，即將成形。",
    commanders:[{zh:"拉納元帥",en:"Marshal Lannes"},{zh:"巴格拉季昂",en:"Bagration"}], focusUnit:"lannes", focus:["lannes","bagration","murat"], side:"both" },

  /* 25 — 09:30 索科爾尼茲陷·卡門斯基旅回師〔PAN_LR〕 */
  { t:3.5, hold:13, cam:{lng:16.758, lat:49.108, dist:460, az:340, el:30, orbit:0.10, fov:48}, cam2:{az:24, dist:420},
    dateLabel:"會戰日 · 09:30 · 索科爾尼茲—高地間", title_zh:"卡門斯基旅自發回援",
    title_en:"Kamensky's Brigade Turns Back",
    narration_zh:"上午九時半，聯軍第二、三縱隊終於攻佔索科爾尼茲村，兩千守軍西撤匯合。耐人尋味的是，第二縱隊殿後的卡門斯基旅本已近乎下山，卻在聽到高地槍聲後自發回援——這一舉動，將為高地苦戰的聯軍緩解不少壓力。而南線總指揮布克斯赫夫登仍留六千人作預備隊按兵不動。",
    commanders:[{zh:"卡門斯基",en:"Kamensky"},{zh:"布克斯赫夫登",en:"Buxhöwden"}], focus:["langeron","kollowrat"], side:"west" },

  /* 26 — 旺達姆師奪老葡萄園·楔形深插〔DOLLY_IN_CRANE_DOWN〕 */
  { t:3.7, hold:14, cam:{lng:16.772, lat:49.128, dist:400, az:230, el:36, orbit:0.14, fov:42, push:140}, cam2:{az:266, el:24},
    dateLabel:"會戰日 · 09:45 · 老葡萄園", title_zh:"奪取老葡萄園 · 楔形深插",
    title_en:"Vandamme Takes Staré Vinohrady",
    narration_zh:"旺達姆師乘勝猛攻，奪取高地北段的制高要點『老葡萄園』，撕開聯軍中央接合部，法軍的楔形深深插入。南線下坡容易、上坡卻難，倉促回師仰攻的聯軍隊形已亂，再也無力奪回這道脊樑。拿破崙的斬腰之刃，已深嵌敵陣中央。",
    commanders:[{zh:"旺達姆",en:"Vandamme"},{zh:"蘇爾特元帥",en:"Marshal Soult"}], focusUnit:"soult", focus:["soult","kollowrat"], side:"east" },

  /* 27 — 10:00 小克勒曼誘敵·槍騎兵入隙遭排槍〔BULLET_ORBIT〕 */
  { t:4, hold:14, cam:{lng:16.745, lat:49.148, dist:360, az:260, el:24, orbit:0.50, fov:42, orbitSweep:150, cinemaScale:0.6}, cam2:{dist:320, cinemaScale:0.5}, span:0.4,
    dateLabel:"會戰日 · 10:00 · 北線", title_zh:"小克勒曼誘敵 · 隊列縫隙的排槍",
    title_en:"Kellermann's Feint",
    narration_zh:"上午十時，北線騎兵戰打響。約一千四百名聯軍槍騎兵正面猛衝小克勒曼一千二百騎。小克勒曼佯敗回收，自蓄歇師步兵隊列縫隙快速後撤；自信過頭的槍騎兵緊追入隙，迎面卻是法軍步兵幾輪近距離排槍。失去衝力的槍騎兵陷入混戰，小克勒曼趁機移師左翼重整。",
    commanders:[{zh:"小克勒曼",en:"Kellermann"},{zh:"繆拉親王",en:"Marshal Murat"}], focusUnit:"murat", focus:["murat","lannes"], side:"east" },

  /* 28 — 小克勒曼遭驃騎兵伏擊·北衝救團長〔ORBIT_SWEEP_FAST〕 */
  { t:4.2, hold:13, cam:{lng:16.748, lat:49.152, dist:340, az:300, el:22, orbit:0.50, fov:42, orbitSweep:180}, cam2:{dist:300},
    dateLabel:"會戰日 · 10:15 · 北線", title_zh:"反衝救團 · 騎兵的反覆纏鬥",
    title_en:"Kellermann Rescues His Regiment",
    narration_zh:"小克勒曼率隊反衝槍騎兵側翼，白刃格鬥中聯軍漸落下風、折損六分之一後敗退。他追擊未半，又遭約八百驃騎兵突襲右翼，最前的票騎兵團長被生擒。小克勒曼當機北撤、重整隊形，再度向南衝鋒，硬生生救回被圍的團長與部隊——這一日，他已立下足夠的戰功。",
    commanders:[{zh:"小克勒曼",en:"Kellermann"},{zh:"繆拉親王",en:"Marshal Murat"}], focusUnit:"murat", focus:["murat","liechtenstein"], side:"both" },

  /* 29 — 布拉奇奧維茨村爭奪·法軍步兵增援得手〔FOLLOW_UNIT_ORBIT〕 */
  { t:4.4, hold:13, cam:{lng:16.756, lat:49.140, dist:380, az:210, el:28, orbit:0.40, fov:46, orbitSweep:120}, cam2:{dist:336},
    dateLabel:"會戰日 · 10:20 · 布拉奇奧維茨", title_zh:"布拉奇奧維茨 · 步兵搶先到位",
    title_en:"The Fight for Blasowitz",
    narration_zh:"與此同時，拉納的先頭部隊與聯軍為爭奪要村布拉奇奧維茨纏鬥在一起。聯軍率先佔村、擊退法軍首攻，雙方各自投入騎兵增援，戰局一度膠著。最終，法軍的步兵增援先一步抵達，奪下了這座北場樞紐。",
    commanders:[{zh:"拉納元帥",en:"Marshal Lannes"},{zh:"巴格拉季昂",en:"Bagration"}], focusUnit:"lannes", focus:["lannes","bagration"], side:"east" },

  /* 30 — 高地白熱化·聖海拉爾奪普拉欽村·卡門斯基反撲城堡〔ZOOM_IN_ORBIT 拉近+旋轉〕 */
  { t:4.5, hold:14, cam:{lng:16.762, lat:49.118, dist:400, az:90, el:28, orbit:0.40, fov:50, orbitSweep:140}, cam2:{fov:36, dist:350},
    dateLabel:"會戰日 · 10:30 · 普拉欽高地", title_zh:"高地白熱化 · 普拉欽村易手",
    title_en:"The Heights at White Heat",
    narration_zh:"上午十時後，普拉欽高地的戰鬥進入白熱化。第四軍左翼旺達姆師擊退聯軍右翼，右翼聖海拉爾師攻佔普拉欽村、將當面俄軍完全擊潰；一線俄軍被迫後撤，由後排奧軍頂上前線。此時自發回援的卡門斯基旅及時趕到，反撲高地南側的普拉城堡，迫使聖海拉爾收縮右翼加強防禦——蘇爾特遂決意迂回奪取北段的老葡萄園。",
    commanders:[{zh:"聖海拉爾",en:"Saint-Hilaire"},{zh:"卡門斯基",en:"Kamensky"}], focusUnit:"soult", focus:["soult","kollowrat"], side:"both" },

  /* 31 — 小克勒曼襲聯軍砲兵·繳兩砲又遭兩千騎逼退〔ORBIT_SWEEP〕 */
  { t:4.8, hold:13, cam:{lng:16.748, lat:49.150, dist:360, az:280, el:24, orbit:0.45, fov:42, orbitSweep:130}, cam2:{dist:316},
    dateLabel:"會戰日 · 10:45 · 北線", title_zh:"覷隙襲砲 · 鋒芒太露的小克勒曼",
    title_en:"Kellermann Raids the Guns",
    narration_zh:"北線的小克勒曼先後擊退聯軍兩波騎兵後再度上線。他瞅準聯軍砲兵正專注轟擊法軍步兵，覷隙突襲其砲兵陣地，掩護的數百龍騎兵反應不及被擊退，當場繳獲兩門火砲。然而他鋒芒太露，聯軍一口氣派出兩千騎兵向他撲來；小克勒曼只得放棄繳獲的火砲、撤回己陣——這一日，他已立下足夠的戰功。",
    commanders:[{zh:"小克勒曼",en:"Kellermann"},{zh:"繆拉親王",en:"Marshal Murat"}], focusUnit:"murat", focus:["murat","liechtenstein"], side:"east" },

  /* 32 — 列支敦斯登胸甲騎兵襲戴爾龍師·火力壓制〔ZOOM_OUT_ORBIT 張開+旋轉〕 */
  { t:5, hold:13, cam:{lng:16.766, lat:49.130, dist:340, az:40, el:26, orbit:0.40, fov:36, orbitSweep:140}, cam2:{fov:54, dist:440},
    dateLabel:"會戰日 · 11:00 · 高地北側", title_zh:"胸甲騎兵撲襲 · 戴爾龍師轉向迎火",
    title_en:"Liechtenstein's Cuirassiers Probe",
    narration_zh:"列支敦斯登的第五縱隊也派出兩個胸甲騎兵團撲襲戴爾龍師左翼。法軍反應極快，左翼迅速轉向，以火力壓制胸甲騎兵，未給對方衝鋒之機。聯軍此襲雖未得手，卻迫使戴爾龍師放緩前進、行軍延遲了約半小時。",
    commanders:[{zh:"列支敦斯登親王",en:"Prince Liechtenstein"},{zh:"貝爾納多特元帥",en:"Marshal Bernadotte"}], focus:["bernadotte","liechtenstein"], side:"both" },

  /* 33 — 南蘇蒂胸甲騎兵·鋼鐵洪流〔BULLET_ORBIT〕 */
  { t:5.3, hold:13, cam:{lng:16.744, lat:49.146, dist:360, az:250, el:24, orbit:0.50, fov:42, orbitSweep:160, cinemaScale:0.5}, cam2:{dist:320, cinemaScale:0.4}, span:0.4,
    dateLabel:"會戰日 · 11:20 · 北線", title_zh:"南蘇蒂的鋼鐵洪流",
    title_en:"Nansouty's Iron Tide",
    narration_zh:"北場另一端，聯軍騎兵突進至拉納左翼側後，迫使法軍一個步兵團結成方陣。繆拉急派南蘇蒂一千五百重騎兵迎擊，其中一千是體格最壯、肉搏最強的胸甲騎兵。聯軍青裝票騎兵根本無法承受其衝擊，撤退瞬間化為一邊倒的潰敗，被一路驅逐過溪。",
    commanders:[{zh:"南蘇蒂",en:"Nansouty"},{zh:"繆拉親王",en:"Marshal Murat"}], focusUnit:"murat", focus:["murat","liechtenstein"], side:"east" },

  /* 34 — 達武余部潛繞左翼·1300奇襲8000·奪二軍旗〔ORBIT_SWEEP〕 */
  { t:5.7, hold:14, cam:{lng:16.755, lat:49.098, dist:400, az:330, el:26, orbit:0.40, fov:44, orbitSweep:110}, cam2:{az:30, dist:350},
    dateLabel:"會戰日 · 11:36 · 索科爾尼茲一帶", title_zh:"達武潛繞 · 一千三百撼八千",
    title_en:"Davout Slips Around the Left",
    narration_zh:"南線再生變數——達武的余部終於趕到。藉騎兵與殘霧掩護，他悄悄繞過聯軍最左翼。率先抵達的約一千三百法軍，竟向索科爾尼茲一帶至少八千聯軍勇猛突擊，一度將其壓回村中、奪下兩面軍旗。聯軍很快反包圍六百法軍，達武親率千餘人殺入解圍，從容退向西北——一個反擊計畫，已在他腦中醞釀。",
    commanders:[{zh:"達武元帥",en:"Marshal Davout"},{zh:"朗熱隆",en:"Langeron"}], focusUnit:"davout", focus:["davout","langeron"], side:"east" },

  /* ======================= 斬腰·收網·冰湖（t 6 ~ 8.8；鐘點 12:00 ~ 14:00） ======================= */

  /* 35 — ★11:30 法軍全控普拉欽〔DOLLY_OUT_CRANE_UP 拉升退場〕 */
  { t:6, hold:15, cam:{lng:16.762, lat:49.120, dist:440, az:210, el:30, orbit:0.10, fov:48}, cam2:{el:48, dist:680, az:248},
    dateLabel:"會戰日 · 11:30 · 普拉欽高地", title_zh:"★ 全控普拉欽 · 居高臨下",
    title_en:"The Heights Are Won",
    narration_zh:"上午十一時半，霧氣盡散，法軍第四軍已完全控制普拉欽高地，居高臨下俯瞰整個戰場。第一軍戴爾龍師抵達高地北側，利瓦德斯師、烏迪諾擲彈兵、貝西埃爾近衛軍正先後開進。拿破崙會戰計畫中最關鍵的一步——奪取中央脊樑——已然實現。",
    commanders:[{zh:"蘇爾特元帥",en:"Marshal Soult"},{zh:"拿破崙一世",en:"Napoleon I"}], focusUnit:"soult", focus:["soult","kollowrat"], side:"east" },

  /* 36 — 高地砲兵霰彈轟回援聯軍·中央崩潰〔BULLET_PUSH 俯射〕 */
  { t:6.3, hold:13, cam:{lng:16.764, lat:49.116, dist:380, az:120, el:24, orbit:0.12, fov:44, push:120, cinemaScale:0.6}, cam2:{az:95, cinemaScale:0.5}, span:0.25,
    dateLabel:"會戰日 · 12:10 · 普拉欽砲位", title_zh:"居高砲擊 · 霰彈撕碎仰攻隊列",
    title_en:"Grapeshot from the Summit",
    narration_zh:"法軍費盡氣力將砲兵拖上普拉欽之巔。居高臨下的砲口，向高地下倉促回援的聯軍縱隊傾瀉霰彈，一排排撕碎仰攻的隊列。聯軍中央在這居高的火力壓制下，徹底崩潰。",
    commanders:[{zh:"蘇爾特元帥",en:"Marshal Soult"},{zh:"克羅拉瑟",en:"Kollowrat"}], focusUnit:"fr_battery", focus:["fr_battery","kollowrat"], side:"east" },

  /* 37 — ★12:00 本陣前移普拉欽·下令南旋包抄〔TOP_DOWN_TACTICAL 環視全局〕 */
  { t:6.5, hold:14, cam:{lng:16.762, lat:49.118, dist:700, az:200, el:48, orbit:0.14, fov:50}, cam2:{az:158, dist:660},
    dateLabel:"會戰日 · 12:00 · 普拉欽指揮部", title_zh:"★ 本陣前移 · 鐵鉗南旋",
    title_en:"Napoleon Moves His HQ Forward",
    narration_zh:"正午十二時，拿破崙將指揮部自 Žuráň 前移至普拉欽高地，俯瞰全局、實施下一步殺著。他令第四軍的聖海拉爾、旺達姆兩師掉頭南下，包抄南線聯軍的後路；追擊第四縱隊之任交予貝爾納多特軍，近衛軍與擲彈兵則留守高地作預備隊。一張大網，正自高地向南收緊。",
    commanders:[{zh:"拿破崙一世",en:"Napoleon I"},{zh:"蘇爾特元帥",en:"Marshal Soult"}], focusUnit:"soult", focus:["soult","guard","langeron"], side:"east" },

  /* 38 — ★俄國近衛軍反撲·騎砲轟破方陣·鷹旗之失〔BULLET_ORBIT 大環掃〕 */
  { t:7, hold:15, cam:{lng:16.772, lat:49.126, dist:360, az:60, el:26, orbit:0.50, fov:42, orbitSweep:210, cinemaScale:0.45}, cam2:{dist:300, cinemaScale:0.32}, span:0.45,
    dateLabel:"會戰日 · 12:40 · 老葡萄園", title_zh:"★ 俄國近衛軍反撲 · 鷹旗之失",
    title_en:"The Russian Guard Strikes Back — The Lost Eagle",
    narration_zh:"拿破崙本陣前移未久，沙皇之弟康斯坦丁大公投入帝國最後的王牌——俄國近衛軍。一千五百名禁衛騎兵眨眼衝破法軍最前一個步兵營，後方兩營急結方陣；康斯坦丁卻調來騎砲兵近距霰彈，五輪轟擊後方陣崩潰，又擊潰兩個營，短時間折損法軍步兵約兩千。禁衛重騎更衝散第四線列團、奪走一面鷹旗——這是拿破崙當日少有的挫敗。",
    commanders:[{zh:"康斯坦丁大公",en:"Grand Duke Constantine"},{zh:"貝西埃爾元帥",en:"Marshal Bessières"}], focusUnit:"const_guard", focus:["const_guard","guard","bernadotte"], side:"west" },

  /* 39 — ★拉普決定性反擊·莫蘭德陣亡·奪四門火砲·俘列普寧〔BULLET_PUSH 近拍〕 */
  { t:7.3, hold:15, cam:{lng:16.770, lat:49.124, dist:320, az:90, el:20, orbit:0.10, fov:40, push:130, cinemaScale:0.35}, cam2:{az:120, cinemaScale:0.2}, span:0.3,
    dateLabel:"會戰日 · 13:00 · 老葡萄園", title_zh:"★ 拉普的決定性反擊 · 浴血覲見",
    title_en:"Rapp's Decisive Counterstroke",
    narration_zh:"危急關頭，拿破崙派貝西埃爾的近衛騎兵迎擊。混戰中俄軍一發砲彈貫穿法軍近衛獵騎兵團長莫蘭德的胸口，副官拉普將軍臨危接過指揮，率近衛騎兵與馬穆魯克騎兵反覆衝鋒，終將俄國禁衛騎兵擊潰、奪其騎砲兵四門火砲，更俘虜其指揮官列普寧親王；據說康斯坦丁本人也險些被俘。拉普渾身浴血押俘覲見拿破崙——俄國近衛軍傷亡慘重退下，普拉欽徹底易手。",
    commanders:[{zh:"拉普將軍",en:"General Rapp"},{zh:"列普寧親王",en:"Prince Repnin"}], focusUnit:"guard", focus:["guard","const_guard"], side:"east" },

  /* 40 — ★達武的反擊·五千撼四萬·索科爾尼茲反包圍〔ZOOM_IN_ORBIT 拉近+旋轉〕 */
  { t:7.5, hold:14, cam:{lng:16.755, lat:49.100, dist:400, az:330, el:26, orbit:0.40, fov:50, orbitSweep:120}, cam2:{fov:36, dist:350},
    dateLabel:"會戰日 · 13:00 · 索科爾尼茲", title_zh:"★ 達武的反擊 · 以寡擊眾",
    title_en:"Davout's Audacious Counterattack",
    narration_zh:"南線，達武也發起了反擊。他已接管南線全部法軍——約八千步兵、兩千騎兵，當面之敵卻近四萬。但達武觀察到聯軍陣型狹長、左右調動不易，短時間能投入索科爾尼茲的不過五千，遂留兩翼防禦、親率五千反攻，另遣六百人迂回村東切斷退路。聯軍措手不及，約兩千人被反包圍在村中；各縱隊缺乏協調、地形又限制橫向調動，兩次解圍皆被達武一一擊退。",
    commanders:[{zh:"達武元帥",en:"Marshal Davout"},{zh:"朗熱隆",en:"Langeron"}], focusUnit:"davout", focus:["davout","langeron","przyby"], side:"east" },

  /* 41 — ★關門合圍·聖海拉爾南下抄南線背後〔PAN_LR 搖鏡掃掠〕 */
  { t:7.8, hold:14, cam:{lng:16.766, lat:49.108, dist:520, az:250, el:36, orbit:0.14, fov:50}, cam2:{az:302, dist:480},
    dateLabel:"會戰日 · 13:20 · 高地南旋", title_zh:"★ 關門合圍 · 南北對進的鐵鉗",
    title_en:"Closing the Trap",
    narration_zh:"拿破崙的鐵鉗開始合攏。聖海拉爾、旺達姆兩師自高地南旋如關門而下，達武則由西轉攻，南線三個咬餌的縱隊陷入南北對進的鐵鉗夾擊。它們此刻才發現後路與中央俱失，已被徹底孤立在戰場南端，插翅難飛。",
    commanders:[{zh:"聖海拉爾",en:"Saint-Hilaire"},{zh:"達武元帥",en:"Marshal Davout"}], focusUnit:"soult", focus:["soult","davout","langeron"], side:"east" },

  /* 42 — ★14:00 斬腰切斷·第三縱隊覆滅〔TOP_DOWN_TACTICAL 最高俯瞰〕 */
  { t:8, hold:15, cam:{lng:16.760, lat:49.105, dist:760, az:200, el:52, orbit:0.10, fov:52}, cam2:{az:240, dist:720},
    dateLabel:"會戰日 · 14:00 · 全局俯瞰", title_zh:"★ 斬腰 · 聯軍被切成兩半",
    title_en:"The Army Cut in Two",
    narration_zh:"下午兩時，法軍自中央楔入，將聯軍切成互不相連的兩半，南線數萬人盡入合圍。普熱比舍夫斯基的整個第三縱隊被分割壓垮、成批被俘；其本人率殘部奔向科貝爾尼茲、試圖泅渡戈爾德巴赫河東岸，僅少數神奇逃生，大半淪為俘虜。",
    commanders:[{zh:"普熱比舍夫斯基",en:"Przybyszewski"},{zh:"朗熱隆",en:"Langeron"}], focus:["przyby","langeron","davout"], side:"west" },

  /* 43 — ★冰湖潰退·火砲轟冰面·破除迷思〔CRANE_DOWN_ZOOM 俯衝+變焦〕 */
  { t:8.5, hold:16, cam:{lng:16.776, lat:49.078, dist:720, az:330, el:50, orbit:0.12, fov:54}, cam2:{az:298, el:30, dist:460, fov:44},
    dateLabel:"會戰日 · 14:30 · 扎錢湖 / 莫尼茲湖", title_zh:"★ 冰湖潰退 · 萬人沉湖的真相",
    title_en:"The Frozen Lakes",
    narration_zh:"被切斷的南線聯軍全面崩潰，數萬人向南奔逃，唯一退路是結著薄冰的扎錢湖與莫尼茲湖間的狹窄隘道——最窄處僅容兩人並行。拿破崙令火砲轟向冰面與潰兵。然而後世考證：湖水僅深一米半，因此溺斃者不足兩百，真正沉沒的是約一百三十匹戰馬與三十門火砲。所謂『萬人沉湖』，不過是勝利者誇大的傳奇。",
    commanders:[{zh:"多克托洛夫",en:"Dokhturov"},{zh:"基恩米亞",en:"Kienmayer"}], focus:["dokhturov","langeron","kienmayer"], side:"west" },

  /* 44 — 14:00 北線4000騎兵包抄巴格拉季昂右翼〔ZOOM_OUT_ORBIT 張開+旋轉〕 */
  { t:8.8, hold:14, cam:{lng:16.730, lat:49.150, dist:380, az:240, el:28, orbit:0.40, fov:38, orbitSweep:130}, cam2:{fov:54, dist:520, az:306},
    dateLabel:"會戰日 · 14:00 · 北線", title_zh:"北線收網 · 四千鐵騎包抄右翼",
    title_en:"The North Folds — Bagration Driven Off",
    narration_zh:"下午兩時，北線迎來高潮。巴格拉季昂以合理的砲兵陣地與精練步兵，數度擊退法軍蓄歇師。拉納與繆拉默契配合——拉納正面持續猛攻，繆拉調三個騎兵師約四千鐵騎包抄聯軍右翼。右翼騎兵不足兩千的聯軍無力招架，騎兵被擊退、步兵側翼大開，遭法軍騎兵縱橫砍殺，傷亡慘重。",
    commanders:[{zh:"巴格拉季昂",en:"Bagration"},{zh:"繆拉親王",en:"Marshal Murat"}], focusUnit:"murat", focus:["bagration","murat","lannes"], side:"both" },

  /* ======================= 終局（t 9.5 ~ 11；黃昏 ~ 尾聲） ======================= */

  /* 45 — 15:30 全線崩潰·雙皇出逃〔DOLLY_OUT_CRANE_UP 黃昏拉升〕 */
  { t:9.5, hold:15, cam:{lng:16.770, lat:49.110, dist:560, az:300, el:34, orbit:0.14, fov:50}, cam2:{el:48, dist:780, az:262},
    dateLabel:"會戰日 · 15:30 · 全線崩潰", title_zh:"全線崩潰 · 兩位皇帝的出逃",
    title_en:"Total Collapse",
    narration_zh:"巴格拉季昂雖損失慘重，仍憑後衛戰維持住撤退秩序，循奧洛穆茨大道退去，未演成總潰。至此法軍在北線、高地、南線三條戰線全面擊敗聯軍，鎖定勝局。日暮時分，沙皇亞歷山大一世與奧皇法蘭茲二世各自倉皇出逃；據傳年輕的沙皇一度伏在馬背上痛哭失聲，自此不再親自指揮野戰。",
    commanders:[{zh:"沙皇亞歷山大一世",en:"Tsar Alexander I"},{zh:"法蘭茲二世",en:"Emperor Francis II"}], focus:["dokhturov","bagration"], side:"west" },

  /* 46 — 終局·巔峰之作·普雷斯堡和約·神羅解體〔RISE_REVEAL_ZOOMOUT 升空張開揭幕〕 */
  { t:11, hold:17, cam:{lng:16.758, lat:49.120, dist:520, az:60, el:30, orbit:0.16, fov:42}, cam2:{el:50, dist:820, az:18, fov:56},
    dateLabel:"尾聲 · 黃昏 · 奧斯特利茨戰場", title_zh:"終局 · 拿破崙的巔峰之作",
    title_en:"The Aftermath — Napoleon's Masterpiece",
    narration_zh:"此役聯軍傷亡被俘逾兩萬七千、損失火砲近兩百門，法軍僅損約八千八百。三皇會戰以拿破崙的全勝告終，被公認為他軍事生涯最完美的傑作。四日後奧皇求和，十二月廿六日簽下《普雷斯堡和約》，奧地利割地賠款、退出戰爭。翌年萊茵邦聯成立，延續八百年的神聖羅馬帝國就此終結。奧斯特利茨的太陽，照亮了法蘭西帝國的頂峰。",
    commanders:[{zh:"拿破崙一世",en:"Napoleon I"},{zh:"法蘭茲二世",en:"Emperor Francis II"}], focus:["soult","guard","murat"], side:"east" },
];
