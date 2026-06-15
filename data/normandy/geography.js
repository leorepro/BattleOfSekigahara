/* =========================================================================
 * data/normandy/geography.js — 諾曼第·奧馬哈海灘地理（1944/6/6 D-Day）
 *   真實 WGS84 經緯度；海拔/相對高度公尺。
 *   座標系：北(高 lat)=外海(英吉利海峽)，南(低 lat)=內陸；海灘約 lat 49.37 一線。
 *   sector 自西 (Vierville, lng≈-0.905) 向東 (Colleville, lng≈-0.845) 排開。
 *   type 值：beach / draw(出灘隘道) / bunker(德軍據點 Widerstandsnest) /
 *            naval(海上火力支援/錨地) / town(濱海村鎮) / cliff(海崖)
 *   ※ name_ja 槽位放英/法原文名（沿用既有 schema 欄位，現代戰役無日文）。
 * ======================================================================= */
window.SEKI = window.SEKI || {};

SEKI.geography = {
  /* 場景投影中心（奧馬哈灘頭核心：Les Moulins ~ Colleville 之間） */
  origin: { lng: -0.870, lat: 49.385 },

  features: [
    /* --- 灘段(beach)：奧馬哈自西向東劃分七段，沿 lat≈49.370 一線 ------- */
    { name_zh:"Dog Green 灘段", name_ja:"Dog Green Beach", name_en:"Dog Green", type:"beach", lng:-0.9050, lat:49.3705, h:1,
      note:"奧馬哈最西段，正對 D-1 Vierville 隘道與 WN72/WN71 交叉火網。116團A連於此遭近全滅，『血腥奧馬哈』最慘烈處" },
    { name_zh:"Dog White 灘段", name_ja:"Dog White Beach", name_en:"Dog White", type:"beach", lng:-0.8900, lat:49.3700, h:1,
      note:"Dog Green 以東。下午突破點之一，29師與遊騎兵後續波由此打開缺口向 Vierville 推進" },
    { name_zh:"Dog Red 灘段", name_ja:"Dog Red Beach", name_en:"Dog Red", type:"beach", lng:-0.8800, lat:49.3700, h:1,
      note:"鄰 D-3 Les Moulins 隘道西側，煙幕與草火一度遮蔽灘頭" },
    { name_zh:"Easy Green 灘段", name_ja:"Easy Green Beach", name_en:"Easy Green", type:"beach", lng:-0.8700, lat:49.3700, h:1,
      note:"D-3 Les Moulins 隘道東側，116團與5遊騎兵營一部登陸" },
    { name_zh:"Easy Red 灘段", name_ja:"Easy Red Beach", name_en:"Easy Red", type:"beach", lng:-0.8560, lat:49.3700, h:1,
      note:"奧馬哈中段最關鍵突破口，16團（1師）由此向 E-1 與 WN62 下方崖坡仰攻成功" },
    { name_zh:"Fox Green 灘段", name_ja:"Fox Green Beach", name_en:"Fox Green", type:"beach", lng:-0.8450, lat:49.3700, h:1,
      note:"正對 E-3 Colleville 隘道與最致命的 WN62/WN61。16團登陸傷亡極重，後沿崖坡滲透" },
    { name_zh:"Fox Red 灘段", name_ja:"Fox Red Beach", name_en:"Fox Red", type:"beach", lng:-0.8350, lat:49.3705, h:1,
      note:"奧馬哈最東段，崖壁陡近灘，部分官兵藉崖根死角避火、自此攀崖向 WN60 滲透" },

    /* --- 出灘隘道(draw)：奧馬哈僅四條可通車輛的隘道，皆遭重火封鎖 -------- */
    { name_zh:"D-1 Vierville 隘道", name_ja:"Vierville Draw", name_en:"D-1 Draw", type:"draw", lng:-0.9050, lat:49.3735, h:8,
      note:"通往 Vierville-sur-Mer 的主隘道，遭 WN72/WN71 反戰車砲與機槍封死。直至午後驅逐艦抵近直射方打通" },
    { name_zh:"D-3 Les Moulins 隘道", name_ja:"Les Moulins Draw", name_en:"D-3 Draw", type:"draw", lng:-0.8750, lat:49.3730, h:8,
      note:"通往 Saint-Laurent 的中西隘道，灘頭草地起火生煙，一度掩護部分官兵越堤" },
    { name_zh:"E-1 St-Laurent 隘道", name_ja:"Saint-Laurent Draw", name_en:"E-1 Draw", type:"draw", lng:-0.8620, lat:49.3735, h:8,
      note:"奧馬哈最先被打通的隘道。16團與工兵於午後肅清，成為灘頭補給與裝甲上陸的主動脈" },
    { name_zh:"E-3 Colleville 隘道", name_ja:"Colleville Draw", name_en:"E-3 Draw", type:"draw", lng:-0.8450, lat:49.3740, h:8,
      note:"通往 Colleville-sur-Mer，受 WN62/WN61 直接俯瞰封鎖，打通最晚" },

    /* --- 德軍據點(bunker)：352師沿崖頂構築的抵抗巢 Widerstandsnest ------- */
    /* ※ 校正：WN 抵抗巢史實位於灘頭上方低崖/崖肩，須在灘線(lat≈49.370)或更南(內陸側，
     *    lat 略小)。原 lat(49.374~49.376)比灘線更北(更高 lat)→ 落入外海。
     *    下修至 49.368x 一線(灘線之陸側)，維持各 WN 對應灘段之 lng 與由西向東順序。 */
    { name_zh:"WN72 據點", name_ja:"Widerstandsnest 72", name_en:"WN72", type:"bunker", lng:-0.9040, lat:49.3690, h:18,
      note:"扼守 D-1 Vierville 隘口西側，含 88mm 與 50mm 反戰車砲於混凝土砲廓內，沿灘側射，封鎖 Dog Green" },
    { name_zh:"WN71 據點", name_ja:"Widerstandsnest 71", name_en:"WN71", type:"bunker", lng:-0.9010, lat:49.3688, h:20,
      note:"Vierville 隘口東側高地火力點，與 WN72 構成交叉火網" },
    { name_zh:"WN70 據點", name_ja:"Widerstandsnest 70", name_en:"WN70", type:"bunker", lng:-0.8730, lat:49.3685, h:22,
      note:"Les Moulins 隘口上方崖頂火力點，俯瞰 Dog Red/Easy Green" },
    { name_zh:"WN68 據點", name_ja:"Widerstandsnest 68", name_en:"WN68", type:"bunker", lng:-0.8600, lat:49.3683, h:22,
      note:"St-Laurent E-1 隘口上方據點，封鎖 Easy Red 西側" },
    { name_zh:"WN62 據點", name_ja:"Widerstandsnest 62", name_en:"WN62", type:"bunker", lng:-0.8460, lat:49.3680, h:30,
      note:"奧馬哈最致命據點，Colleville 上方崖頂。兩座 75mm 砲與多挺 MG42，憑高俯瞰 Easy Red/Fox Green，造成最大量傷亡" },
    { name_zh:"WN61 據點", name_ja:"Widerstandsnest 61", name_en:"WN61", type:"bunker", lng:-0.8430, lat:49.3682, h:28,
      note:"WN62 東鄰，扼 E-3 Colleville 隘口東側，含 88mm 砲。被 DD 戰車與驅逐艦逐步壓制" },

    /* --- 海上(naval)：火力支援與運輸錨地（外海高 lat） ----------------- */
    { name_zh:"USS Texas 火力支援區", name_ja:"USS Texas Fire Support Area", name_en:"USS Texas Fire Support", type:"naval", lng:-0.9000, lat:49.4350, h:0,
      note:"戰艦德州號（14吋主砲）西段火力支援區。H時前艦砲準備射擊，午後抵近以主砲轟擊 Vierville 隘口工事" },
    { name_zh:"運輸艦錨地", name_ja:"Transport Area", name_en:"Transport Anchorage", type:"naval", lng:-0.8650, lat:49.4450, h:0,
      note:"距灘約 11 海里的運輸艦換乘區。官兵於此登小艇 LCVP，在湧浪中向灘頭航行約一小時" },

    /* --- 濱海村鎮(town)：隘道頂端的目標村落 --------------------------- */
    { name_zh:"維耶維爾濱海鎮", name_ja:"Vierville-sur-Mer", name_en:"Vierville-sur-Mer", type:"town", lng:-0.9055, lat:49.3795, h:35,
      note:"D-1 隘道頂端村落，奧馬哈西端目標" },
    { name_zh:"聖洛朗濱海鎮", name_ja:"Saint-Laurent-sur-Mer", name_en:"Saint-Laurent-sur-Mer", type:"town", lng:-0.8650, lat:49.3810, h:38,
      note:"E-1 隘道頂端村落，灘頭中段目標，後為灘頭補給樞紐" },
    { name_zh:"科勒維爾濱海鎮", name_ja:"Colleville-sur-Mer", name_en:"Colleville-sur-Mer", type:"town", lng:-0.8470, lat:49.3850, h:42,
      note:"E-3 隘道頂端村落，WN62 後方。今美軍諾曼第公墓所在地" },

    /* --- 西端 Pointe du Hoc（海崖突擊） -------------------------------- */
    { name_zh:"奧克角海崖", name_ja:"Pointe du Hoc", name_en:"Pointe du Hoc", type:"cliff", lng:-1.0050, lat:49.3970, h:30,
      note:"高約30米的陡峭海崖，奧馬哈與猶他之間。德軍於崖頂部署 155mm 砲群（情報指其威脅兩灘）" },
    { name_zh:"奧克角砲台據點", name_ja:"Pointe du Hoc Battery", name_en:"Pointe du Hoc Battery", type:"bunker", lng:-1.0045, lat:49.3978, h:32,
      note:"崖頂混凝土砲廓群。2遊騎兵營攀崖突擊，卻發現 155mm 砲已預先後撤——遊騎兵於內陸果園找到並炸毀之" },
  ],

  /* 進攻軸線/突破折線（[lng,lat] 序列，由外海向內陸） */
  lines: [
    {
      name_zh:"奧馬哈主登陸軸（運輸錨地→灘頭→隘道→村鎮）",
      path:[
        [-0.8650,49.4450], /* 運輸艦錨地換乘 */
        [-0.8600,49.4000], /* LCVP 航向灘頭 */
        [-0.8560,49.3700], /* Easy Red 搶灘 */
        [-0.8620,49.3735], /* E-1 St-Laurent 隘道仰攻 */
        [-0.8650,49.3810]  /* Saint-Laurent-sur-Mer */
      ]
    },
    {
      name_zh:"Fox Green / E-3 突破軸（16團→WN62→Colleville）",
      path:[
        [-0.8450,49.4100],
        [-0.8450,49.3700], /* Fox Green 搶灘 */
        [-0.8460,49.3760], /* 仰攻 WN62 */
        [-0.8470,49.3850]  /* Colleville-sur-Mer */
      ]
    },
    {
      name_zh:"奧克角攀崖突擊（2遊騎兵營）",
      path:[
        [-1.0050,49.4150], /* 自海上接近 */
        [-1.0050,49.3970], /* 崖根登陸·攀崖 */
        [-1.0045,49.3978], /* 奪砲台據點 */
        [-1.0020,49.4010]  /* 內陸搜索155mm砲 */
      ]
    },
  ],
};
