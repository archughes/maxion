import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';
import { scene } from './scene.js';

export class Cloud {
    constructor() {
        const size = 5 + Math.random() * 5;
        const cloudGeometry = new THREE.SphereGeometry(size, 16, 16);
        const cloudMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.5 + Math.random() * 0.3
        });
        this.mesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
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