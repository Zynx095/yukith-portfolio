// Interaction QA for the journey and the portfolio. Exits non-zero on any failure.
// Usage: node scripts/qa-world.mjs [--url http://localhost:3000]
// Checks: skip link is the first tab stop; "/" opens the index with focus inside it; Esc closes it;
// a relic click opens its record; chapter rail jumps; the page works without JavaScript; no console errors.
import { createRequire } from "module";
const require = createRequire(new URL("../package.json", import.meta.url));
const puppeteer = require("puppeteer");

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith("--")) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith("--") ? arr[i + 1] : "true"]);
    return acc;
  }, [])
);
const url = args.url || "http://localhost:3000";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const check = (name, ok, detail = "") => results.push({ name, ok: !!ok, detail });

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  headless: true,
  args: ["--ignore-gpu-blocklist", "--use-angle=d3d11"],
  defaultViewport: { width: 1440, height: 900 },
});
const page = await browser.newPage();
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(`${url}/?perf`, { waitUntil: "load", timeout: 120000 });
await page.waitForFunction(() => window.__world?.ready, { timeout: 120000 });

await page.keyboard.press("Tab");
const first = await page.evaluate(() => document.activeElement?.textContent?.trim());
check("skip link is the first tab stop", /Skip the 3D journey/.test(first || ""), first);

await page.keyboard.press("/");
await sleep(600);
check("'/' opens the index with focus inside", await page.evaluate(() => !!document.activeElement?.closest("dialog[open]")));
await page.keyboard.press("Escape");
await sleep(500);
check("Esc closes the index", await page.evaluate(() => !document.querySelector("dialog[open]")));

await page.evaluate(() => window.__world.setProgress(0.5275));
await sleep(2500);
const hasLabel = await page.evaluate(() => [...document.querySelectorAll("button")].some((b) => /Open the record/.test(b.textContent || "")));
check("relic label offers 'Open the record'", hasLabel);
// Click the relic itself (left of centre: the camera frames relics off-centre for their label).
const box = await page.evaluate(() => ({ w: innerWidth, h: innerHeight }));
await page.mouse.click(box.w / 3, box.h * 0.52);
await sleep(900);
const title = await page.evaluate(() => document.querySelector("dialog[open] #record-title")?.textContent);
check("clicking a relic opens its record", !!title, title || "");
await page.keyboard.press("Escape");
await sleep(500);

await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => /chapter 2/.test(b.getAttribute("aria-label") || ""))?.click());
await sleep(3500);
check("chapter rail jumps", await page.evaluate(() => window.scrollY > 100));

const nojs = await browser.newPage();
await nojs.setJavaScriptEnabled(false);
await nojs.goto(url, { waitUntil: "load" });
const n = await nojs.evaluate(() => ({ h1: document.querySelector("h1")?.textContent, journey: getComputedStyle(document.getElementById("journey")).display, projects: document.querySelectorAll("#work article").length }));
check("portfolio readable without JavaScript", n.h1 && n.journey === "none" && n.projects >= 9, JSON.stringify(n));

check("no console errors", errors.length === 0, errors.slice(0, 3).join(" | "));
await browser.close();
for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.detail ? `  (${r.detail})` : ""}`);
process.exit(results.every((r) => r.ok) ? 0 : 1);
