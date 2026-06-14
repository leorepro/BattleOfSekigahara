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

  // 一次齊射：一團閃光 + 數縷硝煙
  function volley(x, y, z) {
    // 砲口閃光（加色、極短命、亮黃白）
    for (let i = 0; i < 3; i++) {
      flash.emit(x + rnd(0.6), y + 1.4 + rnd(0.3), z + rnd(0.6), {
        vx: rnd(1), vy: rnd(1), vz: rnd(1), life: 0.12 + Math.random()*0.06,
        size0: 6 + Math.random()*4, size1: 1, r: 1.0, g: 0.92, b: 0.55,
      });
    }
    // 硝煙（灰白、上浮、漸大漸淡）
    for (let i = 0; i < 4; i++) {
      smoke.emit(x + rnd(0.8), y + 1.2 + rnd(0.4), z + rnd(0.8), {
        vx: rnd(0.8), vy: 0.6 + Math.random()*0.8, vz: rnd(0.8),
        life: 1.2 + Math.random()*0.9, size0: 1.5, size1: 7 + Math.random()*3,
        r: 0.82, g: 0.82, b: 0.80,
      });
    }
  }
  function rnd(a) { return (Math.random()*2 - 1) * a; }

  S.updateEffects = function (t, dt) {
    if (!smoke) return;
    // 噴發節流：約每 0.06s 對交戰部隊各擲一次骰
    _acc += dt;
    if (_acc >= 0.06) {
      _acc = 0;
      const pts = S.firePoints ? S.firePoints() : [];
      for (const p of pts) {
        if (Math.random() < 0.5) volley(p.x, p.y, p.z);
      }
    }
    // 硝煙上浮、閃光不受重力
    o_gravity = 0.5;  smoke.update(dt);
    o_gravity = 0.0;  flash.update(dt);
  };
})(window.SEKI);
