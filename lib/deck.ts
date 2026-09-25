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
  if (job.access !== 'ground' && !has('floor_under') && !has('posts'))
    out.push('Raised deck — underside, posts and skirt are usually in scope.');
  return out;
}

export function priceDeck(o: {
  job: DeckJob; surfaces: Surface[]; products: Product[]; mods: Mod[];
  laborRate: number; margin: number; minimum: number; sundriesPerHour: number;
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
  let hours = 0, materialCost = 0;

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
      mat += gallons * (p?.cost_per_gallon ?? 58);
    }
    if (s.material_cost) mat += l.qty * s.material_cost;

    hours += h; materialCost += mat;
    rows.push({ label: s.label, qty: l.qty, unit: s.unit, hours: h, gallons, material: mat });
  }

  const fieldHours = hours * labourMult;
  const extras =
    (job.secondTrip ? 2 : 0) + (job.furniture ? 1 : 0) + (job.landscape ? 0.75 : 0);
  const totalHours = fieldHours + extras;

  const laborCost = totalHours * laborRate;
  const sundries  = totalHours * (o.sundriesPerHour || 0);
  const direct    = laborCost + materialCost + sundries;
  const calculated = margin < 1 ? direct / (1 - margin) : direct;
  const price = Math.max(calculated, minimum);

  const totalGallons = rows.reduce((a, r) => a + r.gallons, 0);
  const deckSf = job.lines.find((l) => l.code === 'floor')?.qty ?? 0;

  return {
    rows, labourMult, rawHours: hours, fieldHours, extras, totalHours,
    laborCost, materialCost, sundries, direct, price,
    grossProfit: price - direct, totalGallons,
    perSf: deckSf > 0 ? price / deckSf : 0,
    effectiveRate: totalHours > 0 ? price / totalHours : 0,
  };
}
