/* =========================================================================
 * src/engine/effects.js — 鐵炮齊射特效（砲口閃光 + 硝煙粒子）
 *   makeParticleSystem(opts)  以 ShaderMaterial 做每顆粒子獨立 size/alpha
 *   updateEffects(t, dt)      於「交戰」部隊位置週期性噴發閃光與硝煙
 *   另提供共用 S.softTexture（柔邊圓點），天氣模組也會用到。
 * ======================================================================= */
window.SEKI = window.SEKI || {};

(function (S) {
  /* 柔邊圓點貼圖（共用） */
  S.softTexture = (function () {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.4, 'rgba(255,255,255,0.6)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c); return t;
  })();

  const VERT = `
    attribute float aSize; attribute float aAlpha; attribute vec3 aColor;
    varying float vAlpha; varying vec3 vColor;
    uniform float uScale;
    void main(){
      vAlpha = aAlpha; vColor = aColor;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = aSize * uScale / max(-mv.z, 0.1);
      gl_Position = projectionMatrix * mv;
    }`;
  const FRAG = `
    uniform sampler2D uTex; varying float vAlpha; varying vec3 vColor;
    void main(){
      vec4 tx = texture2D(uTex, gl_PointCoord);
      gl_FragColor = vec4(vColor, tx.a * vAlpha);
      if (gl_FragColor.a < 0.01) discard;
    }`;

  // 建立一個容量 n 的粒子系統（CPU 池 + GPU 繪製）
  function makeParticleSystem(n, blending) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(n * 3);
    const size = new Float32Array(n);
    const alpha = new Float32Array(n);
    const col = new Float32Array(n * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1));
    geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));

    const mat = new THREE.ShaderMaterial({
      uniforms: { uTex: { value: S.softTexture }, uScale: { value: innerHeight } },
      vertexShader: VERT, fragmentShader: FRAG,
      transparent: true, depthWrite: false, blending,
    });
    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;

    return {
      points, geo, n, cursor: 0,
      vel: new Float32Array(n * 3),
      life: new Float32Array(n),
      maxLife: new Float32Array(n),
      size0: new Float32Array(n),
      size1: new Float32Array(n),
      emit(x, y, z, o) {
        const i = this.cursor; this.cursor = (this.cursor + 1) % this.n;
        pos[i*3]=x; pos[i*3+1]=y; pos[i*3+2]=z;
        this.vel[i*3]=o.vx; this.vel[i*3+1]=o.vy; this.vel[i*3+2]=o.vz;
        this.life[i]=o.life; this.maxLife[i]=o.life;
        this.size0[i]=o.size0; this.size1[i]=o.size1;
        col[i*3]=o.r; col[i*3+1]=o.g; col[i*3+2]=o.b;
        alpha[i]=1; size[i]=o.size0;
      },
      update(dt) {
        for (let i = 0; i < this.n; i++) {
          if (this.life[i] <= 0) { if (alpha[i] !== 0) alpha[i] = 0; continue; }
          this.life[i] -= dt;
          const k = Math.max(this.life[i] / this.maxLife[i], 0);    // 1→0
          pos[i*3]   += this.vel[i*3]   * dt;
          pos[i*3+1] += this.vel[i*3+1] * dt;
          pos[i*3+2] += this.vel[i*3+2] * dt;
          this.vel[i*3+1] += dt * o_gravity;                        // 硝煙上浮/閃光無感
          alpha[i] = k;
          size[i]  = this.size1[i] + (this.size0[i] - this.size1[i]) * k;
        }
        geo.attributes.position.needsUpdate = true;
        geo.attributes.aAlpha.needsUpdate = true;
        geo.attributes.aSize.needsUpdate = true;
      },
    };
  }
  let o_gravity = 0; // 由各系統設定（硝煙上浮為正）

  let smoke, flash, _acc = 0;

  S.initEffects = function () {
    smoke = makeParticleSystem(1400, THREE.NormalBlending);
    flash = makeParticleSystem(700, THREE.AdditiveBlending);
    S.engine.scene.add(smoke.points);
    S.engine.scene.add(flash.points);
  };

  function rnd(a) { return (Math.random()*2 - 1) * a; }
  function muzzle(x, y, z, n, r, g, b, sz) {
    for (let i = 0; i < n; i++) flash.emit(x + rnd(0.6), y + 1.4 + rnd(0.3), z + rnd(0.6), {
      vx: rnd(1), vy: rnd(1), vz: rnd(1), life: 0.1 + Math.random()*0.06,
      size0: sz + Math.random()*4, size1: 1, r, g, b });
  }
  function gunSmoke(x, y, z, n, big) {
    for (let i = 0; i < n; i++) smoke.emit(x + rnd(0.8), y + 1.2 + rnd(0.4), z + rnd(0.8), {
      vx: rnd(0.8), vy: 0.6 + Math.random()*0.8, vz: rnd(0.8),
      life: 1.2 + Math.random()*0.9, size0: 1.5, size1: (big?10:6) + Math.random()*3,
      r: 0.82, g: 0.82, b: 0.80 });
  }
  // 鉄砲齊射
  function teppoVolley(x, y, z, dense) {
    muzzle(x, y, z, dense ? 4 : 2, 1.0, 0.92, 0.55, 6);
    gunSmoke(x, y, z, dense ? 4 : 3, false);
  }
  // 騎馬揚塵（沿前進方向）
  function cavalryDust(x, y, z, fx, fz) {
    for (let i = 0; i < 4; i++) smoke.emit(x + rnd(1.5) - fx*2, y + 0.4, z + rnd(1.5) - fz*2, {
      vx: rnd(1.2), vy: 0.4 + Math.random()*0.5, vz: rnd(1.2),
      life: 0.9 + Math.random()*0.6, size0: 2, size1: 8 + Math.random()*3,
      r: 0.66, g: 0.58, b: 0.46 });
    if (Math.random() < 0.4) muzzle(x, y, z, 1, 1.0, 0.9, 0.5, 4);
  }
  // 大筒砲擊：砲口巨閃 + 曳光彈道 + 著彈爆煙
  function artilleryFire(x, y, z, fx, fz) {
    muzzle(x, y + 1.5, z, 3, 1.0, 0.82, 0.42, 11);             // 砲口巨閃（橙）
    gunSmoke(x, y, z, 3, true);
    const reach = 30 + Math.random()*14;
    for (let s = 1; s <= 5; s++) {                              // 曳光彈道
      const k = s / 5;
      flash.emit(x + fx*reach*k, y + 2 + Math.sin(k*Math.PI)*7, z + fz*reach*k, {
        vx: fx*4, vy: 0, vz: fz*4, life: 0.3, size0: 4.5, size1: 1.5, r: 1.0, g: 0.78, b: 0.4 });
    }
    const tx = x + fx*reach, tz = z + fz*reach;                 // 著彈點
    for (let i = 0; i < 6; i++) flash.emit(tx + rnd(2), y + 1.5 + rnd(1.5), tz + rnd(2), {
      vx: rnd(8), vy: Math.random()*8, vz: rnd(8), life: 0.22 + Math.random()*0.1,
      size0: 7 + Math.random()*5, size1: 1, r: 1.0, g: 0.7, b: 0.32 });
    for (let i = 0; i < 5; i++) smoke.emit(tx + rnd(2.5), y + 1.5, tz + rnd(2.5), {
      vx: rnd(1.5), vy: 1.2 + Math.random(), vz: rnd(1.5),
      life: 1.6 + Math.random(), size0: 2, size1: 11 + Math.random()*4, r: 0.55, g: 0.52, b: 0.48 });
  }

  // 兩軍接觸點的交戰爆發（鉄砲齊射 + 硝煙，雙方對打的焦點）
  S.combatBurst = function (x, y, z) {
    muzzle(x, y + 0.5, z, 3, 1.0, 0.9, 0.5, 6);
    gunSmoke(x, y, z, 3, false);
  };

  S.updateEffects = function (t, dt) {
    if (!smoke) return;
    _acc += dt;
    const tick = _acc >= 0.06;
    if (tick) {
      _acc = 0;
      // per-unit 火光調低為輕量環境煙；焦點交戰由 engage.js 的接觸點負責
      const pts = S.firePoints ? S.firePoints() : [];
      for (const p of pts) {
        let fx = p.moveDir ? p.moveDir.dx : 0, fz = p.moveDir ? p.moveDir.dz : 0;
        let m = Math.hypot(fx, fz);
        if (m < 1e-4) { fx = -p.x; fz = -p.z; m = Math.hypot(fx, fz) || 1; }
        fx /= m; fz /= m;
        switch (p.kind) {
          case 'artillery': if (Math.random() < 0.16) artilleryFire(p.x, p.y, p.z, fx, fz); break;  // 石田大筒(保留)
          case 'cavalry':   if (Math.random() < 0.5)  cavalryDust(p.x, p.y, p.z, fx, fz); break;
          case 'matchlock': if (Math.random() < 0.18) teppoVolley(p.x, p.y, p.z, false); break;
          default:          if (Math.random() < 0.1)  gunSmoke(p.x, p.y, p.z, 1, false);
        }
      }
    }
    o_gravity = 0.5;  smoke.update(dt);
    o_gravity = 0.0;  flash.update(dt);
  };
})(window.SEKI);
