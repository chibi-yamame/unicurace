import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFilled, slidePath, canMove, isCleared } from '../src/core/rules.js';

const grid = [
    [0, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
];

test('createFilled: ブロックとスタート位置が埋まった状態になる', () => {
    const filled = createFilled(grid, [0, 0]);
    assert.equal(filled[0][0], true);
    assert.equal(filled[1][1], true);
    assert.equal(filled[0][1], false);
});

test('slidePath: 盤外・ブロック・塗り済みマスの手前で止まる', () => {
    const filled = createFilled(grid, [0, 0]);
    assert.deepEqual(slidePath(filled, 0, 0, 1, 0), [[1, 0], [2, 0], [3, 0]]); // 盤外
    assert.deepEqual(slidePath(filled, 1, 3, 0, -1), [[1, 2]]);                // ブロック
    filled[2][0] = true;
    assert.deepEqual(slidePath(filled, 0, 0, 0, 1), [[0, 1]]);                 // 塗り済み
    assert.deepEqual(slidePath(filled, 0, 0, -1, 0), []);                      // 動けない
});

test('slidePath: limit でマス数を打ち切る', () => {
    const filled = createFilled(grid, [0, 0]);
    assert.deepEqual(slidePath(filled, 0, 0, 1, 0, 2), [[1, 0], [2, 0]]);
});

test('canMove / isCleared', () => {
    const filled = [
        [true, true],
        [true, false],
    ];
    assert.equal(canMove(filled, 0, 1), true);
    assert.equal(canMove(filled, 0, 0), false);
    assert.equal(isCleared(filled), false);
    filled[1][1] = true;
    assert.equal(isCleared(filled), true);
});
