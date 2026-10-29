import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameSession, PHASE, MOVE_RESULT } from '../src/game/session.js';

// 右 → 下 でクリアできるステージ
//  S . .
//  # # .
const clearable = { grid: [[0, 0, 0], [1, 1, 0], [1, 1, 1]], startPos: [0, 0] };
// 右に滑ると (2,1) に到達せず詰む: 左端スタート、下段は塗れない
//  . S .
//  # . #
const deadEnd = { grid: [[0, 0, 0], [1, 0, 1], [1, 1, 1]], startPos: [1, 0] };

const create = (...stages) => new GameSession(stages, { penaltyTime: 3000 });

test('移動は finishMove まで塗りを確定しない', () => {
    const s = create(clearable);
    const move = s.startMove(1, 0);
    assert.deepEqual(move.path, [[1, 0], [2, 0]]);
    assert.equal(s.phase, PHASE.MOVING);
    assert.equal(s.filled[0][1], false);
    assert.equal(s.finishMove(), MOVE_RESULT.CONTINUE);
    assert.equal(s.filled[0][1], true);
    assert.deepEqual(s.playerPos, { x: 2, y: 0 });
});

test('動けない方向・移動中の入力は受け付けない', () => {
    const s = create(clearable);
    assert.equal(s.startMove(-1, 0), null);
    s.startMove(1, 0);
    assert.equal(s.startMove(0, 1), null);
    assert.equal(s.reset(), false);
});

test('全マス塗るとクリアし、advance で次のステージへ、最後は finished', () => {
    const s = create(clearable, clearable);
    s.startMove(1, 0); s.finishMove();
    s.startMove(0, 1);
    assert.equal(s.finishMove(), MOVE_RESULT.CLEARED);
    assert.equal(s.phase, PHASE.CLEARED);
    assert.equal(s.reset(), false, 'クリア後のリセットは無視');
    assert.equal(s.startMove(0, -1), null);
    s.advance();
    assert.equal(s.stageIndex, 1);
    assert.equal(s.phase, PHASE.PLAYING);
    assert.equal(s.isLastStage, true);
    s.startMove(1, 0); s.finishMove();
    s.startMove(0, 1); s.finishMove();
    s.advance();
    assert.equal(s.phase, PHASE.FINISHED);
    assert.equal(s.penaltyMs, 0);
});

test('詰むとペナルティを加算してステージの最初に戻る', () => {
    const s = create(deadEnd);
    s.startMove(1, 0);
    assert.equal(s.finishMove(), MOVE_RESULT.DEADLOCK);
    assert.equal(s.deadlockCount, 1);
    assert.equal(s.manualResetCount, 0);
    assert.equal(s.penaltyMs, 3000);
    assert.equal(s.phase, PHASE.PLAYING);
    assert.deepEqual(s.playerPos, { x: 1, y: 0 });
    assert.equal(s.filled[0][2], false);
});

test('手動リセットでペナルティを加算してステージの最初に戻る', () => {
    const s = create(clearable);
    s.startMove(1, 0); s.finishMove();
    assert.equal(s.reset(), true);
    assert.equal(s.manualResetCount, 1);
    assert.equal(s.penaltyMs, 3000);
    assert.deepEqual(s.playerPos, { x: 0, y: 0 });
    assert.equal(s.filled[0][1], false);
});

test('skip は移動中でも次のステージへ進む', () => {
    const s = create(clearable, clearable);
    s.startMove(1, 0);
    s.skip();
    assert.equal(s.stageIndex, 1);
    assert.equal(s.phase, PHASE.PLAYING);
    assert.equal(s.pendingMove, null);
    s.skip();
    assert.equal(s.phase, PHASE.FINISHED);
});
