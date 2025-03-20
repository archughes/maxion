// scene.js
import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 5).normalize();
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040));

const defaultFogNear = 150, defaultFogFar = 250;
if (!scene.fog) {
    scene.fog = new THREE.Fog(0xcccccc, defaultFogNear, defaultFogFar); // Reinitialize if null
}

camera.position.set(0, 5, 10);
camera.lookAt(0, 0, 0);

export { scene, camera, renderer };