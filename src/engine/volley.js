/* =========================================================================
 * src/engine/volley.js — 戰術 FX：排槍齊射 + 野戰砲兵齊射 + 騎兵衝擊
 *   每幀掃描各單位當前 st，依兵種發射火光/硝煙/塵爆（沿用 effects.js 粒子池，
 *   經 S.emitFire/S.emitDust/S.combatBurst 公開介面）。
 *   ※ effects 粒子系統中 o.g 同時作「綠色通道」與「重力」(向上加速)，故顏色與飄升一併由 g 決定。
 *   排槍：沿橫隊正面一排排錯落火光 + 硝煙幕。砲兵：砲口大火光 + 濃砲煙。
 *   騎兵衝鋒：馬群後方拖塵（強度吃 maneuver.chargeIntensity）。
 *   冰湖砲擊 finale 由 S.cannonadePond(x,y,z) 提供（Phase 6 weather/ice 呼叫）。
 * ======================================================================= */
window.SEKI = window.SEKI || {};

(function (S) {
  const _timer = {};            // 各單位開火節律累加器
  function rnd(a) { return (Math.random() * 2 - 1) * a; }
  function norm(dx, dz) { const m = Math.hypot(dx, dz) || 1; return [dx / m, dz / m]; }

  S.initVolley = function () { for (const k in _timer) delete _timer[k]; };

  // 槍口火光（亮橙白短命）+ 硝煙（灰白上升）
  function musketFlash(x, y, z, fx, fz) {
    S.emitFire(x, y, z, { vx: fx * 4 + rnd(1), vy: rnd(0.5) + 0.3, vz: fz * 4 + rnd(1),
      life: 0.12, size0: 7, size1: 1, r: 1.0, g: 0.84, b: 0.46 });
    S.emitDust(x, y + 0.2, z, { vx: fx * 1.4 + rnd(0.4), vy: 0.6 + Math.random() * 0.4, vz: fz * 1.4 + rnd(0.4),
      life: 1.4, size0: 3, size1: 9, r: 0.82, g: 0.82, b: 0.84 });
  }
  // 砲口齊射（大火光 + 濃砲煙）
  function cannonBlast(x, y, z, fx, fz) {
    for (let i = 0; i < 4; i++)
      S.emitFire(x, y, z, { vx: fx * 10 + rnd(2), vy: rnd(0.8) + 0.5, vz: fz * 10 + rnd(2),
        life: 0.20, size0: 15, size1: 2, r: 1.0, g: 0.78, b: 0.42 });
    for (let i = 0; i < 6; i++)
      S.emitDust(x + rnd(1), y + rnd(0.4), z + rnd(1), { vx: fx * 3 + rnd(1), vy: 0.7 + Math.random() * 0.8, vz: fz * 3 + rnd(1),
        life: 2.2, size0: 6, size1: 18, r: 0.72, g: 0.72, b: 0.74 });
  }

  // 冰湖砲擊：對 (x,z) 落彈 → 火光 + 揚冰碎屑 + 衝擊火花（Phase 6 ice 呼叫）
  S.cannonadePond = function (x, y, z) {
    for (let i = 0; i < 5; i++)
      S.emitFire(x + rnd(2), y + 0.2, z + rnd(2), { vx: rnd(2), vy: 1.4 + Math.random() * 1.6, vz: rnd(2),
        life: 0.5, size0: 9, size1: 2, r: 0.95, g: 0.96, b: 1.0 });   // 冰屑近白
    for (let i = 0; i < 4; i++)
      S.emitDust(x + rnd(2), y, z + rnd(2), { vx: rnd(2), vy: 1.0 + Math.random(), vz: rnd(2),
        life: 1.4, size0: 4, size1: 12, r: 0.86, g: 0.9, b: 0.94 });
    if (S.combatBurst) S.combatBurst(x, y + 0.3, z);
  };

  S.updateVolley = function (t, dt) {
    if (!S.armies || !S.unitById || !S.emitFire) return;
    for (const a of S.armies) {
      const u = S.unitById(a.id); if (!u || !u.cur) continue;
      if (u.cur.s <= 1) continue;
      const st = u.cur.st;
      const p = u.group.position;
      const md = u.moveDir || { dx: 0, dz: 1 };
      let [fx, fz] = norm(md.dx, md.dz);
      if (!isFinite(fx)) { fx = 0; fz = 1; }
      const px = -fz, pz = fx;                  // 沿陣面(垂直前進方向)
      const id = a.id;
      _timer[id] = (_timer[id] || 0) + dt;

      if (a.kind === 'infantry' || a.kind === 'command') {
        // 排槍：交戰/突破時沿正面一排排錯落齊射
        if ((st === 'attack' || st === 'breakthrough') && _timer[id] >= 0.42) {
          _timer[id] = 0;
          const front = 6;
          for (let i = 0; i < 3; i++) {
            const lat = (Math.random() * 2 - 1) * 7.5;     // 沿陣面散布 → 錯落不全齊
            musketFlash(p.x + fx * front + px * lat, p.y + 1.4, p.z + fz * front + pz * lat, fx, fz);
          }
        }
      } else if (a.kind === 'artillery') {
        // 野戰砲兵：較疏的齊射（含彈著塵爆）
        if ((st === 'attack' || st === 'breakthrough') && _timer[id] >= 2.4) {
          _timer[id] = 0;
          cannonBlast(p.x + fx * 4, p.y + 1.0, p.z + fz * 4, fx, fz);
          const tg = (S.engagementTargetOf ? S.engagementTargetOf(u, t) : null);
          if (tg && S.combatBurst) S.combatBurst(tg.x, tg.y + 0.4, tg.z);
        }
      } else if (a.kind === 'cavalry') {
        // 騎兵衝鋒：馬群後方拖塵（強度吃 chargeIntensity）
        if ((st === 'charge' || st === 'attack') && _timer[id] >= 0.12) {
          _timer[id] = 0;
          const inten = S.chargeIntensity ? S.chargeIntensity(id, t) : (st === 'charge' ? 1 : 0.4);
          if (inten > 0.05) {
            const nDust = st === 'charge' ? 3 : 1;
            for (let i = 0; i < nDust; i++) {
              const lat = (Math.random() * 2 - 1) * 6;
              S.emitDust(p.x - fx * 4 + px * lat, p.y + 0.3, p.z - fz * 4 + pz * lat,
                { vx: -fx * 1 + rnd(0.5), vy: 0.4 + Math.random() * 0.5 * inten, vz: -fz * 1 + rnd(0.5),
                  life: 1.3, size0: 4, size1: 11 * inten + 3, r: 0.66, g: 0.6, b: 0.5 });
            }
          }
        }
      }
    }
  };
})(window.SEKI);
