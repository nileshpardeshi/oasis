import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { StatCards, GovernanceSeverityBadge } from '@/components/workspace/ui';
import { kpis, monthlyUtilization, floorUtilization, serviceLineMix, noShowAlerts, governanceFindings, inr, getEmployee } from '@/lib/workspace/mockData';

export default function WorkspaceOverview() {
  const maxUtil = Math.max(...monthlyUtilization.map((m) => m.util), 100);
  return (
    <>
      <StatCards
        stats={[
          { icon: 'desk', tint: 'tint-blue', value: kpis.totalCapacity, label: 'Total capacity (desks)' },
          { icon: 'crosshair', tint: 'tint-green', value: `${kpis.utilizationPct}%`, label: 'Utilisation', accent: true },
          { icon: 'seat', tint: 'tint-info', value: kpis.occupied, label: 'Occupied now' },
          { icon: 'calendar', tint: 'tint-orange', value: kpis.booked, label: 'Booked' },
          { icon: 'check', tint: 'tint-green', value: kpis.checkedIn, label: 'Checked-in' },
          { icon: 'alert', tint: 'tint-red', value: kpis.noShows, label: 'No-shows today' },
        ]}
      />

      <div className="grid-main">
        {/* Monthwise utilisation */}
        <div className="card">
          <div className="panel__head">
            <div className="panel__title">Monthwise utilisation <span className="tag">%</span></div>
            <Link className="panel__link" href="/workspace/heatmap">Intelligence →</Link>
          </div>
          <div className="panel__body">
            <div className="ws-bars">
              {monthlyUtilization.map((m) => (
                <div className="ws-bar-col" key={m.label}>
                  <div className="ws-bar" style={{ height: `${(m.util / maxUtil) * 100}%` }}><span className="ws-bar__val">{m.util}</span></div>
                  <div className="ws-bar-label">{m.label}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginTop: 12 }}>
              {floorUtilization.map((f) => (
                <span key={f.floor} className="sub-hint"><b style={{ color: 'var(--text)' }}>{f.floor}</b>&nbsp;{f.util}% · {f.capacity} desks</span>
              ))}
            </div>
          </div>
        </div>

        {/* Needs attention */}
        <div className="card">
          <div className="panel__head"><div className="panel__title"><Icon name="alert" size={16} /> Needs attention</div></div>
          <div className="panel__body" style={{ paddingTop: 6 }}>
            {governanceFindings.filter((f) => !f.resolved).map((f) => (
              <Link key={f.id} href="/workspace/governance" className="act" style={{ textDecoration: 'none' }}>
                <div className={'act__icon ' + (f.severity === 'critical' ? 'tint-red' : f.severity === 'warn' ? 'tint-orange' : 'tint-info')}><Icon name="shield" size={16} /></div>
                <div style={{ flex: 1 }}><div className="act__text">{f.message}</div><div className="act__time">{f.entityType} · {fmtAgo(f.raisedAt)}</div></div>
                <GovernanceSeverityBadge severity={f.severity} />
              </Link>
            ))}
            {noShowAlerts.filter((a) => !a.resolved).slice(0, 3).map((a) => (
              <Link key={a.id} href="/workspace/occupancy/no-shows" className="act" style={{ textDecoration: 'none' }}>
                <div className="act__icon tint-red"><Icon name="crosshair" size={16} /></div>
                <div style={{ flex: 1 }}><div className="act__text">No-show — {getEmployee(a.employeeId)?.name ?? a.employeeId} · desk auto-released</div><div className="act__time">escalation L{a.escalationLevel}</div></div>
                <span className="ws-pill ws-noshow">No-show</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="cards-2" style={{ marginBottom: 16 }}>
        {/* Service-line mix */}
        <div className="card">
          <div className="panel__head"><div className="panel__title">Service-line desk mix</div></div>
          <div className="table-card" style={{ border: 0, boxShadow: 'none', borderRadius: 0, maxHeight: 320, overflowY: 'auto' }}>
            <table className="data-table">
              <thead><tr><th>Service line</th><th className="num">Seats</th><th>Share</th></tr></thead>
              <tbody>
                {[...serviceLineMix].sort((a, b) => b.desks - a.desks).slice(0, 12).map((s) => (
                  <tr key={s.name}>
                    <td><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: s.colorHex, marginRight: 8 }} />{s.name}</td>
                    <td className="num">{s.desks}</td>
                    <td><span className="muted">{Math.round((s.desks / kpis.totalCapacity) * 100)}%</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="sub-hint" style={{ padding: '8px 14px 0', margin: 0 }}>Top 12 of {serviceLineMix.length} service lines · <Link className="panel__link" href="/workspace/masters">all in Masters →</Link></p>
        </div>

        {/* Cost snapshot */}
        <div className="card">
          <div className="panel__head"><div className="panel__title">Cost &amp; consolidation</div><Link className="panel__link" href="/workspace/cost">Cost engine →</Link></div>
          <div className="panel__body">
            <p className="sub-hint" style={{ marginTop: 0 }}><Icon name="info" size={13} /> Innovation Centre Unit III at 5% occupancy (1 of 20 seats) — AI flags a consolidation into Units I/II.</p>
            <div className="reco ok" style={{ marginTop: 0 }}>Estimated annual saving: <b>{inr(4200000)}</b> (review in the Cost engine).</div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid-modules">
        <Link className="module" href="/workspace/floor">
          <div className="module__icon tint-blue"><Icon name="map" size={20} /></div>
          <div className="module__title">Interactive floor</div>
          <div className="module__desc">Movie-seat view — click a desk to allocate or book.</div>
          <div className="module__open">Open <Icon name="chevronRight" size={14} /></div>
        </Link>
        <Link className="module" href="/workspace/booking">
          <div className="module__icon tint-green"><Icon name="seat" size={20} /></div>
          <div className="module__title">Book a desk</div>
          <div className="module__desc">Hot-desk booking with sit-near-team suggestions.</div>
          <div className="module__open">Open <Icon name="chevronRight" size={14} /></div>
        </Link>
        <Link className="module" href="/workspace/studio">
          <div className="module__icon tint-orange"><Icon name="grid" size={20} /></div>
          <div className="module__title">Floor-Plan Studio</div>
          <div className="module__desc">Design layouts — drag-drop desks, zones, rooms.</div>
          <div className="module__open">Open <Icon name="chevronRight" size={14} /></div>
        </Link>
        <Link className="module" href="/workspace/heatmap">
          <div className="module__icon tint-info"><Icon name="heatmap" size={20} /></div>
          <div className="module__title">Intelligence</div>
          <div className="module__desc">Heatmaps, forecasting and occupancy analytics.</div>
          <div className="module__open">Open <Icon name="chevronRight" size={14} /></div>
        </Link>
      </div>

      <p className="sub-hint" style={{ marginTop: 16 }}><Icon name="check" size={13} /> Sample data loaded from the real <b>Desk Allocation Details</b> sheet — {kpis.totalCapacity} seats across 2 floors / 9 phase-areas, {serviceLineMix.length} service lines, real client/internal accounts and music-genre meeting rooms. See the live register under <Link className="panel__link" href="/workspace/allocation">Allocation →</Link></p>
    </>
  );
}

function fmtAgo(iso: string) {
  return iso.slice(0, 10);
}
