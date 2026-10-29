/**
 * ミリ秒を "MM:SS.cc"（分は 60 以上も可、1/100 秒単位）に整形する
 */
export function formatTime(ms) {
    const centiseconds = Math.floor(ms / 10);
    const m = Math.floor(centiseconds / 6000);
    const s = Math.floor(centiseconds / 100) % 60;
    const cs = centiseconds % 100;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}
