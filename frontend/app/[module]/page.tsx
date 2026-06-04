import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { moduleBySlug } from '@/lib/navigation';

/**
 * Pre-render a static page for each known module slug.
 * Slugs that have their OWN dedicated route tree (app/<slug>/*) must be excluded —
 * otherwise this catch-all prerenders a "Coming soon" placeholder that shadows the real module.
 */
const DEDICATED_ROUTES = new Set(['invoicing', 'travel', 'workspace']);
export function generateStaticParams() {
  return Object.keys(moduleBySlug)
    .filter((m) => !DEDICATED_ROUTES.has(m))
    .map((module) => ({ module }));
}

export default function ModulePlaceholderPage({ params }: { params: { module: string } }) {
  const item = moduleBySlug[params.module];
  const title = item?.title ?? 'Module';
  const desc = item?.desc ?? 'This area is part of the OASIS roadmap.';

  return (
    <div className="container">
      <div className="crumbs">
        <Link href="/">Home</Link>
        <Icon name="chevronRight" size={14} strokeWidth={2} />
        <span style={{ color: 'var(--text)' }}>{title}</span>
      </div>

      <div className="empty">
        <div className="empty__icon">
          <Icon name={item?.icon ?? 'dashboard'} size={38} strokeWidth={1.6} />
        </div>
        <h2>{title}</h2>
        <p>{desc}</p>
        <div>
          <span className="pill">🚧 Coming soon — placeholder screen</span>
        </div>
      </div>
    </div>
  );
}
