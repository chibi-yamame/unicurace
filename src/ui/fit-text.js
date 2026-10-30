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
    // 使える幅は padding の内側。必要な幅は中身（文字と子要素）の実際の描画幅
    const measure = () => {
        const style = getComputedStyle(el);
        range.selectNodeContents(el);
        return {
            available: el.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight),
            needed: range.getBoundingClientRect().width,
            fontSize: parseFloat(style.fontSize),
        };
    };
    let { available, needed, fontSize } = measure();
    // 端末の文字拡大（Android の文字自動拡大など）は文字サイズに比例しないことがあるため、
    // 1 回で決めずに数回詰める。縮めても幅が減らなければ、悪化させないよう CSS の大きさに戻す
    for (let i = 0; i < 5 && available > 0 && needed > available; i++) {
        const before = needed;
        el.style.fontSize = `${Math.floor(fontSize * (available / needed) * 0.97 * 10) / 10}px`;
        ({ available, needed, fontSize } = measure());
        if (needed >= before) {
            el.style.fontSize = '';
            return;
        }
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
