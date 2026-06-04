import { Icon } from '@/components/ui/Icon';
import { StatCards } from '@/components/travel/ui';
import { vendors } from '@/lib/travel/mockData';

const stars = (n: number) => '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n));

export default function VendorsPage() {
  const avgTat = (vendors.reduce((s, v) => s + v.avgTurnaroundHrs, 0) / vendors.length).toFixed(1);
  return (
    <>
      <StatCards stats={[
        { icon: 'vendors', tint: 'tint-blue', value: vendors.filter((v) => v.status === 'Active').length, label: 'Active vendors' },
        { icon: 'info', tint: 'tint-info', value: `${avgTat}h`, label: 'Avg quote turnaround' },
        { icon: 'analytics', tint: 'tint-green', value: vendors.reduce((s, v) => s + v.quotesYtd, 0), label: 'Quotes received (YTD)' },
        { icon: 'check', tint: 'tint-orange', value: `${Math.max(...vendors.map((v) => v.winRate))}%`, label: 'Best win rate' },
      ]} />

      <div className="table-card">
        <table className="data-table">
          <thead><tr><th>Vendor</th><th>Email</th><th className="num">Avg turnaround</th><th>Price index</th><th>Service</th><th className="num">Win rate</th><th className="num">Quotes YTD</th><th>Status</th></tr></thead>
          <tbody>
            {vendors.map((v) => {
              const cheap = v.priceIndex <= 100;
              return (
                <tr key={v.id}>
                  <td><b>{v.name}</b></td>
                  <td className="mono">{v.email}</td>
                  <td className="num">{v.avgTurnaroundHrs}h</td>
                  <td><span className={'tv-pill ' + (cheap ? 'tv-paid' : v.priceIndex <= 103 ? 'tv-warn' : 'tv-hold')}>{v.priceIndex} {cheap ? '· below mkt' : '· above mkt'}</span></td>
                  <td title={`${v.serviceRating}/5`}><span style={{ color: 'var(--accent)' }}>{stars(v.serviceRating)}</span> <span className="muted" style={{ fontSize: 11 }}>{v.serviceRating}</span></td>
                  <td className="num">{v.winRate}%</td>
                  <td className="num">{v.quotesYtd}</td>
                  <td><span className={'tv-pill ' + (v.status === 'Active' ? 'tv-paid' : 'tv-unpaid')}>{v.status}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="sub-hint" style={{ marginTop: 12 }}><Icon name="info" size={13} /> Price index 100 = market median (from the AI benchmark). Use it to steer RFQs toward the best-value, well-supported vendors.</p>
    </>
  );
}
