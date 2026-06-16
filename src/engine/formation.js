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

  /* ---- 拿破崙時代陣型形態（formMode → base 的 x/z 縮放） ----
     line 橫隊(寬扁) / column 行軍縱隊(窄長) / square 抗騎方陣(Phase4 真空心) /
     charge 騎兵衝鋒(楔形) / rout 潰散(鬆) / hold 駐守。 */
  const NAPO_SCALE = {
    line:   { x:1.40, z:0.80 }, column: { x:0.50, z:1.70 },
    square: { x:1.05, z:1.05 }, charge: { x:0.85, z:1.25 },
    rout:   { x:1.35, z:1.35 }, hold:   { x:1.20, z:0.88 },
  };
  function napoMode(st) {
    switch (st) {
      case 'march':        return 'column';
      case 'attack':       return 'line';
      case 'breakthrough': return 'charge';
      case 'charge':       return 'charge';
      case 'square':       return 'square';
      case 'rout':         return 'rout';
      default:             return 'hold';   // hold / 其他
    }
  }
  // 形態覆寫（maneuver.js 可呼叫 S.setFormMode 指定單位形態，優先於 st 推導）
  const _formMode = {};
  S.setFormMode = function (id, mode) { if (mode == null) delete _formMode[id]; else _formMode[id] = mode; };
  // 依 faction/kind 決定拿破崙單兵 variant
  function napoVariant(a) {
    const f = a.faction || '';
    if (a.kind === 'cavalry') {
      if (f.indexOf('austrian') >= 0) return 'austrian-cav';
      if (f.indexOf('russian')  >= 0) return 'russian-guard-cav';
      return 'cuirassier';
    }
    if (a.kind === 'artillery') return 'cannon';
    if (a.kind === 'command')   return a.side === 'east' ? 'french-guard' : 'russian-line';
    if (f.indexOf('guard')     >= 0) return 'french-guard';
    if (f.indexOf('grenadier') >= 0) return 'french-grenadier';
    if (f.indexOf('russian')   >= 0) return 'russian-line';
    if (f.indexOf('austrian')  >= 0) return 'austrian-line';
    return 'french-line';
  }

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
    // 奧斯特利茨：拿破崙時代步/騎/砲分兵種幾何（napoleonic.js）
    const napo = !!(S.config && S.config.formationStyle === 'napoleonic');
    // 依時代決定士兵幾何：現代＝鋼盔步兵（無背旗）；戰國＝足軽＋sashimono 背旗。
    const sGeo = modern ? modernSoldierGeo() : soldierGeo();
    const fGeo = modern ? null : sashimonoGeo();
    for (const a of S.armies) {
      const east = a.side === 'east';

      /* ---- 希臘方陣 / 波斯人海分支（LOD + 高兵數） ---- */
      if (phalanx) {
        // LOD：希臘照真實人數(上限360)精細；波斯精銳精細、人海(≥25000人)用低面數簡模可上千
        const mass = east && a.troops >= 25000;
        const variant = east ? (mass ? 'persian-lite' : 'persian')
                             : (a.faction === 'sparta' ? 'spartan' : 'ally');
        // 視覺人數與真實兵力「成比例」(統一每約18人顯示1兵)，讓雙方懸殊看得出來：
        // 少數希臘小隊(下限40可辨識) vs 波斯人海(上限控效能 main40000→2222 / archers8000→444)。
        const cap = mass ? 2600 : (east ? 1400 : 320);
        const count = Math.max(40, Math.min(cap, Math.round(a.troops / 18)));
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
            const yaw = (Math.sin(idx * 4.1) + 0.5 * Math.sin(idx * 1.7)) * (east ? 0.06 : 0.05);  // 朝向幾乎一致，矛尖整齊指敵
            base.push({ x: lx, z: lz, yaw });
            _m.compose(_p.set(lx, 0, lz), _q.setFromAxisAngle(_up, yaw), _s);
            pbody.setMatrixAt(idx, _m);
          }
        }
        pbody.instanceMatrix.needsUpdate = true;
        eng.scene.add(pbody);
        _forms.push({ data: a, body: pbody, sashi: null, max: count, facing: 0,
          strengthPer: a.troops / count, showSoldiers: true, phalanx: true, east,
          base, lastX: 1e9, lastZ: 1e9, lastFacing: 1e9, lastN: -1, conformed: false });
        continue;
      }

      /* ---- 拿破崙時代分支：步/騎/砲分兵種，line/column/square 動態形態 ---- */
      if (napo) {
        const variant = napoVariant(a);
        const mounted = S.variantIsMounted(variant);
        const isCannon = variant === 'cannon';
        // 比例制人數（雙方兵力差可見）；騎兵/砲較少、步兵較多，cap 控效能
        const cap = mounted ? 300 : (a.kind === 'command' ? 90 : (isCannon ? 28 : 700));
        const per = isCannon ? 500 : (mounted ? 26 : 18);
        const count = Math.max(mounted ? 12 : (isCannon ? 4 : 24), Math.min(cap, Math.round(a.troops / per)));
        const coat = (a.factionColor != null) ? a.factionColor : undefined;
        const ngeo = S.buildNapoleonicGeo(variant, { coat });
        const nbody = new THREE.InstancedMesh(ngeo,
          new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, metalness: mounted ? 0.12 : 0.06 }), count);
        nbody.castShadow = true; nbody.frustumCulled = false;
        const base = [];                              // 每兵本地座標（橫隊基準，formMode 再縮放）
        const NP = S.NAPOLEONIC || { fileSpacing:0.66, rankSpacing:0.80, jitterPos:0.05 };
        const fileSp = (mounted ? 1.7 : isCannon ? 2.4 : 1.0) * NP.fileSpacing;
        const rankSp = (mounted ? 1.9 : isCannon ? 2.4 : 1.0) * NP.rankSpacing;
        const cols = Math.max(4, Math.round(Math.sqrt(count * 2.4)));   // 寬扁(橫隊基準)
        const rows = Math.ceil(count / cols);
        for (let i = 0; i < count; i++) {
          const c = i % cols, r = Math.floor(i / cols);
          const lx = (c - (cols-1)/2) * fileSp + Math.sin(i*12.9) * NP.jitterPos;
          const lz = ((rows-1)/2 - r) * rankSp + Math.cos(i*7.7) * NP.jitterPos;   // r=0 前(+Z)
          const yaw = Math.sin(i*4.1) * 0.05;
          base.push({ x: lx, z: lz, yaw });
          _m.compose(_p.set(lx, 0, lz), _q.setFromAxisAngle(_up, yaw), _s);
          nbody.setMatrixAt(i, _m);
        }
        nbody.instanceMatrix.needsUpdate = true;
        eng.scene.add(nbody);
        _forms.push({ data: a, body: nbody, sashi: null, max: count, facing: 0,
          strengthPer: a.troops / count, showSoldiers: true, napo: true, east,
          base, lastX: 1e9, lastZ: 1e9, lastFacing: 1e9, lastN: -1, lastMode: '', conformed: false });
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
      if (Math.hypot(dx, dz) < 1e-4) {
        // 靜止時面向敵人：phalanx 朝中門(接觸點)；已在門口則依陣營朝敵方來向(希臘朝西/波斯朝東)
        const cz = S.config && S.config.chokeZone;
        if (f.phalanx && cz && S.engine) {
          const p = S.engine.project(cz.lng, cz.lat, 0);
          dx = p.x - gp.x; dz = p.z - gp.z;
          if (Math.hypot(dx, dz) < 4) { dx = f.east ? 1 : -1; dz = 0; }
        } else { dx = -gp.x; dz = -gp.z; }   // 前三場維持朝場景中心
      }
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
          // 隘道壓縮：波斯攻擊方接近中門 → 正面壓窄成「長直線」(地形所迫，只少數並肩→斯巴達能久守)
          let sq = 1, zst = 1;
          const cz = (f.east && S.config) ? S.config.chokeZone : null;
          if (cz && S.engine) {
            const p = S.engine.project(cz.lng, cz.lat, 0);
            const d = Math.hypot(gp.x - p.x, gp.z - p.z), r = cz.radius || 55;
            if (d < r) {                                // 窄門：正面壓窄 + 縱深拉長 → 細長縱列
              const e = 1 - d / r, s2 = e * e * (3 - 2 * e);
              sq = 1 - 0.86 * s2; zst = 1 + 1.6 * s2;
            }
          }
          const cos = Math.cos(f.facing), sin = Math.sin(f.facing), B = f.base;
          const maxD = 2.2;   // 士兵與單位中心最大高度差：超過視為上山/落海 → 沿陣面拉回平地
          for (let i = 0; i < n; i++) {
            const b = B[i];
            let bx = b.x * sq, bz = b.z * zst;
            let wx = gp.x + bx * cos + bz * sin, wz = gp.z - bx * sin + bz * cos;
            let ty = S.terrain.heightAt(wx, wz);
            if (Math.abs(ty - gp.y) > maxD) {          // 不上山、不落海：把該兵拉回直到地勢平緩
              const k = maxD / Math.abs(ty - gp.y);
              bx *= k; bz *= k;
              wx = gp.x + bx * cos + bz * sin; wz = gp.z - bx * sin + bz * cos;
              ty = S.terrain.heightAt(wx, wz);
            }
            _m.compose(_p.set(bx, ty - gp.y, bz), _q.setFromAxisAngle(_up, b.yaw), _s);
            f.body.setMatrixAt(i, _m);
          }
          f.body.instanceMatrix.needsUpdate = true;
          f.lastX = gp.x; f.lastZ = gp.z; f.lastFacing = f.facing; f.lastN = n; f.conformed = true;
        }
      }
      // 拿破崙時代：逐兵貼地形 + 依 formMode(line/column/square/charge/rout) 縮放 base
      if (f.napo && S.terrain && f.base) {
        const mode = _formMode[f.data.id] || napoMode(u.cur ? u.cur.st : 'hold');
        const dirty = !f.conformed || n !== f.lastN || mode !== f.lastMode
          || Math.abs(gp.x - f.lastX) > 0.04 || Math.abs(gp.z - f.lastZ) > 0.04
          || Math.abs(f.facing - f.lastFacing) > 0.008;
        if (dirty) {
          const sc = NAPO_SCALE[mode] || NAPO_SCALE.line;
          const cos = Math.cos(f.facing), sin = Math.sin(f.facing), B = f.base;
          const maxD = 2.4;   // 不上山/不落水：超過高度差沿陣面拉回
          for (let i = 0; i < n; i++) {
            const b = B[i];
            let bx = b.x * sc.x, bz = b.z * sc.z;
            let wx = gp.x + bx * cos + bz * sin, wz = gp.z - bx * sin + bz * cos;
            let ty = S.terrain.heightAt(wx, wz);
            if (Math.abs(ty - gp.y) > maxD) {
              const k = maxD / Math.abs(ty - gp.y); bx *= k; bz *= k;
              wx = gp.x + bx * cos + bz * sin; wz = gp.z - bx * sin + bz * cos;
              ty = S.terrain.heightAt(wx, wz);
            }
            _m.compose(_p.set(bx, ty - gp.y, bz), _q.setFromAxisAngle(_up, b.yaw), _s);
            f.body.setMatrixAt(i, _m);
          }
          f.body.instanceMatrix.needsUpdate = true;
          f.lastX = gp.x; f.lastZ = gp.z; f.lastFacing = f.facing; f.lastN = n; f.lastMode = mode; f.conformed = true;
        }
      }
      // 現代戰役無 sashi（f.sashi 為 null），僅更新 body
      const meshes = f.sashi ? [f.body, f.sashi] : [f.body];
      for (const mesh of meshes) {
        mesh.position.set(gp.x, gp.y, gp.z);
        mesh.rotation.y = f.facing;
        mesh.count = n;
      }
      // 倒戈後改投東軍 → 兵團（與背旗，若有）轉藍。phalanx/napo 用頂點色（陣營專屬），不整體重染。
      if (f.phalanx || f.napo) continue;
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
