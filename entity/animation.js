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
    constructor(name, duration, onStart, onUpdate, onComplete) {
        this.name = name;
        this.duration = duration;
        this.elapsed = 0;
        this.completed = false;
        this.onStart = onStart;
        this.onUpdate = onUpdate;
        this.onComplete = onComplete;
    }

    start() {
        if (this.onStart) this.onStart();
    }

    update(deltaTime) {
        if (this.completed) return;
        this.elapsed += deltaTime;
        if (this.onUpdate) this.onUpdate(this.elapsed / this.duration);
        if (this.elapsed >= this.duration) {
            this.completed = true;
            if (this.onComplete) this.onComplete();
        }
    }
}

function animationSelector(animationName, character) {
    switch (animationName) {
        case "walk":
            return createWalkAnimation(character);
        case "swim":
            return createSwimAnimation(character);
        case "jump":
            return createJumpAnimation(character);
        default:
            console.warn("Unknown animation: " + animationName);
            return null;
    }
}

function createWalkAnimation(character) {
    return new CharacterAnimation(
        "walk",
        0.5,
        () => console.log("Start walking animation"),
        (progress) => {
            character.limbAngle = Math.sin(progress * Math.PI * 2) * 0.5;
            character.leftArm.rotation.z = character.limbAngle;
            character.rightArm.rotation.z = -character.limbAngle;
            character.leftLeg.rotation.z = -character.limbAngle;
            character.rightLeg.rotation.z = character.limbAngle;
        },
        () => console.log("Walking cycle completed")
    );
}

function createSwimAnimation(character) {
    return new CharacterAnimation(
        "swim",
        0.7,
        () => console.log("Start swimming animation"),
        (progress) => {
            character.limbAngle = Math.sin(progress * Math.PI * 2) * 0.3;
            character.leftArm.rotation.z = character.limbAngle * 0.5;
            character.rightArm.rotation.z = -character.limbAngle * 0.5;
            character.leftLeg.rotation.z = -character.limbAngle * 0.5;
            character.rightLeg.rotation.z = character.limbAngle * 0.5;
        },
        () => console.log("Swimming cycle completed")
    );
}

function createJumpAnimation(character) {
    return new CharacterAnimation(
        "jump",
        0.3,
        () => console.log("Start jump animation"),
        (progress) => {
            character.leftArm.rotation.x = character.jumpVelocity > 0 ? -Math.PI / 4 : Math.PI / 2;
            character.rightArm.rotation.x = character.jumpVelocity > 0 ? -Math.PI / 4 : -Math.PI / 2;
            character.leftArm.rotation.z = 0;
            character.rightArm.rotation.z = 0;
        },
        () => console.log("Jump completed")
    );
}

export { CharacterAnimation, AnimationQueue, animationSelector };