/* =========================================================================
 * src/engine/labels.js — CSS2D 地名標籤
 *   把 geography.features 做成貼在 3D 空間的 HTML 標籤，依類型給圖示與層級。
 *   ※「camp（武將陣跡）」由部隊軍旗本身呈現，此處不重複標示，避免與部隊標籤打架。
 *   地標分兩級：major（山/城/古戰場）較顯眼，minor（宿場/河/神社）較小較淡。
 * ======================================================================= */
window.SEKI = window.SEKI || {};

(function (S) {
  // 類型 → 圖示
  const ICON = { mountain:'▲', hill:'▲', castle:'🏯', fort:'▣', shrine:'⛩', battlefield:'⚔',
                 town:'◉', river:'〜', road:'—', camp:'◆' };
  const MAJOR = { mountain:1, castle:1, battlefield:1 };
  const SKIP  = { camp:1, road:1 };       // 陣跡由軍旗呈現、街道用折線呈現

  S.buildGeoLabels = function () {
    const eng = S.engine;
    S.geoLabels = [];

    for (const f of S.geography.features) {
      if (SKIP[f.type]) continue;

      const el = document.createElement('div');
      el.className = 'lbl lbl-geo ' + (MAJOR[f.type] ? 'geo-major' : 'geo-minor');
      const icon = ICON[f.type] || '·';
      const ja = (f.name_ja && f.name_ja !== f.name_zh) ? `<span class="ja"> ${f.name_ja}</span>` : '';
      el.innerHTML = `<span class="ic">${icon}</span>${f.name_zh}${ja}`;

      const obj = new THREE.CSS2DObject(el);
      const p = eng.project(f.lng, f.lat, f.h);
      const surfaceY = S.terrain ? S.terrain.heightAt(p.x, p.z) : p.y;
      obj.position.set(p.x, surfaceY + (MAJOR[f.type] ? 7 : 4), p.z);
      obj.userData = { major: !!MAJOR[f.type] };
      eng.scene.add(obj);
      S.geoLabels.push(obj);
    }
    return S.geoLabels;
  };
})(window.SEKI);
