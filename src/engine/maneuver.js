/* =========================================================================
 * src/engine/maneuver.js — 移動 state 擴充（charge/square/line↔column）
 *   移動主體仍由 units.js(sampleTrack) + formation.js 負責；本模組僅依 u.cur.st
 *   把每個 formation 的 formMode 切換，並提供騎兵衝鋒強度供 FX/運鏡使用。
 *   ※ Phase 0 stub；Phase 4 (Task 4.1/4.2) 實作。
 * ======================================================================= */
window.SEKI = window.SEKI || {};

(function (S) {
  S.initManeuver = function () {};
  S.updateManeuver = function (t) {};
  // 騎兵衝鋒強度 0~1（ease-in），供 volley/effects/storyboard 取用；Phase 4 實作。
  S.chargeIntensity = function (unitId, t) { return 0; };
})(window.SEKI);
