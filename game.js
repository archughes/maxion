// game.js
import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';
import { setupInput } from './input.js';
import { scene, camera, renderer } from './environment/scene.js';
import { player, updatePlayer } from './entity/player.js';
import { enemies, questGivers, updateNPC } from './entity/npc.js';
import { setupPopups, setupActionBar, updateInventoryUI, updateHealthUI, updateManaUI, updateQuestUI, updateXPUI } from './ui.js';
import { loadQuests } from './quests.js';
import { craftItem, loadItems, loadRecipes } from './items.js';
import { loadMap, terrain, timeSystem, doodads, skySystem } from './environment/environment.js';
import { SoundManager } from './environment/sound-manager.js';
import { Terrain } from './environment/terrain.js';

// Add Mana Bar to UI
const manaBar = document.createElement("div");
manaBar.className = "mana-bar";
manaBar.innerHTML = '<div class="mana-fill" style="width: 100px;"></div>';
document.querySelector(".ui").appendChild(manaBar);

// Input Handling
let clock = new THREE.Clock(), attack = false, fireball = false, invisibility = false, jumpVelocity = 0, isJumping = false, gravity = 0.01;
export const cameraState = {
    pitch: 0
};
export const soundManager = new SoundManager();

// Game Loop
async function init() {
    await loadQuests();
    await loadItems();
    await loadRecipes();
    await loadMap('summer');  // Start with spring biome
    // Initial UI Setup
    setupInput();
    setupPopups();
    setupActionBar();
    document.body.focus();
    updateInventoryUI();
    updateHealthUI();
    updateManaUI();
    updateQuestUI();
    animate();
    update();
}

const levelUpSound = new Audio('sounds/level_up.wav'); // Free "level up" sound from Freesound.org
levelUpSound.preload = 'auto';
window.levelUpSound = levelUpSound; // Make it globally accessible

const attackSound = new Audio();
attackSound.src = 'sounds/swordhit1.wav'; // Valid MP3 URL
attackSound.preload = 'auto';

function animate() {
    if (player.health <= 0) {
        gameOver();
        return;
    }
    requestAnimationFrame(animate);

    const deltaTime = clock.getDelta();
    timeSystem.update(deltaTime);
    skySystem.update(deltaTime, timeSystem, terrain.terrainFunc);
    
    player.updateCooldowns(deltaTime);
    updatePlayer();
    updateNPC(deltaTime);

    // Combat and Skills
    if (player.lastAction) {
        const action = player.lastAction;
        if (action.type === "attack") {
            enemies.forEach(enemy => {
                if (player.mesh.position.distanceTo(enemy.mesh.position) < 2) {
                    enemy.takeDamage(action.damage * (player.stats.strength / 10));
                    console.log(`Player attacked enemy for ${action.damage * (player.stats.strength / 10)} damage!`);
                    attackSound.play();
                }
            });
        } else if (action.type === "fireball") {
            enemies.forEach(enemy => {
                if (player.mesh.position.distanceTo(enemy.mesh.position) < 5) {
                    enemy.takeDamage(action.damage * (player.stats.intelligence / 10));
                    console.log(`Player cast Fireball for ${action.damage * (player.stats.intelligence / 10)} damage!`);
                }
            });
        } else if (action.type === "invisibility") {
            console.log("Player is invisible!");
            // Handle invisibility effects in npc.js if needed
        }
        player.lastAction = null; // Clear after processing
    }

    if (isJumping) {
        player.mesh.position.y += jumpVelocity;
        jumpVelocity -= gravity;
        if (terrain && player.mesh.position.y <= terrain.getHeightAt(player.mesh.position.x, player.mesh.position.z) + 0.5) {
            player.mesh.position.y = terrain.getHeightAt(player.mesh.position.x, player.mesh.position.z) + 0.5;
            isJumping = false;
        }
    }

    // Update Camera
    const distance = 5; // Distance from player
    const horizontalDistance = distance * Math.cos(cameraState.pitch);
    camera.position.x = player.mesh.position.x - horizontalDistance * Math.sin(player.mesh.rotation.y);
    camera.position.z = player.mesh.position.z - horizontalDistance * Math.cos(player.mesh.rotation.y);
    camera.position.y = player.mesh.position.y + 2 + distance * Math.sin(cameraState.pitch);

    const terrainHeight = terrain.getHeightAt(camera.position.x, camera.position.z);
    const minCameraHeight = terrainHeight; // Minimum height above terrain (adjust as needed)
    if (camera.position.y < minCameraHeight) {
        camera.position.y = minCameraHeight;
    }
    camera.lookAt(player.mesh.position);
    
    renderer.render(scene, camera);
}

const maxDoodadDistance = 150;
const maxQuestGiverDistance = 100;
const maxEnemyDistance = 120;

function update() {
    const cameraPosition = camera.position;

    // Doodads
    doodads.forEach(doodad => {
        if (doodad.mesh && doodad.mesh.position) {
            const distance = cameraPosition.distanceTo(doodad.mesh.position);
            doodad.visible = distance < maxDoodadDistance;
        } else {
            console.warn('Invalid doodad encountered:', doodad);
        }
    });

    // Quest Givers
    questGivers.forEach(qg => {
        const distance = cameraPosition.distanceTo(qg.mesh.position);
        qg.mesh.visible = distance < maxQuestGiverDistance;
    });

    // Enemies
    enemies.forEach(enemy => {
        const distance = cameraPosition.distanceTo(enemy.mesh.position);
        enemy.mesh.visible = distance < maxEnemyDistance;
    });
}

function gameOver() {
    const gameOverDiv = document.createElement("div");
    gameOverDiv.style.cssText = "position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.8);color:white;padding:20px;";
    gameOverDiv.innerHTML = "<h1>Game Over</h1><button id='respawn'>Respawn</button>";
    document.body.appendChild(gameOverDiv);
    document.getElementById("respawn").addEventListener("click", () => {
        player.health = 100;
        player.mana = 50;
        player.mesh.position.set(0, 0.5, 0);
        document.body.removeChild(gameOverDiv);
        animate();
    });
}

function toggleSettings() {
    const settingsDiv = document.querySelector(".settings");
    settingsDiv.style.display = settingsDiv.style.display === "none" ? "block" : "none";
}
let audioEnabled = true;
function toggleAudio() {
    audioEnabled = !audioEnabled;
    attackSound.muted = !audioEnabled;
    console.log(`Audio ${audioEnabled ? "enabled" : "disabled"}`);
}
function toggleFullscreen() { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); }

export function showMessage(text) {
    const messageDiv = document.createElement("div");
    messageDiv.style.cssText = "position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.8);color:white;padding:20px;opacity:1;transition:opacity 1s;";
    messageDiv.textContent = text;
    document.body.appendChild(messageDiv);
    setTimeout(() => {
        messageDiv.style.opacity = "0";
        setTimeout(() => document.body.removeChild(messageDiv), 1000);
    }, 3000);
}

// Initial UI Setup
init();

// Expose crafting and upgrading to global scope for UI buttons
window.craftItem = craftItem;
window.player = player; // For skill point spending
window.toggleSettings = toggleSettings;
window.toggleAudio = toggleAudio;
window.toggleFullscreen = toggleFullscreen;