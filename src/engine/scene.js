/* =========================================================================
 * src/engine/scene.js — Three.js 場景骨架
 *   renderer / scene / camera / OrbitControls / 燈光 / 電影色調
 *   座標投影工具：經緯度 → 場景座標（簡化 Web Mercator，相對 origin）
 * ======================================================================= */
window.SEKI = window.SEKI || {};

(function (S) {
  // 1 經度 ≈ 多少公尺（隨緯度變化），用來把經緯度等比投影到場景平面
  const M_PER_DEG_LAT = 111320;
  // 場景縮放：把「公尺」壓縮成場景單位（讓整個盆地約 100 單位寬）
  //   可由 config.worldScale 覆寫（如奧斯特利茨用 1/30 把戰場放大 2 倍呈現）；
  //   未設則維持 1/60，其餘戰役零影響。project() 於執行期讀取（config 此時已就緒）。
  const DEFAULT_WORLD_SCALE = 1 / 60;

  S.engine = {
    scene: null, camera: null, renderer: null, controls: null,
    labelRenderer: null, clock: null,

    /* 經緯度 + 海拔(m) → THREE.Vector3 場景座標 */
    project(lng, lat, h = 0) {
      const o = S.geography.origin;
      const WORLD_SCALE = (S.config && S.config.worldScale) || DEFAULT_WORLD_SCALE;
      const mPerDegLng = M_PER_DEG_LAT * Math.cos(o.lat * Math.PI / 180);
      const x = (lng - o.lng) * mPerDegLng * WORLD_SCALE;
      const z = -(lat - o.lat) * M_PER_DEG_LAT * WORLD_SCALE; // 北 = -Z
      const y = h * WORLD_SCALE;
      return new THREE.Vector3(x, y, z);
    },

    init() {
      const app = document.getElementById('app');

      // --- renderer：電視級電影感（ACES 色調 + sRGB） -----------------
      const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(innerWidth, innerHeight);
      renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      app.appendChild(renderer.domElement);

      // --- scene + 晨間天色霧氣 -------------------------------------
      const scene = new THREE.Scene();
      // 天色/霧色/霧近裁面可由 config 覆寫（如溫泉關用通透的愛琴海夏日天色）；
      // 未設則維持原「晨霧灰藍」，前三場零影響。
      const skyColor = (S.config && S.config.skyColor != null) ? S.config.skyColor : 0x9fb0bd;
      const fogColor = (S.config && S.config.fogColor != null) ? S.config.fogColor : skyColor;
      const fogNear  = (S.config && S.config.fogNear  != null) ? S.config.fogNear  : 120;
      scene.background = new THREE.Color(skyColor);
      // 霧遠裁面：擴大地圖的戰役（現代/諾曼第/溫泉關）拉更遠，避免遠處地形被霧吃成灰白；
      // 可由 config.fogFar 顯式覆寫。關原/桶狹間維持原值 360。
      const fogFar = (S.config && S.config.fogFar)
        || (S.config && S.config.modern ? 1400 : 360);
      scene.fog = new THREE.Fog(fogColor, fogNear, fogFar);

      // --- camera ---------------------------------------------------
      const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 4000);
      camera.position.set(40, 90, 140);

      // --- 燈光：晨光 ----------------------------------------------
      const sun = new THREE.DirectionalLight(0xfff2dc, 1.15);
      sun.position.set(-120, 160, 80);
      sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048);
      sun.shadow.camera.near = 1; sun.shadow.camera.far = 600;
      sun.shadow.camera.left = -200; sun.shadow.camera.right = 200;
      sun.shadow.camera.top = 200; sun.shadow.camera.bottom = -200;
      scene.add(sun);
      const hemi = new THREE.HemisphereLight(0xbfd2e0, 0x4a4636, 0.7);
      scene.add(hemi);
      scene.add(new THREE.AmbientLight(0xffffff, 0.25));
      this.sun = sun; this.hemi = hemi;

      // --- CSS2D 標籤渲染層 ----------------------------------------
      const labelRenderer = new THREE.CSS2DRenderer();
      labelRenderer.setSize(innerWidth, innerHeight);
      const lbl = document.getElementById('labels');
      lbl.appendChild(labelRenderer.domElement);
      labelRenderer.domElement.style.position = 'absolute';
      labelRenderer.domElement.style.top = '0';

      // --- OrbitControls：自由運鏡 ---------------------------------
      const controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.06;
      controls.maxPolarAngle = Math.PI * 0.49;   // 不穿到地底
      controls.minDistance = 5;                   // 可貼近看細節
      // 可拉遠距離：擴大地圖的戰役（現代/諾曼第）可拉更遠看全景；
      // 可由 config.maxDistance 顯式覆寫。關原/桶狹間維持原值 600。
      controls.maxDistance = (S.config && S.config.maxDistance)
        || (S.config && S.config.modern ? 1600 : 600);
      controls.target.set(0, 0, 0);

      this.scene = scene; this.camera = camera; this.renderer = renderer;
      this.controls = controls; this.labelRenderer = labelRenderer;
      this.clock = new THREE.Clock();

      addEventListener('resize', () => this.onResize());
      return this;
    },

    onResize() {
      this.camera.aspect = innerWidth / innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(innerWidth, innerHeight);
      this.labelRenderer.setSize(innerWidth, innerHeight);
    },

    render() {
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
      this.labelRenderer.render(this.scene, this.camera);
    },
  };
})(window.SEKI);
