/**
 * Original emblems for the gaming archive — abstract marks drawn for this site.
 * They deliberately do not reproduce any publisher's rank icons or logos.
 */

type P = { size?: number; className?: string };

/** A faceted crown of crystal — "Immortal". */
export function ImmortalEmblem({ size = 72, className }: P) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true">
      <defs>
        <linearGradient id="em-imm" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff8a96" />
          <stop offset="0.55" stopColor="#d2324a" />
          <stop offset="1" stopColor="#5c1020" />
        </linearGradient>
      </defs>
      <path d="M32 4 L40 20 L54 14 L48 34 L56 44 L32 60 L8 44 L16 34 L10 14 L24 20 Z" fill="url(#em-imm)" />
      <path d="M32 4 L32 60 M24 20 L32 34 L40 20 M16 34 L32 34 L48 34 M8 44 L32 34 L56 44" stroke="#ffd6db" strokeOpacity="0.45" strokeWidth="1" fill="none" />
      <circle cx="32" cy="34" r="3.2" fill="#fff2f4" />
    </svg>
  );
}

/** Spread wings over a star — "Legendary Eagle". */
export function EagleEmblem({ size = 72, className }: P) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true">
      <defs>
        <linearGradient id="em-eag" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6e3a8" />
          <stop offset="1" stopColor="#8a6a26" />
        </linearGradient>
      </defs>
      <path d="M32 26 C24 18 14 16 4 18 C12 22 14 26 16 30 C10 30 6 32 4 34 C12 36 18 36 24 38 Z" fill="url(#em-eag)" />
      <path d="M32 26 C40 18 50 16 60 18 C52 22 50 26 48 30 C54 30 58 32 60 34 C52 36 46 36 40 38 Z" fill="url(#em-eag)" />
      <path d="M32 22 L35 31 L44 31 L37 37 L40 46 L32 40 L24 46 L27 37 L20 31 L29 31 Z" fill="#fff6d8" />
      <path d="M26 48 L32 58 L38 48" stroke="#c9a85a" strokeWidth="2" fill="none" />
    </svg>
  );
}

/** A crested shield with laurels — "Grandmaster". */
export function GrandmasterEmblem({ size = 72, className }: P) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true">
      <defs>
        <linearGradient id="em-gm" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9fb6ff" />
          <stop offset="1" stopColor="#2a3c86" />
        </linearGradient>
      </defs>
      <path d="M32 8 L50 14 L48 36 C46 46 40 52 32 58 C24 52 18 46 16 36 L14 14 Z" fill="url(#em-gm)" stroke="#e7d39a" strokeWidth="2" />
      <path d="M32 18 L36 28 L46 28 L38 34 L41 44 L32 38 L23 44 L26 34 L18 28 L28 28 Z" fill="#f4e7bd" />
      <path d="M10 30 C8 40 12 50 22 56 M54 30 C56 40 52 50 42 56" stroke="#e7d39a" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/** A trophy with a placement plate. */
export function TrophyEmblem({ size = 72, className, place = "4" }: P & { place?: string }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true">
      <defs>
        <linearGradient id="em-tr" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e8e6e1" />
          <stop offset="1" stopColor="#6d6a64" />
        </linearGradient>
      </defs>
      <path d="M20 8 H44 V22 C44 30 38 36 32 36 C26 36 20 30 20 22 Z" fill="url(#em-tr)" />
      <path d="M20 12 H12 C12 22 16 26 21 27 M44 12 H52 C52 22 48 26 43 27" stroke="#b9b5ad" strokeWidth="2.5" fill="none" />
      <rect x="29" y="36" width="6" height="10" fill="#a8a49c" />
      <rect x="18" y="46" width="28" height="10" rx="2" fill="#2c2a27" stroke="#b9b5ad" />
      <text x="32" y="54" textAnchor="middle" fontSize="8" fontFamily="ui-monospace, monospace" fill="#f0ece4">{place}TH</text>
    </svg>
  );
}

export const RANK_EMBLEM = { immortal: ImmortalEmblem, eagle: EagleEmblem, grandmaster: GrandmasterEmblem } as const;
