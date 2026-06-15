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
  /* ============================ 盟軍（藍 · east） ============================ */
  { id:"usstexas", name_zh:"戰艦德州號", name_ja:"USS Texas (BB-35)", name_en:"USS Texas", side:'east', kind:'warship', crest:null,
    title:"盟軍 火力支援 · 14吋主砲 · 外海西段", troops:1,
    track:[
      { t:5.5, lng:-0.9000,lat:49.4350,s:1, st:'attack' },   // H時前艦砲準備射擊
      { t:6.4, lng:-0.9000,lat:49.4350,s:1, st:'attack' },   // 持續壓制岸防
      { t:8.5, lng:-0.9050,lat:49.4250,s:1, st:'attack' },   // 抵近以延伸主砲射程
      { t:12,  lng:-0.9050,lat:49.4250,s:1, st:'attack' },   // 轟擊 Vierville 隘口工事
      { t:18,  lng:-0.9000,lat:49.4350,s:1, st:'hold' },     // 傍晚火力支援漸歇
    ]},
  { id:"destroyers", name_zh:"驅逐艦群", name_ja:"Destroyer Squadron", name_en:"Destroyers", side:'east', kind:'warship', crest:null,
    title:"盟軍 抵近直射 · 冒擱淺險近岸轟擊據點", troops:9,
    track:[
      { t:5.5, lng:-0.8650,lat:49.4250,s:9, st:'hold' },     // 待命
      { t:8.5, lng:-0.8600,lat:49.4000,s:9, st:'march' },    // 違令抵近
      { t:9.5, lng:-0.8550,lat:49.3850,s:9, st:'attack' },   // 近岸直射 WN61/WN62
      { t:12,  lng:-0.8550,lat:49.3850,s:9, st:'attack' },   // 逐個拔除據點·扭轉戰局
      { t:16,  lng:-0.8600,lat:49.3950,s:9, st:'hold' },
    ]},
  { id:"bombers", name_zh:"B-24 轟炸機群", name_ja:"B-24 Liberator", name_en:"Heavy Bombers", side:'east', kind:'aircraft', crest:null,
    title:"盟軍 第八航空隊 · H時前地毯轟炸（炸偏內陸）", troops:1,
    track:[
      { t:5.9, lng:-0.8800,lat:49.4200,s:1, st:'march' },    // 自海上進場
      { t:6.0, lng:-0.8700,lat:49.3800,s:1, st:'attack' },   // 雲層遮蔽·延遲投彈
      { t:6.2, lng:-0.8650,lat:49.3950,s:1, st:'attack' },   // 炸彈落入內陸·灘頭工事完好
      { t:6.5, lng:-0.8500,lat:49.4200,s:1, st:'march' },    // 脫離
    ]},
  { id:"lcvp_1", name_zh:"登陸艇 首波（西）", name_ja:"LCVP 1st Wave (West)", name_en:"LCVP Wave 1", side:'east', kind:'landingcraft', crest:null,
    title:"盟軍 希金斯艇 · Dog/Easy 首波", troops:36,
    track:[
      { t:6.0, lng:-0.8800,lat:49.4000,s:36, st:'march' },   // 自錨地放下·向灘
      { t:6.4, lng:-0.8800,lat:49.3780,s:36, st:'march' },   // 湧浪中貼海面前進
      { t:6.5, lng:-0.8800,lat:49.3710,s:36, st:'attack' },  // 放下跳板·官兵衝出
      { t:7.0, lng:-0.8850,lat:49.3950,s:18, st:'march' },   // 退回換乘
    ]},
  { id:"lcvp_2", name_zh:"登陸艇 首波（東）", name_ja:"LCVP 1st Wave (East)", name_en:"LCVP Wave 2", side:'east', kind:'landingcraft', crest:null,
    title:"盟軍 希金斯艇 · Easy/Fox 首波", troops:36,
    track:[
      { t:6.0, lng:-0.8500,lat:49.4000,s:36, st:'march' },
      { t:6.4, lng:-0.8500,lat:49.3780,s:36, st:'march' },   // 貼海面前進
      { t:6.5, lng:-0.8500,lat:49.3710,s:36, st:'attack' },  // 搶灘 Easy Red/Fox Green
      { t:7.0, lng:-0.8550,lat:49.3950,s:18, st:'march' },
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
    ]},
  { id:"rangers", name_zh:"2遊騎兵營", name_ja:"2nd Ranger Bn", name_en:"2nd Rangers", side:'east', kind:'infantry', crest:null,
    title:"盟軍 突擊隊 · 奧克角攀崖", troops:225,
    track:[
      { t:6.0, lng:-1.0050,lat:49.4150,s:225,st:'march' },   // 自海上接近奧克角（誤航延誤）
      { t:7.1, lng:-1.0050,lat:49.3970,s:225,st:'attack' },  // 崖根登陸·火箭繩鈎攀崖
      { t:10,  lng:-1.0045,lat:49.3978,s:150,st:'attack' },  // 奪崖頂砲廓·砲已撤走
      { t:12,  lng:-1.0020,lat:49.4010,s:130,st:'breakthrough' }, // 內陸果園尋獲並炸毀155mm砲
      { t:18,  lng:-1.0020,lat:49.4010,s:90, st:'hold' },    // 孤守待援·傷亡慘重
    ]},
  { id:"engineers", name_zh:"工兵爆破組", name_ja:"Special Engineer Task Force", name_en:"Combat Engineers", side:'east', kind:'infantry', crest:null,
    title:"盟軍 工兵 · 清除灘障·開闢隘道", troops:300,
    track:[
      { t:6.6, lng:-0.8650,lat:49.3700,s:300,st:'attack' },  // 隨首波上灘·炸鋼刺蝟與障礙
      { t:7.0, lng:-0.8650,lat:49.3710,s:180,st:'hold' },    // 漲潮與火力下傷亡大·僅開數條通道
      { t:11,  lng:-0.8620,lat:49.3735,s:160,st:'attack' },  // 肅清 E-1 隘道地雷與路障
      { t:12,  lng:-0.8620,lat:49.3760,s:150,st:'breakthrough' }, // E-1 打通·裝甲得以上陸
    ]},

  /* ============================ 德軍（紅 · west） ============================ */
  { id:"wn62", name_zh:"WN62 據點", name_ja:"Widerstandsnest 62", name_en:"WN62", side:'west', kind:'bunker', crest:null,
    title:"德軍 352師 · 奧馬哈最致命據點(Colleville 上方)", troops:30,
    track:[
      { t:5.5, lng:-0.8460,lat:49.3760,s:30, st:'hold' },    // 砲擊中存活·工事完好
      { t:6.5, lng:-0.8460,lat:49.3760,s:30, st:'attack' },  // 俯瞰 Easy Red/Fox Green 猛烈掃射
      { t:9.5, lng:-0.8460,lat:49.3760,s:24, st:'attack' },  // 仍封鎖灘頭·造成最大傷亡
      { t:11,  lng:-0.8460,lat:49.3760,s:14, st:'hold' },    // 遭驅逐艦直射壓制·彈藥漸竭
      { t:13,  lng:-0.8460,lat:49.3760,s:0,  st:'rout' },    // 守軍撤離·WN62 失守
    ]},
  { id:"wn61", name_zh:"WN61 據點", name_ja:"Widerstandsnest 61", name_en:"WN61", side:'west', kind:'bunker', crest:null,
    title:"德軍 · E-3 東側·88mm 反戰車砲", troops:25,
    track:[
      { t:5.5, lng:-0.8430,lat:49.3758,s:25, st:'hold' },
      { t:6.5, lng:-0.8430,lat:49.3758,s:25, st:'attack' },  // 88mm 擊毀上灘 DD 戰車
      { t:8.5, lng:-0.8430,lat:49.3758,s:20, st:'attack' },
      { t:9.5, lng:-0.8430,lat:49.3758,s:8,  st:'hold' },    // 遭 DD 戰車與驅逐艦對射壓制
      { t:11,  lng:-0.8430,lat:49.3758,s:0,  st:'rout' },    // 較早失守
    ]},
  { id:"wn72", name_zh:"WN72 據點", name_ja:"Widerstandsnest 72", name_en:"WN72", side:'west', kind:'bunker', crest:null,
    title:"德軍 · 封鎖 D-1 Vierville 隘口·反戰車砲", troops:20,
    track:[
      { t:5.5, lng:-0.9040,lat:49.3745,s:20, st:'hold' },
      { t:6.5, lng:-0.9040,lat:49.3745,s:20, st:'attack' },  // 砲廓側射屠殺 Dog Green 的116團A連
      { t:9,   lng:-0.9040,lat:49.3745,s:18, st:'attack' },  // 死封 D-1 隘道
      { t:12,  lng:-0.9040,lat:49.3745,s:6,  st:'hold' },    // 德州號主砲直擊砲廓
      { t:13.5,lng:-0.9040,lat:49.3745,s:0,  st:'rout' },    // 隘口被打通
    ]},
  { id:"wn71", name_zh:"WN71 據點", name_ja:"Widerstandsnest 71", name_en:"WN71", side:'west', kind:'bunker', crest:null,
    title:"德軍 · Vierville 隘口東側火力點", troops:18,
    track:[
      { t:5.5, lng:-0.9010,lat:49.3748,s:18, st:'hold' },
      { t:6.5, lng:-0.9010,lat:49.3748,s:18, st:'attack' },  // 與 WN72 構成交叉火網
      { t:11,  lng:-0.9010,lat:49.3748,s:10, st:'attack' },
      { t:13.5,lng:-0.9010,lat:49.3748,s:0,  st:'rout' },
    ]},
  { id:"wn70", name_zh:"WN70 據點", name_ja:"Widerstandsnest 70", name_en:"WN70", side:'west', kind:'bunker', crest:null,
    title:"德軍 · Les Moulins 上方崖頂火力點", troops:18,
    track:[
      { t:5.5, lng:-0.8730,lat:49.3752,s:18, st:'hold' },
      { t:6.5, lng:-0.8730,lat:49.3752,s:18, st:'attack' },  // 俯瞰 Dog Red/Easy Green
      { t:11,  lng:-0.8730,lat:49.3752,s:9,  st:'hold' },
      { t:13,  lng:-0.8730,lat:49.3752,s:0,  st:'rout' },
    ]},
  { id:"wn68", name_zh:"WN68 據點", name_ja:"Widerstandsnest 68", name_en:"WN68", side:'west', kind:'bunker', crest:null,
    title:"德軍 · St-Laurent E-1 上方據點", troops:16,
    track:[
      { t:5.5, lng:-0.8600,lat:49.3755,s:16, st:'hold' },
      { t:6.5, lng:-0.8600,lat:49.3755,s:16, st:'attack' },  // 封鎖 Easy Red 西側
      { t:11,  lng:-0.8600,lat:49.3755,s:7,  st:'hold' },
      { t:12,  lng:-0.8600,lat:49.3755,s:0,  st:'rout' },    // E-1 最先被打通
    ]},
  { id:"flak_colleville", name_zh:"科勒維爾高射砲", name_ja:"Colleville Flak Battery", name_en:"Colleville Flak", side:'west', kind:'flak', crest:null,
    title:"德軍 · 崖頂高射砲·對空兼平射", troops:12,
    track:[
      { t:5.5, lng:-0.8480,lat:49.3800,s:12, st:'hold' },
      { t:6.0, lng:-0.8480,lat:49.3800,s:12, st:'attack' },  // 對掠過的 B-24 機群射擊
      { t:9,   lng:-0.8480,lat:49.3800,s:10, st:'attack' },  // 轉平射支援 WN62
      { t:13,  lng:-0.8480,lat:49.3800,s:4,  st:'hold' },
      { t:15,  lng:-0.8480,lat:49.3800,s:0,  st:'rout' },
    ]},
  { id:"inf_352", name_zh:"352師反擊隊", name_ja:"352. Infanterie-Division", name_en:"352nd Infantry", side:'west', kind:'infantry', crest:null,
    title:"德軍 預備隊 · 自內陸前推反擊（情報誤判其存在）", troops:1500,
    track:[
      { t:5.5, lng:-0.8650,lat:49.4050,s:1500,st:'hold' },   // 內陸待命（盟軍情報未察其前調）
      { t:9,   lng:-0.8650,lat:49.3950,s:1500,st:'march' },  // 自內陸向灘頭前推
      { t:11,  lng:-0.8650,lat:49.3880,s:1400,st:'attack' }, // 局部反擊·一度遲滯灘頭擴張
      { t:14,  lng:-0.8680,lat:49.3950,s:900, st:'hold' },   // 遭艦砲與滲透打擊·後撤
      { t:18,  lng:-0.8700,lat:49.4050,s:700, st:'rout' },   // 傍晚全線後退
    ]},
  { id:"mortar_352", name_zh:"352師迫擊砲", name_ja:"352nd Mortar Battery", name_en:"352nd Mortars", side:'west', kind:'artillery', crest:null,
    title:"德軍 · 預先標定灘頭·拋射壓制", troops:60,
    track:[
      { t:5.5, lng:-0.8600,lat:49.3900,s:60, st:'hold' },
      { t:6.5, lng:-0.8600,lat:49.3900,s:60, st:'attack' },  // 對預先標定的灘頭潮間帶拋射
      { t:9,   lng:-0.8600,lat:49.3900,s:50, st:'attack' },
      { t:13,  lng:-0.8600,lat:49.3900,s:20, st:'hold' },    // 觀測所失守·火力減弱
      { t:16,  lng:-0.8630,lat:49.3950,s:0,  st:'rout' },
    ]},
];
