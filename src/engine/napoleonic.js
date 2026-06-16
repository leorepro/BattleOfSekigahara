/* =========================================================================
 * src/engine/napoleonic.js — 拿破崙時代單兵幾何（步兵/騎兵/砲兵 + 砲車 + 頂點色 + LOD）
 *   buildNapoleonicGeo(variant, opts) → 合併多部件 BufferGeometry（含頂點色），
 *   讓單一 InstancedMesh 呈現「藍/綠/白軍服 + 白交叉肩帶 + 高帽/熊皮帽 + 燧發槍」多色個體。
 *   面朝 +Z（與 formation.js 士兵一致，rotation.y = atan2(dx,dz) 對齊移動方向）。
 *   variant:
 *     步兵 'french-line'|'french-guard'|'french-grenadier'|'russian-line'|'austrian-line'
 *     騎兵 'cuirassier'|'hussar'|'dragoon'|'russian-guard-cav'|'austrian-cav'
 *     砲兵 'artillery'(砲組員) | 'cannon'(火砲)
 *   opts.coat 覆寫外套色（吃 armies.factionColor）。
 *   對應溫泉關 hoplite.js；前四場不載入本檔。
 * ======================================================================= */
window.SEKI = window.SEKI || {};

(function (S) {
  const C = {
    blue:0x2a4a9a, blueDk:0x1c2f6e, white:0xe6e4da, whiteDk:0xcdd2da,
    green:0x3a6a44, greenDk:0x2c5436, trouser:0xe8e6dc, skin:0xc99f74,
    black:0x191920, steel:0x9aa0a8, steelDk:0x70767e, brass:0xb6924e,
    wood:0x6e4a29, woodDk:0x4a3320, horse:0x5a3f2a, horseDk:0x3a281a,
    red:0xb11f2a, gold:0xcaa23a,
  };

  // 合併（支援逐部件頂點色）。各部件須為 indexed BufferGeometry。
  function merge(parts) {
    let vc = 0; parts.forEach(p => vc += p.geo.attributes.position.count);
    const pos = new Float32Array(vc * 3), nor = new Float32Array(vc * 3),
          colr = new Float32Array(vc * 3), idx = [];
    let vo = 0;
    for (const { geo, color } of parts) {
      pos.set(geo.attributes.position.array, vo * 3);
      nor.set(geo.attributes.normal.array, vo * 3);
      const col = new THREE.Color(color);
      const n = geo.attributes.position.count;
      for (let k = 0; k < n; k++) { const o = (vo + k) * 3; colr[o] = col.r; colr[o+1] = col.g; colr[o+2] = col.b; }
      const gi = geo.index.array; for (let i = 0; i < gi.length; i++) idx.push(gi[i] + vo);
      vo += n;
    }
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    out.setAttribute('normal',   new THREE.BufferAttribute(nor, 3));
    out.setAttribute('color',    new THREE.BufferAttribute(colr, 3));
    out.setIndex(idx);
    return out;
  }
  const box = (w, h, d, x, y, z) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z); return g; };
  // 圓柱（沿 Y）：砲管沿 Z 用 rotateX
  function cyl(rt, rb, h, x, y, z, axis) {
    const g = new THREE.CylinderGeometry(rt, rb, h, 12);
    if (axis === 'z') g.rotateX(Math.PI / 2);
    else if (axis === 'x') g.rotateZ(Math.PI / 2);
    g.translate(x, y, z); return g;
  }
  function disc(radius, thick, x, y, z) {   // 車輪（盤面朝 ±X，沿車軸）
    const g = new THREE.CylinderGeometry(radius, radius, thick, 16);
    g.rotateZ(Math.PI / 2); g.translate(x, y, z); return g;
  }

  /* ---------- 步兵（線列/近衛/擲彈/俄/奧）---------- */
  // head: 'shako'(黑高帽+羽飾) | 'bearskin'(熊皮帽，近衛/擲彈)
  function infantryGeo(opts) {
    const coat = opts.coat != null ? opts.coat : C.blue;
    const trouser = opts.trouser != null ? opts.trouser : C.trouser;
    const head = opts.head || 'shako';
    const plume = opts.plume != null ? opts.plume : C.red;
    const parts = [
      // 雙腿（白褲/綁腿）+ 黑靴
      { geo: box(0.15, 0.56, 0.17, -0.11, 0.29, 0.00), color: trouser },
      { geo: box(0.15, 0.56, 0.17,  0.11, 0.29, 0.02), color: trouser },
      { geo: box(0.16, 0.12, 0.24, -0.11, 0.06, 0.05), color: C.black },   // 靴L
      { geo: box(0.16, 0.12, 0.24,  0.11, 0.06, 0.07), color: C.black },   // 靴R
      // 外套軀幹 + 下襬燕尾 + 翻領
      { geo: box(0.44, 0.52, 0.30, 0, 0.86, 0), color: coat },
      { geo: box(0.46, 0.16, 0.32, 0, 0.60, 0), color: coat },             // 下襬
      { geo: box(0.30, 0.30, 0.32, 0, 0.92, 0.01), color: coat },          // 胸前
      // 白色交叉肩帶（X）
      { geo: box(0.46, 0.07, 0.02, 0, 0.92, 0.16), color: C.white },
      { geo: box(0.07, 0.50, 0.02, 0, 0.86, 0.16), color: C.white },
      // 頸 + 頭
      { geo: box(0.12, 0.10, 0.12, 0, 1.16, 0.01), color: C.skin },
      { geo: box(0.19, 0.18, 0.19, 0, 1.28, 0.02), color: C.skin },
      // 右臂前伸持槍 + 左臂
      { geo: box(0.11, 0.30, 0.11, 0.27, 1.00, 0.03), color: coat },
      { geo: box(0.10, 0.10, 0.30, 0.27, 0.92, 0.20), color: coat },
      { geo: box(0.11, 0.34, 0.11, -0.27, 0.96, 0.06), color: coat },
      // 燧發槍：長槍管(木托+鐵管) + 刺刀
      { geo: box(0.05, 0.05, 1.30, 0.22, 0.98, 0.30), color: C.wood },
      { geo: box(0.045,0.045,0.55, 0.22, 0.98, 0.85), color: C.steelDk },  // 槍管前段
      { geo: box(0.03, 0.03, 0.34, 0.22, 1.00, 1.18), color: C.steel },    // 刺刀
    ];
    // 頭飾
    if (head === 'bearskin') {
      parts.push({ geo: box(0.26, 0.36, 0.26, 0, 1.52, 0), color: C.black });   // 熊皮帽（高厚）
      parts.push({ geo: box(0.27, 0.08, 0.27, 0, 1.40, 0), color: C.gold });    // 帽圈
    } else {
      parts.push({ geo: box(0.23, 0.28, 0.23, 0, 1.48, 0), color: C.black });   // shako 高帽
      parts.push({ geo: box(0.25, 0.06, 0.10, 0, 1.36, 0.12), color: C.black });// 帽簷
      parts.push({ geo: box(0.06, 0.20, 0.06, 0, 1.70, 0), color: plume });     // 羽飾
      parts.push({ geo: box(0.10, 0.08, 0.03, 0, 1.46, 0.13), color: C.brass });// 帽徽
    }
    return merge(parts);
  }

  /* ---------- 步兵簡模（後排 LOD，低面數） ---------- */
  function infantryLiteGeo(opts) {
    const coat = opts.coat != null ? opts.coat : C.blue;
    const trouser = opts.trouser != null ? opts.trouser : C.trouser;
    return merge([
      { geo: box(0.32, 0.56, 0.24, 0, 0.30, 0), color: trouser },        // 腿
      { geo: box(0.36, 0.56, 0.28, 0, 0.86, 0), color: coat },           // 軀幹外套
      { geo: box(0.07, 0.46, 0.02, 0, 0.88, 0.15), color: C.white },     // 肩帶
      { geo: box(0.18, 0.18, 0.18, 0, 1.18, 0.01), color: C.skin },      // 頭
      { geo: box(0.22, 0.26, 0.22, 0, 1.40, 0), color: C.black },        // 高帽
      { geo: box(0.04, 0.04, 1.4, 0.18, 0.98, 0.3), color: C.steelDk },  // 槍
    ]);
  }

  /* ---------- 馬（共用，面朝 +Z） ---------- */
  function horseParts(coat) {
    const h = coat != null ? coat : C.horse, hd = C.horseDk;
    return [
      { geo: box(0.40, 0.52, 1.30, 0, 1.02, 0.05), color: h },           // 軀幹
      { geo: box(0.34, 0.30, 0.40, 0, 1.18, 0.78), color: h },           // 前胸
      { geo: cyl(0.10, 0.12, 0.62, 0, 1.42, 0.92, 'z'), color: h },      // 頸（前傾）
      { geo: box(0.18, 0.30, 0.40, 0, 1.66, 1.16), color: h },           // 頭
      { geo: box(0.10, 0.18, 0.22, 0, 1.60, 1.40), color: hd },          // 口鼻
      // 四腿
      { geo: box(0.12, 0.72, 0.14, -0.15, 0.36, 0.55), color: hd },
      { geo: box(0.12, 0.72, 0.14,  0.15, 0.36, 0.55), color: hd },
      { geo: box(0.12, 0.72, 0.14, -0.15, 0.36, -0.45), color: hd },
      { geo: box(0.12, 0.72, 0.14,  0.15, 0.36, -0.45), color: hd },
      { geo: box(0.08, 0.40, 0.10, 0, 1.10, -0.66), color: hd },         // 尾
    ];
  }

  /* ---------- 騎兵（馬 + 騎手）---------- */
  // mount: 'cuirassier'(胸甲+鋼盔馬鬃) | 'hussar'(busby+軍刀) | 'dragoon' | 'russian-guard-cav' | 'austrian-cav'
  function cavalryGeo(variant, opts) {
    const coat = opts.coat != null ? opts.coat : (variant.indexOf('austrian') >= 0 ? C.whiteDk
                  : variant.indexOf('russian') >= 0 ? C.green : C.blue);
    const cuir = variant === 'cuirassier';
    const RY = 1.46;   // 騎手坐高（馬背上）
    const parts = horseParts(opts.horse);
    parts.push(
      { geo: box(0.42, 0.10, 0.62, 0, 1.30, 0.05), color: C.woodDk },    // 馬鞍/鞍褥
      // 騎手：腿跨兩側 + 軀幹外套
      { geo: box(0.13, 0.40, 0.16, -0.20, RY-0.18, 0.10), color: C.white },
      { geo: box(0.13, 0.40, 0.16,  0.20, RY-0.18, 0.10), color: C.white },
      { geo: box(0.36, 0.46, 0.26, 0, RY+0.18, 0.05), color: coat },     // 軀幹
      { geo: box(0.38, 0.07, 0.02, 0, RY+0.20, 0.15), color: C.white },  // 肩帶
      { geo: box(0.11, 0.10, 0.11, 0, RY+0.46, 0.06), color: C.skin },   // 頸
      { geo: box(0.18, 0.17, 0.18, 0, RY+0.58, 0.07), color: C.skin },   // 頭
      // 右臂揚軍刀
      { geo: box(0.10, 0.34, 0.10, 0.28, RY+0.30, 0.04), color: coat },
      { geo: box(0.04, 0.74, 0.04, 0.40, RY+0.74, 0.04), color: C.steel },// 軍刀（高舉）
      { geo: box(0.10, 0.34, 0.10, -0.26, RY+0.20, 0.10), color: coat }, // 左臂執韁
    );
    if (cuir) {
      parts.push({ geo: box(0.40, 0.40, 0.30, 0, RY+0.18, 0.06), color: C.steel });   // 胸甲
      parts.push({ geo: box(0.24, 0.16, 0.26, 0, RY+0.62, 0.06), color: C.steel });   // 鋼盔
      parts.push({ geo: box(0.06, 0.10, 0.30, 0, RY+0.72, -0.04), color: C.black });  // 馬鬃盔冠
    } else {
      parts.push({ geo: box(0.23, 0.24, 0.23, 0, RY+0.66, 0.04), color: C.black });   // busby/shako
      parts.push({ geo: box(0.06, 0.18, 0.06, 0, RY+0.84, 0.04), color: C.red });     // 羽飾
    }
    return merge(parts);
  }

  /* ---------- 火砲（cannon）---------- */
  function cannonGeo(opts) {
    return merge([
      { geo: cyl(0.10, 0.13, 1.20, 0, 0.62, 0.18, 'z'), color: C.brass },   // 砲管（朝 +Z）
      { geo: cyl(0.08, 0.08, 0.18, 0, 0.62, 0.84, 'z'), color: C.brass },   // 砲口
      { geo: box(0.30, 0.34, 1.10, 0, 0.46, -0.20), color: C.wood },        // 砲架
      { geo: box(0.16, 0.16, 0.90, 0, 0.22, -0.62), color: C.woodDk },      // 拖尾
      { geo: disc(0.42, 0.10, -0.34, 0.42, 0.05), color: C.woodDk },        // 左輪
      { geo: disc(0.42, 0.10,  0.34, 0.42, 0.05), color: C.woodDk },        // 右輪
      { geo: cyl(0.05, 0.05, 0.74, 0, 0.42, 0.05, 'x'), color: C.black },   // 車軸
    ]);
  }

  /* ---------- 砲組員（站於砲側）---------- */
  function artilleryCrewGeo(opts) {
    const coat = opts.coat != null ? opts.coat : C.blueDk;
    return merge([
      { geo: box(0.15, 0.54, 0.17, -0.11, 0.28, 0), color: C.trouser },
      { geo: box(0.15, 0.54, 0.17,  0.11, 0.28, 0), color: C.trouser },
      { geo: box(0.42, 0.52, 0.28, 0, 0.84, 0), color: coat },             // 砲兵外套（深藍）
      { geo: box(0.07, 0.46, 0.02, 0, 0.86, 0.15), color: C.white },
      { geo: box(0.18, 0.18, 0.18, 0, 1.14, 0.01), color: C.skin },
      { geo: box(0.22, 0.26, 0.22, 0, 1.36, 0), color: C.black },          // shako
      { geo: box(0.05, 0.05, 1.1, 0.05, 1.10, 0.55), color: C.wood },      // 推炮桿（前伸）
    ]);
  }

  // variant 幾何工廠
  S.buildNapoleonicGeo = function (variant, opts) {
    opts = opts || {};
    switch (variant) {
      case 'cannon':            return cannonGeo(opts);
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
      default:                  return infantryGeo(opts);   // 法軍藍（預設）
    }
  };

  S.variantIsMounted = function (variant) {
    return /cuirassier|hussar|dragoon|cav/.test(variant || '');
  };

  // 拿破崙陣型參數：供 formation.js napoleonic 分支取用（line/column/square 基準）
  S.NAPOLEONIC = {
    fileSpacing: 0.66,   // 同列左右間距
    rankSpacing: 0.80,   // 前後列間距
    jitterPos: 0.05,
  };
})(window.SEKI);
