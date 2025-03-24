// npc.js
import * as THREE from '../lib/three.module.js';
import { scene, camera } from '../environment/scene.js';
import { player } from './player.js';
import { settings } from '../ui/settings.js';
import { quests, activeQuests, addQuest, completeQuest, completedQuests, canStartQuest, updateQuestProgress  } from '../quests.js';
import { Character } from './character.js'; // Assuming this exists
import { terrain } from '../environment/environment.js';
import { updateQuestUI } from '../ui/quests-ui.js';
import { selectAttackingEnemy } from '../input.js';
import { animationSelector } from './animation.js';

const damageMultiplier = { easy: 0.5, normal: 1, hard: 2 }[settings.difficulty];

class NPC extends Character {
    constructor(x, z, color = 0xff0000) {
        const material = new THREE.MeshPhongMaterial({ color });
        super(material, 50 * damageMultiplier, 0.05, 'cube');
        this.spawnPoint = new THREE.Vector3(x || 5, 0, z || 5);
        this.object.position.set(this.spawnPoint.x, this.heightOffset, this.spawnPoint.z);
        this.lastPosition = this.spawnPoint.clone(this.object.position);
        this.damage = this.damage * damageMultiplier;
        scene.add(this.object);
        this.object.userData.entity = this;

        this.wanderDirection = null;
        this.wanderTimer = 0;

        this.healthBar = new THREE.Mesh(
            new THREE.PlaneGeometry(1, 0.1),
            new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide })
        );
        this.healthBar.position.set(this.object.position.x, this.object.position.y + 1.0 + this.heightOffset, this.object.position.z);
        scene.add(this.healthBar);

        this.selectionDisc = this.createSelectionDisc(0xff0000); // Red for enemies
        scene.add(this.selectionDisc);
    }

    createSelectionDisc(color) {
        const geometry = new THREE.CircleGeometry(1.5, 32); // Radius 1, 32 segments
        const material = new THREE.ShaderMaterial({
            uniforms: {
                color: { value: new THREE.Color(color) },
                opacity: { value: 1.0 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 color;
                uniform float opacity;
                varying vec2 vUv;
                void main() {
                    float dist = distance(vUv, vec2(0.5, 0.5));
                    float alpha = smoothstep(0.0, 0.5, dist) * opacity;
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide
        });
        const disc = new THREE.Mesh(geometry, material);
        disc.rotation.x = -Math.PI / 2; // Face upward
        disc.position.y = 0.01; // Slightly above ground to avoid z-fighting
        disc.visible = false; // Hidden by default
        return disc;
    }

    updateHealthBar() {
        const healthPercent = this.health / this.maxHealth; // 0 to 1
        this.healthBar.scale.x = healthPercent;
        this.healthBar.position.set(this.object.position.x, this.object.position.y + 1.0 + this.heightOffset, this.object.position.z);
        this.healthBar.lookAt(camera.position)
        this.selectionDisc.position.set(this.object.position.x, this.object.position.y + 0.01 - this.heightOffset , this.object.position.z);
    }

    adjustToTerrain(terrain) {
        super.adjustToTerrain(terrain); 
        this.updateHealthBar();
    }

    updateAnimations(deltaTime) {
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }
        this.animationQueue.update(deltaTime);
    }

    update(deltaTime) {
        if (player.isInvisible || this.health <= 0) {
            this.updateAnimations(deltaTime);
            return;
        }
    
        super.update(deltaTime);
        this.updateAnimations(deltaTime);
    
        const slopeInfo = terrain.getSlopeAt(this.object.position.x, this.object.position.z);
        const steepThreshold = 1.5;
        const slopeMultiplier = 1 / (1 + slopeInfo.magnitude);
        const effectiveSpeed = this.speed * this.baseSpeedMultiplier * slopeMultiplier;
    
        let previousPosition = this.object.position.clone();
        this.isMoving = false;
    
        // Water interaction
        const waterLevel = terrain.getWaterLevel(this.object.position.x, this.object.position.z);
        if (this.isInWater) {
            const terrainHeight = terrain.getHeightAt(this.object.position.x, this.object.position.z);
            if (this.object.position.y > terrainHeight + this.heightOffset) {
                this.object.position.y -= this.gravity * deltaTime * deltaTime;
            } else {
                this.object.position.y = waterLevel - this.heightOffset + 0.5;
            }
        }
    
        // Check if stuck and jump
        const distanceMoved = this.object.position.distanceTo(this.lastPosition);
        if (distanceMoved < 0.1 && !this.isInWater && !this.isJumping) {
            this.stuckTimer += deltaTime;
            if (this.stuckTimer >= 2) {
                this.isJumping = true;
                this.jumpVelocity = 5;
                this.stuckTimer = 0;
            }
        } else {
            this.stuckTimer = 0;
        }
        this.lastPosition.copy(this.object.position);
    
        // Apply jumping
        if (this.isJumping) {
            this.object.position.y += this.jumpVelocity * deltaTime;
            this.jumpVelocity -= this.gravity * deltaTime;
            const terrainHeight = terrain.getHeightAt(this.object.position.x, this.object.position.z);
            if (this.object.position.y <= terrainHeight + this.heightOffset) {
                this.object.position.y = terrainHeight + this.heightOffset;
                this.isJumping = false;
                this.jumpVelocity = 0;
            }
        }
    
        // Sliding on steep slopes
        if (!this.isInWater && slopeInfo.magnitude > steepThreshold) {
            this.isSliding = true;
            const slideAcceleration = this.gravity * slopeInfo.magnitude * deltaTime;
            this.slideVelocity.addScaledVector(slopeInfo.direction, slideAcceleration);
            this.slideVelocity.clampLength(0, this.maxSlideSpeed);
            this.object.position.x += this.slideVelocity.x * deltaTime;
            this.object.position.z += this.slideVelocity.z * deltaTime;
            const terrainHeight = terrain.getHeightAt(this.object.position.x, this.object.position.z);
            if (this.object.position.y > terrainHeight + this.heightOffset) {
                this.object.position.y -= this.gravity * deltaTime * deltaTime;
            }
            if (this.object.position.y <= terrainHeight + this.heightOffset) {
                this.object.position.y = terrainHeight + this.heightOffset;
                const newSlopeInfo = terrain.getSlopeAt(this.object.position.x, this.object.position.z);
                if (newSlopeInfo.magnitude <= steepThreshold) {
                    this.isSliding = false;
                    this.slideVelocity.set(0, 0, 0);
                }
            }
            this.isMoving = true;
        } else {
            this.isSliding = false;
            this.slideVelocity.set(0, 0, 0);
    
            const distanceToPlayer = this.object.position.distanceTo(player.object.position);
    
            // Chasing logic
            if (distanceToPlayer < 5) {
                if (player.isInWater) {
                    const direction = new THREE.Vector3()
                        .subVectors(player.object.position, this.object.position)
                        .normalize();
                    this.object.position.addScaledVector(direction, effectiveSpeed);
                    this.isMoving = true;
                } else {
                    const direction = Math.atan2(
                        player.object.position.z - this.object.position.z,
                        player.object.position.x - this.object.position.x
                    );
                    const newX = this.object.position.x + Math.cos(direction) * effectiveSpeed;
                    const newZ = this.object.position.z + Math.sin(direction) * effectiveSpeed;
                    const newY = terrain.getHeightAt(newX, newZ) + this.heightOffset;
                    if (!this.isInWaterTest(newX, newZ, newY, terrain)) {
                        this.object.position.x = newX;
                        this.object.position.z = newZ;
                        this.object.position.y = newY;
                        this.isMoving = true;
                    }
                }
                this.updateHealthBar();
                if (distanceToPlayer < 1 && this.attackCooldown <= 0) {
                    player.takeDamage(this.damage, undefined, 'npc');
                    this.attackCooldown = this.attackInterval;
                    selectAttackingEnemy(this);
                }
            } else {
                // Wandering logic
                const distanceFromSpawn = this.object.position.distanceTo(this.spawnPoint);
                if (distanceFromSpawn > 20) {
                    this.wanderDirection = Math.atan2(
                        this.spawnPoint.z - this.object.position.z,
                        this.spawnPoint.x - this.object.position.x
                    );
                    this.wanderTimer = 2 + Math.random() * 3;
                } else if (!this.wanderDirection || this.wanderTimer <= 0) {
                    let newDirection;
                    let attempts = 0;
                    do {
                        newDirection = Math.random() * 2 * Math.PI;
                        const testX = this.object.position.x + Math.cos(newDirection) * effectiveSpeed;
                        const testZ = this.object.position.z + Math.sin(newDirection) * effectiveSpeed;
                        const testY = terrain.getHeightAt(testX, testZ) + this.heightOffset;
                        if (!this.isInWaterTest(testX, testZ, testY, terrain)) {
                            break;
                        }
                        attempts++;
                    } while (attempts < 10);
                    if (attempts < 10) {
                        this.wanderDirection = this.wanderDirection
                            ? THREE.MathUtils.lerp(this.wanderDirection, newDirection, 0.1)
                            : newDirection;
                        this.wanderTimer = 2 + Math.random() * 3;
                    } else {
                        this.wanderDirection = Math.atan2(
                            this.spawnPoint.z - this.object.position.z,
                            this.spawnPoint.x - this.object.position.x
                        );
                        this.wanderTimer = 2 + Math.random() * 3;
                    }
                }
    
                const newX = this.object.position.x + Math.cos(this.wanderDirection) * effectiveSpeed;
                const newZ = this.object.position.z + Math.sin(this.wanderDirection) * effectiveSpeed;
                const newY = terrain.getHeightAt(newX, newZ) + this.heightOffset;
                if (!this.isInWaterTest(newX, newZ, newY, terrain)) {
                    this.object.position.x = newX;
                    this.object.position.z = newZ;
                    this.object.position.y = newY;
                    this.wanderTimer -= deltaTime;
                    this.isMoving = true;
                }
            }
        }
    
        this.updateHealthBar();
    
        // Animation and drowning logic (unchanged)
        this.isUnderWater = this.isUnderWaterTest(this.object.position.x, this.object.position.z, this.object.position.y, terrain);
        if (this.modelType !== 'cube') {
            if (this.isUnderWater) {
                this.animationQueue.enqueue(animationSelector("swim", this));
            } else if (this.isMoving) {
                this.animationQueue.enqueue(animationSelector("walk", this));
            } else {
                this.animationQueue.clear();
            }
        }
    
        if (this.isInWater) {
            this.drowningTimer += deltaTime;
            if (this.drowningTimer >= this.drowningTime) {
                this.drowningDamageTimer += deltaTime;
                if (this.drowningDamageTimer >= this.drowningDamageInterval) {
                    this.drowningDamageTimer = 0;
                    this.takeDamage(this.maxHealth * 0.1, undefined, 'drown');
                }
            }
        } else {
            this.drowningTimer = 0;
            this.drowningDamageTimer = 0;
        }
    }
}

class QuestGiver extends NPC {
    constructor(x, z, quest) {
        super(x, z, 0x0000ff); // Blue for quest givers
        this.quest = quest;
        this.exclamation = this.createExclamationMark();
        scene.remove(this.healthBar);
    }

    adjustToTerrain(terrain) {
        super.adjustToTerrain(terrain);
        this.exclamation.position.y = this.object.position.y + 1.0 + this.heightOffset;
    }

    update(deltaTime) {
        this.updateAnimations(deltaTime); // Update animations even though it doesn't move
        // Quest givers don't move or attack
    }

    interact() {
        if (player.object.position.distanceTo(this.object.position) < 2) {
            // Find an active quest this NPC can handle (e.g., talk-type quests)
            const relevantQuest = activeQuests.find(q => q.type === "talk" || q.type === "defeat" || q.type === "boss") || this.quest;
            
            if (!relevantQuest) {
                console.log("No relevant quest associated with this quest giver.");
                return;
            }
    
            const isActive = activeQuests.some(q => q.id === relevantQuest.id);
            const isCompleted = completedQuests.some(q => q.id === relevantQuest.id);
    
            if (!isActive && !isCompleted && canStartQuest(relevantQuest)) {
                addQuest(relevantQuest);
                console.log(`Quest accepted: ${relevantQuest.name}`);
                if (relevantQuest.type === "talk") {
                    completeQuest(activeQuests.find(q => q.id === relevantQuest.id));
                    scene.remove(this.exclamation);
                    console.log(`Talk quest completed: ${relevantQuest.name}`);
                }
            } else if (isActive) {
                const activeQuest = activeQuests.find(q => q.id === relevantQuest.id);
                if (relevantQuest.type === "talk") {
                    completeQuest(activeQuest);
                    scene.remove(this.exclamation);
                    console.log(`Talk quest completed: ${relevantQuest.name}`);
                } else if (relevantQuest.type === "defeat" || relevantQuest.type === "boss") {
                    console.log(`Quest in progress: ${relevantQuest.name} (${activeQuest.progress}/${activeQuest.required})`);
                }
            } else if (isCompleted) {
                console.log(`Quest already completed: ${relevantQuest.name}`);
                scene.remove(this.exclamation);
            } else {
                console.log("Cannot start quest: prerequisites or reputation not met.");
            }
        }
    }

    createExclamationMark() {
        const exclamation = new THREE.Mesh(
            new THREE.SphereGeometry(0.2),
            new THREE.MeshPhongMaterial({ color: 0xffff00 })
        );
        exclamation.position.set(this.object.position.x, this.object.position.y + 1.0 + this.heightOffset, this.object.position.z);
        scene.add(exclamation);
        return exclamation;
    }
}

const enemies = [];
const questGivers = [];
const maxEnemies = 5;

function spawnEnemy() {
    if (enemies.length < maxEnemies) {
        let x, z, terrainHeight, waterLevel;
        do {
            x = (Math.random() - 0.5) * 50; // Random x within a range
            z = (Math.random() - 0.5) * 50; // Random z within a range
            terrainHeight = terrain.getHeightAt(x, z);
            waterLevel = terrain.getWaterLevel(x, z);
        } while (terrainHeight < waterLevel); // Repeat until position is above water
        const enemy = new NPC(x, z);
        enemies.push(enemy);
    }
}

function spawnNPCs(mapData) {
    // Clear existing NPCs
    enemies.forEach(enemy => scene.remove(enemy.object));
    enemies.length = 0;
    questGivers.forEach(qg => {
        scene.remove(qg.object);
        scene.remove(qg.exclamation);
    });
    questGivers.length = 0;

    // Spawn enemies
    if (mapData.enemies) {
        mapData.enemies.forEach(enemyData => {
            let x = enemyData.position.x;
            let z = enemyData.position.z;
            let terrainHeight = terrain.getHeightAt(x, z);
            let waterLevel = terrain.getWaterLevel(x, z);
            if (terrainHeight < waterLevel) {
                // Find a nearby position above water
                for (let i = 1; i <= 10; i++) {
                    const newX = x + (Math.random() - 0.5) * i;
                    const newZ = z + (Math.random() - 0.5) * i;
                    terrainHeight = terrain.getHeightAt(newX, newZ);
                    waterLevel = terrain.getWaterLevel(newX, newZ);
                    if (terrainHeight >= waterLevel) {
                        x = newX;
                        z = newZ;
                        break;
                    }
                }
            }
            const enemy = new NPC(x, z);
            enemies.push(enemy);
        });
    }

    // Spawn quest givers
    if (mapData.questGivers) {
        mapData.questGivers.forEach(qgData => {
            let x = qgData.position.x;
            let z = qgData.position.z;
            let terrainHeight = terrain.getHeightAt(x, z);
            let waterLevel = terrain.getWaterLevel(x, z);
            if (terrainHeight < waterLevel) {
                // Find a nearby position above water
                for (let i = 1; i <= 10; i++) {
                    const newX = x + (Math.random() - 0.5) * i;
                    const newZ = z + (Math.random() - 0.5) * i;
                    terrainHeight = terrain.getHeightAt(newX, newZ);
                    waterLevel = terrain.getWaterLevel(newX, newZ);
                    if (terrainHeight >= waterLevel) {
                        x = newX;
                        z = newZ;
                        break;
                    }
                }
            }
            const quest = quests.find(q => q.id === qgData.questId);
            if (quest) {
                const questGiver = new QuestGiver(x, z, quest);
                questGivers.push(questGiver);
            }
        });
    }
}

setInterval(spawnEnemy, 10000); // Spawn every 10 seconds

function updateNPC(deltaTime) {
    enemies.forEach(enemy => {
        enemy.update(deltaTime);
        if (enemy.health <= 0) {
            scene.remove(enemy.object);
            scene.remove(enemy.healthBar);
            scene.remove(enemy.selectionDisc);
            enemies.splice(enemies.indexOf(enemy), 1);
            if (enemy.whoKill === 'player') player.gainXP(50);
            activeQuests.forEach(quest => {
                if ((quest.type === "defeat" || quest.type === "boss") && !quest.completed) {
                    quest.progress = (quest.progress || 0) + 1;
                    console.log(`${quest.name} progress: ${quest.progress}/${quest.required}`);
                    if (quest.progress >= quest.required) {
                        completeQuest(quest);
                        console.log(`Completed quest: ${quest.name}`);
                    }
                    updateQuestUI();
                }
            });
            console.log("Enemy defeated!");
        }
    });
    questGivers.forEach(qg => qg.update(deltaTime));
}

function damageNPC(amount, target) {
    target.health -= amount;
}

export { enemies, questGivers, updateNPC, damageNPC, spawnNPCs };