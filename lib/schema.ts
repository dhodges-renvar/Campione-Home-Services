import { SITE, AREAS, COUNTIES } from './site';
import { DIVISIONS, type Division, type Faq } from './divisions';

const abs = (path = '') => `${SITE.url}${path}`;
export const BIZ_ID = abs('/#business');

/**
 * One LocalBusiness node, referenced by @id everywhere else. Keeping a single
 * canonical node is what lets Google, Bing and the answer engines resolve every
 * page back to the same entity instead of inferring six separate businesses.
 */
export function localBusiness() {
  return {
    '@type': ['HomeAndConstructionBusiness', 'GeneralContractor', 'Painter'],
    '@id': BIZ_ID,
    name: SITE.name,
    legalName: SITE.legal,
    url: SITE.url,
    telephone: SITE.phone,
    email: SITE.email,
    description: SITE.elevator,
    foundingDate: SITE.founded,
    priceRange: '$$',
    currenciesAccepted: 'USD',
    paymentAccepted: 'Cash, Check, Credit Card, ACH',
    image: abs('/opengraph-image'),
    logo: abs('/icon.svg'),
    ...(SITE.gbpUrl ? { sameAs: [SITE.gbpUrl] } : {}),
    address: {
      '@type': 'PostalAddress',
      streetAddress: SITE.street,
      addressLocality: SITE.city,
      addressRegion: SITE.state,
      postalCode: SITE.zip,
      addressCountry: 'US',
    },
    geo: { '@type': 'GeoCoordinates', latitude: SITE.lat, longitude: SITE.lng },
    openingHoursSpecification: SITE.hours.map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: h.days.map((d) => `https://schema.org/${d}`),
      opens: h.open,
      closes: h.close,
    })),
    areaServed: [
      ...COUNTIES.map((c) => ({
        '@type': 'AdministrativeArea',
        name: `${c} County, Georgia`,
      })),
      ...AREAS.map((a) => ({ '@type': 'City', name: `${a}, GA` })),
    ],
    knowsAbout: DIVISIONS.flatMap((d) => d.schemaServices),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Divisions',
      itemListElement: DIVISIONS.map((d) => ({
        '@type': 'OfferCatalog',
        name: d.name,
        url: abs(`/${d.slug}`),
        itemListElement: d.schemaServices.map((s) => ({
          '@type': 'Offer',
          itemOffered: { '@type': 'Service', name: s },
        })),
      })),
    },
  };
}

export function website() {
  return {
    '@type': 'WebSite',
    '@id': abs('/#website'),
    url: SITE.url,
    name: SITE.name,
    publisher: { '@id': BIZ_ID },
    inLanguage: 'en-US',
  };
}

export function serviceNode(d: Division) {
  return {
    '@type': 'Service',
    '@id': abs(`/${d.slug}#service`),
    name: `${d.name} — ${SITE.name}`,
    serviceType: d.name,
    description: d.metaDesc,
    url: abs(`/${d.slug}`),
    provider: { '@id': BIZ_ID },
    areaServed: AREAS.map((a) => ({ '@type': 'City', name: `${a}, GA` })),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: `${d.name} services`,
      itemListElement: d.services.map((s) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: s.title, description: s.body },
      })),
    },
  };
}

export function faqPage(items: Faq[], pathname: string) {
  return {
    '@type': 'FAQPage',
    '@id': abs(`${pathname}#faq`),
    mainEntity: items.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export function breadcrumbs(trail: { name: string; path: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: [{ name: 'Home', path: '/' }, ...trail].map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: t.name,
      item: abs(t.path),
    })),
  };
}

export function webPage(opts: {
  path: string;
  name: string;
  description: string;
  about?: string;
}) {
  return {
    '@type': 'WebPage',
    '@id': abs(`${opts.path}#webpage`),
    url: abs(opts.path),
    name: opts.name,
    description: opts.description,
    isPartOf: { '@id': abs('/#website') },
    about: { '@id': opts.about ?? BIZ_ID },
    inLanguage: 'en-US',
  };
}

/** Everything on one page goes in a single @graph. One script tag per page. */
export const graph = (nodes: object[]) => ({
  '@context': 'https://schema.org',
  '@graph': nodes,
});
