import { createClient } from '@supabase/supabase-js';

// Supabaseの環境変数を読み込む
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Supabaseクライアントを作成する
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// セッションを取得する
export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error fetching session:', error);
    return null;
  }
  return data?.session;
};

// ユーザー情報を取得する
export const getUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }
  return user;
};
