import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Stopwatch } from '../src/game/timer.js';

test('Stopwatch: 開始からの経過時間を返し、stop で固定される', () => {
    const sw = new Stopwatch();
    assert.equal(sw.elapsed(100), 0);
    sw.start(1000);
    assert.equal(sw.isRunning, true);
    assert.equal(sw.elapsed(1500), 500);
    sw.stop(2000);
    assert.equal(sw.isRunning, false);
    assert.equal(sw.elapsed(9999), 1000);
    sw.stop(3000); // 停止済みなら変わらない
    assert.equal(sw.elapsed(9999), 1000);
    sw.start(5000);
    assert.equal(sw.elapsed(5100), 100);
});
