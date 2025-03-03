// terrain.js
import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';
import { scene } from './scene.js';
import { createNoise2D } from 'https://cdn.skypack.dev/simplex-noise';
import createSeededRNG from 'https://cdn.jsdelivr.net/npm/random-seed@0.3.0/+esm';

class Terrain {
    constructor(width, height, mapData) {
        this.width = width;
        this.height = height;
        this.mapData = mapData;
        this.geometry = new THREE.PlaneGeometry(
            width, 
            height, 
            Math.floor(width), 
            Math.floor(height)
        );
        this.generateHeightmap();
        this.setupMaterial();
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.rotation.x = -Math.PI / 2;
        scene.add(this.mesh);
        this.water = this.createWater(mapData) || { position: { y: -Infinity } };
        this.terrainFunc = this.terrainFunc.bind(this);
    }

    setupMaterial() {
        this.geometry.setAttribute('color', new THREE.BufferAttribute(
            new Float32Array(this.geometry.attributes.position.count * 3),
            3
        ));
    
        const positions = this.geometry.attributes.position.array;
        const colors = this.geometry.attributes.color.array;
    
        const seed = this.mapData.seed || 'default';
        const prng = createSeededRNG(seed);
        const noise2D = createNoise2D(prng);
    
        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const z = positions[i + 1];
            const y = positions[i + 2]; // Use direct y-value
            const terrainType = this.terrainFunc(x, z, y, i); // Pass y and index
    
            let finalColor;
            switch (terrainType) {
                case 'water':
                    finalColor = new THREE.Color(0xF4EBC3); // Sand near water
                    break;
                case 'cliff':
                    finalColor = new THREE.Color(0x5A4D41); // Dark brown cliffs
                    break;
                case 'mountain':
                    finalColor = new THREE.Color(0x8B4513); // Mountain tops
                    break;
                case 'high mountain':
                    finalColor = new THREE.Color(0x6E3A10); // Mountain tops
                    break;
                default:
                    // Grass with variation
                    const grassColor1 = new THREE.Color(0x228B22); // Forest green
                    const grassColor2 = new THREE.Color(0x32CD32); // Lime green
                    const blend = (noise2D(x * 0.1, z * 0.1) + 1) / 2;
                    finalColor = grassColor1.clone().lerp(grassColor2, blend);
            }
    
            colors[i] = finalColor.r;
            colors[i + 1] = finalColor.g;
            colors[i + 2] = finalColor.b;
        }
    
        this.material = new THREE.MeshPhongMaterial({
            vertexColors: true,
            flatShading: this.mapData.flatShading || false
        });
    }
    
    terrainFunc(x, z, y, vertexIndex) {
        const waterLevel = this.water ? this.water.position.y : -Infinity;
        const slope = this.calculateSlopeAtVertex(vertexIndex); // Use correct index
    
        if (y < waterLevel + 0.1) return 'water';
        if (y > 5) return 'mountain';
        if (y > 10) return 'high mountain';
        if (slope > 0.6) return 'cliff';
        return 'grass';
    }

    calculateSlopeAtVertex(vertexIndex) {
        const positions = this.geometry.attributes.position.array;
        const widthSegments = this.geometry.parameters.widthSegments;
        const heightSegments = this.geometry.parameters.heightSegments;
        
        // Convert flat index to grid coordinates
        const gridX = (vertexIndex / 3) % (widthSegments + 1);
        const gridZ = Math.floor((vertexIndex / 3) / (widthSegments + 1));

        // Initialize neighbor heights
        let left = 0, right = 0, front = 0, back = 0;

        // Get neighbor heights if they exist
        if (gridX > 0) {
            const leftIndex = vertexIndex - 3;
            left = positions[leftIndex + 2];
        }
        if (gridX < widthSegments) {
            const rightIndex = vertexIndex + 3;
            right = positions[rightIndex + 2];
        }
        if (gridZ > 0) {
            const backIndex = vertexIndex - (widthSegments + 1) * 3;
            back = positions[backIndex + 2];
        }
        if (gridZ < heightSegments) {
            const frontIndex = vertexIndex + (widthSegments + 1) * 3;
            front = positions[frontIndex + 2];
        }

        // Calculate gradients using central differences
        const dx = (right - left) / (2 * this.width / widthSegments);
        const dz = (front - back) / (2 * this.height / heightSegments);
        
        // Return slope magnitude
        return Math.sqrt(dx * dx + dz * dz);
    }

    generateHeightmap() {
        const seed = this.mapData.seed || 'default';
        const prng = createSeededRNG(seed);
        const noise2D = createNoise2D(prng);
        
        const biomeDifficulty = {
            'summer': 1,
            'autumn': 1.5,
            'spring': 2,
            'winter': 2.5
        };
        const difficultyFactor = biomeDifficulty[this.mapData.biome] || 1;
        const heightScale = (this.mapData.heightScale || 5) * difficultyFactor;
        const roughness = this.mapData.terrainRoughness || 0.005;
        const persistence = this.mapData.terrainPersistence || 0.75;
        const lacunarity = this.mapData.terrainLacunarity || 1.5;
        const octaves = this.mapData.terrainOctaves || 3;

        const vertices = this.geometry.attributes.position.array;
        for (let i = 0, j = 2; i < vertices.length; i += 3, j += 3) {
            const x = vertices[i];
            const z = vertices[i + 1];
            let totalHeight = 0;
            let amplitude = 1;
            let frequency = 1;
            for (let o = 0; o < octaves; o++) {
                const sampleX = x * roughness * frequency;
                const sampleZ = z * roughness * frequency;
                totalHeight += noise2D(sampleX, sampleZ) * amplitude;
                amplitude *= persistence;
                frequency *= lacunarity;
            }
            if (this.mapData.biome === "winter") {
                totalHeight = Math.pow(totalHeight, 1.2) * 1.2; // Steeper peaks
            } else if (this.mapData.biome === "summer") {
                totalHeight *= 0.5; // Flatter terrain
            } else if (this.mapData.biome === "spring") {
                totalHeight *= 0.7; // Moderate hills
            }
            vertices[j] = totalHeight * heightScale;
        }
        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.computeVertexNormals();
    }

    calculateAutoWaterLevel() {
        const heights = Array.from(this.geometry.attributes.position.array).filter((_, i) => i % 3 === 2);
        heights.sort((a, b) => a - b);
        const percentileIndex = Math.floor(heights.length * 0.2); // 20th percentile
        return heights[percentileIndex];
    }
    
    createWater(mapData) {
        const biome = mapData.biome || 'summer';
        const waterLevel = mapData.waterLevel !== undefined ? mapData.waterLevel : this.calculateAutoWaterLevel();
    
        // Only create water in certain biomes
        const allowedBiomes = ['autumn', 'spring', 'summer'];
        if (!allowedBiomes.includes(biome)) {
            return null;
        }
    
        const waterGeometry = new THREE.PlaneGeometry(this.width, this.height);
        const waterMaterial = new THREE.MeshPhongMaterial({
            color: 0x0077BE,
            transparent: true,
            opacity: 0.7
        });
    
        const waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
        waterMesh.rotation.x = -Math.PI / 2;
        waterMesh.position.y = waterLevel;
        scene.add(waterMesh);
        return waterMesh;
    }

    calculateAutoWaterLevel() {
        // Analyze heightmap to find natural water level
        const heights = this.geometry.attributes.position.array.filter((_,i) => i%3 === 2);
        return Math.percentile(heights, 30); // Hypothetical percentile function
    }

    getHeightAt(x, z) {
        // Calculate grid coordinates
        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;
        
        // Ensure coordinates are within bounds
        if (x < -halfWidth || x > halfWidth || z < -halfHeight || z > halfHeight) {
            return 0;
        }
        
        // Convert world coordinates to grid coordinates
        const gridX = Math.floor((x + halfWidth) / this.width * (this.geometry.parameters.widthSegments));
        const gridZ = Math.floor((z + halfHeight) / this.height * (this.geometry.parameters.heightSegments));
        
        // Calculate vertex index
        const verticesPerRow = this.geometry.parameters.widthSegments + 1;
        const index = (gridZ * verticesPerRow + gridX) * 3 + 2;
        
        if (index >= 0 && index < this.geometry.attributes.position.array.length) {
            return this.geometry.attributes.position.array[index];
        }
        
        return 0;
    }
}

export { Terrain };