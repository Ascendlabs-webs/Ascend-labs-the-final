// ================================
// ADVANCED SCENE TRANSITIONS & FX
// Scene Narrative System + Scroll-Reactive Effects
// ================================

/**
 * INTEGRATION POINT 4: SceneTransitionNarrative
 * 
 * Extends CinematicTransitions with advanced geometry manipulation
 * 
 * Features:
 * - Geometry dissolve/assemble (vertex morphing)
 * - Object morphing between shapes
 * - Fog palette interpolation
 * - Lighting choreography
 * - Particle reflow
 * - Environmental continuity (no hard cuts)
 * 
 * INTEGRATION:
 * const transitionNarrative = new SceneTransitionNarrative(
 *   STATE.cinematic.scene,
 *   STATE.cinematic.sceneObjects
 * );
 * 
 * Call during section transitions in CinematicTransitions
 */
class SceneTransitionNarrative {
  constructor(scene, sceneObjects, options = {}) {
    this.scene = scene;
    this.sceneObjects = sceneObjects;
    this.options = {
      morphDuration: 1.2,
      dissolveSpeed: 0.8,
      particleCount: 150,
      enableGeometryMorph: true,
      enableParticleReflow: true,
      ...options
    };

    // Morph state
    this.morphState = {
      active: false,
      progress: 0,
      sourceGeometry: null,
      targetGeometry: null,
      currentObject: null
    };

    // Dissolve particles
    this.dissolveParticles = null;
    this.particleSystem = null;

    // Fog transition
    this.fogTransition = {
      sourceColor: new THREE.Color(),
      targetColor: new THREE.Color(),
      progress: 0
    };

    this.initDissolveSystem();
    console.log('🎭 SceneTransitionNarrative initialized');
  }

  /**
   * Initialize particle system for dissolve effects
   */
  initDissolveSystem() {
    if (!this.options.enableParticleReflow) return;

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.options.particleCount * 3);
    const velocities = new Float32Array(this.options.particleCount * 3);
    const sizes = new Float32Array(this.options.particleCount);
    const alphas = new Float32Array(this.options.particleCount);

    // Initialize particle attributes
    for (let i = 0; i < this.options.particleCount; i++) {
      const i3 = i * 3;
      
      // Random initial positions
      positions[i3] = (Math.random() - 0.5) * 10;
      positions[i3 + 1] = (Math.random() - 0.5) * 10;
      positions[i3 + 2] = (Math.random() - 0.5) * 10;

      // Random velocities
      velocities[i3] = (Math.random() - 0.5) * 0.02;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.02;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.02;

      // Random sizes
      sizes[i] = Math.random() * 0.1 + 0.05;
      alphas[i] = 0;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));

    // Particle material with custom shader
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(0x6f83ff) }
      },
      vertexShader: `
        attribute float size;
        attribute float alpha;
        varying float vAlpha;
        
        void main() {
          vAlpha = alpha;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vAlpha;
        
        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          if (dist > 0.5) discard;
          
          float alpha = (1.0 - dist * 2.0) * vAlpha;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.particleSystem = new THREE.Points(geometry, material);
    this.particleSystem.visible = false;
    this.scene.add(this.particleSystem);
  }

  /**
   * Trigger transition between two objects with morphing
   */
  transitionBetweenObjects(sourceObj, targetObj, config = {}) {
    const {
      duration = this.options.morphDuration,
      useParticles = true,
      fogColorTransition = true
    } = config;

    if (!this.options.enableGeometryMorph) {
      // Fallback to simple fade
      this.simpleFadeTransition(sourceObj, targetObj, duration);
      return;
    }

    // Start morph
    this.morphState.active = true;
    this.morphState.progress = 0;
    this.morphState.currentObject = sourceObj;

    // Geometry morph timeline using GSAP
    const timeline = gsap.timeline();

    // Phase 1: Dissolve source object
    timeline.to(this.morphState, {
      progress: 0.5,
      duration: duration * 0.4,
      ease: 'power2.in',
      onUpdate: () => {
        this.updateDissolve(sourceObj, this.morphState.progress * 2);
      }
    });

    // Phase 2: Show particle reflow
    if (useParticles && this.particleSystem) {
      timeline.call(() => this.triggerParticleReflow(sourceObj, targetObj), null, duration * 0.4);
    }

    // Phase 3: Assemble target object
    timeline.to(this.morphState, {
      progress: 1.0,
      duration: duration * 0.6,
      ease: 'power2.out',
      onStart: () => {
        this.morphState.currentObject = targetObj;
        targetObj.visible = true;
      },
      onUpdate: () => {
        const assembleProgress = (this.morphState.progress - 0.5) * 2;
        this.updateAssemble(targetObj, assembleProgress);
      },
      onComplete: () => {
        this.morphState.active = false;
        sourceObj.visible = false;
        this.hideParticleReflow();
      }
    });

    return timeline;
  }

  /**
   * Update dissolve effect on object
   */
  updateDissolve(obj, progress) {
    if (!obj || !obj.material) return;

    // Scale down
    const scale = 1 - progress * 0.3;
    obj.scale.set(scale, scale, scale);

    // Fade opacity
    if (obj.material.opacity !== undefined) {
      obj.material.transparent = true;
      obj.material.opacity = 1 - progress;
    }

    // Scatter vertices (if geometry is modifiable)
    if (obj.geometry && obj.geometry.attributes.position) {
      const positions = obj.geometry.attributes.position.array;
      const originalPositions = obj.geometry.attributes.position.originalArray;

      if (!originalPositions) {
        // Store original positions
        obj.geometry.attributes.position.originalArray = new Float32Array(positions);
      } else {
        // Scatter vertices
        for (let i = 0; i < positions.length; i += 3) {
          const scatter = progress * 0.5;
          positions[i] = originalPositions[i] + (Math.random() - 0.5) * scatter;
          positions[i + 1] = originalPositions[i + 1] + (Math.random() - 0.5) * scatter;
          positions[i + 2] = originalPositions[i + 2] + (Math.random() - 0.5) * scatter;
        }
        obj.geometry.attributes.position.needsUpdate = true;
      }
    }
  }

  /**
   * Update assemble effect on object
   */
  updateAssemble(obj, progress) {
    if (!obj || !obj.material) return;

    // Scale up from small
    const scale = 0.7 + progress * 0.3;
    obj.scale.set(scale, scale, scale);

    // Fade in opacity
    if (obj.material.opacity !== undefined) {
      obj.material.transparent = true;
      obj.material.opacity = progress;
    }

    // Gather vertices (reverse of scatter)
    if (obj.geometry && obj.geometry.attributes.position) {
      const positions = obj.geometry.attributes.position.array;
      const originalPositions = obj.geometry.attributes.position.originalArray;

      if (!originalPositions) {
        obj.geometry.attributes.position.originalArray = new Float32Array(positions);
      } else {
        const scatter = (1 - progress) * 0.5;
        for (let i = 0; i < positions.length; i += 3) {
          positions[i] = originalPositions[i] + (Math.random() - 0.5) * scatter;
          positions[i + 1] = originalPositions[i + 1] + (Math.random() - 0.5) * scatter;
          positions[i + 2] = originalPositions[i + 2] + (Math.random() - 0.5) * scatter;
        }
        obj.geometry.attributes.position.needsUpdate = true;
      }
    }
  }

  /**
   * Simple fade transition fallback
   */
  simpleFadeTransition(sourceObj, targetObj, duration) {
    const timeline = gsap.timeline();

    timeline.to(sourceObj.material, {
      opacity: 0,
      duration: duration * 0.5,
      ease: 'power2.in',
      onStart: () => {
        sourceObj.material.transparent = true;
      }
    });

    timeline.to(targetObj.material, {
      opacity: 1,
      duration: duration * 0.5,
      ease: 'power2.out',
      onStart: () => {
        targetObj.visible = true;
        targetObj.material.transparent = true;
        targetObj.material.opacity = 0;
      },
      onComplete: () => {
        sourceObj.visible = false;
      }
    }, duration * 0.5);

    return timeline;
  }

  /**
   * Trigger particle reflow between objects
   */
  triggerParticleReflow(sourceObj, targetObj) {
    if (!this.particleSystem) return;

    this.particleSystem.visible = true;
    
    const positions = this.particleSystem.geometry.attributes.position.array;
    const velocities = this.particleSystem.geometry.attributes.velocity.array;
    const alphas = this.particleSystem.geometry.attributes.alpha.array;

    // Position particles at source object location
    const sourcePos = sourceObj.position;
    
    for (let i = 0; i < this.options.particleCount; i++) {
      const i3 = i * 3;
      
      // Start at source
      positions[i3] = sourcePos.x + (Math.random() - 0.5) * 2;
      positions[i3 + 1] = sourcePos.y + (Math.random() - 0.5) * 2;
      positions[i3 + 2] = sourcePos.z + (Math.random() - 0.5) * 2;

      // Velocity towards target
      const targetPos = targetObj.position;
      velocities[i3] = (targetPos.x - positions[i3]) * 0.05;
      velocities[i3 + 1] = (targetPos.y - positions[i3 + 1]) * 0.05;
      velocities[i3 + 2] = (targetPos.z - positions[i3 + 2]) * 0.05;

      // Fade in
      alphas[i] = 1;
    }

    this.particleSystem.geometry.attributes.position.needsUpdate = true;
    this.particleSystem.geometry.attributes.velocity.needsUpdate = true;
    this.particleSystem.geometry.attributes.alpha.needsUpdate = true;

    // Animate particle flow
    gsap.to(this.particleSystem.geometry.attributes.alpha.array, {
      duration: 0.8,
      ease: 'power2.inOut',
      onUpdate: () => {
        this.updateParticleFlow();
      }
    });
  }

  /**
   * Update particle flow animation
   */
  updateParticleFlow() {
    if (!this.particleSystem || !this.particleSystem.visible) return;

    const positions = this.particleSystem.geometry.attributes.position.array;
    const velocities = this.particleSystem.geometry.attributes.velocity.array;
    const alphas = this.particleSystem.geometry.attributes.alpha.array;

    for (let i = 0; i < this.options.particleCount; i++) {
      const i3 = i * 3;
      
      // Update positions
      positions[i3] += velocities[i3];
      positions[i3 + 1] += velocities[i3 + 1];
      positions[i3 + 2] += velocities[i3 + 2];

      // Dampen velocities
      velocities[i3] *= 0.98;
      velocities[i3 + 1] *= 0.98;
      velocities[i3 + 2] *= 0.98;

      // Fade out
      alphas[i] *= 0.95;
    }

    this.particleSystem.geometry.attributes.position.needsUpdate = true;
    this.particleSystem.geometry.attributes.alpha.needsUpdate = true;
  }

  /**
   * Hide particle reflow
   */
  hideParticleReflow() {
    if (!this.particleSystem) return;
    
    gsap.to(this.particleSystem.material.uniforms.uTime, {
      value: 0,
      duration: 0.3,
      onComplete: () => {
        this.particleSystem.visible = false;
      }
    });
  }

  /**
   * Transition fog colors
   */
  transitionFog(fromColor, toColor, duration = 1.0) {
    if (!this.scene.fog) return;

    this.fogTransition.sourceColor.set(fromColor);
    this.fogTransition.targetColor.set(toColor);
    this.fogTransition.progress = 0;

    gsap.to(this.fogTransition, {
      progress: 1,
      duration,
      ease: 'power2.inOut',
      onUpdate: () => {
        const mixed = this.fogTransition.sourceColor.clone().lerp(
          this.fogTransition.targetColor,
          this.fogTransition.progress
        );
        this.scene.fog.color.copy(mixed);
      }
    });
  }

  /**
   * Choreograph lighting transition
   */
  transitionLighting(lights, targetIntensities, duration = 1.0) {
    lights.forEach((light, index) => {
      const targetIntensity = targetIntensities[index];
      if (targetIntensity !== undefined) {
        gsap.to(light, {
          intensity: targetIntensity,
          duration,
          ease: 'power2.inOut'
        });
      }
    });
  }
}


/**
 * INTEGRATION POINT 5: ScrollReactiveFX
 * 
 * Post-processing and micro-interaction effects driven by scroll
 * 
 * Features:
 * - Dynamic bloom intensity
 * - Motion blur pulses
 * - FOV breathing
 * - Exposure adaptation
 * - Chromatic aberration shifts
 * - Audio-reactive placeholder
 * 
 * INTEGRATION:
 * const scrollFX = new ScrollReactiveFX(STATE.renderer3D, STATE.scene3D, STATE.camera3D);
 * 
 * Call in animate loop:
 * scrollFX.update(scrollVelocity, scrollProgress);
 */
class ScrollReactiveFX {
  constructor(renderer, scene, camera, options = {}) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.options = {
      enableBloom: true,
      enableMotionBlur: true,
      enableFOVBreathing: true,
      enableExposureAdapt: true,
      enableChromaticAberration: true,
      bloomIntensity: 0.5,
      motionBlurStrength: 0.3,
      fovRange: 5,
      exposureRange: 0.3,
      chromaticAmount: 0.002,
      ...options
    };

    this.state = {
      bloomIntensity: this.options.bloomIntensity,
      motionBlurAmount: 0,
      fovOffset: 0,
      exposure: 1.0,
      chromaticOffset: 0,
      velocity: 0,
      smoothVelocity: 0
    };

    // Post-processing composer (if using EffectComposer)
    this.composer = null;
    this.passes = {};

    console.log('✨ ScrollReactiveFX initialized');
  }

  /**
   * Update effects based on scroll state
   */
  update(velocity = 0, scrollProgress = 0) {
    // Smooth velocity for stable effects
    this.state.velocity = velocity;
    this.state.smoothVelocity += (velocity - this.state.smoothVelocity) * 0.1;

    const speed = Math.abs(this.state.smoothVelocity);

    // Update individual effects
    if (this.options.enableBloom) {
      this.updateBloom(speed);
    }

    if (this.options.enableMotionBlur) {
      this.updateMotionBlur(speed);
    }

    if (this.options.enableFOVBreathing) {
      this.updateFOVBreathing(scrollProgress);
    }

    if (this.options.enableExposureAdapt) {
      this.updateExposure(speed);
    }

    if (this.options.enableChromaticAberration) {
      this.updateChromaticAberration(speed);
    }
  }

  /**
   * Dynamic bloom intensity based on scroll speed
   */
  updateBloom(speed) {
    // Increase bloom on fast scrolling
    const targetBloom = this.options.bloomIntensity + speed * 0.5;
    this.state.bloomIntensity += (targetBloom - this.state.bloomIntensity) * 0.1;

    // Apply to renderer (if using tone mapping)
    if (this.renderer.toneMappingExposure !== undefined) {
      this.renderer.toneMappingExposure = 1.0 + this.state.bloomIntensity * 0.2;
    }

    // If using post-processing bloom pass
    if (this.passes.bloom) {
      this.passes.bloom.strength = this.state.bloomIntensity;
    }
  }

  /**
   * Motion blur pulses during scroll
   */
  updateMotionBlur(speed) {
    // Pulse motion blur based on velocity
    const targetBlur = speed * this.options.motionBlurStrength;
    this.state.motionBlurAmount += (targetBlur - this.state.motionBlurAmount) * 0.15;

    // Apply to motion blur pass (if available)
    if (this.passes.motionBlur) {
      this.passes.motionBlur.strength = this.state.motionBlurAmount;
    }
  }

  /**
   * FOV breathing effect
   */
  updateFOVBreathing(scrollProgress) {
    // Subtle FOV oscillation tied to scroll
    const breathCycle = Math.sin(scrollProgress * Math.PI * 2) * 0.5 + 0.5;
    const targetFOV = breathCycle * this.options.fovRange;
    
    this.state.fovOffset += (targetFOV - this.state.fovOffset) * 0.05;

    // Note: FOV is typically handled by CinematicCameraRig
    // This is a complementary micro-adjustment
  }

  /**
   * Exposure adaptation (simulates eye adaptation)
   */
  updateExposure(speed) {
    // Reduce exposure during fast motion (motion adaptation)
    const targetExposure = 1.0 - speed * this.options.exposureRange;
    this.state.exposure += (targetExposure - this.state.exposure) * 0.08;

    // Apply to renderer
    if (this.renderer.toneMappingExposure !== undefined) {
      this.renderer.toneMappingExposure = this.state.exposure;
    }
  }

  /**
   * Chromatic aberration shift during scroll
   */
  updateChromaticAberration(speed) {
    // Increase chromatic aberration on fast scroll
    const targetChromatic = speed * this.options.chromaticAmount;
    this.state.chromaticOffset += (targetChromatic - this.state.chromaticOffset) * 0.1;

    // Apply to chromatic aberration pass (if available)
    if (this.passes.chromatic) {
      this.passes.chromatic.offset = this.state.chromaticOffset;
    }
  }

  /**
   * Audio-reactive placeholder (can be extended with Web Audio API)
   */
  updateAudioReactive(audioData) {
    // Placeholder for audio-reactive effects
    // Can be connected to Web Audio API frequency data
    
    // Example: Boost bloom based on bass frequencies
    if (audioData && audioData.bass) {
      this.state.bloomIntensity += audioData.bass * 0.3;
    }
  }

  /**
   * Setup post-processing composer (advanced)
   */
  setupPostProcessing() {
    // This requires THREE.EffectComposer and post-processing passes
    // Only if user has these libraries loaded
    
    if (typeof THREE.EffectComposer === 'undefined') {
      console.warn('EffectComposer not available. Skipping post-processing setup.');
      return;
    }

    // Create composer
    this.composer = new THREE.EffectComposer(this.renderer);
    
    // Render pass
    const renderPass = new THREE.RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    // Bloom pass (if available)
    if (this.options.enableBloom && typeof THREE.UnrealBloomPass !== 'undefined') {
      const bloomPass = new THREE.UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        this.options.bloomIntensity,
        0.4,
        0.85
      );
      this.passes.bloom = bloomPass;
      this.composer.addPass(bloomPass);
    }

    // Output pass
    if (typeof THREE.OutputPass !== 'undefined') {
      const outputPass = new THREE.OutputPass();
      this.composer.addPass(outputPass);
    }

    console.log('📸 Post-processing composer setup complete');
  }

  /**
   * Render with post-processing (if composer exists)
   */
  render() {
    if (this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }
}


// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SceneTransitionNarrative,
    ScrollReactiveFX
  };
}
