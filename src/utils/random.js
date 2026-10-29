/**
 * シード付き乱数生成器 (LCG)
 */
const MODULUS = 233280;

export class SeededRandom {
    constructor(seed) {
        // 負数・小数・非数値でも [0, MODULUS) の整数に正規化する（0 以上の整数シードの乱数列は変わらない）
        const n = Number.isFinite(seed) ? Math.trunc(seed) : 0;
        this.seed = ((n % MODULUS) + MODULUS) % MODULUS;
    }

    next() {
        this.seed = (this.seed * 9301 + 49297) % MODULUS;
        return this.seed / MODULUS;
    }
}
