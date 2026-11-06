// Lists the heaviest meshes in the running world (triangles × instances, shadow casting).
// Usage: node scripts/scene-stats.mjs [--url http://localhost:3000] [--progress 0.1]
import { createRequire } from "module";
const require = createRequire(new URL("../package.json", import.meta.url));
const puppeteer = require("puppeteer");

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith("--")) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith("--") ? arr[i + 1] : "true"]);
    return acc;
  }, [])
);
const url = (args.url || "http://localhost:3000") + "/?perf";
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  headless: true,
  args: ["--ignore-gpu-blocklist", "--use-angle=d3d11", "--window-size=1280,720"],
  defaultViewport: { width: 1280, height: 720 },
  protocolTimeout: 240000,
});
const page = await browser.newPage();
await page.goto(url, { waitUntil: "load", timeout: 120000 });
await page.waitForFunction(() => window.__world?.ready, { timeout: 120000 });
const stats = await page.evaluate((p) => {
  window.__world.setProgress(p);
  const rows = [];
  window.__world.scene.traverse((o) => {
    if (!o.isMesh) return;
    const g = o.geometry;
    const idx = g.index ? g.index.count : g.attributes.position.count;
    const inst = o.isInstancedMesh ? o.count : g.isInstancedBufferGeometry ? g.instanceCount : 1;
    rows.push({ name: o.name || o.material?.type || "mesh", mat: o.material?.customProgramCacheKey?.() || o.material?.type, tris: Math.round(idx / 3), inst, total: Math.round((idx / 3) * inst), shadow: o.castShadow });
  });
  rows.sort((a, b) => b.total - a.total);
  const sum = rows.reduce((s, r) => s + r.total, 0);
  const shadowSum = rows.filter((r) => r.shadow).reduce((s, r) => s + r.total, 0);
  return { meshes: rows.length, sum, shadowSum, top: rows.slice(0, 25) };
}, Number(args.progress || 0.1));
console.log(`meshes ${stats.meshes}, scene triangles ${stats.sum.toLocaleString()}, shadow-casting ${stats.shadowSum.toLocaleString()}`);
for (const r of stats.top) console.log(`${String(r.total.toLocaleString()).padStart(11)}  ${String(r.tris).padStart(7)} × ${String(r.inst).padEnd(7)} ${r.shadow ? "S" : " "} ${r.mat}`);
await browser.close();
