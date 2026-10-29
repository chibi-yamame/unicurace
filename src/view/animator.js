/**
 * 移動アニメーション（見た目のみ。ゲーム状態は変更しない）
 *
 * move: GameSession.startMove() の戻り値 { from, path }
 * onFrame({ pos, passed }): pos は石の表示位置、passed は通過済みのマス
 * onDone(): アニメーション完了時
 * 戻り値: アニメーションを中断する関数
 */
export function animateMove(move, { secondsPerCell, onFrame, onDone }) {
    const { from, path } = move;
    const distance = path.length;
    const [toX, toY] = path[distance - 1];
    const duration = distance * secondsPerCell * 1000;
    const startTime = performance.now();
    let frameId = null;

    function frame(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        // イージング（滑らかな停止）をかける場合はここを調整
        const pos = {
            x: from.x + (toX - from.x) * progress,
            y: from.y + (toY - from.y) * progress,
        };
        // 石の中心が入ったマスまでを通過済みとする。フレームが飛んでも途中のマスを飛ばさない
        const passedCount = Math.min(Math.floor(progress * distance + 0.5), distance);
        onFrame({ pos, passed: path.slice(0, passedCount) });

        if (progress < 1) {
            frameId = requestAnimationFrame(frame);
        } else {
            frameId = null;
            onDone();
        }
    }
    frameId = requestAnimationFrame(frame);

    return () => {
        if (frameId !== null) cancelAnimationFrame(frameId);
        frameId = null;
    };
}
