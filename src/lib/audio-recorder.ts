export class AudioRecorder extends EventTarget {
    private stream: MediaStream | null = null;
    private audioContext: AudioContext | null = null;
    private source: MediaStreamAudioSourceNode | null = null;
    private processor: ScriptProcessorNode | null = null;
    private sampleRate = 16000;

    async start() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: this.sampleRate,
                    // Enable browser-native echo cancellation to prevent feedback loop
                    echoCancellation: true,      // Removes echo from speakers
                    noiseSuppression: true,      // Reduces background noise
                    autoGainControl: true,       // Normalizes volume levels
                },
            });

            this.audioContext = new AudioContext({ sampleRate: this.sampleRate });
            this.source = this.audioContext.createMediaStreamSource(this.stream);
            // ScriptProcessorNode is deprecated. AudioWorkletNode should be used for new development.
            this.processor = this.audioContext.createScriptProcessor(2048, 1, 1);

            this.processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);

                // Calculate volume
                let sum = 0;
                for (let i = 0; i < inputData.length; i++) {
                    sum += inputData[i] * inputData[i];
                }
                const volume = Math.sqrt(sum / inputData.length);
                this.dispatchEvent(new CustomEvent("volume", { detail: volume }));

                this.dispatchEvent(new CustomEvent("data", { detail: this.convertFloat32ToInt16(inputData) }));
            };

            this.source.connect(this.processor);
            this.processor.connect(this.audioContext.destination);
        } catch (error) {
            console.error("Error starting audio recording:", error);
            throw error;
        }
    }

    stop() {
        if (this.processor && this.source) {
            this.processor.disconnect();
            this.source.disconnect();
        }
        if (this.audioContext) {
            this.audioContext.close();
        }
        if (this.stream) {
            this.stream.getTracks().forEach((track) => track.stop());
        }
        this.processor = null;
        this.source = null;
        this.audioContext = null;
        this.stream = null;
    }

    private convertFloat32ToInt16(buffer: Float32Array): ArrayBuffer {
        let l = buffer.length;
        const buf = new Int16Array(l);
        while (l--) {
            buf[l] = Math.min(1, Math.max(-1, buffer[l])) * 0x7fff;
        }
        return buf.buffer;
    }
}
