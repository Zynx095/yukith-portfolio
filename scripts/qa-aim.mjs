// Browser QA for the aim trainer: opens from Classic and from the world, plays real runs through
// the test hook (?perf exposes window.__aim), checks HUD, hit detection, scoring, the timer,
// results, restart, close and that its WebGL context is released.
// Usage: node scripts/qa-aim.mjs [--url http://localhost:3000]
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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok: !!ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
};

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  headless: true,
  args: ["--ignore-gpu-blocklist", "--use-angle=d3d11"],
  defaultViewport: { width: 1440, height: 900 },
  protocolTimeout: 240000,
});
const ctx = await browser.createBrowserContext();
const page = await ctx.newPage();
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(e.message));
await page.evaluateOnNewDocument(() => {
  window.__glc = { created: 0, lost: 0 };
  const orig = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (t, ...r) {
    const c = orig.call(this, t, ...r);
    if (c && t === "webgl2" && !this.__c) {
      this.__c = true;
      window.__glc.created++;
      this.addEventListener("webglcontextlost", () => window.__glc.lost++);
    }
    return c;
  };
});

await page.goto(`${base}/?view=classic&perf`, { waitUntil: "load", timeout: 120000 });
await sleep(1200);
const canvasesBefore = await page.evaluate(() => document.querySelectorAll("canvas").length);
const chunkBefore = await page.evaluate(() => performance.getEntriesByType("resource").filter((r) => /chunks/.test(r.name)).length);
await page.evaluate(() => document.getElementById("gaming")?.scrollIntoView());
await sleep(400);
await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => /Play the aim trainer/.test(b.textContent || ""))?.click());
await page.waitForSelector("dialog[open] #aim-title", { timeout: 20000 });
const chunkAfter = await page.evaluate(() => performance.getEntriesByType("resource").filter((r) => /chunks/.test(r.name)).length);
check("Classic: the aim trainer opens in a dialog, loaded on demand", canvasesBefore === 0 && chunkAfter > chunkBefore, `chunks ${chunkBefore}→${chunkAfter}`);
const label = await page.evaluate(() => document.querySelector("dialog[open]")?.textContent?.includes("not affiliated with Riot Games"));
check("labelled as a portfolio mini-game, not affiliated with Riot Games", label);
const modes = await page.evaluate(() => [...document.querySelectorAll('input[name="aim-mode"]')].map((i) => i.value).join(","));
check("four modes and three difficulties offered", modes === "flick,precision,reaction,moving" && (await page.$$('input[name="aim-diff"]')).length === 3, modes);

// ── Flick run ───────────────────────────────────────────────────────────────
const startRun = async () => {
  await page.evaluate(() => [...document.querySelectorAll("dialog[open] button")].find((b) => /^Start/.test(b.textContent || ""))?.click());
  await page.waitForFunction(() => window.__aim?.session, { timeout: 15000 });
};
await startRun();
const hasCanvas = await page.evaluate(() => !!document.querySelector("dialog[open] canvas"));
check("starting a run creates the game's own canvas", hasCanvas);
await sleep(500);
const cd = await page.evaluate(() => ({ phase: window.__aim.session.phase, count: document.querySelector('[aria-live="polite"].font-display')?.textContent }));
check("a countdown precedes the run", cd.phase === "countdown", JSON.stringify(cd));
await page.waitForFunction(() => window.__aim.session.phase === "running" && window.__aim.session.targets.length > 0, { timeout: 8000 });
const hit = await page.evaluate(() => window.__aim.shootTarget());
await sleep(80);
const miss = await page.evaluate(() => window.__aim.shootAt(20, 20));
await page.waitForFunction(() => document.querySelector('[data-aim="accuracy"]')?.textContent === "50%", { timeout: 3000 }).catch(() => {});
const hud = await page.evaluate(() => ({ score: document.querySelector('[data-aim="score"]')?.textContent, acc: document.querySelector('[data-aim="accuracy"]')?.textContent, time: document.querySelector('[data-aim="time"]')?.textContent, s: { hits: window.__aim.session.hits, shots: window.__aim.session.shots, score: window.__aim.session.score } }));
check("a shot on a target hits and scores; a shot at the wall misses", hit > 0 && miss === 0 && hud.s.hits === 1 && hud.s.shots === 2, JSON.stringify(hud.s));
check("HUD shows score, accuracy and time", hud.score === String(hud.s.score) && hud.acc === "50%" && /\d+s/.test(hud.time || ""), JSON.stringify(hud));
// Hit a few more, then let the clock run out.
for (let i = 0; i < 6; i++) {
  await page.evaluate(() => window.__aim.shootTarget());
  await sleep(120);
}
await page.waitForSelector('[data-aim="results"]', { timeout: 45000 });
const res = await page.evaluate(() => ({ score: document.querySelector('[data-aim="final-score"]')?.textContent, text: document.querySelector('[data-aim="results"]')?.textContent }));
check("the timer ends the run and shows the results screen", !!res.score && /Accuracy/.test(res.text) && /Avg reaction/.test(res.text), `score ${res.score}`);
await sleep(1200);
const gl1 = await page.evaluate(() => ({ ...window.__glc, canvases: document.querySelectorAll("canvas").length }));
check("the game's WebGL context is released when the run ends", gl1.created === gl1.lost && gl1.canvases === 0, JSON.stringify(gl1));
const disc = await page.evaluate(() => JSON.parse(localStorage.getItem("yk-discoveries") || "[]").includes("aim-trainer"));
check("finishing a run is recorded as a discovery", disc);
const best = await page.evaluate(() => JSON.parse(localStorage.getItem("yk-aim-best") || "{}")["flick:normal"]);
check("the personal best is stored per mode and difficulty", Number(best) === Number(res.score), `best ${best}`);

// ── Restart: reaction mode ──────────────────────────────────────────────────
await page.evaluate(() => [...document.querySelectorAll("dialog[open] button")].find((b) => /Change mode/.test(b.textContent || ""))?.click());
await sleep(300);
await page.evaluate(() => document.querySelector('input[name="aim-mode"][value="reaction"]')?.click());
await page.evaluate(() => document.querySelector('input[name="aim-diff"][value="hard"]')?.click());
await startRun();
await page.waitForFunction(() => window.__aim.session.phase === "running", { timeout: 8000 });
let rounds = 0;
for (let i = 0; i < 400 && rounds < 10; i++) {
  const r = await page.evaluate(() => (window.__aim.session.targets.length ? window.__aim.shootTarget() : -1));
  if (r > 0) rounds++;
  await sleep(60);
}
await page.waitForSelector('[data-aim="results"]', { timeout: 30000 });
const rr = await page.evaluate(() => document.querySelector('[data-aim="results"]')?.textContent || "");
check("restart into the reaction test: ten rounds, reaction times reported", rounds === 10 && /\d+ ms/.test(rr), `rounds ${rounds}`);

// ── Close ───────────────────────────────────────────────────────────────────
await page.evaluate(() => [...document.querySelectorAll("dialog[open] button")].find((b) => /Back to the portfolio/.test(b.textContent || ""))?.click());
await sleep(600);
const closed = await page.evaluate(() => !document.querySelector("dialog[open]") && document.querySelectorAll("canvas").length === 0);
check("closing returns to the page with no game canvas left", closed);
check("no console errors", errors.length === 0, errors.slice(0, 3).join(" | "));
await ctx.close();

// ── From the world: the game pauses the world ───────────────────────────────
{
  const c2 = await browser.createBrowserContext();
  const p = await c2.newPage();
  await p.goto(`${base}/?perf`, { waitUntil: "load", timeout: 120000 });
  await p.waitForFunction(() => window.__world?.ready, { timeout: 120000 });
  await p.keyboard.press("/");
  await sleep(500);
  const btn = await p.evaluate(() => [...document.querySelectorAll("dialog[open] button")].some((b) => /aim trainer/i.test(b.textContent || "")));
  await p.evaluate(() => [...document.querySelectorAll("dialog[open] button")].find((b) => /aim trainer/i.test(b.textContent || ""))?.click());
  await p.waitForSelector("dialog[open] #aim-title", { timeout: 20000 });
  const f0 = await p.evaluate(() => window.__world.gl.info.render.frame);
  await sleep(1000);
  const f1 = await p.evaluate(() => window.__world.gl.info.render.frame);
  check("Immersive: the index opens the aim trainer and the world stops rendering meanwhile", btn && f1 === f0, `world frames ${f0}→${f1}`);
  await p.keyboard.press("Escape");
  await sleep(800);
  const f2 = await p.evaluate(() => window.__world.gl.info.render.frame);
  check("closing it resumes the world", !(await p.evaluate(() => !!document.querySelector("dialog[open]"))) && f2 > f1, `frames ${f1}→${f2}`);
  await c2.close();
}

await browser.close();
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
