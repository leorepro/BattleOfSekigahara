/* =========================================================================
 * src/engine/formation.js — 兵團陣型（Total War / 幕府將軍 風）
 *   每支部隊以 InstancedMesh 渲染數十~上百名士兵排成方陣，
 *   每名士兵背插 sashimono（背旗，亮色陣營旗）——整個方陣成「一片色旗」。
 *   陣型朝敵/前進方向、隨部隊移動；兵力下降士兵數隨之減少（mesh.count）。
 * ======================================================================= */
window.SEKI = window.SEKI || {};

(function (S) {
  const ARMOR_E = 0x2e3a5e, ARMOR_W = 0x5e2e2e;   // 軍裝暗色
  const FLAG_E = 0x3a78ff,  FLAG_W = 0xff3b3b;     // 背旗亮色（陣營）
  const SP = 0.9, BODY_H = 1.5;
  const SEA_Y = 0.5;   // 海平面門檻：地形高度低於此視為水域（與 units.js 一致）
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(),
        _p = new THREE.Vector3(), _s = new THREE.Vector3(1, 1, 1), _up = new THREE.Vector3(0, 1, 0);
  let _forms = [];

  // 合併多個 box geometry 成一個 BufferGeometry
  function mergeBoxes(boxes) {
    let vc = 0; boxes.forEach(g => vc += g.attributes.position.count);
    const pos = new Float32Array(vc*3), nor = new Float32Array(vc*3), idx = [];
    let vo = 0;
    boxes.forEach(g => {
      pos.set(g.attributes.position.array, vo*3);
      nor.set(g.attributes.normal.array, vo*3);
      const gi = g.index.array; for (let i=0;i<gi.length;i++) idx.push(gi[i]+vo);
      vo += g.attributes.position.count;
    });
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    out.setIndex(idx); return out;
  }
  // 戰國足軽：軀幹 + 方頭（原樣）
  function soldierGeo() {
    const body = new THREE.BoxGeometry(0.42, BODY_H, 0.36); body.translate(0, BODY_H/2, 0);
    const head = new THREE.BoxGeometry(0.3, 0.3, 0.3); head.translate(0, BODY_H + 0.15, 0);
    return mergeBoxes([body, head]);
  }
  // 現代步兵：較精細的合併幾何（雙腿/雙臂/軀幹+背包+裝具/鋼盔+盔簷/含槍托步槍），
  // 全部用 box 併入單一 BufferGeometry 供 InstancedMesh 共享（約 100 面 low-poly）。
  // 比例約定：原 BODY_H(1.5) 拆成「下半身雙腿」+「上半身軀幹」，總身高仍接近 BODY_H+頭盔。
  function modernSoldierGeo() {
    const LEG_H = 0.62, TORSO_H = 0.66;        // 腿高、軀幹高（合計約 1.28，再加頭盔）
    const HIP = LEG_H;                          // 軀幹底部（髖部）高度
    const SHO = HIP + TORSO_H;                  // 肩部高度
    // 雙腿：分開兩條，略前傾呈站姿（左腿稍後、右腿稍前，營造步行感）
    const legL = new THREE.BoxGeometry(0.15, LEG_H, 0.18);
    legL.translate(-0.11, LEG_H/2, -0.04);
    const legR = new THREE.BoxGeometry(0.15, LEG_H, 0.18);
    legR.rotateX(-0.12); legR.translate(0.11, LEG_H/2, 0.05);
    // 軀幹：上窄下寬的胸甲感（單一 box）
    const torso = new THREE.BoxGeometry(0.4, TORSO_H, 0.26);
    torso.translate(0, HIP + TORSO_H/2, 0);
    // 背包／裝具：背後一塊方塊（負 z 方向），呈現行軍負重與彈帶裝具
    const pack = new THREE.BoxGeometry(0.34, 0.46, 0.16);
    pack.translate(0, HIP + TORSO_H*0.52, -0.2);
    // 頭：盔下露出的頭部（小方塊，下巴/臉）
    const head = new THREE.BoxGeometry(0.2, 0.18, 0.2);
    head.translate(0, SHO + 0.13, 0.01);
    // 鋼盔：略寬扁的盔形（壓扁 box），罩住頭頂
    const helmet = new THREE.BoxGeometry(0.3, 0.18, 0.3);
    helmet.translate(0, SHO + 0.27, 0);
    // 盔簷：前緣略突出
    const brim = new THREE.BoxGeometry(0.34, 0.05, 0.1);
    brim.translate(0, SHO + 0.2, 0.16);
    // 雙臂：兩條垂落略前擺的手臂，夾持步槍
    const armL = new THREE.BoxGeometry(0.11, 0.5, 0.12);
    armL.rotateX(-0.35); armL.translate(-0.26, HIP + TORSO_H*0.6, 0.06);
    const armR = new THREE.BoxGeometry(0.11, 0.5, 0.12);
    armR.rotateX(-0.55); armR.translate(0.24, HIP + TORSO_H*0.55, 0.12);
    // 步槍：細長槍管 box 斜持於身前
    const rifle = new THREE.BoxGeometry(0.05, 0.06, 0.86);
    rifle.rotateX(-0.5); rifle.translate(0.16, SHO - 0.18, 0.2);
    // 槍托：槍身後段略寬一塊（貼肩端）
    const stock = new THREE.BoxGeometry(0.07, 0.11, 0.2);
    stock.rotateX(-0.5); stock.translate(0.16, SHO + 0.02, 0.02);
    return mergeBoxes([legL, legR, torso, pack, head, helmet, brim, armL, armR, rifle, stock]);
  }
  function sashimonoGeo() {
    const pole = new THREE.BoxGeometry(0.05, 1.1, 0.05); pole.translate(0, BODY_H + 0.2, -0.22);
    const flag = new THREE.BoxGeometry(0.44, 0.56, 0.04); flag.translate(0, BODY_H + 0.55, -0.22);
    return mergeBoxes([pole, flag]);
  }

  function maxSoldiersFor(troops) { return Math.max(20, Math.min(200, Math.round(troops/90))); }

  S.buildFormations = function () {
    const eng = S.engine;
    _forms = [];
    // 現代戰役（諾曼第 config.modern）：只有步兵在陸上才以士兵方陣呈現；
    // 海上/空中/載具（warship/landingcraft/aircraft/flak/bunker/armor）只顯示自身 3D 模型，
    // 不再額外渲染漂浮的士兵 box / sashimono 背旗（即「空中白色小方塊」之來源）。
    const modern = !!(S.config && S.config.modern);
    // 溫泉關：希臘方陣（hoplite 盾牆）。formationStyle==='phalanx' 時走專屬排列；
    // 前三場無此 config → phalanx=false，維持原行為。
    const phalanx = !!(S.config && S.config.formationStyle === 'phalanx');
    // 依時代決定士兵幾何：現代＝鋼盔步兵（無背旗）；戰國＝足軽＋sashimono 背旗。
    const sGeo = modern ? modernSoldierGeo() : soldierGeo();
    const fGeo = modern ? null : sashimonoGeo();
    for (const a of S.armies) {
      const east = a.side === 'east';

      /* ---- 希臘方陣 / 波斯人海分支（LOD + 高兵數） ---- */
      if (phalanx) {
        // LOD：希臘照真實人數(上限360)精細；波斯精銳精細、人海(≥25000人)用低面數簡模可上千
        const mass = east && a.troops >= 25000;
        let variant, count;
        if (east) {
          variant = mass ? 'persian-lite' : 'persian';
          count = mass ? Math.min(2200, Math.round(a.troops / 22))
                       : Math.min(900,  Math.round(a.troops / 14));
        } else {
          variant = (a.faction === 'sparta') ? 'spartan' : 'ally';
          count = Math.min(360, a.troops);            // 希臘幾乎照真實人數（298斯巴達=298人）
        }
        count = Math.max(24, count);
        const cloak = (a.factionColor != null) ? a.factionColor : undefined;
        const pgeo = S.buildHopliteGeo(variant, { cloak, crest: cloak });
        const pbody = new THREE.InstancedMesh(pgeo,
          new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62, metalness: mass ? 0.05 : 0.16 }), count);
        pbody.castShadow = true; pbody.frustumCulled = false;
        const base = [];   // 每兵本地座標（供逐兵貼地形高度，見 updateFormations）
        // 由多個小部隊(cluster)組成：散布陣面、疏密不一、有聚有散——不再單一方塊。
        // 希臘=多個盾牆小隊較密整齊；波斯=小隊更多、間距更鬆、像人群。
        const clSize = east ? (mass ? 64 : 46) : 38;
        const nCl = Math.max(1, Math.ceil(count / clSize));
        const cCols = Math.max(1, Math.round(Math.sqrt(nCl * (east ? 1.1 : 2.4))));  // 希臘較寬扁(沿陣面)
        const cRows = Math.ceil(nCl / cCols);
        const gapX = east ? 4.6 : 3.4, gapZ = east ? 3.9 : 2.6;
        let idx = 0;
        for (let c = 0; c < nCl && idx < count; c++) {
          const ccx = c % cCols, ccz = Math.floor(c / cCols);
          // 小隊中心：規則格 + 隨機偏移(聚散不一)
          const cx = (ccx - (cCols - 1) / 2) * gapX + Math.sin(c * 5.1) * (east ? 2.0 : 0.7);
          const cz = ((cRows - 1) / 2 - ccz) * gapZ + Math.cos(c * 3.3) * (east ? 1.6 : 0.5);
          const tight = 0.8 + 0.55 * Math.abs(Math.sin(c * 2.7));     // 有的密(~0.8)有的散(~1.35)
          const cn = Math.min(clSize, count - idx);
          const cw = Math.max(3, Math.round(Math.sqrt(cn * (east ? 1.2 : 2.0))));   // 小隊寬
          const cd = Math.ceil(cn / cw);
          const sp = (east ? 0.7 : 0.56) * tight;
          for (let k = 0; k < cn; k++, idx++) {
            const fi = k % cw, ri = Math.floor(k / cw);
            const lx = cx + (fi - (cw - 1) / 2) * sp + (Math.sin(idx * 12.9) + 0.6 * Math.sin(idx * 3.7)) * 0.13 * tight;
            const lz = cz + ((cd - 1) / 2 - ri) * sp + (Math.cos(idx * 7.7) + 0.6 * Math.cos(idx * 2.3)) * 0.13 * tight;  // ri=0 前(+Z)
            const yaw = (Math.sin(idx * 4.1) + 0.5 * Math.sin(idx * 1.7)) * (east ? 0.5 : 0.14);
            base.push({ x: lx, z: lz, yaw });
            _m.compose(_p.set(lx, 0, lz), _q.setFromAxisAngle(_up, yaw), _s);
            pbody.setMatrixAt(idx, _m);
          }
        }
        pbody.instanceMatrix.needsUpdate = true;
        eng.scene.add(pbody);
        _forms.push({ data: a, body: pbody, sashi: null, max: count, facing: 0,
          strengthPer: a.troops / count, showSoldiers: true, phalanx: true,
          base, lastX: 1e9, lastZ: 1e9, lastFacing: 1e9, lastN: -1, conformed: false });
        continue;
      }

      const showSoldiers = !modern || a.kind === 'infantry';
      const max = maxSoldiersFor(a.troops);
      const cols = Math.max(5, Math.round(Math.sqrt(max * 1.8)));
      const rows = Math.ceil(max / cols);
      const body = new THREE.InstancedMesh(sGeo,
        new THREE.MeshStandardMaterial({ color: east?ARMOR_E:ARMOR_W, roughness: 0.85 }), max);
      // 現代戰役不建立 sashimono 背旗（傘兵不會背戰國背旗），sashi 設為 null
      const sashi = modern ? null : new THREE.InstancedMesh(fGeo,
        new THREE.MeshStandardMaterial({ color: east?FLAG_E:FLAG_W, roughness: 0.6,
          emissive: east?FLAG_E:FLAG_W, emissiveIntensity: 0.22 }), max);
      body.castShadow = true; body.frustumCulled = false;
      if (sashi) sashi.frustumCulled = false;
      for (let i = 0; i < max; i++) {
        const c = i % cols, r = Math.floor(i / cols);
        const x = (c - (cols-1)/2) * SP + Math.sin(i*12.9)*0.16;
        const z = (r - (rows-1)/2) * SP + Math.cos(i*7.7)*0.16;
        _m.compose(_p.set(x, 0, z), _q.setFromAxisAngle(_up, Math.sin(i*4.1)*0.22), _s);
        body.setMatrixAt(i, _m); if (sashi) sashi.setMatrixAt(i, _m);
      }
      body.instanceMatrix.needsUpdate = true; if (sashi) sashi.instanceMatrix.needsUpdate = true;
      // 非步兵的現代單位：隱藏方陣並把實例數歸零（避免空中/海上漂浮方塊）
      if (!showSoldiers) { body.visible = false; body.count = 0; if (sashi) { sashi.visible = false; sashi.count = 0; } }
      eng.scene.add(body); if (sashi) eng.scene.add(sashi);
      _forms.push({ data: a, body, sashi, max, facing: 0, strengthPer: a.troops / max, showSoldiers });
    }
    return _forms;
  };

  S.updateFormations = function (t) {
    const modern = !!(S.config && S.config.modern);
    for (const f of _forms) {
      if (!f.showSoldiers) continue;   // 非步兵的現代單位不更新方陣（保持隱藏、count=0）
      const u = S.unitById(f.data.id); if (!u) continue;
      const gp = u.group.position;
      let dx = u.moveDir ? u.moveDir.dx : 0, dz = u.moveDir ? u.moveDir.dz : 0;
      if (Math.hypot(dx, dz) < 1e-4) { dx = -gp.x; dz = -gp.z; }
      const want = Math.atan2(dx, dz);
      f.facing += ((want - f.facing + Math.PI*3) % (Math.PI*2) - Math.PI) * 0.1;
      const s = u.cur ? u.cur.s : f.data.troops;
      let n = Math.max(0, Math.min(f.max, Math.round(s / f.strengthPer)));
      // 現代戰役（諾曼第）：搶灘步兵在海上時概念上仍在登陸艇內，不顯示士兵方陣；
      // 只有踏上灘頭／陸地（地形高度 > 海平面）才浮現方陣，呈現上岸效果。
      // 非現代戰役（關原／桶狹間）維持原本一律顯示，不套用此限制。
      if (modern) {
        const onLand = !S.terrain || S.terrain.heightAt(gp.x, gp.z) > SEA_Y;
        if (!onLand) n = 0;
      }
      // phalanx：逐兵貼地形高度（每兵依其世界座標取 heightAt，不再整片平面浮空；會動才重算省效能）
      if (f.phalanx && S.terrain && f.base) {
        const dirty = !f.conformed || n !== f.lastN
          || Math.abs(gp.x - f.lastX) > 0.04 || Math.abs(gp.z - f.lastZ) > 0.04
          || Math.abs(f.facing - f.lastFacing) > 0.008;
        if (dirty) {
          const cos = Math.cos(f.facing), sin = Math.sin(f.facing), B = f.base;
          for (let i = 0; i < n; i++) {
            const b = B[i];
            const wx = gp.x + b.x * cos + b.z * sin, wz = gp.z - b.x * sin + b.z * cos;
            const ty = S.terrain.heightAt(wx, wz);
            _m.compose(_p.set(b.x, ty - gp.y, b.z), _q.setFromAxisAngle(_up, b.yaw), _s);
            f.body.setMatrixAt(i, _m);
          }
          f.body.instanceMatrix.needsUpdate = true;
          f.lastX = gp.x; f.lastZ = gp.z; f.lastFacing = f.facing; f.lastN = n; f.conformed = true;
        }
      }
      // 現代戰役無 sashi（f.sashi 為 null），僅更新 body
      const meshes = f.sashi ? [f.body, f.sashi] : [f.body];
      for (const mesh of meshes) {
        mesh.position.set(gp.x, gp.y, gp.z);
        mesh.rotation.y = f.facing;
        mesh.count = n;
      }
      // 倒戈後改投東軍 → 兵團（與背旗，若有）轉藍。phalanx 用頂點色（陣營專屬），不整體重染。
      if (f.phalanx) continue;
      const eastNow = (f.data.side === 'east') || (f.data.defectAt != null && t >= f.data.defectAt);
      if (eastNow !== f.eastNow) {
        f.eastNow = eastNow;
        f.body.material.color.setHex(eastNow ? ARMOR_E : ARMOR_W);
        if (f.sashi) {
          f.sashi.material.color.setHex(eastNow ? FLAG_E : FLAG_W);
          f.sashi.material.emissive.setHex(eastNow ? FLAG_E : FLAG_W);
        }
      }
    }
  };

  S.setFormationsVisible = function (v) {
    for (const f of _forms) {
      const vis = v && f.showSoldiers;   // 非步兵的現代單位永遠不顯示士兵方陣
      f.body.visible = vis; if (f.sashi) f.sashi.visible = vis;
    }
  };
})(window.SEKI);
