import Link from 'next/link';
import { Icon, type IconName } from '@/components/ui/Icon';
import { DonutChart, RankBars, BarChartV } from '@/components/invoicing/charts';
import { dashboardKpis, monthwiseSpend, inr, billingBatches, billingLines, reconLines } from '@/lib/invoicing/mockData';
import { BatchStatusBadge } from '@/components/invoicing/ui';
import { REPORTS } from '@/lib/invoicing/reports';

type Dir = 'up' | 'down' | 'flat';
function Delta({ dir, text }: { dir: Dir; text: string }) {
  if (dir === 'flat' || !text) return <span className="kpi__delta flat">{text || '—'}</span>;
  return (
    <span className={'kpi__delta ' + (dir === 'up' ? 'up' : 'down')}>
      <Icon name={dir === 'up' ? 'arrowUp' : 'arrowDown'} size={12} strokeWidth={2.4} />{text}
    </span>
  );
}

const chartOf = (id: string) => REPORTS.find((r) => r.id === id)?.chart ?? [];

export default function InvoicingOverview() {
  const k = dashboardKpis;

  const kpis: { icon: IconName; tint: string; value: string; label: string; delta: { dir: Dir; text: string }; money?: boolean }[] = [
    { icon: 'invoicing', tint: 'tint-blue', value: String(k.invoicesThisMonth), label: 'Invoices this month', delta: { dir: 'up', text: '12%' } },
    { icon: 'analytics', tint: 'tint-info', value: inr(k.valueProcessed), label: 'Value processed', money: true, delta: { dir: 'up', text: '8%' } },
    { icon: 'check', tint: 'tint-green', value: `${k.paid}/${k.paid + k.unpaid}`, label: 'Paid vs total', delta: { dir: 'up', text: `${Math.round((k.paid / (k.paid + k.unpaid)) * 100)}%` } },
    { icon: 'events', tint: 'tint-red', value: String(k.overdue), label: 'Overdue invoices', delta: { dir: 'down', text: '1' } },
    { icon: 'dashboard', tint: 'tint-blue', value: `${k.onTimePct}%`, label: 'On-time payments', delta: { dir: 'up', text: '3%' } },
  ];

  const upcoming = [
    { label: 'Next 7 days', value: 496000, tint: 'tint-red' },
    { label: 'Next 15 days', value: 1180000, tint: 'tint-orange' },
    { label: 'Next 30 days', value: 2240000, tint: 'tint-info' },
    { label: 'Next 60 days', value: 3120000, tint: 'tint-blue' },
  ];

  const monthBars = monthwiseSpend.map((m) => ({ label: m.month, value: m.value }));

  // attention items (derived from mock)
  const pendingApproval = billingBatches.filter((b) => b.status === 'Pending Approval').length;
  const exceptions = reconLines.filter((r) => r.match !== 'matched').length;
  const highRisk = billingLines.filter((l) => l.riskLevel === 'High').length;
  const awaitingNotify = new Set(billingLines.filter((l) => l.paymentStatus === 'Paid' && l.notificationStatus === 'Not Notified').map((l) => l.vendorName)).size;

  const attention: { icon: IconName; tint: string; text: string; count: number; href: string }[] = [
    { icon: 'invoicing', tint: 'tint-orange', text: 'Billing batch(es) pending approval', count: pendingApproval, href: '/invoicing/batches' },
    { icon: 'events', tint: 'tint-red', text: 'Invoice(s) overdue for payment', count: k.overdue, href: '/invoicing/search' },
    { icon: 'check', tint: 'tint-info', text: 'Reconciliation exception(s)', count: exceptions, href: '/invoicing/reconciliation' },
    { icon: 'bell', tint: 'tint-blue', text: 'Vendor(s) awaiting payment notification', count: awaitingNotify, href: '/invoicing/notifications' },
    { icon: 'alert', tint: 'tint-red', text: 'High-risk invoice(s) flagged', count: highRisk, href: '/invoicing/batches' },
  ];

  const activity = [
    { icon: 'check' as IconName, tint: 'tint-green', text: <>Payment reconciled — <b>PrimeGuard Security</b> {inr(154440)} (UTR …778)</>, time: '1 hour ago' },
    { icon: 'invoicing' as IconName, tint: 'tint-blue', text: <>Batch <b>BILL-2026-06-I</b> built — 3 invoices, {inr(146320)}</>, time: '3 hours ago' },
    { icon: 'bell' as IconName, tint: 'tint-info', text: <>Vendor notified — <b>Skyline Telecom</b> (Apr payment)</>, time: '1 day ago' },
    { icon: 'alert' as IconName, tint: 'tint-red', text: <>Recon exception — <b>MCR-0426-1180</b> not found in batch</>, time: '1 day ago' },
    { icon: 'invoicing' as IconName, tint: 'tint-orange', text: <>Invoice extracted — <b>CopyTech AMC</b> ready for review</>, time: '2 days ago' },
  ];

  return (
    <>
      <div className="notice">
        <Icon name="alert" size={18} />
        <span><b>Prototype</b> — sample data; extraction, reconciliation, DB & email are simulated until the backend phase.</span>
      </div>

      {/* KPI tiles */}
      <div className="grid-kpi">
        {kpis.map((kpi) => (
          <div className="card kpi" key={kpi.label}>
            <div className="kpi__top">
              <div className={'kpi__icon ' + kpi.tint}><Icon name={kpi.icon} size={20} /></div>
              <Delta dir={kpi.delta.dir} text={kpi.delta.text} />
            </div>
            <div className="kpi__value" style={kpi.money ? { fontSize: 18 } : undefined}>{kpi.value}</div>
            <div className="kpi__label">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Upcoming liabilities strip */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="panel__head">
          <div className="panel__title"><Icon name="events" size={16} /> Upcoming payment liabilities <span className="tag">Sample</span></div>
          <Link className="panel__link" href="/invoicing/reports">Open reports →</Link>
        </div>
        <div className="panel__body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {upcoming.map((u) => (
              <div key={u.label} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
                <div className={'kpi__icon ' + u.tint} style={{ width: 32, height: 32, marginBottom: 8 }}><Icon name="invoicing" size={16} /></div>
                <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-.3px' }}>{inr(u.value)}</div>
                <div className="kpi__label">{u.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row: monthwise + status */}
      <div className="grid-main">
        <div className="card">
          <div className="panel__head"><div className="panel__title">Monthwise spend <span className="tag">₹ Lakh</span></div></div>
          <div className="panel__body"><BarChartV data={monthBars} suffix="L" /></div>
        </div>
        <div className="card">
          <div className="panel__head"><div className="panel__title">Payment status</div></div>
          <div className="panel__body"><DonutChart data={chartOf('status')} /></div>
        </div>
      </div>

      {/* Row: top vendors + recurring */}
      <div className="grid-main">
        <div className="card">
          <div className="panel__head"><div className="panel__title">Top vendors by spend</div><Link className="panel__link" href="/invoicing/reports">Reports →</Link></div>
          <div className="panel__body"><RankBars data={chartOf('vendor').slice(0, 6)} format={inr} /></div>
        </div>
        <div className="card">
          <div className="panel__head"><div className="panel__title">Recurring vs one-off</div></div>
          <div className="panel__body"><DonutChart data={chartOf('recurring')} /></div>
        </div>
      </div>

      {/* Row: category + entity */}
      <div className="grid-main">
        <div className="card">
          <div className="panel__head"><div className="panel__title">Category-wise expense</div><Link className="panel__link" href="/invoicing/reports">Reports →</Link></div>
          <div className="panel__body"><RankBars data={chartOf('category')} format={inr} /></div>
        </div>
        <div className="card">
          <div className="panel__head"><div className="panel__title">Entity-wise spend</div></div>
          <div className="panel__body"><DonutChart data={chartOf('entity')} /></div>
        </div>
      </div>

      {/* Row: attention + activity */}
      <div className="grid-main">
        <div className="card">
          <div className="panel__head"><div className="panel__title"><Icon name="alert" size={16} /> Needs attention</div></div>
          <div className="panel__body">
            {attention.map((a) => (
              <Link className="act" href={a.href} key={a.text} style={{ alignItems: 'center' }}>
                <div className={'act__icon ' + a.tint}><Icon name={a.icon} size={17} /></div>
                <div style={{ flex: 1 }}><div className="act__text">{a.text}</div></div>
                <span className={'pill ' + (a.count > 0 ? 'st-process' : 'st-paid')}>{a.count}</span>
              </Link>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="panel__head"><div className="panel__title">Recent activity</div></div>
          <div className="panel__body">
            {activity.map((a, i) => (
              <div className="act" key={i}>
                <div className={'act__icon ' + a.tint}><Icon name={a.icon} size={17} /></div>
                <div><div className="act__text">{a.text}</div><div className="act__time">{a.time}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent batches */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="panel__head"><div className="panel__title">Recent billing batches</div><Link className="panel__link" href="/invoicing/batches">View all →</Link></div>
        <div className="table-card" style={{ border: 0, boxShadow: 'none', borderRadius: 0 }}>
          <table className="data-table">
            <thead><tr><th>Bill file</th><th>Billing Month</th><th className="num">Invoices</th><th className="num">Total</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {billingBatches.map((b) => (
                <tr key={b.id}>
                  <td className="mono">{b.code}</td>
                  <td>{b.periodMonth}</td>
                  <td className="num">{b.lineIds.length}</td>
                  <td className="num">{inr(b.totalValue)}</td>
                  <td><BatchStatusBadge status={b.status} /></td>
                  <td className="num"><Link className="panel__link" href={`/invoicing/batches/${b.id}`}>View →</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick access */}
      <h3 className="section-title">Quick access</h3>
      <div className="grid-modules">
        <Link className="module" href="/invoicing/upload">
          <div className="module__icon tint-orange"><Icon name="plus" size={23} /></div>
          <div className="module__title">Upload invoices</div>
          <div className="module__desc">Bulk upload → AI extraction → review</div>
          <div className="module__open">Start <Icon name="chevronRight" size={15} strokeWidth={2.2} /></div>
        </Link>
        <Link className="module" href="/invoicing/batches">
          <div className="module__icon tint-blue"><Icon name="invoicing" size={23} /></div>
          <div className="module__title">Billing batches</div>
          <div className="module__desc">{pendingApproval} batch pending approval</div>
          <div className="module__open">Open <Icon name="chevronRight" size={15} strokeWidth={2.2} /></div>
        </Link>
        <Link className="module" href="/invoicing/reconciliation">
          <div className="module__icon tint-green"><Icon name="check" size={23} /></div>
          <div className="module__title">Reconcile payments</div>
          <div className="module__desc">Upload finance report → match UTRs</div>
          <div className="module__open">Open <Icon name="chevronRight" size={15} strokeWidth={2.2} /></div>
        </Link>
        <Link className="module" href="/invoicing/reports">
          <div className="module__icon tint-info"><Icon name="analytics" size={23} /></div>
          <div className="module__title">Reports</div>
          <div className="module__desc">Library + scheduled email delivery</div>
          <div className="module__open">Open <Icon name="chevronRight" size={15} strokeWidth={2.2} /></div>
        </Link>
      </div>

      <div className="footer">© 2026 Opus Technologies · OASIS — Invoice &amp; Payment Intelligence · Internal prototype</div>
    </>
  );
}
