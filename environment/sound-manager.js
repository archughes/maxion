// sound-manager.js
class SoundManager {
    constructor(maxAudioElements = 20) {
        this.pool = [];
        this.maxAudioElements = maxAudioElements;
        for (let i = 0; i < maxAudioElements; i++) {
            const audio = new Audio();
            audio.preload = 'auto';
            audio.volume = 0.5;
            this.pool.push({ audio, inUse: false });
        }
    }

    playSound(url) {
        const available = this.pool.find(a => !a.inUse);
        if (available) {
            available.inUse = true;
            available.audio.src = url;
            available.audio.currentTime = 0;
            available.audio.play().catch(e => console.warn("Sound play failed:", e));
            available.audio.onended = () => {
                available.inUse = false;
            };
        } else {
            console.warn("No available audio elements to play:", url);
        }
    }
}

export { SoundManager };