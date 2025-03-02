import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';
import { scene } from './scene.js';

export class Cloud {
    constructor(type = 'cumulus') {
        this.type = type;
        this.mesh = new THREE.Group();
        this.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.1,
            0,
            (Math.random() - 0.5) * 0.1
        );

        // Configure based on type
        switch (type) {
            case 'cirrus':
                this.createCirrus();
                break;
            case 'cumulus':
                this.createCumulus();
                break;
            case 'stratus':
                this.createStratus();
                break;
            case 'nimbus':
                this.createNimbus();
                break;
            case 'fractal':
                this.createFractal();
                break;
            default:
                this.createCumulus(); // Fallback
        }

        this.mesh.position.set(
            (Math.random() - 0.5) * 200,
            50 + Math.random() * 20,
            (Math.random() - 0.5) * 200
        );
        scene.add(this.mesh);
    }

    createCirrus() {
        const material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.2 + Math.random() * 0.2
        });
        const baseSize = 5 + Math.random() * 5;
        for (let i = 0; i < 10; i++) {
            const geo = new THREE.SphereGeometry(
                baseSize * (0.3 + Math.random() * 0.3),
                6, 6 // Lower detail for wispy look
            );
            const part = new THREE.Mesh(geo, material);
            part.position.set(
                (Math.random() - 0.5) * baseSize * 2,
                (Math.random() - 0.5) * baseSize * 0.5,
                (Math.random() - 0.5) * baseSize * 2
            );
            this.mesh.add(part);
        }
    }

    createCumulus() {
        const material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.5 + Math.random() * 0.3
        });
        const baseSize = 2 + Math.random() * 3;
        for (let i = 0; i < 5; i++) {
            const geo = new THREE.SphereGeometry(
                baseSize * (0.6 + Math.random() * 0.4),
                8, 8
            );
            const part = new THREE.Mesh(geo, material);
            part.position.set(
                (Math.random() - 0.5) * baseSize,
                (Math.random() - 0.5) * baseSize,
                (Math.random() - 0.5) * baseSize
            );
            this.mesh.add(part);
        }
    }

    createStratus() {
        const material = new THREE.MeshBasicMaterial({
            color: 0xd3d3d3, // Light gray for a neutral, overcast look
            transparent: true,
            opacity: 0.3 + Math.random() * 0.2 // Slightly hazy
        });
        const baseSize = 15 + Math.random() * 5; // Larger base for wide coverage
        for (let i = 0; i < 4; i++) {
            const geo = new THREE.SphereGeometry(
                baseSize * (0.8 + Math.random() * 0.4), // Vary size slightly
                16, 16 // Higher segments for smoother edges
            );
            const part = new THREE.Mesh(geo, material);
            // Squash the sphere into a flat, wide shape
            part.scale.set(1.5, 0.1 + Math.random() * 0.1, 1.5); // Wide and thin
            part.position.set(
                (Math.random() - 0.5) * baseSize * 0.8, // Slight horizontal spread
                (Math.random() - 0.5) * baseSize * 0.2, // Minimal vertical variation
                (Math.random() - 0.5) * baseSize * 0.8
            );
            this.mesh.add(part);
        }
    }

    createNimbus() {
        const material = new THREE.MeshBasicMaterial({
            color: 0x4682b4,
            transparent: true,
            opacity: 0.6 + Math.random() * 0.3
        });
        const baseSize = 4 + Math.random() * 4;
        for (let i = 0; i < 8; i++) {
            const geo = new THREE.SphereGeometry(
                baseSize * (0.5 + Math.random() * 0.5),
                8, 8
            );
            const part = new THREE.Mesh(geo, material);
            part.position.set(
                (Math.random() - 0.5) * baseSize * 1.5,
                (Math.random() - 0.5) * baseSize,
                (Math.random() - 0.5) * baseSize * 1.5
            );
            this.mesh.add(part);
        }
    }

    createFractal() {
        const material = new THREE.MeshBasicMaterial({
            color: 0xf0f0f0,
            transparent: true,
            opacity: 0.3 + Math.random() * 0.3
        });
        const baseSize = 3 + Math.random() * 3;
        const addParts = (size, depth) => {
            if (depth <= 0) return;
            const geo = new THREE.SphereGeometry(size, 6, 6);
            const part = new THREE.Mesh(geo, material);
            part.position.set(
                (Math.random() - 0.5) * size * 2,
                (Math.random() - 0.5) * size,
                (Math.random() - 0.5) * size * 2
            );
            this.mesh.add(part);
            for (let i = 0; i < 3; i++) {
                addParts(size * 0.6, depth - 1);
            }
        };
        addParts(baseSize, 3); // 3 levels of recursion
    }

    update(deltaTime) {
        this.mesh.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        if (this.mesh.position.x > 100) this.mesh.position.x = -100;
        if (this.mesh.position.x < -100) this.mesh.position.x = 100;
        if (this.mesh.position.z > 100) this.mesh.position.z = -100;
        if (this.mesh.position.z < -100) this.mesh.position.z = 100;
    }
}