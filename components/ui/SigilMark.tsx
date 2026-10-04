import { useId } from "react";
import { getSigil } from "@/lib/world/sigils";

/** A project's sigil as crisp inline SVG — the same shapes the 3D relic is extruded from. */
export function SigilMark({ id, accent, size = 56, className = "" }: { id: string; accent: string; size?: number; className?: string }) {
  const sigil = getSigil(id);
  const gid = useId().replace(/:/g, "");
  const fill = (tone: string) => (tone === "gold" ? `url(#g${gid})` : tone === "accent" ? accent : "#1c140c");
  const aspect = sigil.w / sigil.h;
  return (
    <svg
      viewBox={`0 0 ${sigil.w} ${sigil.h}`}
      width={aspect >= 1 ? size : size * aspect}
      height={aspect >= 1 ? size / aspect : size}
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`g${gid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6dc93" />
          <stop offset="0.55" stopColor="#d9a849" />
          <stop offset="1" stopColor="#a8752c" />
        </linearGradient>
      </defs>
      {sigil.paths.map((p, i) => (
        <path key={i} d={p.d} fill={fill(p.tone)} fillRule="evenodd" />
      ))}
    </svg>
  );
}
