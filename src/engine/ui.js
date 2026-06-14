/* =========================================================================
 * src/engine/ui.js — 控制列 / 字幕 / 兵力儀表 / 點選卡片 / 配樂
 *   initUI()      綁定 DOM 控制項與點選
 *   updateUI(t)   每幀刷新時間軸、字幕、兵力長條
 * ======================================================================= */
window.SEKI = window.SEKI || {};

(function (S) {
  let el = {}, scrubbing = false, raycaster, mouse;
  let eastMax = 1, westMax = 1;

  // 時刻 T（距 10/21 00:00 的小時數）→「九月十四日 戌刻 20:00」
  const JIKOKU = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  S.fmtTime = function (t) {
    const day = 15 + Math.floor(t / 24);
    const h = ((Math.floor(t) % 24) + 24) % 24;
    const mm = Math.floor(((t % 1) + 1) % 1 * 60);
    const jk = JIKOKU[Math.floor(((h + 1) % 24) / 2)];
    const dayZh = day === 14 ? '十四日' : day === 15 ? '十五日' : `${day}日`;
    return `九月${dayZh} ${jk}刻 ${String(h).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
  };
  function timeStr(t) { return S.fmtTime(t); }
  // 由 storyboard 推進時呼叫，更新底部事件卡
  S.setEventCard = function (shot) {
    if (!el.caption || !shot) return;
    el.evDate.textContent = shot.dateLabel || '';
    el.evTitle.textContent = shot.title_zh || '';
    el.evTitleEn.textContent = shot.title_en || '';
    el.evNarr.textContent = shot.narration_zh || '';
    el.evCmd.innerHTML = (shot.commanders || []).map(c =>
      `<span class="chip">${c.zh}<span class="en"> ${c.en}</span></span>`).join('');
    el.caption.classList.toggle('hot', /★/.test(shot.title_zh || ''));
  };

  S.initUI = function () {
    const ids = ['caption','evDate','evTitle','evTitleEn','evNarr','evCmd','btnPlay','scrub','spd','btnMode',
      'tlabel','barEast','barWest','valEast','valWest','balLabel','card','cardBody','cardClose','btnAudio','bgm',
      'btnNotes','notes','notesBody','notesClose','roster','btnRoster','toast','markers'];
    ids.forEach(id => el[id] = document.getElementById(id));

    const init = S.sideStrength();
    eastMax = init.east || 1; westMax = init.west || 1;

    // 播放/暫停
    el.btnPlay.onclick = () => { S.player.playing = !S.player.playing; syncPlay(); };
    // 時間軸
    el.scrub.min = 0; el.scrub.max = 1000; el.scrub.step = 1;      // 用位置(非線性對應時刻)
    el.scrub.addEventListener('input', () => {
      scrubbing = true;
      const v = posToTime(parseFloat(el.scrub.value) / 1000);
      if (S.player.program) {
        S.gotoShot(nearestShotIndex(v));      // 節目模式：跳到最近的鏡頭，運鏡帶過去，維持節目模式
      } else {
        S.player.time = v; S.player.playing = false; syncPlay();   // 自由模式：直接設定時刻
      }
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

    // 時間軸事件節點（各鏡頭）：懸停顯示名稱、點擊跳到該鏡頭播放
    buildMarkers();

    // 軍隊面板開關
    if (el.btnRoster) el.btnRoster.onclick = () => {
      el.roster.classList.toggle('show'); el.btnRoster.classList.toggle('on');
    };

    // 史料面板
    buildNotes();
    el.btnNotes.onclick = () => el.notes.classList.toggle('show');
    el.notesClose.onclick = () => el.notes.classList.remove('show');

    // 點選部隊 → 卡片
    raycaster = new THREE.Raycaster(); mouse = new THREE.Vector2();
    S.engine.renderer.domElement.addEventListener('click', onClick);
    el.cardClose.onclick = () => el.card.classList.remove('show');

    syncPlay();
  };

  function syncPlay() {
    if (el.btnPlay) el.btnPlay.textContent = S.player.playing ? '⏸' : '▶';
  }

  // 非線性時間軸：戰前(T_START~7)佔 SPLIT 比例,決戰(7~T_END)佔其餘 → 決戰段拉長
  const TB = 7, SPLIT = 0.25;
  function timeToPos(t) {                    // 時刻 → 0..1
    const T0 = S.player.T_START, T1 = S.player.T_END;
    if (t <= TB) return Math.max(0, (t - T0) / (TB - T0)) * SPLIT;
    return SPLIT + Math.min(1, (t - TB) / (T1 - TB)) * (1 - SPLIT);
  }
  function posToTime(p) {                    // 0..1 → 時刻
    const T0 = S.player.T_START, T1 = S.player.T_END;
    if (p <= SPLIT) return T0 + (p / SPLIT) * (TB - T0);
    return TB + ((p - SPLIT) / (1 - SPLIT)) * (T1 - TB);
  }

  function nearestShotIndex(v) {
    const sb = S.storyboard; let best = 0, bd = Infinity;
    for (let i = 0; i < sb.length; i++) { const d = Math.abs(sb[i].t - v); if (d < bd) { bd = d; best = i; } }
    return best;
  }

  function buildMarkers() {
    if (!el.markers || !S.events) return;
    // 時間軸節點 = 全部關鍵事件;懸停看說明、點擊跳到該時刻(節目模式運鏡帶過去)
    el.markers.innerHTML = S.events.map((e) => {
      const pct = timeToPos(e.t) * 100;       // 非線性:決戰節點自然散開
      if (pct < -0.5 || pct > 100.5) return '';
      const hot = /★/.test(e.zh) ? ' hot' : '';
      const title = e.zh.replace('★', '').trim();
      const left = Math.max(0, Math.min(100, pct));
      return `<div class="mk${hot}" data-t="${e.t}" style="left:${left}%">` +
             `<span class="mk-dot"></span><span class="mk-lbl">${title}</span></div>`;
    }).filter(Boolean).join('');
    el.markers.querySelectorAll('.mk').forEach(m => {
      m.onclick = () => {
        const t = +m.dataset.t;
        if (S.player.program) {
          S.gotoShot(nearestShotIndex(t)); S.player.playing = true; syncPlay();
        } else {
          S.player.time = t; S.player.playing = false; syncPlay();
        }
      };
    });
  }

  // 關鍵事件提示橫幅
  let _toastTimer = null, _lastEvT = -999;
  S.showToast = function (text) {
    if (!el.toast) return;
    el.toast.textContent = text; el.toast.classList.add('show');
    if (_toastTimer) clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => el.toast.classList.remove('show'), 3400);
  };
  S.updateEvents = function (t) {
    const evs = S.events; if (!evs) return;
    if (t < _lastEvT - 0.2) { _lastEvT = t; return; }      // 倒帶/循環:重置不觸發
    if (t > _lastEvT) {
      for (const e of evs) if (e.t > _lastEvT && e.t <= t) S.showToast(e.zh);
      _lastEvT = t;
    }
  };

  function buildNotes() {
    const s = S.sources; if (!s || !el.notesBody) return;
    const list = (arr, cls) => '<ul>' + arr.map(x => `<li class="${cls||''}">${x}</li>`).join('') + '</ul>';
    el.notesBody.innerHTML =
      `<p>${s.overview}</p>` +
      `<h3>考據與呈現說明 · Caveats</h3>${list(s.caveats, 'caveat')}` +
      `<h3>參考書目 · Books</h3>${list(s.books)}` +
      `<h3>近世史料 · Primary Sources</h3>${list(s.primary)}` +
      `<h3>資料來源 · Data</h3>${list(s.data)}`;
  }

  const CREST_NAME = { daiichi:'大一大万大吉', jiMonji:'児文字', mukaiCho:'対い蝶',
    chigaiKama:'違い鎌', ichimonjiMitsuboshi:'一文字三星', maruJuji:'丸に十字',
    mitsubaAoi:'三つ葉葵', omodaka:'澤瀉', tachibana:'井伊橘', tachiAoi:'立葵',
    fujiTomoe:'藤巴', kuyo:'九曜' };
  const KIND_ARMS = {
    command:   ['本陣 · 旗本', '鉄砲・大筒兼備的總大將直屬部隊'],
    artillery: ['大筒・鉄砲', '配大筒砲擊（※大筒於關原屬通俗演繹，史實以鉄砲為主）'],
    matchlock: ['鉄砲（火縄銃）', '以火縄銃輪番齊射著稱'],
    cavalry:   ['騎馬隊', '騎馬突擊（如井伊「赤備え」朱漆精騎）'],
    infantry:  ['足軽 · 長槍 · 鉄砲', '長槍足軽為主，配屬鉄砲'],
  };
  const ST_ZH = { hold:'布陣', march:'行軍', attack:'交戰', rout:'潰走', breakthrough:'敵中突破' };

  function onClick(ev) {
    const r = S.engine.renderer.domElement.getBoundingClientRect();
    mouse.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
    mouse.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
    raycaster.setFromCamera(mouse, S.engine.camera);
    const hits = raycaster.intersectObjects(S.getPickables(), false);
    if (!hits.length) return;
    const u = hits[0].object.userData.unit; if (!u) return;
    const a = u.data, s = u.cur || { s: a.troops, st: 'hold' };
    const sideZh = a.side === 'east' ? '東軍（德川）' : '西軍（石田）';
    const arms = KIND_ARMS[a.kind] || KIND_ARMS.infantry;
    el.cardBody.innerHTML =
      `<div class="card-name side-${a.side}">${a.name_zh}<span class="ja"> ${a.name_ja}</span></div>` +
      `<div class="card-row">${sideZh} · ${a.title}</div>` +
      `<div class="card-row">兵力　<b>${Math.round(Math.max(s.s,0)).toLocaleString('en-US')}</b> / ${a.troops.toLocaleString('en-US')}　<span style="opacity:.7">${ST_ZH[s.st]||''}</span></div>` +
      `<div class="card-row">兵種　<b>${arms[0]}</b></div>` +
      `<div class="card-row" style="opacity:.78;font-size:12px">${arms[1]}</div>` +
      `<div class="card-row">家紋　${CREST_NAME[a.crest] || a.crest}</div>`;
    el.card.classList.add('show');
  }

  function nf(n) { return Math.round(Math.max(n, 0)).toLocaleString('en-US'); }
  function sideOf(u) { return ((u.data.side === 'east') || u.defected) ? 'e' : 'w'; }
  let _rframe = 0;
  function updateRoster(t) {
    if (!el.roster) return;
    const pairs = [];
    for (const e of (S.engagements || [])) {
      const A = S.unitById(e.a), B = S.unitById(e.b); if (!A || !B) continue;
      const sA = A.cur ? A.cur.s : A.data.troops, sB = B.cur ? B.cur.s : B.data.troops;
      if (t >= e.from && t <= e.to && sA > 1 && sB > 1) pairs.push({ A, B, sA, sB });
    }
    const ss = S.sideStrength();
    const eng = new Set(); pairs.forEach(p => { eng.add(p.A.data.id); eng.add(p.B.data.id); });
    let eE = 0, eW = 0;
    eng.forEach(id => { const u = S.unitById(id); const s = Math.max(u.cur ? u.cur.s : u.data.troops, 0);
      if (sideOf(u) === 'e') eE += s; else eW += s; });
    let h = `<div class="rs-tot"><span class="e">東軍 ${nf(ss.east)}</span> · <span class="w">西軍 ${nf(ss.west)}</span></div>`;
    h += `<div class="rs-row" style="opacity:.85"><span>交戰投入</span><span class="s"><span class="e">${nf(eE)}</span> · <span class="w">${nf(eW)}</span></span></div>`;
    if (pairs.length) {
      h += `<div class="rs-sec">⚔ 交戰中（誰打誰）</div>`;
      for (const p of pairs)
        h += `<div class="rs-pair"><span class="${sideOf(p.A)}">${p.A.data.name_zh} <span class="s">${nf(p.sA)}</span></span>` +
             `<span class="vs">⚔</span><span class="${sideOf(p.B)}">${p.B.data.name_zh} <span class="s">${nf(p.sB)}</span></span></div>`;
    }
    h += `<div class="rs-sec">全軍兵力（依多寡）</div>`;
    const all = S.armies.map(a => { const u = S.unitById(a.id);
      return { a, s: Math.round(u && u.cur ? u.cur.s : a.troops), e: sideOf(u || { data: a }) }; })
      .filter(x => x.s > 0).sort((x, y) => y.s - x.s);
    for (const it of all)
      h += `<div class="rs-row"><span class="${it.e}">${it.a.name_zh}</span><span class="s">${nf(it.s)}</span></div>`;
    el.roster.innerHTML = h;
  }

  S.updateUI = function (t) {
    if (!scrubbing && el.scrub) el.scrub.value = timeToPos(t) * 1000;
    if (el.tlabel) el.tlabel.textContent = timeStr(t);
    if (el.roster && el.roster.classList.contains('show') && (++_rframe % 12) === 0) updateRoster(t);

    const ss = S.sideStrength();
    if (el.barEast) {
      const tot = Math.max(ss.east + ss.west, 1);        // 抗衡拉鋸:藍紅各佔比例,交會點即優勢
      el.barEast.style.width = (ss.east / tot * 100) + '%';
      el.barWest.style.width = (ss.west / tot * 100) + '%';
      el.valEast.textContent = nf(ss.east);
      el.valWest.textContent = nf(ss.west);
      if (el.balLabel) {
        const d = (ss.east - ss.west) / tot;
        el.balLabel.textContent = Math.abs(d) < 0.08 ? '抗衡' : (d > 0 ? '東軍優勢' : '西軍優勢');
      }
    }
  };
})(window.SEKI);
