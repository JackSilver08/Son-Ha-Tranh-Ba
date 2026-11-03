import { useState } from 'react';
import './map/map-phase2.css';
import { MapCanvas, type CameraCommand, type CameraEvent } from './components/MapCanvas';
import { useFoundation } from './hooks/useFoundation';
import { TERRITORIES, type MapMode, type Territory } from './map/territories';

type ConnectionStatus = 'connecting' | 'online' | 'offline';
const modeLabels: Record<MapMode, string> = { natural: 'Địa hình', political: 'Chủ quyền', resources: 'Tài nguyên' };
const factionLabels = { west: 'Tây quốc', east: 'Đông quốc', neutral: 'Trung lập' };

function StatusItem({ label, status }: { label: string; status: ConnectionStatus }) {
  const text = status === 'online' ? 'Hoạt động' : status === 'offline' ? 'Mất kết nối' : 'Đang kết nối';
  return <div className="service-row"><span className="service-name">{label}</span><span className="service-value"><span className={`status-dot status-dot--${status}`} />{text}</span></div>;
}

export default function App() {
  const foundation = useFoundation();
  const [selected, setSelected] = useState<Territory | null>(null);
  const [hovered, setHovered] = useState<Territory | null>(null);
  const [mapMode, setMapMode] = useState<MapMode>('natural');
  const [cameraEvent, setCameraEvent] = useState<CameraEvent>({ sequence: 0, command: 'reset' });
  const [zoom, setZoom] = useState(1);
  const camera = (command: CameraCommand) => setCameraEvent(previous => ({ sequence: previous.sequence + 1, command }));

  return (
    <div className="app-shell">
      <header className="masthead">
        <div className="brand-symbol" aria-hidden="true">山</div>
        <div className="brand-lockup"><span className="eyebrow">SA BÀN · CHIẾN THUẬT 2D</span><h1>Sơn Hà Tranh Bá</h1></div>
        <div className="header-right"><span className="version-marker">MAP ENGINE / 02</span><span className="header-seal" aria-hidden="true">ẤN</span></div>
      </header>

      <main className="workspace">
        <section className="main-panel" aria-labelledby="map-title">
          <div className="panel-heading">
            <div><span className="eyebrow">ĐỊA GIỚI THỬ NGHIỆM</span><h2 id="map-title">Bản đồ giang sơn</h2></div>
            <span className="heading-tag"><span className="heading-tag-dot" /> 6 vùng · Polygon 2D</span>
          </div>
          <div className="map-toolbar" role="group" aria-label="Lớp bản đồ">
            {(Object.keys(modeLabels) as MapMode[]).map((mode) =>
              <button key={mode} type="button" className={`map-tab ${mapMode === mode ? 'map-tab--active' : ''}`}
                aria-pressed={mapMode === mode} onClick={() => setMapMode(mode)}>{modeLabels[mode]}</button>)}
          </div>
          <div className="map-frame map-frame--interactive">
            <MapCanvas selectedId={selected?.id ?? null} mapMode={mapMode} cameraEvent={cameraEvent}
              onSelect={setSelected} onHover={setHovered} onZoomChange={setZoom} />
            <div className="map-corner map-corner--tl" aria-hidden="true" />
            <div className="map-corner map-corner--tr" aria-hidden="true" />
            <div className="map-corner map-corner--bl" aria-hidden="true" />
            <div className="map-corner map-corner--br" aria-hidden="true" />
            {hovered && <div className="map-tooltip" aria-live="off"><b>{hovered.name}</b><span>{factionLabels[hovered.faction]} · {hovered.resource}</span><small>Nhấp để xem chi tiết</small></div>}
            <div className="camera-controls" role="group" aria-label="Điều khiển camera">
              <button type="button" onClick={() => camera('zoom-in')} aria-label="Phóng to bản đồ" title="Phóng to">+</button>
              <button type="button" onClick={() => camera('zoom-out')} aria-label="Thu nhỏ bản đồ" title="Thu nhỏ">−</button>
              <button type="button" onClick={() => camera('reset')} aria-label="Đặt lại camera" title="Về toàn bản đồ">⌂</button>
              <span>{Math.round(zoom * 100)}%</span>
            </div>
            <div className="map-label">BẢN ĐỒ MỚI · 6 VÙNG</div>
          </div>
          <div className="map-caption">
            <span>Kéo để di chuyển · Cuộn để zoom vào điểm trỏ · Nhấp để chọn vùng</span>
            <span className="mute">Phím mũi tên/WASD, +/−, Home khi focus bản đồ</span>
          </div>
        </section>

        <aside className="sidebar">
          <section className="paper-card province-card" aria-live="polite">
            <span className="eyebrow">ĐỊA CHÍ TRẤN PHỦ</span>
            {selected ? <>
              <div className="province-title"><h2>{selected.name}</h2><span className={`faction-mark faction-mark--${selected.faction}`}>{factionLabels[selected.faction]}</span></div>
              <div className="province-stat"><span>Phân loại</span><strong>{selected.kind}</strong></div>
              <div className="province-stat"><span>Tiềm năng tài nguyên</span><strong>{selected.resource}</strong></div>
              <div className="province-stat"><span>Lãnh chúa</span><strong>Chưa triển khai</strong></div>
              <div className="province-stat"><span>Quân đồn trú</span><strong>Chưa triển khai</strong></div>
              <p className="province-note">Đường biên là dữ liệu bản đồ tĩnh. Chủ quyền và tài nguyên mới là minh họa — các cơ chế thực sẽ được xử lý bằng C# ở Phase 3–5.</p>
              <button type="button" className="outline-button" onClick={() => setSelected(null)}>Bỏ chọn lãnh thổ</button>
            </> : <>
              <h2>Chọn một vùng đất</h2>
              <p>Bản đồ được thiết kế mới gồm hai kinh đô và bốn trấn. Rê chuột vào mỗi vùng để nhìn thấy địa giới; nhấp để xem thông tin.</p>
              <div className="paper-rule" />
              <div className="province-placeholder">6 vùng · 2 kinh đô · 4 trấn</div>
            </>}
          </section>
          <section className="paper-card territories-card">
            <div className="card-title-row"><h2>Danh sách địa giới</h2><span className="live-label">BẢN NHÁP</span></div>
            <div className="territory-list">
              {TERRITORIES.map((territory) => <button key={territory.id} type="button"
                className={`territory-list-item ${selected?.id === territory.id ? 'territory-list-item--active' : ''}`}
                onClick={() => setSelected(territory)}>
                <span className={`territory-dot territory-dot--${territory.faction}`} />{territory.name}
                <small>{territory.kind === 'Kinh đô' ? 'Kinh đô' : territory.resource}</small>
              </button>)}
            </div>
          </section>
          <details className="paper-card diagnostics-card">
            <summary>Kiểm tra hệ thống (Phase 1)</summary>
            <StatusItem label="C# / .NET API" status={foundation.api} />
            <StatusItem label="PostgreSQL" status={foundation.database} />
            <StatusItem label="SignalR" status={foundation.realtime} />
            <div className="tick-panel"><div><span className="minor-label">HEARTBEAT</span><strong>{foundation.ticks.toLocaleString('vi-VN')}</strong></div><span className="small-note">Chưa phải game loop</span></div>
            <button className="seal-button" type="button" onClick={() => void foundation.ping()} disabled={foundation.realtime !== 'online'}>Ping Game Server ↗</button>
            <p className="ping-result">{foundation.pong}</p>
          </details>
        </aside>
      </main>
      <footer className="site-footer"><span>SƠN HÀ TRANH BÁ · BẢN ĐỒ THỬ NGHIỆM</span><span>Phase 2 — Bản đồ 2D mới; chưa có gameplay</span></footer>
    </div>
  );
}
