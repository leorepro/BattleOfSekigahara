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
    // ── 艦體分層（長軸沿 X，艏在 +X）：水線→乾舷→主甲板，三層遞收營造戰艦厚重感 ──
    const hull=box(26,2.2,6.4,mat(DKSTEEL,0.6)); hull.position.y=1.1; g.add(hull);          // 水線艦體（深色）
    const freeboard=box(25,1.4,6,mat(HULL_ALLY,0.6)); freeboard.position.y=2.5; g.add(freeboard); // 乾舷
    const beltLine=box(24,0.3,6.1,mat(0x2a3038,0.7)); beltLine.position.y=1.9; g.add(beltLine);  // 水線裝甲帶
    // 艦艏（尖端，+X）：四角錐前傾艦艏，方向一目了然
    const bow=new THREE.Mesh(new THREE.ConeGeometry(3.2,5.5,4), mat(HULL_ALLY,0.6));
    bow.castShadow=true; bow.rotation.z=-Math.PI/2; bow.rotation.x=Math.PI/4;            // 尖端朝 +X
    bow.scale.set(1,1,0.6); bow.position.set(15,1.9,0); g.add(bow);
    const bowDeck=new THREE.Mesh(new THREE.ConeGeometry(2.6,4.0,4), mat(STEEL,0.6));     // 艏甲板收尖
    bowDeck.rotation.z=-Math.PI/2; bowDeck.rotation.x=Math.PI/4; bowDeck.scale.set(1,1,0.55);
    bowDeck.position.set(13.5,3.3,0); g.add(bowDeck);
    // 艦艉（-X）：方艉收尾，與尖艏形成明確前後差異
    const stern=box(2,2.8,5.8,mat(HULL_ALLY,0.6)); stern.position.set(-13.3,2.0,0); g.add(stern);
    const deck=box(21,0.8,5.4,mat(STEEL,0.6)); deck.position.y=3.5; g.add(deck);            // 主甲板
    // ── 多層上層建築（艦舯偏後遞收）+ 艦橋 + 測距儀 ──
    const super1=box(7,2.2,4,mat(STEEL,0.55)); super1.position.set(-1,5.0,0); g.add(super1);   // 上層建築一層
    const super2=box(4.6,1.6,3.2,mat(STEEL,0.55)); super2.position.set(-0.5,6.6,0); g.add(super2); // 二層
    const bridge=box(3.4,1.6,3.0,mat(0x4c545e,0.5)); bridge.position.set(0.4,7.9,0); g.add(bridge); // 艦橋
    const bridgeWin=box(3.5,0.5,2.9,mat(0x1b2026,0.4)); bridgeWin.position.set(0.4,8.2,0); g.add(bridgeWin); // 艦橋窗帶
    const rf=box(1.6,0.7,3.4,mat(DKSTEEL,0.5)); rf.position.set(-0.2,8.9,0); g.add(rf);     // 測距儀（橫長盒）
    // ── 三腳/桁桅桅杆 + 橫桁 + 雷達示意 ──
    const mast=new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.22,5.5,6),mat(DKSTEEL,0.5));
    mast.position.set(-0.8,10.5,0); g.add(mast);                                            // 主桅杆
    const yard=box(0.18,0.18,4.0,mat(DKSTEEL,0.5)); yard.position.set(-0.8,11.4,0); g.add(yard); // 桅橫桁
    const radar=box(0.2,1.1,1.8,mat(0x30363c,0.4)); radar.position.set(-0.8,12.8,0); g.add(radar); // 對空雷達天線
    const mast2=new THREE.Mesh(new THREE.CylinderGeometry(0.14,0.18,3.6,6),mat(DKSTEEL,0.5));
    mast2.position.set(-6.5,7.5,0); g.add(mast2);                                           // 後桅
    // 煙囪（帶頂蓋）
    const funnel=new THREE.Mesh(new THREE.CylinderGeometry(1.0,1.2,3.4,8),mat(DKSTEEL,0.5));
    funnel.position.set(-4.5,6.0,0); g.add(funnel);
    const funnelCap=new THREE.Mesh(new THREE.CylinderGeometry(1.15,1.0,0.3,8),mat(0x2a2e33,0.6));
    funnelCap.position.set(-4.5,7.7,0); g.add(funnelCap);                                   // 煙囪頂蓋
    // ── 前後主砲塔（三聯裝，+X 朝前）：基座 + 砲盾 + 三根砲管 ──
    const muzz=[];
    for(const x of [8.5,-7.5]){
      const turret=box(3.2,1.4,3.6,mat(STEEL,0.5)); turret.position.set(x,4.5,0); g.add(turret); // 砲塔基座
      const face=box(0.9,1.3,3.4,mat(0x4c545e,0.5)); face.position.set(x+1.6,4.5,0); face.rotation.z=-0.18; g.add(face); // 傾斜砲盾正面
      for(const dz of [-1.0,0,1.0]){
        const bl=new THREE.Mesh(new THREE.CylinderGeometry(0.32,0.32,4.8,8),mat(DKSTEEL,0.5));
        bl.rotation.z=Math.PI/2; bl.position.set(x+3.4,4.7,dz); g.add(bl);                 // 砲管朝 +X（三聯裝）
        muzz.push({x:x+5.8,y:4.7,z:dz});
      }
    }
    // ── 副砲 / AA 砲座（甲板兩側分布若干座）──
    for(const [sx,sz] of [[4,2.4],[4,-2.4],[-3,2.4],[-3,-2.4]]){
      const sec=new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.6,0.5,8),mat(0x4c545e,0.5));
      sec.position.set(sx,4.1,sz); g.add(sec);                                              // 副砲座基
      const sbl=new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.1,1.4,6),mat(BLACK,0.5));
      sbl.rotation.z=Math.PI/2-0.4; sbl.position.set(sx+0.7,4.4,sz); g.add(sbl);            // 副砲管（略仰）
    }
    g.userData.muzzles=muzz;                                                               // 砲口(供特效)
    return g;
  }
  function landingcraft(side,color){
    const g=new THREE.Group();
    // ── LCVP 方頭船殼（長軸沿 X，艏在 +X）：外殼 + 斜艏底 + 內凹艙底 ──
    const hull=box(5,1.4,2.8,mat(KHAKI,0.7)); hull.position.y=0.8; g.add(hull);            // 艇體外殼
    const keel=box(4.2,0.5,2.0,mat(0x3a3628,0.85)); keel.position.set(0,0.25,0); g.add(keel); // 平底龍骨
    const floor=box(4.4,0.4,2.2,mat(0x4a4632,0.85)); floor.position.set(-0.1,1.1,0); g.add(floor); // 內艙底（示意）
    // 斜艏側板（+X 兩側微收，像登陸艇方頭）
    for(const dz of [-1.3,1.3]){ const cheek=box(1.0,1.2,0.2,mat(KHAKI,0.7)); cheek.position.set(2.2,0.95,dz); cheek.rotation.y=dz>0?-0.18:0.18; g.add(cheek); }
    // +X 端可放下的前跳板（必須命名 'ramp'，units.js 控制搶灘）
    const ramp=box(0.35,1.5,2.5,mat(DKSTEEL,0.6)); ramp.position.set(2.6,0.95,0); ramp.name='ramp'; g.add(ramp);
    const rampRib=box(0.2,1.4,0.18,mat(0x2c2e30,0.6)); rampRib.position.set(2.72,0.95,0); g.add(rampRib); // 跳板加強肋
    // 舷牆（左右兩道，方頭裝甲護板 + 上緣防浪條）
    const wall=box(4.6,0.7,0.22,mat(KHAKI,0.7)); wall.position.set(-0.1,1.6,1.3); g.add(wall);
    const wall2=wall.clone(); wall2.position.z=-1.3; g.add(wall2);
    const rail=box(4.6,0.12,0.12,mat(0x3a3628,0.7)); rail.position.set(-0.1,1.98,1.3); g.add(rail);
    const rail2=rail.clone(); rail2.position.z=-1.3; g.add(rail2);                          // 上緣防浪條
    // 艉樓 + 舵手台 + 舵手（-X）：與前跳板形成明確前後差異，避免看起來倒退
    const stern=box(1.0,1.4,2.6,mat(KHAKI,0.7)); stern.position.set(-2.4,1.5,0); g.add(stern);
    const cox=box(0.7,0.8,1.0,mat(DKSTEEL,0.6)); cox.position.set(-2.5,2.5,0.7); g.add(cox); // 舵手台
    const coxMan=box(0.3,0.5,0.3,mat(0x6b6147,0.9)); coxMan.position.set(-2.5,3.0,0.7); g.add(coxMan); // 舵手軀幹
    const coxHd=box(0.3,0.14,0.3,mat(STEEL,0.7)); coxHd.position.set(-2.5,3.32,0.7); g.add(coxHd);     // 舵手鋼盔
    // 內部三排示意士兵塊（鋼盔色頂）：強化「滿載登陸兵」的辨識
    const helm=side==='east'?0x3f4a38:0x4a4636;
    for(const dx of [0.8,0.1,-0.6,-1.2]){ for(const dz of [-0.6,0,0.6]){
      const s=box(0.36,1.0,0.36,mat(helm,0.9)); s.position.set(dx,1.7,dz); g.add(s);
      const hd=box(0.32,0.3,0.32,mat(STEEL,0.7)); hd.position.set(dx,2.35,dz); g.add(hd); // 鋼盔
    }}
    return g;
  }
  // 單架精細四發重轟炸機(B-24 解放者風格)，+X 為機首、翼展沿 ±Z
  function oneBomber(side){
    const g=new THREE.Group();
    const body=mat(side==='east'?0x4a5560:0x4d5247, 0.55);                // 機身金屬色
    const wingMat=mat(side==='east'?0x3f4954:0x454a40,0.55);              // 翼面色
    const dark=mat(0x2a2e33,0.55), glass=mat(0x9fb6c6,0.3);
    const blackStripe=mat(0x1a1c1f,0.6), whiteStripe=mat(0xcfd2cc,0.7);   // 入侵條紋黑白
    // ── 機身分段：前段(粗)→中段→收束機尾(細)，做出 B-24 細長機身 ──
    const fusFront=new THREE.Mesh(new THREE.CylinderGeometry(0.82,0.8,4.2,12), body);
    fusFront.rotation.z=Math.PI/2; fusFront.position.x=2.6; g.add(fusFront);          // 前段機身
    const fusMid=new THREE.Mesh(new THREE.CylinderGeometry(0.8,0.62,4.6,12), body);
    fusMid.rotation.z=Math.PI/2; fusMid.position.x=-1.6; g.add(fusMid);               // 中後段（向後收束）
    const tailCone=new THREE.Mesh(new THREE.CylinderGeometry(0.62,0.18,2.2,12), body);
    tailCone.rotation.z=Math.PI/2; tailCone.position.x=-5.0; g.add(tailCone);          // 收束機尾
    // ── 玻璃機鼻（+X 機首）+ 駕駛艙罩 ──
    const nose=new THREE.Mesh(new THREE.SphereGeometry(0.78,12,8), glass);
    nose.position.x=4.9; nose.scale.x=1.5; g.add(nose);                               // 透明玻璃機鼻
    const noseRing=new THREE.Mesh(new THREE.TorusGeometry(0.55,0.08,6,12), dark);
    noseRing.position.set(4.3,0,0); noseRing.rotation.y=Math.PI/2; g.add(noseRing);   // 機鼻框架
    const canopy=new THREE.Mesh(new THREE.SphereGeometry(0.55,10,6), glass);
    canopy.position.set(2.8,0.62,0); canopy.scale.set(1.5,0.7,0.9); g.add(canopy);    // 駕駛艙罩
    // ── 上單翼（B-24 高置主翼，展向 ±Z）+ 入侵條紋 ──
    const wing=box(2.8,0.24,17, wingMat); wing.position.set(-0.3,0.55,0); g.add(wing); // 上單翼
    for(const dz of [-7.4,7.4]){ const tip=box(1.4,0.18,2.0,wingMat); tip.position.set(-0.3,0.55,dz); g.add(tip); } // 翼尖收窄
    // 兩翼根入侵條紋（黑白交替橫帶，沿翼展方向）
    for(const dz of [-3.0,3.0]){
      for(let i=0;i<4;i++){ const stp=box(2.85,0.26,0.34,(i%2?whiteStripe:blackStripe));
        stp.position.set(-0.3,0.56,dz + (dz>0? i*0.42 : -i*0.42)); g.add(stp); }
    }
    // ── 雙垂尾 + 水平尾翼（B-24 招牌雙垂尾）──
    const hstab=box(1.7,0.2,7.2, body); hstab.position.set(-5.4,0.25,0); g.add(hstab); // 平尾
    for(const dz of [-3.4,3.4]){
      const fin=box(1.5,2.0,0.26, body); fin.position.set(-5.4,1.1,dz); g.add(fin);     // 橢圓雙垂尾（盒近似）
      const finCap=box(0.9,0.5,0.26,body); finCap.position.set(-5.6,2.0,dz); g.add(finCap);
    }
    // 機身入侵條紋（後段四道黑白環帶）
    for(let i=0;i<4;i++){ const ring=new THREE.Mesh(new THREE.CylinderGeometry(0.66,0.6,0.34,12),(i%2?whiteStripe:blackStripe));
      ring.rotation.z=Math.PI/2; ring.position.x=-3.0 - i*0.42; g.add(ring); }
    // ── 四具引擎短艙（整流罩）+ 旋轉螺旋槳轂與槳葉 ──
    for(const dz of [-5.4,-2.7,2.7,5.4]){
      const nac=new THREE.Mesh(new THREE.CylinderGeometry(0.46,0.4,2.6,10),mat(0x32363a,0.5));
      nac.rotation.z=Math.PI/2; nac.position.set(0.7,0.35,dz); g.add(nac);             // 流線發動機短艙
      const cowl=new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.46,0.45,10),dark);
      cowl.rotation.z=Math.PI/2; cowl.position.set(1.85,0.35,dz); g.add(cowl);          // 環形整流罩
      const hub=new THREE.Mesh(new THREE.ConeGeometry(0.2,0.5,8),mat(0x222428,0.5));
      hub.rotation.z=-Math.PI/2; hub.position.set(2.2,0.35,dz); g.add(hub);             // 螺旋槳轂（尖錐）
      const prop1=box(0.08,2.2,0.2,mat(0x1c1e22,0.4)); prop1.position.set(2.05,0.35,dz); g.add(prop1); // 槳葉(豎)
      const prop2=box(0.08,0.2,2.2,mat(0x1c1e22,0.4)); prop2.position.set(2.05,0.35,dz); g.add(prop2); // 槳葉(橫)
    }
    // ── 起落架收起感：機腹下兩個淺艙凸（暗示收起的輪艙）──
    for(const dz of [-1.4,1.4]){ const bay=box(1.2,0.3,0.7,dark); bay.position.set(0.6,-0.55,dz); g.add(bay); }
    return g;
  }
  // 對外回單一架精細 B-24；多機編隊改由 armies.js 拆成多個單機單位各自航跡
  function aircraft(side,color){
    const g=oneBomber(side);
    g.userData.muzzles=[];
    return g;
  }
  function armor(side,color){
    const g=new THREE.Group();                                                            // M4 雪曼/DD/DUKW 共用戰車（+X 為砲口方向）
    const armorM=mat(KHAKI,0.8);
    // ── 車體 + 前傾首上裝甲 ──
    const hull=box(5,1.2,2.4,armorM); hull.position.y=1.0; g.add(hull);                    // 車體
    const glacis=box(1.2,1.0,2.4,armorM); glacis.position.set(2.6,0.85,0); glacis.rotation.z=-0.5; g.add(glacis); // 前傾首上裝甲
    const hullSide=box(5,0.5,2.7,mat(0x5f5b3a,0.8)); hullSide.position.set(0,0.65,0); g.add(hullSide); // 側裙
    // ── 左右履帶 + 路輪/惰輪/主動輪 ──
    for(const dz of [-1.35,1.35]){
      const track=box(5.4,0.85,0.5,mat(0x2c2e30,0.85)); track.position.set(0,0.5,dz); g.add(track); // 履帶
      // 6 個路輪
      for(const wx of [-2.0,-1.2,-0.4,0.4,1.2,2.0]){ const w=new THREE.Mesh(new THREE.CylinderGeometry(0.34,0.34,0.16,8),mat(0x1f2123,0.8));
        w.rotation.x=Math.PI/2; w.position.set(wx,0.4,dz>0?dz+0.08:dz-0.08); g.add(w); }
      // 惰輪(後 -X) / 主動輪(前 +X) 略大
      const idler=new THREE.Mesh(new THREE.CylinderGeometry(0.42,0.42,0.18,8),mat(0x2c2e30,0.8));
      idler.rotation.x=Math.PI/2; idler.position.set(-2.7,0.55,dz>0?dz+0.08:dz-0.08); g.add(idler); // 惰輪
      const sprk=new THREE.Mesh(new THREE.CylinderGeometry(0.42,0.42,0.18,8),mat(0x2c2e30,0.8));
      sprk.rotation.x=Math.PI/2; sprk.position.set(2.7,0.55,dz>0?dz+0.08:dz-0.08); g.add(sprk);   // 主動輪
    }
    // ── 砲塔 + 防盾 + 主砲管(+X) ──
    const turret=new THREE.Mesh(new THREE.CylinderGeometry(1.3,1.5,1.1,8),armorM);
    turret.position.set(-0.2,2.1,0); g.add(turret);                                        // 圓鑄砲塔
    const mantlet=box(0.6,0.8,1.0,mat(0x6b6643,0.8)); mantlet.position.set(1.0,2.05,0); g.add(mantlet); // 砲盾
    const barrel=new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.2,3.2,8),mat(DKSTEEL,0.6));
    barrel.rotation.z=Math.PI/2; barrel.position.set(2.5,2.05,0); g.add(barrel);           // 主砲管 +X
    const brake=new THREE.Mesh(new THREE.CylinderGeometry(0.24,0.24,0.4,8),mat(0x1f2123,0.6));
    brake.rotation.z=Math.PI/2; brake.position.set(4.0,2.05,0); g.add(brake);              // 砲口制退器
    // ── 車長指揮塔 + 頂置 .50 機槍 ──
    const cupola=new THREE.Mesh(new THREE.CylinderGeometry(0.4,0.42,0.45,8),armorM);
    cupola.position.set(-0.9,2.85,0.0); g.add(cupola);                                     // 車長指揮塔
    const cupHatch=new THREE.Mesh(new THREE.CylinderGeometry(0.42,0.42,0.08,8),mat(0x5f5b3a,0.8));
    cupHatch.position.set(-0.9,3.12,0); g.add(cupHatch);                                   // 艙蓋
    const mgMount=box(0.2,0.25,0.2,mat(BLACK,0.5)); mgMount.position.set(-0.3,2.95,0.4); g.add(mgMount);
    const mg=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,1.2,6),mat(BLACK,0.5));
    mg.rotation.z=Math.PI/2; mg.position.set(0.2,3.05,0.4); g.add(mg);                      // 頂置 .50 機槍
    // ── 後方雜物箱 / 油桶示意（-X 引擎甲板）──
    const stowage=box(0.8,0.6,2.0,mat(0x5a5638,0.85)); stowage.position.set(-2.0,1.7,0); g.add(stowage); // 雜物箱
    for(const dz of [-0.6,0.6]){ const drum=new THREE.Mesh(new THREE.CylinderGeometry(0.28,0.28,0.7,8),mat(RUST,0.7));
      drum.position.set(-2.5,2.05,dz); g.add(drum); }                                       // 油桶
    g.userData.muzzles=[{x:4.0,y:2.05,z:0}];
    return g;
  }
  function bunker(side,color){
    const g=new THREE.Group();                                                          // WN 抵抗巢：厚實混凝土掩體（射口朝 +X 灘頭）
    const conc=mat(CONCRETE,0.95);
    const base=box(4,2.4,4.2,conc); base.position.y=1.2; g.add(base);                    // 主掩體箱
    // 前壁斜面（+X，把砲彈彈開的斜混凝土面）+ 稜角折板
    const slope=box(1.0,2.6,4.2,conc); slope.position.set(2.2,1.4,0); slope.rotation.z=0.35; g.add(slope);
    for(const dz of [-2.1,2.1]){ const corner=box(1.2,2.6,0.8,conc); corner.position.set(2.0,1.3,dz); corner.rotation.y=dz>0?-0.4:0.4; g.add(corner); } // 斜稜角壁
    const slit=box(0.6,0.55,2.4,mat(BLACK,1)); slit.position.set(2.5,2.0,0); g.add(slit); // 射口 embrasure
    const lintel=box(0.7,0.3,2.8,mat(0x57503f,0.95)); lintel.position.set(2.45,2.4,0); g.add(lintel); // 射口上緣厚混凝土楣
    // 伸出射口的機槍管（+X）+ 防盾
    const mg=new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.1,1.8,6),mat(BLACK,0.5));
    mg.rotation.z=Math.PI/2; mg.position.set(3.2,2.0,0); g.add(mg);
    const gunShield=box(0.2,0.6,0.8,mat(DKSTEEL,0.6)); gunShield.position.set(2.85,2.0,0); g.add(gunShield);
    const top=box(4.5,0.5,4.6,conc); top.position.y=2.65; g.add(top);                     // 頂蓋
    // 頂部偽裝塊（不規則綠塊示意網/植被）
    for(const [dx,dz] of [[-1,1],[1,-1.2],[0.3,0.8],[-1.4,-0.6]]){
      const cam=box(1.0,0.3,1.0,mat(0x4a5238,0.95)); cam.position.set(dx,2.95,dz); g.add(cam);
    }
    // ── 周邊沙包（環繞掩體前緣的矮沙包牆）+ 鐵絲樁示意 ──
    for(const [sx,sz,sy] of [[2.3,2.6,0.4],[2.3,-2.6,0.4],[1.0,2.9,0.35],[1.0,-2.9,0.35],[-0.4,2.9,0.3],[-0.4,-2.9,0.3]]){
      const bag=box(0.9,0.7,0.6,mat(0x7a7150,0.95)); bag.position.set(sx,sy,sz); g.add(bag); // 沙包
    }
    for(const sz of [-2.6,0,2.6]){ const post=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,1.0,6),mat(0x2c2e30,0.7));
      post.position.set(3.6,0.5,sz); g.add(post); }                                        // 鐵絲網樁
    const wire=box(0.04,0.04,5.4,mat(0x3a3c40,0.6)); wire.position.set(3.6,0.8,0); g.add(wire); // 鐵絲（橫拉）
    g.userData.muzzles=[{x:4.0,y:2.0,z:0}];                                              // MG 射口
    return g;
  }
  function flak(side,color){
    const g=new THREE.Group();                                                          // 高射砲：環形混凝土砲座 + 旋轉砲架 + 仰角雙聯裝砲管 + 防盾 + 彈藥架
    // ── 環形混凝土砲座（外環 + 內凹槽，像 Flak 掩體）──
    const base=new THREE.Mesh(new THREE.CylinderGeometry(2.2,2.4,0.8,16),mat(CONCRETE,0.9));
    base.position.y=0.4; g.add(base);                                                   // 混凝土外座
    const wall=new THREE.Mesh(new THREE.CylinderGeometry(2.2,2.2,0.5,16,1,true),mat(0x5f584a,0.95));
    wall.position.y=1.0; g.add(wall);                                                   // 環形護牆（開口圓筒）
    const ring=new THREE.Mesh(new THREE.CylinderGeometry(1.0,1.0,0.3,12),mat(DKSTEEL,0.6));
    ring.position.y=0.9; g.add(ring);                                                   // 旋轉座圈
    const mount=box(1.0,0.9,1.4,mat(DKSTEEL,0.6)); mount.position.y=1.4; g.add(mount);  // 旋轉砲架
    const trunnion=new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.2,1.6,8),mat(0x2c2e30,0.6));
    trunnion.rotation.x=Math.PI/2; trunnion.position.set(0.3,1.7,0); g.add(trunnion);   // 耳軸（俯仰樞）
    // 仰角雙聯裝砲管（約 60° 朝天）
    for(const dz of [-0.3,0.3]){ const bl=new THREE.Mesh(new THREE.CylinderGeometry(0.13,0.16,3.6,8),mat(BLACK,0.5));
      bl.position.set(0.55,2.1,dz); bl.rotation.z=-Math.PI/3; g.add(bl);                // 仰角砲管
      const brk=new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.2,0.4,8),mat(0x1f2123,0.6));
      brk.position.set(1.45,3.6,dz); brk.rotation.z=-Math.PI/3; g.add(brk); }           // 砲口制退器
    // 傾斜防盾（鋼板，面朝 +X/上方）
    const shield=box(0.25,1.6,2.0,mat(STEEL,0.55)); shield.position.set(0.95,2.0,0); shield.rotation.z=-0.4; g.add(shield);
    // 彈藥架（座內側放幾發砲彈）
    for(const dz of [-1.4,-1.1,1.1,1.4]){ const sh=new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.1,0.5,6),mat(0x8a7a3a,0.5));
      sh.position.set(-1.2,1.1,dz); g.add(sh); }                                        // 待發砲彈
    g.userData.muzzles=[{x:2.0,y:3.5,z:0}]; g.userData.aa=true;
    return g;
  }
  function infantry(side,color){
    const g=new THREE.Group();                                                          // 小班：3 個有鋼盔/軀幹/雙腿/雙臂/步槍的人形 + 底環
    const uni=side==='east'?0x4d5a48:0x5b5340;                                           // 軍服色
    const uniM=mat(uni,0.9), bootM=mat(0x2a2622,0.8);
    const skin=mat(0xc9a98a,0.9), helmet=mat(STEEL,0.7), rifleM=mat(0x2a2620,0.6);
    for(const dx of [-0.8,0,0.8]){
      const z=(Math.random()-0.5)*0.6;
      const torso=box(0.42,0.7,0.3,uniM); torso.position.set(dx,1.0,z); g.add(torso);            // 軀幹
      const hips=box(0.4,0.3,0.3,uniM); hips.position.set(dx,0.62,z); g.add(hips);               // 臀部
      // 雙腿（大腿 + 靴）
      for(const lx of [-0.11,0.11]){ const leg=box(0.15,0.5,0.16,uniM); leg.position.set(dx+lx,0.32,z); g.add(leg);
        const boot=box(0.16,0.12,0.24,bootM); boot.position.set(dx+lx,0.06,z+0.03); g.add(boot); }
      // 雙臂（一臂前伸持槍、一臂貼身）
      const armR=box(0.13,0.5,0.13,uniM); armR.position.set(dx+0.28,1.0,z+0.16); armR.rotation.z=0.3; g.add(armR); // 右臂前伸
      const armL=box(0.13,0.5,0.13,uniM); armL.position.set(dx-0.27,0.98,z); g.add(armL);        // 左臂貼身
      const head=box(0.24,0.26,0.24,skin); head.position.set(dx,1.52,z); g.add(head);            // 頭
      const hel=box(0.32,0.14,0.32,helmet); hel.position.set(dx,1.68,z); g.add(hel);             // 鋼盔
      const helBrim=box(0.36,0.06,0.36,helmet); helBrim.position.set(dx,1.6,z); g.add(helBrim);  // 盔簷
      // 步槍（斜持，指向 +X）+ 背包
      const rifle=box(0.95,0.07,0.07,rifleM); rifle.position.set(dx+0.45,1.05,z+0.2); rifle.rotation.z=0.12; g.add(rifle);
      const pack=box(0.28,0.34,0.18,mat(0x4a4636,0.9)); pack.position.set(dx-0.22,1.05,z); g.add(pack); // 背包
    }
    const ring=new THREE.Mesh(new THREE.CylinderGeometry(1.3,1.3,0.06,12),mat(uni,0.95));
    ring.position.y=0.03; g.add(ring);                                                   // 底環（保留）
    return g;
  }
  function artillery(side,color){
    const g=new THREE.Group();                                                          // 野砲（+X 為砲口方向）：底鈑 + 大架 + 砲輪 + 防盾 + 砲管
    const gunM=mat(KHAKI,0.8);
    const plate=box(1.8,0.3,1.6,gunM); plate.position.set(-0.4,0.4,0); g.add(plate);     // 砲架/底鈑
    const axle=new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.12,2.0,8),mat(0x2c2e30,0.7));
    axle.rotation.x=Math.PI/2; axle.position.set(-0.2,0.6,0); g.add(axle);               // 車軸
    // 兩條開腳大架（-X 往後撐開）+ 駐鋤
    for(const dz of [-0.7,0.7]){ const trail=box(2.4,0.22,0.22,gunM); trail.position.set(-1.5,0.25,dz); trail.rotation.y=dz>0?0.25:-0.25; g.add(trail); // 大架
      const spade=box(0.3,0.4,0.25,mat(0x2c2e30,0.7)); spade.position.set(-2.7,0.2,dz>0?dz+0.45:dz-0.45); g.add(spade); } // 駐鋤
    // 砲輪（左右兩個，立於 XZ 軸法線 → 繞 X 旋轉成豎輪）+ 輪轂
    for(const dz of [-0.95,0.95]){ const wheel=new THREE.Mesh(new THREE.CylinderGeometry(0.6,0.6,0.2,12),mat(0x2c2e30,0.8));
      wheel.rotation.x=Math.PI/2; wheel.position.set(-0.2,0.6,dz); g.add(wheel);
      const hub=new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.18,0.24,8),mat(0x4a4636,0.7));
      hub.rotation.x=Math.PI/2; hub.position.set(-0.2,0.6,dz); g.add(hub); }              // 輪轂
    const cradle=box(0.8,0.6,0.8,mat(DKSTEEL,0.6)); cradle.position.set(0.2,1.0,0); g.add(cradle); // 搖架
    // 防盾（傾斜鋼板，朝 +X）+ 兩翼折板
    const shield=box(0.2,1.1,1.8,mat(STEEL,0.55)); shield.position.set(0.55,1.15,0); shield.rotation.z=-0.15; g.add(shield);
    for(const dz of [-0.95,0.95]){ const wing=box(0.2,1.0,0.5,mat(STEEL,0.55)); wing.position.set(0.55,1.1,dz); wing.rotation.z=-0.15; wing.rotation.y=dz>0?-0.3:0.3; g.add(wing); }
    const barrel=new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.19,3.4,8),mat(DKSTEEL,0.6));
    barrel.rotation.z=Math.PI/2-0.1; barrel.position.set(1.7,1.35,0); g.add(barrel);     // 砲管（略仰，朝 +X）
    const recoil=new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.22,1.4,8),mat(0x3c444e,0.6));
    recoil.rotation.z=Math.PI/2-0.1; recoil.position.set(0.9,1.45,0); g.add(recoil);     // 制退復進筒
    g.userData.muzzles=[{x:3.3,y:1.5,z:0}];
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
