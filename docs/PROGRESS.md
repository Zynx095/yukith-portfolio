# Progress — World Tree portfolio transformation

Living document. If a session ends, the next one resumes from **Next action**.

Briefs: "Ultimate portfolio transformation — master engineering directive" (2026-11-06) and
"Final execution — World Tree rebuild, visual fallback & production deployment" (2026-11-06).
Branch: `feat/world-tree-rebuild`, merged into `main` for production (see `docs/DEPLOYMENT.md`).

## Phase status

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
| N — Production | see `docs/DEPLOYMENT.md` | rollback tag `portfolio-pre-world-tree-production` |

## Decisions

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

## Where things live

- `lib/view.ts`, `lib/view-boot.ts`, `components/view/*` — presentation state, boot script, switcher,
  V shortcut, fallback notice.
- `components/experience/Experience.tsx` (shell, WebGL check, error boundary) →
  `ExperienceRuntime.tsx` (lazy) → `WorldCanvas.tsx` (canvas, compile, watchdog), `ui/*`.
- `components/experience/scene/GrowthRings.tsx` — the rings chapter; `lib/world/tree.ts` —
  `rootPaths()`, `treeSkeleton()` (limbs, pads, aerial roots).
- QA: `scripts/qa-world.mjs`, `scripts/qa-view.mjs`, `scripts/shoot-cams.mjs`, `scripts/profile-world.mjs`,
  `scripts/shoot-page.mjs`.

## Measurements (production build, 2026-11-06, second pass)

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

## Open items / owner review

- Visual review on the live site (both presentations) — the owner's call.
- Mobile performance on physical devices is unverified.
- ESLint is referenced by `npm run lint` but not installed (pre-existing).

## Next action

Owner review on production; rollback steps are in `docs/DEPLOYMENT.md`.
