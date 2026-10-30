/**
 * 1 行で表示するテキストを、要素の幅に収まるまで縮める。
 *
 * CSS の文字サイズは書体と標準の文字サイズを前提にしているが、端末の文字サイズ設定
 * （Android のアプリ内ブラウザなど）や書体の読み込み失敗で文字が広がると、はみ出して
 * 見切れる。実際の描画幅を測って縮めることで、どの環境でも収まるようにする。
 */
const FIT_SELECTOR = '[data-fit-text]';

export function fitText(el) {
    el.style.fontSize = ''; // CSS の大きさに戻してから測る
    const range = document.createRange();
    // 縮めた結果がさらに文字サイズ設定で拡大される場合に備え、数回まで詰める
    for (let i = 0; i < 3; i++) {
        // 使える幅は padding の内側。必要な幅は中身（文字と子要素）の実際の描画幅
        const style = getComputedStyle(el);
        const available = el.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
        range.selectNodeContents(el);
        const needed = range.getBoundingClientRect().width;
        if (available <= 0 || needed <= available) return;
        const current = parseFloat(style.fontSize);
        el.style.fontSize = `${Math.floor(current * (available / needed) * 0.98 * 10) / 10}px`;
    }
}

/** 表示中の画面にある data-fit-text 要素をすべて収める */
export function fitAllText(root = document) {
    for (const el of root.querySelectorAll(FIT_SELECTOR)) {
        if (el.offsetParent !== null) fitText(el);
    }
}

/**
 * 画面の表示・大きさの変化、Web フォントの読み込み完了のたびに収め直す。
 * 各要素自身も監視する（横に並ぶ要素の出現で幅が狭まる場合。例: タイマー横のペナルティ表示）。
 * 収め直した結果の幅は同じ値に落ち着くので、監視が繰り返し発火し続けることはない。
 */
export function keepTextFitted() {
    const observer = new ResizeObserver(entries => {
        for (const { target } of entries) {
            if (target.matches(FIT_SELECTOR)) {
                if (target.offsetParent !== null) fitText(target);
            } else {
                fitAllText(target);
            }
        }
    });
    document.querySelectorAll(`section, ${FIT_SELECTOR}`).forEach(el => observer.observe(el));
    document.fonts?.ready.then(() => fitAllText());
}
