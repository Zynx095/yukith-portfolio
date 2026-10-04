// Generates the World Tree in Node and validates it: timing, sizes, NaNs, wall thickness, slot positions.
import { generateWorldTree, outerRadius, innerRadius, cavityAt, ARCHIVE_SLOTS, slotPosition, ENTRANCE, archField } from "@/lib/world/tree";

const t0 = performance.now();
const tree = generateWorldTree();
console.log("gen ms", (performance.now() - t0).toFixed(0));
const stat = (name: string, g: any) => {
  const p = g.getAttribute("position");
  const idx = g.getIndex();
  let nan = 0;
  for (let i = 0; i < p.array.length; i++) if (!Number.isFinite(p.array[i])) nan++;
  const n = g.getAttribute("normal");
  let badN = 0;
  if (n) for (let i = 0; i < n.count; i++) if (!(Math.hypot(n.getX(i), n.getY(i), n.getZ(i)) > 0.5)) badN++;
  g.computeBoundingBox();
  const bb = g.boundingBox;
  const fmt = (v: any) => v.toArray().map((x: number) => x.toFixed(0)).join(",");
  console.log(name.padEnd(10), "verts", p.count, "tris", (idx ? idx.count : p.count) / 3, "nan", nan, "badN", badN, "bbox", fmt(bb.min), "→", fmt(bb.max));
};
stat("outer", tree.outerShell);
stat("inner", tree.innerShell);
stat("rim", tree.crownRim);
stat("tunnel", tree.tunnel);
const sum = (gs: any[]) => gs.reduce((a, g) => [a[0] + g.getAttribute("position").count, a[1] + g.getIndex().count / 3], [0, 0]);
console.log("roots", tree.roots.length, sum(tree.roots));
tree.branches.forEach((lv: any[], i: number) => console.log("branches L" + i, lv.length, sum(lv)));
console.log("interior", tree.interior.length, sum(tree.interior));
console.log("anchors", tree.anchors.length);
for (const y of [0, 12, 44, 92, 140, 172, 220, 280, 330]) {
  let minWall = 1e9, minR = 1e9, maxR = 0;
  for (let k = 0; k < 360; k++) {
    const th = (k / 360) * Math.PI * 2;
    const o = outerRadius(th, y);
    const i = innerRadius(th, y, o);
    minWall = Math.min(minWall, o - i);
    minR = Math.min(minR, o);
    maxR = Math.max(maxR, o);
  }
  console.log(`y=${y}`.padEnd(6), "outer", minR.toFixed(1), "-", maxR.toFixed(1), "minWall", minWall.toFixed(2), "cavity r", cavityAt(y).radius.toFixed(1));
}
for (const s of ARCHIVE_SLOTS) console.log(s.id.padEnd(17), s.mount.padEnd(9), slotPosition(s).toArray().map((v: number) => v.toFixed(1)).join(", "));
console.log("arch apex field", archField(0.5, ENTRANCE.height).toFixed(3));
