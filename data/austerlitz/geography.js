/* =========================================================================
 * data/austerlitz/geography.js — 奧斯特利茨古戰場地理（真實 WGS84，海拔公尺）
 *   座標查證自英文維基 / OpenStreetMap（普拉欽高地、桑頓山、兩村、扎錢湖、Žuráň 本陣）。
 *   type 值：mountain / hill / battlefield / camp / river / town / road
 * ======================================================================= */
window.SEKI = window.SEKI || {};

SEKI.geography = {
  /* 投影中心：普拉欽高地一帶（戰場中央） */
  origin: { lng: 16.76, lat: 49.13 },

  features: [
    /* --- 中央要地：普拉欽高地（誘餌 → 中央突破核心） --- */
    { name_zh:"普拉欽高地", name_ja:"Pratzen Heights", type:"hill", lng:16.762, lat:49.118, h:324,
      note:"戰場中央戰略要地、俯瞰全局。拿破崙故意讓出以誘聯軍南下，再以蘇爾特軍自濃霧中突破奪取，將聯軍攔腰斬斷" },
    { name_zh:"史塔雷葡萄園（中央高地北）", name_ja:"Stare Vinohrady", type:"hill", lng:16.772, lat:49.128, h:300,
      note:"普拉欽高地北段，俄國近衛軍反攻、法俄近衛軍對決之地" },

    /* --- 北線：桑頓山（拉納/繆拉 vs 巴格拉季昂） --- */
    { name_zh:"桑頓山", name_ja:"Santon Hill", type:"hill", lng:16.722, lat:49.152, h:300,
      note:"北線制高點，拉納第五軍團據守、架砲防禦。巴格拉季昂猛攻不下，終被拉納與繆拉騎兵逐出北場" },
    { name_zh:"波索里茲（北線村）", name_ja:"Bosenitz", type:"town", lng:16.730, lat:49.158, h:270,
      note:"桑頓山下村落，北線爭奪要點" },

    /* --- 南線：塔爾尼茲 / 索科爾尼茲（誘餌右翼，反覆爭奪） --- */
    { name_zh:"塔爾尼茲", name_ja:"Telnitz", type:"town", lng:16.740, lat:49.090, h:215,
      note:"南線最南村落，聯軍主攻點。基恩米亞前鋒最先撲此、達武急行軍反擊，反覆易手" },
    { name_zh:"索科爾尼茲", name_ja:"Sokolnitz", type:"town", lng:16.755, lat:49.100, h:225,
      note:"南線村落與城堡、雉堡(pheasantry)，朗熱隆與普雷斯比斯維斯基縱隊主攻，血戰反覆易手" },
    { name_zh:"戈爾德巴赫溪", name_ja:"Goldbach Brook", type:"river", lng:16.742, lat:49.115, h:210,
      note:"南北向小溪，會戰前沿——分隔法軍(西)與聯軍(東)。聯軍南線渡溪西攻，達武在西岸死守" },

    /* --- 冰湖：扎錢湖（潰敗結局名場面） --- */
    { name_zh:"扎錢湖", name_ja:"Satschan Pond", type:"river", lng:16.780, lat:49.073, h:205,
      note:"南線潰兵唯一退路的結冰湖面。拿破崙令火砲轟冰、宣稱數千人溺斃；惟史家考證屬宣傳誇大——湖三日後即乾涸、僅撈出 2-3 具屍體與約 150 匹戰馬（詳見史料面板）" },
    { name_zh:"莫尼茲湖", name_ja:"Mönitz Pond", type:"river", lng:16.762, lat:49.068, h:205,
      note:"扎錢湖西鄰，南線潰退隘路另一冰湖" },

    /* --- 法軍本陣 / 聯軍方向 --- */
    { name_zh:"拿破崙本陣（Žuráň 丘）", name_ja:"Zuran Hill · Napoleon's HQ", type:"camp", icon:"⚑", major:true, lng:16.722, lat:49.156, h:286,
      note:"拿破崙設指揮所的小丘，居高俯瞰中央與北線。霧散後於此下令蘇爾特突破，戰後將大本營前移普拉欽" },
    { name_zh:"奧斯特利茨城堡", name_ja:"Slavkov (Austerlitz) Castle", type:"town", icon:"🏰", major:true, lng:16.876, lat:49.153, h:210,
      note:"戰場東側城鎮（今捷克斯拉夫科夫），會戰得名於此。聯軍自東面奧洛穆茨方向開來" },
    { name_zh:"奧洛穆茨方向（聯軍來向）", name_ja:"toward Olmütz", type:"road", icon:"➤", lng:16.880, lat:49.130, h:230,
      note:"俄奧聯軍自東北奧洛穆茨(Olmütz)開進；巴格拉季昂北線敗後亦向此退卻" },

    /* --- 補：劇情提到但原先未標的戰場地點（2026-06-17 盤點補上）--- */
    { name_zh:"普拉欽村", name_ja:"Prace (Pratzen) village", type:"town", lng:16.762, lat:49.128, h:300,
      note:"普拉欽高地中央村落，米羅拉多維奇與聖海拉爾師反覆爭奪、為高地戰線中樞" },
    { name_zh:"普拉欽堡（南高點）", name_ja:"Pratzeberg", type:"hill", icon:"▲", major:true, lng:16.766, lat:49.112, h:324,
      note:"高地南側最高點(海拔324m)，法軍霧中先登、楔入高地與南線之間；居高俯瞰冰湖方向" },
    { name_zh:"布拉奇奧維茨", name_ja:"Blasowitz (Blažovice)", type:"town", lng:16.793, lat:49.166, h:250,
      note:"北場樞紐村落，拉納先頭與聯軍反覆爭奪，法軍步兵增援先到而奪取" },
    { name_zh:"科貝爾尼茲", name_ja:"Kobelnitz (Kobylnice)", type:"town", lng:16.778, lat:49.120, h:215,
      note:"索科爾尼茲北側村落；普熱比舍夫斯基第三縱隊退路被切後，於此試圖泅渡戈爾德巴赫河東岸" },
    { name_zh:"布爾諾方向（法軍後方）", name_ja:"toward Brünn (Brno)", type:"road", icon:"➤", lng:16.520, lat:49.190, h:260,
      note:"法軍/拿破崙自西北布爾諾(Brno)開來、沿布爾諾–奧爾米茨大道部署" },
    { name_zh:"維也納方向（法軍退路）", name_ja:"toward Vienna", type:"road", icon:"➤", lng:16.700, lat:48.920, h:200,
      note:"法軍與維也納的交通線在南方；聯軍主攻南線即意圖切斷此退路" },
  ],

  /* 防線/進軍折線（[lng,lat] 序列） */
  lines: [
    {
      name_zh:"法軍中央突破（Žuráň→普拉欽高地）",
      path:[ [16.722,49.156], [16.745,49.122], [16.762,49.118] ]
    },
    {
      name_zh:"聯軍南調咬餌（普拉欽→Telnitz/Sokolnitz）",
      path:[ [16.766,49.122], [16.760,49.108], [16.755,49.100], [16.740,49.090] ]
    },
    {
      name_zh:"聖海拉爾師南下抄截（普拉欽→南線背後）",
      path:[ [16.762,49.118], [16.772,49.104], [16.780,49.095] ]
    },
    {
      name_zh:"聯軍冰湖潰退（南線→扎錢湖）",
      path:[ [16.755,49.100], [16.770,49.085], [16.780,49.073] ]
    },
  ],
};
