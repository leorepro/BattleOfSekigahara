/* =========================================================================
 * data/armies.js — 關原雙方部隊
 *   side : 'east'(德川/藍) | 'west'(石田/紅)
 *   crest: 對應 SEKI.crests 的家紋 key
 *   track: 時間軸關鍵影格 {t, lng, lat, s, st}
 *          t  = 時刻（小時，8=辰刻開戰 … 14=未刻崩潰），引擎於影格間內插
 *          s  = 兵力（人）  st = 狀態 hold/march/attack/rout/breakthrough
 *   座標為近似佈陣，重在演示時間軸演進，非精確考證。
 * ======================================================================= */
window.SEKI = window.SEKI || {};

SEKI.armies = [
  /* ============================ 西軍（紅） ============================ */
  { name_zh:"石田三成", name_ja:"石田三成", side:'west', crest:'daiichi', kind:'artillery',
    title:"西軍 主將 · 笹尾山本陣", troops:6000,
    track:[
      { t:8,  lng:136.4585, lat:35.3790, s:6000, st:'hold' },
      { t:11, lng:136.4585, lat:35.3790, s:6000, st:'attack' },
      { t:13, lng:136.4590, lat:35.3795, s:5200, st:'hold' },
      { t:14, lng:136.4560, lat:35.3850, s:3000, st:'rout' },     // 北走
    ]},
  { name_zh:"宇喜多秀家", name_ja:"宇喜多秀家", side:'west', crest:'jiMonji', kind:'infantry',
    title:"西軍 副將 · 天滿山", troops:17000,
    track:[
      { t:8,  lng:136.4620, lat:35.3668, s:17000, st:'hold' },
      { t:10, lng:136.4655, lat:35.3660, s:17000, st:'attack' },  // 與福島正面衝突
      { t:12.5, lng:136.4650, lat:35.3662, s:14000, st:'attack' },
      { t:13.5, lng:136.4610, lat:35.3690, s:8000, st:'rout' },
    ]},
  { name_zh:"大谷吉繼", name_ja:"大谷吉継", side:'west', crest:'mukaiCho', kind:'infantry',
    title:"西軍 · 藤川 · 松尾山麓", troops:5000,
    track:[
      { t:8,  lng:136.4560, lat:35.3540, s:5000, st:'hold' },
      { t:12, lng:136.4565, lat:35.3545, s:5000, st:'attack' },   // 死守小早川來路
      { t:12.8, lng:136.4560, lat:35.3548, s:2500, st:'rout' },   // 小早川倒戈後潰滅
      { t:13.2, lng:136.4560, lat:35.3548, s:0, st:'rout' },
    ]},
  { name_zh:"小早川秀秋", name_ja:"小早川秀秋", side:'west', crest:'chigaiKama', kind:'infantry',
    title:"松尾山 · 正午倒戈", troops:15600,
    track:[
      { t:8,  lng:136.4480, lat:35.3470, s:15600, st:'hold' },    // 按兵不動
      { t:11.9, lng:136.4480, lat:35.3470, s:15600, st:'hold' },
      { t:12,  lng:136.4500, lat:35.3490, s:15600, st:'attack' }, // ★倒戈，下松尾山
      { t:12.8, lng:136.4555, lat:35.3535, s:15600, st:'attack' },// 攻向大谷
    ]},
  { name_zh:"毛利秀元", name_ja:"毛利秀元", side:'west', crest:'ichimonjiMitsuboshi', kind:'infantry',
    title:"南宮山 · 按兵不動", troops:15000,
    track:[
      { t:8,  lng:136.4930, lat:35.3430, s:15000, st:'hold' },
      { t:14, lng:136.4930, lat:35.3430, s:15000, st:'hold' },    // 吉川廣家阻擋，全程未戰
    ]},
  { name_zh:"島津義弘", name_ja:"島津義弘", side:'west', crest:'maruJuji', kind:'matchlock',
    title:"西軍 · 敵中突破", troops:1500,
    track:[
      { t:8,  lng:136.4640, lat:35.3760, s:1500, st:'hold' },
      { t:13.5, lng:136.4640, lat:35.3755, s:1500, st:'hold' },   // 孤軍靜止
      { t:13.8, lng:136.4690, lat:35.3650, s:1200, st:'breakthrough' }, // 正面突破
      { t:14, lng:136.4760, lat:35.3540, s:800, st:'breakthrough' },    // 向伊勢街道退卻
    ]},

  /* ============================ 東軍（藍） ============================ */
  { name_zh:"德川家康", name_ja:"徳川家康", side:'east', crest:'mitsubaAoi', kind:'command',
    title:"東軍 總大將 · 桃配山→陣場野", troops:30000,
    track:[
      { t:8,  lng:136.4790, lat:35.3600, s:30000, st:'hold' },    // 桃配山初陣
      { t:11, lng:136.4720, lat:35.3635, s:30000, st:'march' },   // 前移陣場野
      { t:12.5, lng:136.4700, lat:35.3645, s:30000, st:'attack' },
      { t:14, lng:136.4660, lat:35.3650, s:30000, st:'attack' },
    ]},
  { name_zh:"福島正則", name_ja:"福島正則", side:'east', crest:'omodaka', kind:'infantry',
    title:"東軍 先鋒", troops:6000,
    track:[
      { t:8,  lng:136.4730, lat:35.3660, s:6000, st:'hold' },
      { t:10, lng:136.4670, lat:35.3662, s:6000, st:'attack' },   // 與宇喜多激戰
      { t:13, lng:136.4640, lat:35.3666, s:5000, st:'attack' },
      { t:14, lng:136.4615, lat:35.3680, s:5000, st:'attack' },
    ]},
  { name_zh:"井伊直政", name_ja:"井伊直政", side:'east', crest:'tachibana', kind:'cavalry',
    title:"東軍 · 赤備", troops:3600,
    track:[
      { t:8,  lng:136.4760, lat:35.3620, s:3600, st:'march' },
      { t:9,  lng:136.4700, lat:35.3640, s:3600, st:'attack' },   // 抜け駆け開戰
      { t:13, lng:136.4650, lat:35.3650, s:3600, st:'attack' },
      { t:14, lng:136.4620, lat:35.3660, s:3500, st:'attack' },
    ]},
  { name_zh:"本多忠勝", name_ja:"本多忠勝", side:'east', crest:'tachiAoi', kind:'cavalry',
    title:"東軍 · 軍監", troops:500,
    track:[
      { t:8,  lng:136.4770, lat:35.3635, s:500, st:'march' },
      { t:11, lng:136.4700, lat:35.3648, s:500, st:'attack' },
      { t:14, lng:136.4650, lat:35.3655, s:500, st:'attack' },
    ]},
  { name_zh:"黒田長政", name_ja:"黒田長政", side:'east', crest:'fujiTomoe', kind:'matchlock',
    title:"東軍 · 北翼", troops:5400,
    track:[
      { t:8,  lng:136.4720, lat:35.3725, s:5400, st:'hold' },
      { t:10, lng:136.4660, lat:35.3740, s:5400, st:'attack' },   // 攻笹尾山石田
      { t:13, lng:136.4630, lat:35.3760, s:5000, st:'attack' },
      { t:14, lng:136.4610, lat:35.3780, s:5000, st:'attack' },
    ]},
  { name_zh:"細川忠興", name_ja:"細川忠興", side:'east', crest:'kuyo',
    title:"東軍 · 北翼", troops:5000,
    track:[
      { t:8,  lng:136.4700, lat:35.3705, s:5000, st:'hold' },
      { t:10, lng:136.4655, lat:35.3715, s:5000, st:'attack' },
      { t:14, lng:136.4615, lat:35.3745, s:4600, st:'attack' },
    ]},
];
