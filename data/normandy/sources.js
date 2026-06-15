/* =========================================================================
 * data/normandy/sources.js — 史料說明與參考來源（供「史料」面板顯示）
 *   奧馬哈海灘史料豐富但數字爭議大；關鍵考據註記務必保留，以示史料誠信。
 * ======================================================================= */
window.SEKI = window.SEKI || {};

SEKI.sources = {
  overview:
    "奧馬哈海灘登陸（Omaha Beach, 1944年6月6日 D-Day）是大君主作戰（Operation Overlord）中最血腥的一段。" +
    "美軍第一、第二十九步兵師在德軍 352 師據守的崖頂陣地下強行登陸，首波於 Dog Green 等灘段遭近全滅。" +
    "艦砲準備不足、空襲炸偏內陸、DD 兩棲戰車多數沉沒，使灘頭一度瀕臨崩潰；" +
    "終賴驅逐艦抵近直射、官兵自發沿崖坡滲透、工兵打通隘道，方在傍晚勉強建立淺薄的橋頭堡。" +
    "本作敘事以盟軍登陸視角為主軸，傷亡與情報爭議於下方註記說明。",

  // 關鍵考據註記（史料誠信）
  caveats: [
    "傷亡數字爭議：奧馬哈當日美軍傷亡（陣亡、負傷、失蹤）早期常引『約 2,400』之數，後續研究（如美國 D-Day 紀念基金會考訂）多認為實際在 2,000~4,700 之間，確切數字因記錄混亂、失蹤難以核實而眾說紛紜。本作所列員額/傷亡為示意性代表值，非精確統計。",
    "空襲炸偏內陸：H 時前第八航空隊的 B-24 重轟炸機群，因低雲遮蔽、為避免誤傷己方登陸艇而延遲數秒投彈，致整片彈著落入灘頭後方內陸，岸防工事幾乎毫髮無損。這是奧馬哈首波傷亡慘重的主因之一。",
    "DD 兩棲戰車災難：奧馬哈東段預定泛水上陸的 741 戰車營，29 輛 DD（Duplex Drive）謝爾曼在距灘約 5,000 碼處投放，因海面湧浪超出防水裙設計極限，27 輛沉沒，僅 2 輛抵灘、另數輛由登陸艇直接送上。首波因而幾乎沒有裝甲火力支援。",
    "352 師情報誤判：盟軍登陸前情報判斷奧馬哈正面僅有素質較低的 716 師守備，未察覺戰力較強的 352 步兵師已前調至此區。德軍 352 師的存在，是奧馬哈遠比預期難打的關鍵因素，惟其『恰在登陸日演習而在場』等細節後世亦有修正。",
    "『血腥奧馬哈』(Bloody Omaha)：此綽號源自當日灘頭的慘烈傷亡，並經《最長的一日》《搶救雷恩大兵》等作品深植大眾印象。須注意影視為戲劇效果有所濃縮與重構，個別情節（如某連『全滅』的程度）在史學上仍有討論空間。",
    "奧克角的火砲：2 遊騎兵營攀崖奪取奧克角砲台後，發現德軍已將 155mm 砲預先後撤至內陸（以避艦砲），砲位僅置電線桿偽裝。遊騎兵隨後在內陸果園尋獲並炸毀火砲。此役常被誤述為『白白攀崖』，實則仍消除了威脅兩灘的砲群。",
    "地形為真實高程：使用 SRTM 30m 高程與真實經緯度；灘段/隘道/WN 據點座標為示意定位，現代地貌（公墓、紀念設施、海岸侵蝕）與 1944 年有別，僅作示意。",
  ],

  // 參考書目（現代學術/紀實）
  books: [
    "Cornelius Ryan《The Longest Day》（最長的一日）",
    "Stephen E. Ambrose《D-Day, June 6, 1944: The Climactic Battle of World War II》",
    "Joseph Balkoski《Omaha Beach: D-Day, June 6, 1944》",
    "Adrian Lewis《Omaha Beach: A Flawed Victory》",
    "Antony Beevor《D-Day: The Battle for Normandy》",
  ],
  // 一手/官方史料
  primary: [
    "U.S. Army Center of Military History《Omaha Beachhead (American Forces in Action Series)》（戰後官方戰史）",
    "After Action Reports — 1st Infantry Division / 29th Infantry Division / 16th & 116th Inf Regiments",
    "2nd Ranger Battalion 行動報告（Pointe du Hoc）",
    "U.S. Navy Action Reports — 火力支援群與驅逐艦抵近射擊記錄",
  ],
  // 線上與地理資料
  data: [
    "American Battle Monuments Commission（abmc.gov）· Normandy American Cemetery",
    "The National WWII Museum / D-Day 史料與傷亡數字考訂",
    "英文維基百科「Omaha Beach」「Pointe du Hoc」「352nd Infantry Division (Wehrmacht)」「Operation Overlord」",
    "OpenStreetMap（灘段、隘道、村鎮、奧克角座標）",
    "地形高程：SRTM 30m（opentopodata）",
    "衛星影像：ESRI World Imagery（Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community）— 為現代地貌，僅作示意",
  ],
};
