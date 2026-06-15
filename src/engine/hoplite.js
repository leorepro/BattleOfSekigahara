/* =========================================================================
 * src/engine/hoplite.js — 希臘重裝步兵（hoplite）個體幾何 + 盾牆方陣 + 近戰動畫
 *   ※ Phase 0 STUB：僅註冊命名空間與 no-op，避免 thermopylae.html 載入缺檔。
 *     實作見計畫 Phase 2（buildHopliteGeo / phalanx 排列 / 刺擊·架盾·倒地動畫）。
 *   向後相容：前三場不載入本檔、不呼叫本檔任何函式。
 * ======================================================================= */
window.SEKI = window.SEKI || {};

(function (S) {
  // Phase 2 將實作：S.buildHopliteGeo(variant) → 合併 box 幾何（圓盾Λ/長矛/科林斯盔/披風/脛甲）
  S.buildHopliteGeo = S.buildHopliteGeo || function (/* variant */) { return null; };

  // Phase 2 將實作：phalanx 盾牆方陣排列 + per-instance 個體差異
  S.buildPhalanx = S.buildPhalanx || function () { /* no-op (stub) */ };

  // Phase 4 將實作：前排刺擊/架盾/倒地動畫（吃 dt*cinemaScale）
  S.updateHopliteAnim = S.updateHopliteAnim || function (/* t, dt */) { /* no-op (stub) */ };
})(window.SEKI);
