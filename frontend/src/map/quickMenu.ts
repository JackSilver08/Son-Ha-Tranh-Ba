/** Pure viewport placement for the in-map right-click quick menu. */
export type MenuPoint = { x: number; y: number };
export type MenuSize = { width: number; height: number };
const EDGE = 8;

export function positionQuickMenu(pointer: MenuPoint, bounds: MenuSize, menu: MenuSize): MenuPoint {
  const availableX = Math.max(EDGE, bounds.width - menu.width - EDGE);
  const availableY = Math.max(EDGE, bounds.height - menu.height - EDGE);
  const safe = (n: number) => Number.isFinite(n) ? n : EDGE;
  return {
    x: Math.max(EDGE, Math.min(safe(pointer.x), availableX)),
    y: Math.max(EDGE, Math.min(safe(pointer.y), availableY)),
  };
}
