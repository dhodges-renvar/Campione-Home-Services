import Link from 'next/link';

export type Crumb = { href?: string; label: string };

export default function Crumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      <div className="wrap">
        <ol>
          <li>
            <Link href="/">Home</Link>
          </li>
          {items.map((c, i) => (
            <li key={c.label} aria-current={i === items.length - 1 ? 'page' : undefined}>
              {c.href ? <Link href={c.href}>{c.label}</Link> : c.label}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}
