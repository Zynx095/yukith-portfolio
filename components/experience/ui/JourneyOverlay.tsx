"use client";

import { useEffect, useRef, useState } from "react";
import { BEATS, RINGS } from "@/lib/world/journey";
import { CHAPTERS, JOURNEY_VH } from "@/lib/world/chapters";
import { frame, openRecord, useUi } from "@/lib/world/store";
import { scrollToProgress } from "@/lib/world/scroll";
import { entryById } from "@/lib/entries";
import { RING_STAGES, type RingKind } from "@/lib/world/rings";
import { ArrowRight, GitHubIcon, LinkedInIcon, MailIcon } from "@/components/shared/Icons";
import { WorldTags } from "./WorldTags";
import { socialData } from "@/src/data/social";
import { scrollToId } from "@/components/providers/smooth-scroll";

/**
 * Everything drawn over the World Tree: one line of narration at a time, the
 * chapter rail, the label beside the relic in focus, the year cards in the
 * rings, a hint for Bella and the first "scroll" cue. Positions follow the
 * scene through refs on animation frames — React re-renders only when the
 * beat, chapter or focused relic changes.
 */

/** One line as each region opens (region time). */
const REGION_BEATS: { region: "district" | "arena" | "library"; start: number; end: number; kicker: string; line: string; sub?: string }[] = [
  { region: "district", start: 0.03, end: 0.16, kicker: "The hackathon district", line: "Every hackathon, competition and event, in one clearing.", sub: "Results under the pavilion, organising at the gate, everything else round the ring." },
  { region: "arena", start: 0.0, end: 0.14, kicker: "The arena", line: "Competitive gaming: Valorant, CS:GO, Mobile Legends.", sub: "Ranks and results as reported by Yukith — no invented statistics." },
  { region: "library", start: 0.0, end: 0.22, kicker: "The library", line: "A reading cabin on the World Tree's longest limb.", sub: "Manhwa, manga, anime, a favourite series — and stories of my own." },
];

function useProgressBeat() {
  const [beat, setBeat] = useState(-1);
  const [ring, setRing] = useState(-1);
  useEffect(() => {
    let raf = 0;
    let lastB = -2;
    let lastR = -2;
    const tick = () => {
      const p = frame.progress;
      let b = frame.region ? -1 : BEATS.findIndex((x) => p >= x.start && p < x.end);
      if (frame.region) {
        const rb = REGION_BEATS.findIndex((x) => x.region === frame.region && frame.regionT >= x.start && frame.regionT < x.end);
        if (rb >= 0) b = 100 + rb;
      }
      if (b !== lastB) setBeat((lastB = b));
      let r = -1;
      if (!frame.region)
        RINGS.forEach((x, i) => {
          if (Math.abs(p - x.progress) < 0.0115) r = i;
        });
      if (r !== lastR) setRing((lastR = r));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return { beat, ring };
}

function Narration({ beat }: { beat: number }) {
  const b = beat >= 100 ? REGION_BEATS[beat - 100] : beat >= 0 ? BEATS[beat] : null;
  const isTitle = beat === 0;
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-24 px-5 md:bottom-28 md:px-12" aria-live="polite">
      <div key={beat} className={`max-w-2xl transition-all duration-700 ${b ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`} style={{ animation: b ? "beat-in 900ms var(--ease-out-soft) both" : undefined }}>
        {b && (
          <>
            <p className="label text-paper/80">{b.kicker}</p>
            {isTitle ? (
              <p className="mt-3 font-display text-[clamp(2.6rem,7vw,5.5rem)] leading-[0.95] tracking-tight text-paper [text-shadow:0_2px_30px_rgba(0,0,0,0.45)]">{b.line}</p>
            ) : (
              <p className="mt-2 font-display text-[clamp(1.4rem,3vw,2.3rem)] leading-snug text-paper [text-shadow:0_2px_24px_rgba(0,0,0,0.55)]">{b.line}</p>
            )}
            {b.sub && <p className="mt-3 text-sm text-paper/80 md:text-base [text-shadow:0_1px_12px_rgba(0,0,0,0.6)]">{b.sub}</p>}
            {"contact" in b && b.contact && <CrownContact />}
          </>
        )}
      </div>
    </div>
  );
}

/** The journey's last beat is actionable: write, connect, or read everything in writing. */
function CrownContact() {
  const email = socialData.find((l) => l.platform === "Email")!;
  const linkedIn = socialData.find((l) => l.platform === "LinkedIn")!;
  const github = socialData.find((l) => l.platform === "GitHub")!;
  const pill = "inline-flex min-h-11 items-center gap-2 rounded-full border border-paper/30 bg-ink/40 px-4 text-sm text-paper backdrop-blur-sm transition-colors hover:border-signal hover:text-signal";
  return (
    <div className="pointer-events-auto mt-6 flex flex-wrap items-center gap-2">
      <a href={email.url} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-paper px-5 text-sm font-medium text-ink transition-colors hover:bg-signal">
        <MailIcon size={16} /> {email.handle}
      </a>
      <a href={linkedIn.url} target="_blank" rel="noopener noreferrer" className={pill}>
        <LinkedInIcon size={16} /> LinkedIn
      </a>
      <a href={github.url} target="_blank" rel="noopener noreferrer" className={pill}>
        <GitHubIcon size={16} /> GitHub
      </a>
      <button type="button" onClick={() => scrollToId("record")} className={pill}>
        Read the full portfolio <ArrowRight />
      </button>
    </div>
  );
}

function ChapterRail() {
  const chapter = useUi((s) => s.chapter);
  const fill = useRef<HTMLSpanElement[]>([]);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const p = frame.progress;
      CHAPTERS.forEach((c, i) => {
        const end = CHAPTERS[i + 1]?.start ?? 1;
        const f = Math.min(1, Math.max(0, (frame.scroll - c.start) / (end - c.start)));
        const el = fill.current[i];
        if (el) el.style.transform = `scaleX(${f})`;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <nav aria-label="Journey chapters" className="pointer-events-auto absolute inset-x-0 bottom-6 px-5 md:bottom-8 md:px-12">
      <p className="label mb-2 text-paper/80">
        <span className="tabular-nums text-sap">{String(chapter + 1).padStart(2, "0")}</span> · {CHAPTERS[chapter]?.title}
      </p>
      <ol className="flex max-w-xl gap-1.5">
        {CHAPTERS.map((c, i) => (
          <li key={c.id} className="flex-1">
            <button
              type="button"
              onClick={() => scrollToProgress(c.start + (i === 0 ? 0 : 0.3 / JOURNEY_VH))}
              aria-label={`Go to chapter ${i + 1}: ${c.title}`}
              aria-current={i === chapter ? "step" : undefined}
              className="group block w-full py-2"
            >
              <span className="relative block h-[2px] overflow-hidden rounded-full bg-paper/20 group-hover:bg-paper/40">
                <span ref={(el) => void (el && (fill.current[i] = el))} className="absolute inset-0 origin-left bg-paper" style={{ transform: "scaleX(0)" }} />
              </span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function FocusLabel() {
  const focusId = useUi((s) => s.focusId);
  const hoverId = useUi((s) => s.hoverId);
  const box = useRef<HTMLDivElement>(null);
  const entry = focusId ? entryById(focusId) : undefined;

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const el = box.current;
      if (el) {
        const narrow = window.innerWidth < 768;
        const visible = frame.focusVisible && frame.focusNear > 0.25;
        el.style.opacity = visible ? String(Math.min(1, (frame.focusNear - 0.25) * 2.5)) : "0";
        el.style.pointerEvents = visible ? "auto" : "none";
        if (narrow) {
          el.style.transform = "translate3d(0,0,0)";
        } else {
          const x = Math.min(window.innerWidth - 420, frame.focusX + frame.focusR + 28);
          const y = Math.max(90, Math.min(window.innerHeight - 330, frame.focusY - 110));
          el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={box}
      className="absolute bottom-28 left-4 right-4 top-auto max-w-sm transition-opacity duration-300 md:bottom-auto md:left-0 md:right-auto md:top-0 md:w-[380px]"
      style={{ opacity: 0 }}
    >
      {entry && (
        <div className="rounded-xl border border-line bg-ink/80 p-5 backdrop-blur-sm">
          <p className="label">{entry.kicker}</p>
          <p className="mt-2 font-display text-3xl leading-tight">{entry.title}</p>
          {entry.subtitle && <p className="text-sm text-paper-dim">{entry.subtitle}</p>}
          {entry.line && <p className="mt-3 text-[0.95rem] leading-snug text-paper/90">{entry.line}</p>}
          {entry.status && (
            <p className="mt-3 inline-flex items-center gap-2 text-xs text-paper-dim">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-signal" />
              {entry.status}
            </p>
          )}
          <div>
            <button
              type="button"
              onClick={() => openRecord(entry.id)}
              aria-haspopup="dialog"
              className={`mt-4 inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-medium transition-colors ${hoverId === entry.id ? "bg-signal text-ink" : "bg-paper text-ink hover:bg-signal"}`}
            >
              {entry.action} <ArrowRight />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Region cuts: the world fades to dark and back, hiding the change of place. */
function CutFade() {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (el.current) el.current.style.opacity = String(frame.cut);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <div ref={el} aria-hidden="true" className="pointer-events-none absolute inset-0 bg-black" style={{ opacity: 0 }} />;
}

const RING_LABEL: Record<RingKind, string> = {
  Milestone: "Milestone",
  Built: "Built",
  Experience: "Industry work",
  Result: "Results",
  Role: "Roles taken on",
  Entered: "Also competed in",
  Continuing: "Still running",
};

/**
 * The year in view, as a short documentary caption beside the ring rather than
 * a card: the three-year timeline, the stage, one line, and what it holds.
 * Every item here is one node on the ring.
 */
function RingPanel({ ring }: { ring: number }) {
  const stage = ring >= 0 ? RING_STAGES[ring] : null;
  return (
    <div
      className={`pointer-events-none absolute inset-0 flex items-start transition-opacity duration-500 md:items-center ${stage ? "opacity-100" : "opacity-0"}`}
      aria-live="polite"
    >
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/25 to-transparent md:bg-gradient-to-r md:from-black/65 md:via-black/30 md:via-35% md:to-transparent md:to-60%" />
      {stage && (
        <div key={stage.year} className="ring-panel relative w-full max-w-[33rem] px-5 pt-20 md:px-12 md:pb-16 md:pt-16" style={{ animation: "beat-in 800ms var(--ease-out-soft) both" }}>
          <ol className="label flex items-center gap-2 text-[0.62rem]" aria-label="Timeline">
            {RING_STAGES.map((st, i) => (
              <li key={st.year} className="flex items-center gap-2" aria-current={i === ring ? "step" : undefined}>
                <span className={i === ring ? "" : i < ring ? "text-paper/75" : "text-paper/40"} style={i === ring ? { color: st.color } : undefined}>
                  {st.year}
                </span>
                {i < RING_STAGES.length - 1 && (
                  <span aria-hidden="true" className="relative block h-px w-7 overflow-hidden bg-paper/25 md:w-10">
                    <span className="absolute inset-0 origin-left bg-paper/70" style={{ transform: `scaleX(${i < ring ? 1 : 0})` }} />
                  </span>
                )}
              </li>
            ))}
          </ol>
          <p className="mt-3 font-display text-[clamp(2.75rem,min(7vw,9.5svh),5.5rem)] leading-[0.9] tracking-tight [text-shadow:0_2px_30px_rgba(0,0,0,0.5)] md:mt-5" style={{ color: stage.color }}>
            {stage.year}
          </p>
          <p className="label mt-3 text-paper">
            Ring {ring + 1} · {stage.stage}
          </p>
          <p className="mt-3 max-w-md font-display text-lg leading-snug text-paper [text-shadow:0_1px_16px_rgba(0,0,0,0.6)] md:text-xl">{stage.summary}</p>
          <dl className="ring-groups mt-4 grid gap-y-2.5 md:mt-5 md:gap-y-3">
            {stage.groups.map((g) => (
              <div key={g.kind}>
                <dt className="label text-[0.6rem]" style={{ color: stage.color }}>
                  {RING_LABEL[g.kind]}
                </dt>
                <dd>
                  <ul className="mt-1 space-y-0.5">
                    {g.items.map((it) => (
                      <li key={it.title + (it.detail ?? "")} className="text-[0.85rem] leading-snug text-paper md:text-[0.95rem] [text-shadow:0_1px_10px_rgba(0,0,0,0.7)]">
                        {it.title}
                        {it.detail && <span className="text-paper/70"> — {it.detail}</span>}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}

function PetHint() {
  const el = useRef<HTMLDivElement>(null);
  const [used, setUsed] = useState(false);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const d = el.current;
      if (d) {
        d.style.opacity = frame.petVisible && !used ? "1" : "0";
        d.style.transform = `translate3d(${frame.petX - 60}px, ${frame.petY - 52}px, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const onClick = () => frame.petVisible && setUsed(true);
    window.addEventListener("pointerdown", onClick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointerdown", onClick);
    };
  }, [used]);
  return (
    <div ref={el} aria-hidden="true" className="pointer-events-none absolute left-0 top-0 w-[120px] text-center text-xs text-paper transition-opacity duration-500" style={{ opacity: 0 }}>
      <span className="rounded-full bg-ink/70 px-2.5 py-1 backdrop-blur-sm">Bella · click her</span>
    </div>
  );
}

function ScrollCue() {
  const el = useRef<HTMLDivElement>(null);
  const ready = useUi((s) => s.ready);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (el.current) el.current.style.opacity = ready && frame.progress < 0.012 ? "1" : "0";
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ready]);
  return (
    <div ref={el} aria-hidden="true" className="pointer-events-none absolute bottom-24 right-6 flex flex-col items-center gap-3 transition-opacity duration-700 md:right-12" style={{ opacity: 0 }}>
      <span className="label [writing-mode:vertical-rl]">Scroll</span>
      <span className="relative h-14 w-px overflow-hidden bg-paper/25">
        <span className="absolute inset-x-0 top-0 h-5 animate-[cue_1.8s_ease-in-out_infinite] bg-paper" />
      </span>
    </div>
  );
}

/** The world fades to ink as the journey ends, so the portfolio continues seamlessly. */
function Outro() {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (el.current) el.current.style.opacity = String(Math.min(1, Math.max(0, (frame.progress - 0.975) / 0.025)));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <div ref={el} aria-hidden="true" className="pointer-events-none absolute inset-0 bg-ink" style={{ opacity: 0 }} />;
}

export function JourneyOverlay() {
  const inWorld = useUi((s) => s.inWorld);
  const ready = useUi((s) => s.ready);
  const { beat, ring } = useProgressBeat();
  return (
    <div className={`pointer-events-none fixed inset-0 z-20 transition-opacity duration-700 ${inWorld && ready ? "opacity-100" : "opacity-0"}`} style={{ visibility: inWorld ? "visible" : "hidden" }}>
      {/* A gentle gradient keeps the lower-third text readable over any frame. */}
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-black/45 to-transparent" />
      <Outro />
      <CutFade />
      <Narration beat={beat} />
      <RingPanel ring={ring} />
      <FocusLabel />
      <WorldTags />
      <PetHint />
      <ScrollCue />
      <ChapterRail />
    </div>
  );
}
