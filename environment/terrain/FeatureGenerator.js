// FeatureGenerator.js
import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';

class FeatureGenerator {
    constructor(terrain) {
        this.terrain = terrain;
        this.geometry = terrain.geometry;
        this.width = terrain.width;
        this.height = terrain.height;
        this.mapData = terrain.mapData;
        this.noise2D = terrain.noise2D;
        
        // Feature points
        this.pathPoints = [];
        this.riverPoints = [];
        this.lakePoints = [];
        this.bridgePoints = []; // New feature: bridges
        this.waterHeights = new Map();
    }

    // Helper method to check if a point is in water
    isWaterPoint(gridX, gridZ) {
        // Check if point is in a river
        if (this.riverPoints) {
            for (let point of this.riverPoints) {
                const dx = gridX - point.x;
                const dz = gridZ - point.z;
                if (Math.sqrt(dx*dx + dz*dz) <= 2) {
                    return true;
                }
            }
        }
        
        // Check if point is in a lake
        if (this.lakePoints) {
            for (let point of this.lakePoints) {
                const dx = gridX - point.x;
                const dz = gridZ - point.z;
                if (Math.sqrt(dx*dx + dz*dz) <= 2) {
                    return true;
                }
            }
        }
        
        return false;
    }

    // Smoothing function for paths
    smoothPath(points, iterations = 2) {
        for (let iter = 0; iter < iterations; iter++) {
            const smoothedPoints = [...points];
            // Skip first and last points to keep endpoints fixed
            for (let i = 1; i < points.length - 1; i++) {
                smoothedPoints[i] = {
                    x: (points[i-1].x + points[i].x + points[i+1].x) / 3,
                    z: (points[i-1].z + points[i].z + points[i+1].z) / 3
                };
            }
            points = smoothedPoints;
        }
        return points;
    }

    // Create a path from bottom to top of the terrain
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

        const rawPathPoints = [];
        while (currentZ < this.height/2) {
            const gridX = Math.floor((currentX + this.width/2) / segmentWidth);
            const gridZ = Math.floor((currentZ + this.height/2) / segmentHeight);
            
            // Add point to path
            const index = (gridZ * (widthSegments + 1) + gridX) * 3 + 2;
            const height = vertices[index];
            if (height > this.terrain.waterLevel) {
                rawPathPoints.push({x: gridX, z: heightSegments - gridZ}); // 90 degrees mesh correction
                // Move forward with smoother randomness
                currentZ += segmentHeight;
                // Use a smaller factor for randomness to make path smoother
                currentX += (this.noise2D(currentZ * 0.05, 0) * 1.5 - 0.75) * segmentWidth;
                currentX = Math.max(-this.width/2, Math.min(this.width/2, currentX));
            } else {
                currentZ += segmentHeight;
            }
        }

        // Apply path smoothing
        this.pathPoints = this.smoothPath(rawPathPoints, 3);
        return this.pathPoints;
    }

    createRiverAndLake() {
        const vertices = this.geometry.attributes.position.array;
        const vertices0 = vertices.slice();
        const widthSegments = this.geometry.parameters.widthSegments;
        const heightSegments = this.geometry.parameters.heightSegments;
        const segmentWidth = this.width / widthSegments;
        const segmentHeight = this.height / heightSegments;
    
        let currentX = (Math.random() - 0.5) * this.width;
        let currentZ = this.height / 2;
        
        const rawRiverPoints = [];
        let lakeCreated = false;
        const lakeChance = this.mapData.biome === 'spring' ? 0.7 : 0.3;
        
        while (currentZ > -this.height / 2) {
            const gridX = Math.floor((currentX + this.width / 2) / segmentWidth);
            const gridZ = Math.floor((currentZ + this.height / 2) / segmentHeight);
            
            const index = (gridZ * (widthSegments + 1) + gridX) * 3 + 2;
            const height = vertices[index];
            const depthScale = 3;
            const isMountain = height > 10;
            
            const isPath = this.pathPoints.some(p => 
                Math.sqrt(Math.pow(p.x - gridX, 2) + Math.pow(p.z - gridZ, 2)) <= 3
            );

            if (!isMountain && !isPath && (height > this.terrain.waterLevel)) {
                rawRiverPoints.push({x: gridX, z: heightSegments - gridZ}); // 90 degrees mesh correction
                
                // Set water height 1 unit below terrain height for river
                const waterHeight = height - 0.25;
                this.waterHeights.set(`${gridX},${heightSegments - gridZ}`, waterHeight);
                
                if (!lakeCreated && Math.random() < lakeChance && currentZ < this.height / 4) {
                    this.createLake(gridX, gridZ, vertices);
                    lakeCreated = true;
                }
                const isLake = lakeCreated && this.lakePoints.some(p => 
                    Math.sqrt(Math.pow(p.x - gridX, 2) + Math.pow(p.z - (heightSegments - gridZ), 2)) <= 0.1
                )
                
                const nearPath = this.pathPoints.some(p => 
                    Math.sqrt(Math.pow(p.x - gridX, 2) + Math.pow(p.z - (heightSegments - gridZ), 2)) <= 6 &&
                    Math.sqrt(Math.pow(p.x - gridX, 2) + Math.pow(p.z - (heightSegments - gridZ), 2)) > 3
                );
                
                if (nearPath && !this.bridgePoints.some(b => 
                    Math.sqrt(Math.pow(b.x - gridX, 2) + Math.pow(b.z - (heightSegments - gridZ), 2)) <= 10)) {
                    this.createBridge(gridX, gridZ, vertices);
                }

                // Carve river bed with gentler slopes
                for (let i = -4; i <= 4; i++) { // Wider river
                    for (let j = -4; j <= 4; j++) {
                        const gx = gridX + i;
                        const gz = gridZ + j;
                        if (gx >= 0 && gx <= widthSegments && gz >= 0 && gz <= heightSegments) {
                            const rIndex = (gz * (widthSegments + 1) + gx) * 3 + 2;
                            const distance = Math.sqrt(i * i + j * j);
                            this.waterHeights.set(`${gx},${heightSegments - gz}`, Math.max(this.waterHeights.get(`${gx},${heightSegments - gz}`) || -Infinity, vertices0[rIndex] - .25)); // overfill
                            if (distance <= 3) {
                                const edgeFactor = Math.pow((3 - distance)/3, 1.0);
                                const depthAdjustment = depthScale * edgeFactor;
                                if (!isLake) vertices[rIndex] = vertices[rIndex] - depthAdjustment;
                            }
                        }
                    }
                }
            }
            
            currentZ -= segmentHeight;
            currentX += (this.noise2D(currentZ * 0.05, 1) * 1.5 - 0.75) * segmentWidth;
            currentX = Math.max(-this.width / 2, Math.min(this.width / 2, currentX));
            
            if (isMountain || isPath) break;
        }
        
        this.riverPoints = this.smoothPath(rawRiverPoints, 2);
        
        return this.riverPoints;
    }
    
    createLake(centerX, centerZ, vertices) {
        const vertices0 = vertices.slice();
        const lakeSize = this.mapData.biome === 'spring' ? 30 : 20; // Larger in spring
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
                            Math.sqrt(Math.pow(p.x - gx, 2) + Math.pow(p.z - gz, 2)) <= 3
                        );
                        
                        if (!isMountain && !isPath) {
                            this.waterHeights.set(`${gx},${heightSegments - gz}`, Math.max(this.waterHeights.get(`${gx},${heightSegments - gz}`) || -Infinity, vertices0[index] - .25)); // overfill
                            if (distance <= (lakeSize-1)) { // Only color the bottom
                                lakePoints.push({x: gx, z: heightSegments - gz}); // 90 degrees mesh correction
                                // Create shallow depression for lake with smoother edges
                                const edgeFactor = Math.pow((lakeSize - distance) / lakeSize, 1.0);
                                vertices[index] = height - depthScale * edgeFactor;
                            }
                        }
                    }
                }
            }
        }
        
        this.lakePoints = lakePoints;
        return this.lakePoints;
    }

    // New feature: Create a bridge where a path and river nearly intersect
    createBridge(centerX, centerZ, vertices) {
        const bridgeWidth = 3;
        const bridgeLength = 7;
        const bridgeHeight = 2;
        const widthSegments = this.geometry.parameters.widthSegments;
        const heightSegments = this.geometry.parameters.heightSegments;
        
        // Find closest path point to determine bridge orientation
        let closestPathPoint = null;
        let minDistance = Infinity;
        
        for (let point of this.pathPoints) {
            const dx = point.x - centerX;
            const dz = point.z - centerZ;
            const distance = Math.sqrt(dx*dx + dz*dz);
            if (distance < minDistance) {
                minDistance = distance;
                closestPathPoint = point;
            }
        }
        
        if (!closestPathPoint) return;
        
        // Determine bridge orientation (horizontal or vertical)
        const dx = closestPathPoint.x - centerX;
        const dz = closestPathPoint.z - centerZ;
        const isHorizontal = Math.abs(dx) > Math.abs(dz);
        
        // Create bridge points and elevate terrain
        const bridgePoints = [];
        
        for (let i = -bridgeLength; i <= bridgeLength; i++) {
            for (let j = -bridgeWidth; j <= bridgeWidth; j++) {
                const gx = centerX + (isHorizontal ? i : j);
                const gz = centerZ + (isHorizontal ? j : i);
                
                if (gx >= 0 && gx <= widthSegments && gz >= 0 && gz <= heightSegments) {
                    bridgePoints.push({x: gx, z: heightSegments - gz}); // 90 degrees mesh correction
                    
                    // Elevate terrain to create bridge
                    const index = (gz * (widthSegments + 1) + gx) * 3 + 2;
                    vertices[index] = Math.max(vertices[index], bridgeHeight);
                }
            }
        }
        
        this.bridgePoints.push({x: centerX, z: heightSegments - centerZ, points: bridgePoints});
        return bridgePoints;
    }

    // Generate all terrain features
    generateFeatures() {
        const vertices = this.geometry.attributes.position.array;
        
        this.createPath();
        this.createRiverAndLake();
        
        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.computeVertexNormals();
        
        return {
            pathPoints: this.pathPoints,
            riverPoints: this.riverPoints,
            lakePoints: this.lakePoints,
            bridgePoints: this.bridgePoints,
            waterHeights: this.waterHeights
        };
    }
}

export { FeatureGenerator };
