'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { AgentSuggestionCard, ReviewGateControls, ScopeNotice } from '@/components/workspace/ui';
import { agentSuggestions, floors } from '@/lib/workspace/mockData';

export default function StudioImportPage() {
  const visionSug = agentSuggestions.filter((a) => a.agent === 'floorplan_vision');
  const [uploaded, setUploaded] = useState(false);

  return (
    <>
      <div className="ws-toolbar">
        <Link className="btn btn--ghost btn--sm" href="/workspace/floor"><Icon name="arrowLeft" size={15} /> Back to Floor Plan</Link>
      </div>

      <ScopeNotice>AI floor-plan import is assistive. Every detected desk, room and zone lands in a <b>review queue</b> — nothing is published to the live plan until a facility manager approves it.</ScopeNotice>

      <div className="cards-2" style={{ marginTop: 14 }}>
        <div className="table-card" style={{ padding: 22 }}>
          <div className="section-title" style={{ marginTop: 0 }}>1 · Upload floor plan</div>
          <div className="ws-dropzone" onClick={() => setUploaded(true)}>
            <Icon name="image" size={34} />
            <div style={{ fontWeight: 600, marginTop: 8 }}>{uploaded ? 'sample-floor4.pdf uploaded' : 'Drop a PDF / DWG / image, or click to browse'}</div>
            <div className="sub-hint">Vector PDF & DWG give best detection · scanned images supported</div>
          </div>
          <div className="field" style={{ marginTop: 14 }}><label>Target floor</label>
            <select className="select"><option>Select floor…</option>{floors.map((f) => <option key={f.id}>{f.name}</option>)}</select>
          </div>
          <button className="btn btn--primary btn--sm" style={{ marginTop: 14 }} disabled={!uploaded} onClick={() => alert('Mock: vision model runs → produces a review queue (shown on the right)')}><Icon name="robot" size={15} /> Detect desks &amp; rooms</button>
        </div>

        <div>
          <div className="section-title" style={{ marginTop: 0 }}>2 · Review detected elements</div>
          {visionSug.map((s) => (
            <AgentSuggestionCard key={s.id} s={s}>
              <ReviewGateControls onApprove={() => alert('Mock: approved → elements added to draft plan in Studio')} onReject={() => alert('Mock: rejected')} onEdit={() => alert('Mock: open in Studio to adjust positions')} />
            </AgentSuggestionCard>
          ))}
          <p className="sub-hint" style={{ marginTop: 12 }}><Icon name="info" size={13} /> Low-confidence detections are flagged for manual correction in the Studio designer before publish.</p>
        </div>
      </div>
    </>
  );
}
