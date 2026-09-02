"use client";

import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AudioSystemProps {
  chapter?: string;
  showOverlay?: boolean;
  onDecision?: (enabled: boolean) => void;
}

export default function AudioSystem({ chapter = 'ambient', showOverlay = false, onDecision }: AudioSystemProps) {
  const [isMuted, setIsMuted] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showPrompt, setShowPrompt] = useState(showOverlay);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {

    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  useEffect(() => {
    if (!audioRef.current || isMuted || !hasInteracted) return;

    const playTrack = async () => {
      try {
        if (audioRef.current) {
          audioRef.current.src = `/audio/radio/${chapter}.mp3`;
          await audioRef.current.play();
        }
      } catch (e) {

      }
    };
    
    playTrack();
  }, [chapter, isMuted, hasInteracted]);

  const handleEnableSound = () => {
    setHasInteracted(true);
    setIsMuted(false);
    setShowPrompt(false);
    if (onDecision) onDecision(true);
  };

  const handleDisableSound = () => {
    setHasInteracted(true);
    setIsMuted(true);
    setShowPrompt(false);
    if (onDecision) onDecision(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!hasInteracted) setHasInteracted(true);
    
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
    }
  };

  return (
    <>
      <AnimatePresence>
        {showPrompt && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-[#0D0A08]/90 backdrop-blur-sm flex items-center justify-center"
          >
            <div className="bg-[#15100C] border border-[#3A2417] p-8 rounded-xl max-w-md w-full mx-4 text-center">
              <h2 className="font-serif text-2xl text-[#E3CB8A] mb-4">Enable Audio Experience?</h2>
              <p className="text-[#D8C9A8] mb-8 font-mono text-sm leading-relaxed">
                This portfolio features a cinematic soundtrack and narrative voiceover. 
                For the best experience, we recommend enabling sound.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={handleEnableSound}
                  className="px-6 py-3 bg-[#E3CB8A] text-[#0D0A08] rounded font-mono text-sm uppercase tracking-wider hover:bg-[#B99755] transition-colors"
                >
                  Enable Sound
                </button>
                <button 
                  onClick={handleDisableSound}
                  className="px-6 py-3 border border-[#3A2417] text-[#8E826C] rounded font-mono text-sm uppercase tracking-wider hover:bg-[#3A2417] hover:text-[#F4F1EA] transition-colors"
                >
                  Stay Silent
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={toggleMute}
        className="fixed bottom-6 right-6 z-[90] w-12 h-12 bg-[#15100C]/80 backdrop-blur border border-[#3A2417] rounded-full flex items-center justify-center text-[#E3CB8A] hover:bg-[#3A2417] hover:scale-110 transition-all cursor-pointer"
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>
    </>
  );
}
