import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Collapse a hand-built group of static meshes into one mesh per material.
 * Hundreds of small parts (booths, trophies, posts, rafters …) become a
 * handful of draw calls — in the main pass and in the shadow pass.
 *
 * Objects for which `keep` returns true (animated parts, lines, unique-texture
 * signs, invisible hit targets) are left as they are, re-parented with their
 * world transform intact.
 */
export function mergeStatic(root: THREE.Object3D, keep: (o: THREE.Object3D) => boolean = () => false) {
  root.updateMatrixWorld(true);
  const groups = new Map<THREE.Material, { geos: THREE.BufferGeometry[]; cast: boolean }>();
  const kept: THREE.Object3D[] = [];
  const visit = (o: THREE.Object3D) => {
    if (o !== root && keep(o)) {
      kept.push(o);
      return;
    }
    if (o instanceof THREE.Mesh && !(o instanceof THREE.InstancedMesh) && !Array.isArray(o.material)) {
      let g = (o.geometry as THREE.BufferGeometry).clone();
      if (g.index) g = g.toNonIndexed();
      for (const name of Object.keys(g.attributes)) if (!["position", "normal", "uv"].includes(name)) g.deleteAttribute(name);
      if (!g.attributes.uv) g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
      if (!g.attributes.normal) g.computeVertexNormals();
      g.applyMatrix4(o.matrixWorld);
      const entry = groups.get(o.material) ?? { geos: [], cast: false };
      entry.geos.push(g);
      entry.cast ||= o.castShadow;
      groups.set(o.material, entry);
    }
    for (const c of [...o.children]) visit(c);
  };
  visit(root);
  const out = new THREE.Group();
  for (const [mat, { geos, cast }] of groups) {
    const merged = mergeGeometries(geos);
    geos.forEach((g) => g.dispose());
    if (!merged) continue;
    merged.computeBoundingSphere();
    const m = new THREE.Mesh(merged, mat);
    m.castShadow = cast;
    m.receiveShadow = true;
    out.add(m);
  }
  for (const k of kept) {
    k.updateMatrixWorld(true);
    const world = k.matrixWorld.clone();
    k.removeFromParent();
    world.decompose(k.position, k.quaternion, k.scale);
    out.add(k);
  }
  return out;
}

/** An invisible box round an object, for picking after its meshes are merged away. */
export function hitBox(o: THREE.Object3D, id: string, pad = 0.15) {
  const box = new THREE.Box3().setFromObject(o);
  const size = box.getSize(new THREE.Vector3()).addScalar(pad * 2);
  const center = box.getCenter(new THREE.Vector3());
  const m = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), HIT_MATERIAL);
  m.position.copy(center);
  m.userData.id = id;
  m.userData.hit = true;
  return m;
}

export const HIT_MATERIAL = new THREE.MeshBasicMaterial({ visible: false });
