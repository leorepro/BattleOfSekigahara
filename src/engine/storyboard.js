/* =========================================================================
 * src/engine/storyboard.js — 節目模式自動運鏡
 *   依戰場時刻挑選 shot，平滑滑向該鏡位；提供字幕內容給 UI。
 *   pol 解讀為「仰角」（離地平面角度）：值越大鏡頭越高俯瞰。
 * ======================================================================= */
window.SEKI = window.SEKI || {};

(function (S) {
  const D2R = Math.PI / 180;
  const _tmpTarget = new THREE.Vector3();
  const _tmpPos = new THREE.Vector3();

  function shotAt(t) {
    const sb = S.storyboard;
    let cur = sb[0];
    for (const s of sb) if (t >= s.t) cur = s; else break;
    return cur;
  }

  // shot → {pos, target}
  function frame(shot) {
    const eng = S.engine;
    const p = eng.project(shot.lng, shot.lat, 0);
    const ty = (S.terrain ? S.terrain.heightAt(p.x, p.z) : 0) + 4;
    _tmpTarget.set(p.x, ty, p.z);
    const az = shot.az * D2R, pol = shot.pol * D2R;
    const horiz = shot.dist * Math.cos(pol);
    _tmpPos.set(
      _tmpTarget.x + horiz * Math.cos(az),
      _tmpTarget.y + shot.dist * Math.sin(pol),
      _tmpTarget.z + horiz * Math.sin(az)
    );
    return { pos: _tmpPos, target: _tmpTarget };
  }

  S.currentShot = null;

  S.updateStoryboard = function (t, dt) {
    if (!S.player || !S.player.program) return;
    const shot = shotAt(t);
    S.currentShot = shot;
    const f = frame(shot);
    const eng = S.engine;
    // 平滑緩動（指數逼近，與 fps 無關）
    const k = 1 - Math.exp(-dt * 1.6);
    eng.camera.position.lerp(f.pos, k);
    eng.controls.target.lerp(f.target, k);
  };

  // 切換節目/自由模式時呼叫
  S.setProgramMode = function (on) {
    if (!S.player) return;
    S.player.program = on;
    S.engine.controls.enabled = !on;       // 節目模式停用手動運鏡
  };
})(window.SEKI);
