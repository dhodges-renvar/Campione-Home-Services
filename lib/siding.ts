'use client';
/* Siding and exterior trim.
   This trade does NOT price off production hours like the others do.

   Campione subs siding to Miguel, so the cost is what Miguel invoices, not a
   man-hour count. The two are not close: his board and batten is $1.10/SF,
   and the hours model put the same work at $2.57. Pricing it by the hour cost
   Campione three bids in a row against the same builder.

   So sub_rate drives the number. production_rate is carried alongside it as a
   cross-check and as the basis when Campione's own crew does the work.

   Every rate also carries a status: 'confirmed' means it came off Miguel's own
   rate sheet, 'unvalidated' means nobody has ever quoted it and it is a guess
   waiting to be replaced. That distinction is the point — on the Tabor bid,
   63% of the money sat on rates Miguel had never seen. */

export type SidingItem = {
  id: string; code: string; label: string; unit: string;
  sub_rate: number;                 // what the sub charges — this is the cost
  production_rate: number | null;   // units per crew-hour, for self-perform and cross-check
  material_cost: number;            // per unit, only when Campione supplies material
  category: string;
  status: 'confirmed' | 'unvalidated';
  cornice_part: boolean;            // folded into the cornice assembly when one is used
  active: boolean; sort_order: number; notes: string | null;
};

export type SidingLine = { key: string; code: string; qty: number };
export const newSidingLine = (code: string): SidingLine =>
  ({ key: Math.random().toString(36).slice(2), code, qty: 0 });

export type SidingJob = {
  lines: SidingLine[];
  materialBy: 'builder' | 'campione';
  selfPerform: boolean;             // price off our own hours instead of the card
  businessType: string;
};

const CORNICE_CODES = ['cornice', 'cornice_frieze'];

export function sidingWarnings(job: SidingJob, items: SidingItem[], out_?: {
  unvalidatedShare: number; stackedCornice: number;
}): string[] {
  const byCode = new Map(items.map((i) => [i.code, i]));
  const live = job.lines.filter((l) => l.qty > 0);
  const has = (c: string) => live.some((l) => l.code === c);
  const out: string[] = [];

  const hasAssembly = CORNICE_CODES.some(has);
  const parts = live.filter((l) => byCode.get(l.code)?.cornice_part);

  if (hasAssembly && parts.length)
    out.push('The cornice is priced twice — once as an assembly and again as '
      + parts.map((p) => byCode.get(p.code)?.label).join(', ')
      + '. Use one or the other.');

  if (!hasAssembly && parts.length >= 3) {
    const lf = Math.max(...parts.map((p) => p.qty));
    const stacked = parts.reduce((a, p) => a + (byCode.get(p.code)!.sub_rate * p.qty), 0);
    const assembly = lf * (byCode.get('cornice_frieze')?.sub_rate ?? 6);
    if (stacked > assembly * 1.2)
      out.push(`Cornice is stacked from ${parts.length} separate lines at about `
        + `$${(stacked / lf).toFixed(2)}/LF. Miguel quotes the whole assembly at `
        + `$${(assembly / lf).toFixed(2)}. A crew sets staging once and runs the eave from it.`);
  }

  if (has('window_trim_lf'))
    out.push('Window trim is on the linear-foot line. Miguel bills $25 per window — '
      + 'use the per-window line so the unit matches the invoice.');

  if ((has('board_batten') || has('lap')) && !has('house_wrap'))
    out.push('Field siding with no house wrap. Confirm the builder is supplying it.');

  if (has('lap') && !has('starter_strip'))
    out.push('Lap siding with no starter strip.');

  const share = out_?.unvalidatedShare ?? 0;
  if (share > 0.4)
    out.push(`${Math.round(share * 100)}% of this bid sits on rates Miguel has never quoted. `
      + 'Worth a phone call before it goes out.');

  if (job.selfPerform)
    out.push('Priced on our own crew hours, not the sub rate card. Only correct if '
      + 'Campione is self-performing this one.');

  if (!live.length) out.push('Nothing measured yet.');
  return out;
}

export function priceSiding(o: {
  job: SidingJob; items: SidingItem[];
  laborRate: number; margin: number; minimum: number;
}) {
  const { job, items, laborRate, margin, minimum } = o;
  const byCode = new Map(items.map((i) => [i.code, i]));

  const rows: {
    code: string; label: string; unit: string; qty: number; status: string;
    rate: number; cost: number; hours: number | null; altCost: number; notes: string | null;
  }[] = [];

  let cost = 0, altCost = 0, hours = 0, material = 0, unvalidated = 0;

  for (const l of job.lines) {
    const it = byCode.get(l.code);
    if (!it || !l.qty) continue;

    const cardCost = it.sub_rate * l.qty;
    const h = it.production_rate ? l.qty / it.production_rate : null;
    const hourCost = h !== null ? h * laborRate : cardCost;   // no rate? fall back to the card

    const lineCost = job.selfPerform ? hourCost : cardCost;
    const lineAlt  = job.selfPerform ? cardCost : hourCost;

    const mat = job.materialBy === 'campione' ? it.material_cost * l.qty : 0;

    cost += lineCost + mat;
    altCost += lineAlt + mat;
    material += mat;
    if (h !== null) hours += h;
    if (it.status === 'unvalidated') unvalidated += lineCost;

    rows.push({
      code: it.code, label: it.label, unit: it.unit, qty: l.qty, status: it.status,
      rate: job.selfPerform && h !== null ? hourCost / l.qty : it.sub_rate,
      cost: lineCost + mat, hours: h, altCost: lineAlt + mat, notes: it.notes,
    });
  }

  const direct = cost;
  const calculated = margin < 1 ? direct / (1 - margin) : direct;
  const price = Math.max(calculated, minimum);
  const minimumApplied = price > calculated + 1e-9;

  return {
    rows, direct, material, hours, price,
    grossProfit: price - direct,
    minimumApplied,
    /* What the same takeoff costs on the other basis, so the gap between buying
       Miguel's crew and running our own is visible instead of assumed. */
    altDirect: altCost,
    altPrice: margin < 1 ? Math.max(altCost / (1 - margin), minimum) : altCost,
    unvalidated,
    unvalidatedShare: direct > 0 ? unvalidated / direct : 0,
    effectiveRate: hours > 0 ? price / hours : 0,
  };
}
