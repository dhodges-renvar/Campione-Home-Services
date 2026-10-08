'use client';
/* Cleaning.
   Priced the same way as every other trade here — square footage over a
   production rate gives hours, hours carry labour and supplies, margin turns
   cost into price. The one exception is glass: Jorge has a published window
   list by size, so those bill at their own rate instead of flowing through the
   job margin. That keeps his sheet intact and it is honest about where the
   margin on glass actually is. */

export type CleanType = {
  id: string; code: string; label: string;
  production_rate: number; min_charge: number;
  is_recurring: boolean; is_commercial: boolean;
  default_condition: string; sort_order: number; notes: string | null;
};
export type CleanAddon = {
  id: string; code: string; label: string; unit: string;
  hours_each: number; material_cost: number; category: string;
  sort_order: number; notes: string | null;
};
export type WindowRate = {
  id: string; code: string; label: string; is_high: boolean;
  labor_each: number; bill_each: number; sort_order: number; notes: string | null;
};
export type Mod = { group_code: string; option_code: string; label: string; multiplier: number };

export type AddonLine = { key: string; code: string; qty: number };
export type WindowLine = { code: string; count: number };

export const newAddon = (code: string): AddonLine =>
  ({ key: Math.random().toString(36).slice(2), code, qty: 0 });

export type CleanJob = {
  type: string;
  sf: number;
  condition: string;
  stories: string;
  occupied: string;
  frequency: string;
  addons: AddonLine[];
  windows: WindowLine[];
  tripCharge: boolean;
  businessType: string;
};

export const VISITS_PER_YEAR: Record<string, number> = {
  one_time: 1, monthly: 12, biweekly: 26, weekly: 52,
};

const mod = (m: Mod[], g: string, o: string) =>
  m.find((x) => x.group_code === g && x.option_code === o)?.multiplier ?? 1;

export const winCount = (job: CleanJob, code: string) =>
  job.windows.find((w) => w.code === code)?.count ?? 0;

export function cleanWarnings(
  job: CleanJob, types: CleanType[], addons: CleanAddon[],
): string[] {
  const t = types.find((x) => x.code === job.type);
  const has = (c: string) => job.addons.some((a) => a.code === c && a.qty > 0);
  const glass = job.windows.reduce((a, w) => a + (w.code === 'grid' ? 0 : w.count), 0);
  const out: string[] = [];

  if (!job.sf) out.push('No square footage yet. Everything below is priced off it.');

  if (t?.code === 'post_final') {
    if (!has('overspray'))
      out.push('Post-construction final with no overspray line. Blade work on glass and hard surfaces is most of what makes this clean slow.');
    if (!has('dust_second'))
      out.push('Drywall dust settles again after the first pass. Price the second pass or come back for free.');
    if (!has('stickers'))
      out.push('No sticker removal. Every window, appliance and fixture comes with labels.');
    if (glass === 0)
      out.push('No glass on a post-construction final. Interior windows are almost always expected — ask before you send it.');
  }
  if ((t?.code === 'move_out' || t?.code === 'turn') && !has('cabinet_int'))
    out.push('Move-out and turn work almost always means cabinet and drawer interiors. It is the first thing an inspection catches.');
  if ((t?.code === 'move_out' || t?.code === 'turn') && !has('fridge_int') && !has('oven_int'))
    out.push('No appliance interiors on an empty-house clean.');
  if (t?.is_recurring && job.frequency === 'one_time')
    out.push('Recurring type with a one-time frequency. Pick a frequency or pick a different type of clean.');
  if (!t?.is_recurring && job.frequency !== 'one_time')
    out.push('Frequency is set but this is not a recurring clean. It will discount the price.');
  if (job.condition === 'post_heavy' && t && !['post_final','post_rough','comm_final'].includes(t.code))
    out.push('Post-construction condition on a non-construction clean. Check that is what you meant.');
  if (job.occupied === 'occupied' && (t?.code === 'move_out'))
    out.push('Move-out clean marked occupied. One of those is wrong.');
  if (has('grout') && !job.addons.some((a) => a.code === 'grout' && a.qty > 0))
    out.push('Grout detail is on with no square footage.');
  if (glass > 0 && winCount(job, 'grid') > glass)
    out.push('More grid adders than windows. The adder is per window, not per lite.');
  return out;
}

export function priceCleaning(o: {
  job: CleanJob; types: CleanType[]; addons: CleanAddon[]; windows: WindowRate[];
  mods: Mod[]; laborRate: number; suppliesPerHour: number; tripCharge: number;
  margin: number; minimum: number; crewSize: number;
}) {
  const { job, types, addons, windows, mods, laborRate, suppliesPerHour, margin, crewSize } = o;
  const t = types.find((x) => x.code === job.type);
  const byCode = new Map(addons.map((a) => [a.code, a]));
  const winByCode = new Map(windows.map((w) => [w.code, w]));

  const cond  = mod(mods, 'clean_condition', job.condition);
  const story = mod(mods, 'clean_stories', job.stories);
  const occ   = mod(mods, 'clean_occupied', job.occupied);
  const freq  = t?.is_recurring ? mod(mods, 'clean_frequency', job.frequency) : 1;
  // additive deltas, same convention as the exterior engine — three 10% bumps
  // should read as +30%, not +33%.
  const labourMult = (1 + (cond - 1) + (story - 1) + (occ - 1)) * freq;

  const rows: { label: string; detail: string; qty: number; unit: string;
                hours: number; material: number }[] = [];

  // base clean
  const baseHours = t && job.sf ? job.sf / t.production_rate : 0;
  if (baseHours > 0) {
    rows.push({ label: t!.label, detail: `${Math.round(job.sf).toLocaleString()} sf at ${t!.production_rate} sf/hr`,
                qty: job.sf, unit: 'SF', hours: baseHours, material: 0 });
  }

  // add-ons
  let addonHours = 0, addonMaterial = 0;
  for (const a of job.addons) {
    const d = byCode.get(a.code);
    if (!d || !a.qty) continue;
    const h = d.hours_each * a.qty;
    const m = d.material_cost * a.qty;
    addonHours += h; addonMaterial += m;
    rows.push({ label: d.label, detail: '', qty: a.qty, unit: d.unit, hours: h, material: m });
  }

  const rawHours   = baseHours + addonHours;
  const totalHours = rawHours * labourMult;
  const laborCost  = totalHours * laborRate;
  const supplies   = totalHours * (suppliesPerHour || 0);
  const trip       = job.tripCharge ? (o.tripCharge || 0) : 0;

  const cleanDirect = laborCost + supplies + addonMaterial;
  const calculated  = margin < 1 ? cleanDirect / (1 - margin) : cleanDirect;
  const cleanPrice  = Math.max(calculated, o.minimum || 0, t?.min_charge || 0);
  const minApplied  = cleanPrice > calculated + 0.005;

  // glass — billed off the published list, not through the job margin
  let windowLabor = 0, windowBill = 0, glassUnits = 0;
  const windowRows: { label: string; count: number; labor: number; bill: number }[] = [];
  for (const w of job.windows) {
    const rate = winByCode.get(w.code);
    if (!rate || !w.count) continue;
    const lab = rate.labor_each * w.count;
    const bil = rate.bill_each * w.count;
    windowLabor += lab; windowBill += bil;
    if (w.code !== 'grid') glassUnits += w.count;
    windowRows.push({ label: rate.label, count: w.count, labor: lab, bill: bil });
  }
  const windowMargin = windowBill > 0 ? (windowBill - windowLabor) / windowBill : 0;

  const price  = cleanPrice + windowBill + trip;
  const direct = cleanDirect + windowLabor + trip;

  const visits = t?.is_recurring ? (VISITS_PER_YEAR[job.frequency] ?? 1) : 1;
  const crew   = Math.max(1, crewSize || 2);

  return {
    rows, windowRows, labourMult, rawHours, totalHours,
    laborCost, supplies, addonMaterial, cleanDirect, cleanPrice, minApplied,
    windowLabor, windowBill, windowMargin, glassUnits, trip,
    direct, price, grossProfit: price - direct,
    // the proposal document reads these names across every trade
    materialCost: supplies + addonMaterial,
    marginPct: price > 0 ? (price - direct) / price : 0,
    perSf: job.sf > 0 ? price / job.sf : 0,
    crewDays: totalHours / crew / 8,
    visits, annual: price * visits,
    effectiveRate: totalHours > 0 ? price / totalHours : 0,
  };
}
