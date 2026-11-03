import { useEffect, useRef, useState } from 'react';
import { MapCanvas, type CameraCommand, type CameraEvent, type MapContextRequest } from './components/MapCanvas';
import { MapContextMenu, type QuickAction, type QuickMenuState } from './components/MapContextMenu';
import { useFoundation } from './hooks/useFoundation';
import { GameGlyph, type WoodcutName } from './components/GameGlyph';
import { positionQuickMenu } from './map/quickMenu';
import { TERRITORIES, type MapMode, type Point2D, type Territory } from './map/territories';
import './map/map-phase2.css';
import './map/quick-menu.css';
import './map/symbolic-ui.css';
import './map/woodcut-ui.css';

const modeOptions: { id: MapMode; icon: WoodcutName; title: string }[] = [
  { id: 'natural', icon: 'terrain', title: 'Địa hình' },
  { id: 'political', icon: 'political', title: 'Chủ quyền' },
  { id: 'resources', icon: 'food', title: 'Tài nguyên' },
];
const factions = { west: 'Tây quốc', east: 'Đông quốc', neutral: 'Trung lập' };

export default function App() {
  const foundation = useFoundation();
  const [selected, setSelected] = useState<Territory | null>(null);
  const [hovered, setHovered] = useState<Territory | null>(null);
  const [mapMode, setMapMode] = useState<MapMode>('natural');
  const [cameraEvent, setCameraEvent] = useState<CameraEvent>({ sequence: 0, command: 'reset' });
  const [zoom, setZoom] = useState(1);
  const [marker, setMarker] = useState<Point2D | null>(null);
  const [menu, setMenu] = useState<QuickMenuState | null>(null);
  const [showProvinces, setShowProvinces] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  const camera = (command: CameraCommand, target?: Point2D) =>
    setCameraEvent(previous => ({ sequence: previous.sequence + 1, command, target }));

  const openQuickMenu = (request: MapContextRequest) => {
    const rect = mapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const point = positionQuickMenu(
      { x: request.clientX - rect.left, y: request.clientY - rect.top },
      { width: rect.width, height: rect.height },
      { width: 272, height: Math.min(520, Math.max(rect.height - 16, 1)) },
    );
    setSelected(request.territory);
    setHovered(null);
    setShowProvinces(false);
    setShowLegend(false);
    setMenu({ ...point, territory: request.territory, worldPoint: request.worldPoint });
  };

  const openOrdersFromToolbar = () => {
    const rect = mapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const position = positionQuickMenu(
      { x: rect.width - 285, y: rect.height - 555 },
      { width: rect.width, height: rect.height },
      { width: 272, height: Math.min(520, Math.max(rect.height - 16, 1)) },
    );
    setMenu({ ...position, territory: selected,
      worldPoint: selected?.center ?? { x: 600, y: 360 } });
    setShowProvinces(false);
    setShowLegend(false);
  };

  const onAction = (action: QuickAction) => {
    if (!menu) return;
    switch (action) {
      case 'inspect': setSelected(menu.territory); break;
      case 'focus': if (menu.territory) camera('focus', menu.territory.center); break;
      case 'mark': setMarker(menu.worldPoint); break;
      case 'clear-mark': setMarker(null); break;
      case 'reset': camera('reset'); break;
      case 'natural': case 'political': case 'resources': setMapMode(action); break;
    }
    setMenu(null);
  };

  useEffect(() => {
    if (!menu) return;
    const dismiss = (event: PointerEvent) => {
      if (!(event.target instanceof Element) || !event.target.closest('.map-context-menu')) setMenu(null);
    };
    const keys = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenu(null);
    };
    const resized = () => setMenu(null);
    window.addEventListener('pointerdown', dismiss, true);
    window.addEventListener('keydown', keys, true);
    window.addEventListener('resize', resized);
    return () => {
      window.removeEventListener('pointerdown', dismiss, true);
      window.removeEventListener('keydown', keys, true);
      window.removeEventListener('resize', resized);
    };
  }, [menu]);

  return (
    <div className="app-shell app-shell--game">
      <main className="game-stage" ref={mapRef} aria-label="Sa bàn chiến thuật Sơn Hà Tranh Bá">
        <MapCanvas selectedId={selected?.id ?? null} mapMode={mapMode} cameraEvent={cameraEvent}
          marker={marker} onContextRequest={openQuickMenu}
          onSelect={territory => { setSelected(territory); setMenu(null); setShowProvinces(false); }}
          onHover={setHovered} onZoomChange={setZoom} />
        <div className="game-vignette" aria-hidden="true" />
        <header className="game-hud-top">
          <div className="game-title">
            <span className="game-seal"><GameGlyph name="lord" /></span>
            <div><span className="game-kicker">SA BÀN QUÂN CƠ · 2D</span><h1>Sơn Hà Tranh Bá</h1></div>
          </div>
          <div className="game-phase"><span className="game-phase-dot" /> GIAI ĐOẠN 2 · 6 VÙNG</div>
          <details className="game-server-status">
            <summary title="Kiểm tra kết nối game server"><span className={'game-connection-dot ' + (foundation.api === 'online' ? 'is-online' : '')} /> Hệ thống</summary>
            <div className="game-server-details">
              <p>Game API: <strong>{foundation.api}</strong></p>
              <p>Database: <strong>{foundation.database}</strong></p>
              <p>SignalR: <strong>{foundation.realtime}</strong></p>
              <button type="button" disabled={foundation.realtime !== 'online'} onClick={() => void foundation.ping()}>Thử SignalR</button>
              <small>{foundation.pong}</small>
            </div>
          </details>
        </header>

        <div className="map-hover-label" aria-live="off">
          <GameGlyph name="map" className="map-hover-flourish" />
          {hovered && !menu ? <><strong>{hovered.name}</strong><span>{factions[hovered.faction]} · {hovered.resource}</span></>
            : <><strong>Bản đồ quân cơ</strong><span>Nhấp trái chọn vùng · Nhấp phải mở quân lệnh</span></>}
        </div>

        <div className="game-side-tools" role="group" aria-label="Điều khiển bản đồ">
          <button type="button" onClick={() => camera('zoom-in')} aria-label="Phóng to" title="Phóng to">＋</button>
          <button type="button" onClick={() => camera('zoom-out')} aria-label="Thu nhỏ" title="Thu nhỏ">−</button>
          <button type="button" onClick={() => camera('reset')} aria-label="Về toàn bản đồ" title="Về toàn bản đồ"><GameGlyph name="locate" /></button>
          <span className="game-zoom" aria-live="off">{Math.round(zoom * 100)}%</span>
        </div>

        <div className="map-compass" aria-hidden="true"><span>BẮC</span><GameGlyph name="locate" /></div>

        <button type="button" className={'game-legend-toggle' + (showLegend ? ' is-open' : '')}
          onClick={() => { setShowLegend(v => !v); setShowProvinces(false); setMenu(null); }}
          aria-expanded={showLegend} aria-controls="game-symbol-legend">
          <GameGlyph name="infantry" />
          <span>Chú giải quân cơ</span>
        </button>

        <div className="game-hud-bottom">
          <button className={'game-province-toggle' + (showProvinces ? ' is-current' : '')} type="button"
            onClick={() => { setShowProvinces(current => !current); setShowLegend(false); setMenu(null); }} aria-expanded={showProvinces}>
            <span className="hud-glyph"><GameGlyph name="map" /></span>
            <span>Địa chí <small>6 trấn phủ</small></span>
          </button>
          <nav className="game-mode-tabs" aria-label="Các lớp bản đồ">
            {modeOptions.map(option => (
              <button type="button" key={option.id} aria-pressed={mapMode === option.id}
                className={'game-mode-tab' + (mapMode === option.id ? ' is-current' : '')}
                onClick={() => { setMapMode(option.id); setMenu(null); }}>
                <span className="hud-glyph"><GameGlyph name={option.icon} /></span><span>{option.title}</span>
              </button>
            ))}
          </nav>
          <button type="button" className="game-cmd-hint" onClick={openOrdersFromToolbar}
            aria-label="Mở menu quân lệnh nhanh"><span>CHUỘT PHẢI / LỆNH</span><strong>Quân lệnh nhanh</strong></button>
        </div>

        {showLegend && (
          <aside className="game-symbol-legend" id="game-symbol-legend" aria-label="Chú giải ký hiệu của game">
            <div className="game-drawer-heading">
              <span>QUÂN CƠ · MỘC BẢN</span>
              <button type="button" onClick={() => setShowLegend(false)} aria-label="Đóng chú giải">×</button>
            </div>
            <p>Chữ nghĩa tối thiểu, đọc thế trận bằng hình. Những binh chủng dưới đây là ký hiệu chuẩn bị cho Phase 3–4.</p>
            <h3>BINH CHỦNG</h3>
            <div className="game-symbol-grid">
              {([
                ['infantry', 'Bộ binh'], ['archer', 'Cung thủ'],
                ['cavalry', 'Kỵ sĩ'], ['militia', 'Dân quân'],
              ] as const).map(([icon, title]) => (
                <div className="game-legend-cell" key={icon}><GameGlyph name={icon} /><span>{title}</span></div>
              ))}
            </div>
            <h3>TÀI NGUYÊN</h3>
            <div className="game-symbol-grid">
              {([
                ['food', 'Lương thực'], ['timber', 'Gỗ'],
                ['ore', 'Khoáng sản'], ['stone', 'Đá'], ['gold', 'Vàng'],
              ] as const).map(([icon, title]) => (
                <div className="game-legend-cell" key={icon}><GameGlyph name={icon} /><span>{title}</span></div>
              ))}
            </div>
            <h3>HÀNH CHÍNH</h3>
            <div className="game-symbol-grid">
              {([
                ['capital', 'Kinh đô'], ['province', 'Trấn'],
                ['lord', 'Lãnh chúa'], ['flag', 'Quân kỳ'],
              ] as const).map(([icon, title]) => (
                <div className="game-legend-cell" key={icon}><GameGlyph name={icon} /><span>{title}</span></div>
              ))}
            </div>
          </aside>
        )}
        {showProvinces && (
          <aside className="game-province-list" aria-label="Danh sách trấn phủ">
            <div className="game-drawer-heading"><span>ĐỊA CHÍ LỤC TRẤN</span><button onClick={() => setShowProvinces(false)} type="button" aria-label="Đóng danh sách">×</button></div>
            {TERRITORIES.map(territory =>
              <button type="button" key={territory.id} className={'game-province-entry' + (selected?.id === territory.id ? ' is-selected' : '')}
                onClick={() => { setSelected(territory); setShowProvinces(false); camera('focus', territory.center); }}>
                <span className={'province-emblem province-emblem--' + territory.faction}><GameGlyph name={territory.kind === 'Kinh đô' ? 'capital' : 'province'} /></span>
                <span><strong>{territory.name}</strong><small>{territory.kind} · {territory.resource}</small></span>
              </button>
            )}
          </aside>
        )}

        {selected && (
          <aside className="game-province-detail" aria-label={'Địa chí ' + selected.name}>
            <div className="game-detail-title">
              <span className="game-detail-kicker">TRẤN PHỦ · ĐỊA CHÍ</span>
              <button type="button" aria-label="Đóng địa chí" onClick={() => setSelected(null)}>×</button>
            </div>
            <div className="game-detail-herald">
              <span className={'province-emblem province-emblem--' + selected.faction}><GameGlyph name={selected.kind === 'Kinh đô' ? 'capital' : 'province'} /></span>
              <div><h2>{selected.name}</h2><span>{factions[selected.faction]}</span></div>
            </div>
            <div className="game-province-fields">
              <div><span className="game-stat-label"><GameGlyph name="province" /> Loại vùng</span><strong>{selected.kind}</strong></div>
              <div><span className="game-stat-label"><GameGlyph name={selected.resource === 'Gỗ' ? 'timber' : selected.resource === 'Lương thực' ? 'food' : selected.resource === 'Đá' ? 'stone' : selected.resource === 'Vàng' ? 'gold' : 'ore'} /> Tài nguyên</span><strong>{selected.resource}</strong></div>
              <div><span className="game-stat-label"><GameGlyph name="lord" /> Lãnh chúa</span><strong>Chưa triển khai</strong></div>
              <div><span className="game-stat-label"><GameGlyph name="infantry" /> Quân đồn trú</span><strong>Chưa triển khai</strong></div>
            </div>
            <p>Chủ quyền và tài nguyên đang là dữ liệu mẫu. Kinh tế, quân đội, lãnh chúa sẽ kết nối C# ở các giai đoạn tiếp theo.</p>
            <button type="button" className="game-locate" onClick={() => camera('focus', selected.center)}><GameGlyph name="locate" /> Định vị vùng</button>
          </aside>
        )}

        {menu && (
          <MapContextMenu menu={menu} mode={mapMode} hasMarker={marker !== null}
            onAction={onAction} onClose={() => setMenu(null)} />
        )}
        <div className="game-map-caption" aria-hidden="true">BẢN ĐỒ THỬ NGHIỆM · CHƯA CÓ GAMEPLAY</div>
      </main>
    </div>
  );
}
