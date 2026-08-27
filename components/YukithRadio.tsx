"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, useDragControls } from 'framer-motion';

export interface Track {
  title: string;
  url: string;
}

export const YukithRadio: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const dragControls = useDragControls();

  useEffect(() => {
    audioRef.current = new Audio();
    
    const handleTimeUpdate = () => {
      if (audioRef.current) {
        setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100 || 0);
      }
    };
    
    const handleEnded = () => handleNext();

    audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
    audioRef.current.addEventListener('ended', handleEnded);

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.removeEventListener('ended', handleEnded);
        audioRef.current.pause();
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current && tracks.length > 0) {
      audioRef.current.src = tracks[currentTrackIndex].url;
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
    }
  }, [currentTrackIndex, tracks]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlay = () => {
    if (tracks.length === 0) return;
    
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      audioRef.current?.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const handleNext = () => {
    if (tracks.length === 0) return;
    setCurrentTrackIndex((prev) => (prev + 1) % tracks.length);
  };

  const handlePrev = () => {
    if (tracks.length === 0) return;
    setCurrentTrackIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || tracks.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    audioRef.current.currentTime = percentage * audioRef.current.duration;
  };

  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragMomentum={false}
      className="fixed bottom-6 right-6 z-40 w-72 bg-[#fcf9f2] border-2 border-[#5c4d3c] rounded-2xl shadow-lg overflow-hidden font-sans"
      style={{ touchAction: "none" }}
    >
      <div 
        className="bg-[#5c4d3c] px-4 py-2 flex items-center justify-between cursor-grab active:cursor-grabbing"
        onPointerDown={(e) => dragControls.start(e)}
      >
        <span className="text-[#fcf9f2] text-xs font-bold tracking-widest uppercase">Yukith Radio</span>
        <div className="w-2 h-2 rounded-full bg-[#8c9e83]" />
      </div>

      <div className="p-4 flex flex-col space-y-4">
        <div className="text-center">
          <p className="text-[#5c4d3c] font-medium truncate">
            {tracks.length > 0 ? tracks[currentTrackIndex].title : "No tracks loaded"}
          </p>
          <p className="text-xs text-[#8c9e83] uppercase tracking-wide mt-1">
            {tracks.length > 0 ? "Ready to play" : "Empty State"}
          </p>
        </div>

        {/* Progress Bar */}
        <div 
          className="h-2 w-full bg-[#e6d5b8] rounded-full overflow-hidden cursor-pointer"
          onClick={handleProgressClick}
        >
          <motion.div 
            className="h-full bg-[#8c9e83]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between px-2">
          <button onClick={() => setIsMuted(!isMuted)} className="text-[#5c4d3c] hover:text-[#8c9e83]">
            {isMuted ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
            )}
          </button>

          <div className="flex items-center space-x-4">
            <button onClick={handlePrev} className="text-[#5c4d3c] hover:text-[#8c9e83]">
               <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z"/></svg>
            </button>
            <button 
              onClick={togglePlay} 
              className="w-10 h-10 rounded-full bg-[#5c4d3c] text-[#fcf9f2] flex items-center justify-center hover:bg-[#4a3e30] transition-colors"
            >
              {isPlaying ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
              )}
            </button>
            <button onClick={handleNext} className="text-[#5c4d3c] hover:text-[#8c9e83]">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M11.555 14.832A1 1 0 0013 14v-2.798l5.445 3.63A1 1 0 0020 14V6a1 1 0 00-1.555-.832L13 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z"/><path d="M4.555 14.832A1 1 0 006 14v-2.798l5.445 3.63A1 1 0 0013 14V6a1 1 0 00-1.555-.832L6 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z"/></svg>
            </button>
          </div>

          <div className="w-5" /> {/* Spacer for balance */}
        </div>
      </div>
    </motion.div>
  );
};
