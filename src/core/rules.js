/**
 * ゲームルール（ステージ生成・ソルバー・ゲーム画面で共通）
 *
 * 盤面の状態は filled[y][x] で表す。ブロックまたは塗りつぶし済みのマスが true。
 * ストーンは filled なマスと盤外にぶつかるまで直線的に滑り、通過したマスを塗る。
 */

/** 移動方向 [dx, dy]（下, 右, 上, 左） */
export const DIRECTIONS = [[0, 1], [1, 0], [0, -1], [-1, 0]];

export function isInside(N, x, y) {
    return x >= 0 && x < N && y >= 0 && y < N;
}

/**
 * 盤面（1=ブロック）とスタート位置から初期状態を作る
 */
export function createFilled(grid, startPos) {
    const filled = grid.map(row => row.map(cell => cell === 1));
    filled[startPos[1]][startPos[0]] = true;
    return filled;
}

/**
 * (x, y) から (dx, dy) 方向に滑ったときに通過するマスの一覧 [[x, y], ...]
 * 止まるまで滑る。limit を指定するとそのマス数で打ち切る。
 */
export function slidePath(filled, x, y, dx, dy, limit = Infinity) {
    const N = filled.length;
    const path = [];
    while (path.length < limit) {
        const nx = x + dx;
        const ny = y + dy;
        if (!isInside(N, nx, ny) || filled[ny][nx]) break;
        x = nx;
        y = ny;
        path.push([x, y]);
    }
    return path;
}

/** (x, y) からいずれかの方向に動けるか */
export function canMove(filled, x, y) {
    const N = filled.length;
    return DIRECTIONS.some(([dx, dy]) => isInside(N, x + dx, y + dy) && !filled[y + dy][x + dx]);
}

/** 全マスが埋まった（クリア）か */
export function isCleared(filled) {
    return filled.every(row => row.every(Boolean));
}
