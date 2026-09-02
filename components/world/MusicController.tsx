"use client";

import { useState, useEffect, useRef } from "react";

interface MusicControllerProps {
  isPlaying?: boolean;
}

const AVAILABLE_AUDIO_FILES: string[] = [

];

export function MusicController({ isPlaying: initialPlaying = false }: MusicControllerProps) {
  const [isPlaying, setIsPlaying] = useState(initialPlaying);
  const [volume, setVolume] = useState(0.3);
  const [isMuted, setIsMuted] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasInteracted = useRef(false);

  useEffect(() => {

    if (AVAILABLE_AUDIO_FILES.length > 0) {
      const audio = new Audio(AVAILABLE_AUDIO_FILES[0]);
      audio.loop = true;
      audio.volume = volume;
      audioRef.current = audio;
      setHasAudio(true);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlay = async () => {
    if (!audioRef.current) return;
    
    try {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        await audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } catch (e) {
      console.log("Audio playback failed:", e);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  if (!hasAudio) {
    return (
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 opacity-50" title="No audio file available">
        <button
          className="w-10 h-10 rounded-full bg-[#1A2A15]/80 border border-[#3A5A35]/30 flex items-center justify-center text-[#6A7A65] cursor-not-allowed"
          disabled
          aria-label="No audio available"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2">
            <button
        onClick={togglePlay}
        className="w-10 h-10 rounded-full bg-[#1A2A15]/80 border border-[#3A5A35]/50 flex items-center justify-center text-[#C8D4C8] hover:bg-[#2A4A25]/90 hover:text-[#E3CB8A] hover:border-[#E3CB8A]/50 transition-all duration-300 hover:scale-110"
        aria-label={isPlaying ? "Pause music" : "Play music"}
      >
        {isPlaying ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        )}
      </button>

            <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={volume}
        onChange={(e) => setVolume(parseFloat(e.target.value))}
        className="w-16 accent-[#E3CB8A] opacity-70 hover:opacity-100"
        aria-label="Volume"
      />

            <button
        onClick={toggleMute}
        className="w-8 h-8 rounded-full bg-[#1A2A15]/60 border border-[#3A5A35]/30 flex items-center justify-center text-[#C8D4C8] hover:bg-[#2A4A25]/60 hover:text-[#E3CB8A] transition-all duration-300"
        aria-label={isMuted ? "Unmute music" : "Mute music"}
      >
        {isMuted ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
          </svg>
        )}
      </button>
    </div>
  );
}
