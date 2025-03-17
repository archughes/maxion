// treeChoppingSound.js
export class TreeChopSound {
    constructor(audioCtx, masterGain, params) {
        this.audioCtx = audioCtx;
        this.masterGain = masterGain;
        this.params = {
            chopTreeSize: params.chopTreeSize || 2,       // Size of tree (0-4): sapling to massive
            chopTool: params.chopTool || 2,       // Type of tool (0-4): stone axe to chainsaw
            chopIntensity: params.chopIntensity || 2  // Force of chop (0-4): gentle to powerful
        };
        this.activeNodes = new Set();
        this.isChopping = false;
        this.chopInterval = null;
        this.chainsawNodes = null;
    }

    start() {
        if (this.isChopping) return;
        
        this.isChopping = true;
        
        // Calculate chop interval based on tool type and chop intensity
        const interval = 1000 + (4 - this.params.chopIntensity) * 500 - this.params.chopTool * 100;
        
        // For chainsaw, start the motor sound
        if (Math.round(this.params.chopTool) === 4) {
            this._startChainsawSound();
        }
        
        const scheduleChop = () => {
            this.playBurst();
            this.chopInterval = setTimeout(scheduleChop, interval);
        };
        
        scheduleChop();
    }
    
    stop() {
        if (this.chopInterval) {
            clearTimeout(this.chopInterval);
            this.chopInterval = null;
        }
        
        this.isChopping = false;
        
        // Stop chainsaw sound if running
        if (this.chainsawNodes) {
            this.chainsawNodes.forEach(node => {
                if (node.stop) node.stop();
            });
            this.chainsawNodes = null;
        }
        
        this.activeNodes.forEach(node => {
            if (node.stop) node.stop();
        });
        this.activeNodes.clear();
    }
    
    playBurst() {
        const currentTime = this.audioCtx.currentTime;
        console.log(`Chopping tree with ${this.params.chopTreeSize} size, ${this.params.chopTool} tool, and ${this.params.chopIntensity} intensity.`);
        
        // Initial impact sound
        this._createImpactSound(currentTime);
        
        // Tree resonance
        this._createResonanceSound(currentTime + 0.01);
        
        // Add wood splintering for high intensity chops
        if (this.params.chopIntensity > 2) {
            this._createSplinterSound(currentTime + 0.05);
        }
        
        // Leaf rustling for larger trees
        if (this.params.chopTreeSize > 1) {
            this._createLeafRustleSound(currentTime + 0.1);
        }
    }
    
    _createImpactSound(startTime) {
        // Impact noise burst 
        const noiseBuffer = this._createNoiseBuffer(0.1);
        const noise = this.audioCtx.createBufferSource();
        noise.buffer = noiseBuffer;
        
        // Impact envelope - sharper attack for higher intensity chops
        const impactGain = this.audioCtx.createGain();
        impactGain.gain.setValueAtTime(0, startTime);
        impactGain.gain.linearRampToValueAtTime(0.2 + this.params.chopIntensity * 0.15, startTime + 0.005);
        impactGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.05 + this.params.chopIntensity * 0.02);
        
        // Tool-specific filtering
        const impactFilter = this.audioCtx.createBiquadFilter();
        impactFilter.type = 'bandpass';
        
        // Different tools have different spectral characteristics
        switch(Math.round(this.params.chopTool)) {
            case 0: // Stone axe - duller sound
                impactFilter.frequency.value = 500;
                impactFilter.Q.value = 0.5;
                break;
            case 1: // Basic axe
                impactFilter.frequency.value = 800;
                impactFilter.Q.value = 0.7;
                break;
            case 2: // Steel axe
                impactFilter.frequency.value = 1200;
                impactFilter.Q.value = 1;
                break;
            case 3: // Sharp axe
                impactFilter.frequency.value = 1500;
                impactFilter.Q.value = 1.5;
                break;
            case 4: // Chainsaw/power tool - higher frequencies
                impactFilter.frequency.value = 2000;
                impactFilter.Q.value = 2;
                break;
        }
        
        noise.connect(impactFilter).connect(impactGain).connect(this.masterGain);
        noise.start(startTime);
        noise.stop(startTime + 0.1);
        this.activeNodes.add(noise);
        noise.onended = () => this.activeNodes.delete(noise);
        
        // Metallic "clang" for metal tools (toolType > 1)
        if (this.params.chopTool > 1) {
            const clang = this.audioCtx.createOscillator();
            clang.type = 'triangle';
            clang.frequency.setValueAtTime(2000 + this.params.chopTool * 500, startTime);
            clang.frequency.exponentialRampToValueAtTime(1000, startTime + 0.05);
            
            const clangGain = this.audioCtx.createGain();
            clangGain.gain.setValueAtTime(0, startTime);
            clangGain.gain.linearRampToValueAtTime(0.05 + this.params.chopTool * 0.02, startTime + 0.002);
            clangGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.05);
            
            clang.connect(clangGain).connect(this.masterGain);
            clang.start(startTime);
            clang.stop(startTime + 0.05);
            this.activeNodes.add(clang);
            clang.onended = () => this.activeNodes.delete(clang);
        }
    }
    
    _createResonanceSound(startTime) {
        // Tree "thunk" resonance depends on tree size
        const thunk = this.audioCtx.createOscillator();
        thunk.type = 'sine';
        
        // Larger trees have lower resonant frequencies
        const baseFreq = 200 - this.params.chopTreeSize * 30;
        thunk.frequency.value = baseFreq;
        
        // Resonance envelope
        const thunkGain = this.audioCtx.createGain();
        thunkGain.gain.setValueAtTime(0, startTime);
        thunkGain.gain.linearRampToValueAtTime(0.15 + this.params.chopTreeSize * 0.1, startTime + 0.01);
        
        // Larger trees resonate longer
        const decayTime = 0.1 + this.params.chopTreeSize * 0.1;
        thunkGain.gain.exponentialRampToValueAtTime(0.001, startTime + decayTime);
        
        thunk.connect(thunkGain).connect(this.masterGain);
        thunk.start(startTime);
        thunk.stop(startTime + decayTime);
        this.activeNodes.add(thunk);
        thunk.onended = () => this.activeNodes.delete(thunk);
        
        // Additional lower resonances for larger trees
        if (this.params.chopTreeSize > 2) {
            const lowThunk = this.audioCtx.createOscillator();
            lowThunk.type = 'sine';
            lowThunk.frequency.value = baseFreq * 0.5;
            
            const lowGain = this.audioCtx.createGain();
            lowGain.gain.setValueAtTime(0, startTime);
            lowGain.gain.linearRampToValueAtTime(0.1, startTime + 0.02);
            lowGain.gain.exponentialRampToValueAtTime(0.001, startTime + decayTime * 1.5);
            
            lowThunk.connect(lowGain).connect(this.masterGain);
            lowThunk.start(startTime);
            lowThunk.stop(startTime + decayTime * 1.5);
            this.activeNodes.add(lowThunk);
            lowThunk.onended = () => this.activeNodes.delete(lowThunk);
        }
    }
    
    _createSplinterSound(startTime) {
        // Wood splintering - series of short cracks
        const numCracks = 1 + Math.floor(this.params.chopIntensity);
        
        for (let i = 0; i < numCracks; i++) {
            const crackTime = startTime + i * 0.03 * Math.random();
            const crackDuration = 0.02 + Math.random() * 0.03;
            
            // White noise filtered to sound like wood cracking
            const noiseBuffer = this._createNoiseBuffer(crackDuration);
            const noise = this.audioCtx.createBufferSource();
            noise.buffer = noiseBuffer;
            
            const filter = this.audioCtx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 2000 + Math.random() * 2000;
            filter.Q.value = 5 + Math.random() * 5;
            
            const crackGain = this.audioCtx.createGain();
            crackGain.gain.setValueAtTime(0, crackTime);
            crackGain.gain.linearRampToValueAtTime(0.05 + Math.random() * 0.1, crackTime + 0.005);
            crackGain.gain.exponentialRampToValueAtTime(0.001, crackTime + crackDuration);
            
            noise.connect(filter).connect(crackGain).connect(this.masterGain);
            noise.start(crackTime);
            noise.stop(crackTime + crackDuration);
            this.activeNodes.add(noise);
            noise.onended = () => this.activeNodes.delete(noise);
        }
    }
    
    _createLeafRustleSound(startTime) {
        // Implementation of leaf rustling for larger trees
        // Uses filtered noise with gentle envelope
        // Intensity and duration scale with tree size
        
        const rustleDuration = 0.3 + this.params.chopTreeSize * 0.1;
        const rustleIntensity = 0.01 + this.params.chopTreeSize * 0.01; // Subtle sound
        
        // Create noise for rustling
        const noiseBuffer = this._createNoiseBuffer(rustleDuration);
        const noise = this.audioCtx.createBufferSource();
        noise.buffer = noiseBuffer;
        
        // Highpass filter to focus on higher frequencies (leaves are light)
        const highpassFilter = this.audioCtx.createBiquadFilter();
        highpassFilter.type = 'highpass';
        highpassFilter.frequency.value = 3000;
        
        // Bandpass filter to shape the leaf sound
        const bandpassFilter = this.audioCtx.createBiquadFilter();
        bandpassFilter.type = 'bandpass';
        bandpassFilter.frequency.value = 5000 + Math.random() * 2000;
        bandpassFilter.Q.value = 1;
        
        // Envelope for gentle rustling
        const rustleGain = this.audioCtx.createGain();
        rustleGain.gain.setValueAtTime(0, startTime);
        rustleGain.gain.linearRampToValueAtTime(rustleIntensity, startTime + 0.05);
        rustleGain.gain.exponentialRampToValueAtTime(0.001, startTime + rustleDuration);
        
        // Connect the audio graph
        noise.connect(highpassFilter)
             .connect(bandpassFilter)
             .connect(rustleGain)
             .connect(this.masterGain);
        
        noise.start(startTime);
        noise.stop(startTime + rustleDuration);
        this.activeNodes.add(noise);
        noise.onended = () => this.activeNodes.delete(noise);
        
        // Create multiple rustling sounds for larger trees
        if (this.params.chopTreeSize > 2) {
            const numRustles = Math.floor(this.params.chopTreeSize) - 1;
            
            for (let i = 0; i < numRustles; i++) {
                const rustleTime = startTime + Math.random() * 0.2;
                const rustleDur = 0.2 + Math.random() * 0.3;
                
                const rustleNoise = this.audioCtx.createBufferSource();
                rustleNoise.buffer = this._createNoiseBuffer(rustleDur);
                
                const rustleFilter = this.audioCtx.createBiquadFilter();
                rustleFilter.type = 'bandpass';
                rustleFilter.frequency.value = 4000 + Math.random() * 3000;
                rustleFilter.Q.value = 1 + Math.random();
                
                const additionalGain = this.audioCtx.createGain();
                additionalGain.gain.setValueAtTime(0, rustleTime);
                additionalGain.gain.linearRampToValueAtTime(rustleIntensity * 0.7, rustleTime + 0.05);
                additionalGain.gain.exponentialRampToValueAtTime(0.001, rustleTime + rustleDur);
                
                rustleNoise.connect(rustleFilter).connect(additionalGain).connect(this.masterGain);
                rustleNoise.start(rustleTime);
                rustleNoise.stop(rustleTime + rustleDur);
                this.activeNodes.add(rustleNoise);
                rustleNoise.onended = () => this.activeNodes.delete(rustleNoise);
            }
        }
    }
    
    _startChainsawSound() {
        if (this.chainsawNodes) return;
        
        this.chainsawNodes = new Set();
        const currentTime = this.audioCtx.currentTime;
        
        // Basic motor noise - continuous
        const motorNoiseBuffer = this._createNoiseBuffer(2.0); // 2-second buffer that will loop
        const motorNoise = this.audioCtx.createBufferSource();
        motorNoise.buffer = motorNoiseBuffer;
        motorNoise.loop = true;
        
        // Motor body resonance - filtered noise
        const motorFilter = this.audioCtx.createBiquadFilter();
        motorFilter.type = 'bandpass';
        motorFilter.frequency.value = 250;
        motorFilter.Q.value = 5;
        
        // Engine revving effect using LFO
        const revLFO = this.audioCtx.createOscillator();
        revLFO.type = 'sawtooth';
        revLFO.frequency.value = 0.8 + this.params.chopIntensity * 0.2; // Faster revving with higher intensity
        
        const revGain = this.audioCtx.createGain();
        revGain.gain.value = 50; // LFO intensity
        
        // Secondary filter for high-frequency chainsaw sound
        const bladeFilter = this.audioCtx.createBiquadFilter();
        bladeFilter.type = 'bandpass';
        bladeFilter.frequency.value = 2500;
        bladeFilter.Q.value = 8;
        
        // Modulate the blade filter frequency with the LFO
        revLFO.connect(revGain);
        revGain.connect(bladeFilter.frequency);
        
        // Main motor gain
        const motorGain = this.audioCtx.createGain();
        motorGain.gain.value = 0.1 + this.params.chopIntensity * 0.03;
        
        // Connect the motor noise
        motorNoise.connect(motorFilter).connect(motorGain).connect(this.masterGain);
        motorNoise.connect(bladeFilter).connect(motorGain).connect(this.masterGain);
        
        // Start all the nodes
        motorNoise.start(currentTime);
        revLFO.start(currentTime);
        
        // Add to the chainsaw nodes set for later cleanup
        this.chainsawNodes.add(motorNoise);
        this.chainsawNodes.add(revLFO);
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
        const oldToolType = Math.round(this.params.chopTool);
        this.params = { ...this.params, ...newParams };
        const newToolType = Math.round(this.params.chopTool);
        
        // If we're switching to or from chainsaw and already chopping,
        // restart to apply the chainsaw sound correctly
        if (this.isChopping && ((oldToolType === 4 && newToolType !== 4) || 
                               (oldToolType !== 4 && newToolType === 4))) {
            this.stop();
            this.start();
        }
    }
}