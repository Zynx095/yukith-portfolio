/**
 * Skills, with the evidence behind each one. Recruiters can see *where* a
 * skill was used instead of reading a list of logos.
 *
 *   project  — used in a repository listed in projects.ts / experience.ts
 *   academic — part of the degree's coursework
 */

export type Evidence = "project" | "academic";

export interface Skill {
  name: string;
  evidence: Evidence;
  /** Project / experience ids or a short note. */
  where?: string[];
}

export interface SkillGroup {
  title: string;
  skills: Skill[];
}

export const skillGroups: SkillGroup[] = [
  {
    title: "Languages",
    skills: [
      { name: "Python", evidence: "project", where: ["WARDEN", "Q-SHIELD", "ETTH", "AURA", "ALIAS", "Sugar AI"] },
      { name: "TypeScript / JavaScript", evidence: "project", where: ["JIVA", "FairShift", "T R Constructions", "YukithHub"] },
      { name: "C / Embedded C (Arduino)", evidence: "project", where: ["STP BOT"] },
      { name: "SQL", evidence: "project", where: ["Dayflow (PostgreSQL)", "SQLite in AURA, Q-SHIELD, ShadowGuard"] },
      { name: "Luau", evidence: "project", where: ["STREET HIERARCHY"] },
    ],
  },
  {
    title: "Security & networking",
    skills: [
      { name: "TCP/IP, TLS, traffic analysis", evidence: "project", where: ["ETTH"] },
      { name: "JA3 / JA3S / JA4 fingerprinting, PCAP (Scapy, dpkt)", evidence: "project", where: ["ETTH"] },
      { name: "Post-quantum crypto (ML-KEM, ML-DSA)", evidence: "project", where: ["Q-SHIELD"] },
      { name: "Policy enforcement, approvals, audit logs", evidence: "project", where: ["WARDEN"] },
      { name: "Anomaly detection & risk scoring", evidence: "project", where: ["ALIAS"] },
      { name: "Data-loss prevention (Presidio, mitmproxy)", evidence: "project", where: ["ShadowGuard"] },
      { name: "Computer networks, network security", evidence: "academic" },
    ],
  },
  {
    title: "AI / ML",
    skills: [
      { name: "YOLO (Ultralytics), OpenCV", evidence: "project", where: ["AURA", "Q-SHIELD", "STP BOT"] },
      { name: "scikit-learn", evidence: "project", where: ["ETTH"] },
      { name: "PyTorch, Sentence Transformers", evidence: "project", where: ["AUTOHIRE"] },
      { name: "faster-whisper, Ollama, MeloTTS", evidence: "project", where: ["Sugar AI"] },
      { name: "Gemini API", evidence: "project", where: ["ALIAS"] },
      { name: "Agent frameworks (Fetch.ai uAgents)", evidence: "project", where: ["WARDEN"] },
      { name: "Quantum optimisation (Qiskit, QAOA)", evidence: "project", where: ["WATERWEAVE"] },
    ],
  },
  {
    title: "Backend, web & cloud",
    skills: [
      { name: "FastAPI", evidence: "project", where: ["AURA", "Q-SHIELD", "ALIAS", "ShadowGuard"] },
      { name: "Node.js / Express, Socket.IO", evidence: "project", where: ["JIVA", "YukithHub", "Dayflow"] },
      { name: "React, Next.js", evidence: "project", where: ["T R Constructions", "AURA", "FairShift", "this site"] },
      { name: "Three.js / React Three Fiber, GSAP", evidence: "project", where: ["T R Constructions", "this site"] },
      { name: "MongoDB, SQLite, PostgreSQL", evidence: "project", where: ["YukithHub", "AURA", "Dayflow"] },
      { name: "AWS CDK (modelled, not deployed)", evidence: "project", where: ["JIVA"] },
      { name: "Vercel, Render, Docker", evidence: "project", where: ["T R Constructions", "WARDEN"] },
    ],
  },
  {
    title: "Hardware & tools",
    skills: [
      { name: "Arduino Mega, motor drivers, ultrasonic sensors", evidence: "project", where: ["STP BOT"] },
      { name: "ESP32", evidence: "project", where: ["Q-SHIELD (firmware skeleton)"] },
      { name: "Git, pytest", evidence: "project", where: ["every repository above"] },
      { name: "Data structures & algorithms, DBMS", evidence: "academic" },
    ],
  },
];

export const certifications = ["Microsoft Azure AI Fundamentals (AI-900)"];
