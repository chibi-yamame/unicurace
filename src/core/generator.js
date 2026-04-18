/**
 * 塗りつぶしゲーム ステージ生成エンジン
 */

/**
 * 配列内の要素をシャッフル
 */
export function shuffleDirections(directions, rng) {
    for (let i = directions.length - 1; i > 0; i--) {
        const j = Math.floor(rng.next() * (i + 1));
        [directions[i], directions[j]] = [directions[j], directions[i]];
    }
}

/**
 * 壁際の移動制限を取得
 */
export function getWallConstrainedDirections(x, y, N) {
    const allowedDirs = [];
    if (x === 0) { allowedDirs.push([0, -1], [0, 1]); }
    if (x === N - 1) { allowedDirs.push([0, -1], [0, 1]); }
    if (y === 0) { allowedDirs.push([-1, 0], [1, 0]); }
    if (y === N - 1) { allowedDirs.push([-1, 0], [1, 0]); }

    const uniqueDirs = [];
    const seen = new Set();
    for (const dir of allowedDirs) {
        const key = `${dir[0]},${dir[1]}`;
        if (!seen.has(key)) {
            seen.add(key);
            uniqueDirs.push(dir);
        }
    }
    return uniqueDirs.length > 0 ? uniqueDirs : null;
}

/**
 * ステージ生成メインロジック
 */
export function generateStageViaSimulation(rng, N, moveRangeMax) {
    const painted = Array(N).fill().map(() => Array(N).fill(false));
    const blocks = [];
    const log = [];

    let x = Math.floor(rng.next() * N);
    let y = Math.floor(rng.next() * N);

    painted[y][x] = true;
    const startPos = [x, y];
    let turnCount = 0;

    while (true) {
        let directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
        let turnLog = { turn: turnCount, pos: [x, y], directions: [] };

        if (turnCount === 0) {
            const constrainedDirs = getWallConstrainedDirections(x, y, N);
            if (constrainedDirs) {
                directions = constrainedDirs;
                turnLog.wallConstrained = true;
            }
        }
        
        shuffleDirections(directions, rng);
        let moved = false;

        for (const [dx, dy] of directions) {
            let maxDist = 0;
            for (let d = 1; d <= moveRangeMax; d++) {
                const nx = x + dx * d;
                const ny = y + dy * d;
                if (nx < 0 || nx >= N || ny < 0 || ny >= N) break;
                if (painted[ny][nx]) break;
                maxDist = d;
            }

            const dirName = dx === 1 ? '右' : dx === -1 ? '左' : dy === 1 ? '下' : '上';
            turnLog.directions.push({ dir: dirName, maxDist });

            if (maxDist > 0) {
                const choosenDist = Math.floor(rng.next() * moveRangeMax) + 1;
                const actualDist = Math.min(choosenDist, maxDist);
                turnLog.chosen = { dir: dirName, choosenDist, maxDist, actualDist };

                if (choosenDist < maxDist) {
                    const blockX = x + dx * (choosenDist + 1);
                    const blockY = y + dy * (choosenDist + 1);
                    if (blockX >= 0 && blockX < N && blockY >= 0 && blockY < N) {
                        blocks.push([blockX, blockY]);
                        painted[blockY][blockX] = true;
                    }
                    turnLog.blockPlaced = true;
                }

                for (let d = 1; d <= actualDist; d++) {
                    painted[y + dy * d][x + dx * d] = true;
                }

                x += dx * actualDist;
                y += dy * actualDist;
                moved = true;
                turnLog.newPos = [x, y];
                break;
            }
        }

        log.push(turnLog);
        if (!moved) {
            turnLog.terminated = true;
            break;
        }
        turnCount++;
    }

    for (let yy = 0; yy < N; yy++) {
        for (let xx = 0; xx < N; xx++) {
            if (!painted[yy][xx]) blocks.push([xx, yy]);
        }
    }

    const gridArray = Array(N).fill().map(() => Array(N).fill(0));
    for (const [bx, by] of blocks) {
        if (bx >= 0 && bx < N && by >= 0 && by < N) gridArray[by][bx] = 1;
    }

    return { grid: gridArray, painted, blockCount: blocks.length, startPos, log };
}

/**
 * リトライ機能付き生成
 */
export function generateStageViaSimulationWithRetry(rng, N, moveRangeMax, blockRatioMin = 0.2, blockRatioMax = 0.5, maxRetries = 20) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        const stageData = generateStageViaSimulation(rng, N, moveRangeMax);
        const blockRatio = stageData.blockCount / (N * N);
        if (blockRatio >= blockRatioMin && blockRatio <= blockRatioMax) {
            stageData.retryCount = attempt;
            return stageData;
        }
    }
    return generateStageViaSimulation(rng, N, moveRangeMax);
}