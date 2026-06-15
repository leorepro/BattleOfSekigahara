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
        fmat = new THREE.MeshStandardMaterial({
          map: S.flagTexture(a.crest, a.side), side: THREE.DoubleSide,
          roughness: 0.7, transparent: true });
        flag = new THREE.Mesh(fgeo, fmat);
        flag.castShadow = true;
        flag.position.set(FW / 2 + 0.2, POLE_H - FH / 2 - 0.5, 0);
        flag.userData.base = Float32Array.from(fgeo.attributes.position.array);
        group.add(flag);
        fadeMats = [fmat, pole.material];
      }

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(2.2, 3.0, 36),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55, side: THREE.DoubleSide }));
      ring.rotation.x = -Math.PI / 2; ring.position.y = 0.25; group.add(ring);

      // 點選 hitbox（透明）
      const hit = new THREE.Mesh(
        new THREE.BoxGeometry(6, POLE_H + 4, 6),
        new THREE.MeshBasicMaterial({ visible: false }));
      hit.position.y = (POLE_H + 4) / 2; group.add(hit);

      const el = document.createElement('div');
      el.className = `lbl lbl-unit side-${a.side}`;
      const KICON = (S.config && S.config.kindIcons) || { command:'本', artillery:'砲', matchlock:'銃', cavalry:'騎', infantry:'槍' };
      el.innerHTML =
        `<div><span class="kbadge k-${a.kind}" title="${a.kind}">${KICON[a.kind] || '槍'}</span>` +
        `${a.name_zh}<span class="ja"> ${a.name_ja}</span></div>` +
        `<div class="hp"><i></i></div><div class="troops"></div>`;
      const tag = new THREE.CSS2DObject(el);
      tag.position.set(0, POLE_H + 2.5 + (_units.length % 4) * 3.6, 0); group.add(tag); // 錯開避免重疊

      eng.scene.add(group);

      // 移動方向箭頭（世界座標）
      const arrow = new THREE.ArrowHelper(new THREE.Vector3(1,0,0), new THREE.Vector3(),
        8, color, 3, 2);
      arrow.visible = false; eng.scene.add(arrow);

      const u = { data:a, group, flag, fmat, ring, pole, hit, el, body, fadeMats,
        troopsEl: el.querySelector('.troops'), hpEl: el.querySelector('.hp i'),
        arrow, p: new THREE.Vector3() };
      hit.userData.unit = u;
      _units.push(u);
    }
    S.precomputeRoutes();          // 依地形預算各部隊路徑控制點（繞開丘陵）
    return _units;
  };

  const ST_LABEL = { hold:'布陣', march:'行軍', attack:'交戰', rout:'潰走', breakthrough:'突破' };

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
    const MIN = 8.5;
    for (let it = 0; it < 5; it++) {
      for (let i = 0; i < _units.length; i++) for (let j = i + 1; j < _units.length; j++) {
        const A = _units[i].p, B = _units[j].p;
        let dx = B.x - A.x, dz = B.z - A.z;
        let d = Math.hypot(dx, dz) || 0.01;
        if (d < MIN) { const push = (MIN - d) / 2 / d; dx *= push; dz *= push;
          A.x -= dx; A.z -= dz; B.x += dx; B.z += dz; }
      }
    }
    // 3) 套用
    for (const u of _units) {
      const s = u.cur;
      const y = S.terrain ? S.terrain.heightAt(u.p.x, u.p.z) : 0;
      u.group.position.set(u.p.x, y, u.p.z);

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
      const moving = !dead && (s.st === 'march' || s.st === 'attack' || s.st === 'breakthrough');
      const mag = Math.hypot(u.moveDir.dx, u.moveDir.dz);
      if (moving && mag > 1e-5) {
        u.arrow.visible = true;
        u.arrow.position.set(u.p.x, y + 1.5, u.p.z);
        u.arrow.setDirection(new THREE.Vector3(u.moveDir.dx, 0, u.moveDir.dz).normalize());
        u.arrow.setLength(9, 3, 2);
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

  S.firePoints = function () {
    const out = [];
    for (const u of _units) {
      const st = u.cur && u.cur.st;
      if (st === 'attack' || st === 'breakthrough')
        out.push({ x:u.group.position.x, y:u.group.position.y, z:u.group.position.z,
                   side:u.data.side, kind:u.data.kind || 'infantry', moveDir:u.moveDir });
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
})(window.SEKI);
