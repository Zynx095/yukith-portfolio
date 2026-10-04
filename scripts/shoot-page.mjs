// Screenshot sections of the written portfolio (below the World Tree journey).
// Usage: node scripts/shoot-page.mjs --out <dir> [--url http://localhost:3000]
//        [--targets work,project-qshield,...] [--width 1920 --height 1080]
//        [--click "#selector"] (clicks before the shot of the same index, optional)
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

const url = args.url || "http://localhost:3000";
const outDir = args.out || "./page-shots";
const targets = (args.targets || "work").split(",");
const width = Number(args.width || 1920);
const height = Number(args.height || 1080);
fs.mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || "C:/Users/Yukith M Joseph/.cache/puppeteer/chrome/win64-152.0.7977.54/chrome-win64/chrome.exe",
  headless: true,
  args: ["--ignore-gpu-blocklist", "--use-angle=d3d11", `--window-size=${width},${height}`],
  defaultViewport: { width, height, deviceScaleFactor: Number(args.dpr || 1), isMobile: args.mobile === "true", hasTouch: args.mobile === "true" },
  protocolTimeout: 240000,
});
const page = await browser.newPage();
const log = [];
page.on("console", (m) => log.push(`[${m.type()}] ${m.text()}`));
page.on("pageerror", (e) => log.push(`[pageerror] ${e.message}`));
page.on("response", (r) => {
  if (r.status() >= 400) log.push(`[http ${r.status()}] ${r.url()}`);
});
await page.goto(url, { waitUntil: "networkidle2", timeout: 120000 });
await new Promise((r) => setTimeout(r, 2500));

for (const [i, target] of targets.entries()) {
  const found = await page.evaluate((id) => {
    const el = document.getElementById(id);
    if (!el) return false;
    const y = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, y);
    return true;
  }, target);
  if (!found) {
    log.push(`[shoot] missing #${target}`);
    continue;
  }
  await new Promise((r) => setTimeout(r, 1800));
  const clicks = (args[`click${i}`] || "").split("|").filter(Boolean);
  for (const sel of clicks) {
    await page.click(sel).catch((e) => log.push(`[shoot] click failed ${sel}: ${e.message}`));
    await new Promise((r) => setTimeout(r, 700));
  }
  await page.screenshot({ path: path.join(outDir, `${String(i).padStart(2, "0")}-${target}.jpg`), type: "jpeg", quality: 82 });
}
fs.writeFileSync(path.join(outDir, "console.json"), JSON.stringify(log, null, 2));
console.log(log.filter((l) => /error|http 4|http 5|missing|failed/i.test(l)).join("\n") || "no errors");
await browser.close();
