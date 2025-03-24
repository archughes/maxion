import { activeQuests, factions, completedQuests } from '../quests.js';

export function updateQuestUI() {
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