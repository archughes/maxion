import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';
import { scene } from './scene.js';

class Cloud {
  constructor(type = 'cumulus') {
    this.type = type;
    this.mesh = new THREE.Group();
    this.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 1.0,
      0,
      (Math.random() - 0.5) * 1.0
    );
    this.elevation = this.getElevationForType(type);
    this.waterWeight = 0.5 + Math.random() * 0.5;
    this.isPrecipitating = false;
    this.precipType = null;
    this.sizeValue = 1;
    this.speedMultiplier = 2.0;
    
    switch(type) {
      case 'cirrus': this.createCirrus(); break;
      case 'cumulus': this.createCumulus(); break;
      case 'stratus': this.createStratus(); break;
      case 'nimbus': this.createNimbus(); break;
      case 'fractal': this.createFractal(); break;
      default: this.createCumulus();
    }
    
    this.mesh.position.set(
      (Math.random() - 0.5) * 200,
      this.elevation,
      (Math.random() - 0.5) * 200
    );
    scene.add(this.mesh);
    this.updateColor();
  }
  
  getElevationForType(type) {
    switch(type) {
      case 'cirrus': return 80 + Math.random() * 10;
      case 'cumulus': return 60 + Math.random() * 10;
      case 'stratus': return 40 + Math.random() * 10;
      case 'nimbus': return 50 + Math.random() * 10;
      case 'fractal': return 60 + Math.random() * 10;
      default: return 60;
    }
  }
  
  updateColor() {
    // Map waterWeight [0,2] => [invisible -> white -> dark-blue-gray]
    let norm = THREE.MathUtils.clamp(this.waterWeight, 0, 2) / 2;
    this.mesh.children.forEach(part => {
      if (norm < 0.5) {
        let baseOp = part.material.opacity || 1;
        part.material.opacity = THREE.MathUtils.lerp(0, baseOp, norm/0.5);
        part.material.color.set(0xffffff);
      } else {
        let t = (norm - 0.5) / 0.5;
        let color = new THREE.Color(0xffffff).lerp(new THREE.Color(0x4f5b66), t);
        part.material.color.copy(color);
      }
      part.material.needsUpdate = true;
    });
  }
  
  createCirrus() {
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.2 + Math.random() * 0.2
    });
    const baseSize = 25 + Math.random() * 25;
    this.sizeValue = baseSize;
    for (let i = 0; i < 10; i++) {
      const geo = new THREE.SphereGeometry(baseSize * (0.3 + Math.random() * 0.3), 6, 6);
      const part = new THREE.Mesh(geo, material.clone());
      part.position.set(
        (Math.random() - 0.5) * baseSize * 2,
        (Math.random() - 0.5) * baseSize * 0.5,
        (Math.random() - 0.5) * baseSize * 2
      );
      this.mesh.add(part);
    }
  }
  
  createCumulus() {
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.5 + Math.random() * 0.3
    });
    const baseSize = 10 + Math.random() * 10;
    this.sizeValue = baseSize;
    for (let i = 0; i < 5; i++) {
      const geo = new THREE.SphereGeometry(baseSize * (0.6 + Math.random() * 0.4), 8, 8);
      const part = new THREE.Mesh(geo, material.clone());
      part.position.set(
        (Math.random() - 0.5) * baseSize,
        (Math.random() - 0.5) * baseSize,
        (Math.random() - 0.5) * baseSize
      );
      this.mesh.add(part);
    }
  }
  
  createStratus() {
    const material = new THREE.MeshBasicMaterial({
      color: 0xd3d3d3,
      transparent: true,
      opacity: 0.3 + Math.random() * 0.2
    });
    const baseSize = 15 + Math.random() * 10;
    this.sizeValue = baseSize;
    for (let i = 0; i < 4; i++) {
      const geo = new THREE.SphereGeometry(baseSize * (0.8 + Math.random() * 0.4), 16, 16);
      const part = new THREE.Mesh(geo, material.clone());
      part.scale.set(1.5, 0.1 + Math.random() * 0.1, 1.5);
      part.position.set(
        (Math.random() - 0.5) * baseSize * 0.8,
        (Math.random() - 0.5) * baseSize * 0.2,
        (Math.random() - 0.5) * baseSize * 0.8
      );
      this.mesh.add(part);
    }
  }
  
  createNimbus() {
    const material = new THREE.MeshBasicMaterial({
      color: 0x4682b4,
      transparent: true,
      opacity: 0.6 + Math.random() * 0.3
    });
    const baseSize = 10 + Math.random() * 10;
    this.sizeValue = baseSize;
    for (let i = 0; i < 8; i++) {
      const geo = new THREE.SphereGeometry(baseSize * (0.5 + Math.random() * 0.5), 8, 8);
      const part = new THREE.Mesh(geo, material.clone());
      part.position.set(
        (Math.random() - 0.5) * baseSize * 1.5,
        (Math.random() - 0.5) * baseSize,
        (Math.random() - 0.5) * baseSize * 1.5
      );
      this.mesh.add(part);
    }
  }
  
  createFractal() {
    const material = new THREE.MeshBasicMaterial({
      color: 0xf0f0f0,
      transparent: true,
      opacity: 0.3 + Math.random() * 0.3
    });
    const baseSize = 3 + Math.random() * 3;
    this.sizeValue = baseSize;
    const addParts = (size, depth) => {
      if (depth <= 0) return;
      const geo = new THREE.SphereGeometry(size, 6, 6);
      const part = new THREE.Mesh(geo, material.clone());
      part.position.set(
        (Math.random() - 0.5) * size * 2,
        (Math.random() - 0.5) * size,
        (Math.random() - 0.5) * size * 2
      );
      this.mesh.add(part);
      for (let i = 0; i < 3; i++) {
        addParts(size * 0.6, depth - 1);
      }
    };
    addParts(baseSize, 3);
  }
  
  startPrecipitation(type) {
    this.isPrecipitating = true;
    this.precipType = type;
    let precip;
    if (type === 'rain') {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(100 * 3);
      for (let i = 0; i < 100; i++) {
        positions[i * 3] = (Math.random() - 0.5) * this.sizeValue;
        positions[i * 3 + 1] = -Math.random() * this.sizeValue; // Start at random height below cloud
        positions[i * 3 + 2] = (Math.random() - 0.5) * this.sizeValue;
      }
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const material = new THREE.LineBasicMaterial({ color: 0xaaaaaa });
      precip = new THREE.LineSegments(geometry, material);
    } else if (type === 'snow') {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(100 * 3);
      for (let i = 0; i < 100; i++) {
        positions[i * 3] = (Math.random() - 0.5) * this.sizeValue;
        positions[i * 3 + 1] = -Math.random() * this.sizeValue;
        positions[i * 3 + 2] = (Math.random() - 0.5) * this.sizeValue;
      }
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const material = new THREE.LineBasicMaterial({ color: 0xffffff });
      precip = new THREE.LineSegments(geometry, material);
    }
    precip.name = 'precipitation';
    this.mesh.add(precip);
  }

  steerTowardTerrain(terrainFunc, deltaTime) {
    const pos = this.mesh.position;
    const currentTerrain = terrainFunc(pos.x, pos.z);
    const steerForce = new THREE.Vector3(0, 0, 0);

    // Sample nearby terrain in a small radius
    const sampleRadius = 10;
    const directions = [
      new THREE.Vector3(sampleRadius, 0, 0),
      new THREE.Vector3(-sampleRadius, 0, 0),
      new THREE.Vector3(0, 0, sampleRadius),
      new THREE.Vector3(0, 0, -sampleRadius)
    ];

    directions.forEach(dir => {
      const samplePos = pos.clone().add(dir);
      const terrainType = terrainFunc(samplePos.x, samplePos.z);
      let influence = 0;

      switch (terrainType) {
        case 'high mountain':
            influence = 0.4; // Strong attraction to high mountains
            break;
        case 'mountain':
            influence = 0.65; // Stronger attraction to mountains
            break;
        case 'path':
            influence = 0.3; // Moderate attraction to paths (good for travel)
            break;
        case 'river':
            influence = 0.25; // Moderate attraction to rivers (water source)
            break;
        case 'lake':
            influence = 0.35; // Slightly stronger attraction to lakes
            break;
        case 'water':
            influence = 0.2; // Mild attraction to general water
            break;
        case 'cliff':
            influence = -0.1; // Slight repulsion from cliffs (danger)
            break;
        case 'grass':
            influence = -0.05; // Very slight repulsion from grass (neutral)
            break;
      }

      // Steer toward (positive) or away from (negative) the sampled point
      steerForce.add(dir.clone().normalize().multiplyScalar(influence));
    });

    // Apply steering to velocity
    this.velocity.add(steerForce.multiplyScalar(deltaTime * this.speedMultiplier));
    this.velocity.clampLength(0, 1.0 * this.speedMultiplier); // Cap max speed
  }

  // Encourage aggregation with nearby clouds
  aggregateWithClouds(clouds, deltaTime) {
    const aggregationRadius = 20; // Distance within which clouds influence each other
    const pos = this.mesh.position;
    const alignmentForce = new THREE.Vector3(0, 0, 0);
    let nearbyCount = 0;

    clouds.forEach(other => {
      if (other === this) return;
      const distance = pos.distanceTo(other.mesh.position);
      if (distance < aggregationRadius) {
        // Align velocity with nearby clouds
        alignmentForce.add(other.velocity);
        nearbyCount++;
      }
    });

    if (nearbyCount > 0) {
      alignmentForce.divideScalar(nearbyCount); // Average velocity of neighbors
      this.velocity.lerp(alignmentForce, deltaTime * 0.5); // Gradually align
    }
  }

  update(deltaTime, terrainFunc, clouds) { // Added clouds parameter
    // Steer based on terrain
    if (terrainFunc) {
      this.steerTowardTerrain(terrainFunc, deltaTime);

      // Existing terrain-based water weight logic
      const terrainType = terrainFunc(this.mesh.position.x, this.mesh.position.z);
      if (terrainType === 'water') {
        this.waterWeight += deltaTime * 0.1;
      } else if (terrainType === 'mountain') {
        this.waterWeight += deltaTime * 0.05;
      }
    }

    // Encourage aggregation with other clouds
    this.aggregateWithClouds(clouds, deltaTime);

    // Update position with adjusted velocity
    const adjustedVelocity = this.velocity.clone().multiplyScalar(this.speedMultiplier);
    this.mesh.position.add(adjustedVelocity.multiplyScalar(deltaTime));

    // Boundary wrapping
    if (this.mesh.position.x > 100) this.mesh.position.x = -100;
    if (this.mesh.position.x < -100) this.mesh.position.x = 100;
    if (this.mesh.position.z > 100) this.mesh.position.z = -100;
    if (this.mesh.position.z < -100) this.mesh.position.z = 100;

    // Precipitation logic
    if (this.waterWeight > 1.8 && !this.isPrecipitating) {
      const terrainType = terrainFunc ? terrainFunc(this.mesh.position.x, this.mesh.position.z) : 'land';
      this.startPrecipitation(terrainType === 'mountain' ? 'snow' : 'rain');
    }

    if (this.isPrecipitating) {
      this.waterWeight -= deltaTime * 0.2;
      this.mesh.scale.multiplyScalar(1 - deltaTime * 0.1);
      if (this.waterWeight <= 0.5) {
        this.isPrecipitating = false;
        this.precipType = null;
        this.mesh.scale.set(1, 1, 1);
        const precip = this.mesh.getObjectByName('precipitation');
        if (precip) this.mesh.remove(precip);
      } else {
        const precip = this.mesh.getObjectByName('precipitation');
        if (precip) {
          const positions = precip.geometry.attributes.position.array;
          for (let i = 1; i < positions.length; i += 3) {
            positions[i] -= deltaTime * 5;
            if (positions[i] < -this.sizeValue * 2) {
              positions[i] = 0;
              positions[i - 1] = (Math.random() - 0.5) * this.sizeValue;
              positions[i + 1] = (Math.random() - 0.5) * this.sizeValue;
            }
          }
          precip.geometry.attributes.position.needsUpdate = true;
        }
      }
    }

    this.updateColor();
  }

  mergeWith(other) {
    this.waterWeight += other.waterWeight;
    this.sizeValue = Math.max(this.sizeValue, other.sizeValue);
    if (other.sizeValue > this.sizeValue) {
      this.type = other.type;
    }
    other.mesh.children.forEach(child => {
      this.mesh.add(child);
    });
    scene.remove(other.mesh);
  }
}

export class CloudSystem {
    constructor(cloudConfig) {
      this.clouds = [];
      this.targetCount = cloudConfig.count || 10;
      this.totalWaterWeight = 0;
      const cloudSpeedMultiplier = cloudConfig.speedMultiplier || 2.0;
      const totalWeight = cloudConfig.types.reduce((sum, c) => sum + (c.frequency || 1), 0);
      const count = this.targetCount;
      for (let i = 0; i < count; i++) {
        let rand = Math.random() * totalWeight;
        let selectedType = cloudConfig.types[0].type;
        for (const c of cloudConfig.types) {
          rand -= c.frequency || 1;
          if (rand <= 0) {
            selectedType = c.type;
            break;
          }
        }
        const cloud = new Cloud(selectedType);
        cloud.speedMultiplier = cloudSpeedMultiplier;
        this.clouds.push(cloud);
        this.totalWaterWeight += cloud.waterWeight;
      }
      this.resetClouds = this.resetClouds.bind(this);
    }
  
    update(deltaTime, terrainFunc) {
      // Update each cloud with terrain and cloud array
      for (let cloud of this.clouds) {
        cloud.update(deltaTime, terrainFunc, this.clouds);
        this.totalWaterWeight += cloud.waterWeight - cloud.waterWeight; // No change here, placeholder
      }
  
      // Merge logic (unchanged except context)
      for (let i = 0; i < this.clouds.length; i++) {
        for (let j = i + 1; j < this.clouds.length; j++) {
          const a = this.clouds[i], b = this.clouds[j];
          if (a.mesh.position.distanceTo(b.mesh.position) < 10) {
            if (a.sizeValue >= b.sizeValue) {
              this.totalWaterWeight -= b.waterWeight;
              a.mergeWith(b);
              this.clouds.splice(j, 1);
              j--;
              this.spawnCloud();
            } else {
              this.totalWaterWeight -= a.waterWeight;
              b.mergeWith(a);
              this.clouds.splice(i, 1);
              i--;
              this.spawnCloud();
              break;
            }
          }
        }
      }
  
      // Water weight balancing and mountain/thunder logic unchanged
      const targetWaterWeight = this.targetCount * 1.0;
      if (this.totalWaterWeight > targetWaterWeight * 1.2) {
        const excess = this.totalWaterWeight - targetWaterWeight;
        this.clouds.forEach(cloud => {
          cloud.waterWeight -= excess / this.clouds.length * 0.1;
          cloud.waterWeight = Math.max(0.5, cloud.waterWeight);
        });
        this.totalWaterWeight = this.clouds.reduce((sum, c) => sum + c.waterWeight, 0);
      } else if (this.totalWaterWeight < targetWaterWeight * 0.8) {
        const deficit = targetWaterWeight - this.totalWaterWeight;
        this.clouds.forEach(cloud => {
          cloud.waterWeight += deficit / this.clouds.length * 0.1;
          cloud.waterWeight = Math.min(2.0, cloud.waterWeight);
        });
        this.totalWaterWeight = this.clouds.reduce((sum, c) => sum + c.waterWeight, 0);
      }
  
      if (typeof getMountainHeight === 'function') {
        for (let cloud of this.clouds) {
          const mountainHeight = getMountainHeight(cloud.mesh.position.x, cloud.mesh.position.z);
          if (mountainHeight && mountainHeight > 5 && cloud.mesh.position.y < mountainHeight + 20) {
            const target = new THREE.Vector3(cloud.mesh.position.x, mountainHeight + 20, cloud.mesh.position.z);
            cloud.mesh.position.lerp(target, deltaTime * 0.01 * (mountainHeight / 10));
          }
        }
      }
  
      for (let cloud of this.clouds) {
        if (cloud.isPrecipitating && cloud.precipType === 'rain' && cloud.waterWeight > 2) {
          if (typeof triggerThunder === 'function') {
            triggerThunder(cloud.mesh.position);
          }
        }
      }
    }
  
    // Method to spawn a new cloud with a fraction of the total water weight
    spawnCloud() {
      const totalWeight = this.clouds.reduce((sum, c) => sum + (c.frequency || 1), 0);
      let rand = Math.random() * totalWeight;
      let selectedType = this.clouds[0].type; // Default to first type
      for (const c of this.clouds) {
        rand -= c.frequency || 1;
        if (rand <= 0) {
          selectedType = c.type;
          break;
        }
      }
      const newCloud = new Cloud(selectedType);
      // Distribute water weight to keep total constant
      const avgWaterWeight = this.totalWaterWeight / this.targetCount;
      newCloud.waterWeight = Math.min(avgWaterWeight, 1.0); // Cap initial water weight
      this.totalWaterWeight += newCloud.waterWeight;
      this.clouds.push(newCloud);
    }
  
    resetClouds() {
      this.clouds.forEach(cloud => scene.remove(cloud.mesh));
      this.clouds = [];
      this.totalWaterWeight = 0;
    }
}