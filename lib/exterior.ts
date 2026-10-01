'use client';
/* Exterior painting.
   The body is measured per elevation and per material, because a house is
   rarely one substrate — fiber cement on three sides and brick on the front
   is normal. Everything else is a line item. */

export type ExtSurface = {
  id: string; code: string; label: string; unit: string;
  production_rate: number; coverage: number | null; category: string;
  default_coats: number; material_cost: number; by_elevation: boolean; notes: string | null;
};
export type ExtProduct = {
  id: string; code: string; label: string; kind: string;
  cost_per_gallon: number; coverage_factor: number; notes: string | null;
};
export type Mod = { group_code: string; option_code: string; label: string; multiplier: number };

export const ELEVATIONS = ['Front', 'Right', 'Rear', 'Left', 'Other'] as const;

export type BodyLine = { key: string; elevation: string; code: string; sf: number; product: string };
export type ExtLine  = { key: string; code: string; qty: number; coats: number; product: string };

export const newBody = (elevation = 'Front', code = 'body_fiber'): BodyLine =>
  ({ key: Math.random().toString(36).slice(2), elevation, code, sf: 0, product: 'ext_superpaint' });
export const newExtLine = (code: string, coats = 2): ExtLine =>
  ({ key: Math.random().toString(36).slice(2), code, qty: 0, coats, product: 'ext_superpaint' });

export type ExtJob = {
  body: BodyLine[];
  lines: ExtLine[];
  condition: string; stories: string; apply: string; colors: string;
  secondTrip: boolean; landscape: boolean; weather: boolean;
  businessType: string;
};

const mod = (m: Mod[], g: string, o: string) =>
  m.find((x) => x.group_code === g && x.option_code === o)?.multiplier ?? 1;

export function extWarnings(job: ExtJob, surfaces: ExtSurface[]): string[] {
  const has = (c: string) => job.lines.some((l) => l.code === c && l.qty > 0);
  const bodyCodes = job.body.filter((b) => b.sf > 0).map((b) => b.code);
  const out: string[] = [];
  if (!has('ext_wash')) out.push('No pressure wash. Almost every exterior needs one.');
  if (has('ext_wash') && !job.secondTrip)
    out.push('Washing means the house dries a day before coating. That is a second trip.');
  if (job.condition === 'failing' && !has('ext_scrape'))
    out.push('Finish is failing but there is no scrape line. That is most of this job.');
  if (job.condition === 'chalky' && !job.lines.some((l) => l.product === 'ext_primer' && l.qty > 0)
      && !job.body.some((b) => b.product === 'ext_primer'))
    out.push('Chalky surfaces need a bonding primer or the topcoat will not hold.');
  if ((bodyCodes.includes('body_brick') || bodyCodes.includes('body_stone') ||
       bodyCodes.includes('body_stucco') || bodyCodes.includes('body_block')) &&
      !job.body.some((b) => b.product === 'ext_masonry'))
    out.push('Masonry in scope. First coat should be a masonry primer or block filler.');
  if (bodyCodes.includes('body_brick'))
    out.push('Painting brick cannot be undone. Make sure the proposal says so.');
  if (bodyCodes.includes('body_vinyl'))
    out.push('Vinyl needs a vinyl-safe color. Darker than the original will warp the siding.');
  if (has('porch_iron') && !job.lines.some((l) => l.product === 'ext_rust' && l.qty > 0))
    out.push('Iron railing should get a rust-inhibitive primer.');
  if (job.apply === 'spray_back' && !has('ext_mask'))
    out.push('Spraying without a masking line. Windows, fixtures and landscaping all have to be covered.');
  if (has('porch_spindle') && has('porch_spindle_m'))
    out.push('Balusters are set to both coated and masked. Pick one.');
  if (job.body.every((b) => !b.sf)) out.push('No body square footage entered yet.');
  return out;
}

export function priceExterior(o: {
  job: ExtJob; surfaces: ExtSurface[]; products: ExtProduct[]; mods: Mod[];
  laborRate: number; margin: number; minimum: number; sundriesPerHour: number;
  settings: Record<string, number>;
}) {
  const { job, surfaces, products, mods, laborRate, margin, minimum, settings } = o;
  const byCode = new Map(surfaces.map((s) => [s.code, s]));
  const prod = new Map(products.map((p) => [p.code, p]));

  const cond    = mod(mods, 'ext_condition', job.condition);
  const stories = mod(mods, 'ext_stories', job.stories);
  const apply   = mod(mods, 'ext_apply', job.apply);
  const colors  = mod(mods, 'ext_colors', job.colors);
  const labourMult = 1 + (cond - 1) + (stories - 1) + (apply - 1) + (colors - 1);

  const rows: { label: string; detail: string; qty: number; unit: string;
                hours: number; gallons: number; material: number }[] = [];
  let hours = 0, materialCost = 0;

  const run = (code: string, qty: number, coats: number, productCode: string, detail: string) => {
    const s = byCode.get(code);
    if (!s || !qty) return;
    const c = Math.max(1, coats || s.default_coats);
    const h = (qty / s.production_rate) * c;
    let gallons = 0, mat = 0;
    if (s.coverage) {
      const p = prod.get(productCode);
      // chalky and rough surfaces drink product
      const cov = (s.coverage / (p?.coverage_factor ?? 1)) / cond;
      gallons = (qty / cov) * c;
      mat += gallons * (p?.cost_per_gallon ?? 58);
    }
    if (s.material_cost) mat += qty * s.material_cost;
    hours += h; materialCost += mat;
    rows.push({ label: s.label, detail, qty, unit: s.unit, hours: h, gallons, material: mat });
  };

  for (const b of job.body) run(b.code, b.sf, 2, b.product, b.elevation);
  for (const l of job.lines) run(l.code, l.qty, l.coats, l.product, '');

  const fieldHours = hours * labourMult;
  const extras =
    (job.secondTrip ? (settings['ext_second_trip_hours'] ?? 2) : 0) +
    (job.landscape ? (settings['ext_landscape_hours'] ?? 1.5) : 0);
  const base = fieldHours + extras;
  const weather = job.weather ? base * (settings['ext_weather_pct'] ?? 0.03) : 0;
  const totalHours = base + weather;

  const laborCost = totalHours * laborRate;
  const sundries  = totalHours * (o.sundriesPerHour || 0);
  const direct    = laborCost + materialCost + sundries;
  const calculated = margin < 1 ? direct / (1 - margin) : direct;
  const price = Math.max(calculated, minimum);

  const bodySf = job.body.reduce((a, b) => a + (b.sf || 0), 0);
  const totalGallons = rows.reduce((a, r) => a + r.gallons, 0);

  return {
    rows, labourMult, rawHours: hours, fieldHours, extras, weather, totalHours,
    laborCost, materialCost, sundries, direct, price,
    grossProfit: price - direct, totalGallons, bodySf,
    perSf: bodySf > 0 ? price / bodySf : 0,
    effectiveRate: totalHours > 0 ? price / totalHours : 0,
  };
}
