import { player } from './entity/player.js';
import { setupActionBar } from './ui/action-bar-ui.js';
import { CooldownEntity, cooldownManager } from './cooldown.js';

const RANK_NAMES = ['starter', 'wood', 'stone', 'iron', 'steel', 'diamond', 'eternium'];
const MAX_RANK = 6;

export class Spell extends CooldownEntity {
  constructor(data, rankLevel = 0) {
    super(data.cooldown || 0);
    this.name = data.name;
    this.type = data.type;
    this.rank = Math.min(Math.max(rankLevel, 0), MAX_RANK);
    this.baseDamage = data.damage || 0;
    this.baseManaCost = data.manaCost || 0;
    this.baseRange = data.range || 0;
    this.baseDuration = data.duration || 0;
    this.icon = data.icon;

    this.modifyByRank();
    cooldownManager.register(this, this.name);
  }

  modifyByRank() {
    const rankFactor = this.rank * 0.2;
    this.damage = this.baseDamage * (1 + rankFactor);
    this.manaCost = this.baseManaCost * (1 + rankFactor * 0.5);
    this.baseCooldown = this.baseCooldown / (1 + rankFactor * 0.25);
    this.range = this.baseRange * (1 + rankFactor * 0.5);
    this.duration = this.baseDuration * (1 + rankFactor * 0.5);

    this.damage = Math.round(this.damage);
    this.manaCost = Math.round(this.manaCost);
    this.baseCooldown = Math.round(this.baseCooldown * 10) / 10;
    this.range = Math.round(this.range);
    this.duration = Math.round(this.duration * 10) / 10;
  }

  upgradeRank() {
    if (this.rank < MAX_RANK) {
      this.rank++;
      this.modifyByRank();
      return true;
    }
    return false;
  }

  getRankName() {
    return RANK_NAMES[this.rank];
  }
}

class SpellManager {
  constructor(spellsData) {
    this.spells = spellsData.map(data => new Spell(data));
  }

  getSpellByName(name) {
    return this.spells.find(spell => spell.name === name);
  }

  getAllSpells() {
    return this.spells;
  }

  castSpell(spellName, player, target) {
    const spell = player.learnedSpells.find(s => s.name === spellName);
    if (!spell || spell.isOnCooldown() || (spell.manaCost && !player.useMana(spell.manaCost))) {
      return false;
    }

    const distanceToTarget = target ? player.object.position.distanceTo(target.object.position) : Infinity;
    if (distanceToTarget > spell.range) return false;

    let success = false;
    switch (spell.type) {
      case "physical":
        if (target) {
          const damage = this.applyDamageModifiers(spell, player, target, "physical");
          console.log(`Before damage: ${target.health} HP`);
          target.takeDamage(damage, spell.type, 'player');
          console.log(`Player cast ${spell.name} for ${damage} physical damage! After damage: ${target.health}`);
          success = true;
        }
        break;
      case "fire":
        if (target) {
          const damage = this.applyDamageModifiers(spell, player, target, "fire");
          target.takeDamage(damage, spell.type, 'player');
          console.log(`Player cast ${spell.name} for ${damage} fire damage!`);
          success = true;
        }
        break;
      case "ice":
        if (target) {
          const damage = this.applyDamageModifiers(spell, player, target, "ice");
          target.takeDamage(damage, spell.type, 'player');
          target.speed *= 0.8;
          console.log(`Player cast ${spell.name} for ${damage} ice damage!`);
          success = true;
        }
        break;
      case "invisibility":
        player.isInvisible = true;
        player.setInvisibilityEffect(true);
        setTimeout(() => {
          player.isInvisible = false;
          player.setInvisibilityEffect(false);
        }, spell.duration * 1000);
        console.log(`Player is invisible for ${spell.duration}s!`);
        success = true;
        break;
      case "arcane":
        if (target) {
          const damage = this.applyDamageModifiers(spell, player, target, "arcane");
          target.takeDamage(damage, spell.type, 'player');
          console.log(`Player cast ${spell.name} for ${damage} arcane damage!`);
          success = true;
        }
        break;
      case "holy":
        if (target) {
          const damage = this.applyDamageModifiers(spell, player, target, "holy");
          target.takeDamage(damage, spell.type, 'player');
          console.log(`Player cast ${spell.name} for ${damage} holy damage!`);
          success = true;
        }
        break;
      case "shadow":
        if (target) {
          const damage = this.applyDamageModifiers(spell, player, target, "shadow");
          target.takeDamage(damage, spell.type, 'player');
          console.log(`Player cast ${spell.name} for ${damage} shadow damage!`);
          success = true;
        }
        break;
      case "nature":
        if (target) {
          const damage = this.applyDamageModifiers(spell, player, target, "nature");
          target.takeDamage(damage, spell.type, 'player');
          console.log(`Player cast ${spell.name} for ${damage} nature damage!`);
          success = true;
        }
        break;
      default:
        return false;
    }

    if (success) {
      spell.startCooldown();
      console.log(`Spell ${spell.name} cooldown set to ${spell.cooldownRemaining}s`);
    }
    return success;
  }

  applyDamageModifiers(spell, caster, target, damageType) {
    let damage = spell.damage * (caster.stats.intelligence / 10);
    switch (damageType) {
      case "fire":
        damage *= 1.2;
        break;
      case "ice":
        break;
      case "holy":
        damage *= 1.5;
        break;
      case "shadow":
        damage *= 1.1;
        break;
      case "nature":
      case "arcane":
        break;
    }
    return damage;
  }
}

// Singleton instance, initialized asynchronously
export let spellManager = null;
export async function loadSpells() {
    const response = await fetch('./data/spells.json');
    const spellsData = await response.json();
    spellManager = new SpellManager(spellsData);
    player.playerInit();
    setupActionBar();
}
