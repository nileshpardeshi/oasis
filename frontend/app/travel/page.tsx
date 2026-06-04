import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { StatCards, StatusBadge } from '@/components/travel/ui';
import { kpis, travelRequests, trips, alerts, monthlySpend, topRoutes, inr } from '@/lib/travel/mockData';

export default function TravelOverview() {
  const maxSpend = Math.max(...monthlySpend.map((m) => m.spend));
  const actionable = travelRequests.filter((r) => ['Sourcing', 'Compared', 'Pending Approval'].includes(r.status));

  return (
    <>
      <StatCards
        stats={[
          { icon: 'helpdesk', tint: 'tint-blue', value: kpis.openRequests, label: 'Open requests' },
          { icon: 'bell', tint: 'tint-orange', value: kpis.awaitingQuotes, label: 'Awaiting quotes' },
          { icon: 'check', tint: 'tint-info', value: kpis.pendingApproval, label: 'Pending approval' },
          { icon: 'travel', tint: 'tint-green', value: kpis.tripsThisMonth, label: 'Trips this month' },
          { icon: 'analytics', tint: 'tint-green', value: inr(kpis.savingsMTD), label: 'Savings MTD', small: true, accent: true },
          { icon: 'info', tint: 'tint-blue', value: `${kpis.avgTurnaroundHrs}h`, label: 'Avg quote turnaround' },
        ]}
      />

      <div className="grid-main">
        {/* Monthwise spend & savings */}
        <div className="card">
          <div className="panel__head">
            <div className="panel__title">Monthwise travel spend &amp; savings <span className="tag">₹ lakhs</span></div>
            <Link className="panel__link" href="/travel/reports">Reports →</Link>
          </div>
          <div className="panel__body">
            <div className="chart">
              {monthlySpend.map((m) => (
                <div className="bar-col" key={m.label}>
                  <div className="bar" style={{ height: `${(m.spend / maxSpend) * 100}%` }}><span className="bar__val">{m.spend}</span></div>
                  <div className="bar accent" style={{ height: `${(m.savings / maxSpend) * 100}%`, maxWidth: 26 }} title={`Savings ₹${m.savings}L`} />
                  <div className="bar-label">{m.label}</div>
                </div>
              ))}
            </div>
            <p className="sub-hint" style={{ marginTop: 10 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--brand-blue)', display: 'inline-block' }} /> Spend &nbsp; <span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--accent)', display: 'inline-block' }} /> Savings (vendor-vs-benchmark + fare-drop)</p>
          </div>
        </div>

        {/* Needs attention */}
        <div className="card">
          <div className="panel__head"><div className="panel__title"><Icon name="alert" size={16} /> Needs attention</div></div>
          <div className="panel__body" style={{ paddingTop: 6 }}>
            {actionable.map((r) => (
              <Link key={r.id} href={`/travel/requests/${r.id}`} className="act" style={{ textDecoration: 'none' }}>
                <div className="act__icon tint-blue"><Icon name="helpdesk" size={16} /></div>
                <div style={{ flex: 1 }}>
                  <div className="act__text"><b>{r.code}</b> · {r.originCode}→{r.destCode} · {r.traveller.name}</div>
                  <div className="act__time">{r.status} · due {r.dueBy}</div>
                </div>
                <StatusBadge status={r.status} />
              </Link>
            ))}
            {alerts.filter((a) => a.severity !== 'info').map((a) => (
              <Link key={a.id} href="/travel/monitoring" className="act" style={{ textDecoration: 'none' }}>
                <div className={'act__icon ' + (a.kind === 'fare-drop' ? 'tint-green' : 'tint-orange')}><Icon name={a.kind === 'fare-drop' ? 'arrowDown' : 'bell'} size={16} /></div>
                <div style={{ flex: 1 }}>
                  <div className="act__text"><b>{a.tripCode}</b> · {a.message}</div>
                  <div className="act__time">{a.routeLabel} · {a.raisedAt}</div>
                </div>
                {a.netSaving ? <span className="tv-pill tv-paid">+{inr(a.netSaving)}</span> : null}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="cards-2" style={{ marginBottom: 16 }}>
        {/* Recent requests */}
        <div className="card">
          <div className="panel__head"><div className="panel__title">Recent requests</div><Link className="panel__link" href="/travel/requests">View all →</Link></div>
          <div className="table-card" style={{ border: 0, boxShadow: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead><tr><th>Request</th><th>Route</th><th>Traveller</th><th>Status</th></tr></thead>
              <tbody>
                {travelRequests.slice(0, 5).map((r) => (
                  <tr key={r.id} className="row-link">
                    <td className="mono"><Link className="panel__link" href={`/travel/requests/${r.id}`}>{r.code}</Link></td>
                    <td>{r.originCode}→{r.destCode}{r.international ? '' : ' '}</td>
                    <td>{r.traveller.name}</td>
                    <td><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top routes */}
        <div className="card">
          <div className="panel__head"><div className="panel__title">Top routes (YTD)</div></div>
          <div className="table-card" style={{ border: 0, boxShadow: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead><tr><th>Route</th><th className="num">Trips</th><th className="num">Avg fare</th></tr></thead>
              <tbody>
                {topRoutes.map((t) => (
                  <tr key={t.route}><td><b>{t.route}</b></td><td className="num">{t.trips}</td><td className="num">{inr(t.avg)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid-modules">
        <Link className="module" href="/travel/requests/new">
          <div className="module__icon tint-blue"><Icon name="plus" size={20} /></div>
          <div className="module__title">New travel request</div>
          <div className="module__desc">Raise a request — route, dates, policy & visa check.</div>
          <div className="module__open">Open <Icon name="chevronRight" size={14} /></div>
        </Link>
        <Link className="module" href="/travel/requests">
          <div className="module__icon tint-orange"><Icon name="analytics" size={20} /></div>
          <div className="module__title">Compare quotes</div>
          <div className="module__desc">Vendor quotes vs the AI market benchmark — good / average / high.</div>
          <div className="module__open">Open <Icon name="chevronRight" size={14} /></div>
        </Link>
        <Link className="module" href="/travel/monitoring">
          <div className="module__icon tint-green"><Icon name="bell" size={20} /></div>
          <div className="module__title">Monitoring</div>
          <div className="module__desc">Post-booking fare-drop & schedule-change alerts.</div>
          <div className="module__open">Open <Icon name="chevronRight" size={14} /></div>
        </Link>
        <Link className="module" href="/travel/vendors">
          <div className="module__icon tint-info"><Icon name="vendors" size={20} /></div>
          <div className="module__title">Vendor scorecard</div>
          <div className="module__desc">Price index, response SLA, service rating, win rate.</div>
          <div className="module__open">Open <Icon name="chevronRight" size={14} /></div>
        </Link>
      </div>
    </>
  );
}
