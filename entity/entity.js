import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';

class Entity {
    constructor(mesh, health) {
        this.mesh = mesh;
        this.health = health;
        this.position = new THREE.Vector3();
    }
    
    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
    }

    adjustToTerrain(terrain) {
        this.mesh.position.y = terrain.getHeightAt(this.mesh.position.x, this.mesh.position.z);

        const waterHeight = terrain?.water?.position.y || -Infinity;
        this.isInWater = this.position.y < waterHeight;
        
        if (this.isInWater) {
            this.speedMultiplier = 0.6;
            this.mesh.position.y = waterHeight + 0.2; // Buoyancy
        } else {
            this.speedMultiplier = 1;
        }
    }
}

class CombatEntity extends Entity {
    constructor(mesh, health, armor = 0) {
        super(mesh, health);
        this.armor = armor; // Reduces incoming damage
        this.resistances = { fire: 0, cold: 0 };
    }

    takeDamage(amount, type = 'physical') {
        let finalDamage = type === 'physical' ? 
            Math.max(0, amount - this.armor) : 
            amount * (1 - this.resistances[type] || 0);
        this.health = Math.max(0, this.health - finalDamage);
        console.log(`CombatEntity took ${amount} damage! Current health: ${this.health}`);
    }

    adjustToTerrain(terrain) {
        super.adjustToTerrain(terrain); 
        this.mesh.position.y += 0.5; // Magic number for character height (all types same height!).
    }
}

export { Entity, CombatEntity }