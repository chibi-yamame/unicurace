/**
 * ステージの解法を探索するソルバー
 */
export function findSolutionPath(N, grid, startPos) {
    const allMaps = Array(N).fill().map(() => Array(N).fill(false));
    allMaps[startPos[1]][startPos[0]] = true;
    const moves = [];

    function slideInDirection(x, y, dx, dy, N, grid, painted) {
        const path = [];
        while (true) {
            const nextX = x + dx;
            const nextY = y + dy;
            if (nextX < 0 || nextX >= N || nextY < 0 || nextY >= N) break;
            if (grid[nextY][nextX] === 1 || painted[nextY][nextX]) break;
            x = nextX;
            y = nextY;
            path.push([x, y]);
        }
        return { endX: x, endY: y, path };
    }

    function getAllMoves(x, y, N, grid, painted) {
        const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
        const possibleMoves = [];
        for (const [dx, dy] of directions) {
            const result = slideInDirection(x, y, dx, dy, N, grid, painted);
            if (result.path.length > 0) {
                possibleMoves.push({ ...result, dx, dy });
            }
        }
        return possibleMoves;
    }

    function dfs(x, y, depth) {
        if (depth > 1000) return false;

        let allPainted = true;
        for (let yy = 0; yy < N; yy++) {
            for (let xx = 0; xx < N; xx++) {
                if (grid[yy][xx] === 0 && !allMaps[yy][xx]) {
                    allPainted = false;
                    break;
                }
            }
            if (!allPainted) break;
        }

        if (allPainted) return true;

        const possibleMoves = getAllMoves(x, y, N, grid, allMaps);
        for (const move of possibleMoves) {
            let hasNewCell = false;
            const newlyPainted = [];
            for (const [nx, ny] of move.path) {
                if (!allMaps[ny][nx]) {
                    hasNewCell = true;
                    allMaps[ny][nx] = true;
                    newlyPainted.push([nx, ny]);
                }
            }

            if (hasNewCell) {
                moves.push(move);
                if (dfs(move.endX, move.endY, depth + 1)) return true;
                
                // バックトラック
                for (const [nx, ny] of newlyPainted) {
                    allMaps[ny][nx] = false;
                }
                moves.pop();
            }
        }
        return false;
    }

    return dfs(startPos[0], startPos[1], 0) ? moves : null;
}