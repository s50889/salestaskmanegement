'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function TestDbSetupPage() {
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [displayName, setDisplayName] = useState<string>('');

  const createSalesRep = async () => {
    setIsLoading(true);
    setStatus('営業担当者データ作成中...');
    setError(null);

    try {
      // 現在のユーザーのsales_repsデータを作成
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session) {
        const userId = sessionData.session.user.id;
        const userEmail = sessionData.session.user.email;
        
        // ユーザーのメタデータから名前を取得
        const { data: userData } = await supabase.auth.getUser();
        // メタデータから名前を取得、なければメールアドレスのユーザー部分を使用
        const userName = userData?.user?.user_metadata?.name || userEmail?.split('@')[0] || 'ユーザー';
        
        // 基本データ（roleを追加）
        const salesRepData = {
          user_id: userId,
          name: userName,
          email: userEmail,
          role: 'sales_rep' // デフォルトロールを設定
        };
        
        const { error: insertError } = await supabase
          .from('sales_reps')
          .upsert([salesRepData], { onConflict: 'user_id' });
        
        if (insertError) {
          throw new Error(`営業担当者データ作成エラー: ${insertError.message}`);
        }
        
        setStatus(prev => prev + '\n営業担当者データを作成しました');
        setStatus(prev => prev + `\nユーザーID: ${userId}`);
        setStatus(prev => prev + `\n担当者名: ${userName}`);
        setStatus(prev => prev + `\nメール: ${userEmail}`);
        setStatus(prev => prev + `\nロール: sales_rep`);
      } else {
        throw new Error('ログインしていないため、営業担当者データを作成できませんでした');
      }

      setStatus(prev => prev + '\n\n完了しました！');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus(prev => prev + '\n\nエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">営業担当者データ作成</h1>
      
      <div className="mb-6 p-4 border rounded-md bg-yellow-50">
        <h2 className="text-lg font-medium mb-2">手順</h2>
        <p className="mb-4">
          1. Supabaseダッシュボードで必要なテーブルとRLSポリシーを作成してください。<br />
          2. 下のボタンをクリックして、現在ログインしているユーザーの営業担当者データを作成します。
        </p>
        <button
          onClick={createSalesRep}
          disabled={isLoading}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? '作成中...' : '営業担当者データを作成'}
        </button>
      </div>
      
      {status && (
        <div className="mb-6 p-4 border rounded-md">
          <h2 className="text-lg font-medium mb-2">ステータス</h2>
          <pre className="p-2 bg-gray-100 rounded whitespace-pre-wrap">
            {status}
          </pre>
        </div>
      )}
      
      {error && (
        <div className="mb-6 p-4 border rounded-md bg-red-50">
          <h2 className="text-lg font-medium mb-2">エラー</h2>
          <pre className="p-2 bg-red-100 rounded text-red-800 whitespace-pre-wrap">
            {error}
          </pre>
        </div>
      )}
      
      <div className="p-4 border rounded-md bg-blue-50">
        <h2 className="text-lg font-medium mb-2">次のステップ</h2>
        <p className="mb-2">セットアップが完了したら、以下のリンクからアプリケーションをテストできます：</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><a href="/test-env" className="text-blue-600 hover:underline">環境テスト</a></li>
          <li><a href="/customers" className="text-blue-600 hover:underline">顧客一覧</a></li>
          <li><a href="/dashboard" className="text-blue-600 hover:underline">ダッシュボード</a></li>
        </ul>
      </div>
    </div>
  );
}
