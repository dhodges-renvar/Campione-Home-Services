'use client';
import { useEffect, useState } from 'react';
import { supabase } from './supabase';

export type MarginRow = {
  business_type: string; label: string; sort_order: number;
  trade: string; target_margin: number; minimum_charge: number; is_set: boolean;
};

/** Margin and minimum for one trade, by customer type. */
export function useTradeMargins(trade: string) {
  const [rows, setRows] = useState<MarginRow[]>([]);
  useEffect(() => {
    supabase.from('v_trade_margins').select('*').eq('trade', trade).order('sort_order')
      .then(({ data }) => setRows((data as any) || []));
  }, [trade]);
  const find = (businessType: string) => rows.find((r) => r.business_type === businessType);
  return { rows, find };
}
