// Sanity checks for the world's geography: heights along the trail, river and valley.
// Run: node --no-warnings --import ./scripts/ts-hooks.mjs scripts/check-terrain.ts
import { terrainHeight, pathPoint, riverInfo, CAMP, TREE, LAKE, WATER_LEVEL, waystonePosition, WAYSTONES, PATH_CURVE } from "@/lib/world/layout";

const t0 = performance.now();
let nan = 0;
for (let i = 0; i < 200000; i++) {
  const h = terrainHeight(Math.random() * 3200 - 1600, Math.random() * 3000 - 2600);
  if (!Number.isFinite(h)) nan++;
}
console.log(`200k samples in ${(performance.now() - t0).toFixed(0)} ms, NaN: ${nan}`);
console.log("camp", CAMP.toArray().map((v) => v.toFixed(2)).join(", "));
console.log("lake centre h", terrainHeight(LAKE.x, LAKE.z).toFixed(2), "water", WATER_LEVEL);
console.log("tree base h", terrainHeight(TREE.x + 60, TREE.z + 60).toFixed(2));
for (let t = 0; t <= 1.0001; t += 0.1) {
  const p = pathPoint(t);
  const r = riverInfo(p.x, p.z);
  console.log(`path t=${t.toFixed(1)} (${p.x.toFixed(0)}, ${p.y.toFixed(2)}, ${p.z.toFixed(0)}) river dist ${r.dist.toFixed(1)}`);
}
console.log("path length", PATH_CURVE.getLength().toFixed(0));
WAYSTONES.forEach((w, i) => console.log("waystone", w.word, waystonePosition(i).toArray().map((v) => v.toFixed(1)).join(", ")));
for (const x of [-600, -300, -150, 0, 150, 300, 600]) console.log(`valley x=${x}: z=-100 ${terrainHeight(x, -100).toFixed(1)}  z=-500 ${terrainHeight(x, -500).toFixed(1)}  z=-1500 ${terrainHeight(x, -1500).toFixed(1)}`);
