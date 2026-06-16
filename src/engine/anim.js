/* =========================================================================
 * src/engine/anim.js — InstancedMesh 著色器骨架動畫（拿破崙單兵微動畫）
 *   保留 InstancedMesh 單一 draw call，用 onBeforeCompile 注入 vertex shader：
 *   依「每兵相位 aPhase(instanced) + 全域時間 uTime + 頂點肢體標記 aLimb/aPivotY」
 *   即時繞樞紐旋轉四肢 → 行軍擺腿擺臂 / 開槍舉槍後座 / 騎兵奔馳 / 潰逃奔跑 / 駐立微晃。
 *   幾何由 napoleonic.js 烘焙 aLimb(0靜/1左腿/2右腿/3左臂/4右臂+槍) + aPivotY(樞紐高度)。
 *   uMode(每材質一值)：0 駐立 / 1 行軍 / 2 開槍 / 3 騎兵奔馳 / 4 奔跑(突擊/潰逃)。
 *   uTime 全域共享(乘入 cinemaScale 子彈時間)，由 main 每幀 S.tickAnim(cdt) 推進。
 * ======================================================================= */
window.SEKI = window.SEKI || {};

(function (S) {
  // 全域共享時間 uniform（所有動畫材質共用同一物件 → 一次更新全體）
  const sharedTime = { value: 0 };
  S.tickAnim = function (dt) { sharedTime.value += (dt || 0); };

  const LIMB_GLSL = [
    '{',
    '  float md = uMode;',
    '  float ph = aPhase * 6.2831853;',
    '  float spd = md < 0.5 ? 1.7 : (md < 1.5 ? 6.5 : (md < 2.5 ? 1.0 : (md < 3.5 ? 11.0 : 13.0)));',
    '  float sw = sin(uTime * spd + ph);',
    '  float bobAmp = md < 0.5 ? 0.015 : (md < 1.5 ? 0.05 : (md < 2.5 ? 0.008 : (md < 3.5 ? 0.09 : 0.09)));',
    '  transformed.y += (md < 0.5 ? sin(uTime*1.7+ph) : abs(sw)) * bobAmp;',
    '  if (aLimb > 0.5) {',
    '    float swing = 0.0;',
    '    if (aLimb < 2.5) {',                                  // 腿：左(1)右(2)反相
    '      float d = aLimb < 1.5 ? 1.0 : -1.0;',
    '      float amp = md < 0.5 ? 0.04 : (md < 1.5 ? 0.5 : (md < 2.5 ? 0.04 : (md < 3.5 ? 0.6 : 0.85)));',
    '      swing = sw * d * amp;',
    '    } else {',                                            // 臂：左(3)右(4)+槍
    '      if (md > 1.5 && md < 2.5) {',                       // 開槍：雙臂前舉 + 右臂後座脈動
    '        float rc = sin(uTime*16.0 + ph);',
    '        swing = (aLimb > 3.5) ? (-0.95 + max(rc,0.0)*0.14) : -0.6;',
    '      } else {',
    '        float d = aLimb < 3.5 ? -1.0 : 1.0;',
    '        float amp = md < 0.5 ? 0.05 : (md < 1.5 ? 0.42 : (md < 3.5 ? 0.5 : 0.72));',
    '        swing = sw * d * amp;',
    '      }',
    '    }',
    '    float c = cos(swing), sn = sin(swing);',              // 繞 X 軸於 aPivotY 旋轉(前後擺，士兵面 +Z)
    '    float yy = transformed.y - aPivotY;',
    '    float zz = transformed.z;',
    '    transformed.y = aPivotY + c*yy - sn*zz;',
    '    transformed.z = sn*yy + c*zz;',
    '  }',
    '}',
  ].join('\n');

  // 建立動畫材質：以 MeshStandardMaterial 為底(保留光照/陰影/頂點色)，注入肢體動畫。
  //   回傳 material；material.userData.uMode.value 可逐幀設定動畫模式。
  S.makeAnimatedMaterial = function (opts) {
    opts = opts || {};
    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true, roughness: opts.roughness != null ? opts.roughness : 0.7,
      metalness: opts.metalness != null ? opts.metalness : 0.05 });
    const uMode = { value: 0 };
    mat.userData.uMode = uMode;
    mat.onBeforeCompile = function (shader) {
      shader.uniforms.uTime = sharedTime;
      shader.uniforms.uMode = uMode;
      shader.vertexShader =
        'attribute float aLimb;\nattribute float aPivotY;\nattribute float aPhase;\n' +
        'uniform float uTime;\nuniform float uMode;\n' +
        shader.vertexShader.replace('#include <begin_vertex>',
          '#include <begin_vertex>\n' + LIMB_GLSL);
    };
    return mat;
  };

  // formMode(line/column/square/charge/rout/hold) + 是否騎乘 → uMode 數值
  S.animModeFor = function (formMode, mounted) {
    if (mounted) return (formMode === 'hold' || formMode === 'square') ? 0.0 : 3.0; // 駐立0/移動奔馳3
    switch (formMode) {
      case 'column': return 1.0;   // 行軍
      case 'line':   return 2.0;   // 交戰開槍
      case 'charge': return 4.0;   // 步兵突擊奔跑
      case 'rout':   return 4.0;   // 潰逃奔跑
      case 'square': return 0.0;   // 方陣駐立(舉槍備戰)
      default:       return 0.0;   // hold 駐立
    }
  };
})(window.SEKI);
