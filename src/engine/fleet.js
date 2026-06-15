/* =========================================================================
 * src/engine/fleet.js — 諾曼第「背景入侵艦隊」模組（史上最大兩棲艦隊規模感）
 *
 *   用途：使用者反映「海面的船應該不只這些」。本模組在灘頭以北的外海
 *   (英吉利海峽) 鋪上大量低面數背景船隻，把整片外海填滿——運輸船/自由輪、
 *   驅逐艦/護航艦、登陸艇 (LCVP)，營造「滿海艦隊」的規模感。
 *
 *   ※ 純裝飾：不掛標籤、不可點選、不參與交戰，與既有具名單位
 *     (戰艦德州號 USS Texas、驅逐艦群、登陸艇) 完全分離；
 *     具名單位的位置/邏輯不受本模組影響。
 *
 *   地理註(沿用 geography.js)：北(高 lat)=外海(世界 -z)、南(低 lat)=內陸；
 *   灘頭約 lat 49.37。錨地/火力支援區在更高 lat。
 *
 *   分層佈署(越北越外海)：
 *     - 遠處錨地  (高 lat)   密布【運輸船/自由輪】(較大，靜止微晃)。
 *     - 中段海域            散布【驅逐艦/護航艦】(細長，靜止微晃)。
 *     - 近灘海域 (低 lat)   一排排【登陸艇】，其中一部分在搶灘時段朝灘頭
 *                          (世界 +z / lat 遞減方向) 緩慢推進，到近灘折返循環。
 *
 *   效能作法：
 *     - 每種船型一個 InstancedMesh(共享 geometry/material)；整支艦隊僅 3 個
 *       draw call。每幀只更新少量 instance 的 matrix 與全域 opacity，
 *       不重建任何幾何。
 *     - 多數船「靜止微晃」其實連 matrix 都不必每幀重算——只有需要起伏/搖晃
 *       與「移動登陸艇」的 instance 才更新；靜止船在 init 寫一次 matrix。
 *       (為簡潔與一致的海浪感，本實作每幀以低成本三角函數更新起伏，
 *        instance 數約 60~120，成本可忽略。)
 *     - 散佈一律用 index + 三角函數(非 Math.random)，reload 不跳動。
 *     - 落點以 S.terrain.heightAt 驗證為水面(高度 ≤ ~0.5)，否則往北(增 lat)
 *       重試，確保不會把船放到陸地/灘上。
 *
 *   朝向：靜止船船艏大致朝岸(+z/朝戰場中心，即 lat 遞減方向)；
 *         移動登陸艇船艏朝其前進方向(亦朝岸)。模型 +X 為船艏。
 *
 *   色調：灰鋼 / 深灰海軍色。
 *
 *   限制：純前端、IIFE、無 import；僅用 bundled three.js 既有 API
 *        (此版本【無 CapsuleGeometry】，本檔未使用；僅用 Box/Cylinder/Cone)。
 *
 *   對外 API(主程式呼叫，命名固定)：
 *     S.initFleet()      — 建立所有背景船(3 個 InstancedMesh)，加入 S.engine.scene
 *     S.updateFleet(t)   — 依 campaign 小時 t 控制淡入/淡出、海浪起伏、登陸艇推進
 * ======================================================================= */
window.SEKI = window.SEKI || {};

(function (S) {
  'use strict';

  /* ---------- 佈署區域(經緯度) ----------
   * 全在「灘頭以北的外海」：lat 越大越外海。lng 略寬於灘段(-0.905~-0.845)。 */
  const SEA_LAT_MIN = 49.395;   // 近灘側(最南、最靠灘頭)
  const SEA_LAT_MAX = 49.470;   // 遠處錨地(最北、最外海)
  const SEA_LNG_MIN = -0.96;    // 西
  const SEA_LNG_MAX = -0.78;    // 東

  // 分層(以 lat 比例 0..1 切，0=近灘 1=遠海)
  const BAND_LC_HI   = 0.30;    // [0, 0.30)        近灘 → 登陸艇
  const BAND_DD_HI   = 0.62;    // [0.30, 0.62)     中段 → 驅逐艦/護航艦
  // [0.62, 1.0]                 遠處錨地 → 運輸船/自由輪

  /* ---------- 數量(按比例營造規模；總計 ~96 艘) ---------- */
  const N_TRANSPORT = 48;       // 運輸船/自由輪(遠處錨地，密布)
  const N_DESTROYER = 22;       // 驅逐艦/護航艦(中段)
  const N_LANDING   = 26;       // 登陸艇(近灘)；其中前 N_LANDING_MOVING 艘會推進
  const N_LANDING_MOVING = 10;  // 朝灘頭緩慢推進的登陸艇數

  const SHIP_BASE_Y = 0.45;     // 船底貼海平面(約 0.3~0.6)

  /* ---------- 顏色(灰鋼 / 深灰海軍色) ---------- */
  const COL_HULL_TR  = 0x6a7078;  // 運輸船船體(灰鋼)
  const COL_SUP_TR   = 0x868d94;  // 運輸船上層建築(較亮灰)
  const COL_HULL_DD  = 0x565d64;  // 驅逐艦船體(深海軍灰)
  const COL_SUP_DD   = 0x767c83;  // 驅逐艦艦島
  const COL_HULL_LC  = 0x4f555b;  // 登陸艇(暗灰)
  const COL_DARK     = 0x33373c;  // 暗部(桅杆/砲塔/吊桿)

  /* ---------- 時間軸(campaign 小時) ---------- */
  const T_FADE_IN0 = 3.5;   // 開始淡入(艦砲準備前)
  const T_FADE_IN1 = 4.5;   // 全顯
  const T_FADE_OUT0 = 46.0; // 開始淡出
  const T_FADE_OUT1 = 48.0; // 完全淡出(兩天後)
  const T_HIDE_LO  = 3.4;   // 此前整體隱藏(省效能)

  // 移動登陸艇搶灘推進時段
  const T_LC_MOVE0 = 6.0;
  const T_LC_MOVE1 = 42.0;   // 登陸艇持續往返靠岸卸載（D-Day 至 D+1，呈現船隻陸續靠岸）

  /* ---------- 模組狀態 ---------- */
  let _inited = false;
  let _group = null;
  // 三個 InstancedMesh 與其 instance 資料
  let _transport = null, _destroyer = null, _landing = null;
  let _trData = [], _ddData = [], _lcData = [];
  // 移動登陸艇額外資訊(起點/終點世界座標、相位)
  let _lcMove = [];     // [{ idx, startZ, endZ, x, phase }]

  // 暫存物件(避免每幀 new)
  const _m = new THREE.Matrix4();
  const _q = new THREE.Quaternion();
  const _pos = new THREE.Vector3();
  const _scl = new THREE.Vector3(1, 1, 1);
  const _up = new THREE.Vector3(0, 1, 0);

  /* clamp01 / smoothstep */
  function c01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function smooth(x) { x = c01(x); return x * x * (3 - 2 * x); }

  /* 把經緯度投到場景 x,z；y 用海平面基準(不取地形，海面約 0) */
  function seaXZ(lng, lat) {
    const p = S.engine.project(lng, lat, 0);
    return { x: p.x, z: p.z };
  }

  /* 驗證某經緯度落點為「水面」：terrain.heightAt(場景座標) ≤ 門檻。
   * 若為陸地則沿 +lat(往外海/北)逐步移動再試，回傳最終 {lng, lat, x, z}。 */
  function ensureWater(lng, lat) {
    let curLat = lat;
    for (let tries = 0; tries < 8; tries++) {
      const p = seaXZ(lng, curLat);
      const h = S.terrain ? S.terrain.heightAt(p.x, p.z) : 0;
      if (h <= 0.5) return { lng, lat: curLat, x: p.x, z: p.z };
      curLat += 0.006;   // 往北(外海)挪一點再試
    }
    const p = seaXZ(lng, curLat);
    return { lng, lat: curLat, x: p.x, z: p.z };
  }

  /* ===================================================================
   * 模型工廠(low-poly；+X 為船艏)。
   * 為了用 InstancedMesh(每型船僅 1 個 draw call)，需把每種船「合併成
   * 單一 geometry」。
   *
   * ※ 重要：本專案 bundled 的 three.min.js 並未內含
   *   THREE.BufferGeometryUtils(該字串僅出現在警告訊息中，物件未匯出)，
   *   既有 models.js 的船艦也都是用 Group 疊多個 Mesh 而非合併。
   *   因此本檔自行手動合併：把每個部位 geometry 的 position/normal 取出，
   *   套用各自的平移/旋轉後串接成單一 non-indexed BufferGeometry，並逐頂點
   *   寫入該部位的顏色到 'color' 屬性。material 用 vertexColors，整型船
   *   一種 material 即可。完全只用 Box/Cylinder/Cone 與基本緩衝區 API，
   *   不依賴任何 example/util 模組，亦未用 CapsuleGeometry。
   * =================================================================== */

  /* 一個「部位」描述：geometry + 顏色 + 變換(平移/繞 Z 旋轉) */
  function part(geo, hex, x, y, z, rotZ) {
    return { geo, hex: hex, x: x || 0, y: y || 0, z: z || 0, rotZ: rotZ || 0 };
  }

  /* 把若干部位手動合併成單一 non-indexed BufferGeometry(含頂點色)。
   * 對每個部位：先轉 non-indexed 取得三角面頂點，套用其旋轉+平移到
   * position 與 normal，再連同顏色串接。 */
  function mergeParts(parts) {
    // 先算總頂點數
    let total = 0;
    const prepared = [];
    for (const p of parts) {
      let g = p.geo;
      if (g.index) g = g.toNonIndexed();        // 確保每面獨立頂點，方便串接
      const pos = g.attributes.position;
      // 對應的法線(若無則計算)
      let nrm = g.attributes.normal;
      if (!nrm) { g.computeVertexNormals(); nrm = g.attributes.normal; }
      // 旋轉矩陣(繞 Z) + 平移
      const mtx = new THREE.Matrix4().makeRotationZ(p.rotZ);
      mtx.setPosition(p.x, p.y, p.z);
      const nMtx = new THREE.Matrix3().getNormalMatrix(mtx);
      prepared.push({ pos, nrm, mtx, nMtx, color: new THREE.Color(p.hex), count: pos.count });
      total += pos.count;
    }
    const outPos = new Float32Array(total * 3);
    const outNrm = new Float32Array(total * 3);
    const outCol = new Float32Array(total * 3);
    const v = new THREE.Vector3(), nv = new THREE.Vector3();
    let o = 0;
    for (const pr of prepared) {
      for (let i = 0; i < pr.count; i++) {
        v.fromBufferAttribute(pr.pos, i).applyMatrix4(pr.mtx);
        nv.fromBufferAttribute(pr.nrm, i).applyMatrix3(pr.nMtx).normalize();
        const j = o * 3;
        outPos[j] = v.x; outPos[j + 1] = v.y; outPos[j + 2] = v.z;
        outNrm[j] = nv.x; outNrm[j + 1] = nv.y; outNrm[j + 2] = nv.z;
        outCol[j] = pr.color.r; outCol[j + 1] = pr.color.g; outCol[j + 2] = pr.color.b;
        o++;
      }
    }
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.BufferAttribute(outPos, 3));
    out.setAttribute('normal', new THREE.BufferAttribute(outNrm, 3));
    out.setAttribute('color', new THREE.BufferAttribute(outCol, 3));
    return out;
  }

  /* --- 運輸船/自由輪：長方船體 + 上層建築 + 桅杆/吊桿 --- */
  function buildTransportGeo() {
    return mergeParts([
      // 船體(長方體，沿 X)
      part(new THREE.BoxGeometry(11, 2.2, 3.2), COL_HULL_TR, 0, 1.1, 0, 0),
      // 艏部收束(楔形小盒前置)
      part(new THREE.BoxGeometry(2.0, 1.8, 2.4), COL_HULL_TR, 6.0, 1.1, 0, 0),
      // 上層建築(船舯偏後)
      part(new THREE.BoxGeometry(3.2, 2.4, 2.6), COL_SUP_TR, -1.0, 3.4, 0, 0),
      // 駕駛台(較小一層)
      part(new THREE.BoxGeometry(2.0, 1.2, 2.0), COL_SUP_TR, -1.0, 4.9, 0, 0),
      // 煙囪
      part(new THREE.CylinderGeometry(0.5, 0.6, 2.0, 8), COL_DARK, -2.4, 5.0, 0, 0),
      // 前桅杆(細柱)
      part(new THREE.CylinderGeometry(0.12, 0.12, 4.0, 6), COL_DARK, 2.6, 4.0, 0, 0),
      // 吊桿(斜置橫桿，貨運感)
      part(new THREE.BoxGeometry(3.4, 0.18, 0.18), COL_DARK, 2.6, 4.4, 0, 0.5),
    ]);
  }

  /* --- 驅逐艦/護航艦：細長艦體 + 艦島 + 砲塔 --- */
  function buildDestroyerGeo() {
    return mergeParts([
      // 細長艦體
      part(new THREE.BoxGeometry(13, 1.4, 1.8), COL_HULL_DD, 0, 0.8, 0, 0),
      // 艏部尖錐(朝 +X；ConeGeometry 預設尖端朝 +Y，繞 Z 轉 -90° 指向 +X)
      part(new THREE.ConeGeometry(0.9, 2.6, 8), COL_HULL_DD, 7.3, 0.8, 0, -Math.PI / 2),
      // 艦島(中部上層)
      part(new THREE.BoxGeometry(3.0, 1.8, 1.4), COL_SUP_DD, -0.5, 2.3, 0, 0),
      // 桅杆
      part(new THREE.CylinderGeometry(0.1, 0.1, 3.4, 6), COL_DARK, -0.5, 4.0, 0, 0),
      // 煙囪
      part(new THREE.CylinderGeometry(0.42, 0.5, 1.6, 8), COL_DARK, -2.2, 2.6, 0, 0),
      // 前砲塔
      part(new THREE.BoxGeometry(1.2, 0.7, 1.2), COL_SUP_DD, 3.4, 1.7, 0, 0),
      // 前砲管(指向 +X)
      part(new THREE.CylinderGeometry(0.12, 0.12, 1.8, 6), COL_DARK, 4.6, 1.8, 0, -Math.PI / 2),
      // 後砲塔
      part(new THREE.BoxGeometry(1.2, 0.7, 1.2), COL_SUP_DD, -4.0, 1.6, 0, 0),
    ]);
  }

  /* --- 登陸艇(LCVP)：方頭小艇 --- */
  function buildLandingGeo() {
    return mergeParts([
      // 艇身(方頭矮盒)
      part(new THREE.BoxGeometry(3.4, 1.0, 1.8), COL_HULL_LC, 0, 0.5, 0, 0),
      // 艏跳板(前方略翹的薄盒)
      part(new THREE.BoxGeometry(1.0, 1.0, 1.8), COL_HULL_LC, 1.9, 0.6, 0, -0.25),
      // 艉部操舵台(小方塊)
      part(new THREE.BoxGeometry(0.8, 0.7, 1.2), COL_DARK, -1.4, 1.1, 0, 0),
    ]);
  }

  /* 建一個 InstancedMesh(共享 geometry + 單一 vertexColors material) */
  function makeInstanced(geo, count) {
    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true, roughness: 0.85, metalness: 0.1,
      transparent: true, opacity: 1,
    });
    const im = new THREE.InstancedMesh(geo, mat, count);
    im.castShadow = true;
    im.receiveShadow = false;
    im.frustumCulled = false;   // 艦隊鋪滿外海，避免邊緣被整批 cull
    im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    return im;
  }

  /* 寫入單一 instance 的矩陣(位置 + 繞 Y 朝向 + 起伏/搖晃) */
  function setInstance(im, idx, x, y, z, yaw, pitch, roll) {
    _pos.set(x, y, z);
    _q.setFromEuler(new THREE.Euler(pitch || 0, yaw, roll || 0, 'YXZ'));
    _m.compose(_pos, _q, _scl);
    im.setMatrixAt(idx, _m);
  }

  /* ===================================================================
   * API 1：建立
   * =================================================================== */
  S.initFleet = function () {
    if (_inited) return;
    const eng = S.engine;
    if (!eng || !eng.scene) return;

    _group = new THREE.Group();
    _group.visible = false;

    // 朝岸(lat 遞減 = 世界 +z 方向)的 yaw：模型 +X 朝該方向。
    // 世界 +z 對應 yaw = atan2(-dz, dx) 取 dir=(0,0,+1) → atan2(-1,0) = -PI/2。
    const YAW_TO_SHORE = -Math.PI / 2;

    /* --- 運輸船/自由輪(遠處錨地 band 高 lat，密布) --- */
    _transport = makeInstanced(buildTransportGeo(), N_TRANSPORT);
    _trData = [];
    for (let i = 0; i < N_TRANSPORT; i++) {
      // 散佈：lat 在遠海帶、lng 全幅；用 index 三角函數穩定鋪開
      const fx = (Math.sin(i * 2.39) * 0.5 + 0.5);            // 0..1 經度位置
      const fz = (Math.cos(i * 1.13) * 0.5 + 0.5);            // 0..1 帶內深淺
      const lng = SEA_LNG_MIN + (SEA_LNG_MAX - SEA_LNG_MIN) * fx;
      const latBand = BAND_DD_HI + (1 - BAND_DD_HI) * fz;     // [0.62,1]
      const lat = SEA_LAT_MIN + (SEA_LAT_MAX - SEA_LAT_MIN) * latBand;
      const w = ensureWater(lng, lat);
      const yaw = YAW_TO_SHORE + Math.sin(i * 0.7) * 0.25;     // 略有朝向變化
      _trData.push({ x: w.x, z: w.z, yaw, phase: i * 0.6 });
      setInstance(_transport, i, w.x, SHIP_BASE_Y, w.z, yaw, 0, 0);
    }
    _transport.instanceMatrix.needsUpdate = true;
    _group.add(_transport);

    /* --- 驅逐艦/護航艦(中段 band) --- */
    _destroyer = makeInstanced(buildDestroyerGeo(), N_DESTROYER);
    _ddData = [];
    for (let i = 0; i < N_DESTROYER; i++) {
      const fx = (Math.sin(i * 1.97 + 0.3) * 0.5 + 0.5);
      const fz = (Math.cos(i * 0.83 + 0.7) * 0.5 + 0.5);
      const lng = SEA_LNG_MIN + (SEA_LNG_MAX - SEA_LNG_MIN) * fx;
      const latBand = BAND_LC_HI + (BAND_DD_HI - BAND_LC_HI) * fz;  // [0.30,0.62]
      const lat = SEA_LAT_MIN + (SEA_LAT_MAX - SEA_LAT_MIN) * latBand;
      const w = ensureWater(lng, lat);
      const yaw = YAW_TO_SHORE + Math.sin(i * 1.1 + 0.5) * 0.35;
      _ddData.push({ x: w.x, z: w.z, yaw, phase: i * 0.5 + 1.0 });
      setInstance(_destroyer, i, w.x, SHIP_BASE_Y, w.z, yaw, 0, 0);
    }
    _destroyer.instanceMatrix.needsUpdate = true;
    _group.add(_destroyer);

    /* --- 登陸艇(近灘 band；前 N_LANDING_MOVING 艘會朝灘頭推進) --- */
    _landing = makeInstanced(buildLandingGeo(), N_LANDING);
    _lcData = [];
    _lcMove = [];
    for (let i = 0; i < N_LANDING; i++) {
      const fx = (Math.sin(i * 1.51 + 1.2) * 0.5 + 0.5);
      const fz = (Math.cos(i * 0.61 + 0.4) * 0.5 + 0.5);
      const lng = SEA_LNG_MIN + (SEA_LNG_MAX - SEA_LNG_MIN) * fx;
      const latBand = 0.02 + (BAND_LC_HI - 0.02) * fz;       // [0.02,0.30] 近灘
      const lat = SEA_LAT_MIN + (SEA_LAT_MAX - SEA_LAT_MIN) * latBand;
      const w = ensureWater(lng, lat);
      const yaw = YAW_TO_SHORE + Math.sin(i * 1.3) * 0.18;
      _lcData.push({ x: w.x, z: w.z, yaw, phase: i * 0.4 + 2.0 });
      setInstance(_landing, i, w.x, SHIP_BASE_Y, w.z, yaw, 0, 0);

      // 前若干艘標記為「移動登陸艇」：自起點(較北)朝灘頭(較南 → 世界 +z)推進。
      if (i < N_LANDING_MOVING) {
        // 灘頭一線約 lat 49.372；推進終點設在略北於灘頭，避免衝上沙灘。
        const beachLat = 49.382;
        const startW = w;                                  // 起點即其錨位
        const endXZ = seaXZ(lng, beachLat);                // 終點(近灘)
        _lcMove.push({
          idx: i,
          x: lng,                                          // 同一經度沿 z 推進
          startZ: startW.z,
          endZ: endXZ.z,                                   // 世界 +z(更靠岸)
          yaw,
          phase: i * 0.5,
        });
      }
    }
    _landing.instanceMatrix.needsUpdate = true;
    _group.add(_landing);

    eng.scene.add(_group);
    _inited = true;
  };

  /* ===================================================================
   * API 2：更新(依 campaign 小時 t)
   *   - 整體可見窗：t<3.4 隱藏；t3.5~4.5 淡入；持續到 t46~48 淡出。
   *   - 海浪起伏/搖晃：所有船以 clock + phase 做低成本 sin(每幀更新 matrix)。
   *   - 移動登陸艇：t6~13 朝灘頭推進，到近灘折返循環(三角波)。
   * =================================================================== */
  S.updateFleet = function (t) {
    if (!_inited) return;

    // 整體隱藏窗(省效能)
    if (t < T_HIDE_LO || t > T_FADE_OUT1 + 0.01) {
      if (_group.visible) _group.visible = false;
      return;
    }
    _group.visible = true;

    // 全域 opacity(淡入 → 全顯 → 淡出)
    let op;
    if (t < T_FADE_IN0) op = 0;
    else if (t < T_FADE_IN1) op = smooth((t - T_FADE_IN0) / (T_FADE_IN1 - T_FADE_IN0));
    else if (t < T_FADE_OUT0) op = 1;
    else if (t < T_FADE_OUT1) op = 1 - smooth((t - T_FADE_OUT0) / (T_FADE_OUT1 - T_FADE_OUT0));
    else op = 0;
    _transport.material.opacity = op;
    _destroyer.material.opacity = op;
    _landing.material.opacity = op;

    const elapsed = (S.engine && S.engine.clock) ? S.engine.clock.getElapsedTime() : 0;

    /* ---------- 1. 運輸船：靜止微晃(起伏 + 輕搖)；D+1 陸續往岸靠近卸載 ---------- */
    const shoreDrift = t > 18 ? Math.min(40, (t - 18) * 2.2) : 0;    // 第一天告一段落後漸往岸(世界 +z)
    for (let i = 0; i < _trData.length; i++) {
      const d = _trData[i];
      const bob = Math.sin(elapsed * 0.6 + d.phase) * 0.18;          // 垂直起伏
      const roll = Math.sin(elapsed * 0.5 + d.phase * 1.3) * 0.025;  // 橫搖
      const pitch = Math.cos(elapsed * 0.4 + d.phase) * 0.015;       // 縱搖
      setInstance(_transport, i, d.x, SHIP_BASE_Y + bob, d.z + shoreDrift, d.yaw, pitch, roll);
    }
    _transport.instanceMatrix.needsUpdate = true;

    /* ---------- 2. 驅逐艦：靜止微晃(幅度略大，較靈活) ---------- */
    for (let i = 0; i < _ddData.length; i++) {
      const d = _ddData[i];
      const bob = Math.sin(elapsed * 0.8 + d.phase) * 0.2;
      const roll = Math.sin(elapsed * 0.7 + d.phase * 1.2) * 0.035;
      const pitch = Math.cos(elapsed * 0.55 + d.phase) * 0.02;
      setInstance(_destroyer, i, d.x, SHIP_BASE_Y + bob, d.z, d.yaw, pitch, roll);
    }
    _destroyer.instanceMatrix.needsUpdate = true;

    /* ---------- 3. 登陸艇：靜止微晃 + 部分朝灘推進 ---------- */
    // 先把所有登陸艇做微晃(靜止錨位)
    for (let i = 0; i < _lcData.length; i++) {
      const d = _lcData[i];
      const bob = Math.sin(elapsed * 1.1 + d.phase) * 0.22;          // 小艇晃得明顯
      const roll = Math.sin(elapsed * 0.9 + d.phase * 1.4) * 0.05;
      const pitch = Math.cos(elapsed * 0.8 + d.phase) * 0.04;
      setInstance(_landing, i, d.x, SHIP_BASE_Y + bob, d.z, d.yaw, pitch, roll);
    }
    // 再覆寫「移動登陸艇」：t6~13 朝灘頭推進，三角波折返循環。
    if (t >= T_LC_MOVE0 && t <= T_LC_MOVE1) {
      const moveSpan = T_LC_MOVE1 - T_LC_MOVE0;
      for (let k = 0; k < _lcMove.length; k++) {
        const mv = _lcMove[k];
        // 每艇用自身相位做循環，使整排並非同步(更像一波波搶灘)
        const cyc = ((t - T_LC_MOVE0) / moveSpan * 2.0 + mv.phase) % 1.0;
        // 三角波：0→1→0(去程到近灘，再折返)
        const tri = cyc < 0.5 ? (cyc * 2) : (2 - cyc * 2);
        const prog = smooth(tri);
        const zNow = mv.startZ + (mv.endZ - mv.startZ) * prog;       // 往世界 +z(近灘)
        const i = mv.idx;
        const d = _lcData[i];
        const bob = Math.sin(elapsed * 1.2 + mv.phase) * 0.22;
        const pitch = -0.05 + Math.cos(elapsed * 0.8 + mv.phase) * 0.04;  // 略低頭推進
        const roll = Math.sin(elapsed * 0.9 + mv.phase) * 0.04;
        setInstance(_landing, i, d.x, SHIP_BASE_Y + bob, zNow, mv.yaw, pitch, roll);
      }
    }
    _landing.instanceMatrix.needsUpdate = true;
  };
})(window.SEKI);
