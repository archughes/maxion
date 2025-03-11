import { player } from './entity/player.js';
import { activeQuests, factions, canStartQuest, completedQuests } from './quests.js';
import { useItem, craftItem } from './items.js';
import { useAction } from './input.js';
import { terrain } from './environment/environment.js';
import { timeSystem } from './environment/TimeSystem.js';

function updateInventoryUI() {
    const grid = document.querySelector("#inventory-popup .inventory-grid");
    grid.innerHTML = "";
    const allItems = [...player.inventory, ...player.bags[0].items];
    const searchTerm = document.querySelector("#inventory-popup .search-bar").value.toLowerCase();

    allItems
        .filter(item => item.name.toLowerCase().includes(searchTerm))
        .forEach(item => {
            const slot = document.createElement("div");
            slot.className = "item-slot";
            slot.textContent = `${item.name}${item.amount ? " x" + item.amount : ""}${player.bags[0].items.includes(item) ? " (bag)" : ""}`;
            if ([player.equippedWeapon, player.equippedArmor, player.equippedHelmet].includes(item)) {
                slot.classList.add("equipped");
            }

            // Tooltip events
            slot.addEventListener("mouseenter", (e) => {
                const tooltip = document.getElementById("tooltip");
                tooltip.innerHTML = `
                    <strong>${item.name}</strong><br>
                    Type: ${item.type}<br>
                    ${item.damage ? `Damage: ${item.damage}` : ''}
                    ${item.defense ? `Defense: ${item.defense}` : ''}
                    ${item.health ? `Health: ${item.health}` : ''}
                    ${item.mana ? `Mana: ${item.mana}` : ''}
                `;
                tooltip.style.display = "block";
                // Position tooltip, ensuring it stays within viewport
                const tooltipWidth = tooltip.offsetWidth;
                const tooltipHeight = tooltip.offsetHeight;
                let left = e.pageX + 10;
                let top = e.pageY + 10;
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;

                if (left + tooltipWidth > viewportWidth) {
                    left = e.pageX - tooltipWidth - 10;
                }
                if (top + tooltipHeight > viewportHeight) {
                    top = e.pageY - tooltipHeight - 10;
                }

                tooltip.style.left = `${left}px`;
                tooltip.style.top = `${top}px`;
            });

            slot.addEventListener("mousemove", (e) => {
                const tooltip = document.getElementById("tooltip");
                const tooltipWidth = tooltip.offsetWidth;
                const tooltipHeight = tooltip.offsetHeight;
                let left = e.pageX + 10;
                let top = e.pageY + 10;
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;

                if (left + tooltipWidth > viewportWidth) {
                    left = e.pageX - tooltipWidth - 10;
                }
                if (top + tooltipHeight > viewportHeight) {
                    top = e.pageY - tooltipHeight - 10;
                }

                tooltip.style.left = `${left}px`;
                tooltip.style.top = `${top}px`;
            });

            slot.addEventListener("mouseleave", () => {
                document.getElementById("tooltip").style.display = "none";
            });
            
            slot.draggable = true;
            slot.addEventListener("dragstart", (e) => e.dataTransfer.setData("text/plain", JSON.stringify(item)));
            slot.addEventListener("click", (event) => {
                event.stopPropagation();
                if (["weapon", "armor", "helmet"].includes(item.type)) {
                    player.equipItem(item);
                } else if (item.type === "consumable") {
                    useItem(item); // Should consume and remove
                    updateInventoryUI(); // Refresh UI
                }
            });
            grid.appendChild(slot);
        });
}

function updateRecipesUI() {
    const list = document.querySelector("#recipes-popup .recipe-list");
    list.innerHTML = "";
    const searchInput = document.querySelector("#recipes-popup .search-bar");
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";

    if (!player.knownRecipes || !Array.isArray(player.knownRecipes)) {
        list.innerHTML = "<p>No known recipes yet.</p>";
        return;
    }

    player.knownRecipes
        .filter(recipe => recipe && typeof recipe === "object" && recipe.name && recipe.name.toLowerCase().includes(searchTerm))
        .forEach(recipe => {
            const div = document.createElement("div");
            div.innerHTML = `${recipe.name} <button>Craft</button>`;
            div.querySelector("button").addEventListener("click", () => craftItem(recipe.name));
            list.appendChild(div);
        });
}

function updateCharacterUI() {
    const characterDiv = document.querySelector("#character-popup .character-info");
    characterDiv.innerHTML = `
        <h3>Equipped Items</h3>
        <p>Weapon: ${player.equippedWeapon?.name || "None"}</p>
        <p>Armor: ${player.equippedArmor?.name || "None"}</p>
        <p>Helmet: ${player.equippedHelmet?.name || "None"}</p>
    `;
}

function updateStatsUI() {
    const statsDiv = document.querySelector("#stats-popup .stats-info");
    const powerAttack = player.actionBar.find(a => a?.name === "Power Attack");
    const fireball = player.actionBar.find(a => a?.name === "Fireball");
    const invisibility = player.actionBar.find(a => a?.name === "Invisibility");

    statsDiv.innerHTML = `
        <p>Level: ${player.level}</p>
        <h4>Stats (Points: ${player.statPoints})</h4>
        <p>Strength: ${player.stats.strength} ${player.statPoints > 0 ? '<button onclick="player.increaseStat(\'strength\'); updateStatsUI();">+</button>' : ''}</p>
        <p>Agility: ${player.stats.agility} ${player.statPoints > 0 ? '<button onclick="player.increaseStat(\'agility\'); updateStatsUI();">+</button>' : ''}</p>
        <p>Intelligence: ${player.stats.intelligence} ${player.statPoints > 0 ? '<button onclick="player.increaseStat(\'intelligence\'); updateStatsUI();">+</button>' : ''}</p>
        <h4>Skills (Points: ${player.skillPoints})</h4>
        <p>Power Attack: ${powerAttack?.level > 0 ? `Level ${powerAttack.level}` : "Locked"} ${player.skillPoints > 0 ? '<button onclick="player.upgradeSkill(\'Power Attack\'); updateStatsUI();">+</button>' : ''}</p>
        <p>Fireball: ${fireball?.level > 0 ? `Level ${fireball.level}` : "Locked"} ${player.skillPoints > 0 ? '<button onclick="player.upgradeSkill(\'Fireball\'); updateStatsUI();">+</button>' : ''}</p>
        <p>Invisibility: ${invisibility?.level > 0 ? `Level ${invisibility.level}` : "Locked"} ${player.skillPoints > 0 ? '<button onclick="player.upgradeSkill(\'Invisibility\'); updateStatsUI();">+</button>' : ''}</p>
    `;
}

function updateQuestUI() {
    const questList = document.querySelector("#quests-popup .quest-list");
    questList.innerHTML = "<h3>Active Quests</h3>";
    activeQuests.forEach(quest => {
        let progressText = quest.type === "collect" ? `${quest.progress}/${quest.required}` : 
                          quest.type === "defeat" ? `${quest.progress}/${quest.required} defeated` : "";
        questList.innerHTML += `
            <div>
                <strong>${quest.name}</strong><br>
                ${progressText}<br>
                Reward: ${quest.reward?.name || "XP"}${quest.xpReward ? ` (+${quest.xpReward} XP)` : ""}
            </div>
        `;
    });
    questList.innerHTML += `<h3>Completed Quests</h3>`;
    completedQuests.slice(-5).forEach(quest => {
        questList.innerHTML += `<div class="completed">${quest.name}</div>`;
    });
    questList.innerHTML += `<h3>Reputation</h3>Villagers: ${factions.Villagers}<br>Mages: ${factions.Mages}`;
}

function closeAllPopups(except = null) {
    const popups = document.querySelectorAll(".popup");
    popups.forEach(popup => {
        if (popup !== except) popup.style.display = "none";
    });
}

function setupPopups() {
    document.querySelectorAll(".popup-btn, .character-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const target = document.getElementById(btn.dataset.target);
            const isOpen = target.style.display === "block";
            closeAllPopups();
            if (!isOpen) {
                target.style.display = "block";
                if (target.id === "inventory-popup") updateInventoryUI();
                else if (target.id === "recipes-popup") updateRecipesUI();
                else if (target.id === "character-popup") updateCharacterUI();
                else if (target.id === "stats-popup") updateStatsUI();
                else if (target.id === "quests-popup") updateQuestUI();
            }
        });
    });

    document.querySelectorAll(".close-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            btn.closest(".popup").style.display = "none";
        });
    });

    document.querySelectorAll(".search-bar").forEach(input => {
        input.addEventListener("input", () => {
            if (input.closest("#inventory-popup")) updateInventoryUI();
            else if (input.closest("#recipes-popup")) updateRecipesUI();
        });
    });

    document.addEventListener("click", (event) => {
        const popups = document.querySelectorAll(".popup");
        const buttons = document.querySelectorAll(".popup-btn, .character-btn");
        const isClickInsidePopup = Array.from(popups).some(popup => popup.contains(event.target));
        const isClickOnButton = Array.from(buttons).some(btn => btn.contains(event.target));

        if (!isClickInsidePopup && !isClickOnButton) {
            closeAllPopups();
        }
    });
}

function setupActionBar() {
    const slots = document.querySelectorAll(".action-slot");
    slots.forEach((slot, index) => {
        const action = player.actionBar[index];
        if (action && action.type === "skill") {
            slot.textContent = action.name;
        } else if (action && action.type === "consumable") {
            slot.textContent = `${action.name}${action.amount ? " x" + action.amount : ""}`;
        } else {
            slot.textContent = `${index + 1}`;
        }

        slot.addEventListener("dragover", (e) => e.preventDefault());
        slot.addEventListener("drop", (e) => {
            e.preventDefault();
            const itemData = JSON.parse(e.dataTransfer.getData("text/plain"));
            if (itemData.type === "consumable" && index >= 3) {
                const inventoryItem = [...player.inventory, ...player.bags[0].items].find(i => i.name === itemData.name);
                if (inventoryItem) {
                    player.actionBar[index] = inventoryItem;
                    slot.textContent = `${inventoryItem.name}${inventoryItem.amount ? " x" + inventoryItem.amount : ""}`;
                }
            }
        });

        slot.addEventListener("click", (event) => {
            event.stopPropagation();
            useAction(index);
        });

        slot.addEventListener("mouseenter", (e) => {
            if (action) {
                const tooltip = document.getElementById("tooltip");
                let tooltipContent = `
                    <strong>${action.name}</strong><br>
                    Type: ${action.type}<br>
                `;
                if (action.type === "skill") {
                    tooltipContent += `
                        Level: ${action.level}<br>
                        ${action.cooldown > 0 ? `Cooldown: ${action.cooldown.toFixed(1)}s / ${action.maxCooldown}s` : `Cooldown: ${action.maxCooldown}s`}<br>
                        ${action.range > 0 ? `Range: ${action.range}` : ''}<br>
                        ${action.manaCost ? `Mana Cost: ${action.manaCost}` : ''}
                    `;
                } else if (action.type === "consumable") {
                    tooltipContent += `${action.amount ? `Amount: ${action.amount}` : ''}`;
                }
                tooltip.innerHTML = tooltipContent;
                tooltip.style.display = "block";

                const tooltipWidth = tooltip.offsetWidth;
                const tooltipHeight = tooltip.offsetHeight;
                let left = e.pageX + 10;
                let top = e.pageY + 10;
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;

                if (left + tooltipWidth > viewportWidth) left = e.pageX - tooltipWidth - 10;
                if (top + tooltipHeight > viewportHeight) top = e.pageY - tooltipHeight - 10;

                tooltip.style.left = `${left}px`;
                tooltip.style.top = `${top}px`;
            }
        });

        slot.addEventListener("mousemove", (e) => {
            const tooltip = document.getElementById("tooltip");
            const tooltipWidth = tooltip.offsetWidth;
            const tooltipHeight = tooltip.offsetHeight;
            let left = e.pageX + 10;
            let top = e.pageY + 10;
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            if (left + tooltipWidth > viewportWidth) left = e.pageX - tooltipWidth - 10;
            if (top + tooltipHeight > viewportHeight) top = e.pageY - tooltipHeight - 10;

            tooltip.style.left = `${left}px`;
            tooltip.style.top = `${top}px`;
        });

        slot.addEventListener("mouseleave", () => {
            document.getElementById("tooltip").style.display = "none";
        });
    });
    requestAnimationFrame(updateActionBar);
}

function updateActionBar() {
    const slots = document.querySelectorAll(".action-slot");
    slots.forEach((slot, index) => {
        const action = player.actionBar[index];
        if (action && action.type === "skill") {
            if (action.cooldown > 0) {
                const cooldownPercent = (action.cooldown / action.maxCooldown) * 100;
                slot.style.setProperty('--cooldown-percent', `${cooldownPercent}%`);
                slot.textContent = `${action.name} (${action.cooldown.toFixed(1)}s)`;
            } else {
                slot.style.setProperty('--cooldown-percent', '0%');
                slot.textContent = action.name;
            }
        } else if (action && action.type === "consumable") {
            slot.textContent = `${action.name}${action.amount ? " x" + action.amount : ""}`;
            slot.style.setProperty('--cooldown-percent', '0%'); // No cooldown for consumables
        } else {
            slot.style.setProperty('--cooldown-percent', '0%');
            slot.textContent = `${index + 1}`;
        }
    });
    requestAnimationFrame(updateActionBar);
}

function updateHealthUI() {
    const healthPercent = (player.health / 100) * 100; // Max health is 100
    const healthFill = document.querySelector(".health-fill");
    healthFill.style.width = `${healthPercent}%`;
    if (player.health < 20) {
        healthFill.classList.add("low-health");
    } else {
        healthFill.classList.remove("low-health");
    }
}

function updateManaUI() {
    const manaPercent = (player.mana / 50) * 100; // Max mana is 50
    document.querySelector(".mana-fill").style.width = `${manaPercent}%`;
}

function updateXPUI() {
    const xpPercent = (player.xp / (100 * player.level)) * 100; // XP scales with level
    document.querySelector(".xp-fill").style.width = `${xpPercent}%`;
}

let terrainCacheCanvas = null;
export const terrainCache = {
    terrainCacheNeedsUpdate: true,
    newDiscoveries: []
};

function initializeTerrainCache() {
    terrainCacheCanvas = document.createElement('canvas');
    terrainCacheCanvas.width = terrain.terrainMapCanvas.width;
    terrainCacheCanvas.height = terrain.terrainMapCanvas.height;
    const ctx = terrainCacheCanvas.getContext('2d');
    
    // Draw the static terrain map
    ctx.drawImage(terrain.terrainMapCanvas, 0, 0);
    
    // Apply full fog initially (since nothing is known yet)
    ctx.globalAlpha = 0.5; // Semi-transparent fog
    ctx.fillStyle = 'rgb(102, 102, 102)';
    ctx.fillRect(0, 0, terrainCacheCanvas.width, terrainCacheCanvas.height);
    ctx.globalAlpha = 1.0; // Reset alpha
}

function renderTerrainToCanvas(canvas, terrain, player) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!terrainCacheCanvas) initializeTerrainCache();

    if (terrainCache.terrainCacheNeedsUpdate) {
        const cacheCtx = terrainCacheCanvas.getContext('2d');
        
        if (terrainCache.newDiscoveries && terrainCache.newDiscoveries.length > 0) {
            // Calculate segment size on the canvas
            const widthSegments = terrain.geometry.parameters.widthSegments;
            const heightSegments = terrain.geometry.parameters.heightSegments;
            const segWidth = terrainCacheCanvas.width / widthSegments;
            const segHeight = terrainCacheCanvas.height / heightSegments;

            // Update only the newly discovered segments
            terrainCache.newDiscoveries.forEach(({ x, z }) => {
                const canvasX = x * segWidth;
                const canvasY = z * segHeight;
                // Redraw the terrain segment to remove fog
                cacheCtx.drawImage(
                    terrain.terrainMapCanvas,
                    canvasX, canvasY, segWidth, segHeight, // Source rectangle
                    canvasX, canvasY, segWidth, segHeight  // Destination rectangle
                );
            });
            
            // Clear the discoveries list after processing
            terrainCache.newDiscoveries = [];
        }
        // Note: No else clause needed; initial full render is handled in initializeTerrainCache
        
        terrainCache.terrainCacheNeedsUpdate = false;
    }

    // Crop and draw to the minimap canvas (unchanged)
    const playerX = (player.object.position.x / terrain.width + 0.5) * terrainCacheCanvas.width;
    const playerZ = (player.object.position.z / terrain.height + 0.5) * terrainCacheCanvas.height;
    const viewWidth = canvas.width;
    const viewHeight = canvas.height;

    let srcX = playerX - viewWidth / 2;
    let srcY = playerZ - viewHeight / 2;
    srcX = Math.max(0, Math.min(srcX, terrainCacheCanvas.width - viewWidth));
    srcY = Math.max(0, Math.min(srcY, terrainCacheCanvas.height - viewHeight));

    ctx.drawImage(terrainCacheCanvas, srcX, srcY, viewWidth, viewHeight, 0, 0, viewWidth, viewHeight);
    drawPlayerIndicator(ctx, player, terrainCacheCanvas, srcX, srcY, viewWidth, viewHeight, viewWidth, viewHeight, { arrowSize: 10 });
}

function drawPlayerIndicator(ctx, player, terrainCanvas, srcX, srcY, srcW, srcH, viewWidth, viewHeight, options = {}) {
    // Default options with fallback values
    const {
        arrowSize = 20,
        arrowColor = 'red',
        coneDistance = 70,
        coneAngle = Math.PI / 2,
        coneColor = 'rgba(0, 0, 255, 0.3)',
        angleOffset = Math.PI / 2,
        showCone = true
    } = options;

    // Scale player position to terrainCanvas coordinates
    const playerX = (player.object.position.x / terrain.width + 0.5) * terrainCanvas.width;
    const playerZ = (player.object.position.z / terrain.height + 0.5) * terrainCanvas.height;
    const playerRotation = -player.object.rotation.y;

    let scaledX, scaledZ;

    // Adjust position based on whether it's a minimap or full map
    if (srcW !== viewWidth || srcH !== viewHeight) { // Minimap case (cropped view)
        scaledX = (playerX - srcX) * (viewWidth / srcW);
        scaledZ = (playerZ - srcY) * (viewHeight / srcH);
    } else { // Full map case (no cropping)
        scaledX = playerX * (viewWidth / terrainCanvas.width);
        scaledZ = playerZ * (viewHeight / terrainCanvas.height);
    }

    // Draw exploration cone
    if (showCone) {
        ctx.save();
        ctx.translate(scaledX, scaledZ);
        ctx.rotate(playerRotation + angleOffset); // Align cone with player direction

        const originalSize = 150;
        const originalScale = originalSize / terrain.width;
        const fixedConeRadius = coneDistance * originalScale;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, fixedConeRadius, -coneAngle / 2, coneAngle / 2);
        ctx.closePath();
        ctx.fillStyle = coneColor;
        ctx.fill();
        ctx.restore();
    }

    // Draw player arrow
    ctx.fillStyle = arrowColor;
    ctx.beginPath();
    ctx.save();
    ctx.translate(scaledX, scaledZ);
    ctx.rotate(playerRotation + angleOffset); // Adjust rotation for arrow direction
    ctx.moveTo(arrowSize, 0);
    ctx.lineTo(-arrowSize / 2, arrowSize / 2);
    ctx.lineTo(-arrowSize / 2, -arrowSize / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

}

function setupMinimap() {
    const minimap = document.querySelector('.minimap');
    const timeFrame = document.querySelector('.time-frame');
    const defaultSize = 150; // Default minimap size when not expanded

    function updateTimeFramePosition(newSize = defaultSize) {
        const minimapRect = minimap.getBoundingClientRect();
        const timeFrameWidth = timeFrame.offsetWidth;

        const top = 5;
        const left = minimapRect.right - (newSize / 2) - (timeFrameWidth / 2);

        timeFrame.style.top = `${top}px`;
        timeFrame.style.left = `${left}px`;
    }

    minimap.addEventListener('click', () => {
        const isExpanded = minimap.classList.toggle('expanded');
        const newSize = isExpanded ? 500 : defaultSize;
        const canvas = document.querySelector('.map-frame canvas');
        if (canvas) {
            canvas.width = newSize;
            canvas.height = newSize;
        }
        updateTimeFramePosition(newSize);
        updateMinimap();
    });

    // Ensure DOM is ready before positioning
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        updateTimeFramePosition(defaultSize);
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            updateTimeFramePosition(defaultSize);
        });
    }
}

function updateMinimap() {
    let canvas = document.querySelector(".map-frame canvas");
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.width = 150;
        canvas.height = 150;
        document.querySelector(".map-frame").appendChild(canvas);
    }
    renderTerrainToCanvas(canvas, terrain, player);

    // Update time display
    const timeDisplay = document.querySelector(".time-display");
    if (timeDisplay) {
        const hours = Math.floor(timeSystem.time / 60);
        const minutes = Math.floor(timeSystem.time % 60);
        timeDisplay.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
}

export { 
    updateRecipesUI, 
    updateCharacterUI, 
    setupPopups, 
    setupActionBar, 
    updateActionBar, 
    updateInventoryUI, 
    updateQuestUI, 
    updateHealthUI, 
    updateManaUI, 
    updateXPUI, 
    updateStatsUI, 
    updateMinimap,
    initializeTerrainCache, 
    setupMinimap,
    closeAllPopups
};