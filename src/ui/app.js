/**
 * シングルプレイの画面制御（各モジュールをつなぐ入口）
 */
import { CONFIG } from '../config.js';
import { stageIterator } from '../game/stages.js';
import { GameSession, PHASE, MOVE_RESULT } from '../game/session.js';
import { Stopwatch } from '../game/timer.js';
import { formatTime } from '../utils/time.js';
import { renderGame } from '../view/renderer.js';
import { animateMove } from '../view/animator.js';
import { attachInput } from './input.js';
import { showScreen, onLeave, currentScreen } from './screens.js';

const $ = id => document.getElementById(id);

let currentSeed = 0;
let stages = [];
let session = null;
const stopwatch = new Stopwatch();

// ゲーム画面で動いている非同期処理（画面を離れるときにすべて止める）
let timerFrameId = null;
let cancelMoveAnimation = null;
let clearTimeoutId = null;

// --- 1. タイトル画面 ---
const seedInput = $('title-seed-input');

// 数字以外（貼り付けを含む）を取り除く
seedInput.addEventListener('input', () => {
    seedInput.value = seedInput.value.replace(/[^0-9]/g, '').slice(0, 6);
});

$('btn-random-seed').onclick = () => {
    const randomSeed = Math.floor(Math.random() * 1000000);
    seedInput.value = String(randomSeed).padStart(6, '0');
};

$('btn-to-gen').onclick = () => {
    // 入力がない場合は現在時刻をベースにした6桁のシードを生成
    currentSeed = /^[0-9]{1,6}$/.test(seedInput.value) ? parseInt(seedInput.value, 10) : (Date.now() % 1000000);
    $('display-seed').textContent = `シード: ${String(currentSeed).padStart(6, '0')}`;
    showScreen('screen-generation');
    startStageGeneration();
};

// --- 2. ステージ生成画面 ---
async function startStageGeneration() {
    stages = [];
    const title = $('gen-status-title');
    const button = $('btn-to-countdown');
    const progress = $('gen-progress');
    button.disabled = true;
    title.textContent = 'ステージ構築中...';
    progress.textContent = `0 / ${CONFIG.stageTotal} 完了`;

    for (const stage of stageIterator(currentSeed, CONFIG)) {
        stages.push(stage);
        progress.textContent = `${stages.length} / ${CONFIG.stageTotal} 完了`;
        await new Promise(r => setTimeout(r, CONFIG.generationDelay)); // 演出用
    }

    title.textContent = 'ステージ構築完了！';
    button.disabled = false;
}

$('btn-to-countdown').onclick = () => {
    if (stages.length < CONFIG.stageTotal) return;
    showScreen('screen-countdown');
    startCountdown();
};

// --- 3. カウントダウン画面 ---
let countdownIntervalId = null;

function startCountdown() {
    const text = $('countdown-text');
    let count = 3;
    text.textContent = count;
    countdownIntervalId = setInterval(() => {
        count--;
        if (count > 0) text.textContent = count;
        else if (count === 0) text.textContent = 'GO!';
        else startGame();
    }, 1000);
}

onLeave('screen-countdown', () => {
    clearInterval(countdownIntervalId);
    countdownIntervalId = null;
});

// --- 4. ゲーム画面 ---
const canvas = $('game-canvas');

function startGame() {
    session = new GameSession(stages, { penaltyTime: CONFIG.penaltyTime });
    showScreen('screen-game');
    stopwatch.start(performance.now());
    timerLoop();
    updateStageView();
}

// 移動アニメーションとクリア後の余韻を止める
function stopStageActivity() {
    if (cancelMoveAnimation) cancelMoveAnimation();
    if (clearTimeoutId !== null) clearTimeout(clearTimeoutId);
    cancelMoveAnimation = null;
    clearTimeoutId = null;
}

onLeave('screen-game', () => {
    stopStageActivity();
    stopwatch.stop(performance.now());
    cancelAnimationFrame(timerFrameId);
    timerFrameId = null;
});

function totalTime() {
    return stopwatch.elapsed(performance.now()) + session.penaltyMs;
}

function renderTimer() {
    $('game-timer').textContent = formatTime(totalTime());
    $('penalty-timer').textContent = session.penaltyMs > 0 ? `+${(session.penaltyMs / 1000).toFixed(2)}s Penalty` : '';
}

function timerLoop() {
    renderTimer();
    timerFrameId = requestAnimationFrame(timerLoop);
}

function draw(playerPos = session.playerPos, extraPainted = []) {
    renderGame(canvas, { grid: session.stage.grid, filled: session.filled, extraPainted, playerPos }, CONFIG);
}

// ステージが切り替わった（またはやり直した）後の表示更新
function updateStageView() {
    if (session.phase === PHASE.FINISHED) {
        finishGame();
        return;
    }
    $('stage-number').textContent = `STAGE ${session.stageIndex + 1} / ${session.stageTotal}`;
    draw();
}

function handleDirection(dx, dy) {
    const move = session.startMove(dx, dy);
    if (!move) return;
    cancelMoveAnimation = animateMove(move, {
        secondsPerCell: CONFIG.moveSpeed,
        onFrame: ({ pos, passed }) => draw(pos, passed),
        onDone: () => {
            cancelMoveAnimation = null;
            handleMoveResult(session.finishMove());
        },
    });
}

function handleMoveResult(result) {
    if (result === MOVE_RESULT.DEADLOCK) {
        showPenaltyVisual();
        updateStageView();
    } else if (result === MOVE_RESULT.CLEARED) {
        // 最終ステージはクリアした瞬間でタイムを確定する
        if (session.isLastStage) {
            stopwatch.stop(performance.now());
            renderTimer();
        }
        draw();
        clearTimeoutId = setTimeout(() => {
            clearTimeoutId = null;
            session.advance();
            updateStageView();
        }, CONFIG.clearDelay); // クリア後の余韻
    } else {
        draw();
    }
}

attachInput(canvas, {
    swipeThreshold: CONFIG.swipeThreshold,
    isActive: () => currentScreen() === 'screen-game',
    onDirection: handleDirection,
});

function showPenaltyVisual() {
    const popup = document.createElement('div');
    popup.className = 'penalty-popup';
    popup.textContent = `+${(CONFIG.penaltyTime / 1000).toFixed(2)}s`;
    $('screen-game').appendChild(popup);
    // アニメーション終了後に要素を削除
    popup.addEventListener('animationend', () => popup.remove());
}

$('btn-reset-stage').onclick = () => {
    if (!session.reset()) return;
    showPenaltyVisual();
    updateStageView();
};

// ギブアップ（タイトルに戻る）
$('btn-giveup').onclick = () => showScreen('screen-title');

// デバッグ用: ステージスキップ
$('btn-skip-stage').onclick = () => {
    stopStageActivity();
    session.skip();
    updateStageView();
};

// 画面サイズ・解像度の変化に合わせて描き直す
window.addEventListener('resize', () => {
    if (currentScreen() === 'screen-game' && session.phase !== PHASE.FINISHED) draw();
});

// --- 5. 結果画面 ---
function finishGame() {
    stopwatch.stop(performance.now());
    renderTimer();
    $('result-time').textContent = formatTime(totalTime());
    $('result-stats').innerHTML = `
        全${session.stageTotal}ステージ完了<br>
        行き止まり: ${session.deadlockCount}回 / リトライ: ${session.manualResetCount}回<br>
        (ペナルティ合計: ${(session.penaltyMs / 1000).toFixed(1)}秒)
    `;
    showScreen('screen-result');
}

$('btn-restart').onclick = () => {
    showScreen('screen-generation');
    startStageGeneration();
};

$('btn-to-title').onclick = () => showScreen('screen-title');
