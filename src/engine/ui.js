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
      'tlabel','barEast','barWest','valEast','valWest','card','cardBody','cardClose','btnAudio','bgm',
      'btnNotes','notes','notesBody','notesClose','roster','btnRoster'];
    ids.forEach(id => el[id] = document.getElementById(id));

    const init = S.sideStrength();
    eastMax = init.east || 1; westMax = init.west || 1;

    // 播放/暫停
    el.btnPlay.onclick = () => { S.player.playing = !S.player.playing; syncPlay(); };
    // 時間軸
    el.scrub.min = S.player.T_START; el.scrub.max = S.player.T_END; el.scrub.step = 0.01;
    el.scrub.addEventListener('input', () => {
      scrubbing = true;
      if (S.player.program) {                 // 拖時間軸 → 切換到自由模式，時刻才不會被 storyboard 覆寫
        S.setProgramMode(false);
        el.btnMode.textContent = '🕹 自由運鏡'; el.btnMode.classList.remove('on');
      }
      S.player.time = parseFloat(el.scrub.value); S.player.playing = false; syncPlay();
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
    if (!scrubbing && el.scrub) el.scrub.value = t;
    if (el.tlabel) el.tlabel.textContent = timeStr(t);
    if (el.roster && el.roster.classList.contains('show') && (++_rframe % 12) === 0) updateRoster(t);

    const ss = S.sideStrength();
    if (el.barEast) {
      const cm = Math.max(eastMax, westMax);            // 同一刻度,才看得出差距與交叉
      el.barEast.style.width = Math.max(0, Math.min(100, ss.east / cm * 100)) + '%';
      el.barWest.style.width = Math.max(0, Math.min(100, ss.west / cm * 100)) + '%';
      el.valEast.textContent = Math.round(ss.east).toLocaleString('en-US');
      el.valWest.textContent = Math.round(ss.west).toLocaleString('en-US');
    }
  };
})(window.SEKI);
