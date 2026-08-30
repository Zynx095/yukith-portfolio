# YUKITH PORTFOLIO — CODEX HANDOFF
## Current State Snapshot — August 2026

IMPORTANT:
This file is the source-of-truth handoff for the next coding agent.

Do NOT restart the project from scratch.

Do NOT replace the existing architecture unless absolutely necessary.

The portfolio has gone through multiple architectural iterations.
The CURRENT implementation is the one that matters.

---

# 1. CURRENT ARCHITECTURE

Framework:

- Next.js
- React
- TypeScript
- React Three Fiber
- Three.js
- Drei
- Framer Motion
- GSAP

The current portfolio uses a unified Three.js/WebGL world experience.

The main journey is:

INTRO
↓
3D STORY WORLD
↓
PROJECT / EXPERIENCE / ACHIEVEMENT LANDMARKS
↓
WORLD TREE
↓
MAIN PORTFOLIO

The World Tree is the central visual metaphor.

---

# 2. IMPORTANT ARCHITECTURAL RULE

DO NOT PERFORM ANOTHER FULL RESET.

The current system already works.

Preserve:

- Next.js
- React Three Fiber
- Three.js
- ScrollControls
- CameraController
- proximity system
- existing story zones
- existing project data
- existing experience data
- existing leadership data
- existing education data
- WorldTree
- MainPortfolio
- existing routing
- existing transition architecture

Future work should primarily improve:

VISUAL QUALITY
UX
STORYTELLING
INTERACTION
PERFORMANCE
READABILITY

---

# 3. CURRENT 3D STORY JOURNEY

The portfolio currently uses a cinematic scrolling world.

The visitor scrolls through a dark atmospheric environment.

The camera moves through story landmarks.

Existing zones include:

- Childhood
- First Tech
- University
- AURA
- ETTH
- ShadowGuard
- Sugar AI
- Achievements
- Leadership
- Experience
- WorldTree

The camera eventually reaches the World Tree.

---

# 4. CAMERA SYSTEM

Current camera system:

`CameraController.tsx`

It uses:

- ScrollControls
- spline/cinematic camera movement
- damping
- interpolation
- look-at interpolation
- subtle camera banking
- parallax
- reduced-motion handling

DO NOT replace the camera system casually.

The desired camera feeling:

slow
heavy
cinematic
smooth
physical

Avoid:

- snapping
- robotic movement
- excessive banking
- motion sickness
- extremely fast travel

---

# 5. PROXIMITY SYSTEM

A centralized proximity system exists:

`hooks/useProximity.ts`

It is used by story zones.

The system controls how landmarks react as the camera approaches.

Examples:

AURA:
camera activates

ETTH:
network traffic activates

ShadowGuard:
defense system activates

Sugar AI:
waveform activates

Achievement:
lighting increases

This system should remain centralized.

Do not duplicate expensive distance calculations in every component.

---

# 6. CURRENT ENVIRONMENT

The previous random landscape was removed.

The environment is now intentionally dark.

Current direction:

dark atmospheric world
+
deep charcoal
+
dark wood
+
deep forest green
+
subtle fog
+
small amounts of particles.

The environment should NOT become a generic black Three.js demo.

---

# 7. PROJECT LANDMARKS

Projects currently represented:

AURA
ETTH
ShadowGuard
Sugar AI

These should be visually recognizable.

They should NOT look like:

random cubes
random spheres
generic primitive geometry.

Preferred direction:

illustrated graphical elements
+
3D depth
+
textures
+
billboards
+
particles
+
lighting
+
shaders.

The goal is:

"an illustrated cinematic world that happens to be interactive 3D."

---

# 8. PROJECT INFORMATION PANELS

Each major project should have a contextual floating story/chat panel.

The panel should:

- appear as the camera approaches
- animate smoothly
- remain readable
- stay visually connected to the landmark
- disappear gradually when leaving the zone

Target:

40–80 words where sufficient verified information exists.

The description must explain:

WHAT THE PROJECT IS

WHY IT EXISTS

WHAT IT DOES

HOW IT WORKS

TECHNOLOGY USED

Only use verified information.

NEVER fabricate:

- metrics
- users
- accuracy
- deployment numbers
- clients
- responsibilities
- results
- awards

---

# 9. AURA

AURA should visually communicate:

computer vision
+
surveillance
+
tracking
+
recognition.

Desired elements:

- camera
- lens
- target
- tracking box
- recognition effects
- evidence capture concept
- green illumination

AURA previously had a stronger interactive visualization.

Preserve the concept.

---

# 10. ETTH

ETTH should communicate:

network traffic
+
security analysis.

Visual language:

- network topology
- packet trails
- PCAP
- FLOW
- TLS
- JA4
- flowing data

The network should feel alive.

---

# 11. SHADOWGUARD

ShadowGuard should communicate:

data protection
+
policy
+
defense.

Visual language:

- protected archive
- documents
- image/data representations
- shield
- policy flow
- data entering/leaving system

---

# 12. SUGAR AI

Sugar AI should communicate:

voice AI.

Visual language:

- microphone
- waveform
- sound
- particles
- speech
- Whisper
- Ollama
- MeloTTS

Avoid simple rows of boxes.

---

# 13. ACHIEVEMENTS

Achievement content must be clearly visible.

Important verified achievements include:

- Top 30 Finalist — Smart India Hackathon 2025
- National Finalist — Nirmith 2026 National Level Hackathon
- Runner-up — Hardware Hackathon, InnovateX 4.0
- Runner-up — Hardware Expo

Use actual centralized data.

Do not replace them with vague decorative plaques.

Text must remain readable.

---

# 14. LEADERSHIP

Verified leadership:

InTech Club
Social Media Head
June 2026 – Present

This must have substantial visual presence.

It should NOT appear as a tiny floating block.

It should visually connect to the tree's branching metaphor.

---

# 15. EXPERIENCE

Verified professional experience includes:

NVIDIA

Elevance
Full-Stack Development Intern

Use centralized data.

Do not fabricate confidential responsibilities.

---

# 16. WORLD TREE

THIS IS THE MOST IMPORTANT VISUAL ELEMENT.

The World Tree represents the culmination of Yukith's entire journey.

It should feel:

- enormous
- ancient
- organic
- sacred
- powerful
- dark-fantasy
- natural

Reference direction:

Ancient dark-fantasy world trees.

Elden Ring can be used ONLY as visual inspiration for:

- scale
- roots
- silhouette
- ancient presence
- branching
- atmosphere

DO NOT copy Elden Ring assets.

---

# 17. TREE MATERIAL

TRUNK:

- dark oak brown
- natural bark
- deep grooves
- cracks
- knots
- irregular deformation

ROOTS:

- dark brown
- natural
- organic
- enormous
- spreading through the ground

BRANCHES:

- natural dark brown
- subtle golden rim light

LEAVES:

- deep forest green
- golden aura
- subtle magical illumination

IMPORTANT:

DO NOT make the entire tree gold.

Only:

branches
+
leaves
+
canopy atmosphere

should receive the golden aura.

The trunk and roots should remain visually natural.

---

# 18. TREE HOLY / SACRED VIBE

The tree should feel sacred without becoming a glowing yellow object.

Use:

- soft golden halo
- golden canopy light
- subtle god rays
- floating golden dust
- deep green atmospheric fill

The impression should be:

ANCIENT LIFE

not:

NEON MAGIC TREE.

---

# 19. ROOT BEHAVIOR

Roots should spread dramatically.

Desired feeling:

living roots crawling through the world.

They should:

- split
- curve
- branch
- spread
- wrap around terrain

They should not look like straight tubes.

---

# 20. TREE GROWTH

The tree should grow progressively during the journey.

Concept:

0%
sapling

↓

10–20%
roots

↓

20–35%
small trunk

↓

35–50%
large trunk

↓

50–65%
major branches

↓

65–80%
secondary branches

↓

80–90%
foliage

↓

90–100%
massive ancient World Tree

The final growth should be spectacular.

---

# 21. FINAL TREE CAMERA

At the climax:

camera approaches roots

↓

roots surround camera

↓

camera rises along trunk

↓

branches appear

↓

golden light increases

↓

canopy surrounds camera

↓

leaves fill screen

↓

transition into MainPortfolio

The visitor should feel:

THE STORY HAS BECOME THE TREE.

---

# 22. MAIN PORTFOLIO

The main HTML portfolio already exists.

It should NOT be replaced by generic AI portfolio sections.

It uses the broader:

TREE
+
FOREST
+
WOOD
+
ENGINEERING

visual language.

Existing sections include:

- Hero
- About
- Work
- Experience
- Milestones
- Contact

The portfolio must remain functional after the World Tree transition.

---

# 23. INTRO EXPERIENCE

There is a separate pre-portfolio experience.

The visitor initially chooses:

QUICK TOUR

or

DIVE DEEPER

Quick Tour:

goes toward the portfolio/world journey quickly.

Dive Deeper:

enters the detailed story journey.

The two worlds must not overlap in the DOM.

---

# 24. AUDIO

Audio architecture exists.

Directories are intended for:

`public/audio/voice/`

`public/audio/music/`

`public/audio/sfx/`

Audio must remain optional.

Browser autoplay restrictions must be respected.

Never fabricate audio files.

If audio is missing:

fallback gracefully.

---

# 25. DATA INTEGRITY

Centralized data is the source of truth.

Important files include:

`src/data/personal.ts`

`src/data/projects.ts`

`src/data/experience.ts`

`src/data/leadership.ts`

`src/data/education.ts`

and other existing verified data files.

Do not hardcode personal/professional information into visual components.

---

# 26. ANTI-FABRICATION RULE

NEVER fabricate:

- internships
- achievements
- metrics
- responsibilities
- childhood memories
- family details
- dates
- schools
- project results
- users
- technical performance
- certifications

Creative wording is acceptable only when it does not introduce false factual claims.

---

# 27. CURRENT VISUAL PROBLEM TO CONTINUE WORKING ON

The current architecture works.

The major remaining visual objective is:

MAKE THE WORLD LOOK GRAPHICAL AND ART-DIRECTED.

Avoid:

- primitive geometry
- random flying objects
- empty black space
- tiny unreadable landmarks
- blurry achievements
- tiny leadership blocks
- generic Three.js demo aesthetics

Prefer:

- graphical assets
- illustrated elements
- textured surfaces
- layered planes
- billboards
- environmental storytelling
- atmospheric lighting
- strong silhouettes
- cinematic composition.

---

# 28. CURRENT ACCEPTANCE STANDARD

Do not consider a change successful merely because:

`npm run build`

passes.

The browser rendering is the source of truth.

The experience must feel:

beautiful
+
immersive
+
cinematic
+
story-driven
+
intentional.

---

# 29. PERFORMANCE

Preserve:

- InstancedMesh
- memoization
- frustum culling
- adaptive DPR
- efficient shaders
- reduced React updates

DO NOT put React state updates inside `useFrame`.

---

# 30. ACCESSIBILITY

Preserve:

`prefers-reduced-motion`

Mobile support.

Keyboard accessibility where applicable.

Readable contrast.

Functional controls.

---

# 31. NO DEAD UI

Never leave:

`href="#"`

empty buttons

fake controls

non-functional navigation

decorative buttons pretending to work.

Every interactive element must have a real purpose.

---

# 32. BUILD CHECK

After modifications:

`npm run build`

must pass.

But build success is NOT the only acceptance criterion.

---

# 33. IF CONTEXT / TOKEN LIMIT IS REACHED

DO NOT restart.

DO NOT revert completed work.

Before stopping:

UPDATE THIS FILE.

Add:

CURRENT PHASE:
...

COMPLETED:
...

FILES MODIFIED:
...

FILES CREATED:
...

CURRENT VISUAL STATE:
...

REMAINING:
...

KNOWN ISSUES:
...

EXACT NEXT ACTION:
...

Then stop safely.

The next agent must continue from that exact point.

---

# 34. NEXT AGENT INSTRUCTION

READ THIS FILE FIRST.

Then inspect the actual repository.

Do not assume the previous agent's report is correct.

Verify the current implementation.

Make incremental changes.

Run the build.

Do not perform another destructive rewrite unless the existing architecture is genuinely unrecoverable.

The goal is not:

"more Three.js."

The goal is:

A PREMIUM CINEMATIC WORLD TREE PORTFOLIO.