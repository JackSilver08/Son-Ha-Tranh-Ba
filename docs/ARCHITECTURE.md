# Sơn Hà Tranh Bá — Architecture notes (Phase 1)

## Modules

- `frontend/`: React UI, TypeScript, PixiJS canvas. The original user map image is rendered **as a single background sprite** (visual smoke test only).
- `backend/src/SonHaTranhBa.Server/`: ASP.NET Core 10 minimal API, SignalR test hub, database ping, background heartbeat.
- `backend/src/SonHaTranhBa.Game.Core/`: .NET domain assembly; no HTTP, SignalR, PostgreSQL or PixiJS dependencies. Currently only an isolated heartbeat counter.
- `db`: PostgreSQL 17 persistent volume; no game schema in Phase 1.
- `web`: Nginx serves static frontend and reverse proxies `/api/*` and `/hubs/*` to C#.

## Communication

```text
Browser --HTTP GET /--> Nginx --> frontend assets
Browser --HTTP /api/*--> Nginx --> ASP.NET Core API --> PostgreSQL (only /api/health/db)
Browser --SignalR /hubs/foundation--> Nginx --> ASP.NET Core Hub
```

No cross-origin API access is necessary for Docker deployment. Vite proxies both paths to localhost:5050 during frontend-only development.

## Data flow

1. PixiJS loads `/assets/map-reference.png` and draws one immutable sprite.
2. React polls `/api/health`, `/api/health/db`, `/api/simulation/status` every 5 seconds and shows status.
3. The SignalR client connects to `/hubs/foundation`; the button invokes `Ping`, returning server time.
4. A `PeriodicTimer` increments a shared health heartbeat. It DOES NOT process gameplay, and has no relation to the future fixed-timestep authoritative match simulation.

## Security and production gates

- This is a **local-development starter**, not a production-ready publicly exposed game.
- No authentication, authorization, anti-cheat, matchmaking, rate limiting, TLS termination or network access control are implemented yet.
- Docker ports are bound to 127.0.0.1 for local-only access. Change deployment configuration and use HTTPS before serving on a public domain.
- `.env.example` contains a development-only password. Set a strong non-default secret before publishing.
- Do not run a simulation per request, store battle state in PostgreSQL every frame, or expose unauthenticated authoritative actions.
- In later phases: C# authoritative match state in memory, per-match tick loop, validated commands; polygons/territory geometry in map assets, state persisted only as appropriate.

## Go decision

The Phase 1 stack agreed in chat uses C#/.NET for backend and does not require Go. If separate Go infrastructure services are needed later, integrate through a well-defined contract without duplicating ownership of game state.
