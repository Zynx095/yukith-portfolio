// Inspection screenshots of the world from journey progress values and/or pinned cameras.
// Usage: node scripts/shoot-cams.mjs --out <dir> [--url http://localhost:3000] [--width 1280 --height 720]
//          --shots "name@0.3;roots@0.4@10,6,-700,0,20,-820;..."
//   Each shot: name@progress[@x,y,z,lookX,lookY,lookZ]
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
const url = (args.url || "http://localhost:3000") + "/?perf" + (args.query ? `&${args.query}` : "");
const out = args.out || "./cam-shots";
const width = Number(args.width || 1280);
const height = Number(args.height || 720);
fs.mkdirSync(out, { recursive: true });
const shots = (args.shots || "start@0").split(";").filter(Boolean).map((s) => {
  const [name, p, cam] = s.split("@");
  return { name, p: Number(p), cam: cam ? cam.split(",").map(Number) : null };
});

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  headless: true,
  args: ["--ignore-gpu-blocklist", "--use-angle=d3d11", "--force_high_performance_gpu", `--window-size=${width},${height}`],
  defaultViewport: { width, height, deviceScaleFactor: Number(args.dpr || 1) },
  protocolTimeout: 240000,
});
const page = await browser.newPage();
const log = [];
page.on("console", (m) => (m.type() === "error" || m.type() === "warning") && log.push(`[${m.type()}] ${m.text().slice(0, 300)}`));
page.on("pageerror", (e) => log.push(`[pageerror] ${e.message}`));
await page.goto(url, { waitUntil: "load", timeout: 120000 });
await page.waitForFunction(() => window.__world?.ready, { timeout: 120000 });
for (const s of shots) {
  await page.evaluate((s) => {
    window.__world.setCamera(s.cam);
    window.__world.setProgress(s.p);
  }, s);
  await new Promise((r) => setTimeout(r, Number(args.settle || 1600)));
  await page.screenshot({ path: path.join(out, `${s.name}.jpg`), type: "jpeg", quality: 86 });
}
console.log(log.slice(0, 20).join("\n") || "no console errors");
await browser.close();
