/* =========================================================================
 * src/engine/sectors.js — 灘段聚焦外框（不規則形狀 + 微微閃光）
 *
 *   用途：奧馬哈海灘各灘段（Dog Green / Dog White / Dog Red / Easy Green /
 *   Easy Red / Fox Green / Fox Red）。當運鏡播放到某灘段相關的鏡頭時，
 *   以一圈「不規則、沿岸狹長」的發光外框把該區塊匡出，並用正弦脈動做出
 *   「微微閃光」呼吸感，幫助觀看者理解現在在講哪一塊。其餘灘段平滑淡出。
 *
 *   設計要點：
 *   - 不規則：以灘段中心為基準，用「index + 頂點角度」帶入固定三角函數
 *     產生半徑擾動（非亂數，reload 不會跳動），形成有機輪廓。
 *   - 沿岸狹長：X(東西/沿岸)半徑較長、Z(南北/進深)半徑較窄。
 *   - 不 overlap：先依 lng 排序，算出每塊到左右相鄰灘段中心距的一半，
 *     取較小者當「最大允許沿岸半徑」，X 半徑被夾在此範圍內，相鄰塊不相疊。
 *   - 貼地：每個頂點用 S.terrain.heightAt 取地形高度並略抬高，避免 z-fighting。
 *
 *   對外 API（主程式呼叫，命名固定）：
 *     S.initSectors()      — 建立所有灘段外框（預設 visible=false / opacity=0）
 *     S.updateSectors(t)   — 依當前時刻 t 與運鏡判斷聚焦灘段，播放閃光、其餘淡出
 * ======================================================================= */
window.SEKI = window.SEKI || {};

(function (S) {
  'use strict';

  const LIFT = 1.4;             // 離地抬高（避免 z-fighting）
  const SEGMENTS = 40;          // 輪廓頂點數（越多越平滑）
  const GLOW_COLOR = 0xffd24a;  // 暖金色（醒目但不刺眼）
  const Z_RADIUS = 7.0;         // 進深(南北)基準半徑（場景單位，狹長→較窄）
  const X_BASE = 16.0;          // 沿岸(東西)基準半徑（會被相鄰距離夾住）
  const PULSE_BASE = 0.35;      // 閃光不透明度基準
  const PULSE_AMP = 0.25;       // 閃光振幅（0.10 ~ 0.60 之間脈動）
  const PULSE_HZ = 0.62;        // 脈動頻率（約 1.6 秒一個週期）
  const FADE_SPEED = 3.2;       // 淡入/淡出速率（每秒指數逼近）

  let _sectors = [];            // { feature, mesh, mat, targetOp, isActive }
  let _inited = false;

  /* 取地形上某經緯度的場景座標（含抬高） */
  function terrainPt(lng, lat) {
    const p = S.engine.project(lng, lat, 0);
    const y = (S.terrain ? S.terrain.heightAt(p.x, p.z) : 0) + LIFT;
    return new THREE.Vector3(p.x, y, p.z);
  }

  /* 固定（非亂數）半徑擾動：由 index 與角度決定，reload 穩定不跳動 */
  function radialJitter(index, ang) {
    const seed = index * 1.7 + 0.5;
    // 多個不同頻率的正弦疊加 → 有機不規則輪廓
    const j =
      0.18 * Math.sin(ang * 3 + seed * 2.3) +
      0.12 * Math.sin(ang * 5 - seed * 1.1) +
      0.07 * Math.sin(ang * 8 + seed * 3.7);
    return 1 + j;   // 約 0.6 ~ 1.4 倍
  }

  /* 建立單一灘段的不規則外框（LineLoop，貼地、發光） */
  function buildSector(feature, index, xRadius) {
    const center = S.engine.project(feature.lng, feature.lat, 0);
    const pts = [];
    for (let i = 0; i <= SEGMENTS; i++) {
      const ang = (i / SEGMENTS) * Math.PI * 2;
      const k = radialJitter(index, ang);
      // 沿岸 X 狹長、進深 Z 較窄
      const dx = Math.cos(ang) * xRadius * k;
      const dz = Math.sin(ang) * Z_RADIUS * k;
      const lng2lat = center.x + dx;   // 場景 x
      const z = center.z + dz;         // 場景 z
      // 用世界 x,z 直接取地形高度（heightAt 接受場景座標）
      const y = (S.terrain ? S.terrain.heightAt(lng2lat, z) : 0) + LIFT;
      pts.push(new THREE.Vector3(lng2lat, y, z));
    }

    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({
      color: new THREE.Color(GLOW_COLOR),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: true,
    });
    const mesh = new THREE.LineLoop(geo, mat);
    mesh.frustumCulled = false;
    mesh.renderOrder = 5;
    mesh.visible = false;
    return { mesh, mat };
  }

  /* ---------- API 1：建立所有灘段外框 ---------- */
  S.initSectors = function () {
    if (_inited) return _sectors;
    const eng = S.engine;
    if (!eng || !eng.scene || !S.geography) return _sectors;

    // 取出所有 beach 灘段並依 lng 由西向東排序
    const beaches = S.geography.features
      .filter((f) => f.type === 'beach')
      .slice()
      .sort((a, b) => a.lng - b.lng);

    // 預先把每塊的中心投影到場景 x，算相鄰中心距 → 限制沿岸半徑（防 overlap）
    const cx = beaches.map((f) => S.engine.project(f.lng, f.lat, 0).x);

    _sectors = [];
    for (let i = 0; i < beaches.length; i++) {
      // 到左右鄰居的中心距，取較小者的一半 * 安全係數 0.9，並夾在合理範圍
      let gap = Infinity;
      if (i > 0) gap = Math.min(gap, Math.abs(cx[i] - cx[i - 1]));
      if (i < beaches.length - 1) gap = Math.min(gap, Math.abs(cx[i + 1] - cx[i]));
      let xRadius = X_BASE;
      if (isFinite(gap)) xRadius = Math.min(X_BASE, gap * 0.5 * 0.9);
      xRadius = Math.max(6, xRadius);   // 別太小，至少看得見

      const built = buildSector(beaches[i], i, xRadius);
      eng.scene.add(built.mesh);
      _sectors.push({
        feature: beaches[i],
        mesh: built.mesh,
        mat: built.mat,
        targetOp: 0,
        curOp: 0,
      });
    }
    _inited = true;
    return _sectors;
  };

  /* 判斷目前運鏡聚焦的灘段索引；找不到回 -1（全部淡出） */
  function focusedIndex() {
    if (!_sectors.length) return -1;
    const shot = S.currentShot;

    // 1) 先比對當前鏡標題文字是否包含某灘段英文名（如 "Dog Green" / "Fox Green"）
    if (shot) {
      const text = [shot.title_en, shot.title_zh, shot.title]
        .filter(Boolean).join(' ').toLowerCase();
      if (text) {
        for (let i = 0; i < _sectors.length; i++) {
          const en = (_sectors[i].feature.name_en || '').toLowerCase();
          if (en && text.indexOf(en) !== -1) return i;
        }
      }
    }

    // 2) 退而求其次：用當前鏡注視點 lng 找最近的灘段中心 lng；
    //    但僅在「夠近」(注視點確實落在灘頭一線附近)時才認定，避免內陸/海上鏡誤觸發。
    if (shot && shot.cam && typeof shot.cam.lng === 'number') {
      let best = -1, bestD = Infinity;
      for (let i = 0; i < _sectors.length; i++) {
        const d = Math.abs(_sectors[i].feature.lng - shot.cam.lng);
        if (d < bestD) { bestD = d; best = i; }
      }
      // 0.012 度約一個灘段間距；超出則視為不在講某特定灘段
      if (best !== -1 && bestD <= 0.012) return best;
    }

    return -1;
  }

  /* ---------- API 2：依時間/運鏡更新閃光與淡出 ---------- */
  S.updateSectors = function (/* t */) {
    if (!_inited || !_sectors.length) return;

    const active = focusedIndex();
    const elapsed = (S.engine && S.engine.clock) ? S.engine.clock.getElapsedTime() : 0;
    // 微微閃光：正弦脈動（基準 0.35、振幅 0.25）
    const pulse = PULSE_BASE + PULSE_AMP * Math.sin(elapsed * Math.PI * 2 * PULSE_HZ);
    // dt 用固定近似即可（只驅動平滑淡入淡出，不需精準）
    const k = 1 - Math.exp(-FADE_SPEED * (1 / 60));

    for (let i = 0; i < _sectors.length; i++) {
      const s = _sectors[i];
      s.targetOp = (i === active) ? pulse : 0;
      s.curOp += (s.targetOp - s.curOp) * k;
      if (s.curOp < 0.005) s.curOp = 0;        // 收斂歸零，避免殘影
      s.mat.opacity = s.curOp;
      s.mesh.visible = s.curOp > 0;            // 全淡出後關閉繪製，省效能
    }
  };
})(window.SEKI);
