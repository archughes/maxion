// doodads.js
import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';
import { scene } from './scene.js';
import { player } from '../entity/player.js';
import { completedQuests } from '../quests.js';
import { loadMap } from './environment.js';
import { EnvironmentObject } from './environment-object.js';
import { showMessage } from '../game.js';

// Tree class with multiple variants
class Tree extends EnvironmentObject {
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
        this.baseHeight = 0;
        this.biome = biome;
        this.trunk = trunk;
        this.leaves = leaves;
    }

    harvest() {
        super.harvest();
        let woodType = "Wood"; 
        let quantity = 1;
        switch (this.variant) {
            case 'pine': woodType = "Wood"; break; 
            case 'birch': woodType = "Wood"; break; 
            case 'autumn': woodType = "Wood"; quantity = 2; break; 
            default: woodType = "Wood";
        }
        player.addItem({ name: woodType, type: "material", stackSize: 99, quantity });
        console.log(`Harvested ${quantity} ${woodType} from ${this.variant} Tree`);
    }
}

// Chest with different variants
class Chest extends EnvironmentObject {
    constructor(x, z, contents, variant = 'wood', biome) {
        let color;
        switch (variant) {
            case 'gold': color = 0xFFD700; break;
            case 'iron': color = 0xA9A9A9; break;
            case 'magic': color = 0x9370DB; break;
            default: color = 0x8B6914; // 'wood'
        }
        const chestGroup = new THREE.Group();
        const base = new THREE.Mesh(
            new THREE.BoxGeometry(1, 0.7, 0.7),
            new THREE.MeshPhongMaterial({ color: color })
        );
        const lid = new THREE.Mesh(
            new THREE.BoxGeometry(1, 0.3, 0.7),
            new THREE.MeshPhongMaterial({ color: color })
        );
        lid.position.set(0, 0.5, 0);
        const lock = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 0.2, 0.1),
            new THREE.MeshPhongMaterial({ color: 0xFFD700 })
        );
        lock.position.set(0, 0.4, 0.4);
        chestGroup.add(base);
        chestGroup.add(lid);
        chestGroup.add(lock);
        chestGroup.position.set(x, 0.35, z);
        const difficulty = { 'summer': 1, 'autumn': 1.5, 'spring': 2, 'winter': 2.5 }[biome] || 1;
        super(chestGroup, 'https://freesound.org/data/previews/416/416179_5121236-lq.mp3', Math.ceil(2 * difficulty), 45 * difficulty);
        this.contents = contents || [{ name: "Sword", type: "weapon", damage: 10 }];
        this.variant = variant;
        this.baseHeight = 0.35;
        this.biome = biome;
        if (variant === 'magic') {
            this.glow = this.addGlow(0x9370DB, 0.8, 2);
        }
    }

    harvest() {
        super.harvest();
        if (Array.isArray(this.contents)) {
            this.contents.forEach(item => player.addItem(item));
            console.log(`Found ${this.contents.length} items in ${this.variant} chest!`);
        } else if (this.contents) {
            player.addItem(this.contents);
            console.log(`Found ${this.contents.name} in ${this.variant} chest!`);
        }
    }
}

// Rock with biome-specific resources
class Rock extends EnvironmentObject {
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
        let loot = "Stone"; // Default from items.json
        let quantity = this.variant === 'large' ? Math.floor(Math.random() * 2) + 2 : 1;
        if (this.variant === 'crystal' && this.biome === 'winter') {
            loot = Math.random() < 0.5 ? "Ice Crystal" : "Eternium Ore"; // Endgame materials
        } else {
            const lootTable = {
                'normal': {
                    'summer': { "Stone": 80, "Wood": 20 }, // Basic materials
                    'autumn': { "Iron Ore": 70, "Coal": 30 }, // Mid-tier smelting materials
                    'spring': { "Iron Ore": 60, "Diamond": 40 }, // Advanced materials
                    'winter': { "Eternium Ore": 50, "Diamond": 50 }, // Endgame materials
                    'default': { "Stone": 100 }
                },
                'crystal': {
                    'summer': { "Stone": 70, "Iron Ore": 30 }, // Early mining materials
                    'autumn': { "Iron Ore": 60, "Coal": 40 }, // Smelting progression
                    'spring': { "Diamond": 70, "Iron Ore": 30 }, // Advanced crafting
                    'winter': { "Eternium Ore": 60, "Diamond": 40 }, // Peak progression
                    'default': { "Stone": 100 }
                },
                'large': {
                    'summer': { "Stone": 80, "Wood": 20 }, // More basic resources
                    'autumn': { "Iron Ore": 60, "Coal": 40 }, // Mid-tier bulk
                    'spring': { "Iron Ore": 50, "Diamond": 50 }, // Advanced bulk
                    'winter': { "Eternium Ore": 50, "Diamond": 50 }, // Endgame bulk
                    'default': { "Stone": 100 }
                },
                'sharp': {
                    'summer': { "Stone": 80, "Wood": 20 }, // Basic sharp materials
                    'autumn': { "Iron Ore": 70, "Coal": 30 }, // Mid-tier sharp
                    'spring': { "Diamond": 60, "Iron Ore": 40 }, // Advanced sharp
                    'winter': { "Eternium Ore": 50, "Diamond": 50 }, // Endgame sharp
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
        player.addItem({ name: "Stone", type: "material", stackSize: 99, quantity });
        console.log(`Harvested ${quantity} ${loot} from ${this.variant} Rock in ${this.biome} biome`);
    }
}

// Bush with different variants
class Bush extends EnvironmentObject {
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
        this.baseHeight = 0.4;
        this.biome = biome;
    }

    harvest() {
        super.harvest();
        switch (this.variant) {
            case 'berry':
                player.addItem({ name: "Berry", type: "consumable", health: 5, stackSize: 99, quantity: 2 });
                console.log("Harvested 2 Berries!");
                break;
            case 'flower':
                player.addItem({ name: "Milkweed", type: "material", stackSize: 99, quantity: 1 }); // Small Health Potion base
                console.log("Harvested 1 Milkweed!");
                player.addItem({ name: "Flower", type: "material", stackSize: 99, quantity: 1 });
                console.log("Harvested 1 Flower!");
                break;
            case 'thorny':
                player.addItem({ name: "Sunflower", type: "material", stackSize: 99, quantity: 1 }); // Medium Health/Mana Potion upgrade
                console.log("Harvested 1 Sunflower!");
                player.addItem({ name: "Pumpkin", type: "material", stackSize: 99, quantity: 1 });
                console.log("Harvested 1 Pumpkin!");
                break;
        }
    }
}

// SnowPile class
class SnowPile extends EnvironmentObject {
    constructor(x, z, variant = 'small', biome) {
        let geometry = new THREE.ConeGeometry(1, 1, 8);
        if (variant === 'large') geometry = new THREE.ConeGeometry(1.5, 2, 8);
        const mesh = new THREE.Mesh(
            geometry,
            new THREE.MeshPhongMaterial({ color: 0xFFFFFF })
        );
        mesh.position.set(x, 0.5, z);
        const difficulty = { 'summer': 1, 'autumn': 1.5, 'spring': 2, 'winter': 2.5 }[biome] || 1;
        super(mesh, 'https://freesound.org/data/previews/340/340844_5858296-lq.mp3', Math.ceil(2 * difficulty), 45 * difficulty);
        this.variant = variant;
        this.baseHeight = 0.5;
        this.biome = biome;
    }

    harvest() {
        super.harvest();
        player.addItem({ name: "Snowball", type: "material", stackSize: 99, quantity: this.variant === 'large' ? 2 : 1 });
        console.log(`Harvested ${this.variant === 'large' ? 2 : 1} Snowball(s) from ${this.variant} SnowPile!`);
        player.addItem({ name: "Holy Water", type: "material", stackSize: 99, quantity: this.variant === 'large' ? 2 : 1 });
        console.log(`Harvested ${this.variant === 'large' ? 2 : 1} Holy Water from ${this.variant} SnowPile!`);
    }
}

// Cactus class
class Cactus extends EnvironmentObject {
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
        this.baseHeight = 1;
        this.biome = biome;
    }

    harvest() {
        super.harvest();
        player.addItem({ name: "Cactus Spine", type: "material", stackSize: 99, quantity: 1 });
        player.takeDamage(2);
        console.log("Harvested 1 Cactus Spine! Took 2 damage from Cactus!");
    }
}

// WaterPuddle class
class WaterPuddle extends EnvironmentObject {
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
        this.baseHeight = 0.01;
        this.biome = biome;
    }

    harvest() {
        super.harvest();
        player.addItem({ name: "Water", type: "material", stackSize: 99, quantity: 1 });
        console.log("Harvested 1 Water from WaterPuddle!");
    }
}

// Flower class
class Flower extends EnvironmentObject {
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
        this.baseHeight = 0.25;
        this.biome = biome;
    }

    harvest() {
        super.harvest();
        player.addItem({ name: "Flower", type: "material", stackSize: 99, quantity: 1 });
        console.log("Harvested 1 Flower!");
    }
}

// Campfire class
class Campfire extends EnvironmentObject {
    constructor(x, z, variant = 'small', biome) {
        const group = new THREE.Group();
        const logs = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 0.5, 0.3, 8),
            new THREE.MeshPhongMaterial({ color: 0x8B4513 })
        );
        const flames = new THREE.Mesh(
            new THREE.ConeGeometry(0.3, 0.5, 8),
            new THREE.MeshPhongMaterial({ color: 0xFF4500 })
        );
        flames.position.y = 0.2;
        group.add(logs);
        group.add(flames);
        group.position.set(x, 0.15, z);
        const difficulty = { 'summer': 1, 'autumn': 1.5, 'spring': 2, 'winter': 2.5 }[biome] || 1;
        super(group, 'https://freesound.org/data/previews/171/171104_2995897-lq.mp3', Math.ceil(2 * difficulty), 60 * difficulty);
        this.variant = variant;
        this.baseHeight = 0.15;
        this.biome = biome;
    }

    harvest() {
        super.harvest();
        player.addItem({ name: "Charcoal", type: "material", stackSize: 99, quantity: 1 });
        console.log("Harvested 1 Charcoal from Campfire!");
    }
}

// Portal class
class Portal extends EnvironmentObject {
    constructor(x, z, destinationMap, requiredQuest, variant = 'purple', biome) {
        const ring = new THREE.Mesh(
            new THREE.RingGeometry(1, 1.2, 16),
            new THREE.MeshPhongMaterial({ 
                color: 0x800080, 
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.8 
            })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(x, 0.1, z);
        const difficulty = { 'summer': 1, 'autumn': 1.5, 'spring': 2, 'winter': 2.5 }[biome] || 1;
        super(ring, 'https://freesound.org/data/previews/156/156221_2701532-lq.mp3', Math.ceil(1 * difficulty), 0); // No respawn
        this.destinationMap = destinationMap;
        this.requiredQuest = requiredQuest;
        this.baseHeight = 0.1;
        this.biome = biome;
        this.addGlow(0x800080, 0.8, 3);
    }

    interact() {
        if (!this.isHarvested) {
            super.interact();
            if (!this.requiredQuest || completedQuests.includes(this.requiredQuest)) {
                loadMap(this.destinationMap);
            } else {
                showMessage(`Complete the required quest ${this.requiredQuest} to unlock this portal!`);
                console.log(`Complete the required quest ${this.requiredQuest} to unlock this portal!`);
            }
        }
    }

    harvest() {
        // Portals don't get harvested traditionally, so override to do nothing
    }
}

// Coral class
class Coral extends EnvironmentObject {
    constructor(x, z, variant = 'red', biome) {
        const geometry = new THREE.DodecahedronGeometry(0.5, 0);
        const material = new THREE.MeshPhongMaterial({ color: variant === 'red' ? 0xFF0000 : 0x0000FF });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, 0, z);
        const difficulty = { 'summer': 1, 'autumn': 1.5, 'spring': 2, 'winter': 2.5 }[biome] || 1;
        super(mesh, 'https://freesound.org/data/previews/204/204157_3686498-lq.mp3', Math.ceil(2 * difficulty), 45 * difficulty);
        this.variant = variant;
        this.baseHeight = 0;
        this.biome = biome;
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

// Seaweed class
class Seaweed extends EnvironmentObject {
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
        this.baseHeight = 0;
        this.biome = biome;
    }

    harvest() {
        super.harvest();
        player.addItem({ name: "Seaweed", type: "material", stackSize: 99, quantity: 1 });
        console.log("Harvested 1 Seaweed!");
    }
}

export { 
    Tree, Chest, Rock, Bush, SnowPile,
    Cactus, WaterPuddle, Flower, Campfire, Portal, 
    Coral, Seaweed 
};