/* =========================================================================
 * src/engine/melee.js — 近戰戰鬥呈現（接戰帶火花 + 倒地堆屍 + 箭雨 + 子彈時間焦點）
 *   與 engage.js（交戰光暈帶/combatBurst）互補：melee 補上「地面層」——
 *   接觸線火花、陣亡士兵倒地累積成屍堆、波斯弓兵拋物線箭雨。
 *   讀 S.engagements + S.unitById + 各 unit.cur.s/group.position；向後相容（前三場不載入）。
 *   S.meleeFocus(key) 對外暴露子彈時間焦點（Phase 5 運鏡用）。
 * ======================================================================= */
window.SEKI = window.SEKI || {};

(function (S) {
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(),
        _s = new THREE.Vector3(1, 1, 1), _up = new THREE.Vector3(0, 1, 0),
        _col = new THREE.Color(), _v = new THREE.Vector3(), _baseZ = new THREE.Vector3(0, 0, 1);
  const rnd = a => (Math.random() * 2 - 1) * a;

  // 合併幾何（position/normal/index），供屍體模型用
  function mergeGeos(gs) {
    let vc = 0; gs.forEach(g => vc += g.attributes.position.count);
    const pos = new Float32Array(vc * 3), nor = new Float32Array(vc * 3), idx = [];
    let vo = 0;
    for (const g of gs) {
      pos.set(g.attributes.position.array, vo * 3);
      nor.set(g.attributes.normal.array, vo * 3);
      const gi = g.index.array; for (let i = 0; i < gi.length; i++) idx.push(gi[i] + vo);
      vo += g.attributes.position.count;
    }
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    out.setIndex(idx);
    return out;
  }

  /* ---------- 倒地堆屍（InstancedMesh + instanceColor，環狀緩衝） ---------- */
  let bodyMesh = null, bodyCap = 500, bodyCount = 0, bodyHead = 0, bodyOverflow = false, loggedCap = false;
  const _deadAcc = {}, _prevS = {};

  function bodyGeo() {
    // 俯臥屍體：軀幹 + 一腿 + 側翻圓盾，平躺於 XZ
    const torso = new THREE.BoxGeometry(0.55, 0.2, 0.3); torso.translate(0, 0.1, 0);
    const leg = new THREE.BoxGeometry(0.5, 0.16, 0.2); leg.translate(-0.5, 0.08, 0.03);
    const shield = new THREE.CylinderGeometry(0.4, 0.4, 0.07, 14); shield.rotateZ(Math.PI / 2); shield.translate(0.2, 0.11, 0.32);
    return mergeGeos([torso, leg, shield]);
  }

  function addBody(x, z, colorHex, yaw) {
    if (!bodyMesh) return;
    const y = S.terrain ? S.terrain.heightAt(x, z) : 0;
    const idx = bodyOverflow ? bodyHead : bodyCount;
    _q.setFromAxisAngle(_up, yaw);
    _m.compose(_p.set(x, y + 0.04, z), _q, _s);
    bodyMesh.setMatrixAt(idx, _m);
    _col.setHex(colorHex); bodyMesh.setColorAt(idx, _col);
    bodyHead = (bodyHead + 1) % bodyCap;
    if (!bodyOverflow) {
      bodyCount++;
      if (bodyCount >= bodyCap) {
        bodyOverflow = true; bodyHead = 0;
        if (!loggedCap) { console.log('[melee] corpseCap ' + bodyCap + ' 達上限，最舊屍體開始被覆蓋（呈現取捨）'); loggedCap = true; }
      }
    }
    bodyMesh.count = bodyOverflow ? bodyCap : bodyCount;
    bodyMesh.instanceMatrix.needsUpdate = true;
    if (bodyMesh.instanceColor) bodyMesh.instanceColor.needsUpdate = true;
  }

  /* ---------- 箭雨（InstancedMesh 池 + 拋物線飛行） ---------- */
  let arrows = null, arrowState = [], arrowHead = 0;
  const ARROW_N = 720;
  let volleyAcc = 0;

  function initArrows() {
    const g = new THREE.CylinderGeometry(0.03, 0.03, 1.8, 5); g.rotateX(Math.PI / 2); // 軸沿 +Z（加長加粗更可見）
    arrows = new THREE.InstancedMesh(g, new THREE.MeshStandardMaterial({ color: 0x3a2c18, roughness: 0.85 }), ARROW_N);
    arrows.count = ARROW_N; arrows.frustumCulled = false; arrows.castShadow = false;
    S.engine.scene.add(arrows);
    for (let i = 0; i < ARROW_N; i++) { arrowState.push({ active: false, i }); hideArrow(i); }
    arrows.instanceMatrix.needsUpdate = true;
  }
  function hideArrow(i) { _m.makeScale(0, 0, 0); arrows.setMatrixAt(i, _m); }
  function launchArrow(sx, sy, sz, tx, ty, tz, dur, arc) {
    const a = arrowState[arrowHead];
    a.active = true; a.sx = sx; a.sy = sy; a.sz = sz; a.tx = tx; a.ty = ty; a.tz = tz; a.dur = dur; a.arc = arc; a.t = 0;
    arrowHead = (arrowHead + 1) % ARROW_N;
  }
  function updateArrows(dt) {
    if (!arrows) return; let dirty = false;
    for (const a of arrowState) {
      if (!a.active) continue; dirty = true;
      a.t += dt; const k = a.t / a.dur;
      if (k >= 1) { a.active = false; hideArrow(a.i); continue; }
      const x = a.sx + (a.tx - a.sx) * k, z = a.sz + (a.tz - a.sz) * k;
      const y = a.sy + (a.ty - a.sy) * k + a.arc * 4 * k * (1 - k);     // 拋物線
      const vy = (a.ty - a.sy) + a.arc * 4 * (1 - 2 * k);
      _v.set(a.tx - a.sx, vy, a.tz - a.sz).normalize();
      _q.setFromUnitVectors(_baseZ, _v);
      _m.compose(_p.set(x, y, z), _q, _s);
      arrows.setMatrixAt(a.i, _m);
    }
    if (dirty) arrows.instanceMatrix.needsUpdate = true;
  }

  /* ---------- 初始化 ---------- */
  S.initMelee = function () {
    bodyCap = (S.config && S.config.corpseCap) || 500;
    bodyMesh = new THREE.InstancedMesh(bodyGeo(),
      new THREE.MeshStandardMaterial({ roughness: 0.92, metalness: 0.05 }), bodyCap);
    bodyMesh.count = 0; bodyMesh.frustumCulled = false; bodyMesh.castShadow = true;
    S.engine.scene.add(bodyMesh);
    initArrows();
  };

  /* ---------- 每幀更新 ---------- */
  let _burstAcc = 0, _lastT = -1e9;
  S.updateMelee = function (t, dt) {
    if (!bodyMesh) return;
    // 時間倒退(拖曳時間軸/節目循環) → 清空屍堆與飛箭、重置傷亡基準，
    // 避免回到布陣/開頭時戰場仍殘留滿地白色屍體與箭。
    if (t < _lastT - 0.4) {
      bodyCount = 0; bodyHead = 0; bodyOverflow = false; bodyMesh.count = 0;
      for (const k in _prevS) delete _prevS[k];
      for (const k in _deadAcc) delete _deadAcc[k];
      if (arrows) { for (let i = 0; i < arrowState.length; i++) { arrowState[i].active = false; hideArrow(i); } arrows.instanceMatrix.needsUpdate = true; }
    }
    _lastT = t;

    // (1) 陣亡 → 倒地堆屍（按 cur.s 下降量累積，達門檻生成一具屍體）
    for (const a of (S.armies || [])) {
      const u = S.unitById(a.id); if (!u || !u.cur) continue;
      const s = u.cur.s;
      const pv = (_prevS[a.id] != null) ? _prevS[a.id] : s;
      const dead = pv - s;
      if (dead > 0) {
        const per = Math.max(10, Math.round(a.troops / 120));   // 每 per 名陣亡生成一具（控制總量）
        const col = a.side === 'east' ? 0x33425e : 0x6e2f2a;     // 波斯藍灰 / 希臘暗紅
        _deadAcc[a.id] = (_deadAcc[a.id] || 0) + dead;
        let guard = 0;
        while (_deadAcc[a.id] >= per && guard < 12) {            // 單幀上限 12 具，避免突降爆量
          _deadAcc[a.id] -= per; guard++;
          const gp = u.group.position;
          // 朝戰場中心（接觸線方向）散布
          const ang = Math.atan2(-gp.z, -gp.x) + rnd(0.7);
          const d = 1.2 + Math.random() * 3.5;
          addBody(gp.x + Math.cos(ang) * d + rnd(1.0), gp.z + Math.sin(ang) * d + rnd(1.0), col, Math.random() * Math.PI * 2);
        }
      }
      _prevS[a.id] = s;
    }

    // (2) 接觸線火花（複用 effects.combatBurst，地面層額外躁動）＋ 計算 band 中心（供子彈時間焦點）
    _burstAcc += dt;
    const doBurst = _burstAcc >= 0.09; if (doBurst) _burstAcc = 0;
    let bx = 0, bz = 0, bn = 0;
    for (const e of (S.engagements || [])) {
      const A = S.unitById(e.a), B = S.unitById(e.b);
      if (!A || !B || !A.cur || !B.cur) continue;
      if (t < e.from || t > e.to || A.cur.s < 1 || B.cur.s < 1) continue;
      const pa = A.group.position, pb = B.group.position;
      const mx = (pa.x + pb.x) / 2, mz = (pa.z + pb.z) / 2;
      bx += mx; bz += mz; bn++;
      if (doBurst && S.combatBurst && Math.random() < 0.55) {
        const my = S.terrain ? S.terrain.heightAt(mx, mz) : 0;
        S.combatBurst(mx, my + 0.5, mz);
      }
    }
    S._meleeBandCenter = bn ? _p.clone().set(bx / bn, S.terrain ? S.terrain.heightAt(bx / bn, bz / bn) + 1 : 1, bz / bn) : (S._meleeBandCenter || null);

    // (3) 箭雨：波斯弓兵 attack 時定期齊射；結局（t 21~23.5）對科洛諾斯小丘密集落箭
    const arch = S.unitById('persian_archers');
    if (arch && arch.cur && arch.cur.st === 'attack' && arch.cur.s > 1) {
      volleyAcc += dt;
      const finale = t >= 21 && t <= 23.5;
      const interval = finale ? 0.16 : 0.4;
      if (volleyAcc >= interval) {
        volleyAcc = 0;
        const from = arch.group.position;
        const tgtU = S.unitById('leonidas');
        const tgt = tgtU ? tgtU.group.position : from;
        const fy = (S.terrain ? S.terrain.heightAt(from.x, from.z) : 0) + 2;
        const K = finale ? 34 : 18, spread = finale ? 3.5 : 7;   // 萬箭齊發·遮天蔽日
        for (let n = 0; n < K; n++) {
          const tx = tgt.x + rnd(spread), tz = tgt.z + rnd(spread);
          const ty = (S.terrain ? S.terrain.heightAt(tx, tz) : 0) + 0.15;
          launchArrow(from.x + rnd(4), fy, from.z + rnd(4), tx, ty, tz, 0.85 + Math.random() * 0.45, 7 + Math.random() * 5);
        }
      }
    }
    updateArrows(dt);
  };

  /* ---------- 子彈時間焦點（Phase 5 運鏡用） ---------- */
  S.meleeFocus = function (key) {
    if (key === 'leonidas') { const u = S.unitById('leonidas'); return u ? u.group.position : null; }
    if (key === 'band') return S._meleeBandCenter || null;
    if (key === 'kolonos') {
      // 科洛諾斯小丘真實經緯（geography 同步）
      if (S.engine && S.engine.project) { const p = S.engine.project(22.5392, 38.7965, 30); return new THREE.Vector3(p.x, p.y, p.z); }
    }
    return null;
  };

  // Phase 2 stub 介面保留（hoplite 動畫在 hoplite.js）
})(window.SEKI);
