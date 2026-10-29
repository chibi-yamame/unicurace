import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SeededRandom } from '../src/utils/random.js';

test('同じシードからは同じ乱数列になる', () => {
    const a = new SeededRandom(12345);
    const b = new SeededRandom(12345);
    for (let i = 0; i < 100; i++) assert.equal(a.next(), b.next());
});

test('next() は [0, 1) の値を返す', () => {
    const rng = new SeededRandom(999999);
    for (let i = 0; i < 10000; i++) {
        const v = rng.next();
        assert.ok(v >= 0 && v < 1, `範囲外: ${v}`);
    }
});
