import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { StatCards } from '@/components/workspace/ui';
import { floors, getDesksByFloor, getRoomsByFloor } from '@/lib/workspace/mockData';

export default function StudioLauncher() {
  return (
    <>
      <StatCards stats={[
        { icon: 'floor', tint: 'tint-blue', value: floors.length, label: 'Floors' },
        { icon: 'desk', tint: 'tint-green', value: floors.reduce((s, f) => s + getDesksByFloor(f.id).length, 0), label: 'Desks placed' },
        { icon: 'meetingRoom', tint: 'tint-info', value: floors.reduce((s, f) => s + getRoomsByFloor(f.id).length, 0), label: 'Meeting rooms' },
        { icon: 'image', tint: 'tint-orange', value: floors.filter((f) => f.bgImageUrl).length, label: 'Traced from image' },
      ]} />

      <h3 className="section-title">Open a floor in the designer</h3>
      <div className="grid-modules">
        {floors.map((f) => (
          <Link key={f.id} className="module" href={`/workspace/studio/${f.id}`}>
            <div className="module__icon tint-blue"><Icon name="grid" size={20} /></div>
            <div className="module__title">{f.name}</div>
            <div className="module__desc">{getDesksByFloor(f.id).length} desks · {getRoomsByFloor(f.id).length} rooms{f.bgImageUrl ? ' · background traced' : ''}</div>
            <div className="module__open">Open designer <Icon name="chevronRight" size={14} /></div>
          </Link>
        ))}
        <Link className="module" href="/workspace/studio/import">
          <div className="module__icon tint-orange"><Icon name="upload" size={20} /></div>
          <div className="module__title">Import a layout</div>
          <div className="module__desc">Upload PDF / image / CAD / Visio / Excel → AI-assisted detection (review-gated). <i>FE-2</i></div>
          <div className="module__open">Import <Icon name="chevronRight" size={14} /></div>
        </Link>
      </div>
      <p className="sub-hint" style={{ marginTop: 16 }}><Icon name="info" size={13} /> Manual drag-drop designer ships first; AI auto-detection from CAD/PDF is human-review-gated (arrives in FE-2).</p>
    </>
  );
}
