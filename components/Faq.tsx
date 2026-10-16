import type { Faq as FaqItem } from '@/lib/divisions';

/**
 * Rendered as native <details>, so the answers are in the HTML on first paint.
 * Crawlers and answer engines read the text whether or not anything is clicked.
 */
export default function Faq({ items }: { items: FaqItem[] }) {
  return (
    <div className="faq">
      {items.map((f, i) => (
        <details key={f.q} open={i === 0}>
          <summary>{f.q}</summary>
          <div className="faq__a">
            <p>{f.a}</p>
          </div>
        </details>
      ))}
    </div>
  );
}
