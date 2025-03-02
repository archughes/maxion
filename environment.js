// environment.js
import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';
import { scene, camera } from './scene.js';
import { enemies, questGivers, spawnNPCs } from './npc.js';
import { player } from './player.js';
import { Terrain } from './terrain.js';
import { 
    Tree, Chest, Rock, Bush, SnowPile, 
    Cactus, WaterPuddle, Flower, Campfire, Portal 
} from './doodads.js';
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
            if (doodad instanceof Chest) {
                doodads.splice(doodads.indexOf(doodad), 1);
            }
        }
    });
}

async function loadMap(mapName) {
    // Clear current map
    if (terrain) scene.remove(terrain.mesh);
    if (waterSystem) waterSystem.dispose();
    if (skySystem) {
        skySystem.suns.forEach(sun => scene.remove(sun.mesh));
        skySystem.moons.forEach(moon => scene.remove(moon.mesh));
        scene.remove(skySystem.stars);
        scene.remove(skySystem.sky);
        skySystem.clouds.forEach(cloud => scene.remove(cloud.mesh));
    }
    
    doodads.forEach(d => scene.remove(d.mesh));
    enemies.forEach(e => scene.remove(e.mesh));
    questGivers.forEach(qg => scene.remove(qg.mesh));
    
    if (currentMap?.lighting) {
        scene.remove(currentMap.lighting.directional);
        scene.remove(currentMap.lighting.ambient);
    }

    // Load new map
    const response = await fetch(`./maps/${mapName}.json`);
    const mapData = await response.json();
    currentMap = mapData;

    // Ground with seed from map file
    const mapWidth = mapData.width || 400;
    const mapHeight = mapData.height || 400;
    terrain = new Terrain(mapWidth, mapHeight, mapData);

    // Set up fog
    const fogColor = 0xcccccc; // Light gray
    const fogNear = 100;       // Fog starts fading in at 100 units
    const fogFar = 200;        // Fully obscured at 200 units
    scene.fog = new THREE.Fog(fogColor, fogNear, fogFar);

    // Water system
    if (mapData.water) {
        waterSystem = new WaterSystem(
            mapData.water.width || mapWidth, 
            mapData.water.height || mapHeight, 
            mapData.water.level || 0,
            mapData.water.color || 0x0077be
        );
    }

    // Lighting
    const directionalLight = new THREE.DirectionalLight(parseInt(mapData.lighting.directional.color), mapData.lighting.directional.intensity);
    directionalLight.position.set(...mapData.lighting.directional.position);
    scene.add(directionalLight);
    const ambientLight = new THREE.AmbientLight(parseInt(mapData.lighting.ambient.color), mapData.lighting.ambient.intensity);
    scene.add(ambientLight);
    currentMap.lighting = { directional: directionalLight, ambient: ambientLight };

    // Doodads
    doodads = mapData.doodads.map(d => {
        const pos = d.position;
        switch (d.type) {
            case "Tree": return new Tree(pos.x, pos.z, d.variant || "oak");
            case "Chest": return new Chest(pos.x, pos.z, d.contents, d.variant || "wood");
            case "Rock": return new Rock(pos.x, pos.z, mapData.biome, d.variant || "normal");
            case "Bush": return new Bush(pos.x, pos.z, d.variant || "berry");
            case "SnowPile": return new SnowPile(pos.x, pos.z, d.variant || "small");
            case "Cactus": return new Cactus(pos.x, pos.z, d.variant || "standard");
            case "WaterPuddle": return new WaterPuddle(pos.x, pos.z, d.variant || "small");
            case "Flower": return new Flower(pos.x, pos.z, d.variant || "rose");
            case "Campfire": return new Campfire(pos.x, pos.z, d.variant || "small");
            case "Portal": return new Portal(pos.x, pos.z, d.destinationMap, d.requiredQuest, d.variant || "purple");
            default: return null;
        }
    }).filter(d => d !== null);

    // Adjust terrain for all doodads
    doodads.forEach(d => d.adjustToTerrain(terrain));
    portals = doodads.filter(d => d instanceof Portal);

    spawnNPCs(mapData);
    
    // Reset player position
    player.adjustToTerrain(terrain);
    enemies.forEach(enemy => enemy.adjustToTerrain(terrain));
    questGivers.forEach(qg => qg.adjustToTerrain(terrain));

    // Initialize time and sky systems
    timeSystem = new TimeSystem();
    skySystem = new SkySystem(mapData);
}

export { loadMap, interactWithEnvironment, doodads, portals, terrain, skySystem, timeSystem };