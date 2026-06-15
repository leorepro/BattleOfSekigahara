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
      // 雙腿（裸腿）+ 青銅脛甲 + 腳
      { geo: box(0.15, 0.5, 0.16, -0.11, 0.27, 0.01), color: C.skin },
      { geo: box(0.15, 0.5, 0.16,  0.11, 0.27, 0.03), color: C.skin },
      { geo: box(0.17, 0.24, 0.18, -0.11, 0.13, 0.02), color: C.bronze },   // 脛甲L
      { geo: box(0.17, 0.24, 0.18,  0.11, 0.13, 0.04), color: C.bronze },   // 脛甲R
      { geo: box(0.17, 0.08, 0.26, -0.11, 0.04, 0.07), color: C.bronzeDk }, // 腳L
      { geo: box(0.17, 0.08, 0.26,  0.11, 0.04, 0.09), color: C.bronzeDk }, // 腳R
      // 戰裙 pteruges（皮條裙）
      { geo: box(0.44, 0.2, 0.3, 0, 0.62, 0), color: C.wood },
      // 胸甲（胸＋腹兩段肌肉甲）＋ 肩
      { geo: box(0.44, 0.32, 0.3, 0, 0.92, 0), color: C.bronze },
      { geo: box(0.4, 0.16, 0.28, 0, 0.74, 0), color: C.bronzeDk },
      { geo: box(0.5, 0.12, 0.3, 0, 1.08, 0), color: C.bronze },
      // 緋紅披風（背後，寬長垂落）
      { geo: box(0.54, 0.84, 0.05, 0, 0.86, -0.19), color: cloak },
      // 頸 + 頭
      { geo: box(0.13, 0.1, 0.13, 0, 1.16, 0.01), color: C.skin },
      { geo: box(0.2, 0.18, 0.2, 0, 1.28, 0.02), color: C.skin },
      // 科林斯盔：頂罩 + 面罩 + 鼻護 + 兩頰
      { geo: box(0.26, 0.18, 0.27, 0, 1.43, 0), color: C.bronze },
      { geo: box(0.24, 0.14, 0.24, 0, 1.3, 0.03), color: C.bronze },
      { geo: box(0.045, 0.14, 0.06, 0, 1.28, 0.16), color: C.bronzeDk },    // 鼻護
      { geo: box(0.05, 0.16, 0.2, -0.12, 1.3, 0.04), color: C.bronze },     // 頰L
      { geo: box(0.05, 0.16, 0.2,  0.12, 1.3, 0.04), color: C.bronze },     // 頰R
      // 馬鬃盔冠（弧形後傾，三段堆疊）
      { geo: box(0.06, 0.18, 0.18, 0, 1.62, 0.04), color: crest },
      { geo: box(0.06, 0.16, 0.16, 0, 1.6, -0.12), color: crest },
      { geo: box(0.06, 0.12, 0.14, 0, 1.54, -0.26), color: crest },
      // 右臂（上臂 + 前臂前伸持矛）
      { geo: box(0.12, 0.28, 0.12, 0.28, 1.0, 0.02), color: C.skin },
      { geo: box(0.1, 0.1, 0.34, 0.28, 0.92, 0.2), color: C.skin },
      // 左臂持盾
      { geo: box(0.12, 0.34, 0.12, -0.28, 0.96, 0.08), color: C.skin },
      // Aspis 大圓盾（盤面朝 +Z）+ 盾緣 + 中心盾凸 boss
      { geo: disc(0.5, 0.06, -0.14, 1.0, 0.26), color: C.bronze },
      { geo: disc(0.52, 0.035, -0.14, 1.0, 0.23), color: C.bronzeDk },
      { geo: disc(0.12, 0.1, -0.14, 1.0, 0.32), color: C.bronzeDk },
      // Dory 長矛（前刺）+ 矛頭 + 尾鐏
      { geo: box(0.05, 0.05, 2.5, 0.2, 1.0, 0.4), color: C.wood },
      { geo: box(0.09, 0.09, 0.26, 0.2, 1.0, 1.7), color: C.iron },
      { geo: box(0.06, 0.06, 0.16, 0.2, 1.0, -0.82), color: C.bronzeDk },
      // xiphos 短劍劍鞘（左腰）
      { geo: box(0.06, 0.4, 0.08, -0.26, 0.6, -0.04), color: C.bronzeDk },
    ];
    return merge(parts);
  }

  /* ---------- 波斯兵（對比版） ---------- */
  function persianGeo(opts) {
    const robe = opts.cloak != null ? opts.cloak : C.robe;
    const parts = [
      // 長褲（anaxyrides）+ 鞋
      { geo: box(0.15, 0.56, 0.17, -0.11, 0.29, 0.01), color: robe },
      { geo: box(0.15, 0.56, 0.17,  0.11, 0.29, 0.03), color: robe },
      { geo: box(0.16, 0.08, 0.24, -0.11, 0.04, 0.06), color: C.bronzeDk }, // 鞋L
      { geo: box(0.16, 0.08, 0.24,  0.11, 0.04, 0.08), color: C.bronzeDk }, // 鞋R
      // 花紋長袍（軀幹）+ 鱗甲腰帶 + 下襬 + 領
      { geo: box(0.46, 0.5, 0.3, 0, 0.85, 0), color: robe },
      { geo: box(0.48, 0.1, 0.32, 0, 0.64, 0), color: C.persianTrim },
      { geo: box(0.5, 0.18, 0.32, 0, 0.5, 0), color: robe },
      { geo: box(0.46, 0.08, 0.3, 0, 1.06, 0), color: C.persianTrim },
      // 頸 + 頭
      { geo: box(0.13, 0.1, 0.13, 0, 1.16, 0.01), color: C.skin },
      { geo: box(0.2, 0.18, 0.2, 0, 1.28, 0.02), color: C.skin },
      // 軟布帽 tiara + 帽簷 + 後護頸布
      { geo: box(0.23, 0.2, 0.23, 0, 1.43, 0), color: C.cap },
      { geo: box(0.26, 0.07, 0.26, 0, 1.32, 0), color: C.persianTrim },
      { geo: box(0.22, 0.14, 0.06, 0, 1.3, -0.13), color: C.cap },
      // 右臂（上臂 + 前臂前伸持矛）+ 左臂持盾
      { geo: box(0.11, 0.3, 0.11, 0.27, 1.0, 0.03), color: robe },
      { geo: box(0.1, 0.1, 0.3, 0.27, 0.92, 0.2), color: C.skin },
      { geo: box(0.11, 0.34, 0.11, -0.27, 0.96, 0.08), color: robe },
      // 柳條方盾（gerron）+ 上下編紋
      { geo: box(0.52, 0.78, 0.06, -0.18, 0.92, 0.24), color: C.wicker },
      { geo: box(0.52, 0.08, 0.07, -0.18, 1.05, 0.25), color: C.persianTrim },
      { geo: box(0.52, 0.08, 0.07, -0.18, 0.8, 0.25), color: C.persianTrim },
      // 短矛 + 矛頭 + 背後箭袋
      { geo: box(0.04, 0.04, 1.55, 0.2, 0.95, 0.25), color: C.wood },
      { geo: box(0.08, 0.08, 0.2, 0.2, 0.95, 1.05), color: C.iron },
      { geo: box(0.12, 0.4, 0.1, 0.16, 1.0, -0.22), color: C.bronzeDk },
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
