import { buildCliff } from "@/lib/world/cliff";

const t0 = performance.now();
const { geometry, talus } = buildCliff();
const ms = performance.now() - t0;
const pos = geometry.getAttribute("position");
let nan = 0;
for (let i = 0; i < pos.count * 3; i++) if (!Number.isFinite((pos.array as Float32Array)[i])) nan++;
geometry.computeBoundingBox();
const b = geometry.boundingBox!;
console.log(`cliff ${ms.toFixed(0)} ms, verts ${pos.count}, tris ${(geometry.index?.count ?? 0) / 3}, nan ${nan}, talus ${talus.length}`);
console.log(`bbox ${b.min.x.toFixed(1)},${b.min.y.toFixed(1)},${b.min.z.toFixed(1)} -> ${b.max.x.toFixed(1)},${b.max.y.toFixed(1)},${b.max.z.toFixed(1)}`);
