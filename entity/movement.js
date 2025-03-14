// Movement.js
import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';

export class Movement {
    constructor(owner, terrain, camera, opts = {}) {
        this.owner = owner; // The Player instance
        this.terrain = terrain; // Terrain object with getHeightAt, getSlopeAt, etc.
        this.camera = camera; // THREE.Camera for water movement direction
        this.steepThreshold = opts.steepThreshold || 1.5; // Threshold for sliding
        this.slideVelocity = new THREE.Vector3(); // Velocity when sliding on steep slopes
    }

    update(deltaTime) {
        const pos = this.owner.object.position;
        // Apply running multiplier if active (assuming isRunning and runTimer are managed elsewhere)
        const baseSpeed = this.owner.speed * deltaTime * this.owner.baseSpeedMultiplier * (this.owner.isRunning ? 1.5 : 1);
        let moveDir = new THREE.Vector3();
        
        const waterLevel = this.terrain.waterLevel;
        this.owner.isInWater = this.owner.object.position.y - this.owner.heightOffset + 0.5 < waterLevel; // Check feet position
        if (this.owner.isInWater) {
            // Water movement: use camera directions
            const camDir = this.camera.getWorldDirection(new THREE.Vector3());
            const leftDir = new THREE.Vector3().crossVectors(this.camera.up, camDir).normalize();
            const moveDir = new THREE.Vector3();
            if (this.owner.moveForward) moveDir.add(camDir);
            if (this.owner.moveBackward) moveDir.sub(camDir);
            if (this.owner.moveLeft) moveDir.add(leftDir);
            if (this.owner.moveRight) moveDir.sub(leftDir);
            if (moveDir.lengthSq() > 0) {
                moveDir.normalize().multiplyScalar(baseSpeed);
            }
            pos.add(moveDir);
        
            // Vertical movement in water
            const headY = pos.y + this.owner.heightOffset; // Current head position
            const waterHeight = this.terrain.waterLevel;
            const headNearSurface = Math.abs(headY - waterHeight) < 0.1;
            if (this.owner.moveUp) {
                const suggestedY = pos.y + this.owner.speed * deltaTime;
                if (headNearSurface && suggestedY >= waterHeight) {
                    // Apply boost to surface
                    pos.y = waterHeight + 0.3;
                } else if (suggestedY < waterHeight) {
                    // Normal upward swimming
                    pos.y = suggestedY;
                }
            }
        
            // Apply sinking effect when above terrain in water
            const terrainHeight = this.terrain.getHeightAt(pos.x, pos.z);
            if (pos.y > terrainHeight + this.owner.heightOffset) {
                if (!headNearSurface) {
                    pos.y -= this.owner.gravity * deltaTime * deltaTime;
                }
            } else {
                pos.y = terrainHeight + this.owner.heightOffset; // Snap to terrain if falls below
            }
        } else {
            // Land movement: use owner's rotation and input flags
            const angle = this.owner.object.rotation.y;
            if (this.owner.moveForward) {
                moveDir.x += Math.sin(angle);
                moveDir.z += Math.cos(angle);
            }
            if (this.owner.moveBackward) {
                moveDir.x -= Math.sin(angle) / 2; // Slower backward movement
                moveDir.z -= Math.cos(angle) / 2;
            }
            if (this.owner.moveLeft) {
                moveDir.x += Math.cos(angle);
                moveDir.z -= Math.sin(angle);
            }
            if (this.owner.moveRight) {
                moveDir.x -= Math.cos(angle);
                moveDir.z += Math.sin(angle);
            }
            if (moveDir.lengthSq() > 0) {
                const slope = this.terrain.getSlopeAt(pos.x, pos.z);
                const slopeMultiplier = 1 / (1 + slope.magnitude); // Reduce speed on slopes
                moveDir.normalize().multiplyScalar(baseSpeed * (this.owner.speedMultiplier || 1) * slopeMultiplier);
            }

            // Handle sliding on steep slopes
            const slope = this.terrain.getSlopeAt(pos.x, pos.z);
            if (!this.owner.isJumping && slope.magnitude > this.steepThreshold) {
                this.owner.isSliding = true;
                const slideAccel = this.owner.gravity * slope.magnitude * deltaTime;
                this.slideVelocity.addScaledVector(slope.direction, slideAccel);
                this.slideVelocity.clampLength(0, this.owner.maxSlideSpeed || 10); // Default max slide speed
                pos.x += this.slideVelocity.x * deltaTime;
                pos.z += this.slideVelocity.z * deltaTime;
                const terrainHeight = this.terrain.getHeightAt(pos.x, pos.z);
                if (pos.y > terrainHeight + this.owner.heightOffset) {
                    pos.y -= this.owner.gravity * deltaTime * deltaTime;
                }
                if (pos.y < terrainHeight + this.owner.heightOffset) {
                    pos.y = terrainHeight + this.owner.heightOffset;
                    const newSlope = this.terrain.getSlopeAt(pos.x, pos.z);
                    if (newSlope.magnitude <= this.steepThreshold) {
                        this.owner.isSliding = false;
                        this.slideVelocity.set(0, 0, 0);
                    }
                }
            } else {
                this.owner.isSliding = false;
                this.slideVelocity.set(0, 0, 0);
            }

            // Apply movement
            pos.x += moveDir.x;
            pos.z += moveDir.z;

            // Check for falling off edges
            const terrainHeight = this.terrain.getHeightAt(pos.x, pos.z);
            if (!this.owner.isJumping && pos.y > terrainHeight + this.owner.heightOffset) {
                this.owner.isJumping = true;
                this.owner.jumpVelocity = 0; // Start falling with zero initial velocity
            }
        }

        // Rotation
        if (this.owner.rotateLeft) this.owner.object.rotation.y += 0.5 * deltaTime;
        if (this.owner.rotateRight) this.owner.object.rotation.y -= 0.5 * deltaTime;

        // Jumping and falling logic
        if (this.owner.isJumping && !this.owner.isInWater) {
            pos.y += this.owner.jumpVelocity * deltaTime;
            this.owner.jumpVelocity -= this.owner.gravity * deltaTime;
            const terrainHeight = this.terrain.getHeightAt(pos.x, pos.z);
            if (!this.owner.firstJump && this.owner.jumpVelocity <= 0 && pos.y <= terrainHeight + this.owner.heightOffset) {
                const fallVel = this.owner.jumpVelocity;
                pos.y = terrainHeight + this.owner.heightOffset;
                this.owner.isJumping = false;
                this.owner.jumpVelocity = 0;
                if (fallVel < -8 && typeof this.owner.onLand === 'function') {
                    this.owner.onLand(fallVel);
                }
            }
            this.owner.firstJump = false;
        } else {
            const terrainHeight = this.terrain.getHeightAt(pos.x, pos.z);
            if (!this.owner.isJumping && pos.y < terrainHeight + this.owner.heightOffset) {
                pos.y = terrainHeight + this.owner.heightOffset;
            }
        }
    }

    // jump(initialVelocity) {
    //     if (!this.owner.isJumping && !this.owner.isInWater) { // Prevent jumping in water
    //         this.owner.isJumping = true;
    //         this.jumpVelocity = initialVelocity;
    //     }
    // }
}