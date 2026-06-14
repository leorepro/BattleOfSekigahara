/* =========================================================================
 * src/engine/engage.js — 交戰呈現（誰在跟誰打）
 *   在交戰雙方的接觸中點顯示「A ⚔ B」標記與連線，並集中砲火硝煙於此，
 *   讓對戰一目了然。標記只在當前鏡頭聚焦的兩軍之間出現（與旁白連動）。
 * ======================================================================= */
window.SEKI = window.SEKI || {};

(function (S) {
  let _eng = [];
  let _acc = 0;
  const _mid = new THREE.Vector3();

  S.buildEngagements = function () {
    const eng = S.engine;
    _eng = [];
    for (const e of (S.engagements || [])) {
      // 連線
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({
        color: 0xffd24a, transparent: true, opacity: 0, depthWrite: false }));
      line.frustumCulled = false;
      eng.scene.add(line);
      // ⚔ 標記
      const el = document.createElement('div');
      el.className = 'clash';
      const tag = new THREE.CSS2DObject(el);
      eng.scene.add(tag);
      _eng.push({ data: e, line, geo, tag, el });
    }
    return _eng;
  };

  S.updateEngagements = function (t, dt) {
    _acc += dt;
    const doBurst = _acc >= 0.07;
    if (doBurst) _acc = 0;

    for (const o of _eng) {
      const e = o.data;
      const A = S.unitById(e.a), B = S.unitById(e.b);
      const active = A && B && t >= e.from && t <= e.to
        && (A.cur ? A.cur.s > 1 : true) && (B.cur ? B.cur.s > 1 : true)
        && S.isFocused(e.a) && S.isFocused(e.b);

      if (!active) {
        if (o.el.style.display !== 'none') { o.el.style.display = 'none'; o.line.material.opacity = 0; }
        continue;
      }
      const pa = A.group.position, pb = B.group.position;
      _mid.addVectors(pa, pb).multiplyScalar(0.5); _mid.y += 4;

      // 連線
      const arr = o.geo.attributes.position.array;
      arr[0]=pa.x; arr[1]=pa.y+2; arr[2]=pa.z; arr[3]=pb.x; arr[4]=pb.y+2; arr[5]=pb.z;
      o.geo.attributes.position.needsUpdate = true;
      o.line.material.opacity = 0.5;

      // 標記
      if (o.el.style.display === 'none' || !o.el.innerHTML) {
        o.el.innerHTML = `<span class="cn cn-${A.data.side}">${A.data.name_zh}</span>` +
          `<span class="x">⚔</span><span class="cn cn-${B.data.side}">${B.data.name_zh}</span>`;
        o.el.style.display = '';
      }
      o.tag.position.copy(_mid);

      // 集中砲火於接觸點
      if (doBurst && S.combatBurst && Math.random() < 0.85) {
        const surfaceY = S.terrain ? S.terrain.heightAt(_mid.x, _mid.z) : _mid.y;
        S.combatBurst(_mid.x, surfaceY, _mid.z);
      }
    }
  };
})(window.SEKI);
