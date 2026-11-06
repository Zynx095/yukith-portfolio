# Content verification

Every fact the portfolio shows, where it came from, and what still needs the owner's review.
Re-checked on **2026-11-06 (second pass)** after the owner's content decisions (§11), and extended
the same day for the living-world expansion (§12–§16: gaming, every event, home and origins, the
library, the aim trainer). Checked against: the GitHub API (account `Zynx095`, including source
trees, not only READMEs), both resumes in this repository's history, the owner's own notes kept in
this repository's history (`src/data/personal.ts` at `71fa39b`), the owner's briefs, and live HTTP
checks of every link.

**Status words used below.** *Verified* — a document or repository states it. *Owner-reported* —
the owner stated it in a brief or in their own notes; nothing independent was checked. *Review* —
shown with an explicit caveat on the site, because something about it is still uncertain.

**Rule:** the site may only state what one of these sources supports. If a source is missing, the
item is either left out or marked `review` in `src/data/*`.

## 1. Resumes compared

| File | Date | Notes |
|---|---|---|
| `public/resume.pdf` @ `6b1b71f` | 2026-10-07 | **Current. Source of truth.** One page. Lists Elevance Skills + NVIDIA capstone, Q-SHIELD, JIVA, ETTH, ALIAS, Sugar AI, TRC, achievements, leadership, skills. |
| `public/resume.pdf` @ `90471e2` | 2026-05-15 | Superseded. Contains claims the current resume dropped (see below). Not used except where noted. |

Claims in the old resume that are **not** used, because the current resume dropped them and no
repository supports them: "sub-second response latency" (Sugar AI), "targeting 100% hands-off
operation", "priority-based task scheduler", "physics-accurate Unity simulation" (STP bot),
"reducing manual inspection overhead by an estimated ~70%" (smart waste), "high precision" /
"low false-positive rates" (deepfake detection), "out of thousands of national teams" (SIH).

## 2. Identity and education (current resume)

| Fact | Source |
|---|---|
| Yukith M Joseph, Bengaluru, India | resume |
| B.Tech, Computer Science & Engineering (Networks), Presidency University, Bengaluru, 2024 – 2028 (expected) | resume |
| CGPA 7.56 / 10 | resume |
| Coursework: Computer Networks, Network Security, AI, DBMS, Data Structures & Algorithms | resume |
| Email yukithj@gmail.com · linkedin.com/in/yukith-joseph · github.com/Zynx095 | resume |
| Instagram @yuxith_pov | owner's brief (2026-11-06) |

The phone number on the resume is **not** shown on the site (it stays inside the PDF only).
The date of birth that was in `src/data/personal.ts` was removed from the data.

## 3. Experience (current resume)

| Role | Dates | What is claimed | Repository |
|---|---|---|---|
| Full-Stack Development Intern, **Elevance Skills** | Jun 2026 (1 month) | Built *YukithHub*: Next.js/React/TypeScript, Node/Express, MongoDB; JWT/bcrypt, email + SMS OTP, password recovery, device-based login rules, login history, Razorpay subscription tiers with emailed invoices, reward points, six-language support with OTP-gated switching | `Zynx095/ElevanceSkills-internship-project` (README matches). Live URL in the repo returns **404** — not linked. |
| Capstone project, **Presidency University × NVIDIA** | 1 – 10 Jun 2026 | Built *AUTOHIRE*: PyMuPDF resume parsing, Sentence Transformers (all-MiniLM-L6-v2, CUDA with CPU fallback), deterministic ATS scoring, no external APIs; candidate portal + recruiter console | `Zynx095/NvidiaProject` (README matches) |

Correction made: the data previously said "Elevance" and "NVIDIA × Presidency University —
Capstone Project Internship". The resume says **Elevance Skills** and **Capstone Project**; the
site now uses those names and never says "internship at NVIDIA".

## 4. Projects (source trees inspected, not only READMEs)

| Project | Verified implementation | Status shown | Links verified |
|---|---|---|---|
| **WARDEN** | `src/warden/{security,risk,auditor,audit,execution,hosting,presentation}`; uAgents 0.26.1, Agent Chat Protocol 0.3.0, ASI:One Interactive Cards; deterministic policy rules WDN-000…006; HMAC-bound approvals; hash-chained JSONL audit log. README reports 734 passing tests. Built for Fetch-A-Thon 3.0 (README credits). | Hackathon prototype · hosted | repo ✔ · `warden-sentinel.onrender.com/health` ✔ (HTTP 200 after a ~32 s cold start) |
| **Q-SHIELD** | FastAPI gateway, trust engine (six weighted factors 25/20/15/15/15/10, hysteresis 80/50/85), ML-KEM-768 + ML-DSA-65 via `pqcrypto` checked against NIST ACVP vectors, OpenCV + YOLO11n vision service with camera-tamper checks. README's own table: device telemetry **simulated**, ESP32 firmware **skeleton only**, attacks **synthetic**. | Hackathon prototype | repo ✔ · `q-shield-chi.vercel.app` ✔ |
| **JIVA** | TypeScript monorepo: `services/api`, 9 shared packages, role-scoped apps; Hospital Acceptance Protocol; Valhalla/OSRM/synthetic routing; confidence + provenance; 20 adversarial scenarios. AWS (EventBridge, API Gateway, Lambda, DynamoDB, Cognito, Bedrock) **modelled in CDK — `cdk synth` passes, nothing deployed**. | Phase 6 frozen; decision authority in shadow mode | repo ✔ |
| **ETTH** | Bidirectional flow reconstruction from PCAPs, TLS ClientHello parsing, JA3/JA3S/JA4, GroupShuffleSplit leakage controls, five experiment configurations (A–E). README test table: **459 passed** (was 46 in the old data). Central research claim **blocked on independent data** (README). | Active research | repo ✔ |
| **AURA** | `backend/{yolo_engine,tracker,subject_engine,zone_engine,event_engine,narrator}.py`; YOLOv8, centroid tracking, NORMAL → OBSERVED → SUSPICIOUS, polygon zones, incidents with evidence snapshots, JWT/bcrypt, Next.js dashboard. **Team of two**: Yukith (AI systems & backend), Pranathi Nagabhushana (frontend/UX). RTSP partially done; Gemini narration experimental. | Active development · local prototype | repo ✔ |
| **ALIAS** | `backend/app/detection/baseline/{temporal,device,location,network,auth,access}_model.py`, anomaly engine, correlation + risk engine, investigations API, React SOC dashboard. Resume: Gemini-generated reports, 61 backend tests. (The README still describes Phase 1 only; the code and resume are newer.) | Complete prototype | repo ✔ · `alias-ochre.vercel.app` ✔ |
| **ShadowGuard** | `proxy.py`: a **mitmproxy** addon that intercepts ChatGPT / OpenAI chat traffic and hard-blocks keywords. `main.py`: FastAPI + **Microsoft Presidio** PII analysis → BLOCK / REDACT / ALLOW, SQLite log, WebSocket alerts; React + Tauri dashboard. The deepfake / media scores are **simulated with random numbers** in the code, so they are not claimed. **No USB/storage monitoring exists in the code.** | Prototype · rework started 2026-09-14 | repo ✔ |
| **Sugar AI** | V2 rework (Oct 2026): `sugar/audio/{stt,tts,vad,endpointing}`, faster-whisper, bundled MeloTTS, provider pool (Ollama, optional Claude / OpenAI-compatible), tool registry, Windows control (Win32, UI Automation, media sessions), Spotify + YouTube, token-protected WebSocket UI, tests. (Repository README still describes V1.) | V2 in development | repo ✔ |
| **STP BOT** | `arduino/stp_robot_controller.ino`: Arduino Mega differential drive, **auger** motor with pulse mode, ultrasonic ranging + proximity buzzer, serial telemetry. `ai-vision/yolo_detection.py`: YOLOv8n tracking that sends auger commands over serial (demo mapping of COCO classes to waste types). `dashboard/dashboard.html`: manual/AI modes, gamepad input, SOS buttons. **The Unity simulation is not in the repository → not claimed.** | Prototype | repo ✔ |
| FairShift | Next.js PWA for frontline workers: HMAC work receipts + Merkle checkpoints, Money Jar, wage-discrepancy notices, Accountability Loop, rotating QR + WebAuthn check-in, six languages. Built solo for **PromptWars × ACM SRM Student Chapter** (SRM Institute of Science and Technology): the submission repository `Dr-M-Suchithra-lab/ACM-SRM-PromptWars-2026` describes itself as "Student submissions for the PromptWars workshop – ACM SRM Student Chapter" (created 2026-10-27); `Zynx095/promptwarsXACM` was created the same day. | Hackathon build, synthetic data | repo ✔ · `fairshift-nine-red.vercel.app` ✔ |
| WATERWEAVE | Water-rationing optimisation solved three ways (greedy, exhaustive, 12-qubit QAOA in Qiskit), React web app. Qiskit Fall Fest 2026 (IIIT Kottayam) Track 2; solo. README: all data synthetic. | Hackathon build | repo ✔ |
| STREET HIERARCHY | 72 Luau scripts, server-authoritative economy, 8 zones, 34 fighters, 49 pets (README). | Playable alpha | repo ✔ |
| T R Constructions | Next.js 16 / Tailwind v4 / GSAP / R3F client site. | Live | repo ✔ · `trcstructures.vercel.app` ✔ |
| Dayflow HRMS | Express + PostgreSQL HRMS; hackathon; team: Yukith (backend, DB, security), Pranathi (frontend). | Hackathon build | repo ✔ · live ✔ |

### Not shown (and why)

| Name in the brief | Finding |
|---|---|
| PRANA | **Now shown under "Collaborations"** (owner decision, §11), explicitly as collaborative work. Lives in `nagabhushanapranathi-droid/NvidiaProject` (Pranathi's repository). Yukith authored 2 of 5 commits (2026-07-10 "feat: integrate local ComfyUI FLUX generation", 2026-07-11 "chore: initialize Campusanalyzer project foundation"). What is stated comes from that repository's README and description (Next.js client, FastAPI server, local ComfyUI generation, Gemini Vision analysis, local storage). No link to the NVIDIA capstone is claimed. |
| Food Waste Rescue, Rural Bus Tracker, Deepfake Detector, EDITH AR | **No repository found** on the account or its collaborations. **Excluded until verifiable repository evidence exists** (owner decision, §11). |
| Smart Dustbin IoT (`Smart-Waste_Management`) | Repository is documentation plus two firmware stubs (707 B and 968 B). Not featured. |
| NIDS (`network-intrusion-detection-system`) | Single-commit scaffold of README stubs. Not featured. |
| `kipkip` | Private, personal. Never shown. |

## 5. Achievements

| Achievement | Source | Note |
|---|---|---|
| Smart India Hackathon 2025 — Top 30 Finalist (national, Government of India) | resume | |
| Nirmith 2026 — National Finalist, NITTE Meenakshi Institute of Technology | resume | |
| InnovateX 4.0 Hardware Hackathon — Runner-Up, Presidency University | resume | **Year corrected to 2026.** InnovateX 4.0 was held in April 2026 (Careers360 report); the old data said 2024. |
| InnovateX 4.0 Hardware Expo — Runner-Up | resume | same |
| Prompt Wars — Top 15 of 180 teams, **Presidency University** | resume | Resolved. The resume (committed 2026-10-07) states "Prompt Wars, Presidency University - Top 15 of 180 teams". The ACM SRM PromptWars event that FairShift was submitted to started on 2026-10-27, **after** that resume — they are different events, so the result is attributed to Presidency University as the resume says, and FairShift to ACM SRM. **No year is shown** because the resume gives none. |
| Participant — ISAKA Hackathon; Odoo × NMIT Hackathon 2026 | resume | The "2026" on that resume line belongs to the Odoo × NMIT entry; **ISAKA is shown without a year**. |
| Built WARDEN for Fetch-A-Thon 3.0; WATERWEAVE for Qiskit Fall Fest 2026 | repositories | participation only; no placement claimed |
| Microsoft Azure AI Fundamentals (**AI-900**) | resume | Corrected: the old data said "AZ-900", which is a different exam. |

## 6. Leadership

| Role | Source | Note |
|---|---|---|
| Student Coordinator, 30-hour AWS Innovation Challenge, Presidency University | resume | The resume gives **no date** for this line (layout-aware extraction: the "2026" sits on the InnovateX line). Shown without a date and not placed on a growth ring. |
| Organiser, InnovateX Tech Fest: 10 concurrent events, ~280 participants, 60–70 teams, World Record recognition | resume | **Corrected to 2026.** Both resumes date this role 2026; the earlier site data said "2024 – present". |
| Event Head, Build Club · Core Coordinator, One-O-One Club · Event Head, Informatica Club | resume | |
| Social Media Head, InTech Club (June 2026 – present) | owner-provided: `src/data/personal.ts` and `leadership.ts` before the rebuild ("June 2026 – Present"; "Posting content given and ensuring reach across LinkedIn and Instagram") and the owner's brief | Kept (owner decision, §11) with **only that verified responsibility**. Not on the current resume. |
| "Magic Shop" | old `personal.ts` only | dropped — no details anywhere |

## 7. Links (HTTP-checked 2026-11-06)

| Link | Result |
|---|---|
| github.com/Zynx095 | 200 |
| linkedin.com/in/yukith-joseph | 999 (LinkedIn blocks automated requests). Matches the current resume. The other slug, `/in/yukith`, is **not** used. |
| instagram.com/yuxith_pov/ | 200 |
| warden-sentinel.onrender.com/health | 200 (cold start ~32 s) |
| alias-ochre.vercel.app · fairshift-nine-red.vercel.app · q-shield-chi.vercel.app · trcstructures.vercel.app | 200 |
| elevance-skills-internship-project.vercel.app | **404** — not linked |
| /resume.pdf | served from `public/` |

## 8. Personal details

Kept (owner-provided, not sensitive): Bengaluru; Bella the Shih Tzu; interests — Elden Ring,
Valorant, Bleach, Tomodachi Game, Jujutsu Kaisen, Lookism, *Dark*, R&B, reading, writing and
storytelling, food (no title is called a "favourite" — the owner's notes list them, they do not
rank them; see §15); languages — English, Telugu, Hindi, Kannada, French; the lesson "Never give up";
currently learning threat management and intrusion detection.

Removed from the site: date of birth, school marks, relationship details and the list of
family members. Resolved by the owner's decision (§11): the site uses only the generic word
"family" — no names, numbers or relationships (the two old sources disagreed anyway).

## 9. Growth rings (lib/world/rings.ts)

The three rings in the journey are generated from `src/data`, never written by hand:

| Ring | Items (one glowing node each) | Rule |
|---|---|---|
| 2024 · Roots | Started the B.Tech (education period 2024 – 2028); Event Head, Build Club; Core Coordinator, One-O-One Club; Event Head, Informatica Club (all "2024 – present") | start year = 2024 |
| 2025 · Reach | Smart India Hackathon 2025 — Top 30 Finalist; the three 2024 roles shown as still running | year = 2025 |
| 2026 · Branching | 14 projects (every own project's period is in 2026); Elevance Skills internship; Presidency University × NVIDIA capstone; Nirmith finalist; InnovateX 4.0 runner-up ×2; InnovateX Tech Fest organiser; InTech Club Social Media Head | year = 2026 |

Undated items — AI-900, Prompt Wars, ISAKA, the AWS coordinator role — are not placed on a ring.
Stage names ("Roots", "Reach", "Branching") are descriptive labels, not claims.

## 10. Copy written for the site

| Text | What it rests on |
|---|---|
| Intro: "I build working systems across security, applied AI, networking and hardware — and I'm precise about what each one does." | the projects in §4 (security: WARDEN, Q-SHIELD, ALIAS, ShadowGuard; applied AI: AURA, Sugar AI, AUTOHIRE; networking: ETTH; hardware: STP BOT) and the "honest limits" each record carries |
| About ¶1 — the three example systems | Q-SHIELD (continuous trust), WARDEN (agent actions checked before they run), ETTH (no decryption) |
| About ¶2 — "Several of these projects began at hackathons… Top 30 national final at Smart India Hackathon 2025, national finalist at Nirmith 2026, runner-up twice at InnovateX 4.0… organised the InnovateX Tech Fest and lead events for three university clubs." | WARDEN, Q-SHIELD, FairShift, WATERWEAVE and Dayflow are hackathon builds (§4); results §5; roles §6 |
| Home narration — "family, Bella, and a PC built from scrap parts" | `src/data/about.ts` (owner-provided `firstMachine`); family is named generically (§8) |
| Classic stats — 14 projects, 2 industry engagements, 20 hackathons/competitions/events, 5 finals and placings | counted from `src/data` at build time (`EVENTS.length`, `EVENT_RESULTS.length`) |

## 11. Owner decisions applied (2026-11-06)

| Item | Decision | Applied |
|---|---|---|
| InTech Club Social Media Head | keep, with verified responsibilities only | ✔ §6 |
| PromptWars | keep, with accurate institutional attribution | ✔ §5 (result → Presidency University per the resume; FairShift → ACM SRM) |
| PRANA | keep under Collaborations, explicitly collaborative | ✔ §4 |
| Food Waste Rescue, Rural Bus Tracker, Deepfake Detector, EDITH AR | exclude until repository evidence exists | ✔ not on the site |
| Family | the generic word "family" only | ✔ no names or relationships anywhere |
| Earlier corrections (ETTH 459 tests, InnovateX 4.0 in 2026, AI-900, Elevance Skills, ShadowGuard scope, no STP BOT Unity claim) | keep | ✔ re-checked in `src/data` |


## 12. Competitive gaming (`src/data/gaming.ts`) — added 2026-11-06

Source for every row: the owner's brief of 2026-11-06 ("Master execution prompt", sections
*Valorant*, *Counter-Strike*, *Mobile Legends*). No screenshot, tracker profile or certificate has
been checked. Shown on the site as "As reported by Yukith".

| Claim on the site | Brief's wording | Status | Evidence that would verify it |
|---|---|---|---|
| Valorant — Immortal 1, current rank | "My current rank is: Immortal 1." | owner-reported | a tracker profile or in-client screenshot (would also date "current") |
| CS:GO — Legendary Eagle, labelled "CS:GO rank (not a CS2 rank)" | "Legendary Eagle in CS:GO." · "Do not claim CS2 rank" | owner-reported | a screenshot from the CS:GO era |
| Mobile Legends — Grandmaster, "rank reached" | "Grandmaster rank in Mobile Legends: Bang Bang." | owner-reported | an in-game profile screenshot |
| AMD Valorant tournament — 4th place | "Finished fourth in an AMD Valorant tournament." | owner-reported | the bracket page or a certificate (would add the year, the event name and who ran it — the site does not say AMD organised it) |
| School Valorant tournaments — multiple played | "Played in multiple school tournaments." | owner-reported | — |
| College Valorant tournaments — played | "Played in college tournaments." | owner-reported | — |
| Multiple tournament wins, stated once across school **and** college | "Won multiple tournaments across school and college competitions." | owner-reported | certificates; until then no win is attributed to a level or a named event |

Deliberately **not** shown, because none were supplied: tournament names, dates, prize money, team
names, match or agent statistics, win rates, K/D, heroes, seasons, any CS2 rank. The arena's
levels wall is titled "Competitive levels — not a timeline" because no dates exist to order it.
Emblems are original vector shapes (`components/shared/Emblems.tsx`, `lib/world/emblemCanvas.ts`);
no publisher rank icons, logos or fonts are used.

## 13. Hackathons, competitions and events (`src/data/events.ts`) — added 2026-11-06

All 16 events in the owner's list are shown, plus the resume's events that were not on that list
(Smart India Hackathon 2025, Prompt Wars at Presidency University, the AWS Innovation
Challenge role, the InnovateX Tech Fest organising role) — **20 records**. Each carries its
evidence on the site ("On the resume", "Named in the project repository", "Listed by Yukith") and,
where something is unknown, a visible "not on record" note. Results appear only where a source
states one; every other record says *Participant*. No order is implied: the district is arranged
by kind (results, organising, participation), not by date.

| Event | Role / result shown | Year shown | Status | Source | Evidence still needed |
|---|---|---|---|---|---|
| Smart India Hackathon 2025 | Top 30 finalist, national level | 2025 | verified | resume | — |
| Nirmith 2026 (NMIT) | National finalist | 2026 | verified | resume | — |
| InnovateX 4.0 Hardware Hackathon (Presidency University) | Runner-up | 2026 | verified | resume; InnovateX 4.0 held April 2026 | — |
| InnovateX 4.0 Hardware Expo | Runner-up | 2026 | verified | resume | — |
| Prompt Wars, Presidency University | Top 15 of 180 teams | none | verified (result) · review (identity) | resume | the year, and whether it is one of the Hack2Skill PromptWars below — kept separate until known |
| InnovateX Tech Fest | Organiser | 2026 | verified | resume | — |
| 30-hour AWS Innovation Challenge | Student coordinator | none | verified | resume (undated line) | a date |
| PromptWars × ACM (SRM, Hack2Skill) | Participant · built FairShift | 2026 | verified | submission repository `Dr-M-Suchithra-lab/ACM-SRM-PromptWars-2026`; Hack2Skill per the owner | — |
| Fetch-A-Thon 3.0 (GDG · Fetch.ai) | Participant · built WARDEN | 2026 | verified | WARDEN README; GDG per the owner | — |
| Qiskit Fall Fest 2026 (IIIT Kottayam) | Participant · built WATERWEAVE | 2026 | verified | WATERWEAVE README | — |
| Odoo × NMIT Hackathon 2026 | Participant | 2026 | verified | resume | — |
| ISACA Cybersecurity × AI Hackathon | Participant | none | review | resume says "ISAKA Hackathon"; taken to be the same event (spelling) | confirmation of the name, and a year |
| Altronix (InnovateX) | Participant | none | owner-reported | owner's list | year, format |
| GenAI × PromptWars (Hack2Skill) | Participant | none | owner-reported | owner's list | year, certificate |
| CodeX × PromptWars (Hack2Skill) | Participant | none | owner-reported | owner's list | year, certificate |
| AI Video Generation Competition | Participant | none | owner-reported | owner's list | organiser, year |
| Solution Challenge — Build with AI | Participant | none | owner-reported | owner's list | organiser, year |
| IBM Z Datathon | Participant | none | owner-reported | owner's list | year, certificate |
| Presidency IDE Hackathon | Participant | none | owner-reported | owner's list | year |
| Cybersecurity competition | Participant | none | owner-reported | owner's list ("Cybersecurity competition/event") | name, organiser, year |

Each district exhibit is an original artifact chosen by the event's domain (prototype bench for
hardware, lattice for AI, circuit for quantum, data wall, agent core, terminal for security,
trophies for results, banners for organising). The artifact is decoration; the words come from the
record.

## 14. Home and origins (`src/data/origins.ts`) — added 2026-11-06

Source: the owner's own notes (`src/data/personal.ts` at `71fa39b`) and the 2026-11-06 brief.

| Shown | Owner's wording | Status |
|---|---|---|
| Memory: "The day the whole family came to my birthday party." | "When my entire family attended my birthday party. That day is a core memory for me." | owner-reported |
| Memory: a PC built from scrap parts; Elden Ring and CS:GO first; Python first language | `firstTechnology`: "A custom built PC from scraps", firstGame "Elden Ring / CSGO", firstLanguage "Python" | owner-reported |
| Memory: dreaming of playing the games watched on YouTube or at a friend's home | childhood `description` | owner-reported |
| Memory: getting into a hackathon on the strength of a pitch; first real-time project | `realization` | owner-reported |
| Memory: feeling a little lost, then locking in on one's own path | `definingMoment` | owner-reported |
| Schools: NCFE (5 years), Orchids The International School (7 years), with one memory each | `schools` (marks and medal counts are **not** shown) | owner-reported |
| A school counsellor in eighth grade shaped how I see things | `influences` | owner-reported |
| Bella the Shih Tzu | `siblings`: "a cute lil dog (shih tzu), her name is Bella" | owner-reported |
| Five faceless figures at the camp: at the grill, two talking, resting by the fire, playing with Bella | the activities the brief suggested ("someone cooking at a barbecue, people talking together, someone relaxing, someone playing, Bella") | staging, not a claim |

The figures have no names, faces, relationships or ages; each one's record is headed "Home · a
scene, not a portrait" and says the figures stand for no one in particular. The lines describe the
scene only and claim no habits ("usually", "always" were removed in review). Not shown anywhere:
the number of family members, any relationship (including the partner mentioned in the old notes),
the date of birth, school marks.

**Owner review:** the camp shows five figures because the brief's activities need at least five.
The owner's notes say the family has three members; the scene does not say the figures are the
family, but if five figures reads as more people than there are, the talking pair can be removed
(`FAMILY_MOMENTS` in `src/data/origins.ts` and the looks in `components/experience/scene/Family.tsx`).

## 15. The library (`src/data/library.ts`) — added 2026-11-06

Only titles the owner named are shown (`interests` in the owner's notes and `src/data/about.ts`).
No title is called a favourite: the notes list them, they do not rank them.

| Volume | Note shown | Source | Status |
|---|---|---|---|
| Lookism (manhwa) | "Character: Shingen Yamazaki. Its power hierarchy inspired STREET HIERARCHY, my fan-made Roblox game." | `interests.manhwa`; `interests.fictionalCharacter` ("Shingen Yamazaki from Lookism"); the `Zynx095/Robloxgame` README ("inspired by the power hierarchy of the Lookism webtoon … unofficial, fan-made") | verified (inspiration) · owner-reported (character) |
| Jujutsu Kaisen (manga) | on the manga shelf | `interests.manga` | owner-reported |
| Bleach, Tomodachi Game (anime) | on the anime shelf | `interests.anime` | owner-reported |
| Dark (series) | "A TV series I've watched." | `interests.tvShows` | owner-reported |
| Elden Ring (games) | "One of the first games on the scrap-built PC." | `firstTechnology.firstGame` | owner-reported |
| Stories I write | reading, writing novels, storytelling | `interests.hobbies` | owner-reported |
| R&B (music) | "The music I listen to." | `interests.music` | owner-reported |

Covers, spines and the manhwa strip are original abstract designs drawn in code (colour fields,
stripes, simple marks). No cover art, panels, characters, logos or lettering from any of these
works is reproduced.

## 16. The aim trainer — added 2026-11-06

An original portfolio mini-game (`lib/aim/engine.ts`, `components/aim/AimTrainer.tsx`): its own
room, targets, sounds (synthesised in the browser) and HUD. No Riot Games or Valorant maps, models,
textures, audio, logos, fonts or UI are used or imitated, and the game labels itself as a portfolio
mini-game that is not affiliated with Riot Games (checked by `scripts/qa-aim.mjs`). Scores stay in
the visitor's browser (`localStorage`), never leave it, and are not presented as anyone's real
statistics.
