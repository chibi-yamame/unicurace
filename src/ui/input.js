/**
 * 入力（スワイプ・マウスドラッグ・矢印キー）を移動方向 (dx, dy) に変換する
 */
const ARROW_KEYS = {
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
};

export function attachInput(canvas, { swipeThreshold, isActive, onDirection }) {
    let startPos = null;

    const handleStart = (x, y) => {
        if (!isActive()) return;
        startPos = { x, y };
    };

    const handleEnd = (x, y) => {
        if (!startPos) return;
        const dx = x - startPos.x;
        const dy = y - startPos.y;
        startPos = null;
        if (!isActive() || Math.max(Math.abs(dx), Math.abs(dy)) <= swipeThreshold) return;
        if (Math.abs(dx) > Math.abs(dy)) {
            onDirection(dx > 0 ? 1 : -1, 0);
        } else {
            onDirection(0, dy > 0 ? 1 : -1);
        }
    };

    canvas.addEventListener('touchstart', e => {
        e.preventDefault();
        handleStart(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });
    window.addEventListener('touchend', e => handleEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY));

    canvas.addEventListener('mousedown', e => handleStart(e.clientX, e.clientY));
    window.addEventListener('mouseup', e => handleEnd(e.clientX, e.clientY));

    window.addEventListener('keydown', e => {
        const dir = ARROW_KEYS[e.key];
        if (!dir || !isActive()) return;
        e.preventDefault(); // 矢印キーでのスクロールを防ぐ
        if (!e.repeat) onDirection(...dir);
    });
}
