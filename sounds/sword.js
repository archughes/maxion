export class SwordSound {
    constructor(audioCtx, masterGain, params) {
        this.audioCtx = audioCtx;
        this.masterGain = masterGain;
        this.params = {
            swordIntensity: params.swordIntensity || 0,
            swordMetalType: params.swordMetalType || 0,
            swordActionType: params.swordActionType || 'swing',
        };
        this.activeNodes = new Set();
        this.continuousSound = null;
    }

    start() {
        // For continuous sword sounds like dragging or grinding
        if (this.params.swordActionType === 'grind') {
            this.continuousSound = this.createGrindingSound();
            this.continuousSound.start();
        }
    }

    stop() {
        // Stop any continuous sounds
        if (this.continuousSound) {
            this.continuousSound.stop();
            this.continuousSound = null;
        }
        
        // Clean up any remaining nodes
        this.activeNodes.forEach(node => {
            if (node.stop) node.stop();
        });
        this.activeNodes.clear();
    }

    playBurst() {
        const currentTime = this.audioCtx.currentTime;
        
        switch(this.params.swordActionType) {
            case 'swing':
                this.createSwingSound(currentTime);
                break;
            case 'clash':
                this.createClashSound(currentTime);
                break;
            case 'stab':
                this.createStabSound(currentTime);
                break;
            case 'block':
                this.createBlockSound(currentTime);
                break;
            default:
                this.createSwingSound(currentTime);
        }
    }
    
    createSwingSound(startTime) {
        // Base parameters based on intensity
        const duration = 0.2 + (this.params.swordIntensity * 0.05);
        const whooshGain = 0.2 + (this.params.swordIntensity * 0.15);
        
        // Create noise source for whoosh
        const noise = this.audioCtx.createBufferSource();
        const noiseBuffer = this.createNoiseBuffer(1);
        noise.buffer = noiseBuffer;
        
        // Create bandpass filter for whoosh effect
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(300, startTime);
        filter.frequency.exponentialRampToValueAtTime(2000, startTime + duration * 0.5);
        filter.frequency.exponentialRampToValueAtTime(500, startTime + duration);
        filter.Q.value = 1;
        
        // Create gain node for envelope
        const gainNode = this.audioCtx.createGain();
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(whooshGain, startTime + duration * 0.3);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
        
        // Connect nodes
        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        // Start and stop the sound
        noise.start(startTime);
        noise.stop(startTime + duration);
        
        this.activeNodes.add(noise);
        noise.onended = () => this.activeNodes.delete(noise);
        
        return { duration }; // Return duration so we can chain sounds if needed
    }
    
    createClashSound(startTime) {
        // First create the swing sound
        const swingResult = this.createSwingSound(startTime);
        const hitTime = startTime + swingResult.duration * 0.8;
        
        // Base parameters based on intensity and metal type
        const metalResonance = 0.3 + (this.params.swordMetalType * 0.15);
        const metalBrightness = 1000 + (this.params.swordMetalType * 500);
        const hitVolume = 0.25 + (this.params.swordIntensity * 0.15);
        
        // Create noise burst for initial hit
        const hitNoise = this.audioCtx.createBufferSource();
        hitNoise.buffer = this.createNoiseBuffer(0.1);
        
        const hitFilter = this.audioCtx.createBiquadFilter();
        hitFilter.type = 'highpass';
        hitFilter.frequency.value = 2000;
        
        const hitGain = this.audioCtx.createGain();
        hitGain.gain.setValueAtTime(0, hitTime);
        hitGain.gain.linearRampToValueAtTime(hitVolume, hitTime + 0.01);
        hitGain.gain.exponentialRampToValueAtTime(0.001, hitTime + 0.1);
        
        // Create metallic resonance (multiple oscillators)
        const numResonators = 3 + Math.floor(this.params.swordMetalType * 2);
        
        for (let i = 0; i < numResonators; i++) {
            const resonator = this.audioCtx.createOscillator();
            const baseFreq = metalBrightness * (1 + 0.05 * i);
            resonator.frequency.value = baseFreq;
            resonator.type = 'sine';
            
            const resonatorGain = this.audioCtx.createGain();
            resonatorGain.gain.setValueAtTime(0, hitTime);
            resonatorGain.gain.linearRampToValueAtTime(metalResonance * (0.5 - i * 0.1), hitTime + 0.01);
            resonatorGain.gain.exponentialRampToValueAtTime(0.001, hitTime + 0.2 + (0.2 * i * (this.params.swordMetalType / 4)));
            
            resonator.connect(resonatorGain);
            resonatorGain.connect(this.masterGain);
            resonator.start(hitTime);
            resonator.stop(hitTime + 0.5);
            
            this.activeNodes.add(resonator);
            resonator.onended = () => this.activeNodes.delete(resonator);
        }
        
        // Connect hit noise
        hitNoise.connect(hitFilter);
        hitFilter.connect(hitGain);
        hitGain.connect(this.masterGain);
        
        hitNoise.start(hitTime);
        hitNoise.stop(hitTime + 0.1);
        
        this.activeNodes.add(hitNoise);
        hitNoise.onended = () => this.activeNodes.delete(hitNoise);
    }
    
    createStabSound(startTime) {
        // Quick whoosh followed by impact
        const duration = 0.15 + (this.params.swordIntensity * 0.05);
        const whooshGain = 0.15 + (this.params.swordIntensity * 0.1);
        
        // Create noise source for whoosh
        const noise = this.audioCtx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(1);
        
        // Create bandpass filter for whoosh effect - higher frequency for stab
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, startTime);
        filter.frequency.exponentialRampToValueAtTime(3000, startTime + duration);
        filter.Q.value = 2;
        
        // Create gain node for envelope
        const gainNode = this.audioCtx.createGain();
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(whooshGain, startTime + duration * 0.5);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
        
        // Connect whoosh nodes
        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        // Start and stop the whoosh
        noise.start(startTime);
        noise.stop(startTime + duration);
        
        this.activeNodes.add(noise);
        noise.onended = () => this.activeNodes.delete(noise);
        
        // Add impact sound at the end
        const impactTime = startTime + duration * 0.9;
        
        // Stab impact has a sharper, higher-pitched sound with less resonance
        const impactGain = 0.25 + (this.params.swordIntensity * 0.15);
        const metalSharpness = 3000 + (this.params.swordMetalType * 500);
        
        // Create impact noise
        const impactNoise = this.audioCtx.createBufferSource();
        impactNoise.buffer = this.createNoiseBuffer(0.1);
        
        // Higher frequencies for the stab impact
        const impactFilter = this.audioCtx.createBiquadFilter();
        impactFilter.type = 'bandpass';
        impactFilter.frequency.value = metalSharpness;
        impactFilter.Q.value = 2 + this.params.swordMetalType * 0.5;
        
        const impactGainNode = this.audioCtx.createGain();
        impactGainNode.gain.setValueAtTime(0, impactTime);
        impactGainNode.gain.linearRampToValueAtTime(impactGain, impactTime + 0.01);
        impactGainNode.gain.exponentialRampToValueAtTime(0.001, impactTime + 0.08);
        
        // Connect impact nodes
        impactNoise.connect(impactFilter);
        impactFilter.connect(impactGainNode);
        impactGainNode.connect(this.masterGain);
        
        impactNoise.start(impactTime);
        impactNoise.stop(impactTime + 0.1);
        
        this.activeNodes.add(impactNoise);
        impactNoise.onended = () => this.activeNodes.delete(impactNoise);
        
        // Add a brief high-frequency "cut" sound 
        if (this.params.swordMetalType > 1) {
            const cutSound = this.audioCtx.createOscillator();
            cutSound.type = 'sawtooth';
            cutSound.frequency.value = 4000 + (this.params.swordMetalType * 1000);
            
            const cutFilter = this.audioCtx.createBiquadFilter();
            cutFilter.type = 'highpass';
            cutFilter.frequency.value = 3000;
            
            const cutGain = this.audioCtx.createGain();
            cutGain.gain.setValueAtTime(0, impactTime);
            cutGain.gain.linearRampToValueAtTime(0.05 + (this.params.swordIntensity * 0.03), impactTime + 0.005);
            cutGain.gain.exponentialRampToValueAtTime(0.001, impactTime + 0.05);
            
            cutSound.connect(cutFilter);
            cutFilter.connect(cutGain);
            cutGain.connect(this.masterGain);
            
            cutSound.start(impactTime);
            cutSound.stop(impactTime + 0.05);
            
            this.activeNodes.add(cutSound);
            cutSound.onended = () => this.activeNodes.delete(cutSound);
        }
    }
    
    createBlockSound(startTime) {
        // Create a dull clash sound with less resonance
        const swingResult = this.createSwingSound(startTime);
        const hitTime = startTime + swingResult.duration * 0.8;
        
        // Base parameters - less resonant for blocking
        const dampening = 4 - this.params.swordMetalType; // Inverse of metal type
        const resonanceTime = 0.1 + (this.params.swordMetalType * 0.05);
        const hitVolume = 0.3 + (this.params.swordIntensity * 0.1);
        
        // Create noise burst for initial hit
        const hitNoise = this.audioCtx.createBufferSource();
        hitNoise.buffer = this.createNoiseBuffer(0.1);
        
        // More muffled frequency for block
        const hitFilter = this.audioCtx.createBiquadFilter();
        hitFilter.type = 'lowpass';
        hitFilter.frequency.value = 1000 + (this.params.swordMetalType * 300);
        
        const hitGain = this.audioCtx.createGain();
        hitGain.gain.setValueAtTime(0, hitTime);
        hitGain.gain.linearRampToValueAtTime(hitVolume, hitTime + 0.01);
        hitGain.gain.exponentialRampToValueAtTime(0.001, hitTime + 0.1);
        
        // Connect hit noise
        hitNoise.connect(hitFilter);
        hitFilter.connect(hitGain);
        hitGain.connect(this.masterGain);
        
        hitNoise.start(hitTime);
        hitNoise.stop(hitTime + 0.1);
        
        this.activeNodes.add(hitNoise);
        hitNoise.onended = () => this.activeNodes.delete(hitNoise);
        
        // Add body impact/vibration for block feeling - using a low-frequency oscillator
        const vibration = this.audioCtx.createOscillator();
        vibration.type = 'sine';
        vibration.frequency.value = 60 + (this.params.swordIntensity * 20); // 60-140Hz
        
        const vibrationGain = this.audioCtx.createGain();
        vibrationGain.gain.setValueAtTime(0, hitTime);
        vibrationGain.gain.linearRampToValueAtTime(0.2 + (this.params.swordIntensity * 0.1), hitTime + 0.01);
        vibrationGain.gain.exponentialRampToValueAtTime(0.001, hitTime + 0.15 + (this.params.swordIntensity * 0.05));
        
        vibration.connect(vibrationGain);
        vibrationGain.connect(this.masterGain);
        
        vibration.start(hitTime);
        vibration.stop(hitTime + 0.2 + (this.params.swordIntensity * 0.05));
        
        this.activeNodes.add(vibration);
        vibration.onended = () => this.activeNodes.delete(vibration);
        
        // Add a dull thud sound for the physical impact of the block
        const thud = this.audioCtx.createBufferSource();
        thud.buffer = this.createNoiseBuffer(0.2);
        
        const thudFilter = this.audioCtx.createBiquadFilter();
        thudFilter.type = 'lowpass';
        thudFilter.frequency.value = 300 + (this.params.swordIntensity * 100);
        thudFilter.Q.value = 1;
        
        const thudGain = this.audioCtx.createGain();
        thudGain.gain.setValueAtTime(0, hitTime);
        thudGain.gain.linearRampToValueAtTime(0.15 + (this.params.swordIntensity * 0.1), hitTime + 0.02);
        thudGain.gain.exponentialRampToValueAtTime(0.001, hitTime + 0.15);
        
        thud.connect(thudFilter);
        thudFilter.connect(thudGain);
        thudGain.connect(this.masterGain);
        
        thud.start(hitTime);
        thud.stop(hitTime + 0.15);
        
        this.activeNodes.add(thud);
        thud.onended = () => this.activeNodes.delete(thud);
        
        // Add a short metal impact with very limited resonance
        if (this.params.swordMetalType > 0) {
            const metalImpact = this.audioCtx.createOscillator();
            metalImpact.type = 'triangle';
            metalImpact.frequency.value = 800 + (this.params.swordMetalType * 200);
            
            const metalGain = this.audioCtx.createGain();
            metalGain.gain.setValueAtTime(0, hitTime);
            metalGain.gain.linearRampToValueAtTime(0.1 + (this.params.swordMetalType * 0.05), hitTime + 0.01);
            metalGain.gain.exponentialRampToValueAtTime(0.001, hitTime + 0.05 + (this.params.swordMetalType * 0.02));
            
            metalImpact.connect(metalGain);
            metalGain.connect(this.masterGain);
            
            metalImpact.start(hitTime);
            metalImpact.stop(hitTime + 0.1);
            
            this.activeNodes.add(metalImpact);
            metalImpact.onended = () => this.activeNodes.delete(metalImpact);
        }
    }
    
    createGrindingSound() {
        // Create a continuous grinding/scraping metal sound
        // This returns an object with start/stop methods
        
        const noiseBufferDuration = 0.5; // 500ms noise buffer
        const metalIntensity = 0.05 + (this.params.swordIntensity * 0.03);
        const metalBrightness = 2000 + (this.params.swordMetalType * 1000);
        const grindRate = 5 + (this.params.swordIntensity * 5); // 5-25Hz modulation
        
        // Create a noise generator for the basic scraping sound
        let noiseNode = null;
        let noiseGain = null;
        let metalFilter = null;
        let lfo = null;
        let resonator1 = null;
        let resonator2 = null;
        let resonatorGain1 = null;
        let resonatorGain2 = null;
        
        // We'll return this object with control methods
        const grindingSound = {
            start: () => {
                const currentTime = this.audioCtx.currentTime;
                
                // Create and configure noise source
                noiseNode = this.audioCtx.createBufferSource();
                noiseNode.buffer = this.createNoiseBuffer(noiseBufferDuration);
                noiseNode.loop = true;
                
                // Create filter for the scraping sound
                metalFilter = this.audioCtx.createBiquadFilter();
                metalFilter.type = 'bandpass';
                metalFilter.frequency.value = metalBrightness;
                metalFilter.Q.value = 0.5 + (this.params.swordMetalType * 0.3);
                
                // Create gain node for the noise
                noiseGain = this.audioCtx.createGain();
                noiseGain.gain.value = metalIntensity;
                
                // LFO for filter modulation to create scraping effect
                lfo = this.audioCtx.createOscillator();
                lfo.type = 'sawtooth';
                lfo.frequency.value = grindRate;
                
                const lfoGain = this.audioCtx.createGain();
                lfoGain.gain.value = metalBrightness * 0.3;
                
                // Connect LFO to filter frequency
                lfo.connect(lfoGain);
                lfoGain.connect(metalFilter.frequency);
                
                // Create resonators for metallic qualities
                if (this.params.swordMetalType > 0) {
                    // First resonator
                    resonator1 = this.audioCtx.createOscillator();
                    resonator1.type = 'triangle';
                    resonator1.frequency.value = metalBrightness * 1.5;
                    
                    resonatorGain1 = this.audioCtx.createGain();
                    resonatorGain1.gain.value = 0.02 + (this.params.swordMetalType * 0.01);
                    
                    const resonatorFilterMod = this.audioCtx.createGain();
                    resonatorFilterMod.gain.value = 200 + (this.params.swordMetalType * 100);
                    
                    // Modulate resonator slightly with the same LFO
                    lfo.connect(resonatorFilterMod);
                    resonatorFilterMod.connect(resonator1.frequency);
                    
                    // Second resonator (higher pitch)
                    resonator2 = this.audioCtx.createOscillator();
                    resonator2.type = 'triangle';
                    resonator2.frequency.value = metalBrightness * 2.2;
                    
                    resonatorGain2 = this.audioCtx.createGain();
                    resonatorGain2.gain.value = 0.01 + (this.params.swordMetalType * 0.008);
                    
                    // Connect resonators
                    resonator1.connect(resonatorGain1);
                    resonatorGain1.connect(this.masterGain);
                    resonator2.connect(resonatorGain2);
                    resonatorGain2.connect(this.masterGain);
                    
                    // Start resonators
                    resonator1.start(currentTime);
                    resonator2.start(currentTime);
                    
                    // Add to active nodes for cleanup
                    this.activeNodes.add(resonator1);
                    this.activeNodes.add(resonator2);
                }
                
                // Connect noise through filter and gain to output
                noiseNode.connect(metalFilter);
                metalFilter.connect(noiseGain);
                noiseGain.connect(this.masterGain);
                
                // Start noise and LFO
                noiseNode.start(currentTime);
                lfo.start(currentTime);
                
                // Add to active nodes for cleanup
                this.activeNodes.add(noiseNode);
                this.activeNodes.add(lfo);
                
                // Add random grinding bursts
                this.scheduleGrindingBursts();
            },
            
            stop: () => {
                const currentTime = this.audioCtx.currentTime;
                const fadeOutTime = 0.1;
                
                // Fade out noise
                if (noiseGain) {
                    noiseGain.gain.setValueAtTime(noiseGain.gain.value, currentTime);
                    noiseGain.gain.exponentialRampToValueAtTime(0.001, currentTime + fadeOutTime);
                }
                
                // Fade out resonators
                if (resonatorGain1) {
                    resonatorGain1.gain.setValueAtTime(resonatorGain1.gain.value, currentTime);
                    resonatorGain1.gain.exponentialRampToValueAtTime(0.001, currentTime + fadeOutTime);
                }
                
                if (resonatorGain2) {
                    resonatorGain2.gain.setValueAtTime(resonatorGain2.gain.value, currentTime);
                    resonatorGain2.gain.exponentialRampToValueAtTime(0.001, currentTime + fadeOutTime);
                }
                
                // Schedule stop after fade out
                setTimeout(() => {
                    if (noiseNode) noiseNode.stop();
                    if (lfo) lfo.stop();
                    if (resonator1) resonator1.stop();
                    if (resonator2) resonator2.stop();
                    
                    // Clear burst timeouts
                    if (this.burstTimeouts) {
                        this.burstTimeouts.forEach(timeout => clearTimeout(timeout));
                        this.burstTimeouts = [];
                    }
                }, fadeOutTime * 1000);
            }
        };
        
        return grindingSound;
    }
    
    scheduleGrindingBursts() {
        // Add random grinding burst accents to continuous grinding sound
        this.burstTimeouts = [];
        const burstInterval = 500 + Math.random() * 1000; // 0.5-1.5 seconds between bursts
        
        const createBurst = () => {
            const currentTime = this.audioCtx.currentTime;
            const burstIntensity = 0.15 + (this.params.swordIntensity * 0.1);
            
            // Create a short, intense noise burst
            const burstNoise = this.audioCtx.createBufferSource();
            burstNoise.buffer = this.createNoiseBuffer(0.1);
            
            const burstFilter = this.audioCtx.createBiquadFilter();
            burstFilter.type = 'bandpass';
            burstFilter.frequency.value = 3000 + (this.params.swordMetalType * 1000) + (Math.random() * 1000);
            burstFilter.Q.value = 1 + Math.random();
            
            const burstGain = this.audioCtx.createGain();
            burstGain.gain.setValueAtTime(0, currentTime);
            burstGain.gain.linearRampToValueAtTime(burstIntensity, currentTime + 0.01);
            burstGain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.1);
            
            burstNoise.connect(burstFilter);
            burstFilter.connect(burstGain);
            burstGain.connect(this.masterGain);
            
            burstNoise.start(currentTime);
            burstNoise.stop(currentTime + 0.1);
            
            this.activeNodes.add(burstNoise);
            burstNoise.onended = () => this.activeNodes.delete(burstNoise);
            
            // Schedule next burst if grinding is still active
            if (this.params.swordActionType === 'grind' && this.continuousSound) {
                const timeout = setTimeout(createBurst, burstInterval);
                this.burstTimeouts.push(timeout);
            }
        };
        
        // Start the first burst
        const initialDelay = Math.random() * 500; // First burst after 0-500ms
        const initialTimeout = setTimeout(createBurst, initialDelay);
        this.burstTimeouts = [initialTimeout];
    }
    
    updateParams(newParams) {
        const previousActionType = this.params.swordActionType;
        this.params = { ...this.params, ...newParams };
        
        // If action type changed to or from 'grind', handle continuous sound changes
        if (previousActionType !== this.params.swordActionType) {
            if (this.continuousSound) {
                this.stop();
            }
            
            if (this.params.swordActionType === 'grind') {
                this.start();
            }
        }
    }
    
    // Utility function to create noise buffer
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