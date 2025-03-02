// environment-object.js
import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';
import { scene } from './scene.js';

// Base class for all environment objects
class EnvironmentObject {
    constructor(mesh, soundUrl = null) {
        this.mesh = mesh;
        this.createSound(soundUrl);
        scene.add(this.mesh);
        this.baseHeight = 0;
    }
    
    createSound(soundUrl) {
        // Use better sound implementation
        if (soundUrl) {
            this.sound = new Audio(soundUrl);
            // Preload sound
            this.sound.load();
            // Set volume
            this.sound.volume = 0.5;
        } else {
            this.sound = null;
        }
    }
    
    interact() {
        if (this.sound) {
            // Reset sound to beginning if it's playing
            this.sound.currentTime = 0;
            this.sound.play().catch(e => console.warn("Sound play failed:", e));
        }
    }
    
    adjustToTerrain(terrain) {
        const pos = this.mesh.position;
        this.mesh.position.y = terrain.getHeightAt(pos.x, pos.z) + this.baseHeight;
    }
    
    // Helper method to create a glowing effect
    addGlow(color = 0xFFFFFF, intensity = 1, distance = 3) {
        const light = new THREE.PointLight(color, intensity, distance);
        light.position.y = 1;
        this.mesh.add(light);
        return light;
    }
    
    // Helper to add particle effects
    addParticleEffect(color = 0xFFFFFF, count = 20, size = 0.1, speed = 0.02) {
        const particles = new THREE.Group();
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        
        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * 2;
            const y = Math.random() * 2;
            const z = (Math.random() - 0.5) * 2;
            vertices.push(x, y, z);
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        
        const material = new THREE.PointsMaterial({
            color: color,
            size: size,
            transparent: true,
            opacity: 0.7
        });
        
        const particleSystem = new THREE.Points(geometry, material);
        particles.add(particleSystem);
        this.mesh.add(particles);
        
        // Animation data
        particleSystem.userData = {
            velocities: Array(count).fill().map(() => ({
                x: (Math.random() - 0.5) * speed,
                y: Math.random() * speed,
                z: (Math.random() - 0.5) * speed
            }))
        };
        
        return particleSystem;
    }
    
    // Update method for animations
    update(deltaTime) {
        // Override in child classes
    }
}

export { EnvironmentObject };