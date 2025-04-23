-- 部署テーブルの作成
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- サンプルデータ
INSERT INTO departments (name, description) VALUES
  ('営業部', '法人営業を担当する部署'),
  ('マーケティング部', 'マーケティング戦略を担当する部署'),
  ('カスタマーサクセス部', '顧客のサポートと成功を担当する部署');

-- 営業担当者テーブルに部署IDカラムを追加
ALTER TABLE sales_reps ADD COLUMN department_id UUID REFERENCES departments(id);

-- 既存の営業担当者を営業部に割り当て
UPDATE sales_reps SET department_id = (SELECT id FROM departments WHERE name = '営業部');
