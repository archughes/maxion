// ui.js
import { player } from './player.js';
import { activeQuests, factions, canStartQuest, completedQuests } from './quests.js';
import { useItem, craftItem } from './items.js';
import { useAction } from './input.js';

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
        <h3>Character</h3>
        <p>Level: ${player.level}</p>
        <h4>Equipped</h4>
        <p>Weapon: ${player.equippedWeapon?.name || "None"}</p>
        <p>Armor: ${player.equippedArmor?.name || "None"}</p>
        <p>Helmet: ${player.equippedHelmet?.name || "None"}</p>
        <h4>Stats (Points: ${player.statPoints})</h4>
        <p>Strength: ${player.stats.strength} ${player.statPoints > 0 ? '<button onclick="player.increaseStat(\'strength\')">+</button>' : ''}</p>
        <p>Agility: ${player.stats.agility} ${player.statPoints > 0 ? '<button onclick="player.increaseStat(\'agility\')">+</button>' : ''}</p>
        <p>Intelligence: ${player.stats.intelligence} ${player.statPoints > 0 ? '<button onclick="player.increaseStat(\'intelligence\')">+</button>' : ''}</p>
        <h4>Skills (Points: ${player.skillPoints})</h4>
        <p>Power Attack: ${player.skills["Power Attack"] > 0 ? `Level ${player.skills["Power Attack"]}` : "Locked"} ${player.skillPoints > 0 ? '<button onclick="player.upgradeSkill(\'Power Attack\')">+</button>' : ''}</p>
        <p>Fireball: ${player.skills["Fireball"] > 0 ? `Level ${player.skills["Fireball"]}` : "Locked"} ${player.skillPoints > 0 ? '<button onclick="player.upgradeSkill(\'Fireball\')">+</button>' : ''}</p>
        <p>Invisibility: ${player.skills["Invisibility"] > 0 ? `Level ${player.skills["Invisibility"]}` : "Locked"} ${player.skillPoints > 0 ? '<button onclick="player.upgradeSkill(\'Invisibility\')">+</button>' : ''}</p>
    `;
}

function closeAllPopups(except = null) {
    const popups = document.querySelectorAll(".popup");
    popups.forEach(popup => {
        if (popup !== except) popup.style.display = "none";
    });
}

function setupPopups() {
    document.querySelectorAll(".popup-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const target = document.getElementById(btn.dataset.target);
            const isOpen = target.style.display === "block";
            closeAllPopups(); // Close all popups first
            if (!isOpen) { // Only open if it wasn’t already open
                target.style.display = "block";
                if (target.id === "inventory-popup") updateInventoryUI();
                else if (target.id === "recipes-popup") updateRecipesUI();
                else if (target.id === "character-popup") updateCharacterUI();
            }
        });
    });

    document.querySelectorAll(".close-btn").forEach(btn => {
        btn.addEventListener("click", () => btn.closest(".popup").style.display = "none");
    });

    document.querySelectorAll(".search-bar").forEach(input => {
        input.addEventListener("input", () => {
            if (input.closest("#inventory-popup")) updateInventoryUI();
            else if (input.closest("#recipes-popup")) updateRecipesUI();
        });
    });

    // Close popups when clicking outside
    document.addEventListener("click", (event) => {
        const popups = document.querySelectorAll(".popup");
        const buttons = document.querySelectorAll(".popup-btn");
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
                // Reference the existing inventory item instead of copying
                const inventoryItem = [...player.inventory, ...player.bags[0].items].find(i => i.name === itemData.name);
                if (inventoryItem) {
                    player.actionBar[index] = inventoryItem; // Reference, don’t remove
                    slot.textContent = `${inventoryItem.name}${inventoryItem.amount ? " x" + inventoryItem.amount : ""}`;
                }
            }
        });

        slot.addEventListener("click", (event) => {
            event.stopPropagation();
            useAction(index);
        });
    });

    requestAnimationFrame(updateActionBar);
}

function updateActionBar() {
    const slots = document.querySelectorAll(".action-slot");
    slots.forEach((slot, index) => {
        const action = player.actionBar[index];
        if (action && action.type === "skill" && player.cooldowns[action.name] > 0) {
            slot.classList.add("cooldown");
            const maxCooldown = { "Power Attack": 5, "Fireball": 10, "Invisibility": 15 }[action.name];
            slot.style.setProperty("--cooldown-height", `${(player.cooldowns[action.name] / maxCooldown) * 100}%`);
        } else if (action && action.type === "consumable") {
            slot.textContent = `${action.name}${action.amount ? " x" + action.amount : ""}`; // Update stack size
        } else if (!action && slot.textContent !== `${index + 1}`) {
            slot.textContent = `${index + 1}`; // Reset if cleared
        } else {
            slot.classList.remove("cooldown");
        }
    });
    requestAnimationFrame(updateActionBar);
}

function updateQuestUI() {
    const questLogDiv = document.querySelector(".quest-log");
    questLogDiv.innerHTML = "<h3>Quests</h3>";
    activeQuests.forEach(quest => {
        const questDiv = document.createElement("div");
        let progressText = "";
        if (quest.type === "collect") progressText = `${quest.progress}/${quest.required}`;
        if (quest.type === "defeat") progressText = `${quest.progress}/${quest.required} defeated`;
        
        questDiv.innerHTML = `
            <strong>${quest.name}</strong><br>
            ${progressText}<br>
            Reward: ${quest.reward?.name || "XP"}${quest.xpReward ? ` (+${quest.xpReward} XP)` : ""}
        `;
        questLogDiv.appendChild(questDiv);
    });
    
    questLogDiv.innerHTML += `<h3>Completed Quests</h3>`;
    completedQuests.slice(-5).forEach(quest => {
        questLogDiv.innerHTML += `<div class="completed">${quest.name}</div>`;
    });
    
    questLogDiv.innerHTML += `<h3>Reputation</h3>Villagers: ${factions.Villagers}<br>Mages: ${factions.Mages}`;
}

function updateHealthUI() {
    document.querySelector(".health-fill").style.width = `${(player.health / 100) * 200}px`;
}

function updateManaUI() {
    document.querySelector(".mana-fill").style.width = `${(player.mana / 50) * 200}px`;
}

function updateXPUI() {
    const xpPercent = (player.xp / (100 * player.level)) * 100;
    document.querySelector(".xp-fill").style.width = `${(xpPercent / 100) * 200}px`;
}

export { updateRecipesUI, updateCharacterUI, setupPopups, setupActionBar, updateActionBar, updateInventoryUI, updateQuestUI, updateHealthUI, updateManaUI, updateXPUI };