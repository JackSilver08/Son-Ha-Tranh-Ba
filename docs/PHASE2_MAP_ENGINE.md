# Phase 2 — Map Engine

The original 1032×740 map image is unchanged. PixiJS renders 12 **provisional** territorial polygons over it. These are not finalized geographical boundaries.

## Controls

- Drag/touch: pan the map. Wheel: zoom around the cursor, clamped to 100%–400% of the fit scale.
- Buttons (+ / − / ⌂): zoom or reset.
- Focus canvas and use arrows/WASD to pan; +, − and Home to change view.
- Hover: highlight territory and display its name.
- Click/tap: select a territory and show the details panel.
- Layers: terrain / illustrative ownership / resource potential.
- Outside provinces (such as sea): clears selection when clicked.

## Implementation

- `frontend/src/map/territories.ts`: map-local polygon coordinates, shared vertices, metadata and hit tests.
- `frontend/src/components/MapCanvas.tsx`: PixiJS display, camera and pointer events.
- `frontend/src/App.tsx`: React overlays and province details.
- `frontend/src/map/map-phase2.css`: Phase 2 visual styling.

Province data is static and **not server-authoritative** yet. No combat, army movement/pathfinding, real income, lord AI, or multiplayer gameplay is claimed. Mountains remain illustrative; collision and passable-neighbour rules belong to later phases.

## Validation

```bash
cd frontend
node --experimental-strip-types --test scripts/territories.test.mjs
npm install
npm run build
```

The test validates identities, centers, bounds, exact shared edges and water misses. The build needs npm registry access; Docker and .NET were not available in the authoring environment for a full end-to-end smoke test.
