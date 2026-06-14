/* =========================================================================
 * src/engine/effects.js — 戰鬥特效（亮色火光 + 大筒拋物線砲彈 + 騎馬衝刺）
 *   設計重點：戰鬥以「亮色火光（黃→橙→紅）」呈現，少量淡煙，避免黑團；
 *   大筒發射真正的拋物線砲彈，飛行後著彈爆炸；騎馬隊做向前衝刺的塵浪。
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
    return new THREE.CanvasTexture(c);
  })();

  const VERT = `
    attribute float aSize; attribute float aAlpha; attribute vec3 aColor;
    varying float vAlpha; varying vec3 vColor; uniform float uScale;
    void main(){
      vAlpha = aAlpha; vColor = aColor;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = aSize * uScale / max(-mv.z, 0.1);
      gl_Position = projectionMatrix * mv;
    }`;
  const FRAG = `
    uniform sampler2D uTex; varying float vAlpha; varying vec3 vColor;
    void main(){ vec4 tx = texture2D(uTex, gl_PointCoord);
      gl_FragColor = vec4(vColor, tx.a * vAlpha); if (gl_FragColor.a < 0.01) discard; }`;

  function makeParticleSystem(n, blending) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(n * 3), size = new Float32Array(n),
          alpha = new Float32Array(n), col = new Float32Array(n * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1));
    geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTex: { value: S.softTexture }, uScale: { value: innerHeight } },
      vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, blending });
    const points = new THREE.Points(geo, mat); points.frustumCulled = false;
    return {
      points, geo, n, cursor: 0,
      vel: new Float32Array(n * 3), grav: new Float32Array(n),
      life: new Float32Array(n), maxLife: new Float32Array(n),
      size0: new Float32Array(n), size1: new Float32Array(n),
      emit(x, y, z, o) {
        const i = this.cursor; this.cursor = (this.cursor + 1) % this.n;
        pos[i*3]=x; pos[i*3+1]=y; pos[i*3+2]=z;
        this.vel[i*3]=o.vx; this.vel[i*3+1]=o.vy; this.vel[i*3+2]=o.vz;
        this.grav[i]=o.g||0; this.life[i]=o.life; this.maxLife[i]=o.life;
        this.size0[i]=o.size0; this.size1[i]=o.size1;
        col[i*3]=o.r; col[i*3+1]=o.g; col[i*3+2]=o.b; alpha[i]=1; size[i]=o.size0;
      },
      update(dt) {
        for (let i = 0; i < this.n; i++) {
          if (this.life[i] <= 0) { if (alpha[i] !== 0) alpha[i] = 0; continue; }
          this.life[i] -= dt;
          const k = Math.max(this.life[i] / this.maxLife[i], 0);
          pos[i*3]+=this.vel[i*3]*dt; pos[i*3+1]+=this.vel[i*3+1]*dt; pos[i*3+2]+=this.vel[i*3+2]*dt;
          this.vel[i*3+1]+=dt*this.grav[i];
          alpha[i]=k; size[i]=this.size1[i]+(this.size0[i]-this.size1[i])*k;
        }
        geo.attributes.position.needsUpdate = true;
        geo.attributes.aAlpha.needsUpdate = true;
        geo.attributes.aSize.needsUpdate = true;
      },
    };
  }

  function rnd(a) { return (Math.random()*2 - 1) * a; }
  let fire, dust, _acc = 0, _clock = 0, shells = [];

  S.initEffects = function () {
    fire = makeParticleSystem(2000, THREE.AdditiveBlending);   // 亮色火光/火花
    dust = makeParticleSystem(1200, THREE.NormalBlending);     // 淡煙/塵
    S.engine.scene.add(fire.points); S.engine.scene.add(dust.points);
    // 大筒砲彈池（小而暗的砲丸，沿拋物線飛行 + 煙霧尾跡）
    shells = [];
    const sgeo = new THREE.SphereGeometry(0.35, 8, 8);
    for (let i = 0; i < 18; i++) {
      const m = new THREE.Mesh(sgeo, new THREE.MeshStandardMaterial({ color: 0x232323, roughness: 0.5 }));
      m.visible = false; S.engine.scene.add(m);
      shells.push({ mesh: m, active: false, age: 0, dur: 1, peak: 10,
        p0: new THREE.Vector3(), p1: new THREE.Vector3() });
    }
  };

  // 亮色火花（黃→橙→紅，加色發光）
  function sparks(x, y, z, n, spread, power) {
    for (let i = 0; i < n; i++) {
      const c = Math.random();
      const r = 1.0, g = 0.45 + c * 0.45, b = 0.12 + c * 0.2;        // 紅橙黃漸層
      fire.emit(x + rnd(spread), y + 1 + rnd(spread*0.6), z + rnd(spread), {
        vx: rnd(power), vy: Math.random()*power*0.7, vz: rnd(power),
        life: 0.16 + Math.random()*0.14, size0: 4 + Math.random()*5, size1: 0.5, r, g, b, g_:0 });
    }
  }
  // 少量淡煙（不變黑團）
  function lightSmoke(x, y, z, n) {
    for (let i = 0; i < n; i++) dust.emit(x + rnd(1), y + 1, z + rnd(1), {
      vx: rnd(0.6), vy: 1 + Math.random()*0.8, vz: rnd(0.6), g: 0.4,
      life: 0.9 + Math.random()*0.6, size0: 1.5, size1: 7 + Math.random()*3,
      r: 0.78, g: 0.75, b: 0.7 });
  }
  // 鉄砲齊射：砲口亮火花 + 一縷淡煙
  function teppoVolley(x, y, z) { sparks(x, y, z, 4, 1, 3); if (Math.random()<0.5) lightSmoke(x,y,z,1); }

  // 騎馬衝刺：騎兵塵浪向前突進
  function cavalryCharge(x, y, z, fx, fz) {
    for (let i = 0; i < 4; i++) {                              // 向前衝的騎兵點
      const d = 2 + Math.random()*4;
      dust.emit(x + rnd(1.5), y + 0.8, z + rnd(1.5), {
        vx: fx*16 + rnd(3), vy: rnd(1), vz: fz*16 + rnd(3), g: 0,
        life: 0.45 + Math.random()*0.25, size0: 3, size1: 1.5, r: 0.32, g: 0.24, b: 0.16 });
    }
    for (let i = 0; i < 5; i++)                                 // 揚起的塵
      dust.emit(x - fx*2 + rnd(2), y + 0.3, z - fz*2 + rnd(2), {
        vx: rnd(1.5), vy: 0.6 + Math.random()*0.6, vz: rnd(1.5), g: 0.3,
        life: 0.8 + Math.random()*0.5, size0: 2, size1: 9 + Math.random()*3, r: 0.72, g: 0.63, b: 0.5 });
  }

  // 著彈爆炸：大片橙紅火球 + 四濺火花 + 翻騰濃煙
  function impactBurst(x, y, z) {
    for (let i = 0; i < 7; i++) fire.emit(x + rnd(1.8), y + 1.5 + rnd(1), z + rnd(1.8), {  // 火球
      vx: rnd(2.5), vy: 2 + Math.random()*4, vz: rnd(2.5), life: 0.38 + Math.random()*0.22,
      size0: 13 + Math.random()*9, size1: 2, r: 1.0, g: 0.42 + Math.random()*0.3, b: 0.12 });
    sparks(x, y, z, 16, 3.2, 13);                                                          // 火花四濺
    for (let i = 0; i < 5; i++) dust.emit(x + rnd(2), y + 2.5 + rnd(1), z + rnd(2), {       // 翻騰煙
      vx: rnd(1.6), vy: 2 + Math.random()*1.6, vz: rnd(1.6), g: 0.5,
      life: 1.3 + Math.random()*0.8, size0: 3, size1: 13 + Math.random()*5, r: 0.4, g: 0.37, b: 0.34 });
  }

  // 發射一發大筒砲彈（拋物線）
  function launchShell(x0, y0, z0, x1, y1, z1) {
    const s = shells.find(s => !s.active); if (!s) return;
    s.active = true; s.age = 0;
    const dist = Math.hypot(x1 - x0, z1 - z0);
    s.dur = 0.9 + dist * 0.012; s.peak = Math.min(8 + dist * 0.35, 36);
    s.p0.set(x0, y0 + 2, z0); s.p1.set(x1, y1, z1);
    s.mesh.visible = true; s.mesh.position.copy(s.p0);
    // 砲口：巨爆閃 + 濃煙
    sparks(x0, y0 + 2, z0, 7, 1.4, 7);
    for (let i = 0; i < 4; i++) dust.emit(x0 + rnd(1), y0 + 1.5 + rnd(0.5), z0 + rnd(1), {
      vx: rnd(1.2), vy: 1.2 + Math.random(), vz: rnd(1.2), g: 0.4,
      life: 1.1 + Math.random()*0.6, size0: 2, size1: 9 + Math.random()*3, r: 0.72, g: 0.7, b: 0.66 });
    // 拋物線軌跡：沿弧線撒一排亮點（像瞄準軌跡）
    const N = 16;
    for (let i = 1; i < N; i++) {
      const k = i / N;
      const px = x0 + (x1 - x0) * k, pz = z0 + (z1 - z0) * k;
      const py = (y0 + 2) + (y1 - (y0 + 2)) * k + s.peak * 4 * k * (1 - k);
      fire.emit(px, py, pz, { vx: 0, vy: 0, vz: 0, life: s.dur * 0.95,
        size0: 3.4, size1: 2.4, r: 1.0, g: 0.78, b: 0.32 });
    }
  }
  function updateShells(dt) {
    for (const s of shells) {
      if (!s.active) continue;
      s.age += dt; const k = s.age / s.dur;
      if (k >= 1) { s.active = false; s.mesh.visible = false; impactBurst(s.p1.x, s.p1.y, s.p1.z); continue; }
      const x = s.p0.x + (s.p1.x - s.p0.x) * k, z = s.p0.z + (s.p1.z - s.p0.z) * k;
      const y = s.p0.y + (s.p1.y - s.p0.y) * k + s.peak * 4 * k * (1 - k);   // 拋物線
      s.mesh.position.set(x, y, z);
      // 煙霧尾跡：沿拋物線畫出軌跡
      dust.emit(x, y, z, { vx:0, vy:0.4, vz:0, g:0, life:0.55, size0:1.4, size1:4.5, r:0.82, g:0.8, b:0.76 });
    }
  }

  // 兩軍接觸點交戰：亮火花（給 engage.js 呼叫）
  S.combatBurst = function (x, y, z) { sparks(x, y, z, 5, 2, 5); if (Math.random()<0.35) lightSmoke(x,y,z,1); };

  S.updateEffects = function (t, dt) {
    if (!fire) return;
    _clock += dt;
    _acc += dt;
    if (_acc >= 0.06) {
      _acc = 0;
      const pts = S.firePoints ? S.firePoints() : [];
      for (const p of pts) {
        let fx = p.moveDir ? p.moveDir.dx : 0, fz = p.moveDir ? p.moveDir.dz : 0;
        let m = Math.hypot(fx, fz);
        if (m < 1e-4) { fx = -p.x; fz = -p.z; m = Math.hypot(fx, fz) || 1; }
        fx /= m; fz /= m;
        switch (p.kind) {
          case 'artillery':                       // 石田大筒：拋物線砲彈射向鄰近敵陣
            if (Math.random() < 0.14) {
              const reach = 6 + Math.random()*8;    // 約 360~840m(1 場景單位≈60m),不跨整個戰場
              const tx = p.x + fx*reach, tz = p.z + fz*reach;
              const ty = S.terrain ? S.terrain.heightAt(tx, tz) : p.y;
              launchShell(p.x, p.y, p.z, tx, ty, tz);
            } break;
          case 'cavalry':   if (Math.random() < 0.7)  cavalryCharge(p.x, p.y, p.z, fx, fz); break;
          case 'matchlock': if (Math.random() < 0.3)  teppoVolley(p.x, p.y, p.z); break;
          default:          if (Math.random() < 0.12) teppoVolley(p.x, p.y, p.z);
        }
      }
    }
    updateShells(dt);
    fire.update(dt); dust.update(dt);
  };
})(window.SEKI);
