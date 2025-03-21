import * as THREE from './lib/three.module.js';
import { player } from './entity/player.js';
import { enemies } from './entity/npc.js';
import { interactWithEnvironment, terrain } from './environment/environment.js';
import { activeQuests, completeQuest } from './quests.js';
import { camera } from './environment/scene.js';
import { useItem } from './items.js';
import { cameraState } from './game.js';
import { updateInventoryUI, updateCharacterUI, updateQuestUI, updateStatsUI, closeAllPopups } from './ui.js';
import { updateMinimap } from './environment/map.js';

let isRightClicking = false, isLeftClicking = false, cameraDistance = 5, nearbyEnemies = [], currentEnemyIndex = -1, previousTarget = null;

function setupInput() {
    const gameCanvas = document.querySelector("canvas");

    document.addEventListener("keydown", event => {
        // console.log(`Key pressed: ${event.code}`);
        switch (event.code) {
            case "KeyW": player.moveForward = true; break;
            case "KeyS": player.moveBackward = true; break;
            case "KeyA": player.moveLeft = true; break;
            case "KeyD": player.moveRight = true; break;
            case "KeyQ": player.rotateLeft = true; break;
            case "KeyE": player.rotateRight = true; break;
            case "Space":
                const terrainHeight = terrain.getHeightAt(player.object.position.x, player.object.position.z); // Allows jumping if very close to ground and falling
                console.log((player.object.position.y - terrainHeight - player.heightOffset));
                if ((!player.isJumping || ((player.object.position.y - terrainHeight - player.heightOffset) < 0.1 && player.jumpVelocity < 0 && player.jumpVelocity > -0.5)) 
                    && !player.isInWater 
                    && (player.object.position.y - terrainHeight - player.heightOffset) < 0.5) {
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
            case "KeyM":
            console.log("Map key pressed");
            const minimap = document.querySelector('.minimap');
            minimap.classList.toggle('expanded'); // Toggle minimap expansion
            const canvas = document.querySelector('.map-frame canvas');
                if (canvas) {
                    canvas.width = minimap.classList.contains('expanded') ? 500 : 150;
                    canvas.height = minimap.classList.contains('expanded') ? 500 : 150;
                }
                updateMinimap(); // Refresh minimap
                break;
            case "KeyI":
                console.log("Inventory key pressed");
                const inventoryPopup = document.getElementById("inventory-popup");
                closeAllPopups(inventoryPopup); // Close others
                inventoryPopup.style.display = inventoryPopup.style.display === "block" ? "none" : "block";
                if (inventoryPopup.style.display === "block") updateInventoryUI();
                break;
            case "KeyP":
                console.log("Character panel key pressed");
                const characterPopup = document.getElementById("character-popup");
                closeAllPopups(characterPopup);
                characterPopup.style.display = characterPopup.style.display === "block" ? "none" : "block";
                if (characterPopup.style.display === "block") updateCharacterUI();
                break;
            case "KeyU":
                console.log("Quests key pressed");
                const questsPopup = document.getElementById("quests-popup");
                closeAllPopups(questsPopup);
                questsPopup.style.display = questsPopup.style.display === "block" ? "none" : "block";
                if (questsPopup.style.display === "block") updateQuestUI();
                break;
            case "KeyK":
                console.log("Stats key pressed");
                const statsPopup = document.getElementById("stats-popup");
                closeAllPopups(statsPopup);
                statsPopup.style.display = statsPopup.style.display === "block" ? "none" : "block";
                if (statsPopup.style.display === "block") updateStatsUI();
                break;
            case "Tab":
                event.preventDefault(); // Prevent default browser behavior (e.g., focus switch)
                selectNextEnemy();
                break;
            case "Escape":
                console.log("Escape key pressed");
                closeAllPopups();
                if (previousTarget && previousTarget.selectionDisc) {
                    previousTarget.selectionDisc.visible = false;
                }
                player.selectedTarget = null;
                previousTarget = null;
                nearbyEnemies = [];
                currentEnemyIndex = -1;
                console.log("Target unselected");
                break;
            default:
                break;
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

    let rightClickStartTime = 0;
    let mouseMovementSum = 0;
    let dualMouseForwardFlag = false;
    document.addEventListener("mousedown", event => {
        if (event.target.closest(".inventory-container, .popup, .action-bar, .minimap, .character-btn")) return;
        if (event.button === 2) {
            isRightClicking = true;
            rightClickStartTime = Date.now();
            mouseMovementSum = 0;
            document.querySelector("canvas").requestPointerLock();
            if (player.useComplexModel) {
                player.head.rotation.y = 0; // Reset head yaw to align with body
                player.head.rotation.x = 0; // Reset head pitch to neutral
            }
        } else if (event.button === 0) {
            isLeftClicking = true;
            document.querySelector("canvas").requestPointerLock();
        }
        if (isLeftClicking && isRightClicking) {
            player.moveForward = true;
            dualMouseForwardFlag = true;
        }
    });
    
    document.addEventListener("mouseup", event => {
        if (event.button === 2) {
            isRightClicking = false;
            document.exitPointerLock();
            const clickDuration = (Date.now() - rightClickStartTime) / 1000;
            if (clickDuration < 0.2 && mouseMovementSum < 10) {
                const mouse = new THREE.Vector2();
                mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
                mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
                const raycaster = new THREE.Raycaster();
                raycaster.setFromCamera(mouse, camera);
                const intersects = raycaster.intersectObjects(enemies.map(e => e.object), true);
                if (intersects.length > 0) {
                    const hitObject = intersects[0].object;
                    if (hitObject.userData.entity) {
                        if (previousTarget && previousTarget.selectionDisc) {
                            previousTarget.selectionDisc.visible = false;
                        }
                        // Select new target
                        player.selectedTarget = hitObject.userData.entity;
                        if (player.selectedTarget.selectionDisc) {
                            player.selectedTarget.selectionDisc.visible = true;
                        }
                        previousTarget = player.selectedTarget;
                        console.log("Selected target with button 2:", player.selectedTarget);
                        if (player.object.position.distanceTo(player.selectedTarget.object.position) < 5) {
                            useAction(0);
                        }
                    }
                }
            }
        } else if (event.button === 0) {
            isLeftClicking = false;
            if (!isRightClicking) {
                document.exitPointerLock();
                const mouse = new THREE.Vector2();
                mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
                mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
                const raycaster = new THREE.Raycaster();
                raycaster.setFromCamera(mouse, camera);
                const intersects = raycaster.intersectObjects(enemies.map(e => e.object), true);
                if (intersects.length > 0) {
                    const hitObject = intersects[0].object;
                    if (hitObject.userData.entity) {
                        if (previousTarget && previousTarget.selectionDisc) {
                            previousTarget.selectionDisc.visible = false;
                        }
                        // Select new target
                        player.selectedTarget = hitObject.userData.entity;
                        if (player.selectedTarget.selectionDisc) {
                            player.selectedTarget.selectionDisc.visible = true;
                        }
                        previousTarget = player.selectedTarget;
                        console.log("Selected target with button 1:", player.selectedTarget);
                    }
                } else {
                    if (previousTarget && previousTarget.selectionDisc) {
                        previousTarget.selectionDisc.visible = false;
                    }
                    player.selectedTarget = null;
                    interactWithEnvironment();
                }
            }
        }
        if (!isLeftClicking && !isRightClicking && dualMouseForwardFlag) {
            player.moveForward = false;
            dualMouseForwardFlag = false;
        }
    });

    document.addEventListener("mousemove", event => {
        if (isRightClicking && document.pointerLockElement === document.querySelector("canvas")) {
            mouseMovementSum += Math.abs(event.movementX) + Math.abs(event.movementY);
            if (player.useComplexModel) {
                player.object.rotation.y -= event.movementX * 0.004;
                player.head.rotation.x -= event.movementY * 0.004;
                player.head.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, player.head.rotation.x));
            } else {
                player.object.rotation.y -= event.movementX * 0.004;
            }
            // Camera pitch for button 2
            const maxPitch = Math.PI / 2;
            const minPitch = -Math.PI / 2;
            const pitchThreshold = 0.9;
            let pitchDelta = event.movementY * 0.002;
            const currentPitchFraction = Math.abs(cameraState.pitch) / maxPitch;
            if (currentPitchFraction > pitchThreshold) {
                const sensitivityFactor = 1 - (currentPitchFraction - pitchThreshold) / (1 - pitchThreshold);
                pitchDelta *= sensitivityFactor;
            }
            cameraState.pitch += pitchDelta;
            cameraState.pitch = Math.max(minPitch, Math.min(maxPitch, cameraState.pitch));
        } else if (isLeftClicking && document.pointerLockElement === document.querySelector("canvas")) {
            if (player.useComplexModel) {
                player.head.rotation.y -= event.movementX * 0.004; // Button 1: Head yaw
                player.head.rotation.x -= event.movementY * 0.004; // Head pitch
                player.head.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, player.head.rotation.x));
            }
            // Camera pitch for button 1
            const maxPitch = Math.PI / 2;
            const minPitch = -Math.PI / 2;
            const pitchThreshold = 0.9;
            let pitchDelta = event.movementY * 0.002;
            const currentPitchFraction = Math.abs(cameraState.pitch) / maxPitch;
            if (currentPitchFraction > pitchThreshold) {
                const sensitivityFactor = 1 - (currentPitchFraction - pitchThreshold) / (1 - pitchThreshold);
                pitchDelta *= sensitivityFactor;
            }
            cameraState.pitch += pitchDelta;
            cameraState.pitch = Math.max(minPitch, Math.min(maxPitch, cameraState.pitch));
        }
    });

    document.addEventListener("wheel", event => {
        if (event.target === gameCanvas) {
            cameraDistance += event.deltaY * 0.01;
            cameraDistance = Math.max(5, Math.min(20, cameraDistance));
        }
    });
}

function useAction(slot) {
    console.log(`Using action slot ${slot}`);
    const action = player.actionBar[slot];
    if (action) {
        if (action.type === "skill") {
            const success = player.useSkill(action.name);
            if (success) {
                console.log(`Skill used: ${action.name}`);
            } else {
                console.log(`Skill ${action.name} failed (cooldown/mana/range)`);
            }
            player.updateSkillAvailability(); // Update UI after use
        } else if (action.type === "consumable") {
            useItem(action);
            console.log(`Consumable used: ${action.name}`);
            if (action.amount !== undefined) {
                action.amount -= 1;
                if (action.amount <= 0) {
                    player.removeItem(action, 0);
                    player.actionBar[slot] = null;
                }
            } else {
                player.removeItem(action);
                player.actionBar[slot] = null;
            }
        }
    }
}

function checkQuests() {
    activeQuests.forEach(quest => {
        if (quest.type === "defeat" && quest.progress >= quest.required) completeQuest(quest);
    });
}

function selectNextEnemy() {
    const playerPos = player.object.position;
    const playerFacing = new THREE.Vector3();
    player.object.getWorldDirection(playerFacing);
    playerFacing.normalize();

    nearbyEnemies = enemies
        .filter(enemy => {
            if (!enemy || !enemy.object || enemy.health <= 0) return false;
            const enemyPos = enemy.object.position;
            const distance = playerPos.distanceTo(enemyPos);
            if (distance > 25) return false;
            if (distance > 5) {
                const toEnemy = new THREE.Vector3().subVectors(enemyPos, playerPos).normalize();
                const angle = playerFacing.angleTo(toEnemy);
                const fovRadians = THREE.MathUtils.degToRad(120) / 2;
                if (angle > fovRadians) return false;
            }
            return true;
        })
        .map(enemy => ({
            enemy,
            distance: playerPos.distanceTo(enemy.object.position)
        }))
        .sort((a, b) => a.distance - b.distance)
        .map(item => item.enemy);

    if (nearbyEnemies.length === 0) {
        if (previousTarget && previousTarget.selectionDisc) {
            previousTarget.selectionDisc.visible = false;
        }
        player.selectedTarget = null;
        previousTarget = null;
        currentEnemyIndex = -1;
        console.log("No valid enemies nearby");
        return;
    }

    // Deselect previous target
    if (previousTarget && previousTarget.selectionDisc) {
        previousTarget.selectionDisc.visible = false;
    }

    // Cycle to the next enemy
    currentEnemyIndex = (currentEnemyIndex + 1) % nearbyEnemies.length;
    player.selectedTarget = nearbyEnemies[currentEnemyIndex];
    if (player.selectedTarget.selectionDisc) {
        player.selectedTarget.selectionDisc.visible = true;
    }
    previousTarget = player.selectedTarget; // Update previous target
    console.log(`Selected enemy ${currentEnemyIndex + 1}/${nearbyEnemies.length} at distance ${playerPos.distanceTo(player.selectedTarget.object.position).toFixed(2)} units`);
}

function selectAttackingEnemy(attackingNPC) {
    if (!player.selectedTarget) { // Only if no target is currently selected
        // Deselect previous target (just in case)
        if (previousTarget && previousTarget.selectionDisc) {
            previousTarget.selectionDisc.visible = false;
        }

        // Set the new target
        player.selectedTarget = attackingNPC;
        if (player.selectedTarget.selectionDisc) {
            player.selectedTarget.selectionDisc.visible = true;
        }
        previousTarget = player.selectedTarget;

        // Update nearbyEnemies and currentEnemyIndex to keep Tab targeting consistent
        const playerPos = player.object.position;
        nearbyEnemies = enemies
            .filter(enemy => {
                if (!enemy || !enemy.object || enemy.health <= 0) return false;
                const distance = playerPos.distanceTo(enemy.object.position);
                return distance <= 25; // Same range as selectNextEnemy
            })
            .map(enemy => ({
                enemy,
                distance: playerPos.distanceTo(enemy.object.position)
            }))
            .sort((a, b) => a.distance - b.distance)
            .map(item => item.enemy);

        currentEnemyIndex = nearbyEnemies.indexOf(attackingNPC);
        if (currentEnemyIndex === -1) {
            // If the attacking NPC isn’t in the list (e.g., outside FOV), add it
            nearbyEnemies.push(attackingNPC);
            currentEnemyIndex = nearbyEnemies.length - 1;
        }

        console.log(`Player auto-targeted attacking enemy at distance ${playerPos.distanceTo(attackingNPC.object.position).toFixed(2)} units`);
    }
}

export { setupInput, useAction, cameraDistance, isLeftClicking, isRightClicking, selectAttackingEnemy };