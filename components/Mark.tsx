export default function Mark({ size = 44, inner = '#2D6CA2' }: { size?: number; inner?: string }) {
  return (
    <svg className="mark" width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <circle cx="50" cy="50" r="39" fill="none" stroke="#0E1114" strokeWidth="10"
        strokeDasharray="184 61" transform="rotate(28 50 50)" />
      <circle cx="50" cy="50" r="22" fill="none" stroke={inner} strokeWidth="8.5"
        strokeDasharray="104 35" transform="rotate(28 50 50)" />
    </svg>
  );
}
