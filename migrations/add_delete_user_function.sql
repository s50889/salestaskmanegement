-- ユーザー削除用のSQL関数
CREATE OR REPLACE FUNCTION delete_sales_rep(sales_rep_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- スーパーユーザー権限で実行
AS $$
BEGIN
  -- 外部キー制約を無視するためにセッション変数を設定
  SET session_replication_role = 'replica';
  
  -- 活動ログの削除
  DELETE FROM activities WHERE sales_rep_id = delete_sales_rep.sales_rep_id;
  
  -- 案件の削除
  DELETE FROM deals WHERE sales_rep_id = delete_sales_rep.sales_rep_id;
  
  -- 顧客の削除
  DELETE FROM customers WHERE sales_rep_id = delete_sales_rep.sales_rep_id;
  
  -- 営業担当者の削除
  DELETE FROM sales_reps WHERE id = delete_sales_rep.sales_rep_id;
  
  -- 外部キー制約を元に戻す
  SET session_replication_role = 'origin';
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    -- エラーが発生した場合は外部キー制約を元に戻して終了
    SET session_replication_role = 'origin';
    RAISE NOTICE 'データ削除エラー: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- RLSポリシーを適用
ALTER FUNCTION delete_sales_rep(UUID) SECURITY DEFINER;
