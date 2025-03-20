import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';
import { scene, camera, renderer } from '../scene.js';
import { createWaterGeometry, setupReflection, updateReflection } from './WaterUtils.js';
import { createWaterMaterial } from './WaterShader.js';

export class WaterSystem {
    constructor(width, height, level, terrain, options = {}) {
        this.terrain = terrain;
        this.waterLevel = level;
        
        // Set default parameters
        this.reflectionDistance = options.reflectionDistance || 150;
        this.reflectionFalloff = options.reflectionFalloff || 0.8;
        this.waterRoughness = options.waterRoughness || 0.2;
        this.waterWaveHeight = options.waterWaveHeight || 0.02;
        this.waterColor = options.waterColor || 0x0077be;
        this.fogDensity = options.fogDensity || 5;
        this.fogColor = options.fogColor || 128;

        // Create geometry
        const { waterGeometry } = createWaterGeometry(width, height, terrain, level);
        
        // Setup reflection
        const { 
            reflectionRenderTarget, 
            reflectionTexture,
            mirrorCamera 
        } = setupReflection(camera);
        
        this.reflectionRenderTarget = reflectionRenderTarget;
        this.reflectionTexture = reflectionTexture;
        this.mirrorCamera = mirrorCamera;
        
        // Setup uniforms and material
        const commonUniforms = {
            fresnelPower: { value: options.fresnelPower || 3.5 },
            fresnelScale: { value: (options.fresnelScale !== undefined ? options.fresnelScale : 10) / 10 },
            baseOpacity: { value: (options.baseOpacity !== undefined ? options.baseOpacity : 8) / 10 },
            time: { value: 0 },
            criticalAngle: { value: 0.65 },
            isCameraUnderwater: { value: 0 },
            reflectionSampler: { value: this.reflectionTexture },
            reflectionDistance: { value: this.reflectionDistance },
            reflectionFalloff: { value: this.reflectionFalloff },
            waterRoughness: { value: this.waterRoughness },
            waterWaveHeight: { value: this.waterWaveHeight }
        };
        
        this.uniforms = commonUniforms;
        
        // Create material
        const { material, normalScale } = createWaterMaterial(
            this.waterColor, 
            this.uniforms,
            window.innerWidth,
            window.innerHeight
        );
        
        this.material = material;
        this.normalScale = normalScale;
        
        // Create mesh
        this.mesh = new THREE.Mesh(waterGeometry, this.material);
        this.mesh.rotation.x = -Math.PI / 2;
        scene.add(this.mesh);
        
        // Setup fog
        this.aboveWaterFog = new THREE.Fog(0xadd8e6, 50, 300);
        this.underwaterFog = new THREE.Fog(0x004080, 1, 100);
        this.updateFogSettings();
    }
    
    update(deltaTime) {
        const isCameraUnderwater = camera.position.y < this.waterLevel;
        
        // Update shader uniforms
        if (this.material.userData.shader) {
            this.uniforms.time.value += deltaTime;
            this.uniforms.isCameraUnderwater.value = isCameraUnderwater ? 1 : 0;
            this.normalScale.set(isCameraUnderwater ? 3.0 : 1.0, isCameraUnderwater ? 3.0 : 1.0);
            this.material.normalScale.copy(this.normalScale);
        }
        
        // Update reflections
        if (camera.position.y > this.waterLevel) {
            updateReflection(
                this.mesh,
                this.waterLevel,
                this.reflectionDistance,
                this.reflectionFalloff,
                camera,
                this.mirrorCamera,
                scene,
                renderer,
                this.reflectionRenderTarget,
                this.material
            );
        }
        
        // Update fog
        this.updateFogBasedOnCameraPosition();
    }
    
    updateFogBasedOnCameraPosition() {
        scene.fog = camera.position.y < this.waterLevel ? this.underwaterFog : this.aboveWaterFog;
    }
    
    updateFogSettings() {
        this.aboveWaterFog.far = 300 / (this.fogDensity * 0.1 || 0.01);
        this.underwaterFog.far = 100 / (this.fogDensity * 0.1 || 0.01);
        const gray = this.fogColor.toString(16).padStart(2, '0');
        this.aboveWaterFog.color.setStyle(`#${gray}${gray}ff`);
        this.underwaterFog.color.setStyle(`#00${gray}${gray}`);
    }
    
    // Setter methods for external control
    setFresnelPower(value) {
        this.uniforms.fresnelPower.value = value;
    }

    setFresnelScale(value) {
        this.uniforms.fresnelScale.value = value;
    }

    setBaseOpacity(value) {
        this.uniforms.baseOpacity.value = value;
    }

    setFogDensity(value) {
        this.fogDensity = value;
        this.updateFogSettings();
    }

    setFogColor(value) {
        this.fogColor = value;
        this.updateFogSettings();
    }

    setReflectionDistance(value) {
        this.reflectionDistance = value;
        this.uniforms.reflectionDistance.value = value;
    }
    
    setReflectionFalloff(value) {
        this.reflectionFalloff = value;
        this.uniforms.reflectionFalloff.value = value;
    }
    
    setWaterRoughness(value) {
        this.waterRoughness = value;
        this.uniforms.waterRoughness.value = value;
        this.material.roughness = value;
    }
    
    setWaterWaveHeight(value) {
        this.waterWaveHeight = value;
        this.uniforms.waterWaveHeight.value = value;
    }
    
    onResize() {
        this.reflectionRenderTarget.setSize(window.innerWidth * 0.5, window.innerHeight * 0.5);
    }
    
    dispose() {
        scene.remove(this.mesh);
        this.reflectionRenderTarget.dispose();
    }
}