// chestSound.js
import { SoundGenerator } from './SoundGenerator.js';

export class ChestSound extends SoundGenerator {
    constructor(audioCtx, masterGain, params = {}) {
        // Call parent constructor with base parameters
        super(audioCtx, masterGain, params);
        
        // Set default parameters specific to chest sounds
        this.params = {
            chestSize: params?.chestSize || 2,         // Size of chest (0-4): small to large
            chestMaterialType: params?.chestMaterialType || 2,    // Material (0-4): wood to metal
            chestCondition: params?.chestCondition || 2,          // Condition (0-4): rusty/creaky to well-oiled
            chestTreasureValue: params?.chestTreasureValue || 2   // Value (0-4): common to legendary
        };
        
        // We're now using the parent class's activeNodes Set
        this.continuousTimeout = null; // Keep this specific to ChestSound
    }

    start() {
        // For continuous play (e.g., lid open and closing repeatedly)
        if (this.continuousTimeout) return;
        
        const scheduleNextOpen = () => {
            const interval = 2 + Math.random() * 2; // 2-4 seconds between plays
            
            this.playBurst();
            this.continuousTimeout = setTimeout(scheduleNextOpen, interval * 1000);
        };
        
        scheduleNextOpen();
    }
    
    stop() {
        if (this.continuousTimeout) {
            clearTimeout(this.continuousTimeout);
            this.continuousTimeout = null;
        }
        
        // Call parent's stop method to clean up audio nodes
        super.stop();
    }

    playBurst() {
        const currentTime = this.audioCtx.currentTime;
        
        // Generate the "click" of unlocking
        this._createLockSound(currentTime);
        
        // Generate the "creak" of opening
        this._createCreakSound(currentTime + 0.1);
        
        // Generate the "thud" of lid hitting stop
        this._createThudSound(currentTime + 0.5 + this.params.chestSize * 0.1);
        
        // Optional treasure shimmer for valuable chests
        if (this.params.chestTreasureValue > 1) {
            this._createShimmerSound(currentTime + 0.7);
        }
        
        // Set a timeout to clean up resources after all sounds have completed
        // Calculate the total duration based on the longest possible sound (shimmer)
        const totalDuration = 0.7 + // Start time of shimmer
                             (0.8 + (this.params.chestTreasureValue * 0.4)) + // Max shimmer duration
                             0.5; // Extra buffer
        
        this.timeout = setTimeout(() => {
            // This doesn't stop the sound but ensures resources get cleaned up
            // after all sounds have naturally completed
        }, totalDuration * 1000);
    }
    
    _createLockSound(startTime) {
        // Lock mechanism sound - short metallic click
        const osc = this.audioCtx.createOscillator();
        osc.type = 'triangle';
        
        // Higher pitch for smaller chests, lower for larger
        const baseFreq = 2000 - (this.params.chestSize * 300);
        osc.frequency.setValueAtTime(baseFreq, startTime);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, startTime + 0.05);
        
        const clickGain = this.audioCtx.createGain();
        clickGain.gain.setValueAtTime(0, startTime);
        clickGain.gain.linearRampToValueAtTime(0.2 + this.params.chestMaterialType * 0.1, startTime + 0.005);
        clickGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.05);
        
        // Add noise for rusty locks
        if (this.params.chestCondition < 2) {
            const noiseBuffer = this.createNoiseBuffer(0.05); // Using parent's method
            const noiseSource = this.audioCtx.createBufferSource();
            noiseSource.buffer = noiseBuffer;
            
            const noiseGain = this.audioCtx.createGain();
            noiseGain.gain.value = 0.1 * (2 - this.params.chestCondition);
            
            const noiseFilter = this.audioCtx.createBiquadFilter();
            noiseFilter.type = 'bandpass';
            noiseFilter.frequency.value = baseFreq;
            noiseFilter.Q.value = 1;
            
            noiseSource.connect(noiseFilter).connect(noiseGain).connect(this.masterGain);
            noiseSource.start(startTime);
            noiseSource.stop(startTime + 0.05);
            this.activeNodes.add(noiseSource); // Using parent's activeNodes Set
        }
        
        osc.connect(clickGain).connect(this.masterGain);
        osc.start(startTime);
        osc.stop(startTime + 0.05);
        this.activeNodes.add(osc); // Using parent's activeNodes Set
    }
    
    _createCreakSound(startTime) {
        // Base duration depends on condition - more creaky (lower condition) means longer creak
        const creakDuration = 0.1 + (0.4 * (4 - this.params.chestCondition));
        
        // Creaky sound using frequency modulation
        const carrier = this.audioCtx.createOscillator();
        carrier.type = 'sawtooth';
        
        // Base frequency determined by material and size
        const baseFreq = 100 + (4 - this.params.chestMaterialType) * 50 - this.params.chestSize * 15;
        carrier.frequency.setValueAtTime(baseFreq, startTime);
        
        // Modulation for the creak
        const modulator = this.audioCtx.createOscillator();
        modulator.type = 'sine';
        
        // Slower modulation for rusty/creaky, faster for well-oiled
        const modFreq = 5 + this.params.chestCondition * 2;
        modulator.frequency.value = modFreq;
        
        const modGain = this.audioCtx.createGain();
        modGain.gain.value = baseFreq * 0.5 * (4 - this.params.chestCondition) / 4;
        
        // Create the creaking envelope
        const creakGain = this.audioCtx.createGain();
        creakGain.gain.setValueAtTime(0, startTime);
        creakGain.gain.linearRampToValueAtTime(0.15 * (4 - this.params.chestMaterialType) / 4, startTime + 0.05);
        creakGain.gain.linearRampToValueAtTime(0.05 * (4 - this.params.chestMaterialType) / 4, startTime + creakDuration * 0.8);
        creakGain.gain.exponentialRampToValueAtTime(0.001, startTime + creakDuration);
        
        // Apply lowpass filter based on material (wooden=warmer, metal=brighter)
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 500 + this.params.chestMaterialType * 1000;
        
        // Connect everything
        modulator.connect(modGain).connect(carrier.frequency);
        carrier.connect(filter).connect(creakGain).connect(this.masterGain);
        
        modulator.start(startTime);
        carrier.start(startTime);
        modulator.stop(startTime + creakDuration);
        carrier.stop(startTime + creakDuration);
        
        // Use parent's activeNodes Set
        this.activeNodes.add(modulator);
        this.activeNodes.add(carrier);
    }
    
    _createThudSound(startTime) {
        // Thud when chest is fully open and hits the stop
        
        // Noise burst for impact
        const noiseBuffer = this.createNoiseBuffer(0.2); // Using parent's method
        const noise = this.audioCtx.createBufferSource();
        noise.buffer = noiseBuffer;
        
        // Lowpass filter for thud - heavier chests have lower frequency thuds
        const thudFilter = this.audioCtx.createBiquadFilter();
        thudFilter.type = 'lowpass';
        thudFilter.frequency.value = 500 - this.params.chestSize * 80;
        thudFilter.Q.value = 1;
        
        // Envelope for the thud
        const thudGain = this.audioCtx.createGain();
        thudGain.gain.setValueAtTime(0, startTime);
        thudGain.gain.linearRampToValueAtTime(0.3 + this.params.chestSize * 0.1, startTime + 0.01);
        thudGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1 + this.params.chestSize * 0.05);
        
        noise.connect(thudFilter).connect(thudGain).connect(this.masterGain);
        noise.start(startTime);
        noise.stop(startTime + 0.2);
        this.activeNodes.add(noise); // Using parent's activeNodes Set
        
        // Resonance for the thud
        const resonance = this.audioCtx.createOscillator();
        resonance.type = 'sine';
        resonance.frequency.value = 80 + this.params.chestMaterialType * 50 - this.params.chestSize * 10;
        
        const resonanceGain = this.audioCtx.createGain();
        resonanceGain.gain.setValueAtTime(0, startTime);
        resonanceGain.gain.linearRampToValueAtTime(0.2, startTime + 0.01);
        resonanceGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
        
        resonance.connect(resonanceGain).connect(this.masterGain);
        resonance.start(startTime);
        resonance.stop(startTime + 0.3);
        this.activeNodes.add(resonance); // Using parent's activeNodes Set
    }
    
    _createShimmerSound(startTime) {
        // Implement treasure shimmer sound for valuable chests
        // A series of high-frequency random tones with reverb-like decay
        
        // Duration and intensity based on treasure value
        const shimmerDuration = 0.8 + (this.params.chestTreasureValue * 0.4); // 0.8-2.4s
        const numTones = 5 + Math.floor(this.params.chestTreasureValue * 4); // 5-21 tones
        
        // Create convolver for reverb-like effect
        const convolver = this.audioCtx.createConvolver();
        const impulseBuffer = this._createImpulseResponse(1.5);
        convolver.buffer = impulseBuffer;
        
        // Shimmer master gain
        const shimmerMasterGain = this.audioCtx.createGain();
        shimmerMasterGain.gain.value = 0.2 + (this.params.chestTreasureValue * 0.15);
        
        // Create shimmer tones
        for (let i = 0; i < numTones; i++) {
            // Random timing within the shimmer duration
            const toneStart = startTime + (Math.random() * shimmerDuration * 0.7);
            const toneDuration = 0.1 + (Math.random() * 0.3);
            
            // Create oscillator for the tone
            const shimmerOsc = this.audioCtx.createOscillator();
            
            // Higher value treasure has higher and more varied frequencies
            const baseFreq = 2000 + (this.params.chestTreasureValue * 1000) + (Math.random() * 2000);
            shimmerOsc.type = 'sine';
            shimmerOsc.frequency.setValueAtTime(baseFreq, toneStart);
            
            // Add slight frequency modulation for "sparkle" effect
            if (Math.random() > 0.5) {
                shimmerOsc.frequency.linearRampToValueAtTime(
                    baseFreq * (1 + Math.random() * 0.1),
                    toneStart + toneDuration * 0.5
                );
                shimmerOsc.frequency.linearRampToValueAtTime(
                    baseFreq * (1 - Math.random() * 0.05),
                    toneStart + toneDuration
                );
            }
            
            // Individual gain envelope for each tone
            const toneGain = this.audioCtx.createGain();
            toneGain.gain.setValueAtTime(0, toneStart);
            toneGain.gain.linearRampToValueAtTime(0.05 + (Math.random() * 0.15), toneStart + 0.01);
            toneGain.gain.exponentialRampToValueAtTime(0.001, toneStart + toneDuration);
            
            // Add panning for spatial effect
            const panner = this.audioCtx.createStereoPanner();
            panner.pan.value = (Math.random() * 2) - 1; // -1 to 1 (left to right)
            
            // Connect the nodes
            if (this.params.chestTreasureValue > 2) {
                // Add reverb for higher value treasures
                shimmerOsc.connect(toneGain).connect(panner).connect(convolver).connect(shimmerMasterGain).connect(this.masterGain);
            } else {
                // Simpler connection for lower value treasures
                shimmerOsc.connect(toneGain).connect(panner).connect(shimmerMasterGain).connect(this.masterGain);
            }
            
            // Schedule and track
            shimmerOsc.start(toneStart);
            shimmerOsc.stop(toneStart + toneDuration);
            this.activeNodes.add(shimmerOsc); // Using parent's activeNodes Set
        }
    }
    
    _createImpulseResponse(duration) {
        // Create an impulse response for the convolver (simple reverb effect)
        const sampleRate = this.audioCtx.sampleRate;
        const length = sampleRate * duration;
        const impulseBuffer = this.audioCtx.createBuffer(2, length, sampleRate);
        
        // Fill both channels with exponentially decaying noise
        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulseBuffer.getChannelData(channel);
            
            for (let i = 0; i < length; i++) {
                // Exponential decay
                const decay = Math.pow(0.5, i / (length * 0.3));
                // Random noise with decay
                channelData[i] = (Math.random() * 2 - 1) * decay;
            }
        }
        
        return impulseBuffer;
    }
}