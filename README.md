# 3D 關原之戰 — 電視級歷史節目

以 Three.js 製作的單頁互動式 3D 歷史戰役節目，靈感來自「3D 香港保衛戰」。
純前端、免 build、可自由運鏡，從**戰前一週的戰略調動**到**決戰六小時**再到**戰後結局**，
完整、細節地演示關原之戰（慶長五年九月十五日／1600）雙方 22 名大名的陣型、行軍、交戰與戰略。

**線上版**：https://leorepro.github.io/BattleOfSekigahara/ （建議橫向／桌面觀看，手機亦可）

## 主要功能
- **真實地形**：關原～大垣 SRTM 30m DEM + EOX Sentinel-2 衛星影像貼圖（森林/平原/市街）
- **22 名大名**：Canvas 程序化家紋幟旗（飄動）、兵種（鉄砲/騎馬/足軽/大筒）、即時兵力與狀態
- **完整時間軸**：九月十四日朝（大垣對峙）→ 雨夜強行軍 → 決戰 → 戰後，17 個運鏡鏡頭
- **交戰標記「A ⚔ B」**：在兩軍接觸點標出誰打誰，與旁白聚焦連動，砲火集中於接觸點
- **倒戈視覺化**：小早川・脇坂倒戈時旗環轉金 +「⚔裏切」標記
- **漸進行軍路線**：緞帶隨部隊推進顯示、走遠淡出（戰前不提早出現、決戰不擋畫面）
- **聚焦突顯**：每一鏡突顯相關武將、淡化其他，密集戰場仍清楚
- **兵種砲擊特效**：鉄砲齊射、大筒砲火（曳光+著彈）、騎馬揚塵；朝霧→放晴動態天氣
- **電視節目感**：逐鏡停留式自動運鏡 + 事件卡（日期/中英標題/旁白/武將）+ 雙方兵力儀表
- **史料面板**：考據註記（布陣/兵力為二次史料、大筒屬演繹）與參考書目
- **符號圖例 · 點選部隊卡片 · 手機/桌面響應式**

## 技術架構
「引擎 / 資料分離」：`src/engine/*` 通用引擎，`data/*` 關原戰役內容。
全域 `THREE`（r128 UMD）+ 全域 `SEKI` 命名空間，無打包工具，純靜態。

```
index.html
lib/three/         three.min.js / OrbitControls.js / CSS2DRenderer.js
data/
  geography.js     35 個地點(山/城/陣跡/古戰場/街道,查證座標)
  heightmap.js     SRTM 30m DEM(fetch_dem.py 產生)
  armies.js        22 大名(side/kind/crest/track/defectAt)
  storyboard.js    17 運鏡鏡頭(HK demo 結構:hold/cam/narration/focus)
  weather.js · engagements.js · sources.js
src/engine/
  scene · terrain(衛星貼圖) · labels(地標圖示) · crest(家紋) · units(部隊/聚焦/倒戈)
  routes(漸進緞帶) · effects(兵種粒子) · engage(交戰標記) · weather · storyboard · ui
src/main.js
assets/terrain/satellite.jpg · assets/audio/bgm.mp3(自備)
```

## 配色與語言
- 東軍（德川）= 藍 🔵 ／ 西軍（石田）= 紅 🔴
- 繁體中文為主，日文用於專有名詞（武將、家紋、地名原文）

## 待補（可選）
- **配樂檔**：把 Suno 生成的 mp3 放到 `assets/audio/bgm.mp3`（已接好播放鈕，缺檔顯示「無音檔」不會壞）
- 效能調校、全程繁中校對

## 本機預覽
```bash
python3 -m http.server 8137
# 瀏覽器開 http://localhost:8137          ← 完整節目
# 瀏覽器開 http://localhost:8137/crest-preview.html   ← 家紋逐一檢視
```
（因使用相對路徑 script，請用 http 伺服器開啟，勿直接 file:// 開 index.html）

## 操作
- **節目模式**（預設）：自動運鏡 + 字幕，像電視特別節目。按「🕹 自由運鏡」可改為手動拖曳。
- **時間軸**：拖曳底部 scrubber 可跳到任一時刻（08:00 辰刻 ~ 14:00 未刻）；播放/暫停、0.5×~4× 倍速。
- **點選部隊**：顯示武將、所屬、即時兵力、家紋。
- **配樂**：按「配樂」鈕播放 `assets/audio/bgm.mp3`（需自行放入 Suno 生成的音檔）。

## 重新抓取地形
```bash
python3 fetch_dem.py     # 重新產生 data/heightmap.js（opentopodata SRTM 30m，約 20 秒）
```
