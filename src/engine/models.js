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
    // 艦體分層：水線艦體(深色乾舷) + 上層乾舷 + 甲板，營造德州號厚重感（長軸沿 X，艏在 +X）
    const hull=box(26,2.2,6.4,mat(DKSTEEL,0.6)); hull.position.y=1.1; g.add(hull);        // 水線艦體（深色）
    const freeboard=box(25,1.4,6,mat(HULL_ALLY,0.6)); freeboard.position.y=2.5; g.add(freeboard); // 乾舷
    // 艦艏（尖端，+X）：以四角錐做出前傾艦艏，讓船頭方向一目了然
    const bow=new THREE.Mesh(new THREE.ConeGeometry(3.2,5.5,4), mat(HULL_ALLY,0.6));
    bow.castShadow=true; bow.rotation.z=-Math.PI/2; bow.rotation.x=Math.PI/4;          // 尖端朝 +X
    bow.scale.set(1,1,0.6); bow.position.set(15,1.9,0); g.add(bow);
    // 艦艉（-X）：方艉收尾，與尖艏形成明確前後差異
    const stern=box(2,2.8,5.8,mat(HULL_ALLY,0.6)); stern.position.set(-13.3,2.0,0); g.add(stern);
    const deck=box(21,0.8,5.4,mat(STEEL,0.6)); deck.position.y=3.5; g.add(deck);          // 主甲板
    // 艦島上層建築（多層遞收）+ 桅杆，集中於艦舯偏後
    const super1=box(7,2.2,4,mat(STEEL,0.55)); super1.position.set(-1,5.0,0); g.add(super1); // 上層建築一層
    const bridge=box(3.4,2.0,3.2,mat(STEEL,0.55)); bridge.position.set(0.3,6.7,0); g.add(bridge); // 艦橋
    const mast=new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.22,5,6),mat(DKSTEEL,0.5));
    mast.position.set(-0.5,9.0,0); g.add(mast);                                            // 主桅杆
    const yard=box(0.2,0.2,3.6,mat(DKSTEEL,0.5)); yard.position.set(-0.5,9.6,0); g.add(yard); // 桅橫桁
    const funnel=new THREE.Mesh(new THREE.CylinderGeometry(1.0,1.2,3.4,8),mat(DKSTEEL,0.5));
    funnel.position.set(-4.5,6.0,0); g.add(funnel);                                        // 煙囪（圓柱）
    // 前後主砲塔（雙聯裝，+X 朝前）：各塔含基座 + 兩根砲管
    const muzz=[];
    for(const x of [8.5,-7.5]){
      const turret=box(3.2,1.3,3.4,mat(STEEL,0.5)); turret.position.set(x,4.4,0); g.add(turret); // 砲塔基座
      for(const dz of [-0.7,0.7]){
        const bl=new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.35,4.5,8),mat(DKSTEEL,0.5));
        bl.rotation.z=Math.PI/2; bl.position.set(x+3.2,4.6,dz); g.add(bl);                 // 砲管朝 +X
        muzz.push({x:x+5.4,y:4.6,z:dz});
      }
    }
    g.userData.muzzles=muzz;                                                               // 砲口(供特效)
    return g;
  }
  function landingcraft(side,color){
    const g=new THREE.Group();
    // LCVP 方頭船殼（長軸沿 X，艏在 +X）：平底艇身 + 內凹艙底
    const hull=box(5,1.4,2.8,mat(KHAKI,0.7)); hull.position.y=0.8; g.add(hull);            // 艇體外殼
    const floor=box(4.4,0.4,2.2,mat(0x4a4632,0.85)); floor.position.set(-0.1,1.1,0); g.add(floor); // 內艙底（示意）
    // +X 端可放下的前跳板（必須命名 'ramp'，units.js 控制搶灘）
    const ramp=box(0.35,1.5,2.5,mat(DKSTEEL,0.6)); ramp.position.set(2.6,0.95,0); ramp.name='ramp'; g.add(ramp);
    // 舷牆（左右兩道，方頭裝甲護板）
    const wall=box(4.6,0.7,0.22,mat(KHAKI,0.7)); wall.position.set(-0.1,1.6,1.3); g.add(wall);
    const wall2=wall.clone(); wall2.position.z=-1.3; g.add(wall2);
    // 艉樓 + 舵手台（-X）：與前跳板形成明確前後差異，避免看起來倒退
    const stern=box(1.0,1.4,2.6,mat(KHAKI,0.7)); stern.position.set(-2.4,1.5,0); g.add(stern);
    const cox=box(0.7,0.8,1.0,mat(DKSTEEL,0.6)); cox.position.set(-2.5,2.5,0.7); g.add(cox); // 舵手台
    // 內部兩排示意士兵塊（鋼盔色頂）：強化「滿載登陸兵」的辨識
    const helm=side==='east'?0x3f4a38:0x4a4636;
    for(const dx of [0.6,-0.2,-1.0]){ for(const dz of [-0.55,0.55]){
      const s=box(0.4,1.0,0.4,mat(helm,0.9)); s.position.set(dx,1.7,dz); g.add(s);
      const hd=box(0.34,0.3,0.34,mat(STEEL,0.7)); hd.position.set(dx,2.35,dz); g.add(hd); // 鋼盔
    }}
    return g;
  }
  // 單架四發重轟炸機(B-24 風格)，+X 為機首；整機縮放後供編隊複製
  function oneBomber(side){
    const g=new THREE.Group();
    const body=mat(side==='east'?0x4a5560:0x4d5247, 0.55);
    const wingMat=mat(side==='east'?0x3f4954:0x454a40,0.55);
    const fus=new THREE.Mesh(new THREE.CylinderGeometry(0.8,0.55,10,12), body);
    fus.rotation.z=Math.PI/2; g.add(fus);                                 // 圓胖機身沿 X
    const nose=new THREE.Mesh(new THREE.SphereGeometry(0.8,12,8), body);
    nose.position.x=5; nose.scale.x=1.4; g.add(nose);                     // 圓機鼻（+X 機首）
    const canopy=new THREE.Mesh(new THREE.SphereGeometry(0.55,10,6), mat(0x9fb6c6,0.3));
    canopy.position.set(3.0,0.55,0); canopy.scale.set(1.4,0.7,0.9); g.add(canopy); // 駕駛艙罩
    const wing=box(2.8,0.25,16.5, wingMat); wing.position.set(-0.3,0.15,0); g.add(wing); // 主翼(展向 Z)
    const hstab=box(1.6,0.2,7, body); hstab.position.set(-4.3,0.25,0); g.add(hstab);   // 平尾
    for(const dz of [-3.4,3.4]){ const fin=box(1.4,1.9,0.25, body); fin.position.set(-4.3,1.0,dz); g.add(fin); } // 雙垂尾
    // 四具引擎發動機艙掛在主翼前緣 + 螺旋槳示意
    for(const dz of [-5.4,-2.6,2.6,5.4]){
      const nac=new THREE.Mesh(new THREE.CylinderGeometry(0.45,0.4,2.4,8),mat(0x32363a,0.5));
      nac.rotation.z=Math.PI/2; nac.position.set(0.6,-0.05,dz); g.add(nac);            // 流線發動機艙
      const hub=new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.18,0.3,6),mat(0x222428,0.5));
      hub.rotation.z=Math.PI/2; hub.position.set(1.85,-0.05,dz); g.add(hub);           // 螺旋槳轂
      const prop1=box(0.1,2.0,0.18,mat(0x1c1e22,0.4)); prop1.position.set(1.95,-0.05,dz); g.add(prop1); // 槳葉(豎)
      const prop2=box(0.1,0.18,2.0,mat(0x1c1e22,0.4)); prop2.position.set(1.95,-0.05,dz); g.add(prop2); // 槳葉(橫)
    }
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
    const g=new THREE.Group();                                                            // M4 雪曼風格戰車（+X 為砲口方向）
    const hull=box(5,1.2,2.4,mat(KHAKI,0.8)); hull.position.y=1.0; g.add(hull);            // 車體
    const glacis=box(1.2,1.0,2.4,mat(KHAKI,0.8)); glacis.position.set(2.6,0.85,0); glacis.rotation.z=-0.5; g.add(glacis); // 前傾首上裝甲
    // 履帶側裙（左右兩道，深色）+ 路輪示意
    for(const dz of [-1.35,1.35]){
      const track=box(5.4,0.8,0.5,mat(0x2c2e30,0.8)); track.position.set(0,0.5,dz); g.add(track);
    }
    const turret=new THREE.Mesh(new THREE.CylinderGeometry(1.3,1.5,1.1,8),mat(KHAKI,0.8));
    turret.position.set(-0.2,2.1,0); g.add(turret);                                        // 圓鑄砲塔
    const mantlet=box(0.6,0.7,0.9,mat(KHAKI,0.8)); mantlet.position.set(1.0,2.05,0); g.add(mantlet); // 砲盾
    const barrel=new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.18,3.2,8),mat(DKSTEEL,0.6));
    barrel.rotation.z=Math.PI/2; barrel.position.set(2.4,2.05,0); g.add(barrel);           // 主砲管 +X
    const cupola=box(0.6,0.4,0.6,mat(KHAKI,0.8)); cupola.position.set(-0.9,2.85,0.4); g.add(cupola); // 車長塔
    const mg=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,1.0,6),mat(BLACK,0.5));
    mg.rotation.z=Math.PI/2; mg.position.set(-0.4,3.0,0.4); g.add(mg);                      // 頂置機槍
    g.userData.muzzles=[{x:4.0,y:2.05,z:0}];
    return g;
  }
  function bunker(side,color){
    const g=new THREE.Group();                                                          // WN 抵抗巢：厚實混凝土掩體（射口朝 +X 灘頭）
    const base=box(4,2.4,4.2,mat(CONCRETE,0.95)); base.position.y=1.2; g.add(base);      // 主掩體箱
    // 前壁斜面（+X，把砲彈彈開的斜混凝土面）
    const slope=box(1.0,2.6,4.2,mat(CONCRETE,0.95)); slope.position.set(2.2,1.4,0); slope.rotation.z=0.35; g.add(slope);
    const slit=box(0.6,0.55,2.4,mat(BLACK,1)); slit.position.set(2.5,2.0,0); g.add(slit); // 射口 embrasure
    // 伸出射口的機槍管（+X）
    const mg=new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.1,1.6,6),mat(BLACK,0.5));
    mg.rotation.z=Math.PI/2; mg.position.set(3.2,2.0,0); g.add(mg);
    const top=box(4.5,0.5,4.6,mat(CONCRETE,0.95)); top.position.y=2.65; g.add(top);       // 頂蓋
    // 頂部偽裝塊（不規則綠塊示意網/植被）
    for(const [dx,dz] of [[-1,1],[1,-1.2],[0.3,0.8]]){
      const cam=box(1.0,0.3,1.0,mat(0x4a5238,0.95)); cam.position.set(dx,2.95,dz); g.add(cam);
    }
    g.userData.muzzles=[{x:4.0,y:2.0,z:0}];                                              // MG 射口
    return g;
  }
  function flak(side,color){
    const g=new THREE.Group();                                                          // 高射砲：混凝土底座 + 旋轉砲架 + 朝天砲管 + 防盾
    const base=new THREE.Mesh(new THREE.CylinderGeometry(1.6,2.0,0.7,12),mat(CONCRETE,0.9));
    base.position.y=0.35; g.add(base);                                                  // 混凝土環形掩體底座
    const ring=new THREE.Mesh(new THREE.CylinderGeometry(1.0,1.0,0.3,10),mat(DKSTEEL,0.6));
    ring.position.y=0.8; g.add(ring);                                                   // 旋轉座圈
    const mount=box(1.0,0.9,1.2,mat(DKSTEEL,0.6)); mount.position.y=1.3; g.add(mount);  // 砲架
    // 朝天的高射砲管（仰角約 50°）+ 雙聯裝
    for(const dz of [-0.28,0.28]){ const bl=new THREE.Mesh(new THREE.CylinderGeometry(0.14,0.14,3.4,8),mat(BLACK,0.5));
      bl.position.set(0.45,2.0,dz); bl.rotation.z=-Math.PI/3; g.add(bl); }              // 仰角砲管
    // 防盾（傾斜鋼板，面朝 +X/上方）
    const shield=box(0.25,1.4,1.8,mat(STEEL,0.55)); shield.position.set(0.9,1.9,0); shield.rotation.z=-0.4; g.add(shield);
    g.userData.muzzles=[{x:1.9,y:3.2,z:0}]; g.userData.aa=true;
    return g;
  }
  function infantry(side,color){
    const g=new THREE.Group();                                                          // 小班：3 個有鋼盔的人形 + 簡易步槍 + 底環
    const uni=side==='east'?0x4d5a48:0x5b5340;                                           // 軍服色
    const skin=mat(0xc9a98a,0.9), helmet=mat(STEEL,0.7), rifleM=mat(0x2a2620,0.6);
    for(const dx of [-0.8,0,0.8]){
      const z=(Math.random()-0.5)*0.6;
      const torso=box(0.42,0.8,0.34,mat(uni,0.9)); torso.position.set(dx,0.9,z); g.add(torso);     // 軀幹
      const legL=box(0.16,0.55,0.16,mat(uni,0.9)); legL.position.set(dx-0.11,0.42,z); g.add(legL); // 雙腿
      const legR=box(0.16,0.55,0.16,mat(uni,0.9)); legR.position.set(dx+0.11,0.42,z); g.add(legR);
      const head=box(0.26,0.28,0.26,skin); head.position.set(dx,1.45,z); g.add(head);              // 頭
      const hel=box(0.34,0.16,0.34,helmet); hel.position.set(dx,1.62,z); g.add(hel);               // 鋼盔
      // 簡易步槍（斜持，指向 +X）
      const rifle=box(0.9,0.07,0.07,rifleM); rifle.position.set(dx+0.35,1.0,z+0.18); rifle.rotation.z=0.15; g.add(rifle);
    }
    const ring=new THREE.Mesh(new THREE.CylinderGeometry(1.3,1.3,0.06,12),mat(uni,0.95));
    ring.position.y=0.03; g.add(ring);                                                   // 底環（保留）
    return g;
  }
  function artillery(side,color){
    const g=new THREE.Group();                                                          // 野砲（+X 為砲口方向）：底鈑 + 砲架 + 砲管 + 砲輪
    const plate=box(1.8,0.3,1.6,mat(KHAKI,0.8)); plate.position.set(-0.4,0.4,0); g.add(plate); // 砲架/底鈑
    // 兩條開腳大架（-X 往後撐開）
    for(const dz of [-0.7,0.7]){ const trail=box(2.2,0.2,0.2,mat(KHAKI,0.8)); trail.position.set(-1.4,0.25,dz); trail.rotation.y=dz>0?0.25:-0.25; g.add(trail); }
    // 砲輪（左右兩個，立於 XZ 軸法線 → 繞 X 旋轉成豎輪）
    for(const dz of [-0.9,0.9]){ const wheel=new THREE.Mesh(new THREE.CylinderGeometry(0.6,0.6,0.18,12),mat(0x2c2e30,0.8));
      wheel.rotation.x=Math.PI/2; wheel.position.set(-0.2,0.6,dz); g.add(wheel); }
    const cradle=box(0.7,0.6,0.8,mat(DKSTEEL,0.6)); cradle.position.set(0.2,1.0,0); g.add(cradle); // 搖架
    const shield=box(0.2,1.0,1.6,mat(STEEL,0.55)); shield.position.set(0.55,1.1,0); shield.rotation.z=-0.15; g.add(shield); // 防盾
    const barrel=new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.18,3.2,8),mat(DKSTEEL,0.6));
    barrel.rotation.z=Math.PI/2-0.1; barrel.position.set(1.6,1.3,0); g.add(barrel);      // 砲管（略仰，朝 +X）
    g.userData.muzzles=[{x:3.1,y:1.45,z:0}];
    return g;
  }

  const BUILDERS={ warship, landingcraft, aircraft, armor, bunker, flak, infantry, artillery };
  S.buildUnitMesh = function(kind, side, color){
    const f = BUILDERS[kind] || infantry;
    const g = f(side, color);
    // 收集所有材質供 units.js 統一淡化
    g.userData.fadeMats = [];
    g.traverse(o=>{ if(o.material) g.userData.fadeMats.push(o.material); o.material&&(o.material.transparent=true); });
    return g;
  };
})(window.SEKI);
