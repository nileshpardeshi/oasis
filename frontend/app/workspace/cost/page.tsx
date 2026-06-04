'use client';

import { Icon } from '@/components/ui/Icon';
import { StatCards, Money, Pct, AgentSuggestionCard } from '@/components/workspace/ui';
import { costMetrics, agentSuggestions, inr } from '@/lib/workspace/mockData';

export default function CostPage() {
  const totalCost = costMetrics.reduce((s, c) => s + c.totalCost, 0);
  const savings = costMetrics.reduce((s, c) => s + (c.consolidationSaving ?? 0), 0);
  const avgUtil = Math.round(costMetrics.reduce((s, c) => s + c.utilizationPct, 0) / costMetrics.length);
  const costSug = agentSuggestions.filter((a) => a.agent === 'cost_optimization');

  return (
    <>
      <StatCards stats={[
        { icon: 'analytics', tint: 'tint-blue', value: inr(totalCost), label: 'Monthly cost (tracked scopes)' },
        { icon: 'heatmap', tint: 'tint-info', value: `${avgUtil}%`, label: 'Avg utilisation' },
        { icon: 'check', tint: 'tint-green', value: inr(savings), label: 'Consolidation saving identified' },
        { icon: 'relocation', tint: 'tint-orange', value: costMetrics.filter((c) => c.utilizationPct < 40).length, label: 'Under-utilised scopes' },
      ]} />

      {costSug.length > 0 && (
        <div style={{ margin: '6px 0 18px' }}>
          {costSug.map((s) => <AgentSuggestionCard key={s.id} s={s} />)}
        </div>
      )}

      <div className="table-card">
        <table className="data-table">
          <thead><tr><th>Scope</th><th>Period</th><th className="num">Monthly cost</th><th className="num">Utilisation</th><th className="num">Cost / used seat</th><th>Recommendation</th></tr></thead>
          <tbody>
            {costMetrics.map((c) => (
              <tr key={c.id}>
                <td>{c.scopeLabel} <span className="muted" style={{ fontSize: 12 }}>· {c.scopeType}</span></td>
                <td>{c.period}</td>
                <td className="num"><Money value={c.totalCost} /></td>
                <td className="num"><Pct value={c.utilizationPct} /></td>
                <td className="num"><Money value={c.costPerUsedSeat} /></td>
                <td>{c.recommendation ?? <span className="muted">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="sub-hint" style={{ marginTop: 14 }}><Icon name="robot" size={13} /> Cost-optimization is an AI agent suggestion (human-in-the-loop). Approve a recommendation to draft a relocation plan.</p>
    </>
  );
}
