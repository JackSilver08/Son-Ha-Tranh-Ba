# Phase 2 — Custom six-province map

- Rendered from a newly authored SVG, not the user's original PNG.
- 1200×720 world: 6 polygon territories (3 West / 3 East; capital in each central province).
- Geography includes decorative sea, coastline, central mountain chain with two passes, villages, rice fields and opposing capitals.
- Map metadata and hit-testing geometry: `frontend/src/map/six-provinces.json`.
- Render: PixiJS 8; camera pan / zoom, hover / selection, political and resource overlays.
- Placeholder map-only metadata: no server-authoritative ownership, income, unit movement, pathfinding or combat yet.
- Test `cd frontend && npm run test:map` then build `npm run build`. Full Docker smoke test is still required on developer machine.
