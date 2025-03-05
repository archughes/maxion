import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';
import { scene } from './scene.js';

export class WaterSystem {
    constructor(width, height, level, color) {
        const waterGeometry = new THREE.PlaneGeometry(width, height);
        const waterMaterial = new THREE.MeshPhongMaterial({
            color: color || 0x0077be,
            shininess: 200, // Increased for more reflectivity
            specular: 0xffffff, // Bright white highlights
            transparent: true,
            opacity: 0.8
        });
        this.mesh = new THREE.Mesh(waterGeometry, waterMaterial);
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.position.y = level;
        scene.add(this.mesh);
    }
    dispose() {
        scene.remove(this.mesh);
    }
}