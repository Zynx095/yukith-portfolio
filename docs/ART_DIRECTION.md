# Art direction — "The Root Network"

> An ancient World Tree whose roots are a living network. Every project Yukith has built is a
> node on it.

## The idea

Yukith studies **computer networks**. Forests have one too: the mycorrhizal "wood wide web" that
connects trees through their roots and carries signals between them. The portfolio fuses the two.

- **The World Tree** is natural and ancient: brown bark, moss, roots like cliffs, a green canopy
  catching the evening sun. It is the landmark, the destination and the archive. Its silhouette is
  deliberately not an oak's dome: the crown grows in **tiers** of broad, shallow foliage pads (long
  low limbs, a middle storey, steep leaders out of the broken top) with sky between them, and
  **aerial roots** hang from the lower limbs — some have reached the ground and become pillars, as on
  an old banyan. The great roots arch clear of the ground, dive under it and surface again.
- **The signal** is the only "technological" element: thin threads of cool bioluminescent light
  running along the crests of the roots, up the pillar roots and through the soil, with pulses
  travelling along them like packets — the veins of the tree, not lines drawn on the ground. After
  dark the tops of the crown's pads carry faint nodes of the same light. It starts
  as a single seed in the loading screen and is present until the end (the persistent motif,
  learned from The Monolith Project).
- **Inside the tree** the roots converge in a round heartwood hall. The threads form a star
  topology: a glowing heart node in the centre, one link to each project relic in the wall. When
  a relic is in focus, its link carries the pulse.

The metaphor is literal enough to be read without explanation, and specific enough that it
belongs to a networks student and no one else.

## Pillars

1. **A living place, not a demo.** Wind in grass and leaves, moving water, fire, drifting motes and
   insects. Every motion has a reason. No floating decorative geometry.
2. **Natural first, signal second.** 95 % of the image is natural material and natural light. The
   signal colour is rare, so it always means something: "this is connected", "this is
   interactive", "this is in focus".
3. **Composition at every stop.** The camera is choreographed; every chapter has framed shots.
   The archive is a circular hall orbited by scroll, so every relic is centred and lit.
4. **Information is always one step away.** The 3D is the attraction; the HTML layer (index,
   detail records, full portfolio) is never more than one click or key away.
5. **Beautiful without post-processing.** Tone mapping, bloom and vignette refine the frame; they
   never rescue it.

## Colour script (time of day follows the story)

| Chapter | Light | Mood |
|---|---|---|
| Seed (loading) | ink on dark paper | A line drawing of the tree, drawn by real load progress |
| Arrival | late-afternoon gold, warm haze | Scale and calm — the tree on the horizon |
| Home | golden hour, campfire warmth | Personal, cozy |
| The path | sun lowering, long shadows | Purpose; signal threads appear in the soil |
| The reveal | sunset rim light on the tree | Awe |
| The roots | dusk, cool shadows, warm sky | The signal becomes clearly visible |
| The archive hall | amber heartwood + cool signal | Focused, sacred, quiet |
| The rings | three stages: 2024 amber (Roots), 2025 gold with shafts of daylight (Reach), 2026 signal-teal (Branching) | Growth — one node per item, the years stacked up the hollow as halos |
| The crown | night: out of the broken top between the leaders, above the tiers, stars, the crown's nodes | Connection — contact links in the last beat |

## Palette

| Token | Value | Use |
|---|---|---|
| `--ink` | `#0f0d0b` | page background, panels (bark ink) |
| `--ink-2` | `#17130f` | raised surfaces |
| `--line` | `rgba(239,231,218,.14)` | hairlines |
| `--paper` | `#efe7da` | primary text |
| `--paper-dim` | `#b6aa96` | secondary text |
| `--sap` | `#d9a441` | life accent: headings marks, years, rings |
| `--signal` | `#7ee0cf` | network accent: focus rings, links, active states |
| `--ember` | `#e0703a` | rare warnings ("blocked", "simulated") |

Scene colours are physical (linear, tone-mapped); UI colours never glow.

**Classic presentation** — the same tokens re-cut for a light editorial page (set on
`html[data-view="classic"]` in `app/globals.css`): ink `#f4efe6` (warm paper), paper `#17140f`
(text), paper-dim `#574f43`, sap `#8a5a12` (deep ochre), signal `#0e6a5d` (deep teal), ember
`#a8461a`. Every text colour meets WCAG AA on the paper background. Layout: a sticky numbered label
column beside each section, Fraunces display headings, generous measure, project records opening
inline.

## Typography

- **Display — Fraunces** (variable serif with soft, organic terminals): names, chapter titles,
  project titles. Used large and sparingly.
- **Text — Inter**: body copy and UI. 16–18 px base, 1.6 line height in records.
- **Data — JetBrains Mono**: stacks, statuses, years, coordinates-style labels. Small caps
  tracking for chapter labels.

No handwritten fonts for body copy, no all-caps paragraphs, no text inside the 3D scene that the
visitor must read to understand the site (carved words are decorative echoes of the HTML text).

## Materials

| Surface | Approach |
|---|---|
| World Tree bark | Photo-scanned CC0 bark (Poly Haven `bark_willow`), triplanar at two scales, macro colour variation, crevice AO, moss on up-facing and low surfaces, damp darkening at the base |
| Heartwood (interior) | Procedural growth rings + fibre grain, warm amber, lit from the heart node |
| Ground | CC0 forest-litter, sparse-grass and trail textures splatted by terrain masks; instanced wind grass on top |
| Rocks / waystones | CC0 photo-scanned rock models (Poly Haven `rock_moss_set_01/02`) |
| Canopy | Instanced leaf-cluster cards from a generated leaf atlas; alpha-to-coverage; translucency toward the sun; golden rim at sunset; deep greens (never all-gold) |
| Signal | Emissive tubes with travelling pulses; additive halo; the only bloom source besides fire and the sun |
| Relics | Aged brass, dark bronze, obsidian glass, carved wood — lit by the interior environment map |

## Lighting rules

- One directional sun with a camera-following, texel-snapped shadow frustum. One hemisphere/IBL
  term from the procedural sky. Two point lights (fire/heart and the focused relic) — the light
  count never changes, so shaders never recompile mid-journey.
- ACES filmic tone mapping, exposure adapts between outside and inside.
- Fog is atmospheric perspective, not a curtain: distant ridges fade, the tree never disappears.

## Motion rules

- Scroll drives a critically damped progress spring; the camera follows the authored path
  exactly (no corner cutting through geometry), pitch below 60°, no roll.
- Idle micro-motion only (slow drift, pointer parallax); none with `prefers-reduced-motion`.
- UI transitions 200–400 ms, ease-out; nothing bounces.

## Interaction model

- **Required:** scroll (or keys / swipe / scrollbar).
- **Optional:** click a relic for its record, click Bella to throw a stick, inspect camp props,
  open the index (`/`), toggle sound.
- Every interaction is one gesture (Egg Hunt), and everything has an HTML equivalent.

## What this is not

Not a game with a character to steer. Not cyberpunk, not neon, not a golden glowing tree, not a
dashboard of glass cards. No payloads beyond what the scene needs.
