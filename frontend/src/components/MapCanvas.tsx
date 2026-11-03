import { useEffect, useRef, useState } from 'react';
import { Application, Assets, Container, Graphics, Sprite, Text, type Texture } from 'pixi.js';
import { MAP_HEIGHT, MAP_WIDTH, TERRITORIES, territoryAt, type MapMode, type Point2D, type Territory } from '../map/territories';

export type CameraCommand = 'reset' | 'zoom-in' | 'zoom-out' | 'focus';
export type CameraEvent = { sequence: number; command: CameraCommand; target?: Point2D };
export type MapContextRequest = { clientX: number; clientY: number; worldPoint: Point2D; territory: Territory | null };
type Props = {
  selectedId: string | null;
  mapMode: MapMode;
  cameraEvent: CameraEvent;
  marker: Point2D | null;
  onContextRequest: (request: MapContextRequest) => void;
  onSelect: (territory: Territory | null) => void;
  onHover: (territory: Territory | null) => void;
  onZoomChange: (zoom: number) => void;
};
type Scene = {
  app: Application;
  world: Container;
  overlays: Graphics[];
  markerGraphic: Graphics;
  resourceBadges: Container[];
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
    scene.resourceBadges[index].visible = mode === 'resources' || territory.id === selectedId || territory.id === scene.hoveredId;
    const selected = territory.id === selectedId;
    const hovered = territory.id === scene.hoveredId;
    const overview = mode !== 'natural';
    const fill = mode === 'resources'
      ? ({ 'Lương thực': 0x9cb36b, 'Gỗ': 0x658c67, 'Đá': 0xa8a298, 'Khoáng sản': 0x8d86a6, 'Vàng': 0xc69d52 } as const)[territory.resource]
      : COLORS[territory.faction];
    const graphic = scene.overlays[index];
    graphic.clear().poly(territory.polygon, true)
      .fill({ color: fill, alpha: selected ? 0.22 : hovered ? 0.17 : overview ? 0.14 : 0.002 });
    if (selected || hovered || overview || mode === 'natural') {
      graphic.poly(territory.polygon, true).stroke({
        color: selected ? 0xf9d891 : hovered ? 0xffebbc : 0xf0ddb0,
        alpha: selected ? 1 : hovered ? 0.94 : overview ? 0.58 : 0.18,
        width: selected ? 3 : hovered ? 2.3 : overview ? 1.2 : 0.8,
      });
    }
  });
}

/** Hand-illustrated woodcut art, on cartographic faction seals rather than UI cards. */
function addRegionSymbol(world: Container, territory: Territory, texture: Texture, resourceTexture: Texture): Container {
  const token = new Container();
  token.position.set(territory.center.x, territory.center.y);
  const west = territory.faction === 'west';
  const side = west ? 0x4c705c : 0x9c4d3c;
  const pale = 0xeed8aa;
  const dark = 0x3d3228;
  const seal = new Graphics();

  // A copper-edged seal, hand-engraved with repeated Dong Son inspired ticks.
  seal.ellipse(0, 22, 48, 16).fill({color: 0x262c24, alpha: .24});
  seal.poly([{x:-48,y:-26},{x:-35,y:-54},{x:0,y:-63},{x:35,y:-54},{x:48,y:-26},{x:43,y:20},{x:0,y:49},{x:-43,y:20}],true)
    .fill({color: dark, alpha:.96}).stroke({color:0xe4bd7c,width:3});
  seal.poly([{x:-41,y:-24},{x:-30,y:-47},{x:0,y:-55},{x:30,y:-47},{x:41,y:-24},{x:36,y:16},{x:0,y:40},{x:-36,y:16}],true)
    .fill({color: pale}).stroke({color:0x997349,width:1.8});
  seal.circle(0,-7,35).fill({color:0xd9be91}).stroke({color:side,width:3.5});
  seal.circle(0,-7,30).stroke({color:0x73533e,width:1.4,alpha:.8});
  for (let angle = 0; angle < Math.PI*2; angle+=Math.PI/8) {
    const x=Math.cos(angle),y=Math.sin(angle);
    seal.moveTo(x*31,y*31-7).lineTo(x*34,y*34-7)
      .stroke({color:side,width:1.6,alpha:.72});
  }
  // Territorial pennant speaks ownership at a glance, without altering the icon.
  seal.moveTo(38,-31).lineTo(67,-43).lineTo(65,-12).lineTo(38,-18).closePath()
    .fill({color:side}).stroke({color:dark,width:2});
  seal.moveTo(42,-26).lineTo(62,-36).stroke({color:0xf2d7a9,width:1.8});
  seal.circle(0,-58,3).fill({color:0xdabb78});
  token.addChild(seal);

  const art = new Sprite(texture);
  art.anchor.set(.5);
  art.position.set(0,-9);
  art.width = territory.kind === 'Kinh đô' ? 73 : 77;
  art.height = territory.kind === 'Kinh đô' ? 73 : 77;
  token.addChild(art);

  const label = new Text({text:territory.name.toUpperCase(),style:{
    fontFamily:'Georgia, serif',fontSize:13.8,fontWeight:'bold',letterSpacing:1.35,
    fill:0xf7e5bd,stroke:{color:0x1c2920,width:2}
  }});
  label.anchor.set(.5);
  label.position.set(0,69);
  const labelBg = new Graphics();
  const labelWidth = label.width + 32;
  labelBg.moveTo(-labelWidth/2+7,50).lineTo(labelWidth/2-7,50)
    .lineTo(labelWidth/2,65).lineTo(labelWidth/2-7,84)
    .lineTo(-labelWidth/2+7,84).lineTo(-labelWidth/2,65).closePath()
    .fill({color:0x25362c,alpha:.95})
    .stroke({color:0xb59460,width:1.8});
  for(const x of [-labelWidth/2+11,labelWidth/2-11]) {
    labelBg.circle(x,67,2).fill({color:0xe5bb79});
  }
  token.addChild(labelBg,label);

  // Economy icon is a separate semantic marker, shown only when relevant.
  const resourceBadge = new Container();
  resourceBadge.position.set(46,35);
  const round = new Graphics();
  round.circle(0,0,19).fill({color:0xead6aa,alpha:.98}).stroke({color:0x514331,width:2.4});
  round.circle(0,0,15).stroke({color:0xb79254,width:1.2});
  const resourceIcon = new Sprite(resourceTexture);
  resourceIcon.anchor.set(.5);
  resourceIcon.width=32;
  resourceIcon.height=32;
  resourceBadge.addChild(round,resourceIcon);
  token.addChild(resourceBadge);
  world.addChild(token);
  return resourceBadge;
}

function repaintMarker(scene: Scene, point: Point2D | null) {
  const graphic = scene.markerGraphic;
  graphic.clear();
  if (!point) return;
  const {x,y} = point;
  graphic.circle(x,y,18).fill({color:0xf1dfb1,alpha:.26}).stroke({color:0x9f4c39,width:2.6});
  graphic.circle(x,y,3.4).fill({color:0x9f4c39});
  graphic.moveTo(x,y-4).lineTo(x,y-38).stroke({color:0x3e3b2e,width:2.8});
  graphic.poly([{x,y:y-36},{x:x+24,y:y-30},{x,y:y-22}],true)
    .fill({color:0xa9503d}).stroke({color:0xe9d2a3,width:1});
}

/** Phase 2: symbol-led 2D province map, pan, zoom, right-click quick orders. */
export function MapCanvas({ selectedId, mapMode, cameraEvent, marker, onContextRequest, onSelect, onHover, onZoomChange }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<Scene | null>(null);
  const propsRef = useRef({ selectedId, mapMode, onContextRequest, onSelect, onHover, onZoomChange });
  const [error, setError] = useState<string | null>(null);
  propsRef.current = { selectedId, mapMode, onContextRequest, onSelect, onHover, onZoomChange };

  useEffect(() => {
    const scene = sceneRef.current;
    if (scene) repaint(scene, mapMode, selectedId);
  }, [mapMode, selectedId]);

  useEffect(() => {
    if (sceneRef.current) repaintMarker(sceneRef.current, marker);
  }, [marker]);

  useEffect(() => {
    if (cameraEvent.sequence === 0) return;
    const scene = sceneRef.current;
    if (!scene) return;
    if (cameraEvent.command === 'reset') {
      scene.zoom = 1;
      scene.world.scale.set(scene.fit);
      confine(scene);
    } else if (cameraEvent.command === 'focus' && cameraEvent.target) {
      scene.zoom = Math.max(scene.zoom, 1.65);
      const scale = scene.fit * scene.zoom;
      scene.world.scale.set(scale);
      scene.world.position.set(scene.viewWidth/2 - cameraEvent.target.x*scale,
        scene.viewHeight/2 - cameraEvent.target.y*scale);
      confine(scene);
    } else if (cameraEvent.command === 'zoom-in' || cameraEvent.command === 'zoom-out') {
      zoomAt(scene, cameraEvent.command === 'zoom-in' ? 1.35 : 1/1.35,
        scene.viewWidth/2, scene.viewHeight/2);
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
      const textures = await Promise.all([
        Assets.load('/assets/son-ha-world.svg'),
        Assets.load('/assets/woodcuts/capital.svg'),
        Assets.load('/assets/woodcuts/province.svg'),
        Assets.load('/assets/woodcuts/food.svg'),
        Assets.load('/assets/woodcuts/timber.svg'),
        Assets.load('/assets/woodcuts/ore.svg'),
        Assets.load('/assets/woodcuts/stone.svg'),
        Assets.load('/assets/woodcuts/gold.svg'),
      ]) as Texture[];
      if (cancelled) return;
      const [texture, capitalTexture, provinceTexture, foodTexture, timberTexture, oreTexture, stoneTexture, goldTexture] = textures;
      const world = new Container();
      const background = new Sprite(texture);
      background.width = MAP_WIDTH;
      background.height = MAP_HEIGHT;
      world.addChild(background);
      const overlays = TERRITORIES.map(() => {
        const graphic = new Graphics();
        world.addChild(graphic);
        return graphic;
      });
      const resourceTextures: Record<Territory['resource'], Texture> = {
        'Lương thực': foodTexture, 'Gỗ': timberTexture, 'Đá': stoneTexture,
        'Khoáng sản': oreTexture, 'Vàng': goldTexture,
      };
      const resourceBadges = TERRITORIES.map(territory =>
        addRegionSymbol(world, territory,
          territory.kind === 'Kinh đô' ? capitalTexture : provinceTexture,
          resourceTextures[territory.resource])
      );
      const markerGraphic = new Graphics();
      world.addChild(markerGraphic);
      next.stage.addChild(world);
      const scene: Scene = {
        app: next, world, overlays, markerGraphic, resourceBadges,
        viewWidth: host.clientWidth, viewHeight: host.clientHeight,
        fit: 1, zoom: 1, hoveredId: null,
      };
      sceneRef.current = scene;
      repaint(scene, propsRef.current.mapMode, propsRef.current.selectedId);
      repaintMarker(scene, marker);

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

      const position = (event: MouseEvent | PointerEvent | WheelEvent) => {
        const rect = next.canvas.getBoundingClientRect();
        return { x: (event.clientX - rect.left) * scene.viewWidth / rect.width, y: (event.clientY - rect.top) * scene.viewHeight / rect.height };
      };
      const hit = (x: number, y: number) => territoryAt({ x: (x - world.x) / world.scale.x, y: (y - world.y) / world.scale.y });
      let drag: { id: number; x: number; y: number; originX: number; originY: number; moved: boolean } | null = null;
      const down = (e: PointerEvent) => {
        if (e.button !== 0 || drag) return;
        const p = position(e);
        drag = { id: e.pointerId, x: p.x, y: p.y, originX: p.x, originY: p.y, moved: false };
        next.canvas.setPointerCapture(e.pointerId);
      };
      const move = (e: PointerEvent) => {
        const p = position(e);
        if (drag && drag.id === e.pointerId) {
          const dx = p.x - drag.x; const dy = p.y - drag.y;
          if (Math.hypot(p.x - drag.originX, p.y - drag.originY) > 5) drag.moved = true;
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
      const contextMenu = (e: MouseEvent) => {
        e.preventDefault();
        const p = position(e);
        const worldPoint = { x: (p.x - world.x) / world.scale.x, y: (p.y - world.y) / world.scale.y };
        propsRef.current.onContextRequest({
          clientX: e.clientX, clientY: e.clientY, worldPoint,
          territory: territoryAt(worldPoint),
        });
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
      next.canvas.setAttribute('aria-label', 'Sa bàn 2D: kéo, zoom, chọn vùng bằng chuột trái và mở quân lệnh nhanh bằng chuột phải');
      next.canvas.addEventListener('pointerdown', down);
      next.canvas.addEventListener('pointermove', move);
      next.canvas.addEventListener('pointerup', up);
      next.canvas.addEventListener('pointercancel', up);
      next.canvas.addEventListener('pointerleave', exit);
      next.canvas.addEventListener('wheel', wheel, { passive: false });
      next.canvas.addEventListener('contextmenu', contextMenu);
      next.canvas.addEventListener('keydown', keydown);
      cleanup.push(() => {
        next.canvas.removeEventListener('pointerdown', down);
        next.canvas.removeEventListener('pointermove', move);
        next.canvas.removeEventListener('pointerup', up);
        next.canvas.removeEventListener('pointercancel', up);
        next.canvas.removeEventListener('pointerleave', exit);
        next.canvas.removeEventListener('wheel', wheel);
        next.canvas.removeEventListener('contextmenu', contextMenu);
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
