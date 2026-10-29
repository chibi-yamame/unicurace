import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findSolutionPath } from '../src/core/solver.js';
import { generateStages, replayMoves } from './helpers.js';

test('生成されたステージの解を見つけ、その手順で実際にクリアできる', () => {
    for (let seed = 0; seed < 300; seed++) {
        for (const stage of generateStages(seed, 7, 6)) {
            const moves = findSolutionPath(7, stage.grid, stage.startPos);
            assert.ok(moves, `seed=${seed}`);
            assert.ok(replayMoves(stage.grid, stage.startPos, moves.map(m => [m.dx, m.dy])), `seed=${seed}`);
        }
    }
});

test('解のない盤面では null を返す', () => {
    // 中央の 1 行だけが空き。左右どちらに滑っても反対側を塗りに戻れない
    const grid = [
        [1, 1, 1],
        [0, 0, 0],
        [1, 1, 1],
    ];
    assert.equal(findSolutionPath(3, grid, [1, 1]), null);
});

test('全マス塗り済み（空きがスタートのみ）なら空の手順を返す', () => {
    const grid = [
        [1, 1],
        [1, 0],
    ];
    assert.deepEqual(findSolutionPath(2, grid, [1, 1]), []);
});
