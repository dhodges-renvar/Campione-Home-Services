'use client';
/* Re-price a saved estimate from what was stored on it.
   The calculators compute live; the documents need the same numbers again
   later, so the whole take-off is rebuilt from the saved settings rather than
   stored twice and allowed to drift apart. */
import { supabase } from './supabase';
import { priceEstimate, JobSettings, Room } from './pricing';
import { priceDrywall, DrywallJob } from './drywall';
import { priceDeck, DeckJob } from './deck';

export type Doc = {
  estimate: any;
  trade: 'painting' | 'drywall' | 'deck';
  result: any;
  rooms: Room[];
  margin: number;
};

export async function loadDocument(id: string): Promise<Doc | null> {
  const { data: est } = await supabase.from('estimates')
    .select('*,contacts(first_name,last_name,phone,email),properties(address_line1,city,state,postal_code)')
    .eq('id', id).single();
  if (!est) return null;

  const trade = ((est.settings as any)?.trade ?? 'painting') as Doc['trade'];
  const [{ data: mods }, { data: bs }, { data: tm }] = await Promise.all([
    supabase.from('modifiers').select('*'),
    supabase.from('business_settings').select('key,value'),
    supabase.from('v_trade_margins').select('*')
      .eq('trade', trade === 'painting' ? 'painting' : trade)
      .eq('business_type', est.business_type).maybeSingle(),
  ]);
  const settings = Object.fromEntries((bs || []).map((x: any) => [x.key, Number(x.value)]));
  const margin = Number((tm as any)?.target_margin ?? est.target_margin ?? 0.45);
  const minimum = Number((tm as any)?.minimum_charge ?? 750);
  const job = est.settings as any;

  if (trade === 'drywall') {
    const [{ data: boards }, { data: materials }] = await Promise.all([
      supabase.from('drywall_boards').select('*'),
      supabase.from('drywall_materials').select('*').eq('active', true).order('sort_order'),
    ]);
    const result = priceDrywall({
      job: job as DrywallJob, boards: (boards as any) || [], materials: (materials as any) || [],
      mods: (mods as any) || [], laborRate: settings['loaded_labor_rate'] ?? 35.75,
      sundriesPerHour: settings['sundries_per_hour'] ?? 3.5, margin, minimum,
      minTripCharge: settings['dw_min_trip_charge'] ?? 212.5,
      minTripBoards: settings['dw_min_trip_boards'] ?? 20,
    });
    return { estimate: est, trade, result, rooms: [], margin };
  }

  if (trade === 'deck') {
    const [{ data: surfaces }, { data: products }] = await Promise.all([
      supabase.from('deck_surfaces').select('*'),
      supabase.from('deck_products').select('*'),
    ]);
    const result = priceDeck({
      job: job as DeckJob, surfaces: (surfaces as any) || [], products: (products as any) || [],
      mods: (mods as any) || [], laborRate: settings['loaded_labor_rate'] ?? 35.75,
      sundriesPerHour: settings['sundries_per_hour'] ?? 3.5, margin, minimum,
    });
    return { estimate: est, trade, result, rooms: [], margin };
  }

  const [{ data: rates }, { data: paints }, { data: rm }] = await Promise.all([
    supabase.from('rate_items').select('*'),
    supabase.from('paint_products').select('*'),
    supabase.from('estimate_rooms').select('*').eq('estimate_id', id).order('sort_order'),
  ]);
  const rooms: Room[] = (rm || []).map((r: any) => ({
    key: r.id, name: r.room_name, mode: r.mode ?? 'rect',
    length: Number(r.length_ft) || 0, width: Number(r.width_ft) || 0,
    height: Number(r.ceiling_ht_ft) || 9, perimeterFt: Number(r.perimeter_ft) || 0,
    wallRuns: r.walls ?? [], ceilingSf: r.ceiling_sf != null ? Number(r.ceiling_sf) : null,
    deductSf: Number(r.deduct_sf) || 0, vaultAddSf: Number(r.vault_add_sf) || 0,
    doors: r.door_count ?? 0, windows: r.window_count ?? 0, closets: r.closet_count ?? 0,
    walls: r.paint_walls, ceiling: r.paint_ceiling, base: r.paint_base, crown: r.paint_crown,
    paintDoors: r.paint_doors, paintWindows: r.paint_window_trim, paintClosets: r.paint_closets,
  }));
  const paintCost = Number((paints || []).find((p: any) => p.tier === job?.paint_tier)?.cost_per_gallon ?? 52);
  const result = priceEstimate({
    rooms, rates: (rates as any) || [], mods: (mods as any) || [], settings,
    job: job as JobSettings, paintCost, margin, minimum,
  });
  return { estimate: est, trade, result, rooms, margin };
}
