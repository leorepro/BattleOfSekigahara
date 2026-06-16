# 奧斯特利茨之戰（1805）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增第五場戰役「奧斯特利茨之戰 1805」獨立頁，沿用既有 Three.js 引擎，實作拿破崙時代步/騎/砲三兵種、路徑關鍵影格移動（含騎兵衝鋒、空心方陣）、排槍/砲兵齊射 FX，以「拿破崙的陷阱」謀略主線串接運鏡，最終 Chrome 實機驗證。

**Architecture:** 沿用「每戰一頁 + 共用 `src/engine/*` + `data/<戰役>/*` 參數化」模式。新增 `austerlitz.html` / `src/austerlitz-main.js` / `data/austerlitz/*.js`。新增三個引擎模組：`napoleonic.js`（單兵幾何）、`maneuver.js`（移動 state 擴充：charge/square/line/column）、`volley.js`（排槍+砲兵 FX）。移動完全由時間軸 t 純函數內插（沿用 `sampleTrack`），可拖曳/倒退重現。

**Tech Stack:** Three.js r128 UMD（全域 `THREE` + `window.SEKI` 命名空間，免 build）、Canvas 程序化、Python（DEM/衛星圖抓取）。

**驗證約定（本 repo 無單元測試框架）：** 每個改動 JS 的步驟以 `node --check <file>` 為自動語法閘門（取代單元測試的紅綠燈）；視覺正確性集中在 Phase 8 用 claude-in-chrome 逐項截圖驗證。派 subagent 時 prompt 必含「禁 git + 限定檔案 + 完成跑 node --check」。

**參考檔（鏡像對象）：** `thermopylae.html`、`src/thermopylae-main.js`、`data/thermopylae/{armies,geography,events,storyboard,sources,weather,engagements}.js`、`src/engine/{hoplite,melee,formation,units,storyboard}.js`。

**關鍵既有 API（實作須沿用，勿重造）：**
- 部隊資料：`SEKI.armies[]`，每筆 `{id,name_zh,name_ja,side('east'|'west'),faction,factionColor,kind,title,troops,track:[{t,lng,lat,s,st}]}`。
- 移動內插：`S.sampleTrack(track,t,ctrls)` 已內建關鍵影格線性/貝茲內插；`S.updateUnits(t)` 設 `u.cur`(含 `.s`,`.st`)、`u.moveDir`、`u.group.position`、防重疊。**不要改寫這兩個核心；新 state 以加值方式擴充。**
- 投影：`S.engine.project(lng,lat,h)` → `{x,y,z}` 世界座標；`S.terrain.heightAt(x,z)` → 地形高度。
- 陣型：`S.buildFormations()`/`S.updateFormations(t)` 依 `config.formationStyle` 分支（`'phalanx'` 已存在）；逐兵貼地形 + clamp 高度差已實作。
- 單兵幾何典範：`S.buildHopliteGeo(variant,opts)`（`hoplite.js`）合併多 box + 頂點色 → 供 InstancedMesh 共享。
- 主迴圈鉤子（`*-main.js` boot/animate）：`buildTerrain/buildGeoLabels/buildUnits/buildFormations/buildRoutes/initEffects/buildEngagements/initWeather/initUI/setProgramMode`；每幀 `updateUnits/updateFormations/updateRoutes/waveFlags/updateWeather/updateEffects/updateEngagements/updateEvents/updateUI`，可選 `initMelee/updateMelee`、`initTriremes/updateTriremes`。`S.player.cinemaScale` 乘入子彈時間 dt。

---

## Phase 0：骨架 + 五頁切換（頁面可載入、不破圖）

### Task 0.1：新增戰役分支與目錄骨架

**Files:**
- 分支：`feature/austerlitz-1805`（已建立）
- Create dir: `data/austerlitz/`

- [ ] **Step 1:** 確認在 `feature/austerlitz-1805` 分支。
  Run: `git branch --show-current`
  Expected: `feature/austerlitz-1805`
- [ ] **Step 2:** 建目錄 `mkdir -p data/austerlitz`。
- [ ] **Step 3:** Commit（空目錄用 `.gitkeep` 暫佔或留待 Task 0.3 一併提交）。

### Task 0.2：placeholder 資料檔（先用 thermopylae 結構讓頁面能跑）

**Files:**
- Create: `data/austerlitz/{geography,armies,events,storyboard,sources,weather,engagements,heightmap}.js`

- [ ] **Step 1:** 以最小可載入內容建立各檔（先放 1–2 筆 placeholder，後續 Phase 取代）。每檔頂部 `window.SEKI = window.SEKI || {};`，掛載對應 `SEKI.geography / SEKI.armies / SEKI.events / SEKI.storyboard / SEKI.sources / SEKI.weather / SEKI.engagements`。`heightmap.js` 暫複製 `data/thermopylae/heightmap.js` 作 placeholder（Phase 1 由 `fetch_dem_austerlitz.py` 取代；**注意：在真實 DEM 產出前地形會跑版，屬已知**）。
  - `geography.js` 的 `origin` 暫設 `{ lng: 16.76, lat: 49.13 }`（普拉欽高地一帶）。
- [ ] **Step 2:** `node --check` 全部新檔。
  Run: `for f in data/austerlitz/*.js; do node --check "$f" || echo "FAIL $f"; done`
  Expected: 無 FAIL 輸出。
- [ ] **Step 3:** Commit `feat(austerlitz): Phase 0 資料骨架 placeholder`。

### Task 0.3：`src/austerlitz-main.js`（config + boot，鏡像 thermopylae-main.js）

**Files:**
- Create: `src/austerlitz-main.js`

- [ ] **Step 1:** 複製 `src/thermopylae-main.js` 為起點，改寫 `S.config`：
  - `fmtTime(t)`：以 12/2 當日鐘點呈現（如 `會戰 · 上午9時`）。時間軸建議 `T_START:-12`（11/21–12/1 誘敵序幕壓縮）`T_END:20`（午後潰敗→普雷斯堡）。
  - `sideName: { west:'法蘭西帝國', east:'俄奧聯軍' }`、`sideShort: { west:'法軍', east:'聯軍' }`（**法軍=west=藍=勝方**，聯軍=east）。
  - `kindIcons: { command:'帥', infantry:'步', cavalry:'騎', artillery:'砲' }`。
  - `kindArms`：步兵（線列/縱隊·燧發槍排槍）、騎兵（胸甲/驃騎·衝鋒）、砲兵（野戰砲·齊射）、command。
  - `factionColors`：法軍藍家族（line `0x2a4a9a`、guard `0x1c2f6e`、cavalry `0x3a5ab0`、artillery `0x24407a`）、俄軍綠（`0x3a6a44`、guard `0x2c5436`）、奧軍白（`0xcdd2da`、cavalry `0xb9c0cc`）。
  - `formationStyle: 'napoleonic'`（新分支，見 Phase 2/4）。
  - `satelliteTexture: 'assets/terrain/austerlitz-sat.jpg'`、`exag`（待 DEM 後調，暫 2.0）、`skyColor/fogColor`（冬日霧色偏灰白 `0xc8ccce`）。
  - `frozenPond: { seaLevel: <閾值> }`（扎錢湖冰面，Phase 1/6 用）。
  - 移除溫泉關專屬鍵：`ancientCoast`、`chokeZone`、`troopsClaim`（Austerlitz 改放冰湖迷思於 sources，不在兵力儀表並陳）、`formationStyle:'phalanx'`。
  - `phase(t)` 改寫為拿破崙陷阱主線分段字串（設餌→咬餌→霧中開戰→中央突破→斬腰→冰湖→普雷斯堡）。
  - boot()：移除 `initTriremes`（無艦隊）；保留 `initMelee`（騎兵衝擊/混戰可複用）。新增 `if (S.initVolley) S.initVolley();` 與每幀 `if (S.updateVolley) S.updateVolley(t, cdt);`。
- [ ] **Step 2:** `node --check src/austerlitz-main.js`。Expected: pass。
- [ ] **Step 3:** Commit `feat(austerlitz): Phase 0 austerlitz-main config+boot`。

### Task 0.4：`austerlitz.html`（頁面 + 五頁切換列）

**Files:**
- Create: `austerlitz.html`（複製 `thermopylae.html`）
- Modify: `index.html`、`thermopylae.html`、`okehazama.html`、`normandy.html`（切換列加第五鈕）

- [ ] **Step 1:** 複製 `thermopylae.html` → `austerlitz.html`：改 `<title>`、標題卡文案（奧斯特利茨·三皇會戰·1805）、史觀字幕；`<script>` 引用改為 `data/austerlitz/*.js`、`src/austerlitz-main.js`，並**新增** `<script src="src/engine/napoleonic.js">`、`maneuver.js`、`volley.js`（在 main 之前）；移除 `triremes.js`、`data/thermopylae/*` 引用。
- [ ] **Step 2:** 五頁切換列：在所有頁面（含 `index.html`）的切換按鈕區，依年代排序插入奧斯特利茨鈕：`溫泉關-480 → 桶狹間1560 → 關原1600 → 奧斯特利茨1805 → 諾曼第1944`。先 grep 既有切換列 markup 以對齊樣式：
  Run: `grep -rn "thermopylae.html" *.html`
- [ ] **Step 3:** 語法/載入檢查：`node --check src/austerlitz-main.js`；瀏覽器載入留待 Phase 8（DEM 未就緒前僅確保無 JS ReferenceError——新模組 stub 須先存在，見 Task 0.5）。
- [ ] **Step 4:** Commit `feat(austerlitz): Phase 0 頁面 + 五頁切換列`。

### Task 0.5：三個新引擎模組 stub

**Files:**
- Create: `src/engine/napoleonic.js`、`src/engine/maneuver.js`、`src/engine/volley.js`

- [ ] **Step 1:** 各檔以 IIFE `(function(S){ ... })(window.SEKI)` 包裝，先掛空函式骨架以免 main 呼叫時報錯：
  - `napoleonic.js`：`S.buildNapoleonicGeo = function(variant, opts){ /* Phase 2 */ return new THREE.BufferGeometry(); };`
  - `maneuver.js`：`S.initManeuver = function(){};` `S.updateManeuver = function(t){};`（Phase 4 實作；移動主體仍由既有 units/formation 負責，此模組僅疊加 charge/square 行為）。
  - `volley.js`：`S.initVolley = function(){};` `S.updateVolley = function(t,dt){};`（Phase 5）。
- [ ] **Step 2:** `node --check` 三檔。Expected: pass。
- [ ] **Step 3:** Commit `feat(austerlitz): Phase 0 napoleonic/maneuver/volley 模組 stub`。

---

## Phase 1：真實地形（DEM + 衛星圖 + 地理地標）

### Task 1.1：`fetch_dem_austerlitz.py`

**Files:**
- Create: `fetch_dem_austerlitz.py`（複製 `fetch_dem_thermopylae.py` 改 bbox/輸出路徑）

- [ ] **Step 1:** 改 bbox 約 `lon 16.68–16.88 / lat 49.06–49.20`（中心 ~49.13N 16.76E，涵蓋普拉欽高地、桑頓山、Goldbach 溪、Telnitz/Sokolnitz、扎錢湖南緣），輸出 `data/austerlitz/heightmap.js`（掛 `SEKI.heightmap`，格式比照 thermopylae）。
- [ ] **Step 2:** 語法檢查：`python3 -c "import ast; ast.parse(open('fetch_dem_austerlitz.py').read())"`。
- [ ] **Step 3:** **（使用者執行）** `python3 fetch_dem_austerlitz.py` 產真實高程（沿溫泉關慣例，使用者自跑 DEM）。Plan 標記：在使用者跑完前，Phase 8 視覺驗證地形會跑版。
- [ ] **Step 4:** Commit `feat(austerlitz): Phase 1 DEM 抓取腳本`。

### Task 1.2：`fetch_sat_austerlitz.py`

**Files:**
- Create: `fetch_sat_austerlitz.py`（複製 `fetch_sat_thermopylae.py`）

- [ ] **Step 1:** 改同 bbox，ESRI World Imagery，輸出 `assets/terrain/austerlitz-sat.jpg`。
- [ ] **Step 2:** 語法檢查同上。
- [ ] **Step 3:** **（使用者執行）** `python3 fetch_sat_austerlitz.py`。
- [ ] **Step 4:** Commit `feat(austerlitz): Phase 1 衛星圖抓取腳本`。

### Task 1.3：`data/austerlitz/geography.js`（真實地標）

**Files:**
- Modify: `data/austerlitz/geography.js`（取代 Task 0.2 placeholder）

- [ ] **Step 1:** `origin: { lng:16.76, lat:49.13 }`。`features[]`（type 沿用 mountain/hill/battlefield/camp/river/town/road）至少含：
  - 普拉欽高地（Pratzen Heights，`hill`，戰場中央要地，~49.118N 16.762E）
  - 桑頓山（Santon，`hill`，北線拉納防守，~49.155N 16.73E）
  - Telnitz（塔爾尼茲，`town`，南線，~49.09N 16.74E）
  - Sokolnitz（索科爾尼茲，`town`，南線，~49.10N 16.755E）
  - Goldbach 溪（`river`，南北向分隔雙方）
  - 扎錢湖 Satschan（`river`，南線冰湖，~49.07N 16.78E，note 標破除迷思）
  - 拿破崙本陣（Žuráň 丘，`camp`，~49.16N 16.72E）/ Stare Vinohrady（俄軍中央）
  - 奧斯特利茨城堡（Slavkov，`town`，~49.15N 16.876E）
- [ ] **Step 2:** `lines[]`：法軍中央突破（Žuráň→普拉欽）、聯軍南調（高地→Telnitz/Sokolnitz）、繆拉/拉納北線、聯軍冰湖潰退路線。
- [ ] **Step 3:** `node --check data/austerlitz/geography.js`。
- [ ] **Step 4:** Commit `feat(austerlitz): Phase 1 地理地標`。

### Task 1.4：扎錢湖冰面著色（config + terrain 鉤子）

**Files:**
- Modify: `src/austerlitz-main.js`（config.frozenPond / elevStops / seaColor）
- Read first: `src/engine/terrain.js`（確認 `seaColor`/`elevStops`/低地著色既有鉤子）

- [ ] **Step 1:** 先讀 `terrain.js` 確認可用鍵（thermopylae 用 `ancientCoast.seaLevel`+`seaColor`+`elevStops`）。冬季雪地色階：低地灰綠→雪線白；湖盆閾值以下著「冰面」色（淺青白 `0xcfe0e6`）。`seaColor` 設冰色。
- [ ] **Step 2:** `node --check src/austerlitz-main.js`。
- [ ] **Step 3:** Commit `feat(austerlitz): Phase 1 冬季色階 + 扎錢湖冰面`。

---

## Phase 2：拿破崙時代單兵幾何（napoleonic.js）+ 陣型分支

### Task 2.1：`buildNapoleonicGeo(variant, opts)` — 步兵

**Files:**
- Modify: `src/engine/napoleonic.js`
- Pattern ref: `src/engine/hoplite.js`（`buildHopliteGeo` 合併 box + 頂點色）、`formation.js:modernSoldierGeo()`

- [ ] **Step 1:** 實作 `mergeBoxes`（可複製 hoplite/formation 既有寫法）+ 頂點上色 helper。實作步兵 variants：`'french-line'`（藍外套 `0x2a4a9a` + 白褲 + 黑 shako 高帽）、`'french-guard'`（熊皮帽 bearskin）、`'russian-line'`（綠外套 `0x3a6a44` + 黑帽）、`'austrian-line'`（白外套 `0xcdd2da`）。部件：雙腿/軀幹/頭/帽/雙臂/直持燧發槍（含刺刀細長 box）。`opts.coat` 覆寫外套色（吃 `factionColor`）。
- [ ] **Step 2:** `node --check src/engine/napoleonic.js`。
- [ ] **Step 3:** Commit `feat(austerlitz): Phase 2 步兵幾何 variants`。

### Task 2.2：騎兵 + 砲兵 variants

**Files:**
- Modify: `src/engine/napoleonic.js`

- [ ] **Step 1:** 騎兵 variants：`'cuirassier'`（法軍胸甲騎兵：胸甲反光 metalness 高 + 馬 + 軍刀）、`'hussar'`/`'dragoon'`、`'russian-guard-cav'`、`'austrian-cav'`。馬身用合併 box（軀幹/四腿/頭/尾），騎手坐其上，手持軍刀或騎槍。提供 `variantIsMounted(variant)` 判斷。
- [ ] **Step 2:** 砲兵 variants：`'artillery'` = 砲組員（推炮姿）+ `'cannon'`（砲管 + 兩大車輪 + 砲架）。可拆 `buildCannonGeo()` 單獨給 volley/units 用。
- [ ] **Step 3:** `node --check`。Commit `feat(austerlitz): Phase 2 騎兵+砲兵幾何`。

### Task 2.3：`formation.js` 新增 napoleonic 分支（line/column/square 排列）

**Files:**
- Modify: `src/engine/formation.js`（`buildFormations`/`updateFormations` 加 `napoleonic` 分支）

- [ ] **Step 1:** 在 `buildFormations` 開頭加 `const napo = !!(S.config && S.config.formationStyle === 'napoleonic');`。新增 napoleonic 分支（比照 phalanx 分支結構）：依 `a.kind` 選 variant（infantry→依 faction 的 line/guard、cavalry→cuirassier/hussar、artillery→cannon+crew、command→guard）；用 `S.buildNapoleonicGeo`；InstancedMesh + 比例制人數（沿用每~18人顯1兵、cap 控效能）；本地座標 `base[]` 供逐兵貼地。
  - 排列形態先建「橫隊 line」為預設 base（寬而淺，cols 多 rows 少），實際 line/column/square 切換在 Task 4.x 依 `st` 動態調整 base 縮放（比照 phalanx 的 chokeZone 壓縮手法：對 base 做 x/z scale）。
- [ ] **Step 2:** `updateFormations` napoleonic 分支：沿用逐兵貼地形 + clamp 高度差（複製 phalanx 區塊邏輯，去掉 chokeZone，改讀 `f.formMode`）。
- [ ] **Step 3:** `units.js` 旗幟：phalanx 已走「陣營色純色旗」分支（`formationStyle` 非 'phalanx' 時不觸發）。改判斷為 `formationStyle === 'phalanx' || 'napoleonic'` 皆走純色旗（拿破崙軍團用團色旗，無日式家紋）。先讀 `units.js:247` 該分支確認改法。
- [ ] **Step 4:** `node --check src/engine/formation.js src/engine/units.js`。Commit `feat(austerlitz): Phase 2 napoleonic 陣型分支 line/column/square 基礎`。

---

## Phase 3：完整編成（15 單位）+ UI

### Task 3.1：`data/austerlitz/armies.js`（法軍 7 + 聯軍 8）

**Files:**
- Modify: `data/austerlitz/armies.js`（取代 placeholder）
- Pattern ref: `data/thermopylae/armies.js`

- [ ] **Step 1:** 依設計文件 §5 表格建立 15 單位。每筆 `side`（法軍 west / 聯軍 east）、`faction`、`factionColor`（吃 config.factionColors）、`kind`（command/infantry/cavalry/artillery）、`commander`/`title`、`troops`、`track`。座標用真實經緯度（普拉欽 16.76/49.12、桑頓 16.73/49.155、Telnitz 16.74/49.09、Sokolnitz 16.755/49.10、奧洛穆茨方向東側聯軍出發、維也納方向西側法軍）。
  - 法軍：近衛軍(貝西埃爾)、第一軍(貝爾納多特)、第三軍(達武)、第四軍(蘇爾特·中央突破主角)、第五軍(拉納·北線)、擲彈兵軍(烏迪諾)、騎兵預備軍(繆拉)。
  - 聯軍：俄國近衛軍(康斯坦丁)、右翼前鋒(巴格拉季昂)、第五縱隊奧騎兵(列支敦斯登)、左翼前鋒(基恩米亞)、第一縱隊(多克托洛夫)、第二縱隊(朗熱隆)、第三縱隊(普雷斯比斯維斯基)、第四縱隊(米羅拉多維奇/克羅拉瑟)。
- [ ] **Step 2:** `track` 走位扣主線（**Phase 4 會精修 st**，此步先建位置關鍵影格）：
  - 序幕(t<−4)：雙方 march 進場（法軍自西、聯軍自東/奧洛穆茨）。
  - 設餌：法軍右翼(蘇爾特列格朗師代表/達武)南線少量 hold；法軍放棄普拉欽（中央留空）。
  - 咬餌：聯軍第一/二/三/四縱隊 march 南下普拉欽→Telnitz/Sokolnitz attack。
  - 突破：蘇爾特 t≈9 自高地腳 `breakthrough` 衝上普拉欽。
  - 斬腰：貝爾納多特北→中增援；俄國近衛軍 attack 反撲被擊退。
  - 冰湖：南線聯軍 t≈14 `rout` 退向扎錢湖。
- [ ] **Step 3:** `node --check data/austerlitz/armies.js`。Commit `feat(austerlitz): Phase 3 完整編成 15 單位 + 走位`。

### Task 3.2：UI 兵力儀表 / 點選卡片 / 史觀文字

**Files:**
- Read first: `src/engine/ui.js`
- Modify: `austerlitz.html`（如需 .tc-* 類 CSS，比照 thermopylae 補）

- [ ] **Step 1:** 確認 `ui.js` 依 `config.sideName/sideShort/kindIcons/kindArms` 與 `S.sideStrength()/sideCasualties()` 運作，奧斯特利茨 config 已提供 → 應自動生效。點選卡片顯示 commander/title/troops。
- [ ] **Step 2:** 若 thermopylae 有 `.tc-*` 等頁面專屬 CSS，於 `austerlitz.html` 比照補上（grep 確認）。
- [ ] **Step 3:** `node --check` 任何改動 JS。Commit `feat(austerlitz): Phase 3 UI 文案`。

---

## Phase 4：移動系統 maneuver.js（charge / square / line↔column）

### Task 4.1：state 擴充 — 新增 charge / square / line / column 語意

**Files:**
- Modify: `src/engine/maneuver.js`、`data/austerlitz/armies.js`（在 track 標相應 `st`）
- Modify: `src/engine/formation.js`（napoleonic 分支讀 `f.formMode` 調整 base 形態）

- [ ] **Step 1:** `maneuver.js` 實作 `S.updateManeuver(t)`：遍歷 `S.armies`，依當前 `u.cur.st` 設定每個 formation 的 `formMode`（`'line'|'column'|'square'|'charge'|'rout'`）。提供映射：`march`→`column`（行軍縱隊，窄而長）、`attack/hold`→`line`（展開橫隊）、`square`→`square`（空心方陣）、`charge`→`charge`（騎兵密集楔形）。把 `formMode` 寫到對應 form 物件供 formation.js 取用。需 `S.getForms?()` 或在 formation.js 暴露查詢；若無，於 formation.js 加 `S.setFormMode(unitId, mode)`。
- [ ] **Step 2:** `formation.js` napoleonic 分支依 `formMode` 對 `base` 做 x/z scale（column：x*0.5,z*1.8；line：x*1.6,z*0.7；square：排成空心方框；charge：x*0.8,z*1.2 楔形）。比照既有 phalanx chokeZone 的 `sq/zst` scale 手法，dirty 檢查加入 `formMode` 變更。
- [ ] **Step 3:** main animate 串入 `if (S.updateManeuver) S.updateManeuver(t);`（在 `updateUnits` 後、`updateFormations` 前）。
- [ ] **Step 4:** `node --check` 改動檔。Commit `feat(austerlitz): Phase 4 移動 state→formMode 映射`。

### Task 4.2：騎兵衝鋒加速曲線 + 單兵微抖動

**Files:**
- Modify: `src/engine/maneuver.js`

- [ ] **Step 1:** `charge` 段：在 `S.updateManeuver` 對騎兵單位偵測 `st==='charge'`，回報一個 `chargeIntensity(t)`（ease-in 0→1）供 volley/effects 觸發衝擊塵爆、供 storyboard 子彈時間焦點。位置加速本身由 track 關鍵影格密度控制（衝鋒段 waypoint 時間間隔短→視覺快速），保持「t 純函數」。
- [ ] **Step 2:** 單兵微抖動：在 formation.js napoleonic 逐兵迴圈，本地座標疊加 `sin(i*f + t*g)` 的微小位移（由 t 決定 → 可倒退重現），幅度小（<0.1 單位）增加生氣。
- [ ] **Step 3:** `node --check`。Commit `feat(austerlitz): Phase 4 騎兵衝鋒強度 + 單兵微抖動`。

---

## Phase 5：戰術 FX volley.js（排槍 + 砲兵齊射 + 騎兵衝擊）

### Task 5.1：排槍齊射（線列步兵）

**Files:**
- Modify: `src/engine/volley.js`
- Read first: `src/engine/effects.js`（複用粒子/閃光池；關原鐵炮已有槍口火光+硝煙路徑可參考）

- [ ] **Step 1:** `S.initVolley()`：建立 muzzle flash（短命亮點 sprite/points）+ 硝煙（半透明擴散 puff）粒子池。`S.updateVolley(t,dt)`：對 `S.firePoints(t)` 中 `kind==='infantry'` 且 `st==='attack'` 的單位，沿橫隊正面「一排排錯落」觸發槍口火光（非全齊，用 per-instance 相位）。
- [ ] **Step 2:** `node --check src/engine/volley.js`。Commit `feat(austerlitz): Phase 5 排槍齊射 FX`。

### Task 5.2：野戰砲兵齊射 + 彈著塵爆

**Files:**
- Modify: `src/engine/volley.js`

- [ ] **Step 1:** 對 `kind==='artillery'` 開火單位：砲口大火光 + 濃砲煙環 + 沿 `engagementTarget` 方向的彈著塵爆（複用 effects 的 burst）。砲擊頻率較疏（每數秒一輪齊射）。
- [ ] **Step 2:** **冰湖砲擊**特例：結局 t（南線聯軍 rout 期）對扎錢湖座標落彈 → 冰面裂紋 FX（可用 effects 既有 burst + 一張裂紋貼圖/線段）。
- [ ] **Step 3:** `node --check`。Commit `feat(austerlitz): Phase 5 砲兵齊射 + 冰湖砲擊`。

### Task 5.3：騎兵衝擊 FX

**Files:**
- Modify: `src/engine/volley.js` 或 `effects.js`

- [ ] **Step 1:** 對 `kind==='cavalry'` 且 `st==='charge'` 單位：衝鋒揚塵（地面拖塵）+ 接觸瞬間火花/塵爆（複用 melee combatBurst）。強度吃 Task 4.2 `chargeIntensity`。
- [ ] **Step 2:** `node --check`。Commit `feat(austerlitz): Phase 5 騎兵衝擊 FX`。

---

## Phase 6：天氣（奧斯特利茨的太陽）+ 招牌場面

### Task 6.1：朝霧 → 9 點放晴（同步中央突破）

**Files:**
- Read first: `src/engine/weather.js`、`data/austerlitz/weather.js`
- Modify: `data/austerlitz/weather.js`

- [ ] **Step 1:** 確認 weather.js 依 `SEKI.weather` 的霧/光照時間曲線運作（關原朝霧→放晴既有）。設定 austerlitz weather：開場濃霧（高 fog density）→ 中央突破時點（t≈9 對應上午9點）霧快速消散、陽光增強（「奧斯特利茨的太陽」）。
- [ ] **Step 2:** 收尾（t 末段午後4:30）可選飄雪 FX（複用 thermopylae-main 的 rain 粒子改白色雪片、低速）。
- [ ] **Step 3:** `node --check`。Commit `feat(austerlitz): Phase 6 奧斯特利茨的太陽 霧→晴`。

---

## Phase 7：運鏡 + 事件 + 史料

### Task 7.1：`data/austerlitz/storyboard.js`（謀略主線運鏡）

**Files:**
- Read first: `src/engine/storyboard.js`、`data/thermopylae/storyboard.js`
- Modify: `data/austerlitz/storyboard.js`

- [ ] **Step 1:** 鏡頭序列扣主線：① 全景拉開「陷阱」佈局 → ② 推鏡法軍故意空出的普拉欽中央 → ③ 跟拍聯軍南調咬餌 → ④ **霧散瞬間推近**蘇爾特衝上高地（子彈時間 `cinemaScale`）→ ⑤ 環繞騎兵對衝 → ⑥ 俯瞰冰湖砲擊潰敗 → ⑦ 雪中收尾。沿用 `orbit/push/fov` + `boundedOrbit`。
- [ ] **Step 2:** `node --check`。Commit `feat(austerlitz): Phase 7 謀略主線運鏡`。

### Task 7.2：`data/austerlitz/events.js`（主線事件節點）

**Files:**
- Read first: `data/thermopylae/events.js`
- Modify: `data/austerlitz/events.js`

- [ ] **Step 1:** 事件節點扣設計文件 §7：放棄普拉欽（設餌）/聯軍南調（咬餌）/6:00 霧中開戰/南線塔爾尼茲反覆易手/北線桑頓山/9:00 太陽破雲+中央突破/11:30 控制高地/近衛軍反攻+騎兵對衝/14:00 切斷聯軍+聖海拉爾南下/冰湖砲擊/普雷斯堡和約。每筆 `{t, ...}` 比照 thermopylae events 格式。
- [ ] **Step 2:** `node --check`。Commit `feat(austerlitz): Phase 7 事件節點`。

### Task 7.3：`data/austerlitz/sources.js`（冰湖迷思 + 兵力/傷亡）

**Files:**
- Read first: `data/thermopylae/sources.js`
- Modify: `data/austerlitz/sources.js`

- [ ] **Step 1:** caveats：① 冰湖傷亡爭議（拿破崙宣稱數千 vs 羅斯考證僅撈 2–3 具 + ~150 馬，湖三日後乾涸）；② 兵力區間（法 65k–75k／聯 84k–95k）；③ 傷亡數字（法 ~8,500／聯 27,000–36,000）；④ 三皇會戰典故。比照 thermopylae sources 格式。
- [ ] **Step 2:** `node --check`。Commit `feat(austerlitz): Phase 7 史料 + 冰湖破除迷思`。

### Task 7.4：`data/austerlitz/engagements.js`（交戰配對）

**Files:**
- Read first: `data/thermopylae/engagements.js`
- Modify: `data/austerlitz/engagements.js`

- [ ] **Step 1:** 定義 `{a,b,from,to}` 交戰配對（供 FX 對齊真實目標 + 拉鋸）：南線達武 vs 多克托洛夫/朗熱隆、北線拉納/繆拉 vs 巴格拉季昂/列支敦斯登、中央蘇爾特 vs 第四縱隊、近衛軍對衝（貝西埃爾 vs 康斯坦丁）。
- [ ] **Step 2:** `node --check`。Commit `feat(austerlitz): Phase 7 交戰配對`。

---

## Phase 8：Chrome 實機視覺驗證 + 迭代

### Task 8.1：前置 — 確認 DEM/衛星圖就緒

- [ ] **Step 1:** 確認 `data/austerlitz/heightmap.js` 已是真實希臘…（誤）→ 真實 **摩拉維亞** 高程（非 placeholder），且 `assets/terrain/austerlitz-sat.jpg` 存在。若使用者尚未跑，提示執行 `python3 fetch_dem_austerlitz.py` 與 `fetch_sat_austerlitz.py`。
  Run: `head -c 120 data/austerlitz/heightmap.js; ls -la assets/terrain/austerlitz-sat.jpg`

### Task 8.2：開 Chrome 逐項視覺驗證

- [ ] **Step 1:** 用 claude-in-chrome 載入 `austerlitz.html`（本機檔或起 `python3 -m http.server`）。逐項截圖驗證並記錄問題：
  1. 地形是否貼合（普拉欽高地/桑頓山/扎錢湖可辨）、衛星圖是否套上。
  2. 軍服配色：法軍藍、俄綠、奧白，一眼分敵我。
  3. 部隊行軍走位：法軍自西、聯軍自東南調咬餌，普拉欽中央先空後被法軍佔。
  4. 線列/縱隊/方陣切換是否隨 st 改變形態。
  5. 排槍火光一排排錯落、砲兵齊射砲煙。
  6. 騎兵衝鋒加速 + 接觸塵爆。
  7. 9 點霧散「太陽」與中央突破同步。
  8. 冰湖砲擊裂紋結局。
  9. 運鏡主線是否講清「陷阱」。
  10. UI 兵力儀表/點選卡片/史料 caveat 正常。
- [ ] **Step 2:** 依截圖逐項微調係數（exag/比例/色/走位時間/FX 密度），每修一項 `node --check` + 重載驗證 + commit。**循環直到完整需求被處理完**（使用者指示）。

### Task 8.3：收尾

- [ ] **Step 1:** 全頁 `node --check` 掃描所有 austerlitz 相關 JS。
- [ ] **Step 2:** 更新 `README.md` / 記憶（新增奧斯特利茨頁條目）。
- [ ] **Step 3:** 視使用者指示決定是否合併 main（部署只在 push main 觸發；完工到可呈現再合併）。

---

## Self-Review（對照 spec §1–§11）

- §1 敘事主線 A → Phase 3 走位 + Phase 7 運鏡/事件 ✅
- §2 架構（新頁/main/data/三模組/五頁切換）→ Phase 0 ✅
- §3 移動 approach ①（t 純函數）→ 沿用 sampleTrack + Phase 4 maneuver ✅
- §4 四機制（騎兵衝鋒/排槍/砲兵/方陣）→ Phase 4（charge/square）+ Phase 5（排槍/砲/衝擊）✅
- §5 編成 15 單位 + 單兵精細 + 史實配色 → Phase 2（幾何）+ Phase 3（armies）✅
- §6 地形/天氣（DEM/衛星/冰湖/太陽）→ Phase 1 + Phase 6 ✅
- §7 時間軸/事件/運鏡 → Phase 7 ✅
- §8 史料破除迷思 → Phase 7.3 ✅
- §9 Phase 規劃 → 本計畫 Phase 0–8 對應 ✅
- §10 驗證（node --check + Chrome）→ 各 Phase 閘門 + Phase 8 ✅
- §11 決策清單 → 全數落入對應 Phase ✅

**No-placeholder / type 一致性檢查：**
- `formationStyle:'napoleonic'`（config）↔ formation.js 分支字串一致。
- `S.buildNapoleonicGeo(variant,opts)`（Task 2.1 定義）↔ formation.js 呼叫（Task 2.3）一致。
- `formMode`（'line'|'column'|'square'|'charge'|'rout'）：maneuver.js 設定（4.1）↔ formation.js 讀取（4.1 Step2）一致；`S.setFormMode(unitId,mode)` 為兩者介面。
- `S.initVolley/updateVolley`、`S.initManeuver/updateManeuver`：stub（0.5）↔ main 串接（0.3）↔ 實作（4/5）名稱一致。
- 既有 `st` 值集 `hold/march/attack/rout/breakthrough` 之外新增 `charge/square`：需確認 units.js `ST_LABEL` 與 `firePoints`/箭頭顯示對新 st 的處理 → Task 4.1 補 `ST_LABEL.charge='衝鋒'`、`ST_LABEL.square='方陣'`，並讓 `firePoints`/箭頭把 `charge` 視同移動（Task 4.1 Step1 一併處理）。
