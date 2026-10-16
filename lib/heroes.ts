/* ============================================================================
   HERO PHOTOGRAPHY
   ----------------------------------------------------------------------------
   Background images appear in hero sections and nowhere else on this site.
   Where there is no photograph, the hero renders a built field instead — ink,
   a raked wash in the division colour, and fine grain — so a page without one
   still looks finished.

   TO ADD OR SWAP A PHOTO (one line each):
     1. Drop the file in  /public/img/hero/  named after the key below,
        e.g.  services.jpg. Crop to 16:9. Anything from 1600 px wide up is
        plenty — Next generates the smaller sizes and serves AVIF or WebP,
        so there is no need to compress it by hand first.
     2. Set `src` here.
     3. `focus` sets object-position. Use it to keep the subject out from
        behind the headline — 'right center' is usually right for a left-
        aligned hero.
     4. `dim` scales the dark scrim that guarantees the headline stays
        readable. 1 is the default. Drop toward 0.7 for an already-dark
        photograph so more of it shows; push past 1 for a bright one.
        The numbers below are set from each photo's measured brightness
        behind the headline.
   ========================================================================== */

export type Hero = {
  src: string;
  focus?: string;
  /** Scrim multiplier. 1 = default. Lower shows more photo, higher protects text. */
  dim?: number;
};

export const HERO_IMAGES: Record<string, Hero> = {
  // blue hour, two-storey Georgia custom home, wet drive
  home: { src: '/img/hero/home.jpg', focus: 'right center', dim: 0.78 },

  // still on the built field until there is a photograph worth the slot
  services: { src: '', focus: 'center' },
  about: { src: '', focus: 'center' },
  contact: { src: '', focus: 'center' },
  'service-area': { src: '', focus: 'center' },

  painting: { src: '/img/hero/painting.jpg', focus: 'right center', dim: 0.96 },
  drywall: { src: '/img/hero/drywall.jpg', focus: 'right center', dim: 0.92 },
  exteriors: { src: '/img/hero/exteriors.jpg', focus: 'right center', dim: 1.0 },
  'pressure-washing': {
    src: '/img/hero/pressure-washing.jpg',
    focus: 'right center',
    dim: 1.06,
  },
  cleaning: { src: '/img/hero/cleaning.jpg', focus: 'right center', dim: 1.06 },
  'construction-management': {
    src: '/img/hero/construction-management.jpg',
    focus: 'right center',
    dim: 1,
  },
};

export const heroFor = (key: string): Hero => HERO_IMAGES[key] ?? { src: '' };
