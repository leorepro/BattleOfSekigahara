/* =========================================================================
 * data/normandy/armies.js — 奧馬哈海灘雙方部隊（1944/6/6 D-Day）
 *   side : 'east'(盟軍/藍) | 'west'(德軍/紅)
 *   kind : warship/landingcraft/aircraft/armor/bunker/flak/infantry/artillery
 *          （驅動現代兵種特效；buildUnitMesh 依此繪製）
 *   crest: 現代戰役無家紋，一律 null
 *   track: 關鍵影格 {t, lng, lat, s, st}
 *     t  = 距 1944/6/6 00:00 的小時數（H時=06:30，t=6.5）
 *          5.5≈艦砲準備·空襲、6.0≈登陸艇放下、6.5≈首波搶灘、
 *          8.5≈驅逐艦抵近、10≈攀崖、12≈隘道打通、13+≈WN 失守、16~18≈鞏固
 *     s  = 兵力（員額/載具當量）  st = hold/march/attack/rout/breakthrough
 *   ※ 數字為依通說與近年研究之代表值（見史料面板，傷亡數字有爭議）。
 *   ※ 北(高 lat)=外海，南(低 lat)=內陸；盟軍由海向灘再向崖頂推進。
 * ======================================================================= */
window.SEKI = window.SEKI || {};

SEKI.armies = [
  /* ============================ 空降師（藍 · east · 凌晨先於搶灘） ============================
   *   ※ 史實空降區在本奧馬哈地圖 bbox 之外（聖梅爾埃格利斯 lng≈-1.32、卡宏唐 lng≈-1.25、
   *      英軍奧恩河 lng≈-0.27 皆超出 DEM/衛星圖範圍）。此處為「示意性」配置：將空降單位
   *      放在地圖『內陸—偏西邊緣』(lng -0.92~-0.95、lat 49.30~49.34)，代表奧馬哈後方
   *      通往 Vierville/Saint-Laurent 出灘口、並往 Isigny/Carentan 的公路網，藉以演出
   *      『傘兵 01:30 夜降→佔領道路節點→截斷德軍增援』的時間線。座標非真實落點。
   *   ※ 空降約 01:30(t≈1.5) 開始，早於 H 時(06:30=t6.5)。 */
  { id:"us_101", name_zh:"101空降師·呼嘯山鷹", name_ja:"101st Airborne Division", name_en:"101st Airborne 'Screaming Eagles'", side:'east', kind:'infantry', crest:null,
    title:"盟軍 空降 · 奪內陸出灘口·掩護奧馬哈/猶他灘後方（示意位置）", troops:6600, spawnAt:1.5,
    track:[
      { t:1.4, lng:-0.9300,lat:49.3050,s:6600,st:'march' },   // 01:24 全師夜降諾曼第內陸·空投兵力投入（示意內陸偏西）
      { t:1.8, lng:-0.9350,lat:49.3150,s:6450,st:'march' },   // 散落廣闊、落水與著陸傷亡·黑暗中以蟋蟀器集結
      { t:3.0, lng:-0.9400,lat:49.3250,s:6300,st:'attack' },  // 奪取通往出灘口的堤道與路口·夜戰折損
      { t:5.0, lng:-0.9350,lat:49.3300,s:6150,st:'hold' },    // H時前已扼守奧馬哈後方公路網
      { t:9.0, lng:-0.9300,lat:49.3380,s:6050,st:'attack' },  // 牽制·阻德軍經內陸道路增援灘頭
      { t:14,  lng:-0.9250,lat:49.3500,s:5900,st:'attack' },  // 與出灘部隊向縱深會合
      { t:18,  lng:-0.9200,lat:49.3600,s:5800,st:'hold' },    // D-Day 夜鞏固內陸聯絡線·全日約折損 800
      // ── D+1（6/7）：與灘頭部隊會合·繼續內陸牽制 ──
      { t:24,  lng:-0.9150,lat:49.3550,s:5750,st:'hold' },    // 6/7 凌晨守住內陸路口·整補
      { t:30,  lng:-0.9080,lat:49.3500,s:5680,st:'march' },   // 上午與灘頭出灘部隊會師·拓展登陸場縱深
      { t:38,  lng:-0.9000,lat:49.3450,s:5600,st:'attack' },  // 午後向 Isigny/Carentan 方向牽制德軍
      { t:46,  lng:-0.8950,lat:49.3420,s:5550,st:'hold' },    // 6/7 夜鞏固聯絡線·掩護奧馬哈/猶他灘間隙
    ]},
  { id:"us_82", name_zh:"82空降師·全美師", name_ja:"82nd Airborne Division", name_en:"82nd Airborne 'All American'", side:'east', kind:'infantry', crest:null,
    title:"盟軍 空降 · 聖梅爾埃格利斯·截斷德軍橫向增援（示意位置）", troops:7400, spawnAt:1.5,
    track:[
      { t:1.5, lng:-0.9450,lat:49.3100,s:7400,st:'march' },   // 01:30 全師夜降·部分落入泛濫的梅爾德雷沼澤溺斃
      { t:2.2, lng:-0.9480,lat:49.3200,s:7150,st:'attack' },  // 奪內陸鎮（示意聖梅爾埃格利斯）·落水與巷戰傷亡
      { t:4.0, lng:-0.9450,lat:49.3300,s:7000,st:'hold' },    // 設路障·扼守通往灘頭的要道
      { t:6.0, lng:-0.9420,lat:49.3320,s:6900,st:'attack' },  // H時前後正面阻擊德軍增援縱隊
      { t:11,  lng:-0.9400,lat:49.3400,s:6800,st:'attack' },  // 持續遲滯352/91師往奧馬哈集結
      { t:18,  lng:-0.9380,lat:49.3520,s:6700,st:'hold' },    // D-Day 守住內陸鎮·全日約折損 700
      // ── D+1（6/7）：固守內陸鎮·與灘頭部隊會合 ──
      { t:24,  lng:-0.9370,lat:49.3500,s:6650,st:'hold' },    // 6/7 凌晨固守內陸鎮·擊退德軍夜間反撲
      { t:30,  lng:-0.9320,lat:49.3470,s:6580,st:'attack' },  // 上午肅清殘餘德軍·拓展登陸場
      { t:38,  lng:-0.9260,lat:49.3440,s:6520,st:'march' },   // 午後與灘頭部隊會師·繼續內陸牽制
      { t:46,  lng:-0.9200,lat:49.3420,s:6480,st:'hold' },    // 6/7 夜鞏固·屏障奧馬哈灘後方
    ]},
  { id:"uk_6", name_zh:"英軍第6空降師", name_ja:"6th Airborne Division (UK)", name_en:"British 6th Airborne", side:'east', kind:'infantry', crest:null,
    title:"盟軍 空降 · 奪橋與炸橋·屏障東翼遲滯裝甲（示意位置）", troops:5000, spawnAt:1.5,
    track:[
      { t:1.3, lng:-0.9200,lat:49.3000,s:5000,st:'attack' },  // 01:18 滑翔機奇襲奪橋（示意佩加索斯橋）·全師空降投入
      { t:2.0, lng:-0.9180,lat:49.3100,s:4850,st:'hold' },    // 控制橋樑·滑翔機著陸與守橋傷亡
      { t:3.5, lng:-0.9150,lat:49.3180,s:4700,st:'attack' },  // 炸毀河上橋樑·遲滯德軍裝甲反擊
      { t:6.0, lng:-0.9120,lat:49.3220,s:4600,st:'hold' },    // H時前已扼守東翼渡口
      { t:12,  lng:-0.9100,lat:49.3320,s:4550,st:'hold' },    // 頂住德軍裝甲試探·屏障側翼
      { t:18,  lng:-0.9080,lat:49.3420,s:4500,st:'hold' },    // D-Day 全日約折損 500
      // ── D+1（6/7）：固守東翼橋頭堡·屏障側翼 ──
      { t:24,  lng:-0.9070,lat:49.3400,s:4470,st:'hold' },    // 6/7 凌晨頂住德軍裝甲夜間反撲
      { t:32,  lng:-0.9050,lat:49.3380,s:4430,st:'attack' },  // 上午擊退反撲·守住東翼渡口
      { t:40,  lng:-0.9030,lat:49.3370,s:4400,st:'hold' },    // 午後鞏固橋頭堡·待登陸場連成一線
      { t:46,  lng:-0.9020,lat:49.3360,s:4380,st:'hold' },    // 6/7 夜屏障東側·遲滯德軍裝甲
    ]},

  /* ============================ 盟軍（藍 · east） ============================ */
  { id:"usstexas", name_zh:"戰艦德州號", name_ja:"USS Texas (BB-35)", name_en:"USS Texas", side:'east', kind:'warship', crest:null,
    title:"盟軍 火力支援 · 14吋主砲 · 外海西段", troops:80,
    track:[
      { t:5.5, lng:-0.9000,lat:49.4350,s:80, st:'attack' },   // H時前艦砲準備射擊
      { t:6.4, lng:-0.9000,lat:49.4350,s:80, st:'attack' },   // 持續壓制岸防
      { t:8.5, lng:-0.9050,lat:49.4250,s:80, st:'attack' },   // 抵近以延伸主砲射程
      { t:12,  lng:-0.9050,lat:49.4250,s:80, st:'attack' },   // 轟擊 Vierville 隘口工事
      { t:18,  lng:-0.9000,lat:49.4350,s:80, st:'hold' },     // 傍晚火力支援漸歇
      // ── D+1（6/7）：持續火力支援·轉移目標至內陸縱深 ──
      { t:24,  lng:-0.9000,lat:49.4350,s:80, st:'hold' },     // 6/7 凌晨於外海待命·應請求支援
      { t:32,  lng:-0.9050,lat:49.4250,s:80, st:'attack' },   // 上午主砲延伸轟擊 Trévières/內陸德軍集結
      { t:42,  lng:-0.9000,lat:49.4400,s:80, st:'hold' },     // 午後火力支援漸歇·掩護登陸場擴張
    ]},
  { id:"destroyers", name_zh:"驅逐艦群", name_ja:"Destroyer Squadron", name_en:"Destroyers", side:'east', kind:'warship', crest:null,
    title:"盟軍 抵近直射 · 冒擱淺險近岸轟擊據點", troops:9,
    track:[
      { t:5.5, lng:-0.8650,lat:49.4250,s:9, st:'hold' },     // 待命
      { t:8.5, lng:-0.8600,lat:49.4000,s:9, st:'march' },    // 違令抵近
      { t:9.5, lng:-0.8550,lat:49.3850,s:9, st:'attack' },   // 近岸直射 WN61/WN62
      { t:12,  lng:-0.8550,lat:49.3850,s:9, st:'attack' },   // 逐個拔除據點·扭轉戰局
      { t:16,  lng:-0.8600,lat:49.3950,s:9, st:'hold' },
      // ── D+1（6/7）：轉移火力·支援內陸推進 ──
      { t:24,  lng:-0.8600,lat:49.4000,s:9, st:'hold' },     // 6/7 凌晨於近岸待命·掩護灘頭運補
      { t:34,  lng:-0.8550,lat:49.3900,s:9, st:'attack' },   // 上午抵近直射殘餘德軍火力點·支援出灘推進
      { t:44,  lng:-0.8650,lat:49.4000,s:9, st:'hold' },     // 午後火力支援轉為內陸縱深·登陸場已穩固
    ]},
  // ── B-24「解放者」轟炸機：拆成 6 架各自獨立的單機，各有自己的進場方向、航線與時段 ──
  // 不再是一個剛性編隊整體移動；每架單獨進場、各飛各的折返來回，彼此不平行也不同步。
  // models.js 的 aircraft() 將改回單機精細模型，故每個 bomber 單位＝一架 B-24。
  // 1 號機（保留 id:"bombers" 供 storyboard/events 既有 focus）：西→東領隊，H 時前首批進場
  { id:"bombers", name_zh:"B-24「解放者」01 號（領隊）", name_ja:"B-24 Liberator #01", name_en:"B-24 Liberator #01", side:'east', kind:'aircraft', crest:null,
    title:"盟軍 第八航空隊 · 領隊機 H 時前首批地毯轟炸·西→東掠灘", troops:36,
    track:[ // 全程移動·單機西→東進場後多趟折返(yoff 飛行高度由 effects 處理)
      { t:5.8, lng:-0.9700,lat:49.4080,s:36, st:'march' },    // 自海上最西端進場·領頭
      { t:6.0, lng:-0.9000,lat:49.3870,s:36, st:'attack' },   // 雲層遮蔽·延遲投彈
      { t:6.2, lng:-0.8400,lat:49.3960,s:36, st:'attack' },   // 炸彈落入內陸·灘頭工事完好
      { t:6.5, lng:-0.8050,lat:49.4090,s:36, st:'march' },    // 掠至東端·拉高轉向
      { t:6.9, lng:-0.8600,lat:49.3900,s:36, st:'attack' },   // 折返再炸內陸目標
      { t:7.3, lng:-0.9300,lat:49.4070,s:36, st:'march' },    // 抵西端轉向
      { t:7.9, lng:-0.8500,lat:49.3920,s:36, st:'attack' },   // 上午支援突破·炸德軍預備隊
      { t:8.6, lng:-0.8050,lat:49.4080,s:36, st:'march' },    // 東端轉向
      { t:9.6, lng:-0.8800,lat:49.3900,s:36, st:'attack' },   // 配合步兵·壓制縱深
      { t:10.8,lng:-0.9600,lat:49.4080,s:36, st:'march' },    // 長程西飛轉向
      { t:12.6,lng:-0.8600,lat:49.3910,s:36, st:'attack' },   // 午後最後一趟掠灘投彈
      { t:13.0,lng:-0.8000,lat:49.4090,s:36, st:'march' },    // 任務完成·向東返航
    ]},
  // 2 號機：東→西反向進場，與 1 號錯開約 0.2h，斜切內陸
  { id:"bomber_2", name_zh:"B-24「解放者」02 號", name_ja:"B-24 Liberator #02", name_en:"B-24 Liberator #02", side:'east', kind:'aircraft', crest:null,
    title:"盟軍 第八航空隊 · 02 號機 東→西反向進場·斜切內陸投彈", troops:36,
    track:[
      { t:6.0, lng:-0.8000,lat:49.4100,s:36, st:'march' },    // 自東端外海進場(反向)
      { t:6.3, lng:-0.8500,lat:49.3900,s:36, st:'attack' },   // 斜切下壓·炸灘後砲兵陣地
      { t:6.6, lng:-0.9100,lat:49.3970,s:36, st:'attack' },   // 續炸西段內陸交通線
      { t:6.9, lng:-0.9600,lat:49.4090,s:36, st:'march' },    // 西端拉高轉向
      { t:7.4, lng:-0.8900,lat:49.3890,s:36, st:'attack' },   // 折返東飛·壓制德軍縱深
      { t:7.9, lng:-0.8200,lat:49.4080,s:36, st:'march' },    // 東端轉向
      { t:8.8, lng:-0.8700,lat:49.3910,s:36, st:'attack' },   // 上午切斷增援道路
      { t:9.7, lng:-0.9500,lat:49.4070,s:36, st:'march' },    // 西端轉向
      { t:11.2,lng:-0.8500,lat:49.3920,s:36, st:'attack' },   // 午前炸反擊集結地
      { t:12.4,lng:-0.8000,lat:49.4090,s:36, st:'march' },    // 向東脫離返航
    ]},
  // 3 號機：西偏內陸進場，較晚(6.3)·航線偏南壓內陸縱深
  { id:"bomber_3", name_zh:"B-24「解放者」03 號", name_ja:"B-24 Liberator #03", name_en:"B-24 Liberator #03", side:'east', kind:'aircraft', crest:null,
    title:"盟軍 第八航空隊 · 03 號機 西進場·偏南壓制內陸縱深", troops:36,
    track:[
      { t:6.3, lng:-0.9550,lat:49.4000,s:36, st:'march' },    // 自西進場·航高略低
      { t:6.6, lng:-0.8800,lat:49.3850,s:36, st:'attack' },   // 深入灘後·炸德軍集結
      { t:6.9, lng:-0.8200,lat:49.3950,s:36, st:'attack' },   // 內陸交通樞紐
      { t:7.2, lng:-0.8050,lat:49.4070,s:36, st:'march' },    // 東端轉向
      { t:7.8, lng:-0.8700,lat:49.3870,s:36, st:'attack' },   // 折返·西段崖線目標
      { t:8.4, lng:-0.9400,lat:49.4060,s:36, st:'march' },    // 西端轉向
      { t:9.4, lng:-0.8600,lat:49.3880,s:36, st:'attack' },   // 上午壓制預備隊
      { t:10.6,lng:-0.8100,lat:49.4080,s:36, st:'march' },    // 東端轉向
      { t:11.8,lng:-0.8800,lat:49.3890,s:36, st:'attack' },   // 午後炸縱深集結
      { t:12.8,lng:-0.9500,lat:49.4090,s:36, st:'march' },    // 西飛脫離返航
    ]},
  // 4 號機：東進場·較晚(6.6)·偏外海高航線·快速來回
  { id:"bomber_4", name_zh:"B-24「解放者」04 號", name_ja:"B-24 Liberator #04", name_en:"B-24 Liberator #04", side:'east', kind:'aircraft', crest:null,
    title:"盟軍 第八航空隊 · 04 號機 東進場·偏外海高航線·快速折返", troops:36,
    track:[
      { t:6.6, lng:-0.8050,lat:49.4100,s:36, st:'march' },    // 自東端外海進場
      { t:6.85,lng:-0.8600,lat:49.3920,s:36, st:'attack' },   // 下壓掠灘投彈
      { t:7.1, lng:-0.9300,lat:49.4000,s:36, st:'attack' },   // 西段灘後目標
      { t:7.4, lng:-0.9650,lat:49.4090,s:36, st:'march' },    // 西端轉向
      { t:8.0, lng:-0.8800,lat:49.3910,s:36, st:'attack' },   // 折返·炸內陸砲位
      { t:8.7, lng:-0.8100,lat:49.4090,s:36, st:'march' },    // 東端轉向
      { t:9.9, lng:-0.8900,lat:49.3900,s:36, st:'attack' },   // 上午支援突破
      { t:11.0,lng:-0.9550,lat:49.4080,s:36, st:'march' },    // 西端轉向
      { t:12.2,lng:-0.8700,lat:49.3920,s:36, st:'attack' },   // 午後最後投彈
      { t:12.9,lng:-0.8050,lat:49.4100,s:36, st:'march' },    // 向東脫離返航
    ]},
  // 5 號機：最西外海進場·最晚首批(6.6)·大弧線長程折返
  { id:"bomber_5", name_zh:"B-24「解放者」05 號", name_ja:"B-24 Liberator #05", name_en:"B-24 Liberator #05", side:'east', kind:'aircraft', crest:null,
    title:"盟軍 第八航空隊 · 05 號機 最西外海進場·大弧線長程巡航投彈", troops:36,
    track:[
      { t:6.6, lng:-0.9700,lat:49.4100,s:36, st:'march' },    // 自最西外海進場
      { t:7.0, lng:-0.8900,lat:49.3880,s:36, st:'attack' },   // 大弧線下壓·炸灘後縱深
      { t:7.4, lng:-0.8200,lat:49.3970,s:36, st:'attack' },   // 內陸補給線
      { t:7.8, lng:-0.8000,lat:49.4090,s:36, st:'march' },    // 東端轉向
      { t:8.6, lng:-0.8700,lat:49.3890,s:36, st:'attack' },   // 折返·壓制德軍縱深
      { t:9.5, lng:-0.9550,lat:49.4080,s:36, st:'march' },    // 西端轉向
      { t:10.9,lng:-0.8600,lat:49.3900,s:36, st:'attack' },   // 午前切斷增援
      { t:12.0,lng:-0.8100,lat:49.4090,s:36, st:'march' },    // 東端轉向
      { t:12.8,lng:-0.8900,lat:49.3910,s:36, st:'attack' },   // 午後再炸反擊集結
      { t:13.0,lng:-0.9400,lat:49.4100,s:36, st:'march' },    // 西飛脫離返航
    ]},
  // 6 號機：D+1 為主的零星出擊·D 日午後晚進場·支援內陸推進
  { id:"bomber_6", name_zh:"B-24「解放者」06 號", name_ja:"B-24 Liberator #06", name_en:"B-24 Liberator #06", side:'east', kind:'aircraft', crest:null,
    title:"盟軍 第八航空隊 · 06 號機 D 日午後晚進場+D+1 零星出擊·支援內陸推進", troops:36,
    track:[
      { t:11.6,lng:-0.8000,lat:49.4100,s:36, st:'march' },    // D 日午後自東進場(晚到)
      { t:12.0,lng:-0.8700,lat:49.3910,s:36, st:'attack' },   // 炸德軍反擊集結
      { t:12.5,lng:-0.9300,lat:49.3980,s:36, st:'attack' },   // 西翼縱深
      { t:13.0,lng:-0.9600,lat:49.4090,s:36, st:'march' },    // 西端脫離·返航待命
      // ── D+1（6/7）：零星出擊·支援登陸場向內陸推進 ──
      { t:30.0,lng:-0.9600,lat:49.4090,s:24, st:'march' },    // D+1 清晨自西進場
      { t:30.4,lng:-0.8700,lat:49.3900,s:24, st:'attack' },   // 炸德軍據點·支援出灘推進
      { t:30.8,lng:-0.8100,lat:49.3980,s:24, st:'attack' },   // 內陸縱深目標
      { t:31.2,lng:-0.8000,lat:49.4090,s:24, st:'march' },    // 東端脫離返航
    ]},
  { id:"lcvp_1", name_zh:"登陸艇 首波（西）", name_ja:"LCVP 1st Wave (West)", name_en:"LCVP Wave 1", side:'east', kind:'landingcraft', crest:null,
    title:"盟軍 希金斯艇 · Dog/Easy 首波", troops:36,
    track:[
      { t:6.0, lng:-0.8800,lat:49.4000,s:36, st:'march' },   // 自錨地放下·向灘
      { t:6.4, lng:-0.8800,lat:49.3780,s:36, st:'march' },   // 湧浪中貼海面前進
      { t:6.5, lng:-0.8800,lat:49.3710,s:36, st:'attack' },  // 放下跳板·官兵衝出
      { t:7.0, lng:-0.8850,lat:49.3950,s:18, st:'march' },   // 退回換乘
      // ── D+1（6/7）：持續運送後續梯隊與補給上灘 ──
      { t:26,  lng:-0.8800,lat:49.4000,s:30, st:'march' },   // 6/7 載運後續梯隊·向灘前進
      { t:28,  lng:-0.8800,lat:49.3720,s:30, st:'march' },   // 西段卸載後續部隊與物資
      { t:40,  lng:-0.8850,lat:49.3950,s:24, st:'march' },   // 往返錨地持續運補
    ]},
  { id:"lcvp_2", name_zh:"登陸艇 首波（東）", name_ja:"LCVP 1st Wave (East)", name_en:"LCVP Wave 2", side:'east', kind:'landingcraft', crest:null,
    title:"盟軍 希金斯艇 · Easy/Fox 首波", troops:36,
    track:[
      { t:6.0, lng:-0.8500,lat:49.4000,s:36, st:'march' },
      { t:6.4, lng:-0.8500,lat:49.3780,s:36, st:'march' },   // 貼海面前進
      { t:6.5, lng:-0.8500,lat:49.3710,s:36, st:'attack' },  // 搶灘 Easy Red/Fox Green
      { t:7.0, lng:-0.8550,lat:49.3950,s:18, st:'march' },
      // ── D+1（6/7）：持續運送後續梯隊與補給上灘 ──
      { t:26,  lng:-0.8500,lat:49.4000,s:30, st:'march' },   // 6/7 載運後續梯隊·向灘前進
      { t:28,  lng:-0.8500,lat:49.3720,s:30, st:'march' },   // 東段卸載後續部隊與物資
      { t:40,  lng:-0.8550,lat:49.3950,s:24, st:'march' },   // 往返錨地持續運補
    ]},
  { id:"dd_741", name_zh:"741戰車營 DD戰車", name_ja:"741st Tank Bn (DD Sherman)", name_en:"741st DD Tanks", side:'east', kind:'armor', crest:null,
    title:"盟軍 兩棲謝爾曼 · 29輛投放·27輛沉沒", troops:29,
    track:[
      { t:6.2, lng:-0.8550,lat:49.3950,s:29, st:'march' },   // 自外海 5000碼投放
      { t:6.4, lng:-0.8550,lat:49.3850,s:6,  st:'rout' },    // 湧浪灌入·多數沉沒
      { t:6.6, lng:-0.8560,lat:49.3720,s:2,  st:'hold' },    // 僅少數上灘提供火力
      { t:10,  lng:-0.8560,lat:49.3720,s:2,  st:'attack' },  // 後續波戰車登灘增援
      { t:13,  lng:-0.8580,lat:49.3760,s:5,  st:'attack' },
    ]},
  { id:"co_a_116", name_zh:"116團A連", name_ja:"Co. A, 116th Inf Regt", name_en:"Co. A 116th", side:'east', kind:'infantry', crest:null,
    title:"盟軍 29師 · Dog Green 首波·近乎全滅", troops:200,
    track:[
      { t:6.5, lng:-0.9050,lat:49.3705,s:200,st:'attack' },  // 跳板放下即遭交叉火網掃射
      { t:6.7, lng:-0.9050,lat:49.3715,s:60, st:'rout' },    // 數分鐘內傷亡逾半·『血腥奧馬哈』
      { t:7.5, lng:-0.9040,lat:49.3725,s:30, st:'hold' },    // 殘部釘死於卵石堤後
      { t:13,  lng:-0.9030,lat:49.3760,s:25, st:'march' },   // 午後隨突破向 D-1 推進
      { t:18,  lng:-0.9020,lat:49.3700,s:25, st:'hold' },    // D-Day 夜殘部於 Vierville 整補
      // ── D+1（6/7）：殘部歸建·向內陸推進 ──
      { t:30,  lng:-0.9000,lat:49.3600,s:24, st:'march' },   // 6/7 隨 116團向內陸推進
      { t:44,  lng:-0.8980,lat:49.3480,s:24, st:'march' },   // 午後向 Vierville 內陸縱深前進
    ]},
  { id:"inf_16th", name_zh:"16團（1師）", name_ja:"16th Inf Regt, 1st Div", name_en:"16th Infantry", side:'east', kind:'infantry', crest:null,
    title:"盟軍 『大紅一』 · Easy Red/Fox Green→崖頂", troops:1500,
    track:[
      { t:6.5, lng:-0.8500,lat:49.3705,s:1500,st:'attack' }, // 搶灘 Easy Red/Fox Green·傷亡重
      { t:7.5, lng:-0.8500,lat:49.3720,s:1100,st:'hold' },   // 釘死於卵石堤·潮水上漲
      { t:9.5, lng:-0.8490,lat:49.3740,s:1000,st:'attack' }, // 『不待命·向崖頂仰攻』
      { t:12,  lng:-0.8470,lat:49.3760,s:900, st:'attack' }, // 滲透崖坡·迫近 WN62
      { t:14,  lng:-0.8470,lat:49.3810,s:850, st:'breakthrough' }, // 突破崖頂向 Colleville
      { t:18,  lng:-0.8470,lat:49.3850,s:800, st:'hold' },   // 鞏固 Colleville 外緣
      // ── D+1（6/7）：擴大登陸場·向內陸推進 ──
      { t:24,  lng:-0.8480,lat:49.3700,s:790, st:'hold' },   // 6/7 凌晨於 Colleville 整補·擊退德軍反撲
      { t:30,  lng:-0.8500,lat:49.3580,s:770, st:'march' },  // 上午向內陸展開·肅清殘餘據點
      { t:38,  lng:-0.8520,lat:49.3450,s:750, st:'attack' }, // 午後向 Trévières 方向推進
      { t:46,  lng:-0.8550,lat:49.3360,s:740, st:'march' },  // 6/7 夜擴大登陸場縱深
    ]},
  { id:"rangers", name_zh:"2遊騎兵營", name_ja:"2nd Ranger Bn", name_en:"2nd Rangers", side:'east', kind:'infantry', crest:null,
    title:"盟軍 突擊隊 · 奧克角攀崖", troops:225,
    track:[
      { t:6.0, lng:-1.0050,lat:49.4150,s:225,st:'march' },   // 自海上接近奧克角（誤航延誤）
      { t:7.1, lng:-1.0050,lat:49.3970,s:225,st:'attack' },  // 崖根登陸·火箭繩鈎攀崖
      { t:10,  lng:-1.0045,lat:49.3978,s:150,st:'attack' },  // 奪崖頂砲廓·砲已撤走
      { t:12,  lng:-1.0020,lat:49.4010,s:130,st:'breakthrough' }, // 內陸果園尋獲並炸毀155mm砲
      { t:18,  lng:-1.0020,lat:49.4010,s:90, st:'hold' },    // 孤守待援·傷亡慘重
      // ── D+1（6/7）：苦守崖頂·待援軍接應 ──
      { t:24,  lng:-1.0020,lat:49.4010,s:75, st:'hold' },    // 6/7 凌晨彈藥近竭·擊退德軍反撲
      { t:36,  lng:-1.0010,lat:49.4020,s:70, st:'hold' },    // 上午苦守崖頂·僅約90人能戰
      { t:46,  lng:-0.9980,lat:49.4030,s:90, st:'march' },   // 午後援軍經 Vierville 接應·解奧克角之圍
    ]},
  { id:"engineers", name_zh:"工兵爆破組", name_ja:"Special Engineer Task Force", name_en:"Combat Engineers", side:'east', kind:'infantry', crest:null,
    title:"盟軍 工兵 · 清除灘障·開闢隘道", troops:300,
    track:[
      { t:6.6, lng:-0.8650,lat:49.3700,s:300,st:'attack' },  // 隨首波上灘·炸鋼刺蝟與障礙
      { t:7.0, lng:-0.8650,lat:49.3710,s:180,st:'hold' },    // 漲潮與火力下傷亡大·僅開數條通道
      { t:11,  lng:-0.8620,lat:49.3735,s:160,st:'attack' },  // 肅清 E-1 隘道地雷與路障
      { t:12,  lng:-0.8620,lat:49.3760,s:150,st:'breakthrough' }, // E-1 打通·裝甲得以上陸
      { t:18,  lng:-0.8640,lat:49.3700,s:150,st:'hold' },    // D-Day 夜於灘頭清障·維護出灘道路
      // ── D+1（6/7）：拓寬出灘道路·清除雷區 ──
      { t:30,  lng:-0.8660,lat:49.3680,s:148,st:'march' },   // 6/7 拓寬 E-1/E-3 隘道·清除雷區
      { t:44,  lng:-0.8680,lat:49.3620,s:146,st:'hold' },    // 午後沿內陸路線排雷·支援縱深推進
    ]},

  /* ============================ 德軍（紅 · west） ============================ */
  { id:"wn62", name_zh:"WN62 據點", name_ja:"Widerstandsnest 62", name_en:"WN62", side:'west', kind:'bunker', crest:null,
    title:"德軍 352師 · 奧馬哈最致命據點(Colleville 上方)", troops:30,
    track:[ // lat 校正(DEM)：49.3680 仍在海面(0m)→49.3604（崖肩 14.2m，俯瞰 Easy Red/Fox Green）
      { t:5.5, lng:-0.8460,lat:49.3604,s:30, st:'hold' },    // 砲擊中存活·工事完好
      { t:6.5, lng:-0.8460,lat:49.3604,s:30, st:'attack' },  // 俯瞰 Easy Red/Fox Green 猛烈掃射
      { t:9.5, lng:-0.8460,lat:49.3604,s:24, st:'attack' },  // 仍封鎖灘頭·造成最大傷亡
      { t:11,  lng:-0.8460,lat:49.3604,s:14, st:'hold' },    // 遭驅逐艦直射壓制·彈藥漸竭
      { t:13,  lng:-0.8460,lat:49.3604,s:0,  st:'rout' },    // 守軍撤離·WN62 失守
    ]},
  { id:"wn61", name_zh:"WN61 據點", name_ja:"Widerstandsnest 61", name_en:"WN61", side:'west', kind:'bunker', crest:null,
    title:"德軍 · E-3 東側·88mm 反戰車砲", troops:25,
    track:[ // lat 校正(DEM)：49.3682 仍在海面(0m)→49.3584（崖肩 13.3m，扼 E-3 東側）
      { t:5.5, lng:-0.8430,lat:49.3584,s:25, st:'hold' },
      { t:6.5, lng:-0.8430,lat:49.3584,s:25, st:'attack' },  // 88mm 擊毀上灘 DD 戰車
      { t:8.5, lng:-0.8430,lat:49.3584,s:20, st:'attack' },
      { t:9.5, lng:-0.8430,lat:49.3584,s:8,  st:'hold' },    // 遭 DD 戰車與驅逐艦對射壓制
      { t:11,  lng:-0.8430,lat:49.3584,s:0,  st:'rout' },    // 較早失守
    ]},
  { id:"wn72", name_zh:"WN72 據點", name_ja:"Widerstandsnest 72", name_en:"WN72", side:'west', kind:'bunker', crest:null,
    title:"德軍 · 封鎖 D-1 Vierville 隘口·反戰車砲", troops:20,
    track:[ // lat(DEM 驗證)：49.3690 已在 Pointe de la Percée 高地(46.5m)，無需再移
      { t:5.5, lng:-0.9040,lat:49.3690,s:20, st:'hold' },
      { t:6.5, lng:-0.9040,lat:49.3690,s:20, st:'attack' },  // 砲廓側射屠殺 Dog Green 的116團A連
      { t:9,   lng:-0.9040,lat:49.3690,s:18, st:'attack' },  // 死封 D-1 隘道
      { t:12,  lng:-0.9040,lat:49.3690,s:6,  st:'hold' },    // 德州號主砲直擊砲廓
      { t:13.5,lng:-0.9040,lat:49.3690,s:0,  st:'rout' },    // 隘口被打通
    ]},
  { id:"wn71", name_zh:"WN71 據點", name_ja:"Widerstandsnest 71", name_en:"WN71", side:'west', kind:'bunker', crest:null,
    title:"德軍 · Vierville 隘口東側火力點", troops:18,
    track:[ // lat(DEM 驗證)：49.3688 已在西端高地(47.7m)，無需再移
      { t:5.5, lng:-0.9010,lat:49.3688,s:18, st:'hold' },
      { t:6.5, lng:-0.9010,lat:49.3688,s:18, st:'attack' },  // 與 WN72 構成交叉火網
      { t:11,  lng:-0.9010,lat:49.3688,s:10, st:'attack' },
      { t:13.5,lng:-0.9010,lat:49.3688,s:0,  st:'rout' },
    ]},
  { id:"wn70", name_zh:"WN70 據點", name_ja:"Widerstandsnest 70", name_en:"WN70", side:'west', kind:'bunker', crest:null,
    title:"德軍 · Les Moulins 上方崖頂火力點", troops:18,
    track:[ // lat 校正(DEM)：49.3685 僅 2.5m(灘沙)→49.3677（崖肩 14.5m，俯瞰 Dog Red/Easy Green）
      { t:5.5, lng:-0.8730,lat:49.3677,s:18, st:'hold' },
      { t:6.5, lng:-0.8730,lat:49.3677,s:18, st:'attack' },  // 俯瞰 Dog Red/Easy Green
      { t:11,  lng:-0.8730,lat:49.3677,s:9,  st:'hold' },
      { t:13,  lng:-0.8730,lat:49.3677,s:0,  st:'rout' },
    ]},
  { id:"wn68", name_zh:"WN68 據點", name_ja:"Widerstandsnest 68", name_en:"WN68", side:'west', kind:'bunker', crest:null,
    title:"德軍 · St-Laurent E-1 上方據點", troops:16,
    track:[ // lat 校正(DEM)：49.3683 仍在海面(0m)→49.3633（崖肩 12.8m，封鎖 Easy Red 西側）
      { t:5.5, lng:-0.8600,lat:49.3633,s:16, st:'hold' },
      { t:6.5, lng:-0.8600,lat:49.3633,s:16, st:'attack' },  // 封鎖 Easy Red 西側
      { t:11,  lng:-0.8600,lat:49.3633,s:7,  st:'hold' },
      { t:12,  lng:-0.8600,lat:49.3633,s:0,  st:'rout' },    // E-1 最先被打通
    ]},
  { id:"flak_colleville", name_zh:"科勒維爾高射砲", name_ja:"Colleville Flak Battery", name_en:"Colleville Flak", side:'west', kind:'flak', crest:null,
    title:"德軍 · 崖頂高射砲·對空兼平射", troops:12,
    track:[ // lat 校正(DEM)：49.3670 仍在海面(0m)→49.3590（WN62 後方崖頂 35.8m，內陸側）
      { t:5.5, lng:-0.8480,lat:49.3590,s:12, st:'hold' },
      { t:6.0, lng:-0.8480,lat:49.3590,s:12, st:'attack' },  // 對掠過的 B-24 機群射擊
      { t:9,   lng:-0.8480,lat:49.3590,s:10, st:'attack' },  // 轉平射支援 WN62
      { t:13,  lng:-0.8480,lat:49.3590,s:4,  st:'hold' },
      { t:15,  lng:-0.8480,lat:49.3590,s:0,  st:'rout' },
    ]},
  // === 德軍高射砲群 · 沿崖線與內陸密集分布(對空兼平射) ===
  { id:"flak_vierville", name_zh:"維埃維爾高射砲", name_ja:"Vierville Flak Battery", name_en:"Vierville Flak", side:'west', kind:'flak', crest:null,
    title:"德軍 · 西段崖頂高射砲(WN72/71 後方)", troops:14,
    track:[ // 灘西端崖肩內陸側(lat 在陸地)
      { t:5.5, lng:-0.9050,lat:49.3650,s:14, st:'hold' },
      { t:6.0, lng:-0.9050,lat:49.3650,s:14, st:'attack' },  // 對掠過的 B-24 機群射擊
      { t:9,   lng:-0.9050,lat:49.3650,s:12, st:'attack' },  // 轉平射封鎖 Dog 灘段
      { t:13,  lng:-0.9050,lat:49.3650,s:5,  st:'hold' },
      { t:15,  lng:-0.9050,lat:49.3650,s:0,  st:'rout' },
    ]},
  { id:"flak_stlaurent", name_zh:"聖洛朗高射砲", name_ja:"St-Laurent Flak Battery", name_en:"St-Laurent Flak", side:'west', kind:'flak', crest:null,
    title:"德軍 · 中段崖頂高射砲(WN68/WN65 後方)", troops:12,
    track:[
      { t:5.5, lng:-0.8800,lat:49.3640,s:12, st:'hold' },
      { t:6.0, lng:-0.8800,lat:49.3640,s:12, st:'attack' },  // 對空攔截轟炸機群
      { t:9,   lng:-0.8800,lat:49.3640,s:10, st:'attack' },  // 平射壓制灘頭出口
      { t:13,  lng:-0.8800,lat:49.3640,s:4,  st:'hold' },
      { t:15,  lng:-0.8800,lat:49.3640,s:0,  st:'rout' },
    ]},
  { id:"flak_colleville2", name_zh:"科勒維爾東高射砲", name_ja:"Colleville East Flak", name_en:"Colleville East Flak", side:'west', kind:'flak', crest:null,
    title:"德軍 · 東段崖頂高射砲(WN60/61 後方)", troops:12,
    track:[
      { t:5.5, lng:-0.8420,lat:49.3600,s:12, st:'hold' },
      { t:6.0, lng:-0.8420,lat:49.3600,s:12, st:'attack' },  // 對空射擊
      { t:9,   lng:-0.8420,lat:49.3600,s:10, st:'attack' },  // 平射支援東翼據點
      { t:13,  lng:-0.8420,lat:49.3600,s:4,  st:'hold' },
      { t:15,  lng:-0.8420,lat:49.3600,s:0,  st:'rout' },
    ]},
  { id:"flak_inland1", name_zh:"內陸高射砲(一)", name_ja:"Inland Flak Battery 1", name_en:"Inland Flak 1", side:'west', kind:'flak', crest:null,
    title:"德軍 · 內陸縱深防空陣地(西)", troops:10,
    track:[ // 灘後內陸·純對空(航路下方)
      { t:5.5, lng:-0.9000,lat:49.3480,s:10, st:'hold' },
      { t:6.0, lng:-0.9000,lat:49.3480,s:10, st:'attack' },  // 攔截通過內陸的轟炸航路
      { t:9,   lng:-0.9000,lat:49.3480,s:10, st:'attack' },  // 持續對空
      { t:13,  lng:-0.9000,lat:49.3480,s:6,  st:'hold' },
      { t:16,  lng:-0.9000,lat:49.3480,s:0,  st:'rout' },
    ]},
  { id:"flak_inland2", name_zh:"內陸高射砲(二)", name_ja:"Inland Flak Battery 2", name_en:"Inland Flak 2", side:'west', kind:'flak', crest:null,
    title:"德軍 · 內陸縱深防空陣地(東)", troops:10,
    track:[
      { t:5.5, lng:-0.8400,lat:49.3470,s:10, st:'hold' },
      { t:6.0, lng:-0.8400,lat:49.3470,s:10, st:'attack' },  // 對掠過的機群射擊
      { t:9,   lng:-0.8400,lat:49.3470,s:10, st:'attack' },  // 持續對空
      { t:13,  lng:-0.8400,lat:49.3470,s:6,  st:'hold' },
      { t:16,  lng:-0.8400,lat:49.3470,s:0,  st:'rout' },
    ]},
  { id:"flak_pointe", name_zh:"奧克角高射砲", name_ja:"Pointe du Hoc Flak", name_en:"Pointe du Hoc Flak", side:'west', kind:'flak', crest:null,
    title:"德軍 · 西側岬角防空(掩護砲台)", troops:8,
    track:[ // 最西岬角·陸地
      { t:5.5, lng:-0.9450,lat:49.3660,s:8, st:'hold' },
      { t:6.0, lng:-0.9450,lat:49.3660,s:8, st:'attack' },   // 對進場機群射擊
      { t:9,   lng:-0.9450,lat:49.3660,s:6, st:'attack' },   // 抵抗遊騎兵攀崖
      { t:13,  lng:-0.9450,lat:49.3660,s:3, st:'hold' },
      { t:15,  lng:-0.9450,lat:49.3660,s:0, st:'rout' },
    ]},
  { id:"inf_352", name_zh:"352師反擊隊", name_ja:"352. Infanterie-Division", name_en:"352nd Infantry", side:'west', kind:'infantry', crest:null,
    title:"德軍 預備隊 · 自內陸前推反擊（情報誤判其存在）", troops:1500,
    track:[ // lat 校正(DEM)：原 49.3655/49.3675 仍落在海面/灘沙(7.5m/0.3m)。
            // 改為全程在崖後台地(低 lat)前推→抵崖肩反擊→往內陸後撤；前推峰值止於崖肩(≥10m)不入海。
      { t:5.5, lng:-0.8650,lat:49.3600,s:1500,st:'hold' },   // 內陸台地待命 33.1m（情報未察其前調）
      { t:9,   lng:-0.8650,lat:49.3630,s:1500,st:'march' },  // 自內陸向灘頭前推 25.8m（lat 升=趨灘）
      { t:11,  lng:-0.8650,lat:49.3650,s:1400,st:'attack' }, // 抵崖肩 10.1m·局部反擊·一度遲滯灘頭擴張
      { t:14,  lng:-0.8680,lat:49.3620,s:900, st:'hold' },   // 遭艦砲與滲透打擊·後撤 46.9m（lat 降=退內陸）
      { t:18,  lng:-0.8700,lat:49.3600,s:700, st:'rout' },   // D-Day 傍晚全線向內陸後退 46.3m
      // ── D+1（6/7）：殘部向 Trévières 後撤·遲滯盟軍 ──
      { t:24,  lng:-0.8730,lat:49.3520,s:600, st:'rout' },   // 6/7 凌晨向內陸續退·組織遲滯陣地
      { t:34,  lng:-0.8760,lat:49.3440,s:450, st:'hold' },   // 上午於 Trévières 一線勉力遲滯盟軍推進
      { t:44,  lng:-0.8790,lat:49.3360,s:300, st:'rout' },   // 午後遭第2步兵師逼退·續向內陸潰退
    ]},
  { id:"mortar_352", name_zh:"352師迫擊砲", name_ja:"352nd Mortar Battery", name_en:"352nd Mortars", side:'west', kind:'artillery', crest:null,
    title:"德軍 · 預先標定灘頭·拋射壓制", troops:60,
    track:[ // lat 校正(DEM)：49.3665 仍在海面(0m)→49.3631（崖後內陸拋射陣地 15.8m，往內陸後撤）
      { t:5.5, lng:-0.8600,lat:49.3631,s:60, st:'hold' },
      { t:6.5, lng:-0.8600,lat:49.3631,s:60, st:'attack' },  // 對預先標定的灘頭潮間帶拋射
      { t:9,   lng:-0.8600,lat:49.3631,s:50, st:'attack' },
      { t:13,  lng:-0.8600,lat:49.3631,s:20, st:'hold' },    // 觀測所失守·火力減弱
      { t:16,  lng:-0.8630,lat:49.3615,s:0,  st:'rout' },    // 往內陸(更低 lat=37.4m)後撤
    ]},

  /* ---- 德軍內陸增援（被空降師截斷/遲滯；示意位置同空降單位，往灘頭推進） ---- */
  { id:"reinf_352", name_zh:"352師增援縱隊", name_ja:"352. Div. Reinforcement Column", name_en:"352nd Reinf. Column", side:'west', kind:'infantry', crest:null,
    title:"德軍 增援 · 自內陸沿公路馳援灘頭·遭傘兵路障阻截（示意位置）", troops:1200,
    track:[
      { t:2.0, lng:-0.9450,lat:49.3700,s:1200,st:'march' },   // 凌晨接報·縱隊自內陸南下增援
      { t:3.5, lng:-0.9450,lat:49.3500,s:1200,st:'march' },   // 行軍途中遭82師路障阻擊
      { t:5.0, lng:-0.9430,lat:49.3380,s:900, st:'hold' },    // H時前被截停於內陸·無法及時抵灘
      { t:9.0, lng:-0.9420,lat:49.3360,s:700, st:'attack' },  // 與傘兵反覆爭奪路口
      { t:14,  lng:-0.9450,lat:49.3550,s:400, st:'rout' },    // D-Day 縱隊潰散·終未能解灘頭之圍
      // ── D+1（6/7）：殘部向內陸潰退·被空降師收拾 ──
      { t:22,  lng:-0.9480,lat:49.3450,s:300, st:'rout' },    // 6/7 凌晨殘部向內陸南撤
      { t:30,  lng:-0.9500,lat:49.3380,s:180, st:'rout' },    // 上午遭82空降師肅清·建制瓦解
    ]},
  { id:"reinf_panzer", name_zh:"裝甲反擊推進", name_ja:"Panzer Counter-thrust", name_en:"Panzer Counter-thrust", side:'west', kind:'armor', crest:null,
    title:"德軍 裝甲 · 內陸裝甲試圖直插登陸場·遭炸橋遲滯（示意位置）", troops:40,
    track:[
      { t:3.0, lng:-0.9100,lat:49.3650,s:40, st:'march' },    // 凌晨裝甲集結·欲沿橋路直插灘頭
      { t:4.0, lng:-0.9120,lat:49.3450,s:40, st:'hold' },     // ★ 橋樑被英6空降師炸毀·推進受阻
      { t:7.0, lng:-0.9150,lat:49.3380,s:35, st:'attack' },   // 改道試探·遭傘兵反戰車火力打擊
      { t:12,  lng:-0.9180,lat:49.3500,s:20, st:'hold' },     // 遲滯整日·錯失突入灘頭的時機
      { t:18,  lng:-0.9200,lat:49.3650,s:12, st:'rout' },     // D-Day 後撤
      // ── D+1（6/7）：殘存裝甲撤離·遭空中與反戰車火力削減 ──
      { t:24,  lng:-0.9220,lat:49.3550,s:10, st:'rout' },     // 6/7 凌晨向內陸撤離·遭夜間阻擊
      { t:34,  lng:-0.9250,lat:49.3480,s:5,  st:'rout' },     // 上午遭盟軍制空與反戰車火力削減·殘存無幾
    ]},

  /* ---- 德軍 D+1（6/7）反擊縱隊（自內陸南方反撲灘頭·遭擊退） ---- */
  { id:"ger_d1_counter", name_zh:"德軍 D+1 反擊縱隊", name_ja:"D+1 Counter-attack Column", name_en:"German D+1 Counter-attack", side:'west', kind:'infantry', crest:null,
    title:"德軍 D+1 · 自內陸南方反撲奧馬哈登陸場·遭艦砲與裝甲擊退", troops:1500,
    track:[
      { t:20,  lng:-0.8700,lat:49.3400,s:1500,st:'march' },   // 6/7 凌晨自內陸南方（Trévières 方向）集結·北上反撲
      { t:24,  lng:-0.8680,lat:49.3500,s:1450,st:'march' },   // 沿公路逼近登陸場·夜間運動
      { t:26,  lng:-0.8650,lat:49.3580,s:1300,st:'attack' },  // 逼近崖肩一線·向出灘部隊發起反擊
      { t:28,  lng:-0.8650,lat:49.3600,s:1000,st:'attack' },  // 一度逼近登陸場·遭艦砲與謝爾曼直射打擊
      { t:30,  lng:-0.8700,lat:49.3480,s:600, st:'rout' },    // 反擊被擊退·向內陸潰退
      { t:36,  lng:-0.8740,lat:49.3380,s:350, st:'rout' },    // 午後續向 Trévières 後撤·建制瓦解
    ]},

  /* ============================ 盟軍 搶灘重型武器（藍 · east · t6.5~t12 登陸/支援） ============================
   *   ※ 首波步兵慘重後，後續波次將戰車、半履帶與兩棲卡車送上灘頭，提供直射火力與機動，
   *      於卵石堤、出灘口逐步壓制 WN 據點。座標：高 lat(外海換乘區)→ lat≈49.37(灘頭)→ 內陸。 */
  { id:"sherman_743", name_zh:"743戰車營 M4雪曼", name_ja:"743rd Tank Bn (M4 Sherman)", name_en:"743rd Tank Bn", side:'east', kind:'armor', crest:null,
    title:"盟軍 後續波戰車 · 由 LCT 直接搶灘·Dog White 直射火力支援", troops:48,
    track:[
      { t:6.8, lng:-0.8950,lat:49.4050,s:48, st:'march' },   // 自換乘區由 LCT 搭載向灘前進
      { t:7.3, lng:-0.8950,lat:49.3820,s:46, st:'march' },   // 涉水搶灘·部分中彈
      { t:7.6, lng:-0.8960,lat:49.3720,s:40, st:'attack' },  // 上灘以 75mm 直射壓制 Dog White 據點
      { t:9.5, lng:-0.8980,lat:49.3735,s:36, st:'attack' },  // 沿卵石堤掩護工兵爆破·拔除火力點
      { t:12,  lng:-0.9000,lat:49.3780,s:34, st:'attack' },  // 隨步兵向 D-1 隘口推進
      { t:18,  lng:-0.9000,lat:49.3700,s:34, st:'hold' },    // D-Day 夜於 Vierville 出灘口整補
      // ── D+1（6/7）：隨步兵向內陸提供直射火力 ──
      { t:30,  lng:-0.9000,lat:49.3580,s:33, st:'march' },   // 6/7 越過崖頂·向內陸機動
      { t:44,  lng:-0.9020,lat:49.3460,s:32, st:'attack' },  // 午後支援步兵向內陸縱深推進
    ]},
  { id:"howitzer_111", name_zh:"111野戰砲營 105榴彈砲", name_ja:"111th FA Bn (105mm M2A1)", name_en:"111th Field Artillery", side:'east', kind:'artillery', crest:null,
    title:"盟軍 灘頭支援砲兵 · DUKW 載運上灘·建立首批岸轟火力", troops:12,
    track:[
      { t:8.0, lng:-0.8700,lat:49.4000,s:12, st:'march' },   // 105mm 砲多隨 DUKW 沉沒·殘存砲組換乘上灘
      { t:9.0, lng:-0.8700,lat:49.3800,s:8,  st:'march' },   // 於 Easy Red 段搶灘·搶建砲位
      { t:10,  lng:-0.8720,lat:49.3725,s:6,  st:'hold' },    // 在堤後架砲·校正彈著
      { t:11,  lng:-0.8740,lat:49.3735,s:6,  st:'attack' },  // 對崖頂工事與內陸縱深射擊支援
      { t:14,  lng:-0.8760,lat:49.3770,s:6,  st:'attack' },  // 隨步兵前移·延伸火力
      { t:18,  lng:-0.8760,lat:49.3700,s:6,  st:'hold' },    // D-Day 夜於崖後砲位待命
      // ── D+1（6/7）：前移砲位·延伸火力支援內陸推進 ──
      { t:30,  lng:-0.8780,lat:49.3580,s:6,  st:'march' },   // 6/7 越崖前移砲位
      { t:44,  lng:-0.8800,lat:49.3460,s:6,  st:'attack' },  // 午後對 Trévières 方向德軍射擊支援
    ]},
  { id:"dukw_amph", name_zh:"DUKW 兩棲卡車隊", name_ja:"DUKW Amphibious Truck Co.", name_en:"DUKW Amphibious Trucks", side:'east', kind:'armor', crest:null,
    title:"盟軍 兩棲補給 · 運彈藥/傷員·灘頭與外海間穿梭", troops:20,
    track:[
      { t:7.0, lng:-0.8600,lat:49.4100,s:20, st:'march' },   // 自運輸艦放下·搭載砲彈與補給浮渡
      { t:7.8, lng:-0.8600,lat:49.3850,s:18, st:'march' },   // 湧浪中向灘頭浮渡·數輛進水
      { t:8.5, lng:-0.8620,lat:49.3730,s:16, st:'hold' },    // 涉上灘頭卸載彈藥·後送傷員
      { t:10,  lng:-0.8640,lat:49.3760,s:15, st:'march' },   // 往返外海換乘區持續補給
      { t:12,  lng:-0.8660,lat:49.3800,s:14, st:'march' },   // 隨灘頭擴展前移補給點
      // ── D+1（6/7）：晝夜不停運補·支撐內陸推進 ──
      { t:24,  lng:-0.8640,lat:49.3760,s:14, st:'hold' },    // 6/7 凌晨於灘頭卸載·後送傷員
      { t:30,  lng:-0.8600,lat:49.4050,s:14, st:'march' },   // 上午往返外海運送彈藥與補給
      { t:38,  lng:-0.8620,lat:49.3780,s:13, st:'march' },   // 午後前移補給點·支撐出灘部隊縱深推進
      { t:46,  lng:-0.8640,lat:49.3950,s:13, st:'march' },   // 6/7 夜持續運補
    ]},

  /* ============================ D+1（6/7）後續部隊與工事（藍 · east） ============================
   *   ※ D-Day 灘頭已鞏固，6/7 起後續梯隊上陸、海軍工兵築補給場與出灘道路，
   *      登陸場由各灘段連成一線，開始向內陸（Trévières/Isigny）推進。 */
  { id:"us_2nd_div", name_zh:"美軍第2步兵師", name_ja:"2nd Infantry Division", name_en:"US 2nd Infantry Division", side:'east', kind:'infantry', crest:null,
    title:"盟軍 D+1 後續梯隊 · 上陸後向內陸 Trévières 方向推進", troops:8000,
    track:[
      { t:26,  lng:-0.8700,lat:49.3950,s:8000,st:'march' },  // 6/7 自外海換乘區上陸·於奧馬哈灘集結
      { t:30,  lng:-0.8700,lat:49.3720,s:8000,st:'march' },  // 涉灘上陸·通過出灘隘道
      { t:36,  lng:-0.8700,lat:49.3600,s:7950,st:'march' },  // 午前越過崖頂·向內陸展開
      { t:42,  lng:-0.8720,lat:49.3480,s:7850,st:'attack' }, // 午後向 Trévières 方向推進·肅清沿途德軍
      { t:48,  lng:-0.8750,lat:49.3380,s:7800,st:'attack' }, // 6/8 前進抵 Trévières 外緣·擴大登陸場
    ]},
  { id:"beach_works", name_zh:"灘頭堡工事構築", name_ja:"Beachhead Construction (Seabees)", name_en:"Beachhead Works (Seabees/Engineers)", side:'east', kind:'infantry', crest:null,
    title:"盟軍 海軍工兵 · 築補給場與出灘道路·維持灘頭堡運轉", troops:1500,
    track:[
      { t:24,  lng:-0.8650,lat:49.3700,s:1500,st:'hold' },   // 6/7 凌晨於灘頭一線清障·搶建卸載場
      { t:30,  lng:-0.8700,lat:49.3700,s:1500,st:'march' },  // 上午鋪設出灘道路·架設防波與棧橋
      { t:38,  lng:-0.8600,lat:49.3700,s:1480,st:'hold' },   // 午後沿灘段構築補給堆置場·設防空陣地
      { t:46,  lng:-0.8550,lat:49.3700,s:1480,st:'march' },  // 6/7 夜延伸道路網·維持晝夜卸載
    ]},
];
