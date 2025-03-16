// HeightmapGenerator.js
import { createNoise2D } from 'https://cdn.skypack.dev/simplex-noise';
import createSeededRNG from 'https://cdn.jsdelivr.net/npm/random-seed@0.3.0/+esm';

class HeightmapGenerator {
    constructor(geometry, mapData, noise2D) {
        this.geometry = geometry;
        this.mapData = mapData;
        this.noise2D = noise2D;
    }

    static createNoise2D(seed) {
        const prng = createSeededRNG(seed || 'default');
        return createNoise2D(prng);
    }

    smoothstep(edge0, edge1, x) {
        x = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0))); // Clamp between 0 and 1
        return x * x * (3 - 2 * x); // Smooth transition formula
    }

    // Generate ridge noise for mountain features
    ridgeNoise(x, z, scale) {
        const value = this.noise2D(x * scale, z * scale);
        return 1 - Math.abs(value); // Convert to ridge noise
    }

    // Generate combined ridge noise with multiple octaves
    generateRidgeNoise(x, z, scale, octaves, persistence) {
        let total = 0;
        let amplitude = 1;
        let frequency = 1;
        let maxValue = 0;

        for (let i = 0; i < octaves; i++) {
            total += this.ridgeNoise(x * frequency, z * frequency, scale) * amplitude;
            maxValue += amplitude;
            amplitude *= persistence;
            frequency *= 2;
        }

        return total / maxValue; // Normalize
    }

    generate() {
        const biomeDifficulty = {
            'summer': 1,
            'autumn': 1.5,
            'spring': 2,
            'winter': 2.5
        };
        const difficultyFactor = biomeDifficulty[this.mapData.biome] || 1;
        const heightScale = (this.mapData.heightScale || 0.5) * difficultyFactor;
        const roughness = this.mapData.terrainRoughness || 0.005;
        const persistence = this.mapData.terrainPersistence || 0.75;
        const lacunarity = this.mapData.terrainLacunarity || 1.5;
        const octaves = this.mapData.terrainOctaves || 3;

        const vertices = this.geometry.attributes.position.array;
        for (let i = 0, j = 2; i < vertices.length; i += 3, j += 3) {
            const x = vertices[i];
            const z = vertices[i + 1];

            const largeScaleNoise = this.noise2D(x * 0.005, z * 0.005) * 10;
            const steepLargeScaleNoise = this.noise2D(x * 0.01, z * 0.01) * 20;
            const maskNoise = this.noise2D(x * 0.001, z * 0.001);
            const mask = this.smoothstep(0.4, 0.7, maskNoise);

            // Generate standard terrain noise
            let totalHeight = 0;
            let amplitude = 1;
            let frequency = 1;
            for (let o = 0; o < (octaves + biomeDifficulty > 1); o++) {
                const sampleX = x * roughness * frequency;
                const sampleZ = z * roughness * frequency;
                totalHeight += this.noise2D(sampleX, sampleZ) * amplitude;
                amplitude *= persistence;
                frequency *= lacunarity;
            }

            // Calculate base height
            let height = totalHeight * heightScale + largeScaleNoise + steepLargeScaleNoise * mask;

            // Generate ridge noise for mountain features
            const ridgeNoise = this.generateRidgeNoise(x, z, 0.02, 3, 0.5) * 5;
            
            // Apply ridge noise to terrain above certain height
            if (height > 5) {
                // Medium mountains (5-10)
                if (height <= 10) {
                    const mediumMountainFactor = (height - 5) / 5; // 0 at height 5, 1 at height 10
                    height += ridgeNoise * mediumMountainFactor * 0.5; // Add subtle ridges
                } 
                // High mountains (>10)
                else {
                    // Add more pronounced ridges and make steeper
                    const highMountainFactor = Math.min(1, (height - 10) / 5); // 0 at height 10, 1 at height 15+
                    height += ridgeNoise * (0.5 + highMountainFactor * 0.5); // More pronounced ridges
                    
                    // Make high mountains steeper by amplifying height
                    height = 10 + (height - 10) * 1.3; // 30% steeper above height 10
                    
                    // Add even higher peaks (>15)
                    if (height > 15) {
                        height = 15 + (height - 15) * 1.2; // 20% steeper above height 15
                    }
                }
            }

            vertices[j] = height;
        }

        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.computeVertexNormals();
    }
}

export { HeightmapGenerator };
