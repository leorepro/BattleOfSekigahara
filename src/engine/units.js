/* =========================================================================
 * src/engine/units.js — 部隊建模 + 時間軸內插 + 飄動幟旗 + 方向箭頭 + 防重疊
 *   buildUnits()        依 SEKI.armies 建立旗組（含家紋幟旗、箭頭、點選 hitbox）
 *   sampleTrack(tk, t)  關鍵影格間內插 {lng,lat,s,st}
 *   updateUnits(t)      更新位置/兵力/潰滅、移動箭頭、防重疊分離
 *   waveFlags(time)     幟旗布面正弦飄動
 *   firePoints()/getPickables()/sideStrength()  供特效/點選/儀表
 * ======================================================================= */
window.SEKI = window.SEKI || {};

(function (S) {
  const EAST = 0x1c46d2, WEST = 0xd11418;        // 軍隊色：加深 + 提高彩度（在亮底圖上更突出）
  const FW = 2, FH = 3.2, POLE_H = 8.5;          // 軍旗縮小為陣型上方識別旗
  let _units = [];
  let _focus = null;                       // Set of 聚焦 unit id；null = 全部正常

  S.setFocus = function (ids) { _focus = (ids && ids.length) ? new Set(ids) : null; };
  S.isFocused = function (id) { return !_focus || _focus.has(id); };
  S.hasFocus = function () { return !!_focus; };

  function fmt(n) { return Math.round(n).toLocaleString('en-US'); }

  /* ---- 現代軍種徽章 SVG icon（viewBox 0 0 24 24，單色近白 #fff）----
     辨識度高、節點少；只對有對照的 kind 生效，其餘 kind（戰國 command/cavalry/matchlock…）
     會在下方 fallback 回原本文字，故戰國頁面行為不變。 */
  const KSVG = {
    // 軍艦：船身梯形剪影 + 上層艦橋
    warship: '<svg viewBox="0 0 24 24"><path d="M2 14h20l-2.5 5H4.5L2 14zm4-2V8h3v4H6zm5 0V5h2v7h-2zm4 0V8h3v4h-3z"/></svg>',
    // 登陸艇：方頭船身 + 放下的跳板
    landingcraft: '<svg viewBox="0 0 24 24"><path d="M3 8h13v8H3V8zm13 1h5l-5 6V9zM2 17h20v2H2v-2z"/></svg>',
    // 飛機：上視機身 + 後掠機翼
    aircraft: '<svg viewBox="0 0 24 24"><path d="M11 2c.6 0 1 .8 1 2v5l9 5v2l-9-2v4l3 2v1l-4-1-4 1v-1l3-2v-4l-9 2v-2l9-5V4c0-1.2.4-2 1-2z"/></svg>',
    // 戰車：履帶車身 + 砲塔 + 前伸砲管
    armor: '<svg viewBox="0 0 24 24"><path d="M3 13h16v4H3v-4zm2-3h7v3H5v-3zm6 1h11v1.5H12V11zM4 18h14v1.5H4V18z"/></svg>',
    // 碉堡：梯形掩體 + 中央射口
    bunker: '<svg viewBox="0 0 24 24"><path d="M4 18l3-9h10l3 9H4zm6.5-5h3v2.5h-3V13z"/></svg>',
    // 高射砲：朝天斜指的砲管 + 底座
    flak: '<svg viewBox="0 0 24 24"><path d="M5 19h8v2H5v-2zm1-3h6l1 2H7l-1-2zm3-1l8-12 1.8 1.2-8 12L9 15z"/></svg>',
    // 步兵：鋼盔剪影
    infantry: '<svg viewBox="0 0 24 24"><path d="M12 5c5 0 8 3.5 8 8H2c0-1 .5-2 1.5-2H4c0-3.6 3.4-6 8-6zm-10 8h20v2H2v-2z"/></svg>',
    // 野砲：大車輪 + 後拉的長砲管
    artillery: '<svg viewBox="0 0 24 24"><path d="M7 17a4 4 0 110-8 4 4 0 010 8zm0-2.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM10 11l11-3 .6 2-11 3L10 11zm-3 6h12v2H7v-2z"/></svg>'
  };

  // 關鍵影格間取樣；ctrls[i] 存在則該段沿二次貝茲曲線(繞地形)行進，否則直線。
  S.sampleTrack = function (track, t, ctrls) {
    if (t <= track[0].t) return { ...track[0] };
    const last = track[track.length - 1];
    if (t >= last.t) return { ...last };
    for (let i = 0; i < track.length - 1; i++) {
      const a = track[i], b = track[i + 1];
      if (t >= a.t && t <= b.t) {
        const k = (t - a.t) / (b.t - a.t);
        const C = ctrls && ctrls[i];
        if (C) {                                   // 二次貝茲：A→控制點→B（彎過高地）
          const u = 1 - k;
          return { lng: u*u*a.lng + 2*u*k*C.lng + k*k*b.lng,
                   lat: u*u*a.lat + 2*u*k*C.lat + k*k*b.lat,
                   s: a.s+(b.s-a.s)*k, st: a.st };
        }
        return { lng:a.lng+(b.lng-a.lng)*k, lat:a.lat+(b.lat-a.lat)*k,
                 s:a.s+(b.s-a.s)*k, st:a.st };
      }
    }
    return { ...last };
  };

  /* ---- 地形感知路徑：為每段移動算一個讓「沿途最高點最低」的控制點 ----
     部隊因此自動繞開丘陵、沿低處(谷地/道路走廊)行進；平地則維持近直線。 */
  function elevAt(lng, lat) {
    const p = S.engine.project(lng, lat, 0);
    return S.terrain ? S.terrain.heightAt(p.x, p.z) : 0;
  }
  // 路徑成本：偏好低地(谷地/平原)，但懲罰水域(避免被拉進海/湖)與高地。
  const SEA_Y = 0.5;        // 場景 Y 低於此視為水域
  const WATER_PENALTY = 60; // 經過水域的重罰
  function pathCost(A, B, C) {
    let sum = 0, n = 0;
    for (let s = 0; s <= 1.0001; s += 0.1) {
      let lng, lat;
      if (C) { const u = 1 - s; lng = u*u*A.lng + 2*u*s*C.lng + s*s*B.lng;
               lat = u*u*A.lat + 2*u*s*C.lat + s*s*B.lat; }
      else { lng = A.lng + (B.lng-A.lng)*s; lat = A.lat + (B.lat-A.lat)*s; }
      const e = elevAt(lng, lat);
      sum += (e < SEA_Y ? WATER_PENALTY : e);      // 水域重罰；陸地以高度為成本(偏好低處)
      n++;
    }
    return sum / n;
  }
  S.precomputeRoutes = function () {
    for (const a of S.armies) {
      const tk = a.track;
      a._ctrl = new Array(tk.length - 1).fill(null);
      for (let i = 0; i < tk.length - 1; i++) {
        const A = tk[i], B = tk[i + 1];
        const cosLat = Math.cos(A.lat * Math.PI / 180);
        const dxm = (B.lng - A.lng) * cosLat, dym = (B.lat - A.lat);
        const segM = Math.hypot(dxm, dym);
        if (segM < 0.0045) continue;                 // 太短(~<450m)不彎
        const pxm = -dym / segM, pym = dxm / segM;    // 公制空間中的垂直單位向量
        const mid = { lng: (A.lng+B.lng)/2, lat: (A.lat+B.lat)/2 };
        const straight = pathCost(A, B, null);
        let bestCost = straight, best = null;
        for (const off of [0.12, 0.20, 0.28, -0.12, -0.20, -0.28]) {
          const C = { lng: mid.lng + (pxm*off*segM)/cosLat, lat: mid.lat + (pym*off*segM) };
          const cost = pathCost(A, B, C);
          // 須明顯較佳、且本身不經水域，才採用此彎道
          if (cost < bestCost * 0.92 && cost < WATER_PENALTY * 0.5) { bestCost = cost; best = C; }
        }
        a._ctrl[i] = best;
      }
    }
  };

  /* ---- 精緻方向指示：流動雪佛龍 (chevron) 方向箭頭 ----
     用實體幾何取代陽春的 THREE.ArrowHelper，外觀更俐落且有「流動感」：
       · 一條貼地略抬高的發光「軌道」(箭身)，加色彩漸層 + Additive 發光。
       · 三枚朝行進方向的尖頭雪佛龍，沿軌道向前脈動流動 (用 clock 驅動)。
       · 前端一支俐落的箭頭三角。
     維持與舊 u.arrow 相同呼叫介面（.visible / .position / setDirection / setLength），
     方向沿用呼叫端傳入的世界向量，方向邏輯不變；update(elapsed) 每幀驅動流動。
     全程僅用 bundled three.js 基本幾何 (Plane/Shape/Buffer)，不用 CapsuleGeometry/BufferGeometryUtils。 */
  function makeMoveArrow(color) {
    const root = new THREE.Group();
    root.visible = false;

    // 軌道貼地，整組在 XZ 平面構圖、以 root.rotation.y 對齊方向（+X 為前方，與 atan2(-dz,dx) 一致）。
    const W = 1.7;                 // 箭身寬度（半寬 W/2）
    let LEN = 9;                   // 由 setLength 設定的總長度（沿用舊預設）

    // 1) 漸層發光軌道：用頂點色讓尾端淡、前端亮，Additive 疊加在亮底圖上仍鮮明。
    const trail = new THREE.Mesh(
      new THREE.PlaneGeometry(1, W, 1, 1),
      new THREE.MeshBasicMaterial({
        color, transparent: true, opacity: 0.32, depthWrite: false,
        blending: THREE.AdditiveBlending, side: THREE.DoubleSide, vertexColors: true }));
    {
      // 四頂點順序 (PlaneGeometry 1x1)：左上,右上,左下,右下 → 以 x 區分頭尾，尾端較暗。
      const c = new THREE.Color(color), dark = c.clone().multiplyScalar(0.25);
      const cols = new Float32Array(4 * 3), pos = trail.geometry.attributes.position;
      for (let i = 0; i < 4; i++) {
        const head = pos.getX(i) > 0;                 // +x 端為頭（亮）
        const col = head ? c : dark;
        cols[i*3] = col.r; cols[i*3+1] = col.g; cols[i*3+2] = col.b;
      }
      trail.geometry.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    }
    trail.rotation.x = -Math.PI / 2;                  // 平躺於地面
    root.add(trail);

    // 雪佛龍 / 箭頭外形：以 Shape 擠出薄片，做一個「ᐅ」形尖角。
    function chevronGeo(size, thick) {
      const sh = new THREE.Shape();
      const h = size, w = size * 0.78, t = thick;     // h:沿前進方向長度  w:半展寬  t:臂厚
      sh.moveTo(h, 0);
      sh.lineTo(h - t, w * 0.0);
      sh.lineTo(0, w);
      sh.lineTo(-t, w);
      sh.lineTo(h - t * 2, 0);
      sh.lineTo(-t, -w);
      sh.lineTo(0, -w);
      sh.lineTo(h - t, 0);
      sh.closePath();
      const g = new THREE.ShapeGeometry(sh);
      g.rotateX(-Math.PI / 2);                         // 攤平到 XZ 平面
      return g;
    }

    // 2) 三枚流動雪佛龍
    const chevs = [];
    const chevGeo = chevronGeo(1.5, 0.55);
    for (let i = 0; i < 3; i++) {
      const m = new THREE.Mesh(chevGeo, new THREE.MeshBasicMaterial({
        color, transparent: true, opacity: 0.9, depthWrite: false,
        blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
      m.position.y = 0.05;
      root.add(m); chevs.push(m);
    }

    // 3) 前端俐落箭頭（較大的雪佛龍，固定在頭部）
    const tip = new THREE.Mesh(chevronGeo(2.4, 0.9), new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: 1, depthWrite: false,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    tip.position.y = 0.06;
    root.add(tip);

    function applyLen(len) {
      LEN = len;
      // 軌道沿 +X 鋪設，從尾(-)到頭：以 scale 拉伸長度、平移使頭端落在 len*0.5 附近。
      trail.scale.set(len, 1, 1);
      trail.position.set(0, 0.02, 0);
      tip.position.x = len * 0.5;
    }
    applyLen(LEN);

    return {
      root,
      get visible() { return root.visible; },
      set visible(v) { root.visible = v; },
      position: root.position,                          // 直接沿用 Group.position（呼叫端 .position.set 即可）
      setDirection(dirVec) {
        // dirVec 為世界 XZ 方向（呼叫端已 normalize）；轉成繞 Y 的角度（+X 前方）。
        root.rotation.y = Math.atan2(-dirVec.z, dirVec.x);
      },
      setLength(len /*, headLen, headWidth */) { applyLen(len); },
      // 流動動畫：雪佛龍沿 [-0.5,+0.4]*LEN 區間循環前移，並用 sin 做亮度脈動。
      update(elapsed) {
        if (!root.visible) return;
        const span = LEN * 0.9, back = -LEN * 0.5;
        const speed = 0.9;                              // 流速（每秒循環比例）
        for (let i = 0; i < chevs.length; i++) {
          let f = ((elapsed * speed) + i / chevs.length) % 1;   // 0..1 相位
          chevs[i].position.x = back + f * span;
          // 越接近頭端越亮、進出兩端淡入淡出，營造流動湧向前方的感覺。
          const fade = Math.sin(f * Math.PI);
          chevs[i].material.opacity = 0.25 + 0.65 * fade;
          chevs[i].scale.setScalar(0.7 + 0.5 * f);
        }
        // 箭頭尖端輕微呼吸脈動。
        tip.material.opacity = 0.78 + 0.22 * Math.sin(elapsed * 4);
      }
    };
  }

  S.buildUnits = function () {
    const eng = S.engine;
    _units = [];
    for (const a of S.armies) {
      const color = a.side === 'east' ? EAST : WEST;
      const group = new THREE.Group();

      const MODERN = !!(S.config && S.config.modern);
      let flag = null, fmat = null, pole = null, body = null, fadeMats = [];
      if (MODERN && S.buildUnitMesh) {
        body = S.buildUnitMesh(a.kind, a.side, color);
        group.add(body);
        fadeMats = body.userData.fadeMats || [];
      } else {
        pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.12, POLE_H, 8),
          new THREE.MeshStandardMaterial({ color: 0x241c12, roughness: 0.85 }));
        pole.position.y = POLE_H / 2; pole.castShadow = true; group.add(pole);

        const fgeo = new THREE.PlaneGeometry(FW, FH, 14, 2);
        // phalanx（溫泉關）/ napoleonic（奧斯特利茨）：不用日式家紋——改陣營專屬色純色軍旗（無 crest 貼圖）。
        // 前三場無 formationStyle → 仍走家紋幟旗，零影響。
        const PHALANX = !!(S.config && (S.config.formationStyle === 'phalanx' || S.config.formationStyle === 'napoleonic'));
        fmat = PHALANX
          ? new THREE.MeshStandardMaterial({
              color: (a.factionColor != null) ? a.factionColor : (a.side === 'east' ? EAST : WEST),
              emissive: (a.factionColor != null) ? a.factionColor : (a.side === 'east' ? EAST : WEST),
              emissiveIntensity: 0.2, side: THREE.DoubleSide, roughness: 0.7, transparent: true })
          : new THREE.MeshStandardMaterial({
              map: S.flagTexture(a.crest, a.side), side: THREE.DoubleSide,
              roughness: 0.7, transparent: true });
        flag = new THREE.Mesh(fgeo, fmat);
        flag.castShadow = true;
        flag.position.set(FW / 2 + 0.2, POLE_H - FH / 2 - 0.5, 0);
        flag.userData.base = Float32Array.from(fgeo.attributes.position.array);
        // 主帥本陣大旗：拿破崙(法軍 command)用金色加大旗，凸顯統帥位置。
        if (S.config && S.config.formationStyle === 'napoleonic' && a.kind === 'command') {
          const isFr = a.side === 'east';
          const sc = isFr ? 1.7 : 1.3;
          flag.scale.set(sc, sc, 1);
          flag.position.x = FW * sc / 2 + 0.2;
          if (isFr) { fmat.color.setHex(0xd4b24a); if (fmat.emissive) { fmat.emissive.setHex(0xd4b24a); fmat.emissiveIntensity = 0.35; } }
        }
        group.add(flag);
        fadeMats = [fmat, pole.material];
      }

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(2.2, 3.0, 36),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55, side: THREE.DoubleSide }));
      ring.rotation.x = -Math.PI / 2; ring.position.y = 0.25; group.add(ring);
      if (MODERN && a.kind === 'aircraft') ring.visible = false;   // 飛機在空中，地面選擇環無意義

      // 點選 hitbox（透明）
      const hit = new THREE.Mesh(
        new THREE.BoxGeometry(6, POLE_H + 4, 6),
        new THREE.MeshBasicMaterial({ visible: false }));
      hit.position.y = (POLE_H + 4) / 2; group.add(hit);

      const el = document.createElement('div');
      el.className = `lbl lbl-unit side-${a.side}`;
      const KICON = (S.config && S.config.kindIcons) || { command:'本', artillery:'砲', matchlock:'銃', cavalry:'騎', infantry:'槍' };
      // SVG 圖形 icon 僅用於現代戰役（諾曼第）——其 .kbadge svg CSS 只定義於 normandy.html；
      // 戰國（關原/桶狹間）維持文字 fallback，避免無 CSS 的 SVG 破圖。
      const useSvg = !!(S.config && S.config.modern);
      const kmark = (useSvg && KSVG[a.kind]) || (KICON[a.kind] || '槍');
      // 名牌直接標出「軍種·兵種」文字，讓觀看者一眼看懂(如遊騎兵=陸·步兵)；僅現代戰役
      const ARMTAG = { warship:'海·艦砲', landingcraft:'海·登陸艇', aircraft:'空·航空兵',
        armor:'陸·戰車', bunker:'陸·岸防', flak:'陸·高射砲', infantry:'陸·步兵', artillery:'陸·砲兵' };
      const armtag = (useSvg && ARMTAG[a.kind]) ? ` <span class="armtag">${ARMTAG[a.kind]}</span>` : '';
      el.innerHTML =
        `<div><span class="kbadge k-${a.kind}" title="${a.kind}">${kmark}</span>` +
        `${a.name_zh}<span class="ja"> ${a.name_ja}</span>${armtag}</div>` +
        `<div class="hp"><i></i></div><div class="troops"></div>`;
      const tag = new THREE.CSS2DObject(el);
      tag.position.set(0, POLE_H + 2.5 + (_units.length % 4) * 3.6, 0); group.add(tag); // 錯開避免重疊

      eng.scene.add(group);

      // 移動方向箭頭（世界座標）：精緻流動雪佛龍，沿用 u.arrow 介面
      const arrow = makeMoveArrow(color);
      arrow.visible = false; eng.scene.add(arrow.root);

      const u = { data:a, group, flag, fmat, ring, pole, hit, el, body, fadeMats,
        yoff: (MODERN && a.kind === 'aircraft') ? 26 : 0,                 // 飛機飛行高度
        ramp: (body && body.getObjectByName) ? body.getObjectByName('ramp') : null,
        troopsEl: el.querySelector('.troops'), hpEl: el.querySelector('.hp i'),
        arrow, p: new THREE.Vector3() };
      hit.userData.unit = u;
      _units.push(u);
    }
    S.precomputeRoutes();          // 依地形預算各部隊路徑控制點（繞開丘陵）
    return _units;
  };

  const ST_LABEL = { hold:'布陣', march:'行軍', attack:'交戰', rout:'潰走', breakthrough:'突破', charge:'衝鋒', square:'方陣' };

  S.updateUnits = function (t) {
    const eng = S.engine;
    // 1) 取樣位置
    for (const u of _units) {
      const s = S.sampleTrack(u.data.track, t, u.data._ctrl);
      const p = eng.project(s.lng, s.lat, 0);
      const y = S.terrain ? S.terrain.heightAt(p.x, p.z) : 0;
      u.p.set(p.x, y, p.z); u.cur = s;
      // 移動方向：比較稍後時刻
      const s2 = S.sampleTrack(u.data.track, t + 0.12, u.data._ctrl);
      u.moveDir = { dx: s2.lng - s.lng, dz: -(s2.lat - s.lat) };
    }
    // 2) 防重疊（XZ 平面分離，數次迭代）
    //    敵對雙方保持「火線間距」(config.standoff)：線列步兵/砲兵隔開互轟，不互相覆蓋穿插；
    //    但衝鋒/突破/潰逃者貼身接戰(closing)不套用間距，讓騎兵能撞進敵陣。
    const MIN_SAME = 8.5;
    const STANDOFF = (S.config && S.config.standoff) || MIN_SAME;
    const closingRe = /charge|breakthrough|rout/;
    for (let it = 0; it < 6; it++) {
      for (let i = 0; i < _units.length; i++) for (let j = i + 1; j < _units.length; j++) {
        const UA = _units[i], UB = _units[j], A = UA.p, B = UB.p;
        let dx = B.x - A.x, dz = B.z - A.z;
        let d = Math.hypot(dx, dz) || 0.01;
        const opposing = UA.data.side !== UB.data.side;
        const closing = closingRe.test((UA.cur && UA.cur.st) || '') || closingRe.test((UB.cur && UB.cur.st) || '');
        const min = (opposing && !closing) ? STANDOFF : MIN_SAME;
        if (d < min) { const push = (min - d) / 2 / d; dx *= push; dz *= push;
          A.x -= dx; A.z -= dz; B.x += dx; B.z += dz; }
      }
    }
    // 3) 套用
    const elapsed = (eng.clock ? eng.clock.getElapsedTime() : t);   // 流動箭頭動畫時鐘
    for (const u of _units) {
      // 空降部隊落地前(spawnAt)隱藏整個單位（含 CSS2D 名牌），由空降動畫呈現其空投過程；落地後才現身
      const spawned = u.data.spawnAt == null || t >= u.data.spawnAt;
      u.group.visible = spawned;
      if (u.el) u.el.style.display = spawned ? '' : 'none';
      if (!spawned) { if (u.arrow) u.arrow.visible = false; continue; }
      const s = u.cur;
      const y = S.terrain ? S.terrain.heightAt(u.p.x, u.p.z) : 0;
      u.group.position.set(u.p.x, y + (u.yoff || 0), u.p.z);
      // 現代模型轉向：移動者面向移動方向；靜止開火者（碉堡/砲/泊船）面向戰場中心(灘頭/岸)
      if (u.body) {
        let dx = u.moveDir.dx, dz = u.moveDir.dz;
        if (Math.hypot(dx, dz) < 1e-5) { dx = -u.p.x; dz = -u.p.z; }   // 靜止 → 朝向中心
        if (Math.hypot(dx, dz) > 1e-5) {
          const target = Math.atan2(-dz, dx);                          // 模型 +X 為前方（與 arrow 一致）
          let d = target - u.body.rotation.y;
          while (d > Math.PI) d -= 2 * Math.PI;
          while (d < -Math.PI) d += 2 * Math.PI;
          u.body.rotation.y += d * 0.2;                                // 平滑轉向，避免抖動
        }
        // 登陸艇搶灘 → 放下前跳板
        if (u.ramp) u.ramp.rotation.z = (s.st === 'attack' || s.st === 'breakthrough') ? -1.15 : 0;
      }

      const dead = s.s <= 1;
      const op = dead ? 0.12 : 1;
      // 聚焦突顯：本鏡相關武將全亮，其餘淡化
      const isFocus = !!_focus && _focus.has(u.data.id);
      const isDim = !!_focus && !isFocus;
      const emph = isDim ? 0.3 : 1;
      for (const m of u.fadeMats) { m.transparent = true; m.opacity = op * emph; }
      // 倒戈視覺：金色旗環 + 「⚡裏切」標示
      const defected = u.data.defectAt != null && t >= u.data.defectAt;
      u.defected = defected;
      u.el.classList.toggle('defected', defected);
      u.ring.material.color.setHex(defected ? 0xffc23a : (u.data.side === 'east' ? EAST : WEST));
      if (u.flag && defected && !u._flagFlipped) {       // 倒戈後軍旗底色翻藍（modern 無旗）
        u._flagFlipped = true;
        u.fmat.map = S.flagTexture(u.data.crest, 'east'); u.fmat.needsUpdate = true;
      }
      u.ring.material.opacity = (dead ? 0 : (s.st === 'attack' ? 0.8 : 0.5)) * emph;
      u.troopsEl.innerHTML = (dead ? `<span style="opacity:.7">潰滅</span>`
        : `${fmt(s.s)} <span style="opacity:.65">${ST_LABEL[s.st] || ''}</span>`)
        + (defected && !dead ? ` <span style="color:#ffd24a">⚡裏切</span>` : '');
      u.el.style.opacity = (dead ? 0.45 : 1) * (isDim ? 0.35 : 1);
      u.el.classList.toggle('focus', isFocus);
      u.el.classList.toggle('dim', isDim);
      // 血條：兵力 / 初始兵力
      if (u.hpEl) {
        const pct = Math.max(0, Math.min(100, (s.s / u.data.troops) * 100));
        u.hpEl.style.width = pct + '%';
        u.hpEl.classList.toggle('low', pct < 40);
      }

      // 箭頭：行軍/交戰/突破且確有位移時顯示
      const moving = !dead && (s.st === 'march' || s.st === 'attack' || s.st === 'breakthrough' || s.st === 'charge' || s.st === 'rout');
      const mag = Math.hypot(u.moveDir.dx, u.moveDir.dz);
      if (moving && mag > 1e-5) {
        u.arrow.visible = true;
        u.arrow.position.set(u.p.x, y + 1.5, u.p.z);
        u.arrow.setDirection(new THREE.Vector3(u.moveDir.dx, 0, u.moveDir.dz).normalize());
        u.arrow.setLength(9, 3, 2);
        // 流動雪佛龍動畫：用全域 clock 連續驅動（靜止時隱藏不更新，零開銷）
        if (u.arrow.update) u.arrow.update(elapsed);
      } else u.arrow.visible = false;
    }
  };

  S.waveFlags = function (time) {
    for (const u of _units) {
      if (!u.flag) continue;                             // modern 單位無布面，免飄動
      const g = u.flag.geometry, pos = g.attributes.position, base = u.flag.userData.base;
      for (let i = 0; i < pos.count; i++) {
        const x = base[i*3], y = base[i*3+1];
        const factor = (x + FW/2) / FW;
        pos.setZ(i, Math.sin(x*1.6 + y*0.6 + time*4) * 0.45 * factor);
      }
      pos.needsUpdate = true; g.computeVertexNormals();
    }
  };

  // 取「該攻擊單位當前交戰對象」的即時世界座標（供艦砲/空襲/戰車對齊真實目標）。
  //   依 SEKI.engagements：找一筆 t 落在 [from,to]、且雙方仍存活、含本單位的交戰，
  //   回傳對手單位的 group.position；找不到回 null（特效端退回原本朝前方落彈）。
  function engagementTarget(u, t) {
    const list = S.engagements;
    if (!list || t == null) return null;
    const id = u.data.id;
    for (const e of list) {
      if (e.a !== id && e.b !== id) continue;
      if (t < e.from || t > e.to) continue;
      const A = S.unitById(e.a), B = S.unitById(e.b);
      if (!A || !B) continue;
      const sA = A.cur ? A.cur.s : 0, sB = B.cur ? B.cur.s : 0;
      if (sA <= 1 || sB <= 1) continue;             // 任一方潰滅則此交戰不成立
      const foe = (e.a === id) ? B : A;             // 對手 = 交戰另一方
      const p = foe.group.position;
      return { x:p.x, y:p.y, z:p.z };
    }
    return null;
  }

  S.firePoints = function (t) {
    const out = [];
    for (const u of _units) {
      const st = u.cur && u.cur.st;
      if (st === 'attack' || st === 'breakthrough' || st === 'charge')
        out.push({ x:u.group.position.x, y:u.group.position.y, z:u.group.position.z,
                   side:u.data.side, kind:u.data.kind || 'infantry', moveDir:u.moveDir,
                   target: engagementTarget(u, t) });   // 交戰對象即時座標（無則 null）
    }
    return out;
  };

  S.getPickables = function () { return _units.map(u => u.hit); };

  // 依 id 取部隊（供交戰配對）
  S.unitById = function (id) { return _units.find(u => u.data.id === id) || null; };

  // 雙方目前總兵力
  S.sideStrength = function () {
    let east = 0, west = 0;
    for (const u of _units) {
      const s = Math.max(u.cur ? u.cur.s : u.data.troops, 0);
      const isEast = (u.data.side === 'east') || u.defected;   // 倒戈後計入東軍
      if (isEast) east += s; else west += s;
    }
    return { east, west };
  };

  // 雙方累積陣亡：某單位陣亡 = max(0, 「至今投入過的峰值兵力」 - 當前兵力)。
  //   ※ 以「峰值」而非「初始 troops」為基準，是為了正確處理『逐步抵達戰場』的部隊
  //      （空降師、增援縱隊：track 起始 s 遠低於 troops 並隨時間上升）——它們尚未抵達
  //      的兵力不該被誤算成陣亡，否則開場就憑空冒出上萬「陣亡」且隨抵達而遞減（非單調）。
  //      峰值取「t 之前已抵達的關鍵影格中的最大 s」，部隊集結期間 current≈peak → 陣亡=0，
  //      開始受創後 peak 固定、current 下降 → 陣亡單調攀升。
  //   無 cur（尚未取樣）視為未損失=0；倒戈者依當下陣營歸戶（諾曼第無倒戈）。
  //   eastInit/westInit 回傳各方初始總兵力(troops)，作為 UI 填充比例的穩定分母。
  S.sideCasualties = function () {
    const t = (S.player && S.player.time != null) ? S.player.time : Infinity;
    let east = 0, west = 0, eastInit = 0, westInit = 0;
    for (const u of _units) {
      const init = u.data.troops || 0;
      const tk = u.data.track;
      let peak = tk[0].s;                                        // 至今投入過的峰值兵力
      for (let i = 0; i < tk.length && tk[i].t <= t; i++) peak = Math.max(peak, tk[i].s);
      const cur = u.cur ? u.cur.s : peak;                        // 無 cur → 未損失
      const dead = Math.max(0, peak - cur);
      const isEast = (u.data.side === 'east') || u.defected;
      if (isEast) { east += dead; eastInit += init; }
      else { west += dead; westInit += init; }
    }
    return { east, west, eastInit, westInit };
  };
})(window.SEKI);
