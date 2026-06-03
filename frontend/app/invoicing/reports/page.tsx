'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { DonutChart, RankBars, BarChartV } from '@/components/invoicing/charts';
import { inr, billingBatches, linesForBatch, reconLines, paymentPriority } from '@/lib/invoicing/mockData';
import { StatusBadge } from '@/components/invoicing/ui';
import {
  REPORTS, reportCategories, reportSchedules, deliveryLog,
  type ReportDef, type ReportSchedule,
} from '@/lib/invoicing/reports';

/* ---------- shared renderers ---------- */
function ReportChart({ r }: { r: ReportDef }) {
  if (r.viz === 'donut') return <DonutChart data={r.chart!} />;
  if (r.viz === 'rankbars') return <RankBars data={r.chart!} format={r.unit === '₹' ? inr : undefined} />;
  if (r.viz === 'bar') return <BarChartV data={r.chart!} suffix={r.unit === '₹ Lakh' ? 'L' : ''} />;
  if (r.viz === 'kpi') {
    return (
      <div className="grid-kpi">
        {r.kpis!.map((kpi) => (
          <div className="card kpi" key={kpi.label}>
            <div className="kpi__value" style={{ fontSize: 22 }}>{kpi.value}</div>
            <div className="kpi__label">{kpi.label}{kpi.sub ? ` · ${kpi.sub}` : ''}</div>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

function ReportTable({ r }: { r: ReportDef }) {
  const { columns, numCols, rows } = r.table;
  return (
    <div className="table-card">
      <table className="data-table">
        <thead><tr>{columns.map((c, i) => <th key={c} className={numCols.includes(i) ? 'num' : ''}>{c}</th>)}</tr></thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>{row.map((cell, ci) => <td key={ci} className={numCols.includes(ci) ? 'num' : ''}>{cell}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- Batch Report (invoicing + reconciliation) ---------- */
function BatchReportView() {
  const [from, setFrom] = useState('2026-05-01');
  const [to, setTo] = useState('2026-06-30');
  const [batchId, setBatchId] = useState(billingBatches[0]?.id ?? '');

  const inRange = billingBatches.filter((b) => b.createdAt >= from && b.createdAt <= to);
  const batch = inRange.find((b) => b.id === batchId) ?? inRange[0];
  const lines = batch ? linesForBatch(batch.id) : [];
  const recon = reconLines.filter((r) => lines.some((l) => l.billNo === r.billNo));
  const total = lines.reduce((s, l) => s + l.totalAmount, 0);

  return (
    <>
      <div className="toolbar">
        <div className="field"><label>Processed from</label><input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
        <div className="field"><label>Processed to</label><input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
        <div className="field"><label>Batch</label>
          <select className="select" value={batch?.id ?? ''} onChange={(e) => setBatchId(e.target.value)}>
            {inRange.length === 0 && <option value="">— none in range —</option>}
            {inRange.map((b) => <option key={b.id} value={b.id}>{b.code} · {b.periodMonth}</option>)}
          </select>
        </div>
        <div className="spacer" />
        <button className="btn btn--ghost btn--sm" disabled={!batch} onClick={() => alert('Mock: export batch report (Excel)')}><Icon name="invoicing" size={15} /> Excel</button>
        <button className="btn btn--primary btn--sm" disabled={!batch} onClick={() => alert('Mock: download full batch report (PDF)')}><Icon name="invoicing" size={15} /> Download PDF</button>
      </div>

      {!batch ? (
        <div className="empty"><div className="empty__icon"><Icon name="invoicing" size={36} /></div><h2>No batches processed in this range</h2><p>Adjust the processed-date range above.</p></div>
      ) : (
        <>
          <div className="totals-bar">
            <div><b>{batch.code}</b><span>Batch</span></div>
            <div><b>{batch.periodMonth}</b><span>Period</span></div>
            <div><b>{lines.length}</b><span>Invoices</span></div>
            <div><b>{inr(total)}</b><span>Total</span></div>
            <div><b>{Array.from(new Set(lines.map((l) => l.payingEntityCode))).join(', ') || '—'}</b><span>Entities</span></div>
            <div><b>{batch.status}</b><span>Status</span></div>
          </div>

          <h3 className="section-title">Invoicing details</h3>
          <div className="table-card" style={{ overflowX: 'auto', marginBottom: 18 }}>
            <table className="data-table" style={{ minWidth: 1040 }}>
              <thead><tr><th>Vendor</th><th>Bill no</th><th>Entity</th><th>Bill date</th><th>Received</th><th>Due</th><th>Priority</th><th className="num">Basic</th><th className="num">GST</th><th className="num">Total</th><th>Status</th></tr></thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={l.id}>
                    <td>{l.vendorName}</td><td className="mono">{l.billNo}</td><td>{l.payingEntityCode}</td>
                    <td>{l.billDate}</td><td>{l.billReceivedDate ?? l.billDate}</td><td>{l.dueDate}</td>
                    <td><span className={`pill ${paymentPriority(l.dueDate) === 'I' ? 'st-process' : 'st-sentfin'}`}>{paymentPriority(l.dueDate)}</span></td>
                    <td className="num">{inr(l.basicAmount)}</td><td className="num">{inr(l.gstAmount)}</td><td className="num">{inr(l.totalAmount)}</td>
                    <td><StatusBadge status={l.paymentStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="section-title">Reconciliation details</h3>
          <div className="table-card" style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ minWidth: 900 }}>
              <thead><tr><th>Bill no (ref)</th><th>Vendor</th><th className="num">Gross</th><th className="num">TDS</th><th className="num">Net</th><th>UTR</th><th>Paid on</th><th>Mode</th><th>Result</th></tr></thead>
              <tbody>
                {recon.length === 0 && <tr><td colSpan={9} style={{ textAlign: 'center', padding: 22, color: 'var(--text-soft)' }}>No reconciliation recorded yet for this batch.</td></tr>}
                {recon.map((r, i) => (
                  <tr key={i}>
                    <td className="mono">{r.billNo}</td><td>{r.vendorName}</td>
                    <td className="num">{inr(r.gross)}</td><td className="num">{r.tds ? inr(r.tds) : '—'}</td><td className="num">{inr(r.net)}</td>
                    <td className="mono">{r.utr}</td><td>{r.paymentDate}</td><td>{r.mode}</td>
                    <td>{r.match === 'matched' ? <span className="pill st-paid">Matched</span> : <span className="pill st-hold">Exception</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}

/* ---------- Report Library ---------- */
function ReportLibrary({ onSchedule }: { onSchedule: (name: string) => void }) {
  const [id, setId] = useState(REPORTS[0].id);
  const r = REPORTS.find((x) => x.id === id)!;

  return (
    <div className="report-layout">
      <aside className="report-list">
        {reportCategories.map((cat) => (
          <div key={cat}>
            <div className="report-cat">{cat}</div>
            {REPORTS.filter((x) => x.category === cat).map((x) => (
              <button key={x.id} className={'report-item' + (x.id === id ? ' active' : '')} onClick={() => setId(x.id)}>{x.name}</button>
            ))}
          </div>
        ))}
      </aside>

      <section className="report-panel">
        <div className="report-head">
          <div>
            <h3 className="section-title" style={{ margin: 0 }}>{r.name}</h3>
            <p className="sub-hint" style={{ margin: '4px 0 0' }}>{r.desc}</p>
          </div>
          <div className="report-actions">
            {r.id !== 'batch-report' && (<>
              <button className="btn btn--ghost btn--sm" onClick={() => alert('Mock: export Excel')}><Icon name="invoicing" size={15} /> Excel</button>
              <button className="btn btn--ghost btn--sm" onClick={() => alert('Mock: export PDF')}><Icon name="invoicing" size={15} /> PDF</button>
              <button className="btn btn--ghost btn--sm" onClick={() => alert('Mock: export CSV')}>CSV</button>
            </>)}
            <button className="btn btn--primary btn--sm" onClick={() => onSchedule(r.name)}><Icon name="bell" size={15} /> Schedule</button>
          </div>
        </div>

        {r.id === 'batch-report' ? <BatchReportView /> : (
          <>
            <div className="toolbar">
              <div className="field"><label>From</label><input className="input" type="date" defaultValue="2026-01-01" /></div>
              <div className="field"><label>To</label><input className="input" type="date" defaultValue="2026-06-30" /></div>
              <div className="field"><label>Entity</label><select className="select"><option>All</option><option>OSPL</option><option>OSSPL</option><option>OPUS-US</option></select></div>
              <div className="spacer" />
              <button className="btn btn--ghost btn--sm" onClick={() => alert('Mock: refresh report')}>Apply</button>
            </div>
            <div className="card" style={{ padding: 18, marginBottom: 16 }}>
              <ReportChart r={r} />
            </div>
            <ReportTable r={r} />
            <p className="sub-hint" style={{ marginTop: 10 }}>Sample data — live figures arrive with the backend phase.</p>
          </>
        )}
      </section>
    </div>
  );
}

/* ---------- Scheduled Delivery ---------- */
function ScheduledDelivery({ initialReport }: { initialReport: string | null }) {
  const [schedules, setSchedules] = useState<ReportSchedule[]>(reportSchedules);
  const [showForm, setShowForm] = useState(!!initialReport);
  const [saved, setSaved] = useState(false);

  const [selReports, setSelReports] = useState<Set<string>>(new Set(initialReport ? [initialReport] : []));
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [dayOfWeek, setDayOfWeek] = useState('Monday');
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [time, setTime] = useState('08:00');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [format, setFormat] = useState<'PDF' | 'Excel' | 'CSV'>('PDF');
  const [lookbackDays, setLookbackDays] = useState(30);
  const [recipients, setRecipients] = useState<string[]>([]);
  const [recipInput, setRecipInput] = useState('');
  const [subject, setSubject] = useState('OASIS — Invoice reports');
  const [enabled, setEnabled] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const toggleReport = (name: string) =>
    setSelReports((p) => { const n = new Set(p); n.has(name) ? n.delete(name) : n.add(name); return n; });
  const addRecipient = () => {
    const v = recipInput.trim();
    if (v && !recipients.includes(v)) setRecipients([...recipients, v]);
    setRecipInput('');
  };

  const resetForm = () => {
    setSelReports(new Set()); setSubject('OASIS — Invoice reports'); setFrequency('weekly');
    setDayOfWeek('Monday'); setDayOfMonth(1); setTime('08:00'); setTimezone('Asia/Kolkata');
    setFormat('PDF'); setLookbackDays(30); setRecipients([]); setRecipInput(''); setEnabled(true);
  };
  const openNew = () => { resetForm(); setEditingId(null); setSaved(false); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditingId(null); };
  const openEdit = (s: ReportSchedule) => {
    setSelReports(new Set(s.reports)); setSubject(s.subject); setFrequency(s.frequency);
    setDayOfWeek(s.dayOfWeek ?? 'Monday'); setDayOfMonth(s.dayOfMonth ?? 1); setTime(s.time);
    setTimezone(s.timezone); setFormat(s.format); setLookbackDays(s.lookbackDays);
    setRecipients([...s.recipients]); setRecipInput(''); setEnabled(s.enabled);
    setEditingId(s.id); setSaved(false); setShowForm(true);
  };
  const removeSchedule = (id: string) => {
    if (typeof window !== 'undefined' && window.confirm('Delete this scheduled report? This cannot be undone.')) {
      setSchedules((list) => list.filter((s) => s.id !== id));
    }
  };

  const save = () => {
    const data = {
      reports: [...selReports], subject, frequency,
      dayOfWeek: frequency === 'weekly' ? dayOfWeek : undefined,
      dayOfMonth: frequency === 'monthly' ? dayOfMonth : undefined,
      time, timezone, recipients, format, lookbackDays, enabled,
    };
    if (editingId) {
      setSchedules((list) => list.map((s) => (s.id === editingId ? { ...s, ...data } : s)));
    } else {
      setSchedules((list) => [{ id: 's' + (list.length + 1), ...data, nextRun: 'next ' + frequency }, ...list]);
    }
    setSaved(true); setShowForm(false); setEditingId(null);
  };

  const canSave = selReports.size > 0 && recipients.length > 0;

  return (
    <>
      <div className="toolbar">
        <p className="sub-hint" style={{ margin: 0 }}>Selected reports are generated and emailed automatically on a schedule — to the recipients you choose.</p>
        <div className="spacer" />
        <button className="btn btn--primary btn--sm" onClick={() => (showForm ? closeForm() : openNew())}>
          <Icon name="plus" size={15} strokeWidth={2.2} /> {showForm ? 'Close' : 'New scheduled report'}
        </button>
      </div>

      {saved && <div className="reco ok" style={{ marginBottom: 14 }}>✓ Schedule saved — reports will be generated and emailed automatically.</div>}

      {showForm && (
        <div className="card" style={{ padding: 18, marginBottom: 18 }}>
          <div className="panel__title" style={{ marginBottom: 12 }}>{editingId ? 'Edit scheduled report' : 'New scheduled report'}</div>

          <label className="form-field" style={{ marginBottom: 12 }}><span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Reports to include</span></label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {REPORTS.map((x) => (
              <label key={x.id} className="pill" style={{ cursor: 'pointer', background: selReports.has(x.name) ? 'var(--brand-blue-tint)' : '#eef1f5', color: selReports.has(x.name) ? 'var(--brand-blue)' : 'var(--text-muted)' }}>
                <input type="checkbox" checked={selReports.has(x.name)} onChange={() => toggleReport(x.name)} style={{ marginRight: 6 }} />{x.name}
              </label>
            ))}
          </div>

          <div className="form-field full" style={{ marginBottom: 14 }}>
            <label>Email subject</label>
            <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. OASIS — Weekly invoice reports" />
            <span className="hint">Sent as the email subject when the report is delivered.</span>
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label>Frequency</label>
              <select className="select" value={frequency} onChange={(e) => setFrequency(e.target.value as typeof frequency)}>
                <option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option>
              </select>
            </div>
            {frequency === 'weekly' && (
              <div className="form-field"><label>Day of week</label>
                <select className="select" value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)}>{['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((d) => <option key={d}>{d}</option>)}</select>
              </div>
            )}
            {frequency === 'monthly' && (
              <div className="form-field"><label>Day of month</label><input className="input" type="number" min={1} max={28} value={dayOfMonth} onChange={(e) => setDayOfMonth(+e.target.value)} /></div>
            )}
            <div className="form-field"><label>Time</label><input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} /></div>
            <div className="form-field"><label>Timezone</label><select className="select" value={timezone} onChange={(e) => setTimezone(e.target.value)}><option>Asia/Kolkata</option><option>America/New_York</option><option>UTC</option></select></div>
            <div className="form-field"><label>Format</label><select className="select" value={format} onChange={(e) => setFormat(e.target.value as typeof format)}><option>PDF</option><option>Excel</option><option>CSV</option></select></div>
            <div className="form-field">
              <label>Report period — last N days</label>
              <input className="input" type="number" min={1} max={365} value={lookbackDays} onChange={(e) => setLookbackDays(+e.target.value)} />
              <span className="hint">Each run generates the report for the last {lookbackDays} day(s).</span>
            </div>
            <div className="form-field">
              <label>Status</label>
              <select className="select" value={enabled ? 'on' : 'off'} onChange={(e) => setEnabled(e.target.value === 'on')}>
                <option value="on">Enabled</option><option value="off">Disabled</option>
              </select>
            </div>
          </div>

          <div className="form-field full" style={{ marginTop: 14 }}>
            <label>Recipients (email)</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="input" style={{ flex: 1 }} type="email" placeholder="name@opustech.example" value={recipInput}
                onChange={(e) => setRecipInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addRecipient(); } }} />
              <button className="btn btn--ghost btn--sm" onClick={addRecipient}>Add</button>
            </div>
            <div style={{ marginTop: 8 }}>
              {recipients.map((r) => (
                <span className="recipient-chip" key={r}>{r}<button onClick={() => setRecipients(recipients.filter((x) => x !== r))} aria-label="remove">×</button></span>
              ))}
              {recipients.length === 0 && <span className="sub-hint">Add at least one recipient.</span>}
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <button className="btn btn--primary btn--sm" disabled={!canSave} onClick={save}>Save schedule</button>
            {!canSave && <span className="sub-hint" style={{ marginLeft: 12 }}>Pick at least one report and one recipient.</span>}
          </div>
        </div>
      )}

      {/* Existing schedules */}
      <h3 className="section-title">Active schedules</h3>
      <div className="table-card" style={{ marginBottom: 22 }}>
        <table className="data-table">
          <thead><tr><th>Reports</th><th>Frequency</th><th>Period</th><th>Time</th><th>Recipients</th><th>Format</th><th>Next run</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {schedules.map((s) => (
              <tr key={s.id}>
                <td>{s.reports.join(', ')}<div className="sub-hint" style={{ margin: '2px 0 0' }}>✉ {s.subject}</div></td>
                <td style={{ textTransform: 'capitalize' }}>{s.frequency}{s.dayOfWeek ? ` · ${s.dayOfWeek}` : ''}{s.dayOfMonth ? ` · day ${s.dayOfMonth}` : ''}</td>
                <td>Last {s.lookbackDays} day(s)</td>
                <td>{s.time} {s.timezone.split('/')[1] ?? s.timezone}</td>
                <td>{s.recipients.length} recipient(s)</td>
                <td>{s.format}</td>
                <td>{s.nextRun}</td>
                <td><span className={`pill ${s.enabled ? 'st-paid' : 'st-unpaid'}`}>{s.enabled ? 'Enabled' : 'Disabled'}</span></td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="btn btn--ghost btn--sm" onClick={() => openEdit(s)}>Edit</button>{' '}
                  <button className="btn btn--ghost btn--sm" style={{ color: 'var(--danger)' }} onClick={() => removeSchedule(s.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delivery log */}
      <h3 className="section-title">Delivery history</h3>
      <div className="table-card">
        <table className="data-table">
          <thead><tr><th>Report</th><th>Run at</th><th>Recipients</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {deliveryLog.map((d) => (
              <tr key={d.id}>
                <td>{d.report}</td><td>{d.runAt}</td><td className="num">{d.recipients}</td>
                <td><span className={`pill ${d.status === 'Sent' ? 'st-paid' : 'notif-Failed'}`}>{d.status}</span></td>
                <td className="num">{d.status === 'Failed' && <button className="btn btn--ghost btn--sm" onClick={() => alert('Mock: re-sent')}>Resend</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ---------- page ---------- */
export default function ReportsPage() {
  const [tab, setTab] = useState<'library' | 'scheduled'>('library');
  const [prefill, setPrefill] = useState<string | null>(null);

  return (
    <>
      <div className="seg" style={{ marginBottom: 18 }}>
        <button className={tab === 'library' ? 'active' : ''} onClick={() => setTab('library')}>Report library</button>
        <button className={tab === 'scheduled' ? 'active' : ''} onClick={() => setTab('scheduled')}>Scheduled delivery</button>
      </div>

      {tab === 'library'
        ? <ReportLibrary onSchedule={(name) => { setPrefill(name); setTab('scheduled'); }} />
        : <ScheduledDelivery initialReport={prefill} />}
    </>
  );
}
