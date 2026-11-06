/**
 * Hackathons, competitions and events — every one the owner listed (brief of
 * 2026-11-06) plus those on the resume. Participation is recorded as
 * participation; a result is shown only where a source states it.
 *
 * Evidence (docs/CONTENT_VERIFICATION.md §13):
 *   resume      — the current resume (public/resume.pdf, October 2026)
 *   repository  — a project repository names the event
 *   owner       — listed by the owner; no certificate or event page checked yet
 */

export type EventDomain = "hardware" | "ai" | "security" | "quantum" | "data" | "agents" | "general" | "organising";
export type EventRole = "Participant" | "Finalist" | "National finalist" | "Top 30 finalist" | "Top 15" | "Runner-up" | "Winner" | "Organiser" | "Student coordinator";
export type EventEvidence = "resume" | "repository" | "owner";

export interface EventRecord {
  id: string;
  name: string;
  /** Who ran it, as far as a source says. */
  organiser?: string;
  /** Host institution or platform. */
  host?: string;
  domain: EventDomain;
  role: EventRole;
  /** Placement or outcome — only when a source states it. */
  result?: string;
  year?: string;
  /** Project built for it (src/data/projects.ts id). */
  project?: string;
  description: string;
  evidence: EventEvidence;
  /** What the evidence is, in a few words. */
  source: string;
  /** Shown in the record when something is still unconfirmed. */
  pending?: string;
}

export const EVENTS: EventRecord[] = [
  // ── Results ────────────────────────────────────────────────────────────────
  {
    id: "sih-2025",
    name: "Smart India Hackathon 2025",
    organiser: "Government of India",
    domain: "general",
    role: "Top 30 finalist",
    result: "Top 30 finalist · national level",
    year: "2025",
    description: "Reached the national top 30 of India's government-run hackathon.",
    evidence: "resume",
    source: "Resume: “Smart India Hackathon 2025 – Top 30 Finalist, national level (Government of India)”",
  },
  {
    id: "nirmith-2026",
    name: "Nirmith 2026",
    host: "NITTE Meenakshi Institute of Technology (NMIT)",
    domain: "general",
    role: "National finalist",
    result: "National finalist",
    year: "2026",
    description: "A national-level hackathon at NMIT, Bengaluru; reached the final.",
    evidence: "resume",
    source: "Resume: “Nirmith 2026 – National Finalist, NITTE Meenakshi Institute of Technology”",
  },
  {
    id: "innovatex-hardware-hackathon",
    name: "InnovateX 4.0 Hardware Hackathon",
    host: "Presidency University",
    domain: "hardware",
    role: "Runner-up",
    result: "Runner-up",
    year: "2026",
    description: "Hardware hackathon at Presidency University's InnovateX 4.0; finished runner-up.",
    evidence: "resume",
    source: "Resume: “InnovateX 4.0 Hardware Hackathon and Hardware Expo – Runner-Up (both)”; InnovateX 4.0 was held in April 2026",
  },
  {
    id: "innovatex-hardware-expo",
    name: "InnovateX 4.0 Hardware Expo",
    host: "Presidency University",
    domain: "hardware",
    role: "Runner-up",
    result: "Runner-up",
    year: "2026",
    description: "The hardware exhibition at InnovateX 4.0; finished runner-up.",
    evidence: "resume",
    source: "Resume (as above)",
  },
  {
    id: "prompt-wars-presidency",
    name: "Prompt Wars",
    host: "Presidency University",
    domain: "ai",
    role: "Top 15",
    result: "Top 15 of 180 teams",
    description: "A prompt-engineering competition at Presidency University; placed in the top 15 of 180 teams.",
    evidence: "resume",
    source: "Resume: “Prompt Wars, Presidency University – Top 15 of 180 teams” (no year given)",
    pending: "The resume gives no year. It is kept separate from the Hack2Skill PromptWars events below; whether it is the same event as one of them is not confirmed.",
  },
  // ── Organising ─────────────────────────────────────────────────────────────
  {
    id: "innovatex-organiser",
    name: "InnovateX Tech Fest",
    host: "Presidency University",
    domain: "organising",
    role: "Organiser",
    year: "2026",
    description: "Organised the tech fest: 10 concurrent technical events, about 280 participants in 60–70 teams; the fest received World Record recognition.",
    evidence: "resume",
    source: "Resume: “Organiser, InnovateX Tech Fest: 10 concurrent events, ~280 participants, 60-70 teams; World Record — 2026”",
  },
  {
    id: "aws-innovation-challenge",
    name: "30-hour AWS Innovation Challenge",
    host: "Presidency University",
    domain: "organising",
    role: "Student coordinator",
    description: "Student coordinator of a 30-hour AWS innovation challenge at Presidency University.",
    evidence: "resume",
    source: "Resume: “Student Coordinator, 30-hour AWS Innovation Challenge – Presidency University” (no date)",
  },
  // ── Built for ──────────────────────────────────────────────────────────────
  {
    id: "promptwars-acm",
    name: "PromptWars × ACM",
    organiser: "ACM SRM Student Chapter · Hack2Skill",
    host: "SRM Institute of Science and Technology",
    domain: "ai",
    role: "Participant",
    year: "2026",
    project: "fairshift",
    description: "A solo, surprise-problem vibe-coding event. Built FairShift — provable hours, readable pay and accountable safety reports for frontline workers.",
    evidence: "repository",
    source: "Submission repository Dr-M-Suchithra-lab/ACM-SRM-PromptWars-2026 (“PromptWars workshop – ACM SRM Student Chapter”, Oct 2026); Hack2Skill per the owner",
  },
  {
    id: "fetchathon-3",
    name: "Fetch-A-Thon 3.0",
    organiser: "GDG · Fetch.ai (ASI:One Agent Challenge)",
    domain: "agents",
    role: "Participant",
    year: "2026",
    project: "warden",
    description: "Agent hackathon on Fetch.ai's uAgents and ASI:One. Built WARDEN, a security layer that checks an AI agent's actions before and after they run.",
    evidence: "repository",
    source: "WARDEN README: “Built for Fetch-A-Thon 3.0 · ASI:One Agent Challenge”; GDG per the owner",
  },
  {
    id: "qiskit-fall-fest",
    name: "Qiskit Fall Fest 2026",
    host: "IIIT Kottayam",
    domain: "quantum",
    role: "Participant",
    year: "2026",
    project: "waterweave",
    description: "Quantum-computing hackathon, Track 2 (optimisation). Built WATERWEAVE — fair water rationing solved three ways, including a 12-qubit QAOA circuit.",
    evidence: "repository",
    source: "WATERWEAVE README: Qiskit Fall Fest 2026 IIIT Kottayam, Track 2",
  },
  {
    id: "odoo-nmit",
    name: "Odoo × NMIT Hackathon 2026",
    host: "NMIT",
    domain: "general",
    role: "Participant",
    year: "2026",
    description: "Took part in the Odoo × NMIT hackathon.",
    evidence: "resume",
    source: "Resume: “Participant: … Odoo x NMIT Hackathon 2026”",
  },
  {
    id: "isaca-cyber-ai",
    name: "ISACA Cybersecurity × AI Hackathon",
    organiser: "ISACA",
    domain: "security",
    role: "Participant",
    description: "A hackathon at the meeting point of cybersecurity and AI.",
    evidence: "resume",
    source: "Resume lists “ISAKA Hackathon”; the owner names it ISACA Cybersecurity × AI Hackathon",
    pending: "Taken to be the resume's “ISAKA Hackathon” (spelling). No year on record.",
  },
  // ── Owner-listed participation ─────────────────────────────────────────────
  {
    id: "altronix",
    name: "Altronix",
    host: "InnovateX, Presidency University",
    domain: "hardware",
    role: "Participant",
    description: "An electronics event at InnovateX.",
    evidence: "owner",
    source: "Owner's list of events (2026-11-06)",
    pending: "Year and format not on record.",
  },
  {
    id: "genai-promptwars",
    name: "GenAI × PromptWars",
    organiser: "Hack2Skill",
    domain: "ai",
    role: "Participant",
    description: "A generative-AI edition of PromptWars.",
    evidence: "owner",
    source: "Owner's list of events (2026-11-06)",
    pending: "Year not on record.",
  },
  {
    id: "codex-promptwars",
    name: "CodeX × PromptWars",
    organiser: "Hack2Skill",
    domain: "ai",
    role: "Participant",
    description: "A coding edition of PromptWars.",
    evidence: "owner",
    source: "Owner's list of events (2026-11-06)",
    pending: "Year not on record.",
  },
  {
    id: "ai-video",
    name: "AI Video Generation Competition",
    domain: "ai",
    role: "Participant",
    description: "A competition in generating video with AI tools.",
    evidence: "owner",
    source: "Owner's list of events (2026-11-06)",
    pending: "Organiser and year not on record.",
  },
  {
    id: "solution-challenge",
    name: "Solution Challenge — Build with AI",
    domain: "ai",
    role: "Participant",
    description: "A build-with-AI solution challenge.",
    evidence: "owner",
    source: "Owner's list of events (2026-11-06)",
    pending: "Organiser and year not on record.",
  },
  {
    id: "ibm-z-datathon",
    name: "IBM Z Datathon",
    organiser: "IBM",
    domain: "data",
    role: "Participant",
    description: "A data challenge around IBM Z.",
    evidence: "owner",
    source: "Owner's list of events (2026-11-06)",
    pending: "Year not on record.",
  },
  {
    id: "presidency-ide",
    name: "Presidency IDE Hackathon",
    host: "Presidency University",
    domain: "general",
    role: "Participant",
    description: "A hackathon at Presidency University.",
    evidence: "owner",
    source: "Owner's list of events (2026-11-06)",
    pending: "Year not on record.",
  },
  {
    id: "cyber-competition",
    name: "Cybersecurity competition",
    domain: "security",
    role: "Participant",
    description: "A cybersecurity competition.",
    evidence: "owner",
    source: "Owner's list of events (2026-11-06)",
    pending: "Name, organiser and year not on record.",
  },
];

export const eventById = (id: string) => EVENTS.find((e) => e.id === id);

export const DOMAIN_NAME: Record<EventDomain, string> = {
  hardware: "Hardware",
  ai: "AI",
  security: "Security",
  quantum: "Quantum",
  data: "Data",
  agents: "AI agents",
  general: "Hackathon",
  organising: "Organising",
};

export const EVIDENCE_LABEL: Record<EventEvidence, string> = {
  resume: "On the resume",
  repository: "Named in the project repository",
  owner: "Listed by Yukith",
};

/** Results first, then roles, then participation. */
export const RESULT_ROLES: EventRole[] = ["Winner", "Runner-up", "National finalist", "Top 30 finalist", "Finalist", "Top 15"];
export const EVENT_RESULTS = EVENTS.filter((e) => RESULT_ROLES.includes(e.role));
export const EVENT_ORGANISING = EVENTS.filter((e) => e.role === "Organiser" || e.role === "Student coordinator");
export const EVENT_PARTICIPATION = EVENTS.filter((e) => e.role === "Participant");
