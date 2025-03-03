import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';
import { Entity } from '../../entity/entity.js';
import { scene } from '../scene.js';
import { soundManager } from '../../game.js';

export class Doodad extends Entity {
    constructor(mesh, soundUrl = null, interactionsToHarvest = 1, respawnTime = 60) {
        super(mesh, Infinity); // Doodads don’t take damage by default
        this.soundUrl = soundUrl;
        this.interactionsToHarvest = interactionsToHarvest;
        this.currentInteractions = 0;
        this.respawnTime = respawnTime;
        this.isHarvested = false;
        this.baseHeight = 0;
        scene.add(this.mesh);
    }

    interact() {
        if (this.isHarvested) return;
        if (this.soundUrl) soundManager.playSound(this.soundUrl);
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
        super.adjustToTerrain(terrain);
        this.mesh.position.y += this.baseHeight; // Add doodad-specific height offset
    }

    addGlow(color = 0xFFFFFF, intensity = 1, distance = 3) {
        const light = new THREE.PointLight(color, intensity, distance);
        light.position.y = 1;
        this.mesh.add(light);
        return light;
    }
}