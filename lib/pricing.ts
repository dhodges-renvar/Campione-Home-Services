'use client';
/* Mirrors the v4 price book exactly.
   Hours = quantity / production rate (per coat).
   Coats MULTIPLY. Every other modifier ADDS its delta — multiplying them all
   together compounds absurdly, which is why the workbook does it this way.
   No opening deductions: cut-in labor offsets the paint saved, and doors and
   windows are priced as separate items on top. */

export type Rate = {
  id: string; code: string; label: string; unit: string;
  production_rate: number; coverage: number | null;
  material_cost: number | null; scope_group: string | null; category: string;
  notes?: string | null;
};
export type Modifier = {
  group_code: string; option_code: string; label: string;
  multiplier: number; is_multiplicative: boolean;
};
export type Settings = Record<string, number>;

export type MeasureMode = 'rect' | 'perimeter' | 'walls';
export type WallRun = { len: number; ht: number };

export type Room = {
  key: string; name: string;
  mode: MeasureMode;
  /* rect */
  length: number; width: number; height: number;
  /* perimeter: rep measures the total wall run directly — handles L-shapes,
     open concept, bays, angled walls, anything that is not a box */
  perimeterFt: number;
  /* walls: one entry per run, each with its own height — handles two-story
     foyers, half walls, and stairwells where heights differ */
  wallRuns: WallRun[];
  /* any mode: override when the ceiling footprint is not length x width */
  ceilingSf: number | null;
  /* LARGE openings only. Standard doors and windows are never deducted. */
  deductSf: number;
  /* gable or vault area above the plate line */
  vaultAddSf: number;
  doors: number; windows: number; closets: number;
  walls: boolean; ceiling: boolean; base: boolean; crown: boolean;
  paintDoors: boolean; paintWindows: boolean; paintClosets: boolean;
  notes?: string;
};

export const emptyRoom = (n = 1): Room => ({
  key: Math.random().toString(36).slice(2),
  name: `Room ${n}`, mode: 'rect',
  length: 0, width: 0, height: 9,
  perimeterFt: 0, wallRuns: [{ len: 0, ht: 9 }],
  ceilingSf: null, deductSf: 0, vaultAddSf: 0,
  doors: 0, windows: 0, closets: 0,
  walls: true, ceiling: true, base: true, crown: false,
  paintDoors: true, paintWindows: true, paintClosets: false,
});

/* Both workflows end up here. Room-Based derives these from rooms; Detailed
   Takeoff has the rep enter them directly. Everything downstream is identical,
   which is the whole point — one set of rates, two ways to collect. */
export type Qty = { code: string; qty: number };
export type SpecialtyLine = { key: string; code: string; qty: number };
export const newSpecialty = (code: string): SpecialtyLine =>
  ({ key: Math.random().toString(36).slice(2), code, qty: 0 });

export type JobSettings = {
  condition: string; coats: string; color: string; occupancy: string;
  access: string; texture: string; sheen: string; project_type: string;
  paint_tier: string; primer: boolean;
  door_scope: string; window_scope: string;
  business_type: string;
  miles: number; days_on_site: number;
  mode: 'room' | 'takeoff';
  /* Detailed Takeoff quantities, entered directly */
  takeoff: Record<string, number>;
  specialty: SpecialtyLine[];
  notes: string;
};

const rate = (rates: Rate[], code: string) => rates.find((r) => r.code === code);
const mod = (mods: Modifier[], g: string, o: string) =>
  mods.find((m) => m.group_code === g && m.option_code === o);

export function roomQuantities(r: Room) {
  let perimeter = 0;
  let grossWallSF = 0;

  if (r.mode === 'walls') {
    const runs = (r.wallRuns || []).filter((w) => w.len > 0);
    perimeter   = runs.reduce((s, w) => s + w.len, 0);
    grossWallSF = runs.reduce((s, w) => s + w.len * (w.ht || r.height || 0), 0);
  } else if (r.mode === 'perimeter') {
    perimeter   = r.perimeterFt || 0;
    grossWallSF = perimeter * (r.height || 0);
  } else {
    perimeter   = 2 * ((r.length || 0) + (r.width || 0));
    grossWallSF = perimeter * (r.height || 0);
  }

  // vault/gable adds area; large openings subtract it
  const netWallSF = Math.max(grossWallSF + (r.vaultAddSf || 0) - (r.deductSf || 0), 0);

  const autoCeiling = r.mode === 'rect' ? (r.length || 0) * (r.width || 0) : 0;
  const ceilingSF   = r.ceilingSf != null ? r.ceilingSf : autoCeiling;

  return {
    perimeter,
    grossWallSF,
    wallSF:    r.walls   ? netWallSF : 0,
    ceilingSF: r.ceiling ? ceilingSF : 0,
    baseLF:    r.base    ? Math.max(perimeter - (r.doors || 0) * 3, 0) : 0,
    crownLF:   r.crown   ? perimeter : 0,
    doors:     r.paintDoors   ? (r.doors || 0)   : 0,
    windows:   r.paintWindows ? (r.windows || 0) : 0,
    closets:   r.paintClosets ? (r.closets || 0) : 0,
  };
}

/** Warn the estimator when a room looks measured wrong. */
export function roomWarnings(r: Room): string[] {
  const q = roomQuantities(r);
  const out: string[] = [];
  if (r.walls && q.wallSF === 0) out.push('No wall area — check the measurements');
  if (r.ceiling && q.ceilingSF === 0)
    out.push('Ceiling is checked but no ceiling area. Enter it directly.');
  if (r.deductSf > 0 && r.deductSf > q.grossWallSF * 0.4)
    out.push('Deduction is over 40% of the wall area — is that right?');
  if (r.mode === 'rect' && r.height > 12)
    out.push('Ceiling over 12 ft — consider wall-by-wall so heights are separate');
  return out;
}

/** Room-Based: turn rooms into the same quantity list Takeoff produces. */
export function roomsToQuantities(rooms: Room[], job: JobSettings): Qty[] {
  let wallSF = 0, ceilingSF = 0, baseLF = 0, crownLF = 0, doors = 0, windows = 0, closets = 0;
  for (const r of rooms) {
    const q = roomQuantities(r);
    wallSF += q.wallSF; ceilingSF += q.ceilingSF; baseLF += q.baseLF; crownLF += q.crownLF;
    doors += q.doors; windows += q.windows; closets += q.closets;
  }
  return [
    { code: 'walls_smooth', qty: wallSF },
    { code: 'ceiling_smooth', qty: ceilingSF },
    { code: 'baseboard', qty: baseLF },
    { code: 'crown', qty: crownLF },
    { code: job.door_scope, qty: doors },
    { code: job.window_scope, qty: windows },
    { code: 'closet', qty: closets },
  ].filter((q) => q.qty > 0);
}

/** Detailed Takeoff: the rep's own numbers, already in quantity form. */
export function takeoffToQuantities(job: JobSettings): Qty[] {
  const out: Qty[] = Object.entries(job.takeoff || {})
    .filter(([, v]) => Number(v) > 0)
    .map(([code, v]) => ({ code, qty: Number(v) }));
  for (const s of job.specialty || []) if (s.qty > 0) out.push({ code: s.code, qty: s.qty });
  return out;
}

export function laborMultiplier(mods: Modifier[], s: JobSettings) {
  const coats = mod(mods, 'coats', s.coats)?.multiplier ?? 1.7;
  const primerAdd = s.primer ? 0.7 : 0;
  const deltas = [
    mod(mods, 'condition', s.condition)?.multiplier,
    mod(mods, 'color', s.color)?.multiplier,
    mod(mods, 'occupancy', s.occupancy)?.multiplier,
    mod(mods, 'access', s.access)?.multiplier,
    mod(mods, 'texture', s.texture)?.multiplier,
    mod(mods, 'sheen', s.sheen)?.multiplier,
    mod(mods, 'project_type', s.project_type)?.multiplier,
  ].map((m) => (m ?? 1) - 1);
  const additive = 1 + deltas.reduce((a, b) => a + b, 0);
  return (coats + primerAdd) * additive;
}

export function priceEstimate(opts: {
  rooms: Room[]; rates: Rate[]; mods: Modifier[]; settings: Settings;
  job: JobSettings; paintCost: number; margin: number; minimum: number;
}) {
  const { rooms, rates, mods, settings, job, paintCost, margin, minimum } = opts;
  const coatCount = Number(job.coats) || 2;
  const byCode = new Map(rates.map((r) => [r.code, r]));

  const quantities = job.mode === 'takeoff'
    ? takeoffToQuantities(job)
    : roomsToQuantities(rooms, job);

  let hours = 0, finishGal = 0, primerArea = 0;
  const lines: { label: string; qty: number; unit: string; hours: number; gallons: number }[] = [];

  for (const q of quantities) {
    const r = byCode.get(q.code);
    if (!r || !q.qty) continue;
    const h = q.qty / r.production_rate;
    const g = r.coverage ? (q.qty / r.coverage) * coatCount : 0;
    hours += h; finishGal += g;
    // primer goes on the broad surfaces, not on trim counts
    if (r.code === 'walls_smooth' || r.code === 'walls_textured' ||
        r.code === 'ceiling_smooth' || r.code === 'ceiling_textured') primerArea += q.qty;
    lines.push({ label: r.label, qty: q.qty, unit: r.unit, hours: h, gallons: g });
  }

  const mult = laborMultiplier(mods, job);
  const fieldHours = hours * mult;
  const setupHours = settings['setup_hours_per_job'] ?? 2;
  const totalHours = fieldHours + setupHours;

  const wallRate = byCode.get('walls_smooth');
  const primerGal = job.primer && wallRate?.coverage ? primerArea / wallRate.coverage : 0;

  const laborRate = settings['loaded_labor_rate'] ?? 35.75;
  const laborCost = totalHours * laborRate;
  const paint     = finishGal * paintCost + primerGal * 34;
  const sundries  = totalHours * (settings['sundries_per_hour'] ?? 3.5);
  const travel    = (settings['mileage_rate'] ?? 0.333) * (job.miles || 0) * (job.days_on_site || 1);

  const direct = laborCost + paint + sundries + travel;
  const calculated = margin < 1 ? direct / (1 - margin) : direct;
  const price = Math.max(calculated, minimum);

  return {
    lines, quantities,
    rawHours: hours, multiplier: mult, fieldHours, totalHours,
    manDays: totalHours / 8,
    finishGal, primerGal, laborCost, paint, sundries, travel,
    direct, calculated, price,
    grossProfit: price - direct,
    effectiveRate: totalHours ? price / totalHours : 0,
  };
}
