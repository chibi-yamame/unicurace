/**
 * 画面遷移。画面を離れるときの後始末（タイマー・アニメーションの停止など）を
 * onLeave で画面ごとに登録し、どの経路で遷移しても必ず実行されるようにする。
 */
const leaveHandlers = new Map();
let currentScreenId = document.querySelector('section.active')?.id ?? null;

export function onLeave(screenId, handler) {
    if (!leaveHandlers.has(screenId)) leaveHandlers.set(screenId, []);
    leaveHandlers.get(screenId).push(handler);
}

export function showScreen(screenId) {
    if (currentScreenId !== null && currentScreenId !== screenId) {
        for (const handler of leaveHandlers.get(currentScreenId) ?? []) handler();
    }
    document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    currentScreenId = screenId;
}

export function currentScreen() {
    return currentScreenId;
}
