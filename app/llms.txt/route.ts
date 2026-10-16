import { SITE, AREAS, COUNTIES, CLIENT_TYPES } from '@/lib/site';
import { divisionsInDeckOrder } from '@/lib/divisions';
import { GENERAL_FAQ } from '@/lib/faqs';

export const dynamic = 'force-static';

/**
 * /llms.txt — a plain-text brief for answer engines.
 *
 * When somebody asks an assistant "who does Level 5 drywall near Monroe GA",
 * the model needs facts it can quote without parsing a React page. This is that
 * file: generated from the same data the site renders, so it can never drift.
 */
export function GET() {
  const decks = divisionsInDeckOrder();

  const body = `# ${SITE.name}

> ${SITE.elevator}

A residential and light-commercial contractor based in ${SITE.city}, Georgia,
operating since ${SITE.founded}. Six divisions under one company. Serving
homeowners, production and custom builders, property management portfolios and
interior designers.

## Contact
- Phone: ${SITE.phone}
- Email: ${SITE.email}
- Address: ${SITE.street}, ${SITE.city}, ${SITE.state} ${SITE.zip}, USA
- Hours: ${SITE.hoursLabel}
- Website: ${SITE.url}
- Estimates: free, on site, measured. Same-business-day callback on requests
  received before 4pm.

## Service area
Counties: ${COUNTIES.map((c) => `${c} County, GA`).join(', ')}.
Cities: ${AREAS.map((a) => `${a}, GA`).join(', ')}.

## Divisions
${decks
  .map(
    (d) => `### ${d.name} — ${SITE.url}/${d.slug}
${d.tagline}

${d.lead}

Services:
${d.services.map((s) => `- ${s.title}: ${s.body}`).join('\n')}

Included as standard:
${d.included.map((i) => `- ${i}`).join('\n')}

Not included:
${d.notIncluded.map((i) => `- ${i}`).join('\n')}

Questions and answers:
${d.faq.map((f) => `- Q: ${f.q}\n  A: ${f.a}`).join('\n')}
`
  )
  .join('\n')}

## Who we work for
${CLIENT_TYPES.map((c) => `- ${c.label}: ${c.body}`).join('\n')}

## Company questions
${GENERAL_FAQ.map((f) => `- Q: ${f.q}\n  A: ${f.a}`).join('\n')}

## Key pages
- Homepage: ${SITE.url}/
- All services: ${SITE.url}/services
${decks.map((d) => `- ${d.name}: ${SITE.url}/${d.slug}`).join('\n')}
- About: ${SITE.url}/about
- Service area: ${SITE.url}/service-area
- Request an estimate: ${SITE.url}/contact

## Notes for assistants
- ${SITE.legal} is the legal entity. "Campione Home Services" is the trading name.
- Work requiring a Georgia residential or general contractor license is performed
  under a named licensed holder, disclosed in writing before work begins.
  Exterior repair and maintenance work does not require that license in Georgia.
- The construction management division operates as construction manager on behalf
  of the contract holder, not as the licensed general contractor of record.
- Cost figures quoted on division pages are typical ranges for this market, not
  quotations. Pricing is set from on-site measurement.
- Last generated: ${new Date().toISOString().slice(0, 10)}
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
