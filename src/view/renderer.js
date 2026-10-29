/**
 * ゲームの描画を担当するレンダラー
 */
export function renderGame(canvas, stageData, playerPos, currentPainted, CONFIG) {
    const N = stageData.grid.length;
    // 画面サイズに合わせてキャンバスをリサイズ。canvas.width は整数に丸められるため、
    // 小数のまま比較すると毎フレーム再確保が走る
    const size = Math.floor(Math.min(window.innerWidth * 0.9, CONFIG.canvasSize));
    if (canvas.width !== size) {
        canvas.width = canvas.height = size;
    }

    const ctx = canvas.getContext('2d');
    const cellSize = canvas.width / N;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. グリッドとブロック（壁）の描画
    stageData.grid.forEach((row, y) => {
        row.forEach((cell, x) => {
            ctx.fillStyle = cell === 1 ? '#444' : '#fff'; // 1はブロック（壁）
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
            ctx.strokeStyle = '#ddd';
            ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
        });
    });

    // 2. 塗りつぶし済みのマスを描画
    if (currentPainted) {
        currentPainted.forEach((row, y) => {
            row.forEach((isPainted, x) => {
                // 空きマスで、かつ塗られている場合
                if (isPainted && stageData.grid[y][x] !== 1) {
                    ctx.fillStyle = '#b3d9ff'; // 塗りつぶしの色を少し濃くして視認性アップ
                    ctx.fillRect(x * cellSize + 2, y * cellSize + 2, cellSize - 4, cellSize - 4);
                }
            });
        });
    }

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