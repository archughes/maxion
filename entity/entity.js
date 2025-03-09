import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';

class Entity {
    constructor(object, health) {
        this.object = object; // Can be a Mesh or a Group
        this.health = health;
        this.position = new THREE.Vector3();
        this.gravity = 6.5;
        this.heightOffset = 0; // Default height offset (feet to center)
        this.baseSpeedMultiplier = 1; // Base value
        this.speedMultiplier = this.baseSpeedMultiplier; // Dynamic value
    }
    
    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
    }

    adjustToTerrain(terrain) {
        const terrainHeight = terrain.getHeightAt(this.object.position.x, this.object.position.z);
        this.object.position.y = terrainHeight + this.heightOffset;
        const waterHeight = terrain?.water?.position.y || -Infinity;
        this.isInWater = this.object.position.y - this.heightOffset < waterHeight; // Check feet position
        this.baseSpeedMultiplier = this.isInWater ? 0.3 : 1;
        this.speedMultiplier = this.baseSpeedMultiplier;
    }
}

class CombatEntity extends Entity {
    constructor(object, health, armor = 0) {
        super(object, health);
        this.armor = armor; // Reduces incoming damage
        this.resistances = { fire: 0, cold: 0 };
    }

    takeDamage(amount, type = 'physical') {
        let finalDamage = type === 'physical' ? 
            Math.max(0, amount - this.armor) : 
            amount * (1 - this.resistances[type] || 0);
        this.health = Math.max(0, this.health - finalDamage);
        // console.log(`CombatEntity took ${amount} damage! Current health: ${this.health}`);
    }

    adjustToTerrain(terrain) {
        super.adjustToTerrain(terrain); 
        // No magic number here; heightOffset is set by subclasses
    }
}

export { Entity, CombatEntity };