import React from 'react';
import { VoiceOption, VoiceName } from '../types';
import { VOICE_OPTIONS } from '../constants';

interface VoiceSelectorProps {
  selectedVoice: VoiceName;
  onSelect: (voice: VoiceName) => void;
  disabled?: boolean;
}

const VoiceSelector: React.FC<VoiceSelectorProps> = ({ selectedVoice, onSelect, disabled }) => {
  return (
    <div className="w-full space-y-2">
      <label className="text-sm font-medium text-slate-400 uppercase tracking-wider">
        Select AI Voice
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {VOICE_OPTIONS.map((voice: VoiceOption) => (
          <button
            key={voice.id}
            onClick={() => onSelect(voice.id)}
            disabled={disabled}
            className={`
              relative p-4 rounded-xl border text-left transition-all duration-200
              ${
                selectedVoice === voice.id
                  ? 'bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500'
                  : 'bg-slate-900 border-slate-700 hover:border-slate-500 hover:bg-slate-800'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className="flex items-center justify-between">
                <span className={`font-semibold ${selectedVoice === voice.id ? 'text-indigo-400' : 'text-slate-200'}`}>
                    {voice.label}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-950 text-slate-400 border border-slate-800">
                    {voice.gender}
                </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">{voice.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default VoiceSelector;