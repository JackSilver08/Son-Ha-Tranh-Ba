import assert from 'node:assert/strict';
import test from 'node:test';
import { MAP_HEIGHT, MAP_WIDTH, TERRITORIES, pointInTerritory, territoryAt } from '../src/map/territories.ts';

test('12 distinct provinces with 2 capital provinces', () => {
  assert.equal(TERRITORIES.length, 12);
  assert.equal(new Set(TERRITORIES.map(t => t.id)).size, 12);
  assert.equal(TERRITORIES.filter(t => t.kind === 'Kinh đô').length, 2);
});

test('province coordinates stay inside the authored 1032x740 map', () => {
  for (const territory of TERRITORIES) {
    assert.equal(territory.polygon.length, 8);
    for (const point of territory.polygon) {
      assert.ok(point.x >= 0 && point.x <= MAP_WIDTH && point.y >= 0 && point.y <= MAP_HEIGHT);
    }
    assert.ok(pointInTerritory(territory.center, territory.polygon), territory.id);
    assert.equal(territoryAt(territory.center)?.id, territory.id);
  }
});

test('shared border segments match exactly between neighbouring territories', () => {
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      const a = TERRITORIES[row * 4 + col].polygon;
      if (col < 3) {
        const b = TERRITORIES[row * 4 + col + 1].polygon;
        assert.deepEqual(a.slice(2, 5), b.slice(6, 8).concat(b[0]).reverse());
      }
      if (row < 2) {
        const b = TERRITORIES[(row + 1) * 4 + col].polygon;
        assert.deepEqual(a.slice(4, 7), b.slice(0, 3).reverse());
      }
    }
  }
});

test('water outside the playable land does not hit a province', () => {
  assert.equal(territoryAt({ x: 0, y: 0 }), null);
  assert.equal(territoryAt({ x: 1031, y: 739 }), null);
});
