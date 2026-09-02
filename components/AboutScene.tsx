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
      <div className="max-w-7xl mx-auto relative z-10">
        <h2 className="text-4xl md:text-5xl font-serif text-[#12351F] font-bold mb-12 flex items-center gap-4 about-reveal">
          ABOUT
          <div className="h-[2px] flex-grow bg-gradient-to-r from-[#3A2417] to-transparent rounded-full opacity-30"></div>
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-1 space-y-12">
            <div className="about-reveal">
              <h3 className="text-2xl font-serif text-[#12351F] mb-4 flex items-center">
                <span className="text-[#B99755] mr-2 text-xl">✤</span> Background
              </h3>
              <p className="font-sans leading-relaxed text-[#3A2417]">
                Hi, I'm {profileData.name}, a passionate student studying {profileData.degree}. 
                My focus areas include {profileData.primaryFocus.join(', ')}. I enjoy building robust applications and exploring the intersection of technology and creativity.
              </p>
            </div>

            <div className="about-reveal relative">
                            <div className="absolute -left-6 top-0 w-px h-full bg-gradient-to-b from-[#3A2417]/20 via-[#3A2417]/40 to-transparent rounded-full hidden md:block"></div>
              
              <h3 className="text-2xl font-serif text-[#12351F] mb-4 flex items-center">
                <span className="text-[#B99755] mr-2 text-xl">✤</span> Education
              </h3>
              {educationData.map((edu, idx) => (
                <div key={idx} className="w-full sm:min-w-[280px] bg-[#F4F1EA] border-l-2 border-[#12351F]/40 pl-4 py-2 mb-6">
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

                    <div className="lg:col-span-2 space-y-12">
            <div className="about-reveal relative">
                            <div className="absolute -left-6 top-0 w-px h-full bg-gradient-to-b from-[#3A2417]/20 via-[#3A2417]/40 to-transparent rounded-full hidden md:block"></div>

              <h3 className="text-2xl font-serif text-[#12351F] mb-6 flex items-center">
                <span className="text-[#B99755] mr-2 text-xl">✤</span> Skills & Technologies
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {skillsData.map((categoryGroup, idx) => (
                  <div key={idx} className="bg-white/40 p-5 rounded border border-[#3A2417]/10 relative overflow-hidden group hover:border-[#12351F]/30 transition-colors">
                                        <div className="absolute -right-8 -bottom-8 w-24 h-24 border border-[#315D39]/10 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
                    
                    <h4 className="font-serif font-bold text-[#51321E] mb-3 capitalize relative z-10">{categoryGroup.title}</h4>
                    <ul className="space-y-2 relative z-10">
                      {categoryGroup.skills.map((skill: string, i: number) => (
                        <li key={i} className="font-mono text-sm text-[#3A2417] flex items-center">
                          <span className="text-[#B99755] mr-2 text-[10px]">🌿</span> {skill}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="about-reveal md:col-span-2 relative">
                                <div className="absolute -left-6 top-0 w-px h-full bg-gradient-to-b from-[#3A2417]/20 via-[#3A2417]/40 to-transparent rounded-full hidden md:block"></div>

                <h3 className="text-2xl font-serif text-[#12351F] mb-4 flex items-center">
                  <span className="text-[#B99755] mr-2 text-xl">✤</span> Leadership
                </h3>
                <div className="space-y-4">
                  {leadershipData.map((item, idx) => (
                    <div key={idx} className="border-l-2 border-[#B99755] pl-4 relative before:absolute before:-left-[5px] before:top-2 before:w-2 before:h-2 before:rounded-full before:bg-[#E3CB8A]">
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
