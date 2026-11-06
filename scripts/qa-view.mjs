// QA for the two presentations (Immersive / Classic) and every fallback path.
// Usage: node scripts/qa-view.mjs [--url http://localhost:3000] [--quick]
// Exits non-zero on any failure. Each check runs in a fresh browser context
// (empty localStorage) unless it is testing persistence.
//
//   default visit · switcher · persistence · keyboard (V) · repeated switching
//   (WebGL contexts, canvases, heap) · ?view=classic / ?view=immersive precedence
//   · WebGL unavailable · WebGL 2 API missing · fatal context loss · no-JS ·
//   phone layout · console errors · failed requests
import { createRequire } from "module";
const require = createRequire(new URL("../package.json", import.meta.url));
const puppeteer = require("puppeteer");

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith("--")) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith("--") ? arr[i + 1] : "true"]);
    return acc;
  }, [])
);
const base = (args.url || "http://localhost:3000").replace(/\/$/, "");
const SWITCHES = args.quick ? 4 : 10;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
};

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  headless: true,
  args: ["--ignore-gpu-blocklist", "--use-angle=d3d11", "--js-flags=--expose-gc"],
  defaultViewport: { width: 1440, height: 900 },
  protocolTimeout: 240000,
});

/**
 * Counts WebGL 2 contexts created and lost (installed before any page script).
 * The world renders with WebGL 2. troika-three-text (the carved waystone words)
 * keeps one small WebGL 1 canvas for glyph SDFs for the whole visit; it is
 * counted separately and must never multiply.
 */
const CONTEXT_PROBE = () => {
  window.__gl = { created: 0, lost: 0, webgl1: 0 };
  const orig = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
    const ctx = orig.call(this, type, ...rest);
    if (ctx && /webgl/.test(type) && !this.__counted) {
      this.__counted = true;
      if (type === "webgl2") {
        window.__gl.created++;
        this.addEventListener("webglcontextlost", () => window.__gl.lost++);
      } else window.__gl.webgl1++;
    }
    return ctx;
  };
};

async function open(path = "/", { probe = true, setup, viewport, context } = {}) {
  const ctx = context ?? (await browser.createBrowserContext());
  const page = await ctx.newPage();
  if (viewport) await page.setViewport(viewport);
  const errors = [];
  const failed = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => r.status() >= 400 && failed.push(`${r.status()} ${r.url()}`));
  page.on("requestfailed", (r) => !/favicon/.test(r.url()) && failed.push(`failed ${r.url()} ${r.failure()?.errorText}`));
  if (probe) await page.evaluateOnNewDocument(CONTEXT_PROBE);
  if (setup) await page.evaluateOnNewDocument(setup);
  await page.goto(base + path, { waitUntil: "load", timeout: 120000 });
  return { page, ctx, errors, failed };
}

const state = (page) =>
  page.evaluate(() => ({
    view: document.documentElement.dataset.view,
    reason: document.documentElement.dataset.viewReason,
    canvases: document.querySelectorAll("canvas").length,
    loader: !!document.getElementById("loader"),
    journey: !!document.getElementById("journey"),
    stored: (() => {
      try {
        return localStorage.getItem("yk-view");
      } catch {
        return "blocked";
      }
    })(),
    search: location.search,
    scrollY: Math.round(window.scrollY),
    gl: window.__gl ? { ...window.__gl } : null,
    notice: document.querySelector('[role="status"] .bg-ember')?.parentElement?.textContent?.trim() ?? "",
  }));

const worldReady = (page, timeout = 120000) => page.waitForFunction(() => document.querySelector("canvas") && !document.getElementById("loader"), { timeout, polling: 250 });
const clickView = (page, v) => page.click(`button[data-opt="${v}"]`);

// ── 1. Default visit ────────────────────────────────────────────────────────
{
  const { page, ctx, errors, failed } = await open("/");
  const t0 = Date.now();
  await worldReady(page);
  const s = await state(page);
  check("first visit opens Immersive by default", s.view === "immersive" && s.reason === "default" && s.canvases === 1, JSON.stringify({ view: s.view, reason: s.reason, canvases: s.canvases }));
  check("world becomes ready", true, `${((Date.now() - t0) / 1000).toFixed(1)} s after load`);
  const sw = await page.evaluate(() => {
    const g = document.querySelector('[role="group"][aria-label="Presentation"]');
    const b = [...(g?.querySelectorAll("button") ?? [])].map((x) => `${x.textContent}:${x.getAttribute("aria-pressed")}`);
    const r = g?.getBoundingClientRect();
    return { b, visible: !!r && r.width > 0 && r.top >= 0 && r.right <= innerWidth };
  });
  check("switcher shows Immersive / Classic with pressed state", sw.visible && sw.b.join() === "Immersive:true,Classic:false", sw.b.join(" "));

  // ── 2. Switch to Classic without reloading ─────────────────────────────────
  await page.evaluate(() => window.scrollTo(0, 2400));
  await sleep(400);
  const navs = await page.evaluate(() => performance.getEntriesByType("navigation").length);
  await clickView(page, "classic");
  await sleep(1500);
  const c = await state(page);
  const navs2 = await page.evaluate(() => performance.getEntriesByType("navigation").length);
  check("switching to Classic needs no reload", navs === navs2 && c.view === "classic", `navigations ${navs}→${navs2}`);
  check("Classic unmounts the 3D world and releases its context", c.canvases === 0 && !c.journey && c.gl.lost === c.gl.created, JSON.stringify(c.gl));
  check("Classic choice is stored, page returns to top", c.stored === "classic" && c.scrollY === 0, `stored=${c.stored} y=${c.scrollY}`);
  const classicBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  check("Classic uses the light editorial theme", classicBg === "rgb(244, 239, 230)", classicBg);

  // ── 3. Persistence across reload ───────────────────────────────────────────
  await page.reload({ waitUntil: "load" });
  await sleep(1200);
  const r = await state(page);
  check("reload keeps Classic (stored choice)", r.view === "classic" && r.reason === "stored" && r.canvases === 0, `${r.view}/${r.reason}`);

  // ── 4. Keyboard shortcut ───────────────────────────────────────────────────
  await page.keyboard.press("v");
  await worldReady(page);
  const k1 = await state(page);
  await page.keyboard.press("v");
  await sleep(1500);
  const k2 = await state(page);
  check("V toggles Classic → Immersive → Classic", k1.view === "immersive" && k1.canvases === 1 && k2.view === "classic" && k2.canvases === 0, `${k1.view}→${k2.view}`);
  await page.keyboard.press("/");
  await sleep(500);
  const idx = await page.evaluate(() => !!document.querySelector("dialog[open]"));
  await page.keyboard.press("Escape");
  check("'/' still opens the index in Classic (no conflict with V)", idx);

  // ── 5. Repeated switching ──────────────────────────────────────────────────
  const heap = async () => {
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.gc?.());
      await sleep(300);
    }
    return page.evaluate(() => performance.memory?.usedJSHeapSize ?? 0);
  };
  // Baseline after one full round trip (the per-visit generation caches are filled by then).
  const heap0 = await heap();
  for (let i = 0; i < SWITCHES; i++) {
    await clickView(page, "immersive");
    await worldReady(page);
    await sleep(600);
    await clickView(page, "classic");
    await sleep(900);
  }
  await sleep(1500);
  const heap1 = await heap();
  const rs = await state(page);
  const active = rs.gl.created - rs.gl.lost;
  check(`${SWITCHES} round trips leave no WebGL context or canvas behind`, rs.canvases === 0 && active === 0 && rs.gl.webgl1 <= 1, `WebGL 2 created ${rs.gl.created}, lost ${rs.gl.lost}; glyph canvas ${rs.gl.webgl1}`);
  const growth = (heap1 - heap0) / 1048576;
  check(`JS heap is stable after ${SWITCHES} more round trips`, growth < 10, `${(heap0 / 1048576).toFixed(1)} → ${(heap1 / 1048576).toFixed(1)} MB after full GC`);
  await clickView(page, "immersive");
  await worldReady(page);
  await sleep(800);
  const back = await state(page);
  check("Immersive still works after repeated switching", back.canvases === 1 && back.gl.created - back.gl.lost === 1, JSON.stringify(back.gl));
  check("no console errors during switching", errors.length === 0, errors.slice(0, 3).join(" | "));
  check("no failed requests", failed.length === 0, failed.slice(0, 3).join(" | "));
  await ctx.close();
}

// ── 6. URL parameters take precedence for the visit ─────────────────────────
{
  const ctx = await browser.createBrowserContext();
  const p0 = await ctx.newPage();
  await p0.goto(base + "/", { waitUntil: "load" });
  await p0.evaluate(() => localStorage.setItem("yk-view", "immersive"));
  await p0.close();
  const { page } = await open("/?view=classic", { context: ctx });
  await sleep(1200);
  const a = await state(page);
  check("?view=classic opens Classic over a stored Immersive", a.view === "classic" && a.reason === "url" && a.canvases === 0 && a.stored === "immersive", `${a.view}/${a.reason}, stored=${a.stored}`);
  await clickView(page, "immersive");
  await worldReady(page);
  const b = await state(page);
  check("choosing a mode drops ?view and stores the choice", b.search === "" && b.stored === "immersive" && b.view === "immersive", `search='${b.search}' stored=${b.stored}`);
  await page.evaluate(() => localStorage.setItem("yk-view", "classic"));
  await page.goto(base + "/?view=immersive", { waitUntil: "load" });
  await worldReady(page);
  const c = await state(page);
  check("?view=immersive opens Immersive over a stored Classic", c.view === "immersive" && c.reason === "url" && c.stored === "classic", `${c.view}/${c.reason}, stored=${c.stored}`);
  await page.goto(base + "/", { waitUntil: "load" });
  await sleep(1000);
  const d = await state(page);
  check("without the parameter the stored choice applies again", d.view === "classic" && d.reason === "stored", `${d.view}/${d.reason}`);
  await ctx.close();
}

// ── 7. WebGL failures ───────────────────────────────────────────────────────
{
  const { page, ctx, errors } = await open("/", {
    setup: () => {
      const orig = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
        return /webgl/.test(type) ? null : orig.call(this, type, ...rest);
      };
    },
  });
  await sleep(2500);
  const s = await state(page);
  check("WebGL that fails to start falls back to Classic with a notice", s.view === "classic" && s.reason === "no-webgl" && s.canvases === 0 && /can't run the 3D World Tree/.test(s.notice), `${s.view}/${s.reason} notice=${!!s.notice}`);
  const h1 = await page.evaluate(() => document.querySelector("h1")?.getBoundingClientRect().height > 0);
  check("Classic content is visible after the fallback", h1);
  check("no uncaught errors in the WebGL-failure path", errors.filter((e) => !/WebGL|switching to Classic/i.test(e)).length === 0, errors.slice(0, 2).join(" | "));
  await ctx.close();
}
{
  const { page, ctx } = await open("/?view=immersive", { setup: () => delete window.WebGL2RenderingContext });
  await sleep(1500);
  const s = await state(page);
  check("no WebGL 2 API: Classic before the first paint, even with ?view=immersive", s.view === "classic" && s.reason === "no-webgl" && !s.loader, `${s.view}/${s.reason}`);
  await ctx.close();
}
{
  const { page, ctx } = await open("/?perf");
  await page.waitForFunction(() => window.__world?.ready, { timeout: 120000 });
  await page.evaluate(() => window.__world.gl.getContext().getExtension("WEBGL_lose_context").loseContext());
  await sleep(4500);
  const s = await state(page);
  check("a lost, unrestored WebGL context ends in Classic with a retry", s.view === "classic" && s.reason === "error" && /stopped working/.test(s.notice) && s.canvases === 0, `${s.view}/${s.reason}`);
  const retry = await page.evaluate(() => [...document.querySelectorAll("button")].some((b) => /Try the 3D view again/.test(b.textContent || "")));
  check("the fallback notice offers to try the 3D view again", retry);
  await ctx.close();
}

// ── 8. Without JavaScript ───────────────────────────────────────────────────
{
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setJavaScriptEnabled(false);
  await page.goto(base + "/?view=immersive", { waitUntil: "load" });
  const n = await page.evaluate(() => ({
    view: document.documentElement.dataset.view,
    journey: getComputedStyle(document.getElementById("journey") ?? document.body).display,
    loader: document.getElementById("loader") ? getComputedStyle(document.getElementById("loader")).display : "absent",
    switcher: getComputedStyle(document.querySelector('[aria-label="Presentation"]')).display,
    h1: document.querySelector("h1")?.textContent,
    projects: document.querySelectorAll("#work article").length,
    details: document.querySelectorAll("#work details").length,
    sections: ["about", "work", "experience", "competitions", "gaming", "leadership", "skills", "interests", "education", "contact"].filter((id) => document.getElementById(id)).length,
    events: document.querySelectorAll("#competitions [id^='event-']").length,
    ranks: ["valorant-rank", "csgo-rank", "mlbb-rank", "amd-valorant"].filter((id) => document.getElementById(id)).length,
  }));
  check("no-JS: the page is the complete Classic portfolio", n.view === "classic" && n.journey === "none" && n.loader === "none" && n.h1 && n.projects >= 9 && n.sections === 10 && n.events === 20 && n.ranks === 4, JSON.stringify(n));
  check("no-JS: controls that need JavaScript are hidden", n.switcher === "none");
  await page.click("#project-warden summary");
  const opened = await page.evaluate(() => document.querySelector("#project-warden details")?.open);
  check("no-JS: project details open (native <details>)", opened);
  await ctx.close();
}

// ── 9. Phones ───────────────────────────────────────────────────────────────
for (const [label, path] of [
  ["Classic", "/?view=classic"],
  ["Immersive", "/"],
]) {
  const { page, ctx, errors } = await open(path, { viewport: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } });
  if (label === "Immersive") await worldReady(page);
  else await sleep(1500);
  const m = await page.evaluate(() => {
    const g = document.querySelector('[aria-label="Presentation"]')?.getBoundingClientRect();
    const idx = document.querySelector('button[aria-label="Open the index"]')?.getBoundingClientRect();
    return { overflow: document.documentElement.scrollWidth - innerWidth, switcher: g && g.left >= 0 && g.right <= innerWidth && g.width > 0, index: idx && idx.right <= innerWidth, h: g?.height };
  });
  check(`phone (390×844) ${label}: no horizontal overflow, switcher and index on screen`, m.overflow <= 0 && m.switcher && m.index, JSON.stringify(m));
  await page.tap(`button[data-opt="${label === "Classic" ? "immersive" : "classic"}"]`);
  if (label === "Classic") await worldReady(page);
  else await sleep(1500);
  const after = await state(page);
  check(`phone: tapping the switcher from ${label} works`, after.view === (label === "Classic" ? "immersive" : "classic"), after.view);
  check(`phone ${label}: no console errors`, errors.length === 0, errors.slice(0, 2).join(" | "));
  await ctx.close();
}

await browser.close();
const failedChecks = results.filter((r) => !r.ok);
console.log(`\n${results.length - failedChecks.length}/${results.length} passed`);
process.exit(failedChecks.length ? 1 : 0);
