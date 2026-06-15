/* =========================================================================
 * src/engine/melee.js — 近戰戰鬥呈現（接戰帶 / 微觀對決 / 倒地堆屍 / 近戰FX / 子彈時間焦點）
 *   ※ Phase 0 STUB：僅註冊命名空間與 no-op，避免 thermopylae.html 載入缺檔。
 *     實作見計畫 Phase 4（band 建構、tau/heave/intensity、對決狀態機、堆屍、近戰FX）。
 *   向後相容：前三場不載入本檔、不呼叫本檔任何函式。
 * ======================================================================= */
window.SEKI = window.SEKI || {};

(function (S) {
  // Phase 4 將實作：由 engagements 建接戰帶 band
  S.initMelee = S.initMelee || function () { /* no-op (stub) */ };

  // Phase 4 將實作：每幀更新 band（tau/heave/intensity）、微觀對決、倒地堆屍、發射近戰FX
  S.updateMelee = S.updateMelee || function (/* t, dt */) { /* no-op (stub) */ };

  // Phase 5 將用：對外暴露子彈時間焦點（列奧尼達座標 / band 中心 / 奪屍點 / 科洛諾斯小丘）
  S.meleeFocus = S.meleeFocus || function (/* key */) { return null; };
})(window.SEKI);
