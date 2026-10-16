import { ImageResponse } from 'next/og';
import { SITE } from '@/lib/site';
import { divisionsInDeckOrder } from '@/lib/divisions';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = `${SITE.name} — painting, drywall and home services in ${SITE.city}, GA`;

export default function OgImage() {
  const decks = divisionsInDeckOrder();

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#0E1114',
          color: '#FFFFFF',
          padding: '72px 76px 0',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: 30,
              fontWeight: 800,
              letterSpacing: -1,
              textTransform: 'uppercase',
            }}
          >
            Campione
          </div>
          <div style={{ fontSize: 15, letterSpacing: 7, color: '#FFFFFF', marginTop: 4 }}>
            HOME SERVICES
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: 56 }}>
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              lineHeight: 1.04,
              letterSpacing: -2.4,
              maxWidth: 900,
            }}
          >
            One contractor for everything the house needs.
          </div>
          <div style={{ display: 'flex', marginTop: 28, fontSize: 24, color: '#C9CDD2' }}>
            Painting · Drywall · Exteriors · Pressure Washing · Cleaning · Construction Mgmt
          </div>
          <div style={{ display: 'flex', marginTop: 22, fontSize: 24, color: '#FFFFFF' }}>
            {SITE.city}, GA · {SITE.phone}
          </div>
        </div>

        <div style={{ display: 'flex', width: '100%', height: 14, margin: '0 -76px' }}>
          {decks.map((d) => (
            <div key={d.slug} style={{ flex: 1, backgroundColor: d.color }} />
          ))}
        </div>
      </div>
    ),
    size
  );
}
