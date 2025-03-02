// doodads.js
import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';
import { scene } from './scene.js';
import { player } from './player.js';
import { completedQuests } from './quests.js';
import { loadMap } from './environment.js';
import { EnvironmentObject } from './environment-object.js';
import { showMessage } from './game.js';

// Tree class with multiple variants
class Tree extends EnvironmentObject {
    constructor(x, z, variant = 'oak') {
        const treeGroup = new THREE.Group();
        let trunk, leaves;

        // Create tree parts directly in constructor
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

                // Bark details
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
        super(treeGroup, 'https://freesound.org/data/previews/362/362415_5865517-lq.mp3');
        
        this.variant = variant;
        this.baseHeight = 0;
        this.trunk = trunk;
        this.leaves = leaves;
    }
    
    interact() {
        super.interact();
        
        // Different trees give different wood types
        let woodType = "Wood";
        let quantity = 1;
        
        switch (this.variant) {
            case 'pine':
                woodType = "Pine Wood";
                break;
            case 'birch':
                woodType = "Birch Wood";
                break;
            case 'autumn':
                woodType = "Oak Wood";
                quantity = 2; // Autumn trees give more wood
                break;
            default:
                woodType = "Oak Wood";
        }
        
        player.addItem({ name: woodType, type: "material", stackSize: 99, quantity });
        console.log(`Harvested ${quantity} ${woodType} from ${this.variant} Tree`);
    }
}

// Chest with different variants
class Chest extends EnvironmentObject {
    constructor(x, z, contents, variant = 'wood') {
        // Create a chest based on variant
        let mesh;
        let color;
        
        switch (variant) {
            case 'gold':
                color = 0xFFD700;
                break;
            case 'iron':
                color = 0xA9A9A9;
                break;
            case 'magic':
                color = 0x9370DB;
                break;
            case 'wood':
            default:
                color = 0x8B6914;
                break;
        }
        
        // Create chest geometry
        const chestGroup = new THREE.Group();
        
        // Base
        const base = new THREE.Mesh(
            new THREE.BoxGeometry(1, 0.7, 0.7),
            new THREE.MeshPhongMaterial({ color: color })
        );
        
        // Lid
        const lid = new THREE.Mesh(
            new THREE.BoxGeometry(1, 0.3, 0.7),
            new THREE.MeshPhongMaterial({ color: color })
        );
        lid.position.set(0, 0.5, 0);
        
        // Lock
        const lock = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 0.2, 0.1),
            new THREE.MeshPhongMaterial({ color: 0xFFD700 })
        );
        lock.position.set(0, 0.4, 0.4);
        
        chestGroup.add(base);
        chestGroup.add(lid);
        chestGroup.add(lock);
        chestGroup.position.set(x, 0.35, z);
        
        // Better chest opening sound
        super(chestGroup, 'https://freesound.org/data/previews/416/416179_5121236-lq.mp3');
        
        this.contents = contents || [{ name: "Sword", type: "weapon", damage: 10 }];
        this.variant = variant;
        this.baseHeight = 0.35;
        
        // Add glow for magic chests
        if (variant === 'magic') {
            this.glow = this.addGlow(0x9370DB, 0.8, 2);
        }
    }
    
    interact() {
        super.interact();
        
        if (Array.isArray(this.contents)) {
            this.contents.forEach(item => player.addItem(item));
            console.log(`Found ${this.contents.length} items in ${this.variant} chest!`);
        } else if (this.contents) {
            player.addItem(this.contents);
            console.log(`Found ${this.contents.name} in ${this.variant} chest!`);
        }
        
        scene.remove(this.mesh);
    }
}

// Rock with biome-specific resources
class Rock extends EnvironmentObject {
    constructor(x, z, biome, variant = 'normal') {
        // Create different rock types
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
            case 'normal':
            default:
                geometry = new THREE.SphereGeometry(0.7, 6, 6);
                material = new THREE.MeshPhongMaterial({ color: 0x808080 });
                break;
        }
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, 0.35, z);
        
        // Better rock hitting sound
        super(mesh, 'https://freesound.org/data/previews/277/277021_5324302-lq.mp3');
        
        this.biome = biome;
        this.variant = variant;
        this.baseHeight = 0.35;
        
        // Add special effects for crystal rocks
        if (variant === 'crystal') {
            this.glow = this.addGlow(0x88CCEE, 0.5, 2);
        }
    }
    
    interact() {
        super.interact();
        
        let lootTable = {
            'normal': {
                'summer': { "Stone": 75, "Iron Ore": 25 },
                'autumn': { "Iron Ore": 75, "Carbon": 25 },
                'spring': { "Diamond": 25, "Iron Ore": 75 },
                'winter': { "Eternium Ore": 25, "Diamond": 75 },
                'default': { "Stone": 100 }
            },
            'crystal': {
                'summer': { "Crystal": 50, "Quartz": 50 },
                'autumn': { "Amber": 50, "Ruby": 50 },
                'spring': { "Emerald": 50, "Sapphire": 50 },
                'winter': { "Diamond": 75, "Ice Crystal": 25 },
                'default': { "Crystal": 100 }
            },
            'large': {
                'summer': { "Stone": 80, "Iron Ore": 20 },
                'autumn': { "Iron Ore": 60, "Carbon": 20, "Gold Ore": 20 },
                'spring': { "Diamond": 15, "Iron Ore": 70, "Gold Ore": 15 },
                'winter': { "Eternium Ore": 30, "Diamond": 50, "Ancient Core": 20 },
                'default': { "Stone": 100 }
            },
            'sharp': {
                'summer': { "Flint": 75, "Obsidian": 25 },
                'autumn': { "Obsidian": 50, "Flint": 50 },
                'spring': { "Flint": 50, "Sharp Stone": 50 },
                'winter': { "Ice Shard": 75, "Obsidian": 25 },
                'default': { "Flint": 100 }
            }
        };
        
        // Get appropriate loot table based on variant and biome
        const typeTable = lootTable[this.variant] || lootTable['normal'];
        const table = typeTable[this.biome] || typeTable['default'];
        
        // Roll for loot based on probabilities
        const roll = Math.random() * 100;
        let cumulative = 0;
        let loot = "Stone"; // Default fallback
        
        for (const [item, chance] of Object.entries(table)) {
            cumulative += chance;
            if (roll <= cumulative) {
                loot = item;
                break;
            }
        }
        
        // Give multiple resources for large rocks
        const quantity = this.variant === 'large' ? Math.floor(Math.random() * 2) + 2 : 1;
        
        player.addItem({ name: loot, type: "material", stackSize: 99, quantity });
        console.log(`Harvested ${quantity} ${loot} from ${this.variant} Rock in ${this.biome} biome`);
    }
}

// Bush with different variants
class Bush extends EnvironmentObject {
    constructor(x, z, variant = 'berry') {
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
            case 'berry':
            default:
                geometry = new THREE.SphereGeometry(0.8, 8, 8);
                material = new THREE.MeshPhongMaterial({ color: 0x2E8B57 });
                break;
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
        super(bushGroup, 'https://freesound.org/data/previews/362/362415_5865517-lq.mp3');
        this.variant = variant;
        this.baseHeight = 0.4;
    }
    
    interact() {
        super.interact();
        switch (this.variant) {
            case 'berry':
                player.addItem({ name: "Berry", type: "consumable", health: 3, quantity: 2 });
                console.log("Picked 2 Berries!");
                break;
            case 'flower':
                player.addItem({ name: "Flower Petals", type: "material", quantity: 1 });
                break;
            case 'thorny':
                player.takeDamage(1);
                console.log("Ouch! Thorns dealt 1 damage!");
                break;
        }
    }
}

// SnowPile class
class SnowPile extends EnvironmentObject {
    constructor(x, z, variant = 'small') {
        let geometry = new THREE.ConeGeometry(1, 1, 8);
        if (variant === 'large') geometry = new THREE.ConeGeometry(1.5, 2, 8);
        
        const mesh = new THREE.Mesh(
            geometry,
            new THREE.MeshPhongMaterial({ color: 0xFFFFFF })
        );
        mesh.position.set(x, 0.5, z);
        super(mesh, 'https://freesound.org/data/previews/340/340844_5858296-lq.mp3');
        this.baseHeight = 0.5;
    }
}

// Cactus class
class Cactus extends EnvironmentObject {
    constructor(x, z, variant = 'standard') {
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
        super(group, 'https://freesound.org/data/previews/171/171671_2436898-lq.mp3');
        this.baseHeight = 1;
    }
    
    interact() {
        super.interact();
        player.takeDamage(2);
        console.log("Cactus dealt 2 damage!");
    }
}

// WaterPuddle class
class WaterPuddle extends EnvironmentObject {
    constructor(x, z, variant = 'small') {
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
        super(mesh, 'https://freesound.org/data/previews/204/204157_3686498-lq.mp3');
        this.baseHeight = 0.01;
    }
}

// Flower class
class Flower extends EnvironmentObject {
    constructor(x, z, variant = 'rose') {
        const group = new THREE.Group();
        const petals = new THREE.Mesh(
            new THREE.ConeGeometry(0.2, 0.5, 6),
            new THREE.MeshPhongMaterial({ color: 0xFF69B4 })
        );
        petals.position.set(0, 0.25, 0);
        group.add(petals);
        group.position.set(x, 0.25, z);
        super(group, 'https://freesound.org/data/previews/66/66952_634166-lq.mp3');
        this.baseHeight = 0.25;
    }
}

// Campfire class
class Campfire extends EnvironmentObject {
    constructor(x, z, variant = 'small') {
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
        super(group, 'https://freesound.org/data/previews/171/171104_2995897-lq.mp3');
        this.baseHeight = 0.15;
    }
}

// Portal class
class Portal extends EnvironmentObject {
    constructor(x, z, destinationMap, requiredQuest, variant = 'purple') {
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
        super(ring, 'https://freesound.org/data/previews/156/156221_2701532-lq.mp3');
        this.destinationMap = destinationMap;
        this.requiredQuest = requiredQuest;
        this.baseHeight = 0.1;
        this.addGlow(0x800080, 0.8, 3);
    }
    
    interact() {
        if (!this.requiredQuest || completedQuests.includes(this.requiredQuest)) {
            loadMap(this.destinationMap);
        } else {
            showMessage('Complete the required quest "${this.requiredQuest}" to unlock this portal!');
            console.log('Complete the required quest "${this.requiredQuest}" to unlock this portal!');
        }
    }
}

export { 
    Tree, Chest, Rock, Bush, SnowPile,
    Cactus, WaterPuddle, Flower, Campfire, Portal 
};