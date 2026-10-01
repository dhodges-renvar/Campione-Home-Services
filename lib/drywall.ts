'use client';
/* Drywall estimating.
   Boards from square footage, materials from boards, labor per board.
   Finish level drives both finish labor and compound — it is the biggest
   swing in drywall and the thing most estimates get wrong. */

export type Board = {
  id: string; code: string; label: string; thickness: string;
  length_ft: number; width_ft: number; board_type: string; sf_per_board: number;
  price_each: number;
  /* three crews, paid separately */
  hang_each: number; finish_each: number; sand_each: number;
  ceiling_ok: boolean;
};
export type Material = {
  id: string; code: string; label: string; category: string; unit: string;
  basis: 'per_board' | 'per_100sf' | 'per_piece' | 'per_job';
  coverage: number | null; price_each: number;
  scales_with_level: boolean; ceiling_only: boolean;
  /* Materials sharing an option_group are alternatives — paper tape or mesh,
     setting compound or all-purpose. Exactly one is used per job. A material
     with no group is always included. */
  option_group: string | null; is_default: boolean;
};
export type Mod = { group_code: string; option_code: string; label: string; multiplier: number };

export type BeadLine = { code: string; pieces: number };

/* A house is never one board type. Wet walls get moisture resistant, garage
   ceilings get Type X, the rest gets standard. Each surface is its own line
   with its own square footage. */
/* Access rides on the LINE, not the job. A two-story foyer does not make the
   bedrooms harder to hang, so only the tall line carries the tall rate. */
export type BoardLine = { key: string; code: string; sf: number; access: string };

export const newLine = (code: string, access = 'standard'): BoardLine =>
  ({ key: Math.random().toString(36).slice(2), code, sf: 0, access });

export type DrywallJob = {
  turnkey: boolean;
  wallLines: BoardLine[];
  ceilingLines: BoardLine[];
  level: string;          // dw_level option
  access: string;         // dw_access option
  openings: number;
  beads: BeadLine[];
  dumpster: number;
  touchPrime: number; touchFinal: number; touchQc: number; touchHome: number;
  touchDrywall: number; extraSand: number;
  wastePct: number;
  businessType: string;
  /* which material was picked in each option group: { tape: 'tape_paper', ... } */
  picks: Record<string, string>;
};

const mod = (mods: Mod[], g: string, o: string) =>
  mods.find((m) => m.group_code === g && m.option_code === o)?.multiplier ?? 1;

/** Defaults for the option groups, straight from the price book. */
export function defaultPicks(materials: Material[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of materials) {
    if (!m.option_group) continue;
    if (m.is_default || !out[m.option_group]) out[m.option_group] = m.code;
  }
  return out;
}

export function priceDrywall(o: {
  job: DrywallJob; boards: Board[]; materials: Material[]; mods: Mod[];
  laborRate: number; margin: number; minimum: number; sundriesPerHour: number;
  minTripCharge?: number; minTripBoards?: number;
}) {
  const { job, boards, materials, mods, laborRate, margin, minimum } = o;
  const waste = 1 + (job.wastePct || 0);
  const byCode = new Map(boards.map((b) => [b.code, b]));

  const levelMult   = mod(mods, 'dw_level', job.level);
  const ceilingMult = mod(mods, 'dw_ceiling', 'ceiling');

  type Take = { board: Board; qty: number; sf: number; ceiling: boolean;
                access: string; accessMult: number };
  const takeoff: Take[] = [];

  const push = (l: BoardLine, ceiling: boolean) => {
    const b = byCode.get(l.code);
    if (!b || !l.sf) return;
    const access = l.access || job.access || 'standard';
    takeoff.push({
      board: b, qty: Math.ceil((l.sf / b.sf_per_board) * waste), sf: l.sf, ceiling,
      access, accessMult: mod(mods, 'dw_access', access),
    });
  };
  for (const l of job.wallLines) push(l, false);
  for (const l of job.ceilingLines) push(l, true);

  // merge only lines that match on board AND access, so a tall foyer stays
  // its own row instead of being averaged into the bedrooms
  const merged = new Map<string, Take>();
  for (const t of takeoff) {
    const k = `${t.board.code}|${t.ceiling}|${t.access}`;
    const e = merged.get(k);
    if (e) { e.qty += t.qty; e.sf += t.sf; } else merged.set(k, { ...t });
  }
  const rows = Array.from(merged.values());

  const wallBoards = rows.filter((r) => !r.ceiling).reduce((a, r) => a + r.qty, 0);
  const ceilBoards = rows.filter((r) => r.ceiling).reduce((a, r) => a + r.qty, 0);
  const totalBoards = wallBoards + ceilBoards;
  const totalSf = rows.reduce((a, r) => a + r.sf, 0);

  // ---- labor: hang, finish and sand are three crews ----
  let hang = 0, finish = 0, sand = 0;
  for (const r of rows) {
    const m = (r.ceiling ? ceilingMult : 1) * r.accessMult;
    hang   += r.qty * r.board.hang_each * m;
    finish += r.qty * r.board.finish_each * m * levelMult;
    sand   += r.qty * (r.board.sand_each ?? 0) * m * levelMult;
  }
  const boardLabor = hang + finish + sand;

  const touchHours = (job.touchPrime || 0) + (job.touchFinal || 0) +
                     (job.touchQc || 0) + (job.touchHome || 0) +
                     (job.touchDrywall || 0) + (job.extraSand || 0);
  const openingHours = (job.openings || 0) * 0.15;
  const hourlyLabor = (touchHours + openingHours) * laborRate;
  const laborCost = boardLabor + hourlyLabor;

  // ---- materials ----
  const lines: { label: string; qty: number; unit: string; cost: number; why?: string }[] = [];
  let materialCost = 0;

  for (const r of rows) {
    const cost = job.turnkey ? r.qty * r.board.price_each : 0;
    lines.push({
      label: (r.ceiling ? `${r.board.label} (ceiling)` : r.board.label)
             + (r.accessMult !== 1 ? ` — ${r.access.replace('_', ' ')}` : ''),
      qty: r.qty, unit: 'boards', cost,
      why: `${r.sf} sf / ${r.board.sf_per_board} sf per board, +${Math.round((waste - 1) * 100)}% waste`
           + (r.accessMult !== 1 ? ` · ${r.access.replace('_', ' ')} ×${r.accessMult.toFixed(2)}` : ''),
    });
    materialCost += cost;
  }

  const beadByCode = new Map(job.beads.filter((b) => b.pieces > 0).map((b) => [b.code, b.pieces]));

  for (const m of materials) {
    // in an option group, skip anything that was not picked
    if (m.option_group && job.picks[m.option_group] !== m.code) continue;
    let qty = 0;
    if (m.basis === 'per_board' && m.coverage) {
      const base = m.ceiling_only ? ceilBoards : totalBoards;
      const scaled = m.scales_with_level ? base * levelMult : base;
      qty = Math.ceil(scaled / m.coverage);
    } else if (m.basis === 'per_100sf' && m.coverage) {
      qty = Math.ceil((totalSf / 100) / m.coverage);
    } else if (m.basis === 'per_piece') {
      if (m.code === 'bead_fast') {
        const totalBead = Array.from(beadByCode.values()).reduce((a, b) => a + b, 0);
        qty = m.coverage ? Math.ceil(totalBead / m.coverage) : 0;
      } else {
        qty = beadByCode.get(m.code) ?? 0;
      }
    }
    if (qty > 0) {
      const cost = job.turnkey ? qty * m.price_each : 0;
      let why = '';
      if (m.basis === 'per_board' && m.coverage) {
        const base = m.ceiling_only ? ceilBoards : totalBoards;
        why = `${base} ${m.ceiling_only ? 'ceiling ' : ''}boards / ${m.coverage} per ${m.unit}` +
              (m.scales_with_level ? ` × ${levelMult.toFixed(2)} finish level` : '');
      } else if (m.basis === 'per_100sf' && m.coverage) {
        why = `${Math.round(totalSf)} sf, one ${m.unit} per ${m.coverage * 100} sf`;
      } else if (m.code === 'bead_fast' && m.coverage) {
        why = `one per ${m.coverage} pieces of bead`;
      }
      lines.push({ label: m.label, qty, unit: m.unit, cost, why: why || undefined });
      materialCost += cost;
    }
  }

  if (job.dumpster > 0) {
    lines.push({ label: 'Debris removal', qty: 1, unit: 'job', cost: job.dumpster });
    materialCost += job.dumpster;
  }

  const impliedHours = laborRate > 0 ? laborCost / laborRate : 0;
  const sundries = impliedHours * (o.sundriesPerHour || 0);

  // a small job cannot carry its own mobilization
  const tripApplies = totalBoards > 0 && totalBoards < (o.minTripBoards ?? 20);
  const tripCharge  = tripApplies ? (o.minTripCharge ?? 0) : 0;

  const direct = laborCost + materialCost + sundries + tripCharge;
  const calculated = margin < 1 ? direct / (1 - margin) : direct;
  const price = Math.max(calculated, minimum);

  return {
    wallBoards, ceilBoards, totalBoards, totalSf, rows,
    levelMult,
    hang, finish, sand, boardLabor, touchHours, openingHours, hourlyLabor,
    laborCost, materialCost, sundries, tripCharge, tripApplies, lines,
    direct, price,
    grossProfit: price - direct,
    impliedHours,
    perSf: totalSf > 0 ? price / totalSf : 0,
    perBoard: totalBoards > 0 ? price / totalBoards : 0,
  };
}
