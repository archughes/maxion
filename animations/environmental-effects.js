import * as THREE from '../lib/three.module.js';

// Base Effect class for all particle effects
class Effect {
    constructor(object, options = {}) {
        this.object = object;
        this.duration = options.duration || 0; // 0 means infinite, in milliseconds
        this.particleCount = options.particleCount || 50;
        this.particleSize = options.particleSize || 0.1;
        this.color = options.color || 0xffffff;
        this.opacity = options.opacity || 0.8;

        // Initialize particle positions
        this.positions = new Float32Array(this.particleCount * 3);
        this.geometry = new THREE.BufferGeometry();
        this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));

        // Create material with configurable properties
        this.material = new THREE.PointsMaterial({
            color: this.color,
            size: this.particleSize,
            transparent: true,
            opacity: this.opacity
        });

        // Create and add particles to the object
        this.particles = new THREE.Points(this.geometry, this.material);
        this.object.add(this.particles);

        this.animationFrameId = null;
    }

    start() {
        this.initializePositions();
        this.animate();
        if (this.duration > 0) {
            setTimeout(() => this.stop(), this.duration);
        }
    }

    stop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        if (this.particles) {
            this.object.remove(this.particles);
            this.particles = null;
        }
    }

    animate() {
        if (!this.particles) return;
        this.updateParticles();
        this.geometry.attributes.position.needsUpdate = true;
        this.animationFrameId = requestAnimationFrame(() => this.animate());
    }

    // To be overridden by subclasses
    initializePositions() {}
    updateParticles() {}
}

// Sparkle Effect: particles rise with a wavy motion
class SparkleEffect extends Effect {
    constructor(object, options = {}) {
        const defaultOptions = {
            color: 0x00ffff, // Cyan
            particleSize: 0.1,
            opacity: 0.8
        };
        super(object, { ...defaultOptions, ...options });
        this.velocities = new Float32Array(this.particleCount * 3);
    }

    initializePositions() {
        for (let i = 0; i < this.particleCount * 3; i += 3) {
            this.positions[i] = (Math.random() - 0.5) * 0.5;     // x
            this.positions[i + 1] = Math.random() * 0.5;         // y
            this.positions[i + 2] = (Math.random() - 0.5) * 0.5; // z
            this.velocities[i + 1] = Math.random() * 0.01 + 0.01; // Upward velocity
        }
    }

    updateParticles() {
        for (let i = 0; i < this.particleCount * 3; i += 3) {
            this.positions[i + 1] += this.velocities[i + 1]; // Move up
            if (this.positions[i + 1] > 1) {
                this.positions[i + 1] = 0; // Reset to bottom
            }
            // Wavy motion on x-axis
            this.positions[i] += Math.sin(Date.now() * 0.001 + i) * 0.01;
        }
    }
}

// Flame Effect: particles rise with slight horizontal/depth movement and wavy motion
class FlameEffect extends Effect {
    constructor(object, options = {}) {
        const defaultOptions = {
            color: 0xffa500, // Orange
            particleSize: 0.1,
            opacity: 0.8
        };
        super(object, { ...defaultOptions, ...options });
        this.velocities = new Float32Array(this.particleCount * 3);
    }

    initializePositions() {
        for (let i = 0; i < this.particleCount * 3; i += 3) {
            this.positions[i] = (Math.random() - 0.5) * 0.5;     // x
            this.positions[i + 1] = Math.random() * 0.5;         // y
            this.positions[i + 2] = (Math.random() - 0.5) * 0.5; // z
            this.velocities[i] = (Math.random() - 0.5) * 0.01;     // Horizontal
            this.velocities[i + 1] = Math.random() * 0.02 + 0.01;  // Upward
            this.velocities[i + 2] = (Math.random() - 0.5) * 0.01; // Depth
        }
    }

    updateParticles() {
        for (let i = 0; i < this.particleCount * 3; i += 3) {
            this.positions[i] += this.velocities[i];       // x
            this.positions[i + 1] += this.velocities[i + 1]; // y
            this.positions[i + 2] += this.velocities[i + 2]; // z
            if (this.positions[i + 1] > 1) {
                this.positions[i] = (Math.random() - 0.5) * 0.5;
                this.positions[i + 1] = 0;
                this.positions[i + 2] = (Math.random() - 0.5) * 0.5;
            }
            // Wavy motion
            this.positions[i] += Math.sin(Date.now() * 0.001 + i) * 0.002;
            this.positions[i + 2] += Math.cos(Date.now() * 0.001 + i) * 0.002;
        }
    }
}

// Smoke Effect: particles rise slowly and spread out
class SmokeEffect extends Effect {
    constructor(object, options = {}) {
        const defaultOptions = {
            color: 0x888888, // Gray
            particleSize: 0.2,
            opacity: 0.5
        };
        super(object, { ...defaultOptions, ...options });
    }

    initializePositions() {
        for (let i = 0; i < this.particleCount * 3; i += 3) {
            this.positions[i] = (Math.random() - 0.5) * 0.1;     // x (small spread)
            this.positions[i + 1] = Math.random() * 0.1;         // y (start low)
            this.positions[i + 2] = (Math.random() - 0.5) * 0.1; // z (small spread)
        }
    }

    updateParticles() {
        for (let i = 0; i < this.particleCount * 3; i += 3) {
            this.positions[i] += (Math.random() - 0.5) * 0.005;     // Random x drift
            this.positions[i + 1] += 0.005;                         // Slow rise
            this.positions[i + 2] += (Math.random() - 0.5) * 0.005; // Random z drift
            if (this.positions[i + 1] > 1) {
                this.positions[i + 1] = 0; // Reset to bottom
            }
        }
    }
}

// Export functions to create and start effects
export function createSparkleEffect(object, animationTimeOrOptions) {
    let options = {};
    if (typeof animationTimeOrOptions === 'number') {
        options.duration = animationTimeOrOptions;
    } else if (typeof animationTimeOrOptions === 'object') {
        options = animationTimeOrOptions;
    }
    const effect = new SparkleEffect(object, options);
    effect.start();
    return {
        destroy: () => effect.stop()
    };
}

export function createFlameEffect(object, options = {}) {
    const effect = new FlameEffect(object, options);
    effect.start();
    return {
        destroy: () => effect.stop()
    };
}

export function createSmokeEffect(object, options = {}) {
    const effect = new SmokeEffect(object, options);
    effect.start();
    return {
        destroy: () => effect.stop()
    };
}