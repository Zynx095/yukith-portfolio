"use client";

import { useEffect, useRef, useState } from "react";

/**
 * How Q-SHIELD behaves, as a hands-on illustration of the README: a device
 * is trusted only while its evidence holds; when the evidence turns against
 * it, it is quarantined at the gateway; it returns only through an
 * operator-started, verified recovery; every decision lands in a signed
 * evidence chain. (The real engine weighs six factors with hysteresis —
 * this illustration simply shows the direction of each decision.)
 */

const EVIDENCE = [
  "Cryptographic identity",
  "Physical tamper switch",
  "Sensor ranges",
  "Configuration integrity",
  "Network liveness",
  "Signed camera observations",
];

type DeviceState = "trusted" | "quarantined" | "recovering";

const STATE_STYLE: Record<DeviceState, { label: string; color: string; note: string }> = {
  trusted: { label: "Trusted", color: "#7fd18b", note: "All evidence holds — the device keeps its access." },
  quarantined: { label: "Quarantined", color: "#ff7a6b", note: "Evidence turned against the device — it is quarantined at the gateway." },
  recovering: { label: "Verified recovery", color: "#e8c46a", note: "Operator-started recovery is rebuilding trust from fresh evidence." },
};

export function QShieldVisual({ accent }: { accent: string }) {
  const [against, setAgainst] = useState<boolean[]>(() => EVIDENCE.map(() => false));
  const [state, setState] = useState<DeviceState>("trusted");
  const [chain, setChain] = useState<string[]>(["Device enrolled"]);
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const record = (event: string) => setChain((c) => [...c, event].slice(-5));

  const toggle = (i: number) => {
    if (state === "recovering") return;
    const next = against.map((v, k) => (k === i ? !v : v));
    setAgainst(next);
    if (!against[i]) {
      record(`${EVIDENCE[i]} failed`);
      if (state === "trusted") {
        setState("quarantined");
        record("Quarantined at gateway");
      }
    }
  };

  const recover = () => {
    if (state !== "quarantined") return;
    setState("recovering");
    record("Operator started recovery");
    timer.current = window.setTimeout(() => {
      setAgainst(EVIDENCE.map(() => false));
      setState("trusted");
      record("Trust rebuilt · restored");
    }, 1600);
  };

  const s = STATE_STYLE[state];
  return (
    <div className="w-full rounded-xl border border-[#51321E] bg-[#15100C]/90 p-6 shadow-2xl md:p-8" style={{ boxShadow: `0 30px 80px -30px ${accent}55` }}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[#B99755]">Continuous trust · try it</p>
        <span
          className="rounded-full border px-3 py-1 font-mono text-xs uppercase tracking-[0.18em] transition-colors duration-500"
          style={{ borderColor: s.color, color: s.color, background: `${s.color}14` }}
          aria-live="polite"
        >
          {s.label}
        </span>
      </div>
      <p className="mb-5 min-h-[2.5rem] font-sans text-sm text-[#D8C9A8]/85">{s.note}</p>

      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {EVIDENCE.map((name, i) => (
          <li key={name}>
            <button
              type="button"
              onClick={() => toggle(i)}
              aria-pressed={against[i]}
              disabled={state === "recovering"}
              className="flex w-full items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left font-sans text-sm transition-colors disabled:opacity-60"
              style={{
                borderColor: against[i] ? "#ff7a6b80" : "#3A2417",
                background: against[i] ? "#ff7a6b12" : "#0D0A08",
                color: "#E8DCC0",
              }}
            >
              <span>{name}</span>
              <span className="font-mono text-xs" style={{ color: against[i] ? "#ff7a6b" : "#7fd18b" }} aria-hidden="true">
                {against[i] ? "✕ against" : "✓ holds"}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={recover}
          disabled={state !== "quarantined"}
          className="min-h-[44px] rounded border border-[#B99755] px-5 py-2 font-mono text-xs uppercase tracking-[0.18em] text-[#E3CB8A] transition-colors enabled:hover:bg-[#B99755] enabled:hover:text-[#0D0A08] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Start verified recovery
        </button>
        <span className="font-sans text-xs text-[#D8C9A8]/55">Tap a factor to make its evidence fail.</span>
      </div>

      <div className="mt-6 border-t border-[#3A2417] pt-5">
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.22em] text-[#D8C9A8]/60">Evidence chain · SHA-256 linked · ML-DSA-65 signed</p>
        <ol className="flex flex-wrap items-center gap-2" aria-label="Evidence chain">
          {chain.map((event, i) => (
            <li key={`${i}-${event}`} className="flex items-center gap-2">
              {i > 0 && <span className="text-[#51321E]" aria-hidden="true">—</span>}
              <span className="rounded border px-2.5 py-1 font-mono text-[11px] text-[#E8DCC0]" style={{ borderColor: `${accent}66`, background: `${accent}10` }}>
                {event}
              </span>
            </li>
          ))}
        </ol>
      </div>
      <p className="mt-4 font-sans text-[11px] leading-relaxed text-[#D8C9A8]/45">
        Illustration of the behaviour described in the README. The real trust engine weighs all six factors with hysteresis.
      </p>
    </div>
  );
}
