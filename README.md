# 3D 關原之戰 — 電視級歷史節目

以 Three.js 製作的單頁互動式 3D 歷史戰役節目，靈感來自「3D 香港保衛戰」。
純前端、免 build、可自由運鏡，依時間軸演示關原之戰（1600 年）雙方陣型、移動、家紋軍旗與戰場特效。

## 設計決策
- **配色**：東軍（德川）= 藍 🔵 ／ 西軍（石田）= 紅 🔴
- **地形**：真實 DEM 高程 + 地形著色（M2 接入；M1 先用程序化山頭佔位）
- **語言**：繁體中文為主，日文僅用於專有名詞（武將、家紋、地名原文）

## 技術架構
沿用「引擎 / 資料分離」：`src/engine/*` 是通用引擎，`data/*` 是關原戰役內容。
全域 `THREE`（r128 UMD）+ 全域 `SEKI` 命名空間，無打包工具。

```
index.html              載入函式庫 + 資料 + 引擎（依序 script）
lib/three/              three.min.js / OrbitControls.js / CSS2DRenderer.js
data/
  geography.js          關原地理（經緯度+海拔）：笹尾山/松尾山/南宮山/桃配山/天滿山…
src/
  engine/
    scene.js            renderer/camera/OrbitControls/燈光/ACES 色調 + 經緯度投影
    terrain.js          地形網格（M1 程序化高度場 → M2 真實 DEM）
    labels.js           CSS2D 地名標籤
  main.js               啟動點：組裝場景 + M1 占位部隊 + 渲染迴圈
assets/terrain/         DEM 高程 / 底圖（M2）
assets/audio/           配樂（M5）
```

## 里程碑
- [x] **M1 引擎骨架**：場景 + OrbitControls 自由運鏡 + 程序化地形 + 地名標籤 + 占位本陣旗（紅藍）
- [x] **M3 部隊 + 家紋**：12 名武將、Canvas 程序化家紋幟旗（飄動）、track 時間軸內插（8:00→14:00 自動播放）、兵力/戰況標籤、潰滅淡出。家紋預覽見 `crest-preview.html`
- [x] **M4 特效 + 天氣**：鐵炮齊射砲口閃光（加色粒子）+ 硝煙（ShaderMaterial 粒子系統，於交戰部隊位置噴發）、朝霧→放晴動態 fog/天色/光照/曝光 + 貼地飄移霧層
- [x] **M2 真實地形**：關原 SRTM 30m 真實 DEM（41×41，由 `fetch_dem.py` 抓取存於 `data/heightmap.js`）建地形網格 + 依真實海拔著色 + 雙線性貼地高度
- [x] **M5 運鏡 + UI + 配樂**：節目模式自動運鏡（9 個 storyboard 鏡位）、時間軸 scrubber、播放/暫停/倍速、節目↔自由切換、字幕（重大事件高亮）、雙方兵力儀表、點選部隊看卡片、配樂開關
- [x] **收尾**：移動方向箭頭、部隊防重疊 decollide、點選 hitbox

### 尚未完成
- [ ] **⚠️ 瀏覽器視覺驗證**：全程未經人眼確認（claude-in-chrome 擴充連不上）——家紋線條、粒子亮度、相機鏡位、地形誇張係數都可能需微調
- [ ] **配樂檔**：把 Suno 生成的 mp3 放到 `assets/audio/bgm.mp3`（已接好播放鈕，缺檔時按鈕顯示「無音檔」不會壞）
- [ ] 戰線 `fronts`、行動裝置觸控/效能調校、全程繁中校對
- [ ] **M4 特效 + 天氣**：鐵炮/砲火粒子、砲口閃光、朝霧→放晴
- [ ] **M5 運鏡 + UI + 配樂**：storyboard 自動播放、時間軸 scrubber、字幕旁白、Suno 配樂

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
