/* =========================================================================
 * src/engine/hoplite.js — 希臘重裝步兵（hoplite）/ 波斯兵 個體幾何 + 盾牆方陣
 *   buildHopliteGeo(variant, opts) → 合併多部件 BufferGeometry（含頂點色），
 *   讓單一 InstancedMesh 也能呈現「青銅甲 + 緋紅披風/盔冠 + 木矛」多色個體。
 *   面朝 +Z（與 formation.js 士兵一致，rotation.y = atan2(dx,dz) 對齊移動方向）。
 *   variant: 'spartan' | 'ally' | 'persian'；opts.cloak/opts.crest 可由陣營色覆寫。
 *   ※ 動畫（刺擊/架盾/倒地）見 Phase 4；本檔提供幾何 + phalanx 排列參數。
 *   向後相容：前三場不載入本檔。
 * ======================================================================= */
window.SEKI = window.SEKI || {};

(function (S) {
  const BODY_H = 1.5;

  // 預設色
  const C = {
    bronze:    0xb6924e, bronzeDk: 0x8a6d39, skin: 0xc99f74, wood: 0x6e4a29,
    crimson:   0xb11f2a,                 // 斯巴達緋紅（披風/盔冠預設）
    wicker:    0xc2a25a, robe: 0x3f5d92, cap: 0x6a5333, persianTrim: 0xc9a84a,
    iron:      0x9aa0a8,
  };

  // 合併（支援逐部件頂點色）。各部件須為 indexed BufferGeometry（Box/Cylinder 皆是）。
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
      for (let k = 0; k < n; k++) { const o = (vo + k) * 3; colr[o] = col.r; colr[o + 1] = col.g; colr[o + 2] = col.b; }
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
  // 圓盤（aspis）：圓柱壓扁，盤面朝 ±Z
  function disc(radius, thick, x, y, z) {
    const g = new THREE.CylinderGeometry(radius, radius, thick, 18);
    g.rotateX(Math.PI / 2); g.translate(x, y, z); return g;
  }

  /* ---------- 希臘 hoplite ---------- */
  function hopliteGeo(opts) {
    const cloak = opts.cloak != null ? opts.cloak : C.crimson;
    const crest = opts.crest != null ? opts.crest : cloak;
    const parts = [
      // 雙腿（裸腿）+ 青銅脛甲
      { geo: box(0.15, 0.58, 0.17, -0.11, 0.29, 0), color: C.skin },
      { geo: box(0.15, 0.58, 0.17,  0.11, 0.29, 0.03), color: C.skin },
      { geo: box(0.17, 0.26, 0.19, -0.11, 0.16, 0.01), color: C.bronze },   // 脛甲L
      { geo: box(0.17, 0.26, 0.19,  0.11, 0.18, 0.04), color: C.bronze },   // 脛甲R
      // 胸甲（肌肉甲感）
      { geo: box(0.42, 0.54, 0.28, 0, 0.87, 0), color: C.bronze },
      // 緋紅披風（背後 -Z，自肩垂落）
      { geo: box(0.5, 0.74, 0.05, 0, 0.82, -0.18), color: cloak },
      // 頭 + 科林斯盔 + 鼻樑護 + 縱向盔冠
      { geo: box(0.2, 0.2, 0.2, 0, 1.27, 0.01), color: C.skin },
      { geo: box(0.27, 0.26, 0.28, 0, 1.42, 0), color: C.bronze },
      { geo: box(0.05, 0.13, 0.06, 0, 1.33, 0.16), color: C.bronzeDk },     // 鼻樑護
      { geo: box(0.07, 0.17, 0.36, 0, 1.62, -0.02), color: crest },         // 馬鬃盔冠（縱）
      // 右臂持矛、左臂持盾
      { geo: box(0.12, 0.46, 0.12, 0.27, 0.92, 0.06), color: C.skin },
      { geo: box(0.12, 0.4, 0.12, -0.27, 0.95, 0.1), color: C.skin },
      // Aspis 圓盾（前左，盤面朝 +Z）+ 盾緣
      { geo: disc(0.44, 0.07, -0.16, 0.98, 0.24), color: C.bronze },
      { geo: disc(0.46, 0.04, -0.16, 0.98, 0.21), color: C.bronzeDk },
      // Dory 長矛（沿 Z，前刺）+ 矛頭 + 尾鐏
      { geo: box(0.045, 0.045, 2.4, 0.2, 1.16, 0.35), color: C.wood },
      { geo: box(0.08, 0.08, 0.22, 0.2, 1.16, 1.6), color: C.iron },        // 矛頭
      { geo: box(0.06, 0.06, 0.16, 0.2, 1.16, -0.78), color: C.bronzeDk },  // 尾鐏
    ];
    return merge(parts);
  }

  /* ---------- 波斯兵（對比版） ---------- */
  function persianGeo(opts) {
    const robe = opts.cloak != null ? opts.cloak : C.robe;
    const parts = [
      // 長褲（anaxyrides）
      { geo: box(0.16, 0.6, 0.18, -0.11, 0.3, 0), color: robe },
      { geo: box(0.16, 0.6, 0.18,  0.11, 0.3, 0.03), color: robe },
      // 花紋長袍（較寬軀幹）+ 鱗甲感腰帶
      { geo: box(0.46, 0.6, 0.3, 0, 0.9, 0), color: robe },
      { geo: box(0.48, 0.1, 0.32, 0, 0.66, 0), color: C.persianTrim },
      // 頭 + 軟布帽 tiara
      { geo: box(0.2, 0.2, 0.2, 0, 1.27, 0.01), color: C.skin },
      { geo: box(0.24, 0.22, 0.24, 0, 1.41, 0), color: C.cap },
      { geo: box(0.26, 0.08, 0.26, 0, 1.3, 0), color: C.persianTrim },      // 帽簷
      // 雙臂
      { geo: box(0.11, 0.44, 0.11, 0.26, 0.92, 0.05), color: robe },
      { geo: box(0.11, 0.4, 0.11, -0.26, 0.95, 0.1), color: robe },
      // 柳條方盾（gerron，前左）
      { geo: box(0.5, 0.72, 0.06, -0.18, 0.92, 0.22), color: C.wicker },
      { geo: box(0.5, 0.1, 0.07, -0.18, 0.92, 0.23), color: C.persianTrim },// 盾紋
      // 短矛
      { geo: box(0.04, 0.04, 1.5, 0.2, 1.1, 0.2), color: C.wood },
      { geo: box(0.07, 0.07, 0.18, 0.2, 1.1, 1.0), color: C.iron },
    ];
    return merge(parts);
  }

  // variant 幾何工廠
  S.buildHopliteGeo = function (variant, opts) {
    opts = opts || {};
    if (variant === 'persian') return persianGeo(opts);
    return hopliteGeo(opts);   // spartan / ally（差異由 opts.cloak/crest 陣營色帶入）
  };

  // phalanx 排列參數：盾牆密集、8 列縱深、面朝敵；供 formation.js 取用。
  S.PHALANX = {
    depth: 8,            // 縱深列數
    fileSpacing: 0.62,   // 同列士兵左右間距（盾牆重疊 → 比身寬窄）
    rankSpacing: 0.78,   // 前後列間距
    jitterPos: 0.06,     // 位置微抖（個體感，sin(index) 雜湊在 formation 套用）
  };

  // Phase 4 將實作：前排刺擊/架盾/倒地動畫（吃 dt*cinemaScale）
  S.updateHopliteAnim = S.updateHopliteAnim || function (/* t, dt */) { /* no-op (Phase 4) */ };
})(window.SEKI);
