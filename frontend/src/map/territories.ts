/** Original 2D world: one editable polygon geometry source shared by art and PixiJS. */
import map from './six-provinces.json' with { type: 'json' };
export const MAP_WIDTH = map.width;
export const MAP_HEIGHT = map.height;
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
const point = (p: number[]): Point2D => ({ x: p[0], y: p[1] });
export const COASTLINE = map.coast.map(point);
export const TERRITORIES: Territory[] = map.regions.map((r) => ({
  id: r.id, name: r.name,
  faction: r.faction as Faction,
  kind: r.kind as Territory['kind'],
  resource: r.resource as Territory['resource'],
  center: point(r.center),
  polygon: r.polygon.map(point),
}));
export function getTerritory(id: string | null): Territory | null {
  return TERRITORIES.find((t) => t.id === id) ?? null;
}
export function pointInTerritory(p: Point2D, polygon: readonly Point2D[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j];
    if ((a.y > p.y) !== (b.y > p.y) &&
       p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}
export function territoryAt(point: Point2D): Territory | null {
  return TERRITORIES.find((t) => pointInTerritory(point,t.polygon)) ?? null;
}
