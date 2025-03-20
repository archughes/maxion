// bowArrow.js
import { SoundGenerator } from './SoundGenerator.js';

export class BowSound extends SoundGenerator {
    /**
     * Constructor for the BowSound generator
     * @param {AudioContext} audioCtx - The Web Audio API AudioContext
     * @param {GainNode} masterGain - The master gain node to connect sounds to
     * @param {Object} params - Configuration parameters for the bow sound
     */
    constructor(audioCtx, masterGain, params = {}) {
        // Initialize default params to pass to parent constructor
        const defaultParams = {
            bowType: params.bowType || 'standard', // 'standard', 'longbow', 'shortbow', 'crossbow'
            drawStrength: params.drawStrength || 2, // Draw strength (0-4)
            arrowType: params.arrowType || 'wooden'  // 'wooden', 'metal', 'flaming', 'magical'
        };
        
        // Call parent constructor with audioCtx, masterGain, and combined params
        super(audioCtx, masterGain, defaultParams);
        
        this.isPlaying = false;
    }

    /**
     * Starts the bow and arrow sound sequence
     */
    start() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        
        const currentTime = this.audioCtx.currentTime;
        
        // Create the bow string release sound
        this.createBowStringSound(currentTime);
        
        // Create the arrow flight sound
        this.createArrowFlightSound(currentTime + 0.05);
        
        // Add impact sound based on arrow type
        this.createImpactSound(currentTime + 0.5 + (this.params.drawStrength * 0.1));
    }
    
    /**
     * Stops all active sounds and cleans up resources
     * Overrides parent method with additional cleanup
     */
    stop() {
        this.isPlaying = false;
        // Call parent stop method to handle common cleanup
        super.stop();
    }
    
    /**
     * Plays a single burst or a rapid sequence of arrows
     * Overrides parent method to implement burst behavior
     */
    playBurst() {
        // For bow and arrow, a burst is essentially multiple arrows in rapid succession
        const burstCount = this.params.bowType === 'crossbow' ? 3 : 1;
        const delayBetween = this.params.bowType === 'crossbow' ? 0.15 : 0.3;
        
        // Calculate total duration for timeout cleanup
        const totalDuration = (burstCount * delayBetween) + 1; // Add 1 second for the sound to complete
        
        for (let i = 0; i < burstCount; i++) {
            setTimeout(() => {
                const currentTime = this.audioCtx.currentTime;
                this.createBowStringSound(currentTime);
                this.createArrowFlightSound(currentTime + 0.05);
                this.createImpactSound(currentTime + 0.5 + (this.params.drawStrength * 0.1));
            }, i * delayBetween * 1000);
        }
        
        // Set a timeout to clean up after all sounds have likely completed
        this.timeout = setTimeout(() => {
            // Only clear active nodes, don't reset isPlaying as this is a one-shot
            this.activeNodes.forEach(node => {
                if (typeof node.stop === 'function') {
                    try {
                        node.stop();
                    } catch (e) {
                        // Ignore if node is already stopped
                    }
                }
                node.disconnect();
            });
            this.activeNodes.clear();
            this.timeout = null;
        }, totalDuration * 1000);
    }
    
    /**
     * Creates the bow string twang sound
     * @param {number} startTime - The audio context time to start the sound
     */
    createBowStringSound(startTime) {
        // String twang sound - mostly a short, dampened sine wave
        const stringOsc = this.audioCtx.createOscillator();
        const stringGain = this.audioCtx.createGain();
        
        // Base frequency depends on bow type
        let baseFreq = 180; // Default for standard bow
        let decayTime = 0.3; // Default decay time
        
        switch(this.params.bowType) {
            case 'longbow':
                baseFreq = 120; // Lower pitch for longbow
                decayTime = 0.4; // Longer decay
                break;
            case 'shortbow':
                baseFreq = 220; // Higher pitch for shortbow
                decayTime = 0.2; // Shorter decay
                break;
            case 'crossbow':
                baseFreq = 280; // Even higher for crossbow mechanism
                decayTime = 0.15; // Very short decay for mechanical sound
                break;
        }
        
        // Adjust frequency based on draw strength
        baseFreq *= (1 + this.params.drawStrength * 0.1); // 0-40% increase
        
        stringOsc.type = 'triangle'; // Triangle works better for string sounds
        stringOsc.frequency.setValueAtTime(baseFreq, startTime);
        stringOsc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, startTime + decayTime);
        
        // Gain envelope for the twang sound
        const twangAmplitude = 0.2 + (this.params.drawStrength * 0.1); // 0.2-0.6
        stringGain.gain.setValueAtTime(0, startTime);
        stringGain.gain.linearRampToValueAtTime(twangAmplitude, startTime + 0.01);
        stringGain.gain.exponentialRampToValueAtTime(0.001, startTime + decayTime);
        
        // Add distortion for more realistic string sound
        const waveshaper = this.audioCtx.createWaveShaper();
        waveshaper.curve = this.createDistortionCurve(30); // Light distortion
        
        // Crossbow has a more mechanical sound - add a click
        if (this.params.bowType === 'crossbow') {
            const clickNoise = this.createNoiseNode(0.1);
            const clickGain = this.audioCtx.createGain();
            
            clickGain.gain.setValueAtTime(0, startTime);
            clickGain.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
            clickGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.05);
            
            // Add mechanical click filter
            const clickFilter = this.audioCtx.createBiquadFilter();
            clickFilter.type = "bandpass";
            clickFilter.frequency.value = 3000;
            clickFilter.Q.value = 5;
            
            clickNoise.connect(clickFilter).connect(clickGain).connect(this.masterGain);
            // Add to active nodes for proper tracking
            this.addActiveNode(clickNoise);
        }
        
        stringOsc.connect(waveshaper).connect(stringGain).connect(this.masterGain);
        stringOsc.start(startTime);
        stringOsc.stop(startTime + decayTime);
        
        // Add to active nodes using the parent class method
        this.addActiveNode(stringOsc);
    }
    
    /**
     * Creates the arrow flight sound
     * @param {number} startTime - The audio context time to start the sound
     */
    createArrowFlightSound(startTime) {
        // Arrow whoosh sound - noise filtered to give a swooshing quality
        const drawFactor = this.params.drawStrength / 4; // 0-1 normalized
        const duration = 0.3 + (drawFactor * 0.4); // 0.3-0.7s depending on draw strength
        
        // Create noise source using parent's noise buffer creation method
        const noiseBuffer = this.createNoiseBuffer(duration + 0.1);
        const noise = this.audioCtx.createBufferSource();
        noise.buffer = noiseBuffer;
        
        // Create bandpass filter for whoosh effect
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = "bandpass";
        
        // Higher draw strength = faster arrow = faster frequency sweep
        const startFreq = 3000 + (drawFactor * 1000); // 3000-4000 Hz
        const endFreq = 500 - (drawFactor * 200); // 500-300 Hz
        
        filter.frequency.setValueAtTime(startFreq, startTime);
        filter.frequency.exponentialRampToValueAtTime(endFreq, startTime + duration);
        filter.Q.value = 1.5;
        
        // Create gain node for envelope
        const whooshGain = this.audioCtx.createGain();
        whooshGain.gain.setValueAtTime(0, startTime);
        whooshGain.gain.linearRampToValueAtTime(0.1 + (drawFactor * 0.15), startTime + duration * 0.2);
        whooshGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        noise.connect(filter).connect(whooshGain).connect(this.masterGain);
        this.addActiveNode(noise);
        noise.start(startTime);
        
        // Add specific characteristics based on arrow type
        if (this.params.arrowType === 'metal') {
            this.addMetalArrowSound(startTime, duration);
        } else if (this.params.arrowType === 'flaming') {
            this.addFlamingSoundEffect(startTime, duration);
        } else if (this.params.arrowType === 'magical') {
            this.addMagicalSoundEffect(startTime, duration);
        }
    }
    
    /**
     * Adds metal arrow sound effects
     * @param {number} startTime - The audio context time to start the sound
     * @param {number} duration - Duration of the sound effect
     */
    addMetalArrowSound(startTime, duration) {
        // Metal arrows have a higher pitched, more cutting sound
        const noiseBuffer = this.createNoiseBuffer(duration);
        const metalNoise = this.audioCtx.createBufferSource();
        metalNoise.buffer = noiseBuffer;
        
        const metalFilter = this.audioCtx.createBiquadFilter();
        metalFilter.type = "highpass";
        metalFilter.frequency.value = 5000;
        
        const metalGain = this.audioCtx.createGain();
        metalGain.gain.setValueAtTime(0, startTime);
        metalGain.gain.linearRampToValueAtTime(0.07, startTime + duration * 0.2);
        metalGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        metalNoise.connect(metalFilter).connect(metalGain).connect(this.masterGain);
        this.addActiveNode(metalNoise);
        metalNoise.start(startTime);
    }
    
    /**
     * Adds flaming arrow sound effects
     * @param {number} startTime - The audio context time to start the sound
     * @param {number} duration - Duration of the sound effect
     */
    addFlamingSoundEffect(startTime, duration) {
        // Crackling fire sounds with filtered noise and random amplitude modulation
        const fireNoiseBuffer = this.createNoiseBuffer(duration + 0.5);
        const fireNoise = this.audioCtx.createBufferSource();
        fireNoise.buffer = fireNoiseBuffer;
        
        // Bandpass filter for fire sound
        const fireFilter = this.audioCtx.createBiquadFilter();
        fireFilter.type = "bandpass";
        fireFilter.frequency.value = 2500;
        fireFilter.Q.value = 0.5;
        
        // Create gain node with random modulation for crackling
        const fireGain = this.audioCtx.createGain();
        fireGain.gain.setValueAtTime(0, startTime);
        fireGain.gain.linearRampToValueAtTime(0.15, startTime + 0.1);
        
        // Create crackling effect
        const modulationSpeed = 20; // Crackling rate
        const modulationDepth = 0.7; // How pronounced the crackling is
        
        // Schedule multiple gain changes to create crackling effect
        for (let i = 0; i < duration * modulationSpeed; i++) {
            const time = startTime + (i / modulationSpeed);
            const randomGain = 0.05 + Math.random() * 0.15 * modulationDepth;
            fireGain.gain.linearRampToValueAtTime(randomGain, time);
        }
        
        fireGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration + 0.5);
        
        // Additional highpass filtered noise for sizzling
        const sizzleNoiseBuffer = this.createNoiseBuffer(duration + 0.5);
        const sizzleNoise = this.audioCtx.createBufferSource();
        sizzleNoise.buffer = sizzleNoiseBuffer;
        
        const sizzleFilter = this.audioCtx.createBiquadFilter();
        sizzleFilter.type = "highpass";
        sizzleFilter.frequency.value = 6000;
        
        const sizzleGain = this.audioCtx.createGain();
        sizzleGain.gain.setValueAtTime(0, startTime);
        sizzleGain.gain.linearRampToValueAtTime(0.05, startTime + 0.1);
        sizzleGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration + 0.5);
        
        fireNoise.connect(fireFilter).connect(fireGain).connect(this.masterGain);
        sizzleNoise.connect(sizzleFilter).connect(sizzleGain).connect(this.masterGain);
        
        this.addActiveNode(fireNoise);
        this.addActiveNode(sizzleNoise);
        
        fireNoise.start(startTime);
        sizzleNoise.start(startTime);
    }
    
    /**
     * Adds magical arrow sound effects
     * @param {number} startTime - The audio context time to start the sound
     * @param {number} duration - Duration of the sound effect
     */
    addMagicalSoundEffect(startTime, duration) {
        // Magical shimmer/sparkle effects with high frequency oscillators
        const numSparkles = 15 + Math.floor(this.params.drawStrength * 5); // 15-35 sparkles
        
        // Create a base magical hum
        const baseOsc = this.audioCtx.createOscillator();
        baseOsc.type = "sine";
        baseOsc.frequency.value = 440; // A4 note
        
        // Modulate the base frequency
        const lfo = this.audioCtx.createOscillator();
        lfo.type = "sine";
        lfo.frequency.value = 6;
        
        const lfoGain = this.audioCtx.createGain();
        lfoGain.gain.value = 20;
        
        const baseGain = this.audioCtx.createGain();
        baseGain.gain.setValueAtTime(0, startTime);
        baseGain.gain.linearRampToValueAtTime(0.15, startTime + 0.1);
        baseGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration + 0.3);
        
        lfo.connect(lfoGain).connect(baseOsc.frequency);
        baseOsc.connect(baseGain).connect(this.masterGain);
        
        lfo.start(startTime);
        lfo.stop(startTime + duration + 0.3);
        baseOsc.start(startTime);
        baseOsc.stop(startTime + duration + 0.3);
        
        this.addActiveNode(lfo);
        this.addActiveNode(baseOsc);
        
        // Add random sparkle sounds
        for (let i = 0; i < numSparkles; i++) {
            const sparkleTime = startTime + (Math.random() * duration);
            const sparkleOsc = this.audioCtx.createOscillator();
            sparkleOsc.type = "sine";
            
            // Random high frequency for sparkle
            const sparkleFreq = 2000 + Math.random() * 6000;
            sparkleOsc.frequency.setValueAtTime(sparkleFreq, sparkleTime);
            sparkleOsc.frequency.exponentialRampToValueAtTime(sparkleFreq * 1.5, sparkleTime + 0.1);
            
            const sparkleGain = this.audioCtx.createGain();
            sparkleGain.gain.setValueAtTime(0, sparkleTime);
            sparkleGain.gain.linearRampToValueAtTime(0.05 + Math.random() * 0.1, sparkleTime + 0.01);
            sparkleGain.gain.exponentialRampToValueAtTime(0.001, sparkleTime + 0.1);
            
            sparkleOsc.connect(sparkleGain).connect(this.masterGain);
            sparkleOsc.start(sparkleTime);
            sparkleOsc.stop(sparkleTime + 0.1);
            
            this.addActiveNode(sparkleOsc);
        }
    }
    
    /**
     * Creates the impact sound when the arrow hits a target
     * @param {number} startTime - The audio context time to start the sound
     */
    createImpactSound(startTime) {
        // Base impact parameters
        const impactDuration = 0.2;
        const impactVolume = 0.1 + (this.params.drawStrength * 0.05); // 0.1-0.3
        
        // Create a short thud sound with filtered noise
        const impactNoiseBuffer = this.createNoiseBuffer(impactDuration);
        const impactNoise = this.audioCtx.createBufferSource();
        impactNoise.buffer = impactNoiseBuffer;
        
        // Filter for impact sound
        const impactFilter = this.audioCtx.createBiquadFilter();
        impactFilter.type = "lowpass";
        impactFilter.frequency.value = 800;
        impactFilter.Q.value = 1.0;
        
        // Gain envelope for impact
        const impactGain = this.audioCtx.createGain();
        impactGain.gain.setValueAtTime(0, startTime);
        impactGain.gain.linearRampToValueAtTime(impactVolume, startTime + 0.01);
        impactGain.gain.exponentialRampToValueAtTime(0.001, startTime + impactDuration);
        
        impactNoise.connect(impactFilter).connect(impactGain).connect(this.masterGain);
        this.addActiveNode(impactNoise);
        impactNoise.start(startTime);
        
        // Add specific impact characteristics based on arrow type
        switch(this.params.arrowType) {
            case 'metal':
                this.createMetalImpactSound(startTime);
                break;
            case 'flaming':
                this.createFlamingImpactSound(startTime);
                break;
            case 'magical':
                this.createMagicalImpactSound(startTime);
                break;
        }
    }
    
    /**
     * Creates a metal impact sound
     * @param {number} startTime - The audio context time to start the sound
     */
    createMetalImpactSound(startTime) {
        const metalImpactOsc = this.audioCtx.createOscillator();
        metalImpactOsc.type = "triangle";
        metalImpactOsc.frequency.setValueAtTime(300, startTime);
        metalImpactOsc.frequency.exponentialRampToValueAtTime(100, startTime + 0.15);
        
        const metalImpactGain = this.audioCtx.createGain();
        metalImpactGain.gain.setValueAtTime(0, startTime);
        metalImpactGain.gain.linearRampToValueAtTime(0.15, startTime + 0.01);
        metalImpactGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);
        
        // Add some ringing
        const ringingOsc = this.audioCtx.createOscillator();
        ringingOsc.type = "sine";
        ringingOsc.frequency.value = 1200;
        
        const ringingGain = this.audioCtx.createGain();
        ringingGain.gain.setValueAtTime(0, startTime + 0.01);
        ringingGain.gain.linearRampToValueAtTime(0.07, startTime + 0.02);
        ringingGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
        
        metalImpactOsc.connect(metalImpactGain).connect(this.masterGain);
        ringingOsc.connect(ringingGain).connect(this.masterGain);
        
        metalImpactOsc.start(startTime);
        metalImpactOsc.stop(startTime + 0.15);
        ringingOsc.start(startTime + 0.01);
        ringingOsc.stop(startTime + 0.3);
        
        this.addActiveNode(metalImpactOsc);
        this.addActiveNode(ringingOsc);
    }
    
    /**
     * Creates a flaming impact sound
     * @param {number} startTime - The audio context time to start the sound
     */
    createFlamingImpactSound(startTime) {
        // Fire burst effect
        const burstNoiseBuffer = this.createNoiseBuffer(0.5);
        const burstNoise = this.audioCtx.createBufferSource();
        burstNoise.buffer = burstNoiseBuffer;
        
        const burstFilter = this.audioCtx.createBiquadFilter();
        burstFilter.type = "bandpass";
        burstFilter.frequency.value = 1000;
        burstFilter.Q.value = 0.8;
        
        const burstGain = this.audioCtx.createGain();
        burstGain.gain.setValueAtTime(0, startTime);
        burstGain.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
        burstGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);
        
        burstNoise.connect(burstFilter).connect(burstGain).connect(this.masterGain);
        this.addActiveNode(burstNoise);
        burstNoise.start(startTime);
        
        // Add some fire crackles after impact
        for (let i = 0; i < 10; i++) {
            const crackleTime = startTime + 0.1 + (Math.random() * 0.4);
            const crackleNoiseBuffer = this.createNoiseBuffer(0.1);
            const crackleNoise = this.audioCtx.createBufferSource();
            crackleNoise.buffer = crackleNoiseBuffer;
            
            const crackleFilter = this.audioCtx.createBiquadFilter();
            crackleFilter.type = "bandpass";
            crackleFilter.frequency.value = 3000 + Math.random() * 3000;
            crackleFilter.Q.value = 10;
            
            const crackleGain = this.audioCtx.createGain();
            crackleGain.gain.setValueAtTime(0, crackleTime);
            crackleGain.gain.linearRampToValueAtTime(0.05 + Math.random() * 0.05, crackleTime + 0.01);
            crackleGain.gain.exponentialRampToValueAtTime(0.001, crackleTime + 0.1);
            
            crackleNoise.connect(crackleFilter).connect(crackleGain).connect(this.masterGain);
            this.addActiveNode(crackleNoise);
            crackleNoise.start(crackleTime);
        }
    }
    
    /**
     * Creates a magical impact sound
     * @param {number} startTime - The audio context time to start the sound
     */
    createMagicalImpactSound(startTime) {
        // Magical explosion
        const magicExplosionOsc = this.audioCtx.createOscillator();
        magicExplosionOsc.type = "sine";
        magicExplosionOsc.frequency.setValueAtTime(600, startTime);
        magicExplosionOsc.frequency.exponentialRampToValueAtTime(200, startTime + 0.3);
        
        const explosionGain = this.audioCtx.createGain();
        explosionGain.gain.setValueAtTime(0, startTime);
        explosionGain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
        explosionGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
        
        // Reverb effect for magical impact
        const convolver = this.createSimpleReverb(1.5, 0.8);
        
        // Magical chime cascade
        for (let i = 0; i < 8; i++) {
            const chimeTime = startTime + 0.05 + (i * 0.03);
            const chimeOsc = this.audioCtx.createOscillator();
            chimeOsc.type = "sine";
            
            // Descending magic scale
            const baseNote = 1200;
            const scale = [0, -2, -4, -5, -7, -9, -11, -12]; // Major scale in semitones
            const freq = baseNote * Math.pow(2, scale[i] / 12);
            
            chimeOsc.frequency.value = freq;
            
            const chimeGain = this.audioCtx.createGain();
            chimeGain.gain.setValueAtTime(0, chimeTime);
            chimeGain.gain.linearRampToValueAtTime(0.1, chimeTime + 0.01);
            chimeGain.gain.exponentialRampToValueAtTime(0.001, chimeTime + 0.3);
            
            chimeOsc.connect(chimeGain).connect(convolver).connect(this.masterGain);
            chimeOsc.start(chimeTime);
            chimeOsc.stop(chimeTime + 0.3);
            
            this.addActiveNode(chimeOsc);
        }
        
        magicExplosionOsc.connect(explosionGain).connect(this.masterGain);
        magicExplosionOsc.start(startTime);
        magicExplosionOsc.stop(startTime + 0.3);
        
        this.addActiveNode(magicExplosionOsc);
    }
    
    /**
     * Creates a noise source node
     * @param {number} duration - Duration of the noise in seconds
     * @returns {AudioBufferSourceNode} - The noise source node
     */
    createNoiseNode(duration) {
        const buffer = this.createNoiseBuffer(duration);
        const noise = this.audioCtx.createBufferSource();
        noise.buffer = buffer;
        noise.start(this.audioCtx.currentTime);
        
        return noise;
    }
    
    /**
     * Creates a distortion curve for the waveshaper
     * @param {number} amount - Amount of distortion
     * @returns {Float32Array} - The distortion curve
     */
    createDistortionCurve(amount) {
        const samples = 44100;
        const curve = new Float32Array(samples);
        const deg = Math.PI / 180;
        
        for (let i = 0; i < samples; ++i) {
            const x = (i * 2) / samples - 1;
            curve[i] = (3 + amount) * x * 20 * deg / (Math.PI + amount * Math.abs(x));
        }
        
        return curve;
    }
    
    /**
     * Creates a simple reverb convolver node
     * @param {number} duration - Duration of the impulse response
     * @param {number} decay - Decay rate of the impulse response
     * @returns {ConvolverNode} - The convolver node with the impulse response
     */
    createSimpleReverb(duration, decay) {
        // Create a simple reverb using a convolver node
        const sampleRate = this.audioCtx.sampleRate;
        const length = sampleRate * duration;
        const impulse = this.audioCtx.createBuffer(2, length, sampleRate);
        const impulseL = impulse.getChannelData(0);
        const impulseR = impulse.getChannelData(1);
        
        // Generate impulse response
        for (let i = 0; i < length; i++) {
            const n = i / length;
            impulseL[i] = (Math.random() * 2 - 1) * Math.pow(1 - n, decay);
            impulseR[i] = (Math.random() * 2 - 1) * Math.pow(1 - n, decay);
        }
        
        const convolver = this.audioCtx.createConvolver();
        convolver.buffer = impulse;
        
        return convolver;
    }
}