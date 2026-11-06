// Unit tests for the aim-trainer rules (lib/aim/engine.ts).
// Run: node --no-warnings --import ./scripts/ts-hooks.mjs --test scripts/test-aim.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { AimSession, COUNTDOWN, DIFFICULTY, MODES, hitPoints, mulberry32 } from "@/lib/aim/engine";

const run = (s: AimSession, seconds: number, step = 1 / 60) => {
  for (let t = 0; t < seconds; t += step) s.update(step);
};

test("countdown precedes the run and nothing spawns before it ends", () => {
  const s = new AimSession("flick", "normal", mulberry32(1));
  s.start();
  assert.equal(s.phase, "countdown");
  run(s, COUNTDOWN - 0.1);
  assert.equal(s.phase, "countdown");
  assert.equal(s.targets.length, 0);
  run(s, 0.2);
  assert.equal(s.phase, "running");
  assert.equal(s.targets.length, MODES.flick.concurrent);
});

test("a hit scores, records the reaction and replaces the target", () => {
  const s = new AimSession("flick", "normal", mulberry32(2));
  s.start();
  run(s, COUNTDOWN + 0.05);
  const t = s.targets[0];
  run(s, 0.3);
  const id = s.pick(t.x, t.y);
  assert.equal(id, t.id, "picking the target's centre hits it");
  const pts = s.shoot(id);
  assert.ok(pts > 0);
  assert.equal(s.hits, 1);
  assert.equal(s.shots, 1);
  assert.equal(s.reactions.length, 1);
  assert.ok(Math.abs(s.reactions[0] - 0.3) < 0.05, `reaction ≈ 0.3 s, got ${s.reactions[0]}`);
  s.update(1 / 60);
  assert.equal(s.targets.length, 1, "a new target replaces the hit one");
  assert.notEqual(s.targets[0].id, t.id);
});

test("hit detection respects the target radius", () => {
  const s = new AimSession("flick", "hard", mulberry32(3));
  s.start();
  run(s, COUNTDOWN + 0.05);
  const t = s.targets[0];
  assert.equal(s.pick(t.x + t.r * 0.95, t.y), t.id);
  assert.equal(s.pick(t.x + t.r * 1.05, t.y), null);
});

test("accuracy is hits over shots; misses are penalised only in precision", () => {
  const f = new AimSession("flick", "normal", mulberry32(4));
  f.start();
  run(f, COUNTDOWN + 0.05);
  f.shoot(f.targets[0].id);
  f.shoot(null);
  f.shoot(null);
  f.shoot(null);
  assert.equal(f.accuracy, 0.25);
  const before = f.score;
  f.shoot(null);
  assert.equal(f.score, before, "flick misses cost nothing");

  const p = new AimSession("precision", "normal", mulberry32(5));
  p.start();
  run(p, COUNTDOWN + 0.05);
  p.shoot(p.targets[0].id);
  const scored = p.score;
  p.shoot(null);
  assert.equal(p.score, scored - 40);
  assert.equal(p.targets.length <= 3, true);
});

test("the timer ends a timed run and clears the wall", () => {
  const s = new AimSession("moving", "easy", mulberry32(6));
  s.start();
  run(s, COUNTDOWN + MODES.moving.length + 0.1);
  assert.equal(s.phase, "done");
  assert.equal(s.targets.length, 0);
  assert.equal(s.remaining, 0);
  assert.ok(s.expired > 0, "unhit targets expire");
});

test("moving targets move and stay on the wall", () => {
  const s = new AimSession("moving", "hard", mulberry32(7));
  s.start();
  run(s, COUNTDOWN + 0.05);
  const t = s.targets[0];
  const x0 = t.x;
  run(s, 0.5);
  const t2 = s.targets.find((x) => x.id === t.id);
  if (t2) assert.notEqual(t2.x, x0);
  run(s, 5);
  for (const x of s.targets) assert.ok(Math.abs(x.x) <= 5.2 && Math.abs(x.y) <= 2.4);
});

test("the reaction test runs ten rounds and finishes even if targets are ignored", () => {
  const s = new AimSession("reaction", "normal", mulberry32(8));
  s.start();
  run(s, COUNTDOWN + 60);
  assert.equal(s.phase, "done");
  assert.equal(s.round, MODES.reaction.length);
  assert.equal(s.expired, MODES.reaction.length);
});

test("the reaction test measures time from appearance to hit", () => {
  const s = new AimSession("reaction", "normal", mulberry32(9));
  s.start();
  let hits = 0;
  for (let i = 0; i < 20000 && s.phase !== "done"; i++) {
    s.update(1 / 120);
    const t = s.targets[0];
    if (t && s.time - t.born >= 0.25) {
      s.shoot(t.id);
      hits++;
    }
  }
  const r = s.results();
  assert.equal(hits, 10);
  assert.equal(r.hits, 10);
  assert.ok(r.avgReactionMs !== null && Math.abs(r.avgReactionMs - 250) < 15, `avg ≈ 250 ms, got ${r.avgReactionMs}`);
  assert.equal(r.accuracy, 1);
});

test("pause stops the clock and resume continues it", () => {
  const s = new AimSession("flick", "normal", mulberry32(10));
  s.start();
  run(s, COUNTDOWN + 1);
  const t = s.time;
  s.pause();
  run(s, 5);
  assert.equal(s.time, t);
  assert.equal(s.shoot(null), 0, "shots while paused do not count");
  s.resume();
  run(s, 1);
  assert.ok(s.time > t + 0.9);
});

test("points reward speed and small targets", () => {
  assert.ok(hitPoints(0.2, 0.3) > hitPoints(1.2, 0.3));
  assert.ok(hitPoints(0.5, DIFFICULTY.hard.radius) > hitPoints(0.5, DIFFICULTY.easy.radius));
});
