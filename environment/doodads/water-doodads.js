import * as THREE from '../../lib/three.module.js';
import { Doodad } from './base-doodad.js';
import { player } from '../../entity/player.js';

export class WaterPuddle extends Doodad {
    constructor(x, z, variant = 'small', biome) {
        const mesh = new THREE.Mesh(
            new THREE.CircleGeometry(1, 8),
            new THREE.MeshPhongMaterial({ 
                color: 0x1E90FF, 
                transparent: true, 
                opacity: 0.7 
            })
        );
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(x, 0.01, z);
        const difficulty = { 'summer': 1, 'autumn': 1.5, 'spring': 2, 'winter': 2.5 }[biome] || 1;
        super(mesh, 'https://freesound.org/data/previews/204/204157_3686498-lq.mp3', Math.ceil(1 * difficulty), 30 * difficulty);
        this.variant = variant;
        this.biome = biome;
        this.baseHeight = 0.01;
    }

    harvest() {
        super.harvest();
        player.addItem({ name: "Water", type: "material", stackSize: 99, quantity: 1 });
        console.log("Harvested 1 Water from WaterPuddle!");
    }
}

export class Coral extends Doodad {
    constructor(x, z, variant = 'red', biome) {
        const geometry = new THREE.DodecahedronGeometry(0.5, 0);
        const material = new THREE.MeshPhongMaterial({ color: variant === 'red' ? 0xFF0000 : 0x0000FF });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, 0, z);
        const difficulty = { 'summer': 1, 'autumn': 1.5, 'spring': 2, 'winter': 2.5 }[biome] || 1;
        super(mesh, 'https://freesound.org/data/previews/204/204157_3686498-lq.mp3', Math.ceil(2 * difficulty), 45 * difficulty);
        this.variant = variant;
        this.biome = biome;
        this.baseHeight = 0;
        this.isPlant = true;
    }

    update(deltaTime) {
        this.updateGrowth();
    }

    harvest() {
        super.harvest();
        player.addItem({ 
            name: `${this.variant === 'red' ? 'Red' : 'Blue'} Coral`, 
            type: "material", 
            stackSize: 99, 
            quantity: 1 
        });
        console.log(`Harvested 1 ${this.variant === 'red' ? 'Red' : 'Blue'} Coral!`);
    }
}

export class Seaweed extends Doodad {
    constructor(x, z, variant = 'green', biome) {
        const group = new THREE.Group();
        const stem = new THREE.Mesh(
            new THREE.CylinderGeometry(0.1, 0.1, 1, 8),
            new THREE.MeshPhongMaterial({ color: 0x00FF00 })
        );
        stem.position.set(0, 0.5, 0);
        group.add(stem);
        group.position.set(x, 0, z);
        const difficulty = { 'summer': 1, 'autumn': 1.5, 'spring': 2, 'winter': 2.5 }[biome] || 1;
        super(group, 'https://freesound.org/data/previews/204/204157_3686498-lq.mp3', Math.ceil(1 * difficulty), 30 * difficulty);
        this.variant = variant;
        this.biome = biome;
        this.baseHeight = 0;
        this.isPlant = true;
    }

    update(deltaTime) {
        this.updateGrowth();
    }

    harvest() {
        super.harvest();
        player.addItem({ name: "Seaweed", type: "material", stackSize: 99, quantity: 1 });
        console.log("Harvested 1 Seaweed!");
    }
}