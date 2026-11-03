import { useEffect, useRef, useState } from 'react';
import { Application, Assets, Sprite } from 'pixi.js';

/**
 * Phase 1 PixiJS render smoke test using the user's ORIGINAL map art.
 * No province polygons, pathfinding, fog of war, units, or gameplay in this phase.
 */
export function MapCanvas() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let app: Application | null = null;
    let observer: ResizeObserver | null = null;

    const start = async () => {
      const next = new Application();
      await next.init({
        width: Math.max(host.clientWidth, 1),
        height: Math.max(host.clientHeight, 1),
        backgroundColor: 0x15241e,
        antialias: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        autoDensity: true,
      });

      if (disposed) {
        next.destroy(true);
        return;
      }
      app = next;
      host.appendChild(next.canvas);

      const texture = await Assets.load('/assets/map-reference.png');
      if (disposed) return;

      const map = new Sprite(texture);
      next.stage.addChild(map);

      const resize = () => {
        if (disposed) return;
        const width = Math.max(1, host.clientWidth);
        const height = Math.max(1, host.clientHeight);
        next.renderer.resize(width, height);
        const fit = Math.min(width / texture.width, height / texture.height);
        map.scale.set(fit);
        map.position.set(
          Math.round((width - texture.width * fit) / 2),
          Math.round((height - texture.height * fit) / 2),
        );
      };

      observer = new ResizeObserver(resize);
      observer.observe(host);
      resize();
    };

    void start().catch((reason: unknown) => {
      if (!disposed) {
        setError(reason instanceof Error ? reason.message : 'Không thể khởi tạo PixiJS.');
      }
    });

    return () => {
      disposed = true;
      observer?.disconnect();
      app?.destroy(true, { children: true });
    };
  }, []);

  return (
    <div className="map-host" ref={hostRef} aria-label="Bản đồ Sơn Hà Tranh Bá vẽ bằng PixiJS">
      {error && <div className="map-error">Lỗi PixiJS: {error}</div>}
    </div>
  );
}
