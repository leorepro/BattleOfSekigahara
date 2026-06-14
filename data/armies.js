/* =========================================================================
 * data/armies.js — 關原戰役雙方部隊（含戰前一週戰略調動）
 *   side : 'east'(德川/藍) | 'west'(石田/紅)
 *   kind : command/artillery/matchlock/cavalry/infantry（驅動兵種特效）
 *   crest: 對應 SEKI.crests 的家紋 key
 *   track: 關鍵影格 {t, lng, lat, s, st}
 *     t  = 距「九月十五日(1600/10/21) 00:00」的小時數
 *          戰前為負：-16≈九月十四日朝、-6≈十四日夕(杭瀬川)、-3≈十四日夜(強行軍)
 *          0~6 ≈ 十五日凌晨抵關原布陣、8~14 = 決戰(辰刻~未刻)
 *     s  = 兵力  st = hold/march/attack/rout/breakthrough
 *   ※ 布陣與兵力為依江戶～明治二次史料復原之通說（見史料面板）。
 * ======================================================================= */
window.SEKI = window.SEKI || {};

// 戰前據點
const OGAKI = { lng:136.6161, lat:35.3620 };   // 大垣城（西軍據點）
const AKASAKA = { lng:136.585, lat:35.389 };    // 赤坂・岡山（東軍本陣）

SEKI.armies = [
  /* ============================ 西軍（紅） ============================ */
  { name_zh:"石田三成", name_ja:"石田三成", side:'west', crest:'daiichi', kind:'artillery',
    title:"西軍 主將 · 笹尾山本陣", troops:6000,
    track:[
      { t:-16, lng:136.616, lat:35.362, s:6000, st:'hold' },     // 大垣城
      { t:-3,  lng:136.616, lat:35.362, s:6000, st:'hold' },     // 雨夜出陣前
      { t:2,   lng:136.4587,lat:35.3718,s:6000, st:'march' },    // 強行軍抵笹尾山
      { t:6,   lng:136.4587,lat:35.3718,s:6000, st:'hold' },     // 布陣
      { t:8,   lng:136.4585, lat:35.3790, s:6000, st:'hold' },
      { t:11,  lng:136.4585, lat:35.3790, s:6000, st:'attack' },
      { t:13,  lng:136.4590, lat:35.3795, s:5200, st:'hold' },
      { t:14,  lng:136.4560, lat:35.3850, s:3000, st:'rout' },
    ]},
  { name_zh:"宇喜多秀家", name_ja:"宇喜多秀家", side:'west', crest:'jiMonji', kind:'infantry',
    title:"西軍 副將 · 天滿山", troops:17000,
    track:[
      { t:-16, lng:136.618, lat:35.360, s:17000, st:'hold' },
      { t:-3,  lng:136.618, lat:35.360, s:17000, st:'hold' },
      { t:2,   lng:136.4620,lat:35.3668,s:17000, st:'march' },
      { t:6,   lng:136.4620,lat:35.3668,s:17000, st:'hold' },
      { t:8,   lng:136.4620, lat:35.3668, s:17000, st:'hold' },
      { t:10,  lng:136.4655, lat:35.3660, s:17000, st:'attack' },
      { t:12.5,lng:136.4650, lat:35.3662, s:14000, st:'attack' },
      { t:13.5,lng:136.4610, lat:35.3690, s:8000, st:'rout' },
    ]},
  { name_zh:"小西行長", name_ja:"小西行長", side:'west', crest:'gionmamori', kind:'matchlock',
    title:"西軍 · 天滿山北（北天滿山）", troops:6000,
    track:[
      { t:-16, lng:136.617, lat:35.361, s:6000, st:'hold' },
      { t:-3,  lng:136.617, lat:35.361, s:6000, st:'hold' },
      { t:2,   lng:136.4523,lat:35.3693,s:6000, st:'march' },
      { t:6,   lng:136.4523,lat:35.3693,s:6000, st:'hold' },
      { t:8,   lng:136.4523, lat:35.3693, s:6000, st:'hold' },
      { t:10,  lng:136.4570, lat:35.3690, s:6000, st:'attack' },  // 對加藤・田中
      { t:12.5,lng:136.4560, lat:35.3700, s:4500, st:'attack' },
      { t:13.3,lng:136.4520, lat:35.3720, s:2000, st:'rout' },    // 小早川倒戈後潰
    ]},
  { name_zh:"大谷吉繼", name_ja:"大谷吉継", side:'west', crest:'mukaiCho', kind:'infantry',
    title:"西軍 · 山中 · 松尾山麓", troops:5000,
    track:[
      { t:-16, lng:136.612, lat:35.358, s:5000, st:'hold' },
      { t:-3,  lng:136.612, lat:35.358, s:5000, st:'hold' },
      { t:2,   lng:136.4560,lat:35.3540,s:5000, st:'march' },
      { t:6,   lng:136.4560,lat:35.3540,s:5000, st:'hold' },
      { t:8,   lng:136.4560, lat:35.3540, s:5000, st:'hold' },
      { t:12,  lng:136.4565, lat:35.3545, s:5000, st:'attack' },
      { t:12.8,lng:136.4560, lat:35.3548, s:2500, st:'rout' },
      { t:13.2,lng:136.4560, lat:35.3548, s:0, st:'rout' },
    ]},
  { name_zh:"小早川秀秋", name_ja:"小早川秀秋", side:'west', crest:'chigaiKama', kind:'infantry',
    title:"松尾山 · 正午倒戈", troops:15600,
    track:[
      { t:-16, lng:136.4480,lat:35.3470,s:15600, st:'hold' },    // 九月十四日已占松尾山
      { t:6,   lng:136.4480,lat:35.3470,s:15600, st:'hold' },
      { t:8,   lng:136.4480, lat:35.3470, s:15600, st:'hold' },
      { t:11.9,lng:136.4480, lat:35.3470, s:15600, st:'hold' },
      { t:12,  lng:136.4500, lat:35.3490, s:15600, st:'attack' },
      { t:12.8,lng:136.4555, lat:35.3535, s:15600, st:'attack' },
    ]},
  { name_zh:"毛利秀元", name_ja:"毛利秀元", side:'west', crest:'ichimonjiMitsuboshi', kind:'infantry',
    title:"南宮山 · 按兵不動", troops:15000,
    track:[
      { t:-16, lng:136.5098,lat:35.3468,s:15000, st:'hold' },    // 南宮山
      { t:8,   lng:136.5098, lat:35.3468, s:15000, st:'hold' },
      { t:14,  lng:136.5098, lat:35.3468, s:15000, st:'hold' },
    ]},
  { name_zh:"吉川廣家", name_ja:"吉川広家", side:'west', crest:'hikiryo', kind:'infantry',
    title:"南宮山麓 · 暗通家康（空弁当）", troops:3000,
    track:[
      { t:-16, lng:136.5000, lat:35.3460, s:3000, st:'hold' },   // 南宮山西麓
      { t:14,  lng:136.5000, lat:35.3460, s:3000, st:'hold' },   // 全程按兵不動，封堵毛利下山
    ]},
  { name_zh:"島津義弘", name_ja:"島津義弘", side:'west', crest:'maruJuji', kind:'matchlock',
    title:"西軍 · 敵中突破", troops:1500,
    track:[
      { t:-16, lng:136.620, lat:35.364, s:1500, st:'hold' },     // 大垣城
      { t:-3,  lng:136.620, lat:35.364, s:1500, st:'hold' },
      { t:2,   lng:136.4640,lat:35.3760,s:1500, st:'march' },
      { t:6,   lng:136.4640,lat:35.3760,s:1500, st:'hold' },
      { t:8,   lng:136.4640, lat:35.3760, s:1500, st:'hold' },
      { t:13.5,lng:136.4640, lat:35.3755, s:1500, st:'hold' },
      { t:13.8,lng:136.4690, lat:35.3650, s:1200, st:'breakthrough' },
      { t:14,  lng:136.4760, lat:35.3540, s:800, st:'breakthrough' },
    ]},

  /* ============================ 東軍（藍） ============================ */
  { name_zh:"德川家康", name_ja:"徳川家康", side:'east', crest:'mitsubaAoi', kind:'command',
    title:"東軍 總大將 · 赤坂→桃配山→陣場野", troops:30000,
    track:[
      { t:-16, lng:136.585, lat:35.389, s:30000, st:'hold' },    // 赤坂・岡山本陣
      { t:-6,  lng:136.585, lat:35.389, s:30000, st:'hold' },    // 杭瀬川之戰當日
      { t:0,   lng:136.585, lat:35.389, s:30000, st:'hold' },
      { t:6,   lng:136.4879,lat:35.3654,s:30000, st:'march' },   // 凌晨進抵桃配山
      { t:8,   lng:136.4790, lat:35.3600, s:30000, st:'hold' },
      { t:11,  lng:136.4720, lat:35.3635, s:30000, st:'march' },
      { t:12.5,lng:136.4700, lat:35.3645, s:30000, st:'attack' },
      { t:14,  lng:136.4660, lat:35.3650, s:30000, st:'attack' },
    ]},
  { name_zh:"福島正則", name_ja:"福島正則", side:'east', crest:'omodaka', kind:'infantry',
    title:"東軍 先鋒", troops:6000,
    track:[
      { t:-16, lng:136.583, lat:35.386, s:6000, st:'hold' },
      { t:0,   lng:136.583, lat:35.386, s:6000, st:'hold' },
      { t:6,   lng:136.4730,lat:35.3660,s:6000, st:'march' },
      { t:8,   lng:136.4730, lat:35.3660, s:6000, st:'hold' },
      { t:10,  lng:136.4670, lat:35.3662, s:6000, st:'attack' },
      { t:13,  lng:136.4640, lat:35.3666, s:5000, st:'attack' },
      { t:14,  lng:136.4615, lat:35.3680, s:5000, st:'attack' },
    ]},
  { name_zh:"井伊直政", name_ja:"井伊直政", side:'east', crest:'tachibana', kind:'cavalry',
    title:"東軍 · 赤備", troops:3600,
    track:[
      { t:-16, lng:136.586, lat:35.390, s:3600, st:'hold' },
      { t:0,   lng:136.586, lat:35.390, s:3600, st:'hold' },
      { t:6,   lng:136.4760,lat:35.3620,s:3600, st:'march' },
      { t:8,   lng:136.4760, lat:35.3620, s:3600, st:'march' },
      { t:9,   lng:136.4700, lat:35.3640, s:3600, st:'attack' },
      { t:13,  lng:136.4650, lat:35.3650, s:3600, st:'attack' },
      { t:14,  lng:136.4620, lat:35.3660, s:3500, st:'attack' },
    ]},
  { name_zh:"本多忠勝", name_ja:"本多忠勝", side:'east', crest:'tachiAoi', kind:'cavalry',
    title:"東軍 · 軍監", troops:500,
    track:[
      { t:-16, lng:136.587, lat:35.388, s:500, st:'hold' },
      { t:0,   lng:136.587, lat:35.388, s:500, st:'hold' },
      { t:6,   lng:136.4770,lat:35.3635,s:500, st:'march' },
      { t:8,   lng:136.4770, lat:35.3635, s:500, st:'march' },
      { t:11,  lng:136.4700, lat:35.3648, s:500, st:'attack' },
      { t:14,  lng:136.4650, lat:35.3655, s:500, st:'attack' },
    ]},
  { name_zh:"黒田長政", name_ja:"黒田長政", side:'east', crest:'fujiTomoe', kind:'matchlock',
    title:"東軍 · 北翼", troops:5400,
    track:[
      { t:-16, lng:136.584, lat:35.390, s:5400, st:'hold' },
      { t:0,   lng:136.584, lat:35.390, s:5400, st:'hold' },
      { t:6,   lng:136.4720,lat:35.3725,s:5400, st:'march' },
      { t:8,   lng:136.4720, lat:35.3725, s:5400, st:'hold' },
      { t:10,  lng:136.4660, lat:35.3740, s:5400, st:'attack' },
      { t:13,  lng:136.4630, lat:35.3760, s:5000, st:'attack' },
      { t:14,  lng:136.4610, lat:35.3780, s:5000, st:'attack' },
    ]},
  { name_zh:"細川忠興", name_ja:"細川忠興", side:'east', crest:'kuyo', kind:'infantry',
    title:"東軍 · 北翼", troops:5000,
    track:[
      { t:-16, lng:136.585, lat:35.391, s:5000, st:'hold' },
      { t:0,   lng:136.585, lat:35.391, s:5000, st:'hold' },
      { t:6,   lng:136.4700,lat:35.3705,s:5000, st:'march' },
      { t:8,   lng:136.4700, lat:35.3705, s:5000, st:'hold' },
      { t:10,  lng:136.4655, lat:35.3715, s:5000, st:'attack' },
      { t:14,  lng:136.4615, lat:35.3745, s:4600, st:'attack' },
    ]},
  { name_zh:"藤堂高虎", name_ja:"藤堂高虎", side:'east', crest:'tsuta', kind:'infantry',
    title:"東軍 · 中山道 · 對大谷", troops:2500,
    track:[
      { t:-16, lng:136.586, lat:35.387, s:2500, st:'hold' },
      { t:0,   lng:136.586, lat:35.387, s:2500, st:'hold' },
      { t:6,   lng:136.4660,lat:35.3580,s:2500, st:'march' },
      { t:8,   lng:136.4660, lat:35.3580, s:2500, st:'hold' },
      { t:10,  lng:136.4610, lat:35.3560, s:2500, st:'attack' },  // 攻大谷
      { t:12.5,lng:136.4585, lat:35.3550, s:2500, st:'attack' },
      { t:14,  lng:136.4560, lat:35.3545, s:2500, st:'attack' },
    ]},
  { name_zh:"京極高知", name_ja:"京極高知", side:'east', crest:'yotsumeyui', kind:'infantry',
    title:"東軍 · 藤堂隊旁 · 對大谷", troops:3000,
    track:[
      { t:-16, lng:136.587, lat:35.386, s:3000, st:'hold' },
      { t:0,   lng:136.587, lat:35.386, s:3000, st:'hold' },
      { t:6,   lng:136.4690,lat:35.3570,s:3000, st:'march' },
      { t:8,   lng:136.4690, lat:35.3570, s:3000, st:'hold' },
      { t:10,  lng:136.4630, lat:35.3555, s:3000, st:'attack' },
      { t:12.5,lng:136.4600, lat:35.3548, s:3000, st:'attack' },
      { t:14,  lng:136.4575, lat:35.3542, s:3000, st:'attack' },
    ]},
  { name_zh:"加藤嘉明", name_ja:"加藤嘉明", side:'east', crest:'janome', kind:'matchlock',
    title:"東軍 · 石田・小西正面", troops:3000,
    track:[
      { t:-16, lng:136.584, lat:35.388, s:3000, st:'hold' },
      { t:0,   lng:136.584, lat:35.388, s:3000, st:'hold' },
      { t:6,   lng:136.4660,lat:35.3700,s:3000, st:'march' },
      { t:8,   lng:136.4660, lat:35.3700, s:3000, st:'hold' },
      { t:10,  lng:136.4600, lat:35.3710, s:3000, st:'attack' },  // 攻小西・石田
      { t:13,  lng:136.4570, lat:35.3730, s:2800, st:'attack' },
      { t:14,  lng:136.4560, lat:35.3760, s:2800, st:'attack' },
    ]},
  { name_zh:"田中吉政", name_ja:"田中吉政", side:'east', crest:'mitsudomoe', kind:'infantry',
    title:"東軍 · 北翼（戰後擒石田三成）", troops:3000,
    track:[
      { t:-16, lng:136.585, lat:35.392, s:3000, st:'hold' },
      { t:0,   lng:136.585, lat:35.392, s:3000, st:'hold' },
      { t:6,   lng:136.4690,lat:35.3720,s:3000, st:'march' },
      { t:8,   lng:136.4690, lat:35.3720, s:3000, st:'hold' },
      { t:10,  lng:136.4640, lat:35.3735, s:3000, st:'attack' },  // 攻石田笹尾山
      { t:13,  lng:136.4600, lat:35.3770, s:3000, st:'attack' },
      { t:14,  lng:136.4575, lat:35.3795, s:3000, st:'attack' },
    ]},
];
