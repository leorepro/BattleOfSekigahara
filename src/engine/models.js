/* =========================================================================
 * src/engine/models.js — 現代單位程序化 low-poly 模型工廠（諾曼第用）
 *   SEKI.buildUnitMesh(kind, side, color) → THREE.Group（+X 為前方）
 *   僅在 SEKI.config.modern 為真時由 units.js 呼叫；前兩場戰役不載入此模組。
 * ======================================================================= */
window.SEKI = window.SEKI || {};
(function (S) {
  function mat(hex, rough) { return new THREE.MeshStandardMaterial({ color: hex, roughness: rough==null?0.7:rough, metalness: 0.1 }); }
  function box(w,h,d,m){ const g=new THREE.Mesh(new THREE.BoxGeometry(w,h,d), m); g.castShadow=true; return g; }
  const STEEL=0x5a6470, DKSTEEL=0x3c444e, HULL_ALLY=0x4b5a6e, CONCRETE=0x6b6356, RUST=0x7a3b30, KHAKI=0x6e6a44, BLACK=0x222428;

  function warship(side,color){
    const g=new THREE.Group();
    const hull=box(26,3,6,mat(HULL_ALLY,0.6)); hull.position.y=1.5; g.add(hull);     // 艦體（長軸沿 X，艏在 +X）
    // 艦艏（尖端，+X）：以四角錐做出前傾艦艏，讓船頭方向一目了然
    const bow=new THREE.Mesh(new THREE.ConeGeometry(3.0,5,4), mat(HULL_ALLY,0.6));
    bow.castShadow=true; bow.rotation.z=-Math.PI/2; bow.rotation.x=Math.PI/4;          // 尖端朝 +X
    bow.scale.set(1,1,0.6); bow.position.set(15,1.6,0); g.add(bow);
    // 艦艉（-X）：方艉收尾，與尖艏形成明確前後差異
    const stern=box(2,2.6,5.6,mat(HULL_ALLY,0.6)); stern.position.set(-13.3,1.5,0); g.add(stern);
    const deck=box(20,1,5,mat(STEEL,0.6)); deck.position.y=3.4; g.add(deck);
    const bridge=box(4,3,3.4,mat(STEEL,0.55)); bridge.position.set(-1,5,0); g.add(bridge);
    const funnel=box(1.6,3,1.6,mat(DKSTEEL,0.5)); funnel.position.set(-5,5.5,0); g.add(funnel);
    for(const x of [6,9.5]){ const t=box(3,1,2,mat(STEEL,0.5)); t.position.set(x,4.2,0); g.add(t);  // 主砲塔
      const bl=new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.35,4,8),mat(DKSTEEL,0.5));
      bl.rotation.z=Math.PI/2; bl.position.set(x+2.5,4.4,0); g.add(bl); }
    g.userData.muzzles=[{x:8.5,y:4.4,z:0},{x:11.5,y:4.4,z:0}];                          // 砲口(供特效)
    return g;
  }
  function landingcraft(side,color){
    const g=new THREE.Group();
    const hull=box(5,1.6,2.6,mat(KHAKI,0.7)); hull.position.y=0.8; g.add(hull);     // 艇體（長軸沿 X，艏在 +X）
    const ramp=box(0.3,1.4,2.4,mat(DKSTEEL,0.6)); ramp.position.set(2.6,0.9,0); ramp.name='ramp'; g.add(ramp); // 前跳板（船頭 +X，搶灘放下）
    const wall=box(4.6,0.6,0.2,mat(KHAKI,0.7)); wall.position.set(0,1.5,1.2); g.add(wall);
    const wall2=wall.clone(); wall2.position.z=-1.2; g.add(wall2);
    // 艉樓 + 舵手台（-X）：與前跳板形成明確前後差異，避免看起來倒退
    const stern=box(0.9,1.2,2.4,mat(KHAKI,0.7)); stern.position.set(-2.4,1.4,0); g.add(stern);
    const cox=box(0.7,0.7,0.9,mat(DKSTEEL,0.6)); cox.position.set(-2.4,2.2,0.6); g.add(cox); // 舵手台
    return g;
  }
  // 單架四發重轟炸機(B-24 風格)，+X 為機首；整機縮放後供編隊複製
  function oneBomber(side){
    const g=new THREE.Group();
    const body=mat(side==='east'?0x4a5560:0x4d5247, 0.55);
    const fus=new THREE.Mesh(new THREE.CylinderGeometry(0.7,0.5,10,10), body);
    fus.rotation.z=Math.PI/2; g.add(fus);                                 // 機身沿 X
    const nose=new THREE.Mesh(new THREE.SphereGeometry(0.7,10,8), body);
    nose.position.x=5; nose.scale.x=1.5; g.add(nose);                     // 機首
    const wing=box(2.6,0.25,16, mat(side==='east'?0x3f4954:0x454a40,0.55));
    wing.position.set(-0.3,0.15,0); g.add(wing);                          // 主翼(展向 Z，翼展 16)
    const hstab=box(1.6,0.2,7, body); hstab.position.set(-4.3,0.25,0); g.add(hstab);   // 平尾
    for(const dz of [-3.4,3.4]){ const fin=box(1.4,1.9,0.25, body); fin.position.set(-4.3,1.0,dz); g.add(fin); } // 雙垂尾
    for(const dz of [-5.2,-2.4,2.4,5.2]){ const nac=box(2.2,0.7,0.95, mat(0x32363a,0.5)); nac.position.set(0.5,-0.05,dz); g.add(nac); } // 4 引擎艙
    return g;
  }
  function aircraft(side,color){
    const g=new THREE.Group();                                            // 一個轟炸機編隊群組(以一個單位表示)，+X 為機首
    // 7 架排成 V 形/箭頭，沿飛行方向(+X)展開：長機居前(+X 尖端)，兩翼各 3 架「明顯往後(-X)」並左右分開(±Z)
    // [dx(前後), dz(左右), dy(高低)]；單機翼展 16、縮 0.5 後≈8，前後間距須大於左右間距才像箭頭、不像橫排
    const slots=[
      [ 24,   0,  0.0 ],   // 長機(編隊尖端，最前 +X)
      [ 10,  -8,  1.2 ],   // 左一(後、外、略高)
      [ 10,   8, -1.2 ],   // 右一(後、外、略低)
      [ -4, -16,  2.4 ],   // 左二(更後更外更高)
      [ -4,  16, -2.4 ],   // 右二
      [-18, -24,  0.6 ],   // 左三(梯隊末端)
      [-18,  24, -0.6 ],   // 右三
    ];
    for(const [dx,dz,dy] of slots){
      const plane=oneBomber(side);
      plane.scale.setScalar(0.5);                                         // 縮小避免整體過大
      plane.position.set(dx, dy, dz);
      g.add(plane);
    }
    g.userData.muzzles=[];
    return g;
  }
  function armor(side,color){
    const g=new THREE.Group();
    const hull=box(5,1.4,2.6,mat(KHAKI,0.8)); hull.position.y=0.9; g.add(hull);
    const turret=box(2.4,1,2,mat(KHAKI,0.8)); turret.position.set(-0.2,2,0); g.add(turret);
    const barrel=new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.18,3,8),mat(DKSTEEL,0.6));
    barrel.rotation.z=Math.PI/2; barrel.position.set(2,2.1,0); g.add(barrel);
    g.userData.muzzles=[{x:3.4,y:2.1,z:0}];
    return g;
  }
  function bunker(side,color){
    const g=new THREE.Group();
    const base=box(4,2.4,4,mat(CONCRETE,0.95)); base.position.y=1.2; g.add(base);
    const slit=box(4.05,0.5,2.2,mat(BLACK,1)); slit.position.set(0,1.9,0); g.add(slit);  // 射口（朝 +X 灘頭）
    const top=box(4.4,0.4,4.4,mat(CONCRETE,0.95)); top.position.y=2.6; g.add(top);
    g.userData.muzzles=[{x:2.1,y:1.9,z:0}];                                              // MG 射口
    return g;
  }
  function flak(side,color){
    const g=new THREE.Group();
    const base=new THREE.Mesh(new THREE.CylinderGeometry(1.4,1.8,0.6,10),mat(CONCRETE,0.9));
    base.position.y=0.3; g.add(base);
    const mount=box(1,0.8,1,mat(DKSTEEL,0.6)); mount.position.y=0.9; g.add(mount);
    for(const dz of [-0.3,0.3]){ const bl=new THREE.Mesh(new THREE.CylinderGeometry(0.13,0.13,3.2,8),mat(BLACK,0.5));
      bl.position.set(0.4,1.6,dz); bl.rotation.z=-Math.PI/4; g.add(bl); }                // 仰角砲管
    g.userData.muzzles=[{x:1.6,y:2.6,z:0}]; g.userData.aa=true;
    return g;
  }
  function infantry(side,color){
    const g=new THREE.Group();                                                          // 小班：3 個矮人形 + 底環
    for(const dx of [-0.8,0,0.8]){ const b=box(0.5,1.4,0.5,mat(side==='east'?0x4d5a48:0x5b5340,0.9));
      b.position.set(dx,0.7,(Math.random()-0.5)); g.add(b);
      const h=box(0.4,0.4,0.4,mat(0xc9a98a,0.9)); h.position.set(dx,1.6,b.position.z); g.add(h); }
    return g;
  }

  const BUILDERS={ warship, landingcraft, aircraft, armor, bunker, flak, infantry };
  S.buildUnitMesh = function(kind, side, color){
    const f = BUILDERS[kind] || infantry;
    const g = f(side, color);
    // 收集所有材質供 units.js 統一淡化
    g.userData.fadeMats = [];
    g.traverse(o=>{ if(o.material) g.userData.fadeMats.push(o.material); o.material&&(o.material.transparent=true); });
    return g;
  };
})(window.SEKI);
