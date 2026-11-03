/**
 * Phase 2 PROVISIONAL administrative borders for the 1032x740 reference image.
 * Coordinates are map-local pixels. They are presentation data, NOT authoritative
 * faction ownership, terrain collision, income, or gameplay state.
 */
export const MAP_WIDTH = 1032;
export const MAP_HEIGHT = 740;
export type Faction = 'west' | 'east' | 'neutral';
export type MapMode = 'natural' | 'political' | 'resources';
export type Point2D = { x: number; y: number };
export type Territory = {
  id: string;
  name: string;
  faction: Faction;
  resource: 'Lương thực' | 'Gỗ' | 'Đá' | 'Khoáng sản' | 'Vàng';
  kind: 'Kinh đô' | 'Trấn';
  center: Point2D;
  polygon: Point2D[];
};

// Shared vertices and edge midpoints guarantee adjacent territories meet exactly.
const grid: Point2D[][] = [
  [{ x: 42, y: 35 }, { x: 271, y: 25 }, { x: 516, y: 32 }, { x: 761, y: 27 }, { x: 982, y: 39 }],
  [{ x: 27, y: 239 }, { x: 273, y: 240 }, { x: 516, y: 247 }, { x: 760, y: 238 }, { x: 1002, y: 240 }],
  [{ x: 27, y: 477 }, { x: 276, y: 486 }, { x: 516, y: 478 }, { x: 763, y: 483 }, { x: 1001, y: 477 }],
  [{ x: 49, y: 689 }, { x: 270, y: 702 }, { x: 516, y: 696 }, { x: 762, y: 699 }, { x: 974, y: 690 }],
];
const hMid = (row: number, col: number): Point2D => ({
  x: Math.round((grid[row][col].x + grid[row][col + 1].x) / 2),
  y: Math.round((grid[row][col].y + grid[row][col + 1].y) / 2) + ((row + col) % 2 ? 8 : -8),
});
const vMid = (row: number, col: number): Point2D => ({
  x: Math.round((grid[row][col].x + grid[row + 1][col].x) / 2) + ((row + col) % 2 ? 9 : -9),
  y: Math.round((grid[row][col].y + grid[row + 1][col].y) / 2),
});
const definitions = [
  ['tay-bac', 'Trấn Tây Bắc', 'Gỗ'],
  ['thuong-tay', 'Trấn Thượng Tây', 'Khoáng sản'],
  ['thuong-dong', 'Trấn Thượng Đông', 'Khoáng sản'],
  ['dong-bac', 'Trấn Đông Bắc', 'Gỗ'],
  ['kinh-tay', 'Kinh đô Tây', 'Lương thực'],
  ['trung-tay', 'Trấn Trung Tây', 'Đá'],
  ['trung-dong', 'Trấn Trung Đông', 'Đá'],
  ['kinh-dong', 'Kinh đô Đông', 'Lương thực'],
  ['tay-nam', 'Trấn Tây Nam', 'Vàng'],
  ['ha-tay', 'Trấn Hạ Tây', 'Lương thực'],
  ['ha-dong', 'Trấn Hạ Đông', 'Lương thực'],
  ['dong-nam', 'Trấn Đông Nam', 'Vàng'],
] as const;

export const TERRITORIES: Territory[] = definitions.map(([id, name, resource], i) => {
  const row = Math.floor(i / 4);
  const col = i % 4;
  const nw = grid[row][col];
  const ne = grid[row][col + 1];
  const se = grid[row + 1][col + 1];
  const sw = grid[row + 1][col];
  return {
    id, name, resource,
    faction: col < 2 ? 'west' : 'east',
    kind: id.startsWith('kinh-') ? 'Kinh đô' : 'Trấn',
    center: { x: Math.round((nw.x + ne.x + se.x + sw.x) / 4), y: Math.round((nw.y + ne.y + se.y + sw.y) / 4) },
    polygon: [nw, hMid(row, col), ne, vMid(row, col + 1), se, hMid(row + 1, col), sw, vMid(row, col)],
  };
});

export function getTerritory(id: string | null): Territory | null {
  return TERRITORIES.find((territory) => territory.id === id) ?? null;
}

export function pointInTerritory(point: Point2D, polygon: Point2D[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i];
    const b = polygon[j];
    if ((a.y > point.y) !== (b.y > point.y) &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

export function territoryAt(point: Point2D): Territory | null {
  return TERRITORIES.find((territory) => pointInTerritory(point, territory.polygon)) ?? null;
}
