import { setupPopups, closeAllPopups } from './popups.js';
import { setupActionBar, updateActionBar } from './action-bar-ui.js';
import { updateInventoryUI } from './inventory-ui.js';
import { updateSpellUI } from './spells-ui.js';
import { updateQuestUI } from './quests-ui.js';
import { updateStatsUI } from './stats-ui.js';
import { updateHealthUI, updateManaUI, updateXPUI } from './bars-ui.js';
import { renderHealthBar, renderManaBar, renderXPBar, renderActionBar, renderPopups, renderMinimap, renderTooltip } from './components.js';

export const UIManager = {
    initialize() {
        const uiContainer = document.getElementById('game-ui');
        uiContainer.innerHTML = `
            <img src="character-icon.png" class="character-btn" data-target="stats-popup">
            ${renderHealthBar()}
            ${renderManaBar()}
            ${renderXPBar()}
            ${renderActionBar()}
            ${renderPopups()}
            ${renderMinimap()}
            ${renderTooltip()}
        `;
        setupPopups();
        setupActionBar();
        this.updateAll();
    },
    updateAll() {
        updateInventoryUI();
        updateSpellUI();
        updateQuestUI();
        updateStatsUI();
        updateHealthUI();
        updateManaUI();
        updateXPUI();
        updateActionBar();
    },
    closeAllPopups,
};

UIManager.initialize();