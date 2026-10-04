# World Rebuild — Pause & Handoff

> **Status, 2026-10-04: the rebuild is finished and the production build passes.**
> Everything below was written when the work paused on 2026-10-03 and is kept as the
> record of the audit, the BEFORE measurements and the design decisions. Since then the
> journey, the Erdtree-scale World Tree, the archive relics, the Work section (Q-SHIELD,
> JIVA, STREET HIERARCHY, T R Constructions) and the cleanup were completed, and the owner
> reviewed the result. Still open: pruning unused dependencies, a README rewrite, and a
> production AFTER profile with `?off=` subsystem isolation (development-server captures
> at 1920×1080 held the 144 Hz cap at every journey checkpoint).

**Paused:** 2026-10-03, at the user's request (token budget).
**Task:** the full "OPUS 5.5 MAX — complete Three.js portfolio rebuild + codebase cleanup" brief (Phases 0–38).
**Git:** everything below is **uncommitted on `main`**. Nothing was committed or pushed.

---

## 1. Where things stand

| Phase | State |
|---|---|
| 0–1 Audit + inventory | **Done.** Findings in §3. |
| 2 Git history comparison | **Done.** Findings in §3. |
| Baseline ("BEFORE") profiling + screenshots | **Done.** Numbers in §2. |
| 3 New architecture | **In progress.** Foundation modules written (§5). |
| 4–34 Rendering, tree, terrain, water, family, forest, camera, artifacts, UI, cleanup | Designed (§4); partly written (§5); most not started (§6). |
| 35–38 Browser QA, AFTER profiling, build, report | Not started. |

### Build state: BROKEN on purpose (mid-refactor)

`components/world/Terrain.tsx` has already been replaced with the new terrain. The old
`PortfolioWorld.tsx` and `Ecosystem.tsx` still import the old exports, so `tsc` reports
exactly 5 errors and nothing else:

```
Ecosystem.tsx: no exported member 'getTerrainYAt'
PortfolioWorld.tsx: no exported member 'Mountains' | 'EnvironmentProps' | 'Atmosphere' | 'Fireflies'
```

All the new `lib/world/*` modules, `WorldResources.tsx` and the new `Terrain.tsx` type-check cleanly.
These errors go away once the new `PortfolioWorld.tsx` (§6, step 1) replaces the old scene.
If you need a green build before then, first copy the new `Terrain.tsx` somewhere safe, then
`git checkout components/world/Terrain.tsx`.

### EXACT NEXT ACTION

Write the new `components/world/PortfolioWorld.tsx` and `components/world/EnvironmentSetup.tsx`
(per §4.2–4.4). Mount only `WorldResources` + sky/fog/sun + the new `Terrain`. Restructure
`app/page.tsx` into one document (§4.1). Then run `npm run dev` and take screenshots with
`scripts/profile-world.mjs` to judge the terrain, fog, light and colour before building
anything else on top.

---

## 2. Baseline (BEFORE) — measured, not estimated

Machine: i7-13700HX, RTX 5050 Laptop GPU (ANGLE D3D11), 16 GB, display 1920×1080 @ 100 % (DPR 1).
Build: `next build` + `next start`. Browser: headless Chrome for Testing 152 via puppeteer.
18 checkpoints across the journey, 2.5 s sample each. GPU ms comes from `EXT_disjoint_timer_query`
wrapped around each `renderer.render` call.

| Metric | Vsync-capped (60 Hz) | Uncapped |
|---|---|---|
| FPS (avg) | 61.0 | 307 (range 167–547) |
| Frame time (avg) | 16.38 ms | 3.72 ms (worst p95 14.6 ms) |
| GPU time / frame | 7.84 ms avg (5.7–10.6) | 3.23 ms |
| Draw calls | avg 544, max 875 | avg 551, max 858 |
| Triangles | avg 710k, max 736k | same |
| Main-thread script time | 340–650 ms/s | 740–860 ms/s |
| DOM mutations | 1.3k–1.9k /s (drei `<Html>` every frame) | up to 15.7k /s |

Subsystem isolation, uncapped, progress 0 / 0.5 (from the old `DEBUG_DISABLE_*` flags):

| Disabled | Triangles | Calls (p=0) | GPU ms (p=0 / 0.5) |
|---|---|---|---|
| none | 736k | 867 | 4.35 / 2.90 |
| tree | 196k (**tree ≈ 540k tris**) | 826 | 3.30 / 2.11 |
| terrain | 582k | 797 | 3.18 / 1.35 |
| water | 715k | 384 (**water ≈ 480 calls**: 70 separate rock meshes etc.) | 3.29 / 3.09 |
| family | 350k (**family ≈ 385k tris, ~440 calls**) | 431 | 3.99 / 3.25 |
| postprocessing | 568k | 649 | 3.00 / 1.59 (**post ≈ ½ of GPU time**) |
| html | 736k | 870 | 4.50 / 3.53 |

Load: ~1.0 s to `networkidle2`. Console (local): favicon 404, `/_vercel/insights/script.js` 404,
`THREE.Clock deprecated` (from R3F itself), `PCFSoftShadowMap deprecated`.

Evidence is saved in `.handoff/baseline/` (gitignored): `*.json` summaries and 8 screenshots
(`p0000.jpg` … `p0940.jpg`). They show floating dodecahedron rocks, lollipop trees, a beige blob
trunk, one-word-per-line narration, and the camera tipping straight up into empty sky.

---

## 3. Audit findings (what the rebuild must fix)

### Root causes of the "smudged" look

These were verified in code. Confirm each visually as the new pipeline goes in.

1. **No tone mapping at all.** `@react-three/postprocessing`'s `EffectComposer` forces
   `gl.toneMapping = NoToneMapping` while mounted. The old stack (Bloom + Vignette) never added a
   `<ToneMapping/>` effect, so HDR values were hard-clipped and the image looked flat.
2. Bloom at `luminanceThreshold 0.8` on un-tonemapped values made bright surfaces and sky haze glow.
3. Composer default `multisampling = 8` on a HalfFloat target at DPR up to 1.5 is very costly.
   `gl.antialias: false`.
4. `<AdaptiveDpr pixelated />` was used: a blocky upscale whenever DPR regresses.
5. `app/globals.css` `body::after` lays a full-screen fractal-noise overlay
   (`mix-blend-mode: multiply`, opacity 0.25, z-index 9999) over **everything, the canvas included**.
6. Low-poly tubes (8 radial segments) with vertex displacement along normals, and normals never
   recomputed. Lighting doesn't match the shape.
7. Flat lighting: `Environment preset="forest"` (a CDN HDR) + ambient + hemisphere.
8. One 2048 shadow map stretched over 400×400 units, so shadows are blurry.

### Other broken things found

- The `FamilyCampfire` group sits at `[12,0,-65]`, scale 1.5. Its children are at about `[5,0,-14]`,
  so the family really sits around world (19.5, 0, −86), on top of the waterfall basin. Every
  `y = 0` ignores the terrain.
- `WorldTree` creates a `foliageRef` but never renders an `<instancedMesh>`, so the tree has **no leaves**.
  The "38 k foliage" disaster was "fixed" by deleting the canopy.
- `DetailPanel` is rendered **twice** (in `UIOverlay` and `WorldInteractionLayer`).
- `hooks/useInteraction.tsx` hijacks **SPACE**, which forces interaction and breaks the brief.
- `CinematicNarration` calls `setState` from `useFrame` and uses `<Html fullscreen>`. The text wraps
  one word per line.
- The camera lerps **positions** (it cuts corners through geometry), looks straight up inside the
  tree, and its magnet relies on `scrollDelta`.
- Ecosystem: 51 individual rock meshes with `Math.random()` (not deterministic), a CPU-animated
  fish `InstancedMesh`, opaque waterfall planes.
- **Portfolio phase bug (likely):** after the world, `MainPortfolio` renders in an inner
  `overflow-y-auto` div, while Lenis and GSAP ScrollTrigger listen to `window`. Pins and reveals
  probably never fire, so sections can stay at opacity 0. Verify in the browser.
- **Empty buttons:** `Hero.tsx` and `ContactScene.tsx` call
  `Object.entries(socialData).map(([k, data]) => data.label)`. `socialData` is an array of
  `{platform,url}`, so the labels render empty and `key==='resume'` never matches.
- The `MusicController` shows a disabled button with no audio, which is dead UI.

### Data integrity

- **Verified public repos** (GitHub API, 2026-10-03): `Zynx095/AURA`, `Zynx095/shadowguard`,
  `Zynx095/SUGAR-AI`, `Zynx095/encrypted-traffic-threat-hunter` (ETTH). These were added to
  `src/data/projects.ts` → `github`.
- `src/data/storyZones.ts` contains **fabricated** detail. Examples: "first hackathon pitch at age 16",
  the bus-app "public transit APIs, GPS", "Whisper runs on GPU…shared event queue",
  "real users, real deadlines", "Healthcare Tech", "Four experimental configurations"
  (projects.ts says *five*). **Do not use it.** Delete it once nothing imports it. Panel content
  must come only from `projects.ts`, `achievements.ts`, `leadership.ts`, `experience.ts` and `personal.ts`.
- The old narration says "I'm 19". The DOB in `personal.ts` makes him 20 now, so avoid stating an age.
  "Internships at NVIDIA" overstates `experience.ts`, which says
  "NVIDIA × Presidency University — Capstone Project Internship".
- LinkedIn: `SocialIcons.tsx` used `linkedin.com/in/yukith`, but centralized `social.ts` has
  `linkedin.com/in/yukith-joseph`. The rebuild uses `social.ts`. **The user should confirm which is correct.**
- Instagram must be `@yuxith_pov` (`https://www.instagram.com/yuxith_pov/`). It is now in `social.ts`.

### File classification

| Action | Files |
|---|---|
| **KEEP** (data/portfolio) | `src/data/*` (except storyZones), `components/{Hero,AboutScene,WorkScene,ExperienceNode,MilestoneGrid,ContactScene,TreeNavigation}.tsx`, `components/projects/*`, `public/*` |
| **REFACTOR** | `app/page.tsx` (single document), `app/layout.tsx` (icons metadata to fix the favicon 404; only render `<Analytics/>` when `process.env.VERCEL`), `app/globals.css` (remove `body::after` overlay), `components/providers/smooth-scroll.tsx` (one Lenis for the whole page + ScrollTrigger sync), Hero/Contact social-button bug |
| **REPLACE** (rewrite) | `components/world/{PortfolioWorld,WorldTree,Terrain✔,Ecosystem,FamilyCampfire,CameraChoreographer,EnvironmentSetup,CinematicNarration,DetailPanel,SocialIcons}.tsx`, `Artifacts.tsx` → `components/artifacts/*` |
| **DELETE** (all verified unreferenced, or replaced by the new system) | `components/world/{CameraController,CosmicBackground,DistantTreeSilhouette,EnvironmentDepth,InteractionSystem,MusicController,Path,WorldHUD,WorldInteractionLayer,WorldRoots,Zones}.tsx`, `components/world/zones/*`, `components/{AudioSystem,IntroExperience}.tsx`, `components/experience/`, `components/story/`, `components/tree/`, `hooks/{useInteraction,useProximity,useZoneProximity,use-mobile}.ts(x)`, `lib/animations.ts`, `lib/utils.ts` + `components.json` (shadcn leftovers), `src/data/storyZones.ts`, root `clean_comments.js`, `profile.mjs`, `test-nan.mjs`, `test-path.mjs`, `tsconfig.tsbuildinfo` (also gitignore it), old reports `ANTIGRAVITY_PROGRESS.md`, `AUDIO_FIX_REPORT.md`, `CHANGE_REPORT.md`, `IMPLEMENTATION_PLAN.md`. Replace them with a README.md and rewrite the codex handoff. |
| **Dependencies to prune** (verify no imports first) | all `@radix-ui/*`, `cmdk`, `date-fns`, `embla-carousel-react`, `input-otp`, `react-day-picker`, `react-hook-form`, `@hookform/resolvers`, `react-resizable-panels`, `recharts`, `sonner`, `vaul`, `zod`, `next-themes`, `framer-motion-3d` (deprecated), `@studio-freight/react-lenis` (deprecated; `lenis` is used), `class-variance-authority`, `clsx`, `tailwind-merge`, `autoprefixer`. Check whether `tw-animate-css` classes are used. `puppeteer` is only for profiling: keep until the AFTER measurements, then decide. |

### Git history verdict

No previous version is "the good one".
- `6961a56` had the best foliage **idea**: alpha-tested leaf cards plus opaque core masses.
- The current version has the best **concept**: a hollow interior with artifacts.
- `2e21c7f` moved the waterfall to GPU particles. Keep it GPU-driven.
- `972ce50` ("filtered content") ran `clean_comments.js`, which stripped **all comments** and left odd JSX indentation.

---

## 4. Design decisions for the rebuild (agreed plan)

### 4.1 Page structure
One document: a fixed full-screen canvas, then a `#journey` spacer (~26 viewport heights), then the
existing portfolio sections in normal flow, with opaque backgrounds.
- One Lenis instance for the whole page, synced with GSAP ScrollTrigger.
- Journey progress = `scrollY / (spacer − innerHeight)`.
- At progress → 1 the camera rises up the chimney into daylight and a cream overlay (`#F4F1EA`)
  fades in. The Hero (same cream) then scrolls up over it seamlessly.
- When the portfolio fully covers the viewport, set R3F `frameloop = 'never'` and restore it when
  scrolling back. **Reverse scrolling works naturally.**
- The world UI hides in the portfolio. `TreeNavigation` shows only there.
- Add a subtle "Skip to portfolio" link and a "scroll to begin" hint. Never force clicks.
- Canvas container gets `touch-action: pan-y`.

### 4.2 Rendering pipeline
- `antialias: true`, `powerPreference: high-performance`, `stencil: false`. Camera near 0.5, far ~2600.
- `shadows="percentage"` (PCFSoft is deprecated in r185).
- Composer path (high/medium):
  `<EffectComposer multisampling={4|2}> <Bloom mipmapBlur luminanceThreshold={1.0} intensity≈0.55/> <ToneMapping mode={ACES_FILMIC}/> <Vignette offset≈0.32 darkness≈0.42/>`
  Set `dithering = true` on the EffectPass via ref.
- Low tier: no composer. Renderer ACES, plus a CSS vignette.
- Exposure through `gl.toneMappingExposure`. It is honoured by the ToneMapping effect too.
  Exposure adapts from 1.0 outside to about 1.7 inside the tree.
- DPR comes from the tier (`QUALITY.maxDpr`). drei `PerformanceMonitor` lowers DPR first, then the
  tier. **Never `pixelated`.**
- Lights stay **constant in count** to avoid shader recompiles: one directional sun (shadow camera
  follows the view, texel-snapped) and one point light. The point light is reused as the campfire
  glow outside and the artifact accent inside. Inside the tree the sun fades to about 0 and
  `shadow.autoUpdate = false`.
- IBL: the sky PMREM is `scene.environment`. Interior materials get `envMap = interiorEnv`
  (both are built in `WorldResources.tsx`). Animate `scene.environmentIntensity`.
- Fog: `FogExp2` plus the global height-fog chunk patch in `lib/world/atmosphere.ts`.
  Animate density and colour to the interior values. **Never use `SpriteMaterial`**: the patched
  fog chunk uses `transformed`.

### 4.3 World layout (all in `lib/world/layout.ts`; everything samples `terrainHeight`)
- Camp `(7, ~0.2, -15)`, radius 13. Lake centre `(-17,-31)`, a rotated ellipse 21×14.
  `WATER_LEVEL = -0.35`.
- Waterfall: a plateau (union of 3 circle SDFs plus a horseshoe bay at `(-56,-117)`) on the valley's
  left flank. Measured: lip ≈ `(-70.8, 24.3, -124.2)`, pool ≈ `(-59.2, 0.55, -118.5)`, opening
  normal ≈ `(0.9, 0, 0.44)`. That gives a 24-unit fall, facing the camera as it comes up the river.
- The river runs along `RIVER_POINTS` from the pool down to the lake.
- Valley: the floor centreline drifts; hills rise past the valley half-width; distant ridges sit
  beyond z −640.
- **World Tree at `(0, 1.2, -420)`.** Clearing radius about 100. Entrance angle `π/2 − 0.12`
  (faces +Z, toward the approach).
- Sun direction `(0.74, 0.42, -0.53)`: late afternoon, from the right, slightly ahead.

### 4.4 Camera & focus magnet (CameraChoreographer — not written yet)
- Keyframes `{progress, position, target, fov}`. Centripetal Catmull-Rom for position and target.
  Map progress to the curve parameter with a **monotone cubic (PCHIP)** so pacing is C1-smooth.
- Smooth the **progress** with a critically damped spring, never the position. This avoids
  corner-cutting through walls.
- `lookAt` with up `(0,1,0)`. Keep pitch below about 60°. No roll or banking.
- Inside the cavity, clamp the radial distance to `cavityAt(y).radius − margin`.
- Interior path: rise near the axis while yawing to face each slot. Generate dense keyframes from
  cylindrical coordinates so look targets don't chord across the cavity.
- Focus blending is **camera-only** and never moves the scroll position. Weight `w` rises when
  `|velocity| ≈ 0`, idle exceeds about 0.35 s, and progress is inside an artifact's window. Use
  direction to pick between neighbours. Release quickly (about 0.15 s) on any scroll input.
  States: moving → focusing → focused, published to `ui.focusPhase`.
- Outdoor shot list (tune from screenshots):
  - camp establishing shot (`(14,4.5,16)` looking `(2,2.5,-20)`) → past the family → toward lake
    and girlfriend → up the river → waterfall bay → turn to the valley (tree reveal) → valley
    travel → roots → between the two flanking buttresses → tunnel → cavity floor.
  - Rough progress budget: outdoor 0–0.52, entry 0.52–0.57, archive 0.57–0.95, light 0.95–1.

### 4.5 World Tree (generator DONE and validated — `lib/world/tree.ts`)
- **Two lofted shells.** Outer bark: base radius 23 tapering to 15, crown at y≈160 with a jagged
  broken top. Seven Lorentzian buttress lobes, two of them flanking the entrance. 23 twisting
  flute grooves, burls and branch collars.
- Inner heartwood cavity: radius 14.4 → 6.2. Ribbed, with alcoves carved behind alcove slots.
  The wall never gets thinner than 4.2.
- **Entrance:** marching-squares clipping on both shells, so the arch edge is smooth. A swept
  tunnel with rolled lips covers the cut seam.
- 12 plank-root tubes. 7 primary limbs, ~31 secondary and ~95 tertiary branches. 101 canopy anchors.
- Interior: 13 wall tendrils, 9 floor roots, and one inner limb chord carrying ShadowGuard.
- `ARCHIVE_SLOTS`: 7 slots climbing y = 8.5 → 105 in ~100° steps, with mounts
  roots / alcove / limb / fungus / alcove / suspended / alcove.
- Validated (`node --import ./scripts/ts-hooks.mjs scripts/check-tree.ts`): ~170 ms to generate,
  ≈ 280 k triangles, 0 NaN, 0 bad normals.
- **Not yet seen in a browser.** Expect tuning: canopy density (only 101 clumps after thinning,
  try a looser threshold), limb shapes, arch proportions, interior tendril placement.

### 4.6 Materials (`lib/world/materials.ts`, written, not yet seen in a browser)
- **Bark:** PBR plus baked bark data and normal (`vNormalMapUv`). Brown palette, moss on
  up-facing and low surfaces, soil darkening, crevice AO.
- **Rock:** tri-planar, whiteout-blended normals, moss on top, wet near water.
- **Foliage:** 2×2 canvas atlas (row-flip handled), `alphaToCoverage`, alpha mip boost,
  spherical clump normals, GPU wind using shared `uTime`, translucency toward the sun.
  A matching depth material handles shadows.
- **Terrain:** a splat driven by `aMask` (dirt, wet, humus, rock).
- **Textures:** baked on the GPU once per renderer (`lib/world/textures.ts`): bark, rock, ground,
  water normals, plus the canvas leaf atlas. Anisotropy 8.

### 4.7 Artifacts (not written) — `components/artifacts/*`
Each artifact is 5–15 meshes with shared materials (aged brass, dark bronze, obsidian glass, wood)
and emissive accents. They use `interiorEnv` so metals read in the dark.
- **AURA:** a gimbal-held eye lens with tracking brackets that cycle green → amber → red
  (the NORMAL → OBSERVED → SUSPICIOUS state machine is verified).
- **ETTH:** an encrypted faceted crystal with packet beads orbiting conduits.
- **ShadowGuard:** a bevelled shield (ExtrudeGeometry), a lock sigil and a faint hex-lattice dome.
- **Sugar AI:** a lathe voice-lantern with pulsing expanding sound rings and a shader waveform.
- **Achievements:** a lathe trophy cup with one orbiting medallion **per `achievementsData` entry**.
- **Leadership:** a brass compass/astrolabe in gimbal rings, suspended by root strands.
- **Experience:** an open ledger on a lectern with glowing pages and one ribbon per `experienceData` entry.

Click (optional) opens the DetailPanel. A single projected DOM `ArchiveLabel` shows crisp text
(not drei `<Html transform>`). Accent colours are in `lib/world/archive.ts`.

### 4.8 Remaining scene pieces (not written)
- **Ecosystem:** lake water shader with depth from the analytic terrain, fresnel and sky reflection,
  and scrolling normals. River ribbon with flow. Waterfall curved sheet (shader streaks) plus GPU
  mist and spray, and a foam ring. About 12 GPU-animated fish. Optionally a few distant birds.
- **Forest:** 30–40 trees from about 5 generated variants (broadleaf and conifer), instanced, using
  `isReserved()` to keep the camp, lake, river, bay and tree clearing free.
- **Family:** stylized, faceless, silhouette-first figures. Dad at a BBQ grill with smoke. Mom and
  Aunt in conversation. Grandma resting in a camp chair. Brother playing fetch with Bella
  (the Shih Tzu). Girlfriend at the lake shore. Add a tent, campfire, chairs and lantern.
  Use `terrainHeight` for every foot.
- **Interior dressing:** bracket-fungus shelves, glowing crack decals plus additive light-beam
  volumes, and GPU dust motes.
- **UI:** CinematicNarration (DOM, lower third, one line at a time, verified copy only),
  DetailPanel (a non-modal side sheet or mobile bottom sheet; closes on Escape, the close button,
  or scrolling away from the artifact), SocialIcons (GitHub, LinkedIn, Instagram from `social.ts`),
  JourneyHUD (thin progress line, chapter label, skip link), and a LoadingVeil until shaders are
  precompiled with `gl.compileAsync` and the first frame has rendered.
- Opt-in perf hooks per `lib/world/debug.ts`: `?perf` exposes
  `window.__world = { gl, scene, ready, setProgress }`. `?off=tree,terrain,water,family,forest,artifacts,post,shadows,html`
  disables systems. `?quality=` forces a tier. **The profiler expects `__world.setProgress` and `__world.ready`.**

---

## 5. Files touched so far

**Created (all type-check clean):**
- `lib/world/noise.ts` — seeded PRNG, simplex 2D/3D, fbm, ridged.
- `lib/world/layout.ts` — geography and `terrainHeight`. Validated with `scripts/check-terrain.ts`.
- `lib/world/glsl.ts` — hash, simplex3, periodic noise and Voronoi GLSL.
- `lib/world/textures.ts` — GPU texture baker and leaf atlas.
- `lib/world/geometry.ts` — `buildTube` (parallel transport, elliptical, bumpy, UVs), `buildRock`,
  `mergeGeometries`, `buildFoliageClump`.
- `lib/world/tree.ts` — the World Tree generator (validated).
- `lib/world/atmosphere.ts` — sun, sky and fog constants, height-fog chunk patch, sky material.
- `lib/world/materials.ts` — bark, rock, foliage (plus depth) and terrain materials, and shared `uTime`.
- `lib/world/store.ts` — the `frame` mutable per-frame state plus the `ui` store (`useUi`).
- `lib/world/archive.ts` — artifact catalogue built from verified data.
- `lib/world/quality.ts` — tiers and device detection.
- `lib/world/debug.ts` — URL flags.
- `components/world/WorldResources.tsx` — context for the baked textures and the sky/interior PMREM.
- `scripts/profile-world.mjs`, `scripts/ts-hooks.mjs`, `scripts/check-tree.ts`, `scripts/check-terrain.ts`
  — temporary QA tooling; decide at cleanup.
- `.handoff/` (gitignored) — baseline JSON and screenshots.

**Replaced:** `components/world/Terrain.tsx` — the new graded-grid terrain, splat masks, instanced
procedural rocks and cliff dressing. Never rendered yet.

**Modified:**
- `src/data/projects.ts` — added verified `github` URLs.
- `src/data/social.ts` — added Instagram `@yuxith_pov` and handles. The type is now a platform union.
- `.gitignore` — added `.handoff/`.

---

## 6. Remaining work, in order
1. New `PortfolioWorld.tsx` (Canvas, quality, PerformanceMonitor, `WorldResources`, perf hooks,
   frameloop toggling) and `EnvironmentSetup.tsx` (sky dome, fog, sun with follow-shadow,
   accent light, exposure and interior blend, post). New `app/page.tsx`, `smooth-scroll.tsx`
   (Lenis for the whole page), `globals.css` without the overlay. **Look at it in the browser.**
2. Tune terrain, sky, fog and light from screenshots.
3. `WorldTree.tsx` rendering the generator output with bark materials and an instanced canopy.
   Tune it from multiple angles; use a `?perf` camera override for inspection.
4. `CameraChoreographer.tsx` with the full journey keyframes and focus magnet. Verify there is no
   clipping by sampling the path against `terrainHeight` and `cavityAt` in a check script.
5. `Ecosystem.tsx` (water and waterfall), `Forest.tsx`, `FamilyCampfire.tsx`.
6. `TreeInterior.tsx` plus `components/artifacts/*` and the archive mounts.
7. UI: narration, label, panel, social icons, HUD, loading veil. Fix the portfolio bugs
   (social buttons, scroll container).
8. Delete obsolete files and dependencies (§3 table). Write README.md, rewrite the codex handoff,
   delete the old reports.
9. AFTER profiling: the same checkpoints plus `?off=` isolation at capped and uncapped rates.
   Full browser QA checklist (brief Phase 35), console check, `npm run build`, final report (Phase 38).

---

## 7. Tooling notes (important)
- **Spawning the system Chrome fails** in this environment (`spawn UNKNOWN`). The profiler uses
  Chrome for Testing 152 from the puppeteer cache (override with `CHROME_PATH`).
  Launching any browser from the Bash tool needed `dangerouslyDisableSandbox: true`.
- Profiler: `node scripts/profile-world.mjs --url http://localhost:3000 --query perf --out <dir> [--uncapped] [--shots false] [--checkpoints 0,0.1,...]`
  Output: FPS, frame ms, p95, GPU ms, calls, triangles, script ms/s, DOM mutations/s, plus screenshots.
- Use `--uncapped` for throughput. Capped runs measure at 60 or 144 Hz depending on flags.
- The machine has only the NVIDIA GPU visible to Chrome. Intel UHD testing wasn't possible.
- Run generators in Node: `node --no-warnings --import ./scripts/ts-hooks.mjs scripts/check-tree.ts`
  (Node 26 strips TS types; avoid TS parameter properties and enums in `lib/world`).
- Versions: three 0.185.1, R3F 9.7.0, drei 10.7.8, @react-three/postprocessing 3.1.1,
  postprocessing 6.39.4, next 16.2.6, react 19.2.6, lenis 1.3.23.
  The `THREE.Clock deprecated` warning comes from R3F itself and is still present in R3F 9.8.1.
  It can't be fixed locally, so document it.
