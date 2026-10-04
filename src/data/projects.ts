/**
 * Projects — the single source of truth for every project shown in the
 * World Tree archive and the portfolio's Work section.
 *
 * Rules: every claim here comes from the project's own repository README,
 * its live site, or information Yukith provided. Never add metrics, users,
 * results or features that are not stated there.
 */

export interface ProjectImage {
  src: string;
  alt: string;
}

export interface Project {
  /** URL-safe id, also used by the 3D archive and the sigil (logo) registry. */
  id: string;
  title: string;
  /** What it is, in one line. */
  role: string;
  year: string;
  tags: string[];
  accent: string;
  /** Short description (one or two sentences). */
  desc: string;
  /** Longer description for the detail panel. */
  summary?: string;
  /** Verified features / facts, phrased for display. */
  verifiedFeatures?: string[];
  /** Honest status label where the README states one. */
  status?: string;
  github?: string;
  live?: string;
  gallery?: ProjectImage[];
  isPlaceholder?: boolean;
}

export const PROJECTS: Project[] = [
  {
    id: "etth",
    title: "ETTH",
    role: "Encrypted Traffic Threat Hunter",
    year: "2026",
    github: "https://github.com/Zynx095/encrypted-traffic-threat-hunter",
    tags: ["Python", "scikit-learn", "dpkt/Scapy", "PCAP Analysis"],
    accent: "#00d4ff",
    desc: "Machine learning pipeline for encrypted traffic analysis and threat detection without payload decryption.",
    verifiedFeatures: [
      "leakage-controlled ML pipeline",
      "bidirectional flow reconstruction from raw PCAPs",
      "TLS ClientHello fingerprint extraction",
      "JA3",
      "JA3S",
      "JA4",
      "payloads are not decrypted",
      "deterministic SHA-256 behavioral hashing",
      "GroupShuffleSplit train/test isolation",
      "deterministic identifiers removed",
      "five experimental configurations",
      "46/46 passing unit tests",
      "dataset/capture-environment confounding documented",
      "generalization claims appropriately scoped",
    ],
  },
  {
    id: "aura",
    title: "AURA",
    role: "Autonomous Unified Recognition Assistant",
    year: "2026",
    github: "https://github.com/Zynx095/AURA",
    tags: ["Next.js", "FastAPI", "YOLOv8", "WebSockets", "SQLite"],
    accent: "#7dd3fc",
    desc: "Real-time AI surveillance platform utilizing computer vision for tracking and behavioral analysis.",
    verifiedFeatures: [
      "team project",
      "real-time AI surveillance platform",
      "YOLOv8",
      "centroid-based multi-frame tracking",
      "NORMAL → OBSERVED → SUSPICIOUS behavioral state machine",
      "FastAPI/WebSocket backend",
      "JWT/bcrypt authentication",
      "polygon-based zone intrusion engine",
      "incident generation",
      "evidence snapshots",
      "Next.js live detection dashboard",
    ],
  },
  {
    id: "shadowguard",
    title: "ShadowGuard",
    role: "Enterprise AI Data Protection System",
    year: "2026",
    github: "https://github.com/Zynx095/shadowguard",
    tags: ["Cybersecurity", "Access Control", "DLP"],
    accent: "#a5b4fc",
    desc: "Defensive architecture concept/prototype for enterprise data protection, anomaly detection, and insider-threat monitoring.",
    verifiedFeatures: [
      "defensive architecture concept/prototype",
      "access control",
      "DLP",
      "anomaly detection",
      "policy enforcement",
      "system hardening",
      "breach-response workflow",
      "shutdown protocols",
      "insider-threat monitoring",
    ],
  },
  {
    id: "sugarai",
    title: "Sugar AI",
    role: "Offline Voice-Controlled Desktop Assistant",
    year: "2025",
    github: "https://github.com/Zynx095/SUGAR-AI",
    tags: ["Python", "Whisper AI", "Ollama", "MeloTTS", "CustomTkinter"],
    accent: "#93c5fd",
    desc: "Fully offline desktop assistant running local speech processing and LLM pipelines.",
    verifiedFeatures: [
      "fully offline desktop assistant",
      "on-device speech/language processing",
      "user data remains local",
      "multithreaded transcription/inference/playback pipeline",
      "responsive voice interaction",
    ],
  },
  {
    id: "qshield",
    title: "Q-SHIELD",
    role: "Continuous device trust with post-quantum-signed evidence",
    year: "2026",
    github: "https://github.com/Zynx095/Q-shield",
    status: "Hackathon prototype",
    tags: ["Python", "FastAPI", "SQLite", "OpenCV", "YOLO11n", "ML-KEM / ML-DSA"],
    accent: "#a78bfa",
    desc: "Authentication answers “who are you” once. Q-SHIELD keeps asking “can I still trust you”, using post-quantum-signed evidence.",
    summary:
      "Q-SHIELD keeps scoring every device from independent evidence — cryptographic identity, the physical tamper switch, sensor ranges, configuration integrity, network liveness and signed camera observations. When the evidence turns against a device it is quarantined at the gateway, every decision is recorded in a signed evidence chain, and the device only returns after a verified, operator-started recovery rebuilds its trust. Built as a working prototype for a hackathon; device telemetry is simulated and the ESP32 firmware is a skeleton.",
    verifiedFeatures: [
      "explainable trust engine: six weighted evidence factors with hysteresis",
      "quarantine enforcement at the gateway, with operator-started verified recovery",
      "evidence chain: SHA-256 linked and ML-DSA-65 (FIPS 204) signed",
      "signed camera observations over an ML-KEM-768 (FIPS 203) session",
      "PQC checked against NIST ACVP test vectors",
      "vision service: OpenCV + YOLO11n with camera-tamper checks (covered, frozen, turned)",
      "digital twin of expected vs self-reported device state",
      "security command-center dashboard with a presentation mode",
    ],
  },
  {
    id: "jiva",
    title: "JIVA",
    role: "Privacy-preserving, real-time healthcare coordination",
    year: "2026",
    github: "https://github.com/Zynx095/Jiva",
    status: "Phase 6 (frozen) · decision authority in shadow mode",
    tags: ["TypeScript", "Express", "Socket.IO", "Zod", "MapLibre", "AWS CDK"],
    accent: "#f47c7c",
    desc: "Ambulances, hospitals and patients on one event-driven mesh — without exposing a single hospital database.",
    summary:
      "In an emergency, the nearest hospital is often not the right one. JIVA's rule is simple: never assume a bed is open. Public data says what a hospital can do; only a live, time-bounded acceptance from that hospital says it will — everything else stays UNKNOWN. Every fact is an event on a central bus, state engines project Patient, Hospital and Ambulance state, and four role-scoped apps update live.",
    verifiedFeatures: [
      "event-driven core: state engines project every event into live state",
      "Hospital Acceptance Protocol with automatic re-routing on rejection or timeout",
      "every derived value carries confidence and provenance",
      "Care Feasibility Engine running in shadow mode only",
      "provider-agnostic routing: Valhalla, OSRM or a labelled synthetic fallback",
      "AI sidecar for handoff briefs, with no routing authority",
      "four role-scoped apps (Management, Ambulance, Hospital, Patient) over Socket.IO",
      "local-first; AWS architecture modelled in CDK (not deployed)",
      "20 adversarial failure scenarios passing",
    ],
  },
  {
    id: "stp-bot",
    title: "STP BOT",
    role: "",
    year: "",
    tags: [],
    accent: "#67e8f9",
    desc: "",
    isPlaceholder: true,
  },
  {
    id: "edith-ar",
    title: "EDITH AR",
    role: "",
    year: "",
    tags: [],
    accent: "#818cf8",
    desc: "",
    isPlaceholder: true,
  },
  {
    id: "nids-engine",
    title: "NIDS ENGINE",
    role: "",
    year: "",
    tags: [],
    accent: "#c4b5fd",
    desc: "",
    isPlaceholder: true,
  },
];
