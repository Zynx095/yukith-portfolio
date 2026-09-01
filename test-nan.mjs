import * as THREE from 'three';

function seededRandom(seed) {
  return function() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

try {
  // Test WorldTree foliageGeo
  const geo = new THREE.BufferGeometry();
  const size = 25;
  const half = size / 2;
  const positions = new Float32Array([
    -half, -half, 0,  half, -half, 0, -half,  half, 0,  half,  half, 0,
    0, -half, -half, 0, -half,  half, 0,  half, -half, 0,  half,  half,
  ]);
  const normals = new Float32Array([
    0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
    1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
  ]);
  const uvs = new Float32Array([
    0, 0, 1, 0, 0, 1, 1, 1,
    0, 0, 1, 0, 0, 1, 1, 1,
  ]);
  const indices = [
    0, 1, 2, 2, 1, 3,
    4, 5, 6, 6, 5, 7,
  ];
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.rotateX(Math.PI / 8);
  geo.rotateZ(Math.PI / 8);
  geo.computeBoundingSphere();
  if (Number.isNaN(geo.boundingSphere.radius)) console.log("NaN in foliageGeo!");

  // Test Trunk
  const rng = seededRandom(111);
  const points = [];
  const height = 180;
  const steps = 20;
  const angle = rng() * Math.PI * 2;
  for (let j = 0; j <= steps; j++) {
    const t = j / steps; 
    const y = t * height;
    const radius = Math.max(3, (1 - t) * 18 + rng() * 6);
    const twist = angle + t * Math.PI * 1.2; 
    const x = Math.cos(twist) * radius;
    const z = Math.sin(twist) * radius;
    const noiseX = (rng() - 0.5) * 5 * (1 - t);
    const noiseZ = (rng() - 0.5) * 5 * (1 - t);
    points.push(new THREE.Vector3(x + noiseX, y, z + noiseZ));
  }
  const curve = new THREE.CatmullRomCurve3(points);
  const trunkGeo = new THREE.TubeGeometry(curve, 64, 18, 16, false);
  trunkGeo.computeBoundingSphere();
  if (Number.isNaN(trunkGeo.boundingSphere.radius)) console.log("NaN in trunkGeo!");

  // Test Roots
  const rng2 = seededRandom(222);
  const rootCount = 18;
  for (let i = 0; i < rootCount; i++) {
    const angle = (i / rootCount) * Math.PI * 2 + (rng2() - 0.5) * 0.5;
    const length = 60 + rng2() * 100;
    const rise = 12 + rng2() * 8;
    const pts = [
      new THREE.Vector3(Math.cos(angle)*8, rise, Math.sin(angle)*8),
      new THREE.Vector3(Math.cos(angle) * length * 0.3, rise * 0.8, Math.sin(angle) * length * 0.3),
      new THREE.Vector3(Math.cos(angle) * length * 0.6 + (rng2()-0.5)*15, -1, Math.sin(angle) * length * 0.6 + (rng2()-0.5)*15),
      new THREE.Vector3(Math.cos(angle) * length + (rng2()-0.5)*30, -8, Math.sin(angle) * length + (rng2()-0.5)*30),
    ];
    const c = new THREE.CatmullRomCurve3(pts);
    const g = new THREE.TubeGeometry(c, 16, 6 + rng2() * 4, 8, false);
    g.computeBoundingSphere();
    if (Number.isNaN(g.boundingSphere.radius)) console.log("NaN in rootGeo", i);
  }

  // Test Branches
  const rng3 = seededRandom(888);
  const primaryCount = 30;
  const trunkHeight = 160;
  for (let i = 0; i < primaryCount; i++) {
    const yStart = 80 + rng3() * (trunkHeight - 80);
    const angle = rng3() * Math.PI * 2;
    const length = 150 + rng3() * 150; 
    const upAngle = 0.3 + rng3() * 0.5;
    const pts = [];
    let currentPos = new THREE.Vector3(Math.cos(angle) * 10, yStart, Math.sin(angle) * 10);
    pts.push(currentPos.clone());
    let currentAngle = angle;
    let currentUp = upAngle;
    for(let j=1; j<=5; j++) {
      const segLen = length / 5;
      currentAngle += (rng3() - 0.5) * 0.6;
      currentUp -= 0.15; 
      currentPos.x += Math.cos(currentAngle) * segLen;
      currentPos.y += Math.sin(currentUp) * segLen;
      currentPos.z += Math.sin(currentAngle) * segLen;
      pts.push(currentPos.clone());
    }
    const c = new THREE.CatmullRomCurve3(pts);
    const thickness = 2.5 + (1 - yStart/trunkHeight) * 4; 
    const g = new THREE.TubeGeometry(c, 24, thickness, 8, false);
    g.computeBoundingSphere();
    if (Number.isNaN(g.boundingSphere.radius)) console.log("NaN in branchGeo", i);
  }

  // Test Birds
  const birdGeo = new THREE.BufferGeometry();
  const birdVerts = new Float32Array([0,0,1, -1,0,-1, 1,0,-1, 0,0,-0.5]);
  const birdInd = [0,1,3, 0,3,2];
  birdGeo.setAttribute("position", new THREE.BufferAttribute(birdVerts, 3));
  birdGeo.setIndex(birdInd);
  birdGeo.computeVertexNormals();
  birdGeo.computeBoundingSphere();
  if (Number.isNaN(birdGeo.boundingSphere.radius)) console.log("NaN in birdGeo!");

  console.log("Tests complete!");
} catch (e) {
  console.error("Error:", e.message);
}
