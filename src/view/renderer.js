/**
 * ゲームの描画を担当するレンダラー
 *
 * view: { grid, filled, extraPainted, playerPos }
 * - filled:       確定済みの塗りつぶし状態（ブロックも true）
 * - extraPainted: 移動中に石が通過したマス [[x, y], ...]（未確定分の表示用）
 * - playerPos:    石の位置（移動中は小数）
 */
export function renderGame(canvas, view, { canvasSize }) {
    const { grid, filled, extraPainted = [], playerPos } = view;
    const N = grid.length;

    // 画面幅に合わせた表示サイズ（CSS ピクセル）。高解像度画面ではその倍率分の解像度で描く
    const cssSize = Math.floor(Math.min(window.innerWidth * 0.9, canvasSize));
    const dpr = window.devicePixelRatio || 1;
    const pixelSize = Math.round(cssSize * dpr);
    if (canvas.width !== pixelSize) {
        canvas.width = canvas.height = pixelSize;
        canvas.style.width = canvas.style.height = `${cssSize}px`;
    }

    const ctx = canvas.getContext('2d');
    ctx.setTransform(pixelSize / cssSize, 0, 0, pixelSize / cssSize, 0, 0);
    const cellSize = cssSize / N;

    ctx.clearRect(0, 0, cssSize, cssSize);

    // 1. グリッドとブロック（壁）の描画
    grid.forEach((row, y) => {
        row.forEach((cell, x) => {
            ctx.fillStyle = cell === 1 ? '#444' : '#fff'; // 1はブロック（壁）
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
            ctx.strokeStyle = '#ddd';
            ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
        });
    });

    // 2. 塗りつぶし済みのマスを描画
    const paintCell = (x, y) => {
        ctx.fillStyle = '#b3d9ff';
        ctx.fillRect(x * cellSize + 2, y * cellSize + 2, cellSize - 4, cellSize - 4);
    };
    filled.forEach((row, y) => {
        row.forEach((isFilled, x) => {
            if (isFilled && grid[y][x] !== 1) paintCell(x, y);
        });
    });
    for (const [x, y] of extraPainted) paintCell(x, y);

    // 3. ストーン（プレイヤー）の描画
    ctx.fillStyle = '#ff4757';
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    const centerX = (playerPos.x + 0.5) * cellSize;
    const centerY = (playerPos.y + 0.5) * cellSize;
    ctx.arc(centerX, centerY, cellSize * 0.35, 0, Math.PI * 2);
    ctx.fill();
    
    // 影のリセット
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.arc(centerX - cellSize * 0.1, centerY - cellSize * 0.1, cellSize * 0.08, 0, Math.PI * 2);
    ctx.fill();
}
