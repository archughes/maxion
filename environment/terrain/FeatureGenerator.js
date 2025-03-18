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

    // Create a river and potentially a lake
    createRiverAndLake() {
        const vertices = this.geometry.attributes.position.array;
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
            const depthScale = 5;
            const isMountain = height > 10;
            
            // Check if this would cross a path
            const isPath = this.pathPoints.some(p => 
                Math.sqrt(Math.pow(p.x - gridX, 2) + Math.pow(p.z - gridZ, 2)) <= 3
            );
            
            if (!isMountain && !isPath && (height > this.terrain.waterLevel)) {
                rawRiverPoints.push({x: gridX, z: heightSegments - gridZ}); // 90 degrees mesh correction
                
                // Create a lake with some probability
                if (!lakeCreated && Math.random() < lakeChance && currentZ < this.height / 4) {
                    this.createLake(gridX, gridZ, vertices);
                    lakeCreated = true;
                }
                
                // Create a bridge if river crosses near a path
                const nearPath = this.pathPoints.some(p => 
                    Math.sqrt(Math.pow(p.x - gridX, 2) + Math.pow(p.z - gridZ, 2)) <= 6 &&
                    Math.sqrt(Math.pow(p.x - gridX, 2) + Math.pow(p.z - gridZ, 2)) > 3
                );
                
                if (nearPath && !this.bridgePoints.some(b => 
                    Math.sqrt(Math.pow(b.x - gridX, 2) + Math.pow(b.z - gridZ, 2)) <= 10)) {
                    this.createBridge(gridX, gridZ, vertices);
                }
                
                // Carve river bed with gentler slopes
                for (let i = -3; i <= 3; i++) { // Wider river
                    for (let j = -3; j <= 3; j++) {
                        const gx = gridX + i;
                        const gz = gridZ + j;
                        if (gx >= 0 && gx <= widthSegments && gz >= 0 && gz <= heightSegments) {
                            const rIndex = (gz * (widthSegments + 1) + gx) * 3 + 2;
                            const distance = Math.sqrt(i * i + j * j);
                            if (distance <= 2) {
                                // Create a more gradual slope at the edges
                                const edgeFactor = distance < 1 ? 1 : Math.pow((2 - distance) / 1, 2);
                                const depthAdjustment = depthScale * edgeFactor;
                                vertices[rIndex] = Math.max(-depthScale, vertices[rIndex] - depthAdjustment);
                            }
                        }
                    }
                }
            }
            
            currentZ -= segmentHeight;
            // Smoother river path
            currentX += (this.noise2D(currentZ * 0.05, 1) * 1.5 - 0.75) * segmentWidth;
            currentX = Math.max(-this.width / 2, Math.min(this.width / 2, currentX));
            
            if (isMountain || isPath) break;
        }
        
        // Apply river smoothing
        this.riverPoints = this.smoothPath(rawRiverPoints, 2);
        
        return this.riverPoints;
    }
    
    // Create a lake
    createLake(centerX, centerZ, vertices) {
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
                            if (distance <= (lakeSize-1)) { // Only color the bottom
                                lakePoints.push({x: gx, z: heightSegments - gz}); // 90 degrees mesh correction
                            }
                            // Create shallow depression for lake with smoother edges
                            const edgeFactor = Math.pow((lakeSize - distance) / lakeSize, 1.5);
                            vertices[index] = height - depthScale * edgeFactor;
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
        
        // First create the path
        this.createPath();
        
        // Then create river and lake
        this.createRiverAndLake();
        
        // Update geometry
        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.computeVertexNormals();
        
        // Return all feature points for the terrain to use
        return {
            pathPoints: this.pathPoints,
            riverPoints: this.riverPoints,
            lakePoints: this.lakePoints,
            bridgePoints: this.bridgePoints
        };
    }
}

export { FeatureGenerator };
