"use client";

import { Scroll } from "@react-three/drei";

export function WorldHUD() {
  return (
    <Scroll html style={{ width: '100%', height: '100%' }}>
            <div style={{ position: 'absolute', top: '30vh', left: '10vw', color: '#F4F1EA' }}>
        <h1 className="text-5xl font-light tracking-widest text-[#CCBBEE] mb-4">Yukith Joseph</h1>
        <p className="text-xl text-[#F4F1EA]/60 tracking-wide">A journey toward the World Tree.</p>
        <p className="text-sm mt-8 text-[#AA99CC]/70 uppercase tracking-[0.3em] animate-pulse">Scroll to explore</p>
      </div>

            <div style={{ position: 'absolute', top: '120vh', right: '10vw', width: '280px', color: '#F4F1EA' }}>
        <h2 className="text-2xl font-light text-[#E3CB8A] mb-2">Early Days</h2>
        <p className="text-sm text-[#F4F1EA]/50 leading-relaxed">
          It started with a notebook, a candle, and a lot of questions.
        </p>
      </div>

            <div style={{ position: 'absolute', top: '220vh', left: '8vw', width: '280px', color: '#F4F1EA' }}>
        <h2 className="text-2xl font-light text-[#315D39] mb-2">First Connection</h2>
        <p className="text-sm text-[#F4F1EA]/50 leading-relaxed">
          A glowing screen in a dark room. The digital realm opened.
        </p>
      </div>

            <div style={{ position: 'absolute', top: '370vh', right: '8vw', width: '280px', color: '#F4F1EA' }}>
        <h2 className="text-2xl font-light text-[#B99755] mb-2">Presidency University</h2>
        <p className="text-sm text-[#F4F1EA]/50 leading-relaxed">
          Building the foundations of cybersecurity and networking.
        </p>
      </div>

            <div style={{ position: 'absolute', top: '520vh', left: '8vw', width: '300px', color: '#F4F1EA' }}>
        <h2 className="text-2xl font-light text-[#E3CB8A] mb-2">AURA</h2>
        <p className="text-xs text-[#B99755] mb-2 tracking-wider uppercase">Autonomous Unified Recognition Assistant</p>
        <p className="text-sm text-[#F4F1EA]/50 leading-relaxed">
          Real-time AI surveillance platform with computer vision tracking.
        </p>
      </div>

            <div style={{ position: 'absolute', top: '670vh', right: '8vw', width: '300px', color: '#F4F1EA' }}>
        <h2 className="text-2xl font-light text-[#315D39] mb-2">ETTH</h2>
        <p className="text-xs text-[#B99755] mb-2 tracking-wider uppercase">Encrypted Traffic Threat Hunter</p>
        <p className="text-sm text-[#F4F1EA]/50 leading-relaxed">
          ML pipeline for encrypted traffic analysis without payload decryption.
        </p>
      </div>

            <div style={{ position: 'absolute', top: '820vh', left: '8vw', width: '300px', color: '#F4F1EA' }}>
        <h2 className="text-2xl font-light text-[#E3CB8A] mb-2">ShadowGuard</h2>
        <p className="text-xs text-[#B99755] mb-2 tracking-wider uppercase">Enterprise AI Data Protection</p>
        <p className="text-sm text-[#F4F1EA]/50 leading-relaxed">
          Defensive architecture for data protection and insider-threat monitoring.
        </p>
      </div>

            <div style={{ position: 'absolute', top: '970vh', right: '8vw', width: '300px', color: '#F4F1EA' }}>
        <h2 className="text-2xl font-light text-[#B99755] mb-2">Sugar AI</h2>
        <p className="text-xs text-[#E3CB8A] mb-2 tracking-wider uppercase">Offline Voice Assistant</p>
        <p className="text-sm text-[#F4F1EA]/50 leading-relaxed">
          Fully offline desktop assistant — Whisper, Ollama, MeloTTS.
        </p>
      </div>

            <div style={{ position: 'absolute', top: '1120vh', left: '8vw', width: '300px', color: '#F4F1EA' }}>
        <h2 className="text-2xl font-light text-[#E3CB8A] mb-2">Milestones</h2>
        <p className="text-sm text-[#F4F1EA]/50 leading-relaxed">
          Hackathons, competitions, and recognition along the path.
        </p>
      </div>

            <div style={{ 
        position: 'absolute', 
        top: '1600vh', 
        left: '50%', 
        transform: 'translateX(-50%)', 
        textAlign: 'center', 
        width: '400px', 
        color: '#F4F1EA' 
      }}>
        <h2 className="text-4xl font-light text-[#CCBBEE] mb-4">The World Tree</h2>
        <p className="text-base text-[#F4F1EA]/60 mb-6 leading-relaxed">
          Every project is a branch. Every skill is a root.<br/>
          The journey became the tree.
        </p>
      </div>
    </Scroll>
  );
}
