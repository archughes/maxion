import { SoundGenerator } from './SoundGenerator.js';

export class TreeChopSound extends SoundGenerator {
    constructor(audioCtx, masterGain, params = {}) {
        super(audioCtx, masterGain, {
            chopIntensity: params.chopIntensity || 2, // 0-4 scale for force of chop
            chopTool: params.chopTool || 'axe',       // 'axe', 'hatchet', 'saw'
            woodType: params.woodType || 'oak'        // 'oak', 'pine', 'birch'
        });
        this.isPlaying = false;
        this.chopInterval = null;
    }

    start() {
        if (this.isPlaying) return;
        this.isPlaying = true;

        // Base interval decreases with intensity (faster chopping)
        const intervalTime = 1.5 - (this.params.chopIntensity * 0.25);

        const scheduleChop = () => {
            this.playChop();
            this.chopInterval = setTimeout(scheduleChop, intervalTime * 1000);
        };

        scheduleChop();
    }

    stop() {
        if (!this.isPlaying) return;
        this.isPlaying = false;

        if (this.chopInterval) {
            clearTimeout(this.chopInterval);
            this.chopInterval = null;
        }

        super.stop(); // Inherited cleanup of active nodes
    }

    playBurst() {
        const chopCount = 2 + Math.floor(this.params.chopIntensity * 0.5); // 2-4 chops
        const currentTime = this.audioCtx.currentTime;
        const baseInterval = 0.8 - (this.params.chopIntensity * 0.15); // Faster with intensity

        for (let i = 0; i < chopCount; i++) {
            const chopTime = currentTime + (i * baseInterval);
            this.playChop(chopTime);
        }
        // Timeout based on last chop + max sound duration (saw with resonance: ~1.2s)
        this.timeout = setTimeout(() => this.stop(), (chopCount * baseInterval + 1.2) * 1000);
    }

    playChop(startTime = this.audioCtx.currentTime) {
        switch (this.params.chopTool) {
            case 'axe':
                this.createAxeChop(startTime);
                break;
            case 'hatchet':
                this.createHatchetChop(startTime);
                break;
            case 'saw':
                this.createSawChop(startTime);
                break;
            default:
                this.createAxeChop(startTime);
        }
    }

    createAxeChop(startTime) {
        // Impact sound (blade hitting wood)
        const impact = this.audioCtx.createOscillator();
        impact.type = 'triangle';
        impact.frequency.value = 100 + (this.params.chopIntensity * 20);

        const impactGain = this.audioCtx.createGain();
        const impactVolume = 0.2 + (this.params.chopIntensity * 0.1);
        impactGain.gain.setValueAtTime(0, startTime);
        impactGain.gain.linearRampToValueAtTime(impactVolume, startTime + 0.01);
        impactGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);

        impact.connect(impactGain).connect(this.masterGain);
        impact.start(startTime);
        impact.stop(startTime + 0.15);
        this.addActiveNode(impact);

        // Wood cracking noise
        const crackNoise = this.audioCtx.createBufferSource();
        crackNoise.buffer = this.createNoiseBuffer(0.3);
        
        const crackFilter = this.audioCtx.createBiquadFilter();
        crackFilter.type = 'bandpass';
        crackFilter.frequency.value = this.getWoodFrequency() * 2;
        crackFilter.Q.value = 5;

        const crackGain = this.audioCtx.createGain();
        const crackVolume = 0.1 + (this.params.chopIntensity * 0.05);
        crackGain.gain.setValueAtTime(0, startTime + 0.02);
        crackGain.gain.linearRampToValueAtTime(crackVolume, startTime + 0.05);
        crackGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

        crackNoise.connect(crackFilter).connect(crackGain).connect(this.masterGain);
        crackNoise.start(startTime + 0.02);
        crackNoise.stop(startTime + 0.3);
        this.addActiveNode(crackNoise);

        // Resonance based on wood type
        const resonance = this.audioCtx.createOscillator();
        resonance.type = 'sine';
        resonance.frequency.value = this.getWoodFrequency();

        const resonanceGain = this.audioCtx.createGain();
        const resonanceVolume = 0.05 + (this.params.chopIntensity * 0.03);
        resonanceGain.gain.setValueAtTime(0, startTime + 0.05);
        resonanceGain.gain.linearRampToValueAtTime(resonanceVolume, startTime + 0.1);
        resonanceGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

        resonance.connect(resonanceGain).connect(this.masterGain);
        resonance.start(startTime + 0.05);
        resonance.stop(startTime + 0.4);
        this.addActiveNode(resonance);
    }

    createHatchetChop(startTime) {
        // Lighter impact sound (smaller blade)
        const impact = this.audioCtx.createOscillator();
        impact.type = 'triangle';
        impact.frequency.value = 120 + (this.params.chopIntensity * 25);

        const impactGain = this.audioCtx.createGain();
        const impactVolume = 0.15 + (this.params.chopIntensity * 0.08);
        impactGain.gain.setValueAtTime(0, startTime);
        impactGain.gain.linearRampToValueAtTime(impactVolume, startTime + 0.008);
        impactGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12);

        impact.connect(impactGain).connect(this.masterGain);
        impact.start(startTime);
        impact.stop(startTime + 0.12);
        this.addActiveNode(impact);

        // Sharper crack noise
        const crackNoise = this.audioCtx.createBufferSource();
        crackNoise.buffer = this.createNoiseBuffer(0.25);

        const crackFilter = this.audioCtx.createBiquadFilter();
        crackFilter.type = 'bandpass';
        crackFilter.frequency.value = this.getWoodFrequency() * 2.5;
        crackFilter.Q.value = 8;

        const crackGain = this.audioCtx.createGain();
        const crackVolume = 0.12 + (this.params.chopIntensity * 0.06);
        crackGain.gain.setValueAtTime(0, startTime + 0.01);
        crackGain.gain.linearRampToValueAtTime(crackVolume, startTime + 0.04);
        crackGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

        crackNoise.connect(crackFilter).connect(crackGain).connect(this.masterGain);
        crackNoise.start(startTime + 0.01);
        crackNoise.stop(startTime + 0.25);
        this.addActiveNode(crackNoise);

        // Subtle resonance
        const resonance = this.audioCtx.createOscillator();
        resonance.type = 'sine';
        resonance.frequency.value = this.getWoodFrequency() * 1.2;

        const resonanceGain = this.audioCtx.createGain();
        const resonanceVolume = 0.04 + (this.params.chopIntensity * 0.02);
        resonanceGain.gain.setValueAtTime(0, startTime + 0.03);
        resonanceGain.gain.linearRampToValueAtTime(resonanceVolume, startTime + 0.08);
        resonanceGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

        resonance.connect(resonanceGain).connect(this.masterGain);
        resonance.start(startTime + 0.03);
        resonance.stop(startTime + 0.3);
        this.addActiveNode(resonance);
    }

    createSawChop(startTime) {
        // Sawing sound (continuous grating)
        const sawNoise = this.audioCtx.createBufferSource();
        sawNoise.buffer = this.createNoiseBuffer(0.8);

        const sawFilter = this.audioCtx.createBiquadFilter();
        sawFilter.type = 'bandpass';
        sawFilter.frequency.value = this.getWoodFrequency() * 3;
        sawFilter.Q.value = 10;

        const sawGain = this.audioCtx.createGain();
        const sawVolume = 0.1 + (this.params.chopIntensity * 0.07);
        sawGain.gain.setValueAtTime(0, startTime);
        sawGain.gain.linearRampToValueAtTime(sawVolume, startTime + 0.1);
        sawGain.gain.linearRampToValueAtTime(sawVolume * 0.8, startTime + 0.6);
        sawGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8);

        sawNoise.connect(sawFilter).connect(sawGain).connect(this.masterGain);
        sawNoise.start(startTime);
        sawNoise.stop(startTime + 0.8);
        this.addActiveNode(sawNoise);

        // Saw blade resonance
        const blade = this.audioCtx.createOscillator();
        blade.type = 'sawtooth';
        blade.frequency.value = 800 + (this.params.chopIntensity * 200);

        const bladeGain = this.audioCtx.createGain();
        const bladeVolume = 0.05 + (this.params.chopIntensity * 0.03);
        bladeGain.gain.setValueAtTime(0, startTime);
        bladeGain.gain.linearRampToValueAtTime(bladeVolume, startTime + 0.05);
        bladeGain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.0);

        blade.connect(bladeGain).connect(this.masterGain);
        blade.start(startTime);
        blade.stop(startTime + 1.0);
        this.addActiveNode(blade);

        // Wood stress sound
        const stress = this.audioCtx.createOscillator();
        stress.type = 'sine';
        stress.frequency.value = this.getWoodFrequency();

        const stressGain = this.audioCtx.createGain();
        const stressVolume = 0.06 + (this.params.chopIntensity * 0.04);
        stressGain.gain.setValueAtTime(0, startTime + 0.2);
        stressGain.gain.linearRampToValueAtTime(stressVolume, startTime + 0.4);
        stressGain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.2);

        stress.connect(stressGain).connect(this.masterGain);
        stress.start(startTime + 0.2);
        stress.stop(startTime + 1.2);
        this.addActiveNode(stress);
    }

    getWoodFrequency() {
        // Base frequency varies by wood type
        const woodFreqs = {
            'oak': 200,   // Dense, low resonance
            'pine': 300,  // Softer, higher pitch
            'birch': 250  // Medium density
        };
        const baseFreq = woodFreqs[this.params.woodType] || 200;
        const variation = 0.95 + (Math.random() * 0.1);
        return baseFreq * variation;
    }
}