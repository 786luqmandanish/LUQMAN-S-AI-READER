import React, { useState, useRef, useEffect, useCallback } from 'react';
import AppHeader from './components/AppHeader';
import VoiceSelector from './components/VoiceSelector';
import AudioVisualizer from './components/AudioVisualizer';
import { VoiceName } from './types';
import { generateSpeech } from './services/geminiService';
import { AudioController } from './services/audioService';
import { extractTextFromPdf } from './services/pdfService';
import { MAX_TEXT_LENGTH } from './constants';

const App: React.FC = () => {
  const [text, setText] = useState<string>('');
  const [voice, setVoice] = useState<VoiceName>(VoiceName.Zephyr);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const audioControllerRef = useRef<AudioController | null>(null);
  const animationRef = useRef<number>();

  // Initialize audio controller once
  useEffect(() => {
    audioControllerRef.current = new AudioController(() => {
        setIsPlaying(false);
    });
    return () => {
      audioControllerRef.current?.stop();
    };
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    setError(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsLoading(true);

    try {
      if (file.type === 'application/pdf') {
        const extractedText = await extractTextFromPdf(file);
        setText(extractedText.slice(0, MAX_TEXT_LENGTH));
        if (extractedText.length > MAX_TEXT_LENGTH) {
            setError(`Text truncated. Maximum length is ${MAX_TEXT_LENGTH} characters.`);
        }
      } else if (file.type.startsWith('text/')) {
        const text = await file.text();
        setText(text.slice(0, MAX_TEXT_LENGTH));
      } else {
        setError("Unsupported file format. Please upload PDF or Text files.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to process file. Please try again.");
    } finally {
      setIsLoading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleGenerate = async () => {
    if (!text.trim()) {
      setError("Please enter some text or upload a document.");
      return;
    }

    // Stop current playback if any
    audioControllerRef.current?.stop();
    setIsPlaying(false);
    setIsLoading(true);
    setError(null);

    try {
      const audioBase64 = await generateSpeech(text, voice);
      if (audioControllerRef.current) {
        await audioControllerRef.current.loadAudio(audioBase64);
        setDuration(audioControllerRef.current.getDuration());
        // Auto play on generate
        audioControllerRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) {
      setError("Failed to generate speech. Please check your API key or try a shorter text.");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlayPause = () => {
    if (!audioControllerRef.current) return;

    if (isPlaying) {
      audioControllerRef.current.pause();
    } else {
      audioControllerRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Update progress bar
  const updateProgress = useCallback(() => {
    if (audioControllerRef.current && isPlaying) {
      setCurrentTime(audioControllerRef.current.getCurrentTime());
      animationRef.current = requestAnimationFrame(updateProgress);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(updateProgress);
    } else {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    }
    return () => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, updateProgress]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    audioControllerRef.current?.seek(time);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <AppHeader />

      <main className="flex-grow container max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
          
          {/* Left Column: Input */}
          <div className="flex flex-col gap-6">
            
            {/* File Upload Area */}
            <div className="p-6 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-900/50 hover:bg-slate-900 transition-colors group">
              <label className="flex flex-col items-center justify-center cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-slate-700 transition-colors mb-3">
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-slate-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-slate-300">Upload PDF or Text File</span>
                <span className="text-xs text-slate-500 mt-1">Extracts text automatically</span>
                <input type="file" className="hidden" accept=".txt,.pdf" onChange={handleFileUpload} />
              </label>
            </div>

            {/* Text Area */}
            <div className="flex-grow flex flex-col relative">
               <label className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-2">
                Or Paste Text
              </label>
              <textarea
                value={text}
                onChange={handleTextChange}
                placeholder="Paste book content, articles, or notes here..."
                className="w-full flex-grow min-h-[300px] bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 resize-none leading-relaxed"
                maxLength={MAX_TEXT_LENGTH}
              />
              <div className="absolute bottom-4 right-4 text-xs text-slate-500 bg-slate-900/80 px-2 py-1 rounded">
                {text.length}/{MAX_TEXT_LENGTH}
              </div>
            </div>
          </div>

          {/* Right Column: Controls & Output */}
          <div className="flex flex-col gap-6">
            
            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-lg flex items-start gap-3">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-400 mt-0.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}

            <VoiceSelector selectedVoice={voice} onSelect={setVoice} disabled={isLoading} />

            {/* Main Action Button */}
            <button
              onClick={handleGenerate}
              disabled={isLoading || !text.trim()}
              className={`
                w-full py-4 rounded-xl font-bold text-lg shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2 transition-all
                ${isLoading || !text.trim()
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:scale-[1.02] active:scale-[0.98]'
                }
              `}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Generating Audio...</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                  </svg>
                  <span>Generate & Play</span>
                </>
              )}
            </button>

            {/* Audio Player Panel */}
            <div className={`
              bg-slate-900 rounded-xl p-6 border border-slate-700 transition-all duration-500
              ${duration > 0 ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-4 pointer-events-none grayscale'}
            `}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-slate-300 font-semibold">Now Playing</h3>
                <span className="text-xs font-mono text-indigo-400 bg-indigo-900/30 px-2 py-1 rounded">
                  {voice} Voice
                </span>
              </div>

              {/* Visualizer */}
              <div className="mb-6">
                <AudioVisualizer 
                  analyser={audioControllerRef.current?.analyser || null} 
                  isPlaying={isPlaying} 
                />
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <input
                  type="range"
                  min="0"
                  max={duration}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
                />
                <div className="flex justify-between mt-2 text-xs text-slate-500 font-mono">
                  <span>{new Date(currentTime * 1000).toISOString().substr(14, 5)}</span>
                  <span>{new Date(duration * 1000).toISOString().substr(14, 5)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex justify-center items-center gap-6">
                 <button 
                  onClick={() => {
                    const newTime = Math.max(0, currentTime - 10);
                    setCurrentTime(newTime);
                    audioControllerRef.current?.seek(newTime);
                  }}
                  className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  title="-10s"
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                 </button>

                 <button 
                   onClick={togglePlayPause}
                   className="w-14 h-14 rounded-full bg-white text-slate-950 flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-white/10"
                 >
                    {isPlaying ? (
                       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 ml-0.5">
                        <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                      </svg>
                    )}
                 </button>

                 <button 
                  onClick={() => {
                    const newTime = Math.min(duration, currentTime + 10);
                    setCurrentTime(newTime);
                    audioControllerRef.current?.seek(newTime);
                  }}
                  className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  title="+10s"
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                 </button>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default App;