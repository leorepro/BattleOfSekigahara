/* =========================================================================
 * src/engine/crest.js — 家紋程序化繪製（本專案技術核心）
 *   每個家紋是一個 draw(ctx, cx, cy, R) 函式，在 canvas 上以白色畫出紋樣。
 *   flagTexture(crestKey, side) 把家紋畫到幟旗（陣營色底 + 白紋），
 *   回傳 THREE.CanvasTexture 供軍旗材質使用。
 * ======================================================================= */
window.SEKI = window.SEKI || {};

(function (S) {
  /* ---- 低階繪圖工具 ------------------------------------------------ */
  function disc(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }
  function ring(ctx, x, y, r, w) { ctx.lineWidth = w; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke(); }
  function bar(ctx, x, y, w, h) { ctx.fillRect(x - w / 2, y - h / 2, w, h); } // 以中心為基準
  function text(ctx, s, x, y, size) {
    ctx.save();
    ctx.font = `900 ${size}px "Noto Serif TC","Songti TC",serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(s, x, y);
    ctx.restore();
  }
  // 葵葉（心形）：尖端朝上，畫在 (0,0) 區域，需呼叫端先 translate/rotate/scale
  function aoiLeaf(ctx, s) {
    ctx.beginPath();
    ctx.moveTo(0, -1.0 * s);                                  // 葉尖（上）
    ctx.bezierCurveTo(0.9 * s, -0.9 * s, 1.0 * s, 0.3 * s, 0.35 * s, 0.7 * s);
    ctx.bezierCurveTo(0.18 * s, 0.85 * s, 0.12 * s, 0.95 * s, 0, 0.78 * s); // 底部凹口
    ctx.bezierCurveTo(-0.12 * s, 0.95 * s, -0.18 * s, 0.85 * s, -0.35 * s, 0.7 * s);
    ctx.bezierCurveTo(-1.0 * s, 0.3 * s, -0.9 * s, -0.9 * s, 0, -1.0 * s);
    ctx.fill();
    // 葉脈
    ctx.save(); ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = s * 0.07; ctx.beginPath();
    ctx.moveTo(0, 0.6 * s); ctx.lineTo(0, -0.7 * s); ctx.stroke();
    ctx.restore();
  }

  /* ---- 家紋登錄表：key → draw(ctx, cx, cy, R) ---------------------- */
  S.crests = {
    /* 島津 — 丸に十字 */
    maruJuji(ctx, cx, cy, R) {
      ring(ctx, cx, cy, R, R * 0.13);
      bar(ctx, cx, cy, R * 0.26, R * 1.5);
      bar(ctx, cx, cy, R * 1.5, R * 0.26);
    },
    /* 毛利 — 一文字三星 */
    ichimonjiMitsuboshi(ctx, cx, cy, R) {
      bar(ctx, cx, cy - R * 0.62, R * 1.7, R * 0.26);          // 一文字
      const sr = R * 0.27;
      disc(ctx, cx, cy + R * 0.05, sr);                        // 上星
      disc(ctx, cx - R * 0.5, cy + R * 0.62, sr);              // 左下
      disc(ctx, cx + R * 0.5, cy + R * 0.62, sr);              // 右下
    },
    /* 細川 — 九曜 */
    kuyo(ctx, cx, cy, R) {
      disc(ctx, cx, cy, R * 0.34);
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4;
        disc(ctx, cx + Math.cos(a) * R * 0.74, cy + Math.sin(a) * R * 0.74, R * 0.21);
      }
    },
    /* 石田三成 — 大一大万大吉（文字紋） */
    daiichi(ctx, cx, cy, R) {
      const sz = R * 0.62;
      text(ctx, '大一', cx, cy - R * 0.66, sz);
      text(ctx, '大万', cx, cy, sz);
      text(ctx, '大吉', cx, cy + R * 0.66, sz);
    },
    /* 宇喜多 — 児文字 */
    jiMonji(ctx, cx, cy, R) {
      ring(ctx, cx, cy, R, R * 0.1);
      text(ctx, '児', cx, cy, R * 1.25);
    },
    /* 徳川 — 三つ葉葵 */
    mitsubaAoi(ctx, cx, cy, R) {
      ring(ctx, cx, cy, R, R * 0.1);
      for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(i * 2 * Math.PI / 3);
        ctx.translate(0, -R * 0.42);                           // 葉子往外推
        aoiLeaf(ctx, R * 0.5);
        ctx.restore();
      }
      disc(ctx, cx, cy, R * 0.12);                             // 中心莖點
    },
    /* 小早川 — 違い鎌（兩把交叉的鎌刀） */
    chigaiKama(ctx, cx, cy, R) {
      function sickle(flip) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(flip, 1);
        ctx.rotate(-0.32);
        // 柄
        ctx.lineCap = 'round'; ctx.lineWidth = R * 0.16;
        ctx.beginPath(); ctx.moveTo(-R * 0.15, R * 0.92); ctx.lineTo(-R * 0.15, -R * 0.2); ctx.stroke();
        // 刃（彎月）
        ctx.lineWidth = R * 0.17;
        ctx.beginPath(); ctx.arc(-R * 0.15, -R * 0.3, R * 0.62, Math.PI * 0.92, Math.PI * 2.02); ctx.stroke();
        ctx.restore();
      }
      sickle(1); sickle(-1);
    },
    /* 井伊 — 井伊橘（花 + 雙葉） */
    tachibana(ctx, cx, cy, R) {
      // 五瓣花
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + i * 2 * Math.PI / 5;
        disc(ctx, cx + Math.cos(a) * R * 0.42, cy - R * 0.18 + Math.sin(a) * R * 0.42, R * 0.24);
      }
      disc(ctx, cx, cy - R * 0.18, R * 0.16);
      // 兩片葉
      [-1, 1].forEach(s => {
        ctx.save(); ctx.translate(cx, cy + R * 0.55); ctx.rotate(s * 0.5); ctx.scale(s, 1);
        ctx.beginPath(); ctx.ellipse(R * 0.34, 0, R * 0.4, R * 0.17, 0, 0, 7); ctx.fill();
        ctx.restore();
      });
    },
    /* 本多 — 立葵（兩葉一蕊） */
    tachiAoi(ctx, cx, cy, R) {
      [-1, 1].forEach(s => {
        ctx.save(); ctx.translate(cx, cy + R * 0.35); ctx.rotate(s * 0.35); ctx.scale(s, 1);
        ctx.translate(R * 0.32, 0); aoiLeaf(ctx, R * 0.55);
        ctx.restore();
      });
      bar(ctx, cx, cy - R * 0.1, R * 0.14, R * 1.4);            // 花莖
      for (let i = 0; i < 3; i++) disc(ctx, cx, cy - R * 0.75 + i * R * 0.28, R * 0.13);
    },
    /* 黒田 — 藤巴（三つ巴變體） */
    fujiTomoe(ctx, cx, cy, R) {
      ring(ctx, cx, cy, R, R * 0.09);
      for (let i = 0; i < 3; i++) {
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(i * 2 * Math.PI / 3);
        ctx.beginPath();
        ctx.moveTo(0, -R * 0.12);
        ctx.bezierCurveTo(R * 0.7, -R * 0.2, R * 0.55, R * 0.55, 0, R * 0.55);
        ctx.bezierCurveTo(R * 0.3, R * 0.3, R * 0.32, -R * 0.02, 0, -R * 0.12);
        ctx.fill();
        disc(ctx, R * 0.18, R * 0.34, R * 0.16);
        ctx.restore();
      }
    },
    /* 福島 — 沢瀉（箭頭葉） */
    omodaka(ctx, cx, cy, R) {
      function arrowLeaf(x, y, sc) {
        ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
        ctx.beginPath();
        ctx.moveTo(0, -R * 0.7);
        ctx.lineTo(R * 0.42, R * 0.35); ctx.lineTo(R * 0.12, R * 0.2);
        ctx.lineTo(0, R * 0.5); ctx.lineTo(-R * 0.12, R * 0.2);
        ctx.lineTo(-R * 0.42, R * 0.35); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      arrowLeaf(cx, cy - R * 0.05, 1);
      arrowLeaf(cx - R * 0.5, cy + R * 0.35, 0.66);
      arrowLeaf(cx + R * 0.5, cy + R * 0.35, 0.66);
    },
    /* 吉川 — 丸に三つ引（圈內三橫） */
    hikiryo(ctx, cx, cy, R) {
      ring(ctx, cx, cy, R, R * 0.12);
      bar(ctx, cx, cy - R * 0.42, R * 1.2, R * 0.2);
      bar(ctx, cx, cy,            R * 1.2, R * 0.2);
      bar(ctx, cx, cy + R * 0.42, R * 1.2, R * 0.2);
    },
    /* 小西 — 中結祇園守（守袋結紋，簡化） */
    gionmamori(ctx, cx, cy, R) {
      // 直立守袋
      ctx.save();
      ctx.beginPath();
      const w = R * 0.5, h = R * 1.5, rr = R * 0.18;
      const x0 = cx - w / 2, y0 = cy - h / 2;
      ctx.moveTo(x0 + rr, y0);
      ctx.arcTo(x0 + w, y0, x0 + w, y0 + h, rr);
      ctx.arcTo(x0 + w, y0 + h, x0, y0 + h, rr);
      ctx.arcTo(x0, y0 + h, x0, y0, rr);
      ctx.arcTo(x0, y0, x0 + w, y0, rr);
      ctx.fill();
      ctx.restore();
      // 中央結帶（挖空 + 橫帶）
      ctx.save(); ctx.globalCompositeOperation = 'destination-out';
      bar(ctx, cx, cy, R * 0.9, R * 0.16);
      ctx.restore();
      bar(ctx, cx, cy, R * 1.0, R * 0.26);
      // 上下小結
      disc(ctx, cx, cy - R * 0.62, R * 0.12);
      disc(ctx, cx, cy + R * 0.62, R * 0.12);
    },
    /* 脇坂 — 輪違い（雙環交疊） */
    wachigai(ctx, cx, cy, R) {
      ring(ctx, cx - R * 0.34, cy, R * 0.6, R * 0.14);
      ring(ctx, cx + R * 0.34, cy, R * 0.6, R * 0.14);
    },
    /* 長宗我部 — 七つ片喰（酢漿草·三心葉） */
    katabami(ctx, cx, cy, R) {
      for (let i = 0; i < 3; i++) {
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(i * 2 * Math.PI / 3);
        ctx.translate(0, -R * 0.5); const s = R * 0.5;
        ctx.beginPath();                                   // 心形，尖端朝中心
        ctx.moveTo(0, s * 0.55);
        ctx.bezierCurveTo(s * 0.95, -s * 0.15, s * 0.45, -s * 0.95, 0, -s * 0.4);
        ctx.bezierCurveTo(-s * 0.45, -s * 0.95, -s * 0.95, -s * 0.15, 0, s * 0.55);
        ctx.fill(); ctx.restore();
      }
      disc(ctx, cx, cy, R * 0.12);
    },
    /* 山內 — 三つ柏（柏葉三枚） */
    mitsugashiwa(ctx, cx, cy, R) {
      for (let i = 0; i < 3; i++) {
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(i * 2 * Math.PI / 3);
        const s = R;
        ctx.beginPath();                                   // 葉尖朝外的柏葉
        ctx.moveTo(0, -s * 0.95);
        ctx.bezierCurveTo(s * 0.5, -s * 0.7, s * 0.42, -s * 0.3, s * 0.3, 0);
        ctx.bezierCurveTo(s * 0.42, s * 0.18, s * 0.3, s * 0.35, s * 0.16, s * 0.45);
        ctx.bezierCurveTo(s * 0.08, s * 0.5, -s * 0.08, s * 0.5, -s * 0.16, s * 0.45);
        ctx.bezierCurveTo(-s * 0.3, s * 0.35, -s * 0.42, s * 0.18, -s * 0.3, 0);
        ctx.bezierCurveTo(-s * 0.42, -s * 0.3, -s * 0.5, -s * 0.7, 0, -s * 0.95);
        ctx.fill();
        ctx.save(); ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = s * 0.06; ctx.beginPath();
        ctx.moveTo(0, s * 0.4); ctx.lineTo(0, -s * 0.7); ctx.stroke();
        ctx.restore(); ctx.restore();
      }
    },
    /* 加藤 — 蛇の目（粗圓環） */
    janome(ctx, cx, cy, R) {
      disc(ctx, cx, cy, R);
      ctx.save(); ctx.globalCompositeOperation = 'destination-out';
      disc(ctx, cx, cy, R * 0.52);
      ctx.restore();
    },
    /* 田中 — 左三つ巴（三勾玉） */
    mitsudomoe(ctx, cx, cy, R) {
      for (let i = 0; i < 3; i++) {
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(i * 2 * Math.PI / 3);
        ctx.beginPath();
        ctx.moveTo(0, -R * 0.12);
        ctx.bezierCurveTo(R * 0.82, -R * 0.2, R * 0.62, R * 0.62, 0, R * 0.62);
        ctx.bezierCurveTo(R * 0.34, R * 0.34, R * 0.36, -R * 0.02, 0, -R * 0.12);
        ctx.fill();
        disc(ctx, R * 0.2, R * 0.38, R * 0.17);
        ctx.restore();
      }
    },
    /* 藤堂 — 蔦（藤蔓葉） */
    tsuta(ctx, cx, cy, R) {
      ctx.save(); ctx.translate(cx, cy + R * 0.1);
      ctx.beginPath();
      ctx.moveTo(0, -R * 0.95);                                   // 中裂瓣（上）
      ctx.bezierCurveTo(R * 0.5, -R * 0.85, R * 0.95, -R * 0.5, R * 0.85, -R * 0.05);
      ctx.bezierCurveTo(R * 0.8, R * 0.25, R * 0.5, R * 0.3, R * 0.42, R * 0.55); // 右側裂瓣
      ctx.bezierCurveTo(R * 0.3, R * 0.8, R * 0.12, R * 0.85, 0, R * 0.72);
      ctx.bezierCurveTo(-R * 0.12, R * 0.85, -R * 0.3, R * 0.8, -R * 0.42, R * 0.55);
      ctx.bezierCurveTo(-R * 0.5, R * 0.3, -R * 0.8, R * 0.25, -R * 0.85, -R * 0.05);
      ctx.bezierCurveTo(-R * 0.95, -R * 0.5, -R * 0.5, -R * 0.85, 0, -R * 0.95);
      ctx.fill();
      ctx.save(); ctx.globalCompositeOperation = 'destination-out';  // 葉脈
      ctx.lineWidth = R * 0.08; ctx.beginPath();
      ctx.moveTo(0, R * 0.6); ctx.lineTo(0, -R * 0.7);
      ctx.moveTo(0, -R * 0.2); ctx.lineTo(R * 0.5, -R * 0.4);
      ctx.moveTo(0, -R * 0.2); ctx.lineTo(-R * 0.5, -R * 0.4); ctx.stroke();
      ctx.restore();
      ctx.restore();
    },
    /* 京極 — 平四つ目結（四方框「目」） */
    yotsumeyui(ctx, cx, cy, R) {
      const s = R * 0.62, off = R * 0.36;
      [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx, sy]) => {
        const x = cx + sx * off, y = cy + sy * off;
        ctx.fillRect(x - s / 2, y - s / 2, s, s);
        ctx.save(); ctx.globalCompositeOperation = 'destination-out';
        ctx.fillRect(x - s * 0.22, y - s * 0.22, s * 0.44, s * 0.44);  // 中央挖空成「目」
        ctx.restore();
      });
    },
    /* 大谷 — 対い蝶（蝴蝶紋，簡化單蝶） */
    mukaiCho(ctx, cx, cy, R) {
      bar(ctx, cx, cy, R * 0.16, R * 1.1);                     // 身
      [-1, 1].forEach(s => {
        ctx.save(); ctx.translate(cx, cy); ctx.scale(s, 1);
        ctx.beginPath(); ctx.ellipse(R * 0.45, -R * 0.32, R * 0.42, R * 0.3, 0.5, 0, 7); ctx.fill(); // 上翅
        ctx.beginPath(); ctx.ellipse(R * 0.4, R * 0.42, R * 0.3, R * 0.24, -0.4, 0, 7); ctx.fill();  // 下翅
        // 觸角
        ctx.lineWidth = R * 0.06; ctx.beginPath();
        ctx.moveTo(0, -R * 0.5); ctx.quadraticCurveTo(R * 0.3, -R * 0.85, R * 0.45, -R * 0.7); ctx.stroke();
        ctx.restore();
      });
    },
    /* 織田 — 五瓜に唐花（木瓜紋）：橫長圓角外框 + 內四瓣唐花 */
    mokkou(ctx, cx, cy, R) {
      ctx.lineWidth = R * 0.16;
      const w = R * 1.9, h = R * 1.7, rr = R * 0.55, x0 = cx - w / 2, y0 = cy - h / 2;
      ctx.beginPath();
      ctx.moveTo(x0 + rr, y0);
      ctx.arcTo(x0 + w, y0, x0 + w, y0 + h, rr);
      ctx.arcTo(x0 + w, y0 + h, x0, y0 + h, rr);
      ctx.arcTo(x0, y0 + h, x0, y0, rr);
      ctx.arcTo(x0, y0, x0 + w, y0, rr);
      ctx.closePath(); ctx.stroke();
      for (let i = 0; i < 4; i++) {
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(i * Math.PI / 2);
        ctx.beginPath(); ctx.ellipse(0, -R * 0.34, R * 0.18, R * 0.3, 0, 0, 7); ctx.fill();
        ctx.restore();
      }
      disc(ctx, cx, cy, R * 0.13);
    },
    /* 今川 — 足利二つ引両（兩條粗橫帶） */
    futatsuhikiryo(ctx, cx, cy, R) {
      bar(ctx, cx, cy - R * 0.36, R * 1.7, R * 0.3);
      bar(ctx, cx, cy + R * 0.36, R * 1.7, R * 0.3);
    },
  };

  /* ---- 幟旗材質：陣營色底 + 白色家紋 ------------------------------ */
  const EAST = ['#5b93ff', '#1f4fd6'];  // 東軍 藍 漸層
  const WEST = ['#ff6a5b', '#cc1f1f'];  // 西軍 紅 漸層
  const _cache = {};

  S.flagTexture = function (crestKey, side) {
    const cacheKey = crestKey + ':' + side;
    if (_cache[cacheKey]) return _cache[cacheKey];

    const W = 256, H = 512;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');

    // 布面漸層底
    const [c1, c2] = side === 'east' ? EAST : WEST;
    const g = ctx.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, c2); g.addColorStop(0.5, c1); g.addColorStop(1, c2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    // 布面縱向折痕（明暗）
    for (let x = 0; x < W; x += 16) {
      ctx.fillStyle = (x / 16) % 2 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
      ctx.fillRect(x, 0, 8, H);
    }
    // 上下白色橫帶（幟旗常見）
    ctx.fillStyle = '#f5f1e4';
    ctx.fillRect(0, 12, W, 8); ctx.fillRect(0, H - 20, W, 8);

    // 家紋（白）
    const draw = S.crests[crestKey] || S.crests.maruJuji;
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#ffffff';
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    draw(ctx, W / 2, H * 0.34, 78);                            // 上方主紋
    draw(ctx, W / 2, H * 0.74, 50);                            // 下方副紋

    const tex = new THREE.CanvasTexture(cv);
    tex.anisotropy = 8;
    tex.encoding = THREE.sRGBEncoding;
    _cache[cacheKey] = tex;
    return tex;
  };
})(window.SEKI);
