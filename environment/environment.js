import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';
import { scene, camera } from './scene.js';
import { enemies, questGivers, spawnNPCs } from '../entity/npc.js';
import { player } from '../entity/player.js';
import { Terrain } from './terrain.js';
import { Tree, Bush, Rock, Flower, Campfire, Cactus } from './doodads/land-doodads.js';
import { WaterPuddle, Coral, Seaweed } from './doodads/water-doodads.js';
import { Chest, Portal, SnowPile } from './doodads/special-doodads.js';
import { WaterSystem } from './water.js';
import { TimeSystem } from './TimeSystem.js';
import { SkySystem } from './SkySystem.js';

// Load doodads dynamically
let doodads = [];
let portals = [];
let currentMap = null;
let terrain = null;
let waterSystem = null;
let skySystem = null;
let timeSystem = null;

async function loadMap(mapName) {
    if (terrain) scene.remove(terrain.mesh);
    if (waterSystem) waterSystem.dispose();
    if (skySystem) {
        skySystem.suns.forEach(sun => scene.remove(sun.mesh));
        skySystem.moons.forEach(moon => scene.remove(moon.mesh));
        scene.remove(skySystem.stars);
        scene.remove(skySystem.sky);
        skySystem.cloudSystem.resetClouds();
    }
    doodads.forEach(d => scene.remove(d.mesh));
    enemies.forEach(e => scene.remove(e.mesh));
    questGivers.forEach(qg => scene.remove(qg.mesh));
    if (currentMap?.lighting) {
        scene.remove(currentMap.lighting.directional);
        scene.remove(currentMap.lighting.ambient);
    }

    const response = await fetch(`./maps/${mapName}.json`);
    const mapData = await response.json();
    currentMap = mapData;

    const mapWidth = mapData.width || 400;
    const mapHeight = mapData.height || 400;
    terrain = new Terrain(mapWidth, mapHeight, mapData);

    scene.fog = new THREE.Fog(0xcccccc, 100, 200);

    if (mapData.water) {
        waterSystem = new WaterSystem(
            mapData.water.width || mapWidth, 
            mapData.water.height || mapHeight, 
            mapData.water.level || mapData.waterLevel || 0,
            mapData.water.color || 0x0077be
        );
    }

    const directionalLight = new THREE.DirectionalLight(parseInt(mapData.lighting.directional.color), mapData.lighting.directional.intensity);
    directionalLight.position.set(...mapData.lighting.directional.position);
    scene.add(directionalLight);
    const ambientLight = new THREE.AmbientLight(parseInt(mapData.lighting.ambient.color), mapData.lighting.ambient.intensity);
    scene.add(ambientLight);
    currentMap.lighting = { directional: directionalLight, ambient: ambientLight };

    doodads = generateDoodads(mapData, terrain);
    portals = doodads.filter(d => d instanceof Portal);

    spawnNPCs(mapData);
    doodads.forEach(doodad => doodad.adjustToTerrain(terrain));
    player.adjustToTerrain(terrain);
    enemies.forEach(enemy => enemy.adjustToTerrain(terrain));
    questGivers.forEach(qg => qg.adjustToTerrain(terrain));

    timeSystem = new TimeSystem();
    skySystem = new SkySystem(mapData);
}

function generateDoodads(mapData, terrain) {
    const biome = mapData.biome;
    const doodadConfigs = mapData.doodads || {};
    const doodads = [];
    const halfWidth = terrain.width / 2;
    const halfHeight = terrain.height / 2;
    const maxDoodadsPerType = 500;

    for (const [type, config] of Object.entries(doodadConfigs)) {
        for (const [variant, variantConfig] of Object.entries(config.variants)) {
            const [minElevation, maxElevation] = variantConfig.elevation;

            if ('count' in variantConfig) {
                const numDoodads = variantConfig.count || 1;
                for (let i = 0; i < numDoodads; i++) {
                    let x, z;
                    if (variantConfig.position && i === 0) {
                        x = variantConfig.position.x;
                        z = variantConfig.position.z;
                        const y = terrain.getHeightAt(x, z);
                        if (y < minElevation || y > maxElevation) {
                            console.warn(`Specified position for ${type} (${variant}) at (${x}, ${z}) is outside elevation range [${minElevation}, ${maxElevation}]`);
                        } else {
                            const doodad = createDoodad(type, variant, x, z, biome, variantConfig);
                            if (doodad) doodads.push(doodad);
                            continue;
                        }
                    }
                    let attempts = 0;
                    while (attempts < 10) {
                        x = (Math.random() - 0.5) * terrain.width;
                        z = (Math.random() - 0.5) * terrain.height;
                        const y = terrain.getHeightAt(x, z);
                        const terrainType = terrain.terrainFunc(x, z, y);
                        const isUnderwaterDoodad = type === 'Coral' || type === 'Seaweed';
                        if ((terrainType !== 'water' && !isUnderwaterDoodad) || (terrainType === 'water' && isUnderwaterDoodad)) {
                            if (y >= minElevation && y <= maxElevation) {
                                const doodad = createDoodad(type, variant, x, z, biome, variantConfig);
                                if (doodad) {
                                    doodads.push(doodad);
                                    break;
                                }
                            }
                        }
                        attempts++;
                    }
                    if (attempts >= 10) {
                        console.warn(`Could not place ${type} (${variant}) #${i + 1} within elevation bounds`);
                    }
                }
            } else {
                const density = variantConfig.density || 0;
                const area = terrain.width * terrain.height;
                let numDoodads = Math.floor(area * density);
                if (numDoodads > maxDoodadsPerType) {
                    numDoodads = maxDoodadsPerType;
                    console.log(`Max doodads reached for: ${type}`);
                }

                for (let i = 0; i < numDoodads; i++) {
                    let attempts = 0;
                    while (attempts < 10) {
                        const x = (Math.random() - 0.5) * terrain.width;
                        const z = (Math.random() - 0.5) * terrain.height;
                        const y = terrain.getHeightAt(x, z);
                        const terrainType = terrain.terrainFunc(x, z, y);

                        const isUnderwaterDoodad = type === 'Coral' || type === 'Seaweed';
                        if ((terrainType !== 'water' && !isUnderwaterDoodad) || (terrainType === 'water' && isUnderwaterDoodad)) {
                            if (y >= minElevation && y <= maxElevation) {
                                const doodad = createDoodad(type, variant, x, z, biome, variantConfig);
                                if (doodad) {
                                    doodads.push(doodad);
                                    break;
                                }
                            }
                        }
                        attempts++;
                    }
                }
            }
        }
    }
    return doodads;
}

function createDoodad(type, variant, x, z, biome, variantConfig) {
    switch (type) {
        case 'Tree': return new Tree(x, z, variant, biome);
        case 'Chest': return new Chest(x, z, [{ name: "Sword", type: "weapon", damage: 10 }], variant, biome);
        case 'Rock': return new Rock(x, z, biome, variant);
        case 'Bush': return new Bush(x, z, variant, biome);
        case 'SnowPile': return new SnowPile(x, z, variant, biome);
        case 'Cactus': return new Cactus(x, z, variant, biome);
        case 'WaterPuddle': return new WaterPuddle(x, z, variant, biome);
        case 'Flower': return new Flower(x, z, variant, biome);
        case 'Campfire': return new Campfire(x, z, variant, biome);
        case 'Portal': return new Portal(
            x, z, 
            variantConfig.destinationMap || 'next_biome', 
            variantConfig.requiredQuest || null, 
            variant, 
            biome
        );
        case 'Coral': return new Coral(x, z, variant, biome);
        case 'Seaweed': return new Seaweed(x, z, variant, biome);
        default: return null;
    }
}

function interactWithEnvironment() {
    questGivers.forEach(qg => {
        if (player.mesh.position.distanceTo(qg.mesh.position) < 2) {
            qg.interact(player);
            return;
        }
    });

    doodads.forEach(doodad => {
        if (player.mesh.position.distanceTo(doodad.mesh.position) < 2) {
            doodad.interact();
        }
    });
}

export { loadMap, interactWithEnvironment, doodads, portals, terrain, skySystem, timeSystem };