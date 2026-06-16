/* =========================================================================
 * data/austerlitz/armies.js — 奧斯特利茨雙方部隊（1805-12-02）
 *   side(色彩通道): 'east'(法軍/藍/勝) | 'west'(俄奧聯軍/紅 accent；軍服由 factionColor 俄綠/奧白)
 *   kind: command/infantry/cavalry/artillery；track {t,lng,lat,s,st}
 *   時間軸：T_START -8(部署序幕) → t=0 拂曉06:00 → t=3 09:00 中央突破 → t=8 切斷 → T_END 12
 *   地理：法軍居西(lng<16.74，Goldbach 溪西)、聯軍居東(普拉欽 lng16.76+/奧洛穆茨東)。
 *     普拉欽高地中央(16.762,49.118)、桑頓山北(16.72,49.152)、Telnitz/Sokolnitz 南(16.74,49.09)、
 *     扎錢湖南緣(16.78,49.075)、拿破崙本陣Žuráň(16.72,49.156)、奧斯特利茨城東(16.876,49.15)。
 *   st: march 行軍 / hold 駐守 / attack 交戰 / breakthrough 突破 / charge 騎兵衝鋒 / square 抗騎方陣 / rout 潰逃
 * ======================================================================= */
window.SEKI = window.SEKI || {};

SEKI.armies = [
  /* ===================== 法蘭西帝國（east·藍·勝；居西，Goldbach 溪西側） ===================== */
  { id:"guard", name_zh:"近衛軍", name_ja:"Garde Impériale · Bessières", side:'east', faction:'french_guard', factionColor:0x1c2f6e, kind:'command',
    title:"貝西埃爾元帥 · 5,500 精銳 · 後段投入中央迎擊俄國近衛軍", troops:5500,
    track:[
      { t:-8, lng:16.700,lat:49.158,s:5500, st:'march' },
      { t:-2, lng:16.722,lat:49.150,s:5500, st:'hold' },  // 拿破崙本陣 Žuráň 一帶
      { t:3,  lng:16.730,lat:49.140,s:5500, st:'hold' },
      { t:4.5,lng:16.758,lat:49.122,s:5500, st:'attack' }, // 上普拉欽迎擊俄近衛軍
      { t:6,  lng:16.762,lat:49.120,s:5100, st:'attack' },
      { t:12, lng:16.766,lat:49.118,s:5000, st:'hold' },
    ]},
  { id:"bernadotte", name_zh:"第一軍團", name_ja:"I Corps · Bernadotte", side:'east', faction:'french_line', factionColor:0x2a4a9a, kind:'infantry',
    title:"貝爾納多特元帥 · 13,000 · 中央右側、突破後增援普拉欽", troops:13000,
    track:[
      { t:-8, lng:16.690,lat:49.145,s:13000, st:'march' },
      { t:-1, lng:16.725,lat:49.135,s:13000, st:'hold' },
      { t:3,  lng:16.745,lat:49.128,s:13000, st:'attack' },
      { t:5,  lng:16.760,lat:49.124,s:12400, st:'attack' }, // 增援中央
      { t:12, lng:16.768,lat:49.122,s:12000, st:'hold' },
    ]},
  { id:"davout", name_zh:"第三軍團", name_ja:"III Corps · Davout", side:'east', faction:'french_line', factionColor:0x2f4f9e, kind:'infantry',
    title:"達武元帥 · 6,300(含騎) · 凌晨急行軍增援南線、塔爾尼茲反覆爭奪", troops:6300,
    track:[
      { t:-8, lng:16.670,lat:49.060,s:2000, st:'march' },  // 自維也納道急行軍(僅前鋒先到)
      { t:-2, lng:16.700,lat:49.078,s:5000, st:'march' },
      { t:0.5,lng:16.730,lat:49.090,s:6300, st:'attack' }, // 抵塔爾尼茲反擊
      { t:4,  lng:16.736,lat:49.092,s:5600, st:'attack' },
      { t:8,  lng:16.742,lat:49.094,s:5200, st:'attack' },
      { t:12, lng:16.748,lat:49.096,s:5000, st:'hold' },
    ]},
  { id:"soult", name_zh:"第四軍團", name_ja:"IV Corps · Soult", side:'east', faction:'french_line', factionColor:0x2a4a9a, kind:'infantry',
    title:"蘇爾特元帥 · 23,600 · ★中央突破主角(旺達姆＋聖海拉爾師)，霧中潛伏→衝上普拉欽", troops:23600,
    track:[
      { t:-8, lng:16.700,lat:49.128,s:23600, st:'march' },
      { t:-2, lng:16.742,lat:49.123,s:23600, st:'hold' },  // 霧中潛伏 Goldbach 溪西、普拉欽腳下
      { t:2,  lng:16.745,lat:49.122,s:23600, st:'hold' },
      { t:3,  lng:16.762,lat:49.118,s:23600, st:'breakthrough' }, // ★09:00 太陽破雲·衝上普拉欽
      { t:5,  lng:16.766,lat:49.116,s:22600, st:'attack' },
      { t:6,  lng:16.772,lat:49.104,s:22000, st:'attack' }, // 聖海拉爾師南下抄截
      { t:12, lng:16.780,lat:49.095,s:21000, st:'hold' },
    ]},
  { id:"lannes", name_zh:"第五軍團", name_ja:"V Corps · Lannes", side:'east', faction:'french_line', factionColor:0x2a4a9a, kind:'infantry',
    title:"拉納元帥 · 12,900 · 北線桑頓山防守反擊巴格拉季昂", troops:12900,
    track:[
      { t:-8, lng:16.695,lat:49.158,s:12900, st:'march' },
      { t:-1, lng:16.718,lat:49.152,s:12900, st:'hold' },  // 桑頓山
      { t:1,  lng:16.722,lat:49.153,s:12900, st:'attack' },
      { t:4.5,lng:16.745,lat:49.155,s:12200, st:'attack' }, // 反擊將聯軍逐出北場
      { t:12, lng:16.760,lat:49.156,s:11800, st:'hold' },
    ]},
  { id:"oudinot", name_zh:"擲彈兵軍", name_ja:"Grenadiers · Oudinot", side:'east', faction:'french_grenadier', factionColor:0x223a82, kind:'infantry',
    title:"烏迪諾元帥 · 5,700 擲彈兵 · 中央預備隊", troops:5700,
    track:[
      { t:-8, lng:16.694,lat:49.135,s:5700, st:'march' },
      { t:-1, lng:16.716,lat:49.130,s:5700, st:'hold' },
      { t:4,  lng:16.748,lat:49.123,s:5700, st:'attack' },
      { t:6,  lng:16.762,lat:49.118,s:5500, st:'attack' },
      { t:12, lng:16.766,lat:49.116,s:5400, st:'hold' },
    ]},
  { id:"murat", name_zh:"騎兵預備軍", name_ja:"Cavalry Reserve · Murat", side:'east', faction:'french_cav', factionColor:0x3a5ab0, kind:'cavalry',
    title:"繆拉親王 · 7,400 騎(含胸甲騎兵) · ★北線騎兵衝鋒、追擊潰兵", troops:7400,
    track:[
      { t:-8, lng:16.668,lat:49.150,s:7400, st:'march' },   // 自西側遠方開進(避免憑空出現)
      { t:-4, lng:16.698,lat:49.150,s:7400, st:'march' },
      { t:-1, lng:16.716,lat:49.148,s:7400, st:'hold' },
      { t:1.5,lng:16.730,lat:49.150,s:7400, st:'charge' },  // ★衝鋒北線
      { t:3,  lng:16.748,lat:49.150,s:7100, st:'charge' },
      { t:5,  lng:16.762,lat:49.148,s:6900, st:'attack' },
      { t:12, lng:16.778,lat:49.140,s:6700, st:'hold' },
    ]},

  /* ===================== 俄奧聯軍（west·紅 accent·軍服俄綠/奧白；居東，普拉欽/奧洛穆茨方向） ===================== */
  { id:"kollowrat", name_zh:"第四縱隊", name_ja:"IV Column · Kollowrat / Miloradovich", side:'west', faction:'austrian_line', factionColor:0xcdd2da, kind:'infantry',
    title:"米羅拉多維奇／克羅拉瑟 · 24,000(奧俄) · ★中計關鍵：離開普拉欽高地南調，中央遂空", troops:24000,
    track:[
      { t:-8, lng:16.840,lat:49.128,s:24000, st:'march' },
      { t:-2, lng:16.766,lat:49.122,s:24000, st:'hold' },  // ★駐普拉欽高地
      { t:0.5,lng:16.762,lat:49.120,s:24000, st:'march' }, // ★離開高地南調(中計)
      { t:2.5,lng:16.756,lat:49.106,s:24000, st:'march' },
      { t:3.5,lng:16.762,lat:49.112,s:20000, st:'attack' },// 回師反撲普拉欽被擊退
      { t:6,  lng:16.778,lat:49.092,s:13000, st:'rout' },
      { t:9,  lng:16.788,lat:49.078,s:8000,  st:'rout' },  // 奔扎錢湖
    ]},
  { id:"dokhturov", name_zh:"第一縱隊", name_ja:"I Column · Dokhturov", side:'west', faction:'russian_line', factionColor:0x3a6a44, kind:'infantry',
    title:"多克托洛夫中將 · 14,000 俄軍 · 南線主攻塔爾尼茲", troops:14000,
    track:[
      { t:-8, lng:16.860,lat:49.098,s:14000, st:'march' },
      { t:-1, lng:16.800,lat:49.092,s:14000, st:'march' },
      { t:0.5,lng:16.742,lat:49.089,s:14000, st:'attack' },// 越 Goldbach 攻塔爾尼茲
      { t:4,  lng:16.738,lat:49.090,s:12000, st:'attack' },
      { t:6.5,lng:16.760,lat:49.082,s:9000,  st:'rout' },  // 中央被斷·南線崩
      { t:9,  lng:16.780,lat:49.073,s:5000,  st:'rout' },  // 奔扎錢湖冰面
    ]},
  { id:"langeron", name_zh:"第二縱隊", name_ja:"II Column · Langeron", side:'west', faction:'russian_line', factionColor:0x3a6a44, kind:'infantry',
    title:"朗熱隆中將 · 12,000 俄軍 · 南線索科爾尼茲反覆爭奪", troops:12000,
    track:[
      { t:-8, lng:16.850,lat:49.110,s:12000, st:'march' },
      { t:-1, lng:16.795,lat:49.106,s:12000, st:'march' },
      { t:0.5,lng:16.754,lat:49.100,s:12000, st:'attack' },// 索科爾尼茲
      { t:4,  lng:16.752,lat:49.100,s:10500, st:'attack' },
      { t:6,  lng:16.766,lat:49.092,s:7500,  st:'rout' },
      { t:9,  lng:16.784,lat:49.076,s:4500,  st:'rout' },
    ]},
  { id:"przyby", name_zh:"第三縱隊", name_ja:"III Column · Przybyszewski", side:'west', faction:'russian_line', factionColor:0x40704a, kind:'infantry',
    title:"普雷斯比斯維斯基中將 · 10,000 俄軍 · 南線索科爾尼茲北", troops:10000,
    track:[
      { t:-8, lng:16.845,lat:49.118,s:10000, st:'march' },
      { t:-1, lng:16.790,lat:49.112,s:10000, st:'march' },
      { t:0.5,lng:16.756,lat:49.105,s:10000, st:'attack' },
      { t:4,  lng:16.755,lat:49.106,s:8500,  st:'attack' },
      { t:5.5,lng:16.762,lat:49.108,s:5000,  st:'rout' },  // 被中央突破之法軍夾擊
      { t:9,  lng:16.778,lat:49.090,s:2500,  st:'rout' },
    ]},
  { id:"kienmayer", name_zh:"左翼前鋒", name_ja:"Advance Guard · Kienmayer", side:'west', faction:'austrian_cav', factionColor:0xb9c0cc, kind:'cavalry',
    title:"基恩米亞將軍 · 6,880(步騎) · 南線首攻塔爾尼茲", troops:6880,
    track:[
      { t:-8, lng:16.900,lat:49.078,s:6880, st:'march' },   // 自東南遠方開進
      { t:-4, lng:16.838,lat:49.082,s:6880, st:'march' },
      { t:-1, lng:16.770,lat:49.086,s:6880, st:'march' },
      { t:-0.5,lng:16.740,lat:49.087,s:6880,st:'attack' },// 最先進攻塔爾尼茲
      { t:3,  lng:16.736,lat:49.088,s:6000, st:'attack' },
      { t:6.5,lng:16.762,lat:49.080,s:4000, st:'rout' },
      { t:9,  lng:16.782,lat:49.072,s:2500, st:'rout' },
    ]},
  { id:"bagration", name_zh:"右翼前鋒", name_ja:"Right Vanguard · Bagration", side:'west', faction:'russian_line', factionColor:0x3a6a44, kind:'infantry',
    title:"巴格拉季昂中將 · 13,700(步騎) · 北線進攻桑頓山牽制", troops:13700,
    track:[
      { t:-8, lng:16.870,lat:49.158,s:13700, st:'march' },
      { t:-1, lng:16.800,lat:49.156,s:13700, st:'march' },
      { t:1,  lng:16.752,lat:49.155,s:13700, st:'attack' },// 攻桑頓山
      { t:4,  lng:16.748,lat:49.156,s:11500, st:'attack' },
      { t:5,  lng:16.790,lat:49.158,s:10500, st:'rout' },  // 被拉納/繆拉逐出北場
      { t:9,  lng:16.840,lat:49.158,s:9500,  st:'march' }, // 向奧洛穆茨退卻
    ]},
  { id:"liechtenstein", name_zh:"第五縱隊", name_ja:"V Column · Liechtenstein", side:'west', faction:'austrian_cav', factionColor:0xb9c0cc, kind:'cavalry',
    title:"列支敦斯登親王約翰一世 · 4,600 奧地利騎兵 · 中央接合部、北線騎兵對衝", troops:4600,
    track:[
      { t:-8, lng:16.900,lat:49.140,s:4600, st:'march' },   // 自東側(奧洛穆茨方向)遠方開進
      { t:-4, lng:16.846,lat:49.141,s:4600, st:'march' },
      { t:-1, lng:16.800,lat:49.142,s:4600, st:'hold' },
      { t:1.5,lng:16.770,lat:49.146,s:4600, st:'charge' }, // ★與繆拉騎兵對衝
      { t:3,  lng:16.758,lat:49.146,s:4000, st:'charge' },
      { t:5,  lng:16.785,lat:49.144,s:3000, st:'rout' },
      { t:9,  lng:16.820,lat:49.144,s:2400, st:'march' },
    ]},
  { id:"const_guard", name_zh:"俄國近衛軍", name_ja:"Russian Guard · Grand Duke Constantine", side:'west', faction:'russian_guard', factionColor:0x2c5436, kind:'command',
    title:"康斯坦丁大公 · 10,430(步6,730+騎3,700) · ★中央反攻普拉欽、孤注一擲被擊退", troops:10430,
    track:[
      { t:-8, lng:16.860,lat:49.132,s:10430, st:'march' },
      { t:-1, lng:16.806,lat:49.130,s:10430, st:'hold' },  // 普拉欽後預備
      { t:3.5,lng:16.788,lat:49.126,s:10430, st:'attack' },
      { t:4.5,lng:16.770,lat:49.122,s:9000,  st:'charge' },// ★近衛騎兵反攻普拉欽
      { t:6,  lng:16.790,lat:49.126,s:5500,  st:'rout' },  // 被貝西埃爾近衛軍＋貝爾納多特擊退
      { t:9,  lng:16.820,lat:49.130,s:4000,  st:'march' },
    ]},

  /* ===================== 野戰砲兵（雙方，拋物線砲彈互轟） ===================== */
  { id:"fr_battery", name_zh:"法軍砲兵群", name_ja:"Grand Battery", side:'east', faction:'french_arty', factionColor:0x24407a, kind:'artillery',
    title:"法軍野戰砲兵 · 戈德巴赫西岸側射 → 突破後上普拉欽居高轟擊", troops:2600,
    track:[
      { t:-8, lng:16.700,lat:49.120,s:2600, st:'march' },
      { t:-1, lng:16.726,lat:49.122,s:2600, st:'hold' },
      { t:0.5,lng:16.732,lat:49.118,s:2600, st:'attack' },  // 側射封鎖聯軍渡溪
      { t:4,  lng:16.756,lat:49.117,s:2600, st:'attack' },  // 隨突破上普拉欽
      { t:9,  lng:16.768,lat:49.108,s:2500, st:'attack' },  // 居高轟南線潰兵/冰湖方向
      { t:12, lng:16.770,lat:49.106,s:2400, st:'hold' },
    ]},
  { id:"allied_battery", name_zh:"聯軍砲兵", name_ja:"Allied Battery", side:'west', faction:'russian_line', factionColor:0x3a6a44, kind:'artillery',
    title:"俄奧野戰砲兵 · 普拉欽高地砲列(42門) → 中央失守後撤", troops:2200,
    track:[
      { t:-8, lng:16.840,lat:49.120,s:2200, st:'march' },
      { t:-1, lng:16.778,lat:49.116,s:2200, st:'hold' },    // 普拉欽砲列
      { t:0.5,lng:16.774,lat:49.114,s:2200, st:'attack' },
      { t:3.5,lng:16.776,lat:49.116,s:1800, st:'attack' },  // 中央突破後被壓制
      { t:6,  lng:16.792,lat:49.112,s:900,  st:'rout' },
      { t:9,  lng:16.806,lat:49.108,s:600,  st:'rout' },
    ]},
];
