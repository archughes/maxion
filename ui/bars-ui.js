import { player } from '../entity/player.js';

export function updateHealthUI() {
    const healthPercent = (player.health / 100) * 100;
    const healthFill = document.querySelector(".health-fill");
    healthFill.style.width = `${healthPercent}%`;
    if (player.health < 20) {
        healthFill.classList.add("low-health");
    } else {
        healthFill.classList.remove("low-health");
    }
}

export function updateManaUI() {
    const manaPercent = (player.mana / 50) * 100;
    document.querySelector(".mana-fill").style.width = `${manaPercent}%`;
}

export function updateXPUI() {
    const xpPercent = (player.xp / (100 * player.level)) * 100;
    document.querySelector(".xp-fill").style.width = `${xpPercent}%`;
}