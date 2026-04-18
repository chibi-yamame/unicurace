/**
 * 塗りつぶしゲーム ステージ生成エンジン
 * シミュレーションベースのステージ自動生成アルゴリズム
 * 
 * 使用方法：
 * const rng = new SeededRandom(12345);
 * const stageData = generateStageViaSimulation(rng, 5, 10);
 * console.log(stageData); // { grid, painted, blockCount, paintedCount, startPos, log }
 */

/**
 * シード付き乱数生成器
 * 線形合同法 (LCG) を使用して確定的な乱数を生成
 * 同じシードから同じ乱数列を生成（再現性を確保）
 */
class SeededRandom {
    constructor(seed) {
        this.seed = seed;
    }

    next() {
        // LCG: X(n+1) = (a * X(n) + c) mod m
        // パラメータ: a=9301, c=49297, m=233280
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280; // [0, 1) の浮動小数点数を返す
    }
}

/**
 * 配列内の要素をシャッフル（Fisher-Yates アルゴリズム）
 * 方向配列をランダムに並べ替える際に使用
 * 
 * @param {Array} directions - シャッフル対象の配列
 * @param {SeededRandom} rng - 乱数生成器
 */
function shuffleDirections(directions, rng) {
    for (let i = directions.length - 1; i > 0; i--) {
        const j = Math.floor(rng.next() * (i + 1));
        [directions[i], directions[j]] = [directions[j], directions[i]];
    }
}

/**
 * スタート位置が壁にくっついているかどうかを判定し、壁に沿って移動できる方向を返す
 * 完全に壁上にある場合のみ制約を適用
 * 
 * 例：
 * - x = 0（左壁） → 上下方向のみ ([[0,-1], [0,1]])
 * - y = 0（上壁） → 左右方向のみ ([[-1,0], [1,0]])
 * - x = 0, y = 0（左上の角） → 両方の方向が許可
 * 
 * @param {number} x - スタート位置のx座標
 * @param {number} y - スタート位置のy座標
 * @param {number} N - グリッドサイズ
 * @returns {Array|null} 許可する方向の配列、または壁上でない場合はnull
 */
function getWallConstrainedDirections(x, y, N) {
    const allowedDirs = [];

    // 左壁上（x = 0） → 上下方向のみ
    if (x === 0) {
        allowedDirs.push([0, -1]); // 上方向
        allowedDirs.push([0, 1]);  // 下方向
    }

    // 右壁上（x = N-1） → 上下方向のみ
    if (x === N - 1) {
        allowedDirs.push([0, -1]); // 上方向
        allowedDirs.push([0, 1]);  // 下方向
    }

    // 上壁上（y = 0） → 左右方向のみ
    if (y === 0) {
        allowedDirs.push([-1, 0]); // 左方向
        allowedDirs.push([1, 0]);  // 右方向
    }

    // 下壁上（y = N-1） → 左右方向のみ
    if (y === N - 1) {
        allowedDirs.push([-1, 0]); // 左方向
        allowedDirs.push([1, 0]);  // 右方向
    }

    // 重複を削除
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
 * シミュレーションベースのステージ生成
 * 
 * アルゴリズム概要：
 * 1. ランダムなスタート位置にストーンを配置
 * 2. ストーンが移動可能な方向をシャッフル
 * 3. 各方向について移動可能な最大距離を計算
 * 4. 移動可能な方向の中からランダムに1つを選択
 * 5. 選択距離と最大距離の関係でブロックを配置
 * 6. ストーンを移動・塗りつぶし
 * 7. 移動不可になるまで繰り返す
 * 
 * @param {SeededRandom} rng - シード付き乱数生成器
 * @param {number} N - グリッドサイズ (N x N)
 * @param {number} moveRangeMax - 移動範囲の上限値
 * @returns {Object} ステージデータ
 *   - grid: ブロック配置 (0=空, 1=ブロック)
 *   - painted: 塗りつぶし情報 (true=塗りつぶし済み)
 *   - blockCount: ブロック総数
 *   - paintedCount: 塗りつぶし総数
 *   - startPos: [x, y] ストーンの初期位置
 *   - log: 生成ログ（デバッグ用）
 */
function generateStageViaSimulation(rng, N, moveRangeMax) {
    const painted = Array(N).fill().map(() => Array(N).fill(false));
    const blocks = [];
    const log = [];

    // シードに基づいてランダムなスタート位置を決定
    let x = Math.floor(rng.next() * N);
    let y = Math.floor(rng.next() * N);

    painted[y][x] = true;
    const startPos = [x, y];

    let turnCount = 0;

    // メインループ：移動可能な限り繰り返す
    while (true) {
        let directions = [[0, 1], [1, 0], [0, -1], [-1, 0]]; // 下, 右, 上, 左
        
        // ★改善：最初のターンが壁際の場合、方向を壁に沿った方向に限定
        let turnLog;
        if (turnCount === 0) {
            const constrainedDirs = getWallConstrainedDirections(x, y, N);
            if (constrainedDirs) {
                directions = constrainedDirs;
                const dirNames = constrainedDirs.map(d => 
                    d[0] === 1 ? '右' : d[0] === -1 ? '左' : d[1] === 1 ? '下' : '上'
                ).join(', ');
                turnLog = { turn: turnCount, pos: [x, y], directions: [], wallConstrained: true, constrainedDirNames: dirNames };
            } else {
                turnLog = { turn: turnCount, pos: [x, y], directions: [] };
            }
        } else {
            turnLog = { turn: turnCount, pos: [x, y], directions: [] };
        }
        
        shuffleDirections(directions, rng);

        let moved = false;

        // 各方向を試行
        for (const [dx, dy] of directions) {
            // 実際に進める最大距離を計算
            let maxDist = 0;
            for (let d = 1; d <= moveRangeMax; d++) {
                const nx = x + dx * d;
                const ny = y + dy * d;

                // 境界チェック
                if (nx < 0 || nx >= N || ny < 0 || ny >= N) break;
                // 既に塗りつぶされたマスをチェック
                if (painted[ny][nx]) break;

                maxDist = d;
            }

            const dirName = dx === 1 ? '右' : dx === -1 ? '左' : dy === 1 ? '下' : '上';
            turnLog.directions.push({ dir: dirName, maxDist });

            // 移動可能な場合
            if (maxDist > 0) {
                // 進む距離をランダム決定 (1 ~ moveRangeMax)
                const choosenDist = Math.floor(rng.next() * moveRangeMax) + 1;
                const actualDist = Math.min(choosenDist, maxDist);

                turnLog.chosen = { dir: dirName, choosenDist, maxDist, actualDist };
                turnLog.blockPlaced = choosenDist < maxDist;

                // ブロック配置：選択距離が最大より小さい場合
                if (choosenDist < maxDist) {
                    const blockX = x + dx * (choosenDist + 1);
                    const blockY = y + dy * (choosenDist + 1);
                    if (blockX >= 0 && blockX < N && blockY >= 0 && blockY < N) {
                        blocks.push([blockX, blockY]);
                        painted[blockY][blockX] = true;
                    }
                }

                // ストーンを移動・塗りつぶし
                for (let d = 1; d <= actualDist; d++) {
                    const nx = x + dx * d;
                    const ny = y + dy * d;
                    painted[ny][nx] = true;
                }

                x += dx * actualDist;
                y += dy * actualDist;
                moved = true;
                turnLog.newPos = [x, y];
                break; // 次のターンへ
            }
        }

        log.push(turnLog);
        if (!moved) {
            turnLog.terminated = true;
            break; // 全方向移動不可 → 終了
        }
        turnCount++;
    }

    // 塗りつぶされていないマスをブロック化
    for (let yy = 0; yy < N; yy++) {
        for (let xx = 0; xx < N; xx++) {
            if (!painted[yy][xx]) {
                blocks.push([xx, yy]);
            }
        }
    }

    // グリッド構築
    const gridArray = Array(N).fill().map(() => Array(N).fill(0));
    for (const [bx, by] of blocks) {
        if (bx >= 0 && bx < N && by >= 0 && by < N) {
            gridArray[by][bx] = 1;
        }
    }

    const paintedCount = painted.flat().filter(p => p).length;
    return { grid: gridArray, painted, blockCount: blocks.length, paintedCount, startPos, log };
}

/**
 * ブロック配置率をチェックしながらステージを生成
 * 指定範囲内のブロック配置率が得られるまで再生成を繰り返す
 * 
 * @param {SeededRandom} rng - シード付き乱数生成器
 * @param {number} N - グリッドサイズ (N x N)
 * @param {number} moveRangeMax - 移動範囲の上限値
 * @param {number} blockRatioMin - ブロック配置率の下限 (0-1)
 * @param {number} blockRatioMax - ブロック配置率の上限 (0-1)
 * @param {number} maxRetries - 最大試行回数（デフォルト10）
 * @returns {Object} ステージデータ + retryCount フィールド
 */
function generateStageViaSimulationWithRetry(rng, N, moveRangeMax, blockRatioMin = 0.2, blockRatioMax = 0.5, maxRetries = 20) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        const stageData = generateStageViaSimulation(rng, N, moveRangeMax);
        const totalCells = N * N;
        const blockRatio = stageData.blockCount / totalCells;

        // ブロック配置率が指定範囲内か確認
        if (blockRatio >= blockRatioMin && blockRatio <= blockRatioMax) {
            stageData.retryCount = attempt;
            return stageData;
        }
    }

    // 最大試行回数に達した場合は最後のステージデータを返す
    const finalStageData = generateStageViaSimulation(rng, N, moveRangeMax);
    finalStageData.retryCount = maxRetries;
    finalStageData.retryExceeded = true;
    return finalStageData;
}

// エクスポート（グローバルスコープに登録）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        SeededRandom, 
        generateStageViaSimulation, 
        generateStageViaSimulationWithRetry,
        shuffleDirections, 
        getWallConstrainedDirections 
    };
}
