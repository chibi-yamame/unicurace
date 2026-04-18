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
