/**
 * Sigils — the unique mark of every archive artifact.
 *
 * Each sigil is a small set of filled vector shapes (even-odd fill) that is
 * rendered twice from the same data: extruded and bevelled into a gold relic
 * inside the World Tree, and as inline SVG in the detail panel and Work
 * section. Marks are designed from what the project actually does.
 */

export type SigilTone = "gold" | "dark" | "accent";

export interface SigilPath {
  d: string;
  tone: SigilTone;
  /** 3D relief height override (default by tone: gold 1, accent 0.7, dark 0.35). */
  raise?: number;
}

export interface Sigil {
  /** SVG viewBox width/height. */
  w: number;
  h: number;
  paths: SigilPath[];
}

// ─── Path helpers (SVG y-down coordinates) ──────────────────────────────────

const f = (n: number) => +n.toFixed(2);

/** Closed polygon. */
function poly(pts: [number, number][]) {
  return `M${pts.map(([x, y]) => `${f(x)},${f(y)}`).join(" L")} Z`;
}

/** Circle as an SVG arc pair; combine two (outer + inner) for a ring. */
function circle(cx: number, cy: number, r: number) {
  return `M${f(cx - r)},${f(cy)} A${f(r)},${f(r)} 0 1 0 ${f(cx + r)},${f(cy)} A${f(r)},${f(r)} 0 1 0 ${f(cx - r)},${f(cy)} Z`;
}

function ring(cx: number, cy: number, r: number, thickness: number) {
  return `${circle(cx, cy, r)} ${circle(cx, cy, r - thickness)}`;
}

/** Thick polyline converted to a filled outline with mitred joins. */
function stroke(points: [number, number][], width: number) {
  const hw = width / 2;
  const left: [number, number][] = [];
  const right: [number, number][] = [];
  for (let i = 0; i < points.length; i++) {
    const [x, y] = points[i];
    const prev = points[Math.max(0, i - 1)];
    const next = points[Math.min(points.length - 1, i + 1)];
    const n0 = i > 0 ? normal(prev, points[i]) : normal(points[i], next);
    const n1 = i < points.length - 1 ? normal(points[i], next) : n0;
    let mx = n0[0] + n1[0];
    let my = n0[1] + n1[1];
    const ml = Math.hypot(mx, my) || 1;
    mx /= ml;
    my /= ml;
    const scale = Math.min(2.5, 1 / Math.max(0.35, mx * n1[0] + my * n1[1]));
    left.push([x + mx * hw * scale, y + my * hw * scale]);
    right.push([x - mx * hw * scale, y - my * hw * scale]);
  }
  return poly([...left, ...right.reverse()]);
}

function normal(a: [number, number], b: [number, number]): [number, number] {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l = Math.hypot(dx, dy) || 1;
  return [-dy / l, dx / l];
}

/** Regular / star polygon. */
function star(cx: number, cy: number, points: number, outer: number, inner: number, rotation = -Math.PI / 2) {
  const pts: [number, number][] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = rotation + (i * Math.PI) / points;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return poly(pts);
}

function regular(cx: number, cy: number, sides: number, r: number, rotation = -Math.PI / 2) {
  const pts: [number, number][] = [];
  for (let i = 0; i < sides; i++) {
    const a = rotation + (i * 2 * Math.PI) / sides;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return poly(pts);
}

/** Leaf: a pointed ellipse along a direction. */
function leaf(cx: number, cy: number, len: number, wid: number, angle: number) {
  const pts: [number, number][] = [];
  const steps = 14;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI;
    pts.push([Math.cos(t) * len, Math.sin(t) * wid * Math.sin(t)]);
  }
  for (let i = steps - 1; i > 0; i--) {
    const t = (i / steps) * Math.PI;
    pts.push([Math.cos(t) * len, -Math.sin(t) * wid * Math.sin(t)]);
  }
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return poly(pts.map(([x, y]) => [cx + x * c - y * s, cy + x * s + y * c]));
}

/** One side of a laurel wreath; every leaf is its own path so overlaps never punch holes. */
function laurel(side: 1 | -1): SigilPath[] {
  const parts: SigilPath[] = [];
  const cx = 50;
  const cy = 54;
  const R = 36;
  const stem: [number, number][] = [];
  for (let i = 0; i <= 12; i++) {
    const a = Math.PI / 2 + side * (0.2 + i * 0.165);
    stem.push([cx + Math.cos(a) * (R - 2.5), cy + Math.sin(a) * (R - 2.5)]);
  }
  parts.push({ d: stroke(stem, 2.2), tone: "gold", raise: 0.8 });
  for (let i = 0; i < 7; i++) {
    const a = Math.PI / 2 + side * (0.35 + i * 0.3); // from the bottom, sweeping up each side
    const x = cx + Math.cos(a) * R;
    const y = cy + Math.sin(a) * R;
    const tangent = a + (side * Math.PI) / 2;
    parts.push({ d: leaf(x, y, 7.5 - i * 0.35, 3.2, tangent - side * 0.55), tone: "gold" });
  }
  return parts;
}

// ─── The sigils ───────────────────────────────────────────────────────────────

const bracket = (x: number, y: number, sx: number, sy: number) =>
  poly([
    [x, y],
    [x + 16 * sx, y],
    [x + 16 * sx, y + 4 * sy],
    [x + 4 * sx, y + 4 * sy],
    [x + 4 * sx, y + 16 * sy],
    [x, y + 16 * sy],
  ]);

export const SIGILS: Record<string, Sigil> = {
  // AURA — a watching eye inside a tracking box (computer vision, behaviour states).
  aura: {
    w: 100,
    h: 100,
    paths: [
      { d: "M8,50 Q50,10 92,50 Q50,90 8,50 Z M19,50 Q50,22 81,50 Q50,78 19,50 Z", tone: "gold" },
      { d: ring(50, 50, 15, 4.5), tone: "gold" },
      { d: circle(50, 50, 6.5), tone: "accent" },
      { d: [bracket(2, 2, 1, 1), bracket(98, 2, -1, 1), bracket(2, 98, 1, -1), bracket(98, 98, -1, -1)].join(" "), tone: "gold" },
    ],
  },

  // ETTH — encrypted flows passing a sealed core inside a network node.
  etth: {
    w: 100,
    h: 100,
    paths: [
      { d: `${regular(50, 50, 6, 47, -Math.PI / 2)} ${regular(50, 50, 6, 40, -Math.PI / 2)}`, tone: "gold" },
      { d: "M44.58,48.8 A8,8 0 1 1 55.42,48.8 L58,66 L42,66 Z", tone: "accent" },
      { d: poly([[14, 47.5], [33, 47.5], [33, 43], [39, 50], [33, 57], [33, 52.5], [14, 52.5]]), tone: "gold" },
      { d: poly([[61, 47.5], [80, 47.5], [80, 43], [86, 50], [80, 57], [80, 52.5], [61, 52.5]]), tone: "gold" },
    ],
  },

  // ShadowGuard — a shield half in light, half in shadow.
  shadowguard: {
    w: 100,
    h: 100,
    paths: [
      { d: `M47.5,7 L47.5,94 C29,86 12,72 12,48 L12,18 Z ${circle(30, 40, 5)}`, tone: "gold" },
      { d: "M52.5,7 L88,18 L88,48 C88,72 71,86 52.5,94 Z M58,15 L82,22.5 L82,48 C82,67 70,79 58,85.5 Z", tone: "gold" },
      { d: circle(30, 40, 5), tone: "dark" },
    ],
  },

  // Sugar AI — a sugar crystal between two voice waveforms (offline voice assistant).
  sugarai: {
    w: 100,
    h: 100,
    paths: [
      { d: poly([[50, 30], [67, 40], [50, 50], [33, 40]]), tone: "accent" },
      { d: poly([[32, 43], [48.5, 52.5], [48.5, 71], [32, 61.5]]), tone: "gold" },
      { d: poly([[68, 43], [51.5, 52.5], [51.5, 71], [68, 61.5]]), tone: "gold" },
      ...[
        [8, 14],
        [16, 26],
        [24, 18],
      ].map(([x, h]) => ({ d: poly([[x, 50 - h / 2], [x + 4, 50 - h / 2], [x + 4, 50 + h / 2], [x, 50 + h / 2]]), tone: "gold" as const })),
      ...[
        [88, 14],
        [80, 26],
        [72, 18],
      ].map(([x, h]) => ({ d: poly([[x, 50 - h / 2], [x + 4, 50 - h / 2], [x + 4, 50 + h / 2], [x, 50 + h / 2]]), tone: "gold" as const })),
    ],
  },

  // Q-SHIELD — a Q drawn around a lattice (lattice-based post-quantum crypto).
  qshield: {
    w: 100,
    h: 100,
    paths: [
      { d: ring(48, 47, 38, 7.5), tone: "gold" },
      { d: stroke([[63, 64], [80, 82]], 9), tone: "gold" },
      {
        d: [0, 1, 2]
          .flatMap((r) => [0, 1, 2].map((c) => regular(36 + c * 11.5, 35 + r * 11.5, 4, 3.6, 0)))
          .join(" "),
        tone: "accent",
      },
    ],
  },

  // JIVA — a care cross with a live pulse running through it.
  jiva: {
    w: 100,
    h: 100,
    paths: [
      {
        d: "M35,5 H65 V35 H95 V65 H65 V95 H35 V65 H5 V35 H35 Z M41,11 V41 H11 V59 H41 V89 H59 V59 H89 V41 H59 V11 Z",
        tone: "gold",
      },
      {
        d: stroke(
          [
            [3, 50],
            [30, 50],
            [37, 38],
            [45, 66],
            [54, 28],
            [62, 58],
            [68, 50],
            [97, 50],
          ],
          4.5
        ),
        tone: "accent",
      },
    ],
  },

  // STREET HIERARCHY — a ladder of power with the crown on top.
  "street-hierarchy": {
    w: 100,
    h: 100,
    paths: [
      { d: poly([[12, 92], [12, 68], [30, 68], [30, 92]]), tone: "gold" },
      { d: poly([[39, 92], [39, 50], [57, 50], [57, 92]]), tone: "gold" },
      { d: poly([[66, 92], [66, 32], [84, 32], [84, 92]]), tone: "accent" },
      { d: poly([[62, 26], [62, 9], [68.5, 16], [75, 4], [81.5, 16], [88, 9], [88, 26]]), tone: "gold" },
    ],
  },

  // T R Constructions — the company's own mark: a beam on a column, a braced R, a channel section.
  trc: {
    w: 98,
    h: 40,
    paths: [
      { d: "M0 0L30 0L30 8L0 8Z", tone: "accent" },
      { d: "M10 8L20 8L20 40L10 40Z", tone: "gold" },
      { d: "M34 0L62 0L62 24L58 24L66 40L56 40L48 24L44 24L44 40L34 40ZM44 8L52 8L52 16L44 16Z", tone: "gold" },
      { d: "M70 0L98 0L98 12L92 12L92 8L80 8L80 32L92 32L92 28L98 28L98 40L70 40Z", tone: "gold" },
    ],
  },

  // Achievements — a star crowned by a laurel.
  achievements: {
    w: 100,
    h: 100,
    paths: [
      { d: star(50, 48, 5, 22, 9.5), tone: "accent" },
      ...laurel(1),
      ...laurel(-1),
    ],
  },

  // Leadership — a compass rose: direction.
  leadership: {
    w: 100,
    h: 100,
    paths: [
      { d: ring(50, 50, 44, 4), tone: "gold" },
      { d: star(50, 50, 4, 38, 8), tone: "gold" },
      { d: star(50, 50, 4, 22, 6, -Math.PI / 4), tone: "accent" },
      { d: circle(50, 50, 4), tone: "gold", raise: 1.5 },
    ],
  },

  // Experience — an open ledger with a ribbon marker. Text lines are cut through
  // the left page so the dark inlay beneath shows as engraving.
  experience: {
    w: 100,
    h: 100,
    paths: [
      {
        d: `M6,28 C20,20 36,21 47,28 L47,88 C36,81 20,80 6,87 Z ${[0, 1, 2, 3]
          .map((i) => poly([[13, 40 + i * 10], [40, 42 + i * 10], [40, 44.5 + i * 10], [13, 42.5 + i * 10]]))
          .join(" ")}`,
        tone: "gold",
      },
      { d: "M94,28 C80,20 64,21 53,28 L53,88 C64,81 80,80 94,87 Z", tone: "gold" },
      {
        d: [0, 1, 2, 3]
          .map((i) => poly([[13, 40 + i * 10], [40, 42 + i * 10], [40, 44.5 + i * 10], [13, 42.5 + i * 10]]))
          .join(" "),
        tone: "dark",
      },
      { d: poly([[68, 18], [78, 18], [78, 52], [73, 46], [68, 52]]), tone: "accent", raise: 1.35 },
    ],
  },
};

export function getSigil(id: string): Sigil {
  const s = SIGILS[id];
  if (!s) throw new Error(`No sigil for ${id}`);
  return s;
}
