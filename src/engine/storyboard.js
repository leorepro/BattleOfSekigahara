/* =========================================================================
 * src/engine/storyboard.js — 逐鏡停留式運鏡播放（採 HK1941 demo 模型）
 *   每鏡：先 tween（鏡頭飛入 + 時刻推進到 shot.t），再 hold 秒（緩慢 orbit）。
 *   程式模式下本模組「擁有」戰場時刻 S.player.time。
 * ======================================================================= */
window.SEKI = window.SEKI || {};

(function (S) {
  const D2R = Math.PI / 180;
  const _t = new THREE.Vector3(), _p = new THREE.Vector3();
  let idx = 0, phase = 'tween', shotTimer = 0, tweenTimer = 0, az = 0;

  function targetOf(shot) {
    const p = S.engine.project(shot.cam.lng, shot.cam.lat, 0);
    const y = (S.terrain ? S.terrain.heightAt(p.x, p.z) : 0) + 4;
    return _t.set(p.x, y, p.z);
  }
  function spherical(target, r, azDeg, elDeg) {
    const a = azDeg * D2R, e = elDeg * D2R, h = r * Math.cos(e);
    return _p.set(target.x + h * Math.cos(a), target.y + r * Math.sin(e), target.z + h * Math.sin(a));
  }

  S.startProgram = function () { idx = 0; phase = 'tween'; shotTimer = tweenTimer = 0;
    az = S.storyboard[0].cam.az; S.player.time = S.storyboard[0].t;
    if (S.setEventCard) S.setEventCard(S.storyboard[0]); };

  S.currentShot = null;

  S.updateStoryboard = function (dt) {
    if (!S.player || !S.player.program) return;
    const sb = S.storyboard, cur = sb[idx];
    if (S.currentShot !== cur) { S.currentShot = cur; if (S.setEventCard) S.setEventCard(cur); }
    const eng = S.engine, cam = eng.camera, tgt = targetOf(cur);

    if (phase === 'tween') {
      tweenTimer += dt;
      az = cur.cam.az;
      const want = spherical(tgt, cur.cam.dist, az, cur.cam.el);
      const k = 1 - Math.exp(-dt * 1.8);
      cam.position.lerp(want, k);
      eng.controls.target.lerp(tgt, k);
      // 時刻平滑推進到本鏡
      S.player.time += (cur.t - S.player.time) * k;
      if (cam.position.distanceTo(want) < cur.cam.dist * 0.04 || tweenTimer > 3.2) {
        phase = 'hold'; shotTimer = 0; S.player.time = cur.t;
      }
    } else { // hold：緩慢環繞
      shotTimer += dt;
      az += cur.cam.orbit * dt * 2.4;          // 慢速 orbit
      const want = spherical(tgt, cur.cam.dist, az, cur.cam.el);
      cam.position.lerp(want, 1 - Math.exp(-dt * 4));
      eng.controls.target.lerp(tgt, 1 - Math.exp(-dt * 4));
      S.player.time = cur.t;
      if (shotTimer >= cur.hold && S.player.playing) {
        idx = (idx + 1) % sb.length; phase = 'tween'; tweenTimer = 0;
      }
    }
  };

  S.setProgramMode = function (on) {
    if (!S.player) return;
    S.player.program = on;
    S.engine.controls.enabled = !on;
    if (on) S.startProgram();
  };

  // 給 UI：跳到指定鏡
  S.gotoShot = function (i) { idx = (i + S.storyboard.length) % S.storyboard.length;
    phase = 'tween'; tweenTimer = 0; };
})(window.SEKI);
