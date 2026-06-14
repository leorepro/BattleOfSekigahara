/* =========================================================================
 * data/okehazama/armies.js — 桶狹間之戰雙方部隊（含五月十八~十九日調動）
 *   side : 'east'(織田/藍) | 'west'(今川/紅)
 *   kind : command/matchlock/cavalry/infantry（驅動兵種特效）
 *   crest: 對應 SEKI.crests 的家紋 key
 *   track: 關鍵影格 {t, lng, lat, s, st}
 *     t  = 距「永祿三年五月十九日(1560/6/12) 00:00」的小時數
 *          戰前為負：-8≈十八日午後(沓掛布陣)、-6≈十八日夜(大高兵糧入)
 *          4~6 = 十九日拂曉(鷲津・丸根攻防)、8~14 = 信長奇襲~義元討死(辰~未刻)
 *     s  = 兵力  st = hold/march/attack/rout
 *   ※ 兵力為依《信長公記》與近年研究之代表值（見史料面板）；今川總數史料誇大，
 *     本作取「義元本陣周邊約六千、織田主隊約二千」之決戰實戰力觀點。
 * ======================================================================= */
window.SEKI = window.SEKI || {};

SEKI.armies = [
  /* ============================ 織田軍（藍） ============================ */
  { id:"nobunaga", name_zh:"織田信長", name_ja:"織田信長", side:'east', crest:'mokkou', kind:'command',
    title:"織田 總大將 · 清洲→熱田→善照寺→中島→桶狹間", troops:2000,
    track:[
      { t:-8,  lng:136.910, lat:35.115, s:2000, st:'hold' },     // 清洲方向（整軍待報）
      { t:3,   lng:136.910, lat:35.115, s:2000, st:'hold' },     // 接鷲津丸根急報、舞「敦盛」
      { t:4,   lng:136.9087,lat:35.1274,s:2000, st:'march' },    // 熱田神宮參拜出陣
      { t:7,   lng:136.9540,lat:35.1000,s:2000, st:'march' },    // 沿鳴海潟南下
      { t:9,   lng:136.9575,lat:35.0816,s:2000, st:'hold' },     // 善照寺砦集結（約二千~三千）
      { t:11.5,lng:136.9540,lat:35.0769,s:2000, st:'march' },    // 前進中島砦
      { t:12.5,lng:136.9680,lat:35.0680,s:2000, st:'march' },    // 暴雨中接近桶狹間山
      { t:13,  lng:136.9720,lat:35.0600,s:2000, st:'attack' },   // 雨止·正面突擊
      { t:13.5,lng:136.9752,lat:35.0578,s:1900, st:'attack' },   // 突入義元本陣
      { t:14,  lng:136.9752,lat:35.0578,s:1900, st:'hold' },     // 討取義元·凱旋
    ]},
  { id:"sassa", name_zh:"佐佐政次・千秋季忠", name_ja:"佐々政次・千秋季忠", side:'east', crest:'mokkou', kind:'cavalry',
    title:"織田 前衛 · 中島前突出戰死", troops:300,
    track:[
      { t:-8,  lng:136.9575,lat:35.0816,s:300, st:'hold' },      // 善照寺一帶
      { t:9,   lng:136.9575,lat:35.0816,s:300, st:'hold' },
      { t:10.8,lng:136.9620,lat:35.0720,s:300, st:'march' },     // 突出
      { t:11,  lng:136.9680,lat:35.0660,s:300, st:'attack' },    // 攻今川前衛
      { t:11.4,lng:136.9690,lat:35.0650,s:0,   st:'rout' },      // 佐佐・千秋戰死
    ]},
  { id:"washizu", name_zh:"鷲津砦守備", name_ja:"鷲津砦 飯尾定宗・織田秀敏", side:'east', crest:'mokkou', kind:'infantry',
    title:"織田 · 鷲津砦（拂曉陷落）", troops:400,
    track:[
      { t:-8,  lng:136.9423,lat:35.0696,s:400, st:'hold' },
      { t:3,   lng:136.9423,lat:35.0696,s:400, st:'hold' },
      { t:4,   lng:136.9423,lat:35.0696,s:400, st:'attack' },    // 朝比奈來攻
      { t:6,   lng:136.9423,lat:35.0696,s:0,   st:'rout' },      // 陷落·二將戰死
    ]},
  { id:"marune", name_zh:"丸根砦守備", name_ja:"丸根砦 佐久間盛重", side:'east', crest:'hikiryo', kind:'infantry',
    title:"織田 · 丸根砦（凌晨陷落）", troops:400,
    track:[
      { t:-8,  lng:136.9453,lat:35.0644,s:400, st:'hold' },
      { t:3,   lng:136.9453,lat:35.0644,s:400, st:'hold' },
      { t:4,   lng:136.9453,lat:35.0644,s:400, st:'attack' },    // 松平元康來攻
      { t:5.5, lng:136.9453,lat:35.0644,s:0,   st:'rout' },      // 陷落·盛重戰死
    ]},

  /* ============================ 今川軍（紅） ============================ */
  { id:"yoshimoto", name_zh:"今川義元", name_ja:"今川義元", side:'west', crest:'futatsuhikiryo', kind:'command',
    title:"今川 總大將 · 沓掛→桶狹間山本陣", troops:6000,
    track:[
      { t:-8,  lng:137.0218,lat:35.0689,s:6000, st:'hold' },     // 沓掛城布陣（十八日）
      { t:-2,  lng:137.0218,lat:35.0689,s:6000, st:'hold' },
      { t:6,   lng:136.9900,lat:35.0640,s:6000, st:'march' },    // 西進
      { t:9,   lng:136.9780,lat:35.0585,s:6000, st:'march' },
      { t:10,  lng:136.9755,lat:35.0575,s:6000, st:'hold' },     // 桶狹間山布陣·連捷休整唱謠
      { t:12.5,lng:136.9755,lat:35.0575,s:6000, st:'hold' },     // 暴雨
      { t:13,  lng:136.9755,lat:35.0575,s:5000, st:'attack' },   // 遭織田正面突襲·本陣混戰
      { t:13.5,lng:136.9752,lat:35.0578,s:800,  st:'rout' },     // 親衛崩潰
      { t:13.7,lng:136.9752,lat:35.0578,s:0,    st:'rout' },     // 義元討死（毛利新介）
    ]},
  { id:"matsudaira", name_zh:"松平元康", name_ja:"松平元康（德川家康）", side:'west', crest:'mitsubaAoi', kind:'cavalry',
    title:"今川 先鋒 · 大高城兵糧入·攻丸根（戰後獨立）", troops:2000,
    track:[
      { t:-8,  lng:137.000, lat:35.0660,s:2000, st:'march' },    // 三河勢西進
      { t:-6,  lng:136.9362,lat:35.0644,s:2000, st:'hold' },     // 夜突破封鎖·大高城兵糧入
      { t:4,   lng:136.9453,lat:35.0644,s:2000, st:'attack' },   // 攻丸根砦
      { t:5.5, lng:136.9430,lat:35.0644,s:2000, st:'attack' },   // 丸根陷
      { t:7,   lng:136.9362,lat:35.0644,s:2000, st:'hold' },     // 返大高城留守
      { t:14,  lng:136.9362,lat:35.0644,s:2000, st:'hold' },     // 未捲入本陣戰·全軍生還
    ]},
  { id:"asahina", name_zh:"朝比奈泰朝", name_ja:"朝比奈泰朝", side:'west', crest:'futatsuhikiryo', kind:'infantry',
    title:"今川 · 攻陷鷲津砦", troops:2000,
    track:[
      { t:-8,  lng:136.985, lat:35.0670,s:2000, st:'march' },
      { t:-2,  lng:136.9500,lat:35.0700,s:2000, st:'hold' },     // 逼近鷲津
      { t:4,   lng:136.9423,lat:35.0696,s:2000, st:'attack' },   // 攻鷲津砦
      { t:6,   lng:136.9423,lat:35.0696,s:2000, st:'hold' },     // 陷落
      { t:10,  lng:136.9560,lat:35.0640,s:2000, st:'hold' },     // 向大高·桶狹間方向
      { t:14,  lng:136.9600,lat:35.0620,s:2000, st:'hold' },
    ]},
  { id:"ii", name_zh:"井伊直盛", name_ja:"井伊直盛", side:'west', crest:'tachibana', kind:'infantry',
    title:"今川 本隊先導 · 桶狹間山戰死", troops:800,
    track:[
      { t:-8,  lng:137.010, lat:35.0680,s:800, st:'march' },
      { t:6,   lng:136.9850,lat:35.0620,s:800, st:'march' },
      { t:10,  lng:136.9770,lat:35.0588,s:800, st:'hold' },      // 近義元本陣
      { t:13,  lng:136.9762,lat:35.0584,s:800, st:'attack' },    // 迎擊織田突襲
      { t:13.6,lng:136.9760,lat:35.0582,s:0,   st:'rout' },      // 戰死
    ]},
  { id:"matsui", name_zh:"松井宗信", name_ja:"松井宗信", side:'west', crest:'futatsuhikiryo', kind:'infantry',
    title:"今川 近臣 · 桶狹間山戰死", troops:1000,
    track:[
      { t:-8,  lng:137.012, lat:35.0700,s:1000, st:'march' },
      { t:6,   lng:136.9860,lat:35.0600,s:1000, st:'march' },
      { t:10,  lng:136.9775,lat:35.0568,s:1000, st:'hold' },
      { t:13,  lng:136.9766,lat:35.0572,s:1000, st:'attack' },
      { t:13.6,lng:136.9763,lat:35.0574,s:0,    st:'rout' },     // 戰死
    ]},
  { id:"udono", name_zh:"鵜殿長照", name_ja:"鵜殿長照", side:'west', crest:'futatsuhikiryo', kind:'infantry',
    title:"今川 · 大高城原守將", troops:1500,
    track:[
      { t:-8,  lng:136.9382,lat:35.0662,s:1500, st:'hold' },     // 大高城周邊
      { t:14,  lng:136.9382,lat:35.0662,s:1500, st:'hold' },     // 守城·全軍存
    ]},
  { id:"okabe", name_zh:"岡部元信", name_ja:"岡部元信", side:'west', crest:'futatsuhikiryo', kind:'infantry',
    title:"今川 · 鳴海城守將（戰後以首級換開城）", troops:2000,
    track:[
      { t:-8,  lng:136.9504,lat:35.0816,s:2000, st:'hold' },     // 鳴海城
      { t:14,  lng:136.9504,lat:35.0816,s:2000, st:'hold' },     // 義元死後仍抵抗
    ]},
];
