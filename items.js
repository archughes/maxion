import { player } from './entity/player.js';
import { CooldownEntity, cooldownManager } from './cooldown.js';

class Item extends CooldownEntity {
    constructor(data) {
        super(data.cooldown);
        this.name = data.name;
        this.type = data.type;
        this.stackSize = data.stackSize || 1;
        this.isUsable = data.usable || false;
        cooldownManager.register(this, this.name);
    }
}

class WeaponItem extends Item {
    constructor(data) {
        super(data);
        this.damage = data.damage || data.baseDamage;
        this.damageType = data.damageType || 'physical';
        this.critChance = data.critChance || 0.05;
        this.attackSpeed = data.attackSpeed || 1.0;
        this.upgradeable = data.upgradeable || false;
    }
}

class ArmorItem extends Item {
    constructor(data) {
        super(data);
        this.defense = data.defense;
        this.defenseType = data.defenseType || 'physical';
        this.slot = data.slot;
        this.setBonus = data.setBonus;
        this.upgradeable = data.upgradeable || false;
    }
}

class MaterialItem extends Item {
    constructor(data) {
        super(data);
        this.smeltsInto = data.smeltsInto;
    }
}

class ConsumableItem extends Item {
    constructor(data) {
        super(data);
        this.health = data.health || 0;
        this.mana = data.mana || 0;
        this.consumableItem = true;
        this.isUsable = data.usable || true;
    }
}

// Define tiers for dynamic generation
const tiers = [
    { name: "Wooden", material: "Wood", damageMultiplier: 0.5, materialMultiplier: 1.0 },
    { name: "Stone", material: "Stone", damageMultiplier: 0.75, materialMultiplier: 1.25 },
    { name: "Iron", material: "Iron Ingot", damageMultiplier: 1.0, materialMultiplier: 1.5, requires: "Iron Ingot Recipe" },
    { name: "Steel", material: "Steel Ingot", damageMultiplier: 1.25, materialMultiplier: 1.75, requires: "Steel Ingot Recipe" },
    { name: "Diamond", material: "Polished Diamond", damageMultiplier: 1.5, materialMultiplier: 2.0, requires: "Polished Ingot Recipe" },
    { name: "Eternium", material: "Eternium Ingot", damageMultiplier: 2.0, materialMultiplier: 2.25, requires: "Eternium Ingot Recipe" }
];

const potionTiers = {
    health: {
        tiers: ["Small", "Medium", "Large"],
        baseMaterials: ["Water", "Milkweed"],
        upgradeMaterials: ["Sunflower", "Berry"],
        multipliers: [1, 2, 3]
    },
    mana: {
        tiers: ["Small", "Medium", "Large"],
        baseMaterials: ["Water", "Sunflower"],
        upgradeMaterials: ["Milkweed", "Holy Water"],
        multipliers: [1, 2, 3]
    }
};

// Load base items, materials, and unique items
let items = [];
let recipes = {};

async function loadItems() {
    const response = await fetch('./data/items.json');
    items = await response.json();
}

async function loadRecipes() {
    const response = await fetch('./data/recipes.json');
    const baseRecipes = await response.json();
    
    // Generate tiered recipes
    recipes = generateTieredRecipes(baseRecipes);
    
    // Generate potion recipes
    generatePotionRecipes();
    console.log("Generated recipes:", recipes);
}

// Generate tiered items dynamically
function generateTieredItem(baseItem, tierName, enhanced = false) {
    const tier = tiers.find(t => t.name === tierName);
    if (!tier || !baseItem) return null;

    const itemData = { ...baseItem };
    itemData.name = `${enhanced ? 'Enhanced ' : ''}${tier.name} ${baseItem.name}`;
    let damage = baseItem.baseDamage * tier.damageMultiplier;
    if (enhanced) damage += 2; // Bonus for enhanced items
    itemData.damage = Math.round(damage);

    return new WeaponItem(itemData); // Return an instance
}

function generateTieredRecipes(baseRecipes) {
    const generated = {...baseRecipes};
    
    // Process base item recipes
    Object.entries(baseRecipes).forEach(([recipeName, recipe]) => {
        if(recipe.baseItem) {
            tiers.forEach(tier => {
                const tieredRecipe = {
                    baseItem: recipe.baseItem,
                    tier: tier.name,
                    required: {
                        [tier.material]: Math.round(recipe.requiredAmount * tier.materialMultiplier)
                    }
                };
                
                if(tier.requires) {
                    tieredRecipe.required[tier.requires] = 1;
                }
                
                generated[`${tier.name} ${recipe.baseItem} Recipe`] = tieredRecipe;
            });
        }
    });
    
    return generated;
}

function generatePotionRecipes() {
    Object.entries(potionTiers).forEach(([potionType, config]) => {
        config.tiers.forEach((tier, index) => {
            const recipeName = `${tier} ${potionType.charAt(0).toUpperCase() + potionType.slice(1)} Potion Recipe`;
            
            const requirements = {};
            config.baseMaterials.forEach(mat => {
                requirements[mat] = config.multipliers[index];
            });
            
            if(index > 0) {
                config.upgradeMaterials.forEach((mat, idx) => {
                    if(idx < index) requirements[mat] = config.multipliers[index];
                });
            }
            
            recipes[recipeName] = {
                potionType,
                tier,
                required: requirements,
                result: `${tier} ${potionType.charAt(0).toUpperCase() + potionType.slice(1)} Potion`
            };
        });
    });
}

// Get the result item from a recipe
function getRecipeResult(recipe) {
    if(recipe.baseItem && recipe.tier) {
        const baseItem = items.find(i => i.name === recipe.baseItem);
        const tier = tiers.find(t => t.name === recipe.tier);
        return createTieredItem(baseItem, tier);
    }
    else if(recipe.potionType) {
        return items.find(i => i.name === recipe.result);
    }
    return items.find(i => i.name === recipe.result);
}

function createTieredItem(baseItem, tier) {
    const itemData = items.find(i => i.name === baseItem.name);
    const newItem = new itemData.constructor(itemData);
    
    newItem.name = `${tier.name} ${baseItem.name}`;
    if(newItem.damage) {
        newItem.damage = Math.round(baseItem.damage * tier.damageMultiplier);
    }
    if(newItem.defense) {
        newItem.defense = Math.round(baseItem.defense * tier.damageMultiplier);
    }
    return newItem;
}

function craftItem(recipeName) {
    const recipe = recipes[recipeName];
    if (!recipe) return console.error("Recipe not found:", recipeName);

    // Check if player has required items
    let canCraft = true;
    for (const [reqItemName, amount] of Object.entries(recipe.required)) {
        const reqItem = player.inventory.find(item => item.name === reqItemName) ||
                        player.bags[0].items.find(item => item.name === reqItemName);
        const requiredAmount = Number(amount); // Ensure amount is a number
        if (isNaN(requiredAmount)) {
            console.error(`Invalid amount for ${reqItemName} in recipe ${recipeName}: ${amount}`);
            canCraft = false;
            break;
        }
        if (!reqItem || (reqItem.amount || 0) < requiredAmount) {
            canCraft = false;
            break;
        }
    }

    if (canCraft) {
        // Deduct required items
        for (const [reqItemName, amount] of Object.entries(recipe.required)) {
            const requiredAmount = Number(amount);
            const reqItem = player.inventory.find(item => item.name === reqItemName) ||
                           player.bags[0].items.find(item => item.name === reqItemName);
            reqItem.amount = reqItem.amount !== undefined ? reqItem.amount : 0; // Initialize if undefined
            reqItem.amount -= requiredAmount;
            console.log(`Deducted ${requiredAmount} of ${reqItemName}, remaining: ${reqItem.amount}`);
            if (reqItem.amount <= 0) {
                const container = player.inventory.includes(reqItem) ? player.inventory : player.bags[0].items;
                const index = container.indexOf(reqItem);
                if (index !== -1) {
                    container.splice(index, 1);
                    console.log(`Removed ${reqItemName} from ${container === player.inventory ? 'inventory' : 'bag'}`);
                }
            }
        }
        // Generate and add the result item
        const resultItem = getRecipeResult(recipe);
        if (resultItem) {
            if (resultItem.amount === undefined) resultItem.amount = 1;
            player.addItem(resultItem);
            console.log(`Crafted ${resultItem.name}!`);
            console.log(`  Craft type: ${resultItem.type}!`);
        } else {
            console.log("Failed to generate crafted item!");
        }
    } else {
        console.log("Insufficient resources!");
    }
}

function useItem(item) {
    if ((item.type === "consumable" || item.isUsable) && !item.isOnCooldown()) {
        if (item.health) player.heal(item.health);
        if (item.mana) player.regenerateMana(item.mana);
        if (item.consumableItem) player.removeItem(item);
        item.startCooldown();
    }
}

export { items, recipes, useItem, craftItem, Item, WeaponItem, ConsumableItem, loadItems, loadRecipes };