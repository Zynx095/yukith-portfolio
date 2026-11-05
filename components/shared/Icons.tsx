/** Small inline icons (24-unit grid, currentColor). Decorative unless labelled by the caller. */

type P = { className?: string; size?: number };

const svg = (size: number, className: string | undefined, children: React.ReactNode, filled = false) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke={filled ? "none" : "currentColor"}
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    className={className}
  >
    {children}
  </svg>
);

export const GitHubIcon = ({ className, size = 18 }: P) =>
  svg(
    size,
    className,
    <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />,
    true
  );

export const LinkedInIcon = ({ className, size = 18 }: P) =>
  svg(
    size,
    className,
    <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4v11H3v-11Zm6.5 0h3.83v1.5h.06c.53-1 1.84-2.06 3.79-2.06 4.05 0 4.8 2.67 4.8 6.13v5.43h-4v-4.81c0-1.15-.02-2.63-1.6-2.63-1.6 0-1.85 1.25-1.85 2.55v4.89h-4.03v-11Z" />,
    true
  );

export const InstagramIcon = ({ className, size = 18 }: P) =>
  svg(
    size,
    className,
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </>
  );

export const MailIcon = ({ className, size = 18 }: P) =>
  svg(
    size,
    className,
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </>
  );

export const FileIcon = ({ className, size = 18 }: P) =>
  svg(
    size,
    className,
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
      <path d="M14 3v5h5M9 13h6M9 17h6" />
    </>
  );

export const ArrowUpRight = ({ className, size = 16 }: P) => svg(size, className, <path d="M7 17 17 7M8 7h9v9" />);
export const ArrowRight = ({ className, size = 16 }: P) => svg(size, className, <path d="M5 12h14M13 6l6 6-6 6" />);
export const CloseIcon = ({ className, size = 18 }: P) => svg(size, className, <path d="M6 6l12 12M18 6 6 18" />);
export const ChevronLeft = ({ className, size = 18 }: P) => svg(size, className, <path d="m15 6-6 6 6 6" />);
export const ChevronRight = ({ className, size = 18 }: P) => svg(size, className, <path d="m9 6 6 6-6 6" />);
export const IndexIcon = ({ className, size = 18 }: P) => svg(size, className, <path d="M4 6h16M4 12h16M4 18h10" />);

export const SoundIcon = ({ className, size = 18, on }: P & { on: boolean }) =>
  svg(
    size,
    className,
    <>
      <path d="M4 10v4h4l5 4V6L8 10H4Z" />
      {on ? <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /> : <path d="m17 9 5 6M22 9l-5 6" />}
    </>
  );
