import { SoundGenerator } from './SoundGenerator.js';

export class SwordSound extends SoundGenerator {
    constructor(audioCtx, masterGain, params = {}) {
        super(audioCtx, masterGain, {
            swordIntensity: params.swordIntensity || 2,
            swordMaterial: params.swordMaterial || 'steel',
            swordAction: params.swordAction || 'swing'
        });
    }

    start() {
        this.playSwordSound(this.audioCtx.currentTime);
    }

    stop() {
        super.stop(); // Inherited stop method handles cleanup
    }

    playBurst() {
        const currentTime = this.audioCtx.currentTime;
        this.playSwordSound(currentTime);
        // Timeout based on longest sound (steel clash with resonance: ~1.5s)
        this.timeout = setTimeout(() => this.stop(), 1500);
    }

    playSwordSound(startTime) {
        switch (this.params.swordAction) {
            case 'swing':
                this.createSwing(startTime);
                break;
            case 'clash':
                this.createClash(startTime);
                break;
            case 'scrape':
                this.createScrape(startTime);
                break;
            default:
                this.createSwing(startTime);
        }
    }

    createSwing(startTime) {
        const whooshNoise = this.audioCtx.createBufferSource();
        whooshNoise.buffer = this.createNoiseBuffer(0.5);

        const whooshFilter = this.audioCtx.createBiquadFilter();
        whooshFilter.type = 'bandpass';
        whooshFilter.frequency.setValueAtTime(1000 + (this.params.swordIntensity * 200), startTime);
        whooshFilter.frequency.exponentialRampToValueAtTime(500, startTime + 0.4);
        whooshFilter.Q.value = 2;

        const whooshGain = this.audioCtx.createGain();
        const whooshVolume = 0.1 + (this.params.swordIntensity * 0.05);
        whooshGain.gain.setValueAtTime(0, startTime);
        whooshGain.gain.linearRampToValueAtTime(whooshVolume, startTime + 0.1);
        whooshGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

        whooshNoise.connect(whooshFilter).connect(whooshGain).connect(this.masterGain);
        whooshNoise.start(startTime);
        whooshNoise.stop(startTime + 0.5);
        this.addActiveNode(whooshNoise);

        if (this.params.swordMaterial === 'steel') {
            const ringOsc = this.audioCtx.createOscillator();
            ringOsc.type = 'triangle';
            ringOsc.frequency.setValueAtTime(2000 + (this.params.swordIntensity * 500), startTime);
            ringOsc.frequency.exponentialRampToValueAtTime(1500, startTime + 0.3);

            const ringGain = this.audioCtx.createGain();
            ringGain.gain.setValueAtTime(0.05, startTime);
            ringGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

            ringOsc.connect(ringGain).connect(this.masterGain);
            ringOsc.start(startTime);
            ringOsc.stop(startTime + 0.3);
            this.addActiveNode(ringOsc);
        }
    }

    createClash(startTime) {
        const impactOsc = this.audioCtx.createOscillator();
        impactOsc.type = 'square';
        impactOsc.frequency.value = 300 + (this.params.swordIntensity * 100);

        const impactGain = this.audioCtx.createGain();
        const impactVolume = 0.2 + (this.params.swordIntensity * 0.1);
        impactGain.gain.setValueAtTime(impactVolume, startTime);
        impactGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1);

        impactOsc.connect(impactGain).connect(this.masterGain);
        impactOsc.start(startTime);
        impactOsc.stop(startTime + 0.1);
        this.addActiveNode(impactOsc);

        const clashNoise = this.audioCtx.createBufferSource();
        clashNoise.buffer = this.createNoiseBuffer(0.8);

        const clashFilter = this.audioCtx.createBiquadFilter();
        clashFilter.type = 'bandpass';
        clashFilter.frequency.value = 2000 + (this.params.swordIntensity * 500);
        clashFilter.Q.value = 3;

        const clashGain = this.audioCtx.createGain();
        const clashVolume = 0.15 + (this.params.swordIntensity * 0.07);
        clashGain.gain.setValueAtTime(clashVolume, startTime);
        clashGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);

        clashNoise.connect(clashFilter).connect(clashGain).connect(this.masterGain);
        clashNoise.start(startTime);
        clashNoise.stop(startTime + 0.8);
        this.addActiveNode(clashNoise);

        if (this.params.swordMaterial === 'steel') {
            const resonanceOsc = this.audioCtx.createOscillator();
            resonanceOsc.type = 'sine';
            resonanceOsc.frequency.setValueAtTime(3000 + (this.params.swordIntensity * 800), startTime);
            resonanceOsc.frequency.exponentialRampToValueAtTime(2000, startTime + 1);

            const resonanceGain = this.audioCtx.createGain();
            resonanceGain.gain.setValueAtTime(0.1, startTime + 0.1);
            resonanceGain.gain.exponentialRampToValueAtTime(0.001, startTime + 1);

            resonanceOsc.connect(resonanceGain).connect(this.masterGain);
            resonanceOsc.start(startTime + 0.1);
            resonanceOsc.stop(startTime + 1);
            this.addActiveNode(resonanceOsc);
        }
    }

    createScrape(startTime) {
        const scrapeNoise = this.audioCtx.createBufferSource();
        scrapeNoise.buffer = this.createNoiseBuffer(1.2);

        const scrapeFilter = this.audioCtx.createBiquadFilter();
        scrapeFilter.type = 'bandpass';
        scrapeFilter.frequency.setValueAtTime(1500 + (this.params.swordIntensity * 300), startTime);
        scrapeFilter.frequency.exponentialRampToValueAtTime(1200, startTime + 1);
        scrapeFilter.Q.value = 5;

        const scrapeGain = this.audioCtx.createGain();
        const scrapeVolume = 0.12 + (this.params.swordIntensity * 0.06);
        scrapeGain.gain.setValueAtTime(0, startTime);
        scrapeGain.gain.linearRampToValueAtTime(scrapeVolume, startTime + 0.2);
        scrapeGain.gain.exponentialRampToValueAtTime(0.001, startTime + 1);

        scrapeNoise.connect(scrapeFilter).connect(scrapeGain).connect(this.masterGain);
        scrapeNoise.start(startTime);
        scrapeNoise.stop(startTime + 1.2);
        this.addActiveNode(scrapeNoise);

        if (this.params.swordMaterial === 'steel') {
            const grindOsc = this.audioCtx.createOscillator();
            grindOsc.type = 'sawtooth';
            grindOsc.frequency.setValueAtTime(2500 + (this.params.swordIntensity * 600), startTime);
            grindOsc.frequency.exponentialRampToValueAtTime(1800, startTime + 0.8);

            const grindGain = this.audioCtx.createGain();
            grindGain.gain.setValueAtTime(0.08, startTime);
            grindGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8);

            grindOsc.connect(grindGain).connect(this.masterGain);
            grindOsc.start(startTime);
            grindOsc.stop(startTime + 0.8);
            this.addActiveNode(grindOsc);
        }
    }
}