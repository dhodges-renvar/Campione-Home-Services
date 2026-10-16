/** Cities we actually drive to, grouped the way the work is routed. */
export type AreaGroup = {
  county: string;
  color: string;
  blurb: string;
  cities: { name: string; note: string }[];
};

export const AREA_GROUPS: AreaGroup[] = [
  {
    county: 'Walton County',
    color: '#2D6CA2',
    blurb:
      'Home county. Shortest drive, fastest scheduling, and the market where most of our repeat and referral work lives.',
    cities: [
      { name: 'Monroe', note: 'Our base. Historic district trim and millwork work, plus newer subdivisions off Highway 78.' },
      { name: 'Loganville', note: 'Heavy repaint market — late-90s and 2000s subdivisions now hitting their second and third exterior cycle.' },
      { name: 'Covington', note: 'Older housing stock with real carpentry needs, and a steady stream of rental turns.' },
    ],
  },
  {
    county: 'Gwinnett County',
    color: '#546A7B',
    blurb:
      'Our largest volume county. A mix of production builder work, property management portfolios and direct residential repaints.',
    cities: [
      { name: 'Lawrenceville', note: 'Mixed stock from 1980s brick ranches to new infill. Interior repaints and drywall repair.' },
      { name: 'Snellville', note: 'Mature subdivisions where wood trim and fascia rot shows up before the paint does.' },
      { name: 'Grayson', note: 'Newer construction. Level 5 drywall and builder punch work.' },
      { name: 'Dacula', note: 'Active new-build corridor — production painting and drywall on schedule.' },
      { name: 'Suwanee', note: 'Higher-end custom work: cabinet refinishing and specialty finishes.' },
      { name: 'Duluth', note: 'Townhome and condo exteriors, plus designer-led interior finish work.' },
      { name: 'Buford', note: 'New construction and lake-adjacent exteriors that take a harder weather load.' },
      { name: 'Johns Creek', note: 'Custom residential. Specialty finishes, millwork and full-house repaints.' },
    ],
  },
  {
    county: 'Barrow County',
    color: '#A0563A',
    blurb: 'Fast-growing builder territory where we do a lot of drywall and production painting.',
    cities: [
      { name: 'Winder', note: 'Production subdivisions plus older in-town homes needing carpentry before paint.' },
      { name: 'Bethlehem', note: 'New build volume. Hang, finish and spray on a builder schedule.' },
      { name: 'Braselton', note: 'Custom and semi-custom. Level 5 drywall and finish carpentry painting.' },
      { name: 'Hoschton', note: 'Active growth corridor — new construction across all our divisions.' },
    ],
  },
  {
    county: 'Oconee & Athens',
    color: '#2E9B8F',
    blurb: 'Student-rental turns, custom residential and the occasional commercial soft wash contract.',
    cities: [
      { name: 'Watkinsville', note: 'Custom homes and acreage properties. Exteriors and specialty interior finishes.' },
      { name: 'Athens', note: 'Rental turns, make-readies and post-construction cleaning on a recurring cycle.' },
    ],
  },
  {
    county: 'North Fulton & Cobb',
    color: '#D4A03C',
    blurb:
      'A longer drive, so we take the work that justifies it: larger projects, designer collaborations and managed construction.',
    cities: [
      { name: 'Alpharetta', note: 'Whole-house repaints, cabinet refinishing and designer specialty work.' },
      { name: 'Roswell', note: 'Older custom homes with genuine exterior carpentry needs.' },
      { name: 'Marietta', note: 'Full-scope projects and construction management engagements.' },
    ],
  },
];

export const AREA_COUNT = AREA_GROUPS.reduce((n, g) => n + g.cities.length, 0);
