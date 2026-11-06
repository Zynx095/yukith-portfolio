// QA for the world's regions and personal content: chapter list, every hackathon exhibit, the
// arena's achievements and aim-trainer booth, the library's volumes, the family scene and its
// memories, discovery persistence, cut fades, the sealed arena, and memory over repeated
// region switching. Uses the ?perf hook (window.__world).
// Usage: node scripts/qa-regions.mjs [--url http://localhost:3000] [--quick]
import { createRequire } from "module";
const require = createRequire(new URL("../package.json", import.meta.url));
const puppeteer = require("puppeteer");
const sharp = require("sharp");

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
  args: ["--ignore-gpu-blocklist", "--use-angle=d3d11", "--js-flags=--expose-gc"],
  defaultViewport: { width: 1440, height: 900 },
  protocolTimeout: 300000,
});
const page = await browser.newPage();
const errors = [];
const failed = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(e.message));
page.on("response", (r) => r.status() >= 400 && failed.push(`${r.status()} ${r.url()}`));
await page.goto(`${base}/?perf`, { waitUntil: "load", timeout: 120000 });
await page.waitForFunction(() => window.__world?.ready, { timeout: 120000 });

/** Mean luminance of the viewport (0..255): a black frame means a broken or stuck view. */
const brightness = async () => {
  const buf = await page.screenshot({ type: "png" });
  const { channels } = await sharp(buf).stats();
  return (channels[0].mean + channels[1].mean + channels[2].mean) / 3;
};
const labelTitle = () => page.evaluate(() => document.querySelector("p.font-display.text-3xl.leading-tight")?.textContent?.trim() ?? "");
const gotoStop = async (region, t, settle = 1900) => {
  await page.evaluate((r, t) => window.__world.setRegion(r, t), region, t);
  await sleep(settle);
};
const openFocused = async () => {
  await page.evaluate(() => {
    const card = document.querySelector("p.font-display.text-3xl.leading-tight")?.closest("div");
    card?.querySelector("button")?.click();
  });
  await sleep(500);
  const t = await page.evaluate(() => document.querySelector("dialog[open] #record-title")?.textContent?.trim() ?? "");
  await page.keyboard.press("Escape");
  await sleep(350);
  return t;
};

// ── Chapters ────────────────────────────────────────────────────────────────
await page.keyboard.press("/");
await sleep(500);
const chapters = await page.evaluate(() => [...document.querySelectorAll('dialog[open] [aria-labelledby="idx-journey"] li')].map((li) => li.textContent?.replace(/^\d+/, "").trim().split("\n")[0]));
await page.keyboard.press("Escape");
await sleep(300);
check("index lists the new regions among eleven chapters", chapters.length === 11 && chapters.some((c) => /hackathon district/i.test(c)) && chapters.some((c) => /arena/i.test(c)) && chapters.some((c) => /library/i.test(c)), chapters.length + " chapters");

const stops = await page.evaluate(() => window.__world.focusIds());

// ── Every hackathon exhibit ─────────────────────────────────────────────────
const events = stops.district;
let ok = 0;
const misses = [];
for (const s of args.quick ? events.slice(0, 6) : events) {
  await gotoStop("district", s.t, 1700);
  const title = await labelTitle();
  const expected = await page.evaluate((id) => window.__world && document && id, s.id);
  const rec = await openFocused();
  if (title && rec === title) ok++;
  else misses.push(`${expected}: label '${title}' record '${rec}'`);
}
check(`every district exhibit is focusable and opens its record (${ok}/${args.quick ? 6 : events.length})`, misses.length === 0, misses.slice(0, 3).join(" | "));
check("the district has one exhibit per event", events.length === 20, `${events.length} exhibits`);
await gotoStop("district", 0.5);
check("district frame is lit (not black)", (await brightness()) > 25);

// ── Arena ───────────────────────────────────────────────────────────────────
const arenaExpect = { "amd-valorant": "AMD Valorant tournament", "valorant-rank": "Immortal 1", "csgo-rank": "Legendary Eagle", "mlbb-rank": "Grandmaster" };
for (const s of stops.arena.filter((x) => x.id in arenaExpect)) {
  await gotoStop("arena", s.t);
  const title = await labelTitle();
  const rec = await openFocused();
  check(`arena: ${arenaExpect[s.id]} is shown and opens`, title === arenaExpect[s.id] && rec === arenaExpect[s.id], `label '${title}', record '${rec}'`);
}
const pocket = await page.evaluate(() => window.__world.frame.pocket);
check("the arena is a sealed pocket (valley hidden)", pocket === 1);
check("arena frame is lit (not black)", (await brightness()) > 12);
const aimStop = stops.arena.find((x) => x.id === "aim");
await gotoStop("arena", aimStop.t);
await page.evaluate(() => {
  const card = document.querySelector("p.font-display.text-3xl.leading-tight")?.closest("div");
  [...(card?.querySelectorAll("button") ?? [])].find((b) => /Play/.test(b.textContent || ""))?.click();
});
await page.waitForSelector("dialog[open] #aim-title", { timeout: 15000 }).catch(() => {});
const aimOpen = await page.evaluate(() => !!document.querySelector("dialog[open] #aim-title"));
check("arena booth: 'Play' opens the aim trainer", aimOpen);
await page.keyboard.press("Escape");
await sleep(600);

// ── Library ─────────────────────────────────────────────────────────────────
let libOk = 0;
for (const s of stops.library) {
  await gotoStop("library", s.t, 1600);
  const title = await labelTitle();
  const rec = await openFocused();
  if (title && rec === title) libOk++;
}
check(`library: every volume is focusable and opens (${libOk}/${stops.library.length})`, libOk === stops.library.length && libOk >= 8);
check("library frame is lit (not black)", (await brightness()) > 12);

// ── Family and memories ─────────────────────────────────────────────────────
await page.evaluate(() => window.__world.setProgress(0.09));
await sleep(2200);
const tags = await page.evaluate(() => [...document.querySelectorAll('[aria-label="Things nearby"] button')].filter((b) => Number(b.style.opacity) > 0.1).map((b) => b.textContent));
check("home: name tags appear for the family scene", tags.length >= 2, tags.join(", "));
const famTag = await page.evaluate(() => {
  const b = [...document.querySelectorAll('[aria-label="Things nearby"] button')].find((x) => Number(x.style.opacity) > 0.1 && /grill|Talking|fire|Bella/i.test(x.textContent || ""));
  b?.click();
  return b?.textContent;
});
await sleep(500);
const famRec = await page.evaluate(() => document.querySelector("dialog[open] #record-title")?.textContent?.trim());
check("home: a family tag opens a short, unnamed description", !!famTag && famRec === famTag, `${famTag} → ${famRec}`);
const famText = await page.evaluate(() => document.querySelector("dialog[open]")?.textContent ?? "");
check("family descriptions name no one", !/\b(mom|dad|mother|father|grand|aunt|uncle|cousin|brother|sister|girlfriend)\b/i.test(famText));
await page.keyboard.press("Escape");
await sleep(300);

// ── Discoveries ─────────────────────────────────────────────────────────────
const found = await page.evaluate(() => JSON.parse(localStorage.getItem("yk-discoveries") || "[]"));
check("opened things are recorded as discoveries", found.length >= 20, `${found.length} found`);
await page.reload({ waitUntil: "load" });
await page.waitForFunction(() => window.__world?.ready, { timeout: 120000 });
await page.keyboard.press("/");
await sleep(500);
const idxText = await page.evaluate(() => document.querySelector("dialog[open]")?.textContent || "");
check("discoveries persist across a reload", new RegExp(`Discovered ${found.length} of`).test(idxText), idxText.match(/Discovered \d+ of \d+/)?.[0]);
await page.keyboard.press("Escape");
await sleep(300);

// ── Cuts and region switching ───────────────────────────────────────────────
const cut = await page.evaluate(async () => {
  const w = window.__world;
  w.setRegion("arena", 0);
  await new Promise((r) => setTimeout(r, 300));
  const atEdge = w.frame.cut;
  w.setRegion("arena", 0.5);
  await new Promise((r) => setTimeout(r, 300));
  return { atEdge, mid: w.frame.cut };
});
check("cuts fade at a region's edge and clear inside it", cut.atEdge > 0.5 && cut.mid === 0, JSON.stringify(cut));
const heap = async () => {
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => window.gc?.());
    await sleep(250);
  }
  return page.evaluate(() => performance.memory.usedJSHeapSize / 1048576);
};
const h0 = await heap();
for (let k = 0; k < (args.quick ? 2 : 4); k++)
  for (const [r, t] of [["district", 0.5], ["arena", 0.5], ["library", 0.5]]) {
    await gotoStop(r, t, 900);
  }
await page.evaluate(() => window.__world.setProgress(0.5));
await sleep(1000);
const h1 = await heap();
check("JS heap is stable across repeated region switching", h1 - h0 < 12, `${h0.toFixed(1)} → ${h1.toFixed(1)} MB`);

check("no console errors", errors.length === 0, errors.slice(0, 3).join(" | "));
check("no failed requests", failed.length === 0, failed.slice(0, 3).join(" | "));
await browser.close();
const bad = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - bad}/${results.length} passed`);
process.exit(bad ? 1 : 0);
