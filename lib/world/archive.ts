import * as THREE from "three";
import { FEATURED, type Project } from "@/src/data/projects";
import { ARCHIVE_SLOTS, HALL_FLOOR, spine, slotPosition, type ArchiveSlot } from "./tree";
import { TREE } from "./layout";

/**
 * The archive hall: which project stands in which alcove, and where things are
 * in world space. Every word shown about a relic comes from src/data/projects.
 */

export interface RelicPlacement {
  project: Project;
  slot: ArchiveSlot;
  /** World position of the plinth top (the relic stands above it). */
  base: THREE.Vector3;
  /** World position of the relic's visual centre. */
  center: THREE.Vector3;
  /** Unit vector from the relic towards the hall's axis (the way it faces). */
  facing: THREE.Vector3;
}

/** Height of the plinth above the alcove floor. */
export const PLINTH_HEIGHT = 1.3;
/** Height of a relic's centre above its plinth. */
export const RELIC_LIFT = 2.1;
/** Rough radius of a relic (for label placement and focus framing). */
export const RELIC_RADIUS = 1.6;

const toWorld = (v: THREE.Vector3) => v.add(new THREE.Vector3(TREE.x, TREE.y, TREE.z));

/** World position of the hall's axis at local height y. */
export function hallAxis(localY: number, out = new THREE.Vector3()) {
  const sp = spine(localY);
  return out.set(TREE.x + sp.x, TREE.y + localY, TREE.z + sp.y);
}

export const HALL_CENTER = hallAxis(HALL_FLOOR);

export const ARCHIVE: RelicPlacement[] = FEATURED.slice(0, ARCHIVE_SLOTS.length).map((project, i) => {
  const slot = ARCHIVE_SLOTS[i];
  const floor = toWorld(slotPosition(slot));
  const base = floor.clone().add(new THREE.Vector3(0, PLINTH_HEIGHT, 0));
  const center = base.clone().add(new THREE.Vector3(0, RELIC_LIFT, 0));
  const facing = HALL_CENTER.clone().sub(center).setY(0).normalize();
  return { project, slot, base, center, facing };
});

export const archiveIndexOf = (id: string) => ARCHIVE.findIndex((a) => a.project.id === id);
