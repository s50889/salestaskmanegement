'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // URLハッシュからトークンを取得する関数
  const getHashParams = () => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      return {
        access_token: params.get('access_token'),
        type: params.get('type'),
      };
    }
    return { access_token: null, type: null };
  };

  // 初期化時にトークンを確認
  useEffect(() => {
    const { access_token, type } = getHashParams();
    if (!access_token || type !== 'recovery') {
      setMessage({
        text: '無効なリセットリンクです。パスワードリセットを再度お試しください。',
        type: 'error'
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // パスワードの検証
    if (password !== confirmPassword) {
      setMessage({
        text: 'パスワードと確認用パスワードが一致しません。',
        type: 'error'
      });
      return;
    }

    if (password.length < 8) {
      setMessage({
        text: 'パスワードは8文字以上である必要があります。',
        type: 'error'
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // パスワードを更新
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setMessage({
          text: error.message || 'パスワードの更新に失敗しました。',
          type: 'error'
        });
      } else {
        setMessage({
          text: 'パスワードが正常に更新されました。',
          type: 'success'
        });
        
        // 成功したら3秒後にログインページにリダイレクト
        setTimeout(() => {
          router.push('/');
        }, 3000);
      }
    } catch (err) {
      console.error('パスワード更新エラー:', err);
      setMessage({
        text: '予期せぬエラーが発生しました。もう一度お試しください。',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-md flex-col justify-center p-4">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold">新しいパスワードを設定</h1>
          <p className="text-sm text-muted-foreground mt-2">
            新しいパスワードを入力してください。
          </p>
        </div>

        {message && (
          <div className={`p-4 mb-4 rounded-md ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                新しいパスワード
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border p-2"
                required
                minLength={8}
              />
              <p className="text-xs text-muted-foreground mt-1">
                パスワードは8文字以上にしてください
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
                新しいパスワード (確認)
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-md border p-2"
                required
              />
            </div>
            
            <div className="pt-2">
              <button
                type="submit"
                className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                disabled={loading}
              >
                {loading ? 'パスワード更新中...' : 'パスワードを更新'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
