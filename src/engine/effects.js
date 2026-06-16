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
  // 白色趨勢指引線池：每條 Line 預配固定頂點，逐段描出彈道弧線，彈丸過後延遲淡出。
  let trails = [];
  const TRAIL_SEG = 48;                       // 每條趨勢線最大頂點數(描繪解析度)
  // 衝擊波環池：爆炸瞬間外擴的薄環(分層次爆炸的「第4層」)
  let rings = [];
  // 目前時刻(小時)，由 updateEffects 更新；供曳光在夜間/凌晨加亮使用
  let _tod = 8;
  // 夜間/凌晨發光增益：天色越暗，曳光與砲彈拖尾越亮越顯眼。
  //   以「時刻取 24 小時餘數」判斷晝夜：~18:00→05:00 為夜，05:00~07:30 為拂曉漸亮。
  //   純美術用途，對三場戰役都成立(關原 t 可為負/晨戰、諾曼第 t 可跨日)。
  function nightGlow() {
    let h = _tod % 24; if (h < 0) h += 24;
    if (h >= 18 || h <= 5) return 1.6;                 // 深夜：最亮
    if (h < 7.5) return 1.6 - (h - 5) / 2.5 * 0.6;     // 拂曉：1.6→1.0 線性收斂
    return 1.0;                                        // 白晝：基準
  }

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
        p0: new THREE.Vector3(), p1: new THREE.Vector3(),
        glow: 1,                                     // 此發拖尾亮度(發射當下依晝夜固定，飛行中一致)
        bomb: false,                                 // 是否為炸彈(垂直墜落、無砲口曳光)
        trail: null,                                 // 綁定的趨勢指引線(launchShell 時取得)
        _trail: 0, _px: 0, _py: 0, _pz: 0 });        // 拖尾發射節流計時 + 上一幀位置(算速度方向)
    }
    // ——衝擊波環池——
    //   貼地/空中的薄環，爆炸瞬間快速外擴並淡出。用 RingGeometry Mesh(加色半透明)，
    //   每幀只改 scale 與 opacity，不重建幾何 → 控效能。
    rings = [];
    const rgeo = new THREE.RingGeometry(0.82, 1.0, 28);   // 薄環(內外半徑接近)
    for (let i = 0; i < 16; i++) {
      const rmat = new THREE.MeshBasicMaterial({ color: 0xffe7b0, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
      const rm = new THREE.Mesh(rgeo, rmat);
      rm.frustumCulled = false; rm.visible = false;
      S.engine.scene.add(rm);
      rings.push({ mesh: rm, mat: rmat, active: false, age: 0, dur: 0.5, r0: 1, r1: 12, flat: true });
    }

    // ——白色趨勢指引線池——
    //   每條 Line 預配 TRAIL_SEG 個頂點，飛行中逐段「描出」拋物線(setDrawRange 控可見段數)，
    //   彈丸落地後標記 fading，line 延遲淡出(material.opacity 漸降)後歸還池中。
    //   只更新既有 position attribute 與 drawRange，不重建幾何 → 控效能。
    trails = [];
    for (let i = 0; i < 24; i++) {                  // 砲彈/炸彈最多同時 ~ 數十發，趨勢線稍少於砲彈池即可
      const tgeo = new THREE.BufferGeometry();
      const tpos = new Float32Array(TRAIL_SEG * 3);
      tgeo.setAttribute('position', new THREE.BufferAttribute(tpos, 3));
      tgeo.setDrawRange(0, 0);
      const tmat = new THREE.LineBasicMaterial({
        color: 0xffffff, transparent: true, opacity: 0.0,
        blending: THREE.AdditiveBlending, depthWrite: false });   // 細白發光、加色半透明
      const line = new THREE.Line(tgeo, tmat);
      line.frustumCulled = false; line.visible = false;
      S.engine.scene.add(line);
      trails.push({ line, geo: tgeo, pos: tpos, mat: tmat,
        active: false, fading: false, count: 0, fade: 0, fadeDur: 0.5 });
    }
  };

  // 取得一條空閒趨勢線並重置(綁定到一發砲彈/炸彈)。線從 0 段開始，隨彈丸推進逐段加點。
  function acquireTrail() {
    const t = trails.find(t => !t.active && !t.fading); if (!t) return null;
    t.active = true; t.fading = false; t.count = 0; t.fade = 0;
    t.mat.opacity = 0.9; t.geo.setDrawRange(0, 0); t.line.visible = true;
    return t;
  }
  // 在趨勢線尾端追加一個描繪點(更新既有 position attribute + drawRange，不重建幾何)。
  function pushTrailPoint(t, x, y, z) {
    if (!t || t.count >= TRAIL_SEG) return;
    const i = t.count * 3;
    t.pos[i] = x; t.pos[i+1] = y; t.pos[i+2] = z;
    t.count++;
    t.geo.setDrawRange(0, t.count);
    t.geo.attributes.position.needsUpdate = true;
    t.geo.computeBoundingSphere && (t.geo.boundingSphere = null);
  }
  // 彈丸落地：讓趨勢線進入「延遲淡出」狀態(略晚於彈丸消失，像描出的弧線餘留後漸隱)。
  function releaseTrail(t) { if (t) { t.fading = true; t.fadeDur = 0.45; t.fade = 0; } }
  // 每幀推進趨勢線淡出：opacity 由 0.9 漸降至 0，結束後歸還池、隱藏。
  function updateTrails(dt) {
    for (const t of trails) {
      if (!t.fading) continue;
      t.fade += dt;
      const k = 1 - Math.min(t.fade / t.fadeDur, 1);
      t.mat.opacity = 0.9 * k;
      if (k <= 0) { t.fading = false; t.active = false; t.line.visible = false; t.geo.setDrawRange(0, 0); }
    }
  }

  // 觸發一圈衝擊波環(分層次爆炸第4層)。flat=true → 貼地水平鋪開；false → 空中朝鏡頭面立。
  //   col 為環色(地爆偏暖白、空爆偏冷白)；r1 為外擴終半徑；dur 控外擴速度。
  function spawnRing(x, y, z, r0, r1, dur, flat, col) {
    const rg = rings.find(r => !r.active); if (!rg) return;
    rg.active = true; rg.age = 0; rg.dur = dur; rg.r0 = r0; rg.r1 = r1; rg.flat = flat;
    if (col) rg.mat.color.setRGB(col[0], col[1], col[2]);
    rg.mat.opacity = 0.85; rg.mesh.visible = true;
    rg.mesh.position.set(x, y, z);
    if (flat) rg.mesh.rotation.set(-Math.PI/2, 0, 0);   // 平躺貼地
    else rg.mesh.rotation.set(0, 0, 0);                 // 立面(空爆)
    rg.mesh.scale.setScalar(r0);
  }
  // 每幀推進衝擊波環：半徑由 r0 線性外擴到 r1(前段快、easeOut)，opacity 同步淡出。
  function updateRings(dt) {
    for (const rg of rings) {
      if (!rg.active) continue;
      rg.age += dt; const k = Math.min(rg.age / rg.dur, 1);
      const e = 1 - (1 - k) * (1 - k);                  // easeOut：起步快、收尾緩
      const r = rg.r0 + (rg.r1 - rg.r0) * e;
      rg.mesh.scale.setScalar(r);
      rg.mat.opacity = 0.85 * (1 - k);
      if (k >= 1) { rg.active = false; rg.mesh.visible = false; }
    }
  }

  // ——分層次爆炸共用層——(避免「黑黑一坨」：煙用偏亮灰白、上緣受光更亮、底部略暗做體積感)
  // 第1層 瞬間亮白/黃閃核(additive，極短)
  function layerFlash(x, y, z, scale) {
    for (let i = 0; i < 3; i++) fire.emit(x + rnd(0.4), y + rnd(0.4), z + rnd(0.4), {
      vx: rnd(0.5), vy: rnd(0.5), vz: rnd(0.5), g: 0,
      life: 0.08 + Math.random()*0.05, size0: (16 + Math.random()*8)*scale, size1: 4,
      r: 1.0, g: 0.97, b: 0.85 });                       // 近白偏黃的熾亮閃核
  }
  // 第2層 橙紅火球膨脹(additive，快速放大後淡)
  function layerFireball(x, y, z, n, scale, vy0) {
    for (let i = 0; i < n; i++) { const c = Math.random();
      fire.emit(x + rnd(1.6*scale), y + rnd(1.2*scale), z + rnd(1.6*scale), {
        vx: rnd(2.4*scale), vy: vy0 + Math.random()*3.5*scale, vz: rnd(2.4*scale),
        life: 0.34 + Math.random()*0.24,
        size0: (10 + Math.random()*8)*scale, size1: (1.5 + Math.random()*2),
        r: 1.0, g: 0.4 + c*0.32, b: 0.1 + c*0.12 });     // 橙紅漸層火球
    }
  }
  // 第3層 翻滾煙團(偏亮灰白、多顆錯開膨脹上升，呈體積層次；上緣受光更亮、底部略暗)
  function layerSmoke(x, y, z, n, scale, rise) {
    for (let i = 0; i < n; i++) {
      const up = Math.random();                          // 越往上的煙團越受光 → 更亮
      const lum = 0.62 + up*0.18;                        // 亮度 0.62→0.80(偏亮灰白，不死黑)
      dust.emit(x + rnd(2.2*scale), y + 0.5 + up*2.5*scale, z + rnd(2.2*scale), {
        vx: rnd(1.4*scale), vy: rise*(0.6 + up*1.1), vz: rnd(1.4*scale), g: 0.35,
        life: 1.2 + Math.random()*0.9,
        size0: 3*scale, size1: (12 + Math.random()*6)*scale,
        r: lum + 0.10, g: lum, b: lum - 0.06 });          // r0.72/g0.70/b0.66 一帶的偏亮灰白
    }
  }

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

  // 著彈爆炸(分層次，非黑黑一坨)：亮白核→橙紅火球→偏亮灰白翻滾煙團→貼地衝擊波環→火花碎片四射
  function impactBurst(x, y, z) {
    layerFlash(x, y + 1.2, z, 1.1);                              // 第1層：瞬間亮白/黃閃核
    layerFireball(x, y + 1.5, z, 8, 1.1, 2);                     // 第2層：橙紅火球膨脹上升
    layerSmoke(x, y + 1.5, z, 7, 1.1, 2.0);                      // 第3層：偏亮灰白翻滾煙團(體積層次)
    spawnRing(x, y + 0.3, z, 1.2, 14, 0.5, true, [1.0, 0.86, 0.55]);  // 第4層：貼地衝擊波環(暖白)外擴
    sparks(x, y, z, 16, 3.2, 13);                                // 第5層：火花四射(additive 亮點，重力下墜)
    for (let i = 0; i < 8; i++) fire.emit(x + rnd(0.6), y + 1, z + rnd(0.6), {  // 額外碎片(更亮、拋更遠、會墜)
      vx: rnd(7), vy: 4 + Math.random()*7, vz: rnd(7), g: -14,
      life: 0.5 + Math.random()*0.4, size0: 2.4 + Math.random()*2, size1: 0.4,
      r: 1.0, g: 0.7 + Math.random()*0.2, b: 0.3 });
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
  // 高空 airburst(分層次經典 flak puff，不要黑塊)：
  //   白閃核 → 灰白棉花煙球外擴(偏亮，非死黑) → 空中衝擊波薄環 → 橙黃火花四射綻開。
  function flakAirburst(x,y,z){
    layerFlash(x, y, z, 0.85);                              // 第1層：白閃核(極短)
    for(let i=0;i<3;i++) fire.emit(x,y,z,{ vx:rnd(3),vy:rnd(3),vz:rnd(3),  // 第2層：小橙閃心(快淡)
      life:0.2, size0:9+Math.random()*4, size1:1, r:1,g:0.62,b:0.22 });
    for(let i=0;i<8;i++){                                   // 第3層：偏亮灰白棉花煙球(四面綻開、非黑塊)
      const up = Math.random(); const lum = 0.66 + up*0.14;  // 上緣受光更亮(0.66→0.80)
      dust.emit(x+rnd(1.2),y+rnd(1.2),z+rnd(1.2),{ vx:rnd(1.0),vy:0.2+rnd(0.5),vz:rnd(1.0),g:0,
        life:0.9+Math.random()*0.6, size0:2.5, size1:11+Math.random()*4,
        r:lum+0.06, g:lum, b:lum-0.04 });                   // 灰白煙(偏亮)而非接近全黑
    }
    spawnRing(x, y, z, 0.8, 9, 0.4, false, [0.86, 0.9, 1.0]); // 第4層：空中衝擊波薄環(冷白、立面)外擴
    sparks(x,y,z,7,1.6,10);                                 // 第5層：橙黃火花四射綻開
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
  //   精緻化：中央高水柱 + 四周斜射的細水沫 + 落點外擴的低矮泡沫環，落水更有層次。
  function waterSplash(x,z){
    const y=0.4;
    for(let i=0;i<6;i++) dust.emit(x+rnd(1),y,z+rnd(1),{ vx:rnd(1.4),vy:5+Math.random()*4,vz:rnd(1.4),g:1.2,
      life:0.7+Math.random()*0.3, size0:2, size1:7, r:0.85,g:0.9,b:0.95 });   // 中央水柱
    for(let i=0;i<8;i++){                                                       // 四散斜射細水沫
      const a=Math.random()*Math.PI*2, sp=3+Math.random()*4;
      dust.emit(x+rnd(0.6),y+0.3,z+rnd(0.6),{ vx:Math.cos(a)*sp,vy:2+Math.random()*3,vz:Math.sin(a)*sp,g:1.4,
        life:0.5+Math.random()*0.3, size0:1, size1:4, r:0.9,g:0.94,b:0.98 });
    }
    for(let i=0;i<5;i++){                                                       // 外擴泡沫環(貼水面平鋪)
      const a=Math.random()*Math.PI*2, sp=2+Math.random()*2;
      dust.emit(x+Math.cos(a)*1.2,y,z+Math.sin(a)*1.2,{ vx:Math.cos(a)*sp,vy:0.3,vz:Math.sin(a)*sp,g:0.2,
        life:0.6+Math.random()*0.3, size0:2, size1:8, r:0.92,g:0.95,b:0.97 });
    }
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
    s.active = true; s.age = 0; s.bomb = true;
    s.dur = 0.65 + Math.random()*0.3; s.peak = 0;        // peak=0 → 直線墜落、無拋物峰
    s.glow = nightGlow() * 0.8;                           // 炸彈曳光略淡(墜落短、避免搶過落地火球)
    s.p0.set(x, y, z); s.p1.set(tx, ty, tz);
    s._px = x; s._py = y; s._pz = z; s._trail = 0;
    s.trail = acquireTrail();                        // 炸彈墜落線：同樣逐段描出趨勢指引線
    if (s.trail) pushTrailPoint(s.trail, s.p0.x, s.p0.y, s.p0.z);
    s.mesh.visible = true; s.mesh.position.copy(s.p0);
  }
  // 一輪投彈：B-24 飛掠時釋放『一串炸彈(stick)』沿航向先後落地，而非只炸一發。
  //   每次觸發投下 3~5 發，沿 fx/fz 方向間隔排開 → 一條彈著線，視覺上連環爆炸。
  function dropBomb(x,y,z,fx,fz,target){
    const n = 3 + (Math.random()*3|0);                    // 一串 3~5 發
    for (let i = 0; i < n; i++) dropOneBomb(x,y,z,fx,fz,target, i*(6+Math.random()*4));
  }

  // 沿軌跡發光曳光：在(x,y,z)點放一顆加色亮點(熾紅彈頭→淡橘餘暉)，沿飛行方向略拉伸。
  //   glow 為晝夜亮度增益(夜更亮)；speed 影響拖尾長短。用既有 fire 粒子池，不另建資源。
  function tracerPuff(x, y, z, vx, vy, vz, glow, head) {
    const g0 = glow;
    if (head) {                                         // 彈頭：熾白黃亮核，明亮短命
      fire.emit(x, y, z, { vx: vx*0.18, vy: vy*0.18, vz: vz*0.18, g: 0,
        life: 0.12, size0: 6.5*g0, size1: 3*g0, r: 1.0, g: 0.92, b: 0.62 });
    }
    // 拖尾餘暉：橙紅、沿反向略漂移、漸淡(像曳光餘焰)
    fire.emit(x, y, z, { vx: -vx*0.05 + rnd(0.2), vy: -vy*0.05 + 0.3, vz: -vz*0.05 + rnd(0.2), g: 0.1,
      life: (0.3 + Math.random()*0.2),
      size0: (2.6 + Math.random()*1.4)*g0, size1: 0.6, r: 1.0, g: 0.55, b: 0.18 });
  }

  // 發射一發大筒砲彈（拋物線）
  function launchShell(x0, y0, z0, x1, y1, z1) {
    const s = shells.find(s => !s.active); if (!s) return;
    s.active = true; s.age = 0; s.bomb = false;
    const dist = Math.hypot(x1 - x0, z1 - z0);
    // 飛行時間隨距離拉長，遠彈飛得久 → 弧線從容不突兀
    s.dur = 0.9 + dist * 0.014;
    // 拋物峰高隨『水平距離』提升：遠的拋更高，近的壓低，弧線更自然(0.42 斜率, 上限抬高)
    s.peak = Math.min(7 + dist * 0.42, 44);
    s.glow = nightGlow();
    s.p0.set(x0, y0 + 2, z0); s.p1.set(x1, y1, z1);
    s._px = s.p0.x; s._py = s.p0.y; s._pz = s.p0.z; s._trail = 0;
    s.trail = acquireTrail();                        // 取得白色趨勢指引線，飛行中逐段描出弧線
    if (s.trail) pushTrailPoint(s.trail, s.p0.x, s.p0.y, s.p0.z);
    s.mesh.visible = true; s.mesh.position.copy(s.p0);
    // 砲口：巨爆閃 + 濃煙(夜間砲口閃更亮)
    sparks(x0, y0 + 2, z0, 7, 1.4, 7 * s.glow);
    for (let i = 0; i < 4; i++) dust.emit(x0 + rnd(1), y0 + 1.5 + rnd(0.5), z0 + rnd(1), {
      vx: rnd(1.2), vy: 1.2 + Math.random(), vz: rnd(1.2), g: 0.4,
      life: 1.1 + Math.random()*0.6, size0: 2, size1: 9 + Math.random()*3, r: 0.72, g: 0.7, b: 0.66 });
  }
  // 砲彈/炸彈沿拋物線推進，沿途即時噴發光曳光拖尾(取代舊版發射瞬間鋪滿的靜態弧)。
  function updateShells(dt) {
    for (const s of shells) {
      if (!s.active) continue;
      s.age += dt; const k = s.age / s.dur;
      if (k >= 1) {
        s.active = false; s.mesh.visible = false;
        // 趨勢線收尾：補上落點頂點後進入延遲淡出(像描完的弧線餘留再漸隱)
        if (s.trail) { pushTrailPoint(s.trail, s.p1.x, s.p1.y, s.p1.z); releaseTrail(s.trail); s.trail = null; }
        // 落點銜接：落入水面(高度≤海平面)濺水柱，落地則火球爆炸
        const seaY = 0.6;
        if (s.p1.y <= seaY) waterSplash(s.p1.x, s.p1.z);
        else impactBurst(s.p1.x, s.p1.y, s.p1.z);
        continue;
      }
      const x = s.p0.x + (s.p1.x - s.p0.x) * k, z = s.p0.z + (s.p1.z - s.p0.z) * k;
      const y = s.p0.y + (s.p1.y - s.p0.y) * k + s.peak * 4 * k * (1 - k);   // 拋物線
      s.mesh.position.set(x, y, z);
      // 趨勢指引線逐段描繪：依飛行進度 k 對應到該有的頂點數，缺幾段就補幾段(描出弧線)。
      if (s.trail) {
        const want = 1 + Math.floor(k * (TRAIL_SEG - 2));   // 隨進度增加可見段數，落地前留一格給落點
        while (s.trail.count < want) {
          const kk = (s.trail.count) / (TRAIL_SEG - 1);     // 以該段比例回算拋物線上的精確位置
          const px = s.p0.x + (s.p1.x - s.p0.x) * kk, pz = s.p0.z + (s.p1.z - s.p0.z) * kk;
          const py = s.p0.y + (s.p1.y - s.p0.y) * kk + s.peak * 4 * kk * (1 - kk);
          pushTrailPoint(s.trail, px, py, pz);
        }
      }
      // 即時速度方向(本幀位移)：讓曳光沿弧線切線拉伸，弧頂自然壓平、落段加速俯衝
      const vx = (x - s._px) / Math.max(dt, 1e-4),
            vy = (y - s._py) / Math.max(dt, 1e-4),
            vz = (z - s._pz) / Math.max(dt, 1e-4);
      s._px = x; s._py = y; s._pz = z;
      // 發光曳光拖尾：固定間隔撒點形成連續光帶(節流避免過量、控制粒子預算)。
      //   每段同時撒「彈頭亮核 + 橙紅餘暉 + 一縷淡煙」→ 熾亮彈頭後拉一條漸淡光痕加煙。
      s._trail += dt;
      if (s._trail >= 0.018) {
        s._trail = 0;
        tracerPuff(x, y, z, vx, vy, vz, s.glow, true);
        // 煙痕：沿拋物線淡煙(微量，免遮住曳光)
        dust.emit(x, y, z, { vx: rnd(0.15), vy: 0.4, vz: rnd(0.15), g: 0,
          life: 0.5, size0: 1.2, size1: 4.2, r: 0.82, g: 0.8, b: 0.76 });
      }
    }
  }

  // 兩軍接觸點交戰：亮火花（給 engage.js 呼叫）
  S.combatBurst = function (x, y, z) { sparks(x, y, z, 5, 2, 5); if (Math.random()<0.35) lightSmoke(x,y,z,1); };

  // 公開薄包裝：供 volley.js（拿破崙排槍/砲兵/騎兵衝擊）直接發射火光/煙塵粒子，
  //   沿用本檔粒子系統的逐粒生命/大小/顏色與每幀 update。o 同 fire.emit 之 {vx,vy,vz,g,life,size0,size1,r,g,b}。
  S.emitFire = function (x, y, z, o) { if (fire) fire.emit(x, y, z, o); };
  S.emitDust = function (x, y, z, o) { if (dust) dust.emit(x, y, z, o); };

  S.updateEffects = function (t, dt) {
    if (!fire) return;
    _clock += dt;
    _tod = t;                                 // 記錄目前時刻，供曳光夜間加亮(nightGlow)
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
    updateTrails(dt);                          // 推進白色趨勢指引線的延遲淡出
    updateRings(dt);                           // 推進衝擊波環外擴淡出(分層次爆炸第4層)
    fire.update(dt); dust.update(dt);
  };
})(window.SEKI);
