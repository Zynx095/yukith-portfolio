// Targeted second pass for references whose start screen the generic pass could not get past.
// Usage: node inspect-targeted.mjs <outDir> id[,id]
import { createRequire } from "module";
import fs from "fs";
import path from "path";
const require = createRequire("D:/College/SOMESHIT DOWNLOADS/Portfolio/yukith-portfolio/package.json");
const puppeteer = require("puppeteer");
const outRoot = process.argv[2];
const only = (process.argv[3] || "").split(",");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  headless: true,
  args: ["--ignore-gpu-blocklist", "--enable-gpu-rasterization", "--use-angle=d3d11", "--enable-unsafe-webgpu",
    "--force_high_performance_gpu", "--window-size=1600,900", "--mute-audio", "--autoplay-policy=no-user-gesture-required"],
  defaultViewport: { width: 1600, height: 900, deviceScaleFactor: 1 },
  protocolTimeout: 180000,
});

async function clickText(page, rx, timeout = 30000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    const ok = await page.evaluate((src) => {
      const re = new RegExp(src, "i");
      const els = [...document.querySelectorAll("button, a, [role=button], div, span, p")].filter((el) => {
        const r = el.getBoundingClientRect(); const t = (el.innerText || "").trim();
        return r.width > 0 && r.height > 0 && t.length < 30 && re.test(t);
      });
      if (!els.length) return false;
      const el = els[els.length - 1];
      const r = el.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2, t: el.innerText.trim() };
    }, rx.source).catch(() => false);
    if (ok) { await page.mouse.click(ok.x, ok.y); return ok.t; }
    await sleep(800);
  }
  return null;
}
async function hold(page, keys, ms) { for (const k of keys) await page.keyboard.down(k); await sleep(ms); for (const k of keys) await page.keyboard.up(k); }
async function wheel(page, n = 6, d = 220) { await page.mouse.move(800, 450); for (let k = 0; k < n; k++) { await page.mouse.wheel({ deltaY: d }); await sleep(90); } }

const PLANS = {

  monolith2: { url: "https://themonolithproject.net/", run: async (page, shot) => {
    const end = Date.now() + 180000;
    while (Date.now() < end) { const ok = await page.evaluate(() => /click on/i.test(document.body.innerText)).catch(() => false); if (ok) break; await sleep(2000); }
    await shot("ready"); await page.mouse.click(800, 450); await sleep(5000); await shot("spark");
    for (let i = 0; i < 8; i++) { await wheel(page, 10, 300); await sleep(3500); await shot(`scroll-${i + 1}`); }
  } },
  ameen2: { url: "https://ameen-abdullah.dev", run: async (page, shot) => {
    await sleep(25000);
    const pos = await page.evaluate(() => { const el = [...document.querySelectorAll("button,a,div,span")].filter((e) => /english/i.test(e.innerText || "") && (e.innerText || "").length < 40).pop(); if (!el) return null; const r = el.getBoundingClientRect(); el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true })); el.dispatchEvent(new PointerEvent("pointerup", { bubbles: true })); el.click(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
    if (pos) { await page.mouse.move(pos.x, pos.y); await page.mouse.down(); await sleep(120); await page.mouse.up(); }
    await sleep(9000); await shot("entered");
    for (let i = 0; i < 6; i++) { await wheel(page, 8, 260); await sleep(3200); await shot(`scroll-${i + 1}`); }
  } },
  ransijn2: { url: "https://jayransijn.com/", run: async (page, shot) => {
    const end = Date.now() + 200000;
    while (Date.now() < end) { const busy = await page.evaluate(() => /compiling|loading world/i.test(document.body.innerText)).catch(() => true); if (!busy) break; await sleep(3000); }
    await shot("ready"); const t = await clickText(page, /^(play|enter|start)/, 10000); await sleep(5000); await shot(`entered-${t}`);
    await hold(page, ["KeyW"], 2500); await shot("walk-1"); await hold(page, ["KeyW", "KeyD"], 1500); await hold(page, ["KeyW"], 2500); await shot("walk-2");
  } },

  ameen: { url: "https://ameen-abdullah.dev", run: async (page, shot) => {
    const t = await clickText(page, /english/, 40000); await sleep(7000); await shot(`entered-${t}`);
    for (let i = 0; i < 6; i++) { await wheel(page, 8, 260); await sleep(3000); await shot(`scroll-${i + 1}`); }
  } },
  ransijn: { url: "https://jayransijn.com/", run: async (page, shot) => {
    const t = await clickText(page, /^(play|enter|start)/, 90000); await sleep(6000); await shot(`entered-${t}`);
    await hold(page, ["KeyW"], 2500); await shot("walk-1");
    await hold(page, ["KeyW", "KeyD"], 1500); await hold(page, ["KeyW"], 2500); await shot("walk-2");
    await hold(page, ["KeyW", "KeyA"], 2000); await hold(page, ["KeyW"], 2500); await shot("walk-3");
  } },
  monolith: { url: "https://themonolithproject.net/", run: async (page, shot) => {
    await sleep(30000); await shot("loaded"); await page.mouse.click(800, 450); await sleep(4000); await shot("clicked");
    for (let i = 0; i < 7; i++) { await wheel(page, 10, 300); await sleep(3500); await shot(`scroll-${i + 1}`); }
  } },
  messenger: { url: "https://messenger.abeto.co", run: async (page, shot) => {
    await sleep(12000); const t = await clickText(page, /^begin/, 20000); if (!t) await page.mouse.click(800, 760); await sleep(7000); await shot("begun");
    await page.mouse.click(800, 450); await sleep(3000); await shot("click");
    await hold(page, ["KeyW"], 3000); await shot("walk-1"); await hold(page, ["KeyW", "KeyD"], 2500); await shot("walk-2");
  } },
  mola: { url: "https://mola-zone.com/", run: async (page, shot) => {
    const t = await clickText(page, /^enter$/, 40000); await sleep(8000); await shot(`entered-${t}`);
    await page.mouse.click(800, 450); await sleep(4000); await shot("click");
    for (let i = 0; i < 4; i++) { await wheel(page, 8, 260); await sleep(3000); await shot(`scroll-${i + 1}`); }
  } },
  equinox: { url: "https://equinox.space/", run: async (page, shot) => {
    await clickText(page, /^start$/, 40000); await sleep(4000); const t = await clickText(page, /mouse-only/, 15000); await sleep(8000); await shot(`entered-${t}`);
    for (let i = 0; i < 5; i++) { await page.mouse.click(800, 450); await sleep(3500); await shot(`click-${i + 1}`); }
  } },
  bruno: { url: "https://bruno-simon.com/", run: async (page, shot) => {
    await sleep(14000); await page.mouse.click(800, 450); await sleep(4000); await shot("started");
    await hold(page, ["ArrowUp"], 3000); await shot("drive-1");
    await hold(page, ["ArrowUp", "ArrowLeft"], 1800); await hold(page, ["ArrowUp"], 2500); await shot("drive-2");
    await hold(page, ["ArrowUp", "ArrowRight"], 2200); await hold(page, ["ArrowUp"], 3000); await shot("drive-3");
  } },
  lempens: { url: "https://www.sebastien-lempens.com/", run: async (page, shot) => {
    await sleep(6000); await clickText(page, /^(accept|reject)/, 8000); await sleep(8000);
    const t = await clickText(page, /^start$/, 30000); await sleep(7000); await shot(`started-${t}`);
    for (let i = 0; i < 7; i++) { await wheel(page, 10, 260); await sleep(3200); await shot(`scroll-${i + 1}`); }
  } },
  introvigne: { url: "https://www.thibault-introvigne.com/", run: async (page, shot) => {
    const t = await clickText(page, /^enter$/, 60000); await sleep(6000); await shot(`entered-${t}`);
    await hold(page, ["KeyW"], 2500); await shot("walk-1");
    await hold(page, ["KeyW", "KeyD"], 2000); await hold(page, ["KeyW"], 2500); await shot("walk-2");
    await hold(page, ["KeyW", "KeyA"], 2500); await hold(page, ["KeyW"], 2500); await shot("walk-3");
  } },
};

for (const [id, plan] of Object.entries(PLANS)) {
  if (!only.includes(id)) continue;
  const dir = path.join(outRoot, id); fs.mkdirSync(dir, { recursive: true });
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  let n = 0;
  const shot = async (name) => { await page.screenshot({ path: path.join(dir, `t${String(n++).padStart(2, "0")}-${name}.jpg`), type: "jpeg", quality: 72 }).catch(() => {}); };
  try {
    await page.goto(plan.url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await Promise.race([plan.run(page, shot), sleep(260000)]);
  } catch (e) { console.log(id, "error", e.message); }
  console.log(id, "done", n, "shots");
  await ctx.close();
}
await browser.close();
