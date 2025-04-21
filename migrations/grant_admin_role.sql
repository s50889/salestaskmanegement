-- 特定のユーザーに管理者権限を付与するSQL

-- 方法1: IDを指定して更新する場合
UPDATE sales_reps
SET role = 'admin'
WHERE id = 'ここに営業担当者のIDを入力';

-- 方法2: メールアドレスを指定して更新する場合
UPDATE sales_reps
SET role = 'admin'
WHERE email = 'ここにメールアドレスを入力';

-- 方法3: ユーザーIDを指定して更新する場合
UPDATE sales_reps
SET role = 'admin'
WHERE user_id = 'ここにSupabaseのユーザーIDを入力';

-- 更新されたレコードを確認
SELECT id, name, email, role, user_id
FROM sales_reps
WHERE role = 'admin';
