/* =========================================================================
 * src/engine/ui.js — 控制列 / 字幕 / 兵力儀表 / 點選卡片 / 配樂
 *   initUI()      綁定 DOM 控制項與點選
 *   updateUI(t)   每幀刷新時間軸、字幕、兵力長條
 * ======================================================================= */
window.SEKI = window.SEKI || {};

(function (S) {
  let el = {}, scrubbing = false, raycaster, mouse;
  let eastMax = 1, westMax = 1;

  function timeStr(t) {
    const names = [[8,'辰刻'],[10,'巳刻'],[12,'午刻'],[13,'未刻']];
    let n = '辰刻'; for (const [h, nm] of names) if (t >= h) n = nm;
    const hh = Math.floor(t), mm = Math.floor((t - hh) * 60);
    return `${n} ${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
  }
  function captionAt(t) {
    const sb = S.storyboard; let cur = sb[0];
    for (const s of sb) if (t >= s.t) cur = s; else break;
    return cur;
  }

  S.initUI = function () {
    const ids = ['caption','capMain','capSub','btnPlay','scrub','spd','btnMode',
      'tlabel','barEast','barWest','valEast','valWest','card','cardBody','cardClose','btnAudio','bgm'];
    ids.forEach(id => el[id] = document.getElementById(id));

    const init = S.sideStrength();
    eastMax = init.east || 1; westMax = init.west || 1;

    // 播放/暫停
    el.btnPlay.onclick = () => { S.player.playing = !S.player.playing; syncPlay(); };
    // 時間軸
    el.scrub.min = S.player.T_START; el.scrub.max = S.player.T_END; el.scrub.step = 0.01;
    el.scrub.addEventListener('input', () => {
      scrubbing = true; S.player.time = parseFloat(el.scrub.value); S.player.playing = false; syncPlay();
    });
    el.scrub.addEventListener('change', () => { scrubbing = false; });
    // 倍速
    el.spd.onchange = () => { S.player.speed = parseFloat(el.spd.value); };
    // 節目 / 自由
    el.btnMode.onclick = () => {
      S.setProgramMode(!S.player.program);
      el.btnMode.textContent = S.player.program ? '🎬 節目模式' : '🕹 自由運鏡';
      el.btnMode.classList.toggle('on', S.player.program);
    };
    // 配樂
    el.btnAudio.onclick = () => {
      if (!el.bgm) return;
      if (el.bgm.paused) { el.bgm.volume = 0.6; el.bgm.play().then(() => {
          el.btnAudio.textContent = '🔊 配樂'; }).catch(() => {
          el.btnAudio.textContent = '🔇 無音檔'; });
      } else { el.bgm.pause(); el.btnAudio.textContent = '🔈 配樂'; }
    };

    // 點選部隊 → 卡片
    raycaster = new THREE.Raycaster(); mouse = new THREE.Vector2();
    S.engine.renderer.domElement.addEventListener('click', onClick);
    el.cardClose.onclick = () => el.card.classList.remove('show');

    syncPlay();
  };

  function syncPlay() {
    if (el.btnPlay) el.btnPlay.textContent = S.player.playing ? '⏸' : '▶';
  }

  function onClick(ev) {
    const r = S.engine.renderer.domElement.getBoundingClientRect();
    mouse.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
    mouse.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
    raycaster.setFromCamera(mouse, S.engine.camera);
    const hits = raycaster.intersectObjects(S.getPickables(), false);
    if (!hits.length) return;
    const u = hits[0].object.userData.unit; if (!u) return;
    const a = u.data, s = u.cur || { s: a.troops, st: 'hold' };
    const sideZh = a.side === 'east' ? '東軍' : '西軍';
    el.cardBody.innerHTML =
      `<div class="card-name side-${a.side}">${a.name_zh}<span class="ja"> ${a.name_ja}</span></div>` +
      `<div class="card-row">${sideZh} · ${a.title}</div>` +
      `<div class="card-row">兵力　<b>${Math.round(Math.max(s.s,0)).toLocaleString('en-US')}</b> / ${a.troops.toLocaleString('en-US')}</div>` +
      `<div class="card-row">家紋　${a.crest}</div>`;
    el.card.classList.add('show');
  }

  S.updateUI = function (t) {
    if (!scrubbing && el.scrub) el.scrub.value = t;
    if (el.tlabel) el.tlabel.textContent = timeStr(t);

    const cap = captionAt(t);
    if (cap && el.capMain) {
      el.capMain.textContent = cap.cap; el.capSub.textContent = cap.sub;
      el.caption.classList.toggle('hot', /★/.test(cap.cap));
    }
    const ss = S.sideStrength();
    if (el.barEast) {
      el.barEast.style.width = Math.max(0, Math.min(100, ss.east / eastMax * 100)) + '%';
      el.barWest.style.width = Math.max(0, Math.min(100, ss.west / westMax * 100)) + '%';
      el.valEast.textContent = Math.round(ss.east).toLocaleString('en-US');
      el.valWest.textContent = Math.round(ss.west).toLocaleString('en-US');
    }
  };
})(window.SEKI);
