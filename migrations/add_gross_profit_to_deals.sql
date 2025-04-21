-- 案件テーブルに粗利フィールドを追加
ALTER TABLE deals ADD COLUMN IF NOT EXISTS gross_profit numeric DEFAULT 0;

-- 既存のレコードの粗利を0に設定
UPDATE deals SET gross_profit = 0 WHERE gross_profit IS NULL;
