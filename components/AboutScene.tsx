"use client";

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { profileData } from '@/src/data/profile';
import { skillsData } from '@/src/data/skills';
import { educationData } from '@/src/data/education';
import { leadershipData } from '@/src/data/leadership';

gsap.registerPlugin(ScrollTrigger);

export default function AboutScene() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".about-reveal", 
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.1,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
          }
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="about" ref={sectionRef} className="py-24 px-6 md:px-12 bg-[#F4F1EA] text-[#3A2417]">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-serif text-[#12351F] font-bold mb-12 border-b border-[#3A2417]/20 pb-4 about-reveal">
          ABOUT
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Intro & Education */}
          <div className="lg:col-span-1 space-y-12">
            <div className="about-reveal">
              <h3 className="text-2xl font-serif text-[#12351F] mb-4">Background</h3>
              <p className="font-sans leading-relaxed text-[#3A2417]">
                Hi, I'm {profileData.name}, a passionate student studying {profileData.degree}. 
                My focus areas include {profileData.primaryFocus.join(', ')}. I enjoy building robust applications and exploring the intersection of technology and creativity.
              </p>
            </div>

            <div className="about-reveal">
              <h3 className="text-2xl font-serif text-[#12351F] mb-4">Education</h3>
              {educationData.map((edu, idx) => (
                <div key={idx} className="w-full sm:min-w-[280px] bg-white/50 border border-[#3A2417]/20 p-6 rounded-lg mb-4">
                  <h4 className="font-bold font-sans text-lg text-[#12351F]">{edu.degree}</h4>
                  <p className="font-sans text-[#3A2417] mb-2">{edu.institution} | {edu.period}</p>
                  <p className="font-mono text-sm text-[#51321E] mb-3">CGPA: {edu.cgpa}</p>
                  <div className="flex flex-wrap gap-2">
                    {edu.coursework.map((course: string, i: number) => (
                      <span key={i} className="text-xs font-mono bg-[#12351F]/5 text-[#12351F] px-2 py-1 rounded">
                        {course}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Skills, Leadership, Certs */}
          <div className="lg:col-span-2 space-y-12">
            <div className="about-reveal">
              <h3 className="text-2xl font-serif text-[#12351F] mb-6">Skills & Technologies</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {Object.entries(skillsData).map(([category, skills]: [string, any], idx) => (
                  <div key={idx} className="bg-white/40 p-5 rounded border border-[#3A2417]/10">
                    <h4 className="font-serif font-bold text-[#51321E] mb-3 capitalize">{category}</h4>
                    <ul className="space-y-2">
                      {skills.map((skill: string, i: number) => (
                        <li key={i} className="font-mono text-sm text-[#3A2417] flex items-center before:content-['▹'] before:mr-2 before:text-[#B99755]">
                          {skill}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="about-reveal md:col-span-2">
                <h3 className="text-2xl font-serif text-[#12351F] mb-4">Leadership</h3>
                <div className="space-y-4">
                  {leadershipData.map((item, idx) => (
                    <div key={idx} className="border-l-2 border-[#B99755] pl-4">
                      <h4 className="font-bold font-sans text-[#12351F]">{item.role}</h4>
                      <p className="text-sm font-sans text-[#51321E]">{item.eventOrClub}{item.organization ? ` | ${item.organization}` : ''} | {item.period}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
