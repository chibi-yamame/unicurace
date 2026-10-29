import { DIRECTIONS, createFilled, slidePath } from './rules.js';

/**
 * ステージの解法を探索するソルバー（DFS）
 * 解があれば手順 [{ endX, endY, path, dx, dy }, ...]、なければ null を返す。
 */
export function findSolutionPath(N, grid, startPos) {
    const filled = createFilled(grid, startPos);
    let remaining = filled.flat().filter(cell => !cell).length;
    const moves = [];

    function dfs(x, y) {
        if (remaining === 0) return true;

        for (const [dx, dy] of DIRECTIONS) {
            const path = slidePath(filled, x, y, dx, dy);
            if (path.length === 0) continue;

            const [endX, endY] = path[path.length - 1];
            for (const [px, py] of path) filled[py][px] = true;
            remaining -= path.length;
            moves.push({ endX, endY, path, dx, dy });

            if (dfs(endX, endY)) return true;

            // バックトラック
            for (const [px, py] of path) filled[py][px] = false;
            remaining += path.length;
            moves.pop();
        }
        return false;
    }

    return dfs(startPos[0], startPos[1]) ? moves : null;
}
