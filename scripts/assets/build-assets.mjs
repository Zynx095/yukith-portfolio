// Asset pipeline: downloads CC0 sources from Poly Haven (cached in .cache/assets-src),
// then writes web-ready files to public/assets:
//
//   textures  →  <name>_color.webp (sRGB)  <name>_normal.webp  <name>_data.webp (R AO · G roughness · B height)
//   models    →  <name>.glb  welded, simplified, meshopt-compressed, quantised, WebP textures ≤ 1024 px
//
// Usage: node scripts/assets/build-assets.mjs [--only name,name] [--force]
// Provenance and licences are listed in docs/ASSETS.md (all CC0 1.0).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, prune, weld, simplify, meshopt, quantize, textureCompress, resample, flatten, join } from "@gltf-transform/functions";
import { MeshoptEncoder, MeshoptSimplifier } from "meshoptimizer";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SRC = path.join(ROOT, ".cache/assets-src");
const OUT = path.join(ROOT, "public/assets");
fs.mkdirSync(SRC, { recursive: true });
fs.mkdirSync(path.join(OUT, "textures"), { recursive: true });
fs.mkdirSync(path.join(OUT, "models"), { recursive: true });

const args = process.argv.slice(2);
const only = args.includes("--only") ? args[args.indexOf("--only") + 1].split(",") : null;
const force = args.includes("--force");

/** Surface textures: Poly Haven id → output name and resolution. */
const TEXTURES = [
  { id: "bark_willow", name: "bark", res: "2k", size: 2048, dataSize: 1024 },
  { id: "forest_leaves_02", name: "litter", res: "1k", size: 1024 },
  { id: "sparse_grass", name: "grass", res: "1k", size: 1024 },
  { id: "rocky_trail", name: "trail", res: "1k", size: 1024 },
  { id: "mossy_rock", name: "rock", res: "1k", size: 1024 },
];

/** Models: Poly Haven id → output name, simplification ratio (of triangles kept). */
const MODELS = [
  // Sets keep their pieces as separate meshes, so each can be placed on its own.
  { id: "rock_moss_set_01", name: "rocks-tall", ratio: 0.35, separate: true },
  { id: "rock_moss_set_02", name: "rocks-round", ratio: 0.35, separate: true },
  { id: "fern_02", name: "fern", ratio: 1, separate: true },
  { id: "moss_01", name: "moss", ratio: 1 },
  { id: "tree_stump_01", name: "stump", ratio: 0.4 },
  { id: "celandine_01", name: "celandine", ratio: 0.6, separate: true },
];

async function fetchTo(url, file) {
  if (fs.existsSync(file) && !force) return file;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  return file;
}

async function files(id) {
  const res = await fetch(`https://api.polyhaven.com/files/${id}`);
  if (!res.ok) throw new Error(`files ${id}: ${res.status}`);
  return res.json();
}

async function buildTexture({ id, name, res, size, dataSize = size }) {
  const f = await files(id);
  const get = async (key) => fetchTo(f[key][res].jpg.url, path.join(SRC, id, `${key}_${res}.jpg`));
  const [diff, nor, arm, disp] = await Promise.all([get("Diffuse"), get("nor_gl"), get("arm"), get("Displacement")]);
  const out = (s) => path.join(OUT, "textures", `${name}_${s}.webp`);
  await sharp(diff).resize(size, size).webp({ quality: 86, effort: 6 }).toFile(out("color"));
  await sharp(nor).resize(size, size).webp({ quality: 80, effort: 6 }).toFile(out("normal"));
  // Pack AO (arm.R), roughness (arm.G) and height (displacement) into one texture.
  const ds = dataSize;
  const a = await sharp(arm).resize(ds, ds).removeAlpha().raw().toBuffer();
  const d = await sharp(disp).resize(ds, ds).greyscale().raw().toBuffer();
  const packed = Buffer.alloc(ds * ds * 3);
  for (let i = 0, n = ds * ds; i < n; i++) {
    packed[i * 3] = a[i * 3];
    packed[i * 3 + 1] = a[i * 3 + 1];
    packed[i * 3 + 2] = d[i];
  }
  await sharp(packed, { raw: { width: ds, height: ds, channels: 3 } }).webp({ quality: 86, effort: 6 }).toFile(out("data"));
  const kb = ["color", "normal", "data"].map((s) => Math.round(fs.statSync(out(s)).size / 1024));
  console.log(`texture ${name.padEnd(8)} ${kb.join(" + ")} KB`);
}

async function buildModel({ id, name, ratio, separate = false }) {
  const f = await files(id);
  const g = f.gltf["1k"].gltf;
  const dir = path.join(SRC, id);
  const main = await fetchTo(g.url, path.join(dir, path.basename(g.url)));
  await Promise.all(Object.entries(g.include).map(([rel, v]) => fetchTo(v.url, path.join(dir, rel))));

  await MeshoptEncoder.ready;
  await MeshoptSimplifier.ready;
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.encoder": MeshoptEncoder });
  const doc = await io.read(main);
  const before = countTris(doc);
  const ops = separate ? [dedup(), weld()] : [dedup(), flatten(), join(), weld()];
  if (ratio < 1) ops.push(simplify({ simplifier: MeshoptSimplifier, ratio, error: 0.002 }));
  ops.push(
    resample(),
    prune(),
    textureCompress({ encoder: sharp, targetFormat: "webp", resize: [1024, 1024], quality: 85 }),
    quantize(),
    meshopt({ encoder: MeshoptEncoder, level: "medium" })
  );
  await doc.transform(...ops);
  const outFile = path.join(OUT, "models", `${name}.glb`);
  await io.write(outFile, doc);
  console.log(`model   ${name.padEnd(12)} ${before} → ${countTris(doc)} tris, ${Math.round(fs.statSync(outFile).size / 1024)} KB`);
}

function countTris(doc) {
  let t = 0;
  for (const mesh of doc.getRoot().listMeshes())
    for (const prim of mesh.listPrimitives()) {
      const idx = prim.getIndices();
      t += idx ? idx.getCount() / 3 : prim.getAttribute("POSITION").getCount() / 3;
    }
  return Math.round(t);
}

for (const t of TEXTURES) if (!only || only.includes(t.name)) await buildTexture(t);
for (const m of MODELS) if (!only || only.includes(m.name)) await buildModel(m);
