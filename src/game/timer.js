/**
 * 経過時間の計測。時刻は呼び出し側から渡す（テストしやすくするため）。
 */
export class Stopwatch {
    #startedAt = null;
    #stoppedAt = null;

    start(now) {
        this.#startedAt = now;
        this.#stoppedAt = null;
    }

    /** 計測を止め、以降の elapsed() を固定する */
    stop(now) {
        if (this.isRunning) this.#stoppedAt = now;
    }

    get isRunning() {
        return this.#startedAt !== null && this.#stoppedAt === null;
    }

    elapsed(now) {
        if (this.#startedAt === null) return 0;
        return (this.#stoppedAt ?? now) - this.#startedAt;
    }
}
