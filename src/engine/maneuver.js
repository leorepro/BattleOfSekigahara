/* =========================================================================
 * src/engine/maneuver.js — 移動 state 擴充（charge 衝鋒強度 + 抗騎空心方陣）
 *   移動主體由 units.js(sampleTrack) + formation.js 負責；本模組每幀依戰況補強：
 *   ① chargeIntensity(id,t)：騎兵 charge 段的 ease-in 強度(0~1) → 供 volley/effects 衝擊塵爆、
 *      storyboard 子彈時間焦點。
 *   ② 抗騎空心方陣：偵測敵方騎兵正在 charge 且逼近 → 令受威脅步兵 setFormMode('square')；
 *      威脅解除則清除覆寫，回歸 st 推導(formation.js napoMode)。
 *   移動仍為時間軸 t 純函數（強度由 track 推導、方陣由當下位置推導，皆可拖曳/倒退重現）。
 * ======================================================================= */
window.SEKI = window.SEKI || {};

(function (S) {
  let _byId = null;
  function index() {
    if (_byId) return _byId;
    _byId = {};
    if (S.armies) for (const a of S.armies) _byId[a.id] = a;
    return _byId;
  }

  // 取 t 當下所在 track 區段（回傳 {seg, k} 或 null）
  function activeSeg(a, t) {
    const tk = a.track;
    if (!tk || t <= tk[0].t || t >= tk[tk.length - 1].t) return null;
    for (let i = 0; i < tk.length - 1; i++) {
      if (t >= tk[i].t && t <= tk[i + 1].t) {
        return { st: tk[i].st, k: (t - tk[i].t) / (tk[i + 1].t - tk[i].t || 1) };
      }
    }
    return null;
  }

  // 騎兵衝鋒強度：charge 段內 ease-in（前 40% 加速到滿），非 charge=0
  S.chargeIntensity = function (id, t) {
    const a = index()[id]; if (!a) return 0;
    const seg = activeSeg(a, t);
    if (!seg || seg.st !== 'charge') return 0;
    const e = Math.min(1, seg.k / 0.4);
    return 0.25 + 0.75 * (e * e * (3 - 2 * e));   // smoothstep ease-in，最低 0.25
  };

  S.initManeuver = function () { _byId = null; index(); };

  // 抗騎方陣偵測門檻（場景單位；地圖約 267 單位寬）
  const SQUARE_DIST = 30;

  S.updateManeuver = function (t) {
    if (!S.armies || !S.unitById) return;
    // 1) 收集「正在衝鋒且存活」的騎兵（含其陣營與位置）
    const chargers = [];
    for (const a of S.armies) {
      if (a.kind !== 'cavalry') continue;
      const seg = activeSeg(a, t);
      if (!seg || seg.st !== 'charge') continue;
      const u = S.unitById(a.id);
      if (!u || !u.cur || u.cur.s <= 1) continue;
      chargers.push({ side: a.side, p: u.p });
    }
    // 2) 受敵騎兵衝鋒逼近的步兵 → 結成空心方陣；否則清除覆寫(回歸 st 推導)
    for (const a of S.armies) {
      if (a.kind !== 'infantry' && a.kind !== 'command') continue;
      const u = S.unitById(a.id);
      if (!u || !u.cur || u.cur.s <= 1) { S.setFormMode && S.setFormMode(a.id, null); continue; }
      const st = u.cur.st;
      // 行軍/潰逃中不結方陣（縱隊行進、或已崩潰）
      if (st === 'march' || st === 'rout' || st === 'breakthrough') { S.setFormMode && S.setFormMode(a.id, null); continue; }
      let threatened = false;
      for (const c of chargers) {
        if (c.side === a.side) continue;                 // 只怕敵方騎兵
        const dx = c.p.x - u.p.x, dz = c.p.z - u.p.z;
        if (dx * dx + dz * dz < SQUARE_DIST * SQUARE_DIST) { threatened = true; break; }
      }
      if (S.setFormMode) S.setFormMode(a.id, threatened ? 'square' : null);
    }
  };
})(window.SEKI);
