/**
 * Base class for all sound generators, providing common audio node management and playback utilities.
 * @class SoundGenerator
 */
export class SoundGenerator {
    /**
     * Creates a new SoundGenerator instance.
     * @param {AudioContext} audioCtx - The Web Audio API AudioContext for sound generation.
     * @param {GainNode} masterGain - The master gain node to connect sounds to.
     * @param {Object} [params={}] - Configuration parameters specific to the sound.
     */
    constructor(audioCtx, masterGain, params = {}) {
        this.audioCtx = audioCtx;
        this.masterGain = masterGain;
        this.params = { ...params }; // Deep copy to avoid mutation
        this.activeNodes = new Set();
        this.timeouts = [];
        this.isStopped = false;
    }

    /**
     * Plays a set of frequencies with an ADSR envelope.
     * @param {number[]} frequencies - Array of frequencies to play.
     * @param {number} duration - Duration of the sound in seconds (Infinity for continuous).
     * @param {GainNode} [output=this.masterGain] - Output gain node to connect to.
     * @param {Object} [options={}] - Override params like attack, decay, sustain, release.
     * @returns {GainNode} The gain node for dynamic adjustments.
     */
    playNotes(frequencies, duration, output = this.masterGain, options = {}) {
        const now = this.audioCtx.currentTime;
        const gain = this.audioCtx.createGain();
        const { attack = 0.05, decay = 0.1, sustain = 0.7, release = 0.2 } = { ...this.params, ...options };

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(1, now + attack);
        gain.gain.linearRampToValueAtTime(sustain, now + attack + decay);
        if (duration !== Infinity) {
            gain.gain.linearRampToValueAtTime(0, now + attack + decay + duration);
        }

        gain.connect(output);
        this.addActiveNode(gain);

        frequencies.forEach(freq => this.createSound(freq, gain, options));
        return gain;
    }

    /**
     * Abstract method to create a specific sound (e.g., oscillator, noise).
     * @param {number} frequency - Frequency to generate.
     * @param {GainNode} output - Output node to connect to.
     * @param {Object} [options={}] - Additional options for sound creation.
     * @throws {Error} Must be implemented by subclasses.
     */
    createSound(frequency, output, options = {}) {
        throw new Error('createSound() must be implemented by subclass');
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
     * Schedules a callback to execute after a delay.
     * @param {Function} callback - Function to execute.
     * @param {number} delayMs - Delay in milliseconds.
     * @returns {number} Timeout ID for tracking.
     */
    scheduleSound(callback, delayMs) {
        if (this.isStopped) return;
        const timeout = setTimeout(() => {
            if (!this.isStopped) callback();
        }, delayMs);
        this.timeouts.push(timeout);
        return timeout;
    }

    /**
     * Stops all active sounds and cleans up resources.
     * @param {boolean} [immediate=false] - If true, stops immediately without release.
     */
    stop(immediate = false) {
        this.isStopped = true;
        this.timeouts.forEach(clearTimeout);
        this.timeouts = [];

        this.activeNodes.forEach(node => {
            if (node instanceof GainNode) {
                node.gain.cancelScheduledValues(this.audioCtx.currentTime);
                if (immediate) node.gain.setValueAtTime(0, this.audioCtx.currentTime);
                else node.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + (this.params.release || 0.2));
            }
            if (typeof node.stop === 'function') node.stop(immediate ? 0 : undefined);

            node.disconnect();
        });
        this.activeNodes.clear();
        this.isStopped = false;
    }

    /**
     * Updates sound parameters by merging with existing ones.
     * @param {Object} newParams - New parameters to apply.
     */
    updateParams(newParams) {
        this.params = { ...this.params, ...newParams };
    }

    /**
     * Adds an audio node to the active set and sets up cleanup.
     * @param {AudioNode} node - Node to track (e.g., OscillatorNode, GainNode).
     */
    addActiveNode(node) {
        this.activeNodes.add(node);
        if (node.onended) node.onended = () => this.activeNodes.delete(node);
    }

    /**
     * Creates a white noise buffer.
     * @param {number} duration - Duration in seconds.
     * @returns {AudioBuffer} Generated noise buffer.
     */
    createNoiseBuffer(duration) {
        const bufferSize = this.audioCtx.sampleRate * duration;
        const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
        return buffer;
    }
}