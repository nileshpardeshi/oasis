// OASIS — hand-authored "sample" office floor design used by the floor-plan canvas.
// Coordinates are in plan-pixels on a 1600 × 1080 slab. The renderer draws this furniture
// (walls, meeting rooms with round/rect tables, reception, cafeteria, waiting & sit-out
// lounges, phone booths, plants, IN/OUT entry) and fills the `workAreas` with the real desks.

export interface DRect { x: number; y: number; w: number; h: number }
export interface DRoom extends DRect { name: string; table: 'round' | 'rect' | 'none'; cap?: number; tone: 'meeting' | 'board' | 'training' | 'focus' }
export interface DSofa extends DRect { back: 'top' | 'bottom' | 'left' | 'right' }
export interface DCircleTable { x: number; y: number; r: number; chairs: number }
export interface DBooth extends DRect { label?: string }
export interface DPlant { x: number; y: number; r: number }
export interface DDoor { x: number; y: number; dir: 'in' | 'out' }
export interface DLabel { x: number; y: number; text: string; size?: number; color?: string }
export interface DWorkArea extends DRect { id: string; name: string; color: string }

export interface FloorDesign {
  width: number; height: number;
  walls: DRect[];
  rooms: DRoom[];
  reception: DRect;
  sofas: DSofa[];
  lowTables: DRect[];
  counters: DRect[];
  cafeTables: DCircleTable[];
  booths: DBooth[];
  plants: DPlant[];
  doors: DDoor[];
  labels: DLabel[];
  workAreas: DWorkArea[];
}

const W = 1600, H = 1080, T = 10; // slab + wall thickness

export const SAMPLE_FLOOR: FloorDesign = {
  width: W, height: H,
  walls: [
    // exterior shell
    { x: 0, y: 0, w: W, h: T }, { x: 0, y: H - T, w: W, h: T },
    { x: 0, y: 0, w: T, h: H }, { x: W - T, y: 0, w: T, h: H },
    // partitions framing the cafeteria (top-left)
    { x: 340, y: 0, w: 8, h: 372 }, { x: 0, y: 364, w: 348, h: 8 },
    // partition under the top meeting-room band
    { x: 348, y: 232, w: 712, h: 8 },
    // left partition closing focus rooms
    { x: 248, y: 420, w: 8, h: 210 },
  ],
  rooms: [
    // top band — distributed, not a single line: training + board + two meeting
    { x: 380, y: 40, w: 300, h: 188, name: 'Symphony', table: 'rect', cap: 40, tone: 'training' },
    { x: 720, y: 40, w: 280, h: 188, name: 'Magnum', table: 'round', cap: 20, tone: 'board' },
    { x: 1040, y: 40, w: 210, h: 150, name: 'Jazz', table: 'round', cap: 6, tone: 'meeting' },
    { x: 1290, y: 40, w: 250, h: 150, name: 'Rock', table: 'rect', cap: 8, tone: 'meeting' },
    // right edge
    { x: 1340, y: 238, w: 200, h: 196, name: 'Opera', table: 'round', cap: 16, tone: 'board' },
    // bottom-right corner
    { x: 1300, y: 858, w: 240, h: 182, name: 'Blues', table: 'round', cap: 8, tone: 'meeting' },
    { x: 1040, y: 882, w: 230, h: 158, name: 'Chant', table: 'rect', cap: 10, tone: 'meeting' },
    // left focus rooms
    { x: 40, y: 422, w: 200, h: 92, name: 'Focus 1', table: 'round', cap: 2, tone: 'focus' },
    { x: 40, y: 528, w: 200, h: 92, name: 'Focus 2', table: 'round', cap: 2, tone: 'focus' },
  ],
  reception: { x: 632, y: 958, w: 336, h: 60 },
  sofas: [
    // waiting (bottom-left)
    { x: 60, y: 902, w: 140, h: 46, back: 'top' },
    { x: 60, y: 988, w: 140, h: 46, back: 'bottom' },
    { x: 214, y: 902, w: 46, h: 132, back: 'right' },
    // sit-out / breakout lounge (bottom-centre-left)
    { x: 392, y: 904, w: 130, h: 44, back: 'top' },
    { x: 392, y: 986, w: 130, h: 44, back: 'bottom' },
  ],
  lowTables: [
    { x: 104, y: 956, w: 56, h: 32 }, // waiting coffee table
    { x: 420, y: 952, w: 60, h: 30 }, // breakout table
  ],
  counters: [
    { x: 60, y: 60, w: 268, h: 30 }, // cafeteria service counter
  ],
  cafeTables: [
    { x: 132, y: 188, r: 34, chairs: 4 }, { x: 268, y: 188, r: 34, chairs: 4 },
    { x: 132, y: 300, r: 34, chairs: 4 }, { x: 268, y: 300, r: 34, chairs: 4 },
  ],
  booths: [
    { x: 1500, y: 506, w: 64, h: 46, label: 'Booth' },
    { x: 1500, y: 562, w: 64, h: 46, label: 'Booth' },
    { x: 1500, y: 618, w: 64, h: 46, label: 'Booth' },
  ],
  plants: [
    { x: 364, y: 256, r: 13 }, { x: 1024, y: 252, r: 13 }, { x: 1320, y: 470, r: 13 },
    { x: 366, y: 858, r: 13 }, { x: 612, y: 884, r: 12 }, { x: 30, y: 660, r: 12 },
    { x: 30, y: 840, r: 12 }, { x: 1018, y: 470, r: 12 },
  ],
  doors: [
    { x: 742, y: H - T, dir: 'in' },
    { x: 858, y: H - T, dir: 'out' },
  ],
  labels: [
    { x: 64, y: 44, text: 'Cafeteria', size: 13 },
    { x: 64, y: 878, text: 'Waiting', size: 12 },
    { x: 392, y: 878, text: 'Breakout / Sit-out', size: 12 },
    { x: 1496, y: 484, text: 'Phone booths', size: 10.5 },
    { x: 706, y: 1036, text: 'Main entrance', size: 11, color: '#64748b' },
  ],
  workAreas: [
    { id: 'wa-core', name: 'Core neighbourhood', color: '#064281', x: 360, y: 268, w: 330, h: 566 },
    { id: 'wa-digital', name: 'Digital neighbourhood', color: '#16a34a', x: 712, y: 268, w: 326, h: 566 },
    { id: 'wa-data', name: 'Data & AI', color: '#f7991f', x: 1058, y: 268, w: 268, h: 566 },
  ],
};
