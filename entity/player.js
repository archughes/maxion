// player.js
import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';
import { scene } from '../environment/scene.js';
import { updateHealthUI, updateManaUI, updateInventoryUI, updateXPUI, updateCharacterUI } from '../ui.js';
import { Character } from './character.js';
import { terrain } from '../environment/environment.js';
import { checkCollectionQuests } from '../quests.js';
import { items } from '../items.js';

const playerGeometry = new THREE.BoxGeometry(1, 1, 1);
const playerMaterial = new THREE.MeshPhongMaterial({ color: 0x00fff0 });
const INVENTORY_SIZE = 8;

class Player extends Character {
    constructor() {
        super(new THREE.Mesh(playerGeometry, playerMaterial), 100, 0.1);
        this.mesh.position.y = 0.5;
        scene.add(this.mesh);

        this.cooldowns = {
            "Power Attack": 0,
            "Fireball": 0,
            "Invisibility": 0
        };
        this.actionBar = [
            { type: "skill", name: "Power Attack" }, // Slot 1 (index 0)
            { type: "skill", name: "Fireball" },     // Slot 2 (index 1)
            { type: "skill", name: "Invisibility" }, // Slot 3 (index 2)
            null, null, null                         // Slots 4-6 (indices 3-5) for items
        ];
        this.lastAction = null;
        this.mana = 50;
        this.xp = 0;
        this.level = 1;
        this.stats = { strength: 10, agility: 10, intelligence: 10 };
        this.inventory = [];
        this.bags = [new Bag(10)]; // One bag with 10 slots
        this.equippedWeapon = null;
        this.equippedArmor = null;
        this.equippedHelmet = null;
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.rotateLeft = false;
        this.rotateRight = false;
        this.isJumping = false;
        this.jumpVelocity = 0;
        this.gravity = 0.01;
        this.skillPoints = 0;
        this.statPoints = 0;
        this.skills = {
            "Power Attack": 1,
            "Fireball": 1,
            "Invisibility": 1
        };
        this.knownRecipes = []; 
    }

    useSkill(skillName) {
        if (this.skills[skillName] === undefined || this.skills[skillName] <= 0) return null;
        if (this.cooldowns[skillName] > 0) return null;
        let action = null;
        if (skillName === "Power Attack") {
            const damage = 15 + this.skills["Power Attack"] * 5; // +5 damage per level
            action = { type: "attack", damage: damage };
            this.cooldowns[skillName] = 5 - this.skills["Power Attack"] * 0.5; // Reduce cooldown
        } else if (skillName === "Fireball" && this.useMana(10)) {
            const damage = 20 + this.skills["Fireball"] * 10; // +10 damage per level
            action = { type: "fireball", damage: damage };
            this.cooldowns[skillName] = 10 - this.skills["Fireball"] * 1;
        } else if (skillName === "Invisibility" && this.useMana(5)) {
            action = { type: "invisibility" };
            this.cooldowns[skillName] = 15 - this.skills["Invisibility"] * 2;
        }
        return action;
    }

    updateCooldowns(delta) {
        Object.keys(this.cooldowns).forEach(skill => {
            if (this.cooldowns[skill] > 0) this.cooldowns[skill] = Math.max(0, this.cooldowns[skill] - delta);
        });
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
        effect.position.copy(this.mesh.position);
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
        if (this.skillPoints > 0 && this.skills[skillName] !== undefined) {
            this.skills[skillName]++;
            this.skillPoints--;
            console.log(`Upgraded ${skillName} to level ${this.skills[skillName]}`);
            updateCharacterUI(); // Refresh UI
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

function updatePlayer() {
    const speed = player.speed * (player.stats.agility / 10);
    const direction = player.mesh.rotation.y;
    let newX = player.mesh.position.x;
    let newZ = player.mesh.position.z;

    if (player.moveForward) {
        newX += Math.sin(direction) * speed;
        newZ += Math.cos(direction) * speed;
    }
    if (player.moveBackward) {
        newX -= Math.sin(direction) * speed;
        newZ -= Math.cos(direction) * speed;
    }
    if (player.moveLeft) {
        newX += Math.cos(direction) * speed;
        newZ -= Math.sin(direction) * speed;
    }
    if (player.moveRight) {
        newX -= Math.cos(direction) * speed;
        newZ += Math.sin(direction) * speed;
    }

    player.mesh.position.x = newX;
    player.mesh.position.z = newZ;
    if (terrain) {
        const height = terrain.getHeightAt(newX, newZ);
        player.mesh.position.y = (height !== undefined ? height : 0) + 0.5;
    }

    if (player.rotateLeft) player.mesh.rotation.y += 0.05;
    if (player.rotateRight) player.mesh.rotation.y -= 0.05;

    if (player.isJumping) {
        player.mesh.position.y += player.jumpVelocity;
        player.jumpVelocity -= player.gravity;
        if (player.mesh.position.y <= terrain.getHeightAt(newX, newZ) + 0.5) {
            player.mesh.position.y = terrain.getHeightAt(newX, newZ) + 0.5;
            player.isJumping = false;
        }
    }

    player.regenerateMana(0.05);
}

export { player, updatePlayer };