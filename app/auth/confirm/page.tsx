'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function ConfirmPage() {
  const router = useRouter();
  const [message, setMessage] = useState('確認中...そのままお待ちください');

  useEffect(() => {
    const handleVerification = async () => {
      try {
        const url = new URL(window.location.href);
        const token = url.searchParams.get('token_hash');
        const type = url.searchParams.get('type'); // 'signup' など

        if (!token || !type) {
          setMessage('トークンまたは type がありません。認証に失敗しました。');
          console.error('トークンまたは type がありません');
          return;
        }

        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: type as
            | 'signup'
            | 'magiclink'
            | 'recovery'
            | 'invite'
            | 'email_change',
        });

        if (error) {
          setMessage(`認証エラー: ${error.message}`);
          console.error('検証エラー:', error.message);
        } else {
          // 検証に成功したらサクセスページへ
          setMessage('認証に成功しました。リダイレクトします...');
          router.push('/signup/success');
        }
      } catch (err) {
        setMessage('認証処理中にエラーが発生しました。');
        console.error('認証処理エラー:', err);
      }
    };

    handleVerification();
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="mx-auto max-w-md space-y-6 rounded-lg border bg-card p-6 shadow-sm text-center">
        <h1 className="text-2xl font-bold">メール認証</h1>
        <p>{message}</p>
      </div>
    </div>
  );
}
