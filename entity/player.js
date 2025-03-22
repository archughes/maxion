// player.js
import * as THREE from '../lib/three.module.js';
import { scene, camera } from '../environment/scene.js';
import { updateHealthUI, updateManaUI, updateInventoryUI, updateXPUI, updateCharacterUI } from '../ui.js';
import { Character } from './character.js';
import { terrain } from '../environment/environment.js';
import { checkCollectionQuests } from '../quests.js';
import { items } from '../items.js';
import { showDrowningMessage, removeDrowningMessage } from '../messages.js';
import { updateMinimap, terrainCache } from '../environment/map.js';
import { animationSelector } from './animation.js';
import { createSparkleEffect } from '../animations/environmental-effects.js';

const INVENTORY_SIZE = 8;

class Player extends Character {
    constructor() {
        const playerMaterial = new THREE.MeshPhongMaterial({ color: 0x00fff0 });
        super(playerMaterial, 100, 6, 'human');
        this.object.position.y = this.heightOffset;
        scene.add(this.object);
        // console.log('Player added to scene:', this.object);

        this.knownMap = new Set();
        this.actionBar = [
            { type: "skill", name: "Power Attack", level: 1, cooldown: 0, maxCooldown: 5, range: 2 },
            { type: "skill", name: "Fireball", level: 1, cooldown: 0, maxCooldown: 10, range: 5, manaCost: 10 },
            { type: "skill", name: "Invisibility", level: 1, cooldown: 0, maxCooldown: 15, range: 0, manaCost: 5 },
            null, null, null // Slots 4-6 for items
        ];
        this.mana = 50;
        this.xp = 0;
        this.level = 1;
        this.stats = { strength: 10, agility: 10, intelligence: 10 };
        this.inventory = [];
        this.bags = [new Bag(10)]; // One bag with 10 slots
        this.equippedWeapon = null;
        this.equippedArmor = null;
        this.equippedHelmet = null;
        this.skillPoints = 0;
        this.statPoints = 0;
        this.knownRecipes = []; 
        this.isAutoAttacking = false;
        this.isInvisible = false;

        this.onLand = (fallVelocity) => {
            const fallDamage = Math.floor(fallVelocity * 2);
            this.takeDamage(fallDamage, undefined, 'fall');
            console.log(`Fall damage taken: ${fallDamage} HP (Velocity: ${fallVelocity.toFixed(2)})`);
          };
        
        this.collisionRadius = 0.5;
    }

    useSkill(skillName) {
        const action = this.actionBar.find(a => a?.type === "skill" && a.name === skillName);
        if (!action || action.level <= 0 || action.cooldown > 0) return false;

        const distanceToTarget = this.selectedTarget ? this.object.position.distanceTo(this.selectedTarget.object.position) : Infinity;

        // Skill-specific logic with immediate effect
        if (skillName === "Power Attack") {
            if (distanceToTarget <= action.range) {
                const damage = this.damage + action.level * 5;
                this.selectedTarget.takeDamage(damage * (this.stats.strength / 10), 'physical', 'player');
                console.log(`Player used Power Attack for ${damage * (this.stats.strength / 10)} damage!`);
                action.cooldown = action.maxCooldown - action.level * 0.5;
                this.isAutoAttacking = true; // Enable auto-attack
                return true;
            }
        } else if (skillName === "Fireball" && this.useMana(action.manaCost)) {
            if (distanceToTarget <= action.range) {
                const damage = 20 + action.level * 10;
                this.selectedTarget.takeDamage(damage * (this.stats.intelligence / 10), 'magic', 'player');
                console.log(`Player cast Fireball for ${damage * (this.stats.intelligence / 10)} damage!`);
                action.cooldown = action.maxCooldown - action.level * 1;
                return true;
            }
        } else if (skillName === "Invisibility" && this.useMana(action.manaCost)) {
            console.log("Player is invisible!");
            action.cooldown = action.maxCooldown - action.level * 2;
            this.isInvisible = true;
            this.setInvisibilityEffect(true);
            setTimeout(() => {
                this.isInvisible = false;
                this.setInvisibilityEffect(false);
            }, 5000);
            return true;
        }
        return false; // Failed due to range, mana, or other conditions
    }

    setInvisibilityEffect(isInvisible) {
        // Apply effect to all meshes in the player group
        this.object.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material.transparent = true;
                child.material.opacity = isInvisible ? 0.3 : 1.0;
            }
        });
        
        if (isInvisible) {
            createSparkleEffect(this.object, 2000); 
        }
    }

    toggleVisibility(duration) {
        this.object.visible = true; // Ensure the object is visible first
        if (this.object.material) {
            this.object.material.opacity = 0.3; // Set opacity to 30%
        }
        setTimeout(() => {
            this.object.visible = true; // Ensure player reappears
            if (this.object.material) {
                this.object.material.opacity = 1; // Reset opacity
            }
        }, duration);
    }

    updateCooldowns(delta) {
        this.actionBar.forEach(action => {
            if (action?.type === "skill" && action.cooldown > 0) {
                action.cooldown = Math.max(0, action.cooldown - delta);
            }
        });
        this.updateSkillAvailability(); // Check range and update UI
    }

    updateSkillAvailability() {
        const distanceToTarget = this.selectedTarget ? this.object.position.distanceTo(this.selectedTarget.object.position) : Infinity;
        this.actionBar.forEach((action, slot) => {
            if (action?.type === "skill") {
                const outOfRange = action.range > 0 && distanceToTarget > action.range;
                const onCooldown = action.cooldown > 0;
                const unavailable = outOfRange || onCooldown || (action.manaCost && this.mana < action.manaCost);
                this.updateActionBarSlotUI(slot, unavailable);
            }
        });
    }

    updateActionBarSlotUI(slot, unavailable) {
        const slotElement = document.querySelector(`.action-slot:nth-child(${slot + 1})`);
        if (slotElement) {
            slotElement.style.filter = unavailable ? "grayscale(100%)" : "none";
            slotElement.style.opacity = unavailable ? "0.5" : "1";
        }
    }

    autoAttack(delta) {
        if (!this.isAutoAttacking || !this.selectedTarget || this.selectedTarget.health <= 0) {
            this.isAutoAttacking = false;
            return;
        }
        const action = this.actionBar[0]; // Power Attack is in slot 0
        if (action && action.name === "Power Attack" && action.cooldown <= 0) {
            const distanceToTarget = this.object.position.distanceTo(this.selectedTarget.object.position);
            if (distanceToTarget <= action.range) {
                this.useSkill("Power Attack");
            } else {
                this.isAutoAttacking = false; // Stop if out of range
            }
        }
    }

    takeDamage(amount) {
        super.takeDamage(amount); 
        updateHealthUI(); 
    }

    heal(amount) {
        this.health = Math.min(100, this.health + amount);
        updateHealthUI();
    }

    useMana(amount) {
        if (this.mana >= amount) {
            this.mana -= amount;
            updateManaUI();
            return true;
        }
        return false;
    }

    regenerateMana(amount) {
        this.mana = Math.min(50, this.mana + amount);
        updateManaUI();
    }

    gainXP(amount) {
        this.xp += amount;
        const xpForNextLevel = 100 * this.level;
        if (this.xp >= xpForNextLevel) {
            this.levelUp();
        }
        updateXPUI();
    }

    levelUp() {
        this.level++;
        this.xp -= 100 * (this.level - 1);
        this.statPoints += 5;  // 5 stat points to allocate manually
        this.skillPoints += 1; // 1 skill point for skills
        this.health = 100;     // Heal to full
        this.mana = 50;        // Restore mana to full
        updateHealthUI();
        updateManaUI();
    
        // Visual effect: Glowing sphere that expands and fades
        const effect = new THREE.Mesh(
            new THREE.SphereGeometry(1, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.5 })
        );
        effect.position.copy(this.object.position);
        effect.position.y += 1;
        scene.add(effect);
        let scale = 1;
        const interval = setInterval(() => {
            scale += 0.1;
            effect.scale.set(scale, scale, scale);
            effect.material.opacity -= 0.05;
            if (scale >= 2) {
                clearInterval(interval);
                scene.remove(effect);
            }
        }, 50);
    
        // Play sound (defined in game.js)
        window.levelUpSound.play();
    
        console.log(`Leveled up to ${this.level}! Stat points: ${this.statPoints}, Skill points: ${this.skillPoints}`);
    }

    addItem(newItem) {
        if (!items || items.length === 0) {
            console.error("Items not loaded yet");
            return;
        }
        const itemData = items.find(i => i.name === newItem.name) || { stackSize: 1 };
        const stackable = itemData.stackSize > 1;
    
        if (stackable) {
            const existing = this.inventory.find(item => item.name === newItem.name);
            if (existing) {
                existing.amount = Math.min((existing.amount || 1) + (newItem.amount || 1), itemData.stackSize);
            } else {
                this.inventory.push({ ...newItem, amount: newItem.amount || 1 });
            }
        } else {
            if (this.inventory.length < INVENTORY_SIZE) {
                console.log("Added inventory item:", newItem);
                this.inventory.push(newItem);
            } else if (this.bags[0].addItem(newItem)) {
                console.log("Added bag item:", newItem);
                console.log("Item added to bag!");
            } else {
                console.log("Inventory and bag full!");
            }
        }
        updateInventoryUI();
        checkCollectionQuests();
    }

    removeItem(item, amount = 1) {
        // Find the item in the inventory (compare by reference or name)
        const inventoryItem = this.inventory.find(i => i === item || i.name === item.name);
        if (inventoryItem && inventoryItem.amount !== undefined) {
            inventoryItem.amount -= amount;
            if (inventoryItem.amount <= 0) {
                this.inventory.splice(this.inventory.indexOf(inventoryItem), 1);
            }
        } else if (inventoryItem) {
            // Item exists but has no amount (e.g., a single-use item)
            this.inventory.splice(this.inventory.indexOf(inventoryItem), 1);
        } else {
            // Try removing from bag if not in main inventory
            this.bags[0].removeItem(item, amount);
        }
        updateInventoryUI();
    };

    equipItem(item) {
        console.log("Attempting Equipping:", item);
        if (item.type === "weapon") this.equippedWeapon = item;
        else if (item.type === "armor") this.equippedArmor = item;
        else if (item.type === "helmet") this.equippedHelmet = item;
        updateInventoryUI();
    }

    increaseStat(stat) {
        if (this.statPoints > 0) {
            this.stats[stat]++;
            this.statPoints--;
            console.log(`Increased ${stat} to ${this.stats[stat]}`);
            updateCharacterUI(); // Refresh UI
        }
    }
    
    upgradeSkill(skillName) {
        if (this.skillPoints <= 0) return;
        const action = this.actionBar.find(a => a?.type === "skill" && a.name === skillName);
        if (action) {
            action.level++;
            this.skillPoints--;
            console.log(`Upgraded ${skillName} to level ${action.level}`);
            updateCharacterUI();
        }
    }
}

class Bag {
    constructor(size) {
        this.items = [];
        this.size = size;
    }
    addItem(item) {
        if (!items || items.length === 0) {
            console.error("Items not loaded yet");
            return;
        }
        if (this.items.length >= this.size) return false;
        const itemData = items.find(i => i.name === item.name) || { stackSize: 1 };
        if (itemData.stackSize > 1) {
            const existing = this.items.find(i => i.name === item.name);
            if (existing) {
                existing.amount = Math.min((existing.amount || 1) + (item.amount || 1), itemData.stackSize);
                return true;
            }
        }
        this.items.push({ ...item, amount: item.amount || 1 });
        return true;
    }

    removeItem(item, amount = 1) {
        // Find the item by reference or name
        const bagItem = this.items.find(i => i === item || i.name === item.name);
        if (bagItem && bagItem.amount !== undefined) {
            bagItem.amount -= amount;
            if (bagItem.amount <= 0) {
                this.items.splice(this.items.indexOf(bagItem), 1);
            }
        } else if (bagItem) {
            // Item exists but has no amount (single-use)
            this.items.splice(this.items.indexOf(bagItem), 1);
        }
    }

    [Symbol.iterator]() {
        return this.items[Symbol.iterator]();
    }
}

const player = new Player();

let lastKnownMapUpdate = 0;
let lastPlayerPosition = new THREE.Vector3();
let lastPlayerRotationY = 0;
const knownMapUpdateInterval = 500;

function updateKnownMap() {
    const currentTime = Date.now();
    if (currentTime - lastKnownMapUpdate >= knownMapUpdateInterval) {
        const playerPos = player.object.position;
        const playerRotationY = player.object.rotation.y;
        
        if (playerPos.equals(lastPlayerPosition) && playerRotationY === lastPlayerRotationY) {
            return;
        }
        
        lastPlayerPosition.copy(playerPos);
        lastPlayerRotationY = playerRotationY;

        const viewDistance = 25;
        const viewAngle = Math.PI / 2;
        const playerDir = new THREE.Vector3(Math.sin(playerRotationY), 0, Math.cos(playerRotationY)).normalize();

        const widthSegments = terrain.geometry.parameters.widthSegments;
        const heightSegments = terrain.geometry.parameters.heightSegments;
        const segmentWidth = terrain.width / widthSegments;
        const segmentHeight = terrain.height / heightSegments;

        const playerSegX = Math.floor((playerPos.x / segmentWidth) + widthSegments / 2);
        const playerSegZ = Math.floor((playerPos.z / segmentHeight) + heightSegments / 2);
        const segRadius = Math.ceil(viewDistance / Math.min(segmentWidth, segmentHeight));

        // Collect newly discovered segments
        let newDiscoveries = [];

        const minX = Math.max(0, playerSegX - segRadius);
        const maxX = Math.min(widthSegments - 1, playerSegX + segRadius);
        const minZ = Math.max(0, playerSegZ - segRadius);
        const maxZ = Math.min(heightSegments - 1, playerSegZ + segRadius);

        for (let z = minZ; z <= maxZ; z++) {
            for (let x = minX; x <= maxX; x++) {
                const worldX = (x - widthSegments / 2) * segmentWidth;
                const worldZ = (z - heightSegments / 2) * segmentHeight;
                const toPoint = new THREE.Vector3(worldX - playerPos.x, 0, worldZ - playerPos.z);
                const distance = toPoint.length();

                if (distance > viewDistance) continue;

                const toPointNorm = toPoint.normalize();
                const angleDiff = Math.acos(playerDir.dot(toPointNorm));

                if (angleDiff <= viewAngle / 2) {
                    const key = `${x},${z}`;
                    if (!player.knownMap.has(key)) {
                        player.knownMap.add(key);
                        newDiscoveries.push({ x, z }); // Store new segment
                    }
                }
            }
        }

        // If there are new discoveries, store them and flag an update
        if (newDiscoveries.length > 0) {
            terrainCache.newDiscoveries = newDiscoveries;
            terrainCache.terrainCacheNeedsUpdate = true;
        }
        
        updateMinimap();
        lastKnownMapUpdate = currentTime;
    }
}

function updatePlayer(deltaTime, movement) {
    player.autoAttack(deltaTime);
    movement.update(deltaTime);
    
    player.isMoving = player.moveForward || player.moveBackward || player.moveLeft || player.moveRight;
    if (player.modelType !== 'cube') {
        player.mixer.update(deltaTime);
        player.animationQueue.update(deltaTime);
        switch (true) {
            case player.isJumping:
                player.animationQueue.enqueue(animationSelector("jump", player));
                break;
            case player.isUnderWater:
                player.animationQueue.enqueue(animationSelector("swim", player));
                break;
            case player.isMoving:
                player.animationQueue.enqueue(animationSelector("walk", player));
                break;
            case player.isProne:
                player.animationQueue.enqueue(animationSelector("crawl", player));
                break;
            default:
                player.animationQueue.clear();
                break;
        }
    }

    player.regenerateMana(0.05);

    // Drowning mechanic
    const headY = player.object.position.y + player.heightOffset; // Head at top of 1-unit cube
    const level = terrain.getWaterLevel(player.object.position.x, player.object.position.z);
    if (headY < level) {
        if (player.drowningTimer < player.drowningTime) {
            player.drowningTimer += deltaTime;
            const remaining = Math.ceil(player.drowningTime - player.drowningTimer);
            showDrowningMessage(`Drowning in ${remaining}...`);
        } else {
            showDrowningMessage("Drowning!", true); // Red text flag
            player.drowningDamageTimer += deltaTime;
            if (player.drowningDamageTimer >= player.drowningDamageInterval) {
                player.drowningDamageTimer = 0;
                player.takeDamage(player.maxHealth * 0.1, undefined, 'drown'); // 10% HP loss
            }
        }
    } else {
        player.drowningTimer = 0;
        player.drowningDamageTimer = 0;
        removeDrowningMessage();
    }

}

export { player, updatePlayer, updateKnownMap };