import { CombatEntity } from './entity.js';
import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';

class Character extends CombatEntity {
    static geometry = new THREE.BoxGeometry(1, 1, 1);

    constructor(material, health, speed, useComplexModel = false) {
        let object = useComplexModel ? new THREE.Group() : new THREE.Mesh(Character.geometry, material);
        super(object, health);

        this.speed = speed;
        this.useComplexModel = useComplexModel;

        this.attackCooldown = 0;
        this.attackInterval = 1;
        this.drowningTimer = 0;
        this.drowningDamageTimer = 0;
        this.drowningTime = 3; // 3 seconds before drowning
        this.drowningDamageInterval = 1; // Damage every second

        if (useComplexModel) {
            this.setupComplexModel(object, material);
            this.heightOffset = 0.75; // Complex model: legs extend 0.5 below center, head 0.5 above, total height ~1.5
        } else {
            this.heightOffset = 0.5; // Simple model: 1 unit high, center at 0.5
        }
    }

    setupComplexModel(group, material) {
        // Body (torso)
        this.body = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material);
        group.add(this.body);

        // Head
        this.head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), material);
        this.head.position.y = 1; // Positioned above body
        group.add(this.head);

        // Left Arm
        this.leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 0.2), material);
        this.leftArm.position.set(-0.6, 0.5, 0); // Left of body, upper half
        group.add(this.leftArm);

        // Right Arm
        this.rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 0.2), material);
        this.rightArm.position.set(0.6, 0.5, 0); // Right of body, upper half
        group.add(this.rightArm);

        // Left Leg
        this.leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 0.2), material);
        this.leftLeg.position.set(-0.3, -0.5, 0); // Left below body
        group.add(this.leftLeg);

        // Right Leg
        this.rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 0.2), material);
        this.rightLeg.position.set(0.3, -0.5, 0); // Right below body
        group.add(this.rightLeg);
    }

    update(deltaTime) {
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }
    }
}

export { Character };