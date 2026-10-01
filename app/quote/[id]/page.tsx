'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { loadDocument, Doc } from '@/lib/recompute';
import { roomQuantities } from '@/lib/pricing';
import Chrome from '@/components/Chrome';
import Mark from '@/components/Mark';

const money = (n: any) => '$' + Math.round(Number(n) || 0).toLocaleString();
const n1 = (n: any) => (Number(n) || 0).toFixed(1);

export default function QuoteDocument() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [doc, setDoc] = useState<Doc | null>(null);
  const [view, setView] = useState<'proposal' | 'takeoff'>('proposal');

  useEffect(() => { loadDocument(id).then(setDoc); }, [id]);
  if (!doc) return null;

  const e = doc.estimate;
  const r = doc.result;
  const c = e.contacts, p = e.properties;
  const name = `${c?.first_name ?? ''} ${c?.last_name ?? ''}`.trim() || 'Customer';
  const addr = [p?.address_line1, [p?.city, p?.state].filter(Boolean).join(', '), p?.postal_code]
    .filter(Boolean).join('  ');

  /* ---------- material take-off, by trade ---------- */
  const materials: { label: string; qty: string }[] = [];
  if (doc.trade === 'painting') {
    const tier = (e.settings as any)?.paint_tier ?? 'standard';
    if (r.finishGal) materials.push({ label: `Finish paint — ${tier}`, qty: `${Math.ceil(r.finishGal)} gal` });
    if (r.primerGal) materials.push({ label: 'Primer', qty: `${Math.ceil(r.primerGal)} gal` });
  } else if (doc.trade === 'drywall') {
    for (const l of r.lines) materials.push({ label: l.label, qty: `${l.qty} ${l.unit}` });
  } else {
    const byProduct = new Map<string, number>();
    for (const row of r.rows) if (row.gallons > 0) {
      byProduct.set(row.label, (byProduct.get(row.label) ?? 0) + row.gallons);
    }
    for (const [k, v] of byProduct) materials.push({ label: k, qty: `${v.toFixed(1)} gal` });
  }

  /* ---------- quantity take-off ---------- */
  const quantities: { label: string; qty: string; hours?: string }[] = [];
  if (doc.trade === 'painting') {
    for (const l of r.lines || []) quantities.push({
      label: l.label, qty: `${Math.round(l.qty)} ${l.unit}`, hours: n1(l.hours) });
  } else if (doc.trade === 'drywall') {
    quantities.push({ label: 'Boards', qty: `${r.totalBoards}` });
    quantities.push({ label: 'Hang', qty: money(r.hang) });
    quantities.push({ label: 'Tape and finish', qty: money(r.finish) });
    quantities.push({ label: 'Sand', qty: money(r.sand) });
  } else {
    for (const row of r.rows) quantities.push({
      label: row.label, qty: `${row.qty} ${row.unit}`, hours: n1(row.hours) });
  }

  const hours = doc.trade === 'drywall' ? r.impliedHours : r.totalHours;

  return (
    <Chrome>
      <div className="bar noprint">
        <button className="back" onClick={() => router.push('/quote')}>{'\u2190'} Quotes</button>
        <div>
          <h1>{view === 'proposal' ? 'Proposal' : 'Take-off'}</h1>
          <div className="sub">#{e.estimate_number} · {name}</div>
        </div>
        <button className="barbtn" onClick={() => window.print()}>Print</button>
      </div>

      <div className="chips noprint" style={{ padding: '14px 20px 0' }}>
        <button className="chip" data-on={view === 'proposal' ? '1' : '0'}
          onClick={() => setView('proposal')}>Customer proposal</button>
        <button className="chip" data-on={view === 'takeoff' ? '1' : '0'}
          onClick={() => setView('takeoff')}>Take-off &amp; materials</button>
      </div>

      <div className="main doc">
        <div className="docmast">
          <Mark size={40} />
          <div>
            <div className="docname">CAMPIONE</div>
            <div className="docsub">
              {doc.trade === 'drywall' ? 'DRYWALL' : doc.trade === 'deck' ? 'DECKS & PORCHES' : 'PAINTING'}
            </div>
          </div>
          <div className="docmeta">
            <div>{view === 'proposal' ? 'Proposal' : 'Internal take-off'} #{e.estimate_number}</div>
            <div>{new Date(e.created_at).toLocaleDateString()}</div>
          </div>
        </div>

        <div className="docwho">
          <div><b>{name}</b></div>
          {addr && <div>{addr}</div>}
          {c?.phone && <div>{c.phone}</div>}
        </div>

        {view === 'proposal' ? (
          <>
            {e.scope_notes && <Section title="Scope of work" body={e.scope_notes} />}
            {e.exclusions && <Section title="Not included" body={e.exclusions} />}
            {e.customer_responsibilities && (
              <Section title="Before we start" body={e.customer_responsibilities} />
            )}
            {e.project_notes && <Section title="Project notes" body={e.project_notes} />}

            <div className="docprice">
              <div className="docpricelbl">Total</div>
              <div className="docpriceval">{money(r.price)}</div>
            </div>

            <div className="docterms">
              <p>This proposal is valid for 30 days. Work scheduled on acceptance.</p>
              <p>Campione Home Services LLC · 1529 Roscoe Davis Road, Monroe, GA 30656 · (404) 341-4382</p>
            </div>

            <div className="docsign">
              <div><div className="sigline" />Accepted by</div>
              <div><div className="sigline" />Date</div>
            </div>
          </>
        ) : (
          <>
            <div className="docalert noprint">
              Internal only. Costs and margin are on this page — do not send it to a customer.
            </div>

            <h3 className="dochead">Quantities</h3>
            <table className="doctable">
              <tbody>
                {quantities.map((q, i) => (
                  <tr key={i}><td>{q.label}</td><td className="r">{q.qty}</td>
                    <td className="r">{q.hours ? `${q.hours} hr` : ''}</td></tr>
                ))}
              </tbody>
            </table>

            <h3 className="dochead">Order this</h3>
            <table className="doctable">
              <tbody>
                {materials.length === 0
                  ? <tr><td colSpan={2}>Material supplied by others.</td></tr>
                  : materials.map((m, i) => (
                    <tr key={i}><td>{m.label}</td><td className="r"><b>{m.qty}</b></td></tr>
                  ))}
              </tbody>
            </table>

            <h3 className="dochead">Cost and margin</h3>
            <table className="doctable">
              <tbody>
                <tr><td>Labor</td><td className="r">{money(r.laborCost)}</td></tr>
                <tr><td>Material</td><td className="r">
                  {money(doc.trade === 'painting' ? r.paint : r.materialCost)}</td></tr>
                <tr><td>Sundries</td><td className="r">{money(r.sundries)}</td></tr>
                {doc.trade === 'painting' && <tr><td>Travel</td><td className="r">{money(r.travel)}</td></tr>}
                {doc.trade === 'drywall' && r.tripApplies &&
                  <tr><td>Minimum trip charge</td><td className="r">{money(r.tripCharge)}</td></tr>}
                <tr><td><b>Direct cost</b></td><td className="r"><b>{money(r.direct)}</b></td></tr>
                <tr><td>Gross profit</td><td className="r">{money(r.grossProfit)}</td></tr>
                <tr><td>Margin</td><td className="r">{Math.round((r.grossProfit / r.price) * 100)}%</td></tr>
                <tr><td>Hours</td><td className="r">{n1(hours)}</td></tr>
                <tr><td>Effective rate</td><td className="r">
                  {money(r.price / Math.max(hours, 1))}/hr</td></tr>
                <tr><td><b>Price</b></td><td className="r"><b>{money(r.price)}</b></td></tr>
              </tbody>
            </table>

            {e.internal_notes_v2 && <Section title="Internal notes" body={e.internal_notes_v2} />}

            {doc.trade === 'painting' && doc.rooms.length > 0 && (
              <>
                <h3 className="dochead">Rooms as measured</h3>
                <table className="doctable">
                  <tbody>
                    {doc.rooms.map((rm) => {
                      const q = roomQuantities(rm);
                      return (
                        <tr key={rm.key}>
                          <td>{rm.name}</td>
                          <td className="r">{Math.round(q.wallSF)} sf wall</td>
                          <td className="r">{Math.round(q.ceilingSF)} sf clg · {Math.round(q.baseLF)} lf base</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </>
            )}
          </>
        )}
      </div>

      <div className="dock noprint"><div className="inner">
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn ghost" onClick={() => router.push(
            `${doc.trade === 'drywall' ? '/quote/drywall' : doc.trade === 'deck' ? '/quote/deck' : '/quote/new'}?id=${id}`
          )}>Edit quote</button>
          <button className="btn" onClick={() => window.print()}>Print or save PDF</button>
        </div>
      </div></div>
    </Chrome>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <>
      <h3 className="dochead">{title}</h3>
      <div className="docbody">{body}</div>
    </>
  );
}
