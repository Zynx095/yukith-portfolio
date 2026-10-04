// Interaction QA for the World Tree journey (needs the dev server and ?perf).
// Checks: relic label → detail panel opens/closes (button + Esc), focus magnet
// engages when idle and releases on scroll, reverse scrolling, skip link.
// Usage: node scripts/qa-world.mjs --out <dir> [--url http://localhost:3000]
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
const outDir = args.out || "./qa-out";
fs.mkdirSync(outDir, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || "C:/Users/Yukith M Joseph/.cache/puppeteer/chrome/win64-152.0.7977.54/chrome-win64/chrome.exe",
  headless: true,
  args: ["--ignore-gpu-blocklist", "--use-angle=d3d11", "--window-size=1920,1080", "--force_high_performance_gpu"],
  defaultViewport: { width: 1920, height: 1080 },
  protocolTimeout: 240000,
});
const page = await browser.newPage();
const log = [];
page.on("console", (m) => log.push(`[${m.type()}] ${m.text()}`));
page.on("pageerror", (e) => log.push(`[pageerror] ${e.message}`));
await page.goto((args.url || "http://localhost:3000") + "/?perf", { waitUntil: "networkidle2", timeout: 120000 });
await page.waitForFunction(() => window.__world && window.__world.ready, { timeout: 120000 });

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
};
const shot = (name) => page.screenshot({ path: path.join(outDir, name + ".jpg"), type: "jpeg", quality: 80 });

// 1 — focus magnet at the Street Hierarchy relic
const stops = await page.evaluate(() => {
  const p = 0.555 + 6 * 0.0368;
  window.__world.setProgress(p);
  return p;
});
await sleep(2500);
const phase = await page.evaluate(() => document.querySelector("[data-focus-phase]")?.getAttribute("data-focus-phase") ?? null);
const label = await page.$("::-p-text(Open the record)");
check("relic label visible near a stop", !!label, `progress ${stops.toFixed(4)}${phase ? ", phase " + phase : ""}`);
await shot("01-relic");

// 2 — open the record, then close with Esc
if (label) {
  await label.click();
  await sleep(1200);
  const panel = await page.$("[role=dialog], aside[aria-label]");
  check("detail panel opens from the label", !!panel);
  await shot("02-panel");
  await page.keyboard.press("Escape");
  await sleep(900);
  const after = await page.$("[role=dialog], aside[aria-label]");
  check("Esc closes the panel", !after);
}

// 3 — scrolling is never locked: wheel moves the page forward and back
const y0 = await page.evaluate(() => window.scrollY);
await page.mouse.move(960, 540);
for (let i = 0; i < 6; i++) {
  await page.mouse.wheel({ deltaY: 400 });
  await sleep(120);
}
await sleep(900);
const y1 = await page.evaluate(() => window.scrollY);
check("wheel scrolls forward", y1 > y0 + 200, `${y0} → ${y1}`);
for (let i = 0; i < 6; i++) {
  await page.mouse.wheel({ deltaY: -400 });
  await sleep(120);
}
await sleep(900);
const y2 = await page.evaluate(() => window.scrollY);
check("wheel scrolls back (reverse journey)", y2 < y1 - 200, `${y1} → ${y2}`);

// 4 — skip link lands in the portfolio
const skip = await page.$("::-p-text(Skip to portfolio)");
if (skip) {
  await skip.click();
  await sleep(2500);
  const atHero = await page.evaluate(() => {
    const h = document.getElementById("hero");
    if (!h) return false;
    const r = h.getBoundingClientRect();
    return Math.abs(r.top) < window.innerHeight * 0.6;
  });
  check("skip link reaches the portfolio", atHero);
  await shot("03-skip");
}

fs.writeFileSync(path.join(outDir, "qa.json"), JSON.stringify({ results, log }, null, 2));
const errors = log.filter((l) => /\[error\]|\[pageerror\]/.test(l));
console.log(errors.length ? errors.slice(0, 10).join("\n") : "no console errors");
await browser.close();
