class AnimationQueue {
    constructor() {
        this.queue = [];
        this.currentAnimation = null;
        this.lastQueued = null;
    }

    enqueue(animation) {
        // if (this.lastQueued && this.lastQueued.name === animation.name) return; // Prevent redundant enqueues
        
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

class PlayerAnimation {
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

export { PlayerAnimation, AnimationQueue };