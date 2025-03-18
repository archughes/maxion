import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';

export class TerrainColorManager {
    constructor() {
        this.colorPalette = {
            // Base colors
            path: '#D2B48C',
            river: '#7A6F5E',
            lake: '#7A6F5E',
            water: '#F4EBC3',
            beach_sand: '#F5F5DC',
            cliff: '#5A4D41',
            mountain: '#8B4513',
            high_mountain: '#6E3A10',
            snow_peak: '#FFFFFF',
            ridge: '#7A3B10',
            bridge: '#964B00',
            grass: ['#228B22', '#5C715E'],

            // Wet color modifiers (multipliers)
            wetModifiers: {
                path: 0.8,
                cliff: 0.7,
                mountain: 0.8,
                high_mountain: 0.8,
                ridge: 0.8,
                bridge: 0.8,
                grass: 0.7,
                beach_sand: 0.85
            }
        };
    }

    // Helper method to interpolate between two colors (accepts both hex numbers and strings)
    interpolateColor(color1, color2, factor) {
        // Convert colors to THREE.Color objects
        const c1 = new THREE.Color(color1);
        const c2 = new THREE.Color(color2);
        
        // Interpolate between the colors
        const result = c1.clone().lerp(c2, factor);
        
        // Return as CSS color string
        return `rgb(${Math.round(result.r * 255)}, ${Math.round(result.g * 255)}, ${Math.round(result.b * 255)})`;
    }

    getColor(terrainType, wetness = 0, noiseValue = 0) {
        let baseColor;

        // Handle grass and beach sand separately for blending
        if (terrainType === 'grass') {
            const [color1, color2] = this.colorPalette.grass;
            baseColor = new THREE.Color(color1).lerp(new THREE.Color(color2), noiseValue);
        } else {
            baseColor = new THREE.Color(this.colorPalette[terrainType] || 0x228B22);
        }

        // Apply wetness effect if needed
        if (wetness > 0 && this.colorPalette.wetModifiers[terrainType]) {
            const modifier = this.colorPalette.wetModifiers[terrainType];
            return baseColor.clone().multiplyScalar(1 - wetness * (1 - modifier));
        }

        return baseColor;
    }

    updateTerrainColors(terrain) {
        if (!terrain.wetMap) return;

        const positions = terrain.geometry.attributes.position.array;
        const colors = terrain.geometry.attributes.color.array;

        for (let i = 0; i < positions.length; i += 3) {
            const vertexIndex = i/3;
            const wetness = terrain.wetMap[vertexIndex] || 0;
            const x = positions[i];
            const z = positions[i + 1];
            const terrainType = terrain.terrainFunc(x, z, positions[i + 2], vertexIndex);

            // Skip water and snow
            if (['river', 'lake', 'water', 'snow_peak'].includes(terrainType)) continue;

            const noiseValue = (terrain.noise2D(x * 0.1, z * 0.1) + 1) / 2;
            const color = this.getColor(terrainType, wetness, noiseValue);

            colors[i] = color.r;
            colors[i + 1] = color.g;
            colors[i + 2] = color.b;
        }

        terrain.geometry.attributes.color.needsUpdate = true;
    }
}
