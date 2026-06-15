/* =========================================================================
 * src/engine/storyboard.js — 逐鏡停留式運鏡播放（採 HK1941 demo 模型）
 *   每鏡：先 tween（鏡頭飛入 + 時刻推進到 shot.t），再 hold 秒（緩慢 orbit）。
 *   程式模式下本模組「擁有」戰場時刻 S.player.time。
 * ======================================================================= */
window.SEKI = window.SEKI || {};

(function (S) {
  const D2R = Math.PI / 180;
  // 聚焦戰鬥過程:決戰鏡頭(t≥7.6)停留更久,戰前背景短一點;整段約 5 分鐘
  function holdOf(shot) { return shot.hold * (shot.t >= 7.6 ? 1.6 : 0.7); }
  const _t = new THREE.Vector3(), _p = new THREE.Vector3();
  let idx = 0, phase = 'tween', shotTimer = 0, tweenTimer = 0, az = 0;

  function targetLL(lng, lat) {
    const p = S.engine.project(lng, lat, 0);
    const y = (S.terrain ? S.terrain.heightAt(p.x, p.z) : 0) + 4;
    return _t.set(p.x, y, p.z);
  }
  function targetOf(shot) { return targetLL(shot.cam.lng, shot.cam.lat); }
  function spherical(target, r, azDeg, elDeg) {
    const a = azDeg * D2R, e = elDeg * D2R, h = r * Math.cos(e);
    return _p.set(target.x + h * Math.cos(a), target.y + r * Math.sin(e), target.z + h * Math.sin(a));
  }

  S.startProgram = function () { idx = 0; phase = 'tween'; shotTimer = tweenTimer = 0;
    az = S.storyboard[0].cam.az; S.player.time = S.storyboard[0].t;
    if (S.setEventCard) S.setEventCard(S.storyboard[0]);
    if (S.setFocus) S.setFocus(S.storyboard[0].focus); };

  S.currentShot = null;

  S.updateStoryboard = function (dt) {
    if (!S.player || !S.player.program) return;
    const sb = S.storyboard, cur = sb[idx];
    if (S.currentShot !== cur) {
      S.currentShot = cur;
      if (S.setEventCard) S.setEventCard(cur);
      if (S.setFocus) S.setFocus(cur.focus);
    }
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
    } else { // hold：電影運鏡——dolly 推拉 / pan 隨砲火角度掃 / 關鍵時刻慢動作
      shotTimer += dt;
      const H = holdOf(cur), p = Math.min(1, shotTimer / H);
      const ease = p * p * (3 - 2 * p);                 // smoothstep
      const c2 = cur.cam2;                               // 終點鏡位(部分覆寫)：推拉/pan/pull-out
      const mix = (a, b) => (b == null ? a : a + (b - a) * ease);
      const dist = c2 ? mix(cur.cam.dist, c2.dist) : cur.cam.dist;
      const el = c2 ? mix(cur.cam.el, c2.el) : cur.cam.el;
      const tgt2 = (c2 && (c2.lng != null || c2.lat != null))
        ? targetLL(mix(cur.cam.lng, c2.lng), mix(cur.cam.lat, c2.lat)) : tgt;
      if (c2 && c2.az != null) az = mix(cur.cam.az, c2.az);   // 電影式 pan（可沿砲火角度掃）
      else az += cur.cam.orbit * dt * 2.4;                     // 否則緩慢 orbit
      const want = spherical(tgt2, dist, az, el);
      const k = 1 - Math.exp(-dt * 4);
      cam.position.lerp(want, k); eng.controls.target.lerp(tgt2, k);
      // 慢動作：關鍵鏡在 hold 期間讓戰場時刻緩慢推進(span 小→很慢)，呈現 slow-mo
      if (cur.slowmo) S.player.time = cur.t + Math.min(cur.span || 0.6, p * (cur.span || 0.6));
      else S.player.time = cur.t;
      if (shotTimer >= H && S.player.playing) {
        idx = (idx + 1) % sb.length; phase = 'tween'; tweenTimer = 0;
      }
    }
  };

  S.setProgramMode = function (on) {
    if (!S.player) return;
    S.player.program = on;
    S.engine.controls.enabled = !on;
    if (on) S.startProgram();
    else if (S.setFocus) S.setFocus(null);   // 自由模式不淡化
  };

  // 給 UI：跳到指定鏡
  S.gotoShot = function (i) { idx = (i + S.storyboard.length) % S.storyboard.length;
    phase = 'tween'; tweenTimer = 0; };
})(window.SEKI);
