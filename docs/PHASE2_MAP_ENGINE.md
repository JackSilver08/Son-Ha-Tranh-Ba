# Phase 2 — Custom six-province map

- Rendered from a newly authored SVG, not the user's original PNG.
- 1200×720 world: 6 polygon territories (3 West / 3 East; capital in each central province).
- Geography includes decorative sea, coastline, central mountain chain with two passes, villages, rice fields and opposing capitals.
- Map metadata and hit-testing geometry: `frontend/src/map/six-provinces.json`.
- Render: PixiJS 8; camera pan / zoom, hover / selection, political and resource overlays.
- Placeholder map-only metadata: no server-authoritative ownership, income, unit movement, pathfinding or combat yet.
- Test `cd frontend && npm run test:map` then build `npm run build`. Full Docker smoke test is still required on developer machine.

## Phase 2.1 — Symbol-first strategic HUD and quick orders

- The whole viewport is now the 2D military board; parchment info panels float over the map only when needed.
- The new SVG board is **original vector cartography**, intentionally simplified: woodblock-styled mountain, forest, farmland and ore symbols. The historical reference image is not used as the runtime background.
- Each capital/province has its own vector military crest, drawn in PixiJS and synced with camera pan/zoom. These are independent of the art texture.
- Right-click any location on the PixiJS canvas to open the quick-order parchment at the cursor. Region detection is based on polygon geometry, including after camera transforms.
- Working actions: inspect selected region, focus camera, place/remove one temporary command marker, reset camera, switch terrain/ownership/resource layers.
- Menu is reachable through the on-screen "Quân lệnh nhanh" button too. Dismiss by Escape or clicking outside; keyboard arrow keys/Home/End navigate enabled items.
- Recruiting, construction and army orders are **disabled placeholders** until server-authoritative gameplay is introduced in Phase 3–4.
- Geometry and quick-menu placement smoke tests: `cd frontend && npm run test:map && npm run test:quick-menu`.
- No modifications to ASP.NET Core, SignalR, PostgreSQL, Docker Compose or its volumes. Full frontend build and end-to-end Docker run must be verified locally.
