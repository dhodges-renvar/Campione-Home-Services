import Link from 'next/link';
import { divisionsInDeckOrder } from '@/lib/divisions';
import { DivisionIcon, IconArrow } from './Icons';

const decks = divisionsInDeckOrder();

/** Laid out like a fan deck opened on a counter: outer cards tilt, middle sits flat. */
const ROT = ['-4deg', '-2.4deg', '-0.8deg', '0.8deg', '2.4deg', '4deg'];
const LIFT = ['7px', '2px', '0px', '0px', '2px', '7px'];

export default function FanDeck() {
  return (
    <ul
      className="deck"
      style={{ listStyle: 'none', margin: 0, padding: 0 }}
      aria-label="Our six divisions"
    >
      {decks.map((d, i) => (
        <li
          key={d.slug}
          className="deck__card"
          style={
            {
              '--swatch': d.color,
              '--swatch-text': d.colorText,
              '--swatch-on': d.colorOn,
              '--rot': ROT[i],
              '--lift': LIFT[i],
            } as React.CSSProperties
          }
        >
          <div className="deck__swatch">
            <DivisionIcon name={d.icon} />
            <div>
              <div className="deck__num">{String(i + 1).padStart(2, '0')}</div>
              <div className="deck__name">{d.name}</div>
            </div>
          </div>
          <div className="deck__body">
            <p className="deck__tag">{d.tagline}</p>
            <span className="deck__go">
              See the work <IconArrow />
            </span>
          </div>
          <Link className="deck__link" href={`/${d.slug}`}>
            <span className="sr-only">{d.name}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
