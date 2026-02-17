// ================================
// CINEMATIC SCROLL MOTION ENGINE
// Elite Production-Grade Scroll System
// ================================

/**
 * INTEGRATION POINT 1: InertialScrollController
 * 
 * Premium scroll feel with:
 * - Virtual scroll interpolation (disconnects DOM scroll from visual scroll)
 * - Velocity tracking & momentum preservation
 * - Damped smoothing with configurable easing curves
 * - Delta filtering to eliminate jitter
 * - Heavy "premium" feel comparable to locomotive-scroll/lenis
 * 
 * USAGE:
 * const scrollEngine = new InertialScrollController({
 *   lerp: 0.08,              // Smoothing factor (lower = heavier)
 *   wheelMultiplier: 1.0,    // Scroll speed multiplier
 *   touchMultiplier: 1.5,    // Touch scroll speed
 *   smoothTouch: true,       // Apply smoothing to touch
 *   direction: 'vertical'    // Scroll direction
 * });
 * 
 * EXTENDS: Existing scroll by adding physics layer
 * PRESERVES: All GSAP ScrollTrigger functionality
 */
class InertialScrollController {
  constructor(options = {}) {
    this.options = {
      lerp: 0.08,                    // Interpolation factor (0.05-0.15 range)
      wheelMultiplier: 1.0,          // Wheel event multiplier
      touchMultiplier: 1.5,          // Touch event multiplier  
      smoothTouch: true,             // Apply smoothing to touch
      direction: 'vertical',         // 'vertical' | 'horizontal'
      smooth: true,                  // Enable/disable smoothing
      mouseMultiplier: 1.0,          // Mouse wheel multiplier
      firefoxMultiplier: 15,         // Firefox scroll normalization
      touchInertia: 0.95,            // Touch momentum decay (0-1)
      ease: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Easing curve
      ...options
    };

    this.data = {
      current: 0,           // Visual scroll position
      target: 0,            // Target scroll position (from events)
      last: 0,              // Previous frame position
      velocity: 0,          // Current velocity
      direction: 0,         // Scroll direction (-1, 0, 1)
      speed: 0,             // Absolute speed
      momentum: 0           // Momentum for touch
    };

    this.bounds = {
      min: 0,
      max: 0
    };

    this.isRunning = false;
    this.isTouch = false;
    this.touchStart = { x: 0, y: 0 };
    this.touchVelocity = { x: 0, y: 0 };
    this.lastTouchTime = 0;

    // Callbacks
    this.callbacks = {
      onScroll: null,
      onVelocity: null
    };

    // RAF
    this.rafId = null;

    // Keep stable handler references for proper cleanup.
    this.handlers = {
      onWheel: (e) => this.onWheel(e),
      onTouchStart: (e) => this.onTouchStart(e),
      onTouchMove: (e) => this.onTouchMove(e),
      onTouchEnd: (e) => this.onTouchEnd(e),
      onResize: () => this.updateBounds()
    };

    this.init();
  }

  init() {
    // Calculate scroll bounds
    this.updateBounds();

    // Set initial position
    this.data.current = window.scrollY || window.pageYOffset;
    this.data.target = this.data.current;
    this.data.last = this.data.current;

    // Bind scroll events
    this.bindEvents();

    // Start RAF loop
    this.start();

    // Update bounds on resize
    window.addEventListener('resize', this.handlers.onResize, { passive: true });

    console.log('🎯 InertialScrollController initialized');
  }

  updateBounds() {
    const maxScroll = this.options.direction === 'vertical'
      ? document.documentElement.scrollHeight - window.innerHeight
      : document.documentElement.scrollWidth - window.innerWidth;

    this.bounds.max = Math.max(0, maxScroll);
  }

  bindEvents() {
    // Wheel events (desktop)
    window.addEventListener('wheel', this.handlers.onWheel, { passive: false });

    // Touch events (mobile)
    window.addEventListener('touchstart', this.handlers.onTouchStart, { passive: true });
    window.addEventListener('touchmove', this.handlers.onTouchMove, { passive: false });
    window.addEventListener('touchend', this.handlers.onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', this.handlers.onTouchEnd, { passive: true });

    // Mouse events (drag scroll - optional)
    // Can be extended for drag-to-scroll functionality
  }

  onWheel(e) {
    if (!this.options.smooth) return;

    e.preventDefault();

    // Normalize wheel delta across browsers
    let delta = e.deltaY;

    // Firefox uses different wheel delta
    if (e.deltaMode === 1) {
      delta *= this.options.firefoxMultiplier;
    }

    // Apply multiplier
    delta *= this.options.wheelMultiplier;

    // Update target position
    this.data.target += delta;
    this.data.target = Math.max(this.bounds.min, Math.min(this.data.target, this.bounds.max));
  }

  onTouchStart(e) {
    this.isTouch = true;
    const touch = e.touches[0];

    this.touchStart = {
      x: touch.clientX,
      y: touch.clientY
    };

    this.lastTouchTime = performance.now();
    this.touchVelocity = { x: 0, y: 0 };
  }

  onTouchMove(e) {
    if (!this.isTouch) return;

    const touch = e.touches[0];
    const now = performance.now();
    const dt = now - this.lastTouchTime;

    const deltaX = touch.clientX - this.touchStart.x;
    const deltaY = touch.clientY - this.touchStart.y;

    // Calculate velocity
    if (dt > 0) {
      this.touchVelocity.x = deltaX / dt;
      this.touchVelocity.y = deltaY / dt;
    }

    if (this.options.direction === 'vertical') {
      if (this.options.smoothTouch) {
        e.preventDefault();
        this.data.target -= deltaY * this.options.touchMultiplier;
      }
    } else {
      if (this.options.smoothTouch) {
        e.preventDefault();
        this.data.target -= deltaX * this.options.touchMultiplier;
      }
    }

    this.data.target = Math.max(this.bounds.min, Math.min(this.data.target, this.bounds.max));

    // Update touch start for delta calculation
    this.touchStart = {
      x: touch.clientX,
      y: touch.clientY
    };

    this.lastTouchTime = now;
  }

  onTouchEnd(e) {
    // Apply momentum based on velocity
    if (this.options.smoothTouch && this.isTouch) {
      const velocity = this.options.direction === 'vertical'
        ? this.touchVelocity.y
        : this.touchVelocity.x;

      // Apply momentum impulse
      this.data.momentum = -velocity * 30 * this.options.touchMultiplier;
    }

    this.isTouch = false;
  }

  update() {
    if (!this.options.smooth) {
      this.data.current = this.data.target;
      return;
    }

    // Apply momentum decay
    if (Math.abs(this.data.momentum) > 0.1) {
      this.data.target += this.data.momentum;
      this.data.momentum *= this.options.touchInertia;
      this.data.target = Math.max(this.bounds.min, Math.min(this.data.target, this.bounds.max));
    } else {
      this.data.momentum = 0;
    }

    // Store last position
    this.data.last = this.data.current;

    // Interpolate current towards target with easing
    const delta = this.data.target - this.data.current;
    const lerp = this.options.lerp;

    // Apply custom easing curve
    const progress = this.options.ease(lerp);
    this.data.current += delta * progress;

    // Early settle to avoid forcing layout/scroll work every frame when nearly idle
    const isNearlySettled = Math.abs(this.data.target - this.data.current) < 0.1;
    const hasMomentum = Math.abs(this.data.momentum) > 0.1;
    if (isNearlySettled && !hasMomentum) {
      this.data.current = this.data.target;
    }

    // Calculate velocity & speed
    this.data.velocity = this.data.current - this.data.last;
    this.data.speed = Math.abs(this.data.velocity);

    // Calculate direction
    if (this.data.velocity > 0.1) {
      this.data.direction = 1;
    } else if (this.data.velocity < -0.1) {
      this.data.direction = -1;
    } else {
      this.data.direction = 0;
    }

    // Sync actual DOM scroll only when meaningful movement occurred
    if (this.data.speed > 0.01 || Math.abs(window.scrollY - this.data.current) > 0.5) {
      window.scrollTo(0, this.data.current);
    } else {
      this.data.velocity = 0;
      this.data.speed = 0;
      this.data.direction = 0;
    }

    // Fire callbacks
    if (this.callbacks.onScroll && (this.data.speed > 0.01 || hasMomentum)) {
      this.callbacks.onScroll(this.data);
    }

    if (this.callbacks.onVelocity && this.data.speed > 0.01) {
      this.callbacks.onVelocity(this.data.velocity, this.data.speed);
    }
  }

  animate() {
    this.update();
    this.rafId = requestAnimationFrame(() => this.animate());
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.animate();
  }

  stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  scrollTo(target, immediate = false) {
    this.data.target = Math.max(this.bounds.min, Math.min(target, this.bounds.max));

    if (immediate) {
      this.data.current = this.data.target;
      window.scrollTo(0, this.data.current);
    }
  }

  on(event, callback) {
    if (event === 'scroll') {
      this.callbacks.onScroll = callback;
    } else if (event === 'velocity') {
      this.callbacks.onVelocity = callback;
    }
  }

  destroy() {
    this.stop();
    // Remove event listeners
    window.removeEventListener('wheel', this.handlers.onWheel);
    window.removeEventListener('touchstart', this.handlers.onTouchStart);
    window.removeEventListener('touchmove', this.handlers.onTouchMove);
    window.removeEventListener('touchend', this.handlers.onTouchEnd);
    window.removeEventListener('touchcancel', this.handlers.onTouchEnd);
    window.removeEventListener('resize', this.handlers.onResize);
  }
}


/**
 * INTEGRATION POINT 2: CinematicCameraRig
 * 
 * Advanced camera choreography system that extends HeroScene3D camera
 * 
 * Features:
 * - Cinematic arcs and depth push/pull
 * - Rotation drift based on scroll velocity
 * - Focus distance shifts (simulated depth-of-field)
 * - Micro camera shake for organic feel
 * - Procedural noise modulation (Perlin-style)
 * - Authored motion curves (not linear)
 * 
 * INTEGRATION:
 * const cameraRig = new CinematicCameraRig(STATE.camera3D, {
 *   scrollController: inertialScrollController,
 *   intensity: 1.0
 * });
 * 
 * Call in HeroScene3D.animate():
 * cameraRig.update(scrollProgress, velocity, deltaTime);
 */
class CinematicCameraRig {
  constructor(camera, options = {}) {
    this.camera = camera;
    this.options = {
      scrollController: null,
      intensity: 1.0,
      depthRange: 2.5,           // Camera Z movement range
      arcRadius: 0.8,            // Lateral arc movement
      rotationDrift: 0.15,       // Rotation based on velocity
      shakeIntensity: 0.02,      // Micro shake amount
      noiseScale: 0.3,           // Procedural noise scale
      fovBreathing: 5,           // FOV oscillation range
      focusShiftRange: 2.0,      // Focus distance variation
      ...options
    };

    // Camera state
    this.state = {
      basePosition: { ...this.camera.position },
      baseFOV: this.camera.fov,
      targetPosition: { x: 0, y: 0, z: 0 },
      targetRotation: { x: 0, y: 0, z: 0 },
      targetFOV: this.camera.fov,
      shake: { x: 0, y: 0, z: 0 },
      noiseOffset: { x: Math.random() * 100, y: Math.random() * 100 }
    };

    // Motion tracking
    this.motion = {
      scrollProgress: 0,
      velocity: 0,
      smoothVelocity: 0,
      time: 0
    };

    console.log('🎥 CinematicCameraRig initialized');
  }

  /**
   * Simplified noise function (approximation of Perlin noise)
   */
  noise2D(x, y) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;

    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);

    const hash = (i, j) => {
      const n = i * 374761393 + j * 668265263;
      return ((n ^ (n >> 13)) * 1274126177) & 0xffffffff;
    };

    const a = hash(X, Y);
    const b = hash(X + 1, Y);
    const c = hash(X, Y + 1);
    const d = hash(X + 1, Y + 1);

    const k0 = a & 0xff;
    const k1 = b & 0xff;
    const k2 = c & 0xff;
    const k3 = d & 0xff;

    const x1 = k0 + u * (k1 - k0);
    const x2 = k2 + u * (k3 - k2);

    return (x1 + v * (x2 - x1)) / 255 * 2 - 1;
  }

  /**
   * Calculate cinematic camera arc path
   */
  calculateArcMotion(progress) {
    const { arcRadius, depthRange } = this.options;

    // Create S-curve for smooth arc
    const eased = progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;

    // Sinusoidal lateral movement
    const x = Math.sin(progress * Math.PI * 2) * arcRadius;

    // Depth push/pull with easing
    const z = this.state.basePosition.z + Math.sin(eased * Math.PI) * depthRange;

    // Vertical drift
    const y = Math.sin(progress * Math.PI * 1.5) * (arcRadius * 0.5);

    return { x, y, z };
  }

  /**
   * Apply velocity-based rotation drift
   */
  calculateRotationDrift(velocity) {
    const { rotationDrift } = this.options;

    // Smooth velocity for stable rotation
    this.motion.smoothVelocity += (velocity - this.motion.smoothVelocity) * 0.1;

    const rotX = this.motion.smoothVelocity * rotationDrift * 0.5;
    const rotY = this.motion.smoothVelocity * rotationDrift;
    const rotZ = this.motion.smoothVelocity * rotationDrift * 0.3;

    return { x: rotX, y: rotY, z: rotZ };
  }

  /**
   * Generate micro camera shake using noise
   */
  calculateMicroShake(time) {
    const { shakeIntensity, noiseScale } = this.options;

    const nx = this.state.noiseOffset.x + time * noiseScale;
    const ny = this.state.noiseOffset.y + time * noiseScale * 1.3;
    const nz = (nx + ny) * 0.7;

    return {
      x: this.noise2D(nx, ny) * shakeIntensity,
      y: this.noise2D(ny, nz) * shakeIntensity,
      z: this.noise2D(nz, nx) * shakeIntensity * 0.5
    };
  }

  /**
   * Calculate FOV breathing (subtle oscillation)
   */
  calculateFOVBreathing(time) {
    const { fovBreathing } = this.options;
    const breathCycle = Math.sin(time * 0.5) * 0.5 + 0.5;
    return this.state.baseFOV + breathCycle * fovBreathing;
  }

  /**
   * Main update loop - call from HeroScene3D.animate()
   */
  update(scrollProgress, velocity = 0, deltaTime = 0.016) {
    this.motion.scrollProgress = scrollProgress;
    this.motion.velocity = velocity;
    this.motion.time += deltaTime;

    const { intensity } = this.options;

    // Calculate arc motion
    const arcMotion = this.calculateArcMotion(scrollProgress);

    // Calculate rotation drift
    const rotationDrift = this.calculateRotationDrift(velocity);

    // Calculate micro shake
    const shake = this.calculateMicroShake(this.motion.time);

    // Calculate FOV breathing
    const fov = this.calculateFOVBreathing(this.motion.time);

    // Apply to camera with intensity multiplier
    this.camera.position.x = this.state.basePosition.x +
      (arcMotion.x + shake.x) * intensity;
    this.camera.position.y = this.state.basePosition.y +
      (arcMotion.y + shake.y) * intensity;
    this.camera.position.z = arcMotion.z + shake.z * intensity;

    // Apply rotation
    this.camera.rotation.x += (rotationDrift.x * intensity - this.camera.rotation.x) * 0.1;
    this.camera.rotation.y += (rotationDrift.y * intensity - this.camera.rotation.y) * 0.1;
    this.camera.rotation.z += (rotationDrift.z * intensity - this.camera.rotation.z) * 0.1;

    // Apply FOV
    this.camera.fov = fov;
    this.camera.updateProjectionMatrix();
  }

  /**
   * Reset camera to base state
   */
  reset() {
    this.camera.position.copy(this.state.basePosition);
    this.camera.rotation.set(0, 0, 0);
    this.camera.fov = this.state.baseFOV;
    this.camera.updateProjectionMatrix();
  }
}


/**
 * INTEGRATION POINT 3: VolumetricParallaxField
 * 
 * Multi-layer parallax system with depth-aware motion scaling
 * 
 * Features:
 * - Foreground, midground, background layers
 * - Depth-weighted motion scaling
 * - Shader distortion influence
 * - Volumetric depth sensation
 * - Works with existing scene identity motifs
 * 
 * INTEGRATION:
 * const parallaxField = new VolumetricParallaxField(STATE.scene3D, {
 *   depthLayers: STATE.heroObjects.depthLayers
 * });
 * 
 * Call in HeroScene3D.animate():
 * parallaxField.update(scrollY, velocity);
 */
class VolumetricParallaxField {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.options = {
      depthLayers: {
        foreground: [],
        midground: [],
        background: []
      },
      parallaxStrength: {
        foreground: 1.8,     // Exaggerated motion
        midground: 1.0,      // Normal motion
        background: 0.4      // Dragging motion
      },
      distortionInfluence: 0.3,
      ...options
    };

    this.scrollState = {
      current: 0,
      velocity: 0,
      direction: 0
    };

    console.log('🌌 VolumetricParallaxField initialized');
  }

  /**
   * Update parallax motion based on scroll
   */
  update(scrollY, velocity = 0) {
    this.scrollState.current = scrollY;
    this.scrollState.velocity = velocity;
    this.scrollState.direction = Math.sign(velocity);

    const { depthLayers, parallaxStrength } = this.options;

    // Normalized scroll (0-1 across page)
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const normalizedScroll = maxScroll > 0 ? scrollY / maxScroll : 0;

    // Apply parallax to each layer
    this.applyLayerParallax(depthLayers.foreground, parallaxStrength.foreground, normalizedScroll);
    this.applyLayerParallax(depthLayers.midground, parallaxStrength.midground, normalizedScroll);
    this.applyLayerParallax(depthLayers.background, parallaxStrength.background, normalizedScroll);
  }

  /**
   * Apply parallax motion to layer objects
   */
  applyLayerParallax(objects, strength, scrollProgress) {
    if (!objects || objects.length === 0) return;

    objects.forEach((obj, index) => {
      if (!obj) return;

      // Calculate parallax offset with stagger
      const stagger = index * 0.1;
      const offset = (scrollProgress - 0.5 + stagger) * strength;

      // Apply Y-axis parallax (vertical scroll)
      obj.position.y += (offset * 2 - obj.position.y) * 0.05;

      // Apply subtle X-axis drift
      const drift = Math.sin(scrollProgress * Math.PI + index) * strength * 0.3;
      obj.position.x += (drift - obj.position.x) * 0.03;

      // Apply rotation based on scroll velocity
      if (this.scrollState.velocity !== 0) {
        obj.rotation.y += this.scrollState.velocity * 0.001 * strength;
        obj.rotation.x += this.scrollState.velocity * 0.0005 * strength;
      }
    });
  }

  /**
   * Add object to depth layer
   */
  addToLayer(object, layerName) {
    if (this.options.depthLayers[layerName]) {
      this.options.depthLayers[layerName].push(object);
    }
  }

  /**
   * Remove object from all layers
   */
  removeObject(object) {
    Object.keys(this.options.depthLayers).forEach(layerName => {
      const layer = this.options.depthLayers[layerName];
      const index = layer.indexOf(object);
      if (index > -1) {
        layer.splice(index, 1);
      }
    });
  }
}


// Export for module usage (if using build system)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    InertialScrollController,
    CinematicCameraRig,
    VolumetricParallaxField
  };
}
