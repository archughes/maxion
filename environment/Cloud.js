import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';
import { scene } from './scene.js';

export class Cloud {
    constructor() {
        const cloudGroup = new THREE.Group(); // Use Group as container
        const baseSize = 2 + Math.random() * 3;

        const cloudMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.5 + Math.random() * 0.3
        });
        
        // Create multiple overlapping spheres
        for(let i = 0; i < 5; i++) {
            const partGeo = new THREE.SphereGeometry(
                baseSize * (0.6 + Math.random()*0.4),
                8, 
                8
            );
            const part = new THREE.Mesh(partGeo, cloudMaterial);
            part.position.set(
                (Math.random()-0.5)*baseSize,
                (Math.random()-0.5)*baseSize,
                (Math.random()-0.5)*baseSize
            );
            cloudGroup.add(part);
        }
        
        this.mesh = cloudGroup; // Use group directly
        this.mesh.position.set(
            (Math.random() - 0.5) * 200,
            50 + Math.random() * 20,
            (Math.random() - 0.5) * 200
        );
        this.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.1,
            0,
            (Math.random() - 0.5) * 0.1
        );
        scene.add(this.mesh);
    }

    update(deltaTime) {
        this.mesh.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        if (this.mesh.position.x > 100) this.mesh.position.x = -100;
        if (this.mesh.position.x < -100) this.mesh.position.x = 100;
        if (this.mesh.position.z > 100) this.mesh.position.z = -100;
        if (this.mesh.position.z < -100) this.mesh.position.z = 100;
    }
}