// Single source of truth for everything that appears in more than one place.
// Change it here and it changes site-wide, in the schema markup, and in llms.txt.

export const SITE = {
  name: 'Campione Home Services',
  legal: 'Campione Home Services LLC',
  shortName: 'Campione',
  url: 'https://campionehomeservices.com',

  phone: '(404) 341-4382',
  phoneHref: 'tel:+14043414382',
  email: 'info@campionehomeservices.com',

  street: '1529 Roscoe Davis Road',
  city: 'Monroe',
  state: 'GA',
  stateFull: 'Georgia',
  zip: '30656',
  county: 'Walton County',
  lat: 33.7948,
  lng: -83.7132,

  founded: '2017',
  rating: 5.0,
  reviewCount: 20,

  // Paste the Google Business Profile share link here once it is live. While it
  // is empty the rating renders as plain text and is left out of the schema —
  // we do not claim a rating we cannot point at.
  gbpUrl: '',

  hours: [
    { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], open: '07:00', close: '19:00' },
    { days: ['Saturday'], open: '09:00', close: '15:00' },
  ],
  hoursLabel: 'Mon–Fri 7am–7pm · Sat 9am–3pm',

  tagline: 'Six trades. One contractor who answers the phone.',
  elevator:
    'Campione Home Services is a Monroe, Georgia contractor running six divisions — painting, drywall, exteriors, cleaning, pressure washing and construction management — for homeowners, builders, property managers and designers across Walton, Gwinnett and Barrow counties.',
} as const;

// Primary market first, then the ring we actually drive to.
export const AREAS = [
  'Monroe',
  'Loganville',
  'Winder',
  'Lawrenceville',
  'Snellville',
  'Grayson',
  'Dacula',
  'Bethlehem',
  'Watkinsville',
  'Athens',
  'Suwanee',
  'Duluth',
  'Johns Creek',
  'Alpharetta',
  'Roswell',
  'Marietta',
  'Braselton',
  'Hoschton',
  'Buford',
  'Covington',
] as const;

export const COUNTIES = ['Walton', 'Gwinnett', 'Barrow', 'Oconee', 'Newton', 'North Fulton'] as const;

// Who we work for. Used on the homepage and in the trade-facing copy.
export const CLIENT_TYPES = [
  {
    key: 'homeowners',
    color: '#D4A03C',
    label: 'Homeowners',
    body: 'One contractor for the whole punch list. You get a written scope, a start date, and the same phone number from estimate to walkthrough.',
  },
  {
    key: 'builders',
    color: '#546A7B',
    label: 'Builders & GCs',
    body: 'Production and custom. We hold a schedule, hit Level 5 where the plan calls for it, and send one invoice per phase instead of chasing change orders.',
  },
  {
    key: 'property',
    color: '#2E9B8F',
    label: 'Property managers',
    body: 'Turns, make-readies and recurring maintenance across a portfolio. Standing scopes, photo documentation, net terms.',
  },
  {
    key: 'designers',
    color: '#A0563A',
    label: 'Interior designers',
    body: 'Specialty finishes, cabinet refinishing and millwork painting on a designer timeline, with sample boards before anything goes on a wall.',
  },
] as const;

export type Area = (typeof AREAS)[number];
