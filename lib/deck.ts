'use client';
/* Deck and porch estimating.
   Surfaces are line items — floor, rail, spindles, stairs, skirt, columns,
   screens — each with its own rate, coverage and coat count. Condition and
   previous finish are the two inputs that decide the size of the job. */

export type Surface = {
  id: string; code: string; label: string; unit: string;
  production_rate: number; coverage: number | null; category: string;
  default_coats: number; material_cost: number; notes: string | null;
};
export type Product = {
  id: string; code: string; label: string; kind: string;
  cost_per_gallon: number; coverage_factor: number; notes: string | null;
};
export type Mod = { group_code: string; option_code: string; label: string; multiplier: number };

export type DeckLine = {
  key: string; code: string; qty: number; coats: number; product: string;
};
export const newDeckLine = (code: string, coats = 2, product = 'semi_trans'): DeckLine =>
  ({ key: Math.random().toString(36).slice(2), code, qty: 0, coats, product });

export type DeckJob = {
  lines: DeckLine[];
  condition: string; prevFinish: string; access: string;
  secondTrip: boolean; furniture: boolean; landscape: boolean;
  businessType: string;
};

const mod = (m: Mod[], g: string, o: string) =>
  m.find((x) => x.group_code === g && x.option_code === o)?.multiplier ?? 1;

/** What the estimator should be warned about, based on what they picked. */
export function deckWarnings(job: DeckJob, surfaces: Surface[]): string[] {
  const has = (c: string) => job.lines.some((l) => l.code === c && l.qty > 0);
  const out: string[] = [];
  if (job.prevFinish === 'failing' && !has('strip'))
    out.push('Peeling finish — the deck has to be stripped. Add the strip line.');
  if (job.prevFinish === 'composite' && has('floor'))
    out.push('Composite boards do not take stain. Usually only the rail and structure get coated.');
  if (!has('wash') && !has('strip'))
    out.push('No wash and no strip. Almost every deck needs one of the two.');
  if (has('wash') && !job.secondTrip)
    out.push('Washing means 24-48 hours of drying. That is a second trip — turn it on.');
  const floor = job.lines.find((l) => l.code === 'floor');
  const prod = floor ? job.lines.find((l) => l.code === 'floor')!.product : null;
  if (floor && floor.coats > 1 && prod === 'semi_trans')
    out.push('Two coats of semi-transparent on a floor will peel. One coat is correct.');
  if (has('spindles_coat') && has('spindles_mask'))
    out.push('Spindles are set to both coated and masked. Pick one.');
  const anyPosts = ['posts', 'posts_low', 'posts_mid', 'posts_tall'].some(has);
  if (job.access !== 'ground' && !has('floor_under') && !anyPosts)
    out.push('Raised deck — underside, posts and skirt are usually in scope.');
  // even a ground-level deck sits on something, and it is the line people forget
  if (job.access === 'ground' && !anyPosts && job.lines.some((l) => l.code === 'floor' && l.qty > 0))
    out.push('No support posts in the quote. Even a low deck has them — check under it before you send.');
  return out;
}

export function priceDeck(o: {
  job: DeckJob; surfaces: Surface[]; products: Product[]; mods: Mod[];
  laborRate: number; margin: number; minimum: number; sundriesPerHour: number;
  /** Floor on billed crew hours — one crew-day, so a small deck still pays for the day. */
  minimumHours?: number;
  /** Cost product by the container rather than the decimal gallon. Default on. */
  roundMaterial?: boolean;
}) {
  const { job, surfaces, products, mods, laborRate, margin, minimum } = o;
  const byCode = new Map(surfaces.map((s) => [s.code, s]));
  const prodByCode = new Map(products.map((p) => [p.code, p]));

  const cond   = mod(mods, 'deck_condition', job.condition);
  const prev   = mod(mods, 'deck_prev', job.prevFinish);
  const access = mod(mods, 'deck_access', job.access);
  // modifiers add their deltas rather than compounding
  const labourMult = 1 + (cond - 1) + (prev - 1) + (access - 1);

  const rows: { label: string; qty: number; unit: string; hours: number;
                gallons: number; material: number }[] = [];
  const need = new Map<string, number>();   // product code -> raw gallons
  let hours = 0, hardMaterial = 0;

  for (const l of job.lines) {
    const s = byCode.get(l.code);
    if (!s || !l.qty) continue;
    const coats = Math.max(1, l.coats || s.default_coats);
    const h = (l.qty / s.production_rate) * coats;

    let gallons = 0, mat = 0;
    if (s.coverage) {
      const p = prodByCode.get(l.product);
      // weathered wood drinks product — condition cuts coverage
      const cov = (s.coverage / (p?.coverage_factor ?? 1)) / cond;
      gallons = (l.qty / cov) * coats;
      need.set(l.product, (need.get(l.product) ?? 0) + gallons);
      mat += gallons * (p?.cost_per_gallon ?? 58);   // indicative, for this row only
    }
    if (s.material_cost) { const hm = l.qty * s.material_cost; hardMaterial += hm; mat += hm; }

    hours += h;
    rows.push({ label: s.label, qty: l.qty, unit: s.unit, hours: h, gallons, material: mat });
  }

  /* Product is bought by the container, not by the decimal. Round each product up
     to whole gallons and cost what he actually carries off the shelf — stain is
     tinted to the job, so the leftover does not come back out on the next one. */
  const roundMaterial = o.roundMaterial !== false;
  const productLines = [...need.entries()].map(([code, raw]) => {
    const p = prodByCode.get(code);
    const buy = roundMaterial ? Math.ceil(raw - 1e-9) : raw;
    const fives = Math.floor(buy / 5), ones = buy - fives * 5;
    return {
      code, label: p?.label ?? code, raw, buy,
      packs: [fives ? `${fives} × 5 gal` : '', ones ? `${ones} × 1 gal` : '']
        .filter(Boolean).join(' + '),
      cost: buy * (p?.cost_per_gallon ?? 58),
    };
  }).sort((a, b) => b.buy - a.buy);
  const materialCost = productLines.reduce((a, x) => a + x.cost, 0) + hardMaterial;

  const fieldHours = hours * labourMult;
  const extras =
    (job.secondTrip ? 2 : 0) + (job.furniture ? 1 : 0) + (job.landscape ? 0.75 : 0);
  const workedHours = fieldHours + extras;

  /* A crew that leaves the yard costs a day whether the deck is 12x24 or 20x40.
     Floor the BILLED hours, not the price — flooring the price quietly eats the
     margin instead of covering the day. Held in hours so it survives a rate change. */
  const minHours = o.minimumHours ?? 0;
  const totalHours = Math.max(workedHours, minHours);
  const minimumHoursApplied = totalHours > workedHours + 1e-9;

  const laborCost = totalHours * laborRate;
  const sundries  = workedHours * (o.sundriesPerHour || 0);   // consumables track work, not time on site
  const direct    = laborCost + materialCost + sundries;
  const calculated = margin < 1 ? direct / (1 - margin) : direct;
  const price = Math.max(calculated, minimum);
  const minimumChargeApplied = price > calculated + 1e-9;

  const totalGallons = productLines.reduce((a, x) => a + x.buy, 0);
  const deckSf = job.lines.find((l) => l.code === 'floor')?.qty ?? 0;

  return {
    rows, productLines, labourMult, rawHours: hours, fieldHours, extras,
    workedHours, totalHours, minHours, minimumHoursApplied, minimumChargeApplied,
    laborCost, materialCost, sundries, direct, price,
    grossProfit: price - direct, totalGallons,
    perSf: deckSf > 0 ? price / deckSf : 0,
    effectiveRate: workedHours > 0 ? price / workedHours : 0,
  };
}
