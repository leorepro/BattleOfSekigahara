/* =========================================================================
 * src/engine/airdrop.js — 諾曼第凌晨「精細空降序列」模組
 *
 *   用途：把 D-Day 凌晨的空降「演出來」，取代原本傘兵憑空出現在內陸的做法。
 *   完整時序（campaign 小時 t；H時=06:30=t6.5，本序列在 t0.5~1.9 之間演出）：
 *     t0.5~1.0  C-47 運輸機編隊自外海側(北/高 lat)進場，朝內陸空降區(西南)飛。
 *     t1.0~1.5  飛抵空降區上空，沿途連續投下傘兵(數個 stick)。
 *     t1.2~1.7  傘兵張傘自投放高度緩降到地形表面，並帶水平飄移。
 *     t1.4~1.9  機群投畢轉向、爬升飛離(往北飛回)。
 *     t1.5~3.0  落地傘兵生成「臨時陣地」標記(散兵坑/沙包/集結人形)，淡入持續。
 *     t>3.0     臨時陣地淡出(地面部隊接手)。
 *     t<0.4 / t>2.4  整體 visible=false（提前 return 省效能）。
 *
 *   設計要點：
 *   - 純前端、IIFE、無 import；low-poly 但看得出是運輸機與傘兵。
 *   - C-47 自建模型：機身/機鼻/座艙/雙翼/單垂尾/雙發動機(螺旋槳轂+槳葉)/
 *     機腹貨艙門；機身與機翼加 D-Day「入侵條紋」(黑白相間色塊)。+X 為機首。
 *   - 飛行路徑：用 S.engine.project() 把「進場點→空降區→飛離點」轉成世界座標
 *     關鍵點存起來，update 內以線性插值驅動編隊位移，機首對齊速度向量。
 *   - 傘兵：物件池一次建好(預設 64 個)。未投放前隱藏；投放後從機高緩降到
 *     地形表面(用 S.terrain.heightAt 取落點 y)，含水平飄移；落地後傘蓋收起消失。
 *   - 穩定性：所有散佈/飄移/落點用 index + 三角函數產生，不用 Math.random，
 *     reload 不跳動；每幀只更新 transform/opacity，不重建幾何。
 *   - 動畫脈動/旋轉用 S.engine.clock.getElapsedTime()。
 *
 *   對外 API（主程式呼叫，命名固定）：
 *     S.initAirdrop()     — 建立機群/傘兵池/臨時陣地，預設隱藏，加入 S.engine.scene
 *     S.updateAirdrop(t)  — 依 campaign 小時 t 驅動整個序列
 * ======================================================================= */
window.SEKI = window.SEKI || {};

(function (S) {
  'use strict';

  /* ---------- 可調參數 ---------- */
  // 空降區（內陸偏西）。地理註：北(高 lat)=外海(世界 -z)，南(低 lat)=內陸。
  const DZ_LNG = -0.925;          // 空降區中心經度（內陸偏西 -0.90~-0.95 間）
  const DZ_LAT = 49.320;          // 空降區中心緯度（內陸 49.30~49.34 間）
  const DZ_SPREAD_LNG = 0.020;    // 空降區東西散佈（度）
  const DZ_SPREAD_LAT = 0.012;    // 空降區南北散佈（度）

  // 飛行路徑關鍵點（經緯度）：進場點(外海高 lat)→空降區上空→飛離點(北)
  const APPROACH = { lng: -0.860, lat: 49.460 };  // 進場（外海側，東偏）
  const OVER_DZ  = { lng: DZ_LNG, lat: DZ_LAT };   // 空降區正上方
  const EXIT     = { lng: -0.945, lat: 49.470 };   // 飛離（往北、西偏）

  const FLY_ALT = 95;             // 飛行高度（場景單位；機群巡航高度）
  const EXIT_CLIMB = 40;          // 飛離時額外爬升量

  const FORMATION_N = 4;          // 編隊機數（3~5）
  const FORMATION_DX = -7;        // 編隊縱深間距（沿 -X 後方排開，場景單位）
  const FORMATION_DZ = 5;         // 編隊橫向錯開（V 形展開）

  const PARA_POOL = 64;           // 傘兵物件池大小
  const PARA_PER_PLANE = 16;      // 每機投放傘兵數（FORMATION_N*PARA_PER_PLANE≤POOL）
  const PARA_FALL_TIME = 0.45;    // 單兵緩降所佔的 campaign 小時跨度
  const PARA_DRIFT = 9;           // 傘兵水平飄移幅度（場景單位）

  const NEST_N = 6;               // 臨時陣地標記數量

  // 時間軸（campaign 小時）
  const T_START = 0.5;            // 機群進場
  const T_DROP0 = 1.0;            // 開始投放
  const T_DROP1 = 1.5;            // 投放結束
  const T_EXIT  = 1.9;            // 機群飛離完成
  const T_NEST_IN  = 1.5;         // 臨時陣地淡入起點
  const T_NEST_FULL = 1.9;        // 臨時陣地全顯
  const T_NEST_OUT = 3.0;         // 臨時陣地淡出起點
  const T_NEST_GONE = 3.4;        // 臨時陣地消失
  const T_HIDE_LO = 0.4;          // 整體顯示下界
  const T_HIDE_HI = 2.4;          // 整體顯示上界（臨時陣地另由 group 控制）

  // 被高射砲擊落（固定 index，非亂數）：編隊中第 1、2 架在投放時段中彈墜落。
  const SHOTDOWN_IDX = [1, 2];    // 被擊中機在 _planes 的 index
  const T_HIT  = [1.10, 1.28];    // 各機「中彈起火」時刻（與 SHOTDOWN_IDX 對應）
  const T_CRASH = [1.55, 1.78];   // 各機「墜地爆炸」時刻（中彈後逐步下墜到此刻觸地）

  /* ---------- 顏色 ---------- */
  const COL_FUSELAGE = 0x6b6f54;  // 橄欖綠機身
  const COL_DARK     = 0x3a3d2e;  // 暗部
  const COL_GLASS    = 0x9fc4d8;  // 座艙玻璃
  const COL_STRIPE_W = 0xeae6da;  // 入侵條紋白
  const COL_STRIPE_K = 0x202020;  // 入侵條紋黑
  const COL_PROP     = 0x202018;  // 螺旋槳
  const COL_CANOPY   = 0x4a7a3c;  // 傘蓋（迷彩綠）
  const COL_CANOPY2  = 0xbfae7a;  // 傘蓋備色（沙黃，交替）
  const COL_SOLDIER  = 0x55583f;  // 傘兵軍裝
  const COL_HELMET   = 0x3c3f2c;  // 鋼盔
  const COL_SAND     = 0xb6a274;  // 沙包
  const COL_DIRT     = 0x5a4d36;  // 散兵坑泥土

  /* ---------- 模組狀態 ---------- */
  let _inited = false;
  let _group = null;              // 整體根節點
  let _planes = [];               // [{ mesh, props:[], offset:Vector3 }]
  let _paras = [];                // 傘兵池 [{ group, canopy, mat, planeIdx, slot, dropT, ... }]
  let _nests = [];               // 臨時陣地 [{ group, mats:[] }]
  let _path = null;               // { p0,p1,p2 }（進場/空降/飛離世界座標）

  /* 取地形上某經緯度的場景座標 */
  function terrainPt(lng, lat) {
    const p = S.engine.project(lng, lat, 0);
    const y = (S.terrain ? S.terrain.heightAt(p.x, p.z) : 0);
    return new THREE.Vector3(p.x, y, p.z);
  }

  /* ===================================================================
   * 模型工廠
   * =================================================================== */

  /* 建立螺旋槳（轂 + 三槳葉），回傳可旋轉的 group（繞 +X 軸自轉） */
  function makeProp() {
    const g = new THREE.Group();
    const hub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, 0.6, 8),
      new THREE.MeshStandardMaterial({ color: COL_DARK, roughness: 0.8 }));
    hub.rotation.z = Math.PI / 2;   // 轂沿 +X
    g.add(hub);
    const bladeMat = new THREE.MeshStandardMaterial({ color: COL_PROP, roughness: 0.6 });
    for (let i = 0; i < 3; i++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.12, 4.4, 0.5), bladeMat);
      blade.rotation.x = (i / 3) * Math.PI * 2;   // 繞 X 均分
      g.add(blade);
    }
    return g;
  }

  /* 在指定 box 上鋪「入侵條紋」(黑白相間細片，繞機身/翼一圈的視覺近似)。
   * 以一組薄片沿 X 排列貼在父物件上，黑白交替。 */
  function addInvasionStripes(parent, opt) {
    // opt: { x, half(半寬/半高 for ring), axis:'fuselage'|'wing', count }
    const count = opt.count || 5;
    const matW = new THREE.MeshStandardMaterial({ color: COL_STRIPE_W, roughness: 0.7 });
    const matK = new THREE.MeshStandardMaterial({ color: COL_STRIPE_K, roughness: 0.7 });
    const stripeW = opt.span / count;          // 每條寬
    for (let i = 0; i < count; i++) {
      const mat = (i % 2 === 0) ? matW : matK;
      let geo;
      if (opt.axis === 'fuselage') {
        // 繞機身：略大於機身半徑的薄圓筒環
        geo = new THREE.CylinderGeometry(opt.r * 1.04, opt.r * 1.04, stripeW * 0.92, 10);
        const m = new THREE.Mesh(geo, mat);
        m.rotation.z = Math.PI / 2;            // 沿 X
        m.position.set(opt.x0 + stripeW * (i + 0.5), opt.y || 0, 0);
        parent.add(m);
      } else {
        // 貼機翼下表面：扁平薄盒沿翼展(Z)鋪
        geo = new THREE.BoxGeometry(opt.chord * 0.96, 0.12, stripeW * 0.92);
        const m = new THREE.Mesh(geo, mat);
        m.position.set(opt.x || 0, opt.y || 0, opt.z0 + stripeW * (i + 0.5));
        parent.add(m);
      }
    }
  }

  /* 建立一架精細 C-47 運輸機（+X 為機首），回傳 { mesh, props:[] } */
  function makeC47() {
    const plane = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: COL_FUSELAGE, roughness: 0.85 });
    const darkMat = new THREE.MeshStandardMaterial({ color: COL_DARK, roughness: 0.85 });

    // --- 機身（圓柱，沿 X） ---
    const FUS_R = 1.3, FUS_L = 14;
    const fus = new THREE.Mesh(
      new THREE.CylinderGeometry(FUS_R, FUS_R, FUS_L, 14), bodyMat);
    fus.rotation.z = Math.PI / 2;
    plane.add(fus);

    // --- 機鼻（圓錐，朝 +X） ---
    const nose = new THREE.Mesh(
      new THREE.ConeGeometry(FUS_R, 3, 14), bodyMat);
    nose.rotation.z = -Math.PI / 2;
    nose.position.x = FUS_L / 2 + 1.5;
    plane.add(nose);

    // --- 機尾收束（朝 -X 縮錐） ---
    const tailCone = new THREE.Mesh(
      new THREE.ConeGeometry(FUS_R, 4, 14), bodyMat);
    tailCone.rotation.z = Math.PI / 2;
    tailCone.position.x = -FUS_L / 2 - 1.0;
    plane.add(tailCone);

    // --- 座艙玻璃（機鼻上方） ---
    const canopy = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.9, 1.6),
      new THREE.MeshStandardMaterial({ color: COL_GLASS, roughness: 0.3, metalness: 0.1 }));
    canopy.position.set(FUS_L / 2 - 0.6, 0.95, 0);
    plane.add(canopy);

    // --- 機腹貨艙門（暗色片，機身左後下方） ---
    const door = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 1.8, 0.1), darkMat);
    door.position.set(-3.4, -0.2, FUS_R * 0.98);
    plane.add(door);

    // --- 主翼（單片貫穿，沿 Z 翼展；前緣略前置） ---
    const WING_SPAN = 24, WING_CHORD = 3.6;
    const wing = new THREE.Mesh(
      new THREE.BoxGeometry(WING_CHORD, 0.35, WING_SPAN), bodyMat);
    wing.position.set(0.6, 0.2, 0);
    plane.add(wing);

    // --- 水平尾翼 ---
    const htail = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 0.25, 9), bodyMat);
    htail.position.set(-FUS_L / 2 - 1.5, 0.2, 0);
    plane.add(htail);

    // --- 單垂尾 ---
    const vtail = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 3.4, 0.3), bodyMat);
    vtail.position.set(-FUS_L / 2 - 1.6, 1.7, 0);
    plane.add(vtail);

    // --- 雙發動機（掛主翼下，含螺旋槳） ---
    const props = [];
    const engZ = [WING_SPAN * 0.28, -WING_SPAN * 0.28];
    for (let s = 0; s < 2; s++) {
      const nac = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 0.7, 3.2, 10), darkMat);
      nac.rotation.z = Math.PI / 2;
      nac.position.set(1.6, -0.1, engZ[s]);
      plane.add(nac);
      const prop = makeProp();
      prop.position.set(3.3, -0.1, engZ[s]);   // 發動機前緣
      plane.add(prop);
      props.push(prop);
    }

    // --- 入侵條紋：機身後段繞一圈 + 兩翼各一段（黑白相間） ---
    addInvasionStripes(plane, {
      axis: 'fuselage', r: FUS_R, x0: -6.2, span: 3.0, count: 5,
    });
    addInvasionStripes(plane, {
      axis: 'wing', chord: WING_CHORD, x: 0.6, y: 0.06, z0: WING_SPAN * 0.30, span: 3.0, count: 5,
    });
    addInvasionStripes(plane, {
      axis: 'wing', chord: WING_CHORD, x: 0.6, y: 0.06, z0: -WING_SPAN * 0.30 - 3.0, span: 3.0, count: 5,
    });

    plane.traverse((o) => { if (o.isMesh) o.castShadow = true; });

    // --- 被擊落特效節點（預設隱藏；只有被選中的機會啟用） ---
    // 火光：機身上方一顆橙黃半透明球，update 內以 clock 閃動 scale/opacity。
    const fireMat = new THREE.MeshBasicMaterial({
      color: 0xff7b1e, transparent: true, opacity: 0, depthWrite: false });
    const fire = new THREE.Mesh(new THREE.SphereGeometry(1.6, 10, 8), fireMat);
    fire.position.set(1.0, 0.4, 0);   // 引擎/機身受創處
    fire.visible = false;
    plane.add(fire);

    // 黑煙拖尾：沿機身往後(-X)排一串半透明黑球，越後越大越淡，模擬拖尾。
    const smoke = [];
    const smokeMats = [];
    for (let i = 0; i < 6; i++) {
      const sm = new THREE.MeshBasicMaterial({
        color: 0x2b2b2b, transparent: true, opacity: 0, depthWrite: false });
      smokeMats.push(sm);
      const puff = new THREE.Mesh(new THREE.SphereGeometry(1.2 + i * 0.5, 8, 6), sm);
      // 往機尾後方排開，略微上揚（拖在機身後上方）
      puff.position.set(-2 - i * 2.6, 0.3 + i * 0.25, 0);
      puff.visible = false;
      plane.add(puff);
      smoke.push(puff);
    }

    return { mesh: plane, props, fire, fireMat, smoke, smokeMats };
  }

  /* 建立一個傘兵（傘蓋 + 傘繩 + 小人形），回傳可移動的 group。
   * altColor=true 時傘蓋用備色，使編隊傘花有變化。 */
  function makePara(index) {
    const g = new THREE.Group();
    const useAlt = (index % 3 === 0);

    // --- 傘蓋（半球 dome，低面數） ---
    const canopyMat = new THREE.MeshStandardMaterial({
      color: useAlt ? COL_CANOPY2 : COL_CANOPY,
      roughness: 0.95, transparent: true, opacity: 1, side: THREE.DoubleSide });
    const canopy = new THREE.Mesh(
      new THREE.SphereGeometry(2.4, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), canopyMat);
    canopy.position.y = 5.2;
    g.add(canopy);

    // --- 傘繩（4 條細線，從傘緣到吊掛點） ---
    const cordMat = new THREE.LineBasicMaterial({ color: 0xdddccb, transparent: true, opacity: 0.8 });
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const top = new THREE.Vector3(Math.cos(a) * 2.0, 5.0, Math.sin(a) * 2.0);
      const bot = new THREE.Vector3(0, 1.4, 0);
      const lg = new THREE.BufferGeometry().setFromPoints([top, bot]);
      g.add(new THREE.Line(lg, cordMat));
    }

    // --- 小人形（軀幹 + 頭 + 鋼盔） ---
    const bodyMat = new THREE.MeshStandardMaterial({ color: COL_SOLDIER, roughness: 0.9 });
    // 注意：此 three.js 版本沒有 CapsuleGeometry，軀幹改用圓柱（避免 not-a-constructor 崩潰）
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.42, 1.5, 8), bodyMat);
    body.position.y = 0.6;
    g.add(body);
    const helmet = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: COL_HELMET, roughness: 0.85 }));
    helmet.position.y = 1.55;
    g.add(helmet);

    g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    g.visible = false;
    return { group: g, canopy, canopyMat, cordMat };
  }

  /* 建立一處臨時陣地標記（散兵坑環 + 沙包堆 + 集結人形小簇） */
  function makeNest(index) {
    const g = new THREE.Group();
    const mats = [];

    // 散兵坑：環形泥土（TorusGeometry 攤平）
    const ringMat = new THREE.MeshStandardMaterial({
      color: COL_DIRT, roughness: 1, transparent: true, opacity: 0 });
    mats.push(ringMat);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.6, 6, 16), ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.2;
    g.add(ring);

    // 沙包堆：幾個小盒疊放（用 index 三角函數穩定佈局）
    const bagMat = new THREE.MeshStandardMaterial({
      color: COL_SAND, roughness: 0.95, transparent: true, opacity: 0 });
    mats.push(bagMat);
    for (let i = 0; i < 4; i++) {
      const bag = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.5, 0.7), bagMat);
      const a = i * 1.3 + index;
      bag.position.set(Math.cos(a) * 1.8, 0.25 + (i % 2) * 0.45, Math.sin(a) * 1.8 + 1.0);
      bag.rotation.y = a;
      g.add(bag);
    }

    // 集結人形小簇：2~3 個簡化人形
    const figMat = new THREE.MeshStandardMaterial({
      color: COL_SOLDIER, roughness: 0.9, transparent: true, opacity: 0 });
    mats.push(figMat);
    const nFig = 2 + (index % 2);
    for (let i = 0; i < nFig; i++) {
      const fig = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.4, 1.5, 6), figMat);
      const a = i * 2.1 + index * 0.7;
      fig.position.set(Math.cos(a) * 1.2, 0.75, Math.sin(a) * 1.2 - 0.6);
      g.add(fig);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 6, 5), figMat);
      head.position.set(fig.position.x, 1.65, fig.position.z);
      g.add(head);
    }

    g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    g.visible = false;
    return { group: g, mats };
  }

  /* 建立一個墜地火球（外層橙火 + 內層亮黃核 + 上沖黑煙柱），預設隱藏。
   * 回傳引用供 update 內以 t/clock 驅動膨脹與淡出。 */
  function makeFireball() {
    const g = new THREE.Group();
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffe07a, transparent: true, opacity: 0, depthWrite: false });
    const core = new THREE.Mesh(new THREE.SphereGeometry(2.2, 12, 10), coreMat);
    core.position.y = 2.2;
    g.add(core);

    const flameMat = new THREE.MeshBasicMaterial({
      color: 0xff5a16, transparent: true, opacity: 0, depthWrite: false });
    const flame = new THREE.Mesh(new THREE.SphereGeometry(3.6, 12, 10), flameMat);
    flame.position.y = 3.0;
    g.add(flame);

    // 上沖黑煙柱：幾顆往上排的黑球
    const smokeMats = [];
    const smoke = [];
    for (let i = 0; i < 4; i++) {
      const sm = new THREE.MeshBasicMaterial({
        color: 0x232323, transparent: true, opacity: 0, depthWrite: false });
      smokeMats.push(sm);
      const puff = new THREE.Mesh(new THREE.SphereGeometry(2.0 + i * 0.7, 8, 6), sm);
      puff.position.y = 5 + i * 3.2;
      g.add(puff);
      smoke.push(puff);
    }

    g.visible = false;
    return { group: g, core, coreMat, flame, flameMat, smoke, smokeMats };
  }

  /* ===================================================================
   * API 1：建立
   * =================================================================== */
  S.initAirdrop = function () {
    if (_inited) return;
    const eng = S.engine;
    if (!eng || !eng.scene) return;

    _group = new THREE.Group();
    _group.visible = false;

    // --- 飛行路徑世界座標關鍵點（進場→空降→飛離） ---
    const p0 = eng.project(APPROACH.lng, APPROACH.lat, FLY_ALT);
    const p1 = eng.project(OVER_DZ.lng, OVER_DZ.lat, FLY_ALT);
    const p2 = eng.project(EXIT.lng, EXIT.lat, FLY_ALT + EXIT_CLIMB);
    _path = { p0, p1, p2 };

    // --- 編隊機群（V 形錯開） ---
    _planes = [];
    for (let i = 0; i < FORMATION_N; i++) {
      const built = makeC47();
      // 編隊位移：沿 -X(後方)拉開縱深，左右交錯成 V
      const side = (i % 2 === 0) ? 1 : -1;
      const rank = Math.ceil(i / 2);
      const offset = new THREE.Vector3(
        FORMATION_DX * rank,
        rank * 1.5,                          // 後排略高，避免完全重疊
        FORMATION_DZ * rank * side);
      built.offset = offset;
      built.shotdown = false;     // 預設正常機
      _group.add(built.mesh);
      _planes.push(built);
    }

    // --- 標記被擊落機，並為每架建立一顆墜地火球（落點隨機群方向估算） ---
    for (let k = 0; k < SHOTDOWN_IDX.length; k++) {
      const idx = SHOTDOWN_IDX[k];
      if (idx < 0 || idx >= _planes.length) continue;
      const pl = _planes[idx];
      pl.shotdown = true;
      pl.tHit = T_HIT[k];
      pl.tCrash = T_CRASH[k];
      // 中彈瞬間的機群基準位置（用 tHit 反推 flyProg），作為墜落起點 X/Z；
      // 落點 X/Z 沿前段飛行方向略往前帶一點，Y 取地形高度。
      const hitProg = c01((pl.tHit - T_START) / (T_EXIT - T_START));
      const hb = pathAt(hitProg);
      pl.fallStart = hb.pos.clone().add(pl.offset.clone()
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(-hb.dir.z, hb.dir.x)));
      // 墜地點：自起點沿水平前進方向再帶 30 單位（穩定，非亂數）
      const flat = new THREE.Vector3(hb.dir.x, 0, hb.dir.z);
      if (flat.lengthSq() < 1e-6) flat.set(1, 0, 0);
      flat.normalize();
      const cx = pl.fallStart.x + flat.x * 30;
      const cz = pl.fallStart.z + flat.z * 30;
      const cy = (S.terrain ? S.terrain.heightAt(cx, cz) : 0);
      pl.crashX = cx; pl.crashY = cy; pl.crashZ = cz;
      pl.rollSign = (k % 2 === 0) ? 1 : -1;   // 兩機往不同側翻滾

      const fb = makeFireball();
      fb.group.position.set(cx, cy, cz);
      _group.add(fb.group);
      pl.fireball = fb;
    }

    // --- 傘兵池 ---
    _paras = [];
    for (let i = 0; i < PARA_POOL; i++) {
      const p = makePara(i);
      // 指派到某機與其投放槽位（決定投放時刻 dropT 與落點）
      p.planeIdx = i % FORMATION_N;
      p.slot = Math.floor(i / FORMATION_N);    // 0..PARA_PER_PLANE-1
      p.used = p.slot < PARA_PER_PLANE;
      // 落點（空降區內穩定散佈：用 index 三角函數，不用亂數）
      const lngOff = Math.sin(i * 2.39) * DZ_SPREAD_LNG;
      const latOff = Math.cos(i * 1.77) * DZ_SPREAD_LAT;
      const landWorld = terrainPt(DZ_LNG + lngOff, DZ_LAT + latOff);
      p.landX = landWorld.x; p.landY = landWorld.y; p.landZ = landWorld.z;
      // 水平飄移方向（穩定）
      p.driftX = Math.sin(i * 0.91) * PARA_DRIFT;
      p.driftZ = Math.cos(i * 0.63) * PARA_DRIFT;
      _group.add(p.group);
      _paras.push(p);
    }

    // --- 臨時陣地標記（沿空降區穩定散佈） ---
    _nests = [];
    for (let i = 0; i < NEST_N; i++) {
      const n = makeNest(i);
      const lngOff = Math.sin(i * 1.31 + 0.4) * DZ_SPREAD_LNG * 0.9;
      const latOff = Math.cos(i * 0.97 + 0.2) * DZ_SPREAD_LAT * 0.9;
      const w = terrainPt(DZ_LNG + lngOff, DZ_LAT + latOff);
      n.group.position.set(w.x, w.y + 0.05, w.z);
      _group.add(n.group);
      _nests.push(n);
    }

    eng.scene.add(_group);
    _inited = true;
  };

  /* ===================================================================
   * 內插輔助
   * =================================================================== */
  // clamp01
  function c01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  // 緩入緩出
  function smooth(x) { x = c01(x); return x * x * (3 - 2 * x); }

  /* 沿路徑取機群基準位置與朝向：
   *   prog 0~0.5 → 進場 p0→p1（進場段）
   *   prog 0.5~1 → 空降→飛離 p1→p2
   * 回傳 { pos, dir }（dir 為單位前進向量，用於機首對齊 +X）。 */
  function pathAt(prog) {
    const p0 = _path.p0, p1 = _path.p1, p2 = _path.p2;
    let pos, dir;
    if (prog <= 0.5) {
      const k = smooth(prog / 0.5);
      pos = p0.clone().lerp(p1, k);
      dir = p1.clone().sub(p0);
    } else {
      const k = smooth((prog - 0.5) / 0.5);
      pos = p1.clone().lerp(p2, k);
      dir = p2.clone().sub(p1);
    }
    if (dir.lengthSq() < 1e-6) dir.set(1, 0, 0);
    dir.normalize();
    return { pos, dir };
  }

  /* ===================================================================
   * 被擊落機更新（中彈起火 → 側傾下墜 → 墜地火球 → 殘骸淡出）
   *   時序全由 campaign 小時 t 與 plane 上的 tHit/tCrash 控制：
   *     t  <  tHit         正常飛（由主迴圈處理，不進此函式）
   *     tHit ≤ t < tCrash  墜落段：高度由 fallStart 線性插值到地面 crashY，
   *                        並沿時間加大 roll/pitch 與機首下俯；火光+黑煙拖尾顯示。
   *     t  ≥  tCrash       觸地：機身隱藏，墜地火球膨脹後淡出。
   *   火光閃動用 elapsed(clock)；位移/姿態用 t，固定不亂跳。
   * =================================================================== */
  function updateShotdown(pl, t, elapsed) {
    const tHit = pl.tHit, tCrash = pl.tCrash;
    const fb = pl.fireball;

    if (t >= tCrash) {
      // --- 觸地：機身與機上火煙隱藏，改演墜地火球 ---
      pl.mesh.visible = false;
      if (pl.fire) pl.fire.visible = false;
      for (let s = 0; s < pl.smoke.length; s++) pl.smoke[s].visible = false;

      if (fb) {
        // 火球生命週期：tCrash → tCrash+0.6 膨脹+全亮，之後 ~0.8 淡出
        const age = t - tCrash;
        const grow = c01(age / 0.6);
        const fade = c01(1 - (age - 0.6) / 0.8);   // 0.6h 後開始淡出
        const flick = 0.85 + 0.15 * Math.sin(elapsed * 30);
        const op = c01(grow) * fade;
        fb.group.visible = op > 0.02;
        if (fb.group.visible) {
          const sc = 0.5 + 1.0 * smooth(grow);
          fb.flame.scale.setScalar(sc * flick);
          fb.core.scale.setScalar(sc * 0.7);
          fb.flameMat.opacity = 0.85 * op * flick;
          fb.coreMat.opacity = 0.95 * op;
          // 黑煙柱：隨 age 上升並擴散、緩慢淡出
          for (let s = 0; s < fb.smoke.length; s++) {
            const rise = 1 + age * 1.2;
            fb.smoke[s].scale.setScalar((0.6 + s * 0.25) * (0.6 + 0.6 * grow) * rise);
            fb.smokeMats[s].opacity = 0.5 * c01(grow) * c01(1 - (age - 0.4) / 1.2);
          }
        }
      }
      return;
    }

    // --- 墜落段：tHit → tCrash ---
    pl.mesh.visible = true;
    const k = c01((t - tHit) / (tCrash - tHit));   // 0→1 墜落進度
    const kE = smooth(k);

    // 位置：水平由起點線性帶向墜地點；垂直加速下墜（k^2 讓後段更快）
    const sx = pl.fallStart.x, sz = pl.fallStart.z, sy = pl.fallStart.y;
    const px = sx + (pl.crashX - sx) * kE;
    const pz = sz + (pl.crashZ - sz) * kE;
    const py = sy + (pl.crashY - sy) * (k * k);     // 下墜加速
    pl.mesh.position.set(px, py, pz);

    // 姿態：機首朝水平前進方向(yaw)；側傾 roll 隨 k 增大到約 1.4 rad；
    // 機首下俯 pitch 隨 k 增大（繞 Z 軸負向，因 +X 為機首）。
    const dx = pl.crashX - sx, dz = pl.crashZ - sz;
    const yaw = Math.atan2(-dz, dx);
    const roll = pl.rollSign * (0.2 + 1.2 * kE);     // 側翻
    const pitch = -(0.1 + 0.9 * kE);                 // 機首下俯（繞 Z）
    // 順序：先 yaw(Y) 再 pitch(Z) 再 roll(X)，用 Euler 'YZX'
    pl.mesh.rotation.set(roll, yaw, pitch, 'YZX');

    // 螺旋槳：中彈後一具卡死、一具仍轉（視覺受創感）
    for (let s = 0; s < pl.props.length; s++) {
      if (s === 0) pl.props[s].rotation.x = elapsed * (22 - 18 * kE);  // 漸慢
      // s===1 維持原角度（卡死）
    }

    // 火光：機身受創處跳動（scale/opacity 由 clock 閃動）
    if (pl.fire) {
      pl.fire.visible = true;
      const flick = 0.6 + 0.4 * Math.abs(Math.sin(elapsed * 18 + 1.3));
      pl.fire.scale.setScalar((0.8 + 0.7 * k) * (0.7 + 0.5 * flick));
      pl.fireMat.opacity = (0.55 + 0.35 * flick);
    }

    // 黑煙拖尾：隨墜落進度漸濃、漸長（越後的 puff 越淡）
    for (let s = 0; s < pl.smoke.length; s++) {
      pl.smoke[s].visible = true;
      const tailFade = 1 - s / pl.smoke.length;
      pl.smokeMats[s].opacity = c01(0.15 + 0.6 * k) * (0.4 + 0.6 * tailFade);
      const puffFlick = 1 + 0.12 * Math.sin(elapsed * 8 + s);
      pl.smoke[s].scale.setScalar((0.5 + 0.9 * k) * (0.7 + s * 0.12) * puffFlick);
    }
  }

  /* ===================================================================
   * API 2：更新
   * =================================================================== */
  S.updateAirdrop = function (t) {
    if (!_inited) return;

    // 整體可見範圍：序列窗 [T_HIDE_LO, T_HIDE_HI] 或臨時陣地窗 [.., T_NEST_GONE]
    const inSeq = (t >= T_HIDE_LO && t <= T_HIDE_HI);
    const inNest = (t >= T_NEST_IN && t <= T_NEST_GONE);
    if (!inSeq && !inNest) {
      if (_group.visible) _group.visible = false;
      return;
    }
    _group.visible = true;

    const elapsed = (S.engine && S.engine.clock) ? S.engine.clock.getElapsedTime() : 0;

    /* ---------- 1. 機群飛行 ---------- */
    // 機群飛行進度：T_START→T_EXIT 映射到 0→1
    const flyProg = c01((t - T_START) / (T_EXIT - T_START));
    const planesVisible = (t >= T_START && t <= T_EXIT + 0.05);
    const base = pathAt(flyProg);

    // 由前進向量算 yaw（繞 Y），讓機首(+X)對齊飛行方向
    const yaw = Math.atan2(-base.dir.z, base.dir.x);
    // 投畢轉向的視覺 roll（飛離段做一點傾側）
    const roll = (flyProg > 0.55) ? -0.18 * smooth((flyProg - 0.55) / 0.45) : 0;

    for (let i = 0; i < _planes.length; i++) {
      const pl = _planes[i];

      // === 被擊落機：中彈後走獨立墜落分支，不沿用正常飛行/編隊邏輯 ===
      if (pl.shotdown && t >= pl.tHit) {
        updateShotdown(pl, t, elapsed);
        continue;
      }

      pl.mesh.visible = planesVisible;
      if (!planesVisible) continue;
      // 編隊 offset 需隨機群朝向旋轉，才能維持 V 形相對機首方向
      const off = pl.offset.clone();
      off.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
      pl.mesh.position.copy(base.pos).add(off);
      pl.mesh.rotation.set(0, yaw, roll);
      // 螺旋槳自轉（繞各自 +X，用 clock 連續旋轉）
      for (let s = 0; s < pl.props.length; s++) {
        pl.props[s].rotation.x = elapsed * 22 + s * 1.5;
      }
    }

    /* ---------- 2. 傘兵投放與緩降 ---------- */
    for (let i = 0; i < _paras.length; i++) {
      const p = _paras[i];
      if (!p.used) { p.group.visible = false; continue; }

      // 該兵的投放時刻：投放窗 [T_DROP0,T_DROP1] 內依 slot 均分，
      // 不同機略錯開，形成連續 stick。
      const slotFrac = PARA_PER_PLANE > 1 ? p.slot / (PARA_PER_PLANE - 1) : 0;
      const planeFrac = FORMATION_N > 1 ? p.planeIdx / (FORMATION_N - 1) : 0;
      const dropT = T_DROP0 + (T_DROP1 - T_DROP0) * (0.15 * planeFrac + 0.8 * slotFrac);

      // 緩降進度：dropT → dropT+PARA_FALL_TIME 映射 0→1
      const fall = (t - dropT) / PARA_FALL_TIME;

      if (t < dropT || fall < 0) {
        // 尚未投放
        p.group.visible = false;
        continue;
      }
      if (fall >= 1) {
        // 已落地：傘兵站定、傘蓋收起消失（臨時陣地接手）
        p.group.visible = true;
        p.canopy.visible = false;
        p.cordMat.opacity = 0;
        p.group.position.set(p.landX, p.landY, p.landZ);
        p.group.rotation.set(0, i * 0.7, 0);   // 落地朝向（穩定）
        // 落地後一小段時間淡出，交給臨時陣地
        const after = t - (dropT + PARA_FALL_TIME);
        const fade = c01(1 - after / 0.5);
        p.group.visible = fade > 0.02;   // 落地後約 0.5h 內淡出，交給臨時陣地
        continue;
      }

      // 空中緩降：投放點(機腹，飛行高度)→落點(地形表面)，含水平飄移。
      // 投放當時的機群位置（用 dropT 對應的 flyProg 反推，近似為當時機群基準位置）
      const dropFlyProg = c01((dropT - T_START) / (T_EXIT - T_START));
      const dropBase = pathAt(dropFlyProg).pos;
      const startX = dropBase.x, startY = dropBase.y, startZ = dropBase.z;

      const k = fall;                      // 0..1
      const kE = smooth(k);                // 緩降曲線
      // 水平：起點到落點 + 飄移（飄移隨高度衰減）
      const px = startX + (p.landX + p.driftX - startX) * kE;
      const pz = startZ + (p.landZ + p.driftZ - startZ) * kE;
      // 垂直：開傘後近等速下降（略呈緩降）
      const py = startY + (p.landY - startY) * kE;

      p.group.visible = true;
      p.canopy.visible = true;
      p.canopy.scale.setScalar(0.4 + 0.6 * c01(k * 4));  // 開傘張開動畫(前段快速張開)
      p.cordMat.opacity = 0.8;
      // 緩降時隨風微擺（用 elapsed + index 穩定相位）
      const sway = Math.sin(elapsed * 1.6 + i) * 0.12;
      p.group.position.set(px, py, pz);
      p.group.rotation.set(sway, i * 0.7, sway * 0.6);
    }

    /* ---------- 3. 臨時陣地淡入/淡出 ---------- */
    let nestOp;
    if (t < T_NEST_IN) nestOp = 0;
    else if (t < T_NEST_FULL) nestOp = smooth((t - T_NEST_IN) / (T_NEST_FULL - T_NEST_IN));
    else if (t < T_NEST_OUT) nestOp = 1;
    else if (t < T_NEST_GONE) nestOp = 1 - smooth((t - T_NEST_OUT) / (T_NEST_GONE - T_NEST_OUT));
    else nestOp = 0;

    for (let i = 0; i < _nests.length; i++) {
      const n = _nests[i];
      const vis = nestOp > 0.02;
      n.group.visible = vis;
      if (!vis) continue;
      for (let m = 0; m < n.mats.length; m++) n.mats[m].opacity = nestOp;
    }
  };
})(window.SEKI);
