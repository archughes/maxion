import * as THREE from '../lib/three.module.js';

class AnimationQueue {
    constructor() {
        this.queue = [];
        this.currentAnimation = null;
        this.lastQueued = null;
    }

    enqueue(animation) {
        this.lastQueued = animation;
        if (!this.currentAnimation || this.currentAnimation.completed) {
            this.currentAnimation = animation;
            animation.start();
        } else {
            this.queue.push(animation);
        }
    }

    update(deltaTime) {
        if (this.currentAnimation) {
            this.currentAnimation.update(deltaTime);
            if (this.currentAnimation.completed && this.queue.length > 0) {
                this.currentAnimation = this.queue.shift();
                this.currentAnimation.start();
            }
        } else {
            this.lastQueued = null;
        }
    }

    clear() {
        this.queue = [];
        this.currentAnimation = null;
        this.lastQueued = null;
    }
}

class CharacterAnimation {
    constructor(name, duration, character, mixer, clip) {
        this.name = name;
        this.duration = duration;
        this.character = character;
        this.mixer = mixer;
        this.clip = clip;
        this.elapsed = 0;
        this.completed = false;
        this.action = null;
    }

    start() {
        this.action = this.mixer.clipAction(this.clip);
        this.action.setLoop(THREE.LoopOnce, 1);
        this.action.clampWhenFinished = true;
        this.action.play();
    }

    update(deltaTime) {
        if (this.completed) return;
        this.elapsed += deltaTime;
        if (this.elapsed >= this.duration) {
            this.completed = true;
            if (this.action) this.action.stop();
        }
    }
}

function animationSelector(animationName, character) {
    const mixer = character.mixer; // Use the player's mixer
    switch (animationName) {
        case "walk":
            return createWalkAnimation(character, mixer);
        case "swim":
            return createSwimAnimation(character, mixer);
        case "jump":
            return createJumpAnimation(character, mixer);
        case "crawl":
            return createCrawlAnimation(character, mixer);
        default:
            console.warn(`Unknown animation: ${animationName}`);
            return null;
    }
}

function createWalkAnimation(character, mixer) {
    const times = [0, 0.25, 0.5];
    const valuesLeftArm = [0, 0.5, -0.5];
    const valuesRightArm = [0, -0.5, 0.5];
    const valuesLeftLeg = [0, -0.5, 0.5];
    const valuesRightLeg = [0, 0.5, -0.5];

    const clip = new THREE.AnimationClip('walk', 0.5, [
        new THREE.VectorKeyframeTrack(`${character.leftArm.uuid}.rotation[x]`, times, valuesLeftArm),
        new THREE.VectorKeyframeTrack(`${character.rightArm.uuid}.rotation[x]`, times, valuesRightArm),
        new THREE.VectorKeyframeTrack(`${character.leftLeg.uuid}.rotation[x]`, times, valuesLeftLeg),
        new THREE.VectorKeyframeTrack(`${character.rightLeg.uuid}.rotation[x]`, times, valuesRightLeg),
    ]);

    return new CharacterAnimation("walk", 0.5, character, mixer, clip);
}

function createSwimAnimation(character, mixer) {
    const times = [0, 0.35, 0.7];
    const valuesArms = [0, 0.3, -0.3];
    const valuesLegs = [0, -0.3, 0.3];

    const clip = new THREE.AnimationClip('swim', 0.7, [
        new THREE.VectorKeyframeTrack(`${character.leftArm.uuid}.rotation[z]`, times, valuesArms),
        new THREE.VectorKeyframeTrack(`${character.rightArm.uuid}.rotation[z]`, times, valuesArms.map(v => -v)),
        new THREE.VectorKeyframeTrack(`${character.leftLeg.uuid}.rotation[z]`, times, valuesLegs),
        new THREE.VectorKeyframeTrack(`${character.rightLeg.uuid}.rotation[z]`, times, valuesLegs.map(v => -v)),
    ]);

    return new CharacterAnimation("swim", 0.7, character, mixer, clip);
}

function createJumpAnimation(character, mixer) {
    const times = [0, 0.15, 0.3];
    const valuesArms = [-Math.PI / 4, Math.PI / 2, 0];

    const clip = new THREE.AnimationClip('jump', 0.3, [
        new THREE.VectorKeyframeTrack(`${character.leftArm.uuid}.rotation[x]`, times, valuesArms),
        new THREE.VectorKeyframeTrack(`${character.rightArm.uuid}.rotation[x]`, times, valuesArms.map(v => -v)),
    ]);

    return new CharacterAnimation("jump", 0.3, character, mixer, clip);
}

function createCrawlAnimation(character, mixer) {
    const times = [0, 0.3, 0.6];
    const valuesArms = [0, 0.4, -0.4];
    const valuesLegs = [0, -0.4, 0.4];

    const clip = new THREE.AnimationClip('crawl', 0.6, [
        new THREE.VectorKeyframeTrack(`${character.leftArm.uuid}.rotation[z]`, times, valuesArms),
        new THREE.VectorKeyframeTrack(`${character.rightArm.uuid}.rotation[z]`, times, valuesArms.map(v => -v)),
        new THREE.VectorKeyframeTrack(`${character.leftLeg.uuid}.rotation[z]`, times, valuesLegs),
        new THREE.VectorKeyframeTrack(`${character.rightLeg.uuid}.rotation[z]`, times, valuesLegs.map(v => -v)),
    ]);

    return new CharacterAnimation("crawl", 0.6, character, mixer, clip);
}

export { CharacterAnimation, AnimationQueue, animationSelector };