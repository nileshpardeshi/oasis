'use client';
// OASIS — Workplace floor-plan DESIGNER (Konva). SSR-unsafe → load via dynamic(ssr:false).

import { useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Rect, Circle, Line, Text, Group, Arc } from 'react-konva';
import Konva from 'konva';
import { Icon } from '@/components/ui/Icon';

Konva.dragButtons = [0]; // LEFT button drags items; RIGHT button pans

type SymType =
  | 'wall' | 'room' | 'door' | 'window' | 'pillar' | 'stairs' | 'lift' | 'entrance'
  | 'bay' | 'deskGrid' | 'desk' | 'pod' | 'cubicle' | 'cabin'
  | 'roundTable' | 'rectTable' | 'tv' | 'whiteboard'
  | 'reception' | 'sofa' | 'coffeeTable' | 'cafeTable' | 'counter' | 'booth' | 'printer' | 'plant' | 'restroom' | 'water'
  | 'text';

interface EItem { id: string; type: SymType; x: number; y: number; w: number; h: number; rot: number; label?: string; orient?: 'up' | 'down'; cap?: number; color?: string }

const GRID = 10, WALL_TH = 10, DW = 40, DH = 24, MAX_GRID_DESKS = 1200;
const DRAG_TYPES = new Set<SymType>(['wall', 'room', 'window', 'counter', 'deskGrid', 'bay']);
const CAP_TYPES = new Set<SymType>(['room', 'roundTable', 'rectTable']);
const BAY_COLORS = ['#064281', '#2563eb', '#0ea5e9', '#0891b2', '#14b8a6', '#16a34a', '#65a30d', '#ca8a04', '#f7991f', '#ea580c', '#dc2626', '#db2777', '#d946ef', '#7c3aed', '#6366f1', '#64748b'];
// 8 resize handles (corners + edges) for on-canvas drag-resizing of a selected item
const HANDLES: { k: string; cx: number; cy: number; cur: string }[] = [
  { k: 'nw', cx: 0, cy: 0, cur: 'nwse-resize' }, { k: 'n', cx: 0.5, cy: 0, cur: 'ns-resize' }, { k: 'ne', cx: 1, cy: 0, cur: 'nesw-resize' },
  { k: 'w', cx: 0, cy: 0.5, cur: 'ew-resize' }, { k: 'e', cx: 1, cy: 0.5, cur: 'ew-resize' },
  { k: 'sw', cx: 0, cy: 1, cur: 'nesw-resize' }, { k: 's', cx: 0.5, cy: 1, cur: 'ns-resize' }, { k: 'se', cx: 1, cy: 1, cur: 'nwse-resize' },
];

const DEF: Record<SymType, { w: number; h: number; label?: string; cap?: number }> = {
  wall: { w: 160, h: WALL_TH }, room: { w: 250, h: 180, label: 'Meeting room', cap: 8 }, door: { w: 40, h: 40 }, window: { w: 80, h: WALL_TH },
  pillar: { w: 26, h: 26 }, stairs: { w: 90, h: 130, label: 'Stairs' }, lift: { w: 84, h: 84, label: 'Lift' }, entrance: { w: 70, h: 46, label: 'Entry' },
  bay: { w: 320, h: 240, label: 'Bay / Area' }, deskGrid: { w: 460, h: 320 }, desk: { w: DW, h: DH }, pod: { w: 196, h: 132, label: '' }, cubicle: { w: 110, h: 110, label: 'Cubicle' }, cabin: { w: 190, h: 140, label: 'Cabin' },
  roundTable: { w: 96, h: 96, cap: 6 }, rectTable: { w: 180, h: 92, cap: 8 }, tv: { w: 78, h: 12, label: 'Screen' }, whiteboard: { w: 100, h: 10, label: 'Whiteboard' },
  reception: { w: 230, h: 70, label: 'Reception' }, sofa: { w: 150, h: 56 }, coffeeTable: { w: 58, h: 34 }, cafeTable: { w: 84, h: 84 },
  counter: { w: 240, h: 34, label: 'Counter' }, booth: { w: 66, h: 78, label: 'Booth' }, printer: { w: 46, h: 54, label: 'Printer' },
  plant: { w: 30, h: 30 }, restroom: { w: 150, h: 130, label: 'Restroom' }, water: { w: 34, h: 34, label: 'Water' }, text: { w: 120, h: 26, label: 'Label' },
};

const GROUPS: { title: string; items: { type: SymType; label: string; sym: string }[] }[] = [
  { title: 'Zones', items: [{ type: 'bay', label: 'Bay / Area', sym: '▢' }] },
  { title: 'Structure', items: [
    { type: 'wall', label: 'Wall', sym: '▭' }, { type: 'room', label: 'Meeting room', sym: '⬚' }, { type: 'door', label: 'Door', sym: '🚪' },
    { type: 'window', label: 'Window', sym: '🪟' }, { type: 'pillar', label: 'Pillar', sym: '◼' }, { type: 'stairs', label: 'Stairs', sym: '🪜' },
    { type: 'lift', label: 'Lift', sym: '🛗' }, { type: 'entrance', label: 'In / Out', sym: '⇅' },
  ] },
  { title: 'Workspace', items: [
    { type: 'deskGrid', label: 'Desk grid (bulk)', sym: '▦' }, { type: 'desk', label: 'Single desk', sym: '🖥' }, { type: 'pod', label: 'Desk pod', sym: '⬓' }, { type: 'cubicle', label: 'Cubicle', sym: '◰' }, { type: 'cabin', label: 'Cabin', sym: '🏢' },
  ] },
  { title: 'Meeting', items: [
    { type: 'roundTable', label: 'Round table', sym: '⭕' }, { type: 'rectTable', label: 'Board table', sym: '▬' }, { type: 'tv', label: 'Screen', sym: '📺' }, { type: 'whiteboard', label: 'Whiteboard', sym: '▭' },
  ] },
  { title: 'Amenities', items: [
    { type: 'reception', label: 'Reception', sym: '🛎' }, { type: 'sofa', label: 'Sofa', sym: '🛋' }, { type: 'coffeeTable', label: 'Coffee table', sym: '▢' }, { type: 'cafeTable', label: 'Café table', sym: '☕' },
    { type: 'counter', label: 'Counter', sym: '▭' }, { type: 'booth', label: 'Phone booth', sym: '☎' }, { type: 'printer', label: 'Printer', sym: '🖨' }, { type: 'plant', label: 'Plant', sym: '🪴' },
    { type: 'restroom', label: 'Restroom', sym: '🚻' }, { type: 'water', label: 'Water point', sym: '💧' },
  ] },
  { title: 'Annotate', items: [{ type: 'text', label: 'Text', sym: 'T' }] },
];

const snap = (v: number, on: boolean) => (on ? Math.round(v / GRID) * GRID : Math.round(v));
let _id = 0;
const newId = () => `it-${Date.now().toString(36)}-${_id++}`;
const pad = (n: number) => String(n).padStart(3, '0');
const CHAIR = '#c2ccd9', WALLC = '#9aa7b8';

function chairsRound(cx: number, cy: number, r: number, n: number) {
  const out: { x: number; y: number }[] = []; const c = Math.max(1, Math.min(n, 14));
  for (let i = 0; i < c; i++) { const a = (i / c) * Math.PI * 2 - Math.PI / 2; out.push({ x: cx + (r + 9) * Math.cos(a), y: cy + (r + 9) * Math.sin(a) }); }
  return out;
}
function chairsRect(cx: number, cy: number, tw: number, th: number, n: number) {
  const out: { x: number; y: number }[] = []; const top = Math.ceil(n / 2), bot = n - top;
  for (let i = 0; i < top; i++) out.push({ x: cx - tw / 2 + (tw * (i + 1)) / (top + 1), y: cy - th / 2 - 9 });
  for (let i = 0; i < bot; i++) out.push({ x: cx - tw / 2 + (tw * (i + 1)) / (bot + 1), y: cy + th / 2 + 9 });
  return out;
}

function Glyph({ it }: { it: EItem }) {
  const { type, w, h, label } = it;
  switch (type) {
    case 'bay': return (<><Rect width={w} height={h} fill={it.color ?? '#064281'} opacity={0.1} stroke={it.color ?? '#064281'} strokeWidth={1.5} dash={[10, 6]} cornerRadius={14} /><Rect x={10} y={10} width={Math.min(w - 20, (label ?? 'Bay').length * 7 + 26)} height={22} fill="#ffffff" cornerRadius={11} /><Rect x={20} y={17} width={8} height={8} fill={it.color ?? '#064281'} cornerRadius={2} /><Text x={34} y={15} text={label || 'Bay'} fontSize={12} fontStyle="700" fill="#1b2a41" /></>);
    case 'wall': return <Rect width={w} height={h} fill={WALLC} cornerRadius={1} />;
    case 'pillar': return <Rect width={w} height={h} fill="#6b7280" cornerRadius={2} />;
    case 'window': return <><Rect width={w} height={h} fill="#dbeafe" stroke="#93c5fd" strokeWidth={1} /><Line points={[0, h / 2, w, h / 2]} stroke="#93c5fd" strokeWidth={1} /></>;
    case 'room': {
      const cap = it.cap ?? 8, cx = w / 2, cy = h / 2 + 5, round = cap <= 8;
      const tw = Math.min(w * 0.52, 150), th = Math.min(h * 0.34, 74), rr = Math.min(tw, th) / 2;
      const chairs = round ? chairsRound(cx, cy, rr, cap) : chairsRect(cx, cy, tw, th, cap);
      return (<>
        <Rect width={w} height={h} fill="#eef3fa" stroke={WALLC} strokeWidth={2.5} cornerRadius={5} />
        <Rect x={w * 0.42} y={h - 3} width={w * 0.18} height={5} fill="#eef3fa" />
        {chairs.map((c, i) => <Circle key={i} x={c.x} y={c.y} radius={4.5} fill={CHAIR} />)}
        {round ? <Circle x={cx} y={cy} radius={rr} fill="#dbe4f1" stroke="#c3d0e2" strokeWidth={1.5} /> : <Rect x={cx - tw / 2} y={cy - th / 2} width={tw} height={th} fill="#dbe4f1" stroke="#c3d0e2" strokeWidth={1.5} cornerRadius={5} />}
        <Text x={8} y={7} width={w - 16} text={label || 'Meeting room'} fontSize={11.5} fontStyle="700" fill="#33508a" />
        <Text x={8} y={21} text={`${cap} pax`} fontSize={9.5} fill="#7d8ba0" />
      </>);
    }
    case 'cabin': return (<><Rect width={w} height={h} fill="#eef3fa" stroke={WALLC} strokeWidth={2.5} cornerRadius={5} /><Rect x={w * 0.5 - 24} y={h * 0.5 - 11} width={48} height={22} fill="#dbe4f1" stroke="#c3d0e2" cornerRadius={3} /><Circle x={w * 0.5} y={h * 0.5 + 24} radius={7} fill={CHAIR} /><Text x={8} y={7} text={label || 'Cabin'} fontSize={11.5} fontStyle="700" fill="#33508a" /></>);
    case 'door': return (<><Rect width={w} height={4} fill={WALLC} /><Line points={[0, 0, 0, h]} stroke={WALLC} strokeWidth={3} /><Arc x={0} y={0} angle={90} innerRadius={h} outerRadius={h} stroke="#c3d0e2" strokeWidth={1} dash={[4, 4]} /></>);
    case 'desk': { const up = (it.orient ?? 'up') === 'up'; return (<><Rect x={(w - w * 0.6) / 2} y={up ? -8 : h + 1} width={w * 0.6} height={7} fill={CHAIR} cornerRadius={3} /><Rect width={w} height={h} fill="#93c5fd" stroke="#7badf0" strokeWidth={1} cornerRadius={4} /><Rect x={w * 0.16} y={up ? 1 : h - 4} width={w * 0.68} height={3} fill="#5b95e6" cornerRadius={1.5} /></>); }
    case 'pod': { const cols = 4, rows = 2, dw = (w - 6) / cols - 4, dh = (h - 24) / rows; const cells = []; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const x = 4 + c * (dw + 4); const y = 12 + r * (dh + 6); const up = r === 0; cells.push(<Group key={`${r}-${c}`}><Rect x={x + (dw - dw * 0.6) / 2} y={up ? y - 8 : y + dh + 1} width={dw * 0.6} height={7} fill={CHAIR} cornerRadius={3} /><Rect x={x} y={y} width={dw} height={dh} fill="#93c5fd" stroke="#7badf0" strokeWidth={0.8} cornerRadius={3} /></Group>); } return <>{cells}</>; }
    case 'cubicle': return (<><Rect width={w} height={h} fill="#f1f5f9" stroke="#cbd5e1" strokeWidth={1.5} dash={[5, 4]} cornerRadius={4} /><Rect x={w * 0.5 - 18} y={h * 0.5 - 9} width={36} height={18} fill="#93c5fd" cornerRadius={3} /><Circle x={w * 0.5} y={h * 0.5 + 20} radius={6} fill={CHAIR} /></>);
    case 'roundTable': { const r = Math.min(w, h) / 2; return (<>{chairsRound(r, r, r * 0.62, it.cap ?? 6).map((c, i) => <Circle key={i} x={c.x} y={c.y} radius={5} fill={CHAIR} />)}<Circle x={r} y={r} radius={r * 0.62} fill="#dbe4f1" stroke="#c3d0e2" strokeWidth={1.5} /></>); }
    case 'cafeTable': { const r = Math.min(w, h) / 2; return (<>{chairsRound(r, r, r * 0.6, 4).map((c, i) => <Circle key={i} x={c.x} y={c.y} radius={5} fill={CHAIR} />)}<Circle x={r} y={r} radius={r * 0.6} fill="#eef2f7" stroke="#cfd9e6" strokeWidth={1.5} /></>); }
    case 'rectTable': { const cap = it.cap ?? 8; return (<>{chairsRect(w / 2, h / 2, w * 0.8, h * 0.62, cap).map((c, i) => <Circle key={i} x={c.x} y={c.y} radius={5} fill={CHAIR} />)}<Rect width={w} height={h} fill="#dbe4f1" stroke="#c3d0e2" strokeWidth={1.5} cornerRadius={6} /></>); }
    case 'reception': return (<>
      <Rect x={0} y={h * 0.5} width={w} height={h * 0.5} fill="#cdddf1" cornerRadius={6} />
      <Rect width={w} height={h * 0.62} fill="#e6eef9" stroke={WALLC} strokeWidth={1.5} cornerRadius={10} />
      <Rect x={14} y={10} width={w - 28} height={9} fill="#b8cdea" cornerRadius={4} />
      <Rect x={w * 0.5 - 14} y={6} width={28} height={16} fill="#1f2937" cornerRadius={2} />
      <Circle x={w * 0.5} y={h - 6} radius={9} fill={CHAIR} />
      <Text x={0} y={h * 0.5 + 6} width={w} align="center" text={label || 'Reception'} fontSize={11} fontStyle="700" fill="#33508a" /></>);
    case 'sofa': return (<>
      <Rect width={w} height={h} fill="#cdd9e8" cornerRadius={10} />
      <Rect x={4} y={6} width={14} height={h - 12} fill="#b7c6da" cornerRadius={6} />
      <Rect x={w - 18} y={6} width={14} height={h - 12} fill="#b7c6da" cornerRadius={6} />
      <Rect x={18} y={4} width={w - 36} height={11} fill="#b7c6da" cornerRadius={5} />
      <Line points={[w / 2, 18, w / 2, h - 6]} stroke="#b7c6da" strokeWidth={2} /></>);
    case 'coffeeTable': return <Rect width={w} height={h} fill="#e3e9f1" stroke="#cfd9e6" strokeWidth={1} cornerRadius={8} />;
    case 'counter': return (<><Rect y={h * 0.45} width={w} height={h * 0.55} fill="#b7c6da" cornerRadius={3} /><Rect width={w} height={h * 0.55} fill="#d3ddec" stroke="#bccadd" strokeWidth={1} cornerRadius={6} /><Circle x={w * 0.25} y={h + 8} radius={6} fill={CHAIR} /><Circle x={w * 0.5} y={h + 8} radius={6} fill={CHAIR} /><Circle x={w * 0.75} y={h + 8} radius={6} fill={CHAIR} /></>);
    case 'booth': return (<><Rect width={w} height={h} fill="#e3edf7" stroke={WALLC} strokeWidth={2} cornerRadius={6} /><Rect x={5} y={5} width={w - 10} height={h * 0.55} fill="#cfe0f3" stroke="#aebfd6" cornerRadius={3} /><Circle x={w / 2} y={h - 14} radius={7} fill={CHAIR} /><Text x={0} y={h * 0.18} width={w} align="center" text="☎" fontSize={15} fill="#5b7186" /><Text x={0} y={h - 6} width={w} align="center" text={label || 'Booth'} fontSize={8.5} fill="#7d8ba0" /></>);
    case 'printer': return (<><Rect y={h * 0.3} width={w} height={h * 0.7} fill="#cbd5e1" stroke="#9aa7b8" strokeWidth={1} cornerRadius={4} /><Rect x={w * 0.12} y={0} width={w * 0.76} height={h * 0.4} fill="#dbe2ec" stroke="#b9c6da" cornerRadius={3} /><Rect x={w * 0.18} y={h * 0.5} width={w * 0.64} height={6} fill="#9aa7b8" cornerRadius={2} /><Circle x={w * 0.78} y={h * 0.22} radius={2.4} fill="#16a34a" /><Text x={0} y={h - 13} width={w} align="center" text="🖨" fontSize={12} /></>);
    case 'tv': return <><Rect width={w} height={h} fill="#1f2937" cornerRadius={2} /><Rect x={2} y={2} width={w - 4} height={h - 4} fill="#374151" cornerRadius={1} /></>;
    case 'whiteboard': return <Rect width={w} height={h} fill="#ffffff" stroke="#94a3b8" strokeWidth={2} cornerRadius={1} />;
    case 'plant': return (<><Circle x={w / 2} y={h / 2} radius={Math.min(w, h) / 2} fill="#cdeccd" stroke="#9ad29a" strokeWidth={1.5} /><Circle x={w / 2} y={h / 2} radius={Math.min(w, h) / 5} fill="#8cc78c" /></>);
    case 'water': return (<><Circle x={w / 2} y={h / 2} radius={Math.min(w, h) / 2} fill="#e0f2fe" stroke="#7dd3fc" strokeWidth={1.5} /><Text x={0} y={h / 2 - 8} width={w} align="center" text="💧" fontSize={13} /></>);
    case 'stairs': { const lines = []; for (let i = 1; i < 7; i++) lines.push(<Line key={i} points={[0, (h / 7) * i, w, (h / 7) * i]} stroke="#b9c6da" strokeWidth={1.5} />); return (<><Rect width={w} height={h} fill="#f1f5f9" stroke={WALLC} strokeWidth={1.5} cornerRadius={3} />{lines}<Text x={0} y={4} width={w} align="center" text="Stairs" fontSize={10} fill="#7d8ba0" /></>); }
    case 'lift': return (<><Rect width={w} height={h} fill="#f1f5f9" stroke={WALLC} strokeWidth={1.5} cornerRadius={3} /><Line points={[8, 8, w - 8, h - 8]} stroke="#cbd5e1" /><Line points={[w - 8, 8, 8, h - 8]} stroke="#cbd5e1" /><Text x={0} y={h / 2 - 7} width={w} align="center" text="Lift" fontSize={11} fontStyle="700" fill="#7d8ba0" /></>);
    case 'restroom': return (<><Rect width={w} height={h} fill="#eef3fa" stroke={WALLC} strokeWidth={2} cornerRadius={5} /><Circle x={w * 0.3} y={h * 0.42} radius={9} fill="#cdd9e8" /><Circle x={w * 0.68} y={h * 0.42} radius={9} fill="#cdd9e8" /><Text x={0} y={h - 22} width={w} align="center" text="🚻 Restroom" fontSize={11} fontStyle="700" fill="#33508a" /></>);
    case 'entrance': return (<><Rect width={w} height={h} fill="#ecfdf5" stroke="#6ee7b7" strokeWidth={1.5} cornerRadius={6} /><Line points={[w * 0.3, h * 0.7, w * 0.3, h * 0.3, w * 0.18, h * 0.45]} stroke="#16a34a" strokeWidth={2} /><Line points={[w * 0.3, h * 0.3, w * 0.42, h * 0.45]} stroke="#16a34a" strokeWidth={2} /><Text x={w * 0.5} y={h / 2 - 7} text="IN/OUT" fontSize={10} fontStyle="700" fill="#16a34a" /></>);
    case 'text': return <Text width={w} text={label || 'Label'} fontSize={15} fontStyle="700" fill="#33508a" />;
    default: return <Rect width={w} height={h} fill="#e2e8f0" stroke="#94a3b8" cornerRadius={3} />;
  }
}

function sampleItems(): EItem[] {
  const it = (type: SymType, x: number, y: number, w?: number, h?: number, label?: string): EItem => ({ id: newId(), type, x, y, w: w ?? DEF[type].w, h: h ?? DEF[type].h, rot: 0, label: label ?? DEF[type].label, cap: DEF[type].cap });
  return [
    it('wall', 600, 10, 1180, WALL_TH), it('wall', 600, 690, 1180, WALL_TH), it('wall', 14, 350, WALL_TH, 690), it('wall', 1186, 350, WALL_TH, 690),
    { ...it('bay', 250, 330, 470, 300, 'Core bay'), color: '#064281' },
    it('room', 250, 110, 240, 170, 'Symphony'), it('room', 560, 110, 200, 160, 'Magnum'), it('room', 980, 110, 200, 150, 'Jazz'),
    it('reception', 600, 600, 230, 70, 'Reception'), it('sofa', 150, 580, 150, 56), it('coffeeTable', 180, 520, 58, 34), it('plant', 80, 560),
    it('cafeTable', 1050, 560, 84, 84), it('counter', 1010, 470, 200, 34, 'Pantry'), it('booth', 1120, 250), it('entrance', 700, 660),
  ];
}

export default function FloorEditor() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [size, setSize] = useState({ w: 800, h: 620 });
  const [scale, setScale] = useState(0.62);
  const [pos, setPos] = useState({ x: 40, y: 30 });
  const [board, setBoard] = useState({ w: 2200, h: 1400 });
  const [tool, setTool] = useState<SymType | 'select' | 'number'>('select');
  const [items, setItems] = useState<EItem[]>(() => sampleItems());
  const [selIds, setSelIds] = useState<string[]>([]);
  const [snapOn, setSnapOn] = useState(true);
  const [full, setFull] = useState(false);
  const [prefix, setPrefix] = useState('WS');
  const [numStart, setNumStart] = useState(1);
  const [numSeq, setNumSeq] = useState<string[]>([]);
  const [numMode, setNumMode] = useState<'pick' | 'line'>('pick');
  const [lineA, setLineA] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [draft, setDraft] = useState<{ type: SymType; x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [marq, setMarq] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const past = useRef<EItem[][]>([]);
  const seq = useRef(1);
  const pan = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  const nodeRefs = useRef<Map<string, Konva.Group>>(new Map());
  const groupDrag = useRef<{ lead: string; start: Map<string, { x: number; y: number }> } | null>(null);

  const selected = selIds.length === 1 ? selIds[0] : null;
  const sel = useMemo(() => (selIds.length === 1 ? items.find((i) => i.id === selIds[0]) || null : null), [items, selIds]);
  const selDeskCount = useMemo(() => items.filter((i) => i.type === 'desk' && selIds.includes(i.id)).length, [items, selIds]);
  const deskCount = useMemo(() => items.filter((i) => i.type === 'desk').length, [items]);
  const numIdx = useMemo(() => new Map(numSeq.map((id, i) => [id, i])), [numSeq]); // desk id → position in the numbering pick-list

  const commit = (next: EItem[]) => { past.current.push(items); if (past.current.length > 30) past.current.shift(); setItems(next); };
  const beginEdit = () => { past.current.push(items); if (past.current.length > 30) past.current.shift(); }; // history once before a live drag
  const undo = () => { const p = past.current.pop(); if (p) { setItems(p); setSelIds([]); } };
  const setCur = (e: Konva.KonvaEventObject<MouseEvent>, c: string) => { const s = e.target.getStage(); if (s) s.container().style.cursor = c; };

  useEffect(() => { const el = wrapRef.current; if (!el) return; const m = () => setSize({ w: el.clientWidth, h: el.clientHeight }); m(); const ro = new ResizeObserver(m); ro.observe(el); return () => ro.disconnect(); }, [full]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      if (e.key === 'Escape') { if (full) setFull(false); else { setTool('select'); setSelIds([]); setDraft(null); setMarq(null); setNumSeq([]); setLineA(null); } }
      else if ((e.key === 'Delete' || e.key === 'Backspace') && selIds.length) { e.preventDefault(); const del = new Set(selIds); commit(items.filter((i) => !del.has(i.id))); setSelIds([]); }
      else if ((e.key === 'r' || e.key === 'R') && selIds.length) { const s = new Set(selIds); commit(items.map((i) => s.has(i.id) ? { ...i, rot: (i.rot + 90) % 360 } : i)); }
      else if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
    };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const coords = () => { const s = stageRef.current; const p = s?.getPointerPosition(); if (!p) return null; return { x: (p.x - pos.x) / scale, y: (p.y - pos.y) / scale }; };
  const deskLabel = () => `${prefix} ${pad(seq.current++)}`.trim();

  // place one item, then drop back to Select and select it (draw-once behaviour)
  const place = (type: SymType, cx: number, cy: number) => {
    const d = DEF[type]; const id = newId();
    commit([...items, { id, type, x: cx, y: cy, w: d.w, h: d.h, rot: 0, label: type === 'desk' ? deskLabel() : d.label, cap: d.cap, color: type === 'bay' ? BAY_COLORS[0] : undefined }]);
    setTool('select'); setSelIds([id]);
  };

  const makeDeskGrid = (x: number, y: number, w: number, h: number): EItem[] => {
    const PX = DW + 6, benchH = 8 + DH + 3 + DH + 8, blockY = benchH + 22;
    const cols = Math.max(1, Math.floor(w / PX)), benches = Math.max(1, Math.floor(h / blockY)); const out: EItem[] = [];
    for (let b = 0; b < benches; b++) { const topY = y + b * blockY + 8, botY = topY + DH + 3; for (let c = 0; c < cols; c++) { if (out.length + 2 > MAX_GRID_DESKS) return out; const dx = x + c * PX; out.push({ id: newId(), type: 'desk', x: dx, y: topY, w: DW, h: DH, rot: 0, orient: 'up', label: deskLabel() }); out.push({ id: newId(), type: 'desk', x: dx, y: botY, w: DW, h: DH, rot: 0, orient: 'down', label: deskLabel() }); } }
    return out;
  };

  const readingOrder = (a: EItem, b: EItem) => (Math.round(a.y / 40) - Math.round(b.y / 40)) || (a.x - b.x);

  // renumber EVERY desk in reading order, starting at the Start # value
  const renumber = () => {
    let n = Math.max(0, numStart || 0); const start = n;
    const sorted = items.filter((i) => i.type === 'desk').sort(readingOrder);
    const map = new Map(sorted.map((d) => [d.id, `${prefix} ${pad(n++)}`.trim()]));
    seq.current = n; commit(items.map((i) => map.has(i.id) ? { ...i, label: map.get(i.id) } : i));
    setNote(`Renumbered all ${map.size} desks → ${prefix} ${pad(start)} … ${prefix} ${pad(n - 1)}`);
  };

  // renumber just the desks in the current box-selection, in reading order
  const renumberSelection = () => {
    const ids = new Set(selIds); let n = Math.max(0, numStart || 0); const start = n;
    const run = items.filter((i) => i.type === 'desk' && ids.has(i.id)).sort(readingOrder);
    if (!run.length) { setNote('Box-select some desks on the plan first.'); return; }
    const map = new Map(run.map((d) => [d.id, `${prefix} ${pad(n++)}`.trim()]));
    commit(items.map((i) => map.has(i.id) ? { ...i, label: map.get(i.id) } : i));
    setNote(`Renumbered ${run.length} selected desks → ${prefix} ${pad(start)} … ${prefix} ${pad(n - 1)}`);
  };

  const rectsIntersect = (it: EItem, bx: number, by: number, bw: number, bh: number) =>
    it.x < bx + bw && it.x + it.w > bx && it.y < by + bh && it.y + it.h > by;

  // NUMBER DESKS — the user explicitly highlights which desks to fill (click in order, or box-add),
  // then we number them consecutively from the Start #. No row/line guessing.
  const toggleNumPick = (id: string) => {
    const it = items.find((i) => i.id === id);
    if (!it || it.type !== 'desk') { setNote('Only desks can be numbered — click a desk.'); return; }
    setNumSeq((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));
  };
  // add a dragged box of desks (in reading order) to the pick-list, skipping any already picked
  const addBoxToNumPick = (bx: number, by: number, bw: number, bh: number) => {
    const add = items.filter((i) => i.type === 'desk' && rectsIntersect(i, bx, by, bw, bh)).sort(readingOrder).map((i) => i.id);
    setNumSeq((list) => { const have = new Set(list); return [...list, ...add.filter((id) => !have.has(id))]; });
  };
  // Start → End: the desks on the same row/column between two clicked endpoints, in order
  const lineRun = (aId: string, bId: string): string[] => {
    const a = items.find((i) => i.id === aId), b = items.find((i) => i.id === bId);
    if (!a || !b || a.type !== 'desk' || b.type !== 'desk') return [];
    const ax = a.x + a.w / 2, ay = a.y + a.h / 2, bx = b.x + b.w / 2, by = b.y + b.h / 2;
    const horiz = Math.abs(bx - ax) >= Math.abs(by - ay);
    const band = (horiz ? Math.max(a.h, b.h) : Math.max(a.w, b.w)) * 0.8 + 4;
    const len = Math.hypot(bx - ax, by - ay) || 1, nx = (bx - ax) / len, ny = (by - ay) / len, px = -ny, py = nx;
    return items.filter((i) => i.type === 'desk').map((d) => {
      const cx = d.x + d.w / 2, cy = d.y + d.h / 2;
      return { id: d.id, along: (cx - ax) * nx + (cy - ay) * ny, off: Math.abs((cx - ax) * px + (cy - ay) * py) };
    }).filter((r) => r.off <= band / 2 && r.along >= -2 && r.along <= len + 2).sort((p, q) => p.along - q.along).map((r) => r.id);
  };
  const handleLinePick = (id: string) => {
    const it = items.find((i) => i.id === id);
    if (!it || it.type !== 'desk') { setNote('Click a desk for the start / end point.'); return; }
    if (!lineA) { setLineA(id); setNote('Start point set — now click the END desk of the row/column.'); return; }
    if (lineA === id) { setLineA(null); setNote('Start point cleared.'); return; }
    const run = lineRun(lineA, id);
    if (run.length < 2) { setNote('Those two desks are not on the same row/column — try again.'); setLineA(null); return; }
    setNumSeq((list) => { const have = new Set(list); return [...list, ...run.filter((r) => !have.has(r))]; });
    setLineA(null); setNote(`Added ${run.length} desks between the two points — Apply to number them.`);
  };

  // write the running numbers onto the highlighted desks, in the order they were picked
  const applyNumbering = () => {
    if (!numSeq.length) { setNote('Highlight the desks to number first (click them on the plan).'); return; }
    let n = Math.max(0, numStart || 0); const start = n;
    const map = new Map(numSeq.map((id) => [id, `${prefix} ${pad(n++)}`.trim()]));
    commit(items.map((i) => map.has(i.id) ? { ...i, label: map.get(i.id) } : i));
    setNote(`Numbered ${numSeq.length} desks → ${prefix} ${pad(start)} … ${prefix} ${pad(n - 1)}`);
    setNumSeq([]);
  };

  const onMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.evt.button === 2) { const p = stageRef.current?.getPointerPosition(); if (p) pan.current = { sx: p.x, sy: p.y, ox: pos.x, oy: pos.y }; return; }
    if (e.evt.button !== 0) return;
    const isEmpty = e.target === e.target.getStage() || e.target.name() === 'bg';
    if (tool === 'number') { if (isEmpty) { const c = coords(); if (c) setMarq({ x1: c.x, y1: c.y, x2: c.x, y2: c.y }); } return; }
    if (tool === 'select') { if (isEmpty) { const c = coords(); if (c) { setMarq({ x1: c.x, y1: c.y, x2: c.x, y2: c.y }); setSelIds([]); } } return; }
    const c = coords(); if (!c) return;
    const t = tool as SymType;
    if (DRAG_TYPES.has(t)) { const x = snap(c.x, snapOn), y = snap(c.y, snapOn); setDraft({ type: t, x1: x, y1: y, x2: x, y2: y }); }
    else place(t, snap(c.x, snapOn), snap(c.y, snapOn));
  };
  const onMouseMove = () => {
    if (pan.current) { const p = stageRef.current?.getPointerPosition(); if (p) setPos({ x: pan.current.ox + (p.x - pan.current.sx), y: pan.current.oy + (p.y - pan.current.sy) }); return; }
    if (marq) { const c = coords(); if (c) setMarq({ ...marq, x2: c.x, y2: c.y }); return; }
    if (!draft) return; const c = coords(); if (!c) return; setDraft({ ...draft, x2: snap(c.x, snapOn), y2: snap(c.y, snapOn) });
  };
  const onMouseUp = () => {
    if (pan.current) { pan.current = null; return; }
    if (marq) {
      const { x1, y1, x2, y2 } = marq; const bx = Math.min(x1, x2), by = Math.min(y1, y2), bw = Math.abs(x2 - x1), bh = Math.abs(y2 - y1);
      if (bw > 4 || bh > 4) {
        if (tool === 'number') addBoxToNumPick(bx, by, bw, bh);
        else { const hit = items.filter((i) => i.type !== 'bay' && rectsIntersect(i, bx, by, bw, bh)).map((i) => i.id); setSelIds(hit); setNote(hit.length ? `${hit.length} selected — drag any one to move them together.` : ''); }
      }
      setMarq(null); return;
    }
    if (!draft) return;
    const { type, x1, y1, x2, y2 } = draft; const dx = x2 - x1, dy = y2 - y1;
    if (type === 'deskGrid') { const gx = Math.min(x1, x2), gy = Math.min(y1, y2); if (Math.abs(dx) > GRID && Math.abs(dy) > GRID) commit([...items, ...makeDeskGrid(gx, gy, Math.abs(dx), Math.abs(dy))]); setTool('select'); setSelIds([]); }
    else if (type === 'wall') {
      let item: EItem; const id = newId();
      if (Math.abs(dx) < GRID && Math.abs(dy) < GRID) item = { id, type, x: x1, y: y1, w: DEF.wall.w, h: WALL_TH, rot: 0 };
      else if (Math.abs(dx) >= Math.abs(dy)) item = { id, type, x: Math.min(x1, x2), y: y1, w: Math.abs(dx), h: WALL_TH, rot: 0 };
      else item = { id, type, x: x1, y: Math.min(y1, y2), w: WALL_TH, h: Math.abs(dy), rot: 0 };
      commit([...items, item]); setTool('select'); setSelIds([id]);
    } else {
      const id = newId(); const w = Math.max(GRID * 2, Math.abs(dx)), h = Math.max(type === 'window' || type === 'counter' ? GRID : GRID * 2, Math.abs(dy));
      commit([...items, { id, type, x: Math.min(x1, x2), y: Math.min(y1, y2), w, h, rot: 0, label: DEF[type].label, cap: DEF[type].cap, color: type === 'bay' ? BAY_COLORS[0] : undefined }]);
      setTool('select'); setSelIds([id]);
    }
    setDraft(null);
  };

  const onWheel = (e: Konva.KonvaEventObject<WheelEvent>) => { e.evt.preventDefault(); const p = stageRef.current?.getPointerPosition(); if (!p) return; const mp = { x: (p.x - pos.x) / scale, y: (p.y - pos.y) / scale }; const ns = Math.max(0.15, Math.min(3, scale * (e.evt.deltaY > 0 ? 1 / 1.1 : 1.1))); setScale(ns); setPos({ x: p.x - mp.x * ns, y: p.y - mp.y * ns }); };
  const patch = (p: Partial<EItem>) => { if (!sel) return; commit(items.map((i) => i.id === sel.id ? { ...i, ...p } : i)); };
  const fit = () => { setScale(0.62); setPos({ x: 40, y: 30 }); };

  const draftBox = draft ? (() => { const { type, x1, y1, x2, y2 } = draft; const dx = x2 - x1, dy = y2 - y1; if (type === 'wall') return Math.abs(dx) >= Math.abs(dy) ? { x: Math.min(x1, x2), y: y1, w: Math.abs(dx) || DEF.wall.w, h: WALL_TH } : { x: x1, y: Math.min(y1, y2), w: WALL_TH, h: Math.abs(dy) || 40 }; return { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(dx), h: Math.abs(dy) }; })() : null;
  const draftCols = draft?.type === 'deskGrid' && draftBox ? Math.max(1, Math.floor(draftBox.w / (DW + 6))) * Math.max(1, Math.floor(draftBox.h / (8 + DH + 3 + DH + 8 + 22))) * 2 : 0;

  const hint = tool === 'select' ? (selIds.length > 1 ? `${selIds.length} selected · drag any one to move all · Renumber in panel` : 'Click to edit · drag empty area to box-select · drag item to move · right-drag to pan')
    : tool === 'number' ? (numMode === 'line' ? (lineA ? 'Now click the END desk of the row/column' : 'Click the START desk, then the END desk') : (numSeq.length ? `${numSeq.length} desks highlighted · click/box more, then Apply in the panel` : 'Click desks (or drag a box) to highlight which to number'))
    : tool === 'deskGrid' ? 'Drag a rectangle → fills with numbered desks'
    : tool === 'bay' ? 'Drag to create a named, colour-coded bay'
    : DRAG_TYPES.has(tool as SymType) ? `Drag to draw ${tool}` : `Click once to place ${tool}`;

  const onItemPick = (id: string) => { if (tool === 'number') { if (numMode === 'line') handleLinePick(id); else toggleNumPick(id); } else if (tool === 'select') { setSelIds([id]); setNote(''); } };

  const renderItem = (it: EItem) => {
    const isSel = selIds.includes(it.id); const pickIdx = it.type === 'desk' ? numIdx.get(it.id) : undefined; const picked = pickIdx !== undefined; const isLineA = lineA === it.id; const hw = Math.max(it.w, 22), hh = Math.max(it.h, 22);
    return (
      <Group key={it.id} ref={(n) => { if (n) nodeRefs.current.set(it.id, n); else nodeRefs.current.delete(it.id); }}
        x={it.x + it.w / 2} y={it.y + it.h / 2} offsetX={it.w / 2} offsetY={it.h / 2} rotation={it.rot}
        draggable={tool === 'select'}
        onClick={() => onItemPick(it.id)} onTap={() => onItemPick(it.id)}
        onDragStart={() => {
          if (tool !== 'select') return;
          if (selIds.includes(it.id) && selIds.length > 1) groupDrag.current = { lead: it.id, start: new Map(items.filter((i) => selIds.includes(i.id)).map((i) => [i.id, { x: i.x + i.w / 2, y: i.y + i.h / 2 }])) };
          else { groupDrag.current = null; setSelIds([it.id]); }
        }}
        onDragMove={(e) => {
          const g = groupDrag.current; if (!g || g.lead !== it.id) return;
          const s0 = g.start.get(it.id)!; const dx = e.target.x() - s0.x, dy = e.target.y() - s0.y;
          g.start.forEach((p, id) => { if (id !== it.id) nodeRefs.current.get(id)?.position({ x: p.x + dx, y: p.y + dy }); });
          e.target.getLayer()?.batchDraw();
        }}
        onDragEnd={(e) => {
          const g = groupDrag.current;
          if (g && g.lead === it.id) { const s0 = g.start.get(it.id)!; const dx = e.target.x() - s0.x, dy = e.target.y() - s0.y; const ids = new Set(g.start.keys()); commit(items.map((i) => ids.has(i.id) ? { ...i, x: snap(i.x + dx, snapOn), y: snap(i.y + dy, snapOn) } : i)); groupDrag.current = null; }
          else { const nx = snap(e.target.x() - it.w / 2, snapOn), ny = snap(e.target.y() - it.h / 2, snapOn); commit(items.map((i) => i.id === it.id ? { ...i, x: nx, y: ny } : i)); }
        }}
      >
        {/* padded transparent hit area so even thin items (whiteboard/screen) are easy to grab */}
        <Rect x={(it.w - hw) / 2} y={(it.h - hh) / 2} width={hw} height={hh} fill="#3b82f6" opacity={0.001} />
        <Glyph it={it} />
        {it.type === 'desk' && it.label && scale > 0.85 && !picked && <Text y={it.h / 2 - 4} width={it.w} align="center" text={it.label.replace(/^\D+/, '')} fontSize={8} fill="#33415588" listening={false} />}
        {picked && (<>
          <Rect x={-3} y={-3} width={it.w + 6} height={it.h + 6} fill="#f7991f22" stroke="#f7991f" strokeWidth={2.5} cornerRadius={4} listening={false} />
          <Rect x={it.w / 2 - 15} y={it.h / 2 - 8} width={30} height={15} fill="#f7991f" cornerRadius={7} listening={false} />
          <Text x={it.w / 2 - 15} y={it.h / 2 - 6} width={30} align="center" text={pad(numStart + (pickIdx as number))} fontSize={10} fontStyle="700" fill="#ffffff" listening={false} />
        </>)}
        {isLineA && !picked && <Rect x={-4} y={-4} width={it.w + 8} height={it.h + 8} stroke="#16a34a" strokeWidth={2.5} dash={[4, 3]} cornerRadius={4} listening={false} />}
        {isSel && !picked && !isLineA && <Rect x={-4} y={-4} width={it.w + 8} height={it.h + 8} stroke="#064281" strokeWidth={1.5} dash={[5, 4]} cornerRadius={4} listening={false} />}
      </Group>
    );
  };

  return (
    <div className={'fed' + (full ? ' fed--full' : '')}>
      <div className="fed-palette">
        <button className={'fed-tool' + (tool === 'select' ? ' on' : '')} style={{ width: '100%', marginBottom: 12 }} onClick={() => { setTool('select'); setNumSeq([]); setLineA(null); }}><Icon name="crosshair" size={15} /> Select / Move</button>
        {GROUPS.map((g) => (
          <div className="fed-group" key={g.title}>
            <div className="fed-group__t">{g.title}</div>
            <div className="fed-syms">
              {g.items.map((s) => (
                <button key={s.type} className={'fed-sym' + (tool === s.type ? ' on' : '')} title={s.label} onClick={() => { setTool(s.type); setSelIds([]); setNumSeq([]); setLineA(null); }}>
                  <span className="fed-sym__i">{s.sym}</span><span className="fed-sym__l">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="fed-stagewrap" ref={wrapRef}>
        <div className="fed-toolbar">
          <button className="btn btn--ghost btn--sm" onClick={undo} disabled={!past.current.length}><Icon name="arrowLeft" size={14} /> Undo</button>
          <button className="btn btn--ghost btn--sm" onClick={() => { setItems(sampleItems()); seq.current = 1; }}><Icon name="image" size={14} /> Sample</button>
          <button className="btn btn--ghost btn--sm is-danger" onClick={() => commit([])}><Icon name="trash" size={14} /> Clear</button>
          <span className="fed-numctl"><span>Desk #</span><input className="input fed-num-prefix" value={prefix} onChange={(e) => setPrefix(e.target.value)} title="Desk number prefix" /><input className="input fed-num-start" type="number" min={0} value={numStart} onChange={(e) => setNumStart(Math.max(0, +e.target.value || 0))} title="Start number" /><button className="btn btn--ghost btn--sm" onClick={renumber} title="Renumber every desk in reading order, from the Start #">Renumber all</button><button className={'btn btn--sm ' + (tool === 'number' ? 'btn--primary' : 'btn--ghost')} title="Highlight the desks you want to number, then Apply — they fill consecutively from the Start #" onClick={() => { setTool((t) => (t === 'number' ? 'select' : 'number')); setSelIds([]); setNumSeq([]); setLineA(null); setNote(''); }}><Icon name="seat" size={13} /> Number desks</button></span>
          <span className="fed-numctl"><span>Canvas</span><button className="btn btn--ghost btn--icon" title="Grow surface" onClick={() => setBoard((b) => ({ w: b.w + 400, h: b.h + 300 }))}><Icon name="plus" size={14} /></button><button className="btn btn--ghost btn--icon" title="Shrink surface" onClick={() => setBoard((b) => ({ w: Math.max(1200, b.w - 400), h: Math.max(800, b.h - 300) }))}><Icon name="zoomOut" size={14} /></button></span>
          <label className="fed-check"><input type="checkbox" checked={snapOn} onChange={(e) => setSnapOn(e.target.checked)} /> Snap</label>
          <span className="spacer" />
          <span className="fed-active">{hint}</span>
          <button className="btn btn--ghost btn--icon" title="Zoom in" onClick={() => setScale((s) => Math.min(3, s * 1.15))}><Icon name="zoomIn" size={15} /></button>
          <button className="btn btn--ghost btn--icon" title="Zoom out" onClick={() => setScale((s) => Math.max(0.15, s / 1.15))}><Icon name="zoomOut" size={15} /></button>
          <button className="btn btn--ghost btn--icon" title="Reset view" onClick={fit}><Icon name="crosshair" size={15} /></button>
          <button className="btn btn--ghost btn--sm" onClick={() => setFull((f) => !f)}><Icon name={full ? 'zoomOut' : 'zoomIn'} size={14} /> {full ? 'Exit full' : 'Full screen'}</button>
        </div>

        <Stage
          ref={stageRef} width={size.w} height={size.h - 46} scaleX={scale} scaleY={scale} x={pos.x} y={pos.y}
          onWheel={onWheel} onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp}
          onMouseLeave={() => { pan.current = null; }} onContextMenu={(e) => e.evt.preventDefault()}
          style={{ background: '#e9eef5', cursor: tool === 'select' ? 'default' : tool === 'number' ? 'pointer' : 'crosshair' }}
        >
          <Layer>
            <Rect name="bg" x={0} y={0} width={board.w} height={board.h} fill="#fbfcfe" cornerRadius={10} shadowColor="#0b2545" shadowBlur={24} shadowOpacity={0.10} />
            {scale > 0.35 && Array.from({ length: Math.floor(board.w / 100) + 1 }, (_, i) => i * 100).map((x) => <Line key={`gx${x}`} points={[x, 0, x, board.h]} stroke="#e8edf4" strokeWidth={1} listening={false} />)}
            {scale > 0.35 && Array.from({ length: Math.floor(board.h / 100) + 1 }, (_, i) => i * 100).map((y) => <Line key={`gy${y}`} points={[0, y, board.w, y]} stroke="#e8edf4" strokeWidth={1} listening={false} />)}

            {items.filter((i) => i.type === 'bay').map(renderItem)}
            {items.filter((i) => i.type !== 'bay').map(renderItem)}

            {/* on-canvas resize handles for the selected item (drag to size — no number inputs) */}
            {tool === 'select' && sel && sel.rot === 0 && HANDLES.map((hd) => {
              const hx = sel.x + hd.cx * sel.w, hy = sel.y + hd.cy * sel.h;
              return (
                <Rect
                  key={hd.k} x={hx - 5} y={hy - 5} width={10} height={10} fill="#ffffff" stroke="#064281" strokeWidth={1.5} cornerRadius={2}
                  draggable onDragStart={beginEdit}
                  onMouseEnter={(e) => setCur(e, hd.cur)} onMouseLeave={(e) => setCur(e, 'default')}
                  onDragMove={(e) => {
                    const nx = snap(e.target.x() + 5, snapOn), ny = snap(e.target.y() + 5, snapOn);
                    setItems((prev) => { const s = prev.find((i) => i.id === selected); if (!s) return prev;
                      let L = s.x, T = s.y, R = s.x + s.w, B = s.y + s.h;
                      if (hd.k.includes('w')) L = nx; if (hd.k.includes('e')) R = nx; if (hd.k.includes('n')) T = ny; if (hd.k.includes('s')) B = ny;
                      const x = Math.min(L, R), y = Math.min(T, B), w = Math.max(20, Math.abs(R - L)), h = Math.max(20, Math.abs(B - T));
                      return prev.map((i) => i.id === selected ? { ...i, x, y, w, h } : i); });
                  }}
                />
              );
            })}

            {/* drag handle at the board's bottom-right to grow / shrink the white surface */}
            <Group x={board.w - 22} y={board.h - 22} draggable
              onMouseEnter={(e) => setCur(e, 'nwse-resize')} onMouseLeave={(e) => setCur(e, 'default')}
              onDragMove={(e) => { const n = e.target; setBoard({ w: Math.max(1200, Math.min(8000, snap(n.x() + 22, snapOn))), h: Math.max(800, Math.min(6000, snap(n.y() + 22, snapOn))) }); }}
              onDragEnd={(e) => { e.target.position({ x: board.w - 22, y: board.h - 22 }); }}>
              <Rect width={18} height={18} fill="#064281" cornerRadius={4} />
              <Line points={[5, 13, 13, 5]} stroke="#fff" strokeWidth={1.5} /><Line points={[9, 13, 13, 9]} stroke="#fff" strokeWidth={1.5} />
            </Group>

            {draftBox && <><Rect x={draftBox.x} y={draftBox.y} width={draftBox.w} height={draftBox.h} fill="#06428118" stroke="#064281" strokeWidth={1.5} dash={[6, 4]} listening={false} />{draftCols > 0 && <Text x={draftBox.x + 4} y={draftBox.y + 4} text={`≈ ${draftCols} desks`} fontSize={13} fontStyle="700" fill="#064281" listening={false} />}</>}

            {/* marquee box-select (Select tool, drag on empty surface) */}
            {marq && (() => { const bx = Math.min(marq.x1, marq.x2), by = Math.min(marq.y1, marq.y2), bw = Math.abs(marq.x2 - marq.x1), bh = Math.abs(marq.y2 - marq.y1); return <Rect x={bx} y={by} width={bw} height={bh} fill="#06428111" stroke="#064281" strokeWidth={1} dash={[4, 3]} listening={false} />; })()}
          </Layer>
        </Stage>
      </div>

      <div className="fed-props">
        {tool === 'number' ? (
          <>
            <div className="section-title" style={{ margin: '0 0 8px' }}>Number desks</div>
            <div className="seg" style={{ marginBottom: 10 }}>
              <button className={numMode === 'pick' ? 'active' : ''} onClick={() => { setNumMode('pick'); setLineA(null); }}>Highlight</button>
              <button className={numMode === 'line' ? 'active' : ''} onClick={() => { setNumMode('line'); setLineA(null); }}>Start → End</button>
            </div>
            {numMode === 'pick' ? (
              <p className="sub-hint" style={{ marginTop: 0 }}>Click desks <b>one by one in order</b>, or drag a box to grab a whole row. Each shows the number it will get; click a highlighted desk again to remove it.</p>
            ) : (
              <p className="sub-hint" style={{ marginTop: 0 }}>Click the <b>START</b> desk, then the <b>END</b> desk of a row or column — every desk between them is added automatically{lineA ? '. Start point set ✓ — click the end desk.' : '.'} Repeat for more rows, then Apply.</p>
            )}
            <label className="fed-field"><span>Start number</span><input className="input" type="number" min={0} value={numStart} onChange={(e) => setNumStart(Math.max(0, +e.target.value || 0))} /></label>
            {numSeq.length > 0 ? (
              <div className="sub-hint" style={{ margin: '4px 0 10px', padding: '8px 10px', background: '#eef3fa', borderRadius: 8, color: '#064281', lineHeight: 1.5 }}>
                <b>{numSeq.length}</b> desks highlighted → will fill <b>{prefix} {pad(numStart)}</b> … <b>{prefix} {pad(numStart + numSeq.length - 1)}</b>
              </div>
            ) : (
              <p className="sub-hint" style={{ margin: '4px 0 10px' }}>No desks highlighted yet — click desks on the plan in the order you want them numbered.</p>
            )}
            <div className="fed-actions">
              <button className="btn btn--primary btn--sm" disabled={!numSeq.length} onClick={applyNumbering}><Icon name="check" size={14} /> Apply numbering</button>
              <button className="btn btn--ghost btn--sm" disabled={!numSeq.length} onClick={() => setNumSeq((s) => s.slice(0, -1))}>Remove last</button>
              <button className="btn btn--ghost btn--sm" disabled={!numSeq.length} onClick={() => setNumSeq([])}>Clear</button>
            </div>
            {note && <p className="sub-hint" style={{ marginTop: 10, color: '#064281' }}><b>{note}</b></p>}
            <button className="btn btn--ghost btn--sm" style={{ marginTop: 12 }} onClick={() => { setTool('select'); setNumSeq([]); setLineA(null); }}>Done</button>
          </>
        ) : selIds.length > 1 ? (
          <>
            <div className="section-title" style={{ margin: '0 0 8px' }}>{selIds.length} items selected</div>
            <p className="sub-hint" style={{ marginTop: 0 }}><b>{selDeskCount}</b> desk{selDeskCount === 1 ? '' : 's'} in selection · drag any one on the plan to move them all together.</p>
            {selDeskCount > 0 && (
              <div className="fed-field"><span>Renumber these {selDeskCount} desks from {prefix} {pad(numStart)}</span>
                <button className="btn btn--primary btn--sm" onClick={renumberSelection}><Icon name="check" size={14} /> Renumber selected</button>
              </div>
            )}
            {note && <p className="sub-hint" style={{ color: '#064281' }}><b>{note}</b></p>}
            <div className="fed-actions" style={{ marginTop: 10 }}>
              <button className="btn btn--ghost btn--sm" onClick={() => { const s = new Set(selIds); commit(items.map((i) => s.has(i.id) ? { ...i, rot: (i.rot + 90) % 360 } : i)); }}><Icon name="zoomIn" size={14} /> Rotate all</button>
              <button className="btn btn--ghost btn--sm" onClick={() => setSelIds([])}>Clear</button>
              <button className="btn btn--ghost btn--sm is-danger" onClick={() => { const s = new Set(selIds); commit(items.filter((i) => !s.has(i.id))); setSelIds([]); }}><Icon name="trash" size={14} /> Delete all</button>
            </div>
            <p className="sub-hint" style={{ marginTop: 12 }}>Click empty space to clear · <b>Delete</b> removes all.</p>
          </>
        ) : sel ? (
          <>
            <div className="section-title" style={{ margin: '0 0 10px' }}>{GROUPS.flatMap((g) => g.items).find((s) => s.type === sel.type)?.label ?? sel.type}</div>
            <label className="fed-field"><span>{sel.type === 'bay' ? 'Bay / area name' : 'Label'}</span><input className="input" value={sel.label ?? ''} onChange={(e) => patch({ label: e.target.value })} /></label>
            {CAP_TYPES.has(sel.type) && <label className="fed-field"><span>Capacity (pax)</span><input className="input" type="number" min={1} value={sel.cap ?? 1} onChange={(e) => patch({ cap: Math.max(1, +e.target.value) })} /></label>}
            {sel.type === 'bay' && (
              <div className="fed-field"><span>Colour</span>
                <div className="fed-swatches">
                  {BAY_COLORS.map((c) => <button key={c} className="fed-swatch" style={{ background: c, outline: (sel.color ?? '').toLowerCase() === c ? '2px solid #1b2a41' : 'none' }} onClick={() => patch({ color: c })} />)}
                  <input type="color" className="fed-color" value={sel.color ?? '#064281'} onChange={(e) => patch({ color: e.target.value })} title="Custom colour" />
                </div>
              </div>
            )}
            <p className="sub-hint" style={{ margin: '2px 0 12px' }}><Icon name="crosshair" size={13} /> Drag the blue handles on the plan to resize.</p>
            <div className="fed-actions">
              <button className="btn btn--ghost btn--sm" onClick={() => patch({ rot: (sel.rot + 90) % 360 })}><Icon name="zoomIn" size={14} /> Rotate 90°</button>
              <button className="btn btn--ghost btn--sm" onClick={() => commit([...items, { ...sel, id: newId(), x: sel.x + 20, y: sel.y + 20 }])}><Icon name="plus" size={14} /> Duplicate</button>
              <button className="btn btn--ghost btn--sm is-danger" onClick={() => { commit(items.filter((i) => i.id !== sel.id)); setSelIds([]); }}><Icon name="trash" size={14} /> Delete</button>
            </div>
            <p className="sub-hint" style={{ marginTop: 12 }}><b>R</b> rotate · <b>Delete</b> remove · <b>Ctrl+Z</b> undo</p>
          </>
        ) : (
          <>
            <div className="section-title" style={{ margin: '0 0 8px' }}>How to draw</div>
            <ol className="fed-help">
              <li><b>Desk grid (bulk):</b> drag a rectangle → fills with auto-numbered desks.</li>
              <li><b>Box-select:</b> in Select mode, drag a rectangle over empty space (like Paint) to grab many desks — then drag any one to move them all together.</li>
              <li><b>Number desks:</b> click <b>Number desks</b>, set the Start #, then either <b>Highlight</b> desks (click/box) or use <b>Start → End</b> (click two desks, auto-fills the row between) — then Apply.</li>
              <li><b>Bay / Area:</b> drag a rectangle → a named, colour-coded zone (name &amp; colour on the right).</li>
              <li><b>Resize:</b> select any item → drag the <b>blue handles</b> on the plan. Drag the corner grip of the white board to enlarge the canvas.</li>
              <li><b>Right-mouse drag</b> = pan · wheel = zoom · <b>Full screen</b> for big floors.</li>
            </ol>
            {note && <p className="sub-hint" style={{ marginTop: 8, color: '#064281' }}><b>{note}</b></p>}
            <p className="sub-hint" style={{ marginTop: 10 }}>{items.length} items · <b>{deskCount}</b> desks.</p>
          </>
        )}
      </div>
    </div>
  );
}
