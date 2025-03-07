// player.js
import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';
import { scene, camera } from '../environment/scene.js';
import { updateHealthUI, updateManaUI, updateInventoryUI, updateXPUI, updateCharacterUI } from '../ui.js';
import { Character } from './character.js';
import { terrain } from '../environment/environment.js';
import { checkCollectionQuests } from '../quests.js';
import { items } from '../items.js';
import { showDrowningMessage, removeDrowningMessage } from '../game.js';
import { updateMinimap, terrainCache } from '../ui.js';

const INVENTORY_SIZE = 8;

class Player extends Character {
    constructor() {
        const playerMaterial = new THREE.MeshPhongMaterial({ color: 0x00fff0 });
        super(playerMaterial, 100, 4, true);
        this.object.position.y = this.heightOffset;
        scene.add(this.object);
        // console.log('Player added to scene:', this.object);

        this.knownMap = new Set();
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
        this.skillPoints = 0;
        this.statPoints = 0;
        this.skills = {
            "Power Attack": 1,
            "Fireball": 1,
            "Invisibility": 1
        };
        this.knownRecipes = []; 

        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.rotateLeft = false;
        this.rotateRight = false;
        this.isJumping = false;
        this.firstJump = false;
        this.jumpVelocity = 0;
        this.limbAngle = 0; // For arm/leg animations
        this.isRunning = false;
        this.runTimer = 0;
                
        this.isInWater = false;
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

function updatePlayer(deltaTime) {
    // Determine if player is in water
    const terrainType = terrain.terrainFunc(player.object.position.x, player.object.position.z, player.object.position.y);
    // console.log(`terrainType ${terrainType}`);
    player.isInWater = terrainType === 'water';

    // Frame-rate independent speed
    let terrainHeight = terrain.getHeightAt(player.object.position.x, player.object.position.z);
    let speedMultiplier = player.baseSpeedMultiplier; // Start with base
    if (player.isRunning) {
        player.runTimer -= deltaTime;
        if (player.runTimer <= 0) {
            player.isRunning = false;
        } else {
            speedMultiplier *= 1.5; // Apply sprint multiplier
        }
    }
    player.speedMultiplier = speedMultiplier; // Update the dynamic multiplier
    const speed = player.speed * deltaTime * speedMultiplier;

    if (player.isInWater) {
        // 3D movement based on camera direction
        const dir = camera.getWorldDirection(new THREE.Vector3());
        if (player.moveForward) {
            player.object.position.addScaledVector(dir, speed);
        }
        if (player.moveBackward) {
            player.object.position.addScaledVector(dir, -speed);
        }
        if (player.moveLeft) {
            const leftDir = new THREE.Vector3().crossVectors(camera.up, dir).normalize();
            player.object.position.addScaledVector(leftDir, speed);
        }
        if (player.moveRight) {
            const rightDir = new THREE.Vector3().crossVectors(dir, camera.up).normalize();
            player.object.position.addScaledVector(rightDir, speed);
        }
        if (player.moveUp) {
            const suggestedY = player.object.position.y + player.speed * deltaTime;
            if (suggestedY < (terrain?.water?.position.y ?? Infinity)) {
                player.object.position.y = suggestedY;
            }
        }
    }

    let newX = player.object.position.x;
    let newZ = player.object.position.z;

    // Existing 2D movement on land
    const direction = player.object.rotation.y;
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

    // Apply movement (update X and Z)
    player.object.position.x = newX;
    player.object.position.z = newZ;

    player.isMoving = player.moveForward || player.moveBackward || player.moveLeft || player.moveRight;
    if (player.useComplexModel) {
        if (player.isMoving) {
            const swingSpeed = player.isRunning ? 10 : 5;
            player.limbAngle += deltaTime * swingSpeed;
            const swing = Math.sin(player.limbAngle) * 0.5;
            player.leftArm.rotation.z = swing;
            player.rightArm.rotation.z = -swing;
            player.leftLeg.rotation.z = -swing;
            player.rightLeg.rotation.z = swing;
        } else {
            player.leftArm.rotation.z = 0;
            player.rightArm.rotation.z = 0;
            player.leftLeg.rotation.z = 0;
            player.rightLeg.rotation.z = 0;
        }
        if (player.isJumping) {
            player.leftArm.rotation.x = player.jumpVelocity > 0 ? -Math.PI / 4 : Math.PI / 2;
            player.rightArm.rotation.x = player.jumpVelocity > 0 ? -Math.PI / 4 : -Math.PI / 2;
            player.leftArm.rotation.z = 0;
            player.rightArm.rotation.z = 0;
        } else {
            player.leftArm.rotation.x = 0;
            player.rightArm.rotation.x = 0;
        }
    }

    if (player.isInWater) {
        player.isJumping = false;
        player.object.position.y -= player.baseSpeedMultiplier * player.gravity * deltaTime * deltaTime;
    }

    if (player.rotateLeft) player.object.rotation.y += 0.5* deltaTime;
    if (player.rotateRight) player.object.rotation.y -= 0.5* deltaTime;
    if (player.isJumping && !player.isInWater) { // Disable jumping in water
        player.object.position.y += player.jumpVelocity * deltaTime; // Use deltaTime for frame-rate independence
        player.jumpVelocity -= player.gravity * deltaTime; // Apply gravity over time

        // Check if player has landed (hit terrain or gone below it)
        terrainHeight = terrain.getHeightAt(player.object.position.x, player.object.position.z);
        if (player.object.position.y <= terrainHeight + player.heightOffset && !player.firstJump) {
            player.object.position.y = terrainHeight + player.heightOffset; // Snap to terrain
            player.isJumping = false;
            player.jumpVelocity = 0; // Reset jump velocity
        }
    }

    const waterHeight = terrain.waterLevel;
    terrainHeight = terrain.getHeightAt(player.object.position.x, player.object.position.z);

    // console.log(`  player water: ${player.isInWater}, jump: ${player.isJumping}, waterHeight: ${waterHeight}`);
    if (!player.isJumping && !player.isInWater && player.object.position.y <= terrainHeight + player.heightOffset) {
        player.object.position.y = terrainHeight + player.heightOffset;
    } else if (!player.isInWater) {
        player.isJumping = true;
    }
    player.firstJump = false;

    player.regenerateMana(0.05);

    // Drowning mechanic
    const headY = player.object.position.y + player.heightOffset; // Head at top of 1-unit cube
    if (headY < waterHeight) {
        if (player.drowningTimer < player.drowningTime) {
            player.drowningTimer += deltaTime;
            const remaining = Math.ceil(player.drowningTime - player.drowningTimer);
            showDrowningMessage(`Drowning in ${remaining}...`);
        } else {
            showDrowningMessage("Drowning!", true); // Red text flag
            player.drowningDamageTimer += deltaTime;
            if (player.drowningDamageTimer >= player.drowningDamageInterval) {
                player.drowningDamageTimer = 0;
                player.takeDamage(player.health * 0.1); // 10% HP loss
            }
        }
    } else {
        player.drowningTimer = 0;
        player.drowningDamageTimer = 0;
        removeDrowningMessage();
    }
}

export { player, updatePlayer, updateKnownMap };