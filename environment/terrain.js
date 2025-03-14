// terrain.js
import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';
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
        this.waterLevel = -Infinity;
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

    // In terrain.js, within the Terrain class
    renderTerrainMap() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;  // Matches typical world map size for clarity
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        const widthSegments = this.geometry.parameters.widthSegments;
        const heightSegments = this.geometry.parameters.heightSegments;
        const positions = this.geometry.attributes.position.array;

        // Helper function to interpolate colors for grass variation
        function interpolateColor(color1, color2, factor) {
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

        // Render each grid cell based on terrain.terrainFunc
        for (let z = 0; z < heightSegments; z++) {
            for (let x = 0; x < widthSegments; x++) {
                const vertexIndex = z * (widthSegments + 1) + x;
                const index = vertexIndex * 3;
                const vx = positions[index];      // x-coordinate
                const vz = positions[index + 1];  // z-coordinate
                const vy = positions[index + 2];  // y-coordinate (height)

                // Use terrain.terrainFunc to determine the terrain type
                const type = this.terrainFunc(vx, vz, vy, vertexIndex);
                let color;

                // Assign colors based on terrain type
                switch (type) {
                    case 'path':
                        color = '#D2B48C'; // Sandy tan
                        break;
                    case 'river':
                        color = '#4682B4'; // Steel blue
                        break;
                    case 'lake':
                        color = '#4169E1'; // Royal blue
                        break;
                    case 'water':
                        color = '#4682C1'; // Sand near water
                        break;
                    case 'cliff':
                        color = '#5A4D41'; // Dark brown
                        break;
                    case 'mountain':
                        color = '#8B4513'; // Mountain tops
                        break;
                    case 'high mountain':
                        color = '#6E3A10'; // Darker mountain tops
                        break;
                    default: // Grass with noise-based variation
                        const blend = (this.noise2D(vx * 0.1, vz * 0.1) + 1) / 2;
                        color = interpolateColor('#228B22', '#32CD32', blend); // Forest green to light green
                }

                ctx.fillStyle = color;
                const rectWidth = canvas.width / widthSegments;
                const rectHeight = canvas.height / heightSegments;
                ctx.fillRect(x * rectWidth, z * rectHeight, rectWidth, rectHeight);
            }
        }

        this.terrainMapCanvas = canvas; // Store the pre-rendered canvas
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

        const slope = this.calculateSlopeAtVertex(vertexIndex);

        if (y < this.waterLevel) return 'water';
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
            vertices[j] = totalHeight * heightScale + largeScaleNoise + steepLargeScaleNoise * mask;
        }

        this.createPath();
        this.createRiverAndLake();
        
        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.computeVertexNormals();
    }

    smoothstep(edge0, edge1, x) {
        x = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0))); // Clamp between 0 and 1
        return x * x * (3 - 2 * x); // Smooth transition formula
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

    getSlopeAt(x, z) {
        const delta = 1;
        const heightHere = this.getHeightAt(x, z);
        const heightX = this.getHeightAt(x + delta, z);
        const heightZ = this.getHeightAt(x, z + delta);
        const slopeX = (heightX - heightHere) / delta; // Gradient in x-direction
        const slopeZ = (heightZ - heightHere) / delta; // Gradient in z-direction
        const magnitude = Math.sqrt(slopeX * slopeX + slopeZ * slopeZ);
        const direction = new THREE.Vector3(-slopeX, 0, -slopeZ).normalize(); // Downhill direction
        return { magnitude, direction };
    }

    calculateAutoWaterLevel() {
        const heights = Array.from(this.geometry.attributes.position.array)
            .filter((_, i) => i % 3 === 2)
            .sort((a, b) => a - b);
        const percentileIndex = Math.floor(heights.length * 0.3); // 30th percentile
        return heights[percentileIndex] || 0; // Return 0 if array is empty
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