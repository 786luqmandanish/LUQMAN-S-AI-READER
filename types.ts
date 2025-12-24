export enum VoiceName {
  Kore = 'Kore',
  Puck = 'Puck',
  Charon = 'Charon',
  Fenrir = 'Fenrir',
  Zephyr = 'Zephyr',
}

export interface VoiceOption {
  id: VoiceName;
  label: string;
  description: string;
  gender: 'Male' | 'Female';
}

export interface AudioState {
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  audioBuffer: AudioBuffer | null;
  error: string | null;
}

// Minimal typing for the global PDF.js library
export interface PdfJsLib {
  getDocument: (data: Uint8Array) => {
    promise: Promise<{
      numPages: number;
      getPage: (pageNumber: number) => Promise<{
        getTextContent: () => Promise<{
          items: Array<{ str: string }>;
        }>;
      }>;
    }>;
  };
}

declare global {
  interface Window {
    pdfjsLib: PdfJsLib;
    // For Web Audio API webkit prefix support
    webkitAudioContext: typeof AudioContext;
  }
}