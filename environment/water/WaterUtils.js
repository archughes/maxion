import * as THREE from '../../lib/three.module.js';

// Creates water geometry based on terrain parameters
export function createWaterGeometry(width, height, terrain, waterLevel) {
    const waterGeometry = new THREE.PlaneGeometry(
        width,
        height,
        terrain?.geometry?.parameters?.widthSegments || 50,
        terrain?.geometry?.parameters?.heightSegments || 50
    );
    
    const positions = waterGeometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const z = positions[i + 1];
        positions[i + 2] = Math.max(terrain.getWaterLevel(x, z, false), waterLevel);
    }
    
    waterGeometry.attributes.position.needsUpdate = true;
    waterGeometry.computeVertexNormals();
    
    return { waterGeometry };
}

// Sets up the reflection rendering system
export function setupReflection(camera) {
    // Create render target for reflections
    const reflectionRenderTarget = new THREE.WebGLRenderTarget(
        window.innerWidth * 0.5,
        window.innerHeight * 0.5
    );
    
    const reflectionTexture = reflectionRenderTarget.texture;
    
    // Clone camera for mirroring
    const mirrorCamera = camera.clone();
    
    return {
        reflectionRenderTarget,
        reflectionTexture,
        mirrorCamera
    };
}

// Updates reflection for rendering
export function updateReflection(
    mesh, 
    waterLevel, 
    reflectionDistance, 
    reflectionFalloff, 
    camera, 
    mirrorCamera, 
    scene, 
    renderer, 
    reflectionRenderTarget,
    material
) {
    // Save original scene state
    const originalPosition = camera.position.clone();
    const originalFog = scene.fog;
    
    // Create mirror camera position (reflect across water plane)
    mirrorCamera.position.set(
        camera.position.x,
        -camera.position.y + 2 * waterLevel,
        camera.position.z
    );

    // Create reflection matrix to flip objects properly
    const reflectionMatrix = new THREE.Matrix4();
    reflectionMatrix.set(
        1, 0, 0, 0,
        0, -1, 0, 2 * waterLevel,
        0, 0, 1, 0,
        0, 0, 0, 1
    );

    // Apply reflection matrix to mirror camera
    mirrorCamera.matrixAutoUpdate = false;
    mirrorCamera.matrix.copy(camera.matrix).premultiply(reflectionMatrix);
    mirrorCamera.matrixWorldNeedsUpdate = true;

    // Update projection
    mirrorCamera.far = Math.min(camera.far, reflectionDistance);
    mirrorCamera.near = camera.near;
    mirrorCamera.fov = camera.fov;
    mirrorCamera.aspect = camera.aspect;
    mirrorCamera.updateProjectionMatrix();

    // Hide water mesh during reflection render
    mesh.visible = false;

    // Create clipping plane that only shows objects above water
    const waterPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -waterLevel);
    const originalClippingPlanes = renderer.clippingPlanes;
    renderer.clippingPlanes = [waterPlane];
    
    // Apply stronger fog for reflection to fade distant objects
    const reflectionFog = new THREE.Fog(
        originalFog.color.clone(),
        originalFog.near,
        originalFog.far * reflectionFalloff
    );
    scene.fog = reflectionFog;

    // Check if normal map is loaded
    if (material.normalMap && !material.normalMap.image) {
        console.warn('Normal map not ready, skipping reflection render');
        mesh.visible = true;
        scene.fog = originalFog;
        renderer.clippingPlanes = originalClippingPlanes;
        return;
    }

    // Render reflection
    renderer.setRenderTarget(reflectionRenderTarget);
    renderer.clear();
    renderer.render(scene, mirrorCamera);
    renderer.setRenderTarget(null);
    
    // Restore original renderer and scene state
    renderer.clippingPlanes = originalClippingPlanes;
    scene.fog = originalFog;
    mesh.visible = true;
}

// Creates fog objects for above/underwater effects
export function createFogSettings(fogDensity, fogColor) {
    const aboveWaterFog = new THREE.Fog(0xadd8e6, 50, 300 / (fogDensity * 0.1 || 0.01));
    const underwaterFog = new THREE.Fog(0x004080, 1, 100 / (fogDensity * 0.1 || 0.01));
    
    const gray = fogColor.toString(16).padStart(2, '0');
    aboveWaterFog.color.setStyle(`#${gray}${gray}ff`);
    underwaterFog.color.setStyle(`#00${gray}${gray}`);
    
    return { aboveWaterFog, underwaterFog };
}