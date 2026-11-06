# Progress — World Tree portfolio

Living document. If a session ends, the next one resumes from **Next action**.

## Expansion — "a living interactive world" (2026-11-06)

Brief: "Master execution prompt — expand the entire portfolio into a living interactive world".
Branch: `feat/complete-personal-world`, merged into `main` normally (see `docs/DEPLOYMENT.md`).
The production experience before it, the Classic mode, the switcher, `?view=`, the WebGL fallbacks,
the no-JS page and the rollback tag `portfolio-pre-world-tree-production` are all kept.

### Phase status

| Phase | Status | Notes |
|---|---|---|
| 0 — Audit | ✅ | repository, docs and the live site reviewed before changes |
| 1A — Valley of Origins (home) | ✅ | five faceless, unnamed figures (grill, two talking, resting, playing with Bella) with idle motion; grill smoke; memory objects (photo frame, scrap PC …) — `components/experience/scene/Family.tsx`, `src/data/origins.ts` |
| 1B — Denser world | ✅ partial | fallen logs, mushrooms, wildflower drifts, birds round the crown, fireflies at dusk (`Ecosystem.tsx`). Existing rocks, ferns, moss and stumps unchanged. |
| 1C — Gaming arena | ✅ | sealed hall behind the district: Valorant / CS:GO / MLBB chambers with original emblems, the AMD trophy, a levels wall ("not a timeline"), the aim-trainer booth — `Arena.tsx`, `src/data/gaming.ts` |
| 1C — Aim trainer | ✅ | flick / precision / reaction / moving; easy / normal / hard; HUD, countdown, results, restart, personal best; own WebGL context, loaded on demand, the world paused meanwhile — `lib/aim/engine.ts`, `components/aim/*` |
| 1D — Hackathon district | ✅ | all 20 events (the owner's 16 + 4 from the resume), one domain artifact each, results only with a source — `District.tsx`, `src/data/events.ts` |
| 1E — Engineering archive | ✅ | project records gain architecture and key decisions (12 projects) |
| 1F — Library | ✅ | reading cabin on the tree's longest limb; only the owner's named titles; original covers — `Library.tsx`, `src/data/library.ts` |
| 2 — Living world | ✅ | wildlife, particles, idle animation (above); light count unchanged |
| 3 — Journey | ✅ | 11 chapters; regions inserted into the story through short cuts; chapter rail and index jump to every chapter; `/` still opens the index; drag to look around |
| 4 — Interaction systems | ✅ | name tags for nearby things; one record dialog for projects, events, ranks, tournaments, family, memories, volumes; local discoveries (`yk-discoveries`, count in the index, a toast) |
| 5 — Classic | ✅ | Competitions, Gaming, Origins (in About), Library sections; the aim trainer opens from Classic too; no three.js in Classic |
| 6 — Content verification | ✅ | `docs/CONTENT_VERIFICATION.md` §12–§16 |
| 7 — Performance | ✅ measured | below |
| 8 — Visual quality | ✅ reviewed | screenshots of every region and chapter checked at 1920×1080 |
| 9 — Tests | ✅ | below |
| 10 — Release | see `docs/DEPLOYMENT.md` | |

### Decisions

- **Regions are places inside the story, not new pages.** `lib/world/chapters.ts` runs two clocks:
  scroll position (45 viewport heights) and story time (30). Inside a region the story clock —
  time of day, the tree's interior, rings — holds still and the region's own clock moves the camera
  along its path (`lib/world/regions.ts`). Entering the arena or the library is a short fade (a
  change of place); the district is reached by walking.
- **The arena is a pocket.** While it is on screen the valley, the tree and the network are hidden
  and an arena environment map is used, so the hall costs only itself (~160 fps).
- **No new lights.** The fire light and the focus light are moved per region; shaders never
  recompile mid-journey.
- **Static region geometry is merged per material** (`lib/world/mergeStatic.ts`), with invisible
  hit boxes for picking; family figures are one skinned mesh each.
- **Every word in the world comes from `src/data`** through `lib/entries.ts`; the world shows no text
  the Classic page does not.
- **The aim trainer is isolated**: a separate lazy chunk, a separate WebGL context released when the
  game closes, the world's render loop paused while it is open.
- **Regions are not lazy-loaded separately.** They are part of the world chunk (itself loaded only
  in Immersive) and are generated with it; time to a ready world is 7.6–10.2 s locally (three cold
  loads; ~8–9 s before). Splitting them out was not worth a pop-in on the first scroll into them.

### Measurements (production build, 2026-11-06)

Machine: i7-13700HX, RTX 5050 Laptop GPU (ANGLE/D3D11), Edge headless, **1920×1080**, DPR 1, high
tier, `scripts/profile-world.mjs --uncapped` (2.5 s settle, 2 s sample). (The perf commit message
`9e07560` says 1440×900 by mistake; the profiler's default — and these runs — are 1920×1080.)

| Checkpoint | before merging/skinning | final | p95 ms | draw calls |
|---|---|---|---|---|
| story 0 (arrival) | 59.5 fps | 78.4 fps | 17.4 | 236 |
| story 0.09 (home, family) | 47.9 | 80.1 | 15.4 | 251 |
| story 0.2 (path) | 58.0 | 80.9 | 14.9 | 162 |
| district (entry · middle · end) | 50.8 (story 0.27) | 90.3 · 85.0 · 90.3 | 13.4–13.9 | 146–168 |
| arena (gate · chamber · booth) | — | 157.9 · 159.0 · 166.3 | 7.6–8.8 | 30–44 |
| story 0.42 (roots at dusk — baseline ~78) | 69.4 | 77.4 | 16.1 | 291 |
| story 0.5275 (archive hall) | 137.4 | 164.0 | 8.0 | 44 |
| library (interior · volumes) | — | 110.0 · 110.3 | 11.5 | 96–110 |
| story 0.866 (rings) | 168.7 | 171.6 | 7.6 | 29 |
| story 0.97 (crown) | 96.1 | 102.4 | 11.7 | 94 |

- 60 fps is held at every checkpoint on this GPU at 1080p; the slowest (arrival, roots at dusk) run
  at 77–78 fps with p95 ≤ 17.4 ms — the same as before the expansion (roots at dusk ~78 fps).
- The biggest single cost found was the name tags' `backdrop-filter` blur, which re-composited the
  WebGL canvas every frame (home 54 → 80 fps once removed and the tags' style writes reduced); then
  draw calls (~250 extra before merging).
- JS heap over repeated region switching (district → arena → library ×4, full GC): 80.1 → 81.1 MB.
- **Not measured**: integrated GPUs, physical phones, Safari, Firefox (none available).

### Tests (all run on the production build, 2026-11-06)

| Suite | Result |
|---|---|
| `scripts/test-aim.ts` (engine rules: modes, scoring, seeded spawns, timer, reaction rounds) | 10/10 |
| `scripts/qa-aim.mjs` (Classic + Immersive: lazy chunk, label, modes, countdown, hit/miss, HUD, results, context release, best score, reaction rounds, world paused/resumed) | 16/16 |
| `scripts/qa-regions.mjs` (chapters, all 20 exhibits, arena, booth → game, all 8 volumes, family tags, discoveries + reload, cuts, heap) | 22/22 |
| `scripts/qa-world.mjs` (skip link, `/`, Esc, relic label and record, chapter rail, no-JS) | 8/8 |
| `scripts/qa-view.mjs` (presentations, fallbacks, no-JS Classic incl. the new sections, phones) | 34/34 |

### Open items / owner review

- Gaming ranks and tournaments, and ten events, are **owner-reported** (no certificate or profile
  checked) — `docs/CONTENT_VERIFICATION.md` §12–§13 lists the evidence that would verify each.
- The ISACA / "ISAKA" naming, and the year of Prompt Wars (Presidency University), need the owner.
- The camp shows five generic figures; the owner's notes say the family has three members (§14).
- Mobile performance on physical devices is unverified.
- ESLint is referenced by `npm run lint` but not installed (pre-existing).

### Next action

Owner review on production; rollback steps are in `docs/DEPLOYMENT.md`.

---

## Earlier: World Tree rebuild (2026-11-06)

Briefs: "Ultimate portfolio transformation — master engineering directive" (2026-11-06) and
"Final execution — World Tree rebuild, visual fallback & production deployment" (2026-11-06).
Branch: `feat/world-tree-rebuild`, merged into `main` for production (see `docs/DEPLOYMENT.md`).

### Phase status

| Phase | Status | Notes |
|---|---|---|
| A — Research & audit | ✅ | `docs/research/REFERENCES.md`, `docs/AUDIT.md` |
| B — Art direction | ✅ | `docs/ART_DIRECTION.md` |
| C — Content verification | ✅ | owner decisions applied; `docs/CONTENT_VERIFICATION.md` §11 |
| D — Architecture cleanup | ✅ | 10 runtime dependencies |
| E — Rendering pipeline | ✅ | WebGL2, MSAA composer, ACES, dithering, sky IBL, moonlight |
| F — World Tree | ✅ second pass | tiered banyan-like crown, aerial and pillar roots, arching root system, veins of signal |
| G — Environment & journey | ✅ second pass | growth rings rebuilt; crown ascent rebuilt; actionable ending |
| H — Interactions | ✅ | relics, Bella, index (`/`), contact links in the last beat |
| I — UI/UX & responsive | ✅ | phone layouts checked at 390×844 (emulated) |
| J — Performance | ✅ measured | see below; load time fixed (~35 s → ~7–9 s to a ready world) |
| K — Browser testing | ✅ | `qa-world.mjs` 8/8, `qa-view.mjs` 34/34 |
| L — Documentation | ✅ | README, ASSETS, this file, DEPLOYMENT |
| M — Presentations | ✅ | Immersive / Classic, switcher, `?view=`, fallbacks, no-JS Classic |
| N — Production | ✅ deployed 2026-11-06 | `971c029` on www.yukithjoseph.me; verified live (`docs/DEPLOYMENT.md`); rollback tag `portfolio-pre-world-tree-production` |

### Decisions

- **Stay on WebGL2** (three r185). Unchanged from the first pass.
- **Two presentations, one written portfolio.** `components/portfolio/Portfolio.tsx` is the Classic
  page on its own (light editorial theme) and the record after the journey in Immersive (dark
  theme): the same server-rendered markup, re-themed through CSS tokens on `html[data-view]`. No
  duplicated content, nothing to fall out of sync, and the no-JS page is the Classic page.
- **The server renders `data-view="classic"`;** an inline `<head>` script (`lib/view-boot.ts`)
  resolves the mode before the first paint: `?view=` (this visit only) → stored choice → Immersive.
  Choosing a mode stores it and drops `?view=` so the two never disagree.
- **Classic never loads three.js.** The world (canvas, overlays, sound) is one lazily loaded chunk
  mounted only in Immersive. Leaving Immersive unmounts it; R3F disposes the renderer and forces a
  context loss. Shared state is reset on mount and unmount.
- **Fallbacks end in Classic, with a notice**: no WebGL 2 API (before paint), WebGL failing to
  start, asset failure, a render error (error boundary), a lost and unrestored context, or a stalled
  render loop (watchdog). Not stored, so the next visit tries Immersive again.
- **Loading**: the R3F frameloop is a controlled prop (R3F re-applies the prop on every render, which
  had silently re-enabled frames during loading); the world stays hidden until its programs have
  compiled; they are compiled for the composer's off-screen target that frames actually use (three
  bakes tone mapping / output colour space per render target, so compiling for the screen compiled
  everything twice, the second time synchronously). CPU generation is cached per visit.
- **The tree's network is part of the tree**: veins along the roots and pillar roots, faint nodes on
  the crown at night — instead of lines drawn on the ground.
- **Growth rings are data**: `lib/world/rings.ts` builds each year from `src/data`; one node per item.

### Where things live

- `lib/view.ts`, `lib/view-boot.ts`, `components/view/*` — presentation state, boot script, switcher,
  V shortcut, fallback notice.
- `components/experience/Experience.tsx` (shell, WebGL check, error boundary) →
  `ExperienceRuntime.tsx` (lazy) → `WorldCanvas.tsx` (canvas, compile, watchdog), `ui/*`.
- `components/experience/scene/GrowthRings.tsx` — the rings chapter; `lib/world/tree.ts` —
  `rootPaths()`, `treeSkeleton()` (limbs, pads, aerial roots).
- QA: `scripts/qa-world.mjs`, `scripts/qa-view.mjs`, `scripts/shoot-cams.mjs`, `scripts/profile-world.mjs`,
  `scripts/shoot-page.mjs`.

### Measurements (production build, 2026-11-06, second pass)

Machine: i7-13700HX, RTX 5050 Laptop GPU (ANGLE/D3D11), Edge headless, 1920×1080, DPR 1, high tier,
`scripts/profile-world.mjs --uncapped`. To separate the effect of this pass from the machine's state
on the day, the previous branch tip (`819ae92`) was built and measured in the same session:

| Checkpoint | before (819ae92) | after | GPU ms before → after |
|---|---|---|---|
| p 0 (arrival) | 85 fps | 81 fps | 11.4 → 11.8 |
| p 0.2 (path) | 105 fps | 116 fps | 8.4 → 8.0 |
| p 0.42 (roots, dusk — heaviest) | 81 fps | 78 fps | 10.3 → 10.3 |
| p 0.53 (archive hall) | 163 fps | 159 fps | 1.8 → 1.8 |
| p 0.866 (rings) | 274 fps | 183 fps | 1.6 → 2.1 |
| p 0.97 (crown) | 111 fps | 111 fps | 7.3 → 7.5 |

- 60 fps is held everywhere on this GPU at 1080p; the slowest checkpoint (roots at dusk) has a p95
  frame time of 15.2 ms, so the margin there is small. With vsync on, the outdoor checkpoints run at
  77–110 fps.
- The first pass recorded 104–172 fps outdoors on the same laptop; the before/after pair above shows
  the drop is the machine's state that day (power/thermal), not this pass (≤ 5 % outdoors).
- Time to a ready world (navigation → loader gone): **~35 s before → 8–9 s after** (assets ≈ 1.8 s,
  generation ≈ 4 s, parallel shader compile ≈ 2 s). Re-entering Immersive reuses cached generation.
- Repeated switching (10 round trips): every WebGL 2 context created is lost on exit; JS heap after a
  full GC 53.8 → 56.7 MB. troika-three-text keeps one small WebGL 1 glyph canvas for the visit.
- **Not measured** on an integrated GPU, a real phone, Safari or Firefox (none available).

### Open items / owner review

- Visual review on the live site (both presentations) — the owner's call.
- Mobile performance on physical devices is unverified.
- ESLint is referenced by `npm run lint` but not installed (pre-existing).

### Next action (then)

Owner review on production; rollback steps are in `docs/DEPLOYMENT.md`.
