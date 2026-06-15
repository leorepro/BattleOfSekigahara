# 諾曼第·奧馬哈海灘 實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development 或 superpowers:executing-plans 逐任務實作。步驟用 checkbox（`- [ ]`）追蹤。

**Goal:** 在既有 3D 歷史節目專案新增第三場戰役「諾曼第登陸·奧馬哈海灘(1944/6/6)」，引入海軍艦艇/空中兵力/高射砲/岸防/登陸艇/搶灘步兵等現代軍種與戰鬥動畫，並在三頁加入年代排序的切換鈕。

**Architecture:** 共用 `src/engine/*`、`lib/*` 不分叉；戰役差異以向後相容的全域 `SEKI.config` 注入。新增 `config.modern` 旗標啟用「現代單位 3D 模型」渲染路徑與現代戰鬥特效；前兩場無此旗標 → 行為完全不變。新頁 `normandy.html` + `data/normandy/*.js` + `src/normandy-main.js`，沿用桶狹間頁面範式。

**Tech Stack:** Three.js r128 UMD（全域 THREE）、CSS2DRenderer、OrbitControls、程序化 Canvas/Geometry、Python(opentopodata + EOX WMS) 抓地圖。

**驗證方式（本專案無單元測試框架，沿用既有實務）：** ① `node --check` 語法檢查每個 JS；② 本機 http server + claude-in-chrome 開頁面，讀 console 確認零錯誤、截圖視覺確認；③ 開關原/桶狹間兩頁做回歸煙霧測試（確認 config 改動無回歸）。每個任務結束 commit。

---

## 檔案結構

**新增：**
- `fetch_dem_normandy.py` — 抓 Omaha bbox SRTM 30m → `data/normandy/heightmap.js`
- `fetch_sat_normandy.py` — 抓 EOX Sentinel-2 → `assets/terrain/normandy-sat.jpg`
- `src/engine/models.js` — 現代單位程序化 low-poly 模型工廠 `SEKI.buildUnitMesh()`
- `src/normandy-main.js` — 戰役 config + 海空煙幕系統 + 主迴圈
- `normandy.html` — 頁面
- `data/normandy/{geography,heightmap,armies,weather,storyboard,sources,engagements,events}.js`

**修改：**
- `src/engine/units.js` — `buildUnits` 依 `config.modern` 走模型路徑；淡化改用 `u.fadeMats`；`KICON` 可由 config 覆寫
- `src/engine/effects.js` — 擴充現代兵種戰鬥特效（艦砲/曳光/防空/投彈/戰車/水花）
- `src/engine/labels.js` — 新增 `bunker`/`naval`/`beach` 地標 ICON（純新增）
- `index.html`、`okehazama.html` — 切換列改三顆鈕（年代排序）

---

## Task 1：地圖資料下載（耗時前置，先啟動）

**Files:** Create `fetch_dem_normandy.py`, `fetch_sat_normandy.py`；產出 `data/normandy/heightmap.js`, `assets/terrain/normandy-sat.jpg`

- [ ] **Step 1: 寫 `fetch_dem_normandy.py`**（複製 `fetch_dem_okehazama.py` 改 bbox/輸出路徑/網格）

```python
#!/usr/bin/env python3
"""抓取諾曼第奧馬哈海灘一帶 SRTM 30m 高程 → data/normandy/heightmap.js
bbox：北為英吉利海峽外海(艦隊區)、中為海灘、南為崖頂與內陸；西端含 Pointe du Hoc。
海面 SRTM 回傳 0/負值 → 夾到 0 作海面。"""
import json, time, urllib.request, urllib.parse, sys, os
LNG_MIN, LNG_MAX = -1.010, -0.740     # 西:Pointe du Hoc  東:Colleville 以東
LAT_MIN, LAT_MAX = 49.320, 49.460     # 南:內陸村落       北:外海艦隊區
COLS, ROWS = 161, 141
API = "https://api.opentopodata.org/v1/srtm30m"
pts = []
for r in range(ROWS):
    lat = LAT_MIN + (LAT_MAX - LAT_MIN) * r / (ROWS - 1)
    for c in range(COLS):
        lng = LNG_MIN + (LNG_MAX - LNG_MIN) * c / (COLS - 1)
        pts.append((lat, lng))
elev = [None] * len(pts); CHUNK = 100; i = 0
while i < len(pts):
    chunk = pts[i:i+CHUNK]
    locs = "|".join(f"{la:.5f},{ln:.5f}" for la, ln in chunk)
    url = f"{API}?locations={urllib.parse.quote(locs)}"
    for attempt in range(4):
        try:
            with urllib.request.urlopen(url, timeout=30) as resp:
                data = json.load(resp)
            if data.get("status") == "OK":
                for j, res in enumerate(data["results"]):
                    e = res.get("elevation"); elev[i+j] = float(e) if e is not None else 0.0
                break
            else: print("status:", data.get("status"), file=sys.stderr); time.sleep(2)
        except Exception as ex:
            print(f"chunk {i} attempt {attempt}: {ex}", file=sys.stderr); time.sleep(2)
    print(f"  {min(i+CHUNK,len(pts))}/{len(pts)}", flush=True); i += CHUNK; time.sleep(1.2)
for k in range(len(elev)):
    elev[k] = 0.0 if (elev[k] is None or elev[k] < 0) else elev[k]
out = {"lngMin":LNG_MIN,"lngMax":LNG_MAX,"latMin":LAT_MIN,"latMax":LAT_MAX,
       "cols":COLS,"rows":ROWS,"data":[round(e,1) for e in elev]}
os.makedirs("data/normandy", exist_ok=True)
with open("data/normandy/heightmap.js","w") as f:
    f.write("window.SEKI=window.SEKI||{};\nSEKI.heightmap="+json.dumps(out)+";\n")
print("wrote data/normandy/heightmap.js")
```

- [ ] **Step 2: 確認 heightmap.js 的全域變數名稱與既有一致**

Run: `head -3 data/okehazama/heightmap.js`
Expected: 確認賦值給 `SEKI.heightmap`（若既有用不同名稱，比照修正 Step 1 的寫檔行）。

- [ ] **Step 3: 背景執行 DEM 下載（約 4–5 分鐘）**

Run: `python3 fetch_dem_normandy.py`（建議 run_in_background）
Expected: 進度列跑到 `22701/22701`，最後印 `wrote data/normandy/heightmap.js`。

- [ ] **Step 4: 寫 `fetch_sat_normandy.py`**（比照 `fetch_sat_okehazama.py`，bbox 對齊 Step 1，輸出 `assets/terrain/normandy-sat.jpg`）。先 `cat fetch_sat_okehazama.py` 取得 WMS 參數範式，只改 BBOX 與輸出檔名。

- [ ] **Step 5: 執行衛星影像下載**

Run: `python3 fetch_sat_normandy.py`
Expected: 產出 `assets/terrain/normandy-sat.jpg`（檔案 > 50KB）。若 EOX WMS 失敗，config 可暫設 `satelliteTexture: null` 走純海拔著色，不阻塞後續。

- [ ] **Step 6: Commit**

```bash
git add fetch_dem_normandy.py fetch_sat_normandy.py data/normandy/heightmap.js assets/terrain/normandy-sat.jpg
git commit -m "feat(normandy): 下載奧馬哈海灘 DEM 高程 + 衛星影像"
```

---

## Task 2：現代單位模型工廠 `src/engine/models.js`

**Files:** Create `src/engine/models.js`

提供 `SEKI.buildUnitMesh(kind, side, color)` 回傳 `THREE.Group`（朝 +X 為前方，與 arrow 一致；地面單位底部 y=0）。風格 low-poly、面數少、用 `MeshStandardMaterial`。盟軍(藍)艦船灰藍、德軍(紅)工事暗紅灰。

- [ ] **Step 1: 建立模組骨架與共用工具**

```javascript
/* =========================================================================
 * src/engine/models.js — 現代單位程序化 low-poly 模型工廠（諾曼第用）
 *   SEKI.buildUnitMesh(kind, side, color) → THREE.Group（+X 為前方）
 *   僅在 SEKI.config.modern 為真時由 units.js 呼叫；前兩場戰役不載入此模組。
 * ======================================================================= */
window.SEKI = window.SEKI || {};
(function (S) {
  function mat(hex, rough) { return new THREE.MeshStandardMaterial({ color: hex, roughness: rough==null?0.7:rough, metalness: 0.1 }); }
  function box(w,h,d,m){ const g=new THREE.Mesh(new THREE.BoxGeometry(w,h,d), m); g.castShadow=true; return g; }
  const STEEL=0x5a6470, DKSTEEL=0x3c444e, HULL_ALLY=0x4b5a6e, CONCRETE=0x6b6356, RUST=0x7a3b30, KHAKI=0x6e6a44, BLACK=0x222428;

  function warship(side,color){
    const g=new THREE.Group();
    const hull=box(26,3,6,mat(HULL_ALLY,0.6)); hull.position.y=1.5; g.add(hull);     // 艦體
    const deck=box(20,1,5,mat(STEEL,0.6)); deck.position.y=3.4; g.add(deck);
    const bridge=box(4,3,3.4,mat(STEEL,0.55)); bridge.position.set(-1,5,0); g.add(bridge);
    const funnel=box(1.6,3,1.6,mat(DKSTEEL,0.5)); funnel.position.set(-5,5.5,0); g.add(funnel);
    for(const x of [6,9.5]){ const t=box(3,1,2,mat(STEEL,0.5)); t.position.set(x,4.2,0); g.add(t);  // 主砲塔
      const bl=new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.35,4,8),mat(DKSTEEL,0.5));
      bl.rotation.z=Math.PI/2; bl.position.set(x+2.5,4.4,0); g.add(bl); }
    g.userData.muzzles=[{x:8.5,y:4.4,z:0},{x:11.5,y:4.4,z:0}];                          // 砲口(供特效)
    return g;
  }
  function landingcraft(side,color){
    const g=new THREE.Group();
    const hull=box(5,1.6,2.6,mat(KHAKI,0.7)); hull.position.y=0.8; g.add(hull);
    const ramp=box(0.3,1.4,2.4,mat(DKSTEEL,0.6)); ramp.position.set(2.6,0.9,0); ramp.name='ramp'; g.add(ramp); // 前跳板
    const wall=box(4.6,0.6,0.2,mat(KHAKI,0.7)); wall.position.set(0,1.5,1.2); g.add(wall);
    const wall2=wall.clone(); wall2.position.z=-1.2; g.add(wall2);
    return g;
  }
  function aircraft(side,color){
    const g=new THREE.Group();
    const fus=new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,7,8),mat(side==='east'?0x556677:0x555a52,0.5));
    fus.rotation.z=Math.PI/2; g.add(fus);
    const wing=box(1.6,0.2,9,mat(side==='east'?0x44525f:0x4a4f47,0.5)); g.add(wing);
    const tail=box(1.2,1.4,0.2,mat(STEEL,0.5)); tail.position.set(-3,0.6,0); g.add(tail);
    g.scale.set(1.1,1.1,1.1);
    return g;
  }
  function armor(side,color){
    const g=new THREE.Group();
    const hull=box(5,1.4,2.6,mat(KHAKI,0.8)); hull.position.y=0.9; g.add(hull);
    const turret=box(2.4,1,2,mat(KHAKI,0.8)); turret.position.set(-0.2,2,0); g.add(turret);
    const barrel=new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.18,3,8),mat(DKSTEEL,0.6));
    barrel.rotation.z=Math.PI/2; barrel.position.set(2,2.1,0); g.add(barrel);
    g.userData.muzzles=[{x:3.4,y:2.1,z:0}];
    return g;
  }
  function bunker(side,color){
    const g=new THREE.Group();
    const base=box(4,2.4,4,mat(CONCRETE,0.95)); base.position.y=1.2; g.add(base);
    const slit=box(4.05,0.5,2.2,mat(BLACK,1)); slit.position.set(0,1.9,0); g.add(slit);  // 射口（朝 +X 灘頭）
    const top=box(4.4,0.4,4.4,mat(CONCRETE,0.95)); top.position.y=2.6; g.add(top);
    g.userData.muzzles=[{x:2.1,y:1.9,z:0}];                                              // MG 射口
    return g;
  }
  function flak(side,color){
    const g=new THREE.Group();
    const base=new THREE.Mesh(new THREE.CylinderGeometry(1.4,1.8,0.6,10),mat(CONCRETE,0.9));
    base.position.y=0.3; g.add(base);
    const mount=box(1,0.8,1,mat(DKSTEEL,0.6)); mount.position.y=0.9; g.add(mount);
    for(const dz of [-0.3,0.3]){ const bl=new THREE.Mesh(new THREE.CylinderGeometry(0.13,0.13,3.2,8),mat(BLACK,0.5));
      bl.position.set(0.4,1.6,dz); bl.rotation.z=-Math.PI/4; g.add(bl); }                // 仰角砲管
    g.userData.muzzles=[{x:1.6,y:2.6,z:0}]; g.userData.aa=true;
    return g;
  }
  function infantry(side,color){
    const g=new THREE.Group();                                                          // 小班：3 個矮人形 + 底環
    for(const dx of [-0.8,0,0.8]){ const b=box(0.5,1.4,0.5,mat(side==='east'?0x4d5a48:0x5b5340,0.9));
      b.position.set(dx,0.7,(Math.random()-0.5)); g.add(b);
      const h=box(0.4,0.4,0.4,mat(0xc9a98a,0.9)); h.position.set(dx,1.6,b.position.z); g.add(h); }
    return g;
  }

  const BUILDERS={ warship, landingcraft, aircraft, armor, bunker, flak, infantry };
  S.buildUnitMesh = function(kind, side, color){
    const f = BUILDERS[kind] || infantry;
    const g = f(side, color);
    // 收集所有材質供 units.js 統一淡化
    g.userData.fadeMats = [];
    g.traverse(o=>{ if(o.material) g.userData.fadeMats.push(o.material); o.material&&(o.material.transparent=true); });
    return g;
  };
})(window.SEKI);
```

- [ ] **Step 2: 語法檢查**

Run: `node --check src/engine/models.js`
Expected: 無輸出（通過）。

- [ ] **Step 3: Commit**

```bash
git add src/engine/models.js
git commit -m "feat(normandy): 現代單位 low-poly 模型工廠 models.js"
```

---

## Task 3：`units.js` 接上模型路徑 + 統一淡化

**Files:** Modify `src/engine/units.js`（`buildUnits` 約 95–155 行、`updateUnits` 透明度段、`waveFlags`）

- [ ] **Step 1: 在 `buildUnits` 內依 `S.config.modern` 分流**

把建立 pole+flag 的段落改為：modern 時用模型、否則原幟旗。於 `const group = new THREE.Group();` 之後插入分支；保留 ring/hit/tag/arrow 不變。模型路徑需提供相容欄位（`u.fadeMats`），幟旗路徑也補 `u.fadeMats=[fmat, pole.material]`。

```javascript
const MODERN = !!(S.config && S.config.modern);
let flag=null, fmat=null, pole=null, body=null, fadeMats=[];
if (MODERN && S.buildUnitMesh) {
  body = S.buildUnitMesh(a.kind, a.side, color);
  group.add(body);
  fadeMats = body.userData.fadeMats || [];
} else {
  pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.12,POLE_H,8),
    new THREE.MeshStandardMaterial({ color:0x241c12, roughness:0.85 }));
  pole.position.y = POLE_H/2; pole.castShadow = true; group.add(pole);
  const fgeo = new THREE.PlaneGeometry(FW,FH,14,2);
  fmat = new THREE.MeshStandardMaterial({ map:S.flagTexture(a.crest,a.side), side:THREE.DoubleSide, roughness:0.7, transparent:true });
  flag = new THREE.Mesh(fgeo, fmat); flag.castShadow = true;
  flag.position.set(FW/2+0.2, POLE_H-FH/2-0.5, 0);
  flag.userData.base = Float32Array.from(fgeo.attributes.position.array);
  group.add(flag);
  fadeMats = [fmat, pole.material];
}
```

- [ ] **Step 2: KICON 改為 config 可覆寫**

把硬編 `const KICON = {...}` 改為：

```javascript
const KICON = (S.config && S.config.kindIcons) || { command:'本', artillery:'砲', matchlock:'銃', cavalry:'騎', infantry:'槍' };
```

- [ ] **Step 3: `u` 物件補 `fadeMats`、`body`，移除對固定 flag/pole 的硬依賴**

```javascript
const u = { data:a, group, flag, fmat, ring, pole, hit, el, body, fadeMats,
  troopsEl: el.querySelector('.troops'), hpEl: el.querySelector('.hp i'),
  arrow, p: new THREE.Vector3() };
```

- [ ] **Step 4: `updateUnits` 透明度改走 `fadeMats`**

把原本對 `u.fmat.opacity` / `u.pole.material.opacity` 的兩行，改為：

```javascript
for (const m of u.fadeMats) { m.transparent = true; m.opacity = op * emph; }
```

並把後續任何 `u.fmat`/`u.flag`/`u._flagFlipped`（倒戈翻旗）相關段落用 `if (u.flag)` 包住（modern 無旗，諾曼第無倒戈）。

- [ ] **Step 5: `waveFlags` 守衛**

在 `waveFlags` 迴圈體對每個 unit 加 `if (!u.flag) continue;`（modern 單位無布面，不需飄動）。

- [ ] **Step 6: 語法檢查 + 關原回歸**

Run: `node --check src/engine/units.js`
Expected: 通過。隨後在 Task 9 開關原頁確認幟旗/倒戈/飄動如常。

- [ ] **Step 7: Commit**

```bash
git add src/engine/units.js
git commit -m "feat(normandy): units 支援 config.modern 模型路徑與統一淡化(向後相容)"
```

---

## Task 4：`effects.js` 現代戰鬥特效

**Files:** Modify `src/engine/effects.js`（新增函式 + 擴充 `updateEffects` 的 `switch(p.kind)`）

沿用既有 `fire`/`dust` 粒子池、`launchShell`(拋物砲彈)、`impactBurst`(著彈爆炸)、`sparks`。新增現代兵種行為，全部在 `S.updateEffects` 既有節流迴圈內依 `p.kind` 觸發。

- [ ] **Step 1: 新增現代特效函式（插在 `impactBurst` 之後）**

```javascript
// —— 現代戰鬥特效（諾曼第）——
// 曳光彈火網：自碉堡射口朝灘頭(+前方)掃出紅色曳光點
function mgTracer(x,y,z,fx,fz){
  for(let i=0;i<3;i++){ const d=4+Math.random()*10;
    fire.emit(x+fx*1.5, y+1.6, z+fz*1.5, { vx:fx*42+rnd(3), vy:rnd(1.2), vz:fz*42+rnd(3),
      life:0.28, size0:2.6, size1:1.4, r:1.0, g:0.5, b:0.18 }); }
}
// 對空高射砲：朝天發射 + 高空防空炸點(flak puff，黑灰煙球)
function flakBurst(x,y,z){
  sparks(x,y+2,z,3,0.6,4);
  const hx=x+rnd(10), hy=26+Math.random()*16, hz=z+rnd(10);
  for(let i=0;i<5;i++) dust.emit(hx+rnd(1),hy+rnd(1),hz+rnd(1),{ vx:rnd(0.6),vy:rnd(0.4),vz:rnd(0.6),g:0,
    life:0.7+Math.random()*0.4, size0:2, size1:8, r:0.28,g:0.28,b:0.3 });
  for(let i=0;i<3;i++) fire.emit(hx,hy,hz,{ vx:rnd(2),vy:rnd(2),vz:rnd(2), life:0.18, size0:7, size1:1, r:1,g:0.6,b:0.2 });
}
// 水花：砲彈落海濺起白色水柱（用於艦砲未命中/近灘）
function waterSplash(x,z){
  const y=0.4;
  for(let i=0;i<6;i++) dust.emit(x+rnd(1),y,z+rnd(1),{ vx:rnd(1.4),vy:4+Math.random()*4,vz:rnd(1.4),g:1.2,
    life:0.7+Math.random()*0.3, size0:2, size1:7, r:0.85,g:0.9,b:0.95 });
}
// 戰車/艦砲口閃光（短促亮閃 + 煙）
function muzzleFlash(x,y,z,fx,fz,power){
  sparks(x,y,z,5,0.8,power||6);
  dust.emit(x+fx,y,z+fz,{ vx:fx*3,vy:0.8,vz:fz*3,g:0.3, life:0.8, size0:2,size1:7, r:0.7,g:0.68,b:0.64 });
}
```

- [ ] **Step 2: 擴充 `updateEffects` 的 `switch (p.kind)` 加入現代兵種**

在既有 `switch` 內，於 `default` 之前加上 case（既有 artillery/cavalry/matchlock 保留供前兩場用）：

```javascript
case 'warship':
  if (Math.random() < 0.10) {                         // 艦砲齊射射向岸上(前方為灘頭/崖)
    const reach = 22 + Math.random()*16;
    const tx = p.x + fx*reach, tz = p.z + fz*reach;
    const ty = S.terrain ? S.terrain.heightAt(tx, tz) : p.y;
    muzzleFlash(p.x, p.y+4, p.z, fx, fz, 9);
    launchShell(p.x, p.y+4, p.z, tx, ty, tz);
  } break;
case 'bunker':
  if (Math.random() < 0.85) mgTracer(p.x, p.y, p.z, fx, fz); break;
case 'flak':
  if (Math.random() < 0.5) flakBurst(p.x, p.y, p.z); break;
case 'armor':
  if (Math.random() < 0.18) { const reach=8+Math.random()*8, tx=p.x+fx*reach, tz=p.z+fz*reach;
    const ty=S.terrain?S.terrain.heightAt(tx,tz):p.y; muzzleFlash(p.x,p.y+2,p.z,fx,fz,6); launchShell(p.x,p.y+2,p.z,tx,ty,tz); } break;
case 'landingcraft':
  if (Math.random() < 0.08) waterSplash(p.x+rnd(4), p.z+rnd(4)); break;
case 'aircraft':
  break;                                               // 飛機投彈由 main 的相位腳本驅動，避免每幀亂炸
```

- [ ] **Step 3: 語法檢查**

Run: `node --check src/engine/effects.js`
Expected: 通過。

- [ ] **Step 4: Commit**

```bash
git add src/engine/effects.js
git commit -m "feat(normandy): 現代戰鬥特效(艦砲/MG曳光/防空/戰車/水花)"
```

---

## Task 5：`labels.js` 新增地標型別

**Files:** Modify `src/engine/labels.js`（ICON 物件那行）

- [ ] **Step 1: 擴充 ICON（純新增，向後相容）**

把 `const ICON = { mountain:'▲', ... }` 加上：`bunker:'▣', naval:'⚓', beach:'⌣', draw:'⌇', town:'⌂'`（沿用既有風格符號；數值可調）。

- [ ] **Step 2: 語法檢查 + Commit**

Run: `node --check src/engine/labels.js`

```bash
git add src/engine/labels.js
git commit -m "feat(normandy): labels 新增 bunker/naval/beach/draw/town 地標型別"
```

---

## Task 6：`data/normandy/*.js` 資料層

**Files:** Create `data/normandy/{geography,armies,weather,storyboard,sources,engagements,events}.js`（`heightmap.js` 已於 Task 1 產出）

所有檔案 schema 對照 `data/okehazama/*.js`（先 `cat` 對應檔案取得確切欄位）。座標系：lng/lat 真實經緯度，落在 Task 1 bbox 內（lng -1.01~-0.74、lat 49.32~49.46）。北(高 lat)=外海，南(低 lat)=內陸。

- [ ] **Step 1: `geography.js`** — features 陣列，型別用 Task 5 新增者：
  - `beach`：Dog Green/White/Red、Easy Green/Red、Fox Green/Red（沿岸 lat≈49.37 一線，lng 由西 -0.90 到東 -0.83 排開）
  - `draw`：D-1 Vierville(-0.905)、D-3 Les Moulins(-0.875)、E-1 St-Laurent(-0.865)、E-3 Colleville(-0.845)
  - `bunker`：WN72/WN71(Vierville)、WN70、WN68、WN62/WN61(Colleville 上方，最致命)
  - `naval`：USS Texas 火力支援區(外海 lat≈49.43)、運輸艦錨地
  - `town`：Vierville-sur-Mer、Saint-Laurent-sur-Mer、Colleville-sur-Mer
  - 西端 `cliff`/`bunker`：Pointe du Hoc(-1.005, 49.397)
  - 每筆 `{ type, name_zh, name_ja(英/法原名), name_en, lng, lat }`（比照 okehazama geography 欄位；name_ja 槽放原文名）

- [ ] **Step 2: `armies.js`** — `SEKI.armies` ~18 單位，`{ id,name_zh,name_ja,name_en,side,kind,crest:null,title,troops,track:[{t,lng,lat,s,st}] }`。`crest` 對 modern 無用可設 `null`。t 為距 1944/6/6 00:00 小時數。代表性陣容：

  盟軍(east 藍)：
  - `usstexas`(warship) USS Texas 戰艦，外海定點 t5.5→18，st hold/attack
  - `destroyers`(warship) 驅逐艦群，t8.5 抵近至近岸(lat 49.40)直射
  - `rangers`(infantry) 2nd 遊騎兵營，Pointe du Hoc(-1.005)→崖頂
  - `co_a_116`(infantry) 116團A連 Dog Green，t6.5 登陸傷亡慘重
  - `inf_16th`(infantry) 16團 Easy Red/Fox Green，t6.5→崖頂
  - `lcvp_1`,`lcvp_2`(landingcraft) 登陸艇波，外海 t6.0→灘頭 t6.5→退回
  - `dd_741`(armor) 741戰車營 DD 戰車，多數沉沒(s 驟降)→少數上灘
  - `engineers`(infantry) 工兵爆破組，清灘障
  - `bombers`(aircraft) B-24 機群，t6.0 掠過(炸偏內陸)

  德軍(west 紅)：
  - `wn62`(bunker) 最致命據點(Colleville 上方)，hold→t11 壓制→t13 失守
  - `wn72`,`wn71`(bunker) Vierville 隘口，封鎖 D-1
  - `wn70`,`wn68`,`wn61`(bunker) 沿崖火力點
  - `flak_colleville`(flak) 崖頂高射砲對空
  - `inf_352`(infantry) 352師反擊預備隊，t9 自內陸前推
  - `mortar_352`(artillery) 迫擊砲(沿用 artillery 拋物砲彈)

  track 設計：盟軍由海(高 lat)向灘(lat≈49.375)再向崖頂(低 lat)推進；德軍據點原地 hold，兵力 s 隨戰局遞減、t13 後 rout。

- [ ] **Step 3: `weather.js`** — 比照 okehazama，D-Day 晨間陰天、低雲、海面湧浪；霧/煙設定供地形氛圍（實際海空煙幕粒子在 `normandy-main.js`）。

- [ ] **Step 4: `storyboard.js`** — `SEKI.storyboard` 鏡位序列（比照 okehazama 欄位 `{ t, name, ... }`）：①艦隊全景(t5.6) ②艦砲齊射(t5.9) ③登陸艇貼海面(t6.4) ④灘頭血戰俯瞰(t6.7) ⑤WN62 火力點(t7.5) ⑥驅逐艦抵近直射(t8.6) ⑦攀崖突破(t10) ⑧隘道打通(t12) ⑨灘頭鞏固全景(t16.5)。

- [ ] **Step 5: `sources.js`** — 史料清單 + 史觀註記：傷亡數字爭議(Omaha 約 2000–4700 說法不一)、空襲炸偏內陸、DD 戰車 29 輛投放 27 沉、352 師存在情報誤判、「Bloody Omaha」。比照 okehazama sources schema。

- [ ] **Step 6: `engagements.js`** — `SEKI.engagements` 交戰對（供「交戰中」拉鋸條）：WN62 vs 16團、WN72 vs 116團A連、Pointe du Hoc vs 遊騎兵、隘道 D-1 攻防 等，含起訖 t 與雙方 id。比照 okehazama engagements schema。

- [ ] **Step 7: `events.js`** — `SEKI.events` **50 個**事件節點 `{ t, title, desc? }`，時間序 05:30→18:00 涵蓋：艦砲準備、空襲、各波登陸、Dog Green 屠殺、DD 戰車沉沒、卵石堤釘死、Pointe du Hoc 攀崖、驅逐艦抵近、WN 逐個失守、隘道打通、352 反擊、傍晚鞏固。比照 okehazama events schema 與密度。

- [ ] **Step 8: 逐檔語法檢查**

Run: `for f in data/normandy/*.js; do node --check "$f" || echo "FAIL $f"; done`
Expected: 無 FAIL。

- [ ] **Step 9: Commit**

```bash
git add data/normandy/*.js
git commit -m "feat(normandy): 資料層(地理/部隊/天氣/運鏡/史料/交戰/50事件)"
```

---

## Task 7：`src/normandy-main.js` 戰役設定 + 主迴圈

**Files:** Create `src/normandy-main.js`（結構比照 `src/okehazama-main.js`：config → player → phase → 自帶粒子系統 → boot → 主迴圈）

- [ ] **Step 1: `SEKI.config`（須在 boot/buildTerrain 前就緒）**

```javascript
S.config = {
  modern: true,
  fmtTime(t) {                                   // 24 小時制
    const h = ((Math.floor(t) % 24) + 24) % 24;
    const mm = Math.floor(((t % 1) + 1) % 1 * 60);
    return `1944年6月6日 ${String(h).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
  },
  sideName:  { east: '盟軍', west: '德軍' },
  sideShort: { east: '盟軍', west: '德軍' },
  kindIcons: { warship:'艦', landingcraft:'登', aircraft:'機', armor:'戰', bunker:'堡', flak:'砲', infantry:'步' },
  kindArms: {
    warship:      ['海軍艦砲', '戰艦/驅逐艦艦砲火力支援'],
    landingcraft: ['登陸艇', 'LCVP 搶灘運兵、放下跳板'],
    aircraft:     ['航空兵', '轟炸/掃射支援'],
    armor:        ['裝甲', 'DD 雪曼戰車'],
    bunker:       ['岸防工事', 'WN 抵抗巢 MG42 火網'],
    flak:         ['高射砲', '地對空 flak'],
    infantry:     ['步兵', '搶灘步兵/遊騎兵'],
  },
  exag: 3.5,
  elevStops: [
    [0, 0x1c3a55], [1, 0x355f78], [3, 0xae9a6e], [8, 0x8f8a55],
    [20, 0x6f7440], [35, 0x6a6b3c], [45, 0x77704a],
  ],
  satelliteTexture: 'assets/terrain/normandy-sat.jpg',   // 若 Task 1 Step 5 失敗則設 null
};
```

- [ ] **Step 2: player 範圍**

```javascript
S.player = { time: 5.5, playing: true, speed: 0.4, program: true, T_START: 5.5, T_END: 18 };
```

- [ ] **Step 3: `phase(t)`** — 回傳當下相位字串（05:50 艦砲→06:00 空襲→06:30 搶灘→…→16:00+ 鞏固），比照 okehazama phase 寫法。

- [ ] **Step 4: 自帶海空煙幕系統** — 比照 okehazama 雨絲系統(`initRain`/`rainAmount`/`updateRain`)寫一組沿灘頭飄移的戰場煙幕(`initSmoke`/`smokeAmount(t)`/`updateSmoke`)：t6.5 後灘頭升起、隨戰鬥峰值濃淡。用 dust 類粒子或獨立 Points。

- [ ] **Step 5: boot 段** — 比照 okehazama-main 的 boot：`S.engine.init` → `S.buildTerrain` → `S.buildGeoLabels` → `S.buildUnits` → `S.initEffects` → `initSmoke` → storyboard/ui 初始化 → 主 rAF 迴圈內 `updateUnits/updateEffects/updateSmoke/storyboard/ui`。**確認 effects 初始化在 buildUnits 後**。

- [ ] **Step 6: 語法檢查 + Commit**

Run: `node --check src/normandy-main.js`

```bash
git add src/normandy-main.js
git commit -m "feat(normandy): 戰役設定(modern config)+海空煙幕+主迴圈"
```

---

## Task 8：`normandy.html` 頁面

**Files:** Create `normandy.html`（複製 `okehazama.html` 修改）

- [ ] **Step 1: 複製並改頁面層級設定**

```bash
cp okehazama.html normandy.html
```
改：①`<title>` → `3D 諾曼第登陸·奧馬哈海灘 — 電視級歷史節目`；②資料 script 區塊 `data/okehazama/*` → `data/normandy/*`（含 `geography/heightmap/armies/weather/storyboard/sources/engagements/events`）；③引擎 script 區塊**新增** `<script src="src/engine/models.js"></script>`（置於 units.js 之前）；④主程式 `src/okehazama-main.js` → `src/normandy-main.js`。

- [ ] **Step 2: 圖例(legend)更新** — 兵種圖例由戰國(本/砲/銃/騎/槍)改為現代(艦/登/機/戰/堡/砲/步)，對應 `kindArms`；陣營名改盟軍/德軍。比照 okehazama legend 區塊。

- [ ] **Step 3: 切換列三顆鈕（年代排序，本頁諾曼第 active）**

```html
<nav id="campaign-switch" aria-label="切換戰役">
  <a class="cs-item" href="okehazama.html">桶狹間之戰<small>1560</small></a>
  <a class="cs-item" href="index.html">關原之戰<small>1600</small></a>
  <span class="cs-item active">諾曼第登陸<small>1944</small></span>
</nav>
```

- [ ] **Step 4: 語法/資源檢查 + Commit**

開本機 server 確認所有 `<script src>` 路徑 200。

```bash
git add normandy.html
git commit -m "feat(normandy): 頁面 normandy.html(載入 models.js+現代圖例+三頁切換)"
```

---

## Task 9：跨頁切換列（年代排序）+ 回歸

**Files:** Modify `index.html`、`okehazama.html`（`#campaign-switch` 區塊）

- [ ] **Step 1: `index.html`（關原 active，年代排序三鈕）**

```html
<nav id="campaign-switch" aria-label="切換戰役">
  <a class="cs-item" href="okehazama.html">桶狹間之戰<small>1560</small></a>
  <span class="cs-item active">關原之戰<small>1600</small></span>
  <a class="cs-item" href="normandy.html">諾曼第登陸<small>1944</small></a>
</nav>
```

- [ ] **Step 2: `okehazama.html`（桶狹間 active，年代排序三鈕）**

```html
<nav id="campaign-switch" aria-label="切換戰役">
  <span class="cs-item active">桶狹間之戰<small>1560</small></span>
  <a class="cs-item" href="index.html">關原之戰<small>1600</small></a>
  <a class="cs-item" href="normandy.html">諾曼第登陸<small>1944</small></a>
</nav>
```

- [ ] **Step 3: Commit**

```bash
git add index.html okehazama.html
git commit -m "feat: 切換列改三頁年代排序(桶狹間→關原→諾曼第)"
```

---

## Task 10：瀏覽器實測與微調（claude-in-chrome）

**Files:** 視測試結果微調 `models.js`/`effects.js`/`normandy-main.js`/`data/normandy/*`

- [ ] **Step 1: 啟動本機 server**

Run: `python3 -m http.server 8000`（背景）

- [ ] **Step 2: 開 `normandy.html`，讀 console**

用 claude-in-chrome 開 `http://localhost:8000/normandy.html`，`read_console_messages` 確認**零錯誤**（特別是 heightmap/satellite 載入、models.js、units modern 路徑）。

- [ ] **Step 3: 視覺確認關鍵相位**（scrub 到各 t 截圖）
  - t5.9 艦砲齊射：砲口閃光 + 砲彈拋物弧 + 岸上爆炸
  - t6.5 搶灘：登陸艇貼海、步兵衝出、灘頭爆炸/水花
  - t7.5 WN62：碉堡紅色 MG 曳光火網掃向灘頭
  - 崖頂 flak 對空炸點(flak puff)
  - 地形：海面海藍、灘地、崖綠正確；模型比例不過大/過小

- [ ] **Step 4: 回歸**（開 `index.html` 與 `okehazama.html`）
  確認幟旗、家紋、倒戈翻旗、飄動、雨絲(桶狹間)一切如常，console 零錯誤。

- [ ] **Step 5: 依觀感微調**（模型比例、特效機率/密度、煙幕濃度、exag、elevStops、相機鏡位），逐項 commit。

- [ ] **Step 6: 更新 README**（新增諾曼第頁說明、地圖下載腳本、現代軍種），commit。

---

## Self-Review 對照

- **地圖全新下載** → Task 1 ✓
- **現代軍種模型(艦/登/機/戰/堡/砲/步)** → Task 2 + Task 3 ✓
- **戰鬥動畫(艦砲/曳光/防空/戰車/水花/投彈)** → Task 4（+ aircraft 投彈由 Task 7 相位腳本）✓
- **盟軍藍/德軍紅** → 沿用引擎 EAST/WEST；config sideName ✓（Task 7）
- **時間軸延傍晚 T_END 18** → Task 7 Step 2 ✓
- **50 事件節點** → Task 6 Step 7 ✓
- **三頁年代排序切換** → Task 8 Step 3 + Task 9 ✓
- **向後相容(前兩場無回歸)** → config.modern 閘 + fadeMats + `if(u.flag)` 守衛 + Task 10 Step 4 回歸 ✓
- **型別一致性**：`buildUnitMesh(kind,side,color)`、`userData.fadeMats`/`userData.muzzles`、`u.fadeMats`、`config.kindIcons`、`config.modern` 全計畫一致 ✓
