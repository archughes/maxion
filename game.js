// game.js
import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';
import { setupInput, cameraDistance, isRightClicking } from './input.js';
import { scene, camera, renderer } from './environment/scene.js';
import { player, updatePlayer, updateKnownMap } from './entity/player.js';
import { enemies, questGivers, updateNPC } from './entity/npc.js';
import { setupPopups, setupActionBar, updateInventoryUI, updateHealthUI, updateManaUI, updateQuestUI } from './ui.js';
import { loadQuests } from './quests.js';
import { craftItem, loadItems, loadRecipes } from './items.js';
import { loadMap, terrain, doodads, skySystem } from './environment/environment.js';
import { SoundManager } from './environment/sound-manager.js';
import { timeSystem } from './environment/TimeSystem.js';
import { initializeTerrainCache, setupMinimap } from './environment/map.js';
import { Movement } from './entity/movement.js';

// Add Mana Bar to UI
const manaBar = document.createElement("div");
manaBar.className = "mana-bar";
manaBar.innerHTML = '<div class="mana-fill" style="width: 100px;"></div>';
document.querySelector(".ui").appendChild(manaBar);

// Input Handling
let clock = new THREE.Clock();
export const cameraState = {
    pitch: 0
};
export const soundManager = new SoundManager();

let movement = null;

// Game Loop
async function init() {
    await loadQuests();
    await loadItems();
    await loadRecipes();
    await loadMap('summer'); 
    // Initial UI Setup
    setupInput();
    setupPopups();
    setupActionBar();
    document.body.focus();
    updateInventoryUI();
    updateHealthUI();
    updateManaUI();
    updateQuestUI();
    initializeTerrainCache();
    setupMinimap();
    movement = new Movement(player, terrain, camera);
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
    skySystem.update(deltaTime, terrain.terrainFunc);
    
    player.updateCooldowns(deltaTime);
    updateKnownMap();
    updatePlayer(deltaTime, movement);
    updateNPC(deltaTime);
    handleCollisions();

    // Update Camera
    const headDirection = new THREE.Vector3();
    player.head.getWorldDirection(headDirection);
    const bodyDirection = new THREE.Vector3();
    player.object.getWorldDirection(bodyDirection);

    const horizontalDistance = cameraDistance * Math.cos(cameraState.pitch);

    if (isRightClicking) {
        camera.position.x = player.object.position.x - horizontalDistance * bodyDirection.x;
        camera.position.z = player.object.position.z - horizontalDistance * bodyDirection.z;
        camera.position.y = player.object.position.y + 2 + cameraDistance * Math.sin(cameraState.pitch);
    } else {
        camera.position.x = player.object.position.x - horizontalDistance * headDirection.x;
        camera.position.z = player.object.position.z - horizontalDistance * headDirection.z;
        camera.position.y = player.object.position.y + 2 + cameraDistance * Math.sin(cameraState.pitch);
    }
    // Clamp camera based on player's head position
    const waterHeight = terrain.getWaterLevel(camera.position.x, camera.position.z);
    const headY = player.object.position.y + player.heightOffset;
    const terrainHeight = terrain.getHeightAt(camera.position.x, camera.position.z);
    if (headY > waterHeight) {
        // Head above water: camera above water and terrain
        const minCameraHeight = Math.max(terrainHeight, waterHeight);
        if (camera.position.y < minCameraHeight) {
            camera.position.y = minCameraHeight + 0.1;
        }
    } else {
        // Head below water: camera between terrain and water
        if (camera.position.y < terrainHeight) {
            camera.position.y = terrainHeight;
        }
        if (camera.position.y > waterHeight) {
            camera.position.y = waterHeight;
        }
    }

    // Underwater visual effects
    const defaultFogNear = 150, defaultFogFar = 250;
    if (!scene.fog) {
        scene.fog = new THREE.Fog(0xcccccc, defaultFogNear, defaultFogFar); // Reinitialize if null
    }
    if (camera.position.y > waterHeight && headY > waterHeight) {
        scene.fog.near = defaultFogNear; // Default fog
        scene.fog.far = defaultFogFar;
        scene.fog.color.set(0xcccccc);
    } else { // water fog
        scene.fog.near = 10; // Dense fog
        scene.fog.far = 50;
        scene.fog.color.set(0x0077be); // Bluish tint
    }

    camera.lookAt(player.object.position);
    
    renderer.render(scene, camera);
}

const maxDoodadDistance = 150;
const maxQuestGiverDistance = 100;
const maxEnemyDistance = 120;

function update() {
    const deltaTime = clock.getDelta();

    const cameraPosition = camera.position;

    // Doodads
    doodads.forEach(doodad => {
        if (doodad.object && doodad.object.position) {
            const distance = cameraPosition.distanceTo(doodad.object.position);
            doodad.visible = distance < maxDoodadDistance;
            if (doodad.update) {
                doodad.update(deltaTime);
            }
        } else {
            console.warn('Invalid doodad encountered:', doodad);
        }
    });

    // Quest Givers
    questGivers.forEach(qg => {
        const distance = cameraPosition.distanceTo(qg.object.position);
        qg.object.visible = distance < maxQuestGiverDistance;
    });

    // Enemies
    enemies.forEach(enemy => {
        const distance = cameraPosition.distanceTo(enemy.object.position);
        enemy.object.visible = distance < maxEnemyDistance;
    });
}

function handleCollisions() {
    const playerPos = player.object.position.clone();
    const playerRadius = player.collisionRadius || 0.5;

    doodads.forEach(doodad => {
        if (doodad.isHarvested || !doodad.object.visible) return; // Skip harvested or invisible doodads

        const doodadPos = doodad.object.position.clone();
        const doodadRadius = doodad.collisionRadius * doodad.object.scale.x; // Scale-adjusted radius
        const distance = playerPos.distanceTo(doodadPos);
        const minDistance = playerRadius + doodadRadius;

        if (distance < minDistance) {
            // Collision detected, push player back
            const direction = playerPos.sub(doodadPos).normalize();
            const overlap = minDistance - distance;
            player.object.position.add(direction.multiplyScalar(overlap));
            doodad.onCollision();
        }
    });
}

function gameOver() {
    const gameOverDiv = document.createElement("div");
    gameOverDiv.className = 'popup';
    gameOverDiv.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: url('parchment-texture.png');
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        color: white;
        padding: 20px;
        text-align: center;
        width: 30%;
        height: 30%;
    `;

    gameOverDiv.innerHTML = `
        <h1>Game Over</h1>
        <button id="respawn" style="cursor: pointer; pointer-events: auto; padding: 10px 20px; background: brown; color: white; border: none; font-size: 16px;">
            Respawn
        </button>
    `;

    document.body.appendChild(gameOverDiv);

    document.getElementById("respawn").addEventListener("click", () => {
        player.health = 100;
        player.mana = 50;
        player.object.position.set(0, player.heightOffset, 0);
        document.body.removeChild(gameOverDiv);
        requestAnimationFrame(animate);
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

let drowningMessage = null;

export function showDrowningMessage(text, isRed = false) {
    if (!drowningMessage) {
        drowningMessage = document.createElement("div");
        drowningMessage.style.cssText = "position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.8);color:white;padding:20px;";
        document.body.appendChild(drowningMessage);
    }
    drowningMessage.textContent = text;
    drowningMessage.style.color = isRed ? "red" : "white";
}

export function removeDrowningMessage() {
    if (drowningMessage) {
        document.body.removeChild(drowningMessage);
        drowningMessage = null;
    }
}

// Initial UI Setup
init();

// Expose crafting and upgrading to global scope for UI buttons
window.craftItem = craftItem;
window.player = player; // For skill point spending
window.toggleSettings = toggleSettings;
window.toggleAudio = toggleAudio;
window.toggleFullscreen = toggleFullscreen;