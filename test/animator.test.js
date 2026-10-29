import { test } from 'node:test';
import assert from 'node:assert/strict';
import { animateMove } from '../src/view/animator.js';

// requestAnimationFrame を差し替え、指定した時刻でフレームを順に呼ぶ
function runFrames(timestamps, run) {
    const queue = [];
    globalThis.requestAnimationFrame = cb => queue.push(cb);
    globalThis.cancelAnimationFrame = () => {};
    run();
    for (const t of timestamps) {
        const cb = queue.shift();
        if (!cb) break;
        cb(t);
    }
}

test('フレーム時刻が呼び出し時刻より前でも、石は出発点より後ろに描かれない', () => {
    const move = { from: { x: 3, y: 0 }, path: [[4, 0], [5, 0], [6, 0]] };
    const frames = [];
    let done = false;
    const now = performance.now();
    // 最初のフレーム時刻が呼び出し時刻より 10ms 前（実ブラウザで起きる）
    runFrames([now - 10, now + 50, now + 1000], () => animateMove(move, {
        secondsPerCell: 0.06,
        onFrame: f => frames.push(f),
        onDone: () => { done = true; },
    }));
    assert.deepEqual(frames[0].pos, { x: 3, y: 0 });
    assert.deepEqual(frames[0].passed, []);
    for (const f of frames) assert.ok(f.pos.x >= 3 && f.pos.x <= 6, `x=${f.pos.x}`);
    assert.deepEqual(frames.at(-1).pos, { x: 6, y: 0 });
    assert.deepEqual(frames.at(-1).passed, move.path);
    assert.equal(done, true);
});

test('中断するとそれ以降のフレームを予約しない', () => {
    const move = { from: { x: 0, y: 0 }, path: [[0, 1], [0, 2]] };
    let scheduled = 0, cancelled = 0;
    globalThis.requestAnimationFrame = () => ++scheduled;
    globalThis.cancelAnimationFrame = () => { cancelled++; };
    const cancel = animateMove(move, { secondsPerCell: 0.06, onFrame: () => {}, onDone: () => {} });
    cancel();
    cancel();
    assert.equal(scheduled, 1);
    assert.equal(cancelled, 1);
});
