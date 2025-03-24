import { player } from '../entity/player.js';
import { useItem, craftItem } from '../items.js';
import { getItemIcon } from './icon-utils.js';
import { setupTooltip } from './tooltip.js';

export function updateInventoryUI() {
    const grid = document.querySelector("#inventory-popup .inventory-grid");
    const recipeList = document.querySelector("#inventory-popup .recipe-list");
    grid.innerHTML = "";
    recipeList.innerHTML = "";
    const allItems = [...player.inventory, ...player.bags[0].items];
    const searchTerm = document.querySelector("#inventory-popup .search-bar").value.toLowerCase();

    allItems
        .filter(item => item.name.toLowerCase().includes(searchTerm))
        .forEach(item => {
            const slot = document.createElement("div");
            slot.className = "item-slot";
            slot.appendChild(getItemIcon(item, 50));
            slot.appendChild(Object.assign(document.createElement("span"), {
                textContent: ` ${item.name}${item.amount ? " x" + item.amount : ""}${player.bags[0].items.includes(item) ? " (bag)" : ""}`
            }));
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

    if (!player.knownRecipes || !Array.isArray(player.knownRecipes) || player.knownRecipes.length === 0) {
        recipeList.innerHTML = "<p>No known recipes yet.</p>";
    } else {
        player.knownRecipes
            .filter(recipe => (typeof recipe === "string" ? recipe : recipe.name).toLowerCase().includes(searchTerm))
            .forEach(recipe => {
                const recipeName = typeof recipe === "string" ? recipe : recipe.name;
                const div = document.createElement("div");
                div.innerHTML = `${recipeName} <button class="craft-btn">Craft</button>`;
                div.querySelector(".craft-btn").addEventListener("click", () => {
                    craftItem(recipeName);
                    updateInventoryUI();
                });
                recipeList.appendChild(div);
            });
    }
}