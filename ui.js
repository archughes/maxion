import { player } from './entity/player.js';
import { activeQuests, factions, canStartQuest, completedQuests } from './quests.js';
import { useItem, craftItem } from './items.js';
import { useAction } from './input.js';
import { terrain, timeSystem } from './environment/environment.js';

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
    statsDiv.innerHTML = `
        <p>Level: ${player.level}</p>
        <h4>Stats (Points: ${player.statPoints})</h4>
        <p>Strength: ${player.stats.strength} ${player.statPoints > 0 ? '<button onclick="player.increaseStat(\'strength\'); updateStatsUI();">+</button>' : ''}</p>
        <p>Agility: ${player.stats.agility} ${player.statPoints > 0 ? '<button onclick="player.increaseStat(\'agility\'); updateStatsUI();">+</button>' : ''}</p>
        <p>Intelligence: ${player.stats.intelligence} ${player.statPoints > 0 ? '<button onclick="player.increaseStat(\'intelligence\'); updateStatsUI();">+</button>' : ''}</p>
        <h4>Skills (Points: ${player.skillPoints})</h4>
        <p>Power Attack: ${player.skills["Power Attack"] > 0 ? `Level ${player.skills["Power Attack"]}` : "Locked"} ${player.skillPoints > 0 ? '<button onclick="player.upgradeSkill(\'Power Attack\'); updateStatsUI();">+</button>' : ''}</p>
        <p>Fireball: ${player.skills["Fireball"] > 0 ? `Level ${player.skills["Fireball"]}` : "Locked"} ${player.skillPoints > 0 ? '<button onclick="player.upgradeSkill(\'Fireball\'); updateStatsUI();">+</button>' : ''}</p>
        <p>Invisibility: ${player.skills["Invisibility"] > 0 ? `Level ${player.skills["Invisibility"]}` : "Locked"} ${player.skillPoints > 0 ? '<button onclick="player.upgradeSkill(\'Invisibility\'); updateStatsUI();">+</button>' : ''}</p>
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
                else if (target.id === "map-popup") {
                    renderMap(); // Render initially

                    // Draggable functionality
                    let isDragging = false;
                    let startX, startY;
                    target.addEventListener("mousedown", (e) => {
                        isDragging = true;
                        startX = e.clientX - target.offsetLeft;
                        startY = e.clientY - target.offsetTop;
                    });
                    document.addEventListener("mousemove", (e) => {
                        if (isDragging) {
                            target.style.left = `${e.clientX - startX}px`;
                            target.style.top = `${e.clientY - startY}px`;
                        }
                    });
                    document.addEventListener("mouseup", () => {
                        isDragging = false;
                    });

                    // Periodic updates (twice per second)
                    let mapUpdateInterval;
                    const startMapUpdate = () => {
                        if (mapUpdateInterval) clearInterval(mapUpdateInterval);
                        mapUpdateInterval = setInterval(() => {
                            if (target.style.display === "block") {
                                renderMap();
                            }
                        }, 500); // 500ms = twice per second
                    };
                    startMapUpdate();

                    // Stop updates when closed
                    target.querySelector(".close-btn").addEventListener("click", () => {
                        target.style.display = "none";
                        clearInterval(mapUpdateInterval);
                    }, { once: true });
                }
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
                tooltip.innerHTML = `
                    <strong>${action.name}</strong><br>
                    Type: ${action.type}<br>
                    ${action.amount ? `Amount: ${action.amount}` : ''}
                    ${player.cooldowns[action.name] > 0 ? `Cooldown: ${player.cooldowns[action.name].toFixed(1)}s` : ''}
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
    });
    requestAnimationFrame(updateActionBar);
}

function updateActionBar() {
    const slots = document.querySelectorAll(".action-slot");
    slots.forEach((slot, index) => {
        const action = player.actionBar[index];
        if (action && action.type === "skill" && player.cooldowns[action.name] > 0) {
            const maxCooldown = { "Power Attack": 5, "Fireball": 10, "Invisibility": 15 }[action.name];
            const cooldownPercent = player.cooldowns[action.name] / maxCooldown;
            slot.style.setProperty('--cooldown-percent', cooldownPercent);
            slot.textContent = action.name.charAt(0); // Initial letter for simplicity
        } else if (action && action.type === "consumable") {
            slot.textContent = `${action.name}${action.amount ? " x" + action.amount : ""}`;
        } else {
            slot.style.setProperty('--cooldown-percent', 0);
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

function renderTerrainToCanvas(canvas, terrain, player, isMinimap = false) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const terrainCanvas = terrain.terrainMapCanvas;
    if (!terrainCanvas) return;

    // Player position in terrain coordinates (normalized 0 to 1, then scaled to canvas)
    const playerX = (player.object.position.x / terrain.width + 0.5) * terrainCanvas.width;
    const playerZ = (player.object.position.z / terrain.height + 0.5) * terrainCanvas.height;

    if (isMinimap) {
        // Minimap: Draw a centered portion around the player
        const viewWidth = canvas.width;
        const viewHeight = canvas.height;

        let srcX = playerX - viewWidth / 2;
        let srcY = playerZ - viewHeight / 2;
        let srcW = viewWidth;
        let srcH = viewHeight;

        // Clamp to terrainCanvas bounds
        if (srcX < 0) {
            srcW += srcX;
            srcX = 0;
        }
        if (srcY < 0) {
            srcH += srcY;
            srcY = 0;
        }
        if (srcX + srcW > terrainCanvas.width) {
            srcW = terrainCanvas.width - srcX;
        }
        if (srcY + srcH > terrainCanvas.height) {
            srcH = terrainCanvas.height - srcY;
        }

        // Draw terrain, overlaying knownMap
        ctx.drawImage(terrainCanvas, srcX, srcY, srcW, srcH, 0, 0, viewWidth, viewHeight);

        // Overlay knownMap (green for known, gray for unknown)
        const widthSegments = terrain.geometry.parameters.widthSegments;
        const heightSegments = terrain.geometry.parameters.heightSegments;
        for (let z = 0; z < heightSegments; z++) {
            for (let x = 0; x < widthSegments; x++) {
                const gridPos = `${x},${z}`;
                if (!player.knownMap.has(gridPos)) {
                    const terrainX = (x / widthSegments) * viewWidth;
                    const terrainY = (z / heightSegments) * viewHeight;
                    ctx.fillStyle = 'rgba(102, 102, 102, 1.0)'; // Gray for unexplored
                    ctx.fillRect(terrainX, terrainY, viewWidth / widthSegments, viewHeight / heightSegments);
                }
            }
        }

        // Draw player arrow at center
        const arrowSize = 10;
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(player.object.rotation.y); // Corrected 180-degree offset
        ctx.moveTo(arrowSize, 0);
        ctx.lineTo(-arrowSize / 2, arrowSize / 2);
        ctx.lineTo(-arrowSize / 2, -arrowSize / 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Draw exploration cone
        const viewDistance = 50;
        const viewAngle = 2 * Math.PI / 3; // As per updatePlayer
        const scale = viewWidth / terrain.width;
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(player.object.rotation.y); // Corrected 180-degree offset
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, viewDistance * scale, -viewAngle / 2, viewAngle / 2);
        ctx.closePath();
        ctx.fillStyle = 'rgba(0, 0, 255, 0.3)';
        ctx.fill();
        ctx.restore();
    } else {
        // World map: Draw the entire terrain
        ctx.drawImage(terrainCanvas, 0, 0, canvas.width, canvas.height);

        // Overlay knownMap (green for known, gray for unknown)
        const widthSegments = terrain.geometry.parameters.widthSegments;
        const heightSegments = terrain.geometry.parameters.heightSegments;
        for (let z = 0; z < heightSegments; z++) {
            for (let x = 0; x < widthSegments; x++) {
                const gridPos = `${x},${z}`;
                if (!player.knownMap.has(gridPos)) {
                    const terrainX = (x / widthSegments) * canvas.width;
                    const terrainY = (z / heightSegments) * canvas.height;
                    ctx.fillStyle = 'rgba(102, 102, 102, 0.5)'; // Gray for unexplored
                    ctx.fillRect(terrainX, terrainY, canvas.width / widthSegments, canvas.height / heightSegments);
                }
            }
        }

        // Draw player arrow at scaled position
        const scaledX = (playerX / terrainCanvas.width) * canvas.width;
        const scaledZ = (playerZ / terrainCanvas.height) * canvas.height;
        const arrowSize = 20;
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.save();
        ctx.translate(scaledX, scaledZ);
        ctx.rotate(player.object.rotation.y); // Corrected 180-degree offset
        ctx.moveTo(arrowSize, 0);
        ctx.lineTo(-arrowSize / 2, arrowSize / 2);
        ctx.lineTo(-arrowSize / 2, -arrowSize / 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Draw exploration cone
        const viewDistance = 50;
        const viewAngle = 2 * Math.PI / 3; // As per updatePlayer
        const scale = canvas.width / terrain.width;
        ctx.save();
        ctx.translate(scaledX, scaledZ);
        ctx.rotate(player.object.rotation.y); // Corrected 180-degree offset
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, viewDistance * scale, -viewAngle / 2, viewAngle / 2);
        ctx.closePath();
        ctx.fillStyle = 'rgba(0, 0, 255, 0.3)';
        ctx.fill();
        ctx.restore();
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
    renderTerrainToCanvas(canvas, terrain, player, true);

    // Update time display
    const timeDisplay = document.querySelector(".time-display");
    if (timeDisplay) {
        const hours = Math.floor(timeSystem.time / 60);
        const minutes = Math.floor(timeSystem.time % 60);
        timeDisplay.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
}

function renderMap() {
    const canvas = document.querySelector("#map-popup .map-canvas canvas") || document.createElement('canvas');
    if (!document.querySelector("#map-popup .map-canvas canvas")) {
        canvas.width = 512;
        canvas.height = 300; // Match CSS height
        document.querySelector("#map-popup .map-canvas").appendChild(canvas);
    }

    const ctx = canvas.getContext('2d');
    const terrainCanvas = terrain.terrainMapCanvas;
    if (!terrainCanvas) return;

    const playerX = (player.object.position.x / terrain.width + 0.5) * terrainCanvas.width;
    const playerZ = (player.object.position.z / terrain.height + 0.5) * terrainCanvas.height;
    const viewWidth = canvas.width;
    const viewHeight = canvas.height;

    let srcX = playerX - viewWidth / 2;
    let srcY = playerZ - viewHeight / 2;
    let srcW = viewWidth;
    let srcH = viewHeight;

    srcX = Math.max(0, Math.min(srcX, terrainCanvas.width - srcW));
    srcY = Math.max(0, Math.min(srcY, terrainCanvas.height - srcH));
    srcW = Math.min(srcW, terrainCanvas.width - srcX);
    srcH = Math.min(srcH, terrainCanvas.height - srcY);

    ctx.drawImage(terrainCanvas, srcX, srcY, srcW, srcH, 0, 0, viewWidth, viewHeight);

    // Fog of War
    const widthSegments = terrain.geometry.parameters.widthSegments;
    const heightSegments = terrain.geometry.parameters.heightSegments;
    for (let z = 0; z < heightSegments; z++) {
        for (let x = 0; x < widthSegments; x++) {
            const gridPos = `${x},${z}`;
            if (!player.knownMap.has(gridPos)) {
                const terrainX = (x / widthSegments) * viewWidth;
                const terrainY = (z / heightSegments) * viewHeight;
                ctx.fillStyle = 'rgba(102, 102, 102, 0.5)';
                ctx.fillRect(terrainX, terrainY, viewWidth / widthSegments, viewHeight / heightSegments);
            }
        }
    }

    // Player arrow at center
    const arrowSize = 20;
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.save();
    ctx.translate(viewWidth / 2, viewHeight / 2);
    ctx.rotate(player.object.rotation.y);
    ctx.moveTo(arrowSize, 0);
    ctx.lineTo(-arrowSize / 2, arrowSize / 2);
    ctx.lineTo(-arrowSize / 2, -arrowSize / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
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
    renderMap
};