import * as THREE from "three";
import { DISTRICT_SITE, TREE, terrainHeight } from "./layout";
import { poseAt } from "./journey";
import { treeSkeleton } from "./tree";
import { REGION_SLOTS, type RegionId } from "./chapters";
import { EVENT_ORGANISING, EVENT_PARTICIPATION, EVENT_RESULTS } from "@/src/data/events";
import { VOLUMES } from "@/src/data/library";

/**
 * Where the three inserted regions are, what stands in them, and the camera's
 * path through each (region time t ∈ 0..1).
 *
 *   district — an open-air exhibition in a clearing beside the trail
 *   arena    — a sealed hall away from the valley (entered through a gate)
 *   library  — a reading cabin on the World Tree's longest limb
 */

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const ground = (x: number, z: number) => terrainHeight(x, z);

export interface RegionStop {
  t: number;
  pos: THREE.Vector3;
  look: THREE.Vector3;
  fov: number;
  /** The exhibit framed by this stop (focus label, click target). */
  focus?: string;
}

export interface Exhibit {
  id: string;
  /** World position of its visual centre. */
  center: THREE.Vector3;
  /** Rough radius (label placement). */
  radius: number;
}

// ─── The hackathon district ─────────────────────────────────────────────────

export const DISTRICT = (() => {
  const c = V(DISTRICT_SITE.x, 0, DISTRICT_SITE.z);
  c.y = ground(c.x, c.z);
  // The clearing opens towards the trail (west-north-west).
  const entrance = Math.atan2(-469 - c.z, 57 - c.x);
  return { center: c, entrance, ringRadius: 27, pavilionRadius: 8.5 };
})();

const onDistrict = (theta: number, r: number, lift = 0) => {
  const x = DISTRICT.center.x + Math.cos(theta) * r;
  const z = DISTRICT.center.z + Math.sin(theta) * r;
  return V(x, ground(x, z) + lift, z);
};

/** Results stand under the pavilion; organising roles at the gate; participation round the ring. */
export const DISTRICT_EXHIBITS = (() => {
  const out: { id: string; base: THREE.Vector3; facing: number; zone: "trophy" | "gate" | "ring" }[] = [];
  const e = DISTRICT.entrance;
  // Trophies: an arc on the far half of the pavilion, facing the gate.
  EVENT_RESULTS.forEach((ev, i) => {
    const th = e + Math.PI + (i - (EVENT_RESULTS.length - 1) / 2) * 0.42;
    out.push({ id: ev.id, base: onDistrict(th, 4.6), facing: th + Math.PI, zone: "trophy" });
  });
  // Gate: the two organising roles flank the entrance.
  EVENT_ORGANISING.forEach((ev, i) => {
    const th = e + (i ? 0.2 : -0.2);
    out.push({ id: ev.id, base: onDistrict(th, DISTRICT.ringRadius + 3), facing: th + Math.PI, zone: "gate" });
  });
  // The ring: participation, all the way round except the gate.
  const n = EVENT_PARTICIPATION.length;
  EVENT_PARTICIPATION.forEach((ev, i) => {
    const th = e + 0.62 + (i * (Math.PI * 2 - 1.24)) / (n - 1);
    out.push({ id: ev.id, base: onDistrict(th, DISTRICT.ringRadius), facing: th + Math.PI, zone: "ring" });
  });
  return out;
})();

/** The arena's gate stands at the back of the clearing. */
export const ARENA_GATE = (() => {
  const th = DISTRICT.entrance + Math.PI;
  const p = onDistrict(th, DISTRICT.ringRadius + 12);
  return { position: p, facing: th + Math.PI };
})();

// ─── The arena (a sealed hall, far below the valley) ────────────────────────

export const ARENA = { origin: V(0, -420, -300), halfW: 24, halfD: 18, height: 15 };
const A = (x: number, y: number, z: number) => V(ARENA.origin.x + x, ARENA.origin.y + y, ARENA.origin.z + z);

export const ARENA_SPOTS = {
  stage: A(0, 0, -1),
  amd: A(0, 1.6, 4.2),
  valorant: A(0, 3.6, -15.4),
  csgo: A(-15.6, 3.6, -9.5),
  mlbb: A(15.6, 3.6, -9.5),
  wall: A(-23.3, 4.5, 4),
  booth: A(18.5, 1.5, 8),
};

// ─── The library (a cabin on the longest limb) ──────────────────────────────

export const LIBRARY = (() => {
  const limb = treeSkeleton().tubes.find((t) => t.level === 0)!;
  const i = Math.floor(0.25 * (limb.pts.length - 1));
  const p = limb.pts[i];
  const d = limb.pts[i + 1].clone().sub(limb.pts[i - 1]).setY(0).normalize();
  // The deck stands on posts just clear of the bark's crest (bumps included).
  const floorY = TREE.y + p.y + limb.radii[i] * 1.12 + 0.6;
  const origin = V(TREE.x + p.x, floorY, TREE.z + p.z);
  const forward = d; // along the limb, away from the trunk
  const side = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), forward).normalize();
  // The window side is the one that looks back down the valley (towards +z).
  const window = side.z > 0 ? side.clone() : side.clone().negate();
  return { origin, forward, side: window, length: 10, width: 7, height: 4.6 };
})();

/** A point in the cabin's frame: x along the limb, y up, z towards the windows. */
export const L = (x: number, y: number, z: number) =>
  LIBRARY.origin.clone().addScaledVector(LIBRARY.forward, x).add(V(0, y, 0)).addScaledVector(LIBRARY.side, z);

export const LIBRARY_SHELVES = (() => {
  // Volumes in the order the camera visits them.
  const order = ["lib-lookism", "lib-jjk", "lib-bleach", "lib-tomodachi", "lib-dark", "lib-elden", "lib-writing", "lib-rnb"];
  const spots: Record<string, THREE.Vector3> = {
    "lib-lookism": L(-3.2, 1.7, -3.0),
    "lib-jjk": L(-1.0, 1.7, -3.0),
    "lib-bleach": L(1.0, 1.7, -3.0),
    "lib-tomodachi": L(2.8, 1.7, -3.0),
    "lib-dark": L(4.45, 1.65, -2.3),
    "lib-elden": L(4.45, 1.65, -0.6),
    "lib-writing": L(-3.6, 1.0, 2.2),
    "lib-rnb": L(2.6, 1.05, 2.4),
  };
  return order.filter((id) => VOLUMES.some((v) => v.id === id)).map((id) => ({ id, center: spots[id] }));
})();

// ─── Exhibits (focus targets) ───────────────────────────────────────────────

export const EXHIBITS: Exhibit[] = [
  ...DISTRICT_EXHIBITS.map((e) => ({ id: e.id, center: e.base.clone().add(V(0, e.zone === "gate" ? 2.6 : 1.9, 0)), radius: e.zone === "gate" ? 1.6 : 1.1 })),
  { id: "amd-valorant", center: ARENA_SPOTS.amd, radius: 1.2 },
  { id: "valorant-rank", center: ARENA_SPOTS.valorant, radius: 2.6 },
  { id: "csgo-rank", center: ARENA_SPOTS.csgo, radius: 2.6 },
  { id: "mlbb-rank", center: ARENA_SPOTS.mlbb, radius: 2.6 },
  { id: "school-valorant", center: ARENA_SPOTS.wall.clone().add(V(0, 0, 4.5)), radius: 1.6 },
  { id: "college-valorant", center: ARENA_SPOTS.wall.clone().add(V(0, 0, -1.5)), radius: 1.6 },
  { id: "aim", center: ARENA_SPOTS.booth.clone().add(V(0, 1.2, 0)), radius: 1 },
  ...LIBRARY_SHELVES.map((s) => ({ id: s.id, center: s.center, radius: 0.7 })),
];
export const exhibitById = (id: string) => EXHIBITS.find((e) => e.id === id);

// ─── Camera paths ───────────────────────────────────────────────────────────

/** A camera standing `dist` from an exhibit, in front of it (towards `from`), at `lift`. */
function framing(target: THREE.Vector3, from: THREE.Vector3, dist: number, lift: number, side = 0) {
  const dir = from.clone().sub(target).setY(0).normalize();
  const right = new THREE.Vector3(-dir.z, 0, dir.x);
  return target.clone().addScaledVector(dir, dist).addScaledVector(right, side).add(V(0, lift, 0));
}

function districtStops(): RegionStop[] {
  const c = DISTRICT.center;
  const start = new THREE.Vector3();
  const startLook = new THREE.Vector3();
  const fov0 = poseAt(REGION_SLOTS[0].at, start, startLook);
  const gate = onDistrict(DISTRICT.entrance, DISTRICT.ringRadius + 9, 2.4);
  const stops: RegionStop[] = [
    { t: 0, pos: start, look: startLook, fov: fov0 },
    { t: 0.07, pos: onDistrict(DISTRICT.entrance, DISTRICT.ringRadius + 22, 5), look: c.clone().add(V(0, 3, 0)), fov: 50 },
    { t: 0.14, pos: gate, look: c.clone().add(V(0, 2.5, 0)), fov: 52 },
  ];
  // Trophies under the pavilion.
  const trophies = DISTRICT_EXHIBITS.filter((e) => e.zone === "trophy");
  trophies.forEach((e, i) => {
    const target = e.base.clone().add(V(0, 1.6, 0));
    stops.push({ t: 0.22 + i * 0.065, pos: framing(target, gate, 4.2, 0.7, 0.4), look: target, fov: 44, focus: e.id });
  });
  // The gate's organising banners, seen from inside the ring.
  const gates = DISTRICT_EXHIBITS.filter((e) => e.zone === "gate");
  gates.forEach((e, i) => {
    const target = e.base.clone().add(V(0, 2.6, 0));
    // Stand between the gate posts, not behind one.
    stops.push({ t: 0.56 + i * 0.06, pos: framing(target, c, 6.5, 0.2, i ? 1.6 : -1.6), look: target, fov: 46, focus: e.id });
  });
  // Round the ring, one exhibit at a time, looking outwards from the plaza.
  const ring = DISTRICT_EXHIBITS.filter((e) => e.zone === "ring");
  const t0 = 0.7;
  const t1 = 0.95;
  ring.forEach((e, i) => {
    const target = e.base.clone().add(V(0, 1.4, 0));
    stops.push({ t: t0 + (i * (t1 - t0)) / Math.max(1, ring.length - 1), pos: framing(target, c, 4.6, 0.9), look: target, fov: 46, focus: e.id });
  });
  // Last: the arena's gate.
  const g = ARENA_GATE.position;
  stops.push({ t: 1, pos: framing(g.clone().add(V(0, 4, 0)), c, 14, 0.5), look: g.clone().add(V(0, 5, 0)), fov: 50 });
  return stops;
}

function arenaStops(): RegionStop[] {
  const s = ARENA_SPOTS;
  return [
    { t: 0, pos: A(0, 6.5, 17), look: A(0, 4, -6), fov: 58 },
    { t: 0.1, pos: A(0, 4.5, 12), look: A(0, 6.5, -2), fov: 56 },
    { t: 0.21, pos: A(1.2, 2.6, 9.4), look: s.amd, fov: 44, focus: "amd-valorant" },
    { t: 0.36, pos: A(0, 3.2, -6.5), look: s.valorant, fov: 48, focus: "valorant-rank" },
    { t: 0.49, pos: A(-8, 3.2, -4.8), look: s.csgo, fov: 48, focus: "csgo-rank" },
    { t: 0.62, pos: A(8, 3.2, -4.8), look: s.mlbb, fov: 48, focus: "mlbb-rank" },
    { t: 0.73, pos: A(-15, 3.8, 8.5), look: s.wall.clone().add(V(0, 0, 4.5)), fov: 48, focus: "school-valorant" },
    { t: 0.81, pos: A(-15, 3.8, 2.5), look: s.wall.clone().add(V(0, 0, -1.5)), fov: 48, focus: "college-valorant" },
    { t: 0.91, pos: A(13.5, 2.3, 10.5), look: s.booth.clone().add(V(0, 1.1, 0)), fov: 46, focus: "aim" },
    { t: 1, pos: A(6, 5.5, 15), look: A(0, 4, -4), fov: 56 },
  ];
}

function libraryStops(): RegionStop[] {
  const shelf = Object.fromEntries(LIBRARY_SHELVES.map((s) => [s.id, s.center]));
  const out: RegionStop[] = [
    // Outside on the limb at night: the cabin's lit windows, the trunk beyond.
    { t: 0, pos: L(9, 2.5, 16), look: L(-1, 2.2, 0), fov: 52 },
    { t: 0.14, pos: L(5, 1.6, 12), look: L(-1, 2.4, 0), fov: 52 },
    { t: 0.24, pos: L(8, 1.7, 2.0), look: L(-2, 1.7, 0.6), fov: 56 },
    { t: 0.32, pos: L(3.4, 1.75, 1.6), look: L(-3, 1.6, -1.6), fov: 60 },
  ];
  const visit: [string, number, THREE.Vector3][] = [
    ["lib-lookism", 0.41, L(-3.2, 1.65, -0.6)],
    ["lib-jjk", 0.48, L(-1.0, 1.65, -0.6)],
    ["lib-bleach", 0.55, L(1.0, 1.65, -0.6)],
    ["lib-tomodachi", 0.62, L(2.6, 1.65, -0.6)],
    ["lib-dark", 0.69, L(1.7, 1.6, -1.9)],
    ["lib-elden", 0.76, L(1.7, 1.6, -0.2)],
    ["lib-writing", 0.83, L(-1.6, 1.55, 0.6)],
    ["lib-rnb", 0.9, L(0.6, 1.5, 0.8)],
  ];
  for (const [id, t, pos] of visit) if (shelf[id]) out.push({ t, pos, look: shelf[id], fov: 50, focus: id });
  // The window seat: looking out over the valley at night.
  out.push({ t: 1, pos: L(-0.5, 1.4, 1.4), look: L(-0.5, 3.5, 30), fov: 58 });
  return out;
}

// ─── Pose along a region path (monotone, C1 — same scheme as the story path) ─

interface Path {
  stops: RegionStop[];
  pos: THREE.CatmullRomCurve3;
  look: THREE.CatmullRomCurve3;
  xs: number[];
}

const makePath = (stops: RegionStop[]): Path => ({
  stops,
  pos: new THREE.CatmullRomCurve3(stops.map((s) => s.pos), false, "centripetal"),
  look: new THREE.CatmullRomCurve3(stops.map((s) => s.look), false, "centripetal"),
  xs: stops.map((s) => s.t),
});

export const REGION_PATHS: Record<RegionId, Path> = {
  district: makePath(districtStops()),
  arena: makePath(arenaStops()),
  library: makePath(libraryStops()),
};

/** Stops that frame an exhibit, per region. */
export const REGION_FOCUS = Object.fromEntries(
  (Object.keys(REGION_PATHS) as RegionId[]).map((id) => [id, REGION_PATHS[id].stops.filter((s) => s.focus)])
) as Record<RegionId, RegionStop[]>;

/** Camera pose at region time t; returns the field of view. */
export function regionPose(id: RegionId, t: number, pos: THREE.Vector3, look: THREE.Vector3) {
  const path = REGION_PATHS[id];
  const xs = path.xs;
  const n = xs.length;
  let i = 0;
  while (i < n - 2 && t > xs[i + 1]) i++;
  const f = THREE.MathUtils.clamp((t - xs[i]) / Math.max(1e-6, xs[i + 1] - xs[i]), 0, 1);
  // Ease within each segment so the camera settles at every stop.
  const e = f * f * (3 - 2 * f);
  const u = (i + e) / (n - 1);
  path.pos.getPoint(u, pos);
  path.look.getPoint(u, look);
  return THREE.MathUtils.lerp(path.stops[i].fov, path.stops[i + 1].fov, e);
}
