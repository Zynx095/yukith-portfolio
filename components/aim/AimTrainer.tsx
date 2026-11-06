"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { AimSession, DIFFICULTY, MODES, WALL, WALL_DEPTH, type AimMode, type Difficulty, type Results } from "@/lib/aim/engine";
import { discover } from "@/lib/discoveries";
import { PERF_MODE } from "@/lib/world/debug";
import { CloseIcon } from "@/components/shared/Icons";

/**
 * The aim trainer — an original tactical-FPS aim challenge in its own small
 * three.js scene and WebGL context, created when a run starts and released
 * when it ends. Nothing of the main world is loaded or rendered here (the
 * world is paused while this dialog is open).
 *
 * Not affiliated with Riot Games or Valorant: no maps, models, sounds or UI of
 * any game are used — the room, targets and sounds are made for this site.
 */

declare global {
  interface Window {
    __aim?: { session: AimSession | null; shootAt: (x: number, y: number) => number; shootTarget: () => number };
  }
}

type Screen = "menu" | "play" | "results";
const BEST_KEY = "yk-aim-best";
const SOUND_KEY = "yk-aim-sound";
const MODE_ORDER: AimMode[] = ["flick", "precision", "reaction", "moving"];
const DIFF_ORDER: Difficulty[] = ["easy", "normal", "hard"];

function readBest(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(BEST_KEY) ?? "{}") as Record<string, number>;
  } catch {
    return {};
  }
}

/** Short synthesised blips (no recorded audio). */
function makeSound() {
  let ctx: AudioContext | null = null;
  const blip = (freq: number, dur: number, gain: number, type: OscillatorType = "sine") => {
    try {
      ctx ??= new AudioContext();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(freq * 0.6, ctx.currentTime + dur);
      g.gain.setValueAtTime(gain, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      o.connect(g).connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + dur);
    } catch {
      /* audio unavailable */
    }
  };
  return {
    hit: () => blip(880, 0.09, 0.08, "triangle"),
    miss: () => blip(140, 0.08, 0.05, "square"),
    close: () => void ctx?.close(),
  };
}

/** The training room: floor, walls, light strips, and a frame round the target wall. */
function buildRoom(scene: THREE.Scene) {
  const disposables: { dispose: () => void }[] = [];
  const add = <T extends { dispose: () => void }>(x: T) => (disposables.push(x), x);
  const floorMat = add(
    new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color("#1f2328") }, uLine: { value: new THREE.Color("#3a414c") } },
      vertexShader: `varying vec3 vP; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: `uniform vec3 uColor, uLine; varying vec3 vP;
        void main(){ vec2 g = abs(fract(vP.xz * 0.5) - 0.5); float l = smoothstep(0.485, 0.5, max(g.x, g.y));
          float fade = exp(-length(vP.xz) * 0.06);
          gl_FragColor = vec4(mix(uColor, uLine, l * 0.8) * (0.55 + 0.45 * fade), 1.0); }`,
    })
  );
  const floor = new THREE.Mesh(add(new THREE.PlaneGeometry(40, 40)), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.6;
  scene.add(floor);

  const wallMat = add(new THREE.MeshStandardMaterial({ color: "#3a3f48", roughness: 0.78, metalness: 0.15 }));
  const back = new THREE.Mesh(add(new THREE.PlaneGeometry(WALL.w * 2 + 3, WALL.h * 2 + 3.2)), wallMat);
  back.position.set(0, 0, -WALL_DEPTH - 0.02);
  scene.add(back);
  for (const side of [-1, 1]) {
    const w = new THREE.Mesh(add(new THREE.PlaneGeometry(WALL_DEPTH + 6, WALL.h * 2 + 3.2)), wallMat);
    w.rotation.y = -side * Math.PI / 2;
    w.position.set(side * (WALL.w + 1.5), 0, -WALL_DEPTH / 2 + 2);
    scene.add(w);
  }
  const ceil = new THREE.Mesh(add(new THREE.PlaneGeometry(WALL.w * 2 + 3, WALL_DEPTH + 6)), add(new THREE.MeshStandardMaterial({ color: "#121418", roughness: 1 })));
  ceil.rotation.x = Math.PI / 2;
  ceil.position.set(0, WALL.h + 1.6, -WALL_DEPTH / 2 + 2);
  scene.add(ceil);

  // Light strips on the ceiling and a thin frame round the target area.
  const strip = add(new THREE.MeshBasicMaterial({ color: new THREE.Color("#f2efe8").multiplyScalar(0.85) }));
  for (const x of [-3.2, 3.2]) {
    const s = new THREE.Mesh(add(new THREE.BoxGeometry(0.05, 0.02, WALL_DEPTH + 4)), strip);
    s.position.set(x, WALL.h + 1.58, -WALL_DEPTH / 2 + 2);
    scene.add(s);
  }
  // Panel seams down the side walls give the room depth.
  const seam = add(new THREE.MeshBasicMaterial({ color: new THREE.Color("#8fa3c0").multiplyScalar(0.35) }));
  for (const side of [-1, 1])
    for (let z = 2; z > -WALL_DEPTH; z -= 2.4) {
      const m = new THREE.Mesh(add(new THREE.PlaneGeometry(0.03, WALL.h * 2 + 3.2)), seam);
      m.rotation.y = -side * Math.PI / 2;
      m.position.set(side * (WALL.w + 1.49), 0, z);
      scene.add(m);
    }
  const accent = add(new THREE.MeshBasicMaterial({ color: new THREE.Color("#e8465a").multiplyScalar(1.4) }));
  const frameW = WALL.w * 2 + 0.6;
  const frameH = WALL.h * 2 + 0.6;
  for (const [w, h, x, y] of [
    [frameW, 0.025, 0, frameH / 2],
    [frameW, 0.025, 0, -frameH / 2],
    [0.025, frameH, frameW / 2, 0],
    [0.025, frameH, -frameW / 2, 0],
  ]) {
    const m = new THREE.Mesh(add(new THREE.PlaneGeometry(w, h)), accent);
    m.position.set(x, y, -WALL_DEPTH + 0.01);
    scene.add(m);
  }
  scene.add(new THREE.HemisphereLight("#cfd6e6", "#1a1612", 1.1));
  const key = new THREE.DirectionalLight("#fff4e6", 1.2);
  key.position.set(2, 6, 4);
  scene.add(key);
  // A soft pool of light on the target wall.
  const spot = new THREE.SpotLight("#fff1e0", 60, 30, 0.55, 0.8, 1.6);
  spot.position.set(0, WALL.h + 1.2, -1);
  spot.target.position.set(0, 0, -WALL_DEPTH);
  scene.add(spot, spot.target);
  return () => disposables.forEach((d) => d.dispose());
}

/** A target: a disc facing the player with an original ring pattern. */
function createTargetMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    uniforms: { uAge: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv * 2.0 - 1.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform float uAge; varying vec2 vUv;
      void main(){ float r = length(vUv); if (r > 1.0) discard;
        float ring = smoothstep(0.02, 0.0, abs(r - 0.66) - 0.07);
        float core = smoothstep(0.24, 0.2, r);
        vec3 red = vec3(0.95, 0.24, 0.32) * 1.6, white = vec3(1.0, 0.97, 0.94) * 1.3;
        vec3 col = mix(white, red, max(ring, core));
        float edge = smoothstep(1.0, 0.94, r);
        float pop = smoothstep(0.0, 0.12, uAge);
        gl_FragColor = vec4(col, edge * pop); }`,
  });
}

export default function AimTrainer({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const hud = useRef<{ score: HTMLElement | null; time: HTMLElement | null; acc: HTMLElement | null; cross: HTMLElement | null; count: HTMLElement | null }>({ score: null, time: null, acc: null, cross: null, count: null });
  const [screen, setScreen] = useState<Screen>("menu");
  const [mode, setMode] = useState<AimMode>("flick");
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [results, setResults] = useState<Results | null>(null);
  const [best, setBest] = useState<Record<string, number>>({});
  const [paused, setPaused] = useState(false);
  const [locked, setLocked] = useState(false);
  const [sound, setSound] = useState(true);
  const resumeRef = useRef<() => void>(() => {});
  const soundRef = useRef(true);
  soundRef.current = sound;

  useEffect(() => {
    setBest(readBest());
    try {
      setSound(localStorage.getItem(SOUND_KEY) !== "off");
    } catch {
      /* ignore */
    }
    const d = dialog.current;
    if (d && !d.open) d.showModal();
    const onCancel = (e: Event) => {
      // Esc during a run only releases the pointer (pausing); it closes from the menus.
      if (screen === "play") e.preventDefault();
    };
    d?.addEventListener("cancel", onCancel);
    return () => d?.removeEventListener("cancel", onCancel);
  }, [screen]);

  // ── A run ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (screen !== "play" || !stage.current) return;
    const host = stage.current;
    const session = new AimSession(mode, difficulty);
    const audio = makeSound();
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    host.appendChild(renderer.domElement);
    renderer.domElement.className = "absolute inset-0 h-full w-full";
    renderer.domElement.setAttribute("aria-label", "Aim trainer arena");
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#101216");
    scene.fog = new THREE.Fog("#101216", 16, 34);
    const camera = new THREE.PerspectiveCamera(70, 1, 0.05, 60);
    const disposeRoom = buildRoom(scene);
    const disc = new THREE.CircleGeometry(1, 48);
    const pool: { mesh: THREE.Mesh; mat: THREE.ShaderMaterial }[] = [];
    const meshFor = (i: number) => {
      while (pool.length <= i) {
        const mat = createTargetMaterial();
        const mesh = new THREE.Mesh(disc, mat);
        scene.add(mesh);
        pool.push({ mesh, mat });
      }
      return pool[i];
    };
    // Hit sparks.
    const sparkGeo = new THREE.BufferGeometry();
    const SPARKS = 48;
    const sparkPos = new Float32Array(SPARKS * 3);
    const sparkVel = new Float32Array(SPARKS * 3);
    sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkPos, 3));
    const sparkMat = new THREE.PointsMaterial({ color: new THREE.Color("#ffd2d8").multiplyScalar(1.5), size: 0.06, transparent: true, opacity: 0 });
    const sparks = new THREE.Points(sparkGeo, sparkMat);
    scene.add(sparks);
    let sparkAge = 1;
    const burst = (x: number, y: number) => {
      for (let i = 0; i < SPARKS; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = 1.5 + Math.random() * 2.5;
        sparkPos.set([x, y, -WALL_DEPTH + 0.05], i * 3);
        sparkVel.set([Math.cos(a) * s, Math.sin(a) * s, Math.random() * 1.5], i * 3);
      }
      sparkAge = 0;
    };

    // Aiming: pointer lock rotates the view; without it, the crosshair follows the pointer.
    let yaw = 0;
    let pitch = 0;
    const pointer = new THREE.Vector2(0, 0);
    const ray = new THREE.Raycaster();
    const isLocked = () => document.pointerLockElement === renderer.domElement;
    const onMove = (e: PointerEvent) => {
      if (isLocked()) {
        yaw = THREE.MathUtils.clamp(yaw - e.movementX * 0.0022, -0.9, 0.9);
        pitch = THREE.MathUtils.clamp(pitch - e.movementY * 0.0022, -0.45, 0.45);
      } else {
        const r = renderer.domElement.getBoundingClientRect();
        pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        const c = hud.current.cross;
        if (c) c.style.transform = `translate(${e.clientX - r.left}px, ${e.clientY - r.top}px)`;
      }
    };
    /** Where the shot lands on the target wall. */
    const aimPoint = () => {
      ray.setFromCamera(isLocked() ? new THREE.Vector2(0, 0) : pointer, camera);
      const t = (-WALL_DEPTH - ray.ray.origin.z) / ray.ray.direction.z;
      return { x: ray.ray.origin.x + ray.ray.direction.x * t, y: ray.ray.origin.y + ray.ray.direction.y * t };
    };
    const fire = (x: number, y: number) => {
      const id = session.pick(x, y);
      const pts = session.shoot(id);
      if (session.phase !== "running") return pts;
      if (id != null) {
        burst(x, y);
        if (soundRef.current) audio.hit();
      } else if (soundRef.current) audio.miss();
      return pts;
    };
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      if (session.phase === "paused") return;
      if (!isLocked() && e.pointerType === "mouse" && renderer.domElement.requestPointerLock) {
        // The first click captures the mouse; shots count from the next one.
        const req = renderer.domElement.requestPointerLock() as unknown as Promise<void> | undefined;
        req?.catch?.(() => {});
        if (session.phase === "running") {
          const p = aimPoint();
          fire(p.x, p.y);
        }
        return;
      }
      const p = aimPoint();
      fire(p.x, p.y);
    };
    const onLockChange = () => {
      const l = isLocked();
      setLocked(l);
      if (!l && (session.phase === "running" || session.phase === "countdown")) {
        session.pause();
        setPaused(true);
      }
    };
    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("pointerdown", onDown);
    document.addEventListener("pointerlockchange", onLockChange);
    resumeRef.current = () => {
      session.resume();
      setPaused(false);
      renderer.domElement.requestPointerLock?.();
    };

    if (PERF_MODE) {
      window.__aim = {
        session,
        shootAt: (x, y) => fire(x, y),
        shootTarget: () => {
          const t = session.targets[0];
          return t ? fire(t.x, t.y) : fire(WALL.w * 3, 0);
        },
      };
    }

    const resize = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / Math.max(h, 1);
      // Keep the whole target wall in view on narrow screens.
      camera.fov = camera.aspect < 1.3 ? THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(35)) * (1.3 / camera.aspect))) : 70;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    session.start();
    let raf = 0;
    let last = performance.now();
    let lastHud = "";
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      session.update(dt);
      camera.rotation.set(pitch, yaw, 0, "YXZ");
      // Targets.
      session.targets.forEach((t, i) => {
        const { mesh, mat } = meshFor(i);
        mesh.visible = true;
        mesh.position.set(t.x, t.y, -WALL_DEPTH + 0.02);
        mesh.scale.setScalar(t.r);
        mat.uniforms.uAge.value = session.time - t.born;
      });
      for (let i = session.targets.length; i < pool.length; i++) pool[i].mesh.visible = false;
      // Sparks.
      if (sparkAge < 1) {
        sparkAge += dt * 2.5;
        for (let i = 0; i < SPARKS; i++) for (let k = 0; k < 3; k++) sparkPos[i * 3 + k] += sparkVel[i * 3 + k] * dt;
        sparkGeo.attributes.position.needsUpdate = true;
        sparkMat.opacity = Math.max(0, 1 - sparkAge);
      }
      renderer.render(scene, camera);
      // HUD (DOM writes only when the text changes).
      const remaining = session.spec.unit === "seconds" ? `${Math.ceil(session.remaining)}s` : `${Math.max(0, session.round)}/${session.spec.length}`;
      const text = `${session.score}|${remaining}|${Math.round(session.accuracy * 100)}|${session.phase === "countdown" ? Math.ceil(session.countdown) : ""}`;
      if (text !== lastHud) {
        lastHud = text;
        const h = hud.current;
        if (h.score) h.score.textContent = String(session.score);
        if (h.time) h.time.textContent = remaining;
        if (h.acc) h.acc.textContent = session.shots ? `${Math.round(session.accuracy * 100)}%` : "—";
        if (h.count) h.count.textContent = session.phase === "countdown" ? String(Math.ceil(session.countdown)) : "";
      }
      if (session.phase === "done") {
        const r = session.results();
        const key = `${r.mode}:${r.difficulty}`;
        const prev = readBest();
        if (!(key in prev) || r.score > prev[key]) {
          prev[key] = r.score;
          try {
            localStorage.setItem(BEST_KEY, JSON.stringify(prev));
          } catch {
            /* ignore */
          }
        }
        setBest(prev);
        setResults(r);
        discover("aim-trainer");
        if (document.pointerLockElement) document.exitPointerLock();
        setScreen("results");
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener("pointermove", onMove);
      renderer.domElement.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointerlockchange", onLockChange);
      if (document.pointerLockElement) document.exitPointerLock();
      disposeRoom();
      disc.dispose();
      pool.forEach((p) => p.mat.dispose());
      sparkGeo.dispose();
      sparkMat.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
      audio.close();
      if (window.__aim?.session === session) delete window.__aim;
      setPaused(false);
      setLocked(false);
    };
  }, [screen, mode, difficulty]);

  const close = useCallback(() => {
    dialog.current?.close();
    onClose();
  }, [onClose]);

  const play = () => {
    setResults(null);
    setScreen("play");
  };

  const toggleSound = () => {
    setSound((s) => {
      try {
        localStorage.setItem(SOUND_KEY, s ? "off" : "on");
      } catch {
        /* ignore */
      }
      return !s;
    });
  };

  const bestFor = (m: AimMode, d: Difficulty) => best[`${m}:${d}`];
  const pill = "inline-flex min-h-11 items-center justify-center rounded-full border px-4 text-sm transition-colors";

  return (
    <dialog
      ref={dialog}
      aria-labelledby="aim-title"
      onClose={onClose}
      className="m-0 h-[100dvh] max-h-none w-screen max-w-none bg-transparent p-0 text-[#efe7da] backdrop:bg-black/80"
    >
      <div className="fixed inset-0 flex flex-col bg-[#0c0d10]">
        <header className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3 md:px-6">
          <div>
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-white/50">Portfolio mini-game · not affiliated with Riot Games or Valorant</p>
            <h2 id="aim-title" className="font-display text-xl">
              Aim trainer
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={toggleSound} aria-pressed={sound} className={`${pill} border-white/15 text-white/70 hover:text-white`}>
              Sound {sound ? "on" : "off"}
            </button>
            <button type="button" onClick={close} aria-label="Close the aim trainer" className="grid h-11 w-11 place-items-center rounded-full text-white/70 hover:text-white">
              <CloseIcon />
            </button>
          </div>
        </header>

        {screen === "menu" && (
          <div data-lenis-prevent className="flex-1 overflow-y-auto px-4 py-8 md:px-6">
            <div className="mx-auto max-w-3xl">
              <p className="max-w-2xl text-white/80">
                Click to capture the mouse, then aim and click to shoot. Hit targets fast for more points; your accuracy and reaction time are measured. Esc releases the mouse and pauses the run.
              </p>
              <fieldset className="mt-8">
                <legend className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-white/50">Mode</legend>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {MODE_ORDER.map((m) => (
                    <label key={m} className={`cursor-pointer rounded-xl border p-4 transition-colors ${mode === m ? "border-[#e8465a] bg-[#e8465a]/10" : "border-white/12 hover:border-white/30"}`}>
                      <input type="radio" name="aim-mode" value={m} checked={mode === m} onChange={() => setMode(m)} className="sr-only" />
                      <span className="block font-display text-lg">{MODES[m].label}</span>
                      <span className="mt-1 block text-sm text-white/65">{MODES[m].blurb}</span>
                      <span className="mt-2 block font-mono text-[0.7rem] text-white/45">
                        {MODES[m].length} {MODES[m].unit} · best {bestFor(m, difficulty) ?? "—"}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset className="mt-6">
                <legend className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-white/50">Difficulty</legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {DIFF_ORDER.map((d) => (
                    <label key={d} className={`${pill} cursor-pointer ${difficulty === d ? "border-[#e8465a] bg-[#e8465a]/15 text-white" : "border-white/15 text-white/70 hover:text-white"}`}>
                      <input type="radio" name="aim-diff" value={d} checked={difficulty === d} onChange={() => setDifficulty(d)} className="sr-only" />
                      {DIFFICULTY[d].label}
                    </label>
                  ))}
                </div>
              </fieldset>
              <button type="button" onClick={play} className="mt-8 inline-flex min-h-12 items-center rounded-full bg-[#e8465a] px-7 text-sm font-medium text-white hover:bg-[#f0606f]">
                Start · {MODES[mode].label}, {DIFFICULTY[difficulty].label}
              </button>
              <p className="mt-4 text-xs text-white/45">Needs a mouse or trackpad. On touch screens, tap the targets directly.</p>
            </div>
          </div>
        )}

        {screen === "play" && (
          <div className="relative flex-1 overflow-hidden" ref={stage} style={{ cursor: locked ? "none" : "none" }}>
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center gap-8 p-4 font-mono text-sm">
              <span>
                <span className="text-white/45">Score </span>
                <span ref={(el) => void (hud.current.score = el)} data-aim="score">
                  0
                </span>
              </span>
              <span>
                <span className="text-white/45">Time </span>
                <span ref={(el) => void (hud.current.time = el)} data-aim="time">
                  —
                </span>
              </span>
              <span>
                <span className="text-white/45">Accuracy </span>
                <span ref={(el) => void (hud.current.acc = el)} data-aim="accuracy">
                  —
                </span>
              </span>
            </div>
            <div ref={(el) => void (hud.current.count = el)} aria-live="polite" className="pointer-events-none absolute inset-0 z-10 grid place-items-center font-display text-7xl text-white/90" />
            {/* Crosshair: centred when the mouse is captured, under the pointer otherwise. */}
            <div
              ref={(el) => void (hud.current.cross = el)}
              aria-hidden="true"
              className="pointer-events-none absolute left-0 top-0 z-10"
              style={locked ? { left: "50%", top: "50%", transform: "none" } : undefined}
            >
              <svg width="28" height="28" viewBox="-14 -14 28 28" className="-translate-x-1/2 -translate-y-1/2">
                <path d="M-10 0H-4M4 0H10M0 -10V-4M0 4V10" stroke="#f4f1ea" strokeWidth="1.6" />
                <circle r="1.2" fill="#e8465a" />
              </svg>
            </div>
            {paused && (
              <div className="absolute inset-0 z-20 grid place-items-center bg-black/60">
                <div className="text-center">
                  <p className="font-display text-3xl">Paused</p>
                  <div className="mt-5 flex justify-center gap-2">
                    <button type="button" onClick={() => resumeRef.current()} className={`${pill} border-[#e8465a] bg-[#e8465a] text-white`}>
                      Resume
                    </button>
                    <button type="button" onClick={() => setScreen("menu")} className={`${pill} border-white/20 text-white/80`}>
                      Quit to menu
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {screen === "results" && results && (
          <div data-lenis-prevent className="flex-1 overflow-y-auto px-4 py-10 md:px-6" data-aim="results">
            <div className="mx-auto max-w-2xl">
              <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-white/50">
                {MODES[results.mode].label} · {DIFFICULTY[results.difficulty].label}
              </p>
              <p className="mt-2 font-display text-6xl" data-aim="final-score">
                {results.score}
              </p>
              <p className="text-white/60">points{bestFor(results.mode, results.difficulty) === results.score && results.score > 0 ? " · personal best" : ""}</p>
              <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:grid-cols-4">
                {[
                  ["Accuracy", results.shots ? `${Math.round(results.accuracy * 100)}%` : "—"],
                  ["Hits / shots", `${results.hits} / ${results.shots}`],
                  ["Avg reaction", results.avgReactionMs != null ? `${results.avgReactionMs} ms` : "—"],
                  ["Best reaction", results.bestReactionMs != null ? `${results.bestReactionMs} ms` : "—"],
                ].map(([k, v]) => (
                  <div key={k} className="bg-[#0c0d10] p-4">
                    <dt className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-white/45">{k}</dt>
                    <dd className="mt-1 font-display text-2xl">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-sm text-white/50">{results.expired} target{results.expired === 1 ? "" : "s"} expired unhit.</p>
              <div className="mt-8 flex flex-wrap gap-2">
                <button type="button" onClick={play} className={`${pill} border-[#e8465a] bg-[#e8465a] text-white`}>
                  Play again
                </button>
                <button type="button" onClick={() => setScreen("menu")} className={`${pill} border-white/20 text-white/80 hover:text-white`}>
                  Change mode
                </button>
                <button type="button" onClick={close} className={`${pill} border-white/20 text-white/80 hover:text-white`}>
                  Back to the portfolio
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </dialog>
  );
}
