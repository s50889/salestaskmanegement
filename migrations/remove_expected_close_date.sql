-- 案件テーブルから予定成約日フィールドを削除
ALTER TABLE deals DROP COLUMN IF EXISTS expected_close_date;
