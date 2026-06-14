/* =========================================================================
 * src/engine/weather.js — 動態天氣（朝霧 → 放晴）
 *   initWeather()      建立貼地飄移霧層（數片柔邊billboard）
 *   updateWeather(t)   依 weatherTrack 內插，套用 fog/天色/光照/曝光/霧層
 * ======================================================================= */
window.SEKI = window.SEKI || {};

(function (S) {
  let banks = [];

  // 在兩 keyframe 間（k=0..1）正規化輸出
  function blend(a, b, k) {
    const lerp = (p, q) => p + (q - p) * k;
    return {
      fogColor: new THREE.Color(a.fog).lerp(new THREE.Color(b.fog), k),
      near: lerp(a.near, b.near), far: lerp(a.far, b.far),
      bg: new THREE.Color(a.bg).lerp(new THREE.Color(b.bg), k),
      sun: lerp(a.sun, b.sun), exp: lerp(a.exp, b.exp), bank: lerp(a.bank, b.bank),
    };
  }

  function sample(t) {
    const tk = S.weatherTrack;
    if (t <= tk[0].t) return blend(tk[0], tk[0], 0);
    const last = tk[tk.length - 1];
    if (t >= last.t) return blend(last, last, 0);
    for (let i = 0; i < tk.length - 1; i++) {
      const a = tk[i], b = tk[i + 1];
      if (t >= a.t && t <= b.t) return blend(a, b, (t - a.t) / (b.t - a.t));
    }
    return blend(last, last, 0);
  }

  S.initWeather = function () {
    const eng = S.engine;
    const mat0 = {
      map: S.softTexture, transparent: true, depthWrite: false,
      blending: THREE.NormalBlending, color: 0xdfe6ea,
    };
    // 數片大霧斑，低空緩慢飄移
    for (let i = 0; i < 14; i++) {
      const mat = new THREE.SpriteMaterial(mat0);
      mat.opacity = 0;
      const spr = new THREE.Sprite(mat);
      const x = (Math.random() * 2 - 1) * 130;
      const z = (Math.random() * 2 - 1) * 130;
      const s = 70 + Math.random() * 60;
      spr.position.set(x, 6 + Math.random() * 8, z);
      spr.scale.set(s, s * 0.6, 1);
      spr.userData = { driftX: (Math.random() * 2 - 1) * 1.2, baseX: x, phase: Math.random() * 6 };
      eng.scene.add(spr);
      banks.push(spr);
    }
  };

  S.updateWeather = function (t, time) {
    const eng = S.engine;
    const w = sample(t);

    eng.scene.fog.color.copy(w.fogColor);
    eng.scene.fog.near = w.near;
    eng.scene.fog.far = w.far;
    eng.scene.background.copy(w.bg);
    if (eng.sun) eng.sun.intensity = w.sun;
    if (eng.hemi) eng.hemi.intensity = 0.45 + w.sun * 0.25;
    eng.renderer.toneMappingExposure = w.exp;

    for (const spr of banks) {
      spr.material.opacity = w.bank;
      // 緩慢飄移
      const d = spr.userData;
      spr.position.x = d.baseX + Math.sin(time * 0.05 + d.phase) * 14 + (time * d.driftX % 40);
    }
  };
})(window.SEKI);
