import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';
import { scene } from './scene.js';

export class WaterSystem {
    constructor(width, height, level, color) {
        const waterGeometry = new THREE.PlaneGeometry(width, height);
        this.material = new THREE.MeshStandardMaterial({
            color: color || 0x0077be,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide,
            // Fresnel effect
            onBeforeCompile: (shader) => {
                shader.fragmentShader = shader.fragmentShader.replace(
                    '#include <alphatest_fragment>',
                    '#include <alphatest_fragment>\n    float fresnel = pow(1.0 - dot(normalize(vNormal), normalize(-vViewPosition)), 3.0);\n    gl_FragColor.a *= fresnel;'
                );
            }
        });
        this.mesh = new THREE.Mesh(waterGeometry, this.material);
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.position.y = level;
        scene.add(this.mesh);
    }
    dispose() {
        scene.remove(this.mesh);
    }
}