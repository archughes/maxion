import { CombatEntity } from './entity.js';

class Character extends CombatEntity {
    constructor(mesh, health, speed) {
        super(mesh, health);
        this.speed = speed;

        this.attackCooldown = 0;
        this.attackInterval = 1;

        this.drowningTimer = 0;
        this.drowningDamageTimer = 0;
        this.drowningTime = 3; // 3 seconds before drowning
        this.drowningDamageInterval = 1; // Damage every second
    }

    update(deltaTime) {
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }
    }
}

export { Character }