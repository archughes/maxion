import { player } from './entity/player.js';
import { activeQuests, factions, completedQuests } from './quests.js';
import { useItem, craftItem } from './items.js';
import { useAction } from './input.js';
import { updateSettings, saveSettings, loadGame, saveGame } from './settings.js';
import { IconGenerator } from './textures/IconGenerator.js';
import { spellManager } from './spells.js';

const iconGenerator = new IconGenerator();

function getItemIcon(item, iconSize) {
    const name = item.name.toLowerCase().replace(/\s+/g, '');
    // Special items
    if (iconGenerator.specialItems[item.name]) {
        return iconGenerator.generateSpecialItemIcon(item.name);
    }
    // Tiered items (e.g., "Iron Sword")
    const tierMatch = item.name.match(/^(Wooden|Stone|Iron|Steel|Diamond|Eternium)\s(.+)/i);
    if (tierMatch) {
        const tier = tierMatch[1].toLowerCase();
        const baseName = tierMatch[2].toLowerCase();
        const typeMap = {
            sword: 'sword', staff: 'staff', dagger: 'dagger', bow: 'bow', wand: 'wand',
            shield: 'shield', chestplate: 'chest', helm: 'helm', gloves: 'gloves', ring: 'ring'
        };
        const itemType = typeMap[baseName] || 'sword';
        return iconGenerator.generateItemIcon(itemType, tier, tier, iconSize);
    }
    // Potions
    if (name.includes('potion')) {
        const sizeMatch = name.match(/(small|medium|large)/i);
        const typeMatch = name.match(/(health|mana)/i);
        const size = sizeMatch ? sizeMatch[1].toLowerCase() : 'medium';
        const potionType = typeMatch ? typeMatch[1].toLowerCase() : 'health';
        return iconGenerator.generatePotionIcon(potionType, size, iconSize);
    }
    // Materials
    if (name.includes('ingot') || name.includes('ore')) {
        const material = name.replace(/(ingot|ore)/i, '').trim().toLowerCase();
        const type = name.includes('ingot') ? 'ingot' : 'ore';
        return iconGenerator.generateMaterialIcon(material, type, iconSize);
    }
    // Plants
    const plantMatch = ['milkweed', 'sunflower', 'berry', 'pumpkin', 'snowball', 'cactusspine', 'charcoal', 'redcoral', 'bluecoral', 'seaweed', 'icecrystal', 'holywater', 'dragonscale'].find(p => name.includes(p));
    if (plantMatch) {
        return iconGenerator.generatePlantIcon(plantMatch, iconSize);
    }
    // Materials
    const materialMatch = ['wood', 'stone', 'iron', 'steel', 'diamond', 'eternium'].find(p => name.includes(p));
    const type = name.includes('ore') ? 'ore' : 'ingot';
    if (materialMatch) {
        return iconGenerator.generateMaterialIcon(materialMatch, type, iconSize);
    }
    // Default
    return iconGenerator.generateItemIcon('sword', 'iron', 'iron', iconSize);
}

function getSpellIcon(action, iconSize, setBackground = false) {
    // Generate the base SVG
    const svg = iconGenerator.generateSpellIcon(action.name.toLowerCase(), 'novice', iconSize);
    svg.setAttribute("width", iconSize);  
    svg.setAttribute("height", iconSize);
    svg.setAttribute("viewBox", `0 0 ${iconSize} ${iconSize}`);  // Ensures proper scaling
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet"); // Centers the icon
    
    // Optional: Add a border directly to the SVG
    svg.style.border = "2px solid #8B4513"; 
    svg.style.borderRadius = "4px"; // Slightly rounded edges

    if (setBackground) {
        // Create the parchment background
        const parchment = document.createElementNS("http://www.w3.org/2000/svg", "image");
        parchment.setAttribute("x", "0");
        parchment.setAttribute("y", "0");
        parchment.setAttribute("width", "50");
        parchment.setAttribute("height", "50");
        parchment.setAttributeNS("http://www.w3.org/1999/xlink", "href", "/parchment-texture-fill.jpg");

        // Ensure the parchment is at the back
        svg.insertBefore(parchment, svg.firstChild);
    }
    
    return svg;
}


// Refactored tooltip setup
function setupTooltip(element, contentGenerator) {
    element.addEventListener("mouseenter", (e) => {
      const tooltip = document.getElementById("tooltip");
      tooltip.innerHTML = contentGenerator();
      if (element.querySelector("svg")) {
        const iconClone = element.querySelector("svg").cloneNode(true);
        iconClone.style.width = "24px";
        iconClone.style.height = "24px";
        tooltip.insertBefore(iconClone, tooltip.firstChild);
      }
      tooltip.style.display = "block";
      positionTooltip(e, tooltip);
    });

    element.addEventListener("mousemove", (e) => {
        const tooltip = document.getElementById("tooltip");
        positionTooltip(e, tooltip);
    });

    element.addEventListener("mouseleave", () => {
        document.getElementById("tooltip").style.display = "none";
    });

    element.addEventListener("dragstart", () => {
        document.getElementById("tooltip").style.display = "none";  // Prevent action bar block during assignment by user
    });
}

function positionTooltip(e, tooltip) {
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

function updateInventoryUI() {
    const grid = document.querySelector("#inventory-popup .inventory-grid");
    const recipeList = document.querySelector("#inventory-popup .recipe-list");
    grid.innerHTML = "";
    recipeList.innerHTML = "";
    const allItems = [...player.inventory, ...player.bags[0].items];
    const searchTerm = document.querySelector("#inventory-popup .search-bar").value.toLowerCase();

    // Inventory Section
    allItems
        .filter(item => item.name.toLowerCase().includes(searchTerm))
        .forEach(item => {
            const slot = document.createElement("div");
            slot.className = "item-slot";
            const icon = getItemIcon(item, 50);
            slot.appendChild(icon);
            const textSpan = document.createElement("span");
            textSpan.textContent = ` ${item.name}${item.amount ? " x" + item.amount : ""}${player.bags[0].items.includes(item) ? " (bag)" : ""}`;
            slot.appendChild(textSpan);
            if ([player.equippedWeapon, player.equippedArmor, player.equippedHelmet].includes(item)) {
                slot.classList.add("equipped");
            }

            setupTooltip(slot, () => `
                <strong>${item.name}</strong><br>
                Type: ${item.type}<br>
                ${item.damage ? `Damage: ${item.damage}` : ''}
                ${item.defense ? `Defense: ${item.defense}` : ''}
                ${item.health ? `Health: ${item.health}` : ''}
                ${item.mana ? `Mana: ${item.mana}` : ''}
            `);

            slot.draggable = true;
            slot.addEventListener("dragstart", (e) => e.dataTransfer.setData("text/plain", JSON.stringify(item)));
            slot.addEventListener("click", (event) => {
                event.stopPropagation();
                if (["weapon", "armor", "helmet"].includes(item.type)) {
                    player.equipItem(item);
                } else if (item.type === "consumable") {
                    useItem(item);
                    updateInventoryUI();
                }
            });
            grid.appendChild(slot);
        });

    // Recipes Section
    if (!player.knownRecipes || !Array.isArray(player.knownRecipes) || player.knownRecipes.length === 0) {
        recipeList.innerHTML = "<p>No known recipes yet.</p>";
    } else {
        player.knownRecipes
            .filter(recipe => {
                const recipeName = typeof recipe === "string" ? recipe : recipe.name;
                return recipeName && recipeName.toLowerCase().includes(searchTerm);
            })
            .forEach(recipe => {
                const recipeName = typeof recipe === "string" ? recipe : recipe.name;
                const div = document.createElement("div");
                div.innerHTML = `${recipeName} <button class="craft-btn">Craft</button>`;
                div.querySelector(".craft-btn").addEventListener("click", () => {
                    craftItem(recipeName);
                    updateInventoryUI(); // Refresh after crafting
                });
                recipeList.appendChild(div);
            });
    }
}

function updateStatsUI() {
    const statsDiv = document.querySelector("#stats-popup .stats-info");

    statsDiv.innerHTML = `
        <h3>Equipped Items</h3>
        <p>Weapon: ${player.equippedWeapon?.name || "None"}</p>
        <p>Armor: ${player.equippedArmor?.name || "None"}</p>
        <p>Helmet: ${player.equippedHelmet?.name || "None"}</p>
        <h3>Stats</h3>
        <p>Level: ${player.level}</p>
        <h4>Stats (Points: ${player.statPoints})</h4>
        <p>Strength: ${player.stats.strength} ${player.statPoints > 0 ? '<button class="stat-btn" data-stat="strength">+</button>' : ''}</p>
        <p>Agility: ${player.stats.agility} ${player.statPoints > 0 ? '<button class="stat-btn" data-stat="agility">+</button>' : ''}</p>
        <p>Intelligence: ${player.stats.intelligence} ${player.statPoints > 0 ? '<button class="stat-btn" data-stat="intelligence">+</button>' : ''}</p>
        <h3>Spells</h3>
        ${player.learnedSpells.map(spell => `
          <p>${spell.name}: Rank ${spell.rank} ${player.skillPoints > 0 ? `<button class="skill-btn" data-skill="${spell.name}">+</button>` : ''}</p>
        `).join('')}
        <p>Skill Points: ${player.skillPoints}</p>
    `;

    statsDiv.querySelectorAll(".stat-btn").forEach(button => {
        button.addEventListener("click", (event) => {
            event.stopPropagation();
            const stat = button.dataset.stat;
            player.increaseStat(stat);
            updateStatsUI();
        });
    });

    statsDiv.querySelectorAll(".skill-btn").forEach(button => {
        button.addEventListener("click", (event) => {
            event.stopPropagation();
            const skill = button.dataset.skill;
            player.upgradeSkill(skill);
            updateStatsUI();
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

function updateSpellUI() {
    const spellList = document.querySelector("#spell-popup .spell-list");
    spellList.innerHTML = "";
    player.learnedSpells.forEach(spell => {
      const spellElement = document.createElement("div");
      spellElement.className = "spell-item";
      const icon = getSpellIcon(spell, 50, true);
      spellElement.appendChild(icon);
      const textSpan = document.createElement("span");
      textSpan.textContent = ` ${spell.name} (Rank ${spell.rank})`;
      spellElement.appendChild(textSpan);
      spellElement.draggable = true;
      spellElement.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", JSON.stringify({ ...spell, type: "spell" }));
      });
      spellList.appendChild(spellElement);
  
      setupTooltip(spellElement, () => `
        <strong>${spell.name}</strong><br>
        Type: ${spell.type}<br>
        Damage: ${spell.damage}<br>
        Mana Cost: ${spell.manaCost}<br>
        Cooldown: ${spell.cooldown}s<br>
        Range: ${spell.range}
      `);
    });
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
                else if (target.id === "spell-popup") updateSpellUI();
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
        });
    });

    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const tabId = btn.dataset.tab;
            document.querySelectorAll(".tab-content").forEach(tab => {
                tab.style.display = tab.id === `${tabId}-tab` ? "block" : "none";
            });
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
      slot.innerHTML = "";
      if (action) {
        const icon = action.type !== "consumable"
          ? getSpellIcon(action, 40)
          : getItemIcon(action, 40);
        slot.appendChild(icon);
      }
  
      slot.addEventListener("dragover", (e) => e.preventDefault());
      slot.addEventListener("drop", (e) => {
        e.preventDefault();
        const data = JSON.parse(e.dataTransfer.getData("text/plain"));
        if (data.type === "consumable") {
            const inventoryItem = [...player.inventory, ...player.bags[0].items].find(i => i.name === data.name);
            if (inventoryItem) {
              player.actionBar[index] = inventoryItem;
              updateActionBar();
            }
          }else {
          player.actionBar[index] = spellManager.getSpellByName(data.name);
          updateActionBar();
        }
      });
  
      slot.addEventListener("click", (event) => {
        event.stopPropagation();
        useAction(index);
      });
  
      setupTooltip(slot, () => {
        const action = player.actionBar[index];
        if (!action) return "";
        return action.type !== "consumable"
          ? `<strong>${action.name}</strong><br>Type: ${action.type}<br>Damage: ${action.damage}<br>Mana Cost: ${action.manaCost}<br>Cooldown: ${action.cooldownRemaining > 0 ? `${action.cooldownRemaining.toFixed(1)}s / ${action.cooldown}s` : `${action.cooldown}s`}<br>Range: ${action.range}`
          : `<strong>${action.name}</strong><br>Type: ${action.type}${action.amount ? `<br>Amount: ${action.amount}` : ""}`;
      });
    });
    requestAnimationFrame(updateActionBar);
  }
  
  function updateActionBar() {
    const slots = document.querySelectorAll(".action-slot");
    slots.forEach((slot, index) => {
      const action = player.actionBar[index];
      slot.innerHTML = "";
      if (action) {
        const icon = action.type !== "consumable"
          ? getSpellIcon(action, 40)
          : getItemIcon(action, 40);
        slot.appendChild(icon);
        if (action.type !== "consumable" && action.cooldownRemaining > 0) {
          const cooldownPercent = (action.cooldownRemaining / action.cooldown * 100);
          slot.style.setProperty('--cooldown-percent', `${cooldownPercent}%`);
        } else {
          slot.style.setProperty('--cooldown-percent', '0%');
        }
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
    setupPopups, 
    setupActionBar, 
    updateActionBar, 
    updateInventoryUI, 
    updateSpellUI, 
    updateQuestUI, 
    updateHealthUI, 
    updateManaUI, 
    updateXPUI, 
    updateStatsUI,
    closeAllPopups
};