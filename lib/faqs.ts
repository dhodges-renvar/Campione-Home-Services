import type { Faq } from './divisions';
import { SITE } from './site';

/** Homepage and company-level questions. Division questions live on their pages. */
export const GENERAL_FAQ: Faq[] = [
  {
    q: 'What areas does Campione Home Services cover?',
    a: `We are based in ${SITE.city}, Georgia and work across Walton, Gwinnett, Barrow, Oconee and Newton counties, plus north Fulton. In practice that means Monroe, Loganville, Winder, Lawrenceville, Snellville, Grayson, Dacula, Bethlehem, Athens, Watkinsville, Buford, Braselton, Suwanee, Duluth, Johns Creek, Alpharetta, Roswell, Marietta and Covington. If you are near the edge of that, call and ask — we will tell you honestly whether we can serve you well.`,
  },
  {
    q: 'How fast will somebody get back to me?',
    a: 'Same business day if your request comes in before 4pm, and the following morning otherwise. That is a commitment, not a hope. If you want to skip the wait entirely, call the number at the top of the page and you will get a person.',
  },
  {
    q: 'Are estimates free?',
    a: 'Yes. We come out, measure the actual surfaces, and send a written scope with line items. There is no charge and no obligation. We would rather lose the job on price than win it on a number we guessed at over the phone.',
  },
  {
    q: 'Is Campione licensed and insured?',
    a: 'We carry general liability and workers compensation coverage, and a certificate of insurance goes out with every proposal. Work that requires a Georgia residential or general contractor license is performed under a licensed holder, and we tell you in writing who that is before the job starts.',
  },
  {
    q: 'Can I hire you for more than one division on the same project?',
    a: 'That is the point of the structure. Drywall repair, paint and a final clean on one scope, one schedule and one invoice is the normal way we run a project. Combining trades in a single visit is also cheaper than hiring three companies, because mobilization is a real cost and you only pay it once.',
  },
  {
    q: 'Do you work for builders and property managers, or just homeowners?',
    a: 'Both. Roughly half of what we do is trade work — production and custom builders, property management portfolios and interior designers — and the other half is direct residential. The trade side runs on standing scopes and net terms; the residential side runs on written proposals and deposits.',
  },
  {
    q: 'How long has Campione been in business?',
    a: `Since ${SITE.founded}, out of ${SITE.city} in ${SITE.county}. The painting division is the oldest; drywall, exteriors, pressure washing, cleaning and construction management grew out of jobs where customers asked us to handle the next thing too.`,
  },
  {
    q: 'What does it cost?',
    a: 'It depends on what the surfaces actually measure, and anyone who gives you a number before measuring is either guessing or planning to change it later. Each division page has a real range for typical work in this market so you can sanity-check a budget before you call.',
  },
];
