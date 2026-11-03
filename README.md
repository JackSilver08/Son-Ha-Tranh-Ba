# SƠN HÀ TRANH BÁ — GIAI ĐOẠN 1: GAME FOUNDATION

**Mục tiêu:** bộ khung dự án game chiến thuật web 2D có thể khởi động bằng Docker Compose. Đây là code Phase 1, **chưa phải một trò chơi hoàn chỉnh**.

## Đã có

- Frontend: React 19 + TypeScript + Vite 7 + PixiJS 8.
- Hiển thị bản đồ **gốc do bạn cung cấp** dưới dạng một sprite PixiJS; không sửa hình ảnh, không có hover/phân vùng ở giai đoạn này.
- Backend: C# / .NET 10 (LTS), tách riêng `Game.Core` và `Server`.
- SignalR `Ping` qua WebSocket (tự động fallback transport khi cần), có nút kiểm tra trên giao diện.
- API kiểm tra hệ thống và PostgreSQL: `/api/health`, `/api/health/db`.
- Heartbeat 100ms chỉ dùng chứng minh service hoạt động, **không phải vòng lặp gameplay**.
- PostgreSQL 17, dữ liệu được giữ bằng Docker volume.
- Nginx reverse proxy `/api/*` và `/hubs/*`, tránh CORS với cấu hình Docker.
- Docker Compose và script smoke test (Windows PowerShell / Bash).

## Yêu cầu

- Docker Desktop (Windows + WSL2) hoặc Docker Engine + Docker Compose v2 (Linux).
- Khi chạy **chỉ bằng Docker**, không cần cài .NET SDK hay Node.js trên máy.
- Nếu chạy native để code: .NET SDK 10, Node.js 22.12+ và npm.

## Khởi chạy — một lệnh

Mở terminal tại thư mục chứa `compose.yaml`:

**Windows PowerShell:**

```powershell
Copy-Item .env.example .env
# Có thể sửa mật khẩu và cổng trong .env trước khi chạy.
docker compose up --build -d
```

**Linux/macOS:**

```bash
cp .env.example .env
docker compose up --build -d
```

Mở **http://localhost:8080**. Chờ trạng thái `C# / .NET API`, `PostgreSQL`, `SignalR / WebSocket` đều hiện **Hoạt động**. Bấm **Gửi tín hiệu tới game server** để nhận `Pong`.

> `docker compose up --build` không có `-d` cũng được nếu muốn xem log trực tiếp; quy trình chỉ cần một lệnh sau khi tạo `.env`.

### Kiểm tra tự động

```powershell
.\scripts\smoke-test.ps1
```

hoặc:

```bash
./scripts/smoke-test.sh
```

Script kiểm tra HTTP API, DB và website. Phần hiển thị PixiJS + SignalR được xác nhận bằng giao diện trình duyệt.

### Lệnh hữu ích

```bash
docker compose ps
docker compose logs -f api
docker compose logs -f web
docker compose down
```

**Không** dùng `docker compose down -v` nếu muốn giữ dữ liệu PostgreSQL.

## Cấu trúc source

```text
son-ha-tranh-ba-phase1/
├── compose.yaml
├── .env.example
├── README.md
├── docs/
│   └── ARCHITECTURE.md
├── scripts/
│   ├── smoke-test.ps1
│   └── smoke-test.sh
├── backend/
│   ├── Dockerfile
│   ├── SonHaTranhBa.slnx
│   └── src/
│       ├── SonHaTranhBa.Game.Core/
│       │   ├── SonHaTranhBa.Game.Core.csproj
│       │   └── GameTickCounter.cs
│       └── SonHaTranhBa.Server/
│           ├── SonHaTranhBa.Server.csproj
│           ├── Program.cs
│           ├── Hubs/FoundationHub.cs
│           └── Services/HeartbeatService.cs
└── frontend/
    ├── Dockerfile
    ├── deploy/nginx.conf
    ├── public/assets/map-reference.png
    ├── src/
    │   ├── App.tsx
    │   ├── styles.css
    │   ├── main.tsx
    │   ├── components/MapCanvas.tsx
    │   └── hooks/useFoundation.ts
    ├── package.json
    ├── tsconfig.json
    └── vite.config.ts
```

## Chạy riêng khi lập trình VS Code (tuỳ chọn)

1. Khởi động **chỉ database**: `docker compose up -d db`.
2. Terminal backend:

   ```powershell
   $env:ConnectionStrings__GameDb="Host=localhost;Port=5433;Database=sonhatranhba;Username=sonha;Password=change_this_local_password"
   dotnet run --project backend/src/SonHaTranhBa.Server --urls http://localhost:5050
   ```

   Nếu đổi thông tin trong `.env`, hãy sửa connection string tương ứng.

3. Terminal frontend:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. Mở `http://localhost:5173`. Vite chuyển tiếp `/api/*` và `/hubs/*` đến `http://localhost:5050`.
5. Trước khi chạy riêng, hãy dừng `api` và `web` container nếu đã chạy Compose toàn bộ để tránh chiếm cổng 5050.

## Quy tắc kiến trúc

- **C#** sở hữu gameplay và trạng thái trận đấu; React/PixiJS chỉ hiển thị và gửi lệnh.
- **Không sử dụng Unity/Unreal**. Thư viện PixiJS nằm ở client, ASP.NET Core ở server.
- PostgreSQL chỉ giữ dữ liệu cần lưu lâu dài; không ghi database theo từng khung hình.
- Redis chưa đưa vào vì chưa có matchmaking hoặc cache cần thiết.
- Go **không** được thêm vào bản Phase 1 này vì stack cuối cùng đã chốt sử dụng C#/.NET cho backend. Có thể tích hợp service Go độc lập khi có yêu cầu rõ.

## Chưa có (đúng phạm vi Phase 1)

- Chia polygon theo tiểu bang/trấn, hover/click vùng; camera zoom/pan; pathfinding.
- Hệ thống kinh tế, tài nguyên/giây, lãnh chúa, tự động xây dựng, quân đội, chính trị.
- Matchmaking PvP, đăng nhập, cấp quyền, phòng chống gian lận, logic chiến thắng/cầu hòa.
- Các endpoint `health` và Hub `foundation` đang công khai để phục vụ **phát triển cục bộ**. Không đưa bản này lên internet mà không bổ sung xác thực, HTTPS, hạn chế truy cập và kiểm thử bảo mật.

## Lưu ý kiểm thử

Gói này được tạo trong môi trường không có Docker, .NET SDK hoặc quyền tải npm/NuGet từ internet, do đó **chưa thể thực thi `docker compose up --build` hay build C# / frontend thực tế tại đây**. Cấu trúc và các cấu hình được kiểm tra tĩnh; sau khi chạy trên máy, dùng smoke test ở trên để xác nhận hoạt động và gửi log lỗi nếu phát sinh.
