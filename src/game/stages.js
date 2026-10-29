import { SeededRandom } from '../utils/random.js';
import { generateStageViaSimulationWithRetry } from '../core/generator.js';

/**
 * シードからステージを 1 つずつ生成する。同じシード・設定からは常に同じステージ列になる。
 */
export function* stageIterator(seed, config) {
    const rng = new SeededRandom(seed);
    for (let i = 0; i < config.stageTotal; i++) {
        // クリア可能性は生成アルゴリズムが保証する（docs/algorithm-poc3.md）
        yield generateStageViaSimulationWithRetry(
            rng, config.gridSize, config.moveRangeMax, config.blockRatioMin, config.blockRatioMax);
    }
}

export function generateStages(seed, config) {
    return [...stageIterator(seed, config)];
}
