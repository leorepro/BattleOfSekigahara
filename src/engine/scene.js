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
  const WORLD_SCALE = 1 / 60;

  S.engine = {
    scene: null, camera: null, renderer: null, controls: null,
    labelRenderer: null, clock: null,

    /* 經緯度 + 海拔(m) → THREE.Vector3 場景座標 */
    project(lng, lat, h = 0) {
      const o = S.geography.origin;
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
      scene.background = new THREE.Color(0x9fb0bd);     // 晨霧灰藍
      scene.fog = new THREE.Fog(0x9fb0bd, 120, 360);    // 朝霧（M4 會動態化）

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
      controls.minDistance = 20;
      controls.maxDistance = 500;
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
