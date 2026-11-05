# Progress — World Tree portfolio transformation

Living document. If a session ends, the next one resumes from **Next action**.

Brief: "Ultimate portfolio transformation — master engineering directive" (2026-11-06).
Branch: `feat/world-tree-rebuild`.

## Phase status

| Phase | Status | Notes |
|---|---|---|
| A — Research & audit | ✅ done | `docs/research/REFERENCES.md`, `docs/AUDIT.md` |
| B — Reference comparison & art direction | ✅ done | `docs/ART_DIRECTION.md` |
| C — Content & data verification | 🟡 in progress | `docs/CONTENT_VERIFICATION.md` written; data files next |
| D — Architecture cleanup | ⏳ | |
| E — Rendering pipeline | ⏳ | |
| F — World Tree rebuild | ⏳ | |
| G — Environment & journey | ⏳ | |
| H — Project discovery & interactions | ⏳ | |
| I — UI/UX & responsive | ⏳ | |
| J — Performance | ⏳ | |
| K — Browser testing & visual regression | ⏳ | |
| L — Cleanup & documentation | ⏳ | |

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

## Next action

Rewrite `src/data/*` from `docs/CONTENT_VERIFICATION.md`, then build the asset pipeline.
