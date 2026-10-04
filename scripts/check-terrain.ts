import { terrainHeight, WATERFALL, CAMP, TREE, plateauSigned, riverInfo, lakeDistance, WATER_LEVEL } from "@/lib/world/layout";
const t0 = performance.now();
let n = 0; for (let i = 0; i < 20000; i++) { terrainHeight(Math.random()*400-200, Math.random()*-500); n++; }
console.log("ms per 20k samples:", (performance.now()-t0).toFixed(1));
console.log("CAMP", CAMP.toArray().map(v=>+v.toFixed(2)));
console.log("LIP", WATERFALL.lip.toArray().map(v=>+v.toFixed(2)), "POOL", WATERFALL.pool.toArray().map(v=>+v.toFixed(2)), "normal", WATERFALL.normal.toArray().map(v=>+v.toFixed(2)));
const pts = { camp: [7,-15], lakeC: [-17,-31], riverMid: [-35,-82], pool: [WATERFALL.pool.x, WATERFALL.pool.z], valley1: [0,-200], valley2: [4,-300], treeBase: [0,-420], beyondTree:[0,-520], start:[14,16] };
for (const [k,[x,z]] of Object.entries(pts)) console.log(k.padEnd(10), "h=", terrainHeight(x,z).toFixed(2), "ps=", plateauSigned(x,z).toFixed(1), "river=", riverInfo(x,z).dist.toFixed(1), "lake=", lakeDistance(x,z).toFixed(2));
// profile across valley at a few z
for (const z of [-20, -80, -120, -160, -220, -300, -380]) {
  const row = []; for (let x = -120; x <= 120; x += 15) row.push(terrainHeight(x, z).toFixed(0).padStart(4));
  console.log(("z="+z).padEnd(7), row.join(""));
}
