import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';

class Entity {
    constructor(object, health) {
        this.object = object; // Can be a Mesh or a Group
        this.health = health;
        this.maxHealth = health;
        this.position = new THREE.Vector3();
        this.gravity = 6.5;
        this.heightOffset = 0; // Default height offset (feet to center)
        this.baseSpeedMultiplier = 1; // Base value
        this.speedMultiplier = this.baseSpeedMultiplier; // Dynamic value
        this.whoKill = '';
    }
    
    takeDamage(amount, attacker = '') {
        this.health = Math.max(0, this.health - Math.abs(amount)); // ensure damage always reduces health with abs.
        if (this.health <= 0) this.whoKill = attacker;
    }

    adjustToTerrain(terrain) {
        const terrainHeight = terrain.getHeightAt(this.object.position.x, this.object.position.z);
        this.object.position.y = terrainHeight + this.heightOffset;
        const waterLevel = terrain.getWaterLevel(this.position.x, this.position.z);
        this.isInWater = this.object.position.y - this.heightOffset + 0.5 < waterLevel; // Check feet position
        this.baseSpeedMultiplier = this.isInWater ? 0.3 : 1;
        this.speedMultiplier = this.baseSpeedMultiplier;
    }
}

class CombatEntity extends Entity {
    constructor(object, health, armor = 0) {
        super(object, health);
        this.armor = armor; // Reduces incoming damage
        this.resistances = { physical: armor, magic: 0 };
        this.collisionRadius = 0.5;
    }

    takeDamage(amount, type = 'physical', attacker = '') {
        let finalDamage = amount;

        switch (type) {
            case 'physical':
                const maxArmor = 100; // TODO: Map to entity level?
                finalDamage = amount * (1 - (this.resistances[type] / maxArmor || 0));
                break;
            case 'magic':
                finalDamage = amount * (1 - (this.resistances[type] || 0));
                break;
            default:
                finalDamage = Math.max(0, amount - this.armor);
                break;
        }

        super.takeDamage(finalDamage, attacker);
        // console.log(`CombatEntity took ${amount} damage! Current health: ${this.health}`);
    }

    adjustToTerrain(terrain) {
        super.adjustToTerrain(terrain); 
        // No magic number here; heightOffset is set by subclasses
    }
}

export { Entity, CombatEntity };