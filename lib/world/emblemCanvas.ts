import * as THREE from "three";

/**
 * Display panels for the arena: the original emblems (the same shapes as
 * components/shared/Emblems.tsx) drawn with Path2D onto a canvas, with the
 * game and rank set in the site's type. No publisher artwork is used.
 */

type EmblemKind = "immortal" | "eagle" | "grandmaster";

const PATHS: Record<EmblemKind, { fill: [string, string, string]; d: string[]; line?: string; accents?: string[] }> = {
  immortal: {
    fill: ["#ff8a96", "#d2324a", "#5c1020"],
    d: ["M32 4 L40 20 L54 14 L48 34 L56 44 L32 60 L8 44 L16 34 L10 14 L24 20 Z"],
    line: "M32 4 L32 60 M24 20 L32 34 L40 20 M16 34 L32 34 L48 34 M8 44 L32 34 L56 44",
  },
  eagle: {
    fill: ["#f6e3a8", "#c9a85a", "#8a6a26"],
    d: ["M32 26 C24 18 14 16 4 18 C12 22 14 26 16 30 C10 30 6 32 4 34 C12 36 18 36 24 38 Z", "M32 26 C40 18 50 16 60 18 C52 22 50 26 48 30 C54 30 58 32 60 34 C52 36 46 36 40 38 Z"],
    accents: ["M32 22 L35 31 L44 31 L37 37 L40 46 L32 40 L24 46 L27 37 L20 31 L29 31 Z"],
  },
  grandmaster: {
    fill: ["#9fb6ff", "#4a62c8", "#2a3c86"],
    d: ["M32 8 L50 14 L48 36 C46 46 40 52 32 58 C24 52 18 46 16 36 L14 14 Z"],
    accents: ["M32 18 L36 28 L46 28 L38 34 L41 44 L32 38 L23 44 L26 34 L18 28 L28 28 Z"],
  },
};

function family(variable: string, fallback: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return v ? `${v}, ${fallback}` : fallback;
}

export function makeRankPanel(kind: EmblemKind, game: string, rank: string, note: string, accent: string) {
  const W = 1024;
  const H = 1280;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  // Panel: deep gradient with a faint scan texture.
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#0d0f14");
  bg.addColorStop(1, "#05060a");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = "#ffffff";
  for (let y = 0; y < H; y += 6) ctx.fillRect(0, y, W, 1);
  ctx.globalAlpha = 1;
  // Halo behind the emblem.
  const halo = ctx.createRadialGradient(W / 2, 480, 40, W / 2, 480, 420);
  halo.addColorStop(0, accent + "66");
  halo.addColorStop(1, "#00000000");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, W, H);
  // Emblem.
  const spec = PATHS[kind];
  ctx.save();
  ctx.translate(W / 2 - 64 * 5.2, 480 - 32 * 10.4);
  ctx.scale(10.4, 10.4);
  const g = ctx.createLinearGradient(0, 0, 0, 64);
  g.addColorStop(0, spec.fill[0]);
  g.addColorStop(0.55, spec.fill[1]);
  g.addColorStop(1, spec.fill[2]);
  ctx.fillStyle = g;
  for (const d of spec.d) ctx.fill(new Path2D(d));
  if (spec.line) {
    ctx.strokeStyle = "rgba(255,214,219,0.5)";
    ctx.lineWidth = 0.6;
    ctx.stroke(new Path2D(spec.line));
  }
  ctx.fillStyle = "rgba(255,246,220,0.95)";
  for (const d of spec.accents ?? []) ctx.fill(new Path2D(d));
  ctx.restore();
  // Type.
  const display = family("--font-fraunces", "Georgia, serif");
  const mono = family("--font-jetbrains", "ui-monospace, monospace");
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(239,231,218,0.6)";
  ctx.font = `500 34px ${mono}`;
  ctx.fillText(game.toUpperCase(), W / 2, 900);
  ctx.fillStyle = "#f4efe6";
  let size = 120;
  ctx.font = `500 ${size}px ${display}`;
  while (ctx.measureText(rank).width > W - 120 && size > 50) {
    size -= 6;
    ctx.font = `500 ${size}px ${display}`;
  }
  ctx.fillText(rank, W / 2, 1040);
  ctx.fillStyle = accent;
  ctx.font = `500 30px ${mono}`;
  ctx.fillText(note.toUpperCase(), W / 2, 1120);
  // Frame lines.
  ctx.strokeStyle = accent;
  ctx.globalAlpha = 0.7;
  ctx.lineWidth = 4;
  ctx.strokeRect(24, 24, W - 48, H - 48);
  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** A wide LED panel: a heading and a row of stations with a line through them. */
export function makeLevelsPanel(heading: string, items: { title: string; line: string }[], accent = "#e8465a") {
  const W = 2048;
  const H = 768;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#07080b";
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = "#ffffff";
  for (let x = 0; x < W; x += 6) ctx.fillRect(x, 0, 1, H);
  ctx.globalAlpha = 1;
  const display = family("--font-fraunces", "Georgia, serif");
  const mono = family("--font-jetbrains", "ui-monospace, monospace");
  ctx.fillStyle = "rgba(239,231,218,0.55)";
  ctx.font = `500 34px ${mono}`;
  ctx.textAlign = "left";
  ctx.fillText(heading.toUpperCase(), 90, 110);
  const y = 360;
  ctx.strokeStyle = accent;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(140, y);
  ctx.lineTo(W - 140, y);
  ctx.stroke();
  items.forEach((it, i) => {
    const x = 180 + (i * (W - 360)) / Math.max(1, items.length - 1);
    ctx.fillStyle = "#07080b";
    ctx.beginPath();
    ctx.arc(x, y, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(x, y, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.textAlign = "center";
    ctx.fillStyle = "#f4efe6";
    ctx.font = `500 58px ${display}`;
    ctx.fillText(it.title, x, y + 120);
    ctx.fillStyle = "rgba(239,231,218,0.65)";
    ctx.font = `500 28px ${mono}`;
    ctx.fillText(it.line.toUpperCase(), x, y + 178);
  });
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}
