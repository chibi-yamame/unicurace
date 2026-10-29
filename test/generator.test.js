import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateStages, replayMoves, movesFromLog, digest } from './helpers.js';
import { findSolutionPath } from '../src/core/solver.js';

test('生成時の経路をゲームのルールで再生すると全マス塗れる（クリア可能性の保証）', () => {
    for (let seed = 0; seed < 2000; seed++) {
        for (const stage of generateStages(seed, 7, 6)) {
            assert.ok(replayMoves(stage.grid, stage.startPos, movesFromLog(stage.log)), `seed=${seed}`);
        }
    }
});

test('同じシードからは同じステージ列になる', () => {
    assert.deepEqual(
        generateStages(12345, 7, 6).map(s => [s.grid, s.startPos]),
        generateStages(12345, 7, 6).map(s => [s.grid, s.startPos]));
});

test('ブロック率がほぼ常に範囲内に収まる', () => {
    let outOfRange = 0, total = 0;
    for (let seed = 0; seed < 500; seed++) {
        for (const stage of generateStages(seed, 7, 6)) {
            const ratio = stage.blockCount / 49;
            if (ratio < 0.15 || ratio > 0.35) outOfRange++;
            total++;
        }
    }
    assert.ok(outOfRange / total < 0.01, `範囲外 ${outOfRange}/${total}`);
});

// リファクタリングで生成結果・解法が変わっていないことを確認するための固定値。
// 生成方式を意図的に変更した場合は値を更新する。
test('生成結果と解法が既知の値と一致する', () => {
    const expected = {
        '0,7,6': 'df9063683d5f9cea',
        '1,7,6': '1af17d2b947a02f8',
        '12345,7,6': '487c59fc5424e27f',
        '999999,7,6': '9bdfeae442d65a58',
        '42,6,12': 'b241d606252ab77f',
        '7,10,9': '5e1a555283d18ebc',
    };
    for (const [key, hash] of Object.entries(expected)) {
        const [seed, N, max] = key.split(',').map(Number);
        const stages = generateStages(seed, N, max).map(s => [
            s.grid, s.startPos, s.blockCount,
            findSolutionPath(N, s.grid, s.startPos).map(m => [m.dx, m.dy]),
        ]);
        assert.equal(digest(stages), hash, key);
    }
});

test('moveRangeMax が N - 1 より小さくてもクリア可能なステージになる', () => {
    for (const moveRangeMax of [1, 2, 3]) {
        for (let seed = 0; seed < 300; seed++) {
            for (const stage of generateStages(seed, 7, moveRangeMax)) {
                assert.ok(replayMoves(stage.grid, stage.startPos, movesFromLog(stage.log)), `max=${moveRangeMax} seed=${seed}`);
            }
        }
    }
});
