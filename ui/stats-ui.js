import { player } from '../entity/player.js';

export function updateStatsUI() {
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