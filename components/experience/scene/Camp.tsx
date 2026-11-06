"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { CAMP, terrainHeight } from "@/lib/world/layout";
import { createBarkMaterial, shared } from "@/lib/world/materials";
import { createRng, range } from "@/lib/world/noise";
import { frame, ui } from "@/lib/world/store";
import { CAMPFIRE } from "./Atmosphere";
import { Glows, type GlowPoint } from "./Glows";
import { useWorld } from "./WorldContext";

/**
 * Home: a camp by the lake where the journey starts. Family is present through
 * the place itself — the fire, the chairs pulled up to it, string lights over
 * the tent — and through Bella, who is happy to chase a stick if you click her.
 * The small things on the blanket stand for what Yukith does off the clock:
 * games, manga and manhwa, writing, music.
 */

const ground = (x: number, z: number) => terrainHeight(CAMP.x + x, CAMP.z + z) - CAMP.y;

function createFlameMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: { uTime: shared.uTime },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      varying vec2 vUv;
      float h(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
      float n(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
      void main() {
        vec2 uv = vUv;
        float t = uTime * 2.2;
        float turb = n(vec2(uv.x * 5.0, uv.y * 3.0 - t)) * 0.6 + n(vec2(uv.x * 11.0, uv.y * 7.0 - t * 1.7)) * 0.4;
        float width = (1.0 - uv.y) * 0.42 + 0.02;
        float d = abs(uv.x - 0.5 + (turb - 0.5) * 0.25 * uv.y);
        float body = smoothstep(width, width * 0.25, d) * smoothstep(1.0, 0.25, uv.y + turb * 0.35) * smoothstep(0.0, 0.08, uv.y);
        vec3 col = mix(vec3(1.0, 0.32, 0.05), vec3(1.0, 0.82, 0.45), smoothstep(0.1, 0.9, body));
        gl_FragColor = vec4(col * body * 2.6, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
}

function Embers({ count = 70 }: { count?: number }) {
  const { glow } = useWorld();
  const geometry = useMemo(() => {
    const rng = createRng(9);
    const seed = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) seed.set([rng(), rng(), rng()], i * 3);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 3));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 2, 0), 6);
    return g;
  }, [count]);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: shared.uTime, uMap: { value: glow } },
        vertexShader: /* glsl */ `
          attribute vec3 aSeed;
          uniform float uTime;
          varying float vA;
          void main() {
            float life = fract(uTime * (0.25 + aSeed.x * 0.3) + aSeed.y);
            vec3 p = vec3((aSeed.z - 0.5) * 0.5 + sin(life * 6.0 + aSeed.x * 20.0) * 0.25 * life, life * 4.5, (aSeed.x - 0.5) * 0.5 + cos(life * 5.0 + aSeed.y * 20.0) * 0.25 * life);
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = 220.0 * 0.03 / max(-mv.z, 0.5);
            vA = (1.0 - life) * smoothstep(0.0, 0.08, life);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform sampler2D uMap;
          varying float vA;
          void main() {
            float a = texture2D(uMap, gl_PointCoord).a * vA;
            gl_FragColor = vec4(vec3(1.0, 0.55, 0.18) * a * 3.0, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
      }),
    [glow],
  );
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );
  return <points geometry={geometry} material={material} />;
}

/** Bella, a cream-and-tan Shih Tzu. Click her and she runs a lap round the fire. */
function Bella({ fur, patch, dark }: { fur: THREE.Material; patch: THREE.Material; dark: THREE.Material }) {
  const root = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const run = useRef(-1);
  const [hover, setHover] = useState(false);
  const home = useMemo(() => new THREE.Vector3(1.4, ground(1.4, 1.9), 1.9), []);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    document.body.style.cursor = hover ? "pointer" : "";
  }, [hover]);

  useFrame((state, dt) => {
    const t = shared.uTime.value;
    const g = root.current;
    if (!g) return;
    let speed = 0;
    if (run.current >= 0) {
      run.current += dt / 3.2;
      const f = run.current;
      // A lap round the fire and back to her spot.
      const a = f * Math.PI * 2 + Math.PI * 0.25;
      const r = 3.3 + Math.sin(f * Math.PI) * 0.6;
      tmp.set(Math.cos(a) * r - 1.2, 0, Math.sin(a) * r + 0.4);
      tmp.lerp(home, Math.max(0, f - 0.85) / 0.15);
      tmp.y = ground(tmp.x, tmp.z);
      const dx = tmp.x - g.position.x;
      const dz = tmp.z - g.position.z;
      g.position.copy(tmp);
      if (dx * dx + dz * dz > 1e-8) g.rotation.y = Math.atan2(dx, dz);
      speed = 1;
      if (f >= 1) {
        run.current = -1;
        g.position.copy(home);
      }
    } else {
      // Idle: look towards the camera now and then.
      const cam = state.camera.position;
      const want = Math.atan2(cam.x - (CAMP.x + g.position.x), cam.z - (CAMP.z + g.position.z));
      g.rotation.y += Math.atan2(Math.sin(want - g.rotation.y), Math.cos(want - g.rotation.y)) * Math.min(1, dt * 0.8);
    }
    if (tail.current) tail.current.rotation.z = Math.sin(t * (hover || speed ? 18 : 7)) * (hover || speed ? 0.6 : 0.3);
    if (head.current) head.current.rotation.z = Math.sin(t * 0.7) * 0.12 + (hover ? 0.25 : 0);
    if (body.current) body.current.position.y = 0.3 + Math.abs(Math.sin(t * 14)) * 0.06 * speed + Math.sin(t * 2.2) * 0.004;
    // Publish where she is on screen (for the hint).
    tmp
      .copy(g.position)
      .add(CAMP)
      .setY(CAMP.y + g.position.y + 0.6)
      .project(state.camera);
    frame.petVisible = tmp.z < 1 && Math.abs(tmp.x) < 1 && Math.abs(tmp.y) < 1 && frame.progress > 0.07 && frame.progress < 0.135;
    frame.petX = (tmp.x * 0.5 + 0.5) * state.size.width;
    frame.petY = (-tmp.y * 0.5 + 0.5) * state.size.height;
  });

  return (
    <group
      ref={root}
      position={home}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        if (run.current < 0) run.current = 0;
        ui.set({ hoverId: null });
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(true);
      }}
      onPointerOut={() => setHover(false)}
    >
      <group ref={body} position={[0, 0.3, 0]}>
        {/* Long, soft coat: a rounded body with a fringe skirt. */}
        <mesh material={fur} scale={[0.2, 0.17, 0.3]} castShadow>
          <sphereGeometry args={[1, 24, 16]} />
        </mesh>
        <mesh material={fur} position={[0, -0.1, 0]} scale={[0.22, 0.12, 0.31]}>
          <sphereGeometry args={[1, 20, 12]} />
        </mesh>
        <mesh material={patch} position={[0, 0.07, -0.05]} scale={[0.17, 0.11, 0.2]}>
          <sphereGeometry args={[1, 20, 12]} />
        </mesh>
        {/* Head */}
        <group ref={head} position={[0, 0.16, 0.27]}>
          <mesh material={fur} scale={[0.15, 0.14, 0.14]} castShadow>
            <sphereGeometry args={[1, 24, 16]} />
          </mesh>
          <mesh material={fur} position={[0, -0.04, 0.12]} scale={[0.08, 0.06, 0.06]}>
            <sphereGeometry args={[1, 16, 12]} />
          </mesh>
          <mesh material={dark} position={[0, -0.02, 0.175]} scale={[0.028, 0.022, 0.02]}>
            <sphereGeometry args={[1, 12, 8]} />
          </mesh>
          {[-1, 1].map((s) => (
            <group key={s}>
              <mesh material={dark} position={[s * 0.06, 0.03, 0.12]} scale={0.019}>
                <sphereGeometry args={[1, 10, 8]} />
              </mesh>
              <mesh material={patch} position={[s * 0.13, -0.04, -0.01]} rotation={[0, 0, s * 0.25]} scale={[0.05, 0.12, 0.08]}>
                <sphereGeometry args={[1, 14, 10]} />
              </mesh>
            </group>
          ))}
          {/* Topknot */}
          <mesh material={patch} position={[0, 0.13, 0.02]} scale={0.04}>
            <sphereGeometry args={[1, 10, 8]} />
          </mesh>
        </group>
        {/* Plumed tail curled over the back. */}
        <group ref={tail} position={[0, 0.1, -0.26]}>
          <mesh material={fur} position={[0, 0.08, 0.02]} rotation={[0.6, 0, 0]} scale={[0.07, 0.11, 0.06]}>
            <sphereGeometry args={[1, 14, 10]} />
          </mesh>
        </group>
        {[-1, 1].map((sx) =>
          [-1, 1].map((sz) => (
            <mesh key={`${sx}${sz}`} material={fur} position={[sx * 0.1, -0.2, sz * 0.17]} scale={[0.05, 0.08, 0.05]}>
              <sphereGeometry args={[1, 10, 8]} />
            </mesh>
          )),
        )}
      </group>
      {/* Invisible, generous hit area. */}
      <mesh visible={false} position={[0, 0.35, 0]}>
        <sphereGeometry args={[0.55, 8, 6]} />
      </mesh>
    </group>
  );
}

export function Camp() {
  const { assets } = useWorld();
  const group = useRef<THREE.Group>(null);
  const res = useMemo(() => {
    const std = (o: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0, ...o });
    return {
      wood: createBarkMaterial(assets, { ground: -1000, moss: 0.1, brightness: 1.2 }),
      plank: std({ color: "#7a5636", roughness: 0.75 }),
      canvas: std({ color: "#c9b48e", side: THREE.DoubleSide, roughness: 0.95 }),
      canvasDark: std({ color: "#8c6f4c", side: THREE.DoubleSide }),
      blanket: std({ color: "#8a3b2c", roughness: 0.95 }),
      blanketStripe: std({ color: "#d9b56a", roughness: 0.95 }),
      metal: std({ color: "#2c2a28", metalness: 0.8, roughness: 0.45 }),
      plastic: std({ color: "#1d1f22", roughness: 0.5 }),
      accent: std({ color: "#7ee0cf", emissive: new THREE.Color("#7ee0cf"), emissiveIntensity: 0.6, roughness: 0.4 }),
      paper: std({ color: "#e4d8bf", roughness: 0.9 }),
      cover1: std({ color: "#2e4b6b" }),
      cover2: std({ color: "#8e2f2f" }),
      cover3: std({ color: "#d6b04a" }),
      stone: std({ map: assets.rock.color, normalMap: assets.rock.normal, color: "#8f877c", roughness: 0.9 }),
      fur: std({ color: "#efe3cf", roughness: 1 }),
      patch: std({ color: "#a8784a", roughness: 1 }),
      dark: std({ color: "#121010", roughness: 0.35 }),
      flame: createFlameMaterial(),
      bulb: new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffd79a").multiplyScalar(2.2) }),
    };
  }, [assets]);
  useEffect(() => () => Object.values(res).forEach((m) => m.dispose()), [res]);

  const fire = new THREE.Vector3(CAMPFIRE.x - CAMP.x, CAMPFIRE.y - CAMP.y - 0.9, CAMPFIRE.z - CAMP.z);
  const stones = useMemo(() => {
    const rng = createRng(17);
    return Array.from({ length: 11 }, (_, i) => {
      const a = (i / 11) * Math.PI * 2;
      return {
        p: [fire.x + Math.cos(a) * 0.75, ground(fire.x + Math.cos(a) * 0.75, fire.z + Math.sin(a) * 0.75) + 0.08, fire.z + Math.sin(a) * 0.75] as [
          number,
          number,
          number,
        ],
        s: range(rng, 0.13, 0.19),
        r: rng() * 3,
      };
    });
  }, [fire.x, fire.z]);

  // String lights from the tent's ridge to a pole.
  const lights = useMemo(() => {
    const a = new THREE.Vector3(-4.3, ground(-4.3, -2.6) + 2.05, -2.6);
    const b = new THREE.Vector3(3.4, ground(3.4, -4.4) + 2.4, -4.4);
    return Array.from({ length: 13 }, (_, i) => {
      const f = i / 12;
      return a
        .clone()
        .lerp(b, f)
        .add(new THREE.Vector3(0, -Math.sin(f * Math.PI) * 0.45, 0));
    });
  }, []);
  const glows = useMemo<GlowPoint[]>(
    () => [
      { position: new THREE.Vector3(CAMPFIRE.x, CAMPFIRE.y - 0.2, CAMPFIRE.z), size: 3.2, color: "#ff8a3d", night: 0.6, pulse: 0.2 },
      ...lights.map((p, i) => ({ position: p.clone().add(CAMP), size: 0.42, color: "#ffcf8a", night: 0.85, pulse: i * 0.37 })),
    ],
    [lights],
  );

  const flames = useRef<THREE.Group>(null);
  useFrame((state) => {
    const p = frame.progress;
    if (group.current) group.current.visible = p < 0.3;
    if (flames.current) {
      // The flame cards always face the camera (cylindrical billboard).
      const cam = state.camera.position;
      flames.current.rotation.y = Math.atan2(cam.x - CAMPFIRE.x, cam.z - CAMPFIRE.z);
    }
  });

  return (
    <>
      <group ref={group} position={CAMP}>
        {/* Campfire: stone ring, crossed logs, flames, embers. */}
        {stones.map((s, i) => (
          <mesh key={i} material={res.stone} position={s.p} rotation={[s.r, s.r * 2, 0]} scale={[s.s * 1.3, s.s, s.s]} castShadow receiveShadow>
            <dodecahedronGeometry args={[1, 1]} />
          </mesh>
        ))}
        {[0, 1.2, 2.3].map((r, i) => (
          <mesh key={i} material={res.wood} position={[fire.x, ground(fire.x, fire.z) + 0.15, fire.z]} rotation={[0.25, r, Math.PI / 2 - 0.25]} castShadow>
            <cylinderGeometry args={[0.07, 0.09, 1.0, 8]} />
          </mesh>
        ))}
        <group ref={flames} position={[fire.x, ground(fire.x, fire.z) + 0.1, fire.z]}>
          {[0, 1, 2].map((i) => (
            <mesh key={i} material={res.flame} position={[0, 0.55, 0]} rotation={[0, (i * Math.PI) / 3, 0]} scale={[0.75 - i * 0.1, 1.1 - i * 0.12, 1]}>
              <planeGeometry args={[1, 1]} />
            </mesh>
          ))}
          <Embers />
        </group>

        {/* Tent: an A-frame of canvas on a ridge pole. */}
        <group position={[-4.6, ground(-4.6, -1.2), -1.2]} rotation={[0, 0.55, 0]}>
          {[-1, 1].map((s) => (
            <mesh key={s} material={res.canvas} position={[s * 0.62, 0.92, 0]} rotation={[0, 0, s * 0.6]} castShadow receiveShadow>
              <planeGeometry args={[1.55, 2.6]} />
            </mesh>
          ))}
          <mesh material={res.canvasDark} position={[0, 0.9, 1.29]}>
            <circleGeometry args={[0.9, 3, Math.PI / 2 - Math.PI / 3, (Math.PI * 2) / 3]} />
          </mesh>
          <mesh material={res.plank} position={[0, 1.83, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 2.9, 6]} />
          </mesh>
        </group>
        <mesh material={res.plank} position={[3.4, ground(3.4, -4.4) + 1.2, -4.4]}>
          <cylinderGeometry args={[0.04, 0.05, 2.4, 6]} />
        </mesh>
        {lights.map((p, i) => (
          <mesh key={i} material={res.bulb} position={p}>
            <sphereGeometry args={[0.045, 8, 6]} />
          </mesh>
        ))}

        {/* Three folding chairs pulled up to the fire. */}
        {[2.6, 3.7, 4.9].map((a, i) => {
          const x = fire.x + Math.cos(a) * 2.3;
          const z = fire.z + Math.sin(a) * 2.3;
          return (
            <group key={i} position={[x, ground(x, z), z]} rotation={[0, Math.atan2(fire.x - x, fire.z - z), 0]}>
              <mesh material={res.blanket} position={[0, 0.42, 0]} castShadow>
                <boxGeometry args={[0.5, 0.04, 0.45]} />
              </mesh>
              <mesh material={res.blanket} position={[0, 0.72, -0.24]} rotation={[-0.18, 0, 0]} castShadow>
                <boxGeometry args={[0.5, 0.55, 0.04]} />
              </mesh>
              {[-0.23, 0.23].map((sx) => (
                <mesh key={sx} material={res.metal} position={[sx, 0.22, 0]} rotation={[0.5, 0, 0]}>
                  <cylinderGeometry args={[0.015, 0.015, 0.55, 6]} />
                </mesh>
              ))}
            </group>
          );
        })}

        {/* A blanket with the owner's off-the-clock things. */}
        <group position={[2.4, ground(2.4, 1.0) + 0.02, 1.0]} rotation={[0, -0.4, 0]}>
          <mesh material={res.blanket} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[2.2, 1.6]} />
          </mesh>
          {[-0.5, 0, 0.5].map((x) => (
            <mesh key={x} material={res.blanketStripe} position={[x, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.12, 1.6]} />
            </mesh>
          ))}
          {/* Game controller */}
          <group position={[-0.65, 0.05, 0.35]} rotation={[0, 0.5, 0]}>
            <mesh material={res.plastic} scale={[0.16, 0.035, 0.09]} castShadow>
              <sphereGeometry args={[1, 18, 10]} />
            </mesh>
            {[-1, 1].map((s) => (
              <mesh key={s} material={res.plastic} position={[s * 0.12, -0.005, -0.06]} scale={[0.05, 0.03, 0.08]}>
                <sphereGeometry args={[1, 12, 8]} />
              </mesh>
            ))}
            <mesh material={res.accent} position={[0.07, 0.035, 0]} scale={0.012}>
              <sphereGeometry args={[1, 8, 6]} />
            </mesh>
          </group>
          {/* A stack of manga and manhwa */}
          {[res.cover1, res.cover2, res.cover3, res.cover1].map((m, i) => (
            <mesh key={i} material={m} position={[0.1, 0.03 + i * 0.045, -0.35]} rotation={[0, i * 0.18, 0]} castShadow>
              <boxGeometry args={[0.2, 0.04, 0.28]} />
            </mesh>
          ))}
          {/* A notebook and pen — the owner writes stories */}
          <group position={[0.65, 0.015, 0.2]} rotation={[0, -0.3, 0]}>
            <mesh material={res.paper} castShadow>
              <boxGeometry args={[0.3, 0.02, 0.4]} />
            </mesh>
            <mesh material={res.metal} position={[0.05, 0.02, 0]} rotation={[0, 0.4, Math.PI / 2]}>
              <cylinderGeometry args={[0.008, 0.008, 0.26, 6]} />
            </mesh>
          </group>
          {/* Headphones — R&B */}
          <group position={[-0.1, 0.05, 0.45]} rotation={[Math.PI / 2, 0, 0.6]}>
            <mesh material={res.plastic}>
              <torusGeometry args={[0.1, 0.012, 8, 24, Math.PI]} />
            </mesh>
            {[-1, 1].map((s) => (
              <mesh key={s} material={res.plastic} position={[s * 0.1, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.045, 0.045, 0.03, 16]} />
              </mesh>
            ))}
          </group>
        </group>

        <Bella fur={res.fur} patch={res.patch} dark={res.dark} />
      </group>
      <Glows points={glows} />
    </>
  );
}
