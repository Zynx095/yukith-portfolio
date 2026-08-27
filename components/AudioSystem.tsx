"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type AudioSystemProps = {
  chapter: string;
  onDecision: (soundEnabled: boolean) => void;
  showOverlay: boolean;
};

export function AudioSystem({ chapter, onDecision, showOverlay }: AudioSystemProps) {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  const voiceRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize audio elements
    if (typeof window !== 'undefined') {
      bgMusicRef.current = new Audio();
      bgMusicRef.current.loop = true;
      bgMusicRef.current.volume = 0.3; // Soft R&B background

      voiceRef.current = new Audio();
      voiceRef.current.volume = 1.0;
    }

    return () => {
      if (bgMusicRef.current) bgMusicRef.current.pause();
      if (voiceRef.current) voiceRef.current.pause();
    };
  }, []);

  // Update audio based on chapter and mute state
  useEffect(() => {
    if (!soundEnabled || !bgMusicRef.current || !voiceRef.current) return;

    if (isMuted) {
      bgMusicRef.current.pause();
      voiceRef.current.pause();
      return;
    }

    // Determine R&B track based on chapter
    let musicTrack = '/audio/radio/track-01.mp3'; // default soft R&B
    if (['University', 'Engineering'].includes(chapter)) musicTrack = '/audio/radio/track-02.mp3'; // upbeat
    if (['Internships', 'Leadership', 'Hackathons'].includes(chapter)) musicTrack = '/audio/radio/track-03.mp3'; // sophisticated groove

    // Play music if source changed or it's paused
    if (!bgMusicRef.current.src.endsWith(musicTrack) || bgMusicRef.current.paused) {
      bgMusicRef.current.src = musicTrack;
      bgMusicRef.current.play().catch(() => {
        console.log("Background music missing or autoplay blocked.");
      });
    }

    // Play voice narration for the chapter
    const voiceTrack = `/audio/voice/${chapter.toLowerCase()}.mp3`;
    voiceRef.current.src = voiceTrack;
    voiceRef.current.play().catch(() => {
      console.log(`Voice narration missing for chapter: ${chapter}`);
    });

  }, [chapter, soundEnabled, isMuted]);

  const handleDecision = (enable: boolean) => {
    setSoundEnabled(enable);
    onDecision(enable);
  };

  return (
    <>
      {/* Sound Opt-in Overlay */}
      <AnimatePresence>
        {showOverlay && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#17110D]/90 backdrop-blur-md"
          >
            <div className="bg-[#21150F] border border-[#C49A55]/30 p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-md text-center">
              <div className="w-12 h-12 rounded-full border border-[#C49A55]/50 flex items-center justify-center mb-6 text-[#C49A55]">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" /></svg>
              </div>
              <h2 className="text-2xl font-serif text-[#D8C8A8] mb-4">Enhance Your Experience</h2>
              <p className="text-[#8E826C] text-sm mb-8 font-sans">
                This story features voice narration and atmospheric R&B music. Would you like to enable sound?
              </p>
              <div className="flex gap-4 w-full">
                <button 
                  onClick={() => handleDecision(false)}
                  className="flex-1 py-3 px-4 rounded-xl border border-[#3A2418] text-[#BBAF91] hover:bg-[#2B1B13] transition-colors text-sm font-sans"
                >
                  Enter Silently
                </button>
                <button 
                  onClick={() => handleDecision(true)}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-b from-[#C49A55] to-[#D7A85A] text-[#17110D] font-bold shadow-[0_0_20px_rgba(196,154,85,0.3)] hover:shadow-[0_0_30px_rgba(196,154,85,0.5)] transition-shadow text-sm font-sans"
                >
                  Enter With Sound
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Audio Controls */}
      <AnimatePresence>
        {soundEnabled && !showOverlay && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMuted(!isMuted)}
            className="fixed bottom-8 left-8 z-50 w-10 h-10 rounded-full bg-[#21150F]/80 backdrop-blur-sm border border-[#C49A55]/30 text-[#C49A55] flex items-center justify-center hover:bg-[#2B1B13] transition-colors shadow-lg"
          >
            {isMuted ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" /></svg>
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
