# Assets — inventory and provenance

Everything the world downloads, where it came from, its licence and its size after processing.
Sources are cached in `.cache/assets-src/` (gitignored); `scripts/assets/build-assets.mjs`
rebuilds every output in `public/assets/` from them.

## Licences

| Source | Licence | Notes |
|---|---|---|
| [Poly Haven](https://polyhaven.com) | **CC0 1.0** (public domain) | No attribution required; credited in the site footer anyway. |
| [Fraunces](https://fonts.google.com/specimen/Fraunces) (Undercase Type) | **SIL OFL 1.1** | The UI fonts are served by `next/font`. A 6 KB subset (only the waystone letters) is in `public/assets/fonts/`. |
| Inter, JetBrains Mono | SIL OFL 1.1 | `next/font/google`, self-hosted at build time. |

Nothing is taken from the reference portfolios. All code, shaders and procedural geometry are original.

## Textures (`public/assets/textures/`)

Each surface is three WebP files: `_color` (sRGB), `_normal` (OpenGL convention), `_data`
(R ambient occlusion · G roughness · B height), packed by the pipeline.

| Output | Poly Haven asset | Resolution | Size (color + normal + data) | Used for |
|---|---|---|---|---|
| `bark_*` | `bark_willow` | 2048 (data 1024) | 828 + 1517 + 232 KB | World Tree, roots, limbs, forest trunks, heart knot, camp logs |
| `grass_*` | `sparse_grass` | 1024 | 257 + 420 + 254 KB | Meadow ground (recoloured in the shader) and bark moss |
| `litter_*` | `forest_leaves_02` | 1024 | 426 + 459 + 251 KB | Forest floor, the clearing under the crown, the hall floor |
| `trail_*` | `rocky_trail` | 1024 | 356 + 389 + 282 KB | The trail |
| `rock_*` | `mossy_rock` | 1024 | 374 + 166 + 205 KB | Steep slopes and high ground, plinths, fire ring |

## Models (`public/assets/models/`)

glTF binaries from the Poly Haven 1k packages: deduplicated, welded, simplified with meshoptimizer
where noted, textures re-encoded as WebP ≤ 1024 px, quantised and **meshopt-compressed**
(`EXT_meshopt_compression`, decoded by three's bundled `MeshoptDecoder` — no extra download).

| Output | Poly Haven asset | Triangles (source → shipped) | Size | Used for |
|---|---|---|---|---|
| `rocks-tall.glb` | `rock_moss_set_01` | 63,127 → 34,512 | 649 KB | Waystones |
| `rocks-round.glb` | `rock_moss_set_02` | 57,647 → 35,990 | 781 KB | Boulders by the water and in the clearing |
| `fern.glb` | `fern_02` | 6,232 | 235 KB | Ferns among the roots and by the river |
| `moss.glb` | `moss_01` | 204 | 161 KB | Moss mounds at the base of the tree |
| `stump.glb` | `tree_stump_01` | 41,046 → 16,415 | 955 KB | The stump by the campfire |
| `celandine.glb` | `celandine_01` | 8,966 → 5,766 | 277 KB | Yellow flowers in the meadow |

## Generated at runtime (no download)

| Asset | Where |
|---|---|
| World Tree (trunk shells, buttress roots, limbs, hollow, entrance) | `lib/world/tree.ts` |
| Terrain, river, lake | `lib/world/layout.ts`, `components/experience/scene/{Terrain,Water}.tsx` |
| Foliage atlas (drawn on a canvas) | `lib/world/procedural.ts` |
| Grass field texture (height · density · lushness) | `components/experience/scene/Grass.tsx` |
| Forest trees | `lib/world/flora.ts` |
| Relic sculptures, camp, Bella, lanterns | `components/experience/scene/{Relics,Camp,Props}.tsx` |
| Sky, sky IBL, interior IBL | `lib/world/atmosphere.ts`, `components/experience/scene/Atmosphere.tsx`, `WorldCanvas.tsx` |
| Ambient sound (wind, fire, water, crickets, hall drone, chime) | `lib/world/audio.ts` — Web Audio synthesis, no audio files |

## Budget

| | Size |
|---|---|
| Textures | ≈ 6.4 MB |
| Models | ≈ 3.0 MB |
| Font subset | 6 KB |
| **World total** | **≈ 9.4 MB**, loaded after the HTML portfolio is already readable |

KTX2/Basis was considered: it would cut GPU memory, but needs an encoder toolchain (`toktx`) that is
not available in this environment. WebP keeps the download small; GPU memory for the 15 textures
with mipmaps is ≈ 115 MB, acceptable for the desktop tiers. Converting to KTX2 is the next step if
low-memory phones become a target.
