# 諾曼第登陸 · 奧馬哈海灘（1944/6/6）— 設計稿

**日期**：2026-06-15
**分支**：`feature/normandy-1944`
**狀態**：已與使用者確認方向，待 spec 審閱 → 進實作計畫

## 目標

在既有 3D 歷史節目專案（關原 1600、桶狹間 1560）新增第三場戰役：**諾曼第登陸之奧馬哈海灘**。這是第一場「現代化戰爭」，需引入海軍艦艇、空中兵力、地對空高射砲、岸防工事、登陸艇與搶灘步兵等全新軍種與戰鬥動畫，並維持與前兩場一致的電視級節目感（自動運鏡、時間軸、字幕、兵力儀表、交戰拉鋸條、史料面板）。

## 已確認決策

- **焦點**：奧馬哈海灘為主（含西端 Pointe du Hoc 突擊隊攀崖）。
- **軍種**：海軍艦艇、空中兵力、岸防/地面、步兵搶灘 — 全做。
- **配色**：盟軍 = east = 藍（進攻/勝方）；德軍 = west = 紅（防守）。沿用前兩場「勝方藍」慣例。
- **地圖**：全新下載真實 DEM + 衛星影像（不可省略）。
- **切換列**：三頁皆三顆鈕，依**年代排序** 桶狹間1560 → 關原1600 → 諾曼第1944。
- **時間軸**：延到傍晚「灘頭全鞏固」（`T_START 5.5` → `T_END ~18`）。
- **事件節點**：50 個（與桶狹間同標準）。

## 架構原則（沿用既有，零回歸）

`src/engine/*` 與 `lib/*` 完全共用、不分叉。戰役差異透過**向後相容的全域 `SEKI.config`** 注入。關原頁不設 config、桶狹間設既有欄位 → 全部 fallback 原行為。諾曼第新增 `modern:true` 旗標啟用現代單位渲染路徑；前兩場無此旗標，**完全不受影響**。

## 1. 地圖資料（全新下載）

| 項目 | 內容 |
|---|---|
| bbox | 經度 -1.01 ~ -0.74、緯度 49.32 ~ 49.46（北＝海峽外海艦隊區、中＝海灘、南＝崖頂與內陸村落）|
| 涵蓋 | 西端 Pointe du Hoc、Dog/Easy/Fox 灘段、D-1 Vierville～E-3 Colleville 出口隘道、崖頂 WN 德軍據點群、Vierville/St-Laurent/Colleville 村落 |
| 解析度 | SRTM 30m，約 161×141 格 |
| 海面 | SRTM 外海回傳 0/負值 → 夾到 0、以海藍呈現 |
| 新腳本 | `fetch_dem_normandy.py` → `data/normandy/heightmap.js`；`fetch_sat_normandy.py` → `assets/terrain/normandy-sat.jpg`（EOX Sentinel-2 cloudless，bbox 對齊）|
| `exag` | 3.5（海灘平、崖高 ~45m）|
| `elevStops` | 海(深藍 0)→ 灘地(淺沙 1~3)→ 崖坡(草綠 10~45)→ 內陸(土黃)|

## 2. 時間軸與運鏡

- t = 距 1944/6/6 00:00 的小時數。`fmtTime` 改 24 小時制：「1944年6月6日 06:30」。
- `T_START 5.5`（05:30 海空火力準備）→ `T_END 18`（傍晚灘頭鞏固）。
- 相位 `phase(t)`：05:50 艦砲齊射 → 06:00 空襲(炸偏內陸) → ★06:30 H 時首波搶灘 → 07:00 釘死卵石堤 → 08:30 驅逐艦抵近直射＋小股攀崖 → 11:00 隘道打通 → 13:00 突破內陸 → 16:00+ 灘頭鞏固。
- storyboard 運鏡：艦隊全景 → 登陸艇貼海面逼近 → 崖頂火力點俯瞰 → 驅逐艦抵近 → 隘道突破 → 灘頭全景收尾。

## 3. 陣營與部隊

- **盟軍(藍)**：US 1st 步兵師(Big Red One)、29th 步兵師、2nd/5th 遊騎兵營、海軍特遣艦隊（USS Texas 戰艦＋驅逐艦群）、741 戰車營 DD 戰車、工兵。
- **德軍(紅)**：352 步兵師、Omaha 沿線 WN（抵抗巢）據點群（MG42 機槍火網、88 砲、迫擊砲）、崖頂 flak 高射砲。

`armies.js` 約 18 單位，雙方兵力平衡呈現；track 走「海→灘→崖→內陸」。

## 4. ★ 新軍種與戰鬥動畫（核心新工程）

新增可插拔的單位模型工廠，引擎依 `SEKI.config.modern` 決定建「幟旗」或「3D 模型」。

**新模組 `src/engine/models.js`** — `SEKI.buildUnitMesh(kind, side, color)` 回傳程序化 low-poly `THREE.Group`：

| 新 `kind` | 模型 | 戰鬥動畫（擴充 `effects.js`）|
|---|---|---|
| `warship` | 戰艦/驅逐艦艦體 | 砲口閃光 → 砲彈拋物弧 → 岸上命中爆炸 |
| `landingcraft` | LCVP 登陸艇 | 貼海面駛向灘頭 → 放下跳板 → 吐出步兵 |
| `aircraft` | 轟炸機/戰鬥機 | 掠過投彈/掃射、飛行軌跡 |
| `armor` | DD 雪曼戰車 | 登陸推進、砲擊 |
| `bunker` | 德軍碉堡/托貝魯克工事 | MG42 紅色曳光彈扇形火網掃向灘頭 |
| `flak` | 地對空高射砲 | 對空齊射 → 空中防空炸點(flak puff)|
| `infantry` | 現代步兵（搶灘） | 自登陸艇衝出、灘頭傷亡、攀崖突破 |

- 時間軸內插、聚焦(setFocus)、防重疊(decollide)、兵力儀表、點選卡片、移動箭頭 — 全沿用既有 `units.js`，只換視覺 mesh 與該兵種特效。
- `units.js` 的 `buildUnits` 在 `S.config.modern` 為真時呼叫 `S.buildUnitMesh`，否則走原幟旗路徑。
- `KICON` 與圖例改為可由 `SEKI.config.kindIcons` 覆寫（艦/登/機/戰/堡/砲/步）；關原仍用原本本/砲/銃/騎/槍。

## 5. 資料檔（`data/normandy/*.js`，schema 同桶狹間）

`geography.js`（灘段/隘道/據點/Pointe du Hoc 地標；`labels.js` 視需要新增 `bunker`/`naval` 標記型別，純新增向後相容）· `heightmap.js`（下載產出）· `armies.js`（~18 單位）· `weather.js`（陰天、湧浪、海空煙幕層；`normandy-main.js` 自帶煙幕粒子，類比桶狹間雨絲）· `storyboard.js` · `sources.js`（史料＋史觀：傷亡數字爭議、空襲炸偏內陸、DD 戰車多數沉沒、352 師存在情報誤判）· `engagements.js`（據點 vs 搶灘段，供交戰拉鋸條）· `events.js`（50 節點）。

## 6. 頁面與跨頁切換

- 新頁 `normandy.html`（複製 `okehazama.html`，改標題、資料 script、main、圖例、KICON）。
- `src/normandy-main.js`：`SEKI.config`（含 `modern:true`、`kindIcons`、`fmtTime`、`sideName/Short`、`kindArms`、`exag`、`elevStops`、`satelliteTexture`）+ 自帶海空煙幕系統 + 主迴圈。
- **三頁 `#campaign-switch` 統一為年代排序三顆鈕**：桶狹間1560 → 關原1600 → 諾曼第1944，各頁標自己 active。

## 7. 風險與驗證

- 最大風險＝ 3D 模型與戰鬥動畫質感，需 **claude-in-chrome 瀏覽器實測微調**（艦砲弧線、曳光火網、爆炸/水花密度、模型比例）。
- 地圖下載依賴 opentopodata（限速 1 req/s）與 EOX WMS，同前兩戰役流程；下載為離線前置步驟。
- 回歸風險：所有引擎改動皆以 `config.modern`/config 覆寫為閘，前兩場無旗標 → 行為不變。需開三頁各做一次煙霧測試確認無 console 錯誤。

## 不做（YAGNI）

- 不做 Utah/Gold/Juno/Sword 其他四灘的細節（僅 Omaha）。
- 不做真實 GLTF 軍備模型（程序化 low-poly 即可，符合既有風格）。
- 不做多人/互動操作；維持節目自動運鏡 + scrubber。
