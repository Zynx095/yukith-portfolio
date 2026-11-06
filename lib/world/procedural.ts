import * as THREE from "three";

/**
 * Textures generated on the client: the foliage atlas (drawn once on a 2D
 * canvas) and a soft glow sprite. Nothing here is downloaded.
 */

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

  // 'green' for ordinary trees; 'deep' for the World Tree's denser, darker crown.
  let palette: "green" | "deep" = "green";
  const leaf = (x: number, y: number, len: number, wid: number, rot: number, shade: number, pointy: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    const g = Math.round((palette === "green" ? 150 : 128) + shade * 105);
    const warm = rnd();
    const r = palette === "green" ? Math.round(g * (0.62 + warm * 0.12)) : Math.round(g * (0.5 + warm * warm * 0.32));
    const b = palette === "green" ? Math.round(g * (0.38 + rnd() * 0.1)) : Math.round(g * (0.3 + rnd() * 0.08));
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
  // fringe and no visible twigs. Thousands of these build the crown.
  palette = "deep";
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

/** The foliage atlas: 2 × 2 cells (broadleaf, rounded broadleaf, conifer sprig, World Tree leaf cloud). */
export function createLeafAtlas(gl: THREE.WebGLRenderer) {
  const big = gl.capabilities.maxTextureSize >= 4096 && !/Mobi|Android/i.test(navigator.userAgent);
  const tex = new THREE.CanvasTexture(drawLeafAtlas(big ? 2048 : 1024));
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  return tex;
}

/** A soft radial glow (white, premultiplied falloff) for additive sprites. */
export function createGlowTexture(size = 128) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.18, "rgba(255,255,255,0.55)");
  g.addColorStop(0.5, "rgba(255,255,255,0.12)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
