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
    if (S.player.cinemaScale == null) S.player.cinemaScale = 1; // 子彈時間係數初始化
    if (S.setEventCard) S.setEventCard(S.storyboard[0]);
    if (S.setFocus) S.setFocus(S.storyboard[0].focus); };

  S.currentShot = null;

  /* -------------------------------------------------------------------------
   * Phase 5 電影化運鏡輔助（皆為新增、向後相容）：
   *   - dynamicTarget(shot): 若鏡位提供 shot.focusUnit / shot.meleeKey，於執行期
   *       取得活體焦點座標(unit.group.position 或 S.meleeFocus(key))，覆寫靜態 lng/lat。
   *       未提供 → 回傳 null，呼叫端沿用原本 targetOf()，零行為改變。
   *   - cinemaScale：S.player.cinemaScale（0~1 慢動作係數），由鏡位 cam.cinemaScale
   *       （或 cam2.cinemaScale）平滑驅動；主迴圈自行讀取乘 dt。未設欄位 → 平滑回升至 1。
   * --------------------------------------------------------------------- */
  function dynamicTarget(shot) {
    // 1) 指定 unit：取其 group 世界座標
    if (shot && shot.focusUnit && S.unitById) {
      const u = S.unitById(shot.focusUnit);
      if (u && u.group && u.group.position) {
        const p = u.group.position;
        const y = (S.terrain ? S.terrain.heightAt(p.x, p.z) : p.y) + 4;
        return _t.set(p.x, y, p.z);
      }
    }
    // 2) 近接焦點 key：guard S.meleeFocus 可能未定義或回傳 null
    if (shot && shot.meleeKey && typeof S.meleeFocus === 'function') {
      const f = S.meleeFocus(shot.meleeKey);
      if (f && typeof f.x === 'number' && typeof f.z === 'number') {
        const y = (typeof f.y === 'number') ? f.y
          : (S.terrain ? S.terrain.heightAt(f.x, f.z) : 0) + 4;
        return _t.set(f.x, y, f.z);
      }
    }
    return null;
  }
  // 平滑驅動 cinemaScale 至目標值（每幀指數逼近，dt 為真實秒數）
  function driveCinemaScale(targetScale, dt) {
    if (S.player.cinemaScale == null) S.player.cinemaScale = 1;
    const kk = 1 - Math.exp(-dt * 3.2);
    S.player.cinemaScale += (targetScale - S.player.cinemaScale) * kk;
    if (Math.abs(S.player.cinemaScale - targetScale) < 0.004) S.player.cinemaScale = targetScale;
  }

  S.updateStoryboard = function (dt) {
    if (!S.player || !S.player.program) return;
    const sb = S.storyboard, cur = sb[idx];
    if (S.currentShot !== cur) {
      S.currentShot = cur;
      if (S.setEventCard) S.setEventCard(cur);
      if (S.setFocus) S.setFocus(cur.focus);
    }
    const eng = S.engine, cam = eng.camera;
    // 動態焦點（Phase 5 新增，gate）：focusUnit / meleeKey 存在且可解析 → 覆寫靜態注視點
    const dynBase = dynamicTarget(cur);
    const tgt = dynBase ? dynBase.clone() : targetOf(cur);

    if (phase === 'tween') {
      tweenTimer += dt;
      az = cur.cam.az;
      const want = spherical(tgt, cur.cam.dist, az, cur.cam.el);
      const k = 1 - Math.exp(-dt * 1.8);
      cam.position.lerp(want, k);
      eng.controls.target.lerp(tgt, k);
      // 時刻平滑推進到本鏡
      S.player.time += (cur.t - S.player.time) * k;
      // 子彈時間：tween 期間平滑趨向「起始 cinemaScale」(未設則 1)，避免進鏡瞬間跳變
      if ('cinemaScale' in S.player) driveCinemaScale(cur.cam.cinemaScale != null ? cur.cam.cinemaScale : 1, dt);
      // fov 變焦（gate）：tween 期間平滑趨向起始 fov
      if (cur.cam.fov != null && cam.fov != null) {
        const kf = 1 - Math.exp(-dt * 2.2);
        cam.fov += (cur.cam.fov - cam.fov) * kf; cam.updateProjectionMatrix();
      }
      if (cam.position.distanceTo(want) < cur.cam.dist * 0.04 || tweenTimer > 3.2) {
        phase = 'hold'; shotTimer = 0; S.player.time = cur.t;
      }
    } else { // hold：電影運鏡——dolly 推拉 / orbit 公轉 / pan 隨砲火角度掃 / 子彈時間
      shotTimer += dt;
      const H = holdOf(cur), p = Math.min(1, shotTimer / H);
      const ease = p * p * (3 - 2 * p);                 // smoothstep
      const c2 = cur.cam2;                               // 終點鏡位(部分覆寫)：推拉/pan/pull-out/orbit/fov
      const mix = (a, b) => (b == null ? a : a + (b - a) * ease);
      // Phase 5 push/pull：cam.push（hold 期間累進靠近的世界距離，正=推近/負=拉遠）
      //   優先序：cam2.dist > cam.push 增量 > cam.dist。push 為新增欄位，未設 → 沿用原 dist。
      let dist;
      if (c2 && c2.dist != null) dist = mix(cur.cam.dist, c2.dist);
      else if (cur.cam.push != null) dist = cur.cam.dist - cur.cam.push * ease; // push>0 推近(縮短半徑)
      else dist = cur.cam.dist;
      const el = c2 ? mix(cur.cam.el, c2.el) : cur.cam.el;
      // 注視點：cam2 的 lng/lat 仍可平移；動態焦點存在時以動態焦點為基準（不被靜態 lng/lat 蓋掉）
      let tgt2;
      if (!dynBase && c2 && (c2.lng != null || c2.lat != null))
        tgt2 = targetLL(mix(cur.cam.lng, c2.lng), mix(cur.cam.lat, c2.lat));
      else tgt2 = tgt;
      // 方位 az：cam2.az 顯式 pan > cam.orbit/orbitSweep 公轉 > 預設緩慢 orbit
      if (c2 && c2.az != null) az = mix(cur.cam.az, c2.az);          // 電影式 pan
      else if (cur.cam.orbitSweep != null) az = cur.cam.az + cur.cam.orbitSweep * ease; // Phase 5：固定角度掃 orbit
      else if (S.config && S.config.boundedOrbit)                     // 有界公轉：整段只掃固定小角度，永不繞到地形背面
        az = cur.cam.az + (cur.cam.orbit || 0) * (S.config.orbitSpan || 36) * ease;
      else az += cur.cam.orbit * dt * 2.4;                            // 否則緩慢 orbit（原行為，前三場不受影響）
      const want = spherical(tgt2, dist, az, el);
      const k = 1 - Math.exp(-dt * 4);
      cam.position.lerp(want, k); eng.controls.target.lerp(tgt2, k);
      // 子彈時間（gate）：hold 期間平滑趨向目標 cinemaScale；cam2.cinemaScale > cam.cinemaScale > 1
      if ('cinemaScale' in S.player) {
        let target = 1;
        if (c2 && c2.cinemaScale != null) target = c2.cinemaScale;
        else if (cur.cam.cinemaScale != null) target = cur.cam.cinemaScale;
        driveCinemaScale(target, dt);
      }
      // fov 變焦（gate）：cam2.fov > cam.fov；hold 期間平滑插值
      if (cam.fov != null && (cur.cam.fov != null || (c2 && c2.fov != null))) {
        const baseFov = cur.cam.fov != null ? cur.cam.fov : cam.fov;
        const wantFov = (c2 && c2.fov != null) ? mix(baseFov, c2.fov) : baseFov;
        const kf = 1 - Math.exp(-dt * 3.0);
        cam.fov += (wantFov - cam.fov) * kf; cam.updateProjectionMatrix();
      }
      // 慢動作：關鍵鏡在 hold 期間讓戰場時刻緩慢推進(span 小→很慢)，呈現 slow-mo
      // 節目播放速度：每鏡可設 span(此鏡 hold 期間推進的戰場小時數)；span/hold=有效倍速，
      //   小→慢動作(0.2x)、大→接近即時(1x)、未設則凍結成定格。自動夾住不超過下一鏡時刻。
      let span = cur.span || 0;
      const nextT = sb[(idx + 1) % sb.length].t;
      if (nextT > cur.t) span = Math.min(span, nextT - cur.t - 0.05);
      S.player.time = span > 0 ? cur.t + p * span : cur.t;
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
    else { if ('cinemaScale' in S.player) S.player.cinemaScale = 1; // 離開節目：解除子彈時間
           if (S.setFocus) S.setFocus(null); }   // 自由模式不淡化
  };

  // 給 UI：跳到指定鏡
  S.gotoShot = function (i) { idx = (i + S.storyboard.length) % S.storyboard.length;
    phase = 'tween'; tweenTimer = 0; };
})(window.SEKI);
