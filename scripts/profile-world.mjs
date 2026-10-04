// Temporary profiling + visual QA harness for the portfolio world.
// Usage: node profile-world.mjs --out <dir> [--url http://localhost:3000] [--query off=tree]
//        [--checkpoints 0,0.1,...] [--settle 3000] [--sample 2500] [--gpu high|default] [--uncapped]
import { createRequire } from "module";
import fs from "fs";
import path from "path";

const require = createRequire(new URL("../package.json", import.meta.url));
const puppeteer = require("puppeteer");

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith("--")) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith("--") ? arr[i + 1] : "true"]);
    return acc;
  }, [])
);

const url = (args.url || "http://localhost:3000") + (args.query ? `/?${args.query}` : "");
const outDir = args.out || "./profile-out";
const checkpoints = (args.checkpoints || "0,0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,0.98").split(",").map(Number);
const settle = Number(args.settle || 3000);
const sample = Number(args.sample || 2500);
const width = Number(args.width || 1920);
const height = Number(args.height || 1080);
const shots = args.shots !== "false";
fs.mkdirSync(outDir, { recursive: true });

const chromeArgs = [
  "--ignore-gpu-blocklist",
  "--enable-gpu-rasterization",
  "--use-angle=d3d11",
  `--window-size=${width},${height}`,
];
if (args.gpu !== "default") chromeArgs.push("--force_high_performance_gpu");
if (args.uncapped) chromeArgs.push("--disable-gpu-vsync", "--disable-frame-rate-limit");

const browser = await puppeteer.launch({
  executablePath: args.browser === "edge"
    ? "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
    : (process.env.CHROME_PATH || "C:/Users/Yukith M Joseph/.cache/puppeteer/chrome/win64-152.0.7977.54/chrome-win64/chrome.exe"),
  headless: args.headful ? false : true,
  args: chromeArgs,
  defaultViewport: { width, height, deviceScaleFactor: Number(args.dpr || 1) },
  protocolTimeout: 240000,
});

const page = await browser.newPage();
const consoleLog = [];
page.on("console", (m) => consoleLog.push(`[${m.type()}] ${m.text()}`));
page.on("pageerror", (e) => consoleLog.push(`[pageerror] ${e.message}`));
page.on("requestfailed", (r) => consoleLog.push(`[requestfailed] ${r.url()} ${r.failure()?.errorText}`));
page.on("response", (r) => { if (r.status() >= 400) consoleLog.push(`[http ${r.status()}] ${r.url()}`); });

const t0 = Date.now();
await page.goto(url, { waitUntil: args.uncapped ? "load" : "networkidle2", timeout: 120000 });
await page.waitForSelector("canvas", { timeout: 60000 });
const loadMs = Date.now() - t0;

// Wait for the world to report ready (new build) or just give it time (old build)
await page.evaluate(() => new Promise((res) => {
  const start = performance.now();
  const tick = () => {
    if (window.__world?.ready || performance.now() - start > 15000) return res();
    requestAnimationFrame(tick);
  };
  tick();
}));
await new Promise((r) => setTimeout(r, 2500));

const gpuInfo = await page.evaluate(() => {
  const c = document.querySelector("canvas");
  const gl = c.getContext("webgl2") || c.getContext("webgl");
  const dbg = gl && gl.getExtension("WEBGL_debug_renderer_info");
  return {
    renderer: dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : "unknown",
    canvas: `${c.width}x${c.height}`,
    dpr: window.devicePixelRatio,
  };
});

async function setProgress(p) {
  await page.evaluate(async (p) => {
    if (window.__world?.setProgress) { window.__world.setProgress(p); return; }
    // Fallback: largest scrollable element
    let best = document.scrollingElement, bestRange = best.scrollHeight - best.clientHeight;
    for (const el of document.querySelectorAll("div")) {
      const cs = getComputedStyle(el);
      if (!/(auto|scroll)/.test(cs.overflowY)) continue;
      const range = el.scrollHeight - el.clientHeight;
      if (range > bestRange) { best = el; bestRange = range; }
    }
    best.scrollTop = p * bestRange;
  }, p);
}

async function measure(ms) {
  const m0 = await page.metrics();
  const r = await page.evaluate(async (ms) => {
    const gl = window.__world?.gl || window.DEBUG_RENDERER;
    const info = gl?.info;
    if (info) info.autoReset = false;
    if (info) info.reset();
    const raw = gl?.getContext?.();
    const tq = raw && raw.getExtension("EXT_disjoint_timer_query_webgl2");
    const pending = [];
    const gpuByFrame = new Map();
    let frameIdx = 0;
    let disjoint = false;
    const origRender = gl.render;
    if (tq) {
      gl.render = function (...a) {
        const q = raw.createQuery();
        raw.beginQuery(tq.TIME_ELAPSED_EXT, q);
        const r = origRender.apply(this, a);
        raw.endQuery(tq.TIME_ELAPSED_EXT);
        pending.push({ q, frame: frameIdx });
        return r;
      };
    }
    const poll = () => {
      for (let i = pending.length - 1; i >= 0; i--) {
        const { q, frame } = pending[i];
        if (raw.getQueryParameter(q, raw.QUERY_RESULT_AVAILABLE)) {
          if (raw.getParameter(tq.GPU_DISJOINT_EXT)) disjoint = true;
          gpuByFrame.set(frame, (gpuByFrame.get(frame) || 0) + raw.getQueryParameter(q, raw.QUERY_RESULT) / 1e6);
          raw.deleteQuery(q);
          pending.splice(i, 1);
        }
      }
    };
    let mutations = 0;
    const mo = new MutationObserver((list) => { mutations += list.length; });
    mo.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true });
    return await new Promise((resolve) => {
      const frames = [];
      const calls = [];
      const tris = [];
      let last = performance.now();
      const end = last + ms;
      const finish = () => {
          if (tq) gl.render = origRender;
          mo.disconnect();
          if (info) info.autoReset = true;
          const ft = frames.slice(2).sort((a, b) => a - b);
          const avg = ft.reduce((a, b) => a + b, 0) / ft.length;
          const p95 = ft[Math.floor(ft.length * 0.95)];
          const p99 = ft[Math.floor(ft.length * 0.99)];
          const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
          const g = [...gpuByFrame.entries()].filter(([f]) => f > 1 && f < frameIdx).map(([, v]) => v).sort((a, b) => a - b);
          resolve({
            frames: ft.length,
            fps: 1000 / avg,
            frameMs: avg,
            p95Ms: p95,
            p99Ms: p99,
            calls: mean(calls.slice(1)),
            triangles: mean(tris.slice(1)),
            gpuMs: g.length ? mean(g) : null,
            gpuP95Ms: g.length ? g[Math.floor(g.length * 0.95)] : null,
            geometries: info?.memory.geometries,
            textures: info?.memory.textures,
            programs: info?.programs?.length,
            heapMB: performance.memory ? performance.memory.usedJSHeapSize / 1048576 : null,
            domMutationsPerSec: (mutations / ms) * 1000,
            gpuDisjoint: disjoint,
          });
      };
      const loop = (now) => {
        frames.push(now - last);
        last = now;
        frameIdx++;
        if (info) {
          calls.push(info.render.calls);
          tris.push(info.render.triangles);
          info.reset();
        }
        if (tq) poll();
        if (now < end) requestAnimationFrame(loop);
        else {
          // let outstanding GPU queries resolve
          let waited = 0;
          const drain = () => {
            if (tq) poll();
            if ((tq && pending.length && waited++ < 30)) requestAnimationFrame(drain);
            else finish();
          };
          if (tq) gl.render = origRender;
          requestAnimationFrame(drain);
        }
      };
      requestAnimationFrame(loop);
    });
  }, ms);
  const m1 = await page.metrics();
  const secs = ms / 1000;
  r.scriptMsPerSec = ((m1.ScriptDuration - m0.ScriptDuration) * 1000) / secs;
  r.taskMsPerSec = ((m1.TaskDuration - m0.TaskDuration) * 1000) / secs;
  r.layoutMsPerSec = ((m1.LayoutDuration - m0.LayoutDuration) * 1000) / secs;
  r.styleMsPerSec = ((m1.RecalcStyleDuration - m0.RecalcStyleDuration) * 1000) / secs;
  return r;
}

const results = [];
for (const p of checkpoints) {
  await setProgress(p);
  await new Promise((r) => setTimeout(r, settle));
  const m = await measure(sample);
  m.progress = p;
  results.push(m);
  if (shots) {
    await page.screenshot({ path: path.join(outDir, `p${String(Math.round(p * 1000)).padStart(4, "0")}.jpg`), type: "jpeg", quality: 88 });
  }
  console.log(
    `p=${p.toFixed(3)} fps=${m.fps.toFixed(1)} frame=${m.frameMs.toFixed(2)}ms p95=${m.p95Ms.toFixed(2)} gpu=${m.gpuMs?.toFixed(2) ?? "n/a"}ms calls=${m.calls?.toFixed(0)} tris=${m.triangles?.toFixed(0)} script=${m.scriptMsPerSec.toFixed(1)}ms/s dom=${m.domMutationsPerSec.toFixed(1)}/s`
  );
}

const summary = {
  url, gpuInfo, loadMs, width, height,
  avg: {
    fps: results.reduce((a, r) => a + r.fps, 0) / results.length,
    frameMs: results.reduce((a, r) => a + r.frameMs, 0) / results.length,
    worstP95Ms: Math.max(...results.map((r) => r.p95Ms)),
    calls: results.reduce((a, r) => a + (r.calls || 0), 0) / results.length,
    maxCalls: Math.max(...results.map((r) => r.calls || 0)),
    triangles: results.reduce((a, r) => a + (r.triangles || 0), 0) / results.length,
    maxTriangles: Math.max(...results.map((r) => r.triangles || 0)),
    gpuMs: results.every((r) => r.gpuMs != null) ? results.reduce((a, r) => a + r.gpuMs, 0) / results.length : null,
  },
  results,
  console: consoleLog,
};
fs.writeFileSync(path.join(outDir, "summary.json"), JSON.stringify(summary, null, 2));
console.log("GPU:", gpuInfo);
console.log("AVG:", summary.avg);
console.log(`console entries: ${consoleLog.length}`);
for (const l of consoleLog.slice(0, 40)) console.log("  ", l);
await browser.close();
