# Reference research — CreativeDevJobs "Best Three.js Websites & Portfolio Examples (2026)"

Article: <https://www.creativedevjobs.com/blog/best-threejs-portfolio-examples-2025> (published 4 May 2026).

## Method

The article's descriptions were **not** taken on trust. Every site was opened in a real browser
on 2026-11-06:

- Microsoft Edge 156 driven by Puppeteer, real GPU (RTX 5050 Laptop, ANGLE/D3D11), WebGPU enabled,
  desktop 1600×900 and an emulated phone (390×844 @2×, touch, iOS UA).
- Instrumented before page scripts ran: every `getContext()` call (WebGL / WebGL2 / WebGPU /
  OffscreenCanvas), `navigator.gpu.requestAdapter`, `window.__THREE__` (three.js revision),
  framework fingerprints, loaded font faces, network bytes per type and the large assets.
- Screenshots during loading (2 s, 6 s, 14 s), after the start gate, after four scroll steps and
  after holding the movement keys. A second, scripted pass pressed each site's real start control
  (START / Enter / Play / BEGIN / language choice / "Click on the spark") and drove or walked.
- Scripts: `scripts/research/inspect-refs.mjs`, `scripts/research/inspect-targeted.mjs` and `sheet.py` (contact sheets). The
  output folder is passed on the command line; screenshots are not committed.

Headless FPS numbers are **not** comparable performance measurements (headless frame pacing, a
contended GPU, unknown internal caps). They are recorded only as "did it render at all".

### Availability

| Site | Result |
|---|---|
| WoraWork (`worawork.vercel.app`) | **Unavailable.** HTTP 402, Vercel "Deployment Paused". No alternative URL found. Assessed from the article text only, and marked as such. |
| Jay Ransijn | Loads and shows its intro copy; after ~3 minutes of "Compiling shaders…" a Play button appears, but the WebGPU canvas stayed black in headless Edge on three attempts. The world itself could not be inspected; assessed from the loader, the network profile and the article. |
| Ameen Abdullah | Fully inspected on the third pass (the language gate needs a real pointer press). |
| The Monolith Project | Fully inspected, but loading took ≈2 minutes (37 MB). |
| All others | Fully inspected. |

## Measured facts

| Site | Renderer (measured) | three.js | Framework | Transfer (desktop / phone) | Notable payload |
|---|---|---|---|---|---|
| Bruno Simon | **WebGPU** | r187 | — | 8.4 / 7.2 MB | Draco + Basis (KTX) wasm, Howler audio |
| Samsy | **WebGPU** desktop · **WebGL2 fallback** on phone | r182dev | Vue | 10.8 / 10.9 MB | webm video textures, VRM avatar, Opus audio |
| Bilal El Moussaoui | WebGL2 | r170 | — | **85.5** / 22.4 MB | 81 MB of MP4; Cloudflare challenge; 403/404s in console |
| Sébastien Lempens | WebGL2 | r161 | React | 14.0 / 10.6 MB | WebP textures, GLB, M4A audio, cookie banner |
| JReyes MC | WebGL2 | r172 | React | 30.3 / 30.3 MB | 25.8 MB of GLB |
| Jordan Breton | WebGL2 | r182 | — | 18.8 / 18.8 MB | KTX2 textures, Draco; 15 MB of MP3 |
| Thibault Introvigne | **WebGPU** | r180 | — | 7.3 / 7.3 MB | |
| WoraWork | — | — | — | — | unavailable |
| Aimee's Papercraft World | **WebGPU** | r182 | React + Lenis | 20.2 / 20.2 MB | 18 MB of baked WebP illustration |
| Weisdevice | WebGL2 | r176 | — | 5.4 / 5.4 MB | Howler |
| Ameen Abdullah | **WebGPU** | r185 | Vue + Lenis | 11.9 / 12.2 MB | 5.2 MB MP4, Howler |
| Jay Ransijn | **WebGPU** | r185 | Next.js | 7.2 / 7.2 MB | |
| The Monolith Project | WebGL2 | r181 | — | 37.0 / 23.5 MB | |
| Messenger (Abeto) | WebGL2 | r180 | — | 5.6 / 3.4 MB | KTX2, Draco, Ogg |
| Egg Hunt (Merci-Michel) | WebGL2 | — | — | 4.0 / 4.0 MB | |
| Mola Zone (Yamê) | WebGL2 | r177 | Nuxt | 12.8 / 12.8 MB | 9.3 MB GLB, Howler |
| Equinox | WebGL2 | r147 | — | 38.7 / 39.0 MB | 25 MB MP3, 10 MB KTX2 |

Observations from the table: 6 of 16 live sites now use WebGPU, every one of them on three.js
r180+ (TSL / `WebGPURenderer`); Samsy proves the fallback path by serving WebGL2 to the phone.
The heaviest payloads are audio and video, not geometry. The lightest sites with a full world
(Messenger, Weisdevice, Egg Hunt) stay at 4–6 MB thanks to KTX2/Draco and small textures.

## Per-reference assessment

Legend: **AD** art direction · **Env** environment · **Cam** camera & navigation · **Int** interaction ·
**Anim** animation · **Light** · **Mat** materials & textures · **Type** typography · **Load** loading ·
**Perf** performance strategy · **Mob** mobile · **Mem** what makes it memorable · **Adapt** what to adapt ·
**Avoid** what not to copy.

### 1. Bruno Simon — bruno-simon.com
- **AD** Toy-like, saturated orange/pink autumn diorama; a hand-lettered annotation layer ("Click to start ↶") over 3D.
- **Env** Floating circular diorama on a glowing grid, then an open world of grass, autumn trees, water channels, a fountain, giant 3D letters.
- **Cam** Fixed high three-quarter follow camera on the vehicle; no free orbit.
- **Int** Drive with arrows/WASD, physics props, collectibles, multiplayer ("Server connected").
- **Anim** Physics-driven; grass and leaves react.
- **Light** Strong warm key, soft stylised shadows, emissive accents.
- **Mat** Flat stylised colour with gradient ramps; no PBR realism.
- **Type** Nunito + Amatic SC (hand-drawn) — the handwriting makes the UI feel personal.
- **Load** Glowing ring drawn on a grid while assets stream; the diorama appears inside the ring.
- **Perf** WebGPU, compressed GLB (Draco) + KTX textures, 8 MB total.
- **Mob** Works; same world, touch steering.
- **Mem** You *play* with the portfolio; discovery is the content.
- **Adapt** Content placed physically in the world; a single tactile mechanic; handwritten annotations as UI.
- **Avoid** The vehicle, the toy palette, the arcade framing — they are his signature.

### 2. Samuel Honigstein (Samsy) — samsy.ninja
- **AD** Dark cyberpunk with a single red-neon hierarchy; everything else desaturated.
- **Env** Dense city backdrop with screens and signage; video textures.
- **Cam** Third-person follow, first-person-style control.
- **Int** WASD/space onboarding rendered as glowing in-world keycaps; mobile virtual joystick.
- **Anim** Character animation, flickering signage.
- **Light** Emissive-driven; bloom used as the main light language.
- **Mat** Dark rough surfaces against emissive.
- **Type** forma-djr-display; bitmap (BMFont) text inside the scene.
- **Load** Two red eyes in the dark — minimal, characterful.
- **Perf** WebGPU on desktop, WebGL2 on phones; live engine/frame-time readout shown in the HUD.
- **Mob** Separate control scheme (joystick + jump).
- **Mem** One colour does all the work; the HUD openly shows "Engine: WebGPU, 9 ms".
- **Adapt** A single accent colour reserved for "signal"; honest performance telemetry in a debug panel.
- **Avoid** Neon cyberpunk, bloom-as-lighting, dark-on-dark readability.

### 3. Bilal El Moussaoui — bilal.show
- **AD** Soft pastel wooden music box / theatre stage; hand-drawn labels.
- **Env** One box-shaped stage whose props are swapped as you scroll (pinwheel, gears, house, desk).
- **Cam** Fixed frontal camera; the *scene* changes, not the camera.
- **Int** Scroll only; chapter dots at the top.
- **Anim** Props pop in/out with spring motion around a central character.
- **Light** Bright, soft, shadow-light.
- **Mat** Smooth wood and painted plastic.
- **Type** "Moggly" handwritten face for every label.
- **Load** Cloudflare challenge, then a coral splash — the slowest gate of the set.
- **Perf** Poor: 85 MB (MP4); console 403/404 errors.
- **Mob** Works; same stage, narrower.
- **Mem** Personality told through props ("I come from Belgium", "video games", "football").
- **Adapt** Personal interests as small physical props with handwritten notes.
- **Avoid** The payload; the fixed single-room framing.

### 4. Sébastien Lempens — sebastien-lempens.com
- **AD** Pastel pink golden-hour Paris; low-poly but beautifully lit.
- **Env** River, bridges, Eiffel Tower, streets; words carved into arches ("TRAVELING · FOOD · DESIGN"); giant 3D "ABOUT ME" letters.
- **Cam** Scroll-driven dolly that changes mode: walking character → scooter ride → (per article) skydiving.
- **Int** Scroll; menu; sound toggle.
- **Anim** Animated character, smooth eased camera paths.
- **Light** Warm sunset sky, long soft shadows; very cohesive palette.
- **Mat** Flat pastel with baked AO.
- **Type** Zen Dots + Radikal Thin; 3D text inside the world.
- **Load** Scooter rider over a skyline with a real 000 → 100 counter, then START; award logos.
- **Perf** WebP textures, small GLBs, 14 MB.
- **Mob** "Switch to desktop" advice, but loads.
- **Mem** Environmental typography and a character you follow.
- **Adapt** Words integrated into the environment; strict palette; movement-mode changes as chapter breaks.
- **Avoid** The Paris setting and the scooter; the cookie banner over the experience.

### 5. JReyes MC — jreyes-mc-portfolio.com
- **AD** Minecraft voxel house at night, warm lanterns.
- **Env** House, garden, benches, lanterns, moon.
- **Cam** Scroll moves forward/backward along a fixed circuit through rooms.
- **Int** "Interact with glowing photos"; HUD: Teleport, Citations, Road Map, Mute.
- **Anim** Camera glide; little else.
- **Light** Warm point lights against cool night; dark corners.
- **Mat** Pixel textures (nearest filtering).
- **Type** Minecraft pixel font.
- **Load** A pixel-art room explains the controls (scroll up/down) with a real progress bar; "Enter World".
- **Perf** 30 MB (25.8 MB GLB) — heavy.
- **Mob** Phone-specific swipe instructions.
- **Mem** Teaching the controls *during* loading; a teleport list for impatient visitors.
- **Adapt** Explain navigation while loading; a teleport/quick-jump list.
- **Avoid** Voxel style; the payload.

### 6. Jordan Breton — jordan-breton.com
- **AD** Contemplative stylised fantasy island; painterly foliage; real-time day/night (it was night at inspection time).
- **Env** Large tree, waterfall, campfire, rocks, a firefly-lit path, aurora sky.
- **Cam** Fixed viewpoints connected by eased transitions; hotspots (◎) to travel; "touch & move to look around".
- **Int** Hotspots, achievements (0/5), settings (audio, renderer info), day/night toggle.
- **Anim** Wind in grass and leaves, flowing water, fire, fireflies, butterflies.
- **Light** Moonlight + warm fire; strong value structure.
- **Mat** Hand-painted look: stylised bark, gradient foliage cards, KTX2 compressed.
- **Type** Orbitron, small caps UI.
- **Load** Percentage ring; then the world appears as glowing **line-art** (edge render) until START, when it fills in.
- **Perf** KTX2 + Draco; geometry light; audio is most of the 18.8 MB.
- **Mob** Excellent — same world, touch look-around.
- **Mem** The line-art reveal and the sense of a living place.
- **Adapt** Sketch-to-lit reveal; living-world motion (wind, water, fire, insects); fixed stations with gentle look-around.
- **Avoid** The floating-island framing and purple-teal palette.

### 7. Thibault Introvigne — thibault-introvigne.com
- **AD** Pink/violet grass world with a small spaceman.
- **Env** Dense instanced grass fields, rocks, blossom trees.
- **Cam** Top-down follow camera.
- **Int** Arrow keys; ten collectibles (counter top-right) each revealing a past project; in-world labels ("EXPERIENCE →").
- **Anim** Grass parts around the character; gentle DOF.
- **Light** Soft, pastel, almost no shadow.
- **Mat** Stylised grass blades with colour gradients.
- **Type** Space Grotesk.
- **Load** The loader **is** the world: the live grass field behind "Loading… → Enter".
- **Perf** WebGPU; 7.3 MB.
- **Mob** Loads; keyboard-centric controls.
- **Mem** Instanced grass as the hero material.
- **Adapt** Instanced, wind-animated grass; collectible/progress counter; using the real scene as the loading backdrop.
- **Avoid** The palette; keyboard-only discovery for a recruiter audience.

### 8. WoraWork — worawork.vercel.app *(unavailable)*
- Live site returned HTTP 402 ("Deployment Paused") on 2026-11-06. From the article only: a cozy
  house-and-garden world inspired by *Zelda: A Link Between Worlds* and *Animal Crossing*, where
  interacting with objects reveals the author. **Adapt** (from description): personality through
  cozy, interactable home objects. Nothing else is claimed.

### 9. Aimee's Papercraft World — aimees-papercraft-world.com
- **AD** Papercraft: every surface is a scanned-paper texture; hand-drawn 2D assets on 3D.
- **Env** A circular room split into seasonal segments (winter cabin, garden "About me", travel map, autumn).
- **Cam** Scroll rotates the camera around the room's centre — one continuous orbit.
- **Int** Scroll/swipe; info button; zoom slider.
- **Anim** Subtle; parallax of paper layers.
- **Light** Baked; soft paper shadows.
- **Mat** Baked illustration textures (18 MB WebP).
- **Type** Slime Box (rounded display); handwritten copy on the walls.
- **Load** Four coloured paper panels with a torn-paper seam; "Enter!".
- **Perf** WebGPU; all lighting baked into textures.
- **Mob** Excellent — the orbit works naturally on touch.
- **Mem** A single, unmistakable material identity.
- **Adapt** A **circular room orbited by scroll** — ideal for an archive hall; one strong material identity.
- **Avoid** Paper aesthetic; hand-written body text (readability).

### 10. Weisdevice — weisdevice.xyz
- **AD** Retro computing: Win95 dialogs, pixel fonts, a pastel floating desert island with a robot device.
- **Env** Island with cacti, power lines, signposts that double as navigation.
- **Cam** Orbit with zoom; "next" arrow button.
- **Int** Tactile knobs, a Game Boy pad and switches on the device (per article); music + settings buttons.
- **Anim** Smooth GSAP transitions.
- **Light** Bright, soft stylised.
- **Mat** Toon-ish with texture detail.
- **Type** Pixellari, VT323.
- **Load** A retro "Loading 13 of 13" dialog with **"Enter (no music)" and "Enter"** — the audio choice is explicit.
- **Perf** 5.4 MB; raycasting throttled to 30 FPS and the render loop paused on project pages (article).
- **Mob** Works; tap-and-swipe tip.
- **Mem** Physical controls you want to touch.
- **Adapt** Explicit sound-on / sound-off entry; throttled raycasting; pausing the loop when hidden.
- **Avoid** Retro-OS pastiche.

### 11. Ameen Abdullah — ameen-abdullah.dev
- **AD** Cinematic restraint: a black void with drifting sakura petals, then a photographic-quality sunset island — a blossoming tree reflected in still water, warm haze, pink grade.
- **Env** One small island, one tree, water, birds; everything frames the tree.
- **Cam** Fixed hero shot with a **MORNING / EVENING** toggle (time of day as a visitor choice); scroll moves into 2D-over-3D chapters.
- **Int** Language/persona gate ("Island native — English / Japanese"); scroll; drag on a curved carousel.
- **Anim** Petal particles, shader-distorted award typography, a curved carousel of favourites.
- **Light** Volumetric-feeling backlight, bloom kept to the sun and blossoms, soft reflections.
- **Mat** Painterly-real; glossy water.
- **Type** Satoshi + "Dirtyline" display; **game-style dialogue boxes** (Japanese + English) narrate the story ("I'M A … GOOFY GUY", "KNOW ME MORE?", "AIGHT BRO… THAT'S IT").
- **Load** The petal field around a single glowing tree *is* the loader, with a self-deprecating status line.
- **Perf** WebGPU r185; Lenis; 11.9 MB (5.2 MB video).
- **Mob** Same flow.
- **Mem** A single tree as the emotional hero; personality through favourite anime/games carousels and a playful narrator voice; awards shown with confidence.
- **Adapt** A lone tree as the hero of the loading screen; time-of-day mood; a narrator *voice* with personality; favourites as a personality section.
- **Avoid** Sakura motif; the language gate as an obstacle; his anime-dialogue styling.

### 12. Jay Ransijn — jayransijn.com *(world not reached)*
- **Load** Shows the name, one-line pitch, LinkedIn and X **immediately** while the world compiles
  ("Compiling shaders… Still working — the first load takes a moment"). The world never finished
  compiling in headless WebGPU after four minutes.
- **Perf** WebGPU r185, Next.js; 7.2 MB.
- From the article only: fetch with a dog, a bike, a hidden car, a band to start with a lever,
  logos to knock over; reflections and lighting.
- **Adapt** Essential contact info usable before the 3D is ready; the playful **dog** interaction.
- **Avoid** Long shader compiles with no fallback — compile in stages and keep the page usable.

### 13. The Monolith Project — themonolithproject.net
- **AD** Moebius-style ink lines with flat pastel colour; one red sphere ("the spark") is the persistent motif across every scene.
- **Env** Thirteen scenes: cosmic origins → monolith → ape → bone → branching artefact → books → computer → "From spark to circuit…" → white sketch world.
- **Cam** Scroll-driven; each scene composed like an illustration.
- **Int** "Click on the spark" to begin; scroll.
- **Anim** Scene-to-scene morphs; objects carried across transitions.
- **Light** NPR flat shading with ink outlines; grain.
- **Mat** Custom shader framework (Codrops write-up).
- **Type** Small caps chapter labels ("COSMIC ORIGINS", "THE DISCOVERY") with a segmented progress bar.
- **Load** Outlined numerals count the real percentage around the red spark — slow (~2 min, 37 MB).
- **Perf** Heavy; WebGL2.
- **Mob** Lighter payload (23.5 MB).
- **Mem** One motif carried through every transition.
- **Adapt** A **persistent motif** threading the whole journey; chapter names + segmented progress; sketch ↔ render transitions.
- **Avoid** The payload; the 2001 homage.

### 14. Messenger — messenger.abeto.co
- **AD** Anime-inked NPR: flat colour, hand-drawn outlines, painterly skies.
- **Env** A tiny round planet with streets; the title built from 3D letters on the planet.
- **Cam** Third-person follow on a curved world.
- **Int** Walk, deliver parcels, emoji waves, multiplayer.
- **Load** Hand-drawn envelope "loading" — on brand.
- **Perf** 5.6 MB (3.4 MB phone) with KTX2 + Draco; streams a second stage after BEGIN.
- **Mem** Illustration-grade NPR in real time.
- **Adapt** Loader drawn in the site's own visual language; staged loading (first scene first).
- **Avoid** Multiplayer; anime style.

### 15. Egg Hunt — egghunt.merci-michel.com
- **AD** Pastel low-poly blocks, pink/teal palette, cute robot rabbit.
- **Int** One mechanic: "Click to Dash" between rocks at the right time.
- **Perf** 4 MB.
- **Mem** A one-input game anyone understands instantly.
- **Adapt** One-gesture interactions.
- **Avoid** Brand-campaign framing; cookie consent overlapping play.

### 16. Mola Zone — mola-zone.com
- **AD** Black-and-white ink illustration as the loader; inside, comic-book NPR with saturated environment colour (desert dusk → blood-red forest).
- **Cam** Scroll moves the rider through environments; "Scroll to explore".
- **Int** Hotspot icons for content; now-playing music bar.
- **Light** Strong colour per chapter; headlight beam in the dark forest.
- **Load** Ornate illustrated frame with a central % counter → ENTER.
- **Perf** 12.8 MB (9.3 MB GLB).
- **Mem** Each chapter has its own colour world.
- **Adapt** Colour script: each chapter owns a distinct light/colour mood.
- **Avoid** Music-video framing.

### 17. Equinox — equinox.space
- **AD** Neon-blue space adventure title over a drifting asteroid field; scanline grain.
- **Int** After START: **"Choose your controls: Mouse-only (recommended for everyone) / Keyboard + Mouse (for gamers) — can be changed later."** Phone: "Tap to get up".
- **Perf** 38.7 MB (25 MB audio).
- **Mem** Respecting different visitors with an explicit control choice.
- **Adapt** Never assume the visitor is a gamer: default to the simplest control scheme; let experts opt in.
- **Avoid** Neon sci-fi styling.

## Comparison matrix

| Reference | Strongest idea | Technical approach | Application to this portfolio | Priority |
|---|---|---|---|---|
| Bruno Simon | Content physically placed in a playable world | WebGPU, physics, Draco/KTX | Projects are physical relics in the World Tree; one optional tactile interaction (Bella fetch) | High |
| Samsy | One colour reserved for meaning | Emissive hierarchy, WebGPU w/ WebGL2 fallback | A single cool "signal" colour used only for the network and interactive focus | High |
| Bilal | Personality through props | Prop swapping on a fixed stage | Interests shown as small props at the home camp with short notes | Medium |
| Lempens | Words built into the environment; mode changes as chapter breaks | Scroll-driven spline camera, 3D text | Waystones carved with engineering interests; flight → walk → climb as chapter breaks | High |
| JReyes | Teach controls while loading; teleport list | Progress-tied loader | Loader explains "scroll to travel · click relics · press / for the index" | High |
| Jordan Breton | A living, contemplative place; line-art reveal | Instanced foliage, wind shaders, KTX2, fixed stations | Wind/water/fire/insects; sketch-to-lit reveal of the World Tree | **Highest** |
| Thibault | Instanced grass as hero material; the loader is the world | WebGPU instanced grass | GPU-instanced wind grass in the meadow; real scene behind the loader | High |
| WoraWork | (unavailable) cozy interactable home | — | Home camp as a cozy, inspectable place | Low |
| Aimee | Circular room orbited by scroll; one material identity | Baked illustration textures | **The archive hall is a circular chamber the camera orbits as you scroll** | **Highest** |
| Weisdevice | Explicit sound choice; throttled raycasts; paused loop | Howler, 30 Hz raycast | Sound off by default with a clear toggle; raycast at 30 Hz; frameloop paused when hidden | High |
| Ameen | A single tree as the emotional hero; restraint | WebGPU particles | The World Tree drawn as the loading screen; restraint in effects | High |
| Jay Ransijn | Usable info before the world loads; the dog | WebGPU | Name, role, links and the index are usable before WebGL is ready; Bella fetch | High |
| Monolith | A persistent motif across scenes; chapter progress | Custom NPR renderer | The "signal seed" travels the whole journey; chapter names + segmented progress | High |
| Messenger | On-brand loader; staged loading | KTX2, Draco, streaming | Loader drawn in the site's ink style; stream interior assets after the first frame | Medium |
| Egg Hunt | One-gesture interactions | — | Every interaction is a single click/tap | Medium |
| Mola Zone | A colour script per chapter | NPR | Dawn-gold valley → warm amber hall → cool signal → dusk canopy | High |
| Equinox | Respect non-gamers: simplest controls by default | — | Scroll-only by default; exploration is optional; everything reachable from the index | High |

## Synthesis — one direction, not a collage

The strongest common thread: **a single, living place with one clear focal point, explored
through one simple gesture, with content embodied in objects that belong to that place.**

What the World Tree portfolio takes, translated into its own language:

1. **A living place** (Breton, Thibault): wind in grass and canopy, moving water, fire, drifting
   motes — not effects for their own sake, but signs that the world is alive.
2. **The circular archive** (Aimee): the hollow of the tree becomes a round hall; scrolling
   orbits the camera from relic to relic. Composition is guaranteed at every stop.
3. **A persistent motif** (Monolith): the *signal* — a seed of cool light — appears in the loader,
   travels the roots and pulses along the network inside the hall. It is also the site's only
   interactive accent colour (Samsy's single-colour hierarchy).
4. **Words in the world** (Lempens): engineering interests are carved into waystones on the path.
5. **Usable before loaded** (Ransijn, JReyes, Equinox): the HTML layer (name, role, links, index)
   is interactive immediately; scroll is the only required control.
6. **Personality as objects** (Bilal, WoraWork, Ransijn): the home camp, its props and Bella.
7. **Colour script** (Mola): each chapter owns a light mood, so the long journey never feels flat.

What it deliberately does **not** take: vehicles, characters to steer, multiplayer, neon,
paper/voxel/anime styles, forced language/sound gates, or 20–80 MB payloads.

The resulting direction is described in [`../ART_DIRECTION.md`](../ART_DIRECTION.md).
