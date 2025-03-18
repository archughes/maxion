// terrain.js
import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';
import { HeightmapGenerator } from './HeightmapGenerator.js';
import { FeatureGenerator } from './FeatureGenerator.js';
import { TerrainColorManager } from './TerrainColorManager.js';

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
        this.noise2D = HeightmapGenerator.createNoise2D(seed);
        
        this.colorManager = new TerrainColorManager();

        // Generate heightmap using the new generator
        const heightmapGenerator = new HeightmapGenerator(this.geometry, this.mapData, this.noise2D);
        heightmapGenerator.generate();

        this.waterLevel = mapData.water?.level || mapData.waterLevel || this.calculateAutoWaterLevel();
        
        // Generate terrain features using the new generator
        const featureGenerator = new FeatureGenerator(this);
        const features = featureGenerator.generateFeatures();
        
        // Store feature points for rendering
        this.pathPoints = features.pathPoints;
        this.riverPoints = features.riverPoints;
        this.lakePoints = features.lakePoints;
        this.bridgePoints = features.bridgePoints;
        this.waterHeights = features.waterHeights;
        
        // this.waterLevel = -Infinity;
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
            const y = positions[i + 2];
            const terrainType = this.terrainFunc(x, z, y, i/3);

            const color = this.colorManager.getColor(terrainType, 0, (this.noise2D(x * 0.1, z * 0.1) + 1) / 2);
            colors[i] = color.r;
            colors[i + 1] = color.g;
            colors[i + 2] = color.b;
        }

        this.material = new THREE.MeshPhongMaterial({
            vertexColors: true,
            flatShading: this.mapData.flatShading || false
        });
    }

    updateWetColors() {
        this.colorManager.updateTerrainColors(this);
    }

    renderTerrainMap(mapData) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;  // Matches typical world map size for clarity
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        const widthSegments = this.geometry.parameters.widthSegments;
        const heightSegments = this.geometry.parameters.heightSegments;
        const positions = this.geometry.attributes.position.array;

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
                const waterColor = mapData.water?.color || '#0077be';

                // Assign colors based on terrain type
                switch (type) {
                    case 'path':
                        color = this.colorManager.colorPalette.path; // Sandy tan
                        break;
                    case 'river':
                        color = waterColor; // Steel blue
                        break;
                    case 'lake':
                        color = waterColor; // Royal blue
                        break;
                    case 'water':
                        color = waterColor; // Sand near water
                        break;
                    case 'cliff':
                        color = this.colorManager.colorPalette.cliff; // Dark brown
                        break;
                    case 'mountain':
                        color = this.colorManager.colorPalette.mountain; // Medium mountain - brown
                        break;
                    case 'high_mountain':
                        color = this.colorManager.colorPalette.high_mountain; // High mountain - darker brown
                        break;
                    case 'snow_peak':
                        color = this.colorManager.colorPalette.snow_peak; // Snow-covered peak - white
                        break;
                    case 'ridge':
                        color = this.colorManager.colorPalette.ridge; // Ridge lines - reddish brown
                        break;
                    case 'bridge':
                        color = this.colorManager.colorPalette.bridge; // Brown bridge color
                        break;
                    case 'beach_sand':
                        color = this.colorManager.colorPalette.beach_sand; // Sandy beach
                        break;
                    default: // Grass with noise-based variation
                        const blend = (this.noise2D(vx * 0.1, vz * 0.1) + 1) / 2;
                        color = this.colorManager.interpolateColor(this.colorManager.colorPalette.grass[0], this.colorManager.colorPalette.grass[1], blend); // Forest green to light green
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
        
        // Check for bridge
        if (this.bridgePoints) {
            for (let bridge of this.bridgePoints) {
                if (bridge.points) {
                    for (let point of bridge.points) {
                        const dx = gridX - point.x;
                        const dz = gridZ - point.z;
                        if (Math.sqrt(dx*dx + dz*dz) <= 1) {
                            return 'bridge';
                        }
                    }
                }
            }
        }
        
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

        // Check for beach areas near ocean water
        if (y > this.waterLevel && y < this.waterLevel + 2) {
            // Check if adjacent to water
            const neighbors = [
                [gridX - 1, gridZ],
                [gridX + 1, gridZ],
                [gridX, gridZ - 1],
                [gridX, gridZ + 1]
            ];

            for (const [nx, nz] of neighbors) {
                if (nx >= 0 && nx < this.geometry.parameters.widthSegments &&
                    nz >= 0 && nz < this.geometry.parameters.heightSegments) {
                    const neighborY = this.geometry.attributes.position.array[(nz * (this.geometry.parameters.widthSegments + 1) + nx) * 3 + 2];
                    if (neighborY <= this.waterLevel) {
                        return 'beach_sand';
                    }
                }
            }
        }

        const slope = this.calculateSlopeAtVertex(vertexIndex);

        if (y < this.waterLevel) return 'water';
        
        // New mountain height classification
        if (y > 15) return 'snow_peak';      // Snow-covered peaks (>15)
        if (y > 10) return 'high_mountain';  // High mountains (10-15)
        if (y > 5) return 'mountain';        // Medium mountains (5-10)
        
        // Ridge detection - high slope areas in mountain regions
        if (y > 5 && slope > 0.8) return 'ridge';
        
        // Cliff detection - steep slopes in lower areas
        if (slope > 0.6) return 'cliff';
        
        return 'grass';
    }

    calculateSlopeAtVertex(vertexIndex) {
        const positions = this.geometry.attributes.position.array;
        const widthSegments = this.geometry.parameters.widthSegments;
        const heightSegments = this.geometry.parameters.heightSegments;
        
        const gridX = vertexIndex % (widthSegments + 1);
        const gridZ = Math.floor(vertexIndex / (widthSegments + 1));
    
        let left = 0, right = 0, front = 0, back = 0;
    
        if (gridX > 0) {
            left = positions[(vertexIndex - 1) * 3 + 2];
        }
        if (gridX < widthSegments) {
            right = positions[(vertexIndex + 1) * 3 + 2];
        }
        if (gridZ > 0) {
            back = positions[(vertexIndex - (widthSegments + 1)) * 3 + 2];
        }
        if (gridZ < heightSegments) {
            front = positions[(vertexIndex + (widthSegments + 1)) * 3 + 2];
        }
    
        const dx = (right - left) / 2;
        const dz = (front - back) / 2;
        
        return Math.sqrt(dx * dx + dz * dz);
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

    getWaterLevel(x, z, preRotationFlag=true) {
        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;
        
        if (x < -halfWidth || x > halfWidth || z < -halfHeight || z > halfHeight) {
            return this.waterLevel; // Default to ocean level outside bounds
        }
        
        const gridX = Math.floor((x + halfWidth) / this.width * (this.geometry.parameters.widthSegments));
        let gridZ = Math.floor((z + halfHeight) / this.height * (this.geometry.parameters.heightSegments));
        if (preRotationFlag) gridZ = this.geometry.parameters.heightSegments - gridZ;
        const key = `${gridX},${gridZ}`;
        
        if (this.waterHeights.has(key)) {
            return Math.max(this.waterHeights.get(key), this.waterLevel); // Use river/lake height, but not below ocean level
        }
        
        return this.waterLevel; // Default to ocean level
    }

    calculateAutoWaterLevel() {
        const heights = Array.from(this.geometry.attributes.position.array)
            .filter((_, i) => i % 3 === 2)
            .sort((a, b) => a - b);
        const percentileIndex = Math.floor(heights.length * 0.3); // 30th percentile
        this.waterLevel = heights[percentileIndex] || 0; // Return 0 if array is empty
        return this.waterLevel;
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