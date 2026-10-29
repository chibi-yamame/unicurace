import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../src/config.js';
import { generateStages } from '../src/game/stages.js';
import { generateStages as generateLikeBefore } from './helpers.js';

test('ゲームの設定で生成したステージが、分割前と同じ呼び出し方の結果と一致する', () => {
    for (const seed of [0, 1, 12345, 999999]) {
        const stages = generateStages(seed, CONFIG);
        assert.equal(stages.length, CONFIG.stageTotal);
        assert.deepEqual(
            stages.map(s => [s.grid, s.startPos]),
            generateLikeBefore(seed, 7, 6).map(s => [s.grid, s.startPos]));
    }
});
