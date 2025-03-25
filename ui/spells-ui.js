import { player } from '../entity/player.js';
import { getSpellIcon } from './icon-utils.js';
import { setupTooltip } from './tooltip.js';

export function updateSpellUI() {
    const spellList = document.querySelector("#spell-popup .spell-list");
    spellList.innerHTML = "";
    player.learnedSpells.forEach(spell => {
        const spellElement = document.createElement("div");
        spellElement.className = "spell-item";
        const icon = getSpellIcon(spell, 50, true);
        spellElement.appendChild(icon);
        spellElement.appendChild(Object.assign(document.createElement("span"), {
            textContent: ` ${spell.name} (Rank ${spell.rank})`
        }));
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
            Cooldown: ${spell.isOnCooldown() ? `${spell.cooldownRemaining.toFixed(1)}s / ${spell.baseCooldown}s` : `${spell.baseCooldown}s`}<br>
            Range: ${spell.range}
        `);
    });
}
