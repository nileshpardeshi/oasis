'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Icon, type IconName } from '@/components/ui/Icon';
import FloorPlan from '@/components/workspace/FloorCanvas';
import { getFloor, getDesksByFloor, getZonesByFloor, getRoomsByFloor, getElementsByFloor, getDesk, serviceLineName } from '@/lib/workspace/mockData';
import type { ElementKind, Point } from '@/lib/workspace/types';

const PALETTE: { kind: ElementKind; label: string; icon: IconName }[] = [
  { kind: 'desk', label: 'Desk', icon: 'desk' },
  { kind: 'meeting_room', label: 'Room', icon: 'meetingRoom' },
  { kind: 'zone', label: 'Zone', icon: 'zone' },
  { kind: 'wall', label: 'Wall', icon: 'building' },
  { kind: 'door', label: 'Door', icon: 'map' },
  { kind: 'pillar', label: 'Pillar', icon: 'grid' },
];

export default function StudioDesigner() {
  const { floorId } = useParams<{ floorId: string }>();
  const floor = getFloor(floorId);
  const [selId, setSelId] = useState<string | undefined>();
  const [tool, setTool] = useState<ElementKind | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!floor) return <div className="empty"><div className="empty__icon"><Icon name="grid" size={34} /></div><h2>Floor not found</h2><p><Link className="btn btn--back btn--sm" href="/workspace/studio"><Icon name="arrowLeft" size={15} /> Back to Studio</Link></p></div>;

  const sel = selId ? getDesk(selId) : undefined;
  const onMoveDesk = (_id: string, _pos: Point) => { setDirty(true); setSaved(false); };
  const onAddElement = (kind: ElementKind) => { setTool(null); setDirty(true); setSaved(false); alert(`Mock: place a ${kind} (drag onto the plan). Persisted via the Floor-Plan service in the backend phase.`); };

  return (
    <>
      <div className="page-back"><Link className="btn btn--back btn--sm" href="/workspace/studio"><Icon name="arrowLeft" size={15} strokeWidth={2.2} /> Back to Studio</Link></div>
      <div className="ws-toolbar" style={{ alignItems: 'center' }}>
        <h3 className="section-title" style={{ margin: 0 }}>Designer — {floor.name}</h3>
        {dirty && <span className="ws-pill ws-warn">Unsaved changes</span>}
        <div className="spacer" />
        <button className="btn btn--primary btn--sm" onClick={() => { setSaved(true); setDirty(false); }}><Icon name="check" size={15} strokeWidth={2.2} /> Save layout</button>
      </div>
      {saved && <div className="reco ok" style={{ marginTop: 0 }}>✓ Layout saved (mock). In the backend phase this writes geometry to the Floor-Plan service / PostGIS.</div>}

      <div className="ws-split" style={{ marginTop: 14 }}>
        <div>
          <FloorPlan
            floor={floor} desks={getDesksByFloor(floor.id)} zones={getZonesByFloor(floor.id)} rooms={getRoomsByFloor(floor.id)} elements={getElementsByFloor(floor.id)}
            mode="design" selectedDeskId={selId} onSelectDesk={setSelId} onMoveDesk={onMoveDesk} onAddElement={onAddElement}
            showMinimap showLabels backgroundImageUrl={floor.bgImageUrl} backgroundOpacity={floor.bgOpacity}
          />
        </div>
        <div className="ws-inspector">
          <div className="section-title" style={{ margin: '0 0 10px' }}>Palette</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {PALETTE.map((p) => (
              <button key={p.kind} className={'btn btn--ghost btn--sm' + (tool === p.kind ? ' is-active' : '')} style={tool === p.kind ? { borderColor: 'var(--brand-blue)', color: 'var(--brand-blue)' } : undefined} onClick={() => { setTool(p.kind); onAddElement(p.kind); }}>
                <Icon name={p.icon} size={15} /> {p.label}
              </button>
            ))}
          </div>
          <div className="section-title" style={{ margin: '18px 0 8px' }}>Selected</div>
          {sel ? (
            <>
              <div style={{ fontWeight: 700 }}>Desk {sel.deskNo}</div>
              <div className="sub-hint">Type · {sel.deskType}</div>
              <div className="sub-hint">Zone · {serviceLineName(sel.serviceLineId)}</div>
              <div className="sub-hint">Drag on the plan to reposition.</div>
            </>
          ) : <div className="sub-hint">Pick a palette item to add, or click a desk to move it. Background image is traceable (Floor 4).</div>}
        </div>
      </div>
    </>
  );
}
