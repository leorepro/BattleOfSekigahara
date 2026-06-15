/* =========================================================================
 * data/normandy/storyboard.js — 奧馬哈海灘運鏡腳本（逐鏡停留 + 旁白）
 *   t        對應戰場時刻（campaign 小時；1944/6/6 00:00 起算，H時=06:30）
 *   hold     此鏡停留秒數     cam  lng,lat 注視點 / dist 距離 / az 方位 / el 仰角 / orbit 環繞
 *   敘事以盟軍登陸視角為主軸，傷亡與情報爭議於史料面板註明。
 * ======================================================================= */
window.SEKI = window.SEKI || {};

SEKI.storyboard = [
  /* ---- 凌晨空降序幕（t≈1.3~4.0；內陸地名為示意，真實空降區在本圖之外） ---- */
  { t:1.3, hold:14, cam:{lng:-0.9300, lat:49.3100, dist:420, az:0, el:34, orbit:0.35},
    dateLabel:"1944/6/6 · 01:18 · 諾曼第內陸", title_zh:"★ 夜降諾曼第 · 空降序幕",
    title_en:"Night Drop — The Airborne Assault",
    narration_zh:"搶灘之前數小時，盟軍已先發制人。01:18，英軍第6空降師滑翔機奇襲奪橋；緊接著美軍 82、101 空降師的傘兵自 C-47 機群躍入黑暗。高射砲火與雲層使機群分散，傘兵散落於廣闊鄉野——他們以金屬『蟋蟀器』的蛙鳴聲在暗夜中相認集結。（畫面為示意：真實空降區在本奧馬哈地圖範圍之外。）",
    commanders:[{zh:"李奇威/泰勒",en:"Gen. Ridgway / Gen. Taylor"}], focus:["us_82","us_101","uk_6"], side:"east" },

  { t:2.4, hold:13, cam:{lng:-0.9450, lat:49.3250, dist:300, az:30, el:26, orbit:0.50},
    dateLabel:"02:24 · 內陸鎮口（示意）", title_zh:"奪鎮設障 · 截斷增援",
    title_en:"Seizing the Crossroads",
    narration_zh:"82 空降師逐屋巷戰，奪取通往灘頭的內陸要鎮（示意聖梅爾埃格利斯），在路口架設路障、埋設反戰車地雷，並切斷德軍電話線癱瘓其指揮。當德軍 352 師增援縱隊自內陸南下馳援灘頭，迎面撞上的卻是已扼住公路網的傘兵——馳援的腳步，在天亮之前就被釘死在內陸。",
    commanders:[{zh:"82空降師",en:"82nd Airborne"}], focus:["us_82","reinf_352"], side:"east" },

  { t:3.5, hold:13, cam:{lng:-0.9150, lat:49.3300, dist:280, az:200, el:30, orbit:0.55},
    dateLabel:"03:30 · 河橋（示意）", title_zh:"★ 炸橋 · 遲滯裝甲",
    title_en:"Blowing the Bridges",
    narration_zh:"德軍裝甲集結，欲沿橋路直插盟軍登陸場。英軍第6空降師搶先炸毀河上橋樑，傘兵伏擊德軍車隊、焚車塞路。裝甲縱隊在斷橋前被迫改道繞行，又遭傘兵反戰車火力打擊——這一夜的遲滯，讓灘頭德軍在天明後只能各自為戰、孤立無援。",
    commanders:[{zh:"英軍第6空降師",en:"British 6th Airborne"}], focus:["uk_6","reinf_panzer"], side:"east" },

  { t:5.6, hold:13, cam:{lng:-0.8700, lat:49.4200, dist:520, az:0, el:30, orbit:0.30},
    dateLabel:"1944/6/6 · 05:36 · 英吉利海峽", title_zh:"入侵艦隊全景",
    title_en:"The Invasion Fleet at Dawn",
    narration_zh:"D-Day 因前夜風暴推遲一天，6 月 6 日拂曉，史上最大兩棲艦隊出現在奧馬哈外海。低雲壓頂、海面湧浪不止，數千艘艦船自運輸錨地向灘頭展開。官兵在顛簸的小艇中嘔吐、待命，前方是長約六公里、被德軍 352 師據守的『血腥奧馬哈』。",
    commanders:[{zh:"布萊德雷",en:"Gen. Omar Bradley"}], focus:["usstexas","destroyers"], side:"east" },

  { t:5.9, hold:12, cam:{lng:-0.9000, lat:49.4100, dist:320, az:20, el:24, orbit:0.40},
    dateLabel:"05:54 · 火力支援區", title_zh:"艦砲齊射 · 火力準備",
    title_en:"Naval Bombardment",
    narration_zh:"戰艦德州號以 14 吋主砲與驅逐艦群展開短促的艦砲準備射擊，砲口烈焰映亮灰暗海面。然而僅 30 餘分鐘的轟擊不足以摧毀崖頂混凝土砲廓，多數德軍 WN 據點在彈幕後仍完好——這是奧馬哈悲劇的伏筆之一。",
    commanders:[{zh:"USS Texas",en:"USS Texas (BB-35)"}], focus:["usstexas"], side:"east" },

  { t:6.4, hold:12, cam:{lng:-0.8600, lat:49.3850, dist:140, az:10, el:14, orbit:0.50},
    dateLabel:"06:24 · 換乘區→灘頭", title_zh:"登陸艇貼海面前進",
    title_en:"Landing Craft Run In",
    narration_zh:"希金斯登陸艇載著首波步兵在湧浪中貼海面駛向灘頭。海水翻入艇內，官兵齊腰浸冷、暈船虛脫。與此同時，B-24 機群因低雲遮蔽延遲投彈，地毯轟炸整片落入內陸——灘頭工事毫髮無損，等待著跳板放下的那一刻。",
    commanders:[{zh:"首波步兵",en:"Assault Infantry"}], focus:["lcvp_1","lcvp_2","bombers"], side:"east" },

  { t:6.7, hold:14, cam:{lng:-0.8950, lat:49.3720, dist:120, az:200, el:30, orbit:0.70},
    dateLabel:"06:36 · Dog Green", title_zh:"★ Dog Green 屠殺",
    title_en:"Carnage on Dog Green",
    narration_zh:"跳板一放下，WN72/WN71 的交叉火網即刻掃進艇門。116 團 A 連在數分鐘內傷亡逾半，海水染紅。倖存者藏身於鋼刺蝟與屍體之間，向卵石堤匍匐。同一時刻，DD 兩棲戰車在外海投放——29 輛中有 27 輛被湧浪灌沉，火力支援近乎落空。",
    commanders:[{zh:"116團A連",en:"Co. A, 116th Inf"}], focus:["co_a_116","wn72","dd_741"], side:"both" },

  { t:7.5, hold:13, cam:{lng:-0.8470, lat:49.3760, dist:110, az:200, el:34, orbit:0.65},
    dateLabel:"07:24 · Fox Green 上方", title_zh:"WN62 · 最致命的火力點",
    title_en:"WN62 — The Deadliest Strongpoint",
    narration_zh:"科勒維爾上方崖頂的 WN62，憑兩座 75mm 砲與多挺 MG42 俯瞰整片 Easy Red 與 Fox Green。它是奧馬哈造成最大量傷亡的據點。16 團官兵被釘死在卵石堤後，潮水不斷上漲、淹過傷者。灘頭看似已成絕境。",
    commanders:[{zh:"WN62 守軍",en:"WN62 Garrison"}], focus:["wn62","inf_16th"], side:"west" },

  { t:8.6, hold:13, cam:{lng:-0.8550, lat:49.3850, dist:160, az:0, el:20, orbit:0.45},
    dateLabel:"08:36 · 近岸", title_zh:"驅逐艦抵近直射",
    title_en:"Destroyers Close the Shore",
    narration_zh:"灘頭瀕臨崩潰之際，驅逐艦群冒擱淺之險逼近至距灘僅數百碼，以平射砲逐個轟擊崖頂據點。這違令的抵近射擊，是扭轉奧馬哈戰局的關鍵——WN61、WN62 在艦砲與滲透的夾擊下開始鬆動。",
    commanders:[{zh:"驅逐艦群",en:"Destroyer Squadron"}], focus:["destroyers","wn61"], side:"east" },

  { t:10, hold:13, cam:{lng:-1.0048, lat:49.3974, dist:130, az:0, el:26, orbit:0.60},
    dateLabel:"10:00 · 奧克角", title_zh:"★ 攀崖突破 · 奧克角",
    title_en:"Scaling the Cliffs of Pointe du Hoc",
    narration_zh:"西端的奧克角，2 遊騎兵營以火箭繩鈎攀上 30 米陡崖，冒著手榴彈與機槍火力翻上崖頂。當他們衝進混凝土砲廓——卻發現威脅兩灘的 155mm 砲群早已被德軍預先後撤。遊騎兵深入內陸果園，終於找到並炸毀了這些火砲。",
    commanders:[{zh:"2遊騎兵營",en:"2nd Ranger Bn"}], focus:["rangers"], side:"east" },

  { t:12, hold:13, cam:{lng:-0.8620, lat:49.3740, dist:120, az:200, el:36, orbit:0.55},
    dateLabel:"12:00 · E-1 隘道", title_zh:"隘道打通 · 越過卵石堤",
    title_en:"Breaching the Draws",
    narration_zh:"『不待命令，向崖頂仰攻！』殘存軍官帶領官兵離開致命的灘頭，沿崖坡滲透、繞過正面火網。工兵肅清 E-1 St-Laurent 隘道的地雷與路障，第一條供裝甲上陸的通道終於打開——灘頭的死局被一寸寸撬開。",
    commanders:[{zh:"16團/工兵",en:"16th Inf / Engineers"}], focus:["inf_16th","engineers","wn68"], side:"east" },

  { t:16.5, hold:14, cam:{lng:-0.8650, lat:49.3850, dist:480, az:180, el:32, orbit:0.30},
    dateLabel:"16:30 · 灘頭鞏固 · Aftermath", title_zh:"灘頭鞏固 · 血腥奧馬哈之後",
    title_en:"Aftermath — Securing Bloody Omaha",
    narration_zh:"傍晚，灘頭縱深僅約一兩公里、淺薄而脆弱，但奧馬哈守住了。WN 據點逐個失守，352 師反擊被艦砲與滲透打退而後撤。代價極其慘重——當日奧馬哈傷亡的確切數字至今仍有爭議（約二千至四千餘）。這片血染的灘頭，成為通往內陸的橋頭堡。",
    commanders:[{zh:"第一步兵師",en:"1st & 29th Divisions"}], focus:["inf_16th","inf_352"], side:"east" },
];
