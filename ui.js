import { player } from './entity/player.js';
import { activeQuests, factions, canStartQuest, completedQuests } from './quests.js';
import { useItem, craftItem } from './items.js';
import { useAction } from './input.js';
import { updateSettings, saveSettings, loadGame, saveGame } from './settings.js';

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

    if (!player.knownRecipes || !Array.isArray(player.knownRecipes) || player.knownRecipes.length === 0) {
        list.innerHTML = "<p>No known recipes yet.</p>";
        return;
    }

    player.knownRecipes
        .filter(recipe => {
            if (!recipe) return false;
            const recipeName = typeof recipe === "string" ? recipe : recipe.name;
            return recipeName && recipeName.toLowerCase().includes(searchTerm);
        })
        .forEach(recipe => {
            const recipeName = typeof recipe === "string" ? recipe : recipe.name;
            const div = document.createElement("div");
            div.innerHTML = `${recipeName} <button class="craft-btn">Craft</button>`; // Add class
            div.querySelector(".craft-btn").addEventListener("click", () => craftItem(recipeName));
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
        <p>Strength: ${player.stats.strength} ${player.statPoints > 0 ? '<button class="stat-btn" data-stat="strength">+</button>' : ''}</p>
        <p>Agility: ${player.stats.agility} ${player.statPoints > 0 ? '<button class="stat-btn" data-stat="agility">+</button>' : ''}</p>
        <p>Intelligence: ${player.stats.intelligence} ${player.statPoints > 0 ? '<button class="stat-btn" data-stat="intelligence">+</button>' : ''}</p>
        <h4>Skills (Points: ${player.skillPoints})</h4>
        <p>Power Attack: ${powerAttack?.level > 0 ? `Level ${powerAttack.level}` : "Locked"} ${player.skillPoints > 0 ? '<button class="skill-btn" data-skill="Power Attack">+</button>' : ''}</p>
        <p>Fireball: ${fireball?.level > 0 ? `Level ${fireball.level}` : "Locked"} ${player.skillPoints > 0 ? '<button class="skill-btn" data-skill="Fireball">+</button>' : ''}</p>
        <p>Invisibility: ${invisibility?.level > 0 ? `Level ${invisibility.level}` : "Locked"} ${player.skillPoints > 0 ? '<button class="skill-btn" data-skill="Invisibility">+</button>' : ''}</p>
    `;

    // Attach event listeners to stat buttons
    statsDiv.querySelectorAll(".stat-btn").forEach(button => {
        button.addEventListener("click", (event) => {
            event.stopPropagation(); // Prevent click from closing popup
            const stat = button.dataset.stat;
            player.increaseStat(stat);
            updateStatsUI(); // Refresh the UI immediately
        });
    });

    // Attach event listeners to skill buttons
    statsDiv.querySelectorAll(".skill-btn").forEach(button => {
        button.addEventListener("click", (event) => {
            event.stopPropagation(); // Prevent click from closing popup
            const skill = button.dataset.skill;
            player.upgradeSkill(skill);
            updateStatsUI(); // Refresh the UI immediately
        });
    });
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
                else if (target.id === "settings-popup") updateSettings();
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

    // ui.js (partial update for active tab)
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const tabId = btn.dataset.tab;
            document.querySelectorAll(".tab-content").forEach(tab => {
                tab.style.display = tab.id === `${tabId}-tab` ? "block" : "none";
            });
            // Set active tab
            document.querySelectorAll(".tab-btn").forEach(t => t.classList.remove("active"));
            btn.classList.add("active");
        });
    });
    
    document.querySelector(".save-settings-btn").addEventListener("click", saveSettings);
    document.querySelector(".load-game-btn").addEventListener("click", loadGame);
    document.querySelector(".save-game-btn").addEventListener("click", saveGame);
    document.querySelector(".resume-btn").addEventListener("click", () => {
    closeAllPopups();
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
    closeAllPopups
};