"use client";

import { useState } from "react";

/**
 * JIVA's Hospital Acceptance Protocol, as a hands-on illustration of the
 * README: a bed is never assumed open — a hospital's capacity stays UNKNOWN
 * until it gives a live, time-bounded acceptance; a rejection or a timeout
 * re-routes the ambulance automatically to the next hospital.
 */

type Reply = "pending" | "accepted" | "rejected" | "timeout";

interface Step {
  hospital: string;
  reply: Reply;
}

const HOSPITALS = ["Hospital A", "Hospital B", "Hospital C"];
const ROLES = ["Management", "Ambulance", "Hospital", "Patient"];

const REPLY_STYLE: Record<Reply, { label: string; color: string }> = {
  pending: { label: "UNKNOWN · awaiting reply", color: "#e8c46a" },
  accepted: { label: "ACCEPTED · time-bounded", color: "#7fd18b" },
  rejected: { label: "REJECTED", color: "#ff7a6b" },
  timeout: { label: "TIMED OUT", color: "#ff9f6b" },
};

export function JivaVisual({ accent }: { accent: string }) {
  const [steps, setSteps] = useState<Step[]>([{ hospital: HOSPITALS[0], reply: "pending" }]);
  const current = steps[steps.length - 1];
  const done = current.reply === "accepted";
  const exhausted = !done && current.reply !== "pending" && steps.length >= HOSPITALS.length;

  const answer = (reply: Exclude<Reply, "pending">) => {
    if (current.reply !== "pending") return;
    const next = steps.slice(0, -1).concat({ ...current, reply });
    if (reply !== "accepted" && next.length < HOSPITALS.length) next.push({ hospital: HOSPITALS[next.length], reply: "pending" });
    setSteps(next);
  };
  const reset = () => setSteps([{ hospital: HOSPITALS[0], reply: "pending" }]);

  return (
    <div className="w-full rounded-xl border border-[#51321E] bg-[#15100C]/90 p-6 shadow-2xl md:p-8" style={{ boxShadow: `0 30px 80px -30px ${accent}55` }}>
      <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.28em] text-[#B99755]">Hospital Acceptance Protocol · try it</p>
      <p className="mb-6 font-sans text-sm text-[#D8C9A8]/85">Never assume a bed is open. Answer for the hospital the ambulance is asking:</p>

      <ol className="mb-6 space-y-3" aria-live="polite">
        {steps.map((s, i) => {
          const st = REPLY_STYLE[s.reply];
          return (
            <li key={`${s.hospital}-${i}`} className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-mono text-xs" style={{ borderColor: `${accent}88`, color: accent }}>
                {i + 1}
              </span>
              <div className="flex flex-1 flex-wrap items-center justify-between gap-2 rounded-lg border border-[#3A2417] bg-[#0D0A08] px-4 py-3">
                <span className="font-sans text-sm text-[#E8DCC0]">
                  Ambulance → <strong className="font-semibold">{s.hospital}</strong>
                </span>
                <span className="font-mono text-[11px] uppercase tracking-[0.14em]" style={{ color: st.color }}>
                  {st.label}
                </span>
              </div>
            </li>
          );
        })}
      </ol>

      {!done && !exhausted && (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => answer("accepted")} className="min-h-[44px] rounded border border-[#7fd18b]/70 px-4 py-2 font-mono text-xs uppercase tracking-[0.16em] text-[#a8e6b0] transition-colors hover:bg-[#7fd18b]/15">
            Accept
          </button>
          <button type="button" onClick={() => answer("rejected")} className="min-h-[44px] rounded border border-[#ff7a6b]/70 px-4 py-2 font-mono text-xs uppercase tracking-[0.16em] text-[#ffb0a6] transition-colors hover:bg-[#ff7a6b]/15">
            Reject
          </button>
          <button type="button" onClick={() => answer("timeout")} className="min-h-[44px] rounded border border-[#ff9f6b]/70 px-4 py-2 font-mono text-xs uppercase tracking-[0.16em] text-[#ffc6a3] transition-colors hover:bg-[#ff9f6b]/15">
            No reply
          </button>
        </div>
      )}
      {(done || exhausted) && (
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-sans text-sm" style={{ color: done ? "#a8e6b0" : "#ffc6a3" }}>
            {done ? `Route locked to ${current.hospital} while its acceptance holds.` : "Every hospital in this example declined — no bed is ever assumed."}
          </p>
          <button type="button" onClick={reset} className="min-h-[40px] rounded-full border border-[#51321E] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-[#E3CB8A] transition-colors hover:border-[#B99755]">
            Run again
          </button>
        </div>
      )}
      {!done && steps.length > 1 && !exhausted && <p className="mt-3 font-sans text-xs text-[#D8C9A8]/60">Rejected or timed out — re-routed automatically.</p>}

      <div className="mt-6 border-t border-[#3A2417] pt-5">
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.22em] text-[#D8C9A8]/60">Four role-scoped apps · live over Socket.IO</p>
        <div className="flex flex-wrap gap-2">
          {ROLES.map((r) => (
            <span key={r} className="rounded-full border px-3 py-1 font-mono text-[11px] text-[#E8DCC0]" style={{ borderColor: `${accent}66`, background: `${accent}10` }}>
              {r}
            </span>
          ))}
        </div>
      </div>
      <p className="mt-4 font-sans text-[11px] leading-relaxed text-[#D8C9A8]/45">Illustration of the protocol described in the README.</p>
    </div>
  );
}
