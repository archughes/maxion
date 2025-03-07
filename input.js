// input.js
import { player } from './entity/player.js';
import { interactWithEnvironment } from './environment/environment.js';
import { activeQuests, completeQuest } from './quests.js';
import { camera } from './environment/scene.js';
import { useItem } from './items.js';
import { cameraState } from './game.js';

let isRightClicking = false, isLeftClicking = false;

function setupInput() {
    document.addEventListener("keydown", event => {
        console.log(`Key pressed: ${event.code}`);
        switch (event.code) {
            case "KeyW": player.moveForward = true; break;
            case "KeyS": player.moveBackward = true; break;
            case "KeyA": player.moveLeft = true; break;
            case "KeyD": player.moveRight = true; break;
            case "KeyQ": player.rotateLeft = true; break;
            case "KeyE": player.rotateRight = true; break;
            case "Space":
                if (!player.isJumping && !player.isInWater) {
                    player.jumpVelocity = 6;
                    player.isJumping = true;
                    player.firstJump = true;
                }
                if (player.isInWater) {
                    player.moveUp = true;
                }
                break;
            case "ShiftLeft":
                player.isRunning = true;
                player.runTimer = 3;
                break;
            case "Digit1": useAction(0); break;
            case "Digit2": useAction(1); break;
            case "Digit3": useAction(2); break;
            case "Digit4": useAction(3); break;
            case "Digit5": useAction(4); break;
            case "Digit6": useAction(5); break;
            case "KeyX": interactWithEnvironment(); checkQuests(); break;
            case "KeyM": console.log("Map key pressed"); break; // Map
            case "KeyI": console.log("Inventory key pressed"); break; // Inventory
            case "KeyP": console.log("Character panel key pressed"); break; // Character
            case "KeyU": console.log("Quests key pressed"); break; // Quests
            case "Escape": console.log("Escape key pressed"); break; // Menu/Pause
        }
    });

    document.addEventListener("keyup", event => {
        switch (event.code) {
            case "KeyW": player.moveForward = false; break;
            case "KeyS": player.moveBackward = false; break;
            case "KeyA": player.moveLeft = false; break;
            case "KeyD": player.moveRight = false; break;
            case "KeyQ": player.rotateLeft = false; break;
            case "KeyE": player.rotateRight = false; break;
            case "Space":
                if (player.isInWater) {
                    player.moveUp = false;
                }
                break;
            case "ShiftLeft":
                player.isRunning = false;
                break;
        }
    });

    document.addEventListener("mousedown", event => {
        if (event.target.closest(".inventory-container, .popup, .action-bar")) return;
        if (event.button === 2) {
            isRightClicking = true;
            document.querySelector("canvas").requestPointerLock();
        } else if (event.button === 0) {
            isLeftClicking = true;
        }
        if (isLeftClicking && isRightClicking) player.moveForward = true;
    });

    document.addEventListener("mouseup", event => {
        if (event.button === 2) {
            isRightClicking = false;
            document.exitPointerLock();
            if (player.useComplexModel) {
                player.object.rotation.y += player.head.rotation.y; // Body follows head yaw
                player.head.rotation.y = 0;
                player.head.rotation.x = 0;
            }
        } else if (event.button === 0) {
            isLeftClicking = false;
            if (!isRightClicking) interactWithEnvironment();
        }
        player.moveForward = false;
    });

    document.addEventListener("mousemove", event => {
        if (isRightClicking && document.pointerLockElement === document.querySelector("canvas")) {
            if (player.useComplexModel) {
                player.head.rotation.y -= event.movementX * 0.004; // Yaw
                player.head.rotation.x -= event.movementY * 0.004; // Pitch
                player.head.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, player.head.rotation.x));
            } else {
                player.object.rotation.y -= event.movementX * 0.004;
            }
    
            // Apply padding effect to pitch
            const maxPitch = Math.PI / 2; // Maximum pitch (straight up)
            const minPitch = -Math.PI / 2; // Minimum pitch (straight down)
            const pitchRange = maxPitch - minPitch;
            const pitchThreshold = 0.9; // Start reducing sensitivity at 90% of max pitch
            
            let pitchDelta = event.movementY * 0.002; // Base pitch change
            const currentPitchFraction = Math.abs(cameraState.pitch) / maxPitch;
    
            // Reduce sensitivity when close to maxPitch
            if (currentPitchFraction > pitchThreshold) {
                const sensitivityFactor = 1 - (currentPitchFraction - pitchThreshold) / (1 - pitchThreshold);
                pitchDelta *= sensitivityFactor; // Scale down the pitch change
            }
    
            cameraState.pitch += pitchDelta;
            cameraState.pitch = Math.max(minPitch, Math.min(maxPitch, cameraState.pitch)); // Clamp pitch
        }
    });

    document.addEventListener("wheel", event => {
        camera.position.z += event.deltaY * 0.01;
        camera.position.z = Math.max(5, Math.min(20, camera.position.z));
    });
}

function useAction(slot) {
    console.log(`Using action slot ${slot}`);
    const action = player.actionBar[slot];
    if (action) {
        if (action.type === "skill") {
            const result = player.useSkill(action.name);
            if (result) {
                player.lastAction = result;
                console.log(`Skill used: ${action.name}`, result);
            } else {
                console.log(`Skill ${action.name} failed (cooldown/mana)`);
            }
        } else if (action.type === "consumable") {
            useItem(action);
            console.log(`Consumable used: ${action.name}`);
            if (action.amount !== undefined) {
                action.amount -= 1; // Decrement stack
                if (action.amount <= 0) {
                    player.removeItem(action, 0); // Remove fully if stack is 0
                    player.actionBar[slot] = null; // Clear slot
                }
            } else {
                player.removeItem(action); // Single item, remove it
                player.actionBar[slot] = null; // Clear slot
            }
        }
    }
}

function checkQuests() {
    activeQuests.forEach(quest => {
        if (quest.type === "defeat" && quest.progress >= quest.required) completeQuest(quest);
    });
}

export { setupInput, useAction };