import { divisionsInDeckOrder } from '@/lib/divisions';

const decks = divisionsInDeckOrder();

/**
 * The brand device: six equal segments of the division palette.
 * Sits under the header, at the foot of every hero, and above the footer.
 */
export default function DeckRule({ tall = false }: { tall?: boolean }) {
  return (
    <div className={tall ? 'deck-rule deck-rule--tall' : 'deck-rule'} aria-hidden>
      {decks.map((d) => (
        <span key={d.slug} style={{ background: d.color }} />
      ))}
    </div>
  );
}
