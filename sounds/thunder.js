import { SoundGenerator } from './SoundGenerator.js';

export class ThunderSound extends SoundGenerator {
    /**
     * Constructor for ThunderSound, extending SoundGenerator.
     * @param {AudioContext} audioCtx - The Web Audio API AudioContext for sound generation.
     * @param {GainNode} masterGain - The master gain node to connect sounds to.
     * @param {AudioBuffer} whiteNoiseBuffer - Pre-generated white noise buffer.
     * @param {Object} params - Configuration parameters specific to thunder sounds.
     */
    constructor(audioCtx, masterGain, whiteNoiseBuffer, params = {}) {
        // Pass common parameters to parent class
        super(audioCtx, masterGain, {
            thunderFreq: params.thunderFreq || 2,
            thunderDistance: params.thunderDistance || 3
        });
        
        // Store thunder-specific properties
        this.whiteNoiseBuffer = whiteNoiseBuffer;
    }

    /**
     * Starts continuous thunder sounds at random intervals.
     * Overrides the parent's start method.
     */
    start() {
        if (this.params.thunderFreq <= 0 || this.timeout) return;

        const scheduleAheadTime = 10;
        let lastScheduledTime = this.audioCtx.currentTime;

        const scheduler = () => {
            const currentTime = this.audioCtx.currentTime;
            while (lastScheduledTime < currentTime + scheduleAheadTime) {
                const deltaT = -Math.log(1 - Math.random()) / (this.params.thunderFreq / 4);
                lastScheduledTime += deltaT;
                this.scheduleThunder(lastScheduledTime);
            }
            this.timeout = setTimeout(scheduler, 30000);
        };
        scheduler();
    }

    /**
     * Stops continuous thunder sounds.
     * Uses parent's stop method to clean up resources.
     */
    stop() {
        super.stop(); // Call parent's stop method to clear timeout and disconnect nodes
    }

    /**
     * Plays a single instance of thunder.
     * Overrides the parent's playBurst method.
     */
    playBurst() {
        if (this.params.thunderFreq <= 0) return;
        const startTime = this.audioCtx.currentTime;
        this.scheduleThunder(startTime);
        
        // Set a reasonable timeout to clean up resources after the sound finishes
        // Thunder with echoes can last up to ~5-6 seconds
        const burstDuration = 6000; // 6 seconds in milliseconds
        this.timeout = setTimeout(() => {
            // Only clear active nodes, not the timeout itself
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
        }, burstDuration);
    }

    /**
     * Schedules a complete thunder event by coordinating isolated thunder,
     * fractal thunder, and rolling echoes.
     * @param {number} startTime - When to start the thunder sound
     */
    scheduleThunder(startTime) {
        // Create a common gain node for all thunder components
        const thunderGain = this.audioCtx.createGain();
        thunderGain.connect(this.masterGain);
        this.addActiveNode(thunderGain);

        this.scheduleThunderIsolated(startTime, thunderGain);
        this.fractalThunder(startTime, thunderGain);
        this.rollingEchoes(thunderGain);
    }

    /**
     * Generates the initial rumble and, if close, the initial crack.
     * Connects outputs to the provided thunderGain node.
     * @param {number} startTime - Start time of the thunder
     * @param {GainNode} thunderGain - Gain node to connect sources to
     */
    scheduleThunderIsolated(startTime, thunderGain) {
        const maxGain = 1.75;
        const distanceFactor = 1 / (1 + (this.params.thunderDistance / 4) * 2);

        // Rumble source
        const rumbleSource = this.audioCtx.createBufferSource();
        rumbleSource.buffer = this.whiteNoiseBuffer;
        const rumbleFilter = this.audioCtx.createBiquadFilter();
        rumbleFilter.type = 'lowpass';
        rumbleFilter.frequency.value = 100 + 400 / (1 + (this.params.thunderDistance / 4));
        const rumbleGainNode = this.audioCtx.createGain();
        rumbleSource.connect(rumbleFilter).connect(rumbleGainNode).connect(thunderGain);

        const rumbleDuration = 2 + Math.random() * 1;
        const suppressRumble = Math.random() < 0.3;
        rumbleGainNode.gain.setValueAtTime(0, startTime);
        rumbleGainNode.gain.linearRampToValueAtTime(
            suppressRumble ? maxGain * distanceFactor * 0.3 : maxGain * distanceFactor,
            startTime + 0.1
        );
        rumbleGainNode.gain.exponentialRampToValueAtTime(0.001, startTime + rumbleDuration);

        rumbleSource.start(startTime, Math.random() * this.whiteNoiseBuffer.duration, rumbleDuration);
        this.addActiveNode(rumbleSource);
        this.addActiveNode(rumbleFilter);
        this.addActiveNode(rumbleGainNode);

        // Crack for close thunder (distance < 1)
        if (this.params.thunderDistance < 1) {
            const crackSource = this.audioCtx.createBufferSource();
            crackSource.buffer = this.whiteNoiseBuffer;
            const crackFilter = this.audioCtx.createBiquadFilter();
            crackFilter.type = 'bandpass';
            crackFilter.frequency.value = 900;
            crackFilter.Q.value = 5;
            const crackGainNode = this.audioCtx.createGain();
            crackSource.connect(crackFilter).connect(crackGainNode).connect(thunderGain);

            const crackDuration = 0.04;
            crackGainNode.gain.setValueAtTime(0, startTime);
            crackGainNode.gain.linearRampToValueAtTime(0.8 * distanceFactor, startTime + 0.001);
            crackGainNode.gain.exponentialRampToValueAtTime(0.001, startTime + crackDuration);

            crackSource.start(startTime, Math.random() * this.whiteNoiseBuffer.duration, crackDuration);
            this.addActiveNode(crackSource);
            this.addActiveNode(crackFilter);
            this.addActiveNode(crackGainNode);
        }
    }

    /**
     * Adds fractal-like cracks and rumbles, enhancing the thunder complexity.
     * Connects outputs to the provided thunderGain node.
     * @param {number} startTime - Base start time for scheduling
     * @param {GainNode} thunderGain - Gain node to connect sources to
     */
    fractalThunder(startTime, thunderGain) {
        const maxGain = 1.75;
        const distanceFactor = 1 / (1 + (this.params.thunderDistance / 4) * 2);

        const crackMultiplier = Math.random() < 0.2 ? 0 : (0.5 + Math.round(Math.random()));
        const crackCount = crackMultiplier * Math.floor(1 + Math.random() * 4 + (this.params.thunderDistance < 2 ? 2 : 1));
        for (let i = 0; i < crackCount; i++) {
            const crackDelay = i * (0.1 + Math.random() * 0.4);
            const crackAmplitude = maxGain * (this.params.thunderDistance < 1 ? 0.8 : 0.4) * distanceFactor * (0.5 + Math.random() * 0.5);
            const crackStart = startTime + crackDelay;

            // Fractal crack
            const fractalCrackSource = this.audioCtx.createBufferSource();
            fractalCrackSource.buffer = this.whiteNoiseBuffer;
            const fractalCrackFilter = this.audioCtx.createBiquadFilter();
            fractalCrackFilter.type = 'bandpass';
            fractalCrackFilter.frequency.value = 600 + Math.random() * 600;
            fractalCrackFilter.Q.value = 5 + Math.random() * 3;
            const fractalCrackGainNode = this.audioCtx.createGain();
            fractalCrackSource.connect(fractalCrackFilter).connect(fractalCrackGainNode).connect(thunderGain);

            const fractalCrackDuration = 0.02 + Math.random() * 0.02;
            fractalCrackGainNode.gain.setValueAtTime(0, crackStart);
            fractalCrackGainNode.gain.linearRampToValueAtTime(crackAmplitude, crackStart + 0.001);
            fractalCrackGainNode.gain.exponentialRampToValueAtTime(0.001, crackStart + fractalCrackDuration);

            fractalCrackSource.start(crackStart, Math.random() * this.whiteNoiseBuffer.duration, fractalCrackDuration);
            this.addActiveNode(fractalCrackSource);
            this.addActiveNode(fractalCrackFilter);
            this.addActiveNode(fractalCrackGainNode);

            // Rumbling body for fractal crack
            const crackRumbleSource = this.audioCtx.createBufferSource();
            crackRumbleSource.buffer = this.whiteNoiseBuffer;
            const crackRumbleFilter = this.audioCtx.createBiquadFilter();
            crackRumbleFilter.type = 'lowpass';
            crackRumbleFilter.frequency.value = 100 + Math.random() * 100;
            const crackRumbleGainNode = this.audioCtx.createGain();
            crackRumbleSource.connect(crackRumbleFilter).connect(crackRumbleGainNode).connect(thunderGain);

            const crackRumbleDuration = 0.5 + Math.random() * 0.5;
            crackRumbleGainNode.gain.setValueAtTime(0, crackStart);
            crackRumbleGainNode.gain.linearRampToValueAtTime(crackAmplitude * 0.5, crackStart + 0.05);
            crackRumbleGainNode.gain.exponentialRampToValueAtTime(0.001, crackStart + crackRumbleDuration);

            crackRumbleSource.start(crackStart, Math.random() * this.whiteNoiseBuffer.duration, crackRumbleDuration);
            this.addActiveNode(crackRumbleSource);
            this.addActiveNode(crackRumbleFilter);
            this.addActiveNode(crackRumbleGainNode);
        }
    }

    /**
     * Creates procedural rolling echoes with random suppression based on the combined thunder sound.
     * @param {GainNode} thunderGain - Gain node carrying the thunder sound to echo
     */
    rollingEchoes(thunderGain) {
        const maxGain = 1.75;
        const distanceFactor = 1 / (1 + (this.params.thunderDistance / 4) * 2);
        const echoCount = 3 + Math.floor(Math.random() * 3); // 3 to 5 echoes

        for (let i = 0; i < echoCount; i++) {
            if (Math.random() < 0.4) continue; // 40% chance to suppress this echo

            const echoDelayTime = 0.2 + i * (0.5 + Math.random() * 0.5);
            const echoFilterFreq = 80 + 200 / (1 + (this.params.thunderDistance / 4) + i * 0.5);
            const echoGainValue = maxGain * distanceFactor * (1 - i * 0.1) * (Math.random() < 0.5 ? 0.5 : 1);

            // Create echo processing chain
            const echoFilter = this.audioCtx.createBiquadFilter();
            echoFilter.type = 'lowpass';
            echoFilter.frequency.value = echoFilterFreq;

            const echoDelay = this.audioCtx.createDelay(5.0); // Max delay time to accommodate all echoes
            echoDelay.delayTime.value = echoDelayTime;

            const echoGainNode = this.audioCtx.createGain();
            echoGainNode.gain.value = echoGainValue;

            // Connect: thunderGain -> filter -> delay -> gain -> masterGain
            thunderGain.connect(echoFilter);
            echoFilter.connect(echoDelay);
            echoDelay.connect(echoGainNode);
            echoGainNode.connect(this.masterGain);
            
            // Track active nodes for cleanup
            this.addActiveNode(echoFilter);
            this.addActiveNode(echoDelay);
            this.addActiveNode(echoGainNode);
        }
    }
}