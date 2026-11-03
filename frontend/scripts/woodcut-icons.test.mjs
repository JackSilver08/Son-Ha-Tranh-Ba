import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const names = ['capital','province','infantry','archer','cavalry','militia','food',
  'timber','ore','stone','gold','lord','terrain','political','map','order',
  'locate','flag','build'];
const root = new URL('../public/assets/woodcuts/', import.meta.url);

test('all 19 authored woodcut symbols exist and are standalone vector SVGs', () => {
  for(const name of names) {
    const file = new URL(name+'.svg', root);
    assert.ok(existsSync(file), name+' exists');
    const svg = readFileSync(file,'utf8');
    assert.match(svg,/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    assert.match(svg,/viewBox="0 0 128 128"/);
    assert.match(svg,/<title>[^<]+<\/title>/);
    assert.match(svg,/<path\b/);
    assert.match(svg,/<\/svg>\s*$/);
    assert.doesNotMatch(svg,/<image\b|<script\b|<foreignObject\b|https?:\/\/[^"]*\.(?:png|jpe?g|webp)/);
  }
});
test('unit silhouettes each have distinct editable SVG path drawings', () => {
  const paths = ['infantry','archer','cavalry','militia'].map(name =>
    readFileSync(new URL(name+'.svg',root),'utf8').match(/<path\b[^>]+/g)?.join('') ?? '');
  assert.equal(new Set(paths).size,4);
});
test('UI icon name registry matches every vector file', () => {
  const tsx = readFileSync(new URL('../src/components/GameGlyph.tsx',import.meta.url),'utf8');
  for(const name of names) assert.match(tsx,new RegExp("'"+name+"'"));
});
