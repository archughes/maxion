export class CooldownEntity {
    constructor(cooldown) {
        this.baseCooldown = cooldown || 0;
        this.cooldownRemaining = 0;
        this.isUsable = true;  // materials/items pre-configured false.  spells/consumables are pre-configured true.
    }

    startCooldown() {
        this.cooldownRemaining = this.baseCooldown;
    }

    updateCooldown(delta) {
        if (this.cooldownRemaining > 0) {
            this.cooldownRemaining = Math.max(0, this.cooldownRemaining - delta);
        }
    }

    isOnCooldown() {
        return this.cooldownRemaining > 0;
    }

    getCooldownPercent() {
        return this.isOnCooldown() ? (this.cooldownRemaining / this.baseCooldown) * 100 : 0;
    }
}

export class CooldownManager {
    constructor() {
        this.entities = new Map();
    }

    register(entity, key) {
        this.entities.set(key, entity);
    }

    update(delta) {
        this.entities.forEach(entity => entity.updateCooldown(delta));
    }

    getEntity(key) {
        return this.entities.get(key);
    }
}

export const cooldownManager = new CooldownManager();