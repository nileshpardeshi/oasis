'use client';

import dynamic from 'next/dynamic';

// Konva designer must run client-only (touches window/canvas) → ssr:false.
const FloorEditor = dynamic(() => import('./FloorEditor'), {
  ssr: false,
  loading: () => <div className="fed-loading">Loading floor-plan designer…</div>,
});

export default FloorEditor;
