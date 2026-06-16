/* =========================================================================
 * src/engine/napoleonic.js — 拿破崙時代單兵幾何 v2（精細程序化模型 + 肢體動畫標記）
 *   buildNapoleonicGeo(variant, opts) → 合併多部件 BufferGeometry，含：
 *     position / normal / color(頂點色) / aLimb(肢體標記) / aPivotY(旋轉樞紐高度)
 *   aLimb：0 靜止軀幹頭飾 / 1 左腿 / 2 右腿 / 3 左臂 / 4 右臂+武器
 *     → anim.js 著色器依此繞 aPivotY 旋轉肢體做行軍/開槍/奔馳微動畫。
 *   面朝 +Z（與 formation.js 一致）。用 cylinder/sphere 圓化肢體、增部件數提升精細度。
 *   variant: french-line/french-guard/french-grenadier/russian-line/austrian-line
 *            cuirassier/hussar/dragoon/russian-guard-cav/austrian-cav / artillery / cannon
 * ======================================================================= */
window.SEKI = window.SEKI || {};

(function (S) {
  const C = {
    blue:0x2a4a9a, blueDk:0x1c2f6e, white:0xeae8de, whiteDk:0xcdd2da, cream:0xe8e6dc,
    green:0x3a6a44, greenDk:0x2c5436, trouser:0xeceadf, skin:0xc99f74, skinDk:0xb98e62,
    black:0x17171c, blackSoft:0x26262e, steel:0x9aa0a8, steelLt:0xc2c8d0, steelDk:0x6a7078,
    brass:0xc29a4e, gold:0xd4b24a, wood:0x6e4a29, woodDk:0x47301c, leather:0x4a382a,
    horse:0x5a3f2a, horseDk:0x3a281a, horseLt:0x6e4f34, red:0xb11f2a, crimson:0x8c1a22,
  };
  const L = { STATIC:0, LEGL:1, LEGR:2, ARML:3, ARMR:4 };

  // 合併（逐部件頂點色 + 肢體標記 aLimb + 樞紐 aPivotY）。part={geo,color,limb?,pivot?}
  function merge(parts) {
    let vc = 0; parts.forEach(p => vc += p.geo.attributes.position.count);
    const pos = new Float32Array(vc*3), nor = new Float32Array(vc*3), colr = new Float32Array(vc*3),
          lim = new Float32Array(vc), piv = new Float32Array(vc), idx = [];
    let vo = 0;
    for (const p of parts) {
      const g = p.geo, col = new THREE.Color(p.color), n = g.attributes.position.count;
      pos.set(g.attributes.position.array, vo*3);
      nor.set(g.attributes.normal.array, vo*3);
      for (let k = 0; k < n; k++) {
        const o = (vo+k)*3; colr[o]=col.r; colr[o+1]=col.g; colr[o+2]=col.b;
        lim[vo+k] = p.limb || 0; piv[vo+k] = p.pivot || 0;
      }
      const gi = g.index.array; for (let i=0;i<gi.length;i++) idx.push(gi[i]+vo);
      vo += n;
    }
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    out.setAttribute('normal',   new THREE.BufferAttribute(nor, 3));
    out.setAttribute('color',    new THREE.BufferAttribute(colr, 3));
    out.setAttribute('aLimb',    new THREE.BufferAttribute(lim, 1));
    out.setAttribute('aPivotY',  new THREE.BufferAttribute(piv, 1));
    out.setIndex(idx);
    return out;
  }
  const box = (w,h,d,x,y,z) => { const g = new THREE.BoxGeometry(w,h,d); g.translate(x,y,z); return g; };
  function cyl(rt, rb, h, x, y, z, axis) {            // 預設沿 Y；axis 'z'/'x' 轉向
    const g = new THREE.CylinderGeometry(rt, rb, h, 10);
    if (axis === 'z') g.rotateX(Math.PI/2); else if (axis === 'x') g.rotateZ(Math.PI/2);
    g.translate(x,y,z); return g;
  }
  const sph = (r,x,y,z) => { const g = new THREE.SphereGeometry(r,10,8); g.translate(x,y,z); return g; };
  function wheel(r, thick, x, y, z) {                 // 砲車輪：盤面朝 ±X
    const g = new THREE.CylinderGeometry(r, r, thick, 16); g.rotateZ(Math.PI/2); g.translate(x,y,z); return g;
  }

  /* ---------- 步兵（精細：圓化四肢 + shako/熊皮帽 + 燧發槍）---------- */
  function infantryGeo(opts) {
    const coat = opts.coat != null ? opts.coat : C.blue;
    const coatDk = new THREE.Color(coat).multiplyScalar(0.7).getHex();
    const trouser = opts.trouser != null ? opts.trouser : C.trouser;
    const head = opts.head || 'shako';
    const plume = opts.plume != null ? opts.plume : C.red;
    const HIP = 0.66, SHO = 1.16;
    const P = [];
    // 雙腿（圓柱大腿+小腿+靴），整條腿隨 aLimb 繞 HIP 擺動
    [['L', -0.10, L.LEGL], ['R', 0.10, L.LEGR]].forEach(([s, x, lb]) => {
      P.push({ geo: cyl(0.085, 0.075, 0.36, x, 0.48, 0), color: trouser, limb: lb, pivot: HIP });   // 大腿
      P.push({ geo: cyl(0.072, 0.062, 0.34, x, 0.18, 0.01), color: trouser, limb: lb, pivot: HIP }); // 小腿/綁腿
      P.push({ geo: box(0.13, 0.11, 0.26, x, 0.055, 0.05), color: C.black, limb: lb, pivot: HIP });   // 靴
    });
    // 外套軀幹（胸+腹收腰）+ 燕尾下襬 + 翻領 + 領 + 肩章
    P.push({ geo: cyl(0.21, 0.235, 0.5, 0, 0.92, 0), color: coat });
    P.push({ geo: box(0.30, 0.26, 0.30, 0, 0.66, -0.02), color: coatDk });                  // 燕尾下襬(背)
    P.push({ geo: box(0.34, 0.20, 0.16, 0, 0.98, 0.14), color: C.cream });                  // 前胸翻領白
    P.push({ geo: box(0.20, 0.09, 0.20, 0, 1.18, 0.02), color: C.cream });                  // 高領
    P.push({ geo: box(0.14, 0.06, 0.16, -0.20, 1.16, 0.02), color: opts.epaulette || C.gold });
    P.push({ geo: box(0.14, 0.06, 0.16, 0.20, 1.16, 0.02), color: opts.epaulette || C.gold });
    // 白色交叉肩帶 X + 彈藥盒
    P.push({ geo: box(0.40, 0.06, 0.02, 0, 0.96, 0.205), color: C.white });
    P.push({ geo: box(0.06, 0.46, 0.02, 0, 0.92, 0.205), color: C.white });
    P.push({ geo: box(0.18, 0.14, 0.10, 0, 0.74, -0.20), color: C.leather });               // 背後彈藥盒
    // 頸 + 頭(球)
    P.push({ geo: cyl(0.07, 0.08, 0.10, 0, 1.24, 0.01), color: C.skin });
    P.push({ geo: sph(0.115, 0, 1.34, 0.02), color: C.skin });
    // 頭飾
    if (head === 'bearskin') {
      P.push({ geo: cyl(0.15, 0.15, 0.38, 0, 1.56, 0), color: C.black });                   // 熊皮帽
      P.push({ geo: sph(0.15, 0, 1.74, 0), color: C.blackSoft });
      P.push({ geo: box(0.30, 0.06, 0.04, 0, 1.46, 0.14), color: C.brass });                // 帽前板
    } else {
      P.push({ geo: cyl(0.135, 0.15, 0.30, 0, 1.52, 0), color: C.black });                  // shako 高帽(上寬)
      P.push({ geo: cyl(0.17, 0.17, 0.03, 0, 1.39, 0), color: C.black });                   // 帽頂緣
      P.push({ geo: box(0.26, 0.04, 0.12, 0, 1.40, 0.12), color: C.blackSoft });            // 帽簷
      P.push({ geo: box(0.10, 0.09, 0.03, 0, 1.48, 0.135), color: C.brass });               // 帽徽
      P.push({ geo: cyl(0.022, 0.022, 0.24, 0, 1.74, 0), color: plume });                   // 羽飾
      P.push({ geo: sph(0.05, 0, 1.87, 0), color: plume });
    }
    // 左臂(支撐) — 隨 ARML 擺
    P.push({ geo: cyl(0.062, 0.058, 0.32, -0.25, 1.00, 0.04), color: coat, limb: L.ARML, pivot: SHO });
    P.push({ geo: sph(0.055, -0.27, 0.84, 0.12), color: C.skin, limb: L.ARML, pivot: SHO });   // 左手
    // 右臂 + 燧發槍（同 ARMR，一起繞肩擺/開槍前舉）
    P.push({ geo: cyl(0.062, 0.058, 0.32, 0.25, 1.00, 0.05), color: coat, limb: L.ARMR, pivot: SHO });
    P.push({ geo: sph(0.055, 0.26, 0.86, 0.16), color: C.skin, limb: L.ARMR, pivot: SHO });    // 右手
    P.push({ geo: cyl(0.026, 0.026, 1.20, 0.24, 0.96, 0.34, 'z'), color: C.wood, limb: L.ARMR, pivot: SHO });  // 槍托木身
    P.push({ geo: cyl(0.018, 0.018, 0.66, 0.24, 0.99, 0.66, 'z'), color: C.steelDk, limb: L.ARMR, pivot: SHO }); // 槍管
    P.push({ geo: box(0.05, 0.07, 0.12, 0.24, 0.95, 0.12), color: C.steel, limb: L.ARMR, pivot: SHO });          // 槍機
    P.push({ geo: cyl(0.012, 0.012, 0.30, 0.24, 1.01, 1.06, 'z'), color: C.steelLt, limb: L.ARMR, pivot: SHO }); // 刺刀
    return merge(P);
  }

  /* ---------- 步兵簡模（後排 LOD，仍含肢體標記以便動畫） ---------- */
  function infantryLiteGeo(opts) {
    const coat = opts.coat != null ? opts.coat : C.blue;
    const trouser = opts.trouser != null ? opts.trouser : C.trouser;
    const HIP = 0.6, SHO = 1.12;
    return merge([
      { geo: cyl(0.09, 0.07, 0.6, -0.09, 0.3, 0), color: trouser, limb: L.LEGL, pivot: HIP },
      { geo: cyl(0.09, 0.07, 0.6, 0.09, 0.3, 0), color: trouser, limb: L.LEGR, pivot: HIP },
      { geo: cyl(0.2, 0.22, 0.56, 0, 0.86, 0), color: coat },
      { geo: box(0.40, 0.05, 0.02, 0, 0.9, 0.18), color: C.white },
      { geo: sph(0.11, 0, 1.2, 0.01), color: C.skin },
      { geo: cyl(0.13, 0.15, 0.26, 0, 1.4, 0), color: C.black },
      { geo: cyl(0.05, 0.05, 0.3, 0.22, 1.0, 0.06), color: coat, limb: L.ARML, pivot: SHO },
      { geo: cyl(0.02, 0.02, 1.3, 0.2, 0.98, 0.3, 'z'), color: C.steelDk, limb: L.ARMR, pivot: SHO },
    ]);
  }

  /* ---------- 馬（精細，面朝 +Z；前腿 limb1 / 後腿 limb2 奔馳） ---------- */
  function horseParts(coat) {
    const h = coat != null ? coat : C.horse, hd = C.horseDk, lt = C.horseLt;
    const TOP = 0.74;
    return [
      { geo: cyl(0.26, 0.24, 1.20, 0, 1.02, 0.02, 'z'), color: h },        // 軀幹(圓柱)
      { geo: sph(0.27, 0, 1.04, 0.55), color: h },                          // 前胸
      { geo: sph(0.24, 0, 1.02, -0.55), color: h },                         // 臀
      { geo: cyl(0.11, 0.13, 0.62, 0, 1.40, 0.86, 'z'), color: h },         // 頸(前上傾)
      { geo: box(0.17, 0.26, 0.42, 0, 1.66, 1.18), color: h },              // 頭
      { geo: box(0.11, 0.16, 0.22, 0, 1.60, 1.42), color: hd },             // 口鼻
      { geo: box(0.05, 0.12, 0.05, -0.06, 1.82, 1.10), color: hd },         // 耳L
      { geo: box(0.05, 0.12, 0.05, 0.06, 1.82, 1.10), color: hd },          // 耳R
      { geo: box(0.06, 0.30, 0.20, 0, 1.52, 0.86), color: hd },             // 鬃
      // 前腿(limb1) / 後腿(limb2)，繞腿根 TOP 奔馳擺動
      { geo: cyl(0.07, 0.05, 0.70, -0.16, 0.36, 0.52, 'y'), color: hd, limb: L.LEGL, pivot: TOP },
      { geo: cyl(0.07, 0.05, 0.70, 0.16, 0.36, 0.52, 'y'), color: hd, limb: L.LEGL, pivot: TOP },
      { geo: cyl(0.07, 0.05, 0.70, -0.16, 0.36, -0.48, 'y'), color: hd, limb: L.LEGR, pivot: TOP },
      { geo: cyl(0.07, 0.05, 0.70, 0.16, 0.36, -0.48, 'y'), color: hd, limb: L.LEGR, pivot: TOP },
      { geo: box(0.10, 0.08, 0.06, -0.16, 0.04, 0.56), color: C.black, limb: L.LEGL, pivot: TOP }, // 蹄
      { geo: box(0.10, 0.08, 0.06, 0.16, 0.04, 0.56), color: C.black, limb: L.LEGL, pivot: TOP },
      { geo: box(0.10, 0.08, 0.06, -0.16, 0.04, -0.44), color: C.black, limb: L.LEGR, pivot: TOP },
      { geo: box(0.10, 0.08, 0.06, 0.16, 0.04, -0.44), color: C.black, limb: L.LEGR, pivot: TOP },
      { geo: cyl(0.05, 0.02, 0.42, 0, 1.00, -0.78, 'z'), color: lt },       // 尾
    ];
  }

  /* ---------- 騎兵（馬 + 騎手；右臂+軍刀 limb4 揮舞） ---------- */
  function cavalryGeo(variant, opts) {
    const coat = opts.coat != null ? opts.coat : (variant.indexOf('austrian') >= 0 ? C.whiteDk
                  : variant.indexOf('russian') >= 0 ? C.green : C.blue);
    const cuir = variant === 'cuirassier';
    const RY = 1.50, SHO = RY + 0.30;
    const P = horseParts(opts.horse);
    P.push({ geo: box(0.40, 0.10, 0.62, 0, 1.30, 0.02), color: C.leather });     // 馬鞍
    // 騎手(腿夾馬，靜止)
    P.push({ geo: cyl(0.07, 0.06, 0.42, -0.22, RY-0.16, 0.10), color: C.white });
    P.push({ geo: cyl(0.07, 0.06, 0.42, 0.22, RY-0.16, 0.10), color: C.white });
    P.push({ geo: cyl(0.18, 0.20, 0.44, 0, RY+0.16, 0.04), color: coat });       // 軀幹
    P.push({ geo: box(0.34, 0.05, 0.02, 0, RY+0.18, 0.18), color: C.white });    // 肩帶
    P.push({ geo: cyl(0.06, 0.07, 0.09, 0, RY+0.42, 0.05), color: C.skin });     // 頸
    P.push({ geo: sph(0.10, 0, RY+0.52, 0.06), color: C.skin });                 // 頭
    // 左臂執韁(靜) + 右臂+軍刀(limb4 揮)
    P.push({ geo: cyl(0.05, 0.05, 0.30, -0.22, RY+0.18, 0.14), color: coat });
    P.push({ geo: cyl(0.05, 0.05, 0.30, 0.24, RY+0.20, 0.06), color: coat, limb: L.ARMR, pivot: SHO });
    P.push({ geo: sph(0.05, 0.30, RY+0.34, 0.08), color: C.skin, limb: L.ARMR, pivot: SHO });
    P.push({ geo: cyl(0.018, 0.012, 0.80, 0.34, RY+0.66, 0.06), color: C.steelLt, limb: L.ARMR, pivot: SHO }); // 軍刀
    if (cuir) {
      P.push({ geo: cyl(0.205, 0.21, 0.40, 0, RY+0.16, 0.05), color: C.steel });          // 胸甲
      P.push({ geo: sph(0.13, 0, RY+0.54, 0.05), color: C.steel });                        // 鋼盔
      P.push({ geo: box(0.05, 0.10, 0.26, 0, RY+0.62, -0.06), color: C.black });           // 馬鬃盔冠
    } else {
      P.push({ geo: cyl(0.12, 0.13, 0.24, 0, RY+0.60, 0.04), color: C.black });            // busby/shako
      P.push({ geo: cyl(0.02, 0.02, 0.18, 0, RY+0.78, 0.04), color: C.red });              // 羽飾
    }
    return merge(P);
  }

  /* ---------- 火砲 + 砲組員（靜止 limb 0） ---------- */
  function cannonGeo() {
    return merge([
      { geo: cyl(0.10, 0.13, 1.20, 0, 0.62, 0.18, 'z'), color: C.brass },
      { geo: cyl(0.09, 0.09, 0.10, 0, 0.62, 0.82, 'z'), color: C.brass },
      { geo: cyl(0.05, 0.07, 0.20, 0, 0.62, -0.46, 'z'), color: C.brass },     // 砲尾球
      { geo: box(0.30, 0.34, 1.10, 0, 0.46, -0.20), color: C.wood },
      { geo: box(0.16, 0.16, 0.92, 0, 0.22, -0.64), color: C.woodDk },
      { geo: wheel(0.42, 0.09, -0.34, 0.42, 0.05), color: C.woodDk },
      { geo: wheel(0.42, 0.09, 0.34, 0.42, 0.05), color: C.woodDk },
      { geo: cyl(0.05, 0.05, 0.74, 0, 0.42, 0.05, 'x'), color: C.black },
    ]);
  }
  function artilleryCrewGeo(opts) {
    const coat = opts.coat != null ? opts.coat : C.blueDk;
    const HIP = 0.62, SHO = 1.12;
    return merge([
      { geo: cyl(0.08, 0.07, 0.58, -0.10, 0.30, 0), color: C.trouser, limb: L.LEGL, pivot: HIP },
      { geo: cyl(0.08, 0.07, 0.58, 0.10, 0.30, 0), color: C.trouser, limb: L.LEGR, pivot: HIP },
      { geo: cyl(0.20, 0.22, 0.52, 0, 0.86, 0), color: coat },
      { geo: box(0.40, 0.05, 0.02, 0, 0.9, 0.18), color: C.white },
      { geo: sph(0.11, 0, 1.18, 0.01), color: C.skin },
      { geo: cyl(0.13, 0.15, 0.26, 0, 1.38, 0), color: C.black },
      { geo: cyl(0.05, 0.05, 0.30, 0.24, 1.0, 0.1), color: coat, limb: L.ARMR, pivot: SHO },
      { geo: cyl(0.02, 0.02, 1.0, 0.18, 1.05, 0.5, 'z'), color: C.wood, limb: L.ARMR, pivot: SHO }, // 推炮桿
    ]);
  }

  S.buildNapoleonicGeo = function (variant, opts) {
    opts = opts || {};
    switch (variant) {
      case 'cannon':            return cannonGeo();
      case 'artillery':         return artilleryCrewGeo(opts);
      case 'cuirassier':
      case 'hussar':
      case 'dragoon':
      case 'russian-guard-cav':
      case 'austrian-cav':      return cavalryGeo(variant, opts);
      case 'infantry-lite':     return infantryLiteGeo(opts);
      case 'french-guard':      return infantryGeo({ ...opts, head:'bearskin', coat:opts.coat!=null?opts.coat:C.blueDk });
      case 'french-grenadier':  return infantryGeo({ ...opts, head:'bearskin' });
      case 'russian-line':      return infantryGeo({ ...opts, coat:opts.coat!=null?opts.coat:C.green,   trouser:C.whiteDk, plume:C.white });
      case 'austrian-line':     return infantryGeo({ ...opts, coat:opts.coat!=null?opts.coat:C.whiteDk, trouser:C.whiteDk, plume:C.black });
      case 'french-line':
      default:                  return infantryGeo(opts);
    }
  };

  S.variantIsMounted = function (variant) { return /cuirassier|hussar|dragoon|cav/.test(variant || ''); };

  // 間距須大於單兵寬(~0.5)+槍枝,避免士兵重疊;以「並肩有間隙」為準
  S.NAPOLEONIC = { fileSpacing: 0.82, rankSpacing: 0.98, jitterPos: 0.05 };
})(window.SEKI);
