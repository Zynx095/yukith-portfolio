// Reference-portfolio inspector: loads each live site in a real (GPU) Edge,
// records renderer/context types, libraries, network weight, fonts, console errors,
// and captures screenshots across loading, landing, start-click, scroll and keyboard.
// Usage: node inspect-refs.mjs <outDir> [id,id,...]
import { createRequire } from "module";
import fs from "fs";
import path from "path";
const require = createRequire("D:/College/SOMESHIT DOWNLOADS/Portfolio/yukith-portfolio/package.json");
const puppeteer = require("puppeteer");

const SITES = [
  ["bruno", "https://www.bruno-simon.com"],
  ["samsy", "https://samsy.ninja/"],
  ["bilal", "https://bilal.show/"],
  ["lempens", "https://www.sebastien-lempens.com/"],
  ["jreyes", "https://jreyes-mc-portfolio.com/"],
  ["breton", "https://jordan-breton.com/"],
  ["introvigne", "https://www.thibault-introvigne.com/"],
  ["worawork", "https://worawork.vercel.app/"],
  ["aimee", "https://aimees-papercraft-world.com"],
  ["weisdevice", "https://www.weisdevice.xyz"],
  ["ameen", "https://ameen-abdullah.dev"],
  ["ransijn", "https://jayransijn.com/"],
  ["monolith", "https://themonolithproject.net/"],
  ["messenger", "https://messenger.abeto.co"],
  ["egghunt", "https://egghunt.merci-michel.com/"],
  ["mola", "https://mola-zone.com/"],
  ["equinox", "https://equinox.space/"],
];

const outRoot = process.argv[2];
const only = process.argv[3] ? process.argv[3].split(",") : null;
fs.mkdirSync(outRoot, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  headless: true,
  args: ["--ignore-gpu-blocklist", "--enable-gpu-rasterization", "--use-angle=d3d11",
    "--enable-unsafe-webgpu", "--force_high_performance_gpu", "--autoplay-policy=no-user-gesture-required",
    "--window-size=1600,900", "--mute-audio"],
  defaultViewport: { width: 1600, height: 900, deviceScaleFactor: 1 },
  protocolTimeout: 180000,
});

const INSTRUMENT = () => {
  window.__ctx = [];
  const orig = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, attrs) {
    try { window.__ctx.push({ type, attrs: attrs ? JSON.stringify(attrs) : "", w: this.width, h: this.height }); } catch {}
    return orig.call(this, type, attrs);
  };
  if (window.OffscreenCanvas) {
    const o2 = OffscreenCanvas.prototype.getContext;
    OffscreenCanvas.prototype.getContext = function (type, attrs) {
      try { window.__ctx.push({ type: "offscreen:" + type }); } catch {}
      return o2.call(this, type, attrs);
    };
  }
  if (navigator.gpu) {
    const ra = navigator.gpu.requestAdapter.bind(navigator.gpu);
    navigator.gpu.requestAdapter = (...a) => { window.__webgpuRequested = true; return ra(...a); };
  }
};

async function inspect(id, url, mobile = false) {
  const dir = path.join(outRoot, id);
  fs.mkdirSync(dir, { recursive: true });
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  if (mobile) {
    await page.emulate({ viewport: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1" });
  }
  await page.evaluateOnNewDocument(INSTRUMENT);
  const log = [];
  const net = { requests: 0, bytes: 0, byType: {}, assets: [] };
  const cdp = await page.createCDPSession();
  await cdp.send("Network.enable");
  const reqInfo = new Map();
  cdp.on("Network.responseReceived", (e) => reqInfo.set(e.requestId, { url: e.response.url, mime: e.response.mimeType, status: e.response.status }));
  cdp.on("Network.loadingFinished", (e) => {
    const info = reqInfo.get(e.requestId) || {};
    net.requests++; net.bytes += e.encodedDataLength;
    const u = (info.url || "").split("?")[0];
    const ext = (u.match(/\.([a-z0-9]{2,5})$/i) || [, (info.mime || "other").split("/")[1] || "other"])[1].toLowerCase();
    net.byType[ext] = (net.byType[ext] || 0) + e.encodedDataLength;
    if (/\.(glb|gltf|ktx2|basis|drc|hdr|exr|bin|mp3|ogg|wav|m4a|mp4|webm|woff2?|ttf|otf|wasm|png|jpe?g|webp|avif)$/i.test(u) && e.encodedDataLength > 30000)
      net.assets.push(`${(e.encodedDataLength / 1024).toFixed(0)}KB ${u.slice(0, 140)}`);
  });
  page.on("console", (m) => { if (["error", "warning"].includes(m.type())) log.push(`[${m.type()}] ${m.text().slice(0, 200)}`); });
  page.on("pageerror", (e) => log.push(`[pageerror] ${e.message.slice(0, 200)}`));

  const shots = [];
  const shot = async (name) => {
    const f = path.join(dir, `${mobile ? "m-" : ""}${String(shots.length).padStart(2, "0")}-${name}.jpg`);
    try { await page.screenshot({ path: f, type: "jpeg", quality: 72 }); shots.push(f); } catch (e) { log.push(`[shot-fail] ${name} ${e.message}`); }
  };
  const t0 = Date.now();
  let gotoErr = null;
  try { await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 }); } catch (e) { gotoErr = e.message; }
  const dcl = Date.now() - t0;
  await sleep(2500); await shot("load-2s");
  if (!mobile) { await sleep(4000); await shot("load-6s"); }
  await sleep(mobile ? 9000 : 8000); await shot("landing-14s");

  // Try to press a start/enter button, else click centre.
  const clicked = await page.evaluate(() => {
    const rx = /^(start|enter|explore|begin|play|continue|discover|let'?s go|go|launch|ok|got it|sound on|with sound|without sound|enter site|start experience|click to start|accept|yes)\b/i;
    const els = [...document.querySelectorAll("button, a, [role=button], div, span")].filter((el) => {
      const r = el.getBoundingClientRect(); const t = (el.innerText || "").trim();
      return r.width > 0 && r.height > 0 && t.length < 40 && rx.test(t) && getComputedStyle(el).visibility !== "hidden";
    });
    if (els.length) { const el = els[els.length - 1]; el.click(); return (el.innerText || "").trim(); }
    return null;
  }).catch(() => null);
  if (!clicked) { try { await page.mouse.click(mobile ? 195 : 800, mobile ? 422 : 450); } catch {} }
  await sleep(4500); await shot("after-start");

  // Scroll a few steps (wheel on desktop, touch-ish scroll on mobile).
  for (let i = 0; i < (mobile ? 2 : 4); i++) {
    try {
      if (mobile) await page.evaluate(() => window.scrollBy(0, 700));
      else { await page.mouse.move(800, 450); for (let k = 0; k < 6; k++) { await page.mouse.wheel({ deltaY: 220 }); await sleep(80); } }
    } catch {}
    await sleep(2600); await shot(`scroll-${i + 1}`);
  }
  if (!mobile) {
    // Keyboard exploration (drive/walk)
    try { await page.keyboard.down("ArrowUp"); await page.keyboard.down("KeyW"); await sleep(2200); await page.keyboard.up("ArrowUp"); await page.keyboard.up("KeyW"); } catch {}
    await sleep(600); await shot("keys");
  }
  // FPS + environment probe
  const probe = await page.evaluate(async () => {
    const frames = await new Promise((res) => { let n = 0; const s = performance.now(); const f = () => { n++; performance.now() - s < 2000 ? requestAnimationFrame(f) : res(n / ((performance.now() - s) / 1000)); }; requestAnimationFrame(f); });
    const canvases = [...document.querySelectorAll("canvas")].map((c) => `${c.width}x${c.height} css ${Math.round(c.getBoundingClientRect().width)}x${Math.round(c.getBoundingClientRect().height)}`);
    const fonts = [...new Set([...document.fonts].filter((f) => f.status === "loaded").map((f) => `${f.family.replace(/"/g, "")} ${f.weight}`))].slice(0, 12);
    const bodyFont = getComputedStyle(document.body).fontFamily;
    const libs = {
      three: window.__THREE__ || null,
      gsap: !!window.gsap, howler: !!window.Howler, lenis: !!window.lenis || !!document.querySelector(".lenis"),
      next: !!window.__NEXT_DATA__ || !!document.querySelector("#__next") || !!window.next,
      nuxt: !!window.__NUXT__ || !!window.$nuxt, vue: !!document.querySelector("[data-v-app]") || !!window.__VUE__,
      react: !!document.querySelector("[data-reactroot]") || [...document.querySelectorAll("*")].slice(0, 300).some((e) => Object.keys(e).some((k) => k.startsWith("__react"))),
      svelte: !!document.querySelector("[class*='svelte-']"), astro: !!document.querySelector("astro-island"),
    };
    const gens = [...document.querySelectorAll("meta[name=generator]")].map((m) => m.content);
    const scripts = [...document.scripts].map((s) => s.src).filter(Boolean).map((s) => s.split("/").slice(-1)[0]).slice(0, 15);
    const text = (document.body.innerText || "").replace(/\s+/g, " ").slice(0, 700);
    const h = [...document.querySelectorAll("h1,h2,h3")].map((e) => e.innerText.trim()).filter(Boolean).slice(0, 12);
    const links = [...document.querySelectorAll("a[href]")].length;
    const domNodes = document.querySelectorAll("*").length;
    const scrollH = document.documentElement.scrollHeight;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    return { fps: Math.round(frames), canvases, fonts, bodyFont, libs, gens, scripts, text, h, links, domNodes, scrollH, ctx: window.__ctx, webgpuRequested: !!window.__webgpuRequested, title: document.title, reduced };
  }).catch((e) => ({ error: e.message }));
  const result = { id, url, mobile, gotoErr, dclMs: dcl, clicked, totalMs: Date.now() - t0, net: { ...net, mb: +(net.bytes / 1048576).toFixed(2), byType: Object.fromEntries(Object.entries(net.byType).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, v]) => [k, +(v / 1048576).toFixed(2)])), assets: net.assets.slice(0, 25) }, probe, log: log.slice(0, 25), shots };
  fs.writeFileSync(path.join(dir, `${mobile ? "mobile" : "desktop"}.json`), JSON.stringify(result, null, 2));
  await ctx.close();
  return result;
}

for (const [id, url] of SITES) {
  if (only && !only.includes(id)) continue;
  for (const mobile of [false, true]) {
    try {
      const r = await Promise.race([inspect(id, url, mobile), sleep(150000).then(() => ({ id, mobile, timeout: true }))]);
      console.log(`${id}${mobile ? " (mobile)" : ""}: ${r.timeout ? "TIMEOUT" : `${r.net?.mb}MB ${r.net?.requests} req, fps ${r.probe?.fps}, ctx ${JSON.stringify((r.probe?.ctx || []).map((c) => c.type))}, webgpu ${r.probe?.webgpuRequested}, three ${r.probe?.libs?.three}`}`);
    } catch (e) { console.log(`${id}: ERROR ${e.message}`); }
  }
}
await browser.close();
