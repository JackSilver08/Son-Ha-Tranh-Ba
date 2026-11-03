import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { MAP_HEIGHT, MAP_WIDTH, COASTLINE, TERRITORIES, pointInTerritory, territoryAt } from '../src/map/territories.ts';
const key = p => `${p.x},${p.y}`;
const edge = (a,b) => [key(a),key(b)].sort().join(' -> ');
function signedArea(p) { return p.reduce((sum,a,i) => { const b=p[(i+1)%p.length]; return sum+a.x*b.y-b.x*a.y; },0)/2; }
test('6 unique territories, 3 per kingdom and 2 capitals', () => {
  assert.equal(TERRITORIES.length,6);
  assert.equal(new Set(TERRITORIES.map(t=>t.id)).size,6);
  assert.equal(TERRITORIES.filter(t=>t.kind==='Kinh đô').length,2);
  for (const faction of ['west','east']) assert.equal(TERRITORIES.filter(t=>t.faction===faction).length,3);
});
test('coordinates and province centers are in bounds', () => {
  for (const t of TERRITORIES) {
    assert.ok(signedArea(t.polygon)>0,t.id);
    for (const p of t.polygon) assert.ok(p.x>=0&&p.x<=MAP_WIDTH&&p.y>=0&&p.y<=MAP_HEIGHT,t.id);
    assert.ok(pointInTerritory(t.center,t.polygon),t.id);
    assert.equal(territoryAt(t.center)?.id,t.id);
  }
});
test('shared edges match, and the island coast is exactly the polygon outer perimeter', () => {
  const counts=new Map();
  for(const t of TERRITORIES) for(let i=0;i<t.polygon.length;i++){
    const e=edge(t.polygon[i],t.polygon[(i+1)%t.polygon.length]);
    counts.set(e,(counts.get(e)||0)+1);
  }
  const interior=[...counts.values()].filter(n=>n===2);
  assert.ok(interior.length>=15);
  assert.ok([...counts.values()].every(n=>n===1||n===2));
  const coast=new Set(COASTLINE.map((p,i)=>edge(p,COASTLINE[(i+1)%COASTLINE.length])));
  const outer=new Set([...counts].filter(([,n])=>n===1).map(([e])=>e));
  assert.deepEqual([...outer].sort(),[...coast].sort());
});
test('sea never selects a province',()=>{
  for(const p of [{x:0,y:0},{x:1199,y:719},{x:30,y:355},{x:1175,y:355},{x:600,y:20},{x:600,y:715}]) assert.equal(territoryAt(p),null);
});
test('standalone original SVG shares 1200x720 world coordinates and embeds no old image',()=>{
  const svg=readFileSync(new URL('../public/assets/son-ha-world.svg',import.meta.url),'utf8');
  assert.match(svg,/viewBox="0 0 1200 720"/);
  assert.match(svg,/id="landClip"/);
  assert.match(svg,/id="tree"/);
  assert.doesNotMatch(svg,/<image\b|map-reference\.png|data:image\/png/);
});
