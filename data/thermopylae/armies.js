/* =========================================================================
 * data/thermopylae/armies.js — 溫泉關之戰雙方部隊（行軍→集結→會戰，前480年）
 *   side: 'east'(波斯/藍) | 'west'(希臘/紅)；faction/factionColor 逐邦色
 *   kind: command/infantry/archer/cavalry；track {t,lng,lat,s,st}
 *   ※ 座標貼合「彎曲海岸走廊」：中段窄門 lat≈38.796；西段走廊偏北 lat≈38.83~38.87(沿灣)、
 *     東段 lat≈38.81~38.84。波斯人海屯駐西側 approach 平原(lng22.46~22.51)、希臘守窄門，
 *     呈現「少數希臘擋漏斗口、波斯巨軍堆後方」之史實比例。
 *   ※ 希臘逐邦本於希羅多德；波斯採現代估計~11萬(UI並陳希羅多德170萬)。
 * ======================================================================= */
window.SEKI = window.SEKI || {};

SEKI.armies = [
  /* ===================== 希臘聯軍（紅·暖色，自東段走廊進駐窄門） ===================== */
  { id:"leonidas", name_zh:"列奧尼達一世", name_ja:"Λεωνίδας", side:'west', faction:'sparta', factionColor:0xb11f2a, kind:'command',
    title:"斯巴達國王 · 298 精兵 · 中門死守至最後", troops:298,
    track:[
      { t:-16, lng:22.7600,lat:38.8360,s:298, st:'march' },
      { t:-11, lng:22.6400,lat:38.8060,s:298, st:'march' },
      { t:-8,  lng:22.5650,lat:38.7985,s:298, st:'march' },
      { t:-7,  lng:22.5395,lat:38.7960,s:298, st:'hold' },
      { t:2,   lng:22.5388,lat:38.7960,s:298, st:'attack' },
      { t:8,   lng:22.5390,lat:38.7958,s:296, st:'hold' },
      { t:11,  lng:22.5388,lat:38.7960,s:294, st:'attack' },
      { t:16,  lng:22.5390,lat:38.7958,s:290, st:'hold' },
      { t:19,  lng:22.5378,lat:38.7962,s:290, st:'march' },
      { t:20,  lng:22.5392,lat:38.7964,s:280, st:'attack' },
      { t:22,  lng:22.5398,lat:38.7966,s:120, st:'attack' },
      { t:23,  lng:22.5400,lat:38.7967,s:0,   st:'rout' },
    ]},
  { id:"thespiae", name_zh:"賽斯比軍", name_ja:"Θεσπιαί", side:'west', faction:'thespiae', factionColor:0xc8842e, kind:'infantry',
    title:"賽斯比 700 · 拒絕撤退 · 與斯巴達共死", troops:700,
    track:[
      { t:-16, lng:22.7550,lat:38.8330,s:700, st:'march' },
      { t:-10, lng:22.6300,lat:38.8030,s:700, st:'march' },
      { t:-7,  lng:22.5430,lat:38.7948,s:700, st:'hold' },
      { t:2,   lng:22.5410,lat:38.7952,s:700, st:'attack' },
      { t:16,  lng:22.5418,lat:38.7950,s:680, st:'hold' },
      { t:19,  lng:22.5402,lat:38.7958,s:680, st:'attack' },
      { t:22,  lng:22.5396,lat:38.7964,s:300, st:'attack' },
      { t:23,  lng:22.5400,lat:38.7967,s:0,   st:'rout' },
    ]},
  { id:"thebes", name_zh:"底比斯軍", name_ja:"Θῆβαι", side:'west', faction:'thebes', factionColor:0xd4a82a, kind:'infantry',
    title:"底比斯 400 · 殿後（一說最後向波斯投降）", troops:400,
    track:[
      { t:-16, lng:22.7500,lat:38.8300,s:400, st:'march' },
      { t:-10, lng:22.6250,lat:38.8020,s:400, st:'march' },
      { t:-7,  lng:22.5450,lat:38.7940,s:400, st:'hold' },
      { t:2,   lng:22.5430,lat:38.7946,s:400, st:'attack' },
      { t:19,  lng:22.5430,lat:38.7948,s:380, st:'hold' },
      { t:22,  lng:22.5404,lat:38.7960,s:200, st:'attack' },
      { t:23.5,lng:22.5410,lat:38.7962,s:120, st:'rout' },
    ]},
  { id:"phocis", name_zh:"佛西斯軍", name_ja:"Φωκεῖς", side:'west', faction:'phocis', factionColor:0xb08a3a, kind:'infantry',
    title:"佛西斯 1000 · 守安諾派亞山徑（第三日被不死軍繞過）", troops:1000,
    track:[
      { t:-16, lng:22.7400,lat:38.8280,s:1000, st:'march' },
      { t:-10, lng:22.6500,lat:38.8000,s:1000, st:'march' },
      { t:-6,  lng:22.5880,lat:38.7810,s:1000, st:'hold' },  // 守山徑高地
      { t:8,   lng:22.5890,lat:38.7805,s:1000, st:'hold' },
      { t:16,  lng:22.5910,lat:38.7800,s:1000, st:'attack' },
      { t:16.5,lng:22.5950,lat:38.7785,s:900, st:'march' },
      { t:24,  lng:22.6000,lat:38.7780,s:900, st:'hold' },
    ]},
  { id:"arcadia", name_zh:"阿卡迪亞軍", name_ja:"Ἀρκαδία", side:'west', faction:'arcadia', factionColor:0x9c5a33, kind:'infantry',
    title:"阿卡迪亞聯軍 1120（曼提尼亞/特吉亞等）", troops:1120,
    track:[
      { t:-16, lng:22.7450,lat:38.8260,s:1120, st:'march' },
      { t:-9,  lng:22.6000,lat:38.8000,s:1120, st:'march' },
      { t:-6,  lng:22.5460,lat:38.7945,s:1120, st:'hold' },
      { t:2,   lng:22.5440,lat:38.7950,s:1120, st:'attack' },
      { t:11,  lng:22.5445,lat:38.7948,s:1100, st:'attack' },
      { t:18,  lng:22.5600,lat:38.7980,s:1100, st:'march' },  // 遣散·沿走廊東撤
      { t:24,  lng:22.6600,lat:38.8100,s:1100, st:'march' },
    ]},
  { id:"corinth", name_zh:"科林斯軍", name_ja:"Κόρινθος", side:'west', faction:'corinth', factionColor:0xd9533a, kind:'infantry',
    title:"科林斯 400（盾徽飛馬 Pegasus）", troops:400,
    track:[
      { t:-16, lng:22.7400,lat:38.8240,s:400, st:'march' },
      { t:-9,  lng:22.5950,lat:38.7990,s:400, st:'march' },
      { t:-6,  lng:22.5470,lat:38.7942,s:400, st:'hold' },
      { t:5,   lng:22.5450,lat:38.7948,s:400, st:'attack' },
      { t:18,  lng:22.5600,lat:38.7980,s:395, st:'march' },
      { t:24,  lng:22.6650,lat:38.8100,s:395, st:'march' },
    ]},
  { id:"tegea_mant", name_zh:"特吉亞·曼提尼亞軍", name_ja:"Τεγέα · Μαντίνεια", side:'west', faction:'tegea', factionColor:0xa01f28, kind:'infantry',
    title:"特吉亞 500 + 曼提尼亞 500", troops:1000,
    track:[
      { t:-16, lng:22.7350,lat:38.8220,s:1000, st:'march' },
      { t:-9,  lng:22.5900,lat:38.7985,s:1000, st:'march' },
      { t:-6,  lng:22.5480,lat:38.7938,s:1000, st:'hold' },
      { t:5,   lng:22.5458,lat:38.7946,s:1000, st:'attack' },
      { t:18,  lng:22.5620,lat:38.7985,s:990, st:'march' },
      { t:24,  lng:22.6620,lat:38.8100,s:990, st:'march' },
    ]},
  { id:"other_greek", name_zh:"其他城邦聯軍", name_ja:"Φλιοῦς · Μυκῆναι · Λοκροί", side:'west', faction:'phlius', factionColor:0xd9772a, kind:'infantry',
    title:"菲琉斯 200 · 邁錫尼 80 · 奧普蒂恩-羅克里斯等", troops:600,
    track:[
      { t:-16, lng:22.7300,lat:38.8200,s:600, st:'march' },
      { t:-9,  lng:22.5850,lat:38.7980,s:600, st:'march' },
      { t:-6,  lng:22.5485,lat:38.7935,s:600, st:'hold' },
      { t:5,   lng:22.5462,lat:38.7944,s:600, st:'attack' },
      { t:18,  lng:22.5640,lat:38.7988,s:590, st:'march' },
      { t:24,  lng:22.6680,lat:38.8100,s:590, st:'march' },
    ]},

  /* ===================== 波斯帝國（藍·冷色，自西段海岸走廊開進，屯駐 approach 平原） ===================== */
  { id:"xerxes", name_zh:"薛西斯一世", name_ja:"Xšayāršā", side:'east', faction:'persia_royal', factionColor:0x6a3d9a, kind:'command',
    title:"波斯萬王之王 · 特拉基斯平原本陣觀戰", troops:2000,
    track:[
      { t:-16, lng:22.3600,lat:38.8720,s:2000, st:'march' },
      { t:-9,  lng:22.4820,lat:38.8200,s:2000, st:'hold' },  // 平原高處設寶座觀戰
      { t:2,   lng:22.4820,lat:38.8200,s:2000, st:'hold' },
      { t:26,  lng:22.4820,lat:38.8200,s:2000, st:'hold' },
    ]},
  { id:"medes", name_zh:"米底軍", name_ja:"Μῆδοι", side:'east', faction:'medes', factionColor:0x4a6a8a, kind:'infantry',
    title:"米底·西西亞軍 · 第一日首波強攻", troops:20000,
    track:[
      { t:-16, lng:22.3700,lat:38.8700,s:20000, st:'march' },
      { t:-6,  lng:22.4900,lat:38.8120,s:20000, st:'march' },
      { t:-2,  lng:22.5150,lat:38.8030,s:20000, st:'march' }, // 西門前集結
      { t:1,   lng:22.5320,lat:38.7972,s:20000, st:'attack' },// 強攻窄門
      { t:4,   lng:22.5335,lat:38.7970,s:17000, st:'attack' },
      { t:7,   lng:22.5180,lat:38.8000,s:15000, st:'march' }, // 敗退
      { t:26,  lng:22.5050,lat:38.8060,s:15000, st:'hold' },
    ]},
  { id:"immortals", name_zh:"不死軍", name_ja:"Ἀθάνατοι", side:'east', faction:'immortals', factionColor:0x2a4a8a, kind:'infantry',
    title:"波斯萬人精銳 · 第一日受挫→第三日循山徑迂迴包抄", troops:10000,
    track:[
      { t:-16, lng:22.3650,lat:38.8740,s:10000, st:'march' },
      { t:-7,  lng:22.4850,lat:38.8160,s:10000, st:'hold' },
      { t:5,   lng:22.5325,lat:38.7972,s:10000, st:'attack' },
      { t:8,   lng:22.5180,lat:38.8010,s:9000,  st:'march' },
      { t:15,  lng:22.5500,lat:38.7850,s:9000,  st:'march' }, // 夜入山徑(向南上山)
      { t:16.5,lng:22.5900,lat:38.7790,s:9000,  st:'march' }, // 越卡利德羅莫
      { t:18,  lng:22.5820,lat:38.7930,s:9000,  st:'attack' },// 東門下山·背後包抄
      { t:21,  lng:22.5410,lat:38.7965,s:8500,  st:'attack' },
      { t:26,  lng:22.5400,lat:38.7967,s:8500,  st:'hold' },
    ]},
  { id:"persian_main", name_zh:"波斯本軍", name_ja:"Πέρσαι", side:'east', faction:'persia', factionColor:0x3a3a8a, kind:'infantry',
    title:"波斯主力步兵 · 第二日輪番猛攻", troops:40000,
    track:[
      { t:-16, lng:22.3550,lat:38.8680,s:40000, st:'march' },
      { t:-6,  lng:22.4750,lat:38.8170,s:40000, st:'hold' }, // 屯駐 approach 平原(深厚人海)
      { t:6,   lng:22.5300,lat:38.7975,s:40000, st:'attack' },
      { t:13,  lng:22.5318,lat:38.7972,s:36000, st:'attack' },
      { t:16,  lng:22.5180,lat:38.8000,s:35000, st:'hold' },
      { t:20,  lng:22.5350,lat:38.7968,s:35000, st:'attack' },
      { t:23,  lng:22.5396,lat:38.7964,s:33000, st:'attack' },
      { t:26,  lng:22.5380,lat:38.7965,s:33000, st:'hold' },
    ]},
  { id:"persian_archers", name_zh:"波斯弓兵", name_ja:"Τοξόται", side:'east', faction:'persia_archer', factionColor:0x2f6a72, kind:'archer',
    title:"波斯弓兵 · 箭雨遮天（結局覆蓋科洛諾斯小丘）", troops:8000,
    track:[
      { t:-15, lng:22.3800,lat:38.8620,s:8000, st:'march' },
      { t:-2,  lng:22.5100,lat:38.8040,s:8000, st:'march' },
      { t:1,   lng:22.5260,lat:38.7985,s:8000, st:'attack' },
      { t:16,  lng:22.5250,lat:38.7990,s:8000, st:'hold' },
      { t:21,  lng:22.5360,lat:38.7972,s:8000, st:'attack' }, // 對科洛諾斯箭雨
      { t:23,  lng:22.5380,lat:38.7968,s:8000, st:'attack' },
      { t:26,  lng:22.5380,lat:38.7968,s:8000, st:'hold' },
    ]},
  { id:"persian_subjects", name_zh:"屬民聯軍", name_ja:"Βάκτριοι · Σάκαι κ.ἄ.", side:'east', faction:'persia_subjects', factionColor:0x5a6a7a, kind:'infantry',
    title:"巴克特里亞·薩迦等帝國屬民 · 人海後備", troops:30000,
    track:[
      { t:-16, lng:22.3450,lat:38.8780,s:30000, st:'march' },
      { t:-4,  lng:22.4650,lat:38.8240,s:30000, st:'hold' }, // 最深厚人海·屯平原
      { t:12,  lng:22.5050,lat:38.8050,s:30000, st:'march' },
      { t:20,  lng:22.5200,lat:38.7990,s:30000, st:'march' },
      { t:26,  lng:22.5250,lat:38.7985,s:30000, st:'hold' },
    ]},
];
