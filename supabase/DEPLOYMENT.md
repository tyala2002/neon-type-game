# Supabase Edge Function デプロイ手順

このドキュメントでは、作成したEdge Functionをデプロイする手順を説明します。

## 前提条件

- Supabaseプロジェクトが作成されていること
- Supabase CLIがインストールされていること（または手動デプロイを使用）

## 方法1: Supabaseダッシュボードから手動デプロイ（推奨）

### 1. Supabaseダッシュボードにアクセス

1. [Supabase Dashboard](https://app.supabase.com/) にログイン
2. 対象のプロジェクトを選択

### 2. Edge Functionの作成

1. 左サイドバーから **Edge Functions** を選択
2. **Create a new function** をクリック
3. Function名: `submit-score` を入力
4. **Create function** をクリック

### 3. コードのデプロイ

1. 作成された関数をクリック
2. **Edit function** をクリック
3. `supabase/functions/submit-score/index.ts` の内容をコピー&ペースト
4. **Deploy** をクリック

### 4. RLSポリシーの適用

1. 左サイドバーから **SQL Editor** を選択
2. **New query** をクリック
3. `supabase/migrations/20251211_setup_rls.sql` の内容をコピー&ペースト
4. **Run** をクリック

### 5. 環境変数の確認

Edge Functionは以下の環境変数を自動的に使用します:
- `SUPABASE_URL`: プロジェクトのURL（自動設定）
- `SUPABASE_SERVICE_ROLE_KEY`: サービスロールキー（自動設定）

追加の環境変数は不要です。

### 6. Function URLの取得

1. Edge Functions ページで `submit-score` を選択
2. **Function URL** をコピー
3. この URLを `.env` ファイルに追加:

```env
VITE_SUBMIT_SCORE_URL=https://your-project-ref.supabase.co/functions/v1/submit-score
```

## 方法2: Supabase CLI を使用（上級者向け）

### 1. Supabase CLIのインストール

```bash
npm install -g supabase
```

### 2. Supabaseプロジェクトにログイン

```bash
supabase login
```

### 3. プロジェクトのリンク

```bash
supabase link --project-ref your-project-ref
```

### 4. Edge Functionのデプロイ

```bash
supabase functions deploy submit-score
```

### 5. RLSポリシーの適用

```bash
supabase db push
```

## テスト

### Edge Functionのテスト

以下のコマンドでEdge Functionをテストできます:

```bash
curl -X POST https://your-project-ref.supabase.co/functions/v1/submit-score \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "input": "テストテキスト",
    "targetText": "テストテキスト",
    "startTime": 1702300000000,
    "endTime": 1702300010000,
    "username": "TestUser"
  }'
```

成功すると以下のようなレスポンスが返ります:

```json
{
  "success": true,
  "score": 12345,
  "cpm": 120,
  "accuracy": 100,
  "rank": 1,
  "isHighScore": true
}
```

### RLSポリシーのテスト

Supabaseクライアントから直接挿入を試みて、拒否されることを確認:

```javascript
// これは失敗するはず
const { error } = await supabase.from('scores').insert([{
  username: 'Hacker',
  score: 999999,
  cpm: 9999,
  accuracy: 100
}]);

console.log(error); // RLS policy violation
```

## トラブルシューティング

### Edge Functionがデプロイできない

- Supabaseプロジェクトの設定を確認
- Function名が正しいか確認
- コードに構文エラーがないか確認

### RLSポリシーが適用されない

- SQL Editorでエラーメッセージを確認
- `scores` テーブルが存在するか確認
- 既存のポリシーと競合していないか確認

### Edge Functionが500エラーを返す

- Supabase Dashboardの **Logs** タブでエラーログを確認
- 環境変数が正しく設定されているか確認
- データベース接続が正常か確認

## 次のステップ

RLSポリシーとEdge Functionのデプロイが完了したら、クライアント側のコードを更新してください。
