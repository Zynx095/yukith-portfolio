import * as THREE from "three";

/**
 * Signage for exhibits: a canvas texture with a title (display serif) and an
 * optional line of small caps. Decorative — every word is also in the HTML
 * label and record. Uses the page's own web fonts when they have loaded.
 */

function fontFamily(variable: string, fallback: string) {
  if (typeof document === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return v ? `${v}, ${fallback}` : fallback;
}

export function makeSignTexture(
  title: string,
  sub: string,
  { width = 1024, height = 512, ink = "#efe7da", paper = "#1a1612", accent = "#d9a441", align = "center" as CanvasTextAlign } = {}
) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, width, height);
  // A thin border inset.
  ctx.strokeStyle = accent;
  ctx.globalAlpha = 0.6;
  ctx.lineWidth = 4;
  ctx.strokeRect(18, 18, width - 36, height - 36);
  ctx.globalAlpha = 1;
  const display = fontFamily("--font-fraunces", "Georgia, serif");
  const mono = fontFamily("--font-jetbrains", "ui-monospace, monospace");
  const x = align === "center" ? width / 2 : 64;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  // Fit the title on up to two lines.
  let size = Math.round(height * 0.2);
  ctx.font = `500 ${size}px ${display}`;
  const words = title.split(" ");
  let lines = [title];
  if (ctx.measureText(title).width > width - 128) {
    let best = 1;
    let bestW = Infinity;
    for (let i = 1; i < words.length; i++) {
      const a = words.slice(0, i).join(" ");
      const b = words.slice(i).join(" ");
      const w = Math.max(ctx.measureText(a).width, ctx.measureText(b).width);
      if (w < bestW) {
        bestW = w;
        best = i;
      }
    }
    lines = [words.slice(0, best).join(" "), words.slice(best).join(" ")];
    while (Math.max(...lines.map((l) => ctx.measureText(l).width)) > width - 128 && size > 20) {
      size -= 4;
      ctx.font = `500 ${size}px ${display}`;
    }
  }
  ctx.fillStyle = ink;
  const top = height * (sub ? 0.42 : 0.5) - ((lines.length - 1) * size * 1.05) / 2;
  lines.forEach((l, i) => ctx.fillText(l, x, top + i * size * 1.05));
  if (sub) {
    let subSize = Math.round(Math.min(height * 0.065, width * 0.07));
    ctx.font = `500 ${subSize}px ${mono}`;
    while (ctx.measureText(sub.toUpperCase()).width * 1.15 > width - 96 && subSize > 12) {
      subSize -= 2;
      ctx.font = `500 ${subSize}px ${mono}`;
    }
    ctx.fillStyle = accent;
    const subY = top + (lines.length - 1) * size * 1.05 + size * 0.95;
    ctx.fillText(sub.toUpperCase().split("").join(String.fromCharCode(8202)), x, subY);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}
