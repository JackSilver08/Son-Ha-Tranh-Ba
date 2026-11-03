import assert from 'node:assert/strict';
import test from 'node:test';
import { positionQuickMenu } from '../src/map/quickMenu.ts';

test('keeps menu next to the right-click inside roomy map', () => {
  assert.deepEqual(positionQuickMenu({x: 120, y: 90}, {width: 800,height: 500}, {width: 272,height: 380}), {x:120,y:90});
});
test('clamps the menu away from map edges', () => {
  assert.deepEqual(positionQuickMenu({x:799,y:499}, {width:800,height:500}, {width:272,height:380}), {x:520,y:112});
  assert.deepEqual(positionQuickMenu({x:-4,y:-1}, {width:800,height:500}, {width:272,height:380}), {x:8,y:8});
});
test('stays reachable on narrow maps (scrolling is handled by CSS)', () => {
  assert.deepEqual(positionQuickMenu({x:200,y:200}, {width:240,height:180}, {width:272,height:380}), {x:8,y:8});
});
