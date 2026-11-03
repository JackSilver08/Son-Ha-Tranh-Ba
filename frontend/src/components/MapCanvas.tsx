import { useEffect, useRef, useState } from 'react';
import { Application, Assets, Container, Graphics, Sprite } from 'pixi.js';
import { MAP_HEIGHT, MAP_WIDTH, TERRITORIES, territoryAt, type MapMode, type Territory } from '../map/territories';

export type CameraCommand = 'reset' | 'zoom-in' | 'zoom-out';
export type CameraEvent = { sequence: number; command: CameraCommand };
type Props = {
  selectedId: string | null;
  mapMode: MapMode;
  cameraEvent: CameraEvent;
  onSelect: (territory: Territory | null) => void;
  onHover: (territory: Territory | null) => void;
  onZoomChange: (zoom: number) => void;
};
type Scene = {
  app: Application;
  world: Container;
  overlays: Graphics[];
  viewWidth: number;
  viewHeight: number;
  fit: number;
  zoom: number;
  hoveredId: string | null;
};

const COLORS = { west: 0x648e79, east: 0xb7664f, neutral: 0xb7a271 };
const clamp = (number: number, lo: number, hi: number) => Math.max(lo, Math.min(number, hi));

function confine(scene: Scene) {
  const width = MAP_WIDTH * scene.world.scale.x;
  const height = MAP_HEIGHT * scene.world.scale.y;
  scene.world.x = width <= scene.viewWidth
    ? (scene.viewWidth - width) / 2
    : clamp(scene.world.x, scene.viewWidth - width, 0);
  scene.world.y = height <= scene.viewHeight
    ? (scene.viewHeight - height) / 2
    : clamp(scene.world.y, scene.viewHeight - height, 0);
}

function zoomAt(scene: Scene, factor: number, x: number, y: number) {
  const previous = scene.world.scale.x;
  const next = scene.fit * clamp(scene.zoom * factor, 1, 4);
  const worldX = (x - scene.world.x) / previous;
  const worldY = (y - scene.world.y) / previous;
  scene.zoom = next / scene.fit;
  scene.world.scale.set(next);
  scene.world.position.set(x - worldX * next, y - worldY * next);
  confine(scene);
}

function repaint(scene: Scene, mode: MapMode, selectedId: string | null) {
  TERRITORIES.forEach((territory, index) => {
    const selected = territory.id === selectedId;
    const hovered = territory.id === scene.hoveredId;
    const overview = mode !== 'natural';
    const fill = mode === 'resources'
      ? ({ 'Lương thực': 0x9cb36b, 'Gỗ': 0x658c67, 'Đá': 0xa8a298, 'Khoáng sản': 0x8d86a6, 'Vàng': 0xc69d52 } as const)[territory.resource]
      : COLORS[territory.faction];
    const graphic = scene.overlays[index];
    graphic.clear().poly(territory.polygon, true)
      .fill({ color: fill, alpha: selected ? 0.27 : hovered ? 0.21 : overview ? 0.17 : 0.001 });
    if (selected || hovered || overview) {
      graphic.poly(territory.polygon, true).stroke({
        color: selected ? 0xf9d891 : hovered ? 0xffebbc : 0xf0ddb0,
        alpha: selected ? 1 : hovered ? 0.95 : 0.49,
        width: selected ? 3 : hovered ? 2.2 : 1,
      });
    }
  });
}

/** Phase 2: map-space province polygons, pan, cursor-anchored zoom and selection. */
export function MapCanvas({ selectedId, mapMode, cameraEvent, onSelect, onHover, onZoomChange }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<Scene | null>(null);
  const propsRef = useRef({ selectedId, mapMode, onSelect, onHover, onZoomChange });
  const [error, setError] = useState<string | null>(null);
  propsRef.current = { selectedId, mapMode, onSelect, onHover, onZoomChange };

  useEffect(() => {
    const scene = sceneRef.current;
    if (scene) repaint(scene, mapMode, selectedId);
  }, [mapMode, selectedId]);

  useEffect(() => {
    if (cameraEvent.sequence === 0) return;
    const scene = sceneRef.current;
    if (!scene) return;
    if (cameraEvent.command === 'reset') {
      scene.zoom = 1;
      scene.world.scale.set(scene.fit);
      confine(scene);
    } else {
      zoomAt(scene, cameraEvent.command === 'zoom-in' ? 1.35 : 1 / 1.35, scene.viewWidth / 2, scene.viewHeight / 2);
    }
    propsRef.current.onZoomChange(scene.zoom);
  }, [cameraEvent]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    let app: Application | null = null;
    let observer: ResizeObserver | null = null;
    const cleanup: Array<() => void> = [];

    const start = async () => {
      const next = new Application();
      await next.init({
        width: Math.max(host.clientWidth, 1),
        height: Math.max(host.clientHeight, 1),
        backgroundColor: 0x1c3432,
        antialias: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        autoDensity: true,
      });
      if (cancelled) { next.destroy(true); return; }
      app = next;
      host.appendChild(next.canvas);
      const texture = await Assets.load('/assets/map-reference.png');
      if (cancelled) return;
      const world = new Container();
      world.addChild(new Sprite(texture));
      const overlays = TERRITORIES.map(() => {
        const graphic = new Graphics();
        world.addChild(graphic);
        return graphic;
      });
      next.stage.addChild(world);
      const scene: Scene = {
        app: next, world, overlays,
        viewWidth: host.clientWidth, viewHeight: host.clientHeight,
        fit: 1, zoom: 1, hoveredId: null,
      };
      sceneRef.current = scene;
      repaint(scene, propsRef.current.mapMode, propsRef.current.selectedId);

      const resize = () => {
        const centerX = (scene.viewWidth / 2 - world.x) / world.scale.x;
        const centerY = (scene.viewHeight / 2 - world.y) / world.scale.y;
        const w = Math.max(host.clientWidth, 1);
        const h = Math.max(host.clientHeight, 1);
        scene.viewWidth = w;
        scene.viewHeight = h;
        next.renderer.resize(w, h);
        scene.fit = Math.min(w / MAP_WIDTH, h / MAP_HEIGHT);
        world.scale.set(scene.fit * scene.zoom);
        world.position.set(w / 2 - centerX * world.scale.x, h / 2 - centerY * world.scale.x);
        confine(scene);
      };
      // Initial center should be the middle of the authored image.
      scene.viewWidth = Math.max(host.clientWidth, 1);
      scene.viewHeight = Math.max(host.clientHeight, 1);
      scene.fit = Math.min(scene.viewWidth / MAP_WIDTH, scene.viewHeight / MAP_HEIGHT);
      world.scale.set(scene.fit);
      world.position.set((scene.viewWidth - MAP_WIDTH * scene.fit) / 2, (scene.viewHeight - MAP_HEIGHT * scene.fit) / 2);
      observer = new ResizeObserver(resize);
      observer.observe(host);

      const position = (event: PointerEvent | WheelEvent) => {
        const rect = next.canvas.getBoundingClientRect();
        return { x: (event.clientX - rect.left) * scene.viewWidth / rect.width, y: (event.clientY - rect.top) * scene.viewHeight / rect.height };
      };
      const hit = (x: number, y: number) => territoryAt({ x: (x - world.x) / world.scale.x, y: (y - world.y) / world.scale.y });
      let drag: { id: number; x: number; y: number; moved: boolean } | null = null;
      const down = (e: PointerEvent) => {
        if (e.button !== 0 || drag) return;
        const p = position(e);
        drag = { id: e.pointerId, x: p.x, y: p.y, moved: false };
        next.canvas.setPointerCapture(e.pointerId);
      };
      const move = (e: PointerEvent) => {
        const p = position(e);
        if (drag && drag.id === e.pointerId) {
          const dx = p.x - drag.x; const dy = p.y - drag.y;
          if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
          if (drag.moved) {
            world.x += dx;
            world.y += dy;
            confine(scene);
          }
          drag.x = p.x; drag.y = p.y;
        }
        const territory = drag?.moved ? null : hit(p.x, p.y);
        if (territory?.id !== scene.hoveredId) {
          scene.hoveredId = territory?.id ?? null;
          propsRef.current.onHover(territory);
          repaint(scene, propsRef.current.mapMode, propsRef.current.selectedId);
        }
      };
      const up = (e: PointerEvent) => {
        if (!drag || drag.id !== e.pointerId) return;
        const p = position(e);
        if (!drag.moved) propsRef.current.onSelect(hit(p.x, p.y));
        drag = null;
        if (next.canvas.hasPointerCapture(e.pointerId)) next.canvas.releasePointerCapture(e.pointerId);
      };
      const exit = () => {
        if (scene.hoveredId !== null) {
          scene.hoveredId = null;
          propsRef.current.onHover(null);
          repaint(scene, propsRef.current.mapMode, propsRef.current.selectedId);
        }
      };
      const wheel = (e: WheelEvent) => {
        e.preventDefault();
        const p = position(e);
        zoomAt(scene, Math.exp(-e.deltaY * 0.001), p.x, p.y);
        propsRef.current.onZoomChange(scene.zoom);
      };
      const keydown = (e: KeyboardEvent) => {
        if (document.activeElement !== next.canvas) return;
        const step = 35;
        switch (e.key) {
          case 'ArrowLeft': case 'a': world.x += step; break;
          case 'ArrowRight': case 'd': world.x -= step; break;
          case 'ArrowUp': case 'w': world.y += step; break;
          case 'ArrowDown': case 's': world.y -= step; break;
          case '+': case '=': zoomAt(scene, 1.25, scene.viewWidth / 2, scene.viewHeight / 2); propsRef.current.onZoomChange(scene.zoom); break;
          case '-': zoomAt(scene, 0.8, scene.viewWidth / 2, scene.viewHeight / 2); propsRef.current.onZoomChange(scene.zoom); break;
          case 'Home': scene.zoom = 1; world.scale.set(scene.fit); confine(scene); propsRef.current.onZoomChange(scene.zoom); break;
          default: return;
        }
        confine(scene);
        e.preventDefault();
      };
      next.canvas.tabIndex = 0;
      next.canvas.setAttribute('aria-label', 'Sa bàn 2D: kéo để di chuyển, cuộn để phóng to, bấm để chọn lãnh thổ');
      next.canvas.addEventListener('pointerdown', down);
      next.canvas.addEventListener('pointermove', move);
      next.canvas.addEventListener('pointerup', up);
      next.canvas.addEventListener('pointercancel', up);
      next.canvas.addEventListener('pointerleave', exit);
      next.canvas.addEventListener('wheel', wheel, { passive: false });
      next.canvas.addEventListener('keydown', keydown);
      cleanup.push(() => {
        next.canvas.removeEventListener('pointerdown', down);
        next.canvas.removeEventListener('pointermove', move);
        next.canvas.removeEventListener('pointerup', up);
        next.canvas.removeEventListener('pointercancel', up);
        next.canvas.removeEventListener('pointerleave', exit);
        next.canvas.removeEventListener('wheel', wheel);
        next.canvas.removeEventListener('keydown', keydown);
      });
    };
    void start().catch((reason: unknown) => {
      if (!cancelled) setError(reason instanceof Error ? reason.message : 'Không thể khởi tạo bản đồ PixiJS.');
    });
    return () => {
      cancelled = true;
      observer?.disconnect();
      cleanup.forEach((fn) => fn());
      if (sceneRef.current?.app === app) sceneRef.current = null;
      app?.destroy(true, { children: true });
    };
  }, []);

  return (
    <div className="map-host" ref={hostRef}>
      {error && <div className="map-error" role="alert">Lỗi PixiJS: {error}</div>}
    </div>
  );
}
