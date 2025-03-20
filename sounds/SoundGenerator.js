export class SoundGenerator {
    /**
     * Constructor initializes the common properties shared by all sound generators.
     * @param {AudioContext} audioCtx - The Web Audio API AudioContext for sound generation.
     * @param {GainNode} masterGain - The master gain node to connect sounds to.
     * @param {Object} params - Configuration parameters specific to the sound.
     */
    constructor(audioCtx, masterGain, params) {
        this.audioCtx = audioCtx;
        this.masterGain = masterGain;
        this.params = params || {}; // Default to empty object if no params provided
        this.activeNodes = new Set(); // Tracks active audio nodes (sources, oscillators, etc.)
        this.timeout = null; // Reference to a scheduling timeout or interval
    }

    /**
     * Starts the sound, either continuously or as a one-shot, depending on the subclass.
     * Subclasses should override this method to implement specific behavior.
     */
    start() {
        // Default implementation does nothing; to be overridden by subclasses
        console.log('start() not implemented by subclass');
    }

    /**
     * Stops all active sounds and cleans up resources.
     * Can be overridden by subclasses if additional cleanup is needed.
     */
    stop() {
        // Clear any scheduled timeout
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }

        // Stop and disconnect all active nodes
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
    }

    /**
     * Plays a single burst or instance of the sound.
     * Subclasses should override this method to define the burst behavior.
     */
    playBurst() {
        // Default implementation does nothing; to be overridden by subclasses
        console.log('playBurst() not implemented by subclass');
    }

    /**
     * Updates the sound parameters by merging new parameters with existing ones.
     * @param {Object} newParams - New parameters to update.
     */
    updateParams(newParams) {
        this.params = { ...this.params, ...newParams };
    }

    /**
     * Adds an audio node to the activeNodes set and sets up cleanup on end.
     * @param {AudioNode} node - The audio node to manage (e.g., OscillatorNode, AudioBufferSourceNode).
     */
    addActiveNode(node) {
        this.activeNodes.add(node);
        if (node.onended) {
            node.onended = () => this.activeNodes.delete(node);
        }
    }

    /**
     * Creates a white noise buffer of specified duration.
     * @param {number} duration - Duration of the noise buffer in seconds.
     * @returns {AudioBuffer} - The generated noise buffer.
     */
    createNoiseBuffer(duration) {
        const bufferSize = this.audioCtx.sampleRate * duration;
        const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1; // White noise: -1 to 1
        }
        return buffer;
    }
}