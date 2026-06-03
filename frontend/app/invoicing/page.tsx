import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { dashboardKpis, monthwiseSpend, categorySpend, inr, billingBatches } from '@/lib/invoicing/mockData';

export default function InvoicingOverview() {
  const k = dashboardKpis;
  const maxMonth = Math.max(...monthwiseSpend.map((m) => m.value));
  const pendingApproval = billingBatches.filter((b) => b.status === 'Pending Approval').length;

  return (
    <>
      <div className="notice">
        <Icon name="alert" size={18} />
        <span>
          <b>Frontend prototype</b> — clickable UI on sample data. Extraction, reconciliation, DB & email are simulated;
          the real backend (Spring Boot + PostgreSQL + Azure AI) comes in a later phase.
        </span>
      </div>

      {/* KPI tiles */}
      <div className="grid-kpi">
        <div className="card kpi">
          <div className="kpi__top"><div className="kpi__icon tint-blue"><Icon name="invoicing" size={21} /></div></div>
          <div className="kpi__value">{k.invoicesThisMonth}</div>
          <div className="kpi__label">Invoices this month</div>
        </div>
        <div className="card kpi">
          <div className="kpi__top"><div className="kpi__icon tint-info"><Icon name="analytics" size={21} /></div></div>
          <div className="kpi__value" style={{ fontSize: 20 }}>{inr(k.valueProcessed)}</div>
          <div className="kpi__label">Value processed</div>
        </div>
        <div className="card kpi">
          <div className="kpi__top"><div className="kpi__icon tint-green"><Icon name="check" size={21} /></div><span className="pill st-paid">{k.paid} paid</span></div>
          <div className="kpi__value">{k.unpaid}</div>
          <div className="kpi__label">Unpaid ({k.overdue} overdue)</div>
        </div>
        <div className="card kpi">
          <div className="kpi__top"><div className="kpi__icon tint-orange"><Icon name="events" size={21} /></div></div>
          <div className="kpi__value" style={{ fontSize: 20 }}>{inr(k.upcoming7)}</div>
          <div className="kpi__label">Due in next 7 days</div>
        </div>
        <div className="card kpi">
          <div className="kpi__top"><div className="kpi__icon tint-blue"><Icon name="dashboard" size={21} /></div></div>
          <div className="kpi__value">{k.onTimePct}%</div>
          <div className="kpi__label">On-time payments</div>
        </div>
      </div>

      {/* Quick actions */}
      <h3 className="section-title">Quick actions</h3>
      <div className="grid-modules" style={{ marginBottom: 20 }}>
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
        <Link className="module" href="/invoicing/notifications">
          <div className="module__icon tint-info"><Icon name="bell" size={23} /></div>
          <div className="module__title">Notify vendors</div>
          <div className="module__desc">Manual or scheduled payment emails</div>
          <div className="module__open">Open <Icon name="chevronRight" size={15} strokeWidth={2.2} /></div>
        </Link>
      </div>

      {/* charts */}
      <div className="grid-main">
        <div className="card">
          <div className="panel__head">
            <div className="panel__title">Monthwise spend <span className="tag">Sample</span></div>
          </div>
          <div className="panel__body">
            <div className="chart">
              {monthwiseSpend.map((m, i) => (
                <div className="bar-col" key={m.month}>
                  <div className={'bar' + (i === monthwiseSpend.length - 1 ? ' accent' : '')} style={{ height: `${Math.round((m.value / maxMonth) * 100)}%` }}>
                    <span className="bar__val">{m.value}L</span>
                  </div>
                  <span className="bar-label">{m.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="panel__head">
            <div className="panel__title">Category-wise spend <span className="tag">Sample</span></div>
          </div>
          <div className="panel__body stack-sm">
            {categorySpend.map((c) => (
              <div key={c.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                  <span>{c.name}</span><span className="muted">{c.value}%</span>
                </div>
                <div className="progress" style={{ width: '100%' }}><span style={{ width: `${c.value * 3}%`, background: 'var(--brand-blue-300)' }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
