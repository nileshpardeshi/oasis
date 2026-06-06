'use client';
// OASIS — Workplace interactive floor-plan engine (Konva).
// MUST be consumed via `dynamic(() => import('@/components/workspace/floorplan'), { ssr:false })`
// (Konva touches window/canvas → breaks SSR/next build if server-rendered).
//
// Renders a hand-authored, realistic office floor (walls, meeting rooms with round/rect
// tables, reception, cafeteria, waiting & sit-out lounges, phone booths, plants, IN/OUT
// entry — see lib/workspace/floorDesign.ts) and fills the open "neighbourhood" work areas
// with the real desks (bound by id, so click/select/colour-by-state all still work).

import { useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Rect, Text, Image as KonvaImage, Group, Line, Circle } from 'react-konva';
import type Konva from 'konva';
import { Icon } from '@/components/ui/Icon';
import { deskStateColor, heatColor } from '@/lib/workspace/mockData';
import { SAMPLE_FLOOR } from '@/lib/workspace/floorDesign';
import type { Floor, SpaceElement, Desk, Zone, MeetingRoom, DeskState, OccupancyState, HeatLevel, ElementKind, Point, Polygon } from '@/lib/workspace/types';

export type FloorPlanMode = 'view' | 'design' | 'heatmap' | 'occupancy' | 'search';

export interface FloorPlanProps {
  floor: Floor;
  elements?: SpaceElement[];
  desks: Desk[];
  zones?: Zone[];
  rooms?: MeetingRoom[];
  mode?: FloorPlanMode;
  liveStatus?: Record<string, DeskState | OccupancyState>;
  heat?: Record<string, HeatLevel>;
  highlightDeskIds?: string[];
  selectedDeskId?: string;
  showZones?: boolean;
  showRooms?: boolean;
  showLabels?: boolean;
  showMinimap?: boolean;
  backgroundImageUrl?: string;
  backgroundOpacity?: number;
  height?: number;
  onSelectDesk?: (id: string) => void;
  onMoveDesk?: (id: string, pos: Point) => void;
  onAddElement?: (kind: ElementKind, pos: Point) => void;
  onDrawZone?: (poly: Polygon) => void;
}

// desk-pod geometry inside a work neighbourhood
const DESK_W = 34, DESK_H = 22, COL_GAP = 7, CHAIR_D = 12, ROW_BACK_GAP = 4, POD_COLS = 3;
const POD_GAP_X = 26, POD_GAP_Y = 34, AREA_PAD = 16, AREA_HEAD = 34;
const POD_W = POD_COLS * DESK_W + (POD_COLS - 1) * COL_GAP;
const POD_H = CHAIR_D + DESK_H + ROW_BACK_GAP + DESK_H + CHAIR_D;

const ROOM_FILL: Record<string, string> = { meeting: '#eef3fa', board: '#eaf0fb', training: '#fdf3e6', focus: '#f1f5f9' };

interface PlacedDesk { desk: Desk; x: number; y: number; orient: 'up' | 'down'; areaId: string }

function fillDesks(desks: Desk[]): { placed: PlacedDesk[]; counts: Record<string, number> } {
  const placed: PlacedDesk[] = [];
  const counts: Record<string, number> = {};
  let di = 0;
  for (const a of SAMPLE_FLOOR.workAreas) {
    if (di >= desks.length) break;
    const innerX = a.x + AREA_PAD, innerY = a.y + AREA_HEAD;
    const innerW = a.w - AREA_PAD * 2, innerH = a.h - AREA_HEAD - AREA_PAD;
    const podsPerRow = Math.max(1, Math.floor((innerW + POD_GAP_X) / (POD_W + POD_GAP_X)));
    const podRows = Math.max(1, Math.floor((innerH + POD_GAP_Y) / (POD_H + POD_GAP_Y)));
    counts[a.id] = 0;
    let done = false;
    for (let pr = 0; pr < podRows && !done; pr++) {
      for (let pc = 0; pc < podsPerRow && !done; pc++) {
        const podX = innerX + pc * (POD_W + POD_GAP_X);
        const podY = innerY + pr * (POD_H + POD_GAP_Y);
        for (let s = 0; s < POD_COLS * 2; s++) {
          if (di >= desks.length) { done = true; break; }
          const row = s < POD_COLS ? 0 : 1, col = s % POD_COLS;
          const dx = podX + col * (DESK_W + COL_GAP);
          const dy = row === 0 ? podY + CHAIR_D : podY + CHAIR_D + DESK_H + ROW_BACK_GAP;
          placed.push({ desk: desks[di++], x: dx, y: dy, orient: row === 0 ? 'up' : 'down', areaId: a.id });
          counts[a.id]++;
        }
      }
    }
  }
  return { placed, counts };
}

function chairsAround(cx: number, cy: number, r: number, n: number) {
  const out: Point[] = [];
  const count = Math.min(n, 12);
  for (let i = 0; i < count; i++) { const ang = (i / count) * Math.PI * 2 - Math.PI / 2; out.push({ x: cx + (r + 9) * Math.cos(ang), y: cy + (r + 9) * Math.sin(ang) }); }
  return out;
}

export default function FloorPlan(props: FloorPlanProps) {
  const {
    floor, desks, mode = 'view', liveStatus, heat,
    highlightDeskIds = [], selectedDeskId, showLabels = true,
    showMinimap = false, backgroundImageUrl, backgroundOpacity = 0.4, height = 600,
    onSelectDesk, onMoveDesk,
  } = props;

  const D = SAMPLE_FLOOR;
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [size, setSize] = useState({ w: 900, h: height });
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState<Point>({ x: 0, y: 0 });
  const [bgImg, setBgImg] = useState<HTMLImageElement | null>(null);
  const highlightSet = new Set(highlightDeskIds);

  const { placed, counts } = useMemo(() => fillDesks(desks),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [floor.id, desks.length]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: height });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [height]);

  const fit = () => {
    const s = Math.min(size.w / D.width, size.h / D.height) * 0.96;
    setScale(s);
    setPos({ x: (size.w - D.width * s) / 2, y: (size.h - D.height * s) / 2 });
  };
  useEffect(fit, [size.w, size.h]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!backgroundImageUrl) { setBgImg(null); return; }
    const img = new window.Image();
    img.src = backgroundImageUrl;
    img.onload = () => setBgImg(img);
    img.onerror = () => setBgImg(null);
  }, [backgroundImageUrl]);

  const onWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const mp = { x: (pointer.x - pos.x) / scale, y: (pointer.y - pos.y) / scale };
    const dir = e.evt.deltaY > 0 ? -1 : 1;
    const ns = Math.max(0.2, Math.min(3, scale * (dir > 0 ? 1.1 : 1 / 1.1)));
    setScale(ns);
    setPos({ x: pointer.x - mp.x * ns, y: pointer.y - mp.y * ns });
  };

  const deskFill = (d: Desk): string => {
    if (mode === 'heatmap') return heat?.[d.id] ? heatColor(heat[d.id]) : '#e5e7eb';
    if (mode === 'occupancy') return deskStateColor((liveStatus?.[d.id] as OccupancyState) ?? 'vacant');
    if (mode === 'search') return highlightSet.has(d.id) ? '#f7991f' : '#dbe3ec';
    return deskStateColor(d.deskState);
  };

  const WALL = '#aab6c6';

  return (
    <div className="ws-canvas-wrap" ref={wrapRef} style={{ height }}>
      <div className="ws-canvas-toolbar">
        <button className="btn btn--ghost btn--icon" title="Zoom in" onClick={() => setScale((s) => Math.min(3, s * 1.15))}><Icon name="zoomIn" size={16} /></button>
        <button className="btn btn--ghost btn--icon" title="Zoom out" onClick={() => setScale((s) => Math.max(0.2, s / 1.15))}><Icon name="zoomOut" size={16} /></button>
        <button className="btn btn--ghost btn--icon" title="Fit to screen" onClick={fit}><Icon name="crosshair" size={16} /></button>
      </div>

      <Stage ref={stageRef} width={size.w} height={size.h} scaleX={scale} scaleY={scale} x={pos.x} y={pos.y}
        draggable onWheel={onWheel}
        onDragEnd={(e) => { if (e.target === stageRef.current) setPos({ x: e.target.x(), y: e.target.y() }); }}
        style={{ background: '#e9eef5' }}>
        <Layer>
          {/* slab */}
          <Rect x={0} y={0} width={D.width} height={D.height} fill="#fbfcfe" cornerRadius={14}
            shadowColor="#0b2545" shadowBlur={34} shadowOffsetY={14} shadowOpacity={0.12} listening={false} />
          {/* faint grid */}
          {Array.from({ length: Math.floor(D.width / 100) + 1 }, (_, i) => i * 100).map((x) => (
            <Line key={`gx-${x}`} points={[x, 0, x, D.height]} stroke="#f1f4f9" strokeWidth={1} listening={false} />
          ))}
          {Array.from({ length: Math.floor(D.height / 100) + 1 }, (_, i) => i * 100).map((y) => (
            <Line key={`gy-${y}`} points={[0, y, D.width, y]} stroke="#f1f4f9" strokeWidth={1} listening={false} />
          ))}
          {bgImg && <KonvaImage image={bgImg} x={0} y={0} width={D.width} height={D.height} opacity={backgroundOpacity} listening={false} />}

          {/* work neighbourhoods (soft regions behind the desks) */}
          {D.workAreas.map((a) => {
            const label = `${a.name}  ·  ${counts[a.id] ?? 0}`;
            const chipW = Math.min(a.w - 18, label.length * 6.3 + 26);
            return (
              <Group key={a.id} listening={false}>
                <Rect x={a.x} y={a.y} width={a.w} height={a.h} fill={a.color} opacity={0.07} stroke={a.color} strokeWidth={1} cornerRadius={16} />
                {showLabels && (
                  <Group>
                    <Rect x={a.x + 12} y={a.y + 11} width={chipW} height={23} fill="#ffffff" cornerRadius={12} shadowColor="#0b2545" shadowBlur={6} shadowOpacity={0.14} />
                    <Rect x={a.x + 22} y={a.y + 18.5} width={8} height={8} fill={a.color} cornerRadius={2} />
                    <Text x={a.x + 36} y={a.y + 16} text={label} fontSize={11.5} fontStyle="600" fill="#1b2a41" />
                  </Group>
                )}
              </Group>
            );
          })}

          {/* walls */}
          {D.walls.map((w, i) => <Rect key={`wall-${i}`} x={w.x} y={w.y} width={w.w} height={w.h} fill={WALL} cornerRadius={1} listening={false} />)}

          {/* meeting rooms with tables + chairs */}
          {D.rooms.map((r, i) => {
            const cx = r.x + r.w / 2, cy = r.y + r.h / 2 + 6;
            return (
              <Group key={`room-${i}`} listening={false}>
                <Rect x={r.x} y={r.y} width={r.w} height={r.h} fill={ROOM_FILL[r.tone]} stroke={WALL} strokeWidth={2.5} cornerRadius={5} />
                {/* door gap */}
                <Rect x={r.x + r.w * 0.4} y={r.y + r.h - 2.5} width={r.w * 0.2} height={4} fill={ROOM_FILL[r.tone]} />
                {/* table */}
                {r.table === 'round' && <Circle x={cx} y={cy} radius={Math.min(r.w, r.h) * 0.22} fill="#dbe4f1" stroke="#c3d0e2" strokeWidth={1} />}
                {r.table === 'rect' && <Rect x={cx - r.w * 0.26} y={cy - r.h * 0.16} width={r.w * 0.52} height={r.h * 0.32} fill="#dbe4f1" stroke="#c3d0e2" strokeWidth={1} cornerRadius={4} />}
                {/* chairs */}
                {r.table === 'round' && chairsAround(cx, cy, Math.min(r.w, r.h) * 0.22, r.cap ?? 6).map((c, k) => <Circle key={k} x={c.x} y={c.y} radius={4.5} fill="#c2ccd9" />)}
                {r.table === 'rect' && Array.from({ length: Math.min(r.cap ?? 6, 10) }).map((_, k, arr) => {
                  const half = Math.ceil(arr.length / 2); const top = k < half;
                  const idx = top ? k : k - half; const per = top ? half : arr.length - half;
                  const gx = cx - r.w * 0.22 + (per > 1 ? (idx / (per - 1)) * r.w * 0.44 : r.w * 0.22);
                  const gy = top ? cy - r.h * 0.16 - 9 : cy + r.h * 0.16 + 9;
                  return <Circle key={k} x={gx} y={gy} radius={4.5} fill="#c2ccd9" />;
                })}
                {showLabels && <Text x={r.x + 8} y={r.y + 7} width={r.w - 16} text={r.name} fontSize={11} fontStyle="700" fill="#33508a" />}
                {showLabels && r.cap && <Text x={r.x + 8} y={r.y + 21} text={`${r.cap} pax`} fontSize={9.5} fill="#7d8ba0" />}
              </Group>
            );
          })}

          {/* reception */}
          <Group listening={false}>
            <Rect x={D.reception.x} y={D.reception.y} width={D.reception.w} height={D.reception.h} fill="#e6eef9" stroke={WALL} strokeWidth={1.5} cornerRadius={10} />
            <Rect x={D.reception.x + 12} y={D.reception.y + 12} width={D.reception.w - 24} height={14} fill="#cdddf1" cornerRadius={7} />
            <Text x={D.reception.x} y={D.reception.y + 34} width={D.reception.w} align="center" text="Reception" fontSize={11} fontStyle="700" fill="#33508a" />
          </Group>

          {/* cafeteria counter + round tables */}
          {D.counters.map((c, i) => <Rect key={`cnt-${i}`} x={c.x} y={c.y} width={c.w} height={c.h} fill="#d3ddec" stroke="#bccadd" strokeWidth={1} cornerRadius={6} listening={false} />)}
          {D.cafeTables.map((t, i) => (
            <Group key={`cafe-${i}`} listening={false}>
              {chairsAround(t.x, t.y, t.r, t.chairs).map((c, k) => <Circle key={k} x={c.x} y={c.y} radius={5} fill="#c7d2e0" />)}
              <Circle x={t.x} y={t.y} radius={t.r} fill="#eef2f7" stroke="#cfd9e6" strokeWidth={1.5} />
            </Group>
          ))}

          {/* sofas (waiting / sit-out) */}
          {D.sofas.map((s, i) => (
            <Group key={`sofa-${i}`} listening={false}>
              <Rect x={s.x} y={s.y} width={s.w} height={s.h} fill="#cdd9e8" cornerRadius={8} />
              <Rect
                x={s.back === 'right' ? s.x + s.w - 7 : s.x}
                y={s.back === 'bottom' ? s.y + s.h - 7 : s.y}
                width={s.back === 'left' || s.back === 'right' ? 7 : s.w}
                height={s.back === 'top' || s.back === 'bottom' ? 7 : s.h}
                fill="#aebfd6" cornerRadius={4}
              />
            </Group>
          ))}
          {D.lowTables.map((t, i) => <Rect key={`lt-${i}`} x={t.x} y={t.y} width={t.w} height={t.h} fill="#e3e9f1" stroke="#cfd9e6" strokeWidth={1} cornerRadius={8} listening={false} />)}

          {/* phone booths */}
          {D.booths.map((b, i) => (
            <Group key={`booth-${i}`} listening={false}>
              <Rect x={b.x} y={b.y} width={b.w} height={b.h} fill="#eef3fa" stroke={WALL} strokeWidth={1.5} cornerRadius={6} />
              <Text x={b.x} y={b.y + b.h / 2 - 5} width={b.w} align="center" text="☎" fontSize={13} fill="#7d8ba0" />
            </Group>
          ))}

          {/* plants */}
          {D.plants.map((p, i) => (
            <Group key={`plant-${i}`} listening={false}>
              <Circle x={p.x} y={p.y} radius={p.r} fill="#cdeccd" stroke="#9ad29a" strokeWidth={1.5} />
              <Circle x={p.x} y={p.y} radius={p.r * 0.42} fill="#8cc78c" />
            </Group>
          ))}

          {/* IN / OUT entry markings on the bottom wall */}
          {D.doors.map((d, i) => {
            const cx = d.x, cy = d.y - 34; const green = '#16a34a', orange = '#e07f0a';
            const pts = d.dir === 'in' ? [cx - 9, cy + 9, cx + 9, cy + 9, cx, cy - 9] : [cx - 9, cy - 9, cx + 9, cy - 9, cx, cy + 9];
            return (
              <Group key={`door-${i}`} listening={false}>
                <Rect x={cx - 24} y={d.y} width={48} height={10} fill="#fbfcfe" />
                <Line points={pts} closed fill={d.dir === 'in' ? green : orange} />
                <Text x={cx - 14} y={cy + 14} width={28} align="center" text={d.dir === 'in' ? 'IN' : 'OUT'} fontSize={10} fontStyle="700" fill={d.dir === 'in' ? green : orange} />
              </Group>
            );
          })}

          {/* free-standing labels */}
          {showLabels && D.labels.map((l, i) => <Text key={`lbl-${i}`} x={l.x} y={l.y} text={l.text} fontSize={l.size ?? 12} fontStyle="700" fill={l.color ?? '#33508a'} listening={false} />)}

          {/* desks — workstation (surface + chair) coloured by state */}
          {placed.map((pd) => {
            const d = pd.desk;
            const selected = d.id === selectedDeskId;
            const highlighted = highlightSet.has(d.id);
            const dimmed = mode === 'search' && highlightDeskIds.length > 0 && !highlighted;
            const chairW = DESK_W * 0.62;
            const chairX = pd.x + (DESK_W - chairW) / 2;
            const chairY = pd.orient === 'up' ? pd.y - CHAIR_D + 1 : pd.y + DESK_H + 2;
            return (
              <Group key={d.id} opacity={dimmed ? 0.25 : 1}>
                <Rect x={chairX} y={chairY} width={chairW} height={CHAIR_D - 4} fill="#c2ccd9" cornerRadius={4} listening={false} />
                <Rect
                  x={pd.x} y={pd.y} width={DESK_W} height={DESK_H}
                  fill={deskFill(d)}
                  stroke={selected ? '#064281' : highlighted ? '#e07f0a' : '#b6c2d1'}
                  strokeWidth={selected || highlighted ? 2.5 : 0.8}
                  cornerRadius={4}
                  draggable={mode === 'design'}
                  onClick={() => onSelectDesk?.(d.id)}
                  onTap={() => onSelectDesk?.(d.id)}
                  onMouseEnter={(e) => { const s = e.target.getStage(); if (s && onSelectDesk) s.container().style.cursor = 'pointer'; }}
                  onMouseLeave={(e) => { const s = e.target.getStage(); if (s) s.container().style.cursor = 'default'; }}
                  onDragEnd={(e) => onMoveDesk?.(d.id, { x: e.target.x(), y: e.target.y() })}
                />
                {showLabels && scale > 1.05 && (
                  <Text x={pd.x} y={pd.y + DESK_H / 2 - 4} width={DESK_W} align="center" text={d.deskNo.replace(/^WS\s*/, '').replace(/^(Cab|CU)\s*/, '')} fontSize={8} fill="#33415588" listening={false} />
                )}
              </Group>
            );
          })}
        </Layer>
      </Stage>

      {showMinimap && (
        <div className="ws-minimap" aria-hidden>
          {placed.map((pd) => (
            <span key={pd.desk.id} className="ws-minimap__dot" style={{ left: `${(pd.x / D.width) * 100}%`, top: `${(pd.y / D.height) * 100}%`, background: deskFill(pd.desk) }} />
          ))}
        </div>
      )}
    </div>
  );
}
