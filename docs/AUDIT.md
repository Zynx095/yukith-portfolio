# Repository audit — 2026-11-06 (before the transformation)

Branch `feat/world-tree-rebuild` at `6b1b71f`, 133 commits ahead of `main`, clean tree.
`npm run build` passes (Next.js 16.2.6, Turbopack, TypeScript 5.7).

## What exists

A single-page Next.js app: a fixed full-screen R3F canvas driven by the page scroll (a
34-viewport-tall spacer), followed by an HTML portfolio. ~11.5k lines in `app/`, `components/`,
`lib/`, `src/data/`, `scripts/`.

### Measured in a real browser (production build, Edge 156, RTX 5050 Laptop, 1600×900, DPR 1)

19 checkpoints across the journey (`scripts/profile-world.mjs`, 2.5 s settle, 1.5 s sample):

| Metric | Value |
|---|---|
| Frame time | 6.9 ms typical at the 144 Hz cap; two checkpoints at 9.2–9.6 ms (p95 14 ms) |
| GPU time / frame | 1.7 – 6.5 ms |
| Draw calls | 31 – 309 |
| Triangles | **0.47 M inside, 1.45 – 1.72 M outside** |
| Main-thread script | **400 – 815 ms per second** — the main thread is busy most of every second |
| Console | `THREE.Clock` deprecation (from R3F), D3D shader precision warnings |

### Visual verdict (screenshots of every chapter)

| Area | Verdict |
|---|---|
| Outdoor valley | Competent but generic. The waterfall plateau's cliffs read as **stacked pancakes**; the family are stiff low-poly figures; the lake and river are fine. |
| World Tree, outside | Reads as an ordinary large tree. The canopy is **all gold**, which contradicts the earlier art direction ("do not make the entire tree gold"). The trunk at close range is a smooth cylinder with orange speckles. |
| Entrance | Dark and muddy; the arch does not read. |
| Interior | **Weakest part.** A flat brown wall with yellow streak lines; relics are identical gold medallions with icons, so the metaphors are UI badges, not objects. Several checkpoints frame only empty wall. |
| Ending | A white blob — the "ascent into light" does not land. |
| HTML portfolio | Three unrelated palettes (cream, dark brown, green); generic copy ("Selected Works", "Let's Connect"); empty social buttons were fixed earlier. |

### Data problems found (details in `CONTENT_VERIFICATION.md`)

- ETTH test count stale (46 → 459). InnovateX 4.0 year wrong (2024 → 2026). Certification code
  wrong (AZ-900 → AI-900). Employer name incomplete (Elevance → Elevance Skills).
- WARDEN and ALIAS — two of the strongest projects — are missing entirely.
- ShadowGuard's description claims anomaly detection / insider-threat monitoring; the code shows a
  mitmproxy + Presidio prompt-DLP prototype with **simulated** media scores.
- `personal.ts` holds a date of birth, relationship details and inconsistent family data.

## Classification

| Action | Files | Reason |
|---|---|---|
| **KEEP** (engine) | `lib/world/noise.ts`, `lib/world/glsl.ts`, `lib/world/geometry.ts`, `lib/world/scroll.ts`, `lib/world/debug.ts`, `lib/world/store.ts`, `components/providers/smooth-scroll.tsx`, `scripts/ts-hooks.mjs`, `scripts/profile-world.mjs` | Sound, tested utilities |
| **REFACTOR** | `lib/world/tree.ts` (generator kept, hall + slots + canopy anchors reworked), `lib/world/quality.ts`, `lib/world/atmosphere.ts` (time-of-day), `lib/world/textures.ts` (photo textures + procedural fallbacks), `components/world/CameraChoreographer.tsx` (orbit stations), `components/world/WorldResources.tsx`, `scripts/check-tree.ts`, `scripts/qa-world.mjs`, `scripts/shoot-page.mjs` | Good foundations with the wrong content |
| **REPLACE** | `lib/world/layout.ts` (no plateau), `lib/world/journey.ts`, `lib/world/materials.ts`, `components/world/{PortfolioWorld,EnvironmentSetup,Terrain,Ecosystem,Forest,FamilyCampfire,WorldTree,TreeInterior}.tsx`, `components/artifacts/Archive.tsx`, `components/ui/*`, every HTML portfolio component, `src/data/*` | Visually weak or factually wrong |
| **DELETE** | `lib/world/cliff.ts` + `scripts/check-cliff.ts` (plateau removed), `lib/world/sigils.ts` + `components/ui/SigilMark.tsx` (medallion system), `lib/world/flora.ts` (replaced), `lib/world/archive.ts`, `lib/world/constants.ts` (merged), `components/work/*`, `components/projects/*`, root reports | Replaced by the new architecture |
| **MOVE** | `ANTIGRAVITY_*.md`, `AUDIO_FIX_REPORT.md`, `CHANGE_REPORT.md`, `IMPLEMENTATION_PLAN.md`, `REBUILD_HANDOFF.md` → `docs/history/` | Historical record; superseded |
| **DEPENDENCIES** | Remove (verified unimported): all `@radix-ui/*`, `@hookform/resolvers`, `react-hook-form`, `zod`, `cmdk`, `date-fns`, `embla-carousel-react`, `input-otp`, `react-day-picker`, `react-resizable-panels`, `recharts`, `sonner`, `vaul`, `next-themes`, `framer-motion-3d`, `@studio-freight/react-lenis`, `class-variance-authority`, `clsx`, `tailwind-merge`, `autoprefixer`, `tw-animate-css` | Leftovers of a shadcn template |
