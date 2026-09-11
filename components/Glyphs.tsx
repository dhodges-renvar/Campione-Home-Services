const P = { fill: 'none', stroke: '#7A828A', strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const box = { className: 'glyph', viewBox: '0 0 24 24', xmlns: 'http://www.w3.org/2000/svg' };

export const IconToday = () => (
  <svg {...box}><rect {...P} x="3" y="5" width="18" height="16" rx="2" />
    <line {...P} x1="3" y1="10" x2="21" y2="10" /><line {...P} x1="8" y1="3" x2="8" y2="7" />
    <line {...P} x1="16" y1="3" x2="16" y2="7" /></svg>
);
export const IconQuote = () => (
  <svg {...box}><path {...P} d="M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
    <path {...P} d="M14 3v5h5" /><line {...P} x1="9" y1="13" x2="15" y2="13" />
    <line {...P} x1="9" y1="17" x2="13" y2="17" /></svg>
);
export const IconLeads = () => (
  <svg {...box}><path {...P} d="M4 6h16v12H4z" /><path {...P} d="M4 7l8 6 8-6" /></svg>
);
export const IconNumbers = () => (
  <svg {...box}><line {...P} x1="5" y1="20" x2="5" y2="12" /><line {...P} x1="12" y1="20" x2="12" y2="5" />
    <line {...P} x1="19" y1="20" x2="19" y2="15" /></svg>
);
export const IconSetup = () => (
  <svg {...box}><circle {...P} cx="12" cy="12" r="3" />
    <path {...P} d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.9 19.3a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.7 8.9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9v0a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1z" /></svg>
);
