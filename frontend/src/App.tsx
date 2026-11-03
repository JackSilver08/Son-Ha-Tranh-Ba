import { MapCanvas } from './components/MapCanvas';
import { useFoundation } from './hooks/useFoundation';

type ConnectionStatus = 'connecting' | 'online' | 'offline';

function StatusDot({ status }: { status: ConnectionStatus }) {
  return <span className={`status-dot status-dot--${status}`} aria-hidden="true" />;
}

function StatusItem({ label, status }: { label: string; status: ConnectionStatus }) {
  const name = status === 'online' ? 'Hoạt động' : status === 'offline' ? 'Mất kết nối' : 'Đang kết nối';
  return (
    <div className="service-row">
      <span className="service-name">{label}</span>
      <span className="service-value"><StatusDot status={status} />{name}</span>
    </div>
  );
}

export default function App() {
  const { api, database, realtime, ticks, pong, ping } = useFoundation();

  return (
    <div className="app-shell">
      <header className="masthead">
        <div className="brand-symbol" aria-hidden="true">山</div>
        <div className="brand-lockup">
          <span className="eyebrow">DỰ ÁN CHIẾN THUẬT · WEB 2D</span>
          <h1>Sơn Hà Tranh Bá</h1>
        </div>
        <div className="header-right">
          <span className="version-marker">FOUNDATION / 01</span>
          <span className="header-seal" aria-hidden="true">ẤN</span>
        </div>
      </header>

      <main className="workspace">
        <section className="main-panel" aria-labelledby="map-title">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">SA BÀN THỬ NGHIỆM</span>
              <h2 id="map-title">Giang sơn khởi lập</h2>
            </div>
            <span className="heading-tag"><span className="heading-tag-dot" /> PixiJS Render</span>
          </div>
          <div className="map-frame">
            <MapCanvas />
            <div className="map-corner map-corner--tl" aria-hidden="true" />
            <div className="map-corner map-corner--tr" aria-hidden="true" />
            <div className="map-corner map-corner--bl" aria-hidden="true" />
            <div className="map-corner map-corner--br" aria-hidden="true" />
            <div className="map-label">BẢN ĐỒ GỐC · GIAI ĐOẠN 1</div>
          </div>
          <div className="map-caption">
            <span>Ảnh do bạn thiết kế · Đang hiển thị trực tiếp qua PixiJS</span>
            <span className="mute">Chưa có polygon / hover / quân đội</span>
          </div>
        </section>

        <aside className="sidebar">
          <section className="paper-card intro-card">
            <span className="eyebrow">CHIẾU KHỞI DỰNG</span>
            <h2>Nền móng vương triều</h2>
            <p>Giai đoạn này kiểm tra toàn bộ đường đi từ giao diện đến game server, kết nối realtime và cơ sở dữ liệu.</p>
            <div className="paper-rule" />
            <div className="milestone"><span className="milestone-no">01</span><span>Khởi tạo frontend &amp; backend</span><b>✓</b></div>
            <div className="milestone"><span className="milestone-no">02</span><span>PixiJS hiển thị bản đồ gốc</span><b>✓</b></div>
            <div className="milestone"><span className="milestone-no">03</span><span>API · PostgreSQL · SignalR</span><b className="muted-check">●</b></div>
          </section>

          <section className="paper-card" aria-labelledby="server-status">
            <div className="card-title-row">
              <h2 id="server-status">Trạng thái hệ thống</h2>
              <span className="live-label">LIVE CHECK</span>
            </div>
            <StatusItem label="C# / .NET API" status={api} />
            <StatusItem label="PostgreSQL" status={database} />
            <StatusItem label="SignalR / WebSocket" status={realtime} />
            <div className="tick-panel">
              <div><span className="minor-label">NHỊP HỆ THỐNG THỬ NGHIỆM</span><strong>{ticks.toLocaleString('vi-VN')}</strong></div>
              <span className="small-note">Heartbeat 100ms<br />Chưa phải gameplay loop</span>
            </div>
            <button className="seal-button" type="button" onClick={() => void ping()} disabled={realtime !== 'online'}>
              <span>Gửi tín hiệu tới game server</span><span aria-hidden="true">↗</span>
            </button>
            <p className="ping-result" aria-live="polite">{pong}</p>
          </section>

          <div className="future-note">
            <span className="eyebrow">GIAI ĐOẠN 2</span>
            <p>Map Engine: camera, zoom, địa giới polygon, hover, chọn vùng và di chuyển.</p>
          </div>
        </aside>
      </main>
      <footer className="site-footer"><span>SƠN HÀ TRANH BÁ · KHAI QUỐC</span><span>Phase 1 — Chưa có gameplay</span></footer>
    </div>
  );
}
