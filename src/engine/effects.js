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
    for (let i = 0; i < 40; i++) {   // 池放大：容納 B-24 多次飛掠的成串炸彈(stick) + 砲彈同時飛行
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

  // —— 現代戰鬥特效（諾曼第）——
  // 曳光彈火網：自碉堡射口朝灘頭(+前方)掃出紅色曳光點
  function mgTracer(x,y,z,fx,fz){
    for(let i=0;i<3;i++){
      const a = rnd(0.38);                                 // 火網左右掃動（raking fire 扇形）
      const cx = fx*Math.cos(a) - fz*Math.sin(a), cz = fx*Math.sin(a) + fz*Math.cos(a);
      fire.emit(x+cx*1.5, y+1.6, z+cz*1.5, { vx:cx*42+rnd(2), vy:rnd(1.0), vz:cz*42+rnd(2),
        life:0.28, size0:2.6, size1:1.4, r:1.0, g:0.5, b:0.18 }); }
  }
  // 朝天曳光彈流：自高射砲口往天空噴出一道上升的紅黃曳光點(高初速、會略散)
  function flakTracerStream(x,y,z){
    const ax = rnd(0.22), az = rnd(0.22);                 // 砲管略偏，讓多道曳光朝不同天區
    for(let i=0;i<4;i++){
      const sp = 30 + Math.random()*10;                   // 沿曳光線等距撒點，形成連續光柱
      fire.emit(x+rnd(0.5), y+2.2+i*0.4, z+rnd(0.5), {
        vx: ax*sp+rnd(1), vy: sp+rnd(3), vz: az*sp+rnd(1),
        life: 0.34+Math.random()*0.12, size0: 3.2, size1: 1.2, r:1.0, g:0.62, b:0.22 });
    }
  }
  // 高空 airburst：棉花團爆炸(亮橙閃心 + 黑灰煙球綻開，模擬 88mm flak puff)
  function flakAirburst(x,y,z){
    sparks(x,y,z,5,1.4,9);                                 // 閃心：橙黃火花綻開
    for(let i=0;i<3;i++) fire.emit(x,y,z,{ vx:rnd(3),vy:rnd(3),vz:rnd(3),
      life:0.2, size0:9+Math.random()*4, size1:1, r:1,g:0.6,b:0.2 });
    for(let i=0;i<7;i++) dust.emit(x+rnd(1.2),y+rnd(1.2),z+rnd(1.2),{ vx:rnd(0.7),vy:0.3+rnd(0.4),vz:rnd(0.7),g:0,
      life:0.9+Math.random()*0.6, size0:2.5, size1:11+Math.random()*4, r:0.3,g:0.3,b:0.32 }); // 棉花團黑煙
  }
  // 對空高射砲(單發)：朝天曳光彈流 + 一朵高空棉花團 airburst
  function flakBurst(x,y,z){
    flakTracerStream(x,y,z);
    const hx=x+rnd(14), hy=26+Math.random()*20, hz=z+rnd(14);
    flakAirburst(hx,hy,hz);
  }
  // 漫天高射砲火(密集版)：多道朝天曳光 + 多朵高空棉花團 airburst → 空降/空襲時鋪滿天空
  function flakBarrage(x,y,z){
    for(let i=0;i<3;i++) flakTracerStream(x+rnd(2),y,z+rnd(2));   // 多道曳光齊射
    for(let i=0;i<3;i++){                                          // 多朵高空爆炸散佈整片天空
      const hx=x+rnd(26), hy=24+Math.random()*26, hz=z+rnd(26);
      flakAirburst(hx,hy,hz);
    }
  }
  // 水花：砲彈落海濺起白色水柱（用於艦砲未命中/近灘）
  function waterSplash(x,z){
    const y=0.4;
    for(let i=0;i<6;i++) dust.emit(x+rnd(1),y,z+rnd(1),{ vx:rnd(1.4),vy:4+Math.random()*4,vz:rnd(1.4),g:1.2,
      life:0.7+Math.random()*0.3, size0:2, size1:7, r:0.85,g:0.9,b:0.95 });
  }
  // 戰車/艦砲口閃光（短促亮閃 + 煙）
  function muzzleFlash(x,y,z,fx,fz,power){
    sparks(x,y,z,5,0.8,power||6);
    dust.emit(x+fx,y,z+fz,{ vx:fx*3,vy:0.8,vz:fz*3,g:0.3, life:0.8, size0:2,size1:7, r:0.7,g:0.68,b:0.64 });
  }
  // 空襲投彈：自飛機高度近乎垂直墜落、著地大爆炸
  //   史實 B-24 因雲層遮蔽延遲投彈 → 炸彈越過灘頭工事、落入『灘後內陸』。
  //   故落點偏內陸(本圖 lat 越低越內陸 = +z 方向)，並用 terrain 確認落在陸地而非海面；
  //   若指定 target(交戰對象)則以其位置為基準向內陸再退一段。
  //   單發炸彈：挑一個偏內陸且落在陸地的落點，從飛機高度近乎垂直墜落。
  function dropOneBomb(x,y,z,fx,fz,target,ahead){
    const s = shells.find(s => !s.active); if (!s) return;
    let bx, bz;
    if (target) { bx = target.x; bz = target.z; }          // 以據點為基準
    else { const reach = 8 + Math.random()*12; bx = x + fx*reach; bz = z + fz*reach; }
    bx += fx*(ahead||0); bz += fz*(ahead||0);              // 串列投彈：沿航向前移，形成一條彈著線
    // 嘗試數個偏內陸(+z)的落點，挑第一個落在陸地(高於海面)的；皆不行則取最高者
    let tx = bx, tz = bz, ty = -1, bestY = -1e9, bx2 = bx, bz2 = bz;
    for (let i = 0; i < 4; i++) {
      const cx = bx + rnd(6), cz = bz + (12 + Math.random()*22);   // 往內陸推 12~34
      const cy = S.terrain ? S.terrain.heightAt(cx, cz) : 0;
      if (cy > bestY) { bestY = cy; bx2 = cx; bz2 = cz; }
      if (cy > 1.0) { tx = cx; tz = cz; ty = cy; break; }          // 高於海面 → 確為陸地
    }
    if (ty < 0) { tx = bx2; tz = bz2; ty = Math.max(bestY, 0); }   // 退而求其次：最高(最不像海)的點
    s.active = true; s.age = 0;
    s.dur = 0.65 + Math.random()*0.3; s.peak = 0;        // peak=0 → 直線墜落、無拋物峰
    s.p0.set(x, y, z); s.p1.set(tx, ty, tz);
    s.mesh.visible = true; s.mesh.position.copy(s.p0);
  }
  // 一輪投彈：B-24 飛掠時釋放『一串炸彈(stick)』沿航向先後落地，而非只炸一發。
  //   每次觸發投下 3~5 發，沿 fx/fz 方向間隔排開 → 一條彈著線，視覺上連環爆炸。
  function dropBomb(x,y,z,fx,fz,target){
    const n = 3 + (Math.random()*3|0);                    // 一串 3~5 發
    for (let i = 0; i < n; i++) dropOneBomb(x,y,z,fx,fz,target, i*(6+Math.random()*4));
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
      const pts = S.firePoints ? S.firePoints(t) : [];
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
          case 'warship':
            if (Math.random() < 0.06) {                         // 艦砲齊射射向岸上據點；降頻以免畫面雜亂
              let tx, tz;
              if (p.target) {                                   // 有交戰對象 → 直接命中其灘頭/崖頂據點(加小散佈)
                tx = p.target.x + rnd(5); tz = p.target.z + rnd(5);
              } else {                                          // 無交戰對象 → 一律朝岸/灘頭內陸開火，絕不朝外海亂射
                const shore = S.engine.project(-0.895 + Math.random()*0.085, 49.372 - Math.random()*0.012, 0);
                tx = shore.x; tz = shore.z;
              }
              const ty = S.terrain ? S.terrain.heightAt(tx, tz) : p.y;
              // 砲口方向對準落點(而非單純移動方向)，閃光才不會背對目標
              let mfx = tx - p.x, mfz = tz - p.z; const mm = Math.hypot(mfx, mfz) || 1; mfx/=mm; mfz/=mm;
              muzzleFlash(p.x, p.y+4, p.z, mfx, mfz, 9);
              launchShell(p.x, p.y+4, p.z, tx, ty, tz);
            } else if (Math.random() < 0.05) waterSplash(p.x+fx*(10+rnd(8)), p.z+fz*(10+rnd(8))); // 近岸落彈水柱
            break;
          case 'bunker':
            if (Math.random() < 0.85) mgTracer(p.x, p.y, p.z, fx, fz); break;
          case 'flak': {
            // AA 活躍時段：凌晨空降(t0.5~2.2) + 拂曉空襲(t5.8~7) → 漫天高射砲火，密度拉高
            const aaHot = (t >= 0.5 && t <= 2.2) || (t >= 5.8 && t <= 7.0);
            if (aaHot) { if (Math.random() < 0.9) flakBarrage(p.x, p.y, p.z); }  // 多道曳光+多朵爆炸
            else if (Math.random() < 0.35) flakBurst(p.x, p.y, p.z);             // 平時零星對空
            break;
          }
          case 'armor':
            if (Math.random() < 0.18) {
              let tx, tz;
              if (p.target) { tx = p.target.x + rnd(4); tz = p.target.z + rnd(4); }   // 對準交戰據點
              else { const reach=8+Math.random()*8; tx=p.x+fx*reach; tz=p.z+fz*reach; }
              const ty=S.terrain?S.terrain.heightAt(tx,tz):p.y;
              let mfx=tx-p.x, mfz=tz-p.z; const mm=Math.hypot(mfx,mfz)||1; mfx/=mm; mfz/=mm;
              muzzleFlash(p.x,p.y+2,p.z,mfx,mfz,6); launchShell(p.x,p.y+2,p.z,tx,ty,tz);
            } break;
          case 'landingcraft':
            if (Math.random() < 0.4)                              // 搶灘：跳板前方步兵衝出的塵土
              dust.emit(p.x+fx*3+rnd(1.5), p.y+0.5, p.z+fz*3+rnd(1.5),
                { vx:fx*6+rnd(2), vy:0.5+Math.random(), vz:fz*6+rnd(2), g:0.3, life:0.5, size0:1.4, size1:4, r:0.72,g:0.68,b:0.6 });
            if (Math.random() < 0.08) waterSplash(p.x+rnd(4), p.z+rnd(4)); break;
          case 'aircraft':
            // B-24 多次轟炸：只要這架轟炸機出現在 firePoints(armies.js 端讓它多次飛掠 attack 上空)，
            // 就每一輪 emit 機率性投下『一串炸彈(stick)』→ 整段飛掠期間連環落彈、落內陸。
            // armies.js 安排 bombers 做多次 pass，故畫面上會看到 B-24 反覆飛過去多炸幾次。
            if (Math.random() < 0.55) dropBomb(p.x, p.y, p.z, fx, fz, p.target); break;
          default:          if (Math.random() < 0.12) teppoVolley(p.x, p.y, p.z);
        }
      }
    }
    updateShells(dt);
    fire.update(dt); dust.update(dt);
  };
})(window.SEKI);
