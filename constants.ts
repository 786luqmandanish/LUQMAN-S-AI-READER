import { VoiceName, VoiceOption } from './types';

export const VOICE_OPTIONS: VoiceOption[] = [
  {
    id: VoiceName.Puck,
    label: 'Puck',
    description: 'Energetic & clear',
    gender: 'Male',
  },
  {
    id: VoiceName.Kore,
    label: 'Kore',
    description: 'Calm & soothing',
    gender: 'Female',
  },
  {
    id: VoiceName.Fenrir,
    label: 'Fenrir',
    description: 'Deep & authoritative',
    gender: 'Male',
  },
  {
    id: VoiceName.Charon,
    label: 'Charon',
    description: 'Steady & professional',
    gender: 'Male',
  },
  {
    id: VoiceName.Zephyr,
    label: 'Zephyr',
    description: 'Soft & gentle',
    gender: 'Female',
  },
];

export const MAX_TEXT_LENGTH = 5000; // Safe limit for single generation pass
