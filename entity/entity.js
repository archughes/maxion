import * as THREE from '../lib/three.module.js';

class Entity {
    constructor(object, health) {
        this.object = object; // Can be a Mesh or a Group
        this.health = health;
        this.maxHealth = health;
        this.position = new THREE.Vector3();
        this.gravity = 6.5;
        this.heightOffset = 0; // Default height offset (feet to center)
        this.isInWater = false;
        this.isUnderWater = false;
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
        this.isInWater = this.isInWaterTest(this.object.position.x, this.object.position.z, this.object.position.y, terrain);
        this.isUnderWater = this.isUnderWaterTest(this.object.position.x, this.object.position.z, this.object.position.y, terrain);
        this.baseSpeedMultiplier = this.isInWater ? 0.3 : 1;
        this.speedMultiplier = this.baseSpeedMultiplier;
    }

    isInWaterTest(x, z, y, terrain) {
        const waterLevel = terrain.getWaterLevel(x, z);
        return y - this.heightOffset + 0.5 < waterLevel;
    }

    isUnderWaterTest(x, z, y, terrain) {
        const waterLevel = terrain.getWaterLevel(x, z);
        return y + this.heightOffset < waterLevel;
    }
}

class CombatEntity extends Entity {
    constructor(object, health, armor = 0) {
        super(object, health);
        this.armor = armor; // Reduces incoming damage
        this.resistances = { physical: armor, magic: 0 };
        this.collisionRadius = 0.5;
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.rotateLeft = false;
        this.rotateRight = false;
        this.firstJump = false;
        this.isJumping = false;
        this.jumpVelocity = 0;
        this.isMoving = false;
        this.isSliding = false;
        this.isRunning = false;
        this.runTimer = 0;
        this.selectedTarget = null;
        this.attackCooldown = 0;
        this.attackInterval = 1;
        this.damage = 20;

        this.damageModifiers = {
            physical: 1.0, // Default: no resistance or vulnerability
            fire: 1.0,
            ice: 1.0,
            arcane: 1.0,
            holy: 1.0,
            shadow: 1.0,
            nature: 1.0
          };
    }
    
    updateDamageModifiers() {
        // Reset modifiers
        Object.keys(this.damageModifiers).forEach(type => this.damageModifiers[type] = 1.0);
    
        // Apply equipment effects (example logic)
        if (this.equippedArmor) {
          if (this.equippedArmor.type === "armor") {
            this.damageModifiers.physical *= 0.8; // 20% physical resistance
            if (this.equippedArmor.name.includes("Fire")) this.damageModifiers.fire *= 0.7;
          }
        }
        if (this.equippedHelmet) {
          if (this.equippedHelmet.name.includes("Ice")) this.damageModifiers.ice *= 0.7;
        }
    
        // Apply active spell effects (example for player)
        if (this.isInvisible) {
          this.damageModifiers.physical *= 0.5; // 50% physical resistance while invisible
        }
    }

    takeDamage(amount, type = 'physical', attacker = '') {

        this.updateDamageModifiers(); // Update before calculating damage
        const modifiedAmount = amount * (this.damageModifiers[type] || 1.0);

        super.takeDamage(modifiedAmount, attacker);
        // console.log(`CombatEntity took ${amount} damage! Current health: ${this.health}`);
    }

    adjustToTerrain(terrain) {
        super.adjustToTerrain(terrain); 
        // No magic number here; heightOffset is set by subclasses
    }

    update(deltaTime) {
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }
    }
}

export { Entity, CombatEntity };