import * as THREE from "three";

export type ZoneType = "story" | "project" | "achievement" | "leadership" | "experience" | "tree";

export interface StoryZoneConfig {
  id: string;
  type: ZoneType;
  title: string;
  subtitle?: string;
  worldPosition: [number, number, number];

  cameraStart: number;
  cameraFocus: number;
  cameraEnd: number;

  revealDistance: number;   // When landmark becomes noticeable
  activateDistance: number; // When visual effects activate
  interactDistance: number; // When [SPACE] prompt appears
  hideDistance: number;     // When panel closes

  description: string;
  problem?: string;
  approach?: string;
  technology?: string[];
  features?: string[];
  engineering?: string;
  links?: { label: string; url: string }[];

  allowInteraction: boolean;
  interactiveLabel?: string;

  readingOffset: [number, number, number];

  panelSide: "left" | "right" | "center";
}

export const STORY_ZONES: StoryZoneConfig[] = [
  {
    id: "childhood",
    type: "story",
    title: "The Origin",
    subtitle: "Childhood",
    worldPosition: [-3, -2, -50],
    cameraStart: 0.02,
    cameraFocus: 0.05,
    cameraEnd: 0.10,
    revealDistance: 30,
    activateDistance: 20,
    interactDistance: 15,
    hideDistance: 10,
    description:
      "Growing up in Bengaluru, curiosity was never a question—it was a necessity. The systems behind games, the logic beneath interfaces, the invisible architecture that made worlds respond to touch. This is where the obsession began.",
    technology: ["Curiosity", "Play", "Questions"],
    features: ["Built first scratch-built PC from reclaimed parts", "Taught Python by reverse-engineering games", "First hackathon pitch at age 16"],
    allowInteraction: true,
    interactiveLabel: "EXPLORE ORIGIN",
    readingOffset: [3, 2, 0],
    panelSide: "right",
  },
  {
    id: "firsttech",
    type: "story",
    title: "The Spark",
    subtitle: "First Technology",
    worldPosition: [8, -2, -100],
    cameraStart: 0.11,
    cameraFocus: 0.14,
    cameraEnd: 0.18,
    revealDistance: 30,
    activateDistance: 20,
    interactDistance: 15,
    hideDistance: 10,
    description:
      "A custom PC built from scrap components. It ran Elden Ring and CSGO, but playing wasn't enough. That machine became the vessel for the first line of code that mattered—a realtime bus navigation app built in Python, pitched at a hackathon, and realized that software could change how people move through the world.",
    problem:
      "Public transportation in Bengaluru was unpredictable. Routes changed, timings were unreliable, and real-time information was virtually nonexistent for the average commuter.",
    approach:
      "Built a Python-based realtime navigation app using public transit APIs, GPS tracking, and route optimization. The pitch at the hackathon was the first time code felt like impact.",
    technology: ["Python", "FastAPI", "Realtime APIs", "GPS"],
    features: [
      "Custom PC built entirely from reclaimed hardware",
      "First Python project: realtime bus navigation",
      "Hackathon pitch that proved software could change behavior",
      "Started the transition from player to builder",
    ],
    allowInteraction: true,
    interactiveLabel: "EXPLORE SPARK",
    readingOffset: [3, 2, 0],
    panelSide: "left",
  },
  {
    id: "university",
    type: "story",
    title: "Presidency University",
    subtitle: "Education — B.Tech CSE",
    worldPosition: [-12, -2, -150],
    cameraStart: 0.19,
    cameraFocus: 0.22,
    cameraEnd: 0.26,
    revealDistance: 35,
    activateDistance: 25,
    interactDistance: 18,
    hideDistance: 12,
    description:
      "Presidency University became a home. Chosen because the 11th and 12th years there felt irreplaceable. Studying Computer Science with a focus on Networks and Cybersecurity—fields that felt inherently interesting. CGPA 7.56. The pressure that was expected became something to enjoy.",
    problem:
      "University shouldn't just be about grades. The challenge was building depth while surviving the pace—organizing events, competing in hackathons, and maintaining friendships.",
    approach:
      "Committed to Networks and Cybersecurity as the core focus. Joined multiple clubs, organized InnovateX Tech Fest with 10 simultaneous events and ~280 participants, and learned to thrive under deadline pressure.",
    technology: ["Computer Networks", "Cybersecurity", "Packet Analysis", "Intrusion Detection"],
    features: [
      "B.Tech Computer Science & Engineering — Networks focus",
      "CGPA 7.56, expected graduation 2028",
      "Organized InnovateX Tech Fest (280+ participants, World Record recognition)",
      "Survived a 24-hour hackathon while competing in two others",
    ],
    allowInteraction: true,
    interactiveLabel: "EXPLORE EDUCATION",
    readingOffset: [3, 2, 0],
    panelSide: "right",
  },
  {
    id: "aura",
    type: "project",
    title: "AURA",
    subtitle: "Autonomous Unified Recognition Assistant",
    worldPosition: [18, -2, -200],
    cameraStart: 0.28,
    cameraFocus: 0.31,
    cameraEnd: 0.35,
    revealDistance: 35,
    activateDistance: 25,
    interactDistance: 18,
    hideDistance: 12,
    description:
      "AURA is a real-time AI surveillance platform built as a team project. It uses YOLOv8 for object detection, centroid-based multi-frame tracking, and a behavioral state machine that classifies movement as NORMAL, OBSERVED, or SUSPICIOUS. The system generates evidence snapshots and incident reports through a FastAPI/WebSocket backend with JWT authentication.",
    problem:
      "Traditional surveillance systems record everything but understand nothing. Security teams are overwhelmed by raw footage and miss critical events until after they happen.",
    approach:
      "Deployed YOLOv8 for real-time detection, implemented centroid tracking across frames to maintain identity, and built a state machine that escalates from observation to alert only when behavior patterns cross defined thresholds. Polygon-based zone intrusion detection triggers incident generation with timestamped evidence.",
    technology: ["Next.js", "FastAPI", "YOLOv8", "WebSockets", "SQLite", "JWT", "bcrypt"],
    features: [
      "Real-time AI surveillance with YOLOv8 computer vision",
      "Centroid-based multi-frame tracking maintains object identity",
      "NORMAL → OBSERVED → SUSPICIOUS behavioral state machine",
      "FastAPI/WebSocket backend streaming to live dashboard",
      "JWT/bcrypt authentication for secure access",
      "Polygon-based zone intrusion engine with incident generation",
      "Evidence snapshot capture on threshold breach",
    ],
    engineering:
      "The key engineering challenge was balancing detection accuracy with performance. YOLOv8 inference runs on a scheduled pipeline with WebSocket streaming to the Next.js dashboard. The state machine prevents false positives by requiring sustained observation before escalation.",
    links: [{ label: "GitHub", url: "https://github.com/Zynx095/AURA" }],
    allowInteraction: true,
    interactiveLabel: "EXPLORE AURA",
    readingOffset: [4, 2, 0],
    panelSide: "right",
  },
  {
    id: "etth",
    type: "project",
    title: "ETTH",
    subtitle: "Encrypted Traffic Threat Hunter",
    worldPosition: [-15, -2, -250],
    cameraStart: 0.37,
    cameraFocus: 0.40,
    cameraEnd: 0.44,
    revealDistance: 35,
    activateDistance: 25,
    interactDistance: 18,
    hideDistance: 12,
    description:
      "ETTH is a machine learning pipeline for encrypted traffic analysis and threat detection without payload decryption. It reconstructs bidirectional flows from raw PCAPs, extracts TLS ClientHello fingerprints (JA3, JA3S, JA4), and runs a leakage-controlled ML pipeline with GroupShuffleSplit train/test isolation. All 46 unit tests pass.",
    problem:
      "Encrypted traffic hides threats from traditional inspection tools. Security teams need visibility into network behavior without compromising privacy through payload decryption.",
    approach:
      "Reconstructed bidirectional flows from raw PCAP captures using dpkt/Scapy. Extracted deterministic TLS fingerprints and behavioral hashes without ever decrypting payloads. Applied GroupShuffleSplit to prevent dataset/capture-environment confounding.",
    technology: ["Python", "scikit-learn", "dpkt/Scapy", "PCAP Analysis", "JA3/JA4"],
    features: [
      "Leakage-controlled ML pipeline prevents data contamination",
      "Bidirectional flow reconstruction from raw PCAPs",
      "TLS ClientHello fingerprint extraction (JA3, JA3S, JA4)",
      "Payloads are never decrypted — privacy preserved",
      "Deterministic SHA-256 behavioral hashing",
      "GroupShuffleSplit train/test isolation",
      "Four experimental configurations tested",
      "46/46 passing unit tests",
      "Dataset/capture-environment confounding documented",
    ],
    engineering:
      "The pipeline's core innovation is its leakage control. By using GroupShuffleSplit instead of standard train/test splits, the model cannot learn from duplicate network flows. The deterministic SHA-256 hashing ensures reproducibility while removing identifiers that could leak into training.",
    links: [],
    allowInteraction: true,
    interactiveLabel: "EXPLORE ETTH",
    readingOffset: [-4, 2, 0],
    panelSide: "left",
  },
  {
    id: "shadowguard",
    type: "project",
    title: "ShadowGuard",
    subtitle: "Enterprise AI Data Protection System",
    worldPosition: [20, -2, -300],
    cameraStart: 0.46,
    cameraFocus: 0.49,
    cameraEnd: 0.53,
    revealDistance: 35,
    activateDistance: 25,
    interactDistance: 18,
    hideDistance: 12,
    description:
      "ShadowGuard is a defensive cybersecurity architecture concept and prototype for enterprise data protection. It combines access control, data loss prevention, anomaly detection, and insider-threat monitoring into a unified policy enforcement layer. The system can trigger automated breach-response workflows and shutdown protocols when threats are detected.",
    problem:
      "Enterprise data breaches often originate from insider threats or policy violations that go undetected until damage is done. Traditional DLP tools react after exfiltration begins.",
    approach:
      "Built a layered defense architecture combining IAM policies with real-time behavioral analysis. The system monitors data flows, detects anomalies in access patterns, and enforces policies before data leaves the boundary. Breach-response workflows automate containment.",
    technology: ["Cybersecurity", "Access Control", "DLP", "Anomaly Detection", "Policy Enforcement"],
    features: [
      "Defensive architecture concept and prototype",
      "Multi-layered access control and IAM integration",
      "Data Loss Prevention (DLP) policy enforcement",
      "Real-time anomaly detection on data flows",
      "Insider-threat monitoring and behavioral analysis",
      "Automated breach-response workflow engine",
      "System hardening and shutdown protocol activation",
    ],
    engineering:
      "The architecture layers policy enforcement at multiple points: identity verification, data classification, flow monitoring, and response automation. The prototype demonstrates how defensive AI can shift security from reactive to predictive.",
    links: [{ label: "GitHub", url: "https://github.com/Zynx095/shadowguard" }],
    allowInteraction: true,
    interactiveLabel: "EXPLORE SHADOWGUARD",
    readingOffset: [4, 2, 0],
    panelSide: "right",
  },
  {
    id: "sugai",
    type: "project",
    title: "Sugar AI",
    subtitle: "Offline Voice-Controlled Desktop Assistant",
    worldPosition: [-18, -2, -350],
    cameraStart: 0.55,
    cameraFocus: 0.58,
    cameraEnd: 0.62,
    revealDistance: 35,
    activateDistance: 25,
    interactDistance: 18,
    hideDistance: 12,
    description:
      "Sugar AI is a fully offline desktop voice assistant running local speech processing and LLM pipelines. It uses Whisper AI for transcription, Ollama for on-device language model inference, and MeloTTS for natural voice playback. All user data remains on-device—nothing leaves the machine.",
    problem:
      "Cloud-based voice assistants require internet connectivity and send sensitive data to external servers. Privacy-conscious users need local alternatives that don't sacrifice capability.",
    approach:
      "Architected a multithreaded pipeline where Whisper transcribes audio, Ollama processes requests through a local LLM, and MeloTTS generates speech—all running concurrently on the same machine. CustomTkinter provides a responsive desktop interface.",
    technology: ["Python", "Whisper AI", "Ollama", "MeloTTS", "CustomTkinter"],
    features: [
      "Fully offline — no internet required, no data leaves the device",
      "On-device speech-to-text with Whisper AI",
      "Local LLM inference via Ollama — no API keys needed",
      "Natural voice playback with MeloTTS",
      "Multithreaded pipeline for responsive interaction",
      "Responsive desktop UI built with CustomTkinter",
    ],
    engineering:
      "The pipeline threads transcription, inference, and playback in parallel to minimize latency. Whisper runs on GPU when available, falling back to CPU. Ollama serves the LLM locally, and MeloTTS generates speech from the model's text output—all synchronized through a shared event queue.",
    links: [{ label: "GitHub", url: "https://github.com/Zynx095/SUGAR-AI" }],
    allowInteraction: true,
    interactiveLabel: "EXPLORE SUGAR AI",
    readingOffset: [-4, 2, 0],
    panelSide: "left",
  },
  {
    id: "achievements",
    type: "achievement",
    title: "Hackathons & Milestones",
    subtitle: "Competition & Recognition",
    worldPosition: [10, -2, -400],
    cameraStart: 0.64,
    cameraFocus: 0.67,
    cameraEnd: 0.71,
    revealDistance: 35,
    activateDistance: 25,
    interactDistance: 18,
    hideDistance: 12,
    description:
      "Competition is where theory meets pressure. From being a Top 30 Finalist at Smart India Hackathon to multiple Runner-Up placements at InnovateX, each hackathon refined the ability to build, iterate, and deliver under constraints.",
    technology: ["Smart India Hackathon", "Nirmith", "InnovateX", "Hardware Expo"],
    features: [
      "Top 30 Finalist — Smart India Hackathon 2025",
      "National Finalist — Nirmith 2026 National Level Hackathon",
      "Runner-Up — Hardware Hackathon, InnovateX 4.0",
      "Runner-Up — Hardware Expo, InnovateX 4.0",
      "Participant — Odoo × NMIT Hackathon 2026",
    ],
    allowInteraction: true,
    interactiveLabel: "EXPLORE MILESTONES",
    readingOffset: [0, 2, 0],
    panelSide: "center",
  },
  {
    id: "leadership",
    type: "leadership",
    title: "Leadership & Growth",
    subtitle: "Community Impact",
    worldPosition: [-12, -2, -425],
    cameraStart: 0.73,
    cameraFocus: 0.76,
    cameraEnd: 0.79,
    revealDistance: 35,
    activateDistance: 25,
    interactDistance: 18,
    hideDistance: 12,
    description:
      "Technical skills alone don't build things—people do. As Social Media Head of InTech Club and an organizer for InnovateX Tech Fest, I managed events spanning hundreds of participants, coordinated prize distributions, and cultivated communities of shared learning.",
    technology: ["Community Building", "Event Management", "Social Media"],
    features: [
      "Social Media Head — InTech Club (June 2026 – Present)",
      "Organiser — InnovateX Tech Fest (~280 participants, 10 events)",
      "Event Head — Build Club (2024–Present)",
      "Core Coordinator — One-O-One Club (2024–Present)",
      "Event Head — Informatica Club (2024–Present)",
    ],
    allowInteraction: true,
    interactiveLabel: "EXPLORE LEADERSHIP",
    readingOffset: [-4, 2, 0],
    panelSide: "left",
  },
  {
    id: "experience",
    type: "experience",
    title: "Professional Experience",
    subtitle: "Industry",
    worldPosition: [12, -2, -425],
    cameraStart: 0.73,
    cameraFocus: 0.76,
    cameraEnd: 0.79,
    revealDistance: 35,
    activateDistance: 25,
    interactDistance: 18,
    hideDistance: 12,
    description:
      "Two formative internships shaped the transition from student to engineer. The NVIDIA capstone provided exposure to AI system design at scale. Elevance grounded that knowledge in production full-stack engineering—real users, real deadlines, real impact.",
    technology: ["AI Systems", "Full-Stack Development", "Healthcare Tech"],
    features: [
      "Capstone Project Intern — NVIDIA × Presidency University",
      "Full-Stack Development Intern — Elevance",
    ],
    allowInteraction: true,
    interactiveLabel: "EXPLORE EXPERIENCE",
    readingOffset: [4, 2, 0],
    panelSide: "right",
  },
];
