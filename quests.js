// quests.js
import { player } from './player.js';
import { updateQuestUI } from './ui.js';

let factions = { Villagers: 0, Mages: 0 };
let quests = [];
let activeQuests = [];
let completedQuests = [];

async function loadQuests() {
    const response = await fetch('./data/quests.json');
    const data = await response.json();
    quests = data.quests;
}

function canStartQuest(quest) {
    const hasPrereqs = quest.prerequisites.every(prereq =>
        completedQuests.some(q => q.name === prereq)
    );
    const hasReputation = !quest.reputationRequired || factions[quest.faction] >= quest.reputationRequired;
    return hasPrereqs && hasReputation;
}

function addQuest(quest) {
    if (!activeQuests.some(q => q.id === quest.id) && !completedQuests.some(q => q.id === quest.id)) {
        const newQuest = { ...quest, progress: 0, completed: false };
        activeQuests.push(newQuest);
        console.log(`Accepted new quest: ${newQuest.name}`);
        updateQuestUI();
    }
}

function completeQuest(quest) {
    quest.completed = true;
    activeQuests.splice(activeQuests.indexOf(quest), 1);
    completedQuests.push(quest);
    
    if (quest.reward) {
        player.knownRecipes = player.knownRecipes || [];
        player.knownRecipes.push(quest.reward);
        console.log(`Learned recipe: ${quest.reward}`);
    }
    player.gainXP(quest.xpReward || 30);
    
    if (quest.nextQuest) {
        const nextQuest = quests.find(q => q.id === quest.nextQuest);
        if (nextQuest) addQuest(nextQuest);
    }
    
    updateQuestUI();
}

function updateQuestProgress(questName, amount) {
    const quest = activeQuests.find(q => q.name === questName);
    if (!quest || quest.completed) return;
    quest.progress += amount;
    if (quest.progress >= quest.required) {
        completeQuest(quest);
    }
    updateQuestUI();
}

function checkCollectionQuests() {
    activeQuests.forEach(quest => {
        if (quest.type === "collect") {
            const requiredItem = quest.requiredItem;
            const required = quest.required;
            quest.progress = player.inventory.find(item => item.name === requiredItem)?.amount || 0;

            if ((quest.progress || 1) >= required) {
                completeQuest(quest);
                quest.progress -= required;
                console.log(`Completed collection quest: ${quest.name}`);
            }
        }
    });
    updateQuestUI();
}

export { factions, quests, activeQuests, completedQuests, checkCollectionQuests, loadQuests, addQuest, completeQuest, updateQuestProgress, canStartQuest };