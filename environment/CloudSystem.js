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
    this.peakZoneMultiplier = 3.0;
    
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
    const steerForce = new THREE.Vector3(0, 0, 0);
    const sampleRadius = 10;
    const directions = [
      new THREE.Vector3(sampleRadius, 0, 0),
      new THREE.Vector3(-sampleRadius, 0, 0),
      new THREE.Vector3(0, 0, sampleRadius),
      new THREE.Vector3(0, 0, -sampleRadius)
    ];

    directions.forEach(dir => {
      const samplePos = pos.clone().add(dir);
      const terrainType = terrainFunc(samplePos.x, samplePos.z, 0, 0); // y and vertexIndex not needed here
      let influence = 0;
      switch (terrainType) {
        case 'high mountain':
        case 'mountain':
          influence = 0.5;
          break;
        case 'water':
        case 'lake':
        case 'river':
          influence = 0.2;
          break;
        case 'cliff':
          influence = -0.1;
          break;
        default: // grass, path
          influence = -0.05;
      }
      steerForce.add(dir.clone().normalize().multiplyScalar(influence));
    });

    this.velocity.add(steerForce.multiplyScalar(deltaTime * this.speedMultiplier));
    this.velocity.clampLength(0, 1.0 * this.speedMultiplier);
  }

  swirlAroundTerrain(terrainFunc, deltaTime) {
    const pos = this.mesh.position;
    let inPeakZone = false;
    let peakPosition = null;
    let swirlForce = new THREE.Vector3(0, 0, 0);

    // Find nearest high mountain peak (y > 10)
    const swirlRadius = 20;
    const samplePoints = 8;
    let closestDist = Infinity;
    for (let i = 0; i < samplePoints; i++) {
      const angle = (i / samplePoints) * Math.PI * 2;
      const sampleX = pos.x + Math.cos(angle) * swirlRadius;
      const sampleZ = pos.z + Math.sin(angle) * swirlRadius;
      const terrainType = terrainFunc(sampleX, sampleZ, 0, 0); // Approximate y, vertexIndex not needed
      if (terrainType === 'high mountain') {
        const dist = pos.distanceTo(new THREE.Vector3(sampleX, 0, sampleZ));
        if (dist < closestDist) {
          closestDist = dist;
          peakPosition = new THREE.Vector3(sampleX, this.elevation, sampleZ); // Use cloud elevation as proxy
          inPeakZone = true;
        }
      }
    }

    if (inPeakZone && peakPosition) {
      const toPeak = peakPosition.clone().sub(pos);
      toPeak.y = 0;
      const distance = toPeak.length();

      if (distance > 0) {
        const radial = toPeak.clone().normalize();
        const tangential = new THREE.Vector3(-radial.z, 0, radial.x);

        // Enhanced vorticity with height influence (assuming y > 10)
        const swirlSpeed = 1.5 * (1 - Math.min(distance / swirlRadius, 1.0)) * 1.5; // 1.5x for high mountains
        const coriolis = tangential.clone().multiplyScalar(pos.z / 100 * 0.2); // Pseudo-Coriolis
        const noise = new THREE.Vector3((Math.random() - 0.5) * 0.1, 0, (Math.random() - 0.5) * 0.1);

        swirlForce.add(tangential.multiplyScalar(swirlSpeed)).add(coriolis).add(noise);
        swirlForce.add(radial.multiplyScalar(-0.4)); // Stronger pull for high peaks

        this.velocity.lerp(swirlForce, deltaTime * 2.5);
        this.velocity.clampLength(0, 1.5 * this.speedMultiplier * this.peakZoneMultiplier);
      }
    }

    return inPeakZone;
  }

  // Encourage aggregation with nearby clouds
  aggregateWithClouds(clouds, deltaTime) {
    const aggregationRadius = 20;
    const pos = this.mesh.position;
    const alignmentForce = new THREE.Vector3(0, 0, 0);
    let nearbyCount = 0;

    clouds.forEach(other => {
      if (other === this) return;
      const distance = pos.distanceTo(other.mesh.position);
      if (distance < aggregationRadius) {
        alignmentForce.add(other.velocity);
        nearbyCount++;
      }
    });

    if (nearbyCount > 0) {
      alignmentForce.divideScalar(nearbyCount);
      this.velocity.lerp(alignmentForce, deltaTime * 0.5);
    }
  }

  update(deltaTime, terrainFunc, clouds) {
    let effectiveSpeedMultiplier = this.speedMultiplier * (1 + this.waterWeight * 0.5);

    // Swirl around high mountain peaks
    const inPeakZone = this.swirlAroundTerrain(terrainFunc, deltaTime);
    if (inPeakZone) {
      effectiveSpeedMultiplier *= this.peakZoneMultiplier;
    } else if (terrainFunc) {
      this.steerTowardTerrain(terrainFunc, deltaTime);
    }

    // Aggregation
    this.aggregateWithClouds(clouds, deltaTime);

    // Update position
    const adjustedVelocity = this.velocity.clone().multiplyScalar(effectiveSpeedMultiplier);
    this.mesh.position.add(adjustedVelocity.multiplyScalar(deltaTime));

    // Boundary wrapping
    if (this.mesh.position.x > 100) this.mesh.position.x = -100;
    if (this.mesh.position.x < -100) this.mesh.position.x = 100;
    if (this.mesh.position.z > 100) this.mesh.position.z = -100;
    if (this.mesh.position.z < -100) this.mesh.position.z = 100;

    // Water weight and precipitation
    if (terrainFunc) {
      const terrainType = terrainFunc(this.mesh.position.x, this.mesh.position.z, this.mesh.position.y, 0);
      switch (terrainType) {
        case 'water':
        case 'lake':
        case 'river':
          this.waterWeight += deltaTime * 0.15;
          break;
        case 'high mountain':
          this.waterWeight += deltaTime * 0.10; // Increased for high peaks
          break;
        case 'mountain':
          this.waterWeight += deltaTime * 0.08;
          break;
      }
    }

    if (this.waterWeight > 1.8 && !this.isPrecipitating) {
      const terrainType = terrainFunc(this.mesh.position.x, this.mesh.position.z, this.mesh.position.y, 0);
      this.startPrecipitation(terrainType === 'high mountain' || terrainType === 'mountain' ? 'snow' : 'rain');
    }

    if (this.isPrecipitating) {
      this.waterWeight -= deltaTime * 0.25;
      this.mesh.scale.multiplyScalar(1 - deltaTime * 0.1);
      if (this.waterWeight > 2.0) {
        this.velocity.multiplyScalar(0.95); // Downdraft effect
      }
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
      for (let cloud of this.clouds) {
        cloud.update(deltaTime, terrainFunc, this.clouds);
      }
  
      // Merge logic
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
  
      // Water weight balancing
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
  
      // Mountain attractor (optional, kept for consistency)
      for (let cloud of this.clouds) {
        const terrainType = terrainFunc(cloud.mesh.position.x, cloud.mesh.position.z, cloud.mesh.position.y, 0);
        if (terrainType === 'high mountain' || terrainType === 'mountain') {
          const height = terrainFunc(cloud.mesh.position.x, cloud.mesh.position.z, 0, 0) === 'high mountain' ? 15 : 7; // Proxy height
          if (cloud.mesh.position.y < height + 20) {
            const target = new THREE.Vector3(cloud.mesh.position.x, height + 20, cloud.mesh.position.z);
            cloud.mesh.position.lerp(target, deltaTime * 0.01 * (height / 10));
          }
        }
      }
  
      // Thunder/lightning
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