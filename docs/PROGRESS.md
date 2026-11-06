# Progress — World Tree portfolio transformation

Living document. If a session ends, the next one resumes from **Next action**.

Brief: "Ultimate portfolio transformation — master engineering directive" (2026-11-06).
Branch: `feat/world-tree-rebuild`.

## Phase status

| Phase | Status | Notes |
|---|---|---|
| A — Research & audit | ✅ done | `docs/research/REFERENCES.md`, `docs/AUDIT.md` |
| B — Reference comparison & art direction | ✅ done | `docs/ART_DIRECTION.md` |
| C — Content & data verification | ✅ done | `src/data/*` rewritten from the October 2026 resume + source trees |
| D — Architecture cleanup | ✅ done | old world/UI removed; 49 unused runtime deps pruned (59 → 10); dead helpers removed |
| E — Rendering pipeline | ✅ done | WebGL2, MSAA composer, ACES, dithering, PMREM sky IBL rebuilt as the day ends, moonlight |
| F — World Tree rebuild | ✅ first pass | photo bark, heartwood, instanced crown; further silhouette tuning possible |
| G — Environment & journey | ✅ first pass | valley, river, lake, meadow, forest, camp, waystones, network, rings, crown |
| H — Project discovery & interactions | ✅ | nine relic sculptures, click → record, Bella, index (/) |
| I — UI/UX & responsive | ✅ | portfolio, record dialog, index, journey UI; phone layout checked at 390×844 |
| J — Performance | ✅ measured | see below |
| K — Browser testing | ✅ | `scripts/qa-world.mjs` 8/8 pass; screenshot sets per chapter (desktop + phone) |
| L — Cleanup & documentation | ✅ | README, ASSETS, this file |

## Decisions

- **Stay on WebGL2** (three r185 `WebGLRenderer`). Six of the sixteen live references use WebGPU,
  but this codebase's materials are GLSL `onBeforeCompile` patches and its post stack is
  `postprocessing` (WebGL-only); a WebGPU port means rewriting every shader in TSL for no measured
  bottleneck (GPU time was 1.7–6.5 ms). WebGL2 is universally available, including the phones
  where Samsy itself falls back to WebGL2.
- **Scroll-driven journey stays** (recruiter-friendly, works with keyboard/touch/scrollbar), with
  optional one-gesture interactions and a full HTML index.
- **The archive becomes a circular hall** orbited by scroll (from Aimee's papercraft room), so every
  relic is framed.
- **CC0 photo-scanned textures/models from Poly Haven** replace the procedural bark/rock look;
  provenance in `docs/ASSETS.md`.
- **No people models.** Family is present through the home camp, light and words; Bella is the only
  character.

## Where things live

- `components/experience/WorldCanvas.tsx` — canvas, quality tiers, asset loading, ready signal, `?perf` hooks.
- `components/experience/scene/*` — Atmosphere (sky/sun/fog/post), CameraRig, Terrain, Water, Grass, Forest,
  Props (waystones, scans, lanterns), Camp (+ Bella), WorldTree, SignalNetwork, ArchiveHall, Relics, Glows.
- `components/experience/ui/*` — Loader, JourneyOverlay (narration, chapter rail, relic label, ring cards).
- `lib/world/*` — layout (geography), journey (camera keys, beats), chapters, archive, signal, rings, tree
  (generator), materials, atmosphere, assets, procedural, store, scroll, quality, debug.
- QA scripts: `scripts/shoot-cams.mjs` (shots at progress / pinned cameras), `scripts/scene-stats.mjs`
  (heaviest meshes), `scripts/profile-world.mjs` (frame/GPU timing), `scripts/shoot-page.mjs` (HTML sections).

## Measurements (production build, 2026-11-06)

Machine: i7-13700HX, RTX 5050 Laptop GPU (ANGLE/D3D11), Edge 156 headless, 1920×1080, DPR 1,
`scripts/profile-world.mjs --uncapped`, 2.5 s settle + 2 s sample per checkpoint.

| Tier | Outdoors (p 0 – 0.42) | Archive hall (p 0.53 – 0.85) | Crown (p 0.97) |
|---|---|---|---|
| high | 104 – 172 fps · GPU 4.7 – 8.6 ms · 5.8 – 6.8 M tris (all passes) · 80 – 270 calls | 350 – 415 fps · GPU 1.6 – 1.7 ms · 0.93 M tris | 95 fps · GPU 7.2 ms |
| medium | 154 – 179 fps · GPU 3.3 – 6.1 ms | 274 fps · GPU 2.3 ms | 147 fps · GPU 5.4 ms |
| low | 169 – 489 fps · GPU 1.8 – 5.7 ms | 672 fps · GPU 1.0 ms | 271 fps · GPU 3.8 ms |

- 60 fps (16.7 ms) is met with a wide margin on this GPU at 1080p in every tier. **Not measured on an
  integrated GPU or a real phone** (none available); tiers are chosen for them by `detectInitialTier`
  and lowered further at runtime by the PerformanceMonitor.
- Subsystem isolation (`?off=`) at the arrival shot: forest ≈ 2.5 ms GPU (reduced since with lighter
  leaf masses and shadow casting only near the trail), World Tree ≈ 1.2 ms, shadows ≈ 1 M triangles.
- Load: world assets ≈ 9.4 MB after the HTML; page `load` ≈ 0.6 s locally.
- Console: no errors. Known warnings: `THREE.Clock` deprecation (emitted by R3F itself), and D3D
  shader-compiler precision notes from ANGLE.

## Open items / owner review

- Content flagged `review` in `docs/CONTENT_VERIFICATION.md`: InTech Club role (not on the current
  resume), PromptWars organiser, family details, projects with no repository (PRANA as a lead
  project, Food Waste Rescue, Rural Bus Tracker, Deepfake Detector, EDITH AR).
- Copy written for the site that the owner should approve: the intro line ("I build security
  systems, applied-AI tools and the occasional robot — and I like them to explain themselves"), the
  about paragraphs and the narration lines in `lib/world/journey.ts`.
- Visual polish worth another pass: the rings/chimney chapter is dark and spare; the World Tree's
  silhouette reads as a colossal oak rather than something more mythic; KTX2 textures for phones.
- Not tested: real phones, Safari/Firefox, integrated GPUs.

## Next action

Owner review of the flagged content, then deploy.
