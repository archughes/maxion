import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';

export class TerrainColorManager {
    constructor() {
        this.colorPalette = {
            // Base colors
            path: 0xD2B48C,
            river: 0x4682B4,
            lake: 0x4169E1,
            water: 0xF4EBC3,
            cliff: 0x5A4D41,
            mountain: 0x8B4513,
            high_mountain: 0x6E3A10,
            snow_peak: 0xFFFFFF,
            ridge: 0x7A3B10,
            bridge: 0x964B00,
            grass: [0x228B22, 0x32CD32],

            // Wet color modifiers (multipliers)
            wetModifiers: {
                path: 0.8,
                cliff: 0.7,
                mountain: 0.8,
                high_mountain: 0.8,
                ridge: 0.8,
                bridge: 0.8,
                grass: 0.7
            }
        };
    }

    // Helper method to interpolate between two hex colors
    interpolateColor(color1, color2, factor) {
        const r1 = parseInt(color1.slice(1, 3), 16);
        const g1 = parseInt(color1.slice(3, 5), 16);
        const b1 = parseInt(color1.slice(5, 7), 16);
        const r2 = parseInt(color2.slice(1, 3), 16);
        const g2 = parseInt(color2.slice(3, 5), 16);
        const b2 = parseInt(color2.slice(5, 7), 16);
        const r = Math.round(r1 + (r2 - r1) * factor);
        const g = Math.round(g1 + (g2 - g1) * factor);
        const b = Math.round(b1 + (b2 - b1) * factor);
        return `rgb(${r}, ${g}, ${b})`;
    }

    getColor(terrainType, wetness = 0, noiseValue = 0) {
        let baseColor;

        // Handle grass separately for blending
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
