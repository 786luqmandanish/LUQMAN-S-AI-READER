export const decodeAudioData = async (
  base64String: string,
  audioContext: AudioContext
): Promise<AudioBuffer> => {
  try {
    // 1. Decode Base64 to binary string
    const binaryString = atob(base64String);
    const len = binaryString.length;
    
    // 2. Convert binary string to Uint8Array
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // 3. Create Int16Array from the buffer (PCM 16-bit)
    // Note: This assumes Little Endian, which is standard for the data received.
    const dataInt16 = new Int16Array(bytes.buffer);
    
    // Gemini 2.5 TTS uses 24kHz sample rate and mono audio
    const numChannels = 1;
    const sampleRate = 24000; 
    const frameCount = dataInt16.length / numChannels;

    // 4. Create AudioBuffer
    const buffer = audioContext.createBuffer(numChannels, frameCount, sampleRate);
    
    // 5. Fill buffer with converted float data [-1.0, 1.0]
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }
    
    return buffer;
  } catch (error) {
    console.error("Error decoding audio data:", error);
    throw new Error("Failed to decode audio data.");
  }
};

export class AudioController {
  private context: AudioContext;
  private source: AudioBufferSourceNode | null = null;
  private startTime: number = 0;
  private pauseTime: number = 0;
  private isPlaying: boolean = false;
  private buffer: AudioBuffer | null = null;
  private onEnded: () => void;

  // Analyser for visualization
  public analyser: AnalyserNode;

  constructor(onEnded: () => void) {
    this.context = new (window.AudioContext || window.webkitAudioContext)();
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 256;
    this.onEnded = onEnded;
  }

  async loadAudio(base64: string): Promise<AudioBuffer> {
    this.buffer = await decodeAudioData(base64, this.context);
    return this.buffer;
  }

  play(offset: number = 0) {
    if (!this.buffer) return;
    
    // Resume context if suspended (browser autoplay policy)
    if (this.context.state === 'suspended') {
      this.context.resume();
    }

    this.source = this.context.createBufferSource();
    this.source.buffer = this.buffer;
    this.source.connect(this.analyser);
    this.analyser.connect(this.context.destination);

    this.source.onended = () => {
        // Only trigger onEnded if we didn't manually stop it
        if (this.isPlaying) { 
           this.isPlaying = false;
           this.onEnded();
        }
    };

    const startOffset = offset || this.pauseTime;
    this.startTime = this.context.currentTime - startOffset;
    this.source.start(0, startOffset);
    this.isPlaying = true;
  }

  pause() {
    if (this.source && this.isPlaying) {
      this.source.stop();
      this.pauseTime = this.context.currentTime - this.startTime;
      this.isPlaying = false;
      this.source = null;
    }
  }

  stop() {
    if (this.source) {
      try {
        this.source.stop();
      } catch (e) {
        // Ignore if already stopped
      }
    }
    this.pauseTime = 0;
    this.isPlaying = false;
    this.source = null;
  }

  seek(time: number) {
    const wasPlaying = this.isPlaying;
    this.stop();
    this.pauseTime = time;
    if (wasPlaying) {
      this.play();
    }
  }

  getCurrentTime(): number {
    if (!this.isPlaying) return this.pauseTime;
    return this.context.currentTime - this.startTime;
  }

  getDuration(): number {
    return this.buffer?.duration || 0;
  }
  
  getContext(): AudioContext {
    return this.context;
  }
}