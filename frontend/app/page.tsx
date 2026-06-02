import { Icon } from '@/components/ui/Icon';
import KpiCards from '@/components/dashboard/KpiCards';
import UtilizationChart from '@/components/dashboard/UtilizationChart';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import QuickAccess from '@/components/dashboard/QuickAccess';

export default function DashboardPage() {
  return (
    <div className="container">
      <div className="crumbs">
        <span>Home</span>
        <Icon name="chevronRight" size={14} strokeWidth={2} />
        <span style={{ color: 'var(--text)' }}>Dashboard</span>
      </div>

      <div className="page-head">
        <div>
          <h1 className="page-title">Welcome to OASIS 👋</h1>
          <p className="page-sub">
            Opus Administration &amp; Service Intelligence Suite — your single front door for all admin services.
          </p>
        </div>
      </div>

      <div className="notice">
        <Icon name="alert" size={18} />
        <span>
          <b>UI prototype</b> — this is a layout &amp; navigation preview. Module functionality is not implemented yet
          and all figures shown are sample data.
        </span>
      </div>

      <KpiCards />

      <div className="grid-main">
        <UtilizationChart />
        <ActivityFeed />
      </div>

      <h3 className="section-title">Quick access</h3>
      <QuickAccess />

      <div className="footer">
        © 2026 Opus Technologies · OASIS — Opus Administration &amp; Service Intelligence Suite · Internal prototype
      </div>
    </div>
  );
}
