# ステージ生成アルゴリズム PoC3: シミュレーションベース

## 概要
ストーン（オブジェクト）を実際に動かしながらステージを生成し、塗りつぶし可能性を数学的に保証するアルゴリズム。

## アルゴリズム仕様

### 入力
- `seed`: シード値（再現性のため）
- `N`: グリッドサイズ（N x N）
- `moveRangeMax`: ストーンが一度に進める最大マス数の上限（推奨: N + 2）

### 処理フロー

#### 1. 初期化
```
painted = 全て false（塗りつぶし状態）
blocks = []（ブロック位置）
x, y = 0, 0（スタート位置）
painted[0][0] = true（スタートを塗りつぶし）
```

#### 2. メインループ（ストーン移動）
各ターンで以下を繰り返す：

1. **方向選択**: 4方向（上下左右）をランダム順でチェック
2. **移動距離決定**: `1 ~ moveRangeMax` からランダムに選択
3. **実移動距離計算**: 
   - 選んだ方向に何マス進めるか確認（塗りつぶし済みマス/境界で停止）
   - `実移動距離 = min(選択距離, 実際に進める最大距離)`
4. **ブロック配置**:
   - 選択距離 < 実最大距離 の場合：
     - 進行方向の「選択距離+1」番目にブロックを配置
     - 理由：このブロックで停止したことにする
5. **塗りつぶし**:
   - ストーンが通ったすべてのマスを塗りつぶし
   - ストーン位置を更新
6. **ターン終了**: 次の方向へ

#### 3. ループ終了条件
- 4方向すべてが移動不可（塗りつぶし済みまたは境界）

#### 4. 最終処理
- 塗りつぶされていないすべてのマスをブロック化

### 疑似コード
```javascript
function generateStageViaSimulation(seed, N, moveRangeMax) {
  const rng = new SeededRandom(seed);
  const painted = Array(N).fill().map(() => Array(N).fill(false));
  const blocks = [];
  
  let x = 0, y = 0;
  painted[0][0] = true;
  
  while (true) {
    const directions = [[0,1], [1,0], [0,-1], [-1,0]]; // 下, 右, 上, 左
    shuffleDirections(directions, rng); // ランダムに並べ替え
    
    let moved = false;
    
    for (const [dx, dy] of directions) {
      // 実際に進める最大距離を計算
      let maxDist = 0;
      for (let d = 1; d <= moveRangeMax; d++) {
        const nx = x + dx * d;
        const ny = y + dy * d;
        
        // 境界チェック
        if (nx < 0 || nx >= N || ny < 0 || ny >= N) break;
        // 既に塗りつぶされたマスをチェック
        if (painted[ny][nx]) break;
        
        maxDist = d;
      }
      
      if (maxDist > 0) {
        // 進む距離をランダム決定 (1 ~ moveRangeMax)
        const choosenDist = Math.floor(rng.next() * moveRangeMax) + 1;
        const actualDist = Math.min(choosenDist, maxDist);
        
        // ブロック配置（選択距離が実最大距離より小さい場合）
        if (choosenDist < maxDist) {
          const blockX = x + dx * (choosenDist + 1);
          const blockY = y + dy * (choosenDist + 1);
          blocks.push([blockX, blockY]);
        }
        
        // ストーンを移動・塗りつぶし
        for (let d = 1; d <= actualDist; d++) {
          const nx = x + dx * d;
          const ny = y + dy * d;
          painted[ny][nx] = true;
        }
        
        x += dx * actualDist;
        y += dy * actualDist;
        moved = true;
        break; // 次のターンへ
      }
    }
    
    if (!moved) break; // 全方向移動不可 → 終了
  }
  
  // 塗りつぶされていないマスをブロック化
  for (let yy = 0; yy < N; yy++) {
    for (let xx = 0; xx < N; xx++) {
      if (!painted[yy][xx]) {
        blocks.push([xx, yy]);
      }
    }
  }
  
  // グリッド構築
  const grid = Array(N).fill().map(() => Array(N).fill(0));
  for (const [bx, by] of blocks) {
    if (bx >= 0 && bx < N && by >= 0 && by < N) {
      grid[by][bx] = 1;
    }
  }
  
  return { grid, painted, blocks };
}
```

### 重要な性質

#### **数学的な保証: このアルゴリズムは必ずクリア可能なステージを生成する**

**証明:**
1. ストーンが到達したすべてのマスは `painted = true`
2. ストーンが到達できなかったマスは `painted = false`
3. 最終処理で、`painted = false` のマスすべてをブロック化
4. つまり、ストーン到達可能なマス = ブロック配置なし
5. → スタート(0,0)から全ての塗りつぶし対象マスに到達可能

#### **シード値との対応**
- 同じシード値なら常に同じステージが生成される
- `rng.next()` の呼び出し順が決定的

### パラメータ調整

- **`moveRangeMax`**: ストーンの移動バリエーション
  - 小さい(N+1): 一度に進む距離が短い → ブロック配置多い → 難しい
  - 大きい(N+4): 一度に進む距離が長い → ブロック配置少ない → 簡単
  - 推奨: N + 2

- **方向選択**: ランダム順 vs 固定順
  - ランダム: より多様なステージ
  - 推奨: ランダム

### 利点

1. ✅ 必ずクリア可能（数学的保証）
2. ✅ 効率的（ブロック配置を動的に決定）
3. ✅ シード値で再現可能
4. ✅ 難易度調整が可能（ブロック密度 ≈ moveRangeMax に反比例）

## 現在の実装 (`src/core/generator.js`) における差分

上記の疑似コードは PoC3 時点の設計です。現在の実装では以下が追加・変更されています。

| 項目 | 疑似コード | 実装 |
| --- | --- | --- |
| 関数シグネチャ | `generateStageViaSimulation(seed, N, moveRangeMax)` | `generateStageViaSimulation(rng, N, moveRangeMax)`。呼び出し側で作った `SeededRandom` を受け取り、複数ステージで同じ乱数列を使い回す。 |
| スタート位置 | 固定 `(0, 0)` | 乱数でランダムに決定（`x` → `y` の順に `rng.next()` を消費）。 |
| 最初の 1 手 | 4方向 | スタートが壁際（端の行/列）の場合、壁に沿った方向のみに制限（`getWallConstrainedDirections`）。 |
| ブロック配置 | `blocks` に追加のみ | 範囲内チェックの上、配置マスを `painted = true` にして以降のストーンが通過しないようにする。 |
| 返り値 | `{ grid, painted, blocks }` | `{ grid, painted, blockCount, startPos, log }`。`log` はターンごとの位置・各方向の最大距離・選択結果・ブロック配置・終了フラグ。 |
| ブロック率の調整 | なし | `generateStageViaSimulationWithRetry` でブロック率が `[blockRatioMin, blockRatioMax]` に入るまで最大 `maxRetries`（既定 `N * 10`）回再生成。入らなければ範囲に最も近い結果を返す。 |

### 乱数の消費順（再現性に関わる）
1. スタート位置 `x`, `y`
2. 各ターン: 方向のシャッフル（方向数 - 1 回）→ 移動可能な方向が見つかったら移動距離 1 回
3. リトライ時は同じ `rng` から続けて消費するため、リトライ回数が変わると後続ステージも変わる。

### クリア可能性の保証に関する前提
ゲームではストーンは止まるまで滑るため、生成時の「進める最大距離」が `moveRangeMax` で頭打ちになると、生成時の想定経路とゲーム上の動きが一致しなくなる可能性がある。
`moveRangeMax >= N - 1` であれば 1 方向の最大移動距離 (`N - 1`) を常にカバーできるため、保証が成り立つ。ゲーム本体は `moveRangeMax = N - 1` を使用している。
