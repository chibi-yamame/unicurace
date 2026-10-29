/**
 * シングルプレイの設定値
 */
const GRID_SIZE = 7;

export const CONFIG = Object.freeze({
    gridSize: GRID_SIZE,
    stageTotal: 5,
    blockRatioMin: 0.15,
    blockRatioMax: 0.35,
    moveRangeMax: GRID_SIZE - 1, // 生成時に 1 手で進む距離を選ぶ上限
    moveSpeed: 0.045, // 石の移動速度（1マスあたりの秒数）
    canvasSize: 400, // キャンバスの最大サイズ（CSS ピクセル）
    swipeThreshold: 30, // スワイプと判定する最小ピクセル数
    penaltyTime: 3000, // ペナルティ時間（ミリ秒）
    clearDelay: 200, // クリア後、次のステージへ進むまでの余韻（ミリ秒）
    generationDelay: 100, // ステージ生成画面の演出用待ち時間（1ステージあたり、ミリ秒）
});
