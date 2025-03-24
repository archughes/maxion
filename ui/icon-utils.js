import { IconGenerator } from '../textures/IconGenerator.js';

const iconGenerator = new IconGenerator();

export function getItemIcon(item, iconSize) {
    const name = item.name.toLowerCase().replace(/\s+/g, '');
    if (iconGenerator.specialItems[item.name]) {
        return iconGenerator.generateSpecialItemIcon(item.name);
    }
    const tierMatch = item.name.match(/^(Wooden|Stone|Iron|Steel|Diamond|Eternium)\s(.+)/i);
    if (tierMatch) {
        const tier = tierMatch[1].toLowerCase();
        const baseName = tierMatch[2].toLowerCase();
        const typeMap = {
            sword: 'sword', staff: 'staff', dagger: 'dagger', bow: 'bow', wand: 'wand',
            shield: 'shield', chestplate: 'chest', helm: 'helm', gloves: 'gloves', ring: 'ring'
        };
        const itemType = typeMap[baseName] || 'sword';
        return iconGenerator.generateItemIcon(itemType, tier, tier, iconSize);
    }
    if (name.includes('potion')) {
        const sizeMatch = name.match(/(small|medium|large)/i);
        const typeMatch = name.match(/(health|mana)/i);
        const size = sizeMatch ? sizeMatch[1].toLowerCase() : 'medium';
        const potionType = typeMatch ? typeMatch[1].toLowerCase() : 'health';
        return iconGenerator.generatePotionIcon(potionType, size, iconSize);
    }
    if (name.includes('ingot') || name.includes('ore')) {
        const material = name.replace(/(ingot|ore)/i, '').trim().toLowerCase();
        const type = name.includes('ingot') ? 'ingot' : 'ore';
        return iconGenerator.generateMaterialIcon(material, type, iconSize);
    }
    return iconGenerator.generateItemIcon('sword', 'iron', 'iron', iconSize);
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
        parchment.setAttribute("width", "50");
        parchment.setAttribute("height", "50");
        parchment.setAttributeNS("http://www.w3.org/1999/xlink", "href", "/textures/parchment-texture-fill.jpg");
        svg.insertBefore(parchment, svg.firstChild);
    }
    return svg;
}