import * as THREE from 'three';

const pathCurve = (() => {
  const points = [
    new THREE.Vector3(0, 0, 10),
    new THREE.Vector3(3, 0, -20),
    new THREE.Vector3(-2, 0, -50),
    new THREE.Vector3(5, 0, -80),
    new THREE.Vector3(-3, 0, -110),
    new THREE.Vector3(8, 0, -140),
    new THREE.Vector3(-5, 0, -170),
    new THREE.Vector3(2, 0, -200),
    new THREE.Vector3(-8, 0, -230),
    new THREE.Vector3(4, 0, -260),
    new THREE.Vector3(-3, 0, -290),
    new THREE.Vector3(6, 0, -320),
    new THREE.Vector3(-2, 0, -350),
    new THREE.Vector3(0, 0, -380),
    new THREE.Vector3(-5, 0, -410),
    new THREE.Vector3(3, 0, -430),
    new THREE.Vector3(0, 0, -450),
  ];
  return new THREE.CatmullRomCurve3(points);
})();

const segments = 200;
const width = 8;
const points = pathCurve.getSpacedPoints(segments);

const vertices = [];
const indices = [];
const uvs = [];

let foundNaN = false;

for (let i = 0; i <= segments; i++) {
  const point = points[i];
  const tangent = pathCurve.getTangentAt(i / segments);
  const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
  
  if (Number.isNaN(normal.x)) {
    console.log("NaN normal at segment", i, "tangent:", tangent);
    foundNaN = true;
  }
  
  const left = point.clone().add(normal.clone().multiplyScalar(width / 2));
  const right = point.clone().add(normal.clone().multiplyScalar(-width / 2));
  
  vertices.push(left.x, left.y, left.z);
  vertices.push(right.x, right.y, right.z);
  uvs.push(0, i / segments * 10);
  uvs.push(1, i / segments * 10);
  
  if (i < segments) {
    const base = i * 2;
    indices.push(base, base + 1, base + 2);
    indices.push(base + 1, base + 3, base + 2);
  }
}

const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
geo.setIndex(indices);
geo.computeVertexNormals();
geo.computeBoundingSphere();
if (Number.isNaN(geo.boundingSphere.radius)) {
  console.log("NaN in Path geo!");
  foundNaN = true;
}

if (!foundNaN) console.log("Path passed without NaNs.");
