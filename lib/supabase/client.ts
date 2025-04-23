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

// パスワードを更新する
export const updatePassword = async (newPassword: string): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    
    if (error) {
      console.error('パスワード更新エラー:', error);
      return { 
        success: false, 
        error: error.message || 'パスワードの更新に失敗しました。' 
      };
    }
    
    return { success: true, error: null };
  } catch (err) {
    console.error('パスワード更新中に例外が発生しました:', err);
    return { 
      success: false, 
      error: '予期せぬエラーが発生しました。もう一度お試しください。' 
    };
  }
};
