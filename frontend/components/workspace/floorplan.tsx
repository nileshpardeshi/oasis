'use client';
// OASIS — Workplace interactive floor-plan engine (Konva).
// MUST be consumed via `dynamic(() => import('@/components/workspace/floorplan'), { ssr:false })`
// (Konva touches window/canvas → breaks SSR/next build if server-rendered).

import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Text, Image as KonvaImage, Group } from 'react-konva';
import type Konva from 'konva';
import { Icon } from '@/components/ui/Icon';
import { deskStateColor, heatColor } from '@/lib/workspace/mockData';
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

const STRUCT_FILL: Partial<Record<ElementKind, string>> = {
  wall: '#94a3b8', door: '#f7991f', pillar: '#64748b', reception: '#e2e8f0', amenity: '#e2e8f0', phone_booth: '#e2e8f0', collab_area: '#eef2ff', label: 'transparent',
};

export default function FloorPlan(props: FloorPlanProps) {
  const {
    floor, elements = [], desks, zones = [], rooms = [], mode = 'view', liveStatus, heat,
    highlightDeskIds = [], selectedDeskId, showZones = true, showRooms = true, showLabels = true,
    showMinimap = false, backgroundImageUrl, backgroundOpacity = 0.4, height = 560,
    onSelectDesk, onMoveDesk,
  } = props;

  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [size, setSize] = useState({ w: 900, h: height });
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState<Point>({ x: 0, y: 0 });
  const [bgImg, setBgImg] = useState<HTMLImageElement | null>(null);
  const highlightSet = new Set(highlightDeskIds);

  // measure container
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: height });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [height]);

  // fit to screen whenever the floor or viewport changes
  const fit = () => {
    const s = Math.min(size.w / floor.widthPx, size.h / floor.heightPx) * 0.95;
    setScale(s);
    setPos({ x: (size.w - floor.widthPx * s) / 2, y: (size.h - floor.heightPx * s) / 2 });
  };
  useEffect(fit, [size.w, size.h, floor.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // background image
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
    const oldScale = scale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const mousePoint = { x: (pointer.x - pos.x) / oldScale, y: (pointer.y - pos.y) / oldScale };
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = Math.max(0.2, Math.min(3, oldScale * (direction > 0 ? 1.1 : 1 / 1.1)));
    setScale(newScale);
    setPos({ x: pointer.x - mousePoint.x * newScale, y: pointer.y - mousePoint.y * newScale });
  };

  const deskFill = (d: Desk): string => {
    if (mode === 'heatmap') return heat?.[d.id] ? heatColor(heat[d.id]) : '#e5e7eb';
    if (mode === 'occupancy') return deskStateColor((liveStatus?.[d.id] as OccupancyState) ?? 'vacant');
    if (mode === 'search') return highlightSet.has(d.id) ? '#f7991f' : '#e5e7eb';
    return deskStateColor(d.deskState);
  };

  return (
    <div className="ws-canvas-wrap" ref={wrapRef} style={{ height }}>
      <div className="ws-canvas-toolbar">
        <button className="btn btn--ghost btn--icon" title="Zoom in" onClick={() => setScale((s) => Math.min(3, s * 1.15))}><Icon name="zoomIn" size={16} /></button>
        <button className="btn btn--ghost btn--icon" title="Zoom out" onClick={() => setScale((s) => Math.max(0.2, s / 1.15))}><Icon name="zoomOut" size={16} /></button>
        <button className="btn btn--ghost btn--icon" title="Fit to screen" onClick={fit}><Icon name="crosshair" size={16} /></button>
        <span className="ws-canvas-mode">{mode}</span>
      </div>

      <Stage
        ref={stageRef}
        width={size.w}
        height={size.h}
        scaleX={scale}
        scaleY={scale}
        x={pos.x}
        y={pos.y}
        draggable
        onWheel={onWheel}
        onDragEnd={(e) => { if (e.target === stageRef.current) setPos({ x: e.target.x(), y: e.target.y() }); }}
        style={{ background: '#f8fafc' }}
      >
        <Layer>
          {/* floor outline */}
          <Rect x={0} y={0} width={floor.widthPx} height={floor.heightPx} fill="#ffffff" stroke="#cbd5e1" strokeWidth={2} cornerRadius={4} />
          {/* background trace image (design) */}
          {bgImg && <KonvaImage image={bgImg} x={0} y={0} width={floor.widthPx} height={floor.heightPx} opacity={backgroundOpacity} listening={false} />}

          {/* zones */}
          {showZones && zones.map((z) => (
            <Group key={z.id}>
              <Rect x={z.bbox.x} y={z.bbox.y} width={z.bbox.w} height={z.bbox.h} fill={z.colorHex} opacity={0.1} stroke={z.colorHex} strokeWidth={1.5} dash={[8, 6]} cornerRadius={6} listening={false} />
              {showLabels && <Text x={z.bbox.x + 8} y={z.bbox.y + 8} text={z.name} fontSize={13} fontStyle="bold" fill={z.colorHex} listening={false} />}
            </Group>
          ))}

          {/* structural elements (walls/doors/pillars/reception) */}
          {elements.map((el) => (
            <Group key={el.id}>
              <Rect x={el.geometry.x} y={el.geometry.y} width={el.geometry.w} height={el.geometry.h} rotation={el.geometry.rot} fill={STRUCT_FILL[el.kind] ?? '#e2e8f0'} cornerRadius={el.kind === 'pillar' ? 4 : 2} listening={false} />
              {showLabels && el.label && <Text x={el.geometry.x} y={el.geometry.y - 14} text={el.label} fontSize={11} fill="#64748b" listening={false} />}
            </Group>
          ))}

          {/* meeting rooms */}
          {showRooms && rooms.map((r) => (
            <Group key={r.id}>
              <Rect x={r.geometry.x} y={r.geometry.y} width={r.geometry.w} height={r.geometry.h} fill="#eef4fb" stroke="#94a3b8" strokeWidth={1.5} cornerRadius={4} />
              {showLabels && <Text x={r.geometry.x + 6} y={r.geometry.y + 6} text={`${r.name}\n${r.capacity} pax`} fontSize={11} fill="#334155" listening={false} />}
            </Group>
          ))}

          {/* desks */}
          {desks.map((d) => {
            const selected = d.id === selectedDeskId;
            const dimmed = mode === 'search' && highlightDeskIds.length > 0 && !highlightSet.has(d.id);
            return (
              <Group key={d.id} opacity={dimmed ? 0.3 : 1}>
                <Rect
                  x={d.geometry.x}
                  y={d.geometry.y}
                  width={d.geometry.w}
                  height={d.geometry.h}
                  rotation={d.geometry.rot}
                  fill={deskFill(d)}
                  stroke={selected ? '#064281' : highlightSet.has(d.id) ? '#e07f0a' : '#94a3b8'}
                  strokeWidth={selected || highlightSet.has(d.id) ? 2.5 : 1}
                  cornerRadius={4}
                  draggable={mode === 'design'}
                  onClick={() => onSelectDesk?.(d.id)}
                  onTap={() => onSelectDesk?.(d.id)}
                  onDragEnd={(e) => onMoveDesk?.(d.id, { x: e.target.x(), y: e.target.y() })}
                />
                {showLabels && scale > 0.55 && (
                  <Text x={d.geometry.x} y={d.geometry.y + d.geometry.h / 2 - 5} width={d.geometry.w} align="center" text={d.deskNo.split('-').pop() ?? d.deskNo} fontSize={9} fill="#1b2a41" listening={false} />
                )}
              </Group>
            );
          })}
        </Layer>
      </Stage>

      {showMinimap && (
        <div className="ws-minimap" aria-hidden>
          {desks.map((d) => (
            <span key={d.id} className="ws-minimap__dot" style={{ left: `${(d.geometry.x / floor.widthPx) * 100}%`, top: `${(d.geometry.y / floor.heightPx) * 100}%`, background: deskFill(d) }} />
          ))}
        </div>
      )}
    </div>
  );
}
