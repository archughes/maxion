import * as THREE from './lib/three.module.js';
import { setupInput, cameraDistance, isRightClicking } from './input.js';
import { scene, camera, renderer } from './environment/scene.js';
import { player, updatePlayer, updateKnownMap } from './entity/player.js';
import { enemies, questGivers, updateNPC } from './entity/npc.js';
import { UIManager } from './ui/ui.js'; // Updated to use UIManager
import { loadQuests, completedQuests } from './quests.js';
import { craftItem, loadItems, loadRecipes } from './items.js';
import { loadMap, terrain, doodads, skySystem, waterSystem } from './environment/environment.js';
import { SoundManager } from './environment/sound-manager.js';
import { timeSystem } from './environment/TimeSystem.js';
import { initializeTerrainCache, setupMinimap } from './environment/map.js';
import { Movement } from './entity/movement.js';
import { settings } from './ui/settings.js';
import { loadSpells } from './spells.js';

// Input Handling
let clock = new THREE.Clock();
export const cameraState = { pitch: 0 };
export const soundManager = new SoundManager();

let movement = null;

// Game Loop
async function init() {
    await loadSpells();
    await loadQuests();
    await loadItems();
    await loadRecipes();
    await loadMap('summer');

    // Initial Setup
    setupInput();
    UIManager.initialize(); // Replaces individual UI setups
    document.body.focus();
    initializeTerrainCache();
    setupMinimap();
    movement = new Movement(player, terrain, camera);
    animate();
    update();
}

const levelUpSound = new Audio('sounds/level_up.wav');
levelUpSound.preload = 'auto';
window.levelUpSound = levelUpSound;

const attackSound = new Audio('sounds/swordhit1.wav');
attackSound.preload = 'auto';

function animate() {
    if (player.health <= 0) {
        gameOver();
        return;
    }
    requestAnimationFrame(animate);

    const deltaTime = clock.getDelta();
    timeSystem.update(deltaTime);
    waterSystem.update(deltaTime);
    skySystem.update(deltaTime, terrain.terrainFunc);
    player.updateCooldowns(deltaTime);
    updateKnownMap();
    updatePlayer(deltaTime, movement);
    updateNPC(deltaTime);
    handleCollisions();

    const fps = Math.round(1 / deltaTime);
    if (settings.showFPS) {
        const fpsDisplay = document.getElementById('fps-display');
        if (fpsDisplay) {
            fpsDisplay.querySelector('.time-display').textContent = `FPS: ${fps}`;
        }
        console.log(`FPS: ${fps}`);
    }

    // Update Camera
    const headDirection = new THREE.Vector3();
    player.head.getWorldDirection(headDirection);
    const bodyDirection = new THREE.Vector3();
    player.object.getWorldDirection(bodyDirection);

    const horizontalDistance = cameraDistance * Math.cos(cameraState.pitch);

    if (isRightClicking) {
        camera.position.x = player.object.position.x - horizontalDistance * bodyDirection.x;
        camera.position.z = player.object.position.z - horizontalDistance * bodyDirection.z;
    } else {
        camera.position.x = player.object.position.x - horizontalDistance * headDirection.x;
        camera.position.z = player.object.position.z - horizontalDistance * headDirection.z;
    }
    camera.position.y = player.object.position.y + 2 + cameraDistance * Math.sin(cameraState.pitch);

    // Clamp camera
    const waterHeight = terrain.getWaterLevel(camera.position.x, camera.position.z);
    const headY = player.object.position.y + player.heightOffset;
    const terrainHeight = terrain.getHeightAt(camera.position.x, camera.position.z);
    if (headY > waterHeight) {
        const minCameraHeight = Math.max(terrainHeight, waterHeight);
        if (camera.position.y < minCameraHeight) camera.position.y = minCameraHeight + 0.1;
    } else {
        if (camera.position.y < terrainHeight) camera.position.y = terrainHeight;
        if (camera.position.y > waterHeight) camera.position.y = waterHeight;
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

    doodads.forEach(doodad => {
        if (doodad.object && doodad.object.position) {
            const distance = cameraPosition.distanceTo(doodad.object.position);
            doodad.visible = distance < maxDoodadDistance;
            if (doodad.update) doodad.update(deltaTime, completedQuests);
        } else {
            console.warn('Invalid doodad encountered:', doodad);
        }
    });

    questGivers.forEach(qg => {
        qg.object.visible = cameraPosition.distanceTo(qg.object.position) < maxQuestGiverDistance;
    });

    enemies.forEach(enemy => {
        enemy.object.visible = cameraPosition.distanceTo(enemy.object.position) < maxEnemyDistance;
    });
}

function handleCollisions() {
    const playerPos = player.object.position.clone();
    const playerRadius = player.collisionRadius || 0.5;

    doodads.forEach(doodad => {
        if (doodad.isHarvested || !doodad.object.visible) return;

        const doodadPos = doodad.object.position.clone();
        const doodadRadius = doodad.collisionRadius * doodad.object.scale.x;
        const distance = playerPos.distanceTo(doodadPos);
        const minDistance = playerRadius + doodadRadius;

        if (distance < minDistance) {
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
        position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: url('./textures/parchment-texture.png') center/cover no-repeat;
        color: white; padding: 20px; text-align: center; width: 30%; height: 30%;
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
    const settingsPopup = document.getElementById("settings-popup");
    settingsPopup.style.display = settingsPopup.style.display === "block" ? "none" : "block";
}

let audioEnabled = true;
function toggleAudio() {
    audioEnabled = !audioEnabled;
    attackSound.muted = !audioEnabled;
    console.log(`Audio ${audioEnabled ? "enabled" : "disabled"}`);
}

function toggleFullscreen() {
    document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
}

init();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    waterSystem.onResize();
});

window.craftItem = craftItem;
window.player = player;
window.toggleSettings = toggleSettings;
window.toggleAudio = toggleAudio;
window.toggleFullscreen = toggleFullscreen;