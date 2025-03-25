import { player } from '../entity/player.js';
import { useAction } from '../input.js';
import { getItemIcon, getSpellIcon } from './icon-utils.js';
import { setupTooltip } from './tooltip.js';
import { spellManager } from '../spells.js';

export function setupActionBar() {
    const slots = document.querySelectorAll(".action-slot");
    slots.forEach((slot, index) => {
        const action = player.actionBar[index];
        slot.innerHTML = "";
        if (action) {
            const icon = action.type !== "consumable" ? getSpellIcon(action, 40) : getItemIcon(action, 40);
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
            } else {
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

export function updateActionBar() {
    const slots = document.querySelectorAll(".action-slot");
    slots.forEach((slot, index) => {
        const action = player.actionBar[index];
        slot.innerHTML = "";
        if (action) {
            const icon = action.type !== "consumable" ? getSpellIcon(action, 40) : getItemIcon(action, 40);
            slot.appendChild(icon);
        }
    });
    requestAnimationFrame(updateActionBar);
}