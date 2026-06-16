/* =========================================================================
 * src/engine/napoleonic.js — 拿破崙時代單兵幾何（步兵/騎兵/砲兵 + 軍服頂點色 + LOD）
 *   對應溫泉關的 hoplite.js。buildNapoleonicGeo(variant, opts) 合併多 box + 頂點色
 *   → 供 InstancedMesh 共享。
 *   ※ Phase 0 stub：先回空幾何，Phase 2 (Task 2.1/2.2) 實作。
 * ======================================================================= */
window.SEKI = window.SEKI || {};

(function (S) {
  S.buildNapoleonicGeo = function (variant, opts) {
    // Phase 2 取代：依 variant（french-line/russian-line/austrian-line/cuirassier/...）建幾何
    return new THREE.BufferGeometry();
  };
  S.variantIsMounted = function (variant) {
    return /cuirassier|hussar|dragoon|cav/.test(variant || '');
  };
})(window.SEKI);
