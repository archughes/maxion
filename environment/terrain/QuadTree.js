// QuadTree.js
import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';
import createSeededRNG from 'https://cdn.jsdelivr.net/npm/random-seed@0.3.0/+esm';

export class QuadTree {
    constructor(bounds, level, maxLevel, terrain, parentSeed) {
        this.bounds = bounds; // {xMin, xMax, zMin, zMax}
        this.level = level; // 0 is lowest resolution (1x)
        this.maxLevel = maxLevel; // e.g., 3 for 8x (2^3)
        this.terrain = terrain;
        this.children = null;
        this.mesh = null;

        // Generate seed for this chunk
        const prng = createSeededRNG(parentSeed || terrain.mapData.seed || 'default');
        this.seed = `${parentSeed || terrain.mapData.seed}-${level}-${bounds.xMin}-${bounds.zMin}`;
        this.noise2D = terrain.heightmapGenerator.createNoise2D(this.seed);
    }

    split() {
        if (this.level >= this.maxLevel) return;
        const { xMin, xMax, zMin, zMax } = this.bounds;
        const xMid = (xMin + xMax) / 2;
        const zMid = (zMin + zMax) / 2;
        this.children = [
            new QuadTree({ xMin, xMax: xMid, zMin, zMax: zMid }, this.level + 1, this.maxLevel, this.terrain, this.seed),
            new QuadTree({ xMin: xMid, xMax, zMin, zMax: zMid }, this.level + 1, this.maxLevel, this.terrain, this.seed),
            new QuadTree({ xMin, xMax: xMid, zMin: zMid, zMax }, this.level + 1, this.maxLevel, this.terrain, this.seed),
            new QuadTree({ xMin: xMid, xMax, zMin: zMid, zMax }, this.level + 1, this.maxLevel, this.terrain, this.seed)
        ];
    }

    traverse(cameraPosition, scene) {
        const distance = this.getDistanceToCamera(cameraPosition);
        const threshold = this.getDistanceThreshold();
        if (distance > threshold || this.level >= this.maxLevel) {
            if (!this.mesh) {
                this.generateMesh();
            }
            if (!scene.children.includes(this.mesh)) {
                scene.add(this.mesh);
            }
        } else {
            if (this.mesh && scene.children.includes(this.mesh)) {
                scene.remove(this.mesh);
            }
            if (!this.children) {
                this.split();
            }
            this.children.forEach(child => child.traverse(cameraPosition, scene));
        }
    }

    getDistanceToCamera(cameraPosition) {
        const centerX = (this.bounds.xMin + this.bounds.xMax) / 2;
        const centerZ = (this.bounds.zMin + this.bounds.zMax) / 2;
        const dx = centerX - cameraPosition.x;
        const dz = centerZ - cameraPosition.z;
        return Math.sqrt(dx * dx + dz * dz);
    }

    getDistanceThreshold() {
        // Higher level (higher resolution) has smaller threshold
        return 400 * Math.pow(2, this.maxLevel - this.level);
    }

    generateMesh() {
        const { xMin, xMax, zMin, zMax } = this.bounds;
        const width = xMax - xMin;
        const height = zMax - zMin;
        const segments = 50; // Base segments, consistent across LOD for vertex density control
        const geometry = new THREE.PlaneGeometry(width, height, segments, segments);
        const positions = geometry.attributes.position.array;
        const colors = new Float32Array(positions.length);

        for (let i = 0; i < positions.length; i += 3) {
            const xLocal = positions[i];
            const yLocal = positions[i + 1];
            const worldX = xLocal + (xMin + xMax) / 2;
            const worldZ = -yLocal + (zMin + zMax) / 2;
            const height = this.terrain.getHeightAt(worldX, worldZ, this.noise2D);
            positions[i + 2] = height;

            const type = this.terrain.getTerrainTypeAt(worldX, worldZ, height);
            const color = this.terrain.colorManager.getColor(type, 0, (this.noise2D(worldX * 0.1, worldZ * 0.1) + 1) / 2);
            colors[i] = color.r;
            colors[i + 1] = color.g;
            colors[i + 2] = color.b;

            // Update waterHeights dynamically
            const waterHeight = this.terrain.getWaterHeightAt(worldX, worldZ);
            const gridX = Math.floor((worldX + this.terrain.width / 2) / (this.terrain.width / segments));
            const gridZ = Math.floor((worldZ + this.terrain.height / 2) / (this.terrain.height / segments));
            this.terrain.waterHeights.set(`${gridX},${gridZ}`, waterHeight);
        }

        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.computeVertexNormals();

        this.mesh = new THREE.Mesh(geometry, this.terrain.material);
        this.mesh.position.set((xMin + xMax) / 2, 0, (zMin + zMax) / 2);
        this.mesh.rotation.x = -Math.PI / 2;
    }
}