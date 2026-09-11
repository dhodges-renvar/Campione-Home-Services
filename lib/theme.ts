'use client';
/* The parent brand carries no color. Color enters only when a division does
   the work — same rule as the mark. Shell is monochrome; job screens take on
   their division's accent. Adding a division is one line here. */

export const DIVISION_COLOR: Record<string, string> = {
  painting:         '#2D6CA2',
  pressure_washing: '#2E9B8F',
  cleaning:         '#D4A03C',
  exteriors:        '#A0563A',
  construction:     '#7A5C8C',
};

export const PARENT = '#0E1114';
export const PARENT_INNER = '#7A828A';

export function divisionColor(d?: string | null) {
  return (d && DIVISION_COLOR[d]) || PARENT;
}

/** Sets --accent for everything inside a job screen. */
export function accentStyle(d?: string | null): React.CSSProperties {
  return { ['--accent' as any]: divisionColor(d) };
}

export const DIVISION_LABEL: Record<string, string> = {
  painting: 'Painting',
  pressure_washing: 'Pressure Washing',
  cleaning: 'Cleaning',
  exteriors: 'Exteriors',
  construction: 'Construction',
};
