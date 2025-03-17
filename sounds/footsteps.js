// footsteps.js
export class FootstepsSound {
    constructor(audioCtx, masterGain, params = {}) {
        this.audioCtx = audioCtx;
        this.masterGain = masterGain;
        this.params = {
            footstepsEnvironment: params.footstepsEnvironment || 'stone', 
            footstepsIntensity: params.footstepsIntensity || 2, 
            footstepsWetness: params.footstepsWetness || 2
        };
        this.isPlaying = false;
        this.stepInterval = null;
        this.activeNodes = new Set();
    }

    start() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        
        // Calculate step interval based on intensity
        // Sneaking: ~1.2s between steps, Running: ~0.3s between steps
        const intervalTime = 1.2 - (this.params.footstepsIntensity * 0.225);
        
        const scheduleStep = () => {
            this.playStep();
            this.stepInterval = setTimeout(scheduleStep, intervalTime * 1000);
        };
        
        scheduleStep();
    }

    stop() {
        if (!this.isPlaying) return;
        this.isPlaying = false;
        
        if (this.stepInterval) {
            clearTimeout(this.stepInterval);
            this.stepInterval = null;
        }
        
        // Stop all active nodes
        this.activeNodes.forEach(node => {
            if (node.stop) {
                try {
                    node.stop();
                } catch (e) {
                    // Handle already stopped nodes
                }
            }
        });
        this.activeNodes.clear();
    }

    playBurst() {
        // Play a burst of footsteps (e.g., 3-5 steps based on intensity)
        const stepCount = 3 + Math.floor(this.params.footstepsIntensity * 0.5);
        const currentTime = this.audioCtx.currentTime;
        
        // More random timing for sneaking, more regular for running
        const regularity = 0.2 + (this.params.footstepsIntensity * 0.2);
        const baseInterval = 1.2 - (this.params.footstepsIntensity * 0.225);
        
        for (let i = 0; i < stepCount; i++) {
            const randomOffset = (1 - regularity) * (Math.random() * 0.2 - 0.1);
            const stepTime = currentTime + (i * baseInterval) + randomOffset;
            this.playStep(stepTime);
        }
    }

    playStep(startTime = this.audioCtx.currentTime) {
        switch (this.params.footstepsEnvironment) {
            case 'water':
                this.createWaterStep(startTime);
                break;
            case 'mud':
                this.createMudStep(startTime);
                break;
            case 'sand':
                this.createSandStep(startTime);
                break;
            case 'stone':
                this.createStoneStep(startTime);
                break;
            case 'metal':
                this.createMetalStep(startTime);
                break;
            default:
                this.createStoneStep(startTime);
        }
    }

    createWaterStep(startTime) {
        // Base impact sound (low frequency thud)
        const impact = this.audioCtx.createOscillator();
        impact.type = 'sine';
        impact.frequency.value = 80 + Math.random() * 40;
        
        const impactGain = this.audioCtx.createGain();
        impactGain.gain.setValueAtTime(0, startTime);
        impactGain.gain.linearRampToValueAtTime(0.2 + (this.params.footstepsIntensity * 0.1), startTime + 0.01);
        impactGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);
        
        impact.connect(impactGain).connect(this.masterGain);
        impact.start(startTime);
        impact.stop(startTime + 0.15);
        this.activeNodes.add(impact);
        impact.onended = () => this.activeNodes.delete(impact);
        
        // Water splash (filtered noise)
        const splashNoise = this.audioCtx.createBufferSource();
        const noiseBuffer = this.createNoiseBuffer(0.3); // 300ms of noise
        splashNoise.buffer = noiseBuffer;
        
        // Filter for splash sound
        const splashFilter = this.audioCtx.createBiquadFilter();
        splashFilter.type = 'bandpass';
        splashFilter.frequency.value = 2000 + Math.random() * 2000;
        splashFilter.Q.value = 1;
        
        const splashGain = this.audioCtx.createGain();
        const splashVolume = 0.05 + (this.params.footstepsWetness * 0.05) + (this.params.footstepsIntensity * 0.03);
        splashGain.gain.setValueAtTime(0, startTime);
        splashGain.gain.linearRampToValueAtTime(splashVolume, startTime + 0.02);
        splashGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2 + (this.params.footstepsWetness * 0.1));
        
        splashNoise.connect(splashFilter).connect(splashGain).connect(this.masterGain);
        splashNoise.start(startTime);
        splashNoise.stop(startTime + 0.3);
        this.activeNodes.add(splashNoise);
        splashNoise.onended = () => this.activeNodes.delete(splashNoise);
        
        // Water bubbles for deeper water
        if (this.params.footstepsWetness > 2) {
            const bubbleCount = Math.floor(this.params.footstepsWetness * 3);
            
            for (let i = 0; i < bubbleCount; i++) {
                // Random timing for bubbles within 200ms after splash
                const bubbleTime = startTime + 0.05 + (Math.random() * 0.2);
                const bubbleDuration = 0.03 + (Math.random() * 0.07); // 30-100ms duration
                
                const bubble = this.audioCtx.createOscillator();
                bubble.type = 'sine';
                bubble.frequency.value = 300 + Math.random() * 1200; // 300-1500Hz
                
                const bubbleGain = this.audioCtx.createGain();
                const bubbleVolume = 0.02 + (this.params.footstepsWetness * 0.01);
                bubbleGain.gain.setValueAtTime(0, bubbleTime);
                bubbleGain.gain.linearRampToValueAtTime(bubbleVolume, bubbleTime + 0.01);
                bubbleGain.gain.exponentialRampToValueAtTime(0.001, bubbleTime + bubbleDuration);
                
                bubble.connect(bubbleGain).connect(this.masterGain);
                bubble.start(bubbleTime);
                bubble.stop(bubbleTime + bubbleDuration);
                this.activeNodes.add(bubble);
                bubble.onended = () => this.activeNodes.delete(bubble);
            }
        }
    }

    createMudStep(startTime) {
        // Base impact
        const impact = this.audioCtx.createOscillator();
        impact.type = 'triangle';
        impact.frequency.value = 60 + Math.random() * 30;
        
        const impactGain = this.audioCtx.createGain();
        impactGain.gain.setValueAtTime(0, startTime);
        impactGain.gain.linearRampToValueAtTime(0.15 + (this.params.footstepsIntensity * 0.1), startTime + 0.02);
        impactGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);
        
        impact.connect(impactGain).connect(this.masterGain);
        impact.start(startTime);
        impact.stop(startTime + 0.2);
        this.activeNodes.add(impact);
        impact.onended = () => this.activeNodes.delete(impact);
        
        // Squelch sound (filtered noise with envelope)
        const squelchNoise = this.audioCtx.createBufferSource();
        const noiseBuffer = this.createNoiseBuffer(0.5); // 500ms of noise
        squelchNoise.buffer = noiseBuffer;
        
        // Filter for squelch
        const squelchFilter = this.audioCtx.createBiquadFilter();
        squelchFilter.type = 'lowpass';
        squelchFilter.frequency.value = 800 + (this.params.footstepsWetness * 200);
        squelchFilter.Q.value = 3;
        
        // Another filter for character
        const characterFilter = this.audioCtx.createBiquadFilter();
        characterFilter.type = 'peaking';
        characterFilter.frequency.value = 1500 + Math.random() * 1000;
        characterFilter.gain.value = 15;
        characterFilter.Q.value = 5;
        
        const squelchGain = this.audioCtx.createGain();
        const squelchVolume = 0.1 + (this.params.footstepsWetness * 0.05);
        squelchGain.gain.setValueAtTime(0, startTime + 0.05); // Delayed start
        squelchGain.gain.linearRampToValueAtTime(squelchVolume, startTime + 0.1);
        
        // Unique mud envelope - two-phase decay
        squelchGain.gain.setValueAtTime(squelchVolume, startTime + 0.15);
        squelchGain.gain.exponentialRampToValueAtTime(squelchVolume * 0.3, startTime + 0.25);
        squelchGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4 + (this.params.footstepsWetness * 0.1));
        
        squelchNoise
            .connect(squelchFilter)
            .connect(characterFilter)
            .connect(squelchGain)
            .connect(this.masterGain);
            
        squelchNoise.start(startTime);
        squelchNoise.stop(startTime + 0.5);
        this.activeNodes.add(squelchNoise);
        squelchNoise.onended = () => this.activeNodes.delete(squelchNoise);
        
        // Add suction sound for very wet mud
        if (this.params.footstepsWetness > 3) {
            const suctionTime = startTime + 0.3;
            const suction = this.audioCtx.createOscillator();
            suction.type = 'sine';
            
            // Rising pitch sweep for suction effect
            suction.frequency.setValueAtTime(100, suctionTime);
            suction.frequency.exponentialRampToValueAtTime(300, suctionTime + 0.2);
            
            const suctionGain = this.audioCtx.createGain();
            const suctionVolume = 0.05 + (this.params.footstepsWetness * 0.02);
            suctionGain.gain.setValueAtTime(0, suctionTime);
            suctionGain.gain.linearRampToValueAtTime(suctionVolume, suctionTime + 0.05);
            suctionGain.gain.exponentialRampToValueAtTime(0.001, suctionTime + 0.2);
            
            // Filter to shape suction sound
            const suctionFilter = this.audioCtx.createBiquadFilter();
            suctionFilter.type = 'lowpass';
            suctionFilter.frequency.value = 500;
            suctionFilter.Q.value = 2;
            
            suction.connect(suctionFilter).connect(suctionGain).connect(this.masterGain);
            suction.start(suctionTime);
            suction.stop(suctionTime + 0.2);
            this.activeNodes.add(suction);
            suction.onended = () => this.activeNodes.delete(suction);
        }
    }

    createSandStep(startTime) {
        // Base impact (more muted than stone)
        const impact = this.audioCtx.createOscillator();
        impact.type = 'sine';
        impact.frequency.value = 100 + Math.random() * 50;
        
        const impactGain = this.audioCtx.createGain();
        impactGain.gain.setValueAtTime(0, startTime);
        impactGain.gain.linearRampToValueAtTime(0.1 + (this.params.footstepsIntensity * 0.05), startTime + 0.01);
        impactGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1);
        
        impact.connect(impactGain).connect(this.masterGain);
        impact.start(startTime);
        impact.stop(startTime + 0.1);
        this.activeNodes.add(impact);
        impact.onended = () => this.activeNodes.delete(impact);
        
        // Create granular texture
        const grainCount = 10 + Math.floor(this.params.footstepsIntensity * 5);
        const grainDuration = 0.05 + (Math.random() * 0.1);
        
        for (let i = 0; i < grainCount; i++) {
            const grainDelay = Math.random() * 0.15;
            const grainStart = startTime + grainDelay;
            
            const grain = this.audioCtx.createBufferSource();
            const grainBuffer = this.createNoiseBuffer(grainDuration);
            grain.buffer = grainBuffer;
            grain.playbackRate.value = 0.8 + Math.random() * 0.4; // Vary the pitch
            
            // Filter each grain differently
            const grainFilter = this.audioCtx.createBiquadFilter();
            grainFilter.type = 'bandpass';
            // Higher frequencies for fine sand, lower for coarse
            grainFilter.frequency.value = 3000 + (Math.random() * 5000);
            grainFilter.Q.value = 1 + Math.random() * 2;
            
            const grainGain = this.audioCtx.createGain();
            const grainVolume = (0.01 + Math.random() * 0.02) * (1 + this.params.footstepsIntensity * 0.25);
            grainGain.gain.setValueAtTime(0, grainStart);
            grainGain.gain.linearRampToValueAtTime(grainVolume, grainStart + 0.005);
            grainGain.gain.exponentialRampToValueAtTime(0.001, grainStart + grainDuration);
            
            grain.connect(grainFilter).connect(grainGain).connect(this.masterGain);
            grain.start(grainStart);
            grain.stop(grainStart + grainDuration);
            this.activeNodes.add(grain);
            grain.onended = () => this.activeNodes.delete(grain);
        }
        
        // Add continuous crunch sound for high-intensity steps
        if (this.params.footstepsIntensity > 2) {
            const crunchTime = startTime + 0.02;
            const crunchDuration = 0.1 + (this.params.footstepsIntensity * 0.05);
            
            const crunch = this.audioCtx.createBufferSource();
            const crunchBuffer = this.createNoiseBuffer(crunchDuration);
            crunch.buffer = crunchBuffer;
            
            // Filter for sand crunch - different spectral content based on intensity
            const crunchFilter = this.audioCtx.createBiquadFilter();
            crunchFilter.type = 'bandpass';
            // Lower frequencies represent coarser sand
            crunchFilter.frequency.value = 2000 + (Math.random() * 2000);
            crunchFilter.Q.value = 2;
            
            const crunchGain = this.audioCtx.createGain();
            const crunchVolume = 0.08 * (this.params.footstepsIntensity / 4);
            crunchGain.gain.setValueAtTime(0, crunchTime);
            crunchGain.gain.linearRampToValueAtTime(crunchVolume, crunchTime + 0.01);
            crunchGain.gain.exponentialRampToValueAtTime(0.001, crunchTime + crunchDuration);
            
            crunch.connect(crunchFilter).connect(crunchGain).connect(this.masterGain);
            crunch.start(crunchTime);
            crunch.stop(crunchTime + crunchDuration);
            this.activeNodes.add(crunch);
            crunch.onended = () => this.activeNodes.delete(crunch);
        }
    }

    createStoneStep(startTime) {
        // Main impact - sharp attack
        const impact = this.audioCtx.createOscillator();
        impact.type = 'sine';
        impact.frequency.value = 150 + Math.random() * 50;
        
        const impactGain = this.audioCtx.createGain();
        const impactVolume = 0.15 + (this.params.footstepsIntensity * 0.1);
        impactGain.gain.setValueAtTime(0, startTime);
        impactGain.gain.linearRampToValueAtTime(impactVolume, startTime + 0.005);
        impactGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1);
        
        impact.connect(impactGain).connect(this.masterGain);
        impact.start(startTime);
        impact.stop(startTime + 0.1);
        this.activeNodes.add(impact);
        impact.onended = () => this.activeNodes.delete(impact);
        
        // High-frequency impact transient
        const crack = this.audioCtx.createOscillator();
        crack.type = 'sawtooth';
        crack.frequency.value = 2000 + Math.random() * 1000;
        
        const crackGain = this.audioCtx.createGain();
        const crackVolume = 0.05 + (this.params.footstepsIntensity * 0.03);
        crackGain.gain.setValueAtTime(0, startTime);
        crackGain.gain.linearRampToValueAtTime(crackVolume, startTime + 0.002);
        crackGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.03);
        
        crack.connect(crackGain).connect(this.masterGain);
        crack.start(startTime);
        crack.stop(startTime + 0.03);
        this.activeNodes.add(crack);
        crack.onended = () => this.activeNodes.delete(crack);
        
        // Resonance/echo - depends on environment
        const resonance = this.audioCtx.createOscillator();
        resonance.type = 'sine';
        resonance.frequency.value = 300 + Math.random() * 200;
        
        const resonanceGain = this.audioCtx.createGain();
        const resonanceVolume = 0.05 + (this.params.footstepsIntensity * 0.02);
        resonanceGain.gain.setValueAtTime(0, startTime + 0.01);
        resonanceGain.gain.linearRampToValueAtTime(resonanceVolume, startTime + 0.02);
        resonanceGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);
        
        resonance.connect(resonanceGain).connect(this.masterGain);
        resonance.start(startTime + 0.01);
        resonance.stop(startTime + 0.2);
        this.activeNodes.add(resonance);
        resonance.onended = () => this.activeNodes.delete(resonance);
        
        // Add stone scraping for dynamic footsteps
        if (this.params.footstepsIntensity > 2) {
            const scrapeStart = startTime + 0.03;
            const scrapeDuration = 0.08 + (this.params.footstepsIntensity * 0.04);
            
            const scrape = this.audioCtx.createBufferSource();
            const scrapeBuffer = this.createNoiseBuffer(scrapeDuration);
            scrape.buffer = scrapeBuffer;
            
            // Filter for scraping sound
            const scrapeFilter = this.audioCtx.createBiquadFilter();
            scrapeFilter.type = 'bandpass';
            scrapeFilter.frequency.value = 4000 + Math.random() * 3000;
            scrapeFilter.Q.value = 3;
            
            const scrapeGain = this.audioCtx.createGain();
            const scrapeVolume = 0.03 + (this.params.footstepsIntensity * 0.02);
            scrapeGain.gain.setValueAtTime(0, scrapeStart);
            scrapeGain.gain.linearRampToValueAtTime(scrapeVolume, scrapeStart + 0.01);
            scrapeGain.gain.exponentialRampToValueAtTime(0.001, scrapeStart + scrapeDuration);
            
            scrape.connect(scrapeFilter).connect(scrapeGain).connect(this.masterGain);
            scrape.start(scrapeStart);
            scrape.stop(scrapeStart + scrapeDuration);
            this.activeNodes.add(scrape);
            scrape.onended = () => this.activeNodes.delete(scrape);
        }
        
        // Add simple reverb effect based on intensity (simulating different environments)
        // Higher intensity steps in smaller spaces = more reverb
        if (this.params.footstepsIntensity > 1) {
            // Create a convolution reverb with an impulse response
            const reverbGain = this.audioCtx.createGain();
            reverbGain.gain.value = 0.1 + (this.params.footstepsIntensity * 0.05);
            
            // Short impulse response for enclosed space
            const impulseLength = 0.5; // seconds
            const impulseRate = this.audioCtx.sampleRate;
            const impulseBuffer = this.audioCtx.createBuffer(2, impulseRate * impulseLength, impulseRate);
            
            for (let channel = 0; channel < 2; channel++) {
                const channelData = impulseBuffer.getChannelData(channel);
                for (let i = 0; i < channelData.length; i++) {
                    // Exponential decay for the impulse response
                    channelData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (impulseRate * 0.1));
                }
            }
            
            const convolver = this.audioCtx.createConvolver();
            convolver.buffer = impulseBuffer;
            
            // Clone the impact sound for the reverb
            const reverbImpact = this.audioCtx.createOscillator();
            reverbImpact.type = 'sine';
            reverbImpact.frequency.value = 150 + Math.random() * 50;
            
            const reverbImpactGain = this.audioCtx.createGain();
            reverbImpactGain.gain.setValueAtTime(0, startTime);
            reverbImpactGain.gain.linearRampToValueAtTime(impactVolume * 0.3, startTime + 0.005);
            reverbImpactGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1);
            
            reverbImpact.connect(reverbImpactGain)
                        .connect(convolver)
                        .connect(reverbGain)
                        .connect(this.masterGain);
                        
            reverbImpact.start(startTime);
            reverbImpact.stop(startTime + 0.1);
            this.activeNodes.add(reverbImpact);
            reverbImpact.onended = () => this.activeNodes.delete(reverbImpact);
        }
    }

    createMetalStep(startTime) {
        // Initial impact
        const impact = this.audioCtx.createOscillator();
        impact.type = 'sine';
        impact.frequency.value = 200 + Math.random() * 100;
        
        const impactGain = this.audioCtx.createGain();
        const impactVolume = 0.2 + (this.params.footstepsIntensity * 0.1);
        impactGain.gain.setValueAtTime(0, startTime);
        impactGain.gain.linearRampToValueAtTime(impactVolume, startTime + 0.005);
        impactGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.08);
        
        impact.connect(impactGain).connect(this.masterGain);
        impact.start(startTime);
        impact.stop(startTime + 0.08);
        this.activeNodes.add(impact);
        impact.onended = () => this.activeNodes.delete(impact);
        
        // Create metallic ringing - multiple harmonics
        const harmonicCount = 6;
        const baseFreq = 400 + Math.random() * 200;
        const decayTime = 0.5 + Math.random() * 0.5; // Long decay for metal
        
        for (let i = 1; i <= harmonicCount; i++) {
            const harmonic = this.audioCtx.createOscillator();
            harmonic.type = 'sine';
            
            // Create inharmonic relationship for metallic sound
            const freqRatio = i * (1 + (Math.random() * 0.05 - 0.025));
            harmonic.frequency.value = baseFreq * freqRatio;
            
            const harmonicGain = this.audioCtx.createGain();
            // Higher harmonics are quieter
            const harmonicVolume = (0.15 / i) * (1 + this.params.footstepsIntensity * 0.1);
            
            harmonicGain.gain.setValueAtTime(0, startTime + 0.01);
            harmonicGain.gain.linearRampToValueAtTime(harmonicVolume, startTime + 0.02);
            
            // Longer decay for lower harmonics, shorter for higher
            const harmonicDecay = decayTime / (0.5 + i * 0.5);
            harmonicGain.gain.exponentialRampToValueAtTime(0.001, startTime + harmonicDecay);
            
            harmonic.connect(harmonicGain).connect(this.masterGain);
            harmonic.start(startTime + 0.01);
            harmonic.stop(startTime + harmonicDecay);
            this.activeNodes.add(harmonic);
            harmonic.onended = () => this.activeNodes.delete(harmonic);
        }
        
        // Add variation based on metal thickness/hollowness
        // Thinner metal = higher frequencies, more resonance
        // Simulate thickness (lower value = thinner metal)
        const thickness = 2; // Fixed for simplicity, could be parameterized
        
        // Add high-pass filtering for thin metal surfaces
        if (thickness < 3) {
            const thinMetalTime = startTime + 0.02;
            const thinMetalDuration = 0.2 + (Math.random() * 0.2);
            
            const thinRing = this.audioCtx.createOscillator();
            thinRing.type = 'triangle';
            thinRing.frequency.value = 2000 + (Math.random() * 1000);
            
            const highpass = this.audioCtx.createBiquadFilter();
            highpass.type = 'highpass';
            highpass.frequency.value = 1500;
            
            const thinGain = this.audioCtx.createGain();
            const thinVolume = 0.06 + (this.params.footstepsIntensity * 0.03);
            thinGain.gain.setValueAtTime(0, thinMetalTime);
            thinGain.gain.linearRampToValueAtTime(thinVolume, thinMetalTime + 0.01);
            thinGain.gain.exponentialRampToValueAtTime(0.001, thinMetalTime + thinMetalDuration);
            
            thinRing.connect(highpass).connect(thinGain).connect(this.masterGain);
            thinRing.start(thinMetalTime);
            thinRing.stop(thinMetalTime + thinMetalDuration);
            this.activeNodes.add(thinRing);
            thinRing.onended = () => this.activeNodes.delete(thinRing);
        }
        
        // Add clanging/rattling effects for loose metal surfaces
        // This is more noticeable at higher intensities
        if (this.params.footstepsIntensity > 2) {
            const rattleTime = startTime + 0.05;
            const rattleCount = Math.floor(2 + (this.params.footstepsIntensity * 1.5));
            
            for (let i = 0; i < rattleCount; i++) {
                const rattleDelay = (i * 0.03) + (Math.random() * 0.02);
                const rattleStart = rattleTime + rattleDelay;
                const rattleDuration = 0.05 + (Math.random() * 0.05);
                
                const rattle = this.audioCtx.createOscillator();
                rattle.type = 'sawtooth';
                rattle.frequency.value = 300 + (Math.random() * 400);
                
                const rattleGain = this.audioCtx.createGain();
                // Decreasing volume for successive rattles
                const rattleVolume = (0.1 - (i * 0.02)) * (this.params.footstepsIntensity / 4);
                rattleGain.gain.setValueAtTime(0, rattleStart);
                rattleGain.gain.linearRampToValueAtTime(rattleVolume, rattleStart + 0.005);
                rattleGain.gain.exponentialRampToValueAtTime(0.001, rattleStart + rattleDuration);
                
                rattle.connect(rattleGain).connect(this.masterGain);
                rattle.start(rattleStart);
                rattle.stop(rattleStart + rattleDuration);
                this.activeNodes.add(rattle);
                rattle.onended = () => this.activeNodes.delete(rattle);
            }
        }
    }

    // Helper to create a noise buffer
    createNoiseBuffer(duration = 1.0) {
        const sampleRate = this.audioCtx.sampleRate;
        const bufferSize = sampleRate * duration;
        const buffer = this.audioCtx.createBuffer(1, bufferSize, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        return buffer;
    }

    updateParams(newParams) {
        this.params = { ...this.params, ...newParams };
    }
}