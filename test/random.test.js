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

test('負数・小数・非数値のシードでも [0, 1) の値を返す', () => {
    for (const seed of [-1, -99999, -1e12, 1.5, NaN, Infinity, undefined]) {
        const rng = new SeededRandom(seed);
        for (let i = 0; i < 100; i++) {
            const v = rng.next();
            assert.ok(v >= 0 && v < 1, `seed=${seed}: ${v}`);
        }
    }
});

test('0 以上の整数シードは正規化しても乱数列が変わらない', () => {
    // 正規化前の実装と同じ計算
    for (const seed of [0, 1, 12345, 233280, 999999, 69361654662]) {
        let raw = seed;
        const rng = new SeededRandom(seed);
        for (let i = 0; i < 50; i++) {
            raw = (raw * 9301 + 49297) % 233280;
            assert.equal(rng.next(), raw / 233280, `seed=${seed}`);
        }
    }
});
