import { player } from './entity/player.js';
import { quests } from './quests.js';
import { epicManager } from './epicManager.js';

export class SaveLoadManager {
  static saveGame() {
    const saveData = {
      epicNumber: epicManager.currentEpic,
      learnedSkills: player.skills,
      learnedRecipes: player.recipes,
      level: player.level,
      stats: player.stats,
      inventory: player.inventory,
      equippedItems: player.equipped,
      questStatuses: quests.getQuestStatuses(),
      actionBar: player.actionBar,
    };
    localStorage.setItem('maxionSave', JSON.stringify(saveData));
    console.log('Game saved successfully.');
  }

  static loadGame() {
    const saveData = JSON.parse(localStorage.getItem('maxionSave'));
    if (saveData) {
      epicManager.setEpic(saveData.epicNumber);
      player.skills = saveData.learnedSkills;
      player.recipes = saveData.learnedRecipes;
      player.level = saveData.level;
      player.stats = saveData.stats;
      player.inventory = saveData.inventory;
      player.equipped = saveData.equippedItems;
      quests.setQuestStatuses(saveData.questStatuses);
      player.actionBar = saveData.actionBar;
      console.log('Game loaded successfully.');
    } else {
      console.log('No save data found.');
    }
  }
}

export const saveLoadManager = new SaveLoadManager();