/* =========================================================================
 * data/storyboard.js — 運鏡腳本（採 HK1941 demo 結構）
 *   逐「鏡」播放：每鏡 hold 秒、緩慢 orbit 環繞，並顯示旁白事件卡。
 *   t        對應戰場時刻（campaign 小時；Oct21 08:00=8 … 14:00=14）
 *            戰前階段用較小/負值（研究史料回來後補上）
 *   hold     此鏡停留秒數（總和 ≈ 整段節目長度，目標約 3 分鐘）
 *   cam      lng,lat 注視點 / dist 距離(場景單位) / az 方位 / el 仰角 / orbit 環繞速度
 *   dateLabel / title_zh / title_en / narration_zh / commanders / focus / side
 *   ※ 內容以現有決戰日為主，戰略階段(大垣・夜行軍)待史料研究完成後前置。
 * ======================================================================= */
window.SEKI = window.SEKI || {};

SEKI.storyboard = [
  /* ---------------- 戰略階段（戰前一週） ---------------- */
  { t:-10, hold:13, cam:{lng:136.560, lat:35.366, dist:195, az:35, el:30, orbit:0.5},
    dateLabel:"慶長五年九月十四日 · 美濃", title_zh:"大垣對峙 · 兩軍集結",
    title_en:"The Standoff at Ōgaki",
    narration_zh:"石田三成以大垣城為前線據點，集結西軍；德川家康率東軍主力進駐西方的赤坂、岡山，兩軍隔濃尾平原對峙。八月底岐阜城已先陷落，西軍戰略陷於被動。",
    commanders:[{zh:"石田三成",en:"Ishida Mitsunari"},{zh:"德川家康",en:"Tokugawa Ieyasu"}],
    focus:["ishida","tokugawa"], side:"both" },

  { t:-9, hold:11, cam:{lng:136.585, lat:35.389, dist:150, az:65, el:30, orbit:0.5},
    dateLabel:"九月十四日 · 戰略背景", title_zh:"秀忠遲滯 · 真田封路",
    title_en:"Hidetada Delayed at Ueda",
    narration_zh:"家康嫡子德川秀忠率三萬八千主力沿中山道南下，卻被信濃上田城的真田昌幸父子牽制阻滯，未能趕赴關原。家康手中可用之兵驟減——這場「天下分け目」之戰，竟是以偏師決勝。",
    commanders:[{zh:"德川秀忠",en:"Tokugawa Hidetada"},{zh:"真田昌幸",en:"Sanada Masayuki"}],
    focus:["tokugawa"], side:"east" },

  { t:-6, hold:12, cam:{lng:136.600, lat:35.352, dist:170, az:70, el:40, orbit:0.7},
    dateLabel:"九月十四日 · 夕", title_zh:"杭瀬川之戰 · 西軍前哨小勝",
    title_en:"Skirmish at Kuisegawa",
    narration_zh:"家康抵赤坂當日，石田家臣島左近與宇喜多家臣明石全登誘出東軍中村一榮、有馬豐氏隊，以伏兵與鐵炮反擊使其受挫。西軍局地獲勝、士氣一振。",
    commanders:[{zh:"島左近",en:"Shima Sakon"},{zh:"明石全登",en:"Akashi Takenori"}],
    focus:["ishida"], side:"west" },

  { t:-3, hold:13, cam:{lng:136.520, lat:35.362, dist:255, az:20, el:27, orbit:0.4},
    dateLabel:"九月十四日 · 夜 · 雨", title_zh:"雨夜強行軍 · 直奔關原",
    title_en:"The Rainy Night March to Sekigahara",
    narration_zh:"是夜西軍冒雨自大垣城出發，沿中山道強行軍十餘里，搶占關原盆地的笹尾山、天滿山一線，封鎖中山道與北國街道咽喉；東軍隨後跟進。決戰之勢就此成形。",
    commanders:[{zh:"石田三成",en:"Ishida Mitsunari"}], focus:["ishida","ukita","shimazu"], side:"west" },

  /* ---------------- 決戰階段（九月十五日） ---------------- */
  { t:7.6, hold:11, cam:{lng:136.466, lat:35.362, dist:165, az:18, el:30, orbit:0.6},
    dateLabel:"慶長五年九月十五日 · 拂曉", title_zh:"關原布陣 · 晨霧瀰漫",
    title_en:"Dawn Deployment at Sekigahara",
    narration_zh:"冒雨夜行軍的西軍搶先抵達關原，沿笹尾山—天滿山—松尾山布成包圍之勢，封鎖中山道；東軍自桃配山方向跟進。濃霧蔽野，兩軍對峙。",
    commanders:[{zh:"石田三成",en:"Ishida Mitsunari"},{zh:"德川家康",en:"Tokugawa Ieyasu"}],
    focus:["ishida","tokugawa"], side:"both" },

  { t:8.0, hold:13, cam:{lng:136.4585, lat:35.379, dist:95, az:120, el:42, orbit:0.7},
    dateLabel:"辰刻 · 08:00", title_zh:"西軍主將 · 笹尾山本陣",
    title_en:"Ishida Mitsunari · Sasaoyama HQ",
    narration_zh:"石田三成據笹尾山設本陣，竪起「大一大万大吉」旗，並部署大筒（大砲）俯瞰戰場。其右為島津、小西、宇喜多，左望松尾山小早川。",
    commanders:[{zh:"石田三成",en:"Ishida Mitsunari"}], focus:["ishida"], side:"west" },

  { t:8.6, hold:12, cam:{lng:136.470, lat:35.364, dist:115, az:64, el:40, orbit:0.7},
    dateLabel:"辰刻過半", title_zh:"井伊直政抜け駆け · 戰端開啟",
    title_en:"Ii Naomasa Opens the Battle",
    narration_zh:"霧稍散，本應由福島正則先鋒開戰，井伊直政卻引家康四子松平忠吉以「赤備え」騎馬隊搶先突進宇喜多陣——這一聲鐵炮便是關原的第一槍，全線隨即交火。",
    commanders:[{zh:"井伊直政",en:"Ii Naomasa"},{zh:"松平忠吉",en:"Matsudaira Tadayoshi"},{zh:"福島正則",en:"Fukushima Masanori"}],
    focus:["ii","matsudaira","fukushima","ukita"], side:"both" },

  { t:9.3, hold:11, cam:{lng:136.460, lat:35.374, dist:95, az:-50, el:44, orbit:0.7},
    dateLabel:"辰刻末", title_zh:"島左近奮戰 · 西軍前衛逞威",
    title_en:"Shima Sakon's Furious Charge",
    narration_zh:"石田家老島左近率前衛精兵自笹尾山殺出，鐵炮齊射、長槍突進，猛攻黑田・田中隊，一度壓制東軍北翼——時人謂「三成有過分之物二：島左近與佐和山城」。",
    commanders:[{zh:"島左近",en:"Shima Sakon"},{zh:"黑田長政",en:"Kuroda Nagamasa"}],
    focus:["ishida","kuroda","tanaka"], side:"west" },

  { t:10.0, hold:13, cam:{lng:136.463, lat:35.366, dist:120, az:-8, el:38, orbit:0.7},
    dateLabel:"巳刻 · 10:00", title_zh:"天滿山前血戰",
    title_en:"The Clash before Tenmanyama",
    narration_zh:"福島正則與宇喜多秀家正面死鬥，黑田、細川、加藤猛攻笹尾山石田隊；西軍居高頑抗，戰線一度膠著，西軍略佔上風。",
    commanders:[{zh:"宇喜多秀家",en:"Ukita Hideie"},{zh:"福島正則",en:"Fukushima Masanori"}],
    focus:["ukita","fukushima","kuroda","hosokawa"], side:"both" },

  { t:10.3, hold:12, cam:{lng:136.459, lat:35.377, dist:100, az:-55, el:44, orbit:0.7},
    dateLabel:"巳刻", title_zh:"笹尾山攻防 · 石田隊力守",
    title_en:"The Struggle for Sasaoyama",
    narration_zh:"黑田長政、細川忠興、加藤嘉明、田中吉政四面猛攻笹尾山。石田三成以二重柵與鐵炮居高死守，前衛猛將島左近奮戰，卻被黑田隊的鐵炮狙擊而重傷。西軍北翼苦撐不退。",
    commanders:[{zh:"石田三成",en:"Ishida Mitsunari"},{zh:"黑田長政",en:"Kuroda Nagamasa"}],
    focus:["ishida","kuroda","hosokawa","kato","tanaka"], side:"both" },

  { t:10.7, hold:12, cam:{lng:136.503, lat:35.346, dist:165, az:235, el:38, orbit:0.5},
    dateLabel:"巳刻", title_zh:"南宮山の空弁当 · 毛利按兵不動",
    title_en:"The Empty Lunchboxes of Nangūsan",
    narration_zh:"南宮山上毛利秀元、長宗我部盛親擁兵兩萬餘，卻被暗通家康的吉川廣家堵在山麓。秀元屢欲出擊，廣家託辭「正在用飯」拒不讓道，史稱「宰相殿の空弁当」。山下東軍山內一豐、池田輝政嚴陣押え——西軍最大一支生力軍就此凍結，未發一矢。",
    commanders:[{zh:"吉川廣家",en:"Kikkawa Hiroie"},{zh:"毛利秀元",en:"Mōri Hidemoto"},{zh:"山內一豐",en:"Yamauchi Kazutoyo"}],
    focus:["kikkawa","mori","chosokabe","yamanouchi"], side:"west" },

  { t:11.0, hold:12, cam:{lng:136.458, lat:35.355, dist:100, az:25, el:42, orbit:0.7},
    dateLabel:"巳刻過半", title_zh:"西軍右翼死守 · 大谷防藤堂・京極",
    title_en:"Ōtani Holds the Right Flank",
    narration_zh:"大谷吉繼於藤川台死守，正面擊退藤堂高虎、京極高知的猛攻。病軀坐輿的他早已洞悉松尾山小早川的異心，特意分兵布陣面向松尾山——這道防備，將是西軍最後的支柱。",
    commanders:[{zh:"大谷吉繼",en:"Ōtani Yoshitsugu"},{zh:"藤堂高虎",en:"Tōdō Takatora"}],
    focus:["otani","todo","kyogoku"], side:"both" },

  { t:11.4, hold:12, cam:{lng:136.450, lat:35.349, dist:120, az:160, el:46, orbit:0.6},
    dateLabel:"午刻將近", title_zh:"松尾山上 · 小早川按兵不動",
    title_en:"Kobayakawa Hesitates on Matsuoyama",
    narration_zh:"松尾山上小早川秀秋擁兵一萬五千按兵不動，與東軍早有密約卻遲疑不決。家康下令朝松尾山放鐵炮催促——史稱「問鐵炮」。",
    commanders:[{zh:"小早川秀秋",en:"Kobayakawa Hideaki"}], focus:["kobayakawa"], side:"west" },

  { t:12.0, hold:14, cam:{lng:136.453, lat:35.352, dist:98, az:140, el:48, orbit:0.9},
    dateLabel:"午刻 · 12:00", title_zh:"★ 小早川倒戈 · 戰局逆轉",
    title_en:"Kobayakawa's Betrayal — The Tide Turns",
    narration_zh:"小早川秀秋終於下松尾山倒戈，一萬五千之眾殺向友軍大谷吉繼。脇坂、朽木等四將亦隨之反叛，西軍右翼瞬間崩解。",
    commanders:[{zh:"小早川秀秋",en:"Kobayakawa Hideaki"},{zh:"大谷吉繼",en:"Ōtani Yoshitsugu"}],
    focus:["kobayakawa","otani","wakisaka"], side:"both" },

  { t:12.8, hold:12, cam:{lng:136.456, lat:35.354, dist:82, az:96, el:50, orbit:0.8},
    dateLabel:"未刻將近", title_zh:"大谷吉繼力戰自盡",
    title_en:"Ōtani Yoshitsugu's Last Stand",
    narration_zh:"病軀坐輿的大谷吉繼早料小早川有變，奮力反擊一度擊退，終因眾叛寡不敵眾，命部下介錯、藏首自盡，西軍中堅崩潰。",
    commanders:[{zh:"大谷吉繼",en:"Ōtani Yoshitsugu"}], focus:["otani","kobayakawa"], side:"west" },

  { t:13.2, hold:11, cam:{lng:136.456, lat:35.370, dist:92, az:18, el:46, orbit:0.7},
    dateLabel:"未刻", title_zh:"小西行長隊潰走",
    title_en:"Konishi's Line Breaks",
    narration_zh:"右翼既崩，加藤嘉明、田中吉政轉攻北天滿山。基督教大名小西行長兵潰，本人棄陣逃入伊吹山中，數日後被捕；因信仰不肯切腹，後與三成同於六条河原處刑。",
    commanders:[{zh:"小西行長",en:"Konishi Yukinaga"},{zh:"加藤嘉明",en:"Katō Yoshiaki"}],
    focus:["konishi","kato","tanaka"], side:"west" },

  { t:13.6, hold:12, cam:{lng:136.468, lat:35.360, dist:120, az:30, el:42, orbit:0.8},
    dateLabel:"未刻", title_zh:"島津義弘 · 敵中突破",
    title_en:"Shimazu's Charge through the Enemy",
    narration_zh:"西軍總崩，孤立的島津義弘僅千餘人，竟選擇向家康本陣正面突圍，穿越東軍陣中向伊勢街道退卻——史稱「島津の退き口」，以慘烈犧牲換得主將生還。",
    commanders:[{zh:"島津義弘",en:"Shimazu Yoshihiro"}], focus:["shimazu","tokugawa"], side:"west" },

  { t:13.9, hold:11, cam:{lng:136.472, lat:35.357, dist:95, az:35, el:44, orbit:0.8},
    dateLabel:"未刻", title_zh:"島津「捨て奸」· 死兵殿後",
    title_en:"Shimazu's Sutegamari Rearguard",
    narration_zh:"突圍途中島津以「捨て奸（捨てがまり）」死戰殿後：留下小股死兵就地坐定、逐一犧牲拖住追兵。井伊直政中彈、松平忠吉負傷；甥豐久戰死。義弘終得脫出，僅餘八十餘騎生還薩摩。",
    commanders:[{zh:"島津義弘",en:"Shimazu Yoshihiro"},{zh:"井伊直政",en:"Ii Naomasa"}],
    focus:["shimazu","ii","honda"], side:"west" },

  { t:14.0, hold:12, cam:{lng:136.466, lat:35.364, dist:165, az:14, el:30, orbit:0.5},
    dateLabel:"未刻 · 14:00 · 戰終", title_zh:"西軍瓦解 · 天下歸於德川",
    title_en:"The West Army Collapses — Tokugawa Triumphant",
    narration_zh:"開戰僅約六小時，西軍全面崩潰。此役奠定德川家康霸權，三年後開創江戶幕府，日本進入二百六十年太平。",
    commanders:[{zh:"德川家康",en:"Tokugawa Ieyasu"}], focus:["tokugawa"], side:"east" },

  { t:14.5, hold:14, cam:{lng:136.466, lat:35.366, dist:190, az:42, el:34, orbit:0.4},
    dateLabel:"戰後 · Aftermath", title_zh:"戰後 · 天下歸德川",
    title_en:"Aftermath — The Realm Falls to Tokugawa",
    narration_zh:"石田三成、小西行長、安國寺惠瓊被捕，於京都六条河原處刑；西軍諸將改易減封，居城佐和山旋即陷落。家康盡攬天下實權，慶長八年（1603）受封征夷大將軍，開創江戶幕府——日本自此進入二百六十餘年太平。",
    commanders:[{zh:"德川家康",en:"Tokugawa Ieyasu"},{zh:"石田三成",en:"Ishida Mitsunari"}],
    focus:["tokugawa","ishida"], side:"east" },
];
