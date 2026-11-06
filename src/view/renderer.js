/**
 * ゲームの描画を担当するレンダラー
 *
 * view: { grid, filled, extraPainted, playerPos }
 * - filled:       確定済みの塗りつぶし状態（ブロックも true）
 * - extraPainted: 移動中に石が通過したマス [[x, y], ...]（未確定分の表示用）
 * - playerPos:    石の位置（移動中は小数）
 * size: 表示サイズ（CSS ピクセル）。高解像度画面ではその devicePixelRatio 倍の解像度で描く
 */
// index.html の :root の色と合わせる（アイボリーと青が基調、赤がアクセント、茶色は黒の代わり）
const THEME = {
    board: '#FFFDF8',               // --paper
    empty: '#ECE4D3',               // --ivory-deep
    block: '#7A5A3C',               // --brown
    paint: '#4F6CA6',               // --blue
    stone: '#8B2F3B',               // --red
    stoneEdge: '#F5F1E6',           // --ivory（青い塗り跡の上でも石が埋もれないよう縁取る）
    stoneShadow: 'rgba(122, 90, 60, 0.45)',
};

const PADDING = 5; // 盤面の外周余白
const GAP = 4;     // マスの間隔
const RADIUS = 6;  // マスの角丸

export function renderGame(canvas, view, size) {
    const { grid, filled, extraPainted = [], playerPos } = view;
    const N = grid.length;

    const cssSize = Math.floor(size);
    const dpr = window.devicePixelRatio || 1;
    const pixelSize = Math.round(cssSize * dpr);
    if (canvas.width !== pixelSize) {
        canvas.width = canvas.height = pixelSize;
        canvas.style.width = canvas.style.height = `${cssSize}px`;
    }

    const ctx = canvas.getContext('2d');
    ctx.setTransform(pixelSize / cssSize, 0, 0, pixelSize / cssSize, 0, 0);
    ctx.clearRect(0, 0, cssSize, cssSize);

    const cellSize = (cssSize - PADDING * 2 - GAP * (N - 1)) / N;
    const step = cellSize + GAP;
    const cellRect = (x, y) => [PADDING + x * step, PADDING + y * step, cellSize, cellSize];

    // 1. 盤面とマス
    ctx.fillStyle = THEME.board;
    ctx.fillRect(0, 0, cssSize, cssSize);

    const painted = new Set(extraPainted.map(([x, y]) => `${x},${y}`));
    for (let y = 0; y < N; y++) {
        for (let x = 0; x < N; x++) {
            const [rx, ry, w, h] = cellRect(x, y);
            if (grid[y][x] === 1) {
                ctx.fillStyle = THEME.block;
                roundRect(ctx, rx, ry, w, h, RADIUS);
                ctx.fill();
            } else if (filled[y][x] || painted.has(`${x},${y}`)) {
                ctx.fillStyle = THEME.paint;
                roundRect(ctx, rx, ry, w, h, RADIUS);
                ctx.fill();
            } else {
                ctx.fillStyle = THEME.empty;
                roundRect(ctx, rx, ry, w, h, RADIUS);
                ctx.fill();
            }
        }
    }

    // 2. 石（アイボリーで縁取った赤い玉）
    const centerX = PADDING + playerPos.x * step + cellSize / 2;
    const centerY = PADDING + playerPos.y * step + cellSize / 2;
    const r = cellSize * 0.33;
    ctx.save();
    ctx.shadowColor = THEME.stoneShadow;
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = THEME.stoneEdge;
    ctx.beginPath();
    ctx.arc(centerX, centerY, r + 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = THEME.stone;
    ctx.beginPath();
    ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
    ctx.fill();
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) {
        ctx.roundRect(x, y, w, h, r);
    } else {
        ctx.rect(x, y, w, h);
    }
}
