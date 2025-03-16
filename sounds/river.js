// river.js
export class RiverSound {
    constructor(audioCtx, masterGain, whiteNoiseBuffer, params) {
        this.audioCtx = audioCtx;
        this.masterGain = masterGain;
        this.whiteNoiseBuffer = whiteNoiseBuffer;
        this.params = {
            riverFlow: params.riverFlow || 0,    // Volume and speed (0-4)
            riverDepth: params.riverDepth || 0    // Low-frequency content (0-4)
        };
        
        // Sound sources and processing nodes
        this.nodes = {
            sources: [],
            filters: [],
            modulators: [],
            gains: []
        };
        
        this.isPlaying = false;
        this.bubbleIntervalId = null;
    }

    start() {
        if (this.params.riverFlow <= 0 || this.isPlaying) return;
        this.isPlaying = true;
        
        // Clear any previous nodes
        this.stop(false);
        
        // Determine water type based on parameters
        const waterType = this._determineWaterType();
        
        // Create base flow sound (continuous component)
        this._createBaseFlow(waterType);
        
        // Add bubbling/splashing sounds if appropriate
        if (waterType !== 'waterfall') {
            this._startBubbleSounds(waterType);
        }
    }
    
    _determineWaterType() {
        const { riverFlow, riverDepth } = this.params;
        
        // Determine water type based on flow and depth parameters
        if (riverFlow < 1.0) {
            return 'trickle'; // Very small stream or trickle
        } else if (riverFlow < 2.0) {
            return 'brook'; // Babbling brook
        } else if (riverFlow < 3.0) {
            return 'stream'; // Medium stream
        } else if (riverFlow >= 3.0 && riverDepth < 2.5) {
            return 'rapids'; // Fast but shallow river
        } else if (riverFlow >= 3.0 && riverDepth >= 2.5) {
            return 'river'; // Deep, flowing river
        } else if (riverFlow >= 3.5 && riverDepth >= 3.5) {
            return 'waterfall'; // Intense flow and depth
        }
        
        return 'stream'; // Default
    }
    
    _createBaseFlow(waterType) {
        // Main continuous flow sound
        const baseSource = this.audioCtx.createBufferSource();
        baseSource.buffer = this.whiteNoiseBuffer;
        baseSource.loop = true;
        this.nodes.sources.push(baseSource);
        
        // Flow/movement filters
        const lowpass = this.audioCtx.createBiquadFilter();
        lowpass.type = 'lowpass';
        
        const highpass = this.audioCtx.createBiquadFilter();
        highpass.type = 'highpass';
        
        // Add resonant peak for character
        const peakFilter = this.audioCtx.createBiquadFilter();
        peakFilter.type = 'peaking';
        
        // Set filter parameters based on water type
        switch (waterType) {
            case 'trickle':
                lowpass.frequency.value = 3000 + this.params.riverFlow * 500;
                highpass.frequency.value = 800 - this.params.riverDepth * 100;
                peakFilter.frequency.value = 1500;
                peakFilter.Q.value = 5;
                peakFilter.gain.value = 6;
                break;
            case 'brook':
                lowpass.frequency.value = 4000 + this.params.riverFlow * 500;
                highpass.frequency.value = 500 - this.params.riverDepth * 80;
                peakFilter.frequency.value = 2000;
                peakFilter.Q.value = 3;
                peakFilter.gain.value = 8;
                break;
            case 'stream':
                lowpass.frequency.value = 2500 + this.params.riverFlow * 400;
                highpass.frequency.value = 300 - this.params.riverDepth * 60;
                peakFilter.frequency.value = 1200;
                peakFilter.Q.value = 2;
                peakFilter.gain.value = 5;
                break;
            case 'rapids':
                lowpass.frequency.value = 5000 + this.params.riverFlow * 300;
                highpass.frequency.value = 200 - this.params.riverDepth * 30;
                peakFilter.frequency.value = 800;
                peakFilter.Q.value = 1;
                peakFilter.gain.value = 10;
                break;
            case 'river':
                lowpass.frequency.value = 1500 + this.params.riverFlow * 200;
                highpass.frequency.value = 80 - this.params.riverDepth * 15;
                peakFilter.frequency.value = 400;
                peakFilter.Q.value = 1;
                peakFilter.gain.value = 3;
                break;
            case 'waterfall':
                lowpass.frequency.value = 6000;
                highpass.frequency.value = 100;
                peakFilter.frequency.value = 2000;
                peakFilter.Q.value = 0.5;
                peakFilter.gain.value = 2;
                break;
        }
        
        this.nodes.filters.push(lowpass, highpass, peakFilter);
        
        // Create multiple modulation oscillators for more natural sound
        this._createFlowModulators(waterType);
        
        // Main gain node
        const mainGain = this.audioCtx.createGain();
        mainGain.gain.value = this._calculateBaseVolume(waterType);
        this.nodes.gains.push(mainGain);
        
        // Connect the nodes
        baseSource.connect(lowpass);
        lowpass.connect(highpass);
        highpass.connect(peakFilter);
        peakFilter.connect(mainGain);
        mainGain.connect(this.masterGain);
        
        // Start the source
        baseSource.start();
    }
    
    _createFlowModulators(waterType) {
        // Create multiple LFOs for more organic modulation
        
        // Amplitude modulator (volume changes)
        const ampModOsc = this.audioCtx.createOscillator();
        ampModOsc.type = 'sine';
        
        // Frequency modulator (timbre changes)
        const freqModOsc = this.audioCtx.createOscillator();
        freqModOsc.type = 'triangle';
        
        // Irregular modulator (adds randomness)
        const irregularOsc = this.audioCtx.createOscillator();
        irregularOsc.type = 'sawtooth';
        
        // Set oscillator frequencies based on water type
        switch (waterType) {
            case 'trickle':
                ampModOsc.frequency.value = 0.8 + this.params.riverFlow * 0.3;
                freqModOsc.frequency.value = 0.3 + this.params.riverFlow * 0.2;
                irregularOsc.frequency.value = 0.1 + Math.random() * 0.2;
                break;
            case 'brook':
                ampModOsc.frequency.value = 0.6 + this.params.riverFlow * 0.4;
                freqModOsc.frequency.value = 0.2 + this.params.riverFlow * 0.2;
                irregularOsc.frequency.value = 0.15 + Math.random() * 0.3;
                break;
            case 'stream':
                ampModOsc.frequency.value = 0.4 + this.params.riverFlow * 0.3;
                freqModOsc.frequency.value = 0.15 + this.params.riverFlow * 0.15;
                irregularOsc.frequency.value = 0.05 + Math.random() * 0.1;
                break;
            case 'rapids':
                ampModOsc.frequency.value = 1.0 + this.params.riverFlow * 0.5;
                freqModOsc.frequency.value = 0.5 + this.params.riverFlow * 0.3;
                irregularOsc.frequency.value = 0.2 + Math.random() * 0.5;
                break;
            case 'river':
                ampModOsc.frequency.value = 0.3 + this.params.riverFlow * 0.1;
                freqModOsc.frequency.value = 0.1 + this.params.riverFlow * 0.05;
                irregularOsc.frequency.value = 0.03 + Math.random() * 0.07;
                break;
            case 'waterfall':
                ampModOsc.frequency.value = 0.2;
                freqModOsc.frequency.value = 0.08;
                irregularOsc.frequency.value = 0.04;
                break;
        }
        
        // Create gain nodes for each modulator
        const ampModGain = this.audioCtx.createGain();
        const freqModGain = this.audioCtx.createGain();
        const irregularGain = this.audioCtx.createGain();
        
        // Set modulation depth based on water type
        switch (waterType) {
            case 'trickle':
                ampModGain.gain.value = 0.4;
                freqModGain.gain.value = 200;
                irregularGain.gain.value = 0.3;
                break;
            case 'brook':
                ampModGain.gain.value = 0.3;
                freqModGain.gain.value = 150;
                irregularGain.gain.value = 0.25;
                break;
            case 'stream':
                ampModGain.gain.value = 0.2;
                freqModGain.gain.value = 100;
                irregularGain.gain.value = 0.15;
                break;
            case 'rapids':
                ampModGain.gain.value = 0.5;
                freqModGain.gain.value = 300;
                irregularGain.gain.value = 0.4;
                break;
            case 'river':
                ampModGain.gain.value = 0.1;
                freqModGain.gain.value = 50;
                irregularGain.gain.value = 0.07;
                break;
            case 'waterfall':
                ampModGain.gain.value = 0.05;
                freqModGain.gain.value = 20;
                irregularGain.gain.value = 0.03;
                break;
        }
        
        // Connect modulators to filters and gains
        // Find the filter and gain nodes to modulate
        const filterToModulate = this.nodes.filters[0]; // lowpass
        const gainToModulate = this.nodes.gains[0]; // main gain
        
        ampModOsc.connect(ampModGain);
        ampModGain.connect(gainToModulate.gain);
        
        freqModOsc.connect(freqModGain);
        freqModGain.connect(filterToModulate.frequency);
        
        irregularOsc.connect(irregularGain);
        irregularGain.connect(gainToModulate.gain);
        
        // Store and start oscillators
        this.nodes.modulators.push(ampModOsc, freqModOsc, irregularOsc);
        this.nodes.gains.push(ampModGain, freqModGain, irregularGain);
        
        ampModOsc.start();
        freqModOsc.start();
        irregularOsc.start();
    }
    
    _startBubbleSounds(waterType) {
        // Create random bubble/splash effects
        let minInterval, maxInterval, chanceToBubble;
        
        switch (waterType) {
            case 'trickle':
                minInterval = 800;
                maxInterval = 2000;
                chanceToBubble = 0.3;
                break;
            case 'brook':
                minInterval = 300;
                maxInterval = 1000;
                chanceToBubble = 0.6;
                break;
            case 'stream':
                minInterval = 200;
                maxInterval = 800;
                chanceToBubble = 0.5;
                break;
            case 'rapids':
                minInterval = 50;
                maxInterval = 300;
                chanceToBubble = 0.8;
                break;
            case 'river':
                minInterval = 500;
                maxInterval = 1500;
                chanceToBubble = 0.4;
                break;
            default:
                minInterval = 500;
                maxInterval = 1500;
                chanceToBubble = 0.5;
        }
        
        // Scale intervals based on flow rate
        const flowScale = 1 - (this.params.riverFlow / 8); // Higher flow = faster bubbles
        minInterval *= flowScale;
        maxInterval *= flowScale;
        
        // Create bubble sounds at random intervals
        this.bubbleIntervalId = setInterval(() => {
            if (Math.random() < chanceToBubble) {
                this._createBubbleSound(waterType);
            }
        }, minInterval + Math.random() * (maxInterval - minInterval));
    }
    
    _createBubbleSound(waterType) {
        if (!this.isPlaying) return;
        
        // Create a short bubble or splash sound
        const bubbleSource = this.audioCtx.createBufferSource();
        bubbleSource.buffer = this.whiteNoiseBuffer;
        
        // Bandpass filter to create bubble tone
        const bubbleFilter = this.audioCtx.createBiquadFilter();
        bubbleFilter.type = 'bandpass';
        
        // Envelope for the bubble
        const bubbleGain = this.audioCtx.createGain();
        bubbleGain.gain.value = 0;
        
        // Set parameters based on water type
        let freq, q, attackTime, decayTime, volume;
        
        switch (waterType) {
            case 'trickle':
                freq = 2000 + Math.random() * 2000;
                q = 20 + Math.random() * 20;
                attackTime = 0.005;
                decayTime = 0.05 + Math.random() * 0.1;
                volume = 0.05 + (this.params.riverFlow / 40);
                break;
            case 'brook':
                freq = 1000 + Math.random() * 3000;
                q = 15 + Math.random() * 15;
                attackTime = 0.01;
                decayTime = 0.1 + Math.random() * 0.2;
                volume = 0.08 + (this.params.riverFlow / 30);
                break;
            case 'stream':
                freq = 500 + Math.random() * 2000;
                q = 10 + Math.random() * 10;
                attackTime = 0.02;
                decayTime = 0.15 + Math.random() * 0.25;
                volume = 0.1 + (this.params.riverFlow / 25);
                break;
            case 'rapids':
                freq = 300 + Math.random() * 3000;
                q = 5 + Math.random() * 10;
                attackTime = 0.01;
                decayTime = 0.05 + Math.random() * 0.2;
                volume = 0.2 + (this.params.riverFlow / 15);
                break;
            case 'river':
                freq = 200 + Math.random() * 1000;
                q = 3 + Math.random() * 8;
                attackTime = 0.05;
                decayTime = 0.2 + Math.random() * 0.4;
                volume = 0.15 + (this.params.riverFlow / 20);
                break;
            default:
                freq = 1000 + Math.random() * 2000;
                q = 10;
                attackTime = 0.02;
                decayTime = 0.1 + Math.random() * 0.3;
                volume = 0.1;
        }
        
        // Apply parameter scaling based on river depth
        // Deeper water = lower pitched bubbles
        freq *= 1 - (this.params.riverDepth / 10);
        
        bubbleFilter.frequency.value = freq;
        bubbleFilter.Q.value = q;
        
        // Set the envelope
        const now = this.audioCtx.currentTime;
        bubbleGain.gain.setValueAtTime(0, now);
        bubbleGain.gain.linearRampToValueAtTime(volume, now + attackTime);
        bubbleGain.gain.exponentialRampToValueAtTime(0.001, now + attackTime + decayTime);
        
        // Connect nodes
        bubbleSource.connect(bubbleFilter);
        bubbleFilter.connect(bubbleGain);
        bubbleGain.connect(this.masterGain);
        
        // Start and automatically clean up
        bubbleSource.start();
        bubbleSource.stop(now + attackTime + decayTime + 0.05);
        
        // Cleanup after bubble sound finishes
        setTimeout(() => {
            bubbleSource.disconnect();
            bubbleFilter.disconnect();
            bubbleGain.disconnect();
        }, (attackTime + decayTime + 0.1) * 1000);
    }
    
    _calculateBaseVolume(waterType) {
        const { riverFlow } = this.params;
        let volume;
        
        switch (waterType) {
            case 'trickle':
                volume = riverFlow / 10; // Very quiet
                break;
            case 'brook':
                volume = riverFlow / 8;
                break;
            case 'stream':
                volume = riverFlow / 6;
                break;
            case 'rapids':
                volume = riverFlow / 5;
                break;
            case 'river':
                volume = riverFlow / 4;
                break;
            case 'waterfall':
                volume = riverFlow / 3; // Loudest
                break;
            default:
                volume = riverFlow / 6;
        }
        
        return Math.min(volume, 0.8); // Cap at 0.8 to prevent clipping
    }

    stop(completeStop = true) {
        // Clean up bubble interval
        if (this.bubbleIntervalId) {
            clearInterval(this.bubbleIntervalId);
            this.bubbleIntervalId = null;
        }
        
        // Stop all audio sources
        this.nodes.sources.forEach(source => {
            try {
                source.stop();
                source.disconnect();
            } catch (e) {
                // Source might already be stopped
            }
        });
        
        // Stop all oscillators
        this.nodes.modulators.forEach(osc => {
            try {
                osc.stop();
                osc.disconnect();
            } catch (e) {
                // Oscillator might already be stopped
            }
        });
        
        // Disconnect all other nodes
        [...this.nodes.filters, ...this.nodes.gains].forEach(node => {
            try {
                node.disconnect();
            } catch (e) {
                // Node might already be disconnected
            }
        });
        
        // Reset nodes collection
        this.nodes = {
            sources: [],
            filters: [],
            modulators: [],
            gains: []
        };
        
        if (completeStop) {
            this.isPlaying = false;
        }
    }

    updateParams(newParams) {
        const oldParams = { ...this.params };
        this.params = { ...this.params, ...newParams };
        
        // If parameters have changed significantly, restart the sound
        const flowDiff = Math.abs(oldParams.riverFlow - this.params.riverFlow);
        const depthDiff = Math.abs(oldParams.riverDepth - this.params.riverDepth);
        
        if (flowDiff > 0.5 || depthDiff > 0.5) {
            // Restart with new parameters if change is significant
            if (this.params.riverFlow <= 0) {
                this.stop();
            } else {
                this.start();
            }
        } else if (this.isPlaying) {
            // For minor changes, adjust existing parameters
            if (this.params.riverFlow <= 0) {
                this.stop();
            } else {
                // Find the main gain node and adjust it
                if (this.nodes.gains.length > 0) {
                    const waterType = this._determineWaterType();
                    this.nodes.gains[0].gain.value = this._calculateBaseVolume(waterType);
                }
                
                // Adjust filter frequencies for subtle changes
                if (this.nodes.filters.length > 0) {
                    const lowpass = this.nodes.filters[0];
                    const depthFactor = 50 + this.params.riverDepth * 25;
                    lowpass.frequency.value = 300 + depthFactor;
                }
            }
        } else if (this.params.riverFlow > 0) {
            this.start();
        }
    }

    playBurst() {
        const originalFlow = this.params.riverFlow;
        // Temporarily increase flow for burst
        this.updateParams({ riverFlow: Math.min(originalFlow + 1, 4) });
        
        // Return to normal after 5 seconds
        setTimeout(() => {
            this.updateParams({ riverFlow: originalFlow });
        }, 5000);
    }
}