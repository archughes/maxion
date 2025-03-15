import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';

export function createSparkleEffect(object, animationTime) {
    const particleCount = 50;
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 0.5; // Random x position
        positions[i + 1] = Math.random() * 0.5; // Random y position
        positions[i + 2] = (Math.random() - 0.5) * 0.5; // Random z position
        velocities[i + 1] = Math.random() * 0.01 + 0.01; // Upward velocity
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0x00ffff,
        size: 0.1,
        transparent: true,
        opacity: 0.8
    });

    const particles = new THREE.Points(geometry, material);
    object.add(particles);

    const animateParticles = () => {
        for (let i = 0; i < particleCount * 3; i += 3) {
            if (i % 3 === 1) { // Y position
                positions[i] += velocities[i]; // Move up
                if (positions[i] > 1) { // Reset if too high
                    positions[i] = 0;
                }
            }
            // Add wavy motion
            positions[i] += Math.sin(Date.now() * 0.001 + i) * 0.01;
        }
        geometry.attributes.position.needsUpdate = true;
        requestAnimationFrame(animateParticles);
    };
    animateParticles();

    // Remove particles after animationTime
    if (animationTime > 0) {
        setTimeout(() => {
            object.remove(particles);
        }, animationTime);
    }
}

export function createFlameEffect(object) {
    const particleCount = 50;
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 0.5;
        positions[i + 1] = Math.random() * 0.5;
        positions[i + 2] = (Math.random() - 0.5) * 0.5;
        velocities[i] = (Math.random() - 0.5) * 0.01; // Slight horizontal movement
        velocities[i + 1] = Math.random() * 0.02 + 0.01; // Upward velocity
        velocities[i + 2] = (Math.random() - 0.5) * 0.01; // Slight depth movement
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffa500,
        size: 0.1,
        transparent: true,
        opacity: 0.8
    });

    const particles = new THREE.Points(geometry, material);
    object.add(particles);

    let animationFrameId;
    const animateParticles = () => {
        if (!object.parent) {
            cancelAnimationFrame(animationFrameId);
            return;
        }

        for (let i = 0; i < particleCount * 3; i += 3) {
            // Update positions with velocities
            positions[i] += velocities[i];
            positions[i + 1] += velocities[i + 1];
            positions[i + 2] += velocities[i + 2];

            // Reset particles that go too high
            if (positions[i + 1] > 1) {
                positions[i] = (Math.random() - 0.5) * 0.5;
                positions[i + 1] = 0;
                positions[i + 2] = (Math.random() - 0.5) * 0.5;
            }

            // Add wavy motion
            positions[i] += Math.sin(Date.now() * 0.001 + i) * 0.002;
            positions[i + 2] += Math.cos(Date.now() * 0.001 + i) * 0.002;
        }

        geometry.attributes.position.needsUpdate = true;
        animationFrameId = requestAnimationFrame(animateParticles);
    };

    animationFrameId = requestAnimationFrame(animateParticles);
    
    return {
        destroy: () => {
            cancelAnimationFrame(animationFrameId);
            object.remove(particles);
        }
    };
}