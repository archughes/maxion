import * as THREE from '../../lib/three.module.js';
import { Doodad } from './base-doodad.js';
import { player } from '../../entity/player.js';
import { loadMap } from '../environment.js';
import { showMessage } from '../../game.js';
import { completedQuests } from '../../quests.js';
import { createSparkleEffect } from '../../animations/environmental-effects.js';

export class Chest extends Doodad {
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
        this.biome = biome;
        this.baseHeight = 0.35;
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

export class Portal extends Doodad {
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
        super(ring, 'https://freesound.org/data/previews/156/156221_2701532-lq.mp3', Math.ceil(1 * difficulty), 0);
        this.destinationMap = destinationMap;
        this.requiredQuest = requiredQuest;
        this.biome = biome;
        this.baseHeight = 0.1;
        this.addGlow(0x800080, 0.8, 3);

        this.glowSprite = this.createGlowSprite(0x800080);
        this.glowSprite.visible = false; // Initially hidden
        this.object.add(this.glowSprite);
        createSparkleEffect(this.object, -1); // Call the sparkle effect in the constructor
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
        // Portals don’t harvest traditionally
    }

    createGlowSprite(color) {
        const geometry = new THREE.CylinderGeometry(1.5, 1.5, 50, 16, 1, true);
        const material = new THREE.MeshPhongMaterial({
            color: color,
            transparent: true,
            opacity: 0.4,
            emissive: color,
            emissiveIntensity: 1.5,
            side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, 25, 0); // Raise it 50 units
        return mesh;
    }

    update(deltaTime) {
        if (!this.requiredQuest || completedQuests.includes(this.requiredQuest)) {
            this.glowSprite.visible = true;
        } else {
            this.glowSprite.visible = false;
        }
    }
}

export class SnowPile extends Doodad {
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
        this.biome = biome;
        this.baseHeight = 0.5;
    }

    harvest() {
        super.harvest();
        player.addItem({ name: "Snowball", type: "material", stackSize: 99, quantity: this.variant === 'large' ? 2 : 1 });
        console.log(`Harvested ${this.variant === 'large' ? 2 : 1} Snowball(s) from ${this.variant} SnowPile!`);
        player.addItem({ name: "Holy Water", type: "material", stackSize: 99, quantity: this.variant === 'large' ? 2 : 1 });
        console.log(`Harvested ${this.variant === 'large' ? 2 : 1} Holy Water from ${this.variant} SnowPile!`);
    }
}