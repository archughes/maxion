import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';
import { Doodad } from './base-doodad.js';
import { player } from '../../entity/player.js';

export class Tree extends Doodad {
    constructor(x, z, variant = 'oak', biome) {
        const treeGroup = new THREE.Group();
        let trunk, leaves;

        switch (variant) {
            case 'pine':
                trunk = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.4, 0.6, 4, 8),
                    new THREE.MeshPhongMaterial({ color: 0x6B4226 })
                );
                trunk.position.set(0, 2, 0);
                treeGroup.add(trunk);
                for (let i = 0; i < 3; i++) {
                    const size = 2.5 - i * 0.7;
                    const leafSection = new THREE.Mesh(
                        new THREE.ConeGeometry(size, 1.5, 8),
                        new THREE.MeshPhongMaterial({ color: 0x004D26 })
                    );
                    leafSection.position.set(0, 2.5 + i * 1.2, 0);
                    treeGroup.add(leafSection);
                }
                break;
            case 'birch':
                trunk = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.3, 0.4, 4, 8),
                    new THREE.MeshPhongMaterial({ color: 0xE6E6E6 })
                );
                trunk.position.set(0, 2, 0);
                const barkGeometry = new THREE.BoxGeometry(0.1, 0.3, 0.1);
                const barkMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
                for (let i = 0; i < 6; i++) {
                    const bark = new THREE.Mesh(barkGeometry, barkMaterial);
                    const angle = (i / 6) * Math.PI * 2;
                    bark.position.set(
                        Math.cos(angle) * 0.4,
                        1 + Math.random() * 2,
                        Math.sin(angle) * 0.4
                    );
                    trunk.add(bark);
                }
                leaves = new THREE.Mesh(
                    new THREE.SphereGeometry(1.7, 10, 10),
                    new THREE.MeshPhongMaterial({ color: 0x98FB98 })
                );
                leaves.position.set(0, 4, 0);
                treeGroup.add(trunk);
                treeGroup.add(leaves);
                break;
            case 'autumn':
                trunk = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.5, 0.7, 3, 8),
                    new THREE.MeshPhongMaterial({ color: 0x8B4513 })
                );
                trunk.position.set(0, 1.5, 0);
                leaves = new THREE.Mesh(
                    new THREE.SphereGeometry(2, 10, 10),
                    new THREE.MeshPhongMaterial({ color: 0xFFA500 })
                );
                leaves.position.set(0, 3.5, 0);
                const redPatches = new THREE.Mesh(
                    new THREE.SphereGeometry(1.8, 8, 8),
                    new THREE.MeshPhongMaterial({ 
                        color: 0xB22222,
                        transparent: true,
                        opacity: 0.7
                    })
                );
                redPatches.position.set(0.5, 3.7, 0.3);
                treeGroup.add(trunk);
                treeGroup.add(leaves);
                treeGroup.add(redPatches);
                break;
            default: // Oak
                trunk = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.5, 0.7, 3, 8),
                    new THREE.MeshPhongMaterial({ color: 0x8B4513 })
                );
                trunk.position.set(0, 1.5, 0);
                leaves = new THREE.Mesh(
                    new THREE.SphereGeometry(2, 10, 10),
                    new THREE.MeshPhongMaterial({ color: 0x228B22 })
                );
                leaves.position.set(0, 3.5, 0);
                treeGroup.add(trunk);
                treeGroup.add(leaves);
        }

        treeGroup.position.set(x, 0, z);
        const difficulty = { 'summer': 1, 'autumn': 1.5, 'spring': 2, 'winter': 2.5 }[biome] || 1;
        super(treeGroup, 'https://freesound.org/data/previews/362/362415_5865517-lq.mp3', Math.ceil(3 * difficulty), 60 * difficulty);
        this.variant = variant;
        this.biome = biome;
        this.baseHeight = 0;
        this.trunk = trunk;
        this.leaves = leaves;
        this.isPlant = true;
    }

    update(deltaTime) {
        this.updateGrowth();
    }

    harvest() {
        super.harvest();
        let woodType = "Wood"; 
        let quantity = this.variant === 'autumn' ? 2 : 1;
        player.addItem({ name: woodType, type: "material", stackSize: 99, quantity });
        console.log(`Harvested ${quantity} ${woodType} from ${this.variant} Tree`);
    }
}

export class Bush extends Doodad {
    constructor(x, z, variant = 'berry', biome) {
        let geometry, material;
        let scale = 1;
        switch (variant) {
            case 'flower':
                geometry = new THREE.SphereGeometry(0.8, 8, 8);
                material = new THREE.MeshPhongMaterial({ color: 0x4CA64C });
                scale = 0.9;
                break;
            case 'thorny':
                geometry = new THREE.SphereGeometry(0.7, 8, 8);
                material = new THREE.MeshPhongMaterial({ color: 0x254117 });
                scale = 1.1;
                break;
            default: // 'berry'
                geometry = new THREE.SphereGeometry(0.8, 8, 8);
                material = new THREE.MeshPhongMaterial({ color: 0x2E8B57 });
        }
        const bushGroup = new THREE.Group();
        const bushMesh = new THREE.Mesh(geometry, material);
        bushMesh.scale.set(scale, scale, scale);
        bushGroup.add(bushMesh);

        if (variant === 'berry') {
            for (let i = 0; i < 5; i++) {
                const berry = new THREE.Mesh(
                    new THREE.SphereGeometry(0.1, 6, 6),
                    new THREE.MeshPhongMaterial({ color: 0xFF0000 })
                );
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.random() * Math.PI;
                const r = 0.8;
                berry.position.set(
                    r * Math.sin(phi) * Math.cos(theta),
                    r * Math.cos(phi),
                    r * Math.sin(phi) * Math.sin(theta)
                );
                bushGroup.add(berry);
            }
        } else if (variant === 'flower') {
            for (let i = 0; i < 3; i++) {
                const flower = new THREE.Mesh(
                    new THREE.ConeGeometry(0.1, 0.3, 6),
                    new THREE.MeshPhongMaterial({ color: 0xFF69B4 })
                );
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.random() * Math.PI;
                const r = 0.7;
                flower.position.set(
                    r * Math.sin(phi) * Math.cos(theta),
                    r * Math.cos(phi),
                    r * Math.sin(phi) * Math.sin(theta)
                );
                bushGroup.add(flower);
            }
        } else if (variant === 'thorny') {
            for (let i = 0; i < 4; i++) {
                const thorn = new THREE.Mesh(
                    new THREE.ConeGeometry(0.05, 0.3, 4),
                    new THREE.MeshPhongMaterial({ color: 0x4B5320 })
                );
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.random() * Math.PI;
                const r = 0.7;
                thorn.position.set(
                    r * Math.sin(phi) * Math.cos(theta),
                    r * Math.cos(phi),
                    r * Math.sin(phi) * Math.sin(theta)
                );
                thorn.rotation.x = Math.PI / 2;
                bushGroup.add(thorn);
            }
        }

        bushGroup.position.set(x, 0.4, z);
        const difficulty = { 'summer': 1, 'autumn': 1.5, 'spring': 2, 'winter': 2.5 }[biome] || 1;
        super(bushGroup, 'https://freesound.org/data/previews/362/362415_5865517-lq.mp3', Math.ceil(2 * difficulty), 30 * difficulty);
        this.variant = variant;
        this.biome = biome;
        this.baseHeight = 0.4;
        this.isPlant = true;
    }

    update(deltaTime) {
        this.updateGrowth();
    }

    harvest() {
        super.harvest();
        switch (this.variant) {
            case 'berry':
                player.addItem({ name: "Berry", type: "consumable", health: 5, stackSize: 99, quantity: 2 });
                console.log("Harvested 2 Berries!");
                break;
            case 'flower':
                player.addItem({ name: "Milkweed", type: "material", stackSize: 99, quantity: 1 });
                console.log("Harvested 1 Milkweed!");
                player.addItem({ name: "Flower", type: "material", stackSize: 99, quantity: 1 });
                console.log("Harvested 1 Flower!");
                break;
            case 'thorny':
                player.addItem({ name: "Sunflower", type: "material", stackSize: 99, quantity: 1 });
                console.log("Harvested 1 Sunflower!");
                player.addItem({ name: "Pumpkin", type: "material", stackSize: 99, quantity: 1 });
                console.log("Harvested 1 Pumpkin!");
                break;
        }
    }
}

export class Rock extends Doodad {
    constructor(x, z, biome, variant = 'normal') {
        let geometry, material;
        switch (variant) {
            case 'crystal':
                geometry = new THREE.DodecahedronGeometry(0.7, 0);
                material = new THREE.MeshPhongMaterial({ 
                    color: 0x88CCEE, 
                    transparent: true,
                    opacity: 0.8,
                    shininess: 100
                });
                this.glow = this.addGlow(0x88CCEE, 0.5, 2);
                break;
            case 'large':
                geometry = new THREE.SphereGeometry(1.2, 8, 8);
                material = new THREE.MeshPhongMaterial({ color: 0x696969 });
                break;
            case 'sharp':
                geometry = new THREE.ConeGeometry(0.7, 1.4, 5);
                material = new THREE.MeshPhongMaterial({ color: 0x505050 });
                break;
            default: // 'normal'
                geometry = new THREE.SphereGeometry(0.7, 6, 6);
                material = new THREE.MeshPhongMaterial({ color: 0x808080 });
        }
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, 0.35, z);
        const difficulty = { 'summer': 1, 'autumn': 1.5, 'spring': 2, 'winter': 2.5 }[biome] || 1;
        super(mesh, 'https://freesound.org/data/previews/277/277021_5324302-lq.mp3', Math.ceil(4 * difficulty), 90 * difficulty);
        this.biome = biome;
        this.variant = variant;
        this.baseHeight = 0.35;
        if (variant === 'crystal') {
            this.glow = this.addGlow(0x88CCEE, 0.5, 2);
        }
    }

    harvest() {
        super.harvest();
        let loot = "Stone";
        let quantity = this.variant === 'large' ? Math.floor(Math.random() * 2) + 2 : 1;
        if (this.variant === 'crystal' && this.biome === 'winter') {
            loot = Math.random() < 0.5 ? "Ice Crystal" : "Eternium Ore";
        } else {
            const lootTable = {
                'normal': {
                    'summer': { "Stone": 80, "Wood": 20 },
                    'autumn': { "Iron Ore": 70, "Coal": 30 },
                    'spring': { "Iron Ore": 60, "Diamond": 40 },
                    'winter': { "Eternium Ore": 50, "Diamond": 50 },
                    'default': { "Stone": 100 }
                },
                'crystal': {
                    'summer': { "Stone": 70, "Iron Ore": 30 },
                    'autumn': { "Iron Ore": 60, "Coal": 40 },
                    'spring': { "Diamond": 70, "Iron Ore": 30 },
                    'winter': { "Eternium Ore": 60, "Diamond": 40 },
                    'default': { "Stone": 100 }
                },
                'large': {
                    'summer': { "Stone": 80, "Wood": 20 },
                    'autumn': { "Iron Ore": 60, "Coal": 40 },
                    'spring': { "Iron Ore": 50, "Diamond": 50 },
                    'winter': { "Eternium Ore": 50, "Diamond": 50 },
                    'default': { "Stone": 100 }
                },
                'sharp': {
                    'summer': { "Stone": 80, "Wood": 20 },
                    'autumn': { "Iron Ore": 70, "Coal": 30 },
                    'spring': { "Diamond": 60, "Iron Ore": 40 },
                    'winter': { "Eternium Ore": 50, "Diamond": 50 },
                    'default': { "Stone": 100 }
                }
            };
            const typeTable = lootTable[this.variant] || lootTable['normal'];
            const table = typeTable[this.biome] || typeTable['default'];
            const roll = Math.random() * 100;
            let cumulative = 0;
            for (const [item, chance] of Object.entries(table)) {
                cumulative += chance;
                if (roll <= cumulative) {
                    loot = item;
                    break;
                }
            }
        }
        player.addItem({ name: loot, type: "material", stackSize: 99, quantity });
        console.log(`Harvested ${quantity} ${loot} from ${this.variant} Rock in ${this.biome} biome`);
    }
}

export class Flower extends Doodad {
    constructor(x, z, variant = 'rose', biome) {
        const group = new THREE.Group();
        const petals = new THREE.Mesh(
            new THREE.ConeGeometry(0.2, 0.5, 6),
            new THREE.MeshPhongMaterial({ color: 0xFF69B4 })
        );
        petals.position.set(0, 0.25, 0);
        group.add(petals);
        group.position.set(x, 0.25, z);
        const difficulty = { 'summer': 1, 'autumn': 1.5, 'spring': 2, 'winter': 2.5 }[biome] || 1;
        super(group, 'https://freesound.org/data/previews/66/66952_634166-lq.mp3', Math.ceil(1 * difficulty), 20 * difficulty);
        this.variant = variant;
        this.biome = biome;
        this.baseHeight = 0.25;
        this.isPlant = true;
    }

    update(deltaTime) {
        this.updateGrowth();
    }

    harvest() {
        super.harvest();
        player.addItem({ name: "Flower", type: "material", stackSize: 99, quantity: 1 });
        console.log("Harvested 1 Flower!");
    }
}

export class Campfire extends Doodad {
    constructor(x, z, variant = 'small', biome) {
        const group = new THREE.Group();
        const logs = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 0.5, 0.3, 8),
            new THREE.MeshPhongMaterial({ color: 0x8B4513 })
        );
        group.add(logs);
        group.position.set(x, 0.15, z);
        const difficulty = { 'summer': 1, 'autumn': 1.5, 'spring': 2, 'winter': 2.5 }[biome] || 1;
        super(group, 'https://freesound.org/data/previews/171/171104_2995897-lq.mp3', Math.ceil(2 * difficulty), 60 * difficulty);
        this.variant = variant;
        this.biome = biome;
        this.baseHeight = 0.15;

        // Add particle system for flames
        this.particleSystem = this.createFlameParticles();
        this.object.add(this.particleSystem);

        // Add dynamic lighting
        this.light = this.addGlow(0xFF4500, 1.5, 5);
    }

    createFlameParticles() {
        const particleCount = 50;
        const particles = new THREE.Group();

        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.05, 8, 8),
                new THREE.MeshBasicMaterial({ color: 0xFF4500 })
            );
            particle.position.set(
                (Math.random() - 0.5) * 0.5,
                Math.random() * 0.5 + 0.2,
                (Math.random() - 0.5) * 0.5
            );
            particle.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.01,
                Math.random() * 0.02 + 0.01,
                (Math.random() - 0.5) * 0.01
            );
            particles.add(particle);
        }
        return particles;
    }

    update(deltaTime) {
        this.particleSystem.children.forEach(particle => {
            particle.position.add(particle.userData.velocity.clone().multiplyScalar(deltaTime * 60));
            if (particle.position.y > 1) {
                particle.position.y = 0.2;
            }
        });
    }

    harvest() {
        super.harvest();
        player.addItem({ name: "Charcoal", type: "material", stackSize: 99, quantity: 1 });
        console.log("Harvested 1 Charcoal from Campfire!");
    }
}

export class Cactus extends Doodad {
    constructor(x, z, variant = 'standard', biome) {
        const group = new THREE.Group();
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.3, 2, 8),
            new THREE.MeshPhongMaterial({ color: 0x9ACD32 })
        );
        trunk.position.set(0, 1, 0);
        group.add(trunk);
        if (variant === 'flowering') {
            const flower = new THREE.Mesh(
                new THREE.SphereGeometry(0.3, 8, 8),
                new THREE.MeshPhongMaterial({ color: 0xFF69B4 })
            );
            flower.position.set(0, 2.2, 0);
            group.add(flower);
        }
        group.position.set(x, 1, z);
        const difficulty = { 'summer': 1, 'autumn': 1.5, 'spring': 2, 'winter': 2.5 }[biome] || 1;
        super(group, 'https://freesound.org/data/previews/171/171671_2436898-lq.mp3', Math.ceil(3 * difficulty), 60 * difficulty);
        this.variant = variant;
        this.biome = biome;
        this.baseHeight = 1;
        this.isPlant = true;
    }

    update(deltaTime) {
        this.updateGrowth();
    }

    harvest() {
        super.harvest();
        player.addItem({ name: "Cactus Spine", type: "material", stackSize: 99, quantity: 1 });
        player.takeDamage(2);
        console.log("Harvested 1 Cactus Spine! Took 2 damage from Cactus!");
    }
}