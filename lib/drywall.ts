'use client';
/* Drywall estimating.
   Boards from square footage, materials from boards, labor per board.
   Finish level drives both finish labor and compound — it is the biggest
   swing in drywall and the thing most estimates get wrong. */

export type Board = {
  id: string; code: string; label: string; thickness: string;
  length_ft: number; width_ft: number; board_type: string; sf_per_board: number;
  price_each: number; hang_each: number; finish_each: number; ceiling_ok: boolean;
};
export type Material = {
  id: string; code: string; label: string; category: string; unit: string;
  basis: 'per_board' | 'per_100sf' | 'per_piece' | 'per_job';
  coverage: number | null; price_each: number;
  scales_with_level: boolean; ceiling_only: boolean;
};
export type Mod = { group_code: string; option_code: string; label: string; multiplier: number };

export type BeadLine = { code: string; pieces: number };

export type DrywallJob = {
  turnkey: boolean;
  wallSf: number;
  ceilingSf: number;
  wallBoardCode: string;
  ceilingBoardCode: string;
  level: string;          // dw_level option
  access: string;         // dw_access option
  openings: number;
  beads: BeadLine[];
  dumpster: number;
  touchPrime: number; touchFinal: number; touchQc: number; touchHome: number;
  wastePct: number;
  businessType: string;
};

const mod = (mods: Mod[], g: string, o: string) =>
  mods.find((m) => m.group_code === g && m.option_code === o)?.multiplier ?? 1;

export function priceDrywall(o: {
  job: DrywallJob; boards: Board[]; materials: Material[]; mods: Mod[];
  laborRate: number; margin: number; minimum: number; sundriesPerHour: number;
}) {
  const { job, boards, materials, mods, laborRate, margin, minimum } = o;
  const wall = boards.find((b) => b.code === job.wallBoardCode);
  const ceil = boards.find((b) => b.code === job.ceilingBoardCode);
  const waste = 1 + (job.wastePct || 0);

  const levelMult   = mod(mods, 'dw_level', job.level);
  const accessMult  = mod(mods, 'dw_access', job.access);
  const ceilingMult = mod(mods, 'dw_ceiling', 'ceiling');

  const wallBoards = wall ? Math.ceil((job.wallSf / wall.sf_per_board) * waste) : 0;
  const ceilBoards = ceil ? Math.ceil((job.ceilingSf / ceil.sf_per_board) * waste) : 0;
  const totalBoards = wallBoards + ceilBoards;
  const totalSf = (job.wallSf || 0) + (job.ceilingSf || 0);

  // ---- labor ----
  const hang =
    (wall ? wallBoards * wall.hang_each : 0) +
    (ceil ? ceilBoards * ceil.hang_each * ceilingMult : 0);
  const finish =
    ((wall ? wallBoards * wall.finish_each : 0) +
     (ceil ? ceilBoards * ceil.finish_each * ceilingMult : 0)) * levelMult;
  const boardLabor = (hang + finish) * accessMult;

  const touchHours = (job.touchPrime || 0) + (job.touchFinal || 0) +
                     (job.touchQc || 0) + (job.touchHome || 0);
  const openingHours = (job.openings || 0) * 0.15;
  const hourlyLabor = (touchHours + openingHours) * laborRate;
  const laborCost = boardLabor + hourlyLabor;

  // ---- materials ----
  const lines: { label: string; qty: number; unit: string; cost: number }[] = [];
  let materialCost = 0;

  if (job.turnkey) {
    if (wall && wallBoards) {
      const c = wallBoards * wall.price_each;
      lines.push({ label: wall.label, qty: wallBoards, unit: 'boards', cost: c });
      materialCost += c;
    }
    if (ceil && ceilBoards) {
      const c = ceilBoards * ceil.price_each;
      lines.push({ label: `${ceil.label} (ceiling)`, qty: ceilBoards, unit: 'boards', cost: c });
      materialCost += c;
    }
  }

  const beadByCode = new Map(job.beads.filter((b) => b.pieces > 0).map((b) => [b.code, b.pieces]));

  for (const m of materials) {
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
    if (qty > 0 && job.turnkey) {
      const c = qty * m.price_each;
      lines.push({ label: m.label, qty, unit: m.unit, cost: c });
      materialCost += c;
    } else if (qty > 0) {
      lines.push({ label: m.label, qty, unit: m.unit, cost: 0 });
    }
  }

  if (job.dumpster > 0) {
    lines.push({ label: 'Debris removal', qty: 1, unit: 'job', cost: job.dumpster });
    materialCost += job.dumpster;
  }

  const impliedHours = laborRate > 0 ? laborCost / laborRate : 0;
  const sundries = impliedHours * (o.sundriesPerHour || 0);

  const direct = laborCost + materialCost + sundries;
  const calculated = margin < 1 ? direct / (1 - margin) : direct;
  const price = Math.max(calculated, minimum);

  return {
    wallBoards, ceilBoards, totalBoards, totalSf,
    levelMult, accessMult,
    hang, finish, boardLabor, touchHours, openingHours, hourlyLabor,
    laborCost, materialCost, sundries, lines,
    direct, price,
    grossProfit: price - direct,
    impliedHours,
    perSf: totalSf > 0 ? price / totalSf : 0,
    perBoard: totalBoards > 0 ? price / totalBoards : 0,
  };
}
