export class SpellSound {
    constructor(audioCtx, masterGain, params) {
        this.audioCtx = audioCtx;
        this.masterGain = masterGain;
        this.params = {
            spellPower: params.spellPower || 0,
            spellElement: params.spellElement || 'fire',
            spellCastTime: params.spellCastTime || 0
        };
        this.activeNodes = new Set();
        this.continuousSound = null;
    }

    start() {
        if (this.continuousSound) return;
        
        // Creating charging up sound for spell casting
        const duration = 0.5 + (this.params.spellCastTime * 0.5); // 0.5-2.5 seconds
        const currentTime = this.audioCtx.currentTime;
        
        // Create the base charging sound
        this.continuousSound = this.createChargingSound(currentTime, duration);
    }

    stop() {
        if (this.continuousSound) {
            // Start release phase
            const currentTime = this.audioCtx.currentTime;
            this.createReleaseSound(currentTime);
            
            // Clear continuous sound reference
            this.continuousSound = null;
        }
        
        // Clean up any remaining nodes after a short delay
        setTimeout(() => {
            this.activeNodes.forEach(node => {
                if (node.stop) node.stop();
            });
            this.activeNodes.clear();
        }, 500);
    }

    playBurst() {
        const currentTime = this.audioCtx.currentTime;
        
        // Briefly charge, then release
        const chargeTime = 0.1 + (this.params.spellCastTime * 0.1); // Short charge time
        this.createChargingSound(currentTime, chargeTime);
        this.createReleaseSound(currentTime + chargeTime);
    }
    
    createChargingSound(startTime, duration) {
        let oscTypes, baseFreq, Q, filterType;
        
        // Configure parameters based on element
        switch(this.params.spellElement) {
            case 'fire':
                oscTypes = ['sawtooth', 'square'];
                baseFreq = 200 + (this.params.spellPower * 50);
                Q = 5;
                filterType = 'lowpass';
                break;
            case 'water':
                oscTypes = ['sine', 'triangle'];
                baseFreq = 150 + (this.params.spellPower * 30);
                Q = 10;
                filterType = 'bandpass';
                break;
            case 'air':
                oscTypes = ['sine', 'sine'];
                baseFreq = 300 + (this.params.spellPower * 100);
                Q = 15;
                filterType = 'highpass';
                break;
            case 'earth':
                oscTypes = ['square', 'triangle'];
                baseFreq = 80 + (this.params.spellPower * 20);
                Q = 2;
                filterType = 'lowpass';
                break;
            case 'arcane':
                oscTypes = ['sine', 'sawtooth'];
                baseFreq = 250 + (this.params.spellPower * 80);
                Q = 20;
                filterType = 'bandpass';
                break;
            default:
                oscTypes = ['sine', 'triangle'];
                baseFreq = 200;
                Q = 10;
                filterType = 'bandpass';
        }
        
        // Create noise source for texture
        const noise = this.audioCtx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(duration + 1); // Extra second for release
        
        // Create filter for noise
        const noiseFilter = this.audioCtx.createBiquadFilter();
        noiseFilter.type = filterType;
        noiseFilter.frequency.setValueAtTime(baseFreq * 2, startTime);
        noiseFilter.frequency.exponentialRampToValueAtTime(baseFreq * 4, startTime + duration);
        noiseFilter.Q.value = Q;
        
        // Create gain for noise
        const noiseGain = this.audioCtx.createGain();
        noiseGain.gain.setValueAtTime(0, startTime);
        noiseGain.gain.linearRampToValueAtTime(0.1 + (this.params.spellPower * 0.05), startTime + duration);
        
        // Connect noise chain
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        
        // Create primary oscillator
        const primaryOsc = this.audioCtx.createOscillator();
        primaryOsc.type = oscTypes[0];
        primaryOsc.frequency.setValueAtTime(baseFreq, startTime);
        primaryOsc.frequency.exponentialRampToValueAtTime(baseFreq * (1 + this.params.spellPower * 0.2), startTime + duration);
        
        // Create secondary oscillator for richness
        const secondaryOsc = this.audioCtx.createOscillator();
        secondaryOsc.type = oscTypes[1];
        secondaryOsc.frequency.setValueAtTime(baseFreq * 1.5, startTime);
        secondaryOsc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5 * (1 + this.params.spellPower * 0.3), startTime + duration);
        
        // Create LFO for wobble
        const lfo = this.audioCtx.createOscillator();
        lfo.frequency.value = 3 + (this.params.spellPower * 1.5); // 3-9 Hz wobble
        
        const lfoGain = this.audioCtx.createGain();
        lfoGain.gain.value = baseFreq * 0.1; // 10% depth
        
        // Connect LFO
        lfo.connect(lfoGain);
        lfoGain.connect(primaryOsc.frequency);
        lfoGain.connect(secondaryOsc.frequency);
        
        // Create primary gain
        const primaryGain = this.audioCtx.createGain();
        primaryGain.gain.setValueAtTime(0, startTime);
        primaryGain.gain.linearRampToValueAtTime(0.2 + (this.params.spellPower * 0.1), startTime + duration);
        
        // Create secondary gain
        const secondaryGain = this.audioCtx.createGain();
        secondaryGain.gain.setValueAtTime(0, startTime);
        secondaryGain.gain.linearRampToValueAtTime(0.15 + (this.params.spellPower * 0.07), startTime + duration);
        
        // Connect oscillators
        primaryOsc.connect(primaryGain);
        secondaryOsc.connect(secondaryGain);
        primaryGain.connect(this.masterGain);
        secondaryGain.connect(this.masterGain);
        
        // Add special effects based on element
        if (this.params.spellElement === 'fire') {
            this.addCracklingEffect(startTime, duration);
        } else if (this.params.spellElement === 'water') {
            this.addBubblingEffect(startTime, duration);
        } else if (this.params.spellElement === 'air') {
            this.addWhooshingEffect(startTime, duration);
        } else if (this.params.spellElement === 'earth') {
            this.addRumblingEffect(startTime, duration);
        } else if (this.params.spellElement === 'arcane') {
            this.addShimmeringEffect(startTime, duration);
        }
        
        // Start all sources
        noise.start(startTime);
        primaryOsc.start(startTime);
        secondaryOsc.start(startTime);
        lfo.start(startTime);
        
        // Schedule stop for long after (will be stopped in stop() method)
        const stopTime = startTime + duration + 2;
        noise.stop(stopTime);
        primaryOsc.stop(stopTime);
        secondaryOsc.stop(stopTime);
        lfo.stop(stopTime);
        
        // Track active nodes
        [noise, primaryOsc, secondaryOsc, lfo].forEach(node => {
            this.activeNodes.add(node);
            node.onended = () => this.activeNodes.delete(node);
        });
        
        // Return the main controls for reference in stop()
        return {
            noiseGain,
            primaryGain,
            secondaryGain,
            duration
        };
    }
    
    createReleaseSound(startTime) {
        if (!this.continuousSound) return;
        
        const { noiseGain, primaryGain, secondaryGain } = this.continuousSound;
        
        // Calculate release time based on power
        const releaseTime = 0.2 + (this.params.spellPower * 0.2); // 0.2-1.0 seconds
        
        // Quick fade out for charging sound
        noiseGain.gain.linearRampToValueAtTime(0, startTime + 0.1);
        primaryGain.gain.linearRampToValueAtTime(0, startTime + 0.1);
        secondaryGain.gain.linearRampToValueAtTime(0, startTime + 0.1);
        
        // Create release sound
        const burstIntensity = 0.3 + (this.params.spellPower * 0.15);
        
        // Set up base parameters based on element
        let burstFreq, burstType, filterType, filterFreq;
        
        switch(this.params.spellElement) {
            case 'fire':
                burstFreq = 300 + (this.params.spellPower * 100);
                burstType = 'sawtooth';
                filterType = 'lowpass';
                filterFreq = 2000 + (this.params.spellPower * 500);
                break;
            case 'water':
                burstFreq = 200 + (this.params.spellPower * 50);
                burstType = 'sine';
                filterType = 'bandpass';
                filterFreq = 800 + (this.params.spellPower * 200);
                break;
            case 'air':
                burstFreq = 400 + (this.params.spellPower * 150);
                burstType = 'sine';
                filterType = 'highpass';
                filterFreq = 1500 + (this.params.spellPower * 500);
                break;
            case 'earth':
                burstFreq = 100 + (this.params.spellPower * 40);
                burstType = 'square';
                filterType = 'lowpass';
                filterFreq = 500 + (this.params.spellPower * 100);
                break;
            case 'arcane':
                burstFreq = 350 + (this.params.spellPower * 120);
                burstType = 'triangle';
                filterType = 'bandpass';
                filterFreq = 1200 + (this.params.spellPower * 400);
                break;
            default:
                burstFreq = 300;
                burstType = 'sine';
                filterType = 'bandpass';
                filterFreq = 1000;
        }
        
        // Create noise burst
        const burstNoise = this.audioCtx.createBufferSource();
        burstNoise.buffer = this.createNoiseBuffer(releaseTime + 0.5);
        
        const burstFilter = this.audioCtx.createBiquadFilter();
        burstFilter.type = filterType;
        burstFilter.frequency.setValueAtTime(filterFreq, startTime);
        burstFilter.frequency.exponentialRampToValueAtTime(filterFreq * 0.5, startTime + releaseTime);
        burstFilter.Q.value = 1;
        
        const burstGain = this.audioCtx.createGain();
        burstGain.gain.setValueAtTime(burstIntensity, startTime);
        burstGain.gain.exponentialRampToValueAtTime(0.001, startTime + releaseTime);
        
        // Connect noise burst
        burstNoise.connect(burstFilter);
        burstFilter.connect(burstGain);
        burstGain.connect(this.masterGain);
        
        // Create burst oscillator
        const burstOsc = this.audioCtx.createOscillator();
        burstOsc.type = burstType;
        burstOsc.frequency.setValueAtTime(burstFreq, startTime);
        burstOsc.frequency.exponentialRampToValueAtTime(burstFreq * 0.7, startTime + releaseTime);
        
        const burstOscGain = this.audioCtx.createGain();
        burstOscGain.gain.setValueAtTime(burstIntensity * 0.8, startTime);
        burstOscGain.gain.exponentialRampToValueAtTime(0.001, startTime + releaseTime);
        
        // Connect burst oscillator
        burstOsc.connect(burstOscGain);
        burstOscGain.connect(this.masterGain);
        
        // Add element-specific release effects
        if (this.params.spellElement === 'fire') {
            this.addExplosionEffect(startTime, releaseTime);
        } else if (this.params.spellElement === 'water') {
            this.addSplashEffect(startTime, releaseTime);
        } else if (this.params.spellElement === 'air') {
            this.addGustEffect(startTime, releaseTime);
        } else if (this.params.spellElement === 'earth') {
            this.addImpactEffect(startTime, releaseTime);
        } else if (this.params.spellElement === 'arcane') {
            this.addZapEffect(startTime, releaseTime);
        }
        
        // Start burst sounds
        burstNoise.start(startTime);
        burstOsc.start(startTime);
        
        // Schedule stop
        burstNoise.stop(startTime + releaseTime + 0.1);
        burstOsc.stop(startTime + releaseTime + 0.1);
        
        // Track active nodes
        [burstNoise, burstOsc].forEach(node => {
            this.activeNodes.add(node);
            node.onended = () => this.activeNodes.delete(node);
        });
    }
    
    // Element-specific effects implementations
    addCracklingEffect(startTime, duration) {
        // Implement crackling fire effect with random clicks and pops
        const numCrackles = 5 + Math.floor(this.params.spellPower * 10); // 5-45 crackles
        
        for (let i = 0; i < numCrackles; i++) {
            // Randomize timing throughout the duration
            const crackleTime = startTime + (Math.random() * duration);
            const crackleLength = 0.01 + (Math.random() * 0.03); // 10-40ms
            
            // Create short click oscillator
            const crackleOsc = this.audioCtx.createOscillator();
            crackleOsc.type = 'square';
            crackleOsc.frequency.value = 2000 + (Math.random() * 3000); // 2-5kHz
            
            // Create bandpass filter for shaping
            const crackleFilter = this.audioCtx.createBiquadFilter();
            crackleFilter.type = 'bandpass';
            crackleFilter.frequency.value = 3000 + (Math.random() * 4000); // 3-7kHz
            crackleFilter.Q.value = 10 + (Math.random() * 20); // Sharp resonance
            
            // Create gain node for envelope
            const crackleGain = this.audioCtx.createGain();
            crackleGain.gain.setValueAtTime(0, crackleTime);
            crackleGain.gain.linearRampToValueAtTime(0.05 + (this.params.spellPower * 0.02), crackleTime + 0.001);
            crackleGain.gain.exponentialRampToValueAtTime(0.001, crackleTime + crackleLength);
            
            // Connect nodes
            crackleOsc.connect(crackleFilter);
            crackleFilter.connect(crackleGain);
            crackleGain.connect(this.masterGain);
            
            // Schedule playback
            crackleOsc.start(crackleTime);
            crackleOsc.stop(crackleTime + crackleLength);
            
            // Track active node
            this.activeNodes.add(crackleOsc);
            crackleOsc.onended = () => this.activeNodes.delete(crackleOsc);
        }
    }
    
    addBubblingEffect(startTime, duration) {
        // Implement bubbling water effect with series of rising tones
        const numBubbles = 6 + Math.floor(this.params.spellPower * 8); // 6-38 bubbles
        const intensity = 0.03 + (this.params.spellPower * 0.02); // Bubble volume
        
        for (let i = 0; i < numBubbles; i++) {
            // Distribute bubbles throughout duration
            const bubbleStartTime = startTime + (Math.random() * duration * 0.9);
            const bubbleLength = 0.1 + (Math.random() * 0.2); // 100-300ms
            
            // Create sine oscillator for bubble tone
            const bubbleOsc = this.audioCtx.createOscillator();
            bubbleOsc.type = 'sine';
            
            // Create rising frequency for bubble sound
            const startFreq = 100 + (Math.random() * 300);
            const endFreq = startFreq + 200 + (Math.random() * 400);
            
            bubbleOsc.frequency.setValueAtTime(startFreq, bubbleStartTime);
            bubbleOsc.frequency.exponentialRampToValueAtTime(endFreq, bubbleStartTime + bubbleLength);
            
            // Create resonant filter
            const bubbleFilter = this.audioCtx.createBiquadFilter();
            bubbleFilter.type = 'bandpass';
            bubbleFilter.frequency.setValueAtTime(startFreq * 2, bubbleStartTime);
            bubbleFilter.frequency.exponentialRampToValueAtTime(endFreq * 2, bubbleStartTime + bubbleLength);
            bubbleFilter.Q.value = 15; // High resonance for bubble-like sound
            
            // Create gain envelope
            const bubbleGain = this.audioCtx.createGain();
            bubbleGain.gain.setValueAtTime(0, bubbleStartTime);
            bubbleGain.gain.linearRampToValueAtTime(intensity, bubbleStartTime + 0.01);
            bubbleGain.gain.setValueAtTime(intensity, bubbleStartTime + bubbleLength - 0.02);
            bubbleGain.gain.exponentialRampToValueAtTime(0.001, bubbleStartTime + bubbleLength);
            
            // Connect nodes
            bubbleOsc.connect(bubbleFilter);
            bubbleFilter.connect(bubbleGain);
            bubbleGain.connect(this.masterGain);
            
            // Schedule playback
            bubbleOsc.start(bubbleStartTime);
            bubbleOsc.stop(bubbleStartTime + bubbleLength + 0.01);
            
            // Track active node
            this.activeNodes.add(bubbleOsc);
            bubbleOsc.onended = () => this.activeNodes.delete(bubbleOsc);
        }
    }
    
    addWhooshingEffect(startTime, duration) {
        // Implement whooshing air effect with filter sweeps on noise
        const numWhooshes = 1 + Math.floor(this.params.spellPower * 0.8); // 1-4 whooshes
        
        for (let i = 0; i < numWhooshes; i++) {
            // Create timing for each whoosh
            const whooshStart = startTime + (i * (duration / numWhooshes));
            const whooshDuration = (duration / numWhooshes) * 0.95;
            
            // Create noise source
            const whooshNoise = this.audioCtx.createBufferSource();
            whooshNoise.buffer = this.createNoiseBuffer(whooshDuration + 0.1);
            
            // Create bandpass filter with sweeping frequency
            const whooshFilter = this.audioCtx.createBiquadFilter();
            whooshFilter.type = 'bandpass';
            whooshFilter.Q.value = 2 + this.params.spellPower; // 2-6 Q value
            
            // Frequency sweep from high to low (descending) for whoosh effect
            const startFreq = 5000 - (i * 500);
            const endFreq = 500;
            whooshFilter.frequency.setValueAtTime(startFreq, whooshStart);
            whooshFilter.frequency.exponentialRampToValueAtTime(endFreq, whooshStart + whooshDuration);
            
            // Create gain envelope
            const whooshGain = this.audioCtx.createGain();
            whooshGain.gain.setValueAtTime(0, whooshStart);
            whooshGain.gain.linearRampToValueAtTime(0.1 + (this.params.spellPower * 0.05), whooshStart + (whooshDuration * 0.3));
            whooshGain.gain.exponentialRampToValueAtTime(0.001, whooshStart + whooshDuration);
            
            // Connect nodes
            whooshNoise.connect(whooshFilter);
            whooshFilter.connect(whooshGain);
            whooshGain.connect(this.masterGain);
            
            // Schedule playback
            whooshNoise.start(whooshStart);
            whooshNoise.stop(whooshStart + whooshDuration + 0.1);
            
            // Track active node
            this.activeNodes.add(whooshNoise);
            whooshNoise.onended = () => this.activeNodes.delete(whooshNoise);
        }
    }
    
    addRumblingEffect(startTime, duration) {
        // Implement earth rumbling effect with low frequency oscillations
        
        // Create main rumble oscillator
        const rumbleOsc = this.audioCtx.createOscillator();
        rumbleOsc.type = 'triangle';
        rumbleOsc.frequency.value = 40 + (this.params.spellPower * 15); // 40-100 Hz
        
        // Create secondary oscillator for texture
        const rumbleOsc2 = this.audioCtx.createOscillator();
        rumbleOsc2.type = 'sine';
        rumbleOsc2.frequency.value = 30 + (this.params.spellPower * 10); // 30-70 Hz
        
        // Create noise source for earth debris sounds
        const rumbleNoise = this.audioCtx.createBufferSource();
        rumbleNoise.buffer = this.createNoiseBuffer(duration + 0.2);
        
        // Create low pass filter for noise
        const rumbleFilter = this.audioCtx.createBiquadFilter();
        rumbleFilter.type = 'lowpass';
        rumbleFilter.frequency.value = 200 + (this.params.spellPower * 50); // 200-400 Hz
        rumbleFilter.Q.value = 1;
        
        // Create tremolo LFO for natural variation
        const tremoloOsc = this.audioCtx.createOscillator();
        tremoloOsc.type = 'sine';
        tremoloOsc.frequency.value = 4 + (Math.random() * 4); // 4-8 Hz tremolo
        
        const tremoloGain = this.audioCtx.createGain();
        tremoloGain.gain.value = 0.3; // Modulation depth
        
        // Connect tremolo
        tremoloOsc.connect(tremoloGain);
        
        // Create gain nodes for each component
        const osc1Gain = this.audioCtx.createGain();
        osc1Gain.gain.setValueAtTime(0, startTime);
        osc1Gain.gain.linearRampToValueAtTime(0.15 + (this.params.spellPower * 0.1), startTime + (duration * 0.2));
        osc1Gain.gain.linearRampToValueAtTime(0.12 + (this.params.spellPower * 0.08), startTime + (duration * 0.8));
        osc1Gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        const osc2Gain = this.audioCtx.createGain();
        osc2Gain.gain.setValueAtTime(0, startTime);
        osc2Gain.gain.linearRampToValueAtTime(0.1 + (this.params.spellPower * 0.07), startTime + (duration * 0.15));
        osc2Gain.gain.linearRampToValueAtTime(0.08 + (this.params.spellPower * 0.06), startTime + (duration * 0.7));
        osc2Gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        const noiseGain = this.audioCtx.createGain();
        noiseGain.gain.setValueAtTime(0, startTime);
        noiseGain.gain.linearRampToValueAtTime(0.05 + (this.params.spellPower * 0.03), startTime + (duration * 0.3));
        noiseGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        // Connect tremolo to gain modulation
        tremoloGain.connect(osc1Gain.gain);
        tremoloGain.connect(osc2Gain.gain);
        
        // Connect audio nodes
        rumbleOsc.connect(osc1Gain);
        rumbleOsc2.connect(osc2Gain);
        rumbleNoise.connect(rumbleFilter);
        rumbleFilter.connect(noiseGain);
        
        osc1Gain.connect(this.masterGain);
        osc2Gain.connect(this.masterGain);
        noiseGain.connect(this.masterGain);
        
        // Add random "rock fall" short sounds
        if (this.params.spellPower > 1) {
            const numRocks = Math.floor(this.params.spellPower * 3); // 0-12 rocks
            
            for (let i = 0; i < numRocks; i++) {
                this.addRockSound(startTime + (Math.random() * duration * 0.8), 0.1 + (Math.random() * 0.2));
            }
        }
        
        // Schedule playback
        rumbleOsc.start(startTime);
        rumbleOsc2.start(startTime);
        rumbleNoise.start(startTime);
        tremoloOsc.start(startTime);
        
        rumbleOsc.stop(startTime + duration + 0.1);
        rumbleOsc2.stop(startTime + duration + 0.1);
        rumbleNoise.stop(startTime + duration + 0.1);
        tremoloOsc.stop(startTime + duration + 0.1);
        
        // Track active nodes
        [rumbleOsc, rumbleOsc2, rumbleNoise, tremoloOsc].forEach(node => {
            this.activeNodes.add(node);
            node.onended = () => this.activeNodes.delete(node);
        });
    }
    
    // Helper method for rock fall sounds
    addRockSound(startTime, duration) {
        // Create short impact sound for rock
        const rockOsc = this.audioCtx.createOscillator();
        rockOsc.type = 'triangle';
        rockOsc.frequency.setValueAtTime(150 + (Math.random() * 250), startTime);
        rockOsc.frequency.exponentialRampToValueAtTime(50, startTime + duration);
        
        const rockNoise = this.audioCtx.createBufferSource();
        rockNoise.buffer = this.createNoiseBuffer(duration + 0.1);
        
        const rockFilter = this.audioCtx.createBiquadFilter();
        rockFilter.type = 'bandpass';
        rockFilter.frequency.setValueAtTime(500 + (Math.random() * 1000), startTime);
        rockFilter.frequency.exponentialRampToValueAtTime(200, startTime + duration);
        rockFilter.Q.value = 1;
        
        const rockOscGain = this.audioCtx.createGain();
        rockOscGain.gain.setValueAtTime(0.08, startTime);
        rockOscGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        const rockNoiseGain = this.audioCtx.createGain();
        rockNoiseGain.gain.setValueAtTime(0.05, startTime);
        rockNoiseGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        // Connect audio nodes
        rockOsc.connect(rockOscGain);
        rockNoise.connect(rockFilter);
        rockFilter.connect(rockNoiseGain);
        
        rockOscGain.connect(this.masterGain);
        rockNoiseGain.connect(this.masterGain);
        
        // Schedule playback
        rockOsc.start(startTime);
        rockNoise.start(startTime);
        
        rockOsc.stop(startTime + duration + 0.1);
        rockNoise.stop(startTime + duration + 0.1);
        
        // Track active nodes
        [rockOsc, rockNoise].forEach(node => {
            this.activeNodes.add(node);
            node.onended = () => this.activeNodes.delete(node);
        });
    }
    
    addShimmeringEffect(startTime, duration) {
        // Spectrogram: High-frequency, narrow bands with rapid fluctuations
        const numShimmers = 10 + (this.params.spellPower * 8);
        const intensity = 0.015 + (this.params.spellPower * 0.01);
        const baseFreq = 4000 + (this.params.spellPower * 1000);
        
        for (let i = 0; i < numShimmers; i++) {
            const shimmerTime = startTime + (Math.random() * duration * 0.9);
            const shimmerLength = 0.05 + (Math.random() * 0.15);
            
            const shimmerOsc = this.audioCtx.createOscillator();
            shimmerOsc.type = 'sine';
            const freqVariation = (Math.random() * 0.1) - 0.05;
            shimmerOsc.frequency.setValueAtTime(baseFreq * (1 + freqVariation), shimmerTime);
            shimmerOsc.frequency.exponentialRampToValueAtTime(baseFreq * (1 + freqVariation * 1.2), shimmerTime + shimmerLength);
            
            const shimmerGain = this.audioCtx.createGain();
            shimmerGain.gain.setValueAtTime(0, shimmerTime);
            shimmerGain.gain.linearRampToValueAtTime(intensity, shimmerTime + 0.01);
            shimmerGain.gain.exponentialRampToValueAtTime(0.001, shimmerTime + shimmerLength);
            
            shimmerOsc.connect(shimmerGain);
            shimmerGain.connect(this.masterGain);
            
            shimmerOsc.start(shimmerTime);
            shimmerOsc.stop(shimmerTime + shimmerLength);
            
            this.activeNodes.add(shimmerOsc);
            shimmerOsc.onended = () => this.activeNodes.delete(shimmerOsc);
        }
    }
    
    addExplosionEffect(startTime, duration) {
        // Spectrogram: Wide-band noise with quick attack, rapid decay
        const explosionNoise = this.audioCtx.createBufferSource();
        explosionNoise.buffer = this.createNoiseBuffer(duration + 0.1);
        
        const explosionFilter = this.audioCtx.createBiquadFilter();
        explosionFilter.type = 'lowpass';
        explosionFilter.frequency.setValueAtTime(2000 + (this.params.spellPower * 500), startTime);
        explosionFilter.frequency.exponentialRampToValueAtTime(500, startTime + duration);
        
        const explosionGain = this.audioCtx.createGain();
        explosionGain.gain.setValueAtTime(0.3 + (this.params.spellPower * 0.15), startTime);
        explosionGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        explosionNoise.connect(explosionFilter);
        explosionFilter.connect(explosionGain);
        explosionGain.connect(this.masterGain);
        
        explosionNoise.start(startTime);
        explosionNoise.stop(startTime + duration + 0.1);
        
        this.activeNodes.add(explosionNoise);
        explosionNoise.onended = () => this.activeNodes.delete(explosionNoise);
    }
    
    addSplashEffect(startTime, duration) {
        // Spectrogram: Mid-frequency burst with resonant peaks
        const splashOsc = this.audioCtx.createOscillator();
        splashOsc.type = 'sine';
        splashOsc.frequency.setValueAtTime(800 + (this.params.spellPower * 200), startTime);
        splashOsc.frequency.exponentialRampToValueAtTime(400, startTime + duration);
        
        const splashFilter = this.audioCtx.createBiquadFilter();
        splashFilter.type = 'bandpass';
        splashFilter.frequency.setValueAtTime(1000, startTime);
        splashFilter.Q.value = 10 + (this.params.spellPower * 5);
        
        const splashGain = this.audioCtx.createGain();
        splashGain.gain.setValueAtTime(0.2 + (this.params.spellPower * 0.1), startTime);
        splashGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        splashOsc.connect(splashFilter);
        splashFilter.connect(splashGain);
        splashGain.connect(this.masterGain);
        
        splashOsc.start(startTime);
        splashOsc.stop(startTime + duration + 0.1);
        
        this.activeNodes.add(splashOsc);
        splashOsc.onended = () => this.activeNodes.delete(splashOsc);
    }
    
    addGustEffect(startTime, duration) {
        // Spectrogram: High-frequency noise with sweeping filter
        const gustNoise = this.audioCtx.createBufferSource();
        gustNoise.buffer = this.createNoiseBuffer(duration + 0.1);
        
        const gustFilter = this.audioCtx.createBiquadFilter();
        gustFilter.type = 'highpass';
        gustFilter.frequency.setValueAtTime(1500 + (this.params.spellPower * 500), startTime);
        gustFilter.frequency.exponentialRampToValueAtTime(800, startTime + duration);
        
        const gustGain = this.audioCtx.createGain();
        gustGain.gain.setValueAtTime(0.2 + (this.params.spellPower * 0.1), startTime);
        gustGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        gustNoise.connect(gustFilter);
        gustFilter.connect(gustGain);
        gustGain.connect(this.masterGain);
        
        gustNoise.start(startTime);
        gustNoise.stop(startTime + duration + 0.1);
        
        this.activeNodes.add(gustNoise);
        gustNoise.onended = () => this.activeNodes.delete(gustNoise);
    }
    
    addImpactEffect(startTime, duration) {
        // Spectrogram: Low-frequency thump with rapid decay
        const impactOsc = this.audioCtx.createOscillator();
        impactOsc.type = 'square';
        impactOsc.frequency.setValueAtTime(100 + (this.params.spellPower * 40), startTime);
        impactOsc.frequency.exponentialRampToValueAtTime(50, startTime + duration);
        
        const impactFilter = this.audioCtx.createBiquadFilter();
        impactFilter.type = 'lowpass';
        impactFilter.frequency.value = 300 + (this.params.spellPower * 100);
        
        const impactGain = this.audioCtx.createGain();
        impactGain.gain.setValueAtTime(0.25 + (this.params.spellPower * 0.15), startTime);
        impactGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        impactOsc.connect(impactFilter);
        impactFilter.connect(impactGain);
        impactGain.connect(this.masterGain);
        
        impactOsc.start(startTime);
        impactOsc.stop(startTime + duration + 0.1);
        
        this.activeNodes.add(impactOsc);
        impactOsc.onended = () => this.activeNodes.delete(impactOsc);
    }
    
    addZapEffect(startTime, duration) {
        // Spectrogram: High-frequency sweep with harmonics
        const zapOsc = this.audioCtx.createOscillator();
        zapOsc.type = 'sawtooth';
        zapOsc.frequency.setValueAtTime(2000 + (this.params.spellPower * 800), startTime);
        zapOsc.frequency.exponentialRampToValueAtTime(1000, startTime + duration);
        
        const zapFilter = this.audioCtx.createBiquadFilter();
        zapFilter.type = 'bandpass';
        zapFilter.frequency.setValueAtTime(1500 + (this.params.spellPower * 400), startTime);
        zapFilter.Q.value = 20;
        
        const zapGain = this.audioCtx.createGain();
        zapGain.gain.setValueAtTime(0.2 + (this.params.spellPower * 0.1), startTime);
        zapGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        zapOsc.connect(zapFilter);
        zapFilter.connect(zapGain);
        zapGain.connect(this.masterGain);
        
        zapOsc.start(startTime);
        zapOsc.stop(startTime + duration + 0.1);
        
        this.activeNodes.add(zapOsc);
        zapOsc.onended = () => this.activeNodes.delete(zapOsc);
    }
    
    updateParams(newParams) {
        this.params = { ...this.params, ...newParams };
    }
    
    createNoiseBuffer(duration) {
        const sampleRate = this.audioCtx.sampleRate;
        const bufferSize = sampleRate * duration;
        const buffer = this.audioCtx.createBuffer(1, bufferSize, sampleRate);
        const output = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        return buffer;
    }
}