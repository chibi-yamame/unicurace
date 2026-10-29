import { createHash } from 'node:crypto';
import { SeededRandom } from '../src/utils/random.js';
import { generateStageViaSimulationWithRetry } from '../src/core/generator.js';

/**
 * ゲームと同じ「止まるまで滑る」ルールで手順を再生し、全マスを塗れたかを返す
 * （ルールを独立に再実装し、生成器・ソルバーの検証に使う）
 */
export function replayMoves(grid, startPos, moves) {
    const N = grid.length;
    const filled = grid.map(row => row.map(cell => cell === 1));
    let [x, y] = startPos;
    filled[y][x] = true;
    for (const [dx, dy] of moves) {
        let moved = 0;
        while (x + dx >= 0 && x + dx < N && y + dy >= 0 && y + dy < N && !filled[y + dy][x + dx]) {
            x += dx;
            y += dy;
            filled[y][x] = true;
            moved++;
        }
        if (moved === 0) return false;
    }
    return filled.every(row => row.every(Boolean));
}

/**
 * シードから stageCount 個のステージを生成する（ゲーム本体と同じ呼び出し方）
 */
export function generateStages(seed, N, moveRangeMax, stageCount = 5, ratioMin = 0.15, ratioMax = 0.35) {
    const rng = new SeededRandom(seed);
    return Array.from({ length: stageCount }, () =>
        generateStageViaSimulationWithRetry(rng, N, moveRangeMax, ratioMin, ratioMax));
}

/** 生成ログから手順（方向の配列）を取り出す */
export function movesFromLog(log) {
    const dirs = { '右': [1, 0], '左': [-1, 0], '下': [0, 1], '上': [0, -1] };
    return log.filter(t => t.chosen).map(t => dirs[t.chosen.dir]);
}

export function digest(value) {
    return createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 16);
}
