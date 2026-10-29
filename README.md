# Unicurace (ユニキュレイス) - 一筆書き塗りつぶしパズル

直線的に滑るオブジェクトを操作して、グリッド上のすべてのマスを塗りつぶすパズルゲームのプロトタイプです。

## 概要

このプロジェクトは、スマホ向けWebアプリとしてのリリースを目指したパズルゲームのコアロジックおよびUIの検証用プロトタイプ（PoC）です。
プレイヤーは一方向を選択し、壁・ブロック・塗りつぶし済みマスにぶつかるまで進むオブジェクト（ストーン）を操り、ステージ内のすべての「塗りつぶし可能マス」を通過することを目指します。

## 主な機能

- **シングルプレイ（タイムアタック）**: 7x7 のステージを 5 つ連続でクリアし、総タイム（経過時間＋ペナルティ）を競うモード。詳細は [`docs/single-player-spec.md`](docs/single-player-spec.md)。
- **シード共有**: タイトル画面で最大6桁のシード値を入力・ランダム生成でき、同じシードを入力すれば友人と同じ 5 ステージで対戦できる。
- **スワイプ / マウスドラッグ操作**: キャンバス上でのスワイプ（30px 以上）で上下左右に移動。移動はアニメーション付きで、通過したマスをリアルタイムに塗る。
- **詰み判定・自動リセット**: どの方向にも動けなくなったら自動でステージ最初に戻り、ペナルティ（3秒）を加算。
- **確定的なステージ生成**: シード値ベースの乱数生成（LCG）により、同じシードからは常に同じステージを生成。
- **シミュレーションアルゴリズム**: 実際に解く動きをシミュレートしながらブロックを配置するため、生成されたステージは必ずクリア可能。
- **自動ソルバー**: DFS（深さ優先探索）により、ステージがクリア可能かを検証（ステージインスペクターで使用）。
- **ステージインスペクター**: 生成ステージと解法経路・生成ログをブラウザ上で一覧表示する開発用ツール。

## 技術スタック

- **言語**: JavaScript (ES6+ / ES Modules)。ビルド工程・外部依存なし。
- **描画**: HTML5 Canvas API
- **UI**: HTML / CSS（`index.html` 内に記述）

## プロジェクト構造

```
.
├── index.html                  # ゲーム本体（シングルプレイ）。画面遷移・入力・タイマー等のロジックを内包
├── package.json                # npm スクリプト（テスト・ローカルサーバー）。外部依存なし
├── src/
│   ├── core/
│   │   ├── rules.js            # ゲームルール（滑る移動・詰み判定・クリア判定）。生成・ソルバー・ゲームで共通
│   │   ├── generator.js        # ステージ生成エンジン
│   │   └── solver.js           # 解法を探索するDFSソルバー
│   ├── utils/
│   │   ├── random.js           # シード付き乱数生成器 (LCG)
│   │   └── time.js             # タイム表示の整形
│   └── view/
│       └── renderer.js         # Canvas へのゲーム盤面描画
├── test/                       # node:test によるコアロジックのテスト
├── tools/
│   └── stage-inspector/
│       └── test_generator.html # ステージ生成・解法の検証用ブラウザツール
├── docs/
│   ├── game-specification.md   # プロジェクト全体の仕様書
│   ├── single-player-spec.md   # シングルプレイモード仕様書
│   ├── algorithm-poc3.md       # ステージ生成アルゴリズム (PoC3) の解説
│   ├── stage-generation-proposals.md # ステージ生成手法の計測と改善案
│   └── code-review.md          # ソースコード・設計レビューと改修方針
└── seeds_for_test.txt          # 検証用に控えたシード値のメモ
```

### モジュールの API

| ファイル | エクスポート | 説明 |
| --- | --- | --- |
| `src/utils/random.js` | `class SeededRandom(seed)` / `next()` | `seed = (seed * 9301 + 49297) % 233280` の LCG。`[0, 1)` の値を返す。シードは `[0, 233280)` の整数に正規化される。 |
| `src/utils/time.js` | `formatTime(ms)` | `MM:SS.cc` 形式に整形。 |
| `src/core/rules.js` | `DIRECTIONS` / `createFilled(grid, startPos)` / `slidePath(filled, x, y, dx, dy, limit?)` / `canMove(filled, x, y)` / `isCleared(filled)` | 盤面状態 `filled[y][x]`（ブロックまたは塗り済みなら `true`）に対するルール。 |
| `src/core/generator.js` | `generateStageViaSimulation(rng, N, moveRangeMax)` | 1 回分のステージ生成。`{ grid, painted, blockCount, startPos, log }` を返す。`grid[y][x]` は `1`=ブロック / `0`=空きマス、`startPos` は `[x, y]`。 |
| | `generateStageViaSimulationWithRetry(rng, N, moveRangeMax, blockRatioMin = 0.2, blockRatioMax = 0.5, maxRetries = N * 10)` | ブロック率が範囲内になるまで再生成。範囲外のままなら範囲に最も近い結果を返す。返り値に `retryCount` が付く。 |
| | `shuffleDirections(directions, rng)` / `getWallConstrainedDirections(x, y, N)` | 生成用の補助関数。 |
| `src/core/solver.js` | `findSolutionPath(N, grid, startPos)` | 解があれば手順（`{ endX, endY, path, dx, dy }` の配列）、なければ `null`。 |
| `src/view/renderer.js` | `renderGame(canvas, stageData, playerPos, currentPainted, CONFIG)` | 盤面・塗りつぶし・ストーンを描画。キャンバスは `min(画面幅 * 0.9, CONFIG.canvasSize)` に自動リサイズ。 |

## 始め方

ES Modules (`<script type="module">`) を使っているため、`file://` で直接開くとブラウザがモジュール読み込みをブロックします。ローカル HTTP サーバー経由で開いてください。

```bash
git clone <このリポジトリ>
cd unicurace
npm start                     # = python3 -m http.server 8000（任意の静的サーバーで可）
```

テスト（Node.js 18 以上、追加のインストール不要）:

```bash
npm test
```

- **ゲーム**: <http://localhost:8000/index.html>
- **ステージインスペクター**: <http://localhost:8000/tools/stage-inspector/test_generator.html>
  1. 「サイズ」「ステージ数」「最大移動距離」「シード」「ブロック率（最小/最大）」を設定。
  2. 「ステージ生成」をクリック。
  3. 各ステージの盤面（スタート位置・ソルバーの解法経路）、手数、ブロック率、リトライ回数（`R*`）が表示される。「ログを表示」で生成時のターンログ（`T<ターン>: (x,y) -> 方向(距離) +B [END]`）を確認できる。

## ゲーム設定値（`index.html` の `CONFIG`）

| キー | 値 | 意味 |
| --- | --- | --- |
| `gridSize` | 7 | ステージサイズ (N x N) |
| `stageTotal` | 5 | 連続ステージ数 |
| `blockRatioMin` / `blockRatioMax` | 0.15 / 0.35 | 目標ブロック率 |
| `moveSpeed` | 0.06 | ストーン移動速度（1マスあたり秒） |
| `canvasSize` | 400 | キャンバスの最大サイズ (px) |
| `swipeThreshold` | 30 | スワイプと判定する最小移動量 (px) |
| `penaltyTime` | 3000 | リセット時のペナルティ (ms) |

ステージ生成時の `moveRangeMax` は `gridSize - 1`（= 6）を渡しています。

## アルゴリズムのポイント

### ステージ生成
1. ランダムな地点からスタート（スタート位置も乱数で決定）。
2. スタートが壁際の場合、最初の 1 手は壁に沿った方向のみに制限。
3. 4方向をランダム順に調べ、滑れる距離（境界・塗りつぶし済みマスで停止）を計算。
4. 乱数で選んだ距離（1〜`moveRangeMax`）が滑れる距離より短ければ、その先にブロックを置いて「そこで止まった」ことにする。
5. 移動不可になるまで繰り返し、最後に通らなかったマスをすべてブロックで埋める。
6. ブロック率が目標範囲外なら再生成（最大 `N * 10` 回）。

詳細は [`docs/algorithm-poc3.md`](docs/algorithm-poc3.md) を参照。

### ソルバー
すべての塗りつぶし可能マスが埋まるまで、再帰的に移動パターンを探索します（新しいマスを 1 つも塗らない手は探索しない、深さ上限 1000）。PoC段階では、パフォーマンス維持のため比較的小さなグリッド（最大20x20程度）を想定しています。

### シード値に関する注意
LCG の法が `233280` のため、`233280` 違いのシード（例: `12345` と `245625`）は同じステージ列を生成します。6桁入力（0〜999999）でも実質的に異なるステージ列は 233280 通りです。

## 今後の予定

- [x] シングルプレイ（5ステージ連続タイムアタック）
- [x] スワイプ操作による直感的なインターフェースの実装
- [x] シード値の入力による対戦ステージの共有
- [ ] シード値の URL / QR コード共有
- [ ] React.js への移行とコンポーネント化
- [ ] PWA対応によるネイティブアプリ風の利用体験
- [ ] Firebaseを利用したタイムアタック共有機能

---

## ライセンス

Internal Project / Private
