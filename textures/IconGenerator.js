/**
 * Medieval RPG Icon Generator
 * Procedurally generates SVG icons for different game elements based on their properties
 */

class IconGenerator {
    constructor() {
      // Color palettes
      this.palettes = {
        wood: ['#8B4513', '#A0522D', '#CD853F'],
        stone: ['#808080', '#A9A9A9', '#D3D3D3'],
        iron: ['#708090', '#778899', '#B0C4DE'],
        steel: ['#4682B4', '#5F9EA0', '#ADD8E6'],
        diamond: ['#87CEEB', '#00BFFF', '#1E90FF'],
        eternium: ['#9932CC', '#8A2BE2', '#9370DB'],
        fire: ['#FF4500', '#FF8C00', '#FFA500'],
        ice: ['#F0F8FF', '#E0FFFF', '#B0E0E6'],
        nature: ['#32CD32', '#228B22', '#006400'],
        arcane: ['#BA55D3', '#9370DB', '#8A2BE2'],
        holy: ['#FFD700', '#FFFF00', '#F0E68C'],
        shadow: ['#2F4F4F', '#4B0082', '#191970'],
        health: ['#FF6347', '#FF0000', '#B22222'],
        mana: ['#1E90FF', '#0000FF', '#00008B'],
        speed: ['#00FF00', '#32CD32', '#008000'],
        strength: ['#A52A2A', '#8B0000', '#800000'],
        invisibility: ['#F5F5F5', '#DCDCDC', '#C0C0C0'],
        plant: ['#228B22', '#32CD32', '#7CFC00']
      };

      this.ranks = {
        starter: 0,  // Basic shape
        wood: 1,     // Add trim
        stone: 2,    // Add buttons/bolts
        iron: 3,     // Add engravings
        steel: 4,    // Add gems
        diamond: 5,  // Add patterns
        eternium: 6  // Add glow + extra details
      };
  
      // Item shapes by type
      this.itemShapes = {
        sword: (x, y, size, colors, rank) => this.drawSword(x, y, size, colors, rank),
        staff: (x, y, size, colors, rank) => this.drawStaff(x, y, size, colors, rank),
        dagger: (x, y, size, colors, rank) => this.drawDagger(x, y, size, colors, rank),
        bow: (x, y, size, colors, rank) => this.drawBow(x, y, size, colors, rank),
        wand: (x, y, size, colors, rank) => this.drawWand(x, y, size, colors, rank),
        shield: (x, y, size, colors, rank) => this.drawShield(x, y, size, colors, rank),
        chest: (x, y, size, colors, rank) => this.drawChest(x, y, size, colors, rank),
        helm: (x, y, size, colors, rank) => this.drawHelm(x, y, size, colors, rank),
        gloves: (x, y, size, colors, rank) => this.drawGloves(x, y, size, colors, rank),
        ring: (x, y, size, colors, rank) => this.drawRing(x, y, size, colors, rank),
        ingot: (x, y, size, colors, rank) => this.drawIngot(x, y, size, colors, rank),
        ore: (x, y, size, colors, rank) => this.drawOre(x, y, size, colors, rank),
        potion: (x, y, size, colors, rank) => this.drawPotion(x, y, size, colors, rank)
      };
  
      // Spell shapes by type
      this.spellShapes = {
        attack: (x, y, size, colors) => this.drawAttackSpell(x, y, size, colors),
        fire: (x, y, size, colors) => this.drawFireSpell(x, y, size, colors),
        invisibility: (x, y, size, colors) => this.drawInvisibilitySpell(x, y, size, colors),
        ice: (x, y, size, colors) => this.drawIceSpell(x, y, size, colors),
        nature: (x, y, size, colors) => this.drawNatureSpell(x, y, size, colors),
        arcane: (x, y, size, colors) => this.drawArcaneSpell(x, y, size, colors),
        holy: (x, y, size, colors) => this.drawHolySpell(x, y, size, colors),
        shadow: (x, y, size, colors) => this.drawShadowSpell(x, y, size, colors)
      };
  
      // Plant shapes
      this.plantShapes = {
        milkweed: (x, y, size, colors) => this.drawMilkweed(x, y, size, colors),
        sunflower: (x, y, size, colors) => this.drawSunflower(x, y, size, colors),
        berry: (x, y, size, colors) => this.drawBerry(x, y, size, colors),
        pumpkin: (x, y, size, colors) => this.drawPumpkin(x, y, size, colors),
        flower: (x, y, size, colors) => this.drawFlower(x, y, size, colors),
        snowball: (x, y, size, colors) => this.drawSnowball(x, y, size, colors),
        cactusSpine: (x, y, size, colors) => this.drawCactusSpine(x, y, size, colors),
        charcoal: (x, y, size, colors) => this.drawCharcoal(x, y, size, colors),
        redCoral: (x, y, size, colors) => this.drawRedCoral(x, y, size, colors),
        blueCoral: (x, y, size, colors) => this.drawBlueCoral(x, y, size, colors),
        seaweed: (x, y, size, colors) => this.drawSeaweed(x, y, size, colors),
        iceCrystal: (x, y, size, colors) => this.drawIceCrystal(x, y, size, colors),
        holyWater: (x, y, size, colors) => this.drawHolyWater(x, y, size, colors),
        dragonScale: (x, y, size, colors) => this.drawDragonScale(x, y, size, colors)
      };
  
      // Special item definitions
      this.specialItems = {
        'Dragon Plate Armor': {
          type: 'chest',
          colors: this.getColorVariation('fire', 'eternium')
        },
        'Frost Bow': {
          type: 'bow',
          colors: this.getColorVariation('ice', 'diamond')
        },
        'Phoenix Potion': {
          type: 'potion',
          colors: this.getColorVariation('fire', 'health')
        },
        'Enchanted Staff': {
          type: 'staff',
          colors: this.getColorVariation('arcane', 'eternium')
        },
        'Bandit Chestplate': {
          type: 'chest',
          colors: this.getColorVariation('shadow', 'iron')
        }
      };
  
    //   // Ranks with quality modifiers
    //   this.ranks = {
    //     starter: 0.7,
    //     wood: 0.8,
    //     stone: 0.9,
    //     iron: 1.0,
    //     steel: 1.1,
    //     diamond: 1.2,
    //     eternium: 1.3
    //   };
  
      // Potion sizes with size modifiers
      this.potionSizes = {
        small: 0.7,
        medium: 1.0,
        large: 1.3
      };
  
      // Spell power levels with effect intensity modifiers
      this.spellLevels = {
        novice: 0.7,
        apprentice: 0.9,
        adept: 1.1,
        master: 1.3,
        grandmaster: 1.5
      };
    }
  
    // Get color variation by blending two palettes
    getColorVariation(primary, secondary = null) {
      if (!secondary) return this.palettes[primary];
      
      const primaryColors = this.palettes[primary];
      const secondaryColors = this.palettes[secondary];
      
      return primaryColors.map((color, index) => {
        return this.blendColors(color, secondaryColors[index], 0.5);
      });
    }
  
    // Blend two hex colors
    blendColors(color1, color2, ratio) {
      const r1 = parseInt(color1.substring(1, 3), 16);
      const g1 = parseInt(color1.substring(3, 5), 16);
      const b1 = parseInt(color1.substring(5, 7), 16);
      
      const r2 = parseInt(color2.substring(1, 3), 16);
      const g2 = parseInt(color2.substring(3, 5), 16);
      const b2 = parseInt(color2.substring(5, 7), 16);
      
      const r = Math.round(r1 * (1 - ratio) + r2 * ratio);
      const g = Math.round(g1 * (1 - ratio) + g2 * ratio);
      const b = Math.round(b1 * (1 - ratio) + b2 * ratio);
      
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
  
    // Generate an item icon
    generateItemIcon(itemType, material, rank = 'iron', size = 64) {
        const rankLevel = this.ranks[rank] || 3; // Default to iron if invalid
        const colors = this.getColorVariation(material);
        
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", size);
        svg.setAttribute("height", size);
        svg.setAttribute("viewBox", "0 0 64 64");
        
        const shapeFunc = this.itemShapes[itemType];
        let elements = [];
        if (shapeFunc) {
            elements = shapeFunc(32, 32, 32, colors, rankLevel); // Fixed size, rank controls details
            elements.forEach(el => svg.appendChild(el));
        }
    
        // Apply glow effect for eternium rank (rankLevel >= 6)
        if (rankLevel >= 6 && elements.length > 0) { // Ensure there’s at least one element to glow
            this.addGlowFilter(elements[0], svg);
        }
        
        // Add rank indicators (optional, if you want to visualize rank)
        this.addRankIndicators(svg, rank, size);
        
        return svg;
    }
  
    // Generate a material icon (ore or ingot)
    generateMaterialIcon(material, type = 'ingot', size = 64) {
      const colors = this.getColorVariation(material);
      
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("width", size);
      svg.setAttribute("height", size);
      svg.setAttribute("viewBox", "0 0 64 64");
      
      const shapeFunc = this.itemShapes[type];
      if (shapeFunc) {
        const elements = shapeFunc(32, 32, 32, colors);
        elements.forEach(el => svg.appendChild(el));
      }
      
      return svg;
    }
  
    // Generate a potion icon
    generatePotionIcon(potionType, size = 'medium', potionSize = 64) {
      const sizeModifier = this.potionSizes[size] || 1.0;
      const colors = this.getColorVariation(potionType);
      
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("width", potionSize);
      svg.setAttribute("height", potionSize);
      svg.setAttribute("viewBox", "0 0 64 64");
      
      const elements = this.drawPotion(32, 32, 32 * sizeModifier, colors, potionType);
      elements.forEach(el => svg.appendChild(el));
      
      // Add size indicators
      this.addSizeIndicators(svg, size, potionSize);
      
      return svg;
    }
  
    // Generate a spell icon
    generateSpellIcon(spellType, level = 'adept', size = 64) {
      const levelModifier = this.spellLevels[level] || 1.0;
      let colors;
      
      // Determine the spell category
      if (spellType.includes('fire') || spellType.includes('burn')) {
        colors = this.getColorVariation('fire');
        spellType = 'fire';
      } else if (spellType.includes('ice') || spellType.includes('frost')) {
        colors = this.getColorVariation('ice');
        spellType = 'ice';
      } else if (spellType.includes('invis')) {
        colors = this.getColorVariation('invisibility');
        spellType = 'invisibility';
      } else if (spellType.includes('nature') || spellType.includes('earth')) {
        colors = this.getColorVariation('nature');
        spellType = 'nature';
      } else if (spellType.includes('arcane') || spellType.includes('magic')) {
        colors = this.getColorVariation('arcane');
        spellType = 'arcane';
      } else if (spellType.includes('holy') || spellType.includes('light')) {
        colors = this.getColorVariation('holy');
        spellType = 'holy';
      } else if (spellType.includes('shadow') || spellType.includes('dark')) {
        colors = this.getColorVariation('shadow');
        spellType = 'shadow';
      } else {
        colors = this.getColorVariation('arcane');
        spellType = 'attack';
      }
      
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("width", size);
      svg.setAttribute("height", size);
      svg.setAttribute("viewBox", "0 0 64 64");
      
      const shapeFunc = this.spellShapes[spellType] || this.spellShapes.attack;
      let elements = [];
      if (shapeFunc) {
        elements = shapeFunc(32, 32, 32 * levelModifier, colors);
        elements.forEach(el => svg.appendChild(el));
      }

      // Apply glow effect for eternium rank (rankLevel >= 6)
      if (levelModifier > 1.3 && elements.length > 0) { // Ensure there’s at least one element to glow
        this.addGlowFilter(elements[0], svg);
    }
      
      // Add level indicators
      this.addLevelIndicators(svg, level, size);
      
      return svg;
    }
  
    generatePlantIcon(plantType, size = 64) {
        let colors;
        
        // Override colors for specific plant types
        switch (plantType.toLowerCase().replace(/\s+/g, '')) {
            case 'holywater':
                colors = this.getColorVariation('holy'); // Use holy palette (#FFD700, #FFFF00, #F0E68C)
                break;
            case 'icecrystal':
                colors = this.getColorVariation('ice'); // Use ice palette (#F0F8FF, #E0FFFF, #B0E0E6)
                break;
            case 'snowball':
                colors = ['#FFFFFF', '#F0F8FF', '#E0FFFF']; // Custom white-to-light-blue palette
                break;
            default:
                colors = this.getColorVariation('plant'); // Default to plant palette
                break;
        }
        
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", size);
        svg.setAttribute("height", size);
        svg.setAttribute("viewBox", "0 0 64 64");
        
        const shapeFunc = this.plantShapes[plantType.replace(/\s+/g, '')];
        if (shapeFunc) {
            const elements = shapeFunc(32, 32, 32, colors);
            elements.forEach(el => svg.appendChild(el));
        } else {
            // Default to generic plant if specific one not found
            const elements = this.drawFlower(32, 32, 32, colors);
            elements.forEach(el => svg.appendChild(el));
        }
        
        return svg;
    }
  
    generateSpecialItemIcon(itemName, size = 64) {
        const itemInfo = this.specialItems[itemName];
        
        if (!itemInfo) {
            console.warn(`Special item "${itemName}" not defined`);
            return this.generateItemIcon('sword', 'steel', 'diamond', size);
        }
        
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", size);
        svg.setAttribute("height", size);
        svg.setAttribute("viewBox", "0 0 64 64");
        
        // Add background aura
        const aura = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        aura.setAttribute("cx", "32");
        aura.setAttribute("cy", "32");
        aura.setAttribute("r", "28");
        aura.setAttribute("fill", itemInfo.colors[2]);
        aura.setAttribute("opacity", "0.3");
        svg.appendChild(aura);
        
        // Enhanced base shape with grandeur
        const shapeFunc = this.itemShapes[itemInfo.type];
        if (shapeFunc) {
            const baseElements = shapeFunc(32, 32, 32 * 1.4, itemInfo.colors);
            baseElements.forEach(el => {
                el.setAttribute("stroke", itemInfo.colors[1]);
                el.setAttribute("stroke-width", "2");
                svg.appendChild(el);
            });
            
            // Add item-specific embellishments
            this.addSpecialEmbellishments(svg, itemName, itemInfo.colors);
        }
        
        // Add animated glow effect, passing aura for animation
        this.addEnhancedGlowEffect(svg, itemInfo.colors, aura);
        
        // Add particle effects
        this.addParticleEffects(svg, itemInfo.colors);
        
        // Add ornate border
        const border = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        border.setAttribute("x", "4");
        border.setAttribute("y", "4");
        border.setAttribute("width", "56");
        border.setAttribute("height", "56");
        border.setAttribute("fill", "none");
        border.setAttribute("stroke", itemInfo.colors[0]);
        border.setAttribute("stroke-width", "2");
        border.setAttribute("rx", "8");
        svg.appendChild(border);
        
        return svg;
    }
    
    // Enhanced glow effect with animation
    addEnhancedGlowEffect(svg, colors, aura) {
        const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
        filter.setAttribute("id", "enhancedGlow");
        
        const blur = document.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
        blur.setAttribute("stdDeviation", "3");
        blur.setAttribute("result", "blur");
        filter.appendChild(blur);
        
        const colorMatrix = document.createElementNS("http://www.w3.org/2000/svg", "feColorMatrix");
        colorMatrix.setAttribute("in", "blur");
        colorMatrix.setAttribute("type", "matrix");
        colorMatrix.setAttribute("values", "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7");
        colorMatrix.setAttribute("result", "glow");
        filter.appendChild(colorMatrix);
        
        const merge = document.createElementNS("http://www.w3.org/2000/svg", "feMerge");
        ['glow', 'SourceGraphic'].forEach(input => {
            const node = document.createElementNS("http://www.w3.org/2000/svg", "feMergeNode");
            node.setAttribute("in", input);
            merge.appendChild(node);
        });
        filter.appendChild(merge);
        
        svg.appendChild(filter);
        
        // Add animation to aura
        const animate = document.createElementNS("http://www.w3.org/2000/svg", "animate");
        animate.setAttribute("attributeName", "opacity");
        animate.setAttribute("values", "0.3;0.6;0.3"); // Adjusted for better visibility
        animate.setAttribute("dur", "2s");
        animate.setAttribute("repeatCount", "indefinite");
        aura.appendChild(animate);
        
        // Apply glow to main elements (skipping aura and border)
        for (let i = 1; i < svg.childNodes.length - 2; i++) {
            svg.childNodes[i].setAttribute("filter", "url(#enhancedGlow)");
        }
    }
    
    // New helper method for item-specific embellishments
    addSpecialEmbellishments(svg, itemName, colors) {
        const embellishments = {
            'Dragon Plate Armor': () => {
                const scales = document.createElementNS("http://www.w3.org/2000/svg", "path");
                scales.setAttribute("d", "M 20 48 Q 32 52, 44 48 Q 38 54, 32 56 Q 26 54, 20 48");
                scales.setAttribute("fill", colors[1]);
                scales.setAttribute("opacity", "0.8");
                return scales;
            },
            'Frost Bow': () => {
                const ice = document.createElementNS("http://www.w3.org/2000/svg", "path");
                ice.setAttribute("d", "M 24 16 L 28 12 L 32 16 L 36 12 L 40 16");
                ice.setAttribute("stroke", colors[2]);
                ice.setAttribute("stroke-width", "2");
                return ice;
            },
            'Phoenix Potion': () => {
                const feather = document.createElementNS("http://www.w3.org/2000/svg", "path");
                feather.setAttribute("d", "M 32 20 Q 40 28, 32 36 Q 24 28, 32 20");
                feather.setAttribute("fill", colors[0]);
                return feather;
            },
            'Enchanted Staff': () => {
                const runes = document.createElementNS("http://www.w3.org/2000/svg", "path");
                runes.setAttribute("d", "M 28 40 L 36 40 M 30 44 L 34 44 M 32 48 L 32 52");
                runes.setAttribute("stroke", colors[2]);
                runes.setAttribute("stroke-width", "2");
                return runes;
            },
            'Bandit Chestplate': () => {
                const skull = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                skull.setAttribute("cx", "32");
                skull.setAttribute("cy", "24");
                skull.setAttribute("r", "4");
                skull.setAttribute("fill", colors[1]);
                return skull;
            }
        };
        
        const embellishFunc = embellishments[itemName];
        if (embellishFunc) {
            svg.appendChild(embellishFunc());
        }
    }
    
    // Add particle effects
    addParticleEffects(svg, colors) {
        const particles = [];
        for (let i = 0; i < 5; i++) {
            const particle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            const angle = (i * 72) * Math.PI / 180;
            const radius = 28;
            
            particle.setAttribute("cx", 32 + Math.cos(angle) * radius);
            particle.setAttribute("cy", 32 + Math.sin(angle) * radius);
            particle.setAttribute("r", "2");
            particle.setAttribute("fill", colors[1]);
            
            // Add animation
            const animate = document.createElementNS("http://www.w3.org/2000/svg", "animate");
            animate.setAttribute("attributeName", "opacity");
            animate.setAttribute("values", "0;1;0");
            animate.setAttribute("dur", `${1 + i * 0.2}s`);
            animate.setAttribute("repeatCount", "indefinite");
            particle.appendChild(animate);
            
            particles.push(particle);
        }
        particles.forEach(p => svg.appendChild(p));
    }
  
    // Add rank indicators to an icon
    addRankIndicators(svg, rank, size) {
      const rankOrder = ['starter', 'wood', 'stone', 'iron', 'steel', 'diamond', 'eternium'];
      const rankIndex = rankOrder.indexOf(rank);
      
      if (rankIndex >= 0) {
        // Add dots at the bottom to indicate rank
        for (let i = 0; i <= rankIndex; i++) {
          const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          dot.setAttribute("cx", 10 + i * 8);
          dot.setAttribute("cy", size - 5);
          dot.setAttribute("r", 2);
          dot.setAttribute("fill", "#FFD700");
          svg.appendChild(dot);
        }
      }
    }
  
    // Add size indicators to a potion
    addSizeIndicators(svg, size, potionSize) {
      const sizeOrder = ['small', 'medium', 'large'];
      const sizeIndex = sizeOrder.indexOf(size);
      
      if (sizeIndex >= 0) {
        // Add lines at the bottom to indicate size
        for (let i = 0; i <= sizeIndex; i++) {
          const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
          line.setAttribute("x1", 10 + i * 8);
          line.setAttribute("y1", potionSize - 5);
          line.setAttribute("x2", 16 + i * 8);
          line.setAttribute("y2", potionSize - 5);
          line.setAttribute("stroke", "#FFD700");
          line.setAttribute("stroke-width", 2);
          svg.appendChild(line);
        }
      }
    }
  
    // Add level indicators to a spell
    addLevelIndicators(svg, level, size) {
      const levelOrder = ['novice', 'apprentice', 'adept', 'master', 'grandmaster'];
      const levelIndex = levelOrder.indexOf(level);
      
      if (levelIndex >= 0) {
        // Add stars at the bottom to indicate level
        for (let i = 0; i <= levelIndex; i++) {
          const star = this.createStar(10 + i * 10, size - 5, 3);
          star.setAttribute("fill", "#FFD700");
          svg.appendChild(star);
        }
      }
    }
  
    // Add special effect glow to special items
    addSpecialEffectGlow(svg, size) {
      const glow = document.createElementNS("http://www.w3.org/2000/svg", "filter");
      glow.setAttribute("id", "glow");
      
      const feGaussianBlur = document.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
      feGaussianBlur.setAttribute("stdDeviation", "2");
      feGaussianBlur.setAttribute("result", "blur");
      glow.appendChild(feGaussianBlur);
      
      const feColorMatrix = document.createElementNS("http://www.w3.org/2000/svg", "feColorMatrix");
      feColorMatrix.setAttribute("in", "blur");
      feColorMatrix.setAttribute("type", "matrix");
      feColorMatrix.setAttribute("values", "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7");
      feColorMatrix.setAttribute("result", "glow");
      glow.appendChild(feColorMatrix);
      
      const feMerge = document.createElementNS("http://www.w3.org/2000/svg", "feMerge");
      
      const feMergeNode1 = document.createElementNS("http://www.w3.org/2000/svg", "feMergeNode");
      feMergeNode1.setAttribute("in", "glow");
      feMerge.appendChild(feMergeNode1);
      
      const feMergeNode2 = document.createElementNS("http://www.w3.org/2000/svg", "feMergeNode");
      feMergeNode2.setAttribute("in", "SourceGraphic");
      feMerge.appendChild(feMergeNode2);
      
      glow.appendChild(feMerge);
      
      svg.appendChild(glow);
      
      // Add effect to first element
      if (svg.childNodes.length > 1) {
        svg.childNodes[1].setAttribute("filter", "url(#glow)");
      }
    }
  
    // Create a star shape
    createStar(cx, cy, r) {
      const points = [];
      for (let i = 0; i < 5; i++) {
        // Outer points
        const x1 = cx + r * Math.cos((i * 72 - 18) * Math.PI / 180);
        const y1 = cy + r * Math.sin((i * 72 - 18) * Math.PI / 180);
        points.push(`${x1},${y1}`);
        
        // Inner points
        const x2 = cx + r/2 * Math.cos((i * 72 + 18) * Math.PI / 180);
        const y2 = cy + r/2 * Math.sin((i * 72 + 18) * Math.PI / 180);
        points.push(`${x2},${y2}`);
      }
      
      const star = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      star.setAttribute("points", points.join(' '));
      return star;
    }
  
    // Drawing methods for different item types
    drawSword(x, y, size, colors, rank) {
        const elements = [];
        
        // Blade
        const blade = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        blade.setAttribute("points", `${x},${y-size/2} ${x-size/8},${y+size/4} ${x+size/8},${y+size/4}`);
        blade.setAttribute("fill", colors[0]);
        elements.push(blade);

        // Guard
        const guard = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        guard.setAttribute("x", x - size/4);
        guard.setAttribute("y", y + size/4 - size/20);
        guard.setAttribute("width", size/2);
        guard.setAttribute("height", size/10);
        guard.setAttribute("fill", colors[1]);
        elements.push(guard);

        // Handle
        const handle = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        handle.setAttribute("x", x - size/10);
        handle.setAttribute("y", y + size/4);
        handle.setAttribute("width", size/5);
        handle.setAttribute("height", size/2);
        handle.setAttribute("fill", colors[2]);
        elements.push(handle);

        // Rank-based details
        if (rank >= 1) { // Wood: Trim
            const trim = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            trim.setAttribute("x", x - size/12);
            trim.setAttribute("y", y + size/4);
            trim.setAttribute("width", size/6);
            trim.setAttribute("height", size/20);
            trim.setAttribute("fill", colors[1]);
            elements.push(trim);
        }
        if (rank >= 2) { // Stone: Bolts
            const bolt = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            bolt.setAttribute("cx", x);
            bolt.setAttribute("cy", y + size/4);
            bolt.setAttribute("r", size/20);
            bolt.setAttribute("fill", colors[2]);
            elements.push(bolt);
        }
        if (rank >= 3) { // Iron: Engraving
            const engraving = document.createElementNS("http://www.w3.org/2000/svg", "path");
            engraving.setAttribute("d", `M ${x} ${y-size/3} L ${x} ${y}`);
            engraving.setAttribute("stroke", colors[1]);
            engraving.setAttribute("stroke-width", size/30);
            elements.push(engraving);
        }
        if (rank >= 4) { // Steel: Gem
            const gem = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            gem.setAttribute("cx", x);
            gem.setAttribute("cy", y + size/2);
            gem.setAttribute("r", size/15);
            gem.setAttribute("fill", colors[0]);
            elements.push(gem);
        }
        if (rank >= 5) { // Diamond: Pattern
            const pattern = document.createElementNS("http://www.w3.org/2000/svg", "path");
            pattern.setAttribute("d", `M ${x-size/10} ${y-size/4} L ${x+size/10} ${y-size/4}`);
            pattern.setAttribute("stroke", colors[2]);
            pattern.setAttribute("stroke-width", size/30);
            elements.push(pattern);
        }

        return elements;
    }

    drawStaff(x, y, size, colors, rank) {
        const elements = [];
        
        // Stick
        const stick = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        stick.setAttribute("x", x - size/15);
        stick.setAttribute("y", y - size/2);
        stick.setAttribute("width", size/7.5);
        stick.setAttribute("height", size);
        stick.setAttribute("fill", colors[2]);
        elements.push(stick);

        // Orb
        const orb = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        orb.setAttribute("cx", x);
        orb.setAttribute("cy", y - size/2 + size/6);
        orb.setAttribute("r", size/6);
        orb.setAttribute("fill", colors[0]);
        elements.push(orb);

        // Rank-based details
        if (rank >= 1) { // Trim
            const trim = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            trim.setAttribute("x", x - size/12);
            trim.setAttribute("y", y + size/3);
            trim.setAttribute("width", size/6);
            trim.setAttribute("height", size/20);
            trim.setAttribute("fill", colors[1]);
            elements.push(trim);
        }
        if (rank >= 2) { // Bands
            const band = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            band.setAttribute("x", x - size/12);
            band.setAttribute("y", y);
            band.setAttribute("width", size/6);
            band.setAttribute("height", size/20);
            band.setAttribute("fill", colors[1]);
            elements.push(band);
        }
        if (rank >= 3) { // Runes
            const rune = document.createElementNS("http://www.w3.org/2000/svg", "path");
            rune.setAttribute("d", `M ${x} ${y-size/3} L ${x} ${y-size/6}`);
            rune.setAttribute("stroke", colors[1]);
            rune.setAttribute("stroke-width", size/30);
            elements.push(rune);
        }
        if (rank >= 4) { // Gem
            const gem = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            gem.setAttribute("cx", x);
            gem.setAttribute("cy", y + size/6);
            gem.setAttribute("r", size/15);
            gem.setAttribute("fill", colors[0]);
            elements.push(gem);
        }
        if (rank >= 5) { // Spiral
            const spiral = document.createElementNS("http://www.w3.org/2000/svg", "path");
            spiral.setAttribute("d", `M ${x} ${y} Q ${x-size/6} ${y+size/6}, ${x} ${y+size/3}`);
            spiral.setAttribute("stroke", colors[2]);
            spiral.setAttribute("stroke-width", size/30);
            elements.push(spiral);
        }

        return elements;
    }

    drawDagger(x, y, size, colors, rank) {
        const elements = [];
        
        // Blade
        const blade = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        blade.setAttribute("points", `${x},${y-size/4} ${x-size/10},${y+size/8} ${x+size/10},${y+size/8}`);
        blade.setAttribute("fill", colors[0]);
        elements.push(blade);

        // Guard
        const guard = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        guard.setAttribute("x", x - size/6);
        guard.setAttribute("y", y + size/8 - size/30);
        guard.setAttribute("width", size/3);
        guard.setAttribute("height", size/15);
        guard.setAttribute("fill", colors[1]);
        elements.push(guard);

        // Handle
        const handle = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        handle.setAttribute("x", x - size/12);
        handle.setAttribute("y", y + size/8);
        handle.setAttribute("width", size/6);
        handle.setAttribute("height", size/3);
        handle.setAttribute("fill", colors[2]);
        elements.push(handle);

        if (rank >= 1) { // Trim
            const trim = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            trim.setAttribute("x", x - size/15);
            trim.setAttribute("y", y + size/3);
            trim.setAttribute("width", size/7.5);
            trim.setAttribute("height", size/20);
            trim.setAttribute("fill", colors[1]);
            elements.push(trim);
        }
        if (rank >= 2) { // Bolt
            const bolt = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            bolt.setAttribute("cx", x);
            bolt.setAttribute("cy", y + size/8);
            bolt.setAttribute("r", size/25);
            bolt.setAttribute("fill", colors[2]);
            elements.push(bolt);
        }
        if (rank >= 3) { // Engraving
            const engraving = document.createElementNS("http://www.w3.org/2000/svg", "path");
            engraving.setAttribute("d", `M ${x} ${y-size/6} L ${x} ${y}`);
            engraving.setAttribute("stroke", colors[1]);
            engraving.setAttribute("stroke-width", size/30);
            elements.push(engraving);
        }
        if (rank >= 4) { // Gem
            const gem = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            gem.setAttribute("cx", x);
            gem.setAttribute("cy", y + size/3);
            gem.setAttribute("r", size/15);
            gem.setAttribute("fill", colors[0]);
            elements.push(gem);
        }
        if (rank >= 5) { // Pattern
            const pattern = document.createElementNS("http://www.w3.org/2000/svg", "path");
            pattern.setAttribute("d", `M ${x-size/12} ${y-size/8} L ${x+size/12} ${y-size/8}`);
            pattern.setAttribute("stroke", colors[2]);
            pattern.setAttribute("stroke-width", size/30);
            elements.push(pattern);
        }

        return elements;
    }

    drawBow(x, y, size, colors, rank) {
        const elements = [];
        
        // Arc
        const arc = document.createElementNS("http://www.w3.org/2000/svg", "path");
        arc.setAttribute("d", `M ${x-size/4} ${y-size/3} Q ${x-size/2} ${y}, ${x-size/4} ${y+size/3}`);
        arc.setAttribute("fill", "none");
        arc.setAttribute("stroke", colors[2]);
        arc.setAttribute("stroke-width", size/15);
        elements.push(arc);

        // String
        const string = document.createElementNS("http://www.w3.org/2000/svg", "line");
        string.setAttribute("x1", x - size/4);
        string.setAttribute("y1", y - size/3);
        string.setAttribute("x2", x - size/4);
        string.setAttribute("y2", y + size/3);
        string.setAttribute("stroke", colors[1]);
        string.setAttribute("stroke-width", size/50);
        elements.push(string);

        if (rank >= 1) { // Trim
            const trim = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            trim.setAttribute("x", x - size/3);
            trim.setAttribute("y", y - size/3);
            trim.setAttribute("width", size/6);
            trim.setAttribute("height", size/20);
            trim.setAttribute("fill", colors[1]);
            elements.push(trim);
        }
        if (rank >= 2) { // Tips
            const tip = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            tip.setAttribute("cx", x - size/4);
            tip.setAttribute("cy", y + size/3);
            tip.setAttribute("r", size/20);
            tip.setAttribute("fill", colors[0]);
            elements.push(tip);
        }
        if (rank >= 3) { // Engraving
            const engraving = document.createElementNS("http://www.w3.org/2000/svg", "path");
            engraving.setAttribute("d", `M ${x-size/3} ${y} Q ${x-size/4} ${y+size/6}, ${x-size/5} ${y+size/3}`);
            engraving.setAttribute("stroke", colors[1]);
            engraving.setAttribute("stroke-width", size/30);
            elements.push(engraving);
        }
        if (rank >= 4) { // Gem
            const gem = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            gem.setAttribute("cx", x - size/4);
            gem.setAttribute("cy", y);
            gem.setAttribute("r", size/15);
            gem.setAttribute("fill", colors[0]);
            elements.push(gem);
        }
        if (rank >= 5) { // Pattern
            const pattern = document.createElementNS("http://www.w3.org/2000/svg", "path");
            pattern.setAttribute("d", `M ${x-size/3} ${y-size/6} L ${x-size/5} ${y-size/6}`);
            pattern.setAttribute("stroke", colors[2]);
            pattern.setAttribute("stroke-width", size/30);
            elements.push(pattern);
        }

        return elements;
    }

    drawWand(x, y, size, colors, rank) {
        const elements = [];
        
        // Stick
        const stick = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        stick.setAttribute("x", x - size/20);
        stick.setAttribute("y", y - size/3);
        stick.setAttribute("width", size/10);
        stick.setAttribute("height", size * 2/3);
        stick.setAttribute("fill", colors[2]);
        elements.push(stick);

        // Tip
        const tip = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        tip.setAttribute("points", `${x-size/15},${y-size/3} ${x+size/15},${y-size/3} ${x},${y-size/2}`);
        tip.setAttribute("fill", colors[0]);
        elements.push(tip);

        if (rank >= 1) { // Trim
            const trim = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            trim.setAttribute("x", x - size/15);
            trim.setAttribute("y", y + size/6);
            trim.setAttribute("width", size/7.5);
            trim.setAttribute("height", size/20);
            trim.setAttribute("fill", colors[1]);
            elements.push(trim);
        }
        if (rank >= 2) { // Band
            const band = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            band.setAttribute("x", x - size/15);
            band.setAttribute("y", y);
            band.setAttribute("width", size/7.5);
            band.setAttribute("height", size/20);
            band.setAttribute("fill", colors[1]);
            elements.push(band);
        }
        if (rank >= 3) { // Rune
            const rune = document.createElementNS("http://www.w3.org/2000/svg", "path");
            rune.setAttribute("d", `M ${x} ${y-size/6} L ${x} ${y+size/6}`);
            rune.setAttribute("stroke", colors[1]);
            rune.setAttribute("stroke-width", size/30);
            elements.push(rune);
        }
        if (rank >= 4) { // Gem
            const gem = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            gem.setAttribute("cx", x);
            gem.setAttribute("cy", y + size/3);
            gem.setAttribute("r", size/15);
            gem.setAttribute("fill", colors[0]);
            elements.push(gem);
        }
        if (rank >= 5) { // Sparkle
            const sparkle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            sparkle.setAttribute("cx", x);
            sparkle.setAttribute("cy", y - size/2);
            sparkle.setAttribute("r", size/20);
            sparkle.setAttribute("fill", colors[2]);
            elements.push(sparkle);
        }

        return elements;
    }

    drawShield(x, y, size, colors, rank) {
        const elements = [];
        
        // Base
        const shield = document.createElementNS("http://www.w3.org/2000/svg", "path");
        shield.setAttribute("d", `M ${x-size/3} ${y-size/3} L ${x+size/3} ${y-size/3} Q ${x+size/4} ${y}, ${x+size/3} ${y+size/3} Q ${x} ${y+size/2}, ${x-size/3} ${y+size/3} Z`);
        shield.setAttribute("fill", colors[0]);
        elements.push(shield);

        if (rank >= 1) { // Trim
            const trim = document.createElementNS("http://www.w3.org/2000/svg", "path");
            trim.setAttribute("d", `M ${x-size/3} ${y-size/3} L ${x+size/3} ${y-size/3}`);
            trim.setAttribute("stroke", colors[1]);
            trim.setAttribute("stroke-width", size/20);
            elements.push(trim);
        }
        if (rank >= 2) { // Bolts
            const bolt1 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            bolt1.setAttribute("cx", x - size/4);
            bolt1.setAttribute("cy", y - size/4);
            bolt1.setAttribute("r", size/20);
            bolt1.setAttribute("fill", colors[2]);
            elements.push(bolt1);
            const bolt2 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            bolt2.setAttribute("cx", x + size/4);
            bolt2.setAttribute("cy", y - size/4);
            bolt2.setAttribute("r", size/20);
            bolt2.setAttribute("fill", colors[2]);
            elements.push(bolt2);
        }
        if (rank >= 3) { // Engraving
            const engraving = document.createElementNS("http://www.w3.org/2000/svg", "path");
            engraving.setAttribute("d", `M ${x} ${y-size/3} Q ${x-size/6} ${y}, ${x} ${y+size/3}`);
            engraving.setAttribute("stroke", colors[1]);
            engraving.setAttribute("stroke-width", size/30);
            elements.push(engraving);
        }
        if (rank >= 4) { // Gem
            const gem = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            gem.setAttribute("cx", x);
            gem.setAttribute("cy", y);
            gem.setAttribute("r", size/15);
            gem.setAttribute("fill", colors[0]);
            elements.push(gem);
        }
        if (rank >= 5) { // Pattern
            const pattern = document.createElementNS("http://www.w3.org/2000/svg", "path");
            pattern.setAttribute("d", `M ${x-size/4} ${y-size/6} L ${x+size/4} ${y-size/6}`);
            pattern.setAttribute("stroke", colors[2]);
            pattern.setAttribute("stroke-width", size/30);
            elements.push(pattern);
        }

        return elements;
    }

    drawChest(x, y, size, colors, rank) {
        const elements = [];
        
        // Chestplate body (curved with shoulder pads)
        const chest = document.createElementNS("http://www.w3.org/2000/svg", "path");
        chest.setAttribute("d", `M ${x-size/3} ${y-size/4} Q ${x-size/4} ${y-size/6}, ${x-size/5} ${y+size/4} 
                                 L ${x+size/5} ${y+size/4} Q ${x+size/4} ${y-size/6}, ${x+size/3} ${y-size/4} 
                                 L ${x+size/4} ${y-size/3} L ${x-size/4} ${y-size/3} Z`);
        chest.setAttribute("fill", colors[0]);
        elements.push(chest);

        if (rank >= 1) { // Trim
            const trim = document.createElementNS("http://www.w3.org/2000/svg", "path");
            trim.setAttribute("d", `M ${x-size/3} ${y-size/4} L ${x+size/3} ${y-size/4}`);
            trim.setAttribute("stroke", colors[1]);
            trim.setAttribute("stroke-width", size/20);
            elements.push(trim);
        }
        if (rank >= 2) { // Straps
            const strap = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            strap.setAttribute("x", x - size/12);
            strap.setAttribute("y", y - size/6);
            strap.setAttribute("width", size/6);
            strap.setAttribute("height", size/3);
            strap.setAttribute("fill", colors[1]);
            elements.push(strap);
        }
        if (rank >= 3) { // Engraving
            const engraving = document.createElementNS("http://www.w3.org/2000/svg", "path");
            engraving.setAttribute("d", `M ${x} ${y-size/4} L ${x} ${y+size/4}`);
            engraving.setAttribute("stroke", colors[2]);
            engraving.setAttribute("stroke-width", size/30);
            elements.push(engraving);
        }
        if (rank >= 4) { // Gems
            const gem1 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            gem1.setAttribute("cx", x - size/6);
            gem1.setAttribute("cy", y);
            gem1.setAttribute("r", size/15);
            gem1.setAttribute("fill", colors[0]);
            elements.push(gem1);
            const gem2 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            gem2.setAttribute("cx", x + size/6);
            gem2.setAttribute("cy", y);
            gem2.setAttribute("r", size/15);
            gem2.setAttribute("fill", colors[0]);
            elements.push(gem2);
        }
        if (rank >= 5) { // Pattern
            const pattern = document.createElementNS("http://www.w3.org/2000/svg", "path");
            pattern.setAttribute("d", `M ${x-size/4} ${y-size/6} Q ${x} ${y}, ${x+size/4} ${y-size/6}`);
            pattern.setAttribute("stroke", colors[2]);
            pattern.setAttribute("stroke-width", size/30);
            elements.push(pattern);
        }

        return elements;
    }

    drawHelm(x, y, size, colors, rank) {
        const elements = [];
        
        // Base
        const helm = document.createElementNS("http://www.w3.org/2000/svg", "path");
        helm.setAttribute("d", `M ${x-size/3} ${y-size/3} Q ${x} ${y-size/2}, ${x+size/3} ${y-size/3} L ${x+size/3} ${y+size/4} Q ${x} ${y+size/3}, ${x-size/3} ${y+size/4} Z`);
        helm.setAttribute("fill", colors[0]);
        elements.push(helm);

        if (rank >= 1) { // Visor
            const visor = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            visor.setAttribute("x", x - size/4);
            visor.setAttribute("y", y - size/8);
            visor.setAttribute("width", size/2);
            visor.setAttribute("height", size/8);
            visor.setAttribute("fill", colors[1]);
            elements.push(visor);
        }
        if (rank >= 2) { // Crest
            const crest = document.createElementNS("http://www.w3.org/2000/svg", "path");
            crest.setAttribute("d", `M ${x} ${y-size/2} L ${x-size/12} ${y-size/3} L ${x+size/12} ${y-size/3} Z`);
            crest.setAttribute("fill", colors[2]);
            elements.push(crest);
        }
        if (rank >= 3) { // Engraving
            const engraving = document.createElementNS("http://www.w3.org/2000/svg", "path");
            engraving.setAttribute("d", `M ${x-size/4} ${y} L ${x+size/4} ${y}`);
            engraving.setAttribute("stroke", colors[1]);
            engraving.setAttribute("stroke-width", size/30);
            elements.push(engraving);
        }
        if (rank >= 4) { // Gem
            const gem = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            gem.setAttribute("cx", x);
            gem.setAttribute("cy", y - size/6);
            gem.setAttribute("r", size/15);
            gem.setAttribute("fill", colors[0]);
            elements.push(gem);
        }
        if (rank >= 5) { // Pattern
            const pattern = document.createElementNS("http://www.w3.org/2000/svg", "path");
            pattern.setAttribute("d", `M ${x-size/6} ${y+size/6} L ${x+size/6} ${y+size/6}`);
            pattern.setAttribute("stroke", colors[2]);
            pattern.setAttribute("stroke-width", size/30);
            elements.push(pattern);
        }

        return elements;
    }

    drawGloves(x, y, size, colors, rank) {
        const elements = [];
        
        // Base
        const glove = document.createElementNS("http://www.w3.org/2000/svg", "path");
        glove.setAttribute("d", `M ${x-size/4} ${y-size/3} L ${x+size/4} ${y-size/3} L ${x+size/3} ${y+size/6} Q ${x} ${y+size/3}, ${x-size/3} ${y+size/6} Z`);
        glove.setAttribute("fill", colors[0]);
        elements.push(glove);

        if (rank >= 1) { // Cuff
            const cuff = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            cuff.setAttribute("x", x - size/4);
            cuff.setAttribute("y", y - size/3);
            cuff.setAttribute("width", size/2);
            cuff.setAttribute("height", size/8);
            cuff.setAttribute("fill", colors[1]);
            elements.push(cuff);
        }
        if (rank >= 2) { // Knuckle
            const knuckle = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            knuckle.setAttribute("x", x - size/6);
            knuckle.setAttribute("y", y);
            knuckle.setAttribute("width", size/3);
            knuckle.setAttribute("height", size/12);
            knuckle.setAttribute("fill", colors[2]);
            elements.push(knuckle);
        }
        if (rank >= 3) { // Engraving
            const engraving = document.createElementNS("http://www.w3.org/2000/svg", "path");
            engraving.setAttribute("d", `M ${x} ${y-size/6} L ${x} ${y+size/6}`);
            engraving.setAttribute("stroke", colors[1]);
            engraving.setAttribute("stroke-width", size/30);
            elements.push(engraving);
        }
        if (rank >= 4) { // Gem
            const gem = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            gem.setAttribute("cx", x);
            gem.setAttribute("cy", y + size/6);
            gem.setAttribute("r", size/15);
            gem.setAttribute("fill", colors[0]);
            elements.push(gem);
        }
        if (rank >= 5) { // Pattern
            const pattern = document.createElementNS("http://www.w3.org/2000/svg", "path");
            pattern.setAttribute("d", `M ${x-size/5} ${y-size/12} L ${x+size/5} ${y-size/12}`);
            pattern.setAttribute("stroke", colors[2]);
            pattern.setAttribute("stroke-width", size/30);
            elements.push(pattern);
        }

        return elements;
    }

    drawRing(x, y, size, colors, rank) {
        const elements = [];
        
        // Band
        const band = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        band.setAttribute("cx", x);
        band.setAttribute("cy", y);
        band.setAttribute("r", size/4);
        band.setAttribute("fill", "none");
        band.setAttribute("stroke", colors[0]);
        band.setAttribute("stroke-width", size/10);
        elements.push(band);

        if (rank >= 1) { // Gem
            const gem = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            gem.setAttribute("cx", x);
            gem.setAttribute("cy", y - size/4);
            gem.setAttribute("r", size/10);
            gem.setAttribute("fill", colors[1]);
            elements.push(gem);
        }
        if (rank >= 2) { // Side Gems
            const gem1 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            gem1.setAttribute("cx", x - size/6);
            gem1.setAttribute("cy", y);
            gem1.setAttribute("r", size/15);
            gem1.setAttribute("fill", colors[2]);
            elements.push(gem1);
        }
        if (rank >= 3) { // Engraving
            const engraving = document.createElementNS("http://www.w3.org/2000/svg", "path");
            engraving.setAttribute("d", `M ${x-size/4} ${y} Q ${x} ${y+size/6}, ${x+size/4} ${y}`);
            engraving.setAttribute("stroke", colors[1]);
            engraving.setAttribute("stroke-width", size/30);
            elements.push(engraving);
        }
        if (rank >= 4) { // Extra Gem
            const gem2 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            gem2.setAttribute("cx", x + size/6);
            gem2.setAttribute("cy", y);
            gem2.setAttribute("r", size/15);
            gem2.setAttribute("fill", colors[0]);
            elements.push(gem2);
        }
        if (rank >= 5) { // Pattern
            const pattern = document.createElementNS("http://www.w3.org/2000/svg", "path");
            pattern.setAttribute("d", `M ${x-size/5} ${y-size/6} L ${x+size/5} ${y-size/6}`);
            pattern.setAttribute("stroke", colors[2]);
            pattern.setAttribute("stroke-width", size/30);
            elements.push(pattern);
        }

        return elements;
    }

    drawIngot(x, y, size, colors, rank) {
        const elements = [];
        
        // Base
        const ingot = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        ingot.setAttribute("x", x - size/3);
        ingot.setAttribute("y", y - size/6);
        ingot.setAttribute("width", size * 2/3);
        ingot.setAttribute("height", size/3);
        ingot.setAttribute("fill", colors[0]);
        ingot.setAttribute("transform", `rotate(45 ${x} ${y})`);
        elements.push(ingot);

        if (rank >= 1) { // Trim
            const trim = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            trim.setAttribute("x", x - size/4);
            trim.setAttribute("y", y - size/8);
            trim.setAttribute("width", size/2);
            trim.setAttribute("height", size/20);
            trim.setAttribute("fill", colors[1]);
            trim.setAttribute("transform", `rotate(45 ${x} ${y})`);
            elements.push(trim);
        }
        if (rank >= 2) { // Mark
            const mark = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            mark.setAttribute("cx", x);
            mark.setAttribute("cy", y);
            mark.setAttribute("r", size/15);
            mark.setAttribute("fill", colors[2]);
            elements.push(mark);
        }
        if (rank >= 3) { // Engraving
            const engraving = document.createElementNS("http://www.w3.org/2000/svg", "path");
            engraving.setAttribute("d", `M ${x-size/4} ${y-size/12} L ${x+size/4} ${y-size/12}`);
            engraving.setAttribute("stroke", colors[1]);
            engraving.setAttribute("stroke-width", size/30);
            engraving.setAttribute("transform", `rotate(45 ${x} ${y})`);
            elements.push(engraving);
        }
        if (rank >= 4) { // Gem
            const gem = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            gem.setAttribute("cx", x + size/6);
            gem.setAttribute("cy", y - size/12);
            gem.setAttribute("r", size/15);
            gem.setAttribute("fill", colors[0]);
            elements.push(gem);
        }
        if (rank >= 5) { // Pattern
            const pattern = document.createElementNS("http://www.w3.org/2000/svg", "path");
            pattern.setAttribute("d", `M ${x-size/6} ${y} L ${x+size/6} ${y}`);
            pattern.setAttribute("stroke", colors[2]);
            pattern.setAttribute("stroke-width", size/30);
            elements.push(pattern);
        }

        return elements;
    }

    drawOre(x, y, size, colors, rank) {
        const elements = [];
        
        // Base
        const ore = document.createElementNS("http://www.w3.org/2000/svg", "path");
        ore.setAttribute("d", `M ${x-size/3} ${y-size/4} L ${x-size/6} ${y-size/3} L ${x+size/3} ${y-size/6} L ${x+size/4} ${y+size/3} L ${x-size/6} ${y+size/4} Z`);
        ore.setAttribute("fill", colors[0]);
        elements.push(ore);

        if (rank >= 1) { // Highlight
            const highlight = document.createElementNS("http://www.w3.org/2000/svg", "path");
            highlight.setAttribute("d", `M ${x} ${y-size/6} L ${x+size/6} ${y} L ${x} ${y+size/6}`);
            highlight.setAttribute("fill", colors[1]);
            elements.push(highlight);
        }
        if (rank >= 2) { // Vein
            const vein = document.createElementNS("http://www.w3.org/2000/svg", "path");
            vein.setAttribute("d", `M ${x-size/4} ${y} L ${x+size/4} ${y}`);
            vein.setAttribute("stroke", colors[2]);
            vein.setAttribute("stroke-width", size/20);
            elements.push(vein);
        }
        if (rank >= 3) { // Engraving
            const engraving = document.createElementNS("http://www.w3.org/2000/svg", "path");
            engraving.setAttribute("d", `M ${x-size/6} ${y-size/6} L ${x+size/6} ${y+size/6}`);
            engraving.setAttribute("stroke", colors[1]);
            engraving.setAttribute("stroke-width", size/30);
            elements.push(engraving);
        }
        if (rank >= 4) { // Gem
            const gem = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            gem.setAttribute("cx", x);
            gem.setAttribute("cy", y);
            gem.setAttribute("r", size/15);
            gem.setAttribute("fill", colors[0]);
            elements.push(gem);
        }
        if (rank >= 5) { // Pattern
            const pattern = document.createElementNS("http://www.w3.org/2000/svg", "path");
            pattern.setAttribute("d", `M ${x-size/5} ${y-size/12} L ${x+size/5} ${y-size/12}`);
            pattern.setAttribute("stroke", colors[2]);
            pattern.setAttribute("stroke-width", size/30);
            elements.push(pattern);
        }

        return elements;
    }

    drawPotion(x, y, size, colors, rank) {
        const elements = [];
        
        // Bottle
        const bottle = document.createElementNS("http://www.w3.org/2000/svg", "path");
        bottle.setAttribute("d", `M ${x-size/6} ${y-size/3} L ${x-size/6} ${y+size/6} Q ${x} ${y+size/3}, ${x+size/6} ${y+size/6} L ${x+size/6} ${y-size/3} Z`);
        bottle.setAttribute("fill", colors[0]);
        elements.push(bottle);

        // Neck
        const neck = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        neck.setAttribute("x", x - size/12);
        neck.setAttribute("y", y - size/2);
        neck.setAttribute("width", size/6);
        neck.setAttribute("height", size/5);
        neck.setAttribute("fill", colors[1]);
        elements.push(neck);

        if (rank >= 1) { // Label
            const label = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            label.setAttribute("x", x - size/8);
            label.setAttribute("y", y - size/6);
            label.setAttribute("width", size/4);
            label.setAttribute("height", size/6);
            label.setAttribute("fill", colors[2]);
            elements.push(label);
        }
        if (rank >= 2) { // Cork
            const cork = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            cork.setAttribute("x", x - size/10);
            cork.setAttribute("y", y - size/2 - size/10);
            cork.setAttribute("width", size/5);
            cork.setAttribute("height", size/10);
            cork.setAttribute("fill", colors[1]);
            elements.push(cork);
        }
        if (rank >= 3) { // Engraving
            const engraving = document.createElementNS("http://www.w3.org/2000/svg", "path");
            engraving.setAttribute("d", `M ${x-size/8} ${y} L ${x+size/8} ${y}`);
            engraving.setAttribute("stroke", colors[1]);
            engraving.setAttribute("stroke-width", size/30);
            elements.push(engraving);
        }
        if (rank >= 4) { // Gem
            const gem = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            gem.setAttribute("cx", x);
            gem.setAttribute("cy", y - size/6);
            gem.setAttribute("r", size/15);
            gem.setAttribute("fill", colors[0]);
            elements.push(gem);
        }
        if (rank >= 5) { // Pattern
            const pattern = document.createElementNS("http://www.w3.org/2000/svg", "path");
            pattern.setAttribute("d", `M ${x-size/6} ${y+size/12} L ${x+size/6} ${y+size/12}`);
            pattern.setAttribute("stroke", colors[2]);
            pattern.setAttribute("stroke-width", size/30);
            elements.push(pattern);
        }

        return elements;
    }

    // Helper method for glow effect
    addGlowFilter(element, svg) {
        const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
        filter.setAttribute("id", "glow");
        const blur = document.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
        blur.setAttribute("stdDeviation", "2");
        blur.setAttribute("result", "blur");
        filter.appendChild(blur);
        const merge = document.createElementNS("http://www.w3.org/2000/svg", "feMerge");
        merge.innerHTML = '<feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/>';
        filter.appendChild(merge);
        svg.appendChild(filter);
        element.setAttribute("filter", "url(#glow)");
    }

    // Spell drawing methods
    drawAttackSpell(x, y, size, colors) {
        const elements = [];
        
        // Crossed swords
        const sword1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
        sword1.setAttribute("d", `M ${x - size/3} ${y - size/3} L ${x + size/3} ${y + size/3}`);
        sword1.setAttribute("stroke", colors[0]);
        sword1.setAttribute("stroke-width", size/10);
        elements.push(sword1);
        
        const sword2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
        sword2.setAttribute("d", `M ${x + size/3} ${y - size/3} L ${x - size/3} ${y + size/3}`);
        sword2.setAttribute("stroke", colors[0]);
        sword2.setAttribute("stroke-width", size/10);
        elements.push(sword2);
        
        return elements;
    }

    drawFireSpell(x, y, size, colors) {
        const elements = [];
        
        // Flame shape
        const flame = document.createElementNS("http://www.w3.org/2000/svg", "path");
        flame.setAttribute("d", `M ${x} ${y + size/3}
                            Q ${x - size/3} ${y - size/6}, ${x} ${y - size/3}
                            Q ${x + size/3} ${y - size/6}, ${x} ${y + size/3}
                            Z`);
        flame.setAttribute("fill", colors[0]);
        elements.push(flame);
        
        const innerFlame = document.createElementNS("http://www.w3.org/2000/svg", "path");
        innerFlame.setAttribute("d", `M ${x} ${y + size/6}
                                    Q ${x - size/6} ${y - size/12}, ${x} ${y - size/4}
                                    Q ${x + size/6} ${y - size/12}, ${x} ${y + size/6}
                                    Z`);
        innerFlame.setAttribute("fill", colors[1]);
        elements.push(innerFlame);
        
        return elements;
    }

    drawInvisibilitySpell(x, y, size, colors) {
        const elements = [];
        
        // Fading circles
        const circle1 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle1.setAttribute("cx", x);
        circle1.setAttribute("cy", y);
        circle1.setAttribute("r", size/3);
        circle1.setAttribute("fill", "none");
        circle1.setAttribute("stroke", colors[0]);
        circle1.setAttribute("stroke-width", size/15);
        circle1.setAttribute("opacity", "0.3");
        elements.push(circle1);
        
        const circle2 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle2.setAttribute("cx", x);
        circle2.setAttribute("cy", y);
        circle2.setAttribute("r", size/5);
        circle2.setAttribute("fill", "none");
        circle2.setAttribute("stroke", colors[1]);
        circle2.setAttribute("stroke-width", size/15);
        circle2.setAttribute("opacity", "0.6");
        elements.push(circle2);
        
        return elements;
    }

    drawIceSpell(x, y, size, colors) {
        const elements = [];
        
        // Snowflake
        for (let i = 0; i < 6; i++) {
            const angle = i * 60 * Math.PI / 180;
            const spike = document.createElementNS("http://www.w3.org/2000/svg", "path");
            spike.setAttribute("d", `M ${x} ${y} 
                                L ${x + Math.cos(angle) * size/3} ${y + Math.sin(angle) * size/3}`);
            spike.setAttribute("stroke", colors[0]);
            spike.setAttribute("stroke-width", size/15);
            elements.push(spike);
        }
        
        return elements;
    }

    drawNatureSpell(x, y, size, colors) {
        const elements = [];
        
        // Leaf
        const leaf = document.createElementNS("http://www.w3.org/2000/svg", "path");
        leaf.setAttribute("d", `M ${x} ${y + size/3}
                            Q ${x - size/3} ${y - size/6}, ${x} ${y - size/3}
                            Q ${x + size/3} ${y - size/6}, ${x} ${y + size/3}
                            Z`);
        leaf.setAttribute("fill", colors[0]);
        elements.push(leaf);
        
        // Stem
        const stem = document.createElementNS("http://www.w3.org/2000/svg", "path");
        stem.setAttribute("d", `M ${x} ${y} L ${x} ${y + size/3}`);
        stem.setAttribute("stroke", colors[1]);
        stem.setAttribute("stroke-width", size/15);
        elements.push(stem);
        
        return elements;
    }

    drawArcaneSpell(x, y, size, colors) {
        const elements = [];
        
        // Magic runes
        const rune1 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        rune1.setAttribute("cx", x);
        rune1.setAttribute("cy", y);
        rune1.setAttribute("r", size/3);
        rune1.setAttribute("fill", "none");
        rune1.setAttribute("stroke", colors[0]);
        rune1.setAttribute("stroke-width", size/15);
        elements.push(rune1);
        
        const rune2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
        rune2.setAttribute("d", `M ${x - size/6} ${y - size/6} L ${x + size/6} ${y + size/6}`);
        rune2.setAttribute("stroke", colors[1]);
        rune2.setAttribute("stroke-width", size/15);
        elements.push(rune2);
        
        return elements;
    }

    drawHolySpell(x, y, size, colors) {
        const elements = [];
        
        // Cross with glow
        const crossV = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        crossV.setAttribute("x", x - size/15);
        crossV.setAttribute("y", y - size/3);
        crossV.setAttribute("width", size/7.5);
        crossV.setAttribute("height", size * 2/3);
        crossV.setAttribute("fill", colors[0]);
        elements.push(crossV);
        
        const crossH = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        crossH.setAttribute("x", x - size/4);
        crossH.setAttribute("y", y - size/12);
        crossH.setAttribute("width", size/2);
        crossH.setAttribute("height", size/7.5);
        crossH.setAttribute("fill", colors[0]);
        elements.push(crossH);
        
        return elements;
    }

    drawShadowSpell(x, y, size, colors) {
        const elements = [];
        
        // Dark swirl
        const swirl = document.createElementNS("http://www.w3.org/2000/svg", "path");
        swirl.setAttribute("d", `M ${x} ${y}
                            Q ${x - size/3} ${y - size/3}, ${x + size/3} ${y - size/3}
                            Q ${x + size/2} ${y}, ${x} ${y + size/3}
                            Q ${x - size/2} ${y}, ${x} ${y - size/3}`);
        swirl.setAttribute("fill", colors[0]);
        swirl.setAttribute("opacity", "0.7");
        elements.push(swirl);
        
        return elements;
    }

    // Plant drawing methods
    drawMilkweed(x, y, size, colors) {
        const elements = [];
        
        // Stem
        const stem = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        stem.setAttribute("x", x - size/15);
        stem.setAttribute("y", y - size/3);
        stem.setAttribute("width", size/7.5);
        stem.setAttribute("height", size * 2/3);
        stem.setAttribute("fill", colors[0]);
        elements.push(stem);
        
        // Pods
        const pod = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
        pod.setAttribute("cx", x);
        pod.setAttribute("cy", y - size/6);
        pod.setAttribute("rx", size/6);
        pod.setAttribute("ry", size/12);
        pod.setAttribute("fill", colors[1]);
        elements.push(pod);
        
        return elements;
    }

    drawSunflower(x, y, size, colors) {
        const elements = [];
        
        // Center
        const center = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        center.setAttribute("cx", x);
        center.setAttribute("cy", y - size/6);
        center.setAttribute("r", size/6);
        center.setAttribute("fill", "#8B4513");
        elements.push(center);
        
        // Petals
        for (let i = 0; i < 12; i++) {
            const petal = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
            const angle = i * 30 * Math.PI / 180;
            petal.setAttribute("cx", x + Math.cos(angle) * size/4);
            petal.setAttribute("cy", y - size/6 + Math.sin(angle) * size/4);
            petal.setAttribute("rx", size/12);
            petal.setAttribute("ry", size/6);
            petal.setAttribute("fill", "#FFD700");
            petal.setAttribute("transform", `rotate(${i * 30} ${x} ${y - size/6})`);
            elements.push(petal);
        }
        
        // Stem
        const stem = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        stem.setAttribute("x", x - size/15);
        stem.setAttribute("y", y);
        stem.setAttribute("width", size/7.5);
        stem.setAttribute("height", size/3);
        stem.setAttribute("fill", colors[0]);
        elements.push(stem);
        
        return elements;
    }

    drawBerry(x, y, size, colors) {
        const elements = [];
        
        // Berries
        for (let i = 0; i < 3; i++) {
            const berry = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            berry.setAttribute("cx", x + (i - 1) * size/6);
            berry.setAttribute("cy", y - size/6);
            berry.setAttribute("r", size/8);
            berry.setAttribute("fill", "#FF0000");
            elements.push(berry);
        }
        
        // Stem
        const stem = document.createElementNS("http://www.w3.org/2000/svg", "path");
        stem.setAttribute("d", `M ${x} ${y - size/3} L ${x} ${y}`);
        stem.setAttribute("stroke", colors[0]);
        stem.setAttribute("stroke-width", size/15);
        elements.push(stem);
        
        return elements;
    }

    drawPumpkin(x, y, size, colors) {
        const elements = [];
        
        // Pumpkin body
        const body = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
        body.setAttribute("cx", x);
        body.setAttribute("cy", y);
        body.setAttribute("rx", size/3);
        body.setAttribute("ry", size/4);
        body.setAttribute("fill", "#FFA500");
        elements.push(body);
        
        // Stem
        const stem = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        stem.setAttribute("x", x - size/15);
        stem.setAttribute("y", y - size/3);
        stem.setAttribute("width", size/7.5);
        stem.setAttribute("height", size/6);
        stem.setAttribute("fill", colors[0]);
        elements.push(stem);
        
        return elements;
    }

    drawFlower(x, y, size, colors) {
        const elements = [];
        
        // Petals
        for (let i = 0; i < 5; i++) {
            const petal = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
            const angle = i * 72 * Math.PI / 180;
            petal.setAttribute("cx", x + Math.cos(angle) * size/6);
            petal.setAttribute("cy", y + Math.sin(angle) * size/6);
            petal.setAttribute("rx", size/8);
            petal.setAttribute("ry", size/4);
            petal.setAttribute("fill", "#FF69B4");
            petal.setAttribute("transform", `rotate(${i * 72} ${x} ${y})`);
            elements.push(petal);
        }
        
        // Center
        const center = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        center.setAttribute("cx", x);
        center.setAttribute("cy", y);
        center.setAttribute("r", size/8);
        center.setAttribute("fill", "#FFD700");
        elements.push(center);
        
        return elements;
    }

    drawSnowball(x, y, size, colors) {
        const elements = [];
        
        // Snowball (use white)
        const ball = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        ball.setAttribute("cx", x);
        ball.setAttribute("cy", y);
        ball.setAttribute("r", size/3);
        ball.setAttribute("fill", colors[0]); // #FFFFFF (white)
        elements.push(ball);
        
        // Highlights (use light blue shades)
        const highlight = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        highlight.setAttribute("cx", x - size/6);
        highlight.setAttribute("cy", y - size/6);
        highlight.setAttribute("r", size/12);
        highlight.setAttribute("fill", colors[2]); // #E0FFFF (light cyan)
        elements.push(highlight);
        
        return elements;
    }

    drawCactusSpine(x, y, size, colors) {
        const elements = [];
        
        // Spine
        const spine = document.createElementNS("http://www.w3.org/2000/svg", "path");
        spine.setAttribute("d", `M ${x} ${y - size/3} 
                            L ${x - size/12} ${y + size/3}
                            L ${x + size/12} ${y + size/3}
                            Z`);
        spine.setAttribute("fill", colors[0]);
        elements.push(spine);
        
        return elements;
    }

    drawCharcoal(x, y, size, colors) {
        const elements = [];
        
        // Charcoal piece
        const piece = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        piece.setAttribute("x", x - size/3);
        piece.setAttribute("y", y - size/6);
        piece.setAttribute("width", size * 2/3);
        piece.setAttribute("height", size/3);
        piece.setAttribute("fill", "#333333");
        piece.setAttribute("transform", `rotate(45 ${x} ${y})`);
        elements.push(piece);
        
        return elements;
    }

    drawRedCoral(x, y, size, colors) {
        const elements = [];
        
        // Coral branches
        const branch1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
        branch1.setAttribute("d", `M ${x} ${y + size/3} 
                                Q ${x - size/3} ${y}, ${x - size/6} ${y - size/3}`);
        branch1.setAttribute("stroke", "#FF4040");
        branch1.setAttribute("stroke-width", size/15);
        branch1.setAttribute("fill", "none");
        elements.push(branch1);
        
        const branch2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
        branch2.setAttribute("d", `M ${x} ${y + size/3} 
                                Q ${x + size/3} ${y}, ${x + size/6} ${y - size/3}`);
        branch2.setAttribute("stroke", "#FF4040");
        branch2.setAttribute("stroke-width", size/15);
        branch2.setAttribute("fill", "none");
        elements.push(branch2);
        
        return elements;
    }

    drawBlueCoral(x, y, size, colors) {
        const elements = [];
        
        // Coral branches
        const branch1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
        branch1.setAttribute("d", `M ${x} ${y + size/3} 
                                Q ${x - size/3} ${y}, ${x - size/6} ${y - size/3}`);
        branch1.setAttribute("stroke", "#4040FF");
        branch1.setAttribute("stroke-width", size/15);
        branch1.setAttribute("fill", "none");
        elements.push(branch1);
        
        const branch2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
        branch2.setAttribute("d", `M ${x} ${y + size/3} 
                                Q ${x + size/3} ${y}, ${x + size/6} ${y - size/3}`);
        branch2.setAttribute("stroke", "#4040FF");
        branch2.setAttribute("stroke-width", size/15);
        branch2.setAttribute("fill", "none");
        elements.push(branch2);
        
        return elements;
    }

    drawSeaweed(x, y, size, colors) {
        const elements = [];
        
        // Seaweed strands
        for (let i = 0; i < 3; i++) {
            const strand = document.createElementNS("http://www.w3.org/2000/svg", "path");
            strand.setAttribute("d", `M ${x + (i-1) * size/6} ${y + size/3} 
                                    Q ${x + (i-1) * size/6 + size/12} ${y}, 
                                    ${x + (i-1) * size/6} ${y - size/3}`);
            strand.setAttribute("stroke", colors[0]);
            strand.setAttribute("stroke-width", size/15);
            strand.setAttribute("fill", "none");
            elements.push(strand);
        }
        
        return elements;
    }

    drawIceCrystal(x, y, size, colors) {
        const elements = [];
        
        // Crystal shape (use the lightest ice color)
        const crystal = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        crystal.setAttribute("points", `
            ${x},${y - size/3}
            ${x + size/6},${y - size/6}
            ${x + size/3},${y}
            ${x + size/6},${y + size/6}
            ${x},${y + size/3}
            ${x - size/6},${y + size/6}
            ${x - size/3},${y}
            ${x - size/6},${y - size/6}
        `);
        crystal.setAttribute("fill", colors[2]); // #B0E0E6 (light blue)
        crystal.setAttribute("opacity", "0.7");
        elements.push(crystal);
        
        // Outline (use darker ice color)
        const outline = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        outline.setAttribute("points", `
            ${x},${y - size/3}
            ${x + size/6},${y - size/6}
            ${x + size/3},${y}
            ${x + size/6},${y + size/6}
            ${x},${y + size/3}
            ${x - size/6},${y + size/6}
            ${x - size/3},${y}
            ${x - size/6},${y - size/6}
        `);
        outline.setAttribute("fill", "none");
        outline.setAttribute("stroke", colors[0]); // #F0F8FF (very light blue)
        outline.setAttribute("stroke-width", size/20);
        elements.push(outline);
        
        return elements;
    }

    drawHolyWater(x, y, size, colors) {
        const elements = [];
        
        // Water drop (use the lightest holy color for a glowing effect)
        const drop = document.createElementNS("http://www.w3.org/2000/svg", "path");
        drop.setAttribute("d", `M ${x} ${y - size/3}
                            Q ${x - size/6} ${y}, ${x} ${y + size/3}
                            Q ${x + size/6} ${y}, ${x} ${y - size/3}
                            Z`);
        drop.setAttribute("fill", colors[2]); // #F0E68C (light yellow)
        drop.setAttribute("opacity", "0.7");
        elements.push(drop);
        
        // Cross (use the darkest holy color for contrast)
        const cross = document.createElementNS("http://www.w3.org/2000/svg", "path");
        cross.setAttribute("d", `M ${x} ${y - size/6} L ${x} ${y + size/6}
                            M ${x - size/6} ${y} L ${x + size/6} ${y}`);
        cross.setAttribute("stroke", colors[0]); // #FFD700 (gold)
        cross.setAttribute("stroke-width", size/15);
        elements.push(cross);
        
        return elements;
    }

    drawDragonScale(x, y, size, colors) {
        const elements = [];
        
        // Scale shape
        const scale = document.createElementNS("http://www.w3.org/2000/svg", "path");
        scale.setAttribute("d", `M ${x - size/3} ${y + size/6}
                            Q ${x} ${y - size/3}, ${x + size/3} ${y + size/6}
                            L ${x + size/3} ${y + size/3}
                            Q ${x} ${y + size/6}, ${x - size/3} ${y + size/3}
                            Z`);
        scale.setAttribute("fill", colors[0]);
        elements.push(scale);
        
        // Scale detail
        const detail = document.createElementNS("http://www.w3.org/2000/svg", "path");
        detail.setAttribute("d", `M ${x - size/6} ${y + size/6}
                                Q ${x} ${y - size/6}, ${x + size/6} ${y + size/6}`);
        detail.setAttribute("stroke", colors[1]);
        detail.setAttribute("stroke-width", size/15);
        detail.setAttribute("fill", "none");
        elements.push(detail);
        
        return elements;
    }
}
