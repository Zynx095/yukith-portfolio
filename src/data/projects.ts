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
