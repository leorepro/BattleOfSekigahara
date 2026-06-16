/* =========================================================================
 * data/austerlitz/geography.js — 奧斯特利茨古戰場地理（真實 WGS84，海拔公尺）
 *   ※ Phase 0 placeholder：僅 origin + 少量地標，Phase 1 由 Task 1.3 補全。
 *   type 值：mountain / hill / battlefield / camp / river / town / road
 * ======================================================================= */
window.SEKI = window.SEKI || {};

SEKI.geography = {
  /* 投影中心：普拉欽高地一帶（戰場中央） */
  origin: { lng: 16.76, lat: 49.13 },

  features: [
    { name_zh:"普拉欽高地", name_ja:"Pratzen Heights", type:"hill", lng:16.762, lat:49.118, h:324,
      note:"戰場中央戰略要地。拿破崙故意讓出以誘聯軍南下，再以蘇爾特軍中央突破奪取" },
  ],

  lines: [],
};
