// environment-object.js
import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';
import { scene } from './scene.js';
import { soundManager } from '../game.js';

// Base class for all environment objects
class EnvironmentObject {
    constructor(mesh, soundUrl = null, interactionsToHarvest = 1, respawnTime = 60) {
        this.mesh = mesh;
        this.soundUrl = soundUrl;
        scene.add(this.mesh);
        this.baseHeight = 0;
        this.interactionsToHarvest = interactionsToHarvest;
        this.currentInteractions = 0;
        this.respawnTime = respawnTime;
        this.isHarvested = false;
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
        if (this.isHarvested) return;
        if (this.soundUrl) {
            soundManager.playSound(this.soundUrl);
        }
        this.currentInteractions++;
        if (this.currentInteractions >= this.interactionsToHarvest && Math.random() > 0.3) {
            this.harvest();
        }
    }

    harvest() {
        this.isHarvested = true;
        scene.remove(this.mesh);
        setTimeout(() => {
            this.isHarvested = false;
            this.currentInteractions = 0;
            scene.add(this.mesh);
        }, this.respawnTime * 1000);
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