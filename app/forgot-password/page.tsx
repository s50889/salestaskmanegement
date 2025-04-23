'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // パスワードリセットメールを送信
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
      });

      if (error) {
        setMessage({
          text: error.message || 'パスワードリセットメールの送信に失敗しました。',
          type: 'error'
        });
      } else {
        setMessage({
          text: 'パスワードリセット用のメールを送信しました。メールをご確認ください。',
          type: 'success'
        });
      }
    } catch (err) {
      console.error('パスワードリセットエラー:', err);
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
          <h1 className="text-3xl font-bold">パスワードをリセット</h1>
          <p className="text-sm text-muted-foreground mt-2">
            登録したメールアドレスを入力してください。パスワードリセット用のリンクを送信します。
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
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                {loading ? 'リセットメール送信中...' : 'リセットメールを送信'}
              </button>
            </div>
          </form>
          
          <div className="mt-4 text-center text-sm">
            <Link
              href="/"
              className="text-primary hover:underline"
            >
              ログインページに戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
