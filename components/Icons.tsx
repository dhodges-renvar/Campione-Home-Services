import type { IconKey } from '@/lib/divisions';

const base = {
  viewBox: '0 0 24 24',
  width: 20,
  height: 20,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

/** Paint roller — painting. */
export const IconRoller = () => (
  <svg {...base}>
    <rect x="3" y="3.5" width="14" height="5.5" rx="1" />
    <path d="M17 6.25h2.5a1.5 1.5 0 0 1 1.5 1.5v2.5a1.5 1.5 0 0 1-1.5 1.5H12a1.5 1.5 0 0 0-1.5 1.5v1.5" />
    <rect x="8.75" y="15.5" width="3.5" height="5.5" rx="1" />
  </svg>
);

/** Finishing trowel — drywall. */
export const IconTrowel = () => (
  <svg {...base}>
    <path d="M2.6 13.2 12 5.2a1.4 1.4 0 0 1 1.9.1l6.4 6.4a1.4 1.4 0 0 1 .1 1.9l-8 9.4a1.3 1.3 0 0 1-2-.1L2.5 15.2a1.3 1.3 0 0 1 .1-2Z" />
    <path d="M13.5 4.8 15.8 2" />
    <path d="M9 10.5 13.5 15" />
  </svg>
);

/** Lap siding and corner board — exteriors. */
export const IconSiding = () => (
  <svg {...base}>
    <path d="M2.5 7.5h19M2.5 12h19M2.5 16.5h19" />
    <path d="M3 3.5h18v17H3z" />
    <path d="M16.5 3.5v17" />
  </svg>
);

/** Clipboard with a schedule — construction management. */
export const IconClipboard = () => (
  <svg {...base}>
    <path d="M9 3.5h6v2.2H9z" />
    <path d="M15 4.6h2.5a1.5 1.5 0 0 1 1.5 1.5V19a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19V6.1a1.5 1.5 0 0 1 1.5-1.5H9" />
    <path d="M8.5 11.5l1.6 1.6 3.4-3.4" />
    <path d="M8.5 16.8h7" />
  </svg>
);

/** Washer wand and spray fan — pressure washing. */
export const IconSpray = () => (
  <svg {...base}>
    <path d="M14.5 4.5h3.2a1.3 1.3 0 0 1 1.3 1.3v1.9a1.3 1.3 0 0 1-1.3 1.3H14.5z" />
    <path d="M14.5 6.75H9.2a1.6 1.6 0 0 0-1.6 1.6v1.3" />
    <path d="M7.6 10.3 4.4 20.5" />
    <path d="M10.4 10.3v3M13.4 11.3l1.6 2.6M4.5 12.6 2 14.4" />
  </svg>
);

/** Sparkle — cleaning. */
export const IconSparkle = () => (
  <svg {...base}>
    <path d="M9.5 2.8l1.8 4.9 4.9 1.8-4.9 1.8-1.8 4.9-1.8-4.9L2.8 9.5l4.9-1.8z" />
    <path d="M17.8 14.2l.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9z" />
  </svg>
);

export const IconPhone = () => (
  <svg {...base}>
    <path d="M6.2 3.2h3l1.5 3.8-2 1.3a11.6 11.6 0 0 0 5.8 5.8l1.3-2 3.8 1.5v3a1.6 1.6 0 0 1-1.7 1.6A15.6 15.6 0 0 1 4.6 4.9a1.6 1.6 0 0 1 1.6-1.7Z" />
  </svg>
);

export const IconArrow = () => (
  <svg {...base}>
    <path d="M4.5 12h14M13 6.5l5.5 5.5L13 17.5" />
  </svg>
);

export const IconCheck = () => (
  <svg {...base} strokeWidth={2.1}>
    <path d="M4.5 12.8l4.6 4.6L19.5 7" />
  </svg>
);

export const IconMinus = () => (
  <svg {...base} strokeWidth={2.1}>
    <path d="M5.5 12h13" />
  </svg>
);

export const IconMenu = () => (
  <svg {...base} strokeWidth={2}>
    <path d="M3.5 6.5h17M3.5 12h17M3.5 17.5h17" />
  </svg>
);

export const IconClose = () => (
  <svg {...base} strokeWidth={2}>
    <path d="M5.5 5.5l13 13M18.5 5.5l-13 13" />
  </svg>
);

export const IconMail = () => (
  <svg {...base}>
    <rect x="2.75" y="5" width="18.5" height="14" rx="1.5" />
    <path d="M3.5 6.5 12 13l8.5-6.5" />
  </svg>
);

export const IconPin = () => (
  <svg {...base}>
    <path d="M12 21.5s7-6.1 7-11.2A7 7 0 0 0 5 10.3c0 5.1 7 11.2 7 11.2Z" />
    <circle cx="12" cy="10" r="2.6" />
  </svg>
);

export const IconClock = () => (
  <svg {...base}>
    <circle cx="12" cy="12" r="8.75" />
    <path d="M12 7.2V12l3.4 2.1" />
  </svg>
);

export const IconStar = () => (
  <svg viewBox="0 0 24 24" width={17} height={17} fill="currentColor" aria-hidden>
    <path d="M12 2.5l2.9 6.1 6.6.9-4.8 4.6 1.2 6.5L12 17.5l-5.9 3.1 1.2-6.5L2.5 9.5l6.6-.9z" />
  </svg>
);

export const IconShield = () => (
  <svg {...base}>
    <path d="M12 2.9l7.5 2.6v6.2c0 4.4-3.1 8.3-7.5 9.4-4.4-1.1-7.5-5-7.5-9.4V5.5Z" />
    <path d="M8.6 12.1l2.3 2.3 4.5-4.5" />
  </svg>
);

export const IconRuler = () => (
  <svg {...base}>
    <path d="M3.4 14.6 14.6 3.4a1.3 1.3 0 0 1 1.9 0l4.1 4.1a1.3 1.3 0 0 1 0 1.9L9.4 20.6a1.3 1.3 0 0 1-1.9 0l-4.1-4.1a1.3 1.3 0 0 1 0-1.9Z" />
    <path d="M8.4 9.6l1.9 1.9M11.6 6.4l1.9 1.9M5.2 12.8l1.9 1.9" />
  </svg>
);

export const IconDoc = () => (
  <svg {...base}>
    <path d="M14 3.2H7a1.6 1.6 0 0 0-1.6 1.6v14.4A1.6 1.6 0 0 0 7 20.8h10a1.6 1.6 0 0 0 1.6-1.6V7.8Z" />
    <path d="M14 3.2v4.6h4.6" />
    <path d="M8.8 12.6h6.4M8.8 16.2h4.6" />
  </svg>
);

export const IconUsers = () => (
  <svg {...base}>
    <circle cx="9.2" cy="8.2" r="3.4" />
    <path d="M3 20.3a6.4 6.4 0 0 1 12.4 0" />
    <path d="M16.2 5.3a3.4 3.4 0 0 1 0 6.3M17.6 20.3a6.5 6.5 0 0 0-1.3-3.9" />
  </svg>
);

const MAP: Record<IconKey, () => JSX.Element> = {
  roller: IconRoller,
  trowel: IconTrowel,
  siding: IconSiding,
  clipboard: IconClipboard,
  spray: IconSpray,
  sparkle: IconSparkle,
};

export function DivisionIcon({ name }: { name: IconKey }) {
  const C = MAP[name] ?? IconRoller;
  return <C />;
}
