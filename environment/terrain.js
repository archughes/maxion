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

        const seed = this.mapData.seed || 'default';
        const prng = createSeededRNG(seed);
        this.noise2D = createNoise2D(prng);
        
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
    
        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const z = positions[i + 1];
            const y = positions[i + 2]; // Use direct y-value
            const terrainType = this.terrainFunc(x, z, y, i); // Pass y and index
    
            let finalColor;
            switch (terrainType) {
                case 'path':
                    finalColor = new THREE.Color(0xD2B48C); // Sandy tan color
                    break;
                case 'river':
                    finalColor = new THREE.Color(0x4682B4); // Steel blue
                    break;
                case 'lake':
                    finalColor = new THREE.Color(0x4169E1); // Royal blue
                    break;
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
                    const grassColor1 = new THREE.Color(0x228B22); // Forest green
                    const grassColor2 = new THREE.Color(0x32CD32); // Lime green
                    const blend = (this.noise2D(x * 0.1, z * 0.1) + 1) / 2;
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
        const gridX = Math.floor((x + this.width/2) / (this.width / this.geometry.parameters.widthSegments));
        const gridZ = Math.floor((z + this.height/2) / (this.height / this.geometry.parameters.heightSegments));
        
        // Check path first
        if (this.pathPoints) {
            for (let point of this.pathPoints) {
                const dx = gridX - point.x;
                const dz = gridZ - point.z;
                if (Math.sqrt(dx*dx + dz*dz) <= 2) {
                    return 'path';
                }
            }
        }
        
        // Check river
        if (this.riverPoints) {
            for (let point of this.riverPoints) {
                const dx = gridX - point.x;
                const dz = gridZ - point.z;
                if (Math.sqrt(dx*dx + dz*dz) <= 1.5) {
                    return 'river';
                }
            }
        }
        
        // Check lake
        if (this.lakePoints) {
            for (let point of this.lakePoints) {
                const dx = gridX - point.x;
                const dz = gridZ - point.z;
                if (Math.sqrt(dx*dx + dz*dz) <= 1) { // Tighter radius for lake edge
                    return 'lake';
                }
            }
        }

        const waterLevel = this.water ? this.water.position.y : -Infinity;
        const slope = this.calculateSlopeAtVertex(vertexIndex);

        if (y < waterLevel + 0.1) return 'water';
        if (y > 10) return 'high mountain';
        if (y > 5) return 'mountain';
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
                totalHeight += this.noise2D(sampleX, sampleZ) * amplitude;
                amplitude *= persistence;
                frequency *= lacunarity;
            }
            vertices[j] = totalHeight * heightScale;
        }
        
        this.generateMountainRange();
        this.createPath();
        this.createRiverAndLake();
        
        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.computeVertexNormals();
    }

    generateMountainRange() {
        const biomeMountains = {
            'summer': 1,
            'autumn': 2,
            'spring': 3,
            'winter': 4
        };
        const nRanges = biomeMountains[this.mapData.biome] || 1;
        const vertices = this.geometry.attributes.position.array;
        const widthSegments = this.geometry.parameters.widthSegments;
        const heightSegments = this.geometry.parameters.heightSegments;
        const segmentWidth = this.width / widthSegments;
        const segmentHeight = this.height / heightSegments;
        const baseHeightScale = 10;
        const rangeSize = 25; // Desired size of the mountain range (25x25 units)
    
        for (let range = 0; range < nRanges; range++) {
            // Random center point for the mountain range
            const centerX = (Math.random() - 0.5) * this.width;
            const centerZ = (Math.random() - 0.5) * this.height;
    
            // Convert center to grid coordinates
            const gridX = Math.floor((centerX + this.width / 2) / segmentWidth);
            const gridZ = Math.floor((centerZ + this.height / 2) / segmentHeight);
    
            // Random height multiplier for this range (between 0.5 and 1.5 for variety)
            const heightMultiplier = 0.5 + Math.random(); // Range: 0.5 to 1.5
    
            // Random orientation factor to avoid uniform directionality
            const angle = Math.random() * Math.PI * 2; // Random rotation angle
            const stretchX = 0.5 + Math.random(); // Random stretch in X (0.5 to 1.5)
            const stretchZ = 0.5 + Math.random(); // Random stretch in Z (0.5 to 1.5)
    
            // Define the 25x25 unit area
            const halfSize = Math.floor(rangeSize / segmentWidth / 2);
    
            for (let i = -halfSize; i <= halfSize; i++) {
                for (let j = -halfSize; j <= halfSize; j++) {
                    const gx = gridX + i;
                    const gz = gridZ + j;
                    if (gx >= 0 && gx <= widthSegments && gz >= 0 && gz <= heightSegments) {
                        const index = (gz * (widthSegments + 1) + gx) * 3 + 2;
    
                        // Adjust coordinates for random orientation
                        const relX = i / halfSize; // Normalized [-1, 1]
                        const relZ = j / halfSize; // Normalized [-1, 1]
    
                        // Apply stretching and rotation
                        const rotX = relX * stretchX * Math.cos(angle) - relZ * stretchZ * Math.sin(angle);
                        const rotZ = relX * stretchX * Math.sin(angle) + relZ * stretchZ * Math.cos(angle);
                        const distance = Math.sqrt(rotX * rotX + rotZ * rotZ);
    
                        // Gaussian falloff with random height multiplier
                        const maxDistance = 1; // Normalized distance
                        const heightBoost = baseHeightScale * heightMultiplier * Math.exp(-distance * distance / 0.5);
    
                        // Add height instead of taking max
                        vertices[index] += heightBoost;
                    }
                }
            }
        }
    }

    createPath() {
        const vertices = this.geometry.attributes.position.array;
        const widthSegments = this.geometry.parameters.widthSegments;
        const heightSegments = this.geometry.parameters.heightSegments;
        const segmentWidth = this.width / widthSegments;
        const segmentHeight = this.height / heightSegments;
        const widthScale = 4;

        // Start at random point on bottom edge
        let currentX = (Math.random() - 0.5) * this.width;
        let currentZ = -this.height/2;

        const pathPoints = [];
        while (currentZ < this.height/2) {
            const gridX = Math.floor((currentX + this.width/2) / segmentWidth);
            const gridZ = Math.floor((currentZ + this.height/2) / segmentHeight);
            pathPoints.push({x: gridX, z: gridZ});

            // Move forward with some randomness
            currentZ += segmentHeight;
            currentX += (this.noise2D(currentZ * 0.1, 0) * 2 - 1) * segmentWidth;
            currentX = Math.max(-this.width/2, Math.min(this.width/2, currentX));
        }

        // Smooth path and surrounding area
        for (let point of pathPoints) {
            for (let i = -widthScale; i <= widthScale; i++) {
                for (let j = -widthScale; j <= widthScale; j++) {
                    const gx = point.x + i;
                    const gz = point.z + j;
                    if (gx >= 0 && gx <= widthSegments && gz >= 0 && gz <= heightSegments) {
                        const index = (gz * (widthSegments + 1) + gx) * 3 + 2;
                        const distance = Math.sqrt(i*i + j*j);
                        if (distance <= 2) {
                            // Smooth by averaging with neighbors
                            let avgHeight = 0;
                            let count = 0;
                            for (let ni = -1; ni <= 1; ni++) {
                                for (let nj = -1; nj <= 1; nj++) {
                                    const ngx = gx + ni;
                                    const ngz = gz + nj;
                                    if (ngx >= 0 && ngx <= widthSegments && ngz >= 0 && ngz <= heightSegments) {
                                        const nIndex = (ngz * (widthSegments + 1) + ngx) * 3 + 2;
                                        avgHeight += vertices[nIndex];
                                        count++;
                                    }
                                }
                            }
                            vertices[index] = avgHeight / count;
                        }
                    }
                }
            }
        }
        this.pathPoints = pathPoints; // Store for terrainFunc
    }

    createRiverAndLake() {
        const vertices = this.geometry.attributes.position.array;
        const widthSegments = this.geometry.parameters.widthSegments;
        const heightSegments = this.geometry.parameters.heightSegments;
        const segmentWidth = this.width / widthSegments;
        const segmentHeight = this.height / heightSegments;
    
        let currentX = (Math.random() - 0.5) * this.width;
        let currentZ = this.height / 2;
        
        const riverPoints = [];
        let lakeCreated = false;
        const lakeChance = this.mapData.biome === 'spring' ? 0.7 : 0.3;
        
        while (currentZ > -this.height / 2) {
            const gridX = Math.floor((currentX + this.width / 2) / segmentWidth);
            const gridZ = Math.floor((currentZ + this.height / 2) / segmentHeight);
            
            const index = (gridZ * (widthSegments + 1) + gridX) * 3 + 2;
            const height = vertices[index];
            const depthScale = 5;
            const isMountain = height > 10;
            const isPath = this.pathPoints.some(p => 
                Math.sqrt(Math.pow(p.x - gridX, 2) + Math.pow(p.z - gridZ, 2)) <= 2
            );
            
            if (!isMountain && !isPath) {
                riverPoints.push({x: gridX, z: gridZ});
                
                if (!lakeCreated && Math.random() < lakeChance && currentZ < this.height / 4) {
                    this.createLake(gridX, gridZ, vertices); // Pass vertices, but not widthSegments or heightSegments
                    lakeCreated = true;
                }
                
                // Carve river bed
                for (let i = -1; i <= 1; i++) {
                    for (let j = -1; j <= 1; j++) {
                        const gx = gridX + i;
                        const gz = gridZ + j;
                        if (gx >= 0 && gx <= widthSegments && gz >= 0 && gz <= heightSegments) {
                            const rIndex = (gz * (widthSegments + 1) + gx) * 3 + 2;
                            const distance = Math.sqrt(i * i + j * j);
                            if (distance <= 1.5 && vertices[rIndex] > -1) {
                                vertices[rIndex] = Math.max(-depthScale, vertices[rIndex] - 2 * depthScale * (1.5 - distance));
                            }
                        }
                    }
                }
            }
            
            currentZ -= segmentHeight;
            currentX += (this.noise2D(currentZ * 0.1, 1) * 2 - 1) * segmentWidth;
            currentX = Math.max(-this.width / 2, Math.min(this.width / 2, currentX));
            
            if (isMountain || isPath) break;
        }
        
        this.riverPoints = riverPoints;
    }
    
    createLake(centerX, centerZ, vertices) {
        const lakeSize = this.mapData.biome === 'spring' ? 15 : 10; // Larger in spring
        const depthScale = 10;
        const lakePoints = [];
        const widthSegments = this.geometry.parameters.widthSegments;
        const heightSegments = this.geometry.parameters.heightSegments;
        
        for (let i = -lakeSize; i <= lakeSize; i++) {
            for (let j = -lakeSize; j <= lakeSize; j++) {
                const gx = centerX + i;
                const gz = centerZ + j;
                if (gx >= 0 && gx <= widthSegments && gz >= 0 && gz <= heightSegments) {
                    const distance = Math.sqrt(i*i + j*j);
                    if (distance <= lakeSize) {
                        const index = (gz * (widthSegments + 1) + gx) * 3 + 2;
                        const height = vertices[index];
                        const isMountain = height > 5;
                        const isPath = this.pathPoints.some(p => 
                            Math.sqrt(Math.pow(p.x - gx, 2) + Math.pow(p.z - gz, 2)) <= 2
                        );
                        
                        if (!isMountain && !isPath) {
                            lakePoints.push({x: gx, z: gz});
                            // Create shallow depression for lake
                            const depth = Math.max(-depthScale, -depthScale * (1 - distance/lakeSize));
                            vertices[index] = Math.max(depth, vertices[index] - depthScale * (1 - distance/lakeSize));
                        }
                    }
                }
            }
        }
        
        this.lakePoints = lakePoints;
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