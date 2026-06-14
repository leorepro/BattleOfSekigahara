/* =========================================================================
 * src/engine/labels.js — CSS2D 地名標籤
 *   把 geography.features 做成貼在 3D 空間的 HTML 標籤。
 *   繁體中文為主，日文原文做小字輔助。
 * ======================================================================= */
window.SEKI = window.SEKI || {};

(function (S) {
  S.buildGeoLabels = function () {
    const eng = S.engine;
    S.geoLabels = [];

    for (const f of S.geography.features) {
      if (f.type === 'road' || f.type === 'river') continue; // 線狀地物 M2 再標

      const el = document.createElement('div');
      el.className = 'lbl lbl-geo';
      // 主：繁中；輔：日文原文（與繁中不同時才顯示）
      const ja = (f.name_ja && f.name_ja !== f.name_zh) ? `<span class="ja"> ${f.name_ja}</span>` : '';
      el.innerHTML = `${f.name_zh}${ja}`;

      const obj = new THREE.CSS2DObject(el);
      const p = eng.project(f.lng, f.lat, f.h);
      // 標在地表稍上方
      const surfaceY = S.terrain ? S.terrain.heightAt(p.x, p.z) : p.y;
      obj.position.set(p.x, surfaceY + 6, p.z);
      eng.scene.add(obj);
      S.geoLabels.push(obj);
    }
    return S.geoLabels;
  };
})(window.SEKI);
