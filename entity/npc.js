// npc.js
import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';
import { scene, camera } from '../environment/scene.js';
import { player } from './player.js';
import { settings } from '../settings.js';
import { quests, activeQuests, addQuest, completeQuest, completedQuests, canStartQuest, updateQuestProgress  } from '../quests.js';
import { Character } from './character.js'; // Assuming this exists
import { terrain } from '../environment/environment.js';
import { updateQuestUI } from '../ui.js';
import { selectAttackingEnemy } from '../input.js';

const damageMultiplier = { easy: 0.5, normal: 1, hard: 2 }[settings.difficulty];

class NPC extends Character {
    constructor(x, z, color = 0xff0000) {
        const material = new THREE.MeshPhongMaterial({ color });
        super(material, 50 * damageMultiplier, 0.05, false);
        this.object.position.set(x || 5, this.heightOffset, z || 5);
        this.damage = 20 * damageMultiplier;
        scene.add(this.object);
        this.object.userData.entity = this;

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

    update(deltaTime) {
        super.update(deltaTime);
        if (this.health <= 0) return;
        const slopeInfo = terrain.getSlopeAt(player.object.position.x, player.object.position.z);
        const steepThreshold = 1.5;
        const slopeMultiplier = 1 / (1 + slopeInfo.magnitude);
        const effectiveSpeed = this.speed * this.baseSpeedMultiplier * slopeMultiplier;

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
            this.updateHealthBar();
        } else {
            this.isSliding = false;
            this.slideVelocity.set(0, 0, 0);
        }
        
        const distanceToPlayer = this.object.position.distanceTo(player.object.position);
        if (distanceToPlayer < 5) {
            const direction = Math.atan2(
                player.object.position.z - this.object.position.z,
                player.object.position.x - this.object.position.x
            );
            this.object.position.x += Math.cos(direction) * effectiveSpeed;
            this.object.position.z += Math.sin(direction) * effectiveSpeed;
            this.object.position.y = terrain.getHeightAt(this.object.position.x, this.object.position.z) + 0 + this.heightOffset;
            this.updateHealthBar();
            if (distanceToPlayer < 1 && this.attackCooldown <= 0) {
                player.takeDamage(this.damage, undefined, 'npc');
                this.attackCooldown = this.attackInterval;
                selectAttackingEnemy(this);
            }
        } else {
            const direction = Math.random() * 2 * Math.PI;
            this.object.position.x += Math.cos(direction) * effectiveSpeed;
            this.object.position.z += Math.sin(direction) * effectiveSpeed;
            this.object.position.y = terrain.getHeightAt(this.object.position.x, this.object.position.z) + 0 + this.heightOffset;
            this.updateHealthBar();
        }

        // Drowning logic
        const headY = this.object.position.y + this.heightOffset;
        const waterHeight = terrain.waterLevel;
        if (headY < waterHeight) {
            this.drowningTimer += deltaTime;
            if (this.drowningTimer >= this.drowningTime) {
                this.drowningDamageTimer += deltaTime;
                if (this.drowningDamageTimer >= this.drowningDamageInterval) {
                    this.drowningDamageTimer = 0;
                    this.takeDamage(this.maxHealth * 0.1, undefined, 'drown'); // 10% HP loss
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

    update() {
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
        const x = (Math.random() - 0.5) * 50;
        const z = (Math.random() - 0.5) * 50;
        const enemy = new NPC(x, z);
        enemies.push(enemy);
    }
}

function spawnNPCs(mapData) {
    enemies.forEach(enemy => scene.remove(enemy.object));
    enemies.length = 0;
    questGivers.forEach(qg => {
        scene.remove(qg.object);
        scene.remove(qg.exclamation);
    });
    questGivers.length = 0;

    if (mapData.enemies) {
        mapData.enemies.forEach(enemyData => {
            const enemy = new NPC(enemyData.position.x, enemyData.position.z);
            enemies.push(enemy);
        });
    }

    if (mapData.questGivers) {
        mapData.questGivers.forEach(qgData => {
            const quest = quests.find(q => q.id === qgData.questId);
            if (quest) {
                const questGiver = new QuestGiver(qgData.position.x, qgData.position.z, quest);
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
    questGivers.forEach(qg => qg.update());
}

function damageNPC(amount, target) {
    target.health -= amount;
}

export { enemies, questGivers, updateNPC, damageNPC, spawnNPCs };