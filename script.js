// ================================
// AscendLabs - Flagship Experience
// Elite WebGL & Interaction Engineering
// Enhanced with Cinematic 3D Hero Scene
// ================================

// ===== Configuration =====
const CONFIG = {
  scrollOffset: 80,
  navScrollThreshold: 100,
  animationDuration: 800,
  particleCount: 80,
  magneticStrength: 0.4,
  tiltStrength: 15,
  cursorSpeed: 0.15,
  // NEW: 3D Scene Configuration
  scene3D: {
    cameraDistance: window.innerWidth < 768 ? 9.5 : 8, // Adjust distance for mobile
    cameraFOV: 45,
    mouseSensitivity: 0.0003,
    mouseSmoothing: 0.05,
    autoRotateSpeed: 0.0008,
    objectCount: 6, // Number of orbiting geometric shapes
    enableDepthOfField: true,
    performanceMode: window.innerWidth < 768, // Reduced complexity on mobile
    identity: {
      palette: {
        primary: 0x6f83ff,
        secondary: 0x8b6bff,
        accent: 0x3dd5ff,
        neutral: 0x1f2432
      },
      emissiveIntensity: 0.42,
      scaleRatios: {
        core: 1.0,
        ring: 1.16,
        lattice: 0.95,
        cluster: 0.84,
        arc: 1.24
      },
      spacing: {
        orbitBase: 3.4,
        orbitVariance: 1.5,
        motifGap: 1.25
      }
    }
  },
  // NEW: Cinematic Transition Configuration
  cinematic: {
    transitionDuration: 1.2,
    cameraEasing: 'power2.inOut',
    depthShiftAmount: 3,
    parallaxStrength: 0.15,
    fogNear: 5,
    fogFar: 25,
    vignetteIntensity: 0.6,
    enableMobile: false // Disable on mobile for performance
  },
  
  // ⭐ CINEMATIC SCROLL ENGINE CONFIGURATION ⭐
  inertialScroll: {
    lerp: 0.08,              // Smooth interpolation (0.06 = luxury, 0.12 = snappy)
    wheelMultiplier: 1.0,
    touchMultiplier: 1.5,
    smoothTouch: true,
    touchInertia: 0.95,
    enabled: false
  },
  
  cameraRig: {
    intensity: 1.0,          // Overall effect strength
    depthRange: 2.5,         // Camera push/pull depth
    arcRadius: 0.8,          // Arc path radius
    rotationDrift: 0.15,     // Rotation amount
    shakeIntensity: 0.02,    // Micro shake amount
    noiseScale: 0.3,         // Procedural noise scale
    fovBreathing: 5          // FOV breathing effect
  },
  
  parallaxField: {
    foregroundStrength: 1.8, // Close objects move more
    midgroundStrength: 1.0,
    backgroundStrength: 0.4  // Far objects move less
  },
  
  scrollFX: {
    enableBloom: true,
    enableMotionBlur: false, // Can be heavy on performance
    enableFOVBreathing: true,
    enableExposureAdapt: true,
    bloomIntensity: 0.5
  }
};

// ===== DOM Elements =====
const DOM = {
  nav: document.getElementById('mainNav'),
  navToggle: document.getElementById('navToggle'),
  navMenu: document.getElementById('navMenu'),
  navLinks: document.querySelectorAll('.nav__link'),
  navProgress: document.querySelector('.nav__progress'),
  contactForm: document.getElementById('contactForm'),
  scrollIndicator: document.querySelector('.hero__scroll-indicator'),
  heroCanvas: document.getElementById('heroCanvas'),
  heroCanvas3D: document.getElementById('heroCanvas3D'), // NEW: 3D canvas
  heroParticles: document.getElementById('heroParticles'),
  cursorInner: document.querySelector('.cursor__inner'),
  cursorOuter: document.querySelector('.cursor__outer'),
  // NEW: Cinematic Canvas
  cinematicCanvas: document.getElementById('cinematicCanvas'),
  heroProductsPanel: document.getElementById('heroProductsPanel'),
  productsTrigger: document.querySelector('[data-products-trigger]')
};

// ===== Global State =====
const STATE = {
  mouseX: 0,
  mouseY: 0,
  cursorX: 0,
  cursorY: 0,
  isTouch: false,
  scrollY: 0,
  rafId: null,
  particles: [],
  scene: null,
  camera: null,
  renderer: null,
  shaderMaterial: null,
  // NEW: 3D Scene State
  scene3D: null,
  camera3D: null,
  renderer3D: null,
  heroObjects: {
    smartphone: null,
    artifact: null,
    geometricShapes: [],
    glassPanels: [],
    lights: [],
    depthLayers: {
      foreground: [],
      midground: [],
      background: []
    }
  },
  mouse3D: {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0
  },
  // NEW: Cinematic Transition State
  cinematic: {
    scene: null,
    camera: null,
    renderer: null,
    sceneObjects: {},
    currentSceneName: 'hero',
    targetSceneName: 'hero',
    transitionProgress: 0,
    isTransitioning: false,
    scrollProgress: 0,
    sectionRanges: []
  },
  
  // ⭐ CINEMATIC SCROLL ENGINE STATE ⭐
  scrollEngine: {
    controller: null,         // InertialScrollController instance
    cameraRig: null,         // CinematicCameraRig instance
    parallaxField: null,     // VolumetricParallaxField instance
    transitionNarrative: null, // SceneTransitionNarrative instance
    scrollFX: null,          // ScrollReactiveFX instance
    lastScrollY: 0,
    scrollVelocity: 0,
    scrollProgress: 0
  }
};

// ===== Custom Cursor System =====
class CursorController {
  constructor() {
    this.init();
  }

  init() {
    // Check if touch device
    STATE.isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    if (STATE.isTouch) {
      document.body.style.cursor = 'auto';
      if (DOM.cursorInner) DOM.cursorInner.style.display = 'none';
      if (DOM.cursorOuter) DOM.cursorOuter.style.display = 'none';
      return;
    }

    // Mouse move tracking
    document.addEventListener('mousemove', (e) => {
      STATE.mouseX = e.clientX;
      STATE.mouseY = e.clientY;
    });

    // Hover effects
    const interactiveElements = document.querySelectorAll('a, button, [data-tilt]');
    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });

    // Click effect
    document.addEventListener('mousedown', () => document.body.classList.add('cursor-active'));
    document.addEventListener('mouseup', () => document.body.classList.remove('cursor-active'));

    this.animate();
  }

  animate() {
    // Smooth cursor follow
    STATE.cursorX += (STATE.mouseX - STATE.cursorX) * CONFIG.cursorSpeed;
    STATE.cursorY += (STATE.mouseY - STATE.cursorY) * CONFIG.cursorSpeed;

    if (DOM.cursorInner) {
      DOM.cursorInner.style.left = `${STATE.cursorX}px`;
      DOM.cursorInner.style.top = `${STATE.cursorY}px`;
    }

    if (DOM.cursorOuter) {
      DOM.cursorOuter.style.left = `${STATE.cursorX}px`;
      DOM.cursorOuter.style.top = `${STATE.cursorY}px`;
    }

    requestAnimationFrame(() => this.animate());
  }
}

// ===== WebGL Shader Background (PRESERVED) =====
class ShaderBackground {
  constructor(canvas) {
    if (!canvas || STATE.isTouch) return;
    
    this.canvas = canvas;
    this.init();
  }

  init() {
    // Setup Three.js scene
    STATE.scene = new THREE.Scene();
    STATE.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    
    STATE.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true
    });
    
    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Shader material for fluid gradient effect
    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float u_time;
      uniform vec2 u_mouse;
      uniform vec2 u_resolution;
      varying vec2 vUv;

      // Noise function
      float noise(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }

      // Smooth noise
      float smoothNoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        
        float a = noise(i);
        float b = noise(i + vec2(1.0, 0.0));
        float c = noise(i + vec2(0.0, 1.0));
        float d = noise(i + vec2(1.0, 1.0));
        
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      // Fractal Brownian Motion
      float fbm(vec2 p) {
        float value = 0.0;
        float amplitude = 0.5;
        float frequency = 1.0;
        
        for(int i = 0; i < 5; i++) {
          value += amplitude * smoothNoise(p * frequency);
          frequency *= 2.0;
          amplitude *= 0.5;
        }
        
        return value;
      }

      void main() {
        vec2 uv = vUv;
        vec2 mouse = u_mouse / u_resolution;
        
        // Animated coordinates
        vec2 p = uv * 3.0 - 1.5;
        p += vec2(u_time * 0.05, u_time * 0.03);
        
        // Mouse influence
        float mouseDist = length(uv - mouse);
        p += (uv - mouse) * 0.3 * (1.0 - smoothstep(0.0, 0.5, mouseDist));
        
        // Layered noise
        float n1 = fbm(p * 1.5 + u_time * 0.1);
        float n2 = fbm(p * 2.0 - u_time * 0.08);
        float n3 = fbm(p * 0.5 + vec2(u_time * 0.05, -u_time * 0.04));
        
        // Combine noise layers
        float finalNoise = (n1 + n2 * 0.5 + n3 * 0.3) / 1.8;
        
        // Color gradient
        vec3 color1 = vec3(0.39, 0.40, 0.95); // Primary blue
        vec3 color2 = vec3(0.55, 0.36, 0.96); // Secondary purple
        vec3 color3 = vec3(0.04, 0.04, 0.06); // Dark
        
        vec3 color = mix(color3, color1, finalNoise);
        color = mix(color, color2, smoothstep(0.3, 0.7, finalNoise));
        
        // Vignette
        float vignette = smoothstep(1.2, 0.3, length(uv - 0.5));
        color *= vignette * 0.5 + 0.5;
        
        // Output with reduced opacity for subtlety
        gl_FragColor = vec4(color, 0.15);
      }
    `;

    STATE.shaderMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        u_time: { value: 0.0 },
        u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
        u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
      },
      transparent: true
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, STATE.shaderMaterial);
    STATE.scene.add(mesh);

    // Mouse tracking
    document.addEventListener('mousemove', (e) => {
      if (STATE.shaderMaterial) {
        STATE.shaderMaterial.uniforms.u_mouse.value.x = e.clientX;
        STATE.shaderMaterial.uniforms.u_mouse.value.y = window.innerHeight - e.clientY;
      }
    });

    this.animate();
  }

  resize() {
    const width = this.canvas.offsetWidth;
    const height = this.canvas.offsetHeight;
    
    STATE.renderer.setSize(width, height);
    STATE.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    if (STATE.shaderMaterial) {
      STATE.shaderMaterial.uniforms.u_resolution.value.set(width, height);
    }
  }

  animate() {
    if (STATE.shaderMaterial) {
      STATE.shaderMaterial.uniforms.u_time.value += 0.01;
    }
    
    STATE.renderer.render(STATE.scene, STATE.camera);
    requestAnimationFrame(() => this.animate());
  }
}

// ===== NEW: Cinematic 3D Hero Scene =====
class HeroScene3D {
  constructor(canvas) {
    if (!canvas) return;
    
    this.canvas = canvas;
    this.time = 0;
    this.identityStyle = this.createIdentityStyleSystem();
    this.materialPresets = this.createMaterialPresets();
    this.identityGenerator = this.createIdentityGeometryGenerator();
    this.scrollNavigation = this.createScrollNavigationSystem();
    this.cameraTargetPosition = new THREE.Vector3();
    this.cameraTargetQuaternion = new THREE.Quaternion();
    this.mouseRotationEuler = new THREE.Euler(0, 0, 0, 'XYZ');
    this.mouseRotationQuaternion = new THREE.Quaternion();
    this.fogColorFrom = new THREE.Color(0x0a0a0f);
    this.fogColorTo = new THREE.Color(0x12182a);
    this.fogColorMixed = new THREE.Color();
    this.fillColorFrom = new THREE.Color(0x7f95ff);
    this.fillColorTo = new THREE.Color(0x95a8ff);
    this.rimColorFrom = new THREE.Color(0xb48cff);
    this.rimColorTo = new THREE.Color(0xcf9dff);
    this.gsapCameraTimelines = [];
    this.gsapScrollTriggers = [];
    this.gsapRig = {
      x: 0,
      y: 0,
      z: CONFIG.scene3D.cameraDistance,
      qx: 0,
      qy: 0,
      qz: 0,
      qw: 1,
      motifDepth: 0,
      motifScale: 1,
      lightMix: 0,
      transitionMix: 0,
      artifactPhase: 0
    };
    this.rigQuaternion = new THREE.Quaternion();
    this.transitionColorFrom = new THREE.Color(0x293a86);
    this.transitionColorTo = new THREE.Color(0x6f4dff);
    this.transitionColorMixed = new THREE.Color();
    this.narrativeController = this.createSceneNarrativeController();
    this.motifMaterialCache = [];
    this.tempVectorA = new THREE.Vector3();
    this.tempVectorB = new THREE.Vector3();
    this.instanceMatrixTemp = new THREE.Matrix4();
    this.init();
  }

  init() {
    // Setup scene
    STATE.scene3D = new THREE.Scene();
    
    // Setup camera with cinematic perspective
    const aspect = this.canvas.offsetWidth / this.canvas.offsetHeight;
    STATE.camera3D = new THREE.PerspectiveCamera(
      CONFIG.scene3D.cameraFOV,
      aspect,
      0.1,
      1000
    );
    STATE.camera3D.position.z = CONFIG.scene3D.cameraDistance;
    
    // Setup renderer with transparency to layer over shader background
    STATE.renderer3D = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: !CONFIG.scene3D.performanceMode
    });
    
    this.configureRenderer();
    STATE.renderer3D.setSize(this.canvas.offsetWidth, this.canvas.offsetHeight);
    STATE.renderer3D.setPixelRatio(Math.min(window.devicePixelRatio, CONFIG.scene3D.performanceMode ? 1.5 : 2)); // Cap pixel ratio for mobile performance
    STATE.renderer3D.setClearColor(0x000000, 0); // Transparent background
    
    // Environment-based reflections for physically based materials
    this.setupEnvironmentLighting();
    
    // Setup lighting
    this.setupLighting();
    
    // Create 3D objects
    this.createSmartphone();
    this.createGeometricShapes();
    this.createGlassPanels();
    this.createDepthComposition();
    this.createTransitionField();
    this.collectMotifMaterials();
    
    // Add subtle fog for depth
    if (!CONFIG.scene3D.performanceMode) {
      STATE.scene3D.fog = new THREE.Fog(0x0a0a0f, 8, 20);
    }
    
    // ⭐ INITIALIZE CINEMATIC CAMERA RIG ⭐
    if (typeof CinematicCameraRig !== 'undefined') {
      STATE.scrollEngine.cameraRig = new CinematicCameraRig(STATE.camera3D, {
        intensity: CONFIG.cameraRig.intensity,
        depthRange: CONFIG.cameraRig.depthRange,
        arcRadius: CONFIG.cameraRig.arcRadius,
        rotationDrift: CONFIG.cameraRig.rotationDrift,
        shakeIntensity: CONFIG.cameraRig.shakeIntensity,
        noiseScale: CONFIG.cameraRig.noiseScale,
        fovBreathing: CONFIG.cameraRig.fovBreathing
      });
      console.log('✅ Cinematic Camera Rig initialized');
    }
    
    // ⭐ INITIALIZE VOLUMETRIC PARALLAX FIELD ⭐
    if (typeof VolumetricParallaxField !== 'undefined') {
      STATE.scrollEngine.parallaxField = new VolumetricParallaxField(STATE.scene3D, {
        depthLayers: STATE.heroObjects.depthLayers,
        parallaxStrength: {
          foreground: CONFIG.parallaxField.foregroundStrength,
          midground: CONFIG.parallaxField.midgroundStrength,
          background: CONFIG.parallaxField.backgroundStrength
        }
      });
      console.log('✅ Volumetric Parallax Field initialized');
    }
    
    // Event listeners
    this.setupEventListeners();
    this.handleScrollProgress();
    this.initGsapCameraChoreography();
    
    // Start animation loop
    this.animate();
    
    // Fade in the canvas
    setTimeout(() => {
      this.canvas.classList.add('is-loaded');
    }, 100);
  }

  configureRenderer() {
    STATE.renderer3D.physicallyCorrectLights = true;
    STATE.renderer3D.outputEncoding = THREE.sRGBEncoding;
    STATE.renderer3D.toneMapping = THREE.ACESFilmicToneMapping;
    STATE.renderer3D.toneMappingExposure = CONFIG.scene3D.performanceMode ? 0.95 : 1.1;
    STATE.renderer3D.shadowMap.enabled = !CONFIG.scene3D.performanceMode;
    STATE.renderer3D.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  createMaterialPresets() {
    const isMobile = CONFIG.scene3D.performanceMode;
    const identity = this.identityStyle;

    return {
      glass: (overrides = {}) => new THREE.MeshPhysicalMaterial({
        color: identity.palette.primary,
        metalness: 0.02,
        roughness: isMobile ? 0.12 : 0.05,
        transmission: isMobile ? 0.82 : 0.94,
        thickness: isMobile ? 0.25 : 0.7,
        ior: 1.47,
        reflectivity: 0.88,
        clearcoat: 1.0,
        clearcoatRoughness: 0.08,
        envMapIntensity: isMobile ? 0.65 : 1.05,
        transparent: true,
        opacity: 0.16,
        side: THREE.DoubleSide,
        ...overrides
      }),
      brushedMetal: (overrides = {}) => {
        const material = new THREE.MeshPhysicalMaterial({
          color: identity.palette.neutral,
          metalness: 0.96,
          roughness: isMobile ? 0.34 : 0.24,
          clearcoat: 0.4,
          clearcoatRoughness: 0.25,
          reflectivity: 0.95,
          envMapIntensity: isMobile ? 0.85 : 1.35,
          ...overrides
        });

        // Newer Three.js versions expose anisotropy on physical materials.
        if ('anisotropy' in material) material.anisotropy = isMobile ? 0.2 : 0.45;
        if ('anisotropyRotation' in material) material.anisotropyRotation = Math.PI * 0.25;

        return material;
      },
      emissiveAccent: (overrides = {}) => new THREE.MeshStandardMaterial({
        color: 0x2b3c74,
        emissive: identity.palette.primary,
        emissiveIntensity: isMobile ? identity.emissiveIntensity * 0.72 : identity.emissiveIntensity,
        metalness: 0.2,
        roughness: 0.55,
        envMapIntensity: isMobile ? 0.45 : 0.75,
        transparent: true,
        opacity: 0.92,
        ...overrides
      })
    };
  }

  createIdentityStyleSystem() {
    const source = CONFIG.scene3D.identity || {};
    const palette = source.palette || {};
    const scaleRatios = source.scaleRatios || {};
    const spacing = source.spacing || {};

    return {
      palette: {
        primary: palette.primary || 0x6f83ff,
        secondary: palette.secondary || 0x8b6bff,
        accent: palette.accent || 0x3dd5ff,
        neutral: palette.neutral || 0x1f2432
      },
      emissiveIntensity: source.emissiveIntensity || 0.42,
      scaleRatios: {
        core: scaleRatios.core || 1.0,
        ring: scaleRatios.ring || 1.16,
        lattice: scaleRatios.lattice || 0.95,
        cluster: scaleRatios.cluster || 0.84,
        arc: scaleRatios.arc || 1.24
      },
      spacing: {
        orbitBase: spacing.orbitBase || 3.4,
        orbitVariance: spacing.orbitVariance || 1.5,
        motifGap: spacing.motifGap || 1.25
      },
      performanceReduced: CONFIG.scene3D.performanceMode
    };
  }

  createIdentityGeometryGenerator() {
    return {
      segmentedRing: (options) => this.createSegmentedRingMotif(options),
      latticeWireframe: (options) => this.createLatticeWireframeMotif(options),
      orbitalNodeCluster: (options) => this.createOrbitalNodeClusterMotif(options),
      dataFlowArc: (options) => this.createDataFlowArcMotif(options)
    };
  }

  createSceneNarrativeController() {
    const isMobile = CONFIG.scene3D.performanceMode;
    const sections = ['hero', 'services', 'work', 'pricing', 'about', 'contact'];
    const shotLibrary = isMobile
      ? [
          { p: [0.0, 0.0, 8.0], r: [0.0, 0.0, 0.0], motifDepth: 0.0, motifScale: 1.0, lightMix: 0.0, transitionMix: 0.08, artifactPhase: 0.0 },
          { p: [0.18, 0.06, 7.35], r: [-0.02, 0.04, 0.0], motifDepth: 0.18, motifScale: 1.05, lightMix: 0.18, transitionMix: 0.16, artifactPhase: 0.14 },
          { p: [-0.16, -0.08, 6.95], r: [0.02, -0.05, -0.01], motifDepth: 0.36, motifScale: 1.08, lightMix: 0.33, transitionMix: 0.24, artifactPhase: 0.3 },
          { p: [0.10, 0.10, 6.55], r: [-0.01, 0.09, 0.0], motifDepth: 0.52, motifScale: 1.12, lightMix: 0.48, transitionMix: 0.32, artifactPhase: 0.46 },
          { p: [-0.08, 0.02, 6.25], r: [0.01, -0.08, 0.0], motifDepth: 0.68, motifScale: 1.16, lightMix: 0.62, transitionMix: 0.42, artifactPhase: 0.66 },
          { p: [0.0, 0.0, 5.95], r: [0.0, 0.12, 0.0], motifDepth: 0.84, motifScale: 1.2, lightMix: 0.78, transitionMix: 0.55, artifactPhase: 0.86 }
        ]
      : [
          { p: [0.0, 0.0, 8.0], r: [0.0, 0.0, 0.0], motifDepth: 0.0, motifScale: 1.0, lightMix: 0.0, transitionMix: 0.08, artifactPhase: 0.0 },
          { p: [0.36, 0.16, 7.35], r: [-0.04, 0.09, 0.01], motifDepth: 0.2, motifScale: 1.06, lightMix: 0.2, transitionMix: 0.16, artifactPhase: 0.15 },
          { p: [-0.32, -0.14, 6.88], r: [0.03, -0.1, -0.01], motifDepth: 0.38, motifScale: 1.1, lightMix: 0.34, transitionMix: 0.25, artifactPhase: 0.31 },
          { p: [0.24, 0.15, 6.42], r: [-0.02, 0.14, 0.0], motifDepth: 0.56, motifScale: 1.15, lightMix: 0.5, transitionMix: 0.35, artifactPhase: 0.48 },
          { p: [-0.18, 0.05, 6.1], r: [0.02, -0.12, 0.0], motifDepth: 0.72, motifScale: 1.2, lightMix: 0.66, transitionMix: 0.48, artifactPhase: 0.68 },
          { p: [0.08, -0.04, 5.78], r: [-0.01, 0.18, 0.01], motifDepth: 0.9, motifScale: 1.26, lightMix: 0.82, transitionMix: 0.62, artifactPhase: 0.9 }
        ];

    const shots = shotLibrary.map((shot) => {
      const position = new THREE.Vector3(shot.p[0], shot.p[1], shot.p[2]);
      const quaternion = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(shot.r[0], shot.r[1], shot.r[2], 'XYZ')
      );
      return {
        position,
        quaternion,
        motifDepth: shot.motifDepth,
        motifScale: shot.motifScale,
        lightMix: shot.lightMix,
        transitionMix: shot.transitionMix,
        artifactPhase: shot.artifactPhase
      };
    });

    return {
      sections,
      shots,
      progress: 0,
      currentState: 0
    };
  }

  createScrollNavigationSystem() {
    const isMobile = CONFIG.scene3D.performanceMode;
    const keyStateConfig = isMobile
      ? [
          { position: [0.0, 0.0, 8.0], rotation: [0.0, 0.0, 0.0] },
          { position: [0.22, 0.08, 7.2], rotation: [-0.02, 0.06, 0.0] },
          { position: [-0.16, -0.10, 6.7], rotation: [0.02, 0.10, -0.01] }
        ]
      : [
          { position: [0.0, 0.0, 8.0], rotation: [0.0, 0.0, 0.0] },
          { position: [0.42, 0.20, 7.35], rotation: [-0.03, 0.08, 0.01] },
          { position: [-0.28, -0.18, 6.6], rotation: [0.03, -0.09, -0.01] },
          { position: [0.14, 0.12, 5.95], rotation: [-0.02, 0.14, 0.0] }
        ];

    const keyStates = keyStateConfig.map((state) => {
      const position = new THREE.Vector3(state.position[0], state.position[1], state.position[2]);
      const rotationEuler = new THREE.Euler(state.rotation[0], state.rotation[1], state.rotation[2], 'XYZ');
      const quaternion = new THREE.Quaternion().setFromEuler(rotationEuler);
      return { position, quaternion };
    });

    return {
      target: 0,
      current: 0,
      previous: 0,
      delta: 0,
      smoothing: isMobile ? 0.08 : 0.055,
      keyStates,
      mousePositionInfluence: isMobile ? 0.28 : 0.34,
      mouseRotationInfluence: isMobile ? 0.012 : 0.018,
      mobile: isMobile,
      useGsapChoreography: false
    };
  }

  initGsapCameraChoreography() {
    if (this.scrollNavigation.mobile) return;
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    const sections = this.narrativeController.sections
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    const shots = this.narrativeController.shots;
    const sectionCount = Math.min(sections.length, shots.length);
    if (sectionCount < 2) return;

    const first = shots[0];
    this.gsapRig.x = first.position.x;
    this.gsapRig.y = first.position.y;
    this.gsapRig.z = first.position.z;
    this.gsapRig.qx = first.quaternion.x;
    this.gsapRig.qy = first.quaternion.y;
    this.gsapRig.qz = first.quaternion.z;
    this.gsapRig.qw = first.quaternion.w;
    this.gsapRig.motifDepth = first.motifDepth;
    this.gsapRig.motifScale = first.motifScale;
    this.gsapRig.lightMix = first.lightMix;
    this.gsapRig.transitionMix = first.transitionMix;
    this.gsapRig.artifactPhase = first.artifactPhase;
    this.scrollNavigation.useGsapChoreography = true;

    for (let index = 0; index < sectionCount - 1; index++) {
      const section = sections[index];
      const fromShot = shots[index];
      const toShot = shots[index + 1];
      const depthOvershoot = 0.22 + index * 0.03;
      const settleDuration = 0.24;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom top',
          scrub: 1.2,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            this.narrativeController.progress = (index + self.progress) / Math.max(sectionCount - 1, 1);
            this.narrativeController.currentState = index + (self.progress > 0.55 ? 1 : 0);
          }
        }
      });

      // Shot arc: strong camera authority with power4 and expo accents.
      tl.to(this.gsapRig, {
        x: toShot.position.x,
        y: toShot.position.y,
        qx: toShot.quaternion.x,
        qy: toShot.quaternion.y,
        qz: toShot.quaternion.z,
        qw: toShot.quaternion.w,
        motifDepth: toShot.motifDepth,
        motifScale: toShot.motifScale,
        lightMix: toShot.lightMix,
        artifactPhase: toShot.artifactPhase,
        duration: 0.74,
        ease: 'power4.inOut',
        immediateRender: false
      }, 0);

      tl.to(this.gsapRig, {
        z: toShot.position.z + depthOvershoot,
        duration: 0.68,
        ease: 'power4.out',
        immediateRender: false
      }, 0);

      tl.to(this.gsapRig, {
        z: toShot.position.z,
        duration: settleDuration,
        ease: 'expo.out',
        immediateRender: false
      }, 0.68);

      // Narrative transition channel for shader crossfade and dissolve/assemble.
      tl.to(this.gsapRig, {
        transitionMix: (fromShot.transitionMix + toShot.transitionMix) * 0.5 + 0.05,
        duration: 0.5,
        ease: 'power2.out',
        immediateRender: false
      }, 0.16);

      tl.to(this.gsapRig, {
        transitionMix: toShot.transitionMix,
        duration: 0.4,
        ease: 'expo.out',
        immediateRender: false
      }, 0.62);

      this.gsapCameraTimelines.push(tl);
      this.gsapScrollTriggers.push(tl.scrollTrigger);
    }
  }

  handleScrollProgress() {
    const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    const normalized = window.scrollY / maxScroll;
    this.scrollNavigation.target = Math.min(Math.max(normalized, 0), 1);
  }

  updateScrollNavigation() {
    if (this.scrollNavigation.useGsapChoreography) return;
    const nav = this.scrollNavigation;
    nav.previous = nav.current;
    nav.current += (nav.target - nav.current) * nav.smoothing;
    nav.delta = nav.current - nav.previous;
  }

  sampleCameraState(progress) {
    const nav = this.scrollNavigation;
    const states = nav.keyStates;
    const segmentCount = states.length - 1;
    const clamped = Math.min(Math.max(progress, 0), 1);
    const scaled = clamped * segmentCount;
    const index = Math.min(Math.floor(scaled), segmentCount - 1);
    const localT = scaled - index;

    const from = states[index];
    const to = states[index + 1];

    this.cameraTargetPosition.lerpVectors(from.position, to.position, localT);
    this.cameraTargetQuaternion.copy(from.quaternion).slerp(to.quaternion, localT);
  }

  updateCameraFromScroll() {
    if (!STATE.camera3D) return;

    const nav = this.scrollNavigation;

    if (nav.useGsapChoreography) {
      STATE.camera3D.position.x = this.gsapRig.x + STATE.mouse3D.x * nav.mousePositionInfluence;
      STATE.camera3D.position.y = this.gsapRig.y + STATE.mouse3D.y * nav.mousePositionInfluence;
      STATE.camera3D.position.z = this.gsapRig.z;

      this.rigQuaternion.set(this.gsapRig.qx, this.gsapRig.qy, this.gsapRig.qz, this.gsapRig.qw).normalize();
      this.mouseRotationEuler.set(
        -STATE.mouse3D.y * nav.mouseRotationInfluence,
        STATE.mouse3D.x * (nav.mouseRotationInfluence * 1.2),
        STATE.mouse3D.x * (nav.mouseRotationInfluence * 0.2)
      );
      this.mouseRotationQuaternion.setFromEuler(this.mouseRotationEuler);
      STATE.camera3D.quaternion.copy(this.rigQuaternion).multiply(this.mouseRotationQuaternion);
      return;
    }

    this.sampleCameraState(nav.current);

    STATE.camera3D.position.x = this.cameraTargetPosition.x + STATE.mouse3D.x * nav.mousePositionInfluence;
    STATE.camera3D.position.y = this.cameraTargetPosition.y + STATE.mouse3D.y * nav.mousePositionInfluence;
    STATE.camera3D.position.z = this.cameraTargetPosition.z;

    this.mouseRotationEuler.set(
      -STATE.mouse3D.y * nav.mouseRotationInfluence,
      STATE.mouse3D.x * (nav.mouseRotationInfluence * 1.2),
      STATE.mouse3D.x * (nav.mouseRotationInfluence * 0.2)
    );
    this.mouseRotationQuaternion.setFromEuler(this.mouseRotationEuler);
    STATE.camera3D.quaternion.copy(this.cameraTargetQuaternion).multiply(this.mouseRotationQuaternion);
  }

  updateLightingFromScroll() {
    if (!this.keyLight || !this.fillLight || !this.rimLight) return;

    const progress = this.scrollNavigation.useGsapChoreography ? this.gsapRig.lightMix : this.scrollNavigation.current;
    const transitionMix = this.scrollNavigation.useGsapChoreography ? this.gsapRig.transitionMix : progress;
    this.keyLight.intensity = (this.scrollNavigation.mobile ? 1.35 : 1.85) * (1 + progress * 0.16 + transitionMix * 0.08);
    this.fillLight.intensity = (this.scrollNavigation.mobile ? 0.55 : 0.82) * (1 - progress * 0.08);
    this.rimLight.intensity = (this.scrollNavigation.mobile ? 0.7 : 1.1) * (1 + progress * 0.2 + transitionMix * 0.12);

    this.fillLight.color.copy(this.fillColorFrom).lerp(this.fillColorTo, progress);
    this.rimLight.color.copy(this.rimColorFrom).lerp(this.rimColorTo, progress);

    if (this.mouseLight) {
      this.mouseLight.intensity = (this.scrollNavigation.mobile ? 0.85 : 1.2) * (1 + progress * 0.12);
    }
  }

  updateAtmosphereFromScroll() {
    if (!STATE.scene3D.fog) return;

    const progress = this.scrollNavigation.useGsapChoreography ? this.gsapRig.lightMix : this.scrollNavigation.current;
    const transitionMix = this.scrollNavigation.useGsapChoreography ? this.gsapRig.transitionMix : progress;
    STATE.scene3D.fog.near = 8 - progress * 1.8 - transitionMix * 0.4;
    STATE.scene3D.fog.far = 20 - progress * 4.6 - transitionMix * 1.2;
    this.fogColorMixed.copy(this.fogColorFrom).lerp(this.fogColorTo, progress);
    STATE.scene3D.fog.color.copy(this.fogColorMixed);
  }

  updateTransitionEffects() {
    if (!this.transitionField || !this.transitionField.material) return;
    const material = this.transitionField.material;
    const mix = this.scrollNavigation.useGsapChoreography ? this.gsapRig.transitionMix : this.scrollNavigation.current;
    material.uniforms.u_time.value = this.time;
    material.uniforms.u_mix.value = mix;
    this.transitionColorMixed.copy(this.transitionColorFrom).lerp(this.transitionColorTo, mix);
    material.uniforms.u_color_b.value.copy(this.transitionColorMixed);

    // Geometry dissolve/assemble curve (cached materials, no per-frame traversal).
    const dissolve = 0.62 + (Math.sin(mix * Math.PI * 2) * 0.12);
    for (let i = 0; i < this.motifMaterialCache.length; i++) {
      const mat = this.motifMaterialCache[i];
      if (!mat) continue;
      mat.opacity = Math.min(1, Math.max(0.08, dissolve));
    }
  }

  updateHeroArtifact() {
    const artifact = STATE.heroObjects.artifact;
    if (!artifact) return;
    const phase = this.scrollNavigation.useGsapChoreography ? this.gsapRig.artifactPhase : this.scrollNavigation.current;
    const nodes = artifact.userData.nodes;
    artifact.position.y = artifact.userData.baseY + Math.sin(this.time * 0.35) * 0.04 + (phase - 0.5) * 0.18;
    artifact.position.z = artifact.userData.baseZ - phase * 0.7;
    artifact.scale.setScalar(artifact.userData.baseScale * (1 + phase * 0.24));
    artifact.rotation.y += 0.0016 + phase * 0.0014;
    artifact.rotation.x = Math.sin(this.time * 0.24) * 0.06;

    if (nodes && nodes.halo) {
      nodes.halo.rotation.z += 0.004 + phase * 0.002;
      nodes.halo.material.emissiveIntensity = 0.18 + phase * 0.22;
    }
    if (nodes && nodes.shell) {
      nodes.shell.rotation.y -= 0.001 + phase * 0.001;
      nodes.shell.material.opacity = 0.22 + phase * 0.12;
    }
    if (nodes && nodes.core) {
      nodes.core.material.envMapIntensity = 1.0 + phase * 0.5;
    }
  }

  updateDepthComposition() {
    const progress = this.scrollNavigation.useGsapChoreography ? this.gsapRig.motifDepth : this.scrollNavigation.current;

    for (let i = 0; i < STATE.heroObjects.depthLayers.foreground.length; i++) {
      const mesh = STATE.heroObjects.depthLayers.foreground[i];
      const data = mesh.userData;
      mesh.position.x = data.basePosition.x + Math.sin(this.time * data.drift) * 0.35;
      mesh.position.y = data.basePosition.y + Math.cos(this.time * data.drift * 1.4) * 0.2;
      mesh.position.z = data.basePosition.z - progress * data.depthBias;
      mesh.rotation.x += 0.0008;
      mesh.rotation.y += 0.0011;
    }

    for (let i = 0; i < STATE.heroObjects.depthLayers.midground.length; i++) {
      const anchor = STATE.heroObjects.depthLayers.midground[i];
      const data = anchor.userData;
      anchor.position.x = data.basePosition.x + Math.sin(this.time * data.drift) * 0.18;
      anchor.position.y = data.basePosition.y + Math.cos(this.time * data.drift * 1.2) * 0.1;
      anchor.position.z = data.basePosition.z - progress * (0.9 + data.depthBias);
      anchor.rotation.y += 0.001 + i * 0.0004;
    }

    const flowField = STATE.heroObjects.depthLayers.background[0];
    if (flowField) {
      const positions = flowField.userData.positions;
      const phases = flowField.userData.phases;
      const m = this.instanceMatrixTemp;
      for (let i = 0; i < phases.length; i++) {
        const idx = i * 3;
        const x = positions[idx] + Math.sin(this.time * 0.38 + phases[i]) * 0.05;
        const y = positions[idx + 1] + Math.cos(this.time * 0.42 + phases[i]) * 0.04;
        const z = positions[idx + 2] + progress * 0.55;
        m.setPosition(x, y, z);
        flowField.setMatrixAt(i, m);
      }
      flowField.instanceMatrix.needsUpdate = true;
    }
  }

  createIdentityMotif(family, options = {}) {
    const create = this.identityGenerator[family];
    if (!create) return new THREE.Group();
    return create(options);
  }

  createSegmentedRingMotif(options = {}) {
    const style = this.identityStyle;
    const group = new THREE.Group();
    const scale = (options.scale || 1) * style.scaleRatios.ring;
    const segments = style.performanceReduced ? 6 : 10;
    const radius = 0.48 * scale;
    const thickness = style.performanceReduced ? 0.045 : 0.055;
    const segmentArc = (Math.PI * 2 / segments) * 0.68;

    const segmentGeometry = new THREE.TorusGeometry(radius, thickness, 10, 34, segmentArc);
    const segmentMaterial = this.materialPresets.brushedMetal({
      color: style.palette.primary,
      roughness: style.performanceReduced ? 0.3 : 0.23,
      envMapIntensity: style.performanceReduced ? 0.9 : 1.45
    });

    const ring = new THREE.InstancedMesh(segmentGeometry, segmentMaterial, segments);
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < segments; i++) {
      matrix.makeRotationY((i / segments) * Math.PI * 2);
      ring.setMatrixAt(i, matrix);
    }
    ring.instanceMatrix.needsUpdate = true;
    group.add(ring);

    const coreGeometry = new THREE.TorusGeometry(radius * 0.58, thickness * 0.25, 8, 32);
    const coreMaterial = this.materialPresets.emissiveAccent({
      color: style.palette.secondary,
      emissive: style.palette.accent,
      emissiveIntensity: style.performanceReduced ? 0.2 : 0.3,
      opacity: 0.82
    });
    group.add(new THREE.Mesh(coreGeometry, coreMaterial));

    group.userData.family = 'segmentedRing';
    return group;
  }

  createLatticeWireframeMotif(options = {}) {
    const style = this.identityStyle;
    const group = new THREE.Group();
    const scale = (options.scale || 1) * style.scaleRatios.lattice;
    const size = 0.9 * scale;

    const frameGeometry = new THREE.BoxGeometry(size, size, size);
    const frameEdges = new THREE.EdgesGeometry(frameGeometry);
    const frame = new THREE.LineSegments(
      frameEdges,
      new THREE.LineBasicMaterial({
        color: style.palette.secondary,
        transparent: true,
        opacity: 0.45
      })
    );
    group.add(frame);

    const strutGeometry = new THREE.CylinderGeometry(0.015 * scale, 0.015 * scale, size * 1.18, 6);
    const strutMaterial = this.materialPresets.brushedMetal({
      color: style.palette.primary,
      roughness: style.performanceReduced ? 0.3 : 0.22
    });
    const struts = new THREE.InstancedMesh(strutGeometry, strutMaterial, 3);
    const matrix = new THREE.Matrix4();
    matrix.identity();
    struts.setMatrixAt(0, matrix);
    matrix.makeRotationZ(Math.PI * 0.5);
    struts.setMatrixAt(1, matrix);
    matrix.makeRotationX(Math.PI * 0.5);
    struts.setMatrixAt(2, matrix);
    struts.instanceMatrix.needsUpdate = true;
    group.add(struts);

    const nucleus = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.16 * scale, 0),
      this.materialPresets.glass({
        color: style.palette.accent,
        opacity: 0.2,
        transmission: style.performanceReduced ? 0.78 : 0.9
      })
    );
    group.add(nucleus);

    group.userData.family = 'latticeWireframe';
    return group;
  }

  createOrbitalNodeClusterMotif(options = {}) {
    const style = this.identityStyle;
    const group = new THREE.Group();
    const scale = (options.scale || 1) * style.scaleRatios.cluster;
    const nodeCount = style.performanceReduced ? 6 : 11;
    const radius = 0.56 * scale;

    const orbitRing = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.012 * scale, 6, 40),
      this.materialPresets.brushedMetal({
        color: style.palette.accent,
        roughness: style.performanceReduced ? 0.34 : 0.26,
        transparent: true,
        opacity: 0.55
      })
    );
    group.add(orbitRing);

    const nodeGeometry = new THREE.SphereGeometry(0.055 * scale, style.performanceReduced ? 8 : 12, style.performanceReduced ? 8 : 12);
    const nodeMaterial = this.materialPresets.emissiveAccent({
      color: style.palette.secondary,
      emissive: style.palette.primary,
      emissiveIntensity: style.performanceReduced ? 0.2 : 0.32,
      opacity: 0.9
    });
    const nodes = new THREE.InstancedMesh(nodeGeometry, nodeMaterial, nodeCount);
    const matrix = new THREE.Matrix4();

    const linkPoints = [];
    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2;
      const yOffset = Math.sin(i * 1.7) * 0.08 * scale;
      const pos = new THREE.Vector3(
        Math.cos(angle) * radius,
        yOffset,
        Math.sin(angle) * radius
      );
      matrix.setPosition(pos);
      nodes.setMatrixAt(i, matrix);
      linkPoints.push(pos.x, pos.y, pos.z);
    }
    nodes.instanceMatrix.needsUpdate = true;
    group.add(nodes);

    const linksGeometry = new THREE.BufferGeometry();
    linksGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linkPoints, 3));
    const links = new THREE.LineLoop(
      linksGeometry,
      new THREE.LineBasicMaterial({
        color: style.palette.primary,
        transparent: true,
        opacity: 0.3
      })
    );
    group.add(links);

    group.userData.family = 'orbitalNodeCluster';
    return group;
  }

  createDataFlowArcMotif(options = {}) {
    const style = this.identityStyle;
    const group = new THREE.Group();
    const scale = (options.scale || 1) * style.scaleRatios.arc;
    const arcCount = style.performanceReduced ? 2 : 4;

    for (let i = 0; i < arcCount; i++) {
      const ratio = i / Math.max(arcCount - 1, 1);
      const radius = (0.33 + ratio * 0.44) * scale;
      const arcGeometry = new THREE.TorusGeometry(
        radius,
        0.018 * scale,
        8,
        style.performanceReduced ? 26 : 38,
        Math.PI * (style.performanceReduced ? 0.8 : 1.02)
      );
      const arcMaterial = this.materialPresets.brushedMetal({
        color: i % 2 === 0 ? style.palette.primary : style.palette.secondary,
        roughness: style.performanceReduced ? 0.31 : 0.22,
        transparent: true,
        opacity: 0.66
      });
      const arc = new THREE.Mesh(arcGeometry, arcMaterial);
      arc.rotation.set(
        0.35 + ratio * 0.3,
        ratio * Math.PI * 0.66,
        0.18 + ratio * 0.45
      );
      group.add(arc);
    }

    const flowNodes = style.performanceReduced ? 4 : 7;
    const flowNodeGeometry = new THREE.SphereGeometry(0.03 * scale, 8, 8);
    const flowNodeMaterial = this.materialPresets.emissiveAccent({
      color: style.palette.accent,
      emissive: style.palette.accent,
      emissiveIntensity: style.performanceReduced ? 0.18 : 0.26,
      opacity: 0.88
    });
    const dataNodes = new THREE.InstancedMesh(flowNodeGeometry, flowNodeMaterial, flowNodes);
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < flowNodes; i++) {
      const t = i / flowNodes;
      matrix.setPosition(
        Math.cos(t * Math.PI * 2) * 0.32 * scale,
        (t - 0.5) * 0.55 * scale,
        Math.sin(t * Math.PI * 2) * 0.22 * scale
      );
      dataNodes.setMatrixAt(i, matrix);
    }
    dataNodes.instanceMatrix.needsUpdate = true;
    group.add(dataNodes);

    group.userData.family = 'dataFlowArc';
    return group;
  }

  createHeroArtifact() {
    const group = new THREE.Group();
    const isMobile = CONFIG.scene3D.performanceMode;
    const baseScale = isMobile ? 0.86 : 1.0;

    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.44 * baseScale, isMobile ? 0 : 1),
      this.materialPresets.glass({
        color: this.identityStyle.palette.primary,
        transmission: isMobile ? 0.82 : 0.94,
        thickness: isMobile ? 0.35 : 0.72,
        opacity: isMobile ? 0.18 : 0.24,
        envMapIntensity: isMobile ? 0.85 : 1.25
      })
    );
    group.add(core);

    const shell = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.68 * baseScale, 0),
      this.materialPresets.brushedMetal({
        color: this.identityStyle.palette.secondary,
        transparent: true,
        opacity: 0.28,
        roughness: isMobile ? 0.36 : 0.28
      })
    );
    group.add(shell);

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.84 * baseScale, 0.04 * baseScale, 12, isMobile ? 40 : 64),
      this.materialPresets.emissiveAccent({
        color: this.identityStyle.palette.accent,
        emissive: this.identityStyle.palette.accent,
        emissiveIntensity: isMobile ? 0.18 : 0.26,
        transparent: true,
        opacity: 0.8
      })
    );
    halo.rotation.x = Math.PI * 0.5;
    group.add(halo);

    const strutGeometry = new THREE.CylinderGeometry(0.01 * baseScale, 0.01 * baseScale, 1.3 * baseScale, 6);
    const strutMaterial = this.materialPresets.brushedMetal({
      color: this.identityStyle.palette.primary,
      roughness: isMobile ? 0.34 : 0.24,
      transparent: true,
      opacity: 0.5
    });
    const struts = new THREE.InstancedMesh(strutGeometry, strutMaterial, 4);
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < 4; i++) {
      matrix.makeRotationY((Math.PI * 0.5) * i);
      matrix.multiply(new THREE.Matrix4().makeRotationZ(Math.PI * 0.2));
      struts.setMatrixAt(i, matrix);
    }
    struts.instanceMatrix.needsUpdate = true;
    group.add(struts);

    group.position.set(0, 0.05, -0.2);
    group.userData = {
      baseY: group.position.y,
      baseZ: group.position.z,
      baseScale: 1,
      nodes: { core, shell, halo, struts }
    };

    STATE.scene3D.add(group);
    STATE.heroObjects.artifact = group;
  }

  createDepthComposition() {
    const isMobile = CONFIG.scene3D.performanceMode;

    // Foreground intrusion meshes
    const intrusionCount = isMobile ? 2 : 3;
    for (let i = 0; i < intrusionCount; i++) {
      const intrusion = new THREE.Mesh(
        new THREE.TorusKnotGeometry(0.3 + i * 0.08, 0.06, isMobile ? 64 : 96, isMobile ? 10 : 14),
        this.materialPresets.brushedMetal({
          color: i % 2 ? this.identityStyle.palette.secondary : this.identityStyle.palette.primary,
          transparent: true,
          opacity: 0.22,
          roughness: isMobile ? 0.38 : 0.3
        })
      );
      intrusion.position.set(
        i % 2 ? 2.8 + i * 0.6 : -2.9 - i * 0.45,
        -1.1 + i * 0.6,
        1.2 + i * 0.5
      );
      intrusion.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      intrusion.userData = {
        layer: 'foreground',
        basePosition: intrusion.position.clone(),
        drift: 0.004 + i * 0.001,
        depthBias: 0.25 + i * 0.08
      };
      STATE.scene3D.add(intrusion);
      STATE.heroObjects.depthLayers.foreground.push(intrusion);
    }

    // Midground anchors
    const anchorCount = isMobile ? 2 : 3;
    for (let i = 0; i < anchorCount; i++) {
      const anchor = this.createIdentityMotif(i % 2 ? 'latticeWireframe' : 'segmentedRing', { scale: 0.72 + i * 0.12 });
      anchor.position.set(
        i % 2 ? -1.8 - i * 0.5 : 1.7 + i * 0.45,
        -0.35 + i * 0.5,
        -2.8 - i * 0.9
      );
      anchor.userData = {
        layer: 'midground',
        basePosition: anchor.position.clone(),
        drift: 0.0022 + i * 0.0008,
        depthBias: 0.18 + i * 0.06
      };
      STATE.scene3D.add(anchor);
      STATE.heroObjects.depthLayers.midground.push(anchor);
    }

    // Background flow field (instanced)
    const flowCount = isMobile ? 42 : 88;
    const flowGeo = new THREE.SphereGeometry(0.03, 8, 8);
    const flowMat = this.materialPresets.emissiveAccent({
      color: this.identityStyle.palette.accent,
      emissive: this.identityStyle.palette.primary,
      emissiveIntensity: isMobile ? 0.14 : 0.2,
      opacity: 0.72
    });
    const flowField = new THREE.InstancedMesh(flowGeo, flowMat, flowCount);
    const flowPositions = new Float32Array(flowCount * 3);
    const flowPhases = new Float32Array(flowCount);
    const instMatrix = new THREE.Matrix4();
    for (let i = 0; i < flowCount; i++) {
      const col = (i % 11) - 5;
      const row = Math.floor(i / 11);
      const x = col * 0.42 + (Math.random() - 0.5) * 0.08;
      const y = (row - 4) * 0.24 + (Math.random() - 0.5) * 0.06;
      const z = -7.6 - row * 0.16 - Math.random() * 0.4;
      flowPositions[i * 3 + 0] = x;
      flowPositions[i * 3 + 1] = y;
      flowPositions[i * 3 + 2] = z;
      flowPhases[i] = Math.random() * Math.PI * 2;
      instMatrix.setPosition(x, y, z);
      flowField.setMatrixAt(i, instMatrix);
    }
    flowField.instanceMatrix.needsUpdate = true;
    flowField.userData = {
      layer: 'background',
      positions: flowPositions,
      phases: flowPhases
    };
    STATE.scene3D.add(flowField);
    STATE.heroObjects.depthLayers.background.push(flowField);
  }

  createTransitionField() {
    const geometry = new THREE.PlaneGeometry(14, 14);
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        u_time: { value: 0 },
        u_mix: { value: 0 },
        u_color_a: { value: this.transitionColorFrom.clone() },
        u_color_b: { value: this.transitionColorTo.clone() }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float u_time;
        uniform float u_mix;
        uniform vec3 u_color_a;
        uniform vec3 u_color_b;

        float hash(vec2 p){
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f*f*(3.0-2.0*f);
          return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
                     mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
        }

        void main() {
          vec2 uv = vUv * 2.0 - 1.0;
          float n = noise(vUv * 4.0 + u_time * 0.06);
          float band = smoothstep(0.15, 0.85, abs(uv.y) + n * 0.35);
          vec3 col = mix(u_color_a, u_color_b, clamp(u_mix, 0.0, 1.0));
          float alpha = (1.0 - band) * (0.05 + u_mix * 0.2);
          gl_FragColor = vec4(col, alpha);
        }
      `
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 0, -4.6);
    mesh.renderOrder = 5;
    mesh.userData = { layer: 'transition' };
    STATE.scene3D.add(mesh);
    this.transitionField = mesh;
  }

  collectMotifMaterials() {
    this.motifMaterialCache.length = 0;
    const collect = (obj) => {
      if (!obj || !obj.traverse) return;
      obj.traverse((node) => {
        if (!node.material) return;
        if (Array.isArray(node.material)) {
          node.material.forEach((mat) => {
            if (!mat) return;
            mat.transparent = true;
            this.motifMaterialCache.push(mat);
          });
          return;
        }
        node.material.transparent = true;
        this.motifMaterialCache.push(node.material);
      });
    };

    STATE.heroObjects.geometricShapes.forEach(collect);
    STATE.heroObjects.depthLayers.midground.forEach(collect);
  }

  setupEnvironmentLighting() {
    if (HeroScene3D.sharedEnvironmentMap) {
      STATE.scene3D.environment = HeroScene3D.sharedEnvironmentMap;
      return;
    }

    const pmremGenerator = new THREE.PMREMGenerator(STATE.renderer3D);
    pmremGenerator.compileCubemapShader();

    const applyTexture = (texture) => {
      HeroScene3D.sharedEnvironmentMap = texture;
      STATE.scene3D.environment = texture;
    };

    // Mobile fallback: local procedural env map, zero network fetch.
    if (CONFIG.scene3D.performanceMode) {
      const fallback = this.createProceduralEnvironment(pmremGenerator);
      applyTexture(fallback);
      pmremGenerator.dispose();
      return;
    }

    // Desktop: lightweight CDN cube map + PMREM for proper specular response.
    const cubeLoader = new THREE.CubeTextureLoader();
    cubeLoader.setPath('https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/cube/Bridge2/');
    cubeLoader.load(
      ['posx.jpg', 'negx.jpg', 'posy.jpg', 'negy.jpg', 'posz.jpg', 'negz.jpg'],
      (cubeTexture) => {
        cubeTexture.encoding = THREE.sRGBEncoding;
        const envTexture = pmremGenerator.fromCubemap(cubeTexture).texture;
        cubeTexture.dispose();
        applyTexture(envTexture);
        pmremGenerator.dispose();
      },
      undefined,
      () => {
        const fallback = this.createProceduralEnvironment(pmremGenerator);
        applyTexture(fallback);
        pmremGenerator.dispose();
      }
    );
  }

  createProceduralEnvironment(pmremGenerator) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;

    const context = canvas.getContext('2d');
    const sky = context.createLinearGradient(0, 0, 0, canvas.height);
    sky.addColorStop(0, '#9bb5ff');
    sky.addColorStop(0.45, '#4a5ea3');
    sky.addColorStop(1, '#10111a');
    context.fillStyle = sky;
    context.fillRect(0, 0, canvas.width, canvas.height);

    const hotspot = context.createRadialGradient(92, 16, 2, 92, 16, 34);
    hotspot.addColorStop(0, 'rgba(255,255,255,0.95)');
    hotspot.addColorStop(1, 'rgba(255,255,255,0)');
    context.fillStyle = hotspot;
    context.fillRect(0, 0, canvas.width, canvas.height);

    const envTexture = new THREE.CanvasTexture(canvas);
    envTexture.encoding = THREE.sRGBEncoding;
    envTexture.mapping = THREE.EquirectangularReflectionMapping;

    const processed = pmremGenerator.fromEquirectangular(envTexture).texture;
    envTexture.dispose();

    return processed;
  }

  setupLighting() {
    const ambient = new THREE.HemisphereLight(0x8fa3ff, 0x0b0c12, 0.34);
    STATE.scene3D.add(ambient);
    STATE.heroObjects.lights.push(ambient);
    this.ambientLight = ambient;

    // Cinematic 3-point rig (key, fill, rim)
    const keyLight = new THREE.DirectionalLight(0xffffff, CONFIG.scene3D.performanceMode ? 1.35 : 1.85);
    keyLight.position.set(5.5, 4.8, 6.8);
    STATE.scene3D.add(keyLight);
    STATE.heroObjects.lights.push(keyLight);
    this.keyLight = keyLight;

    const fillLight = new THREE.DirectionalLight(0x7f95ff, CONFIG.scene3D.performanceMode ? 0.55 : 0.82);
    fillLight.position.set(-6.5, 2.4, 2.2);
    STATE.scene3D.add(fillLight);
    STATE.heroObjects.lights.push(fillLight);
    this.fillLight = fillLight;

    const rimLight = new THREE.DirectionalLight(0xb48cff, CONFIG.scene3D.performanceMode ? 0.7 : 1.1);
    rimLight.position.set(0.5, 3.2, -6.8);
    STATE.scene3D.add(rimLight);
    STATE.heroObjects.lights.push(rimLight);
    this.rimLight = rimLight;
    
    // Dynamic point light that follows mouse
    const mouseLight = new THREE.PointLight(0x6b83ff, CONFIG.scene3D.performanceMode ? 0.85 : 1.2, 12);
    mouseLight.position.set(0, 0, 3);
    STATE.scene3D.add(mouseLight);
    STATE.heroObjects.lights.push(mouseLight);
    this.mouseLight = mouseLight;

    if (!CONFIG.scene3D.performanceMode) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(512, 512);
      keyLight.shadow.bias = -0.0004;
    }
  }

  createSmartphone() {
    // Create modern smartphone-style centerpiece
    const group = new THREE.Group();
    
    // Main body (sleek rounded rectangle)
    const bodyGeometry = new THREE.BoxGeometry(1.4, 3, 0.18);
    const bodyMaterial = this.materialPresets.brushedMetal({
      color: 0x1a1f2b,
      clearcoat: 0.58,
      clearcoatRoughness: 0.2
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = !CONFIG.scene3D.performanceMode;
    group.add(body);
    
    // Screen (glowing surface)
    const screenGeometry = new THREE.PlaneGeometry(1.25, 2.7);
    const screenMaterial = this.materialPresets.emissiveAccent({
      color: 0x1f2442,
      emissive: 0x7a8bff,
      emissiveIntensity: CONFIG.scene3D.performanceMode ? 0.35 : 0.55,
      metalness: 0.1,
      roughness: 0.42,
      side: THREE.DoubleSide
    });
    const screen = new THREE.Mesh(screenGeometry, screenMaterial);
    screen.position.z = 0.091;
    group.add(screen);
    
    // Edge glow (wireframe accent)
    const edgeGeometry = new THREE.EdgesGeometry(bodyGeometry);
    const edgeMaterial = new THREE.LineBasicMaterial({ 
      color: 0x6366f1,
      transparent: true,
      opacity: 0.6,
      linewidth: 2
    });
    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    group.add(edges);
    
    // Floating UI indicators (small abstract elements)
    for (let i = 0; i < 3; i++) {
      const indicatorGeometry = new THREE.CircleGeometry(0.08, 16);
      const indicatorMaterial = this.materialPresets.emissiveAccent({
        color: 0x34418d,
        emissive: 0x90a2ff,
        emissiveIntensity: CONFIG.scene3D.performanceMode ? 0.28 : 0.4,
        transparent: true,
        opacity: 0.65
      });
      const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
      indicator.position.set(
        Math.random() * 0.8 - 0.4,
        Math.random() * 2 - 1,
        0.15
      );
      group.add(indicator);
    }
    
    // Position the smartphone centerpiece
    group.position.set(0, 0, 0);
    STATE.scene3D.add(group);
    STATE.heroObjects.smartphone = group;
  }

  createGeometricShapes() {
    const identityFamilies = CONFIG.scene3D.performanceMode
      ? ['segmentedRing', 'orbitalNodeCluster', 'dataFlowArc', 'latticeWireframe']
      : ['segmentedRing', 'latticeWireframe', 'orbitalNodeCluster', 'dataFlowArc', 'segmentedRing', 'dataFlowArc'];

    const count = Math.min(identityFamilies.length, CONFIG.scene3D.performanceMode ? 4 : CONFIG.scene3D.objectCount);
    const spacing = this.identityStyle.spacing;

    for (let i = 0; i < count; i++) {
      const family = identityFamilies[i % identityFamilies.length];
      const scale = 0.9 + (i % 3) * 0.16;
      const motif = this.createIdentityMotif(family, { scale, index: i });

      // Position motifs in the existing orbit field (keeps current animation hooks intact).
      const angle = (i / count) * Math.PI * 2;
      const radius = spacing.orbitBase + Math.random() * spacing.orbitVariance;
      const height = (Math.random() - 0.5) * (spacing.motifGap * 2.0);

      motif.position.set(
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius - 2
      );

      motif.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      motif.userData = {
        family,
        baseScale: motif.scale.x || 1,
        baseHeight: height,
        baseOrbitRadius: radius,
        depthOffset: (Math.random() - 0.5) * (this.scrollNavigation.mobile ? 0.6 : 1.2),
        scrollScaleGain: 0.08 + Math.random() * 0.08,
        scrollDriftSpeed: 0.002 + Math.random() * 0.003,
        orbitRadius: radius,
        orbitAngle: angle,
        orbitSpeed: 0.0002 + Math.random() * 0.0003,
        rotationSpeed: {
          x: (Math.random() - 0.5) * 0.008,
          y: (Math.random() - 0.5) * 0.008,
          z: (Math.random() - 0.5) * 0.008
        },
        floatOffset: Math.random() * Math.PI * 2,
        floatAmplitude: 0.22 + Math.random() * 0.32
      };

      STATE.scene3D.add(motif);
      STATE.heroObjects.geometricShapes.push(motif);
    }
  }

  createGlassPanels() {
    // Create floating glass UI panels with subtle reflections
    const panelConfigs = [
      { width: 1.8, height: 1.2, x: -3, y: 1.5, z: -3, rotation: 0.3 },
      { width: 1.5, height: 1.0, x: 3.5, y: -1, z: -4, rotation: -0.2 },
      { width: 2.0, height: 0.8, x: -2.5, y: -2, z: -2.5, rotation: 0.15 }
    ];
    
    if (CONFIG.scene3D.performanceMode) {
      panelConfigs.splice(2); // Only 2 panels on mobile
    }
    
    panelConfigs.forEach((config, index) => {
      // Glass panel geometry
      const geometry = new THREE.PlaneGeometry(config.width, config.height);
      
      // Glass material with reflection
      const material = this.materialPresets.glass({
        color: 0x7b8cff,
        opacity: CONFIG.scene3D.performanceMode ? 0.1 : 0.14,
        side: THREE.DoubleSide
      });
      
      const panel = new THREE.Mesh(geometry, material);
      panel.position.set(config.x, config.y, config.z);
      panel.rotation.y = config.rotation;
      
      // Add glowing border
      const borderGeometry = new THREE.EdgesGeometry(geometry);
      const borderMaterial = new THREE.LineBasicMaterial({
        color: 0x6366f1,
        transparent: true,
        opacity: 0.3
      });
      const border = new THREE.LineSegments(borderGeometry, borderMaterial);
      panel.add(border);
      
      // Animation metadata
      panel.userData = {
        floatOffset: index * Math.PI * 0.7,
        floatAmplitude: 0.2 + Math.random() * 0.2,
        floatSpeed: 0.001 + Math.random() * 0.0005
      };
      
      STATE.scene3D.add(panel);
      STATE.heroObjects.glassPanels.push(panel);
    });
  }

  setupEventListeners() {
    // Mouse movement for parallax
    document.addEventListener('mousemove', (e) => {
      // Normalize mouse coordinates (-1 to 1)
      STATE.mouse3D.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      STATE.mouse3D.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    // Scroll progress for cinematic scene navigation
    window.addEventListener('scroll', () => this.handleScrollProgress(), { passive: true });
    
    // Resize handler
    window.addEventListener('resize', () => this.handleResize());
  }

  handleResize() {
    const width = this.canvas.offsetWidth;
    const height = this.canvas.offsetHeight;
    
    STATE.camera3D.aspect = width / height;
    STATE.camera3D.updateProjectionMatrix();
    
    STATE.renderer3D.setSize(width, height);
    STATE.renderer3D.setPixelRatio(Math.min(window.devicePixelRatio, CONFIG.scene3D.performanceMode ? 1 : 2));
  }

  animate() {
    this.time += 0.01;
    
    // Smooth mouse tracking with easing
    STATE.mouse3D.x += (STATE.mouse3D.targetX - STATE.mouse3D.x) * CONFIG.scene3D.mouseSmoothing;
    STATE.mouse3D.y += (STATE.mouse3D.targetY - STATE.mouse3D.y) * CONFIG.scene3D.mouseSmoothing;
    this.updateScrollNavigation();
    
    // ⭐ UPDATE CINEMATIC CAMERA RIG ⭐
    if (STATE.scrollEngine.cameraRig) {
      const scrollY = window.scrollY || window.pageYOffset;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const scrollProgress = maxScroll > 0 ? scrollY / maxScroll : 0;
      
      STATE.scrollEngine.cameraRig.update(
        scrollProgress,
        STATE.scrollEngine.scrollVelocity,
        0.016 // deltaTime (assuming 60fps)
      );
    }
    
    // ⭐ UPDATE VOLUMETRIC PARALLAX ⭐
    if (STATE.scrollEngine.parallaxField) {
      const scrollY = window.scrollY || window.pageYOffset;
      STATE.scrollEngine.parallaxField.update(
        scrollY,
        STATE.scrollEngine.scrollVelocity
      );
    }
    
    // Scroll-driven camera navigation with subtle mouse parallax.
    this.updateCameraFromScroll();
    
    // Update mouse light position
    if (this.mouseLight) {
      this.mouseLight.position.x = STATE.mouse3D.x * 5;
      this.mouseLight.position.y = STATE.mouse3D.y * 5;
    }
    this.updateLightingFromScroll();
    this.updateAtmosphereFromScroll();
    this.updateTransitionEffects();
    this.updateHeroArtifact();
    this.updateDepthComposition();
    
    // Animate smartphone (subtle float and rotation)
    if (STATE.heroObjects.smartphone) {
      const progress = this.scrollNavigation.useGsapChoreography ? this.gsapRig.lightMix : this.scrollNavigation.current;
      STATE.heroObjects.smartphone.position.y = Math.sin(this.time * 0.55) * 0.08 + (progress - 0.5) * 0.18;
      STATE.heroObjects.smartphone.position.z = -progress * 0.35;
      STATE.heroObjects.smartphone.rotation.y = Math.sin(this.time * 0.32) * 0.05;
      STATE.heroObjects.smartphone.rotation.x = Math.cos(this.time * 0.38) * 0.03;
    }
    
    // Animate geometric shapes (orbit and rotate)
    STATE.heroObjects.geometricShapes.forEach(shape => {
      const userData = shape.userData;
      const progress = this.scrollNavigation.useGsapChoreography ? this.gsapRig.lightMix : this.scrollNavigation.current;
      const depthMix = this.scrollNavigation.useGsapChoreography ? this.gsapRig.motifDepth : progress;
      const motifScaleMix = this.scrollNavigation.useGsapChoreography ? this.gsapRig.motifScale : 1;
      
      // Orbital motion
      userData.orbitAngle += userData.orbitSpeed;
      userData.orbitRadius = userData.baseOrbitRadius * (1 + progress * 0.1);
      shape.position.x = Math.cos(userData.orbitAngle) * userData.orbitRadius;
      shape.position.z = Math.sin(userData.orbitAngle) * userData.orbitRadius - 2 - (depthMix * 1.2) + userData.depthOffset;
      
      // Floating motion
      shape.position.y = userData.baseHeight + Math.sin(this.time + userData.floatOffset) * userData.floatAmplitude + (progress - 0.5) * 0.36;
      const depthScale = userData.baseScale * (1 + progress * userData.scrollScaleGain) * motifScaleMix;
      shape.scale.setScalar(depthScale);
      
      // Rotation
      shape.rotation.x += userData.rotationSpeed.x * 0.75;
      shape.rotation.y += (userData.rotationSpeed.y * 0.75) + userData.scrollDriftSpeed * (1 + progress * 2.2);
      shape.rotation.z += userData.rotationSpeed.z * 0.75;
    });
    
    // Animate glass panels (gentle float)
    STATE.heroObjects.glassPanels.forEach(panel => {
      const userData = panel.userData;
      panel.position.y += Math.sin(this.time + userData.floatOffset) * userData.floatSpeed;
      panel.rotation.y += userData.floatSpeed * 0.5;
    });
    
    // Render scene
    STATE.renderer3D.render(STATE.scene3D, STATE.camera3D);
    
    requestAnimationFrame(() => this.animate());
  }
}

// ===== Particle System (PRESERVED) =====
class ParticleSystem {
  constructor(container) {
    if (!container || STATE.isTouch) return;
    
    this.container = container;
    this.init();
  }

  init() {
    const particleCount = window.innerWidth < 768 ? 30 : CONFIG.particleCount;
    
    for (let i = 0; i < particleCount; i++) {
      this.createParticle();
    }

    this.animate();
  }

  createParticle() {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    const size = Math.random() * 3 + 1;
    const startX = Math.random() * 100;
    const startY = Math.random() * 100;
    const duration = Math.random() * 20 + 15;
    const delay = Math.random() * 5;
    const opacity = Math.random() * 0.3 + 0.1;
    
    particle.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      background: radial-gradient(circle, rgba(99, 102, 241, ${opacity}), transparent);
      border-radius: 50%;
      left: ${startX}%;
      top: ${startY}%;
      animation: float ${duration}s ${delay}s infinite ease-in-out;
      pointer-events: none;
    `;
    
    this.container.appendChild(particle);
    STATE.particles.push(particle);
  }

  animate() {
    // Particles use CSS animations, no JS needed for movement
  }
}

// ===== Tilt Effect (PRESERVED) =====
class TiltEffect {
  constructor() {
    this.elements = document.querySelectorAll('[data-tilt]');
    if (STATE.isTouch || this.elements.length === 0) return;
    
    this.init();
  }

  init() {
    this.elements.forEach(element => {
      element.addEventListener('mouseenter', () => this.handleMouseEnter(element));
      element.addEventListener('mousemove', (e) => this.handleMouseMove(e, element));
      element.addEventListener('mouseleave', () => this.handleMouseLeave(element));
    });
  }

  handleMouseEnter(element) {
    element.style.transition = 'none';
  }

  handleMouseMove(e, element) {
    const rect = element.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const percentX = (x - centerX) / centerX;
    const percentY = (y - centerY) / centerY;
    
    const tiltX = percentY * CONFIG.tiltStrength;
    const tiltY = -percentX * CONFIG.tiltStrength;
    
    element.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`;
  }

  handleMouseLeave(element) {
    element.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
    element.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
  }
}

// ===== Magnetic Effect (PRESERVED) =====
class MagneticEffect {
  constructor() {
    this.elements = document.querySelectorAll('.btn--magnetic');
    if (STATE.isTouch || this.elements.length === 0) return;
    
    this.init();
  }

  init() {
    this.elements.forEach(element => {
      element.addEventListener('mouseenter', () => this.handleMouseEnter(element));
      element.addEventListener('mousemove', (e) => this.handleMouseMove(e, element));
      element.addEventListener('mouseleave', () => this.handleMouseLeave(element));
    });
  }

  handleMouseEnter(element) {
    element.style.transition = 'none';
  }

  handleMouseMove(e, element) {
    const rect = element.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const deltaX = (x - centerX) * CONFIG.magneticStrength;
    const deltaY = (y - centerY) * CONFIG.magneticStrength;
    
    element.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
  }

  handleMouseLeave(element) {
    element.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
    element.style.transform = 'translate(0, 0)';
  }
}

// ===== Scroll Animations (PRESERVED) =====
class ScrollAnimations {
  constructor() {
    this.elements = document.querySelectorAll('[data-aos]');
    if (this.elements.length === 0) return;
    
    this.init();
  }

  init() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('aos-animate');
            this.observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
      }
    );

    this.elements.forEach(element => {
      this.observer.observe(element);
    });
  }
}

// ===== Navigation Controller (PRESERVED) =====
class NavigationController {
  constructor() {
    this.init();
  }

  init() {
    if (!DOM.nav) return;

    // Mobile menu toggle
    if (DOM.navToggle) {
      DOM.navToggle.addEventListener('click', () => this.toggleMobileMenu());
    }

    // Hero products / services mega panel
    if (DOM.productsTrigger && DOM.heroProductsPanel) {
      DOM.productsTrigger.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleHeroProducts();
      });
      document.addEventListener('click', (e) => {
        if (!DOM.heroProductsPanel.classList.contains('is-open')) return;
        if (DOM.heroProductsPanel.contains(e.target) || DOM.productsTrigger.contains(e.target)) return;
        this.closeHeroProducts();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') this.closeHeroProducts();
      });
      DOM.heroProductsPanel.addEventListener('click', (e) => {
        if (e.target.closest('a')) this.closeHeroProducts();
      });
    }

    // Smooth scroll for nav links (skip products trigger)
    DOM.navLinks.forEach(link => {
      if (link.hasAttribute('data-products-trigger')) return;
      link.addEventListener('click', (e) => this.smoothScroll(e, link));
    });

    // Scroll effects
    window.addEventListener('scroll', () => this.handleScrollEffects(), { passive: true });
  }

  toggleHeroProducts() {
    if (!DOM.heroProductsPanel || !DOM.productsTrigger) return;
    const isOpen = DOM.heroProductsPanel.classList.toggle('is-open');
    DOM.productsTrigger.setAttribute('aria-expanded', isOpen);
    DOM.heroProductsPanel.setAttribute('aria-hidden', !isOpen);
  }

  closeHeroProducts() {
    if (!DOM.heroProductsPanel || !DOM.productsTrigger) return;
    DOM.heroProductsPanel.classList.remove('is-open');
    DOM.productsTrigger.setAttribute('aria-expanded', 'false');
    DOM.heroProductsPanel.setAttribute('aria-hidden', 'true');
  }

  toggleMobileMenu() {
    DOM.navMenu.classList.toggle('is-active');
    const isActive = DOM.navMenu.classList.contains('is-active');
    this.animateHamburger(isActive);
    
    // Scroll Lock
    if (isActive) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  animateHamburger(isActive) {
    const lines = DOM.navToggle.querySelectorAll('.nav__toggle-line');
    
    if (isActive) {
      lines[0].style.transform = 'rotate(45deg) translateY(9px)';
      lines[1].style.opacity = '0';
      lines[2].style.transform = 'rotate(-45deg) translateY(-9px)';
    } else {
      lines[0].style.transform = 'none';
      lines[1].style.opacity = '1';
      lines[2].style.transform = 'none';
    }
  }

  smoothScroll(e, link) {
    const href = link.getAttribute('href');
    
    if (href && href.startsWith('#')) {
      e.preventDefault();
      
      const targetId = href.substring(1);
      const targetElement = document.getElementById(targetId);
      
      if (targetElement) {
        const offsetTop = targetElement.offsetTop - CONFIG.scrollOffset;
        
        window.scrollTo({
          top: offsetTop,
          behavior: 'smooth'
        });
        
        if (DOM.navMenu.classList.contains('is-active')) {
          this.toggleMobileMenu();
          document.body.style.overflow = ''; // Ensure scroll is unlocked on click
        }
        
        this.updateActiveLink(href);
      }
    }
  }

  updateActiveLink(activeHref) {
    DOM.navLinks.forEach(link => {
      if (link.getAttribute('href') === activeHref) {
        link.classList.add('is-active');
      } else {
        link.classList.remove('is-active');
      }
    });
  }

  handleScrollEffects() {
    const scrollY = window.scrollY;
    STATE.scrollY = scrollY;
    
    if (DOM.heroProductsPanel && DOM.heroProductsPanel.classList.contains('is-open')) {
      this.closeHeroProducts();
    }
    
    // Add shadow to nav on scroll
    if (scrollY > CONFIG.navScrollThreshold) {
      DOM.nav.classList.add('is-scrolled');
    } else {
      DOM.nav.classList.remove('is-scrolled');
    }
    
    // Hide scroll indicator
    if (DOM.scrollIndicator) {
      if (scrollY > 200) {
        DOM.scrollIndicator.style.opacity = '0';
        DOM.scrollIndicator.style.pointerEvents = 'none';
      } else {
        DOM.scrollIndicator.style.opacity = '1';
        DOM.scrollIndicator.style.pointerEvents = 'all';
      }
    }
    
    // Update progress bar
    if (DOM.navProgress) {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollY / docHeight) * 100;
      DOM.navProgress.style.width = `${scrollPercent}%`;
    }
    
    // Highlight active section
    this.highlightActiveSection();
  }

  highlightActiveSection() {
    const sections = document.querySelectorAll('section[id]');
    const scrollY = window.scrollY + CONFIG.scrollOffset + 50;
    
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute('id');
      
      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        this.updateActiveLink(`#${sectionId}`);
      }
    });
  }
}

// ===== Form Controller (PRESERVED) =====
class FormController {
  constructor() {
    this.init();
  }

  init() {
    if (DOM.contactForm) {
      DOM.contactForm.addEventListener('submit', (e) => this.handleSubmit(e));
    }
  }

  async handleSubmit(e) {
    e.preventDefault();

    const payload = {
      name: document.getElementById("name").value,
      email: document.getElementById("email").value,
      company: document.getElementById("company").value,
      budget: document.getElementById("budget").value,
      message: document.getElementById("message").value
    };

    const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const webhookUrl = isLocal
      ? "https://ascendlabs-com.app.n8n.cloud/webhook-test/contact-form"
      : "https://ascendlabs-com.app.n8n.cloud/webhook/contact-form";

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert("Message sent successfully!");
        DOM.contactForm.reset();
      } else {
        alert("There was an error sending the form.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("There was an error sending the form.");
    }
  }

  validate(data) {
    const { name, email, message } = data;
    
    if (!name || name.trim().length < 2) {
      this.showError('Please enter a valid name');
      return false;
    }
    
    if (!email || !this.isValidEmail(email)) {
      this.showError('Please enter a valid email address');
      return false;
    }
    
    if (!message || message.trim().length < 10) {
      this.showError('Please enter a message (at least 10 characters)');
      return false;
    }
    
    return true;
  }

  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  showError(message) {
    let errorElement = DOM.contactForm.querySelector('.form-error');
    
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.className = 'form-error';
      errorElement.style.cssText = `
        background-color: rgba(239, 68, 68, 0.1);
        color: #ef4444;
        padding: 1rem;
        border-radius: 0.75rem;
        margin-bottom: 1rem;
        grid-column: 1 / -1;
        font-size: 0.875rem;
        border: 1px solid rgba(239, 68, 68, 0.2);
      `;
      DOM.contactForm.insertBefore(errorElement, DOM.contactForm.firstChild);
    }
    
    errorElement.textContent = message;
    
    setTimeout(() => {
      errorElement.remove();
    }, 5000);
  }
}

// ===== Work loop – LogoLoop-style infinite marquee =====
class WorkLoopCarousel {
  constructor() {
    this.section = document.getElementById('work-loop');
    this.track = document.getElementById('workLoopTrack');
    this.carousel = this.track ? this.track.closest('.work-loop__carousel') : null;
    this.isLogoLoop = this.section && this.section.classList.contains('work-loop--logoloop');
    this.slides = this.track ? Array.from(this.track.querySelectorAll('.work-loop__slide')) : [];
    this.total = this.slides.length;
    this.current = 0;
    this.touchStartX = 0;
    this.touchDeltaX = 0;
    this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.autoInterval = null;
    this.autoDelay = this.isReducedMotion ? 4600 : 2700;
    this.paused = false;
    this.isAnimating = false;
    this.animationMs = this.isReducedMotion ? 260 : 680;

    if (this.total > 1) this.init();
  }

  init() {
    if (!this.isLogoLoop || !this.track || !this.carousel) return;

    this.bindEvents();
    
    // Handle resize for responsive behavior
    this.handleResize = () => {
      const wasMobile = this.isMobileViewport;
      this.isMobileViewport = window.matchMedia('(max-width: 768px)').matches;
      
      if (this.isMobileViewport) {
        this.paused = true;
      } else if (wasMobile) {
        this.paused = false;
        this.updateVisualState();
        this.startAuto();
      }
    };

    window.addEventListener('resize', this.handleResize);
    this.handleResize(); // Initial check
    
    if (!this.isMobileViewport) {
      this.updateVisualState();
      this.startAuto();
    }
    
    this.section.classList.add('is-ready');
  }

  bindEvents() {
    this.carousel.addEventListener('mouseenter', () => { this.paused = true; });
    this.carousel.addEventListener('mouseleave', () => { this.paused = false; });
    this.carousel.addEventListener('focusin', () => { this.paused = true; });
    this.carousel.addEventListener('focusout', () => { this.paused = false; });

    this.carousel.addEventListener('wheel', (event) => {
      if (this.isMobileViewport) return;
      if (Math.abs(event.deltaY) < 16 && Math.abs(event.deltaX) < 16) return;
      event.preventDefault();
      if (event.deltaY > 0 || event.deltaX > 0) this.next();
      else this.prev();
    }, { passive: false });

    this.carousel.addEventListener('pointerdown', (event) => {
      this.touchStartX = event.clientX;
      this.touchDeltaX = 0;
    });

    this.carousel.addEventListener('pointermove', (event) => {
      if (!this.touchStartX) return;
      this.touchDeltaX = event.clientX - this.touchStartX;
    });

    this.carousel.addEventListener('pointerup', () => this.handlePointerEnd());
    this.carousel.addEventListener('pointercancel', () => this.handlePointerEnd());
    this.carousel.addEventListener('pointerleave', () => this.handlePointerEnd());
  }

  handlePointerEnd() {
    if (!this.touchStartX) return;

    const threshold = 42;
    if (Math.abs(this.touchDeltaX) >= threshold) {
      if (this.touchDeltaX < 0) this.next();
      else this.prev();
    }

    this.touchStartX = 0;
    this.touchDeltaX = 0;
  }

  next() {
    this.rotate(1);
  }

  prev() {
    this.rotate(-1);
  }

  rotate(direction) {
    if (this.isAnimating) return;
    this.isAnimating = true;

    this.current = (this.current + direction + this.total) % this.total;
    this.section.classList.add('is-orbiting');
    this.section.setAttribute('data-orbit-dir', direction > 0 ? 'next' : 'prev');
    this.updateVisualState();

    window.setTimeout(() => {
      this.isAnimating = false;
      this.section.classList.remove('is-orbiting');
      this.section.removeAttribute('data-orbit-dir');
    }, this.animationMs);
  }

  updateVisualState() {
    this.slides.forEach((slide, index) => {
      let distance = index - this.current;

      if (distance > this.total / 2) distance -= this.total;
      if (distance < -this.total / 2) distance += this.total;

      const absRaw = Math.abs(distance);
      const slot = absRaw > 2 ? (distance < 0 ? -2.7 : 2.7) : distance;
      const abs = Math.min(absRaw, 2);

      const depth = abs === 0 ? 120 : abs === 1 ? 12 : -96;
      const lift = abs === 0 ? 0 : abs === 1 ? 8 : 22;
      const scale = abs === 0 ? 1 : abs === 1 ? 0.9 : 0.78;
      const tilt = abs === 0 ? 0 : slot < 0 ? 11 : -11;

      slide.style.setProperty('--slot', String(slot));
      slide.style.setProperty('--depth', `${depth}px`);
      slide.style.setProperty('--lift', `${lift}px`);
      slide.style.setProperty('--card-scale', String(scale));
      slide.style.setProperty('--tilt', `${tilt}deg`);
      slide.style.zIndex = String(30 - abs);

      slide.classList.remove('is-active', 'is-near', 'is-outer', 'is-hidden');
      if (absRaw === 0) slide.classList.add('is-active');
      else if (absRaw === 1) slide.classList.add('is-near');
      else if (absRaw === 2) slide.classList.add('is-outer');
      else slide.classList.add('is-hidden');
    });
  }

  startAuto() {
    if (this.autoInterval) clearInterval(this.autoInterval);

    this.autoInterval = setInterval(() => {
      if (this.paused) return;
      this.next();
    }, this.autoDelay);
  }
}

// ===== Performance Utilities (PRESERVED) =====
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ===== Smooth Scroll Enhancement (PRESERVED) =====
class SmoothScrollEnhancer {
  constructor() {
    this.init();
  }

  init() {
    // Add smooth scrolling to all anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      if (anchor.classList.contains('nav__link')) return; // Already handled
      
      anchor.addEventListener('click', (e) => {
        const href = anchor.getAttribute('href');
        if (href === '#') return;
        
        e.preventDefault();
        const target = document.querySelector(href);
        
        if (target) {
          const offsetTop = target.offsetTop - CONFIG.scrollOffset;
          window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
          });
        }
      });
    });
  }
}

// ===== CINEMATIC SCENE TRANSITION SYSTEM =====
/**
 * CinematicTransitions - Advanced WebGL scene navigation system
 * 
 * Creates cinematic depth and spatial continuity between page sections using:
 * - Camera movement with smooth interpolation
 * - Dynamic depth-of-field and fog transitions  
 * - Scene object morphing and repositioning
 * - Scroll-linked shader tone variations
 * - Parallax-enhanced vignette layers
 */
class CinematicTransitions {
  constructor(canvas) {
    if (!canvas) {
      console.log('⚠️ Cinematic canvas not found');
      return;
    }
    
    if (CONFIG.cinematic.enableMobile === false && window.innerWidth < 768) {
      console.log('📱 Cinematic transitions disabled on mobile for performance');
      return;
    }
    
    this.canvas = canvas;
    this.time = 0;
    this.sceneConfigs = this.defineSceneConfigurations();
    this.init();
  }

  init() {
    // Setup WebGL scene
    STATE.cinematic.scene = new THREE.Scene();
    
    // Setup perspective camera for depth
    const aspect = window.innerWidth / window.innerHeight;
    STATE.cinematic.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 100);
    STATE.cinematic.camera.position.z = 12;
    STATE.cinematic.camera.position.y = 0;
    
    // Setup renderer with alpha for layering
    STATE.cinematic.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true
    });
    STATE.cinematic.renderer.setSize(window.innerWidth, window.innerHeight);
    STATE.cinematic.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Add atmospheric fog for depth
    STATE.cinematic.scene.fog = new THREE.Fog(
      0x0a0a0f, 
      CONFIG.cinematic.fogNear, 
      CONFIG.cinematic.fogFar
    );
    
    // Create scene objects for each section
    this.createSceneObjects();
    
    // Setup lighting
    this.setupLighting();
    
    // Calculate section scroll ranges
    this.calculateSectionRanges();
    
    // Start animation loop
    this.animate();
    
    // Handle scroll events
    this.setupScrollHandlers();
    
    // Handle resize
    window.addEventListener('resize', () => this.handleResize());
    
    console.log('🎬 Cinematic transition system initialized');
  }

  /**
   * Define unique visual configurations for each section
   * Each scene has camera position, object positions, lighting, and shader tones
   */
  defineSceneConfigurations() {
    return {
      hero: {
        camera: { x: 0, y: 0, z: 12 },
        fog: { near: 5, far: 25, color: 0x0a0a0f },
        ambientLight: 0.3,
        directionalLight: { intensity: 0.8, color: 0x6366f1 },
        vignette: 0.6,
        objects: {
          mainSphere: { scale: 1, position: { x: 0, y: 0, z: -2 }, rotation: { y: 0 } },
          ring: { scale: 1, position: { x: -3, y: 1, z: -5 }, rotation: { z: 0 } },
          cube: { scale: 0.8, position: { x: 3, y: -1, z: -4 }, rotation: { x: 0.3 } },
          torus: { scale: 1, position: { x: 0, y: 3, z: -7 }, rotation: { x: 0 } }
        }
      },
      services: {
        camera: { x: 2, y: 1, z: 10 },
        fog: { near: 3, far: 20, color: 0x14141f },
        ambientLight: 0.4,
        directionalLight: { intensity: 1.0, color: 0x8b5cf6 },
        vignette: 0.7,
        objects: {
          mainSphere: { scale: 0.6, position: { x: -2, y: 1, z: -1 }, rotation: { y: 1.5 } },
          ring: { scale: 1.2, position: { x: 1, y: -1, z: -3 }, rotation: { z: 0.8 } },
          cube: { scale: 1, position: { x: -1, y: -2, z: -2 }, rotation: { x: 0.8 } },
          torus: { scale: 0.7, position: { x: 3, y: 1, z: -6 }, rotation: { x: 0.5 } }
        }
      },
      work: {
        camera: { x: -1, y: -1, z: 11 },
        fog: { near: 4, far: 22, color: 0x0a0a0f },
        ambientLight: 0.35,
        directionalLight: { intensity: 0.9, color: 0xec4899 },
        vignette: 0.65,
        objects: {
          mainSphere: { scale: 0.8, position: { x: 2, y: -1, z: -3 }, rotation: { y: 2 } },
          ring: { scale: 0.9, position: { x: -2, y: 2, z: -4 }, rotation: { z: 1.2 } },
          cube: { scale: 1.1, position: { x: 0, y: 0, z: -2 }, rotation: { x: 1.0 } },
          torus: { scale: 0.8, position: { x: -3, y: -1, z: -5 }, rotation: { x: 0.8 } }
        }
      },
      pricing: {
        camera: { x: 0, y: 2, z: 9 },
        fog: { near: 3, far: 18, color: 0x14141f },
        ambientLight: 0.45,
        directionalLight: { intensity: 1.1, color: 0x6366f1 },
        vignette: 0.55,
        objects: {
          mainSphere: { scale: 0.7, position: { x: 0, y: 2, z: -4 }, rotation: { y: 2.5 } },
          ring: { scale: 1.1, position: { x: 2, y: 0, z: -2 }, rotation: { z: 1.5 } },
          cube: { scale: 0.9, position: { x: -2, y: -1, z: -3 }, rotation: { x: 1.2 } },
          torus: { scale: 1, position: { x: 1, y: -2, z: -6 }, rotation: { x: 1.0 } }
        }
      },
      about: {
        camera: { x: 1, y: 0, z: 13 },
        fog: { near: 6, far: 28, color: 0x0a0a0f },
        ambientLight: 0.3,
        directionalLight: { intensity: 0.7, color: 0x8b5cf6 },
        vignette: 0.7,
        objects: {
          mainSphere: { scale: 0.9, position: { x: -1, y: 0, z: -5 }, rotation: { y: 3 } },
          ring: { scale: 0.8, position: { x: 2, y: 2, z: -7 }, rotation: { z: 1.8 } },
          cube: { scale: 0.85, position: { x: 1, y: -2, z: -4 }, rotation: { x: 1.5 } },
          torus: { scale: 0.9, position: { x: -2, y: 1, z: -8 }, rotation: { x: 1.2 } }
        }
      },
      contact: {
        camera: { x: -2, y: -1, z: 14 },
        fog: { near: 7, far: 30, color: 0x14141f },
        ambientLight: 0.25,
        directionalLight: { intensity: 0.6, color: 0xec4899 },
        vignette: 0.75,
        objects: {
          mainSphere: { scale: 0.5, position: { x: 0, y: -1, z: -6 }, rotation: { y: 3.5 } },
          ring: { scale: 0.7, position: { x: -2, y: 1, z: -8 }, rotation: { z: 2.0 } },
          cube: { scale: 0.75, position: { x: 2, y: 0, z: -5 }, rotation: { x: 1.8 } },
          torus: { scale: 0.6, position: { x: 0, y: 2, z: -9 }, rotation: { x: 1.5 } }
        }
      }
    };
  }

  /**
   * Create geometric objects that will morph between sections
   */
  createSceneObjects() {
    const materials = {
      glass: new THREE.MeshPhysicalMaterial({
        color: 0x6366f1,
        metalness: 0.1,
        roughness: 0.1,
        transparent: true,
        opacity: 0.4,
        envMapIntensity: 1
      }),
      wire: new THREE.MeshBasicMaterial({
        color: 0x8b5cf6,
        wireframe: true,
        transparent: true,
        opacity: 0.3
      })
    };

    // Main sphere (represents primary focus)
    const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
    STATE.cinematic.sceneObjects.mainSphere = new THREE.Mesh(sphereGeometry, materials.glass);
    STATE.cinematic.scene.add(STATE.cinematic.sceneObjects.mainSphere);

    // Ring (represents connectivity)
    const ringGeometry = new THREE.TorusGeometry(1, 0.3, 16, 50);
    STATE.cinematic.sceneObjects.ring = new THREE.Mesh(ringGeometry, materials.wire);
    STATE.cinematic.scene.add(STATE.cinematic.sceneObjects.ring);

    // Cube (represents structure)
    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
    STATE.cinematic.sceneObjects.cube = new THREE.Mesh(cubeGeometry, materials.glass);
    STATE.cinematic.scene.add(STATE.cinematic.sceneObjects.cube);

    // Torus (represents flow)
    const torusGeometry = new THREE.TorusGeometry(0.8, 0.25, 16, 50);
    STATE.cinematic.sceneObjects.torus = new THREE.Mesh(torusGeometry, materials.wire);
    STATE.cinematic.scene.add(STATE.cinematic.sceneObjects.torus);
  }

  /**
   * Setup dynamic lighting that shifts with each scene
   */
  setupLighting() {
    // Ambient light (base illumination)
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    STATE.cinematic.scene.add(this.ambientLight);

    // Directional light (main light source with color)
    this.directionalLight = new THREE.DirectionalLight(0x6366f1, 0.8);
    this.directionalLight.position.set(5, 5, 5);
    STATE.cinematic.scene.add(this.directionalLight);

    // Subtle fill light
    this.fillLight = new THREE.PointLight(0x8b5cf6, 0.3, 20);
    this.fillLight.position.set(-3, -2, 3);
    STATE.cinematic.scene.add(this.fillLight);
  }

  /**
   * Calculate scroll position ranges for each section
   */
  calculateSectionRanges() {
    const sections = document.querySelectorAll('.scene-section');
    
    if (!sections || sections.length === 0) {
      console.warn('⚠️ No scene sections found');
      STATE.cinematic.sectionRanges = [];
      return;
    }
    
    STATE.cinematic.sectionRanges = [];

    sections.forEach((section, index) => {
      const sceneName = section.getAttribute('data-scene') || section.id;
      const top = section.offsetTop;
      const height = section.offsetHeight;
      
      STATE.cinematic.sectionRanges.push({
        name: sceneName,
        start: top,
        end: top + height,
        middle: top + height / 2
      });
    });
    
    console.log(`✅ Calculated ${STATE.cinematic.sectionRanges.length} scene ranges`);
  }

  /**
   * Setup scroll event handlers for smooth transitions
   */
  setupScrollHandlers() {
    let ticking = false;

    const handleScroll = () => {
      if (!STATE.cinematic.sectionRanges || STATE.cinematic.sectionRanges.length === 0) {
        ticking = false;
        return;
      }
      
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // Calculate overall scroll progress (0 to 1)
      STATE.cinematic.scrollProgress = scrollY / (documentHeight - windowHeight);

      // Determine which scene we're in
      const currentSection = STATE.cinematic.sectionRanges.find(section => 
        scrollY >= section.start && scrollY < section.end
      );

      if (currentSection && currentSection.name !== STATE.cinematic.currentSceneName) {
        this.transitionToScene(currentSection.name);
      }

      // Update camera parallax based on scroll
      this.updateScrollParallax(scrollY);
      
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(handleScroll);
        ticking = true;
      }
    }, { passive: true });
  }

  /**
   * Transition camera and objects to new scene configuration
   */
  transitionToScene(targetSceneName) {
    if (!this.sceneConfigs[targetSceneName]) {
      console.warn(`⚠️ Scene config not found: ${targetSceneName}`);
      return;
    }
    
    if (!STATE.cinematic.camera || !STATE.cinematic.scene) {
      console.warn('⚠️ Cinematic scene not initialized');
      return;
    }

    STATE.cinematic.targetSceneName = targetSceneName;
    STATE.cinematic.isTransitioning = true;

    const targetConfig = this.sceneConfigs[targetSceneName];
    
    console.log(`🎬 Transitioning to scene: ${targetSceneName}`);

    // Animate camera position
    if (typeof gsap !== 'undefined') {
      gsap.to(STATE.cinematic.camera.position, {
        x: targetConfig.camera.x,
        y: targetConfig.camera.y,
        z: targetConfig.camera.z,
        duration: CONFIG.cinematic.transitionDuration,
        ease: CONFIG.cinematic.cameraEasing,
        onComplete: () => {
          STATE.cinematic.currentSceneName = targetSceneName;
          STATE.cinematic.isTransitioning = false;
        }
      });

      // Animate fog
      gsap.to(STATE.cinematic.scene.fog, {
        near: targetConfig.fog.near,
        far: targetConfig.fog.far,
        duration: CONFIG.cinematic.transitionDuration,
        ease: 'power2.inOut'
      });

      // Animate lighting
      gsap.to(this.ambientLight, {
        intensity: targetConfig.ambientLight,
        duration: CONFIG.cinematic.transitionDuration
      });

      gsap.to(this.directionalLight, {
        intensity: targetConfig.directionalLight.intensity,
        duration: CONFIG.cinematic.transitionDuration
      });

      // Animate scene objects
      Object.keys(STATE.cinematic.sceneObjects).forEach(key => {
        const obj = STATE.cinematic.sceneObjects[key];
        const targetProps = targetConfig.objects[key];

        if (targetProps) {
          // Position
          gsap.to(obj.position, {
            x: targetProps.position.x,
            y: targetProps.position.y,
            z: targetProps.position.z,
            duration: CONFIG.cinematic.transitionDuration,
            ease: CONFIG.cinematic.cameraEasing
          });

          // Scale
          gsap.to(obj.scale, {
            x: targetProps.scale,
            y: targetProps.scale,
            z: targetProps.scale,
            duration: CONFIG.cinematic.transitionDuration,
            ease: 'back.out(1.2)'
          });

          // Rotation offset (continuous rotation continues, this is added offset)
          if (targetProps.rotation) {
            gsap.to(obj.rotation, {
              x: targetProps.rotation.x || obj.rotation.x,
              y: targetProps.rotation.y || obj.rotation.y,
              z: targetProps.rotation.z || obj.rotation.z,
              duration: CONFIG.cinematic.transitionDuration,
              ease: 'power2.inOut'
            });
          }
        }
      });
    }
  }

  /**
   * Apply subtle parallax to camera based on scroll position
   */
  updateScrollParallax(scrollY) {
    if (!STATE.cinematic.sectionRanges || !STATE.cinematic.camera) return;
    
    const currentSection = STATE.cinematic.sectionRanges.find(section => 
      scrollY >= section.start && scrollY < section.end
    );

    if (currentSection) {
      // Calculate progress within current section (0 to 1)
      const sectionProgress = (scrollY - currentSection.start) / 
                              (currentSection.end - currentSection.start);
      
      // Apply subtle parallax depth shift
      const depthShift = Math.sin(sectionProgress * Math.PI) * 
                         CONFIG.cinematic.depthShiftAmount;
      
      // Smooth camera depth adjustment (doesn't use GSAP to avoid conflicts)
      STATE.cinematic.camera.position.z += (12 + depthShift - STATE.cinematic.camera.position.z) * 0.05;
    }
  }

  /**
   * Handle window resize
   */
  handleResize() {
    const aspect = window.innerWidth / window.innerHeight;
    STATE.cinematic.camera.aspect = aspect;
    STATE.cinematic.camera.updateProjectionMatrix();
    
    STATE.cinematic.renderer.setSize(window.innerWidth, window.innerHeight);
    STATE.cinematic.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Recalculate section ranges on resize
    this.calculateSectionRanges();
  }

  /**
   * Main animation loop
   */
  animate() {
    // Safety check
    if (!STATE.cinematic.renderer || !STATE.cinematic.scene || !STATE.cinematic.camera) {
      return;
    }
    
    this.time += 0.01;

    // Continuous subtle rotation for all objects
    if (STATE.cinematic.sceneObjects) {
      Object.keys(STATE.cinematic.sceneObjects).forEach(key => {
        const obj = STATE.cinematic.sceneObjects[key];
        
        if (!obj) return;
        
        // Each object has unique rotation speed
        switch(key) {
          case 'mainSphere':
            obj.rotation.y += 0.002;
            obj.rotation.x += 0.001;
            break;
          case 'ring':
            obj.rotation.z += 0.003;
            obj.rotation.x += 0.001;
            break;
          case 'cube':
            obj.rotation.x += 0.002;
            obj.rotation.y += 0.002;
            break;
          case 'torus':
            obj.rotation.x += 0.0025;
            obj.rotation.y += 0.0015;
            break;
        }

        // Subtle floating animation
        const floatOffset = Math.sin(this.time + parseInt(key, 36)) * 0.1;
        obj.position.y += floatOffset * 0.02;
      });
    }

    // Render scene
    STATE.cinematic.renderer.render(STATE.cinematic.scene, STATE.cinematic.camera);
    
    requestAnimationFrame(() => this.animate());
  }
}

// ===== Pricing Expander =====
class PricingExpander {
  constructor() {
    this.container = document.getElementById('pricingExpand');
    this.trigger = document.getElementById('pricingExpandTrigger');
    if (!this.container || !this.trigger) return;
    this.init();
  }

  init() {
    this.trigger.addEventListener('click', () => {
      this.container.classList.toggle('is-active');
      
      const label = this.trigger.querySelector('.pricing-expand__label');
      if (label) {
        label.textContent = this.container.classList.contains('is-active') ? 'Close' : 'Add on';
      }
    });
  }
}

// ===== Initialization =====
class App {
  constructor() {
    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.start());
    } else {
      this.start();
    }
  }

  start() {
    console.log('🚀 AscendLabs Experience Initialized with Cinematic Scene Transitions');
    
    // ⭐ INITIALIZE CINEMATIC SCROLL ENGINE ⭐
    if (typeof InertialScrollController !== 'undefined' && CONFIG.inertialScroll.enabled) {
      STATE.scrollEngine.controller = new InertialScrollController({
        lerp: CONFIG.inertialScroll.lerp,
        wheelMultiplier: CONFIG.inertialScroll.wheelMultiplier,
        touchMultiplier: CONFIG.inertialScroll.touchMultiplier,
        smoothTouch: CONFIG.inertialScroll.smoothTouch,
        touchInertia: CONFIG.inertialScroll.touchInertia
      });
      
      STATE.scrollEngine.controller.on('scroll', (data) => {
        STATE.scrollEngine.lastScrollY = data.current;
        STATE.scrollEngine.scrollVelocity = data.velocity;
        
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        STATE.scrollEngine.scrollProgress = maxScroll > 0 ? data.current / maxScroll : 0;
      });
      
      console.log('✅ Cinematic scroll engine active (lerp:', CONFIG.inertialScroll.lerp, ')');
    }
    
    // Initialize all systems
    new CursorController();
    new ShaderBackground(DOM.heroCanvas); // PRESERVED: Shader background
    new HeroScene3D(DOM.heroCanvas3D); // NEW: Cinematic 3D scene
    new CinematicTransitions(DOM.cinematicCanvas); // NEW: Cinematic transitions
    new ParticleSystem(DOM.heroParticles); // PRESERVED: Particles
    const navController = new NavigationController();
    new FormController();
    new WorkLoopCarousel();
    new SmoothScrollEnhancer();
    new PricingExpander();
    
    // Initial scroll check
    if (DOM.nav) navController.handleScrollEffects();
  }
}

// ================================
// ================================
// Unified GSAP Motion System
// ================================
class MotionOrchestrator {
  constructor() {
    this.sectionRegistry = new Map();
    this.rectCache = new WeakMap();
    this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.isTouchLike = window.matchMedia('(hover: none), (pointer: coarse)').matches;
    this.isMobile = window.matchMedia('(max-width: 768px)').matches;
    this.defaults = {
      revealDistance: 64,
      revealDuration: 1,
      revealEase: 'power3.out',
      stagger: 0.12
    };
  }

  init() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      this.ensureHeroVisibility();
      this.initFallbackReveals();
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.defaults({
      toggleActions: 'play none none reverse',
      fastScrollEnd: true
    });

    document.body.classList.add('motion-gsap');

    this.registerSectionAnimations();
    this.runSectionAnimations();
    this.initTypographyMotion();
    this.initCardInteractions();
    this.initSectionTransitions();
    this.initCounters();
    this.initFooterAndFormReveal();
    this.initGenericReveals();

    ScrollTrigger.refresh();
  }

  registerSectionAnimations() {
    this.registerSection('services', (section) => {
      this.createStaggerReveal(section, '.service-card', { stagger: 0.16, delay: 0.1 });
    });

    this.registerSection('work', (section) => {
      this.createStaggerReveal(section, '.work-card', { stagger: 0.14, delay: 0.12 });
    });

    this.registerSection('pricing', (section) => {
      this.createStaggerReveal(section, '.pricing-card', { stagger: 0.14, delay: 0.12 });
    });

    this.registerSection('about', (section) => {
      const sectionHeader = section.querySelector('.section-header');
      const aboutContent = section.querySelector('.about__content');
      const aboutIntroCopy = section.querySelector('.about__intro-copy');
      const headerLabel = section.querySelector('.section-header__label');
      const headerTitle = section.querySelector('.section-header__title');
      const headline = section.querySelector('.about__headline');
      const paragraphs = section.querySelectorAll('.about__text-content .about__paragraph');
      const serviceList = section.querySelector('.about__service-list');
      const serviceItems = section.querySelectorAll('.about__service-list li');
      const imageWrapper = section.querySelector('.about__image-wrapper');
      const statCards = section.querySelectorAll('.stat-card');
      const aboutTextContent = section.querySelector('.about__text-content');
      const aboutVisualContent = section.querySelector('.about__visual-content');
      const headerTitleTokens = headerTitle ? this.splitText(headerTitle, 'words') : [];
      const headlineTokens = headline ? this.splitText(headline, 'words') : [];

      if (sectionHeader) {
        gsap.set(sectionHeader, { autoAlpha: 1, x: 0, y: 0, clearProps: 'transform' });
      }

      if (aboutContent) {
        gsap.set(aboutContent, { autoAlpha: 1, x: 0, y: 0, clearProps: 'transform' });
      }

      if (aboutIntroCopy) {
        gsap.set(aboutIntroCopy, { autoAlpha: 1, x: 0, y: 0, clearProps: 'transform' });
      }

      if (headerLabel) {
        gsap.set(headerLabel, { y: 24, autoAlpha: 0, force3D: true });
      }

      if (headerTitleTokens.length) {
        gsap.set(headerTitleTokens, { yPercent: 115, autoAlpha: 0, force3D: true });
      }

      if (headlineTokens.length) {
        gsap.set(headlineTokens, { yPercent: 115, autoAlpha: 0, force3D: true });
      }

      if (paragraphs.length) {
        gsap.set(paragraphs, { y: 0, autoAlpha: 0, force3D: true });
      }

      if (serviceItems.length) {
        gsap.set(serviceItems, { x: -10, autoAlpha: 0, force3D: true });
      }

      if (imageWrapper) {
        gsap.set(imageWrapper, { y: 34, autoAlpha: 0, scale: 0.965, force3D: true });
      }

      if (statCards.length) {
        gsap.set(statCards, { y: 10, autoAlpha: 0, force3D: true });
      }

      const revealTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top 82%',
          end: 'bottom 38%',
          scrub: 0.7
        }
      });

      if (headerLabel) {
        revealTl.to(
          headerLabel,
          { y: 0, autoAlpha: 1, duration: 0.35, ease: 'power2.out' },
          0
        );
      }

      if (headerTitleTokens.length) {
        revealTl.to(
          headerTitleTokens,
          { yPercent: 0, autoAlpha: 1, duration: 0.55, ease: 'expo.out', stagger: 0.03 },
          0.02
        );
      }

      if (headlineTokens.length) {
        revealTl.to(
          headlineTokens,
          { yPercent: 0, autoAlpha: 1, duration: 0.6, ease: 'expo.out', stagger: 0.03 },
          0.08
        );
      }

      if (paragraphs.length) {
        revealTl.to(
          paragraphs,
          { autoAlpha: 1, duration: 0.45, ease: 'power2.out', stagger: 0.05 },
          0.16
        );
      }

      if (serviceItems.length && serviceList) {
        revealTl.to(
          serviceItems,
          { x: 0, autoAlpha: 1, duration: 0.45, ease: 'power2.out', stagger: 0.05 },
          0.2
        );
      }

      if (imageWrapper) {
        revealTl.to(
          imageWrapper,
          { y: 0, autoAlpha: 1, scale: 1, duration: 0.65, ease: 'expo.out' },
          0.14
        );
      }

      if (statCards.length) {
        revealTl.to(
          statCards,
          { y: 0, autoAlpha: 1, duration: 0.5, ease: 'power2.out', stagger: 0.06 },
          0.25
        );
      }

      if (aboutTextContent || aboutVisualContent) {
        const exitTargets = [aboutTextContent, aboutVisualContent].filter(Boolean);
        gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: 'bottom 62%',
            end: 'bottom 18%',
            scrub: 0.75
          }
        }).to(exitTargets, {
          y: -22,
          autoAlpha: 0.45,
          ease: 'none',
          stagger: 0.04
        });
      }

    });

    this.registerSection('contact', (section) => {
      const intro = section.querySelector('.contact__intro');
      if (!intro) return;

      gsap.fromTo(
        intro,
        { y: 48, autoAlpha: 0, force3D: true },
        {
          y: 0,
          autoAlpha: 1,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: intro,
            start: 'top 82%'
          }
        }
      );
    });
  }

  registerSection(sectionId, setupAnimation) {
    this.sectionRegistry.set(sectionId, setupAnimation);
  }

  runSectionAnimations() {
    this.sectionRegistry.forEach((setupAnimation, sectionId) => {
      const section = document.getElementById(sectionId);
      if (!section) return;
      setupAnimation(section);
    });
  }

  createStaggerReveal(section, itemSelector, config = {}) {
    const items = section.querySelectorAll(itemSelector);
    if (!items.length) return;

    const stagger = Number(config.stagger ?? this.defaults.stagger);
    const delay = Number(config.delay ?? 0);
    const trigger = config.trigger ?? section;
    const start = config.start ?? 'top 78%';

    gsap.set(items, {
      y: this.defaults.revealDistance,
      z: -40,
      autoAlpha: 0,
      willChange: 'transform, opacity',
      force3D: true
    });

    gsap.to(items, {
      y: 0,
      z: 0,
      autoAlpha: 1,
      duration: this.defaults.revealDuration,
      ease: this.defaults.revealEase,
      delay,
      stagger: (index, target) => {
        const custom = parseFloat(target.getAttribute('data-motion-delay'));
        return Number.isFinite(custom) ? custom : index * stagger;
      },
      scrollTrigger: {
        trigger: trigger,
        start: start,
        once: this.isReducedMotion
      },
      clearProps: 'willChange'
    });
  }

  initTypographyMotion() {
    this.initHeroTypography();

    const targets = Array.from(document.querySelectorAll('.section-header__title, .contact__title'))
      .filter((heading) => !heading.closest('#about'));

    targets.forEach((heading) => {
      const splitNodes = this.splitText(heading, heading.classList.contains('contact__title') ? 'chars' : 'words');
      heading.classList.add('mask-reveal');

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: heading,
          start: 'top 85%'
        }
      });

      tl.fromTo(
        heading,
        { backgroundPosition: '100% 0%' },
        {
          backgroundPosition: '0% 0%',
          duration: 1,
          ease: 'power2.out'
        }
      );

      tl.fromTo(
        splitNodes,
        {
          yPercent: 120,
          autoAlpha: 0,
          force3D: true
        },
        {
          yPercent: 0,
          autoAlpha: 1,
          duration: 0.9,
          ease: 'expo.out',
          stagger: 0.03
        },
        0.08
      );
    });
  }

  initHeroTypography() {
    const heroWords = document.querySelectorAll('.hero__title-word');
    const heroMeta = document.querySelectorAll('.hero__subtitle, .hero__cta-group, .hero__scroll-indicator');
    if (!heroWords.length) return;

    if (this.isReducedMotion) {
      gsap.set(heroWords, { clearProps: 'all', autoAlpha: 1, yPercent: 0 });
      gsap.set(heroMeta, { clearProps: 'all', autoAlpha: 1, y: 0 });
      return;
    }

    gsap.set(heroWords, {
      yPercent: 115,
      autoAlpha: 0,
      force3D: true
    });

    gsap.to(heroWords, {
      yPercent: 0,
      autoAlpha: 1,
      duration: 1.1,
      ease: 'expo.out',
      stagger: 0.07,
      delay: 0.3,
      overwrite: 'auto',
      onComplete: () => {
        gsap.set(heroWords, { clearProps: 'transform,opacity,visibility,willChange' });
      }
    });

    if (heroMeta.length) {
      gsap.fromTo(
        heroMeta,
        { y: 24, autoAlpha: 0, force3D: true },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.8,
          ease: 'power3.out',
          stagger: 0.12,
          delay: 0.75,
          overwrite: 'auto',
          onComplete: () => {
            gsap.set(heroMeta, { clearProps: 'transform,opacity,visibility,willChange' });
          }
        }
      );
    }

    // Fail-safe in case a tween is interrupted before completion.
    window.setTimeout(() => this.ensureHeroVisibility(), 2200);
  }

  splitText(element, mode = 'words') {
    if (element.dataset.motionSplit === mode) {
      return element.querySelectorAll('.motion-token');
    }

    const text = element.textContent.trim();
    const parts = mode === 'chars' ? Array.from(text) : text.split(/(\s+)/);

    element.textContent = '';

    const fragment = document.createDocumentFragment();

    parts.forEach((part) => {
      if (/^\s+$/.test(part)) {
        fragment.appendChild(document.createTextNode(part));
        return;
      }

      const token = document.createElement('span');
      token.className = 'motion-token';
      token.textContent = part;
      token.style.display = 'inline-block';
      token.style.willChange = 'transform, opacity';
      fragment.appendChild(token);
    });

    element.appendChild(fragment);
    element.dataset.motionSplit = mode;

    return element.querySelectorAll('.motion-token');
  }

  initCardInteractions() {
    if (this.isTouchLike || this.isReducedMotion) return;

    const cards = document.querySelectorAll('.service-card, .work-card, .pricing-card');
    if (!cards.length) return;

    cards.forEach((card) => {
      const glowLayer = card.querySelector('.service-card__glow, .work-card__overlay');
      const baseScale = card.classList.contains('pricing-card--featured') ? 1.05 : 1;
      const hoverScale = card.classList.contains('pricing-card--featured') ? 1.07 : 1.02;

      card.addEventListener('pointerenter', () => {
        this.rectCache.set(card, card.getBoundingClientRect());
        card.classList.add('is-hovered');

        gsap.to(card, {
          y: -12,
          scale: hoverScale,
          duration: 0.45,
          ease: 'power3.out',
          overwrite: 'auto',
          force3D: true
        });

        if (glowLayer) {
          gsap.to(glowLayer, {
            autoAlpha: 1,
            duration: 0.35,
            ease: 'power2.out',
            overwrite: 'auto'
          });
        }
      });

      card.addEventListener('pointermove', (event) => {
        const rect = this.rectCache.get(card) || card.getBoundingClientRect();
        const offsetX = event.clientX - rect.left;
        const offsetY = event.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateY = ((offsetX - centerX) / centerX) * 5;
        const rotateX = -((offsetY - centerY) / centerY) * 5;

        gsap.to(card, {
          rotationX: rotateX,
          rotationY: rotateY,
          transformPerspective: 1000,
          duration: 0.22,
          ease: 'power2.out',
          overwrite: 'auto',
          force3D: true
        });
      });

      card.addEventListener('pointerleave', () => {
        card.classList.remove('is-hovered');

        gsap.to(card, {
          y: 0,
          scale: baseScale,
          rotationX: 0,
          rotationY: 0,
          duration: 0.65,
          ease: 'power3.out',
          overwrite: 'auto',
          force3D: true
        });

        if (glowLayer) {
          gsap.to(glowLayer, {
            autoAlpha: 0,
            duration: 0.35,
            ease: 'power2.out',
            overwrite: 'auto'
          });
        }
      });
    });
  }

  initSectionTransitions() {
    const sections = document.querySelectorAll('.section-parallax');

    sections.forEach((section) => {
      gsap.fromTo(
        section,
        { yPercent: 0 },
        {
          yPercent: -6,
          ease: 'none',
          force3D: true,
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.2
          }
        }
      );

      gsap.fromTo(
        section,
        { autoAlpha: 0.72 },
        {
          autoAlpha: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top 82%',
            end: 'top 30%',
            scrub: 0.8
          }
        }
      );

      gsap.to(section, {
        autoAlpha: 0.72,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'bottom 70%',
          end: 'bottom 20%',
          scrub: 0.8
        }
      });
    });

    const parallaxLayers = document.querySelectorAll('[data-parallax-image]');
    parallaxLayers.forEach((layer) => {
      gsap.fromTo(
        layer,
        { yPercent: 8 },
        {
          yPercent: -8,
          ease: 'none',
          force3D: true,
          scrollTrigger: {
            trigger: layer.closest('.work-card') || layer,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1
          }
        }
      );
    });
  }

  initCounters() {
    const counters = document.querySelectorAll('[data-count-up] .stat-card__value[data-target]');

    counters.forEach((counter) => {
      const target = Number(counter.getAttribute('data-target') || 0);
      if (!Number.isFinite(target)) return;

      const counterState = { value: 0 };

      gsap.to(counterState, {
        value: target,
        duration: 2,
        ease: 'power2.out',
        onUpdate: () => {
          counter.textContent = Math.round(counterState.value).toString();
        },
        scrollTrigger: {
          trigger: counter,
          start: 'top 85%',
          once: true
        }
      });
    });
  }

  initFooterAndFormReveal() {
    const form = document.querySelector('[data-form-reveal]');
    const formItems = document.querySelectorAll('[data-form-item]');
    const footer = document.querySelector('[data-footer-reveal]');

    if (form) {
      gsap.fromTo(
        form,
        { y: 48, autoAlpha: 0, force3D: true },
        {
          y: 0,
          autoAlpha: 1,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: form,
            start: 'top 82%'
          }
        }
      );
    }

    if (formItems.length) {
      gsap.fromTo(
        formItems,
        { y: 22, autoAlpha: 0, force3D: true },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.7,
          ease: 'power2.out',
          stagger: 0.08,
          scrollTrigger: {
            trigger: form || formItems[0],
            start: 'top 78%'
          }
        }
      );
    }

    if (footer) {
      gsap.fromTo(
        footer,
        { y: 42, autoAlpha: 0, force3D: true },
        {
          y: 0,
          autoAlpha: 1,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: footer,
            start: 'top 88%'
          }
        }
      );
    }
  }

  initGenericReveals() {
    const genericReveals = Array.from(
      document.querySelectorAll('[data-scroll-reveal], [data-reveal]:not([data-reveal="chars"])')
    ).filter((el) => !el.closest('#about'));

    genericReveals.forEach((el) => {
      gsap.to(el, {
        y: 0,
        x: 0,
        autoAlpha: 1,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%'
        }
      });
    });
  }

  initFallbackReveals() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12 }
    );

    document.querySelectorAll('[data-scroll-reveal], [data-reveal], [data-stagger-item], [data-form-item], [data-footer-reveal]').forEach((element) => {
      observer.observe(element);
    });
  }

  ensureHeroVisibility() {
    const heroContainer = document.querySelector('.hero__container');
    const heroWords = document.querySelectorAll('.hero__title-word');
    const heroMeta = document.querySelectorAll('.hero__subtitle, .hero__cta-group, .hero__scroll-indicator');
    const heroTitle = document.querySelector('.hero__title');

    if (heroContainer) {
      heroContainer.style.zIndex = '20';
      heroContainer.style.position = 'relative';
    }

    if (heroTitle) {
      heroTitle.style.visibility = 'visible';
      heroTitle.style.opacity = '1';
    }

    heroWords.forEach((word) => {
      word.style.opacity = '1';
      word.style.visibility = 'visible';
    });

    heroMeta.forEach((element) => {
      element.style.opacity = '1';
      element.style.visibility = 'visible';
    });
  }
}

class EnhancedApp extends App {
  start() {
    super.start();
    new MotionOrchestrator().init();
  }
}

const app = new EnhancedApp();
