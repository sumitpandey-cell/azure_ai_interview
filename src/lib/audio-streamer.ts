export class AudioStreamer extends EventTarget {
    private audioContext: AudioContext | null = null;
    private isPlaying: boolean = false;
    private sampleRate: number = 24000;
    private scheduledTime: number = 0;
    private gainNode: GainNode | null = null;
    private activeSources: number = 0;

    constructor(sampleRate: number = 24000) {
        super();
        this.sampleRate = sampleRate;
    }

    async initialize() {
        this.audioContext = new AudioContext({ sampleRate: this.sampleRate });
        this.gainNode = this.audioContext.createGain();
        this.gainNode.connect(this.audioContext.destination);
        this.scheduledTime = this.audioContext.currentTime;
    }

    addPCM16(chunk: ArrayBuffer) {
        if (!this.audioContext || !this.gainNode) return;

        const float32Array = this.convertInt16ToFloat32(chunk);
        const buffer = this.audioContext.createBuffer(1, float32Array.length, this.sampleRate);
        buffer.getChannelData(0).set(float32Array);

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.gainNode);

        const startTime = Math.max(this.scheduledTime, this.audioContext.currentTime);

        source.onended = () => {
            this.activeSources--;
            if (this.activeSources === 0) {
                this.dispatchEvent(new Event('queue-empty'));
            }
        };

        this.activeSources++;
        source.start(startTime);

        this.scheduledTime = startTime + buffer.duration;
    }

    private convertInt16ToFloat32(buffer: ArrayBuffer): Float32Array {
        const int16 = new Int16Array(buffer);
        const float32 = new Float32Array(int16.length);
        for (let i = 0; i < int16.length; i++) {
            float32[i] = int16[i] / 32768;
        }
        return float32;
    }

    async stop() {
        if (this.audioContext) {
            await this.audioContext.close();
            this.audioContext = null;
            this.gainNode = null;
            this.scheduledTime = 0;
            this.activeSources = 0;
        }
    }

    async suspend() {
        if (this.audioContext && this.audioContext.state === 'running') {
            await this.audioContext.suspend();
        }
    }

    async resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }
}
