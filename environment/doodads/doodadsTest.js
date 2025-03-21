import * as THREE from '../../lib/three.module.js';
import { OrbitControls } from '../../lib/OrbitControls.js';
import * as SpecialDoodads from './special-doodads.js';
import * as WaterDoodads from './water-doodads.js';
import * as LandDoodads from './land-doodads.js';

// Scene setup
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xcccccc, 150, 250);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 10, 20);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x87ceeb);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);
console.log(`Renderer size: ${renderer.domElement.width}x${renderer.domElement.height}`);

// Configure orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.maxPolarAngle = Math.PI / 2;
controls.target.set(0, 0, 0); // Explicitly set target
controls.update(); // Ensure initial update
console.log("OrbitControls initialized");

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 10);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
scene.add(directionalLight);

// Grid helper for orientation
const gridHelper = new THREE.GridHelper(50, 50);
scene.add(gridHelper);

// Create simple terrain
const groundGeometry = new THREE.PlaneGeometry(100, 100, 32, 32);
const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0x339933,
  side: THREE.DoubleSide,
  wireframe: false
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
ground.castShadow = false;
scene.add(ground);
console.log("Ground added to scene");

// Create terrain with varied heights
function createTerrain() {
  const positions = ground.geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const z = positions.getZ(i);
    const height = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 2;
    positions.setY(i, height);
  }
  ground.geometry.computeVertexNormals();
  ground.geometry.attributes.position.needsUpdate = true;
}

createTerrain();

// Singleton time system
const timeSystem = {
  day: 0,
  time: 12,
  timeScale: 600,
  update(deltaTime) {
    this.time += deltaTime * this.timeScale / 3600;
    if (this.time >= 24) {
      this.time -= 24;
      this.day += 1;
    }
  },
  getTimeOfDay() {
    return this.time;
  },
  getDay() {
    return this.day;
  },
  setTimeOfDay(newTime) {
    this.time = newTime;
    updateTimeDisplay();
  },
  setDay(newDay) {
    this.day = newDay;
    updateDayDisplay();
  }
};

// UI elements
const logBox = document.getElementById('logBox');
const doodadSelect = document.getElementById('doodadSelect');
const biomeSelect = document.getElementById('biomeSelect');
const spawnDoodadBtn = document.getElementById('spawnDoodadBtn');
const interactBtn = document.getElementById('interactBtn');
const timeSlider = document.getElementById('timeSlider');
const timeDisplay = document.getElementById('timeDisplay');
const daySlider = document.getElementById('daySlider');
const dayDisplay = document.getElementById('dayDisplay');
const lodSlider = document.getElementById('lodSlider');
const lodDisplay = document.getElementById('lodDisplay');

// Logging utility
function log(message) {
  console.log(message);
  logBox.value += `${message}\n`;
  logBox.scrollTop = logBox.scrollHeight;
}

// Update UI displays
function updateTimeDisplay() {
  const hours = Math.floor(timeSystem.time);
  const minutes = Math.floor((timeSystem.time - hours) * 60);
  timeDisplay.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  timeSlider.value = timeSystem.time;

  const dayLight = Math.sin((timeSystem.time / 24) * Math.PI) * 0.5 + 0.5;
  ambientLight.intensity = 0.2 + (dayLight * 0.3);
  directionalLight.intensity = 0.3 + (dayLight * 0.7);

  let skyColor;
  if (timeSystem.time < 6) {
    skyColor = new THREE.Color(0x0a1a2a);
  } else if (timeSystem.time < 8) {
    skyColor = new THREE.Color(0xf08020);
  } else if (timeSystem.time < 18) {
    skyColor = new THREE.Color(0x87ceeb);
  } else if (timeSystem.time < 20) {
    skyColor = new THREE.Color(0xf08020);
  } else {
    skyColor = new THREE.Color(0x0a1a2a);
  }
  renderer.setClearColor(skyColor);
}

function updateDayDisplay() {
  dayDisplay.textContent = timeSystem.day;
  daySlider.value = timeSystem.day;
}

function updateLodDisplay() {
  lodDisplay.textContent = lodSlider.value;
}

// Store doodads for interaction
const doodads = [];
let selectedDoodad = null;
let selectionMarker = null;

// Create selection marker
function createSelectionMarker() {
  const geometry = new THREE.RingGeometry(1.5, 1.7, 32);
  const material = new THREE.MeshBasicMaterial({
    color: 0xffff00,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.8
  });
  const ring = new THREE.Mesh(geometry, material);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.1;
  ring.visible = false;
  scene.add(ring);
  return ring;
}

selectionMarker = createSelectionMarker();

const doodadConstructors = {
  'chest-wood': { module: SpecialDoodads, className: 'Chest', args: (x, z, biome) => [x, z, [{ name: "Gold", type: "currency", value: 100 }], 'wood', biome] },
  'chest-gold': { module: SpecialDoodads, className: 'Chest', args: (x, z, biome) => [x, z, [{ name: "Diamond", type: "gem", value: 500 }], 'gold', biome] },
  'chest-iron': { module: SpecialDoodads, className: 'Chest', args: (x, z, biome) => [x, z, [{ name: "Iron Sword", type: "weapon", damage: 15 }], 'iron', biome] },
  'chest-magic': { module: SpecialDoodads, className: 'Chest', args: (x, z, biome) => [x, z, [{ name: "Spell Book", type: "magic", power: 30 }], 'magic', biome] },
  'portal': { module: SpecialDoodads, className: 'Portal', args: (x, z, biome) => [x, z, "secret_realm", "defeat_dragon", "purple", biome] },
  'snowpile-small': { module: SpecialDoodads, className: 'SnowPile', args: (x, z, biome) => [x, z, 'small', biome] },
  'snowpile-large': { module: SpecialDoodads, className: 'SnowPile', args: (x, z, biome) => [x, z, 'large', biome] },
  'tree-oak': { module: LandDoodads, className: 'Tree', args: (x, z, biome) => [x, z, 'oak', biome] },
  'tree-pine': { module: LandDoodads, className: 'Tree', args: (x, z, biome) => [x, z, 'pine', biome] },
  'tree-birch': { module: LandDoodads, className: 'Tree', args: (x, z, biome) => [x, z, 'birch', biome] },
  'tree-autumn': { module: LandDoodads, className: 'Tree', args: (x, z, biome) => [x, z, 'autumn', biome] },
  'bush-berry': { module: LandDoodads, className: 'Bush', args: (x, z, biome) => [x, z, 'berry', biome] },
  'bush-flower': { module: LandDoodads, className: 'Bush', args: (x, z, biome) => [x, z, 'flower', biome] },
  'bush-thorny': { module: LandDoodads, className: 'Bush', args: (x, z, biome) => [x, z, 'thorny', biome] },
  'rock-normal': { module: LandDoodads, className: 'Rock', args: (x, z, biome) => [x, z, biome, 'normal'] },
  'rock-crystal': { module: LandDoodads, className: 'Rock', args: (x, z, biome) => [x, z, biome, 'crystal'] },
  'rock-large': { module: LandDoodads, className: 'Rock', args: (x, z, biome) => [x, z, biome, 'large'] },
  'rock-sharp': { module: LandDoodads, className: 'Rock', args: (x, z, biome) => [x, z, biome, 'sharp'] },
  'flower-rose': { module: LandDoodads, className: 'Flower', args: (x, z, biome) => [x, z, 'rose', biome] },
  'campfire-small': { module: LandDoodads, className: 'Campfire', args: (x, z, biome) => [x, z, 'small', biome] },
  'cactus-standard': { module: LandDoodads, className: 'Cactus', args: (x, z, biome) => [x, z, 'standard', biome] },
  'cactus-flowering': { module: LandDoodads, className: 'Cactus', args: (x, z, biome) => [x, z, 'flowering', biome] },
  'waterpuddle-small': { module: WaterDoodads, className: 'WaterPuddle', args: (x, z, biome) => [x, z, 'small', biome] },
  'coral-red': { module: WaterDoodads, className: 'Coral', args: (x, z, biome) => [x, z, 'red', biome] },
  'coral-blue': { module: WaterDoodads, className: 'Coral', args: (x, z, biome) => [x, z, 'blue', biome] },
  'seaweed-green': { module: WaterDoodads, className: 'Seaweed', args: (x, z, biome) => [x, z, 'green', biome] }
};

// Populate doodadSelect
function populateDoodadSelect() {
  Object.keys(doodadConstructors).forEach(doodadType => {
    const option = document.createElement('option');
    option.value = doodadType;
    const parts = doodadType.split('-');
    const type = parts[0];
    const variant = parts[1] || '';
    const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
    const variantLabel = variant ? ` (${variant.charAt(0).toUpperCase() + variant.slice(1)})` : '';
    option.textContent = `${typeLabel}${variantLabel}`;
    doodadSelect.appendChild(option);
  });
}

// Spawn a new doodad
function spawnDoodad() {
  const doodadType = doodadSelect.value;
  const biome = biomeSelect.value;
  const x = (Math.random() - 0.5) * 40;
  const z = (Math.random() - 0.5) * 40;

  const doodadConfig = doodadConstructors[doodadType];
  if (!doodadConfig) {
    log(`Unknown doodad type: ${doodadType}`);
    return;
  }

  const { module, className, args } = doodadConfig;
  const Constructor = module[className];
  const newDoodad = new Constructor(...args(x, z, biome));

  const terrainHeight = getTerrainHeightAt(x, z);
  newDoodad.object.position.y = terrainHeight;

  newDoodad.object.castShadow = true;
  newDoodad.object.receiveShadow = true;
  newDoodad.object.traverse(child => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  doodads.push(newDoodad);
  scene.add(newDoodad.object);
  log(`Spawned ${doodadType} at (${x.toFixed(2)}, ${z.toFixed(2)})`);
  log(`Scene children count: ${scene.children.length}`);

  selectDoodad(newDoodad);
}

// Get terrain height
function getTerrainHeightAt(x, z) {
  return Math.sin(x * 0.1) * Math.cos(z * 0.1) * 2;
}

// Select a doodad
function selectDoodad(doodad) {
  selectedDoodad = doodad;
  if (selectionMarker && doodad) {
    selectionMarker.position.x = doodad.object.position.x;
    selectionMarker.position.z = doodad.object.position.z;
    selectionMarker.position.y = 0.1;
    selectionMarker.visible = true;
  } else if (selectionMarker) {
    selectionMarker.visible = false;
  }
  log(`Selected doodad: ${doodad ? doodadTypeToString(doodad) : 'None'}`);
}

// Convert doodad to string using doodadConstructors
function doodadTypeToString(doodad) {
  if (!doodad) return 'None';

  const configEntry = Object.entries(doodadConstructors).find(([_, config]) => {
    const Constructor = config.module[config.className];
    return doodad instanceof Constructor;
  });

  if (!configEntry) return 'Unknown';

  const [_, config] = configEntry;
  const className = config.className;
  const variant = doodad.variant || '';
  const extra = config.className === 'Portal' ? ` (to ${doodad.destinationMap})` : '';
  return `${className}${variant ? ` (${variant})` : ''}${extra}`;
}

// Interact with selected doodad
function interactWithSelected() {
  log("Interact button clicked");
  if (selectedDoodad) {
    const result = selectedDoodad.interact();
    log(`Interacted with ${doodadTypeToString(selectedDoodad)}${result ? `: ${JSON.stringify(result)}` : ''}`);
  } else {
    log("No doodad selected");
  }
}

// Raycasting for selection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseClick(event) {
  if (event.target.tagName === 'BUTTON' || event.target.tagName === 'SELECT') return;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const doodadObjects = doodads.map(d => d.object);
  const intersects = raycaster.intersectObjects(doodadObjects, true);

  if (intersects.length > 0) {
    const clickedObject = intersects[0].object;
    let clickedDoodad = null;
    for (const doodad of doodads) {
      if (doodad.object === clickedObject || doodad.object.children.includes(clickedObject)) {
        clickedDoodad = doodad;
        break;
      }
    }
    if (clickedDoodad) {
      selectDoodad(clickedDoodad);
    }
  } else {
    selectDoodad(null);
  }
}

// Event listeners
spawnDoodadBtn.addEventListener('click', spawnDoodad);
interactBtn.addEventListener('click', interactWithSelected);
timeSlider.addEventListener('input', () => timeSystem.setTimeOfDay(parseFloat(timeSlider.value)));
daySlider.addEventListener('input', () => timeSystem.setDay(parseInt(daySlider.value)));
lodSlider.addEventListener('input', updateLodDisplay);
window.addEventListener('click', onMouseClick);
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  log("Window resized");
});

// Log camera info
function logCameraInfo() {
  const pos = camera.position;
  const rot = camera.rotation;
  const distance = pos.distanceTo(controls.target); // Distance from target (zoom indicator)
  console.log(`Camera Position: x=${pos.x.toFixed(2)}, y=${pos.y.toFixed(2)}, z=${pos.z.toFixed(2)}`);
  console.log(`Camera Rotation: x=${rot.x.toFixed(2)}, y=${rot.y.toFixed(2)}, z=${rot.z.toFixed(2)}`);
  console.log(`Distance from Origin (Zoom): ${distance.toFixed(2)}`);
}

// Animation loop
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const deltaTime = clock.getDelta();

  timeSystem.update(deltaTime);

  const completedQuests = [];
  for (const doodad of doodads) {
    if (typeof doodad.update === 'function') {
      doodad.update(deltaTime, completedQuests);
    }
  }

  controls.update();
  renderer.render(scene, camera);
//   logCameraInfo(); // Log camera details each frame
}

// Initialize
function init() {
  log("Doodad Test Environment Started");
  populateDoodadSelect();
  updateTimeDisplay();
  updateDayDisplay();
  updateLodDisplay();
  animate();
}

init();