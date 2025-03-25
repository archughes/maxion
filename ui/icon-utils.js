import { IconGenerator } from '../textures/IconGenerator.js';
import { cooldownManager } from '../cooldown.js';

const iconGenerator = new IconGenerator();

export function getItemIcon(item, iconSize) {
    const name = item.name.toLowerCase().replace(/\s+/g, '');
    let svg;
    const tierMatch = item.name.match(/^(Wooden|Stone|Iron|Steel|Diamond|Eternium)\s(.+)/i);

    if (iconGenerator.specialItems[item.name]) {
        svg = iconGenerator.generateSpecialItemIcon(item.name);
    } else if (tierMatch) {
        const tier = tierMatch[1].toLowerCase();
        const baseName = tierMatch[2].toLowerCase();
        const typeMap = {
            sword: 'sword', staff: 'staff', dagger: 'dagger', bow: 'bow', wand: 'wand',
            shield: 'shield', chestplate: 'chest', helm: 'helm', gloves: 'gloves', ring: 'ring'
        };
        const itemType = typeMap[baseName] || 'sword';
        svg = iconGenerator.generateItemIcon(itemType, tier, tier, iconSize);
    } else if (name.includes('potion')) {
        const sizeMatch = name.match(/(small|medium|large)/i);
        const typeMatch = name.match(/(health|mana)/i);
        const size = sizeMatch ? sizeMatch[1].toLowerCase() : 'medium';
        const potionType = typeMatch ? typeMatch[1].toLowerCase() : 'health';
        svg = iconGenerator.generatePotionIcon(potionType, size, iconSize);
    } else if (name.includes('ingot') || name.includes('ore')) {
        const material = name.replace(/(ingot|ore)/i, '').trim().toLowerCase();
        const type = name.includes('ingot') ? 'ingot' : 'ore';
        svg = iconGenerator.generateMaterialIcon(material, type, iconSize);
    } else {
        svg = iconGenerator.generateItemIcon('sword', 'iron', 'iron', iconSize);
    }
    return applyIconStyles(svg, item, iconSize);
}

export function getSpellIcon(action, iconSize, setBackground = false) {
    const svg = iconGenerator.generateSpellIcon(action.name.toLowerCase(), 'novice', iconSize);
    svg.setAttribute("width", iconSize);
    svg.setAttribute("height", iconSize);
    svg.setAttribute("viewBox", `0 0 ${iconSize} ${iconSize}`);
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.style.border = "2px solid #8B4513";
    svg.style.borderRadius = "4px";

    if (setBackground) {
        const parchment = document.createElementNS("http://www.w3.org/2000/svg", "image");
        parchment.setAttribute("x", "0");
        parchment.setAttribute("y", "0");
        parchment.setAttribute("width", iconSize);
        parchment.setAttribute("height", iconSize);
        parchment.setAttributeNS("http://www.w3.org/1999/xlink", "href", "/textures/parchment-texture-fill.jpg");
        svg.insertBefore(parchment, svg.firstChild);
    }
    return applyIconStyles(svg, action, iconSize);
}

function applyIconStyles(svg, entity, iconSize) {
    svg.setAttribute("width", iconSize);
    svg.setAttribute("height", iconSize);
    svg.setAttribute("viewBox", `0 0 ${iconSize} ${iconSize}`);
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.style.border = "2px solid #8B4513";
    svg.style.borderRadius = "4px";

    const wrapper = document.createElement("div");
    wrapper.classList.add("icon-with-cooldown");
    wrapper.style.position = "relative";
    wrapper.style.width = `${iconSize}px`;
    wrapper.style.height = `${iconSize}px`;
    wrapper.appendChild(svg);

    const cooldownEntity = cooldownManager.getEntity(entity.name);
    if (cooldownEntity && cooldownEntity.isOnCooldown()) {
        wrapper.style.setProperty('--cooldown-percent', `${cooldownEntity.getCooldownPercent()}%`);
    } else {
        wrapper.style.setProperty('--cooldown-percent', '0%');
    }

    // Check if entity is a spell (has range or manaCost properties) and apply out-of-range/mana overlay
    if (entity.range || entity.manaCost) { // Assuming spells have range or manaCost, items typically don't
        const player = window.player; // Assuming player is globally accessible
        if (!player) {
            console.warn('Player object not found, assuming out of range/mana');
            wrapper.setAttribute('data-out-of-range-or-mana', 'true');
            return wrapper;
        }
        const hasEnoughMana = player && entity.manaCost ? player.mana >= entity.manaCost : true;
        const target = player && player.selectedTarget;
        const distanceToTarget = target ? player.object.position.distanceTo(target.object.position) : -Infinity;
        const isInRange = distanceToTarget <= entity.range;

        // console.log(`Spell: ${entity.name}, Mana: ${player.mana}/${entity.manaCost}, Range: ${distanceToTarget}/${entity.range}, In Range: ${isInRange}, Enough Mana: ${hasEnoughMana}`);

        if (!hasEnoughMana || !isInRange) {
            wrapper.setAttribute('data-out-of-range-or-mana', 'true');
        } else {
            wrapper.setAttribute('data-out-of-range-or-mana', 'false');
        }
    } else {
        // For items, ensure no overlay is applied
        wrapper.setAttribute('data-out-of-range-or-mana', 'false');
    }

    return wrapper;
}