/**
 * Projects — the single source of truth for the World Tree archive, the
 * project index and the written portfolio.
 *
 * Every statement here is traceable to the project's repository (source tree,
 * not only the README), its live deployment, or the current resume
 * (public/resume.pdf, October 2026). See docs/CONTENT_VERIFICATION.md.
 * Never add metrics, users, results or features that those sources do not state.
 */

export type ProjectDomain = "security" | "ai" | "systems" | "hardware" | "web" | "games" | "research";

/** The physical object that stands for the project inside the World Tree. */
export type RelicKind =
  | "gate" // WARDEN — a gatehouse that checks every action before it passes
  | "trust-ring" // Q-SHIELD — six weighted evidence arcs around a device
  | "mesh" // JIVA — role nodes orbiting one event bus
  | "geode" // ETTH — a sealed crystal read only from the outside
  | "lens" // AURA — a watching lens with a tracking bracket
  | "ledger" // ALIAS — a case file read through a magnifier
  | "veil" // ShadowGuard — a page passing through a redacting screen
  | "voice-orb" // Sugar AI — a glass orb that listens and answers
  | "rover"; // STP BOT — the cleaning robot itself

export interface ProjectLink {
  label: string;
  href: string;
  /** Shown next to the link, e.g. "cold start ≈ 30 s". */
  note?: string;
}

export interface ProjectImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface Project {
  id: string;
  title: string;
  /** What it is, in a few words. */
  kind: string;
  /** One sentence for labels and cards. */
  tagline: string;
  domain: ProjectDomain;
  /** When it was built, as shown. */
  period: string;
  /** The problem, in the project's own terms. */
  problem: string;
  /** What it does and how, two or three sentences. */
  summary: string;
  /** Implemented features only. */
  features: string[];
  stack: string[];
  /** Yukith's part in it. */
  contribution: string;
  /** Honest status label. */
  status: string;
  /** Where it was built (hackathon, internship, course …). */
  context?: string;
  /** What is simulated, partial or not deployed — always shown with the record. */
  limits?: string;
  links: ProjectLink[];
  /** Shown as a relic in the World Tree's archive hall. */
  featured: boolean;
  /** Co-built work in someone else's repository — listed under Collaborations, never as a solo build. */
  collaboration?: boolean;
  relic?: RelicKind;
  gallery?: ProjectImage[];
}

const gh = (repo: string): ProjectLink => ({ label: "Source", href: `https://github.com/Zynx095/${repo}` });

export const PROJECTS: Project[] = [
  {
    id: "warden",
    title: "WARDEN",
    kind: "Security layer for AI-agent actions",
    tagline: "The model proposes. WARDEN checks it, runs it, and verifies what actually happened.",
    domain: "security",
    period: "Oct 2026",
    problem:
      "AI agents can now touch files and configuration. A prompt injection, a forged claim of authority or a false “success” message can cause real side effects when the model is allowed to act on its own word.",
    summary:
      "WARDEN treats the model as an untrusted proposal engine. Every file action passes through intent parsing, risk analysis, deterministic policy, digest-bound human approval, restricted execution and an independent audit that reports whether the outcome was actually VERIFIED.",
    features: [
      "Deterministic policy rules (WDN-000 … WDN-006): protected files blocked, destructive actions held for approval",
      "Approvals bound to the exact action by a canonical digest, with expiry, sender checks and single use",
      "HMAC-SHA256 authorisation tokens tied to the observed target state",
      "Restricted executor confined to a workspace; path-traversal and symlink checks",
      "Outcome auditor and a hash-chained JSONL audit log",
      "Fetch.ai uAgents with the Agent Chat Protocol; ASI:One Interactive Cards for approvals",
      "Optional standalone Risk Analyst and Auditor agents",
    ],
    stack: ["Python", "uAgents", "Agent Chat Protocol", "ASI:One", "pytest", "Docker"],
    contribution: "Solo build — architecture, policy engine, agents, hosting and tests.",
    status: "Hackathon prototype · hosted",
    context: "Built for Fetch-A-Thon 3.0 (ASI:One Agent Challenge)",
    limits: "A hackathon prototype, not a certified security boundary; the README documents its limitations. 734 passing tests are reported in the repository.",
    links: [
      gh("WARDEN"),
      { label: "Live agent health", href: "https://warden-sentinel.onrender.com/health", note: "free host — first request can take ~30 s" },
    ],
    featured: true,
    relic: "gate",
  },
  {
    id: "qshield",
    title: "Q-SHIELD",
    kind: "Continuous device trust for IoT",
    tagline: "Authentication asks “who are you” once. Q-SHIELD keeps asking “can I still trust you”.",
    domain: "security",
    period: "Sep – Oct 2026",
    problem:
      "A device that authenticated correctly can still be compromised afterwards — its enclosure opened, its configuration changed, its camera covered.",
    summary:
      "Q-SHIELD scores every device continuously from independent evidence, quarantines it at the gateway when the evidence turns against it, and records every decision in a post-quantum-signed evidence chain. A device returns only after an operator-started, verified recovery.",
    features: [
      "Explainable trust engine: six weighted factors (identity 25 %, physical 20 %, configuration, sensors and vision 15 % each, network 10 %) with hysteresis",
      "Quarantine enforced at the gateway; operator-verified recovery",
      "Evidence chain linked with SHA-256 and signed with ML-DSA-65 (FIPS 204)",
      "Camera observations signed inside an ML-KEM-768 (FIPS 203) session, checked against NIST ACVP test vectors",
      "OpenCV + YOLO11n vision service that also detects a covered, frozen or turned camera",
      "Digital twin of expected versus self-reported device state",
    ],
    stack: ["Python", "FastAPI", "SQLite", "OpenCV", "YOLO11n", "ML-KEM / ML-DSA"],
    contribution: "Solo build — trust engine, gateway, cryptography, vision service and dashboard.",
    status: "Hackathon prototype",
    limits: "Device telemetry is simulated by a software agent, the ESP32 firmware is a skeleton that has never been flashed, and demo attacks are synthetic — the project labels all three as such.",
    links: [gh("Q-shield"), { label: "Dashboard demo", href: "https://q-shield-chi.vercel.app" }],
    featured: true,
    relic: "trust-ring",
  },
  {
    id: "jiva",
    title: "JIVA",
    kind: "Real-time healthcare coordination",
    tagline: "Ambulances, hospitals and patients on one event-driven mesh — without exposing a hospital database.",
    domain: "systems",
    period: "Sep – Oct 2026",
    problem:
      "In an emergency the nearest hospital is often not the right one: the cath lab is full or the paediatric ICU has no bed, and the ambulance finds out on arrival.",
    summary:
      "JIVA never assumes a bed is open. Public data says what a hospital can do; only a live, time-bounded acceptance says it will. Every fact is an event on a central bus, state engines project patient, hospital and ambulance state, and four role-scoped apps update live.",
    features: [
      "Hospital Acceptance Protocol with automatic re-routing on rejection or timeout",
      "Every derived value carries confidence and provenance — estimates are never shown as facts",
      "Care Feasibility Engine running in shadow mode only",
      "Provider-agnostic routing: Valhalla, OSRM or a labelled synthetic fallback",
      "Four role-scoped apps (management, ambulance, hospital, patient) over Socket.IO",
      "20 adversarial failure scenarios passing",
    ],
    stack: ["TypeScript", "Express", "Socket.IO", "Zod", "MapLibre", "AWS CDK"],
    contribution: "Solo build — monorepo of shared packages, API, state engines and apps.",
    status: "Phase 6 frozen · decision authority in shadow mode",
    limits: "Runs locally. The AWS architecture (EventBridge, API Gateway, Lambda, DynamoDB, Cognito, Bedrock) is modelled in CDK and synthesises, but nothing is deployed. Data is synthetic and public.",
    links: [gh("Jiva")],
    featured: true,
    relic: "mesh",
  },
  {
    id: "etth",
    title: "ETTH",
    kind: "Encrypted Traffic Threat Hunter",
    tagline: "Detecting malicious encrypted traffic without ever decrypting it.",
    domain: "research",
    period: "Aug – Oct 2026",
    problem:
      "Most traffic is encrypted, so payload inspection is blind. The research question: does combining TLS fingerprints with encrypted-flow behaviour detect malicious traffic better than either alone?",
    summary:
      "A leakage-controlled pipeline turns raw PCAPs into model-safe datasets: bidirectional flows, TLS handshake metadata and JA3 / JA3S / JA4 fingerprints, compared across five experimental configurations. Payloads are never decrypted.",
    features: [
      "Bidirectional flow reconstruction from raw PCAPs with SHA-256 dataset provenance",
      "TLS ClientHello parsing and JA3, JA3S and JA4 fingerprinting",
      "Five experiments isolating flow-only, JA3, JA4 and fused feature families",
      "Leakage controls: GroupShuffleSplit isolation, deterministic identifiers removed",
      "Dataset and capture-environment confounding documented, not hidden",
      "459 passing tests",
    ],
    stack: ["Python", "scikit-learn", "Scapy", "dpkt", "pytest"],
    contribution: "Solo research and engineering.",
    status: "Active research",
    limits: "The central claim is blocked until independent benign data is available; current models are research pilots and the README says so.",
    links: [gh("encrypted-traffic-threat-hunter")],
    featured: true,
    relic: "geode",
  },
  {
    id: "aura",
    title: "AURA",
    kind: "Autonomous Unified Recognition Assistant",
    tagline: "Surveillance that tracks behaviour over time instead of just showing video.",
    domain: "ai",
    period: "May – Aug 2026",
    problem: "Conventional surveillance dashboards only display feeds; someone still has to notice what matters.",
    summary:
      "AURA runs real-time detection, follows subjects across frames, evaluates them against configured zones and a behavioural state machine, and raises persistent incidents with evidence snapshots on a live dashboard.",
    features: [
      "YOLOv8 detection on an OpenCV camera pipeline",
      "Centroid-based multi-frame tracking and per-subject timelines",
      "NORMAL → OBSERVED → SUSPICIOUS behavioural state machine",
      "Polygon zones with intrusion detection",
      "Incidents with evidence snapshots, persisted in SQLite",
      "FastAPI + WebSocket streaming, JWT/bcrypt auth and role-based access",
    ],
    stack: ["Python", "FastAPI", "YOLOv8", "OpenCV", "WebSockets", "Next.js", "SQLite"],
    contribution: "Lead on AI systems and backend — detection, tracking, behaviour engine, auth and integration. Frontend by Pranathi Nagabhushana.",
    status: "Local prototype · active development",
    limits: "Validated on local webcams; RTSP camera support is partial and Gemini scene narration is experimental.",
    links: [gh("AURA")],
    featured: true,
    relic: "lens",
  },
  {
    id: "alias",
    title: "ALIAS",
    kind: "Login anomaly investigation",
    tagline: "Turns suspicious sign-ins into an explained case file.",
    domain: "security",
    period: "Sep 2026",
    problem:
      "Credential stuffing, impossible travel and new devices hide among thousands of normal logins, and a raw alert does not tell an analyst what actually happened.",
    summary:
      "ALIAS learns six behavioural baselines per user, correlates deviations across signals into a risk score, and has Gemini write an investigation report — with live alerts on a SOC dashboard.",
    features: [
      "Six baseline models: temporal, device, location, network, authentication and access",
      "Multi-signal correlation and explainable risk scoring",
      "Gemini-generated investigation reports",
      "Real-time WebSocket alerts to a React SOC dashboard",
      "Scenario portal that replays demo attacks",
      "61 backend tests passing",
    ],
    stack: ["Python", "FastAPI", "SQLAlchemy", "React", "WebSockets", "Gemini API"],
    contribution: "Solo build.",
    status: "Complete prototype",
    links: [gh("ALIAS"), { label: "Live demo", href: "https://alias-ochre.vercel.app" }],
    featured: true,
    relic: "ledger",
  },
  {
    id: "shadowguard",
    title: "ShadowGuard",
    kind: "Shadow-AI data-loss prevention",
    tagline: "Stops sensitive data from leaving through AI chatbots.",
    domain: "security",
    period: "Apr – Sep 2026",
    problem: "Employees paste credentials, card numbers and personal data into external AI tools that the organisation never approved.",
    summary:
      "A mitmproxy addon intercepts traffic to ChatGPT / OpenAI, and a FastAPI service analyses each prompt with Microsoft Presidio: high-risk prompts are blocked, moderate ones redacted, the rest allowed — every decision logged and pushed live to a dashboard.",
    features: [
      "mitmproxy interception of OpenAI and ChatGPT chat traffic with keyword hard-blocks",
      "Presidio PII analysis: block, redact (anonymise) or allow",
      "SQLite event log and WebSocket alerts",
      "React dashboard packaged as a Tauri desktop app",
    ],
    stack: ["Python", "mitmproxy", "Presidio", "FastAPI", "SQLite", "React", "Tauri"],
    contribution: "Solo build.",
    status: "Prototype · rework started Sep 2026",
    limits: "The dashboard's media “deepfake” scores are simulated in the prototype and are not claimed as a feature.",
    links: [gh("shadowguard")],
    featured: true,
    relic: "veil",
  },
  {
    id: "sugarai",
    title: "Sugar AI",
    kind: "Local voice assistant for Windows",
    tagline: "A voice assistant that runs on your own machine.",
    domain: "ai",
    period: "May – Oct 2026",
    problem: "Most voice assistants send every word to the cloud and can barely operate the desktop they live on.",
    summary:
      "Speech is transcribed locally with faster-whisper, answered by local models through Ollama and spoken back with MeloTTS. Version 2 adds a tool-using agent that controls Windows apps, media, Spotify and YouTube through a token-protected local UI.",
    features: [
      "faster-whisper (large-v3-turbo) speech-to-text and voice-activity endpointing",
      "Local LLMs through Ollama; optional Claude or OpenAI-compatible providers",
      "MeloTTS voice output",
      "Windows control through Win32, UI Automation and media sessions",
      "Spotify and YouTube control; tool registry with permissions",
      "Live UI over a token-protected WebSocket",
    ],
    stack: ["Python", "faster-whisper", "Ollama", "MeloTTS", "WebSockets", "pytest"],
    contribution: "Solo build.",
    status: "Version 2 in development",
    links: [gh("SUGAR-AI")],
    featured: true,
    relic: "voice-orb",
  },
  {
    id: "stp-bot",
    title: "STP BOT",
    kind: "Sewage-treatment-plant cleaning robot",
    tagline: "Keeps people out of the most hazardous job in a treatment plant.",
    domain: "hardware",
    period: "Apr – May 2026",
    problem: "Cleaning sewage treatment plants still sends workers into toxic environments.",
    summary:
      "A low-cost robot with a front auger: an Arduino Mega drives the motors and the auger and reports ultrasonic distance, a YOLOv8n vision script can take over the auger, and a browser dashboard drives it manually or with a gamepad.",
    features: [
      "Arduino Mega firmware: differential drive, auger with a pulse mode, ultrasonic ranging, proximity buzzer, serial telemetry",
      "YOLOv8n tracking that sends auger commands over serial (AI mode)",
      "Browser dashboard: manual and AI modes, gamepad input, SOS buttons",
    ],
    stack: ["Arduino (C++)", "Python", "YOLOv8", "OpenCV", "HTML/JS"],
    contribution: "Firmware, vision script and control dashboard.",
    status: "Prototype",
    limits: "The vision demo maps everyday COCO classes to stand-in waste types.",
    links: [gh("stp-bot-dashboard")],
    featured: true,
    relic: "rover",
  },
  {
    id: "fairshift",
    title: "FairShift",
    kind: "Fair work for frontline workers",
    tagline: "Provable hours, readable pay and safety reports that get fixed.",
    domain: "web",
    period: "Oct 2026",
    problem: "Construction and campus-support workers face disputed hours, unreadable pay slips and hazard reports that are “fixed” only on paper.",
    summary:
      "An installable web app built around UN SDG 8: signed work receipts anchored in Merkle checkpoints, a pay breakdown that compares agreed, worked and paid, and an accountability loop that closes a hazard only with proof.",
    features: [
      "HMAC-signed work receipts anchored in Merkle-tree checkpoints",
      "Rotating site QR and optional passkey (WebAuthn) check-in",
      "Wage-discrepancy notices and a possible-shortfall indicator",
      "Confidential reports; patterns surface only when three reports agree",
      "Six languages with read-aloud and dictation; works offline",
    ],
    stack: ["TypeScript", "Next.js", "PWA", "WebAuthn"],
    contribution: "Solo build.",
    status: "Hackathon build · synthetic data",
    context: "Built solo for PromptWars × ACM SRM Student Chapter (SRM Institute of Science and Technology), Oct 2026",
    links: [gh("promptwarsXACM"), { label: "Live demo", href: "https://fairshift-nine-red.vercel.app" }],
    featured: false,
  },
  {
    id: "waterweave",
    title: "WATERWEAVE",
    kind: "Fair water rationing, three ways",
    tagline: "Seven deliveries requested. Water for four. Who goes without?",
    domain: "research",
    period: "Oct 2026",
    problem: "When a city has less water than it is asked for, someone decides who gets it — usually with no visible rule for fairness.",
    summary:
      "The allocation becomes a small, checkable optimisation problem solved three ways — a rule of thumb, an exhaustive search and a 12-qubit QAOA circuit in Qiskit — all running live in a web app that can present itself.",
    features: [
      "Ising cost Hamiltonian with fairness, supply and storage penalties",
      "12-qubit QAOA with a classical optimiser; exhaustive baseline for comparison",
      "React web app over a FastAPI engine",
    ],
    stack: ["Python", "Qiskit", "FastAPI", "React", "TypeScript"],
    contribution: "Solo build.",
    status: "Hackathon build · synthetic data",
    context: "Qiskit Fall Fest 2026 (IIIT Kottayam), Track 2",
    links: [gh("WATERWEAVE")],
    featured: false,
  },
  {
    id: "street-hierarchy",
    title: "STREET HIERARCHY",
    kind: "Roblox grind / RPG game",
    tagline: "Start as a nobody. Click your way to the top of the hierarchy.",
    domain: "games",
    period: "Oct 2026",
    problem: "A fan-made game needs an economy that feels fair, servers that cannot be cheated and content that is fun to grind.",
    summary:
      "A Roblox game written end to end in typed Luau: a server-authoritative economy, eight zones with their own bosses, data-driven fighters, pets and auras, and a rebirth loop balanced with a pacing simulator.",
    features: [
      "72 scripts, ~13.5 K lines of typed Luau",
      "Server-authoritative clicks batched through token-bucket rate limits",
      "8 zones, 34 data-driven fighters, 49 pets, 17 auras",
      "Session-locked data service with autosave",
      "Mouse, touch, keyboard and gamepad",
    ],
    stack: ["Luau", "Roblox Studio", "Rojo"],
    contribution: "Solo build.",
    status: "Playable alpha",
    links: [gh("Robloxgame")],
    featured: false,
    gallery: [
      { src: "/projects/street-hierarchy/starter-street.webp", width: 1148, height: 793, alt: "Zone 1, Starter Street" },
      { src: "/projects/street-hierarchy/combat.webp", width: 1148, height: 793, alt: "Combat: walk up to a fighter and TRAIN becomes PUNCH" },
      { src: "/projects/street-hierarchy/pets-and-aura.webp", width: 1148, height: 793, alt: "Pets following the player with aura effects" },
      { src: "/projects/street-hierarchy/brainrot-dimension.webp", width: 1148, height: 793, alt: "The Brainrot Dimension" },
    ],
  },
  {
    id: "trc",
    title: "T R Constructions",
    kind: "Client website",
    tagline: "A production site for a Bengaluru civil and building contractor.",
    domain: "web",
    period: "Oct 2026",
    problem: "A contractor whose work is concrete and structural needed a site that shows real projects, not stock photography.",
    summary:
      "Built around the company's own sites: a 3D TRC mark that assembles from structural members, a ground-to-finish sequence, a sump and overhead-tank model and a project gallery — with fallbacks for phones and reduced motion.",
    features: [
      "Next.js 16, TypeScript, Tailwind CSS v4",
      "GSAP sequences and React Three Fiber scenes that load only on capable desktops",
      "Static CSP and security headers; rate-limited, honeypot-protected enquiry endpoint",
    ],
    stack: ["Next.js", "TypeScript", "Tailwind CSS", "GSAP", "React Three Fiber"],
    contribution: "Design and development; deployed on Vercel.",
    status: "Live",
    links: [gh("TRCStructures-website"), { label: "Live site", href: "https://trcstructures.vercel.app" }],
    featured: false,
    gallery: [
      { src: "/projects/trc/home.webp", width: 1280, height: 800, alt: "Home page with the 3D TRC mark" },
      { src: "/projects/trc/ground-to-finish.webp", width: 1280, height: 800, alt: "Ground-to-finish sequence" },
      { src: "/projects/trc/sump-oht-model.webp", width: 1280, height: 800, alt: "Interactive sump and overhead-tank model" },
    ],
  },
  {
    id: "dayflow",
    title: "Dayflow",
    kind: "Human-resource management system",
    tagline: "Attendance, leave and payroll visibility for a small team.",
    domain: "web",
    period: "Aug 2026",
    problem: "Spreadsheets for attendance and email threads for leave give HR no live view of the workforce.",
    summary: "Employees check in and out, request leave and see payroll; HR approves and watches the workforce live — behind JWT-authenticated, role-checked routes.",
    features: ["Employee and HR roles with JWT auth", "Live check-in / check-out and worked hours", "Leave workflow and payroll records", "Notifications"],
    stack: ["TypeScript", "Next.js", "Express", "PostgreSQL"],
    contribution: "Backend architecture, database design, security and API integration. Frontend by Pranathi Nagabhushana.",
    status: "Hackathon build",
    links: [gh("Dayflow---Human-Resource-Management-System")],
    featured: false,
  },
  {
    id: "prana",
    title: "PRANA",
    kind: "Design-intelligence web app · collaboration",
    tagline: "Local AI image generation and architectural image analysis in one web app.",
    domain: "ai",
    period: "Jul 2026",
    problem: "Generating concept visuals and analysing architectural photos usually means juggling separate cloud tools.",
    summary:
      "A collaborative project in Pranathi Nagabhushana's repository: a Next.js client and a FastAPI server that route prompts to a local ComfyUI image-generation workflow and images to Gemini Vision for architectural analysis, with a local project library.",
    features: [
      "Local image generation through ComfyUI (FLUX workflow)",
      "Architectural and campus image analysis with Gemini Vision",
      "Next.js client and FastAPI server over a REST API",
      "Local JSON and image storage for generated assets",
    ],
    stack: ["Next.js", "FastAPI", "Python", "ComfyUI", "Gemini Vision"],
    contribution:
      "Collaboration with Pranathi Nagabhushana, who owns the repository. Yukith's commits (Jul 2026) set up the project foundation and integrated local ComfyUI FLUX generation.",
    status: "Collaboration · 2 of 5 commits",
    links: [{ label: "Source (Pranathi's repository)", href: "https://github.com/nagabhushanapranathi-droid/NvidiaProject" }],
    featured: false,
    collaboration: true,
  },
];

export const projectById = (id: string) => PROJECTS.find((p) => p.id === id);
export const FEATURED = PROJECTS.filter((p) => p.featured);
export const MORE_WORK = PROJECTS.filter((p) => !p.featured && !p.collaboration);
/** Work co-built in someone else's repository. */
export const COLLABORATIONS = PROJECTS.filter((p) => p.collaboration);

export const DOMAIN_LABEL: Record<ProjectDomain, string> = {
  security: "Security",
  ai: "Applied AI",
  systems: "Distributed systems",
  hardware: "Hardware",
  web: "Web",
  games: "Games",
  research: "Research",
};
