'use client';
// Client-only lazy wrapper for the Konva floor-plan (ssr:false avoids window/canvas during SSR/next build).
import dynamic from 'next/dynamic';

const FloorPlan = dynamic(() => import('./floorplan'), {
  ssr: false,
  loading: () => <div className="ws-canvas-wrap" style={{ height: 560, display: 'grid', placeItems: 'center', color: 'var(--text-soft)' }}>Loading floor plan…</div>,
});

export default FloorPlan;
