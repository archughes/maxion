import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';
import { scene } from './scene.js';

export class WaterSystem {
    constructor(width, height, level, color, terrain) {
        this.terrain = terrain;
        this.waterLevel = level; // Ocean water level
        
        // Create geometry matching terrain resolution
        const waterGeometry = new THREE.PlaneGeometry(
            width,
            height,
            terrain.geometry.parameters.widthSegments,
            terrain.geometry.parameters.heightSegments
        );
        
        // Adjust water height based on terrain's water heightmap
        const positions = waterGeometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const z = positions[i + 1];
            const waterHeight = terrain.getWaterLevel(x, z, false);
            positions[i + 2] = Math.max(waterHeight, this.waterLevel); // Ensure water doesn't go below ocean level
        }
        
        waterGeometry.attributes.position.needsUpdate = true;
        waterGeometry.computeVertexNormals();

        this.material = new THREE.MeshStandardMaterial({
            color: color || 0x0077be,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide,
            onBeforeCompile: (shader) => {
                shader.fragmentShader = shader.fragmentShader.replace(
                    '#include <alphatest_fragment>',
                    '#include <alphatest_fragment>\n    float fresnel = pow(1.0 - dot(normalize(vNormal), normalize(-vViewPosition)), 3.0);\n    gl_FragColor.a *= fresnel;'
                );
            }
        });
        
        this.mesh = new THREE.Mesh(waterGeometry, this.material);
        this.mesh.rotation.x = -Math.PI / 2;
        scene.add(this.mesh);
    }
    
    dispose() {
        scene.remove(this.mesh);
    }
}