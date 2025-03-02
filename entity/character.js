import { CombatEntity } from './entity.js';

class Character extends CombatEntity {
    constructor(mesh, health, speed) {
        super(mesh, health);
        this.speed = speed;

        this.attackCooldown = 0;
        this.attackInterval = 1;
    }

    update(deltaTime) {
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }
    }
}

export { Character }