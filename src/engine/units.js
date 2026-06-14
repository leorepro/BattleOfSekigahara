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
  const EAST = 0x3a78ff, WEST = 0xff3b3b;
  const FW = 4, FH = 6, POLE_H = 10;
  let _units = [];

  function fmt(n) { return Math.round(n).toLocaleString('en-US'); }

  S.sampleTrack = function (track, t) {
    if (t <= track[0].t) return { ...track[0] };
    const last = track[track.length - 1];
    if (t >= last.t) return { ...last };
    for (let i = 0; i < track.length - 1; i++) {
      const a = track[i], b = track[i + 1];
      if (t >= a.t && t <= b.t) {
        const k = (t - a.t) / (b.t - a.t);
        return { lng:a.lng+(b.lng-a.lng)*k, lat:a.lat+(b.lat-a.lat)*k,
                 s:a.s+(b.s-a.s)*k, st:a.st };
      }
    }
    return { ...last };
  };

  S.buildUnits = function () {
    const eng = S.engine;
    _units = [];
    for (const a of S.armies) {
      const color = a.side === 'east' ? EAST : WEST;
      const group = new THREE.Group();

      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, POLE_H, 8),
        new THREE.MeshStandardMaterial({ color: 0x241c12, roughness: 0.85 }));
      pole.position.y = POLE_H / 2; pole.castShadow = true; group.add(pole);

      const fgeo = new THREE.PlaneGeometry(FW, FH, 14, 2);
      const fmat = new THREE.MeshStandardMaterial({
        map: S.flagTexture(a.crest, a.side), side: THREE.DoubleSide,
        roughness: 0.7, transparent: true });
      const flag = new THREE.Mesh(fgeo, fmat);
      flag.castShadow = true;
      flag.position.set(FW / 2 + 0.2, POLE_H - FH / 2 - 0.5, 0);
      flag.userData.base = Float32Array.from(fgeo.attributes.position.array);
      group.add(flag);

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
      el.innerHTML = `<div>${a.name_zh}<span class="ja"> ${a.name_ja}</span></div><div class="troops"></div>`;
      const tag = new THREE.CSS2DObject(el);
      tag.position.set(0, POLE_H + 2.5 + (_units.length % 4) * 3.6, 0); group.add(tag); // 錯開避免重疊

      eng.scene.add(group);

      // 移動方向箭頭（世界座標）
      const arrow = new THREE.ArrowHelper(new THREE.Vector3(1,0,0), new THREE.Vector3(),
        8, color, 3, 2);
      arrow.visible = false; eng.scene.add(arrow);

      const u = { data:a, group, flag, fmat, ring, pole, hit, el,
        troopsEl: el.querySelector('.troops'), arrow, p: new THREE.Vector3() };
      hit.userData.unit = u;
      _units.push(u);
    }
    return _units;
  };

  const ST_LABEL = { hold:'布陣', march:'行軍', attack:'交戰', rout:'潰走', breakthrough:'突破' };

  S.updateUnits = function (t) {
    const eng = S.engine;
    // 1) 取樣位置
    for (const u of _units) {
      const s = S.sampleTrack(u.data.track, t);
      const p = eng.project(s.lng, s.lat, 0);
      const y = S.terrain ? S.terrain.heightAt(p.x, p.z) : 0;
      u.p.set(p.x, y, p.z); u.cur = s;
      // 移動方向：比較稍後時刻
      const s2 = S.sampleTrack(u.data.track, t + 0.12);
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
      u.fmat.opacity = op;
      u.pole.material.transparent = true; u.pole.material.opacity = op;
      u.ring.material.opacity = dead ? 0 : (s.st === 'attack' ? 0.8 : 0.5);
      u.troopsEl.innerHTML = dead ? `<span style="opacity:.7">潰滅</span>`
        : `${fmt(s.s)} <span style="opacity:.65">${ST_LABEL[s.st] || ''}</span>`;
      u.el.style.opacity = dead ? 0.45 : 1;

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

  // 雙方目前總兵力
  S.sideStrength = function () {
    let east = 0, west = 0;
    for (const u of _units) {
      const s = u.cur ? u.cur.s : u.data.troops;
      if (u.data.side === 'east') east += Math.max(s, 0); else west += Math.max(s, 0);
    }
    return { east, west };
  };
})(window.SEKI);
