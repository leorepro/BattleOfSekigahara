/* =========================================================================
 * data/okehazama/storyboard.js — 桶狹間之戰運鏡腳本（逐鏡停留 + 旁白）
 *   t        對應戰場時刻（campaign 小時；五月十九日 00:00 起算）
 *   hold     此鏡停留秒數     cam  lng,lat 注視點 / dist 距離 / az 方位 / el 仰角 / orbit 環繞
 *   敘事以《信長公記》正面突擊為主軸，奇襲說於史料面板註明。
 * ======================================================================= */
window.SEKI = window.SEKI || {};

SEKI.storyboard = [
  /* ---------------- 戰略階段（五月十八日） ---------------- */
  { t:-8, hold:13, cam:{lng:136.990, lat:35.066, dist:205, az:70, el:32, orbit:0.4},
    dateLabel:"永祿三年五月十八日 · 尾張南部", title_zh:"今川大軍西上 · 沓掛布陣",
    title_en:"Imagawa's Host Advances West",
    narration_zh:"今川義元親率大軍（史料號二萬~四萬五千，眾說紛紜）自駿府西進，入沓掛城布陣。其鋒已楔入尾張南部，鳴海、大高、沓掛三城皆附今川，直逼織田領。一說為上洛、近年學界多主張為侵攻尾張。",
    commanders:[{zh:"今川義元",en:"Imagawa Yoshimoto"}], focus:["yoshimoto"], side:"west" },

  { t:-6, hold:12, cam:{lng:136.940, lat:35.064, dist:115, az:100, el:38, orbit:0.6},
    dateLabel:"五月十八日 · 夜", title_zh:"松平元康 · 大高城兵糧入",
    title_en:"Matsudaira's Night Resupply of Ōdaka",
    narration_zh:"今川先鋒、人質出身的松平元康（後之德川家康）率三河勢趁夜突破織田封鎖，將兵糧運入被丸根・鷲津二砦圍困的大高城，並接替守備。此夜之功，是他在今川麾下的最後效命。",
    commanders:[{zh:"松平元康",en:"Matsudaira Motoyasu"}], focus:["matsudaira"], side:"west" },

  /* ---------------- 決戰階段（五月十九日） ---------------- */
  { t:3, hold:12, cam:{lng:136.910, lat:35.116, dist:120, az:20, el:36, orbit:0.5},
    dateLabel:"五月十九日 · 拂曉 · 清洲", title_zh:"敦盛之舞 · 信長單騎出陣",
    title_en:"The Dance of Atsumori",
    narration_zh:"鷲津・丸根告急的急報連夜傳至清洲。信長起身舞幸若舞「敦盛」——『人間五十年，下天のうちをくらぶれば、夢幻のごとくなり』——舞罷著具足、立食、僅率少數隨從策馬先行出陣。",
    commanders:[{zh:"織田信長",en:"Oda Nobunaga"}], focus:["nobunaga"], side:"east" },

  { t:4.5, hold:12, cam:{lng:136.944, lat:35.067, dist:120, az:60, el:40, orbit:0.6},
    dateLabel:"五月十九日 · 拂曉", title_zh:"鷲津・丸根砦攻防",
    title_en:"The Assault on Washizu and Marune",
    narration_zh:"天未明，今川軍兵分二路猛攻織田前線：朝比奈泰朝攻鷲津砦，松平元康攻丸根砦。二砦為封鎖大高城而築，孤懸敵前，守兵寡少卻死戰不退。",
    commanders:[{zh:"朝比奈泰朝",en:"Asahina Yasutomo"},{zh:"松平元康",en:"Matsudaira Motoyasu"}],
    focus:["asahina","matsudaira","washizu","marune"], side:"west" },

  { t:5.5, hold:11, cam:{lng:136.9453, lat:35.0644, dist:95, az:80, el:44, orbit:0.7},
    dateLabel:"五月十九日 · 凌晨", title_zh:"丸根砦陷落 · 佐久間盛重戰死",
    title_en:"Marune Falls — Sakuma's Last Stand",
    narration_zh:"丸根砦守將佐久間盛重（大學）率約四百兵力戰，終不敵松平元康的三河勢，砦破身死。織田南線的第一道屏障告失。",
    commanders:[{zh:"佐久間盛重",en:"Sakuma Morishige"},{zh:"松平元康",en:"Matsudaira Motoyasu"}],
    focus:["marune","matsudaira"], side:"both" },

  { t:6.5, hold:11, cam:{lng:136.9423, lat:35.0696, dist:95, az:120, el:44, orbit:0.7},
    dateLabel:"五月十九日 · 早朝", title_zh:"鷲津砦陷落 · 黑煙沖天",
    title_en:"Washizu Falls — Smoke over the Coast",
    narration_zh:"鷲津砦繼而陷落，守將飯尾定宗、織田秀敏戰死。二砦烈焰騰起的黑煙，自鳴海潟畔直沖天際——這道黑煙，將成為信長判讀戰局的訊號。",
    commanders:[{zh:"朝比奈泰朝",en:"Asahina Yasutomo"}], focus:["washizu","asahina"], side:"west" },

  { t:7.5, hold:12, cam:{lng:136.9087, lat:35.1274, dist:108, az:200, el:34, orbit:0.5},
    dateLabel:"辰刻 · 熱田", title_zh:"熱田神宮 · 戰勝祈願",
    title_en:"Prayer at Atsuta Shrine",
    narration_zh:"信長馳抵熱田神宮參拜祈願。立於宮前東望，見鷲津・丸根方向黑煙升起，知二砦已陷。中世的熱田，是突入伊勢灣的岬角，潮聲與戰雲相接。",
    commanders:[{zh:"織田信長",en:"Oda Nobunaga"}], focus:["nobunaga"], side:"east" },

  { t:9, hold:13, cam:{lng:136.9575, lat:35.0816, dist:100, az:150, el:42, orbit:0.6},
    dateLabel:"巳刻 · 善照寺砦", title_zh:"善照寺砦 · 兵力集結",
    title_en:"Mustering at Zenshōji Fort",
    narration_zh:"信長進至鳴海城外的善照寺砦，沿途收攏兵力，集結約二千至三千之眾。重臣多主張據砦固守，信長卻已決意——以這支寡兵，正面尋求今川本陣的決戰。",
    commanders:[{zh:"織田信長",en:"Oda Nobunaga"}], focus:["nobunaga"], side:"east" },

  { t:10, hold:13, cam:{lng:136.9755, lat:35.0575, dist:112, az:250, el:40, orbit:0.5},
    dateLabel:"午刻 · 桶狹間山", title_zh:"今川義元 · 桶狹間山休整",
    title_en:"Yoshimoto Rests on Okehazama Hill",
    narration_zh:"連下鷲津・丸根二砦，義元『滿足これに過ぎるものなし』，於桶狹間山高地布陣，向西北而坐，令唱謠三番、人馬休息。《信長公記》明記其布陣於『山』上——這是後世「谷底奇襲」傳說與一手史料的關鍵分歧。",
    commanders:[{zh:"今川義元",en:"Imagawa Yoshimoto"}], focus:["yoshimoto","ii","matsui"], side:"west" },

  { t:11, hold:11, cam:{lng:136.9680, lat:35.0660, dist:95, az:30, el:44, orbit:0.7},
    dateLabel:"午刻", title_zh:"佐佐・千秋 前衛突擊",
    title_en:"The Vanguard's Doomed Charge",
    narration_zh:"佐佐政次、千秋季忠（熱田大宮司）率三十餘騎自前方突出，猛攻今川前衛，雙雙戰死。小和田哲男認為此為佯攻誘餌，藤本正行則視為擅自搶功——無論如何，今川因小勝而更添輕敵。",
    commanders:[{zh:"佐佐政次",en:"Sassa Masatsugu"},{zh:"千秋季忠",en:"Senshū Suetada"}],
    focus:["sassa","yoshimoto"], side:"east" },

  { t:11.7, hold:12, cam:{lng:136.9540, lat:35.0769, dist:100, az:160, el:42, orbit:0.6},
    dateLabel:"午刻過後 · 中島砦", title_zh:"信長前進中島砦",
    title_en:"Nobunaga Advances to Nakajima",
    narration_zh:"信長不顧重臣牽衣勸阻，自善照寺前進至扇川低地的中島砦，再向前推進。此時織田軍『敵から丸見え』——完全暴露於今川視野中，這正是『正面突擊說』的有力佐證，而非隱蔽迂迴。",
    commanders:[{zh:"織田信長",en:"Oda Nobunaga"}], focus:["nobunaga"], side:"east" },

  { t:12.5, hold:13, cam:{lng:136.9700, lat:35.0620, dist:135, az:200, el:30, orbit:0.4},
    dateLabel:"午刻 · 暴風雨", title_zh:"★ 天驟變 · 暴雨夾雹",
    title_en:"The Sudden Storm",
    narration_zh:"信長進軍途中，天色驟暗，狂風暴雨夾雹自東而來——《信長公記》記『如投石冰打在敵人臉上』，連兩三抱粗的楠木亦被吹倒向東。兵士驚呼此為熱田明神之神軍。暴雨掩護了織田軍的接近，淋濕了今川的火繩。",
    commanders:[{zh:"織田信長",en:"Oda Nobunaga"},{zh:"今川義元",en:"Imagawa Yoshimoto"}],
    focus:["nobunaga","yoshimoto"], side:"both" },

  { t:13.2, hold:14, cam:{lng:136.9730, lat:35.0590, dist:92, az:280, el:38, orbit:0.8},
    dateLabel:"未刻", title_zh:"★ 桶狹間突擊 · 直衝本陣",
    title_en:"The Strike on Okehazama",
    narration_zh:"雨歇的剎那，信長下令『すわ、かかれ！』全軍向東猛攻。織田寡兵自正面如怒濤撲向桶狹間山——休整中的今川本陣猝不及防，陣勢瞬間大亂。",
    commanders:[{zh:"織田信長",en:"Oda Nobunaga"}], focus:["nobunaga","yoshimoto","ii"], side:"east" },

  { t:13.6, hold:14, cam:{lng:136.9752, lat:35.0578, dist:80, az:300, el:46, orbit:0.9},
    dateLabel:"未刻 · 桶狹間山", title_zh:"★ 今川義元 討死",
    title_en:"The Fall of Imagawa Yoshimoto",
    narration_zh:"親衛三百被殺至剩五十。服部小平太一番槍刺向義元，反被砍中膝而倒；毛利新介繼而撲上，討倒義元、取其首級。『東海道一の弓取』竟歿於尾張原野——天下為之震動。",
    commanders:[{zh:"今川義元",en:"Imagawa Yoshimoto"},{zh:"毛利新介",en:"Mōri Shinsuke"},{zh:"服部小平太",en:"Hattori Koheita"}],
    focus:["yoshimoto","nobunaga"], side:"both" },

  { t:14, hold:13, cam:{lng:136.965, lat:35.066, dist:185, az:30, el:32, orbit:0.4},
    dateLabel:"未刻 · 戰終 · Aftermath", title_zh:"桶狹間之後 · 信長崛起",
    title_en:"Aftermath — Nobunaga Rises",
    narration_zh:"主將既亡，今川大軍瓦解東歸。此役除去信長東方的最大威脅，使他得以統一尾張、進取美濃，七年後入主岐阜、舉『天下布武』。人質松平元康則撤回三河岡崎、脫離今川獨立，奠定日後德川霸業之始。",
    commanders:[{zh:"織田信長",en:"Oda Nobunaga"},{zh:"松平元康",en:"Matsudaira Motoyasu"}],
    focus:["nobunaga","matsudaira"], side:"east" },
];
