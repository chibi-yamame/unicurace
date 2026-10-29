import { createFilled, slidePath, canMove, isCleared } from '../core/rules.js';

/**
 * ゲームの進行状態
 * - playing:  操作を受け付ける
 * - moving:   移動中（startMove 〜 finishMove の間）
 * - cleared:  ステージクリア後、advance() で次へ進むまでの間
 * - finished: 全ステージ終了
 */
export const PHASE = Object.freeze({
    PLAYING: 'playing',
    MOVING: 'moving',
    CLEARED: 'cleared',
    FINISHED: 'finished',
});

/** finishMove() の結果 */
export const MOVE_RESULT = Object.freeze({
    CONTINUE: 'continue',
    CLEARED: 'cleared',
    DEADLOCK: 'deadlock', // 詰み。ペナルティを加算してステージを最初からやり直した
});

/**
 * シングルプレイ 1 回分の進行（ステージ、塗りつぶし状態、ペナルティ、統計）。DOM に依存しない。
 */
export class GameSession {
    stageIndex = 0;
    phase = PHASE.PLAYING;
    filled = [];
    playerPos = { x: 0, y: 0 };
    pendingMove = null;
    penaltyMs = 0;
    deadlockCount = 0;
    manualResetCount = 0;

    constructor(stages, { penaltyTime }) {
        this.stages = stages;
        this.penaltyTime = penaltyTime;
        this.#loadStage(0);
    }

    get stageTotal() {
        return this.stages.length;
    }

    get stage() {
        return this.stages[this.stageIndex];
    }

    get isLastStage() {
        return this.stageIndex === this.stageTotal - 1;
    }

    /** 塗りの進み具合 { painted, total }（スタート地点を含む。ブロックは数えない） */
    get progress() {
        const { grid } = this.stage;
        let painted = 0, total = 0;
        grid.forEach((row, y) => row.forEach((cell, x) => {
            if (cell === 1) return;
            total++;
            if (this.filled[y][x]) painted++;
        }));
        return { painted, total };
    }

    /**
     * 移動を開始する。動けない・操作を受け付けない状態なら null。
     * 塗りつぶしは finishMove() で確定する（アニメーションの途中経過に依存させない）。
     */
    startMove(dx, dy) {
        if (this.phase !== PHASE.PLAYING) return null;
        const path = slidePath(this.filled, this.playerPos.x, this.playerPos.y, dx, dy);
        if (path.length === 0) return null;
        this.pendingMove = { from: { ...this.playerPos }, path, dx, dy };
        this.phase = PHASE.MOVING;
        return this.pendingMove;
    }

    /** 移動を確定し、クリア・詰みを判定する */
    finishMove() {
        if (this.phase !== PHASE.MOVING) return null;
        const { path } = this.pendingMove;
        for (const [x, y] of path) this.filled[y][x] = true;
        const [endX, endY] = path[path.length - 1];
        this.playerPos = { x: endX, y: endY };
        this.pendingMove = null;

        if (isCleared(this.filled)) {
            this.phase = PHASE.CLEARED;
            return MOVE_RESULT.CLEARED;
        }
        if (!canMove(this.filled, endX, endY)) {
            this.deadlockCount++;
            this.#restartWithPenalty();
            return MOVE_RESULT.DEADLOCK;
        }
        this.phase = PHASE.PLAYING;
        return MOVE_RESULT.CONTINUE;
    }

    /** 手動リセット。受け付けたら true（移動中・クリア後は受け付けない） */
    reset() {
        if (this.phase !== PHASE.PLAYING) return false;
        this.manualResetCount++;
        this.#restartWithPenalty();
        return true;
    }

    /** クリアしたステージから次のステージへ進む */
    advance() {
        if (this.phase !== PHASE.CLEARED) return;
        this.#loadStage(this.stageIndex + 1);
    }

    /** デバッグ用: 状態に関わらず次のステージへ進む */
    skip() {
        if (this.phase === PHASE.FINISHED) return;
        this.#loadStage(this.stageIndex + 1);
    }

    #restartWithPenalty() {
        this.penaltyMs += this.penaltyTime;
        this.#loadStage(this.stageIndex);
    }

    #loadStage(index) {
        this.stageIndex = index;
        this.pendingMove = null;
        if (index >= this.stageTotal) {
            this.phase = PHASE.FINISHED;
            return;
        }
        const { grid, startPos } = this.stage;
        this.filled = createFilled(grid, startPos); // ブロックは塗り済み扱い
        this.playerPos = { x: startPos[0], y: startPos[1] };
        this.phase = PHASE.PLAYING;
    }
}
