// berryPickingSound.js
export class BerryPickSound {
    constructor(audioCtx, masterGain, params) {
        this.audioCtx = audioCtx;
        this.masterGain = masterGain;
        this.params = {
            berryType: params.berryType || 2,     // Type (0-4): firm/dry to soft/juicy
            berryRipeness: params.berryRipeness || 2,       // Ripeness (0-4): unripe/hard to overripe/soft
            berryQuantity: params.berryQuantity || 2        // Number of berries (0-4): single to handful
        };
        this.activeNodes = new Set();
        this.continuousTimeout = null;
    }

    start() {
        // For continuous berry picking sounds (similar to cricket's start method)
        if (this.params.berryQuantity <= 0 || this.continuousTimeout) return;
        
        const schedulePickingSound = () => {
            const currentTime = this.audioCtx.currentTime;
            // Picking interval depends on quantity (more berries = more frequent picking)
            const pickingInterval = 2.0 - this.params.berryQuantity * 0.3; // 0.8-2.0s
            const nextPickTime = pickingInterval * (0.8 + Math.random() * 0.4);
            
            this.playBurst();
            this.continuousTimeout = setTimeout(schedulePickingSound, nextPickTime * 1000);
        };
        
        schedulePickingSound();
    }
    
    stop() {
        if (this.continuousTimeout) {
            clearTimeout(this.continuousTimeout);
            this.continuousTimeout = null;
        }
        
        this.activeNodes.forEach(node => {
            if (node.stop) node.stop();
        });
        this.activeNodes.clear();
    }

    playBurst() {
        const currentTime = this.audioCtx.currentTime;
        
        // Generate the "snap" of stem breaking
        this._createStemSnapSound(currentTime);
        
        // The quantity parameter determines how many berries are picked at once
        const numBerries = 1 + Math.floor(this.params.berryQuantity * 2);
        
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
        }
    }
    
    _createStemSnapSound(startTime) {
        // The sound of the stem or twig breaking
        
        // Characteristics depend on ripeness - unripe berries have tougher stems
        const snapDuration = 0.05 - this.params.berryRipeness * 0.005;
        
        // Noise for the snap/crack
        const noiseBuffer = this._createNoiseBuffer(snapDuration);
        const noise = this.audioCtx.createBufferSource();
        noise.buffer = noiseBuffer;
        
        // Filter the noise to sound like breaking plant matter
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 2000 + this.params.berryRipeness * 500;
        filter.Q.value = 2;
        
        // Envelope for the snap
        const snapGain = this.audioCtx.createGain();
        snapGain.gain.setValueAtTime(0, startTime);
        snapGain.gain.linearRampToValueAtTime(0.1 - this.params.berryRipeness * 0.015, startTime + 0.002);
        snapGain.gain.exponentialRampToValueAtTime(0.001, startTime + snapDuration);
        
        noise.connect(filter).connect(snapGain).connect(this.masterGain);
        noise.start(startTime);
        noise.stop(startTime + snapDuration);
        this.activeNodes.add(noise);
        noise.onended = () => this.activeNodes.delete(noise);
    }
    
    _createLeafRustleSound(startTime) {
        // Rustling leaves/foliage sound
        const rustleDuration = 0.1 + Math.random() * 0.1;
        
        // Filtered noise for rustling
        const noiseBuffer = this._createNoiseBuffer(rustleDuration);
        const noise = this.audioCtx.createBufferSource();
        noise.buffer = noiseBuffer;
        
        // Highpass filter for leaf rustle
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 2000;
        
        // Gentle envelope for rustle
        const rustleGain = this.audioCtx.createGain();
        rustleGain.gain.setValueAtTime(0, startTime);
        rustleGain.gain.linearRampToValueAtTime(0.03, startTime + 0.03);
        rustleGain.gain.linearRampToValueAtTime(0.05, startTime + rustleDuration * 0.5);
        rustleGain.gain.exponentialRampToValueAtTime(0.001, startTime + rustleDuration);
        
        noise.connect(filter).connect(rustleGain).connect(this.masterGain);
        noise.start(startTime);
        noise.stop(startTime + rustleDuration);
        this.activeNodes.add(noise);
        noise.onended = () => this.activeNodes.delete(noise);
    }
    
    _createPluckSound(startTime) {
        // Higher pitched "pluck" as berry separates from stem
        const pluck = this.audioCtx.createOscillator();
        pluck.type = 'triangle';
        
        // Frequency based on berry type - higher for small berries, lower for larger ones
        const baseFreq = 1000 - this.params.berryType * 150;
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
        this.activeNodes.add(pluck);
        pluck.onended = () => this.activeNodes.delete(pluck);
    }
    
    _createLandingSound(startTime) {
        // Soft thud as berry lands in hand or container
        
        // The character of the sound depends on berry type and ripeness
        const isJuicy = this.params.berryType > 2 && this.params.berryRipeness > 2;
        
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
        const baseFreq = 200 - this.params.berryType * 30 - this.params.berryRipeness * 20;
        thud.frequency.value = baseFreq;
        
        // Thud envelope
        const thudGain = this.audioCtx.createGain();
        thudGain.gain.setValueAtTime(0, startTime);
        thudGain.gain.linearRampToValueAtTime(0.07, startTime + 0.01);
        thudGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1);
        
        thud.connect(thudGain).connect(this.masterGain);
        thud.start(startTime);
        thud.stop(startTime + 0.1);
        this.activeNodes.add(thud);
        thud.onended = () => this.activeNodes.delete(thud);
    }
    
    _createSquishSound(startTime) {
        // Squish for juicy/soft berries
        const squishDuration = 0.08 + this.params.berryRipeness * 0.02;
        
        // Noise component for squishing sound
        const noiseBuffer = this._createNoiseBuffer(squishDuration);
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
        this.activeNodes.add(noise);
        noise.onended = () => this.activeNodes.delete(noise);
        
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
            this.activeNodes.add(drip);
            drip.onended = () => this.activeNodes.delete(drip);
            
            // Small splat sound after drip
            if (Math.random() > 0.5) {
                const splatTime = dripTime + dripDuration - 0.01;
                const splatDuration = 0.04;
                
                // Noise for splat
                const splatNoiseBuffer = this._createNoiseBuffer(splatDuration);
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
                this.activeNodes.add(splatNoise);
                splatNoise.onended = () => this.activeNodes.delete(splatNoise);
            }
        }
    }
    
    _createNoiseBuffer(duration) {
        const bufferSize = this.audioCtx.sampleRate * duration;
        const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const output = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        return buffer;
    }
    
    updateParams(newParams) {
        const oldQuantity = this.params.berryQuantity;
        this.params = { ...this.params, ...newParams };
        
        // If continuous playing is active, handle quantity changes
        if (this.continuousTimeout) {
            if (this.params.berryQuantity <= 0) {
                this.stop();
            }
        } else if (oldQuantity <= 0 && this.params.berryQuantity > 0) {
            // Start playing if quantity was increased from 0
            this.start();
        }
    }
}