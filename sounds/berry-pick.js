import { SoundGenerator } from './SoundGenerator.js';

export class BerryPickSound extends SoundGenerator {
    /**
     * Constructor for BerryPickSound
     * @param {AudioContext} audioCtx - The Web Audio API AudioContext
     * @param {GainNode} masterGain - The master gain node to connect sounds to
     * @param {Object} params - Configuration parameters for berry picking sounds
     */
    constructor(audioCtx, masterGain, params = {}) {
        // Call parent constructor with required parameters
        super(audioCtx, masterGain, {
            // Default parameters with more descriptive plant types
            berryType: params.berryType || 'bush',  // 'bush', 'tree', 'vine', 'cactus', 'shrub'
            berryRipeness: params.berryRipeness || 2,  // 0-4: unripe/hard to overripe/soft
            berryQuantity: params.berryQuantity || 2   // 0-4: single to handful
        });
    }

    /**
     * Starts continuous berry picking sounds
     */
    start() {
        if (this.params.berryQuantity <= 0 || this.timeout) return;
        
        const schedulePickingSound = () => {
            // Picking interval depends on quantity (more berries = more frequent picking)
            const pickingInterval = 2.0 - this.params.berryQuantity * 0.3; // 0.8-2.0s
            const nextPickTime = pickingInterval * (0.8 + Math.random() * 0.4);
            
            this.playBurst();
            this.timeout = setTimeout(schedulePickingSound, nextPickTime * 1000);
        };
        
        schedulePickingSound();
    }

    /**
     * Plays a single burst of berry picking sounds
     */
    playBurst() {
        const currentTime = this.audioCtx.currentTime;
        
        // Generate the appropriate picking sound based on plant type
        this._createPickingSound(currentTime);
        
        // The quantity parameter determines how many berries are picked at once
        const numBerries = 1 + Math.floor(this.params.berryQuantity * 2);
        
        let maxDuration = 0.3; // Track the longest sound duration for timeout
        
        for (let i = 0; i < numBerries; i++) {
            // Stagger the berry sounds slightly
            const berryTime = currentTime + 0.05 + Math.random() * 0.1;
            
            // Create the rustling leaves sound
            if (i === 0 || Math.random() > 0.7) {
                this._createLeafRustleSound(berryTime - 0.02);
            }
            
            // Create the "pluck" sound as berry detaches
            this._createPluckSound(berryTime);
            
            // Create the soft thud as berry lands in hand/container
            const landTime = berryTime + 0.1 + Math.random() * 0.1;
            this._createLandingSound(landTime);
            
            // Update max duration to ensure all sounds complete
            maxDuration = Math.max(maxDuration, landTime + 0.3); 
        }

        console.log(this.params)
        
        // Set a timeout to clean up after the burst completes
        if (this.timeout === null) {  // Only set if not in continuous mode
            this.timeout = setTimeout(() => {
                this.stop();
                this.timeout = null;
            }, (maxDuration * 1000));
        }
    }
    
    /**
     * Creates the appropriate picking sound based on plant type
     * @param {number} startTime - The audio context time to start the sound
     */
    _createPickingSound(startTime) {
        switch(this.params.berryType) {
            case 'cactus':
                this._createSlicingSound(startTime);
                break;
            case 'tree':
                this._createTwistingSound(startTime);
                break;
            case 'vine':
                this._createPullingSound(startTime);
                break;
            case 'shrub':
                this._createSnapSound(startTime, true); // Woody snap
                break;
            case 'bush':
            default:
                this._createSnapSound(startTime, false); // Regular snap
                break;
        }
    }
    
    /**
     * Creates a slicing sound (for cactus fruits)
     * @param {number} startTime - The audio context time to start the sound
     */
    _createSlicingSound(startTime) {
        // Sharp slicing sound for cactus fruit
        const sliceDuration = 0.07;
        
        // Noise component for the slice
        const noiseBuffer = this.createNoiseBuffer(sliceDuration);
        const noise = this.audioCtx.createBufferSource();
        noise.buffer = noiseBuffer;
        
        // Filter the noise to sound like a cutting motion
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 2500;
        filter.Q.value = 3;
        
        // Envelope for the slice
        const sliceGain = this.audioCtx.createGain();
        sliceGain.gain.setValueAtTime(0, startTime);
        sliceGain.gain.linearRampToValueAtTime(0.1, startTime + 0.001);
        sliceGain.gain.exponentialRampToValueAtTime(0.001, startTime + sliceDuration);
        
        noise.connect(filter).connect(sliceGain).connect(this.masterGain);
        noise.start(startTime);
        noise.stop(startTime + sliceDuration);
        this.addActiveNode(noise);
    }
    
    /**
     * Creates a twisting sound (for tree fruits like apples)
     * @param {number} startTime - The audio context time to start the sound
     */
    _createTwistingSound(startTime) {
        // Twisting sound for apple-like fruits
        const twistDuration = 0.15;
        
        // Creaking oscillator for the twist
        const twist = this.audioCtx.createOscillator();
        twist.type = 'sawtooth';
        twist.frequency.setValueAtTime(400, startTime);
        twist.frequency.linearRampToValueAtTime(300, startTime + twistDuration);
        
        // Filter to shape the sound
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        filter.Q.value = 1;
        
        // Modulation for creaking effect
        const modulator = this.audioCtx.createOscillator();
        modulator.frequency.value = 15;
        const modulatorGain = this.audioCtx.createGain();
        modulatorGain.gain.value = 30; // Amount of modulation
        
        modulator.connect(modulatorGain);
        modulatorGain.connect(twist.frequency);
        
        // Envelope for the twist
        const twistGain = this.audioCtx.createGain();
        twistGain.gain.setValueAtTime(0, startTime);
        twistGain.gain.linearRampToValueAtTime(0.07, startTime + 0.02);
        twistGain.gain.linearRampToValueAtTime(0.04, startTime + twistDuration * 0.7);
        twistGain.gain.exponentialRampToValueAtTime(0.001, startTime + twistDuration);
        
        twist.connect(filter).connect(twistGain).connect(this.masterGain);
        modulator.start(startTime);
        twist.start(startTime);
        twist.stop(startTime + twistDuration);
        modulator.stop(startTime + twistDuration);
        
        this.addActiveNode(twist);
        this.addActiveNode(modulator);
    }
    
    /**
     * Creates a pulling sound (for vine fruits)
     * @param {number} startTime - The audio context time to start the sound
     */
    _createPullingSound(startTime) {
        // Stretching/pulling sound for vine fruits
        const pullDuration = 0.2;
        
        // Noise for the stretching vine
        const noiseBuffer = this.createNoiseBuffer(pullDuration);
        const noise = this.audioCtx.createBufferSource();
        noise.buffer = noiseBuffer;
        
        // Filter for stretching sound
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(600, startTime);
        filter.frequency.linearRampToValueAtTime(1500, startTime + pullDuration * 0.8);
        filter.Q.value = 2;
        
        // Envelope for pulling
        const pullGain = this.audioCtx.createGain();
        pullGain.gain.setValueAtTime(0, startTime);
        pullGain.gain.linearRampToValueAtTime(0.04, startTime + pullDuration * 0.7);
        pullGain.gain.exponentialRampToValueAtTime(0.001, startTime + pullDuration);
        
        noise.connect(filter).connect(pullGain).connect(this.masterGain);
        noise.start(startTime);
        noise.stop(startTime + pullDuration);
        this.addActiveNode(noise);
        
        // Add snap at the end of the pull
        this._createSnapSound(startTime + pullDuration * 0.8, false);
    }
    
    /**
     * Creates a stem snap sound
     * @param {number} startTime - The audio context time to start the sound
     * @param {boolean} isWoody - Whether the snap should sound woody (true) or green (false)
     */
    _createSnapSound(startTime, isWoody) {
        // The sound of the stem or twig breaking
        
        // Characteristics depend on ripeness and plant type
        const snapDuration = 0.05 - this.params.berryRipeness * 0.005;
        
        // Noise for the snap/crack
        const noiseBuffer = this.createNoiseBuffer(snapDuration);
        const noise = this.audioCtx.createBufferSource();
        noise.buffer = noiseBuffer;
        
        // Filter the noise to sound like breaking plant matter
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        
        // Woody plants snap at lower frequencies
        if (isWoody) {
            filter.frequency.value = 1500 + this.params.berryRipeness * 300;
            filter.Q.value = 3;
        } else {
            filter.frequency.value = 2000 + this.params.berryRipeness * 500;
            filter.Q.value = 2;
        }
        
        // Envelope for the snap
        const snapGain = this.audioCtx.createGain();
        snapGain.gain.setValueAtTime(0, startTime);
        snapGain.gain.linearRampToValueAtTime(0.1 - this.params.berryRipeness * 0.015, startTime + 0.002);
        snapGain.gain.exponentialRampToValueAtTime(0.001, startTime + snapDuration);
        
        noise.connect(filter).connect(snapGain).connect(this.masterGain);
        noise.start(startTime);
        noise.stop(startTime + snapDuration);
        this.addActiveNode(noise);
    }
    
    _createLeafRustleSound(startTime) {
        const berryType = this.params.berryType || 'bush';
        let rustleDuration, filterFreq, peakGain;
    
        switch (berryType) {
            case 'tree':
                rustleDuration = 0.15 + Math.random() * 0.1;
                filterFreq = 1500;
                peakGain = 0.06;
                break;
            case 'vine':
                rustleDuration = 0.08 + Math.random() * 0.05;
                filterFreq = 2500;
                peakGain = 0.03;
                break;
            case 'cactus':
                rustleDuration = 0.05 + Math.random() * 0.03;
                filterFreq = 3000;
                peakGain = 0.02;
                break;
            case 'shrub':
                rustleDuration = 0.12 + Math.random() * 0.08;
                filterFreq = 1800;
                peakGain = 0.045;
                break;
            default: // 'bush'
                rustleDuration = 0.1 + Math.random() * 0.1;
                filterFreq = 2000;
                peakGain = 0.05;
                break;
        }
    
        // Create filtered noise for rustling
        const noiseBuffer = this.createNoiseBuffer(rustleDuration);
        const noise = this.audioCtx.createBufferSource();
        noise.buffer = noiseBuffer;
    
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = filterFreq;
    
        const rustleGain = this.audioCtx.createGain();
        rustleGain.gain.setValueAtTime(0, startTime);
        rustleGain.gain.linearRampToValueAtTime(peakGain * 0.6, startTime + 0.03);
        rustleGain.gain.linearRampToValueAtTime(peakGain, startTime + rustleDuration * 0.5);
        rustleGain.gain.exponentialRampToValueAtTime(0.001, startTime + rustleDuration);
    
        noise.connect(filter).connect(rustleGain).connect(this.masterGain);
        noise.start(startTime);
        noise.stop(startTime + rustleDuration);
        this.addActiveNode(noise);
    }    
    
    _createPluckSound(startTime) {
        // Higher pitched "pluck" as berry separates from stem
        const pluck = this.audioCtx.createOscillator();
        pluck.type = 'triangle';
        
        // Frequency based on plant type and ripeness
        let baseFreq;
        
        switch(this.params.berryType) {
            case 'cactus':
                baseFreq = 800; // Higher pitched for fibrous cactus
                break;
            case 'tree':
                baseFreq = 600; // Medium for tree fruits
                break;
            case 'vine':
                baseFreq = 700; // Medium-high for vine fruits
                break;
            case 'shrub':
                baseFreq = 500; // Lower for shrub berries
                break;
            case 'bush':
            default:
                baseFreq = 650; // Default tone
                break;
        }
        
        // Adjust for ripeness - riper fruits have lower pitch
        baseFreq = baseFreq - (this.params.berryRipeness * 50);
        
        pluck.frequency.setValueAtTime(baseFreq * 1.5, startTime);
        pluck.frequency.exponentialRampToValueAtTime(baseFreq, startTime + 0.02);
        
        // Pluck envelope - very short attack and decay
        const pluckGain = this.audioCtx.createGain();
        pluckGain.gain.setValueAtTime(0, startTime);
        pluckGain.gain.linearRampToValueAtTime(0.05, startTime + 0.005);
        pluckGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.03);
        
        pluck.connect(pluckGain).connect(this.masterGain);
        pluck.start(startTime);
        pluck.stop(startTime + 0.03);
        this.addActiveNode(pluck);
    }
    
    _createLandingSound(startTime) {
        // Soft thud as berry lands in hand or container
        
        // The character of the sound depends on berry type and ripeness
        const isJuicy = this.params.berryType !== 'cactus' && this.params.berryRipeness > 2;
        
        if (isJuicy) {
            // Juicy berries make a slightly "squish" sound when they land
            this._createSquishSound(startTime);
        } else {
            // Firmer berries make more of a "thud" sound
            this._createThudSound(startTime);
        }
    }
    
    _createThudSound(startTime) {
        // Dull thud for firm berries
        const thud = this.audioCtx.createOscillator();
        thud.type = 'sine';
        
        // Frequency based on berry type and ripeness
        let baseFreq;
        
        switch(this.params.berryType) {
            case 'cactus':
                baseFreq = 150; // Firm, dense sound
                break;
            case 'tree':
                baseFreq = 180; // Solid apple-like thud
                break;
            case 'vine':
                baseFreq = 200; // Lighter thud
                break;
            case 'shrub':
            case 'bush':
            default:
                baseFreq = 170; // Default tone
                break;
        }
        
        // Adjust for ripeness - riper fruits have lower pitch
        baseFreq = baseFreq - (this.params.berryRipeness * 15);
        
        thud.frequency.value = baseFreq;
        
        // Thud envelope
        const thudGain = this.audioCtx.createGain();
        thudGain.gain.setValueAtTime(0, startTime);
        thudGain.gain.linearRampToValueAtTime(0.07, startTime + 0.01);
        thudGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1);
        
        thud.connect(thudGain).connect(this.masterGain);
        thud.start(startTime);
        thud.stop(startTime + 0.1);
        this.addActiveNode(thud);
    }
    
    _createSquishSound(startTime) {
        // Squish for juicy/soft berries
        const squishDuration = 0.08 + this.params.berryRipeness * 0.02;
        
        // Noise component for squishing sound
        const noiseBuffer = this.createNoiseBuffer(squishDuration);
        const noise = this.audioCtx.createBufferSource();
        noise.buffer = noiseBuffer;
        
        // Bandpass filter for "wet" sound
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 500 + this.params.berryRipeness * 100;
        filter.Q.value = 0.5;
        
        // Squish envelope
        const squishGain = this.audioCtx.createGain();
        squishGain.gain.setValueAtTime(0, startTime);
        squishGain.gain.linearRampToValueAtTime(0.05 + this.params.berryRipeness * 0.01, startTime + 0.02);
        squishGain.gain.exponentialRampToValueAtTime(0.001, startTime + squishDuration);
        
        noise.connect(filter).connect(squishGain).connect(this.masterGain);
        noise.start(startTime);
        noise.stop(startTime + squishDuration);
        this.addActiveNode(noise);
        
        // Additional juicy sounds for very ripe berries
        if (this.params.berryRipeness > 3) {
            this._createJuicyDripSound(startTime + 0.05);
        }
    }
    
    _createJuicyDripSound(startTime) {
        // For very ripe berries, add dripping/splashing sounds
        const dripCount = Math.floor(Math.random() * 3) + 1; // 1-3 drips
        
        for (let i = 0; i < dripCount; i++) {
            const dripTime = startTime + i * (0.1 + Math.random() * 0.15);
            
            // Drip sound - frequency sweep
            const drip = this.audioCtx.createOscillator();
            drip.type = 'sine';
            
            // Drip has a downward frequency sweep
            const startFreq = 900 + Math.random() * 300;
            const endFreq = 300 + Math.random() * 200;
            const dripDuration = 0.06 + Math.random() * 0.05;
            
            drip.frequency.setValueAtTime(startFreq, dripTime);
            drip.frequency.exponentialRampToValueAtTime(endFreq, dripTime + dripDuration);
            
            // Drip envelope
            const dripGain = this.audioCtx.createGain();
            dripGain.gain.setValueAtTime(0, dripTime);
            dripGain.gain.linearRampToValueAtTime(0.02 + this.params.berryRipeness * 0.01, dripTime + 0.01);
            dripGain.gain.exponentialRampToValueAtTime(0.001, dripTime + dripDuration);
            
            drip.connect(dripGain).connect(this.masterGain);
            drip.start(dripTime);
            drip.stop(dripTime + dripDuration);
            this.addActiveNode(drip);
            
            // Small splat sound after drip
            if (Math.random() > 0.5) {
                const splatTime = dripTime + dripDuration - 0.01;
                const splatDuration = 0.04;
                
                // Noise for splat
                const splatNoiseBuffer = this.createNoiseBuffer(splatDuration);
                const splatNoise = this.audioCtx.createBufferSource();
                splatNoise.buffer = splatNoiseBuffer;
                
                // Filter for splat sound
                const splatFilter = this.audioCtx.createBiquadFilter();
                splatFilter.type = 'lowpass';
                splatFilter.frequency.value = 2000;
                splatFilter.Q.value = 1;
                
                // Splat envelope
                const splatGain = this.audioCtx.createGain();
                splatGain.gain.setValueAtTime(0, splatTime);
                splatGain.gain.linearRampToValueAtTime(0.01 + this.params.berryRipeness * 0.005, splatTime + 0.01);
                splatGain.gain.exponentialRampToValueAtTime(0.001, splatTime + splatDuration);
                
                splatNoise.connect(splatFilter).connect(splatGain).connect(this.masterGain);
                splatNoise.start(splatTime);
                splatNoise.stop(splatTime + splatDuration);
                this.addActiveNode(splatNoise);
            }
        }
    }
}