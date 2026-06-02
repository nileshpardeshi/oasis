import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { quickAccess } from '@/lib/navigation';

export default function QuickAccess() {
  return (
    <div className="grid-modules">
      {quickAccess.map((m) => (
        <Link className="module" href={m.href} key={m.href}>
          <div className={'module__icon ' + m.tint}>
            <Icon name={m.icon} size={23} />
          </div>
          <div className="module__title">{m.title}</div>
          <div className="module__desc">{m.sub}</div>
          <div className="module__open">
            Open <Icon name="chevronRight" size={15} strokeWidth={2.2} />
          </div>
        </Link>
      ))}
    </div>
  );
}
