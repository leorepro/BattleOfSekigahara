/* =========================================================================
 * src/engine/ui.js — 控制列 / 字幕 / 兵力儀表 / 點選卡片 / 配樂
 *   initUI()      綁定 DOM 控制項與點選
 *   updateUI(t)   每幀刷新時間軸、字幕、兵力長條
 * ======================================================================= */
window.SEKI = window.SEKI || {};

(function (S) {
  let el = {}, scrubbing = false, raycaster, mouse;
  let _casPrev = null; const _casAcc = { east: 0, west: 0 };   // 陣亡跳動偵測：上幀值 + 累積增量
  let eastMax = 1, westMax = 1;
  let _freeShotIdx = -1;   // 自由運鏡：目前對應的 storyboard 鏡頭索引

  // 時刻 T（距基準日 00:00 的小時數）→「九月十四日 戌刻 20:00」
  // 可由 SEKI.config.fmtTime(t, JIKOKU) 覆寫（如桶狹間用五月十九日）
  const JIKOKU = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  function defaultFmtTime(t) {
    const day = 15 + Math.floor(t / 24);
    const h = ((Math.floor(t) % 24) + 24) % 24;
    const mm = Math.floor(((t % 1) + 1) % 1 * 60);
    const jk = JIKOKU[Math.floor(((h + 1) % 24) / 2)];
    const dayZh = day === 14 ? '十四日' : day === 15 ? '十五日' : `${day}日`;
    return `九月${dayZh} ${jk}刻 ${String(h).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
  }
  S.fmtTime = function (t) {
    return (S.config && S.config.fmtTime) ? S.config.fmtTime(t, JIKOKU) : defaultFmtTime(t);
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
      'btnNotes','notes','notesBody','notesClose','roster','btnRoster','toast','markers',
      'cwrap','casEast','casWest','casValEast','casValWest','casTrack','casTotal'];   // 累積陣亡條
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
    // 配樂（按鈕已移除；保留綁定但加防護，無按鈕則略過）
    if (el.btnAudio) el.btnAudio.onclick = () => {
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
    el.btnNotes.onclick = () => {
      const open = el.notes.classList.toggle('show');
      el.btnNotes.classList.toggle('on', open);            // 切換 active 外觀
    };
    el.notesClose.onclick = () => {
      el.notes.classList.remove('show'); el.btnNotes.classList.remove('on');
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

  // 非線性時間軸：戰前(T_START~7)佔 SPLIT 比例,決戰(7~T_END)佔其餘 → 決戰段拉長。
  //   若 config.timelineAnchors 存在（如諾曼第兩天），改用多段 [時刻,位置比例] 分配，
  //   把戲份重的時段(決戰白天)拉寬、安靜時段(凌晨/夜/D+1)壓縮。
  const TB = 7, SPLIT = 0.25;
  function timeToPos(t) {                    // 時刻 → 0..1
    const A = S.config && S.config.timelineAnchors;
    if (A) {
      if (t <= A[0][0]) return 0;
      if (t >= A[A.length - 1][0]) return 1;
      for (let i = 0; i < A.length - 1; i++) { const a = A[i], b = A[i + 1];
        if (t <= b[0]) return a[1] + (t - a[0]) / (b[0] - a[0]) * (b[1] - a[1]); }
      return 1;
    }
    const T0 = S.player.T_START, T1 = S.player.T_END;
    if (t <= TB) return Math.max(0, (t - T0) / (TB - T0)) * SPLIT;
    return SPLIT + Math.min(1, (t - TB) / (T1 - TB)) * (1 - SPLIT);
  }
  function posToTime(p) {                    // 0..1 → 時刻
    const A = S.config && S.config.timelineAnchors;
    if (A) {
      if (p <= 0) return A[0][0];
      if (p >= 1) return A[A.length - 1][0];
      for (let i = 0; i < A.length - 1; i++) { const a = A[i], b = A[i + 1];
        if (p <= b[1]) return a[0] + (p - a[1]) / (b[1] - a[1]) * (b[0] - a[0]); }
      return A[A.length - 1][0];
    }
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
    if (!el.markers) return;
    // 時間軸節點來源：config.timelineMarkers==='storyboard' → 用運鏡章節(每點都會實際切換鏡頭呈現，
    // 避免一堆事件點卻無對應鏡頭)；否則(預設)用全部關鍵事件。
    const useSb = (S.config && S.config.timelineMarkers === 'storyboard') && S.storyboard && S.storyboard.length;
    const marks = useSb ? S.storyboard : S.events;
    if (!marks) return;
    el.markers.innerHTML = marks.map((e) => {
      const pct = timeToPos(e.t) * 100;       // 非線性:決戰節點自然散開
      if (pct < -0.5 || pct > 100.5) return '';
      const label = String(useSb ? (e.title_zh || '') : e.zh);
      const hot = (useSb || /★/.test(label)) ? ' hot' : '';   // 章節皆為重點節點
      const conj = e.conj ? ' conj' : '';     // 史料較弱/軍記:暗色節點
      const title = label.replace('★', '').trim();
      const left = Math.max(0, Math.min(100, pct));
      return `<div class="mk${hot}${conj}" data-t="${e.t}" style="left:${left}%">` +
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
    // 各區段為選用：缺項(如某戰役未提供 primary/data)則略過，不渲染標題、不報錯。
    const sec = (title, arr, cls) => (arr && arr.length)
      ? `<h3>${title}</h3><ul>` + arr.map(x => `<li class="${cls||''}">${x}</li>`).join('') + '</ul>'
      : '';
    el.notesBody.innerHTML =
      (s.overview ? `<p>${s.overview}</p>` : '') +
      sec('考據與呈現說明 · Caveats', s.caveats, 'caveat') +
      sec('參考書目 · Books', s.books) +
      sec('近世史料 · Primary Sources', s.primary) +
      sec('資料來源 · Data', s.data);
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
    const SN = (S.config && S.config.sideName) || { east:'東軍（德川）', west:'西軍（石田）' };
    const sideZh = a.side === 'east' ? SN.east : SN.west;
    const KA = (S.config && S.config.kindArms) || KIND_ARMS;
    const arms = KA[a.kind] || KA.infantry;
    const crestNm = (S.config && S.config.crestNames && S.config.crestNames[a.crest])
      || CREST_NAME[a.crest] || a.crest;
    el.cardBody.innerHTML =
      `<div class="card-name side-${a.side}">${a.name_zh}<span class="ja"> ${a.name_ja}</span></div>` +
      `<div class="card-row">${sideZh} · ${a.title}</div>` +
      `<div class="card-row">兵力　<b>${Math.round(Math.max(s.s,0)).toLocaleString('en-US')}</b> / ${a.troops.toLocaleString('en-US')}　<span style="opacity:.7">${ST_ZH[s.st]||''}</span></div>` +
      `<div class="card-row">兵種　<b>${arms[0]}</b></div>` +
      `<div class="card-row" style="opacity:.78;font-size:12px">${arms[1]}</div>` +
      `<div class="card-row">家紋　${crestNm}</div>`;
    el.card.classList.add('show');
  }

  function nf(n) { return Math.round(Math.max(n, 0)).toLocaleString('en-US'); }
  // 中文「萬」量級縮寫：110000 →「~11萬」、1700000 → 「170萬」（用於兵力宣稱並陳）
  function nfWan(n) {
    n = Math.max(0, Math.round(n));
    if (n >= 10000) {
      const wan = n / 10000;
      const s = (Math.abs(wan - Math.round(wan)) < 1e-6) ? String(Math.round(wan)) : wan.toFixed(1);
      return s + '萬';
    }
    return n.toLocaleString('en-US');
  }
  // 兵力「雙數字並陳」HTML：現代估計 ‖ 史料宣稱（config-gated；無 claim 則回傳純數字）
  //   tc 形如 { estimate:110000, claim:1700000, estLabel?, claimLabel? }
  function troopsClaimHtml(live, tc) {
    if (!tc) return nf(live);
    const est = '~' + nfWan(live);
    const claim = nfWan(tc.claim);
    const estLbl = tc.estLabel || '現代估計';
    const claimLbl = tc.claimLabel || '史料宣稱';
    return `<span class="tc-est" title="${estLbl}">${est}</span>` +
           `<span class="tc-sep"> ‖ </span>` +
           `<span class="tc-claim" title="${claimLbl}">${claimLbl} ${claim}</span>`;
  }
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
    const SS = (S.config && S.config.sideShort) || { east:'東軍', west:'西軍' };
    let h = `<div class="rs-tot"><span class="e">${SS.east} ${nf(ss.east)}</span> · <span class="w">${SS.west} ${nf(ss.west)}</span></div>`;
    h += `<div class="rs-row" style="opacity:.85"><span>交戰投入</span><span class="s"><span class="e">${nf(eE)}</span> · <span class="w">${nf(eW)}</span></span></div>`;
    if (pairs.length) {
      h += `<div class="rs-sec">⚔ 交戰中（誰打誰）</div>`;
      for (const p of pairs) {
        // 統一左右：east/'e'（盟軍·藍）永遠在左、west/'w'（德軍·紅）永遠在右；engagement a/b 順序不保證
        let L = p.A, R = p.B, sL = p.sA, sR = p.sB;
        if (sideOf(p.A) === 'w') { L = p.B; R = p.A; sL = p.sB; sR = p.sA; }
        h += `<div class="rs-pair"><span class="${sideOf(L)}">${L.data.name_zh} <span class="s">${nf(sL)}</span></span>` +
             `<span class="vs">⚔</span><span class="${sideOf(R)}">${R.data.name_zh} <span class="s">${nf(sR)}</span></span></div>`;
        const tot = Math.max(sL + sR, 1), aw = Math.round(sL / tot * 100);  // 拉鋸條:左(盟軍)佔比
        h += `<div class="rs-cbar"><i class="${sideOf(L)}" style="width:${aw}%"></i>` +
             `<i class="${sideOf(R)}" style="width:${100 - aw}%"></i></div>`;
      }
    }
    h += `<div class="rs-sec">全軍兵力（依多寡）</div>`;
    const all = S.armies.map(a => { const u = S.unitById(a.id);
      return { a, s: Math.round(u && u.cur ? u.cur.s : a.troops), e: sideOf(u || { data: a }) }; })
      .filter(x => x.s > 0).sort((x, y) => y.s - x.s);
    const maxS = all.length ? all[0].s : 1;            // 最大兵力作為 bar 滿格基準
    for (const it of all) {
      const pct = Math.max(3, Math.round(it.s / maxS * 100));
      h += `<div class="rs-row rs-nb"><span class="${it.e}">${it.a.name_zh}</span><span class="s">${nf(it.s)}</span></div>` +
           `<div class="rs-bar"><i class="${it.e}" style="width:${pct}%"></i></div>`;
    }
    el.roster.innerHTML = h;
  }

  S.updateUI = function (t) {
    // 自由運鏡：旁白事件卡隨時間軸對應到「當前時刻所屬的鏡頭」
    //（節目模式由 storyboard 引擎主導事件卡，此處不介入）
    if (S.player.program) {
      _freeShotIdx = -1;
    } else if (S.storyboard && S.storyboard.length) {
      let i = 0;
      for (let k = 0; k < S.storyboard.length; k++) {
        if (S.storyboard[k].t <= t + 1e-6) i = k; else break;
      }
      if (i !== _freeShotIdx) { _freeShotIdx = i; S.setEventCard(S.storyboard[i]); }
    }

    if (!scrubbing && el.scrub) el.scrub.value = timeToPos(t) * 1000;
    if (el.tlabel) el.tlabel.textContent = timeStr(t);
    if (el.roster && el.roster.classList.contains('show') && (++_rframe % 12) === 0) updateRoster(t);

    const ss = S.sideStrength();
    if (el.barEast) {
      const tot = Math.max(ss.east + ss.west, 1);        // 抗衡拉鋸:藍紅各佔比例,交會點即優勢
      el.barEast.style.width = (ss.east / tot * 100) + '%';
      el.barWest.style.width = (ss.west / tot * 100) + '%';
      // config.troopsClaim 存在時，對應陣營「雙數字並陳」（現代估計 ‖ 史料宣稱）；
      //   其他戰役無此 config → 照舊純數字。east=波斯方並陳薛西斯宣稱、west=希臘真實兵力。
      const TC = S.config && S.config.troopsClaim;
      if (TC && TC.east) { el.valEast.innerHTML = troopsClaimHtml(ss.east, TC.east); }
      else { el.valEast.textContent = nf(ss.east); }
      if (TC && TC.west) { el.valWest.innerHTML = troopsClaimHtml(ss.west, TC.west); }
      else { el.valWest.textContent = nf(ss.west); }
      if (el.balLabel) {
        const d = (ss.east - ss.west) / tot;
        const SS = (S.config && S.config.sideShort) || { east:'東軍', west:'西軍' };
        el.balLabel.textContent = Math.abs(d) < 0.08 ? '抗衡' : (d > 0 ? `${SS.east}優勢` : `${SS.west}優勢`);
      }
    }

    // 累積陣亡條：隨時間單調攀升，東(左)/西(右)各自陣亡向兩側填充，彰顯傷亡的毀滅性
    if (el.casEast && S.sideCasualties) {
      const cs = S.sideCasualties();
      // 條長用「同一把尺」：整體填充(雙方合計陣亡/參考上限，隨傷亡累積成長) × 各方占比。
      //   → 死得多的一方條就長(修正先前用各自初始兵力當分母導致「死多反短」)。
      const tot = cs.east + cs.west;
      const CAP = 5000;                                   // 參考上限：雙方合計達此即填滿
      const fill = Math.min(1, tot / CAP);
      const pe = tot > 0 ? fill * (cs.east / tot) * 100 : 0;
      const pw = tot > 0 ? fill * (cs.west / tot) * 100 : 0;
      el.casEast.style.width = pe + '%';
      el.casWest.style.width = pw + '%';
      if (el.casValEast) el.casValEast.textContent = nf(cs.east);
      if (el.casValWest) el.casValWest.textContent = nf(cs.west);
      if (el.casTotal) el.casTotal.textContent = '傷亡累計 ' + nf(tot);
      // 傷亡攀升 → highlight＋震動：某方每累積一定陣亡就脈動一次數字，並抖動整條
      if (_casPrev) {
        let surged = false;
        for (const sd of ['east', 'west']) {
          const d = cs[sd] - _casPrev[sd];
          if (d > 0) {
            _casAcc[sd] += d;
            if (_casAcc[sd] >= 12) {                  // 每 +12 陣亡觸發一次脈動（激戰時近乎連續）
              _casAcc[sd] = 0; surged = true;
              const ne = sd === 'east' ? el.casValEast : el.casValWest;
              if (ne) { ne.classList.remove('cas-surge'); void ne.offsetWidth; ne.classList.add('cas-surge'); }
            }
          } else if (d < 0) { _casAcc[sd] = 0; }       // 倒帶/循環：重置
        }
        if (surged && el.casTrack) { el.casTrack.classList.remove('cas-surge'); void el.casTrack.offsetWidth; el.casTrack.classList.add('cas-surge'); }
      }
      _casPrev = { east: cs.east, west: cs.west };
    }
  };
})(window.SEKI);
