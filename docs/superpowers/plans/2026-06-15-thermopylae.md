# 溫泉關之戰（480 BC）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在既有 Three.js 多戰役節目新增第四場「溫泉關之戰」獨立頁，希臘全精細 hoplite 個體 + 近戰系統 + 子彈時間電影化運鏡，史觀走「戰略全局視角 + 破除 300 迷思 + 數字爭議並陳」。

**Architecture:** 共用 `src/engine/*`、`lib/*` 不分叉；戰役差異全走向後相容的全域 `SEKI.config` 注入。新增模組 `hoplite.js`（hoplite 幾何/方陣/動畫）、`melee.js`（接戰帶/對決/堆屍/近戰FX/子彈時間焦點）；擴充 `effects.js`（melee FX + 箭雨）、`storyboard.js`（orbit/push/fov + cinemaScale）、`formation.js`（phalanx 分支）、`terrain.js`（ancientCoast）、`crest.js`/`labels.js`/`ui.js`/`models.js`。資料層 `data/thermopylae/*.js`。前三場不設新 config → 零回歸。

**Tech Stack:** Three.js r128 UMD（全域 THREE/SEKI、免 build）、InstancedMesh、CSS2DRenderer、SRTM 30m DEM（Python fetch）。**無測試框架**：每步以 `node --check <file>` 驗語法、瀏覽器載入截圖驗視覺、頻繁 commit。

**驗證慣例（取代 TDD）：**
- 語法：`node --check path/to/file.js`（純資料/邏輯檔）；HTML 用瀏覽器載入。
- 視覺：以 claude-in-chrome 開 `http://localhost:PORT/thermopylae.html` 截圖，比對該任務「驗收畫面」。
- **禁止**：派 subagent 時必在 prompt 明令禁止 git；部署只在 push `main` 觸發。

---

## File Structure

| 檔案 | 責任 |
|---|---|
| `thermopylae.html` | 頁面骨架、樣式、四頁切換 nav、script 載入順序、`SEKI.config` 前置 |
| `src/thermopylae-main.js` | boot 前定義 `SEKI.config`；主迴圈接 `cinemaScale` 餵 `updateMelee/updateEffects` |
| `src/engine/hoplite.js` | `buildHopliteGeo(variant)`、盾牆方陣排列、刺擊/架盾/倒地動畫 |
| `src/engine/melee.js` | 接戰帶 band、微觀對決、倒地堆屍、近戰FX 排程、子彈時間焦點 |
| `data/thermopylae/geography.js` | bbox/中心/投影參數 |
| `data/thermopylae/heightmap.js` | DEM 高程陣列（fetch 產出） |
| `data/thermopylae/armies.js` | 雙方單位（希臘逐邦 + 波斯分波）含 `faction` |
| `data/thermopylae/storyboard.js` | 鏡位序列 + cinemaScale 節拍 + orbit/push 影格 |
| `data/thermopylae/sources.js` | 史料 caveats（⚠️ 爭議點） |
| `data/thermopylae/engagements.js` | 交戰對（驅動 band） |
| `data/thermopylae/events.js` | 50 事件節點 |
| `data/thermopylae/weather.js` | 晴/塵（無雨，輕量） |
| `fetch_dem_thermopylae.py` | SRTM DEM 下載 → heightmap.js |

各引擎檔以「新增分支/config 覆寫」方式擴充，列於各 Task。

---

## Phase 0：頁面骨架 + 四頁切換鈕（先求能跑、能切）

### Task 0.1：四頁切換 nav 加溫泉關鈕（年代排序首位）

**Files:** Modify `index.html`、`okehazama.html`、`normandy.html`（各 nav 區塊）；新頁 nav 於 Task 0.2。

- [ ] **Step 1**：三頁 `#campaign-switch` 內，於第一個 `.cs-item` 前插入
  `<a class="cs-item" href="thermopylae.html">溫泉關之戰<small>-480</small></a>`
- [ ] **Step 2**：`node --check` 不適用 HTML；改用 `grep -c 'thermopylae.html' index.html okehazama.html normandy.html` 確認各為 1。
- [ ] **Step 3**：Commit `feat(nav): 三頁加溫泉關切換鈕`。

### Task 0.2：thermopylae.html 骨架

**Files:** Create `thermopylae.html`（複製 okehazama.html 為範本，改 title/nav/config/script 路徑）。

- [ ] **Step 1**：nav 四鈕，溫泉關為 `active` span、其餘為 `<a>`，順序 溫泉關→桶狹間→關原→諾曼第。
- [ ] **Step 2**：script 載入 `data/thermopylae/*`、`src/engine/*`（含新 `hoplite.js`、`melee.js`，置 effects.js 後、ui.js 前）、`src/thermopylae-main.js`。
- [ ] **Step 3**：標題卡/字幕文案改溫泉關。瀏覽器載入應**不報缺檔錯誤**（data/main 先用 Task 0.3 stub）。
- [ ] **Step 4**：Commit `feat(thermopylae): 頁面骨架 + 四頁切換`。

### Task 0.3：config + main 骨架 + data stubs

**Files:** Create `src/thermopylae-main.js`、`data/thermopylae/{geography,heightmap,armies,weather,storyboard,sources,engagements,events}.js`（最小可載入 stub）。

- [ ] **Step 1**：`thermopylae-main.js` 在 boot 前設 `SEKI.config`：`sideName`（希臘聯軍/波斯帝國）、`sideShort`、`fmtTime`（希臘曆日/晨午夜）、`exag:2.8`、`elevStops`、`satelliteTexture:null`、`formationStyle:'phalanx'`、`ancientCoast`、`factionColors`、`timelineAnchors`、`T_START/T_END`（三日）。
- [ ] **Step 2**：各 data stub 用既有 schema 最小值（armies 先放 2~3 單位、events 先空陣列或前數筆）。
- [ ] **Step 3**：`for f in data/thermopylae/*.js src/thermopylae-main.js; do node --check $f; done` 全 PASS。
- [ ] **Step 4**：瀏覽器載入 thermopylae.html：地形（暫用 stub heightmap）+ 少量單位渲染、console 零錯誤。
- [ ] **Step 5**：Commit `feat(thermopylae): config + main 骨架 + data stub`。

---

## Phase 1：地圖（M1）

### Task 1.1：DEM 下載腳本 + 古海岸線

**Files:** Create `fetch_dem_thermopylae.py`（仿 `fetch_dem_okehazama.py`）；產出 `data/thermopylae/heightmap.js`。

- [ ] **Step 1**：bbox 經 22.45~22.65 / 緯 38.75~38.86，SRTM 30m；外海/低沖積平原值夾 0。
- [ ] **Step 2**：執行腳本產 heightmap.js（**若無網路**：先以程序化窄道高程 stub 產出，標 TODO 待真實 DEM；log 揭露）。
- [ ] **Step 3**：`node --check data/thermopylae/heightmap.js`。
- [ ] **Step 4**：`terrain.js` 用 config `ancientCoast`（抬高海平面門檻 + 古海岸著色）；確認 `exag/elevStops/satelliteTexture:null` 生效。
- [ ] **Step 5**：瀏覽器：**峽谷窄道成形**（一側海藍、一側陡崖卡利德羅莫山）。
- [ ] **Step 6**：Commit `feat(thermopylae): 真實DEM + 古海岸線窄道地形`。

---

## Phase 2：hoplite 個體系統（M2）

### Task 2.1：hoplite.js 幾何（spartan/ally/persian variant）

**Files:** Create `src/engine/hoplite.js`。

- [ ] **Step 1**：`SEKI.buildHopliteGeo(variant)` 合併 box：圓盾 Aspis（薄圓柱）、長矛 Dory（細長 box + 尾鐏）、科林斯盔 + 鼻護 + 馬鬃冠、胸甲、脛甲 + 裸腿、披風（背後薄片）。波斯 variant 改柳條方盾 + 短矛/弓 + 布帽 + 長袍。約 150~250 面。
- [ ] **Step 2**：`node --check src/engine/hoplite.js`。
- [ ] **Step 3**：`formation.js` 加 `config.formationStyle==='phalanx'` 分支：8 列縱深、盾牆重疊、矛架前排肩上。
- [ ] **Step 4**：armies.js 放 1 個斯巴達方陣（小量）驗證；瀏覽器：**看得到圓盾Λ/矛林/盔冠的方陣**。
- [ ] **Step 5**：Commit `feat(thermopylae): hoplite 個體幾何 + 盾牆方陣`。

### Task 2.2：個體差異 + 英雄層

**Files:** Modify `src/engine/hoplite.js`、`src/engine/models.js`（`hero-hoplite` kind）、`src/engine/crest.js`（Λ/各邦盾徽/波斯紋）。

- [ ] **Step 1**：per-instance `sin(index)` 雜湊微調矛角/盾高/步距/披風明度±8%。
- [ ] **Step 2**：`models.js` 加 `hero-hoplite`（列奧尼達，橫向盔冠、可單獨擺姿/倒地）。
- [ ] **Step 3**：`crest.js` 程序化 Λ、科林斯飛馬、底比斯棍棒、波斯翼日。
- [ ] **Step 4**：瀏覽器：方陣**近看每人略異**、列奧尼達橫冠可辨。
- [ ] **Step 5**：Commit `feat(thermopylae): 個體差異 + 列奧尼達英雄 + 各邦盾徽`。

---

## Phase 3：逐邦配色 + 波斯人海 LOD（M3）

### Task 3.1：factionColors 配色

**Files:** Modify `src/thermopylae-main.js`（`config.factionColors`）、`src/engine/hoplite.js`/`units.js`（披風/盾徽/名牌/箭頭取 faction 色）、`data/thermopylae/armies.js`（每單位加 `faction`）。

- [ ] **Step 1**：定義暖色系（斯巴達緋紅…）/冷色系（波斯靛/不死軍金紋藍…）色表。
- [ ] **Step 2**：渲染處依 `unit.faction` 取色；side（east/west）仍供陣亡條/拉鋸彙總。
- [ ] **Step 3**：瀏覽器：**暖=希臘、冷=波斯**，各邦色不同。
- [ ] **Step 4**：Commit `feat(thermopylae): 逐邦色系分群配色`。

### Task 3.2：波斯分層 LOD 人海

**Files:** Modify `src/engine/hoplite.js`/`formation.js`（人海層低面數 InstancedMesh + 遠景剪影）。

- [ ] **Step 1**：波斯 armies 大數量單位用「人海層」geo；遠景用極簡 box/billboard。
- [ ] **Step 2**：兵力儀表顯示**真實史實數字**，渲染降級不改數字。
- [ ] **Step 3**：瀏覽器 + FPS 觀察：人海規模感成立、不掉幀（必要時調人海層面數/數量上限並 `log`）。
- [ ] **Step 4**：Commit `feat(thermopylae): 波斯分層LOD人海`。

---

## Phase 4：近戰系統（M4）

### Task 4.1：melee.js 接戰帶 + 倒地堆屍

**Files:** Create `src/engine/melee.js`；Modify `data/thermopylae/engagements.js`。

- [ ] **Step 1**：`S.initMelee()/updateMelee(dt)` 由 engagements 建 band（center/dir/frontage/tau/heave/intensity），tau 吃 `engage.js`。
- [ ] **Step 2**：陣亡 tick → 接觸線士兵 `falling`（0.6s rotX→90°）落定靜態屍體；累積屍堆綁 `sideCasualties`；`config.corpseCap` 上限逾則最舊下沉 + `log`。
- [ ] **Step 3**：`node --check src/engine/melee.js`。
- [ ] **Step 4**：瀏覽器：接觸線**推擠拉鋸 + 屍堆漸長**。
- [ ] **Step 5**：Commit `feat(thermopylae): 近戰接戰帶 + 倒地堆屍`。

### Task 4.2：前排動畫 + 微觀對決 + 近戰FX + 箭雨

**Files:** Modify `src/engine/hoplite.js`（刺擊/架盾動畫）、`src/engine/melee.js`（對決狀態機）、`src/engine/effects.js`（`kind='melee'` clashSpark/dustKick/bloodPuff/weaponGlint + 箭雨拋物線）。

- [ ] **Step 1**：前 `meleeDepth`(2) 排刺擊循環（錯相）+ 架盾；後排 idle。
- [ ] **Step 2**：微觀對決 `lunge→clash→resolve`，並發 ≤40（視錐內），勝負由 tau 加權。
- [ ] **Step 3**：effects.js melee 粒子 + 箭雨（重用彈道弧線）；`config.goreLevel` 控血量。
- [ ] **Step 4**：瀏覽器：**前排刺擊、火花塵土、箭雨**。
- [ ] **Step 5**：Commit `feat(thermopylae): 前排動畫+微觀對決+近戰FX+箭雨`。

---

## Phase 5：電影化運鏡 + 子彈時間（M5）

### Task 5.1：storyboard orbit/push/fov + cinemaScale

**Files:** Modify `src/engine/storyboard.js`、`src/thermopylae-main.js`（主迴圈 `dt*cinemaScale`）、`data/thermopylae/storyboard.js`（鏡位 + 節拍）。

- [ ] **Step 1**：storyboard 影格加 `orbit`（繞焦點 θ 掃 + 半徑）/`push`（dolly）/`fov`，緩動插值；`cinemaScale` 曲線。
- [ ] **Step 2**：main 迴圈 `updateMelee(dt*cinemaScale)`、`updateEffects(dt*cinemaScale)`、hoplite 動畫同享；歷史 t 進 hold。
- [ ] **Step 3**：5 個慢動作節拍（事件17/40/41/42/46）綁焦點（melee.js 暴露列奧尼達/band/奪屍點/小丘）。
- [ ] **Step 4**：瀏覽器：列奧尼達戰死**子彈時間環繞 + 推近**。
- [ ] **Step 5**：Commit `feat(thermopylae): 電影化運鏡 + 子彈時間`。

---

## Phase 6：資料 / 三日分鏡（M6）

### Task 6.1：armies + engagements + storyboard 三日序列

**Files:** Modify `data/thermopylae/{armies,engagements,storyboard,weather}.js`。

- [ ] **Step 1**：希臘逐邦（298斯巴達+700賽斯比+400底比斯+佛西斯1000守山徑+其餘）、波斯分波（米底/不死軍/弓兵/薛西斯本陣）。
- [ ] **Step 2**：三日 track：第一/二日正面拉鋸 → 第三日山徑迂迴 + 遣散 + 殿後 set-piece（假退/推落海/矛斷/奪屍/科洛諾斯）。
- [ ] **Step 3**：`node --check` 全 PASS；瀏覽器跑完整時間軸。
- [ ] **Step 4**：Commit `feat(thermopylae): 三日分鏡 + 背叛迂迴 + 殿後死戰`。

### Task 6.2：50 事件 + 非線性時間軸

**Files:** Modify `data/thermopylae/events.js`、`src/thermopylae-main.js`（`timelineAnchors`）。

- [ ] **Step 1**：填入 spec §2.1 的 50 事件（t 對映三日）。
- [ ] **Step 2**：`timelineAnchors` 壓縮夜間、拉寬三場接戰、第三日最寬。
- [ ] **Step 3**：瀏覽器：事件字幕依序、時間軸刻度非線性。
- [ ] **Step 4**：Commit `feat(thermopylae): 50事件 + 非線性三日時間軸`。

---

## Phase 7：UI / 史料（M7）

### Task 7.1：雙數字並陳 + 史料面板 + labels

**Files:** Modify `src/engine/ui.js`（兵力雙數字）、`data/thermopylae/sources.js`、`src/engine/labels.js`（pass/wall/mountain-path/monument）。

- [ ] **Step 1**：兵力儀表波斯並陳「現代估計 ~15萬 ‖ 希羅多德 170萬」；希臘逐邦可展開。
- [ ] **Step 2**：sources caveats：300 迷思、百萬誇大、Molon labe/底比斯投降/梟首爭議、戰略價值。
- [ ] **Step 3**：labels 新增地標型別 + 獅碑/福基斯牆/安諾派亞山徑/中門標記。
- [ ] **Step 4**：瀏覽器：兵力雙數字、史料面板、地標到位。
- [ ] **Step 5**：Commit `feat(thermopylae): 雙數字並陳 + 史料面板 + 地標`。

---

## Phase 8：收尾

### Task 8.1：尾聲全局地圖 + 獅碑銘文 + 實測微調

**Files:** Modify `data/thermopylae/storyboard.js`、`src/engine/labels.js`、視覺微調各檔。

- [ ] **Step 1**：尾聲鏡頭拉到全希臘示意 → 薩拉米斯 → 普拉提亞；獅碑 + 西莫尼德斯銘文字幕。
- [ ] **Step 2**：列奧尼達英雄層死亡動畫精修。
- [ ] **Step 3**：瀏覽器完整走查、FPS/比例/座標微調。
- [ ] **Step 4**：Commit `feat(thermopylae): 尾聲全局 + 獅碑銘文 + 收尾微調`。

---

## 部署

- [ ] 全部完成、瀏覽器實測通過後，**合併 `feature/thermopylae-480bc` → `main` 並 push**（部署只在 push main 觸發）。切換列四頁鈕在線上互通。
