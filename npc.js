// npc.js
import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';
import { scene } from './scene.js';
import { player } from './player.js';
import { settings } from './settings.js';
import { quests, activeQuests, addQuest, completeQuest, completedQuests, canStartQuest, updateQuestProgress  } from './quests.js';
import { Character } from './character.js'; // Assuming this exists
import { terrain } from './environment.js';
import { updateQuestUI } from './ui.js'

const npcGeometry = new THREE.BoxGeometry(1, 1, 1);
const damageMultiplier = { easy: 0.5, normal: 1, hard: 2 }[settings.difficulty];

class NPC extends Character {
    constructor(x, z, color = 0xff0000) {
        const material = new THREE.MeshPhongMaterial({ color });
        super(new THREE.Mesh(npcGeometry, material), 50 * damageMultiplier, 0.05);
        this.mesh.position.set(x || 5, 0.5, z || 5);
        this.damage = 20 * damageMultiplier;
        scene.add(this.mesh);

        this.healthBar = new THREE.Mesh(
            new THREE.PlaneGeometry(1, 0.1),
            new THREE.MeshBasicMaterial({ color: 0xff0000 })
        );
        this.healthBar.position.set(this.mesh.position.x, this.mesh.position.y + 1.5, this.mesh.position.z);
        scene.add(this.healthBar);
    }

    updateHealthBar() {
        const healthPercent = this.health / (50 * damageMultiplier);
        this.healthBar.scale.x = healthPercent;
    }

    adjustToTerrain(terrain) {
        super.adjustToTerrain(terrain); 
        this.healthBar.position.set(this.mesh.position.x, this.mesh.position.y + 1.5, this.mesh.position.z);
    }

    update(deltaTime) {
        super.update(deltaTime);
        if (this.health <= 0) return;
        const distanceToPlayer = this.mesh.position.distanceTo(player.mesh.position);
        if (distanceToPlayer < 5) {
            const direction = Math.atan2(
                player.mesh.position.z - this.mesh.position.z,
                player.mesh.position.x - this.mesh.position.x
            );
            this.mesh.position.x += Math.cos(direction) * this.speed;
            this.mesh.position.z += Math.sin(direction) * this.speed;
            this.mesh.position.y = terrain.getHeightAt(this.mesh.position.x, this.mesh.position.z) + 0.5;
            this.healthBar.position.set(this.mesh.position.x, this.mesh.position.y + 1.5, this.mesh.position.z);
            if (distanceToPlayer < 1 && this.attackCooldown <= 0) {
                player.takeDamage(this.damage);
                this.attackCooldown = this.attackInterval;
            }
        } else {
            const direction = Math.random() * 2 * Math.PI;
            this.mesh.position.x += Math.cos(direction) * this.speed;
            this.mesh.position.z += Math.sin(direction) * this.speed;
            this.mesh.position.y = terrain.getHeightAt(this.mesh.position.x, this.mesh.position.z) + 0.5;
            this.healthBar.position.set(this.mesh.position.x, this.mesh.position.y + 1.5, this.mesh.position.z);
        }
    }
}

class QuestGiver extends NPC {
    constructor(x, z, quest) {
        super(x, z, 0x0000ff); // Blue for quest givers
        this.quest = quest;
        this.exclamation = this.createExclamationMark();
    }

    adjustToTerrain(terrain) {
        super.adjustToTerrain(terrain);
        this.exclamation.position.y = this.mesh.position.y + 1.5;
    }

    update() {
        // Quest givers don't move or attack
    }

    interact() {
        if (player.mesh.position.distanceTo(this.mesh.position) < 2) {
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
        exclamation.position.set(this.mesh.position.x, this.mesh.position.y + 1.5, this.mesh.position.z);
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
    enemies.forEach(enemy => scene.remove(enemy.mesh));
    enemies.length = 0;
    questGivers.forEach(qg => {
        scene.remove(qg.mesh);
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
            scene.remove(enemy.mesh);
            enemies.splice(enemies.indexOf(enemy), 1);
            player.gainXP(50);
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