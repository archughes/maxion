import { CombatEntity } from './entity.js';
import * as THREE from '../lib/three.module.js';
import { AnimationQueue } from './animation.js';

class Character extends CombatEntity {
    static geometry = new THREE.BoxGeometry(1, 1, 1); // Default cube geometry

    constructor(material, health, speed, modelType = 'cube') {
        super(new THREE.Object3D(), health); // Temporary object to satisfy super

        this.material = material;
        this.speed = speed;
        this.isSliding = false;
        this.slideVelocity = new THREE.Vector3();
        this.maxSlideSpeed = 8;
        this.modelType = modelType;
        this.limbAngle = 0;
        this.animationQueue = new AnimationQueue();

        this.drowningTimer = 0;
        this.drowningDamageTimer = 0;
        this.drowningTime = 3;
        this.drowningDamageInterval = 1;

        this.isProne = false;
        
        // Create the main object that will be our reference point
        this.object = new THREE.Group();
        
        // Create the actual model as a child of this.object
        this.model = this.createModel(modelType, material, false);
        this.object.add(this.model);
        
        this.mixer = new THREE.AnimationMixer(this.model);
        
        // Set height offset
        this.heightOffset = this.setHeightOffset(modelType, false);
    }

    createModel(modelType, material, isProne) {
        switch (modelType) {
            case 'cube':
                return this.setupCubeModel(material, isProne);
            case 'human':
                return this.setupHumanModel(material, isProne);
            case 'wolf':
                return this.setupWolfModel(material, isProne);
            case 'bandit':
                return this.setupBanditModel(material, isProne);
            case 'boss':
                return this.setupBossModel(material, isProne);
            default:
                console.warn(`Unknown model type: ${modelType}. Defaulting to cube.`);
                return this.setupCubeModel(material, isProne);
        }
    }

    setHeightOffset(modelType, isProne) {
        if (isProne) {
            switch (modelType) {
                case 'cube': return 0.25;
                case 'human': return 0.25;
                case 'wolf': return 0.2;
                case 'bandit': return 0.25;
                case 'boss': return 0.3;
                default: return 0.25;
            }
        } else {
            switch (modelType) {
                case 'cube': return 0.5;
                case 'human': return 0.75;
                case 'wolf': return 0.4;
                case 'bandit': return 0.7;
                case 'boss': return 1.0;
                default: return 0.5;
            }
        }
    }

    setProne(isProne) {
        if (this.isProne !== isProne) {
            this.isProne = isProne;
            
            // Remove current model from the object
            this.object.remove(this.model);
            
            // Create a new model
            this.model = this.createModel(this.modelType, this.material, isProne);
            
            // Add the new model to the object
            this.object.add(this.model);
            
            // Update the mixer to target the new model
            this.mixer = new THREE.AnimationMixer(this.model);
            
            // Update height offset
            this.heightOffset = this.setHeightOffset(this.modelType, isProne);
        }
    }

    // Reusable method for adding colored parts to a group
    addPart(group, geometry, position, color) {
        const material = new THREE.MeshBasicMaterial({ color });
        const part = new THREE.Mesh(geometry, material);
        part.position.copy(position);
        group.add(part);
        return part;
    }

    setupCubeModel(material, isProne) {
        const group = new THREE.Group();
        const cube = new THREE.Mesh(Character.geometry, material);
        if (isProne) {
            // For prone cube, create a flatter version
            cube.scale.set(1, 0.5, 1.5);
        }
        group.add(cube);
        return group;
    }

    setupHumanModel(material, isProne) {
        const group = new THREE.Group();
        
        if (!isProne) {
            // Standing human model
            const bodyGeo = new THREE.BoxGeometry(0.7, 1, 0.5);
            this.body = this.addPart(group, bodyGeo, new THREE.Vector3(0, 0, 0), 0x8B4513);
            this.head = this.addPart(group, new THREE.SphereGeometry(0.3), new THREE.Vector3(0, 1, 0), 0xFFDAB9);
            this.leftArm = this.addPart(group, new THREE.BoxGeometry(0.2, 0.6, 0.2), new THREE.Vector3(-0.5, 0.5, 0), 0xFFDAB9);
            this.rightArm = this.addPart(group, new THREE.BoxGeometry(0.2, 0.6, 0.2), new THREE.Vector3(0.5, 0.5, 0), 0xFFDAB9);
            this.leftLeg = this.addPart(group, new THREE.BoxGeometry(0.2, 0.6, 0.2), new THREE.Vector3(-0.2, -0.5, 0), 0x4682B4);
            this.rightLeg = this.addPart(group, new THREE.BoxGeometry(0.2, 0.6, 0.2), new THREE.Vector3(0.2, -0.5, 0), 0x4682B4);
        } else {
            // Prone human model - reshape and reposition parts to look like lying down
            const bodyGeo = new THREE.BoxGeometry(0.7, 0.5, 1);
            this.body = this.addPart(group, bodyGeo, new THREE.Vector3(0, 0, 0), 0x8B4513);
            this.head = this.addPart(group, new THREE.SphereGeometry(0.3), new THREE.Vector3(0, 0, 0.7), 0xFFDAB9);
            this.leftArm = this.addPart(group, new THREE.BoxGeometry(0.2, 0.2, 0.6), new THREE.Vector3(-0.5, 0, 0), 0xFFDAB9);
            this.rightArm = this.addPart(group, new THREE.BoxGeometry(0.2, 0.2, 0.6), new THREE.Vector3(0.5, 0, 0), 0xFFDAB9);
            this.leftLeg = this.addPart(group, new THREE.BoxGeometry(0.2, 0.2, 0.6), new THREE.Vector3(-0.2, 0, -0.5), 0x4682B4);
            this.rightLeg = this.addPart(group, new THREE.BoxGeometry(0.2, 0.2, 0.6), new THREE.Vector3(0.2, 0, -0.5), 0x4682B4);
        }
        
        return group;
    }

    setupWolfModel(material, isProne) {
        const group = new THREE.Group();
        
        if (!isProne) {
            // Standing wolf model
            const bodyGeo = new THREE.BoxGeometry(1.5, 0.6, 0.8);
            this.body = this.addPart(group, bodyGeo, new THREE.Vector3(0, 0, 0), 0x808080);
            this.head = this.addPart(group, new THREE.BoxGeometry(0.5, 0.4, 0.5), new THREE.Vector3(0.8, 0.3, 0), 0x808080);
            this.leftLeg = this.addPart(group, new THREE.BoxGeometry(0.2, 0.5, 0.2), new THREE.Vector3(-0.5, -0.3, 0), 0x808080);
            this.rightLeg = this.addPart(group, new THREE.BoxGeometry(0.2, 0.5, 0.2), new THREE.Vector3(0.5, -0.3, 0), 0x808080);
        } else {
            // Prone wolf model
            const bodyGeo = new THREE.BoxGeometry(1.5, 0.4, 0.8);
            this.body = this.addPart(group, bodyGeo, new THREE.Vector3(0, 0, 0), 0x808080);
            this.head = this.addPart(group, new THREE.BoxGeometry(0.5, 0.4, 0.5), new THREE.Vector3(0, 0, 0.8), 0x808080);
            this.leftLeg = this.addPart(group, new THREE.BoxGeometry(0.2, 0.2, 0.4), new THREE.Vector3(-0.5, 0, -0.3), 0x808080);
            this.rightLeg = this.addPart(group, new THREE.BoxGeometry(0.2, 0.2, 0.4), new THREE.Vector3(0.5, 0, -0.3), 0x808080);
        }
        
        return group;
    }

    setupBanditModel(material, isProne) {
        const group = new THREE.Group();
        
        if (!isProne) {
            // Standing bandit model
            const bodyGeo = new THREE.BoxGeometry(0.8, 1, 0.6);
            this.body = this.addPart(group, bodyGeo, new THREE.Vector3(0, 0, 0), 0x2F4F4F);
            this.head = this.addPart(group, new THREE.SphereGeometry(0.3), new THREE.Vector3(0, 1, 0), 0xFFDAB9);
            this.leftArm = this.addPart(group, new THREE.BoxGeometry(0.2, 0.6, 0.2), new THREE.Vector3(-0.5, 0.5, 0), 0x2F4F4F);
            this.rightArm = this.addPart(group, new THREE.BoxGeometry(0.2, 0.6, 0.2), new THREE.Vector3(0.5, 0.5, 0), 0x2F4F4F);
            this.leftLeg = this.addPart(group, new THREE.BoxGeometry(0.2, 0.6, 0.2), new THREE.Vector3(-0.2, -0.5, 0), 0x2F4F4F);
            this.rightLeg = this.addPart(group, new THREE.BoxGeometry(0.2, 0.6, 0.2), new THREE.Vector3(0.2, -0.5, 0), 0x2F4F4F);
        } else {
            // Prone bandit model
            const bodyGeo = new THREE.BoxGeometry(0.8, 0.5, 1);
            this.body = this.addPart(group, bodyGeo, new THREE.Vector3(0, 0, 0), 0x2F4F4F);
            this.head = this.addPart(group, new THREE.SphereGeometry(0.3), new THREE.Vector3(0, 0, 0.7), 0xFFDAB9);
            this.leftArm = this.addPart(group, new THREE.BoxGeometry(0.2, 0.2, 0.6), new THREE.Vector3(-0.5, 0, 0), 0x2F4F4F);
            this.rightArm = this.addPart(group, new THREE.BoxGeometry(0.2, 0.2, 0.6), new THREE.Vector3(0.5, 0, 0), 0x2F4F4F);
            this.leftLeg = this.addPart(group, new THREE.BoxGeometry(0.2, 0.2, 0.6), new THREE.Vector3(-0.2, 0, -0.5), 0x2F4F4F);
            this.rightLeg = this.addPart(group, new THREE.BoxGeometry(0.2, 0.2, 0.6), new THREE.Vector3(0.2, 0, -0.5), 0x2F4F4F);
        }
        
        return group;
    }

    setupBossModel(material, isProne) {
        const group = new THREE.Group();
        
        if (!isProne) {
            // Standing boss model
            const bodyGeo = new THREE.BoxGeometry(1.2, 1.5, 1);
            this.body = this.addPart(group, bodyGeo, new THREE.Vector3(0, 0, 0), 0xFF0000);
            this.head = this.addPart(group, new THREE.SphereGeometry(0.5), new THREE.Vector3(0, 1.2, 0), 0xFFDAB9);
            this.leftArm = this.addPart(group, new THREE.BoxGeometry(0.3, 0.8, 0.3), new THREE.Vector3(-0.8, 0.5, 0), 0xFF0000);
            this.rightArm = this.addPart(group, new THREE.BoxGeometry(0.3, 0.8, 0.3), new THREE.Vector3(0.8, 0.5, 0), 0xFF0000);
            this.leftLeg = this.addPart(group, new THREE.BoxGeometry(0.3, 0.8, 0.3), new THREE.Vector3(-0.4, -0.5, 0), 0xFF0000);
            this.rightLeg = this.addPart(group, new THREE.BoxGeometry(0.3, 0.8, 0.3), new THREE.Vector3(0.4, -0.5, 0), 0xFF0000);
        } else {
            // Prone boss model
            const bodyGeo = new THREE.BoxGeometry(1.2, 0.6, 1.5);
            this.body = this.addPart(group, bodyGeo, new THREE.Vector3(0, 0, 0), 0xFF0000);
            this.head = this.addPart(group, new THREE.SphereGeometry(0.5), new THREE.Vector3(0, 0, 1), 0xFFDAB9);
            this.leftArm = this.addPart(group, new THREE.BoxGeometry(0.3, 0.3, 0.8), new THREE.Vector3(-0.8, 0, 0), 0xFF0000);
            this.rightArm = this.addPart(group, new THREE.BoxGeometry(0.3, 0.3, 0.8), new THREE.Vector3(0.8, 0, 0), 0xFF0000);
            this.leftLeg = this.addPart(group, new THREE.BoxGeometry(0.3, 0.3, 0.8), new THREE.Vector3(-0.4, 0, -0.8), 0xFF0000);
            this.rightLeg = this.addPart(group, new THREE.BoxGeometry(0.3, 0.3, 0.8), new THREE.Vector3(0.4, 0, -0.8), 0xFF0000);
        }
        
        return group;
    }
}

export { Character };