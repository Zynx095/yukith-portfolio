import * as THREE from "three";
import { GLSL_HASH, GLSL_PERIODIC } from "./glsl";

/**
 * Procedural texture baking.
 *
 * All natural surface detail (bark, rock, ground, water ripples) is generated
 * once on the GPU into tileable, mip-mapped render targets, so materials get
 * crisp, anisotropically-filtered detail without downloading image assets or
 * paying for per-pixel noise every frame. Foliage cards are drawn once on a
 * 2D canvas.
 */

const BAKE_VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

interface BakeOptions {
  size: number;
  /** GLSL that defines `vec4 bake(vec2 uv)`; may call `heightAt(uv)` helpers it defines. */
  source: string;
  uniforms?: Record<string, THREE.IUniform>;
  anisotropy: number;
}

class Baker {
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private quad: THREE.Mesh;
  private gl: THREE.WebGLRenderer;
  readonly targets: THREE.WebGLRenderTarget[] = [];

  constructor(gl: THREE.WebGLRenderer) {
    this.gl = gl;
    // A single oversized triangle covers the viewport without a diagonal seam.
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
    this.quad = new THREE.Mesh(geo);
    this.quad.frustumCulled = false;
    this.scene.add(this.quad);
  }

  bake({ size, source, uniforms = {}, anisotropy }: BakeOptions): THREE.Texture {
    const target = new THREE.WebGLRenderTarget(size, size, {
      depthBuffer: false,
      generateMipmaps: true,
      minFilter: THREE.LinearMipmapLinearFilter,
      magFilter: THREE.LinearFilter,
      wrapS: THREE.RepeatWrapping,
      wrapT: THREE.RepeatWrapping,
      type: THREE.UnsignedByteType,
    });
    const material = new THREE.ShaderMaterial({
      vertexShader: BAKE_VERTEX,
      fragmentShader: `precision highp float;\nvarying vec2 vUv;\nuniform vec2 uTexel;\n${GLSL_HASH}\n${GLSL_PERIODIC}\n${source}\nvoid main() { gl_FragColor = bake(vUv); }`,
      uniforms: { uTexel: { value: new THREE.Vector2(1 / size, 1 / size) }, ...uniforms },
      depthTest: false,
      depthWrite: false,
    });
    this.quad.material = material;

    const prevTarget = this.gl.getRenderTarget();
    const prevAutoClear = this.gl.autoClear;
    this.gl.autoClear = true;
    this.gl.setRenderTarget(target);
    this.gl.render(this.scene, this.camera);
    this.gl.setRenderTarget(prevTarget);
    this.gl.autoClear = prevAutoClear;
    material.dispose();

    target.texture.anisotropy = anisotropy;
    target.texture.needsUpdate = false;
    this.targets.push(target);
    return target.texture;
  }

  dispose() {
    this.quad.geometry.dispose();
    for (const t of this.targets) t.dispose();
    this.targets.length = 0;
  }
}

// ─── Bark ─────────────────────────────────────────────────────────────────────
// Deep vertical furrows separating irregular plates, with fibrous ridges.
// R: height  G: cavity (1 = deep crevice)  B: colour variation  A: lichen/moss affinity
const BARK_SOURCE = /* glsl */ `
float barkHeight(vec2 uv, out float crack, out float plateId) {
  // Furrows wander sideways as they climb.
  vec2 warp = vec2(pfbm(uv * vec2(4.0, 1.0) + 3.1, vec2(4.0, 1.0), 3), pfbm(uv * vec2(4.0, 1.0) + 7.7, vec2(4.0, 1.0), 3));
  // Plates: long, narrow, vertical — the bark of a very old tree.
  vec2 p = uv * vec2(13.0, 2.0) + warp * vec2(1.6, 0.25);
  vec3 v = pvoronoi(p, vec2(13.0, 2.0), 0.95);
  float edge = v.y - v.x;
  float plate = smoothstep(0.02, 0.2, edge);
  crack = 1.0 - plate;
  plateId = v.z;
  // Fibrous ridges running along each plate.
  float fib = pfbm(uv * vec2(60.0, 4.0) + warp * 2.0, vec2(60.0, 4.0), 4) * 0.5 + 0.5;
  // Occasional horizontal checks splitting a plate.
  float checks = smoothstep(0.78, 0.96, pnoise(uv * vec2(13.0, 16.0) + warp, vec2(13.0, 16.0)) * 0.5 + 0.5);
  float h = plate * (0.55 + 0.45 * fib) * (0.8 + 0.2 * plateId);
  h -= checks * 0.25 * plate;
  h += 0.06 * pfbm(uv * vec2(30.0, 10.0), vec2(30.0, 10.0), 3);
  return clamp(h, 0.0, 1.0);
}
uniform float uMode;
vec4 bake(vec2 uv) {
  vec4 result;
  float crack, id;
  float h = barkHeight(uv, crack, id);
  if (uMode > 0.5) {
    float c1, i1;
    float hx = barkHeight(uv + vec2(uTexel.x, 0.0), c1, i1);
    float hy = barkHeight(uv + vec2(0.0, uTexel.y), c1, i1);
    vec3 n = normalize(vec3((h - hx) * 6.0, (h - hy) * 6.0, 1.0));
    result = vec4(n * 0.5 + 0.5, 1.0);
  } else {
    float variation = 0.5 + 0.5 * pfbm(uv * vec2(4.0, 2.0) + 11.0, vec2(4.0, 2.0), 3);
    variation = mix(variation, id, 0.35);
    float lichen = smoothstep(0.1, 0.6, pfbm(uv * vec2(5.0, 3.0) + 21.0, vec2(5.0, 3.0), 4) * 0.5 + 0.5);
    result = vec4(h, crack, variation, lichen);
  }
  return result;
}
`;

// ─── Heartwood ─────────────────────────────────────────────────────────────────
// The inside of the hollow: long wavering fibres, a few great fissures split
// along the grain (where the sap light shows), slow tonal streaks.
// R: height  G: fissure (1 = open crack)  B: tone variation  A: (little) moss affinity
const WOOD_SOURCE = /* glsl */ `
// Long fissures split along the grain: a few lanes per tile, each line
// meandering gently, varying in width and broken into lengths.
float fissures(vec2 uv) {
  const float LANES = 5.0;
  float x = uv.x * LANES;
  float lane = floor(x);
  float best = 0.0;
  for (int k = -1; k <= 1; k++) {
    float L = lane + float(k);
    float id = hash12(vec2(mod(L, LANES), 3.7));
    float centre = L + 0.5 + (id - 0.5) * 0.5 + pnoise(vec2(uv.y * 3.0, id * 17.0), vec2(3.0, 1000.0)) * 0.18;
    float d = abs(x - centre);
    float width = 0.016 + 0.03 * (pnoise(vec2(uv.y * 7.0, id * 5.0 + 1.0), vec2(7.0, 1000.0)) * 0.5 + 0.5);
    float on = smoothstep(0.45, 0.62, pnoise(vec2(uv.y * 2.0, id * 9.0 + 2.0), vec2(2.0, 1000.0)) * 0.5 + 0.5 + id * 0.12);
    best = max(best, (1.0 - smoothstep(width * 0.35, width, d)) * on);
  }
  return best;
}
float woodHeight(vec2 uv, out float crack, out float tone) {
  float wave = pfbm(uv * vec2(3.0, 1.0) + 2.3, vec2(3.0, 1.0), 3);
  vec2 p = uv + vec2(wave * 0.05, 0.0);
  float fibres = pfbm(p * vec2(56.0, 3.0), vec2(56.0, 3.0), 4) * 0.5 + 0.5;
  float fine = pnoise(p * vec2(150.0, 6.0), vec2(150.0, 6.0)) * 0.5 + 0.5;
  // Great fissures (where the sap shows) and fine checks between the fibres.
  float checks = 1.0 - smoothstep(0.0, 0.03, abs(pnoise(p * vec2(13.0, 1.5) + 5.1, vec2(13.0, 1.5))));
  crack = max(fissures(p), checks * 0.45);
  tone = pfbm(uv * vec2(6.0, 1.0) + 9.0, vec2(6.0, 1.0), 3) * 0.5 + 0.5;
  float h = 0.52 + 0.26 * fibres + 0.1 * fine + 0.1 * tone - crack * 0.42;
  return clamp(h, 0.0, 1.0);
}
uniform float uMode;
vec4 bake(vec2 uv) {
  vec4 result;
  float crack, tone;
  float h = woodHeight(uv, crack, tone);
  if (uMode > 0.5) {
    float c1, t1;
    float hx = woodHeight(uv + vec2(uTexel.x, 0.0), c1, t1);
    float hy = woodHeight(uv + vec2(0.0, uTexel.y), c1, t1);
    vec3 n = normalize(vec3((h - hx) * 5.0, (h - hy) * 5.0, 1.0));
    result = vec4(n * 0.5 + 0.5, 1.0);
  } else {
    float moss = smoothstep(0.6, 0.9, pfbm(uv * vec2(4.0, 2.0) + 21.0, vec2(4.0, 2.0), 3) * 0.5 + 0.5) * 0.4;
    result = vec4(h, crack, tone, moss);
  }
  return result;
}
`;

// ─── Rock ─────────────────────────────────────────────────────────────────────
// Weathered stone with fractures and faint strata. Sampled tri-planar.
const ROCK_SOURCE = /* glsl */ `
float rockHeight(vec2 uv, out float crackOut) {
  vec2 warp = vec2(pfbm(uv * 3.0 + 1.3, vec2(3.0), 4), pfbm(uv * 3.0 + 5.9, vec2(3.0), 4));
  float base = pfbm(uv * 4.0 + warp * 0.8, vec2(4.0), 6) * 0.5 + 0.5;
  // Fractures follow the zero-crossings of warped noise: irregular, branching lines.
  float c1 = abs(pnoise(uv * 5.0 + warp * 1.3, vec2(5.0)));
  float c2 = abs(pnoise(uv * 11.0 + warp * 2.1 + 3.7, vec2(11.0)));
  // Sparse fractures: only where the coarse field is also low do the fine ones show.
  float crack = (1.0 - smoothstep(0.0, 0.035, c1)) * 0.75 + (1.0 - smoothstep(0.0, 0.025, c2)) * 0.3 * smoothstep(0.25, 0.05, c1);
  // Faint sedimentary banding.
  float strata = smoothstep(0.3, 0.7, sin((uv.y * 7.0 + warp.x * 0.7) * 6.2831853) * 0.5 + 0.5) * 0.1;
  float grit = pfbm(uv * 24.0, vec2(24.0), 3) * 0.06;
  float h = base * 0.8 + strata + grit - crack * 0.2;
  crackOut = clamp(crack, 0.0, 1.0);
  return clamp(h, 0.0, 1.0);
}
uniform float uMode;
vec4 bake(vec2 uv) {
  vec4 result;
  float crack;
  float h = rockHeight(uv, crack);
  if (uMode > 0.5) {
    float c;
    float hx = rockHeight(uv + vec2(uTexel.x, 0.0), c);
    float hy = rockHeight(uv + vec2(0.0, uTexel.y), c);
    vec3 n = normalize(vec3((h - hx) * 4.0, (h - hy) * 4.0, 1.0));
    result = vec4(n * 0.5 + 0.5, 1.0);
  } else {
    float variation = 0.5 + 0.5 * pfbm(uv * 2.0 + 9.0, vec2(2.0), 4);
    float lichen = smoothstep(0.55, 0.8, pfbm(uv * 6.0 + 4.0, vec2(6.0), 5) * 0.5 + 0.5);
    result = vec4(h, crack, variation, lichen);
  }
  return result;
}
`;

// ─── Ground ───────────────────────────────────────────────────────────────────
// R: grass clump detail  G: pebbles / soil grain  B: dry patches  A: macro variation
const GROUND_SOURCE = /* glsl */ `
// Pebbles: sparse, irregular, varied in size — thresholded noise rather than a regular cell grid.
float pebbleField(vec2 uv) {
  vec3 v = pvoronoi(uv * 26.0 + vec2(pfbm(uv * 5.0, vec2(5.0), 3)) * 1.5, vec2(26.0), 1.0);
  float keep = step(0.8, v.z);
  float size = 0.14 + 0.2 * fract(v.z * 7.13);
  return smoothstep(size, size * 0.4, v.x) * keep;
}
float groundHeight(vec2 uv) {
  float pebbles = pebbleField(uv);
  float grain = pfbm(uv * 32.0, vec2(32.0), 3) * 0.5 + 0.5;
  float clumps = pfbm(uv * 12.0 + 3.0, vec2(12.0), 4) * 0.5 + 0.5;
  return clamp(pebbles * 0.2 + grain * 0.36 + clumps * 0.44, 0.0, 1.0);
}
uniform float uMode;
vec4 bake(vec2 uv) {
  vec4 result;
  float h = groundHeight(uv);
  if (uMode > 0.5) {
    float hx = groundHeight(uv + vec2(uTexel.x, 0.0));
    float hy = groundHeight(uv + vec2(0.0, uTexel.y));
    vec3 n = normalize(vec3((h - hx) * 3.5, (h - hy) * 3.5, 1.0));
    result = vec4(n * 0.5 + 0.5, 1.0);
  } else {
    float grass = pfbm(uv * 18.0 + 5.0, vec2(18.0), 5) * 0.5 + 0.5;
    float pebbles = pebbleField(uv) * 0.7 + (pfbm(uv * 40.0 + 2.0, vec2(40.0), 2) * 0.5 + 0.5) * 0.3;
    float dry = smoothstep(0.45, 0.75, pfbm(uv * 3.0 + 13.0, vec2(3.0), 4) * 0.5 + 0.5);
    float macro = pfbm(uv * 2.0 + 31.0, vec2(2.0), 4) * 0.5 + 0.5;
    result = vec4(grass, pebbles, dry, macro);
  }
  return result;
}
`;

// ─── Water ripples ────────────────────────────────────────────────────────────
const WATER_SOURCE = /* glsl */ `
float waterHeight(vec2 uv) {
  float h = 0.0;
  h += pnoise(uv * vec2(6.0, 6.0), vec2(6.0)) * 0.5;
  h += pnoise(uv * vec2(13.0, 11.0) + 3.0, vec2(13.0, 11.0)) * 0.3;
  h += pnoise(uv * vec2(27.0, 29.0) + 7.0, vec2(27.0, 29.0)) * 0.15;
  h += pnoise(uv * vec2(53.0, 47.0) + 1.0, vec2(53.0, 47.0)) * 0.07;
  return h;
}
vec4 bake(vec2 uv) {
  float h = waterHeight(uv);
  float hx = waterHeight(uv + vec2(uTexel.x, 0.0));
  float hy = waterHeight(uv + vec2(0.0, uTexel.y));
  vec3 n = normalize(vec3((h - hx) * 3.0, (h - hy) * 3.0, 1.0));
  return vec4(n * 0.5 + 0.5, 1.0);
}
`;

// ─── Foliage atlas (2 × 2 cells) ─────────────────────────────────────────────
// 0: broadleaf cluster  1: rounded broadleaf  2: conifer sprig  3: World Tree leaf cloud
function drawLeafAtlas(size: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, size, size);
  // Drawn in a fixed 1024-unit space, scaled to the requested resolution.
  ctx.scale(size / 1024, size / 1024);
  const cell = 512;
  let seed = 1337;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  // 'green' for ordinary trees; 'neutral' (warm near-white) for the World Tree,
  // which is tinted gold per clump instance.
  let palette: "green" | "neutral" = "green";
  const leaf = (x: number, y: number, len: number, wid: number, rot: number, shade: number, pointy: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    const g = Math.round(150 + shade * 95);
    const r = palette === "green" ? Math.round(g * (0.62 + rnd() * 0.12)) : Math.round(g * (0.98 + rnd() * 0.02));
    const b = palette === "green" ? Math.round(g * (0.38 + rnd() * 0.1)) : Math.round(g * (0.62 + rnd() * 0.1));
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(wid * 0.9, len * 0.18, wid * (1 - pointy * 0.4), len * 0.72, 0, len);
    ctx.bezierCurveTo(-wid * (1 - pointy * 0.4), len * 0.72, -wid * 0.9, len * 0.18, 0, 0);
    ctx.fill();
    // midrib
    ctx.strokeStyle = `rgba(${Math.round(r * 0.75)},${Math.round(g * 0.78)},${Math.round(b * 0.7)},0.55)`;
    ctx.lineWidth = Math.max(1, wid * 0.08);
    ctx.beginPath();
    ctx.moveTo(0, len * 0.05);
    ctx.lineTo(0, len * 0.9);
    ctx.stroke();
    ctx.restore();
  };

  const twig = (x0: number, y0: number, x1: number, y1: number, w: number) => {
    ctx.strokeStyle = "rgb(92,70,48)";
    ctx.lineWidth = w;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo((x0 + x1) / 2 + (rnd() - 0.5) * w * 6, (y0 + y1) / 2, x1, y1);
    ctx.stroke();
  };

  // Broadleaf clusters: twigs radiating from the bottom centre, leaves along them.
  const broadleaf = (ox: number, oy: number, leafLen: number, leafWid: number, count: number, pointy: number) => {
    const cx = ox + cell / 2;
    const base = oy + cell * 0.96;
    const twigs = 7;
    for (let t = 0; t < twigs; t++) {
      const a = -Math.PI / 2 + (t / (twigs - 1) - 0.5) * 2.3 + (rnd() - 0.5) * 0.2;
      const L = cell * (0.32 + rnd() * 0.12);
      const ex = cx + Math.cos(a) * L;
      const ey = base + Math.sin(a) * L - cell * 0.12;
      twig(cx, base, ex, ey, 3);
    }
    for (let i = 0; i < count; i++) {
      const a = -Math.PI / 2 + (rnd() - 0.5) * 2.6;
      const d = cell * (0.12 + Math.pow(rnd(), 0.7) * 0.36);
      const x = cx + Math.cos(a) * d;
      const y = base - cell * 0.1 + Math.sin(a) * d;
      const along = a + (rnd() - 0.5) * 1.4 - Math.PI / 2;
      const s = 0.75 + rnd() * 0.5;
      // Leaves deeper in the cluster are darker (self-shadowing baked into albedo).
      const depth = 1 - Math.min(1, d / (cell * 0.48));
      leaf(x, y, leafLen * s, leafWid * s, along, Math.min(1, rnd() * 0.6 + (1 - depth) * 0.5), pointy);
    }
  };
  broadleaf(0, 0, cell * 0.16, cell * 0.062, 150, 0.5);
  broadleaf(cell, 0, cell * 0.12, cell * 0.07, 170, 0.05);

  // Conifer sprig: central stem with dense needles angled forward.
  {
    const ox = 0;
    const oy = cell;
    const cx = ox + cell / 2;
    for (let s = 0; s < 3; s++) {
      const sx = cx + (s - 1) * cell * 0.22;
      const top = oy + cell * (0.08 + rnd() * 0.06);
      const bottom = oy + cell * 0.95;
      twig(cx, bottom, sx, top, 3);
      for (let y = top; y < bottom - cell * 0.04; y += 3.2) {
        const t = (y - top) / (bottom - top);
        const x = sx + (cx - sx) * t;
        const spread = cell * (0.06 + 0.1 * Math.sin(t * Math.PI));
        for (const side of [-1, 1]) {
          const len = spread * (0.7 + rnd() * 0.5);
          const ang = side * (0.95 + rnd() * 0.35);
          const g = Math.round(120 + rnd() * 90);
          ctx.strokeStyle = `rgb(${Math.round(g * 0.55)},${g},${Math.round(g * 0.5)})`;
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + Math.sin(ang) * len, y - Math.cos(ang) * len * 0.55);
          ctx.stroke();
        }
      }
    }
  }

  // World Tree: a dense, rounded cloud of small leaves with an airy, ragged
  // fringe and no visible twigs. Hundreds of these, tinted gold per instance,
  // build the crown as one luminous mass.
  palette = "neutral";
  {
    const cx = cell + cell / 2;
    const cy = cell + cell / 2;
    // A few overlapping sub-clusters give a lumpy, irregular outline with gaps.
    const blobs = [
      { x: 0, y: 0, r: cell * 0.34 },
      ...Array.from({ length: 6 }, (_, k) => {
        const a = (k / 6) * Math.PI * 2 + rnd() * 0.7;
        const d = cell * (0.16 + rnd() * 0.06);
        return { x: Math.cos(a) * d, y: Math.sin(a) * d, r: cell * (0.16 + rnd() * 0.08) };
      }),
    ];
    const leaves: [number, number, number, number, number][] = [];
    for (let i = 0; i < 7000 && leaves.length < 2600; i++) {
      const px = (rnd() * 2 - 1) * cell * 0.47;
      const py = (rnd() * 2 - 1) * cell * 0.47;
      // 0 at a blob centre, 1 at its edge; the nearest blob wins.
      let rim = Infinity;
      for (const b of blobs) rim = Math.min(rim, Math.hypot(px - b.x, py - b.y) / b.r);
      if (rim > 1) continue;
      // The fringe thins out so the silhouette dissolves leaf by leaf.
      if (rim > 0.8 && rnd() > (1 - rim) * 4.5) continue;
      const len = cell * (0.03 + rnd() * 0.024);
      const rot = Math.atan2(py, px) - Math.PI / 2 + (rnd() - 0.5) * 2.6;
      // Leaves deeper in the cloud are darker: self-shadowing baked into albedo.
      const shade = Math.min(1, 0.22 + rim * 0.5 + rnd() * 0.38);
      leaves.push([cx + px, cy + py, len, rot, shade]);
    }
    leaves.sort((p, q) => p[4] - q[4]);
    for (const [x, y, len, rot, shade] of leaves) leaf(x, y, len, len * 0.44, rot, shade, 0.7);
  }

  return canvas;
}

export interface WorldTextures {
  barkData: THREE.Texture;
  barkNormal: THREE.Texture;
  woodData: THREE.Texture;
  woodNormal: THREE.Texture;
  rockData: THREE.Texture;
  rockNormal: THREE.Texture;
  groundData: THREE.Texture;
  groundNormal: THREE.Texture;
  waterNormal: THREE.Texture;
  leaves: THREE.Texture;
  dispose: () => void;
}

const cache = new WeakMap<THREE.WebGLRenderer, WorldTextures>();

/** Bakes (once per renderer) every procedural texture the world uses. */
export function getWorldTextures(gl: THREE.WebGLRenderer): WorldTextures {
  const existing = cache.get(gl);
  if (existing) return existing;

  const baker = new Baker(gl);
  const aniso = Math.min(8, gl.capabilities.getMaxAnisotropy());
  const mode = (m: number) => ({ uMode: { value: m } });

  const barkData = baker.bake({ size: 1024, source: BARK_SOURCE, uniforms: mode(0), anisotropy: aniso });
  const barkNormal = baker.bake({ size: 1024, source: BARK_SOURCE, uniforms: mode(1), anisotropy: aniso });
  const woodData = baker.bake({ size: 1024, source: WOOD_SOURCE, uniforms: mode(0), anisotropy: aniso });
  const woodNormal = baker.bake({ size: 1024, source: WOOD_SOURCE, uniforms: mode(1), anisotropy: aniso });
  const rockData = baker.bake({ size: 1024, source: ROCK_SOURCE, uniforms: mode(0), anisotropy: aniso });
  const rockNormal = baker.bake({ size: 1024, source: ROCK_SOURCE, uniforms: mode(1), anisotropy: aniso });
  const groundData = baker.bake({ size: 1024, source: GROUND_SOURCE, uniforms: mode(0), anisotropy: aniso });
  const groundNormal = baker.bake({ size: 1024, source: GROUND_SOURCE, uniforms: mode(1), anisotropy: aniso });
  const waterNormal = baker.bake({ size: 512, source: WATER_SOURCE, anisotropy: aniso });

  // Larger atlas where memory allows, so close foliage stays crisp.
  const atlasSize = gl.capabilities.maxTextureSize >= 4096 && !/Mobi|Android/i.test(navigator.userAgent) ? 2048 : 1024;
  const leaves = new THREE.CanvasTexture(drawLeafAtlas(atlasSize));
  leaves.colorSpace = THREE.SRGBColorSpace;
  leaves.anisotropy = aniso;
  leaves.generateMipmaps = true;
  leaves.minFilter = THREE.LinearMipmapLinearFilter;

  const textures: WorldTextures = {
    barkData,
    barkNormal,
    woodData,
    woodNormal,
    rockData,
    rockNormal,
    groundData,
    groundNormal,
    waterNormal,
    leaves,
    dispose: () => {
      baker.dispose();
      leaves.dispose();
      cache.delete(gl);
    },
  };
  cache.set(gl, textures);
  return textures;
}
