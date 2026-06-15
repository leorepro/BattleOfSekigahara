/* =========================================================================
 * data/thermopylae/storyboard.js — 溫泉關之戰運鏡腳本（逐鏡停留 + 旁白）
 *   t        對應戰場時刻（campaign 小時；公元前 480 年八月，三日會戰）
 *              -6~0 布陣 / 0~8 第一日 / 8~16 第二日 / 16~24 第三日 / 24~26 尾聲
 *   hold     此鏡停留秒數
 *   cam      lng,lat 注視點 / dist 距離 / az 方位 / el 仰角 / orbit 環繞
 *   ── Phase 5 電影化運鏡新增欄位（皆向後相容，未設則照舊）──
 *     cam.fov          : 鏡頭視角變焦（平滑插值；cam2.fov 為終點）
 *     cam.orbitSweep   : hold 期間以 ease 掃過的固定方位角度（取代每幀緩慢 orbit）
 *     cam.push         : hold 期間 dolly 推近的世界距離（正=推近 / 負=拉遠；被 cam2.dist 覆蓋）
 *     cam.cinemaScale  : 子彈時間係數 0~1（起始值）；cam2.cinemaScale 為終點目標
 *                        → 引擎平滑驅動 S.player.cinemaScale，主迴圈讀它乘 dt 做慢動作
 *     focusUnit        : 執行期以 S.unitById(id).group.position 為活體焦點（覆寫 lng/lat）
 *     meleeKey         : 執行期以 S.meleeFocus(key) 為焦點（guard 未定義/回傳 null 則退回靜態）
 *   敘事以希羅多德《歷史》為主軸，斯巴達死戰殿後為高潮。
 * ======================================================================= */
window.SEKI = window.SEKI || {};

SEKI.storyboard = [
  /* ---------------- 布陣階段（會戰前） ---------------- */
  { t:-6, hold:14, cam:{lng:22.5380, lat:38.7958, dist:240, az:35, el:38, orbit:0.20, fov:46}, cam2:{az:80, dist:280},
    dateLabel:"公元前 480 年 · 仲夏 · 溫泉關", title_zh:"天險全景 · 一邊是海，一邊是山",
    title_en:"The Hot Gates — Sea on One Side, Mountain on the Other",
    narration_zh:"溫泉關（Θερμοπύλαι，意為『熱泉之門』）是希臘中部通往南方的咽喉。北面是馬利亞灣的鹹水沼澤，南面是卡利德羅莫山的峭壁，中間僅餘一條狹窄的海岸通道——最窄處不過容一輛馬車。希臘聯軍選定此地，正是要以地形抵消波斯的兵力優勢。鏡頭掃過峽谷：左手是海，右手是山，狹道如一道天然的閘門。",
    commanders:[{zh:"列奧尼達一世",en:"King Leonidas I"}], focus:["leonidas","thespiae","thebes"], side:"west" },

  { t:-3, hold:13, cam:{lng:22.5340, lat:38.7952, dist:200, az:60, el:34, orbit:0.30, fov:42}, cam2:{az:110},
    dateLabel:"前 480 年 · 福基斯牆", title_zh:"重修福基斯牆 · 列奧尼達布防",
    title_en:"Rebuilding the Phocian Wall",
    narration_zh:"列奧尼達率三百斯巴達精銳，連同賽斯比、底比斯、佛西斯等城邦之軍，總數約七千人扼守中門。他們重修了古老的福基斯牆，作為退守的支點，並在狹道前列陣。斯巴達人從容地梳理長髮、操練體格——對斯巴達戰士而言，整飾儀容是赴死的禮節。",
    commanders:[{zh:"列奧尼達一世",en:"King Leonidas I"}], focus:["leonidas","phocis","arcadia"], side:"west" },

  /* ---------------- 第一日（t 0~8） ---------------- */
  { t:1, hold:14, cam:{lng:22.5050, lat:38.8200, dist:260, az:200, el:30, orbit:0.18, fov:50}, cam2:{az:235, dist:300}, span:0.5,
    dateLabel:"第一日 · 拂曉 · 特拉基斯平原", title_zh:"波斯人海 · 薛西斯駐蹕",
    title_en:"The Persian Multitude — Xerxes Arrives",
    narration_zh:"薛西斯一世親率波斯帝國大軍抵達，於特拉基斯平原紮營，營帳綿延至天際。希羅多德號稱波斯陸海軍合計達數百萬（後世學者多估實際戰鬥兵力約十餘萬至三十萬）。薛西斯坐於高處俯瞰狹道，遣使勸降，要希臘人『交出武器』；列奧尼達回以一句『μολὼν λαβέ』——『你來取吧』。",
    commanders:[{zh:"薛西斯一世",en:"King Xerxes I"}], focus:["xerxes","persian_main","persian_subjects"], side:"east" },

  { t:2.5, hold:13, cam:{lng:22.5378, lat:38.7958, dist:120, az:250, el:24, orbit:0.45, fov:38}, cam2:{dist:88},
    dateLabel:"第一日 · 上午 · 中門", title_zh:"斯巴達盾牆 · 青銅之壁",
    title_en:"The Spartan Shield-Wall",
    narration_zh:"狹道之中，斯巴達重裝步兵以方陣（phalanx）列陣：每人左手大圓盾（aspis）護住自己左側與同袍右側，盾盾相疊連成一道青銅之壁，長矛（dory）自盾間平伸如刺蝟。在僅容數十人並肩的狹道上，波斯的人數優勢被徹底抵消——這道盾牆，是溫泉關真正的城牆。",
    commanders:[{zh:"列奧尼達一世",en:"King Leonidas I"}], focusUnit:"leonidas", meleeKey:"leonidas", focus:["leonidas"], side:"west" },

  { t:4, hold:14, cam:{lng:22.5450, lat:38.7950, dist:200, az:90, el:22, orbit:0.40, fov:44}, cam2:{az:140, dist:150}, span:0.7,
    dateLabel:"第一日 · 午", title_zh:"米底軍壓上 · 波斯第一波強攻",
    title_en:"The Medes Surge Forward",
    narration_zh:"薛西斯先遣米底與西西亞人發動正面強攻，要『生擒』這群不知天高地厚的希臘人。然而波斯兵的短矛、藤盾與輕甲，在斯巴達的長矛盾陣前毫無勝算——他們一波波撞上盾牆，一波波倒下，狹道前堆滿屍體。波斯人以數量填補，希臘人以紀律收割。",
    commanders:[{zh:"米底軍",en:"The Medes"}], focus:["medes","persian_archers","leonidas"], side:"east" },

  { t:6, hold:14, cam:{lng:22.5400, lat:38.7956, dist:160, az:200, el:20, orbit:0.50, fov:40}, cam2:{az:255}, span:0.6,
    dateLabel:"第一日 · 午後", title_zh:"假退誘敵 · 不死軍受挫",
    title_en:"The Feigned Retreat — Even the Immortals Falter",
    narration_zh:"米底軍潰敗後，薛西斯投入帝國最精銳的『不死軍』（Ἀθάνατοι，常備萬人衛隊）。斯巴達人卻施展戰術假退——佯裝潰逃引波斯追擊，再驟然回身列陣反殺。連不死軍也在狹道上折損慘重。希羅多德記載，薛西斯在王座上三度驚跳而起，為他的軍隊膽寒。",
    commanders:[{zh:"不死軍",en:"The Immortals"}], focus:["immortals","leonidas","thespiae"], side:"east" },

  /* ---------------- 第二日（t 8~16） ---------------- */
  { t:9, hold:13, cam:{lng:22.5380, lat:38.7958, dist:140, az:280, el:26, orbit:0.45, fov:40}, cam2:{az:330, dist:110}, span:0.5,
    dateLabel:"第二日 · 上午 · 中門", title_zh:"輪番苦戰 · 狹道再成屠場",
    title_en:"Day Two — The Gates Hold Again",
    narration_zh:"第二日，薛西斯再驅各族屬民輪番猛攻，期望以無盡的消耗壓垮希臘人。列奧尼達將各城邦之軍輪替上陣，以保持盾牆的銳氣。狹道依舊是波斯人的墳場——整整兩日，波斯數十萬大軍竟無法越雷池一步。薛西斯一籌莫展，直到一個希臘叛徒求見。",
    commanders:[{zh:"列奧尼達一世",en:"King Leonidas I"}], focusUnit:"leonidas", focus:["leonidas","arcadia","corinth"], side:"west" },

  { t:11, hold:13, cam:{lng:22.5050, lat:38.8200, dist:240, az:210, el:30, orbit:0.35, fov:46},
    dateLabel:"第二日 · 黃昏 · 薛西斯本陣", title_zh:"叛徒厄菲阿爾特 · 獻出山徑",
    title_en:"Ephialtes Betrays the Path",
    narration_zh:"當地人厄菲阿爾特（Ἐφιάλτης）為求重賞，向薛西斯獻出一條祕密——安諾派亞山徑（Anopaia）。這條繞過溫泉關、穿越卡利德羅莫山脊的小路，可讓波斯軍迂迴到希臘聯軍背後。薛西斯大喜，當夜便派出不死軍，由厄菲阿爾特帶路，趁夜摸上山徑。",
    commanders:[{zh:"薛西斯一世",en:"King Xerxes I"},{zh:"厄菲阿爾特",en:"Ephialtes"}], focus:["xerxes","immortals"], side:"east" },

  { t:13.5, hold:13, cam:{lng:22.5900, lat:38.7800, dist:210, az:120, el:42, orbit:0.30, fov:48}, cam2:{az:170, dist:185}, span:0.6,
    dateLabel:"第二日 · 深夜 · 安諾派亞山徑", title_zh:"佛西斯守軍潰散 · 後路被抄",
    title_en:"The Phocian Guard Scattered",
    narration_zh:"列奧尼達早料到山徑之危，派了一千佛西斯人守在山脊隘口。然而當不死軍踏著落葉摸上山時，佛西斯人誤以為敵軍主攻自己，慌忙退上高處列陣。波斯人不予理會，徑直越過——希臘聯軍的後路，就此被抄。天一亮，背腹受敵的命運已成定局。",
    commanders:[{zh:"佛西斯軍",en:"The Phocian Guard"}], focus:["phocis","immortals"], side:"both" },

  /* ---------------- 第三日（t 16~24） ---------------- */
  { t:16.5, hold:14, cam:{lng:22.5700, lat:38.7820, dist:280, az:110, el:50, orbit:0.16, fov:54}, cam2:{az:160, dist:310}, span:0.5,
    dateLabel:"第三日 · 拂曉 · 卡利德羅莫山脊", title_zh:"山徑迂迴俯瞰 · 不死軍下山",
    title_en:"Flanking March — The Immortals Descend",
    narration_zh:"第三日破曉，俯瞰整片山脊：不死軍循安諾派亞山徑翻過卡利德羅莫山，正自東面高地蜿蜒而下，直插溫泉關背後。狹道中的希臘聯軍將被前後夾擊。逃亡的山民連夜下山，把噩耗帶到列奧尼達的營中——這一日，將是最後一日。",
    commanders:[{zh:"不死軍",en:"The Immortals"}], focusUnit:"immortals", focus:["immortals"], side:"east" },

  { t:18, hold:13, cam:{lng:22.5370, lat:38.7958, dist:200, az:300, el:28, orbit:0.40, fov:42}, cam2:{az:350},
    dateLabel:"第三日 · 清晨 · 福基斯牆", title_zh:"晨會解散聯軍 · 三百人留下",
    title_en:"The Council — Three Hundred Remain",
    narration_zh:"得知後路已斷，列奧尼達召開晨會。他遣散了大部分城邦聯軍，使其得以生還——史載這或是出於戰術（保存兵力），或因德爾斐神諭預言『斯巴達須有王者隕落』。最終留下死戰的，是三百斯巴達人、約七百賽斯比人，與被斯巴達看管的底比斯人。他們選擇了不歸路。",
    commanders:[{zh:"列奧尼達一世",en:"King Leonidas I"},{zh:"賽斯比軍",en:"The Thespians"}], focus:["leonidas","thespiae","thebes"], side:"west" },

  { t:19.5, hold:13, cam:{lng:22.5420, lat:38.7955, dist:170, az:120, el:22, orbit:0.55, fov:38}, cam2:{az:200, dist:120, cinemaScale:0.55}, span:0.6,
    dateLabel:"第三日 · 上午", title_zh:"★ 出牆死戰 · 矛折拔劍",
    title_en:"Beyond the Wall — A Fight to the Death",
    narration_zh:"列奧尼達不再死守牆後，而是率眾主動衝出狹道、進入更開闊處，要在倒下前盡可能多殺敵人。希羅多德記載：他們的長矛盡折，便拔出短劍肉搏；許多波斯人被擠落海中或自相踐踏。薛西斯麾下兩位異母兄弟也戰死於此。斯巴達人如颶風般收割，明知必死，卻愈戰愈烈。",
    commanders:[{zh:"列奧尼達一世",en:"King Leonidas I"}], focusUnit:"leonidas", meleeKey:"leonidas", focus:["leonidas","persian_main","immortals"], side:"both" },

  { t:21.5, hold:14, cam:{lng:22.5392, lat:38.7965, dist:200, az:30, el:36, orbit:0.30, fov:46, orbitSweep:90}, cam2:{dist:150}, span:0.5,
    dateLabel:"第三日 · 午 · 科洛諾斯小丘", title_zh:"★ 科洛諾斯箭雨 · 退守小丘",
    title_en:"The Arrow Storm on Kolonos Hill",
    narration_zh:"列奧尼達戰死後，倖存的斯巴達與賽斯比人收回他的遺體，退守狹道後方的科洛諾斯小丘，背靠彼此結成最後的陣。波斯人不願再以血肉相搏——他們在四周列開弓陣，萬箭齊發。希羅多德寫道：箭矢密集如雲，竟遮蔽了天日。最後的希臘戰士，淹沒在這場箭雨之中。",
    commanders:[{zh:"斯巴達·賽斯比殘部",en:"Last Spartans & Thespians"}], focusUnit:"leonidas", meleeKey:"kolonos", focus:["leonidas","thespiae","persian_archers"], side:"east" },

  /* ★ 列奧尼達戰死 · 子彈時間：cinemaScale→0.08 + orbit 環繞 + push 推近 */
  { t:22, hold:16, cam:{lng:22.5374, lat:38.7959, dist:130, az:0, el:24, orbit:0, fov:36, orbitSweep:160, push:62, cinemaScale:0.6}, cam2:{cinemaScale:0.08, el:30}, span:0.25,
    dateLabel:"第三日 · 午 · 列奧尼達獅碑", title_zh:"★ 列奧尼達戰死 · 子彈時間",
    title_en:"The Fall of Leonidas — Bullet Time",
    narration_zh:"時間彷彿凝滯。列奧尼達一世——斯巴達的王，倒在他選定的死地之上。為奪回國王的遺體，斯巴達人與波斯人在他身畔四度衝殺往返，雙方屍積如山。鏡頭環繞著這位殞落的王者緩緩推近，慢動作中，斷矛、碎盾、與染血的緋紅披風一一掠過。『陌生人啊，請告訴斯巴達人：我們遵從她的法律，長眠於此。』",
    commanders:[{zh:"列奧尼達一世",en:"King Leonidas I"}], focusUnit:"leonidas", meleeKey:"leonidas", focus:["leonidas"], side:"west" },

  { t:23, hold:14, cam:{lng:22.5392, lat:38.7965, dist:170, az:60, el:34, orbit:0.50, fov:42, orbitSweep:200}, cam2:{dist:130, cinemaScale:0.45}, span:0.4,
    dateLabel:"第三日 · 午後 · 科洛諾斯小丘", title_zh:"★ 殿後死戰 · 最後一人",
    title_en:"The Last Stand on the Hill",
    narration_zh:"小丘上，最後的戰士以拳、以齒、以斷劍奮戰到底。希羅多德記下他們的名字以傳後世。鏡頭環繞著這座血染的小丘——三百斯巴達、七百賽斯比，連同被迫從征的底比斯人，盡歿於此。波斯人付出了難以計數的代價，才終於踏過這道門。而這場死戰，已成為西方世界永恆的精神圖騰。",
    commanders:[{zh:"斯巴達·賽斯比殘部",en:"Last Spartans & Thespians"}], focusUnit:"leonidas", meleeKey:"kolonos", focus:["leonidas","thespiae"], side:"both" },

  /* ---------------- 尾聲（t ≥ 24） ---------------- */
  { t:24.5, hold:14, cam:{lng:22.5450, lat:38.7990, dist:250, az:180, el:40, orbit:0.18, fov:50}, cam2:{dist:300, az:140}, span:0.4,
    dateLabel:"尾聲 · 溫泉關 · Aftermath", title_zh:"門已洞開 · 然斯巴達永誌",
    title_en:"The Gate is Open — Yet Sparta Endures",
    narration_zh:"溫泉關終究失守，波斯大軍湧入希臘中部，南下焚毀了雅典。然而這三日的死戰，為希臘聯軍贏得了寶貴的時間與意志：同年九月薩拉米斯海戰、次年普拉提亞之役，希臘人終將波斯逐出。後世於科洛諾斯小丘立碑，刻下西摩尼德斯的銘文。三百人的犧牲，化作西方文明對抗暴政、守護自由的不朽象徵。",
    commanders:[{zh:"希臘聯軍",en:"The Hellenic League"}], focus:["leonidas","thespiae","xerxes"], side:"west" },

  { t:26, hold:14, cam:{lng:22.5380, lat:38.7958, dist:300, az:60, el:46, orbit:0.14, fov:54}, cam2:{dist:360, az:20}, span:0.3,
    dateLabel:"尾聲 · 全局拉遠", title_zh:"天險全局 · 三日不朽",
    title_en:"The Hot Gates — Immortalized",
    narration_zh:"鏡頭緩緩拉遠，溫泉關的全貌重新展開：一邊是馬利亞灣的粼粼海光，一邊是卡利德羅莫山的蒼莽峰巒，狹道靜臥其間。兩千五百年來，海岸線早已因泥沙淤積而後退數公里，當年的天險已成內陸平原。但那道盾牆、那聲『你來取吧』、那塊獅碑，永遠鐫刻在人類的記憶之中。",
    commanders:[{zh:"列奧尼達一世",en:"King Leonidas I"}], focus:["leonidas","thespiae","thebes"], side:"west" },
];
