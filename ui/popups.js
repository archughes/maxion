import { updateInventoryUI } from './inventory-ui.js';
import { updateSpellUI } from './spells-ui.js';
import { updateStatsUI } from './stats-ui.js';
import { updateQuestUI } from './quests-ui.js';
import { updateSettings, saveSettings, loadGame, saveGame } from './settings.js';

let spellUIInterval = null;

function startSpellUIUpdate() {
    if (!spellUIInterval) {
        spellUIInterval = setInterval(updateSpellUI, 100); // Update every 100ms (10 FPS)
    }
}

function stopSpellUIUpdate() {
    if (spellUIInterval) {
        clearInterval(spellUIInterval);
        spellUIInterval = null;
    }
}

export function setupPopups() {
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
        btn.addEventListener("click", () => btn.closest(".popup").style.display = "none");
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
    document.querySelector(".resume-btn").addEventListener("click", () => closeAllPopups());

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

export function closeAllPopups(except = null) {
    document.querySelectorAll(".popup").forEach(popup => {
        if (popup !== except) popup.style.display = "none";
    });
}