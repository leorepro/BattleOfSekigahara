/* =========================================================================
 * data/thermopylae/armies.js — 溫泉關之戰雙方部隊（含「遠方行軍→集結→會戰」三日，前480年）
 *   side : 'east'(波斯/藍) | 'west'(希臘/紅)
 *   faction / factionColor : 城邦或民族 + 專屬色（暖色=希臘、冷色=波斯）
 *   kind : command / infantry / archer / cavalry
 *   track: {t, lng, lat, s, st}（st: hold/march/attack/rout）
 *     行軍序幕(t -16~0)：波斯自西(特拉基斯/帖薩利亞方向)、希臘自東(中部)分別開進中門集結；
 *     會戰(t 0~24)：第一日0~8、第二日8~16、第三日16~24；尾聲24~26。
 *   ※ 希臘逐邦本於希羅多德；波斯採現代可信估計(~11萬，UI 並陳希羅多德170萬)。
 * ======================================================================= */
window.SEKI = window.SEKI || {};

SEKI.armies = [
  /* ============================ 希臘聯軍（紅 · 暖色，自東進場） ============================ */
  { id:"leonidas", name_zh:"列奧尼達一世", name_ja:"Λεωνίδας", side:'west', faction:'sparta', factionColor:0xb11f2a, kind:'command',
    title:"斯巴達國王 · 298 精兵 · 中門死守至最後", troops:298,
    track:[
      { t:-16, lng:22.7400,lat:38.7980,s:298, st:'march' },   // 自中部行軍而來（東）
      { t:-10, lng:22.6000,lat:38.7970,s:298, st:'march' },
      { t:-7,  lng:22.5450,lat:38.7960,s:298, st:'hold' },    // 抵中門·重修福基斯牆
      { t:0,   lng:22.5375,lat:38.7958,s:298, st:'hold' },
      { t:2,   lng:22.5378,lat:38.7958,s:298, st:'attack' },  // 盾牆迎擊
      { t:8,   lng:22.5375,lat:38.7958,s:296, st:'hold' },
      { t:11,  lng:22.5378,lat:38.7958,s:294, st:'attack' },
      { t:16,  lng:22.5375,lat:38.7958,s:290, st:'hold' },
      { t:19,  lng:22.5370,lat:38.7955,s:290, st:'march' },   // 出牆推進
      { t:20,  lng:22.5384,lat:38.7960,s:280, st:'attack' },
      { t:22,  lng:22.5390,lat:38.7964,s:120, st:'attack' },  // 列奧尼達戰死·奪屍
      { t:23,  lng:22.5392,lat:38.7965,s:0,   st:'rout' },    // 科洛諾斯·箭雨全滅
    ]},
  { id:"thespiae", name_zh:"賽斯比軍", name_ja:"Θεσπιαί", side:'west', faction:'thespiae', factionColor:0xc8842e, kind:'infantry',
    title:"賽斯比 700 · 拒絕撤退 · 與斯巴達共死", troops:700,
    track:[
      { t:-16, lng:22.7350,lat:38.7935,s:700, st:'march' },
      { t:-9,  lng:22.5900,lat:38.7950,s:700, st:'march' },
      { t:-6,  lng:22.5350,lat:38.7950,s:700, st:'hold' },
      { t:2,   lng:22.5368,lat:38.7954,s:700, st:'attack' },
      { t:16,  lng:22.5358,lat:38.7952,s:680, st:'hold' },
      { t:19,  lng:22.5366,lat:38.7956,s:680, st:'attack' },
      { t:22,  lng:22.5386,lat:38.7962,s:300, st:'attack' },
      { t:23,  lng:22.5392,lat:38.7965,s:0,   st:'rout' },
    ]},
  { id:"thebes", name_zh:"底比斯軍", name_ja:"Θῆβαι", side:'west', faction:'thebes', factionColor:0xd4a82a, kind:'infantry',
    title:"底比斯 400 · 殿後（一說最後向波斯投降）", troops:400,
    track:[
      { t:-16, lng:22.7300,lat:38.7920,s:400, st:'march' },
      { t:-9,  lng:22.5850,lat:38.7940,s:400, st:'march' },
      { t:-6,  lng:22.5345,lat:38.7948,s:400, st:'hold' },
      { t:2,   lng:22.5362,lat:38.7952,s:400, st:'attack' },
      { t:19,  lng:22.5360,lat:38.7952,s:380, st:'hold' },
      { t:22,  lng:22.5378,lat:38.7958,s:200, st:'attack' },
      { t:23.5,lng:22.5384,lat:38.7960,s:120, st:'rout' },    // ⚠投降說
    ]},
  { id:"phocis", name_zh:"佛西斯軍", name_ja:"Φωκεῖς", side:'west', faction:'phocis', factionColor:0xb08a3a, kind:'infantry',
    title:"佛西斯 1000 · 守安諾派亞山徑（第三日被不死軍繞過）", troops:1000,
    track:[
      { t:-16, lng:22.7500,lat:38.7880,s:1000, st:'march' },
      { t:-9,  lng:22.6200,lat:38.7840,s:1000, st:'march' },
      { t:-6,  lng:22.5860,lat:38.7805,s:1000, st:'hold' },   // 受命守山徑
      { t:8,   lng:22.5880,lat:38.7800,s:1000, st:'hold' },
      { t:16,  lng:22.5900,lat:38.7800,s:1000, st:'attack' }, // 不死軍夜至
      { t:16.5,lng:22.5940,lat:38.7820,s:900, st:'march' },   // 被繞過
      { t:24,  lng:22.5980,lat:38.7850,s:900, st:'hold' },
    ]},
  { id:"arcadia", name_zh:"阿卡迪亞軍", name_ja:"Ἀρκαδία", side:'west', faction:'arcadia', factionColor:0x9c5a33, kind:'infantry',
    title:"阿卡迪亞聯軍 1120（曼提尼亞/特吉亞等）", troops:1120,
    track:[
      { t:-16, lng:22.7250,lat:38.7945,s:1120, st:'march' },
      { t:-8,  lng:22.5700,lat:38.7950,s:1120, st:'march' },
      { t:-6,  lng:22.5335,lat:38.7946,s:1120, st:'hold' },
      { t:2,   lng:22.5356,lat:38.7950,s:1120, st:'attack' },
      { t:11,  lng:22.5350,lat:38.7950,s:1100, st:'attack' },
      { t:18,  lng:22.5320,lat:38.7948,s:1100, st:'march' },  // 第三日遣散撤退
      { t:24,  lng:22.6400,lat:38.7900,s:1100, st:'march' },
    ]},
  { id:"corinth", name_zh:"科林斯軍", name_ja:"Κόρινθος", side:'west', faction:'corinth', factionColor:0xd9533a, kind:'infantry',
    title:"科林斯 400（盾徽飛馬 Pegasus）", troops:400,
    track:[
      { t:-16, lng:22.7200,lat:38.7935,s:400, st:'march' },
      { t:-8,  lng:22.5650,lat:38.7945,s:400, st:'march' },
      { t:-6,  lng:22.5340,lat:38.7944,s:400, st:'hold' },
      { t:5,   lng:22.5358,lat:38.7950,s:400, st:'attack' },
      { t:18,  lng:22.5325,lat:38.7946,s:395, st:'march' },
      { t:24,  lng:22.6500,lat:38.7900,s:395, st:'march' },
    ]},
  { id:"tegea_mant", name_zh:"特吉亞·曼提尼亞軍", name_ja:"Τεγέα · Μαντίνεια", side:'west', faction:'tegea', factionColor:0xa01f28, kind:'infantry',
    title:"特吉亞 500 + 曼提尼亞 500", troops:1000,
    track:[
      { t:-16, lng:22.7150,lat:38.7925,s:1000, st:'march' },
      { t:-8,  lng:22.5600,lat:38.7940,s:1000, st:'march' },
      { t:-6,  lng:22.5348,lat:38.7942,s:1000, st:'hold' },
      { t:5,   lng:22.5360,lat:38.7948,s:1000, st:'attack' },
      { t:18,  lng:22.5328,lat:38.7944,s:990, st:'march' },
      { t:24,  lng:22.6450,lat:38.7895,s:990, st:'march' },
    ]},
  { id:"other_greek", name_zh:"其他城邦聯軍", name_ja:"Φλιοῦς · Μυκῆναι · Λοκροί", side:'west', faction:'phlius', factionColor:0xd9772a, kind:'infantry',
    title:"菲琉斯 200 · 邁錫尼 80 · 奧普蒂恩-羅克里斯等", troops:600,
    track:[
      { t:-16, lng:22.7100,lat:38.7915,s:600, st:'march' },
      { t:-8,  lng:22.5550,lat:38.7935,s:600, st:'march' },
      { t:-6,  lng:22.5342,lat:38.7940,s:600, st:'hold' },
      { t:5,   lng:22.5358,lat:38.7946,s:600, st:'attack' },
      { t:18,  lng:22.5330,lat:38.7942,s:590, st:'march' },
      { t:24,  lng:22.6550,lat:38.7895,s:590, st:'march' },
    ]},

  /* ============================ 波斯帝國（藍 · 冷色，自西開進） ============================ */
  { id:"xerxes", name_zh:"薛西斯一世", name_ja:"Xšayāršā", side:'east', faction:'persia_royal', factionColor:0x6a3d9a, kind:'command',
    title:"波斯萬王之王 · 特拉基斯平原本陣觀戰", troops:2000,
    track:[
      { t:-16, lng:22.3500,lat:38.8600,s:2000, st:'march' },  // 自帖薩利亞沿岸南下
      { t:-9,  lng:22.4700,lat:38.8120,s:2000, st:'hold' },   // 特拉基斯平原紮營·設寶座
      { t:2,   lng:22.4700,lat:38.8120,s:2000, st:'hold' },
      { t:26,  lng:22.4700,lat:38.8120,s:2000, st:'hold' },
    ]},
  { id:"medes", name_zh:"米底軍", name_ja:"Μῆδοι", side:'east', faction:'medes', factionColor:0x4a6a8a, kind:'infantry',
    title:"米底·西西亞軍 · 第一日首波強攻", troops:20000,
    track:[
      { t:-16, lng:22.3300,lat:38.8050,s:20000, st:'march' }, // 西邊開進
      { t:-6,  lng:22.4600,lat:38.8080,s:20000, st:'march' },
      { t:-2,  lng:22.5180,lat:38.8000,s:20000, st:'march' }, // 西門集結
      { t:1,   lng:22.5300,lat:38.7958,s:20000, st:'attack' },// 正面強攻中門
      { t:4,   lng:22.5320,lat:38.7958,s:17000, st:'attack' },
      { t:7,   lng:22.5240,lat:38.7965,s:15000, st:'march' }, // 敗退
      { t:26,  lng:22.5000,lat:38.7990,s:15000, st:'hold' },
    ]},
  { id:"immortals", name_zh:"不死軍", name_ja:"Ἀθάνατοι", side:'east', faction:'immortals', factionColor:0x2a4a8a, kind:'infantry',
    title:"波斯萬人精銳 · 第一日受挫→第三日循山徑迂迴包抄", troops:10000,
    track:[
      { t:-16, lng:22.3200,lat:38.8120,s:10000, st:'march' },
      { t:-7,  lng:22.4500,lat:38.8150,s:10000, st:'hold' },
      { t:5,   lng:22.5310,lat:38.7958,s:10000, st:'attack' },// 第一日投入
      { t:8,   lng:22.5240,lat:38.7968,s:9000,  st:'march' },
      { t:15,  lng:22.5300,lat:38.7860,s:9000,  st:'march' },// 夜入山徑
      { t:16.5,lng:22.5900,lat:38.7800,s:9000,  st:'march' },// 越卡利德羅莫
      { t:18,  lng:22.5820,lat:38.7930,s:9000,  st:'attack' },// 東門下山·背後包抄
      { t:21,  lng:22.5400,lat:38.7962,s:8500,  st:'attack' },
      { t:26,  lng:22.5392,lat:38.7965,s:8500,  st:'hold' },
    ]},
  { id:"persian_main", name_zh:"波斯本軍", name_ja:"Πέρσαι", side:'east', faction:'persia', factionColor:0x3a3a8a, kind:'infantry',
    title:"波斯主力步兵 · 第二日輪番猛攻", troops:40000,
    track:[
      { t:-16, lng:22.3100,lat:38.8000,s:40000, st:'march' },
      { t:-6,  lng:22.4500,lat:38.8100,s:40000, st:'hold' }, // 平原待命
      { t:6,   lng:22.5305,lat:38.7958,s:40000, st:'attack' },// 第二日猛攻
      { t:13,  lng:22.5318,lat:38.7958,s:36000, st:'attack' },
      { t:16,  lng:22.5250,lat:38.7968,s:35000, st:'hold' },
      { t:20,  lng:22.5340,lat:38.7958,s:35000, st:'attack' },// 第三日總攻
      { t:23,  lng:22.5388,lat:38.7962,s:33000, st:'attack' },
      { t:26,  lng:22.5380,lat:38.7958,s:33000, st:'hold' },
    ]},
  { id:"persian_archers", name_zh:"波斯弓兵", name_ja:"Τοξόται", side:'east', faction:'persia_archer', factionColor:0x2f6a72, kind:'archer',
    title:"波斯弓兵 · 箭雨遮天（結局覆蓋科洛諾斯小丘）", troops:8000,
    track:[
      { t:-15, lng:22.3400,lat:38.8060,s:8000, st:'march' },
      { t:-2,  lng:22.5000,lat:38.8000,s:8000, st:'march' },
      { t:1,   lng:22.5270,lat:38.7958,s:8000, st:'attack' }, // 齊射掩護
      { t:16,  lng:22.5290,lat:38.7958,s:8000, st:'hold' },
      { t:21,  lng:22.5360,lat:38.7958,s:8000, st:'attack' }, // 對科洛諾斯箭雨
      { t:23,  lng:22.5375,lat:38.7960,s:8000, st:'attack' },
      { t:26,  lng:22.5375,lat:38.7960,s:8000, st:'hold' },
    ]},
  { id:"persian_subjects", name_zh:"屬民聯軍", name_ja:"Βάκτριοι · Σάκαι κ.ἄ.", side:'east', faction:'persia_subjects', factionColor:0x5a6a7a, kind:'infantry',
    title:"巴克特里亞·薩迦等帝國屬民 · 人海後備", troops:30000,
    track:[
      { t:-16, lng:22.3000,lat:38.8180,s:30000, st:'march' },
      { t:-4,  lng:22.4400,lat:38.8160,s:30000, st:'hold' },
      { t:12,  lng:22.5210,lat:38.7980,s:30000, st:'march' }, // 後備壓上
      { t:20,  lng:22.5280,lat:38.7965,s:30000, st:'march' },
      { t:26,  lng:22.5300,lat:38.7960,s:30000, st:'hold' },
    ]},
];
