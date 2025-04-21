'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function TestEnvPage() {
  const [supabaseUrl, setSupabaseUrl] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<string>('確認中...');
  const [error, setError] = useState<string | null>(null);
  const [customersExists, setCustomersExists] = useState<boolean | null>(null);
  const [authStatus, setAuthStatus] = useState<string>('確認中...');
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    // 環境変数の値を表示
    setSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || '未設定');

    // Supabaseへの接続テスト
    const testConnection = async () => {
      try {
        // 認証状態を確認
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session) {
          setAuthStatus(`認証済み (${sessionData.session.user.email})`);
        } else {
          setAuthStatus('未認証');
        }

        // customersテーブルの存在確認
        try {
          const { error: customersError } = await supabase
            .from('customers')
            .select('id')
            .limit(1);
          
          if (customersError && customersError.code === '42P01') {
            // テーブルが存在しない場合のエラーコード
            setCustomersExists(false);
          } else {
            setCustomersExists(true);
          }
        } catch (err) {
          console.error('customers テーブル確認エラー:', err);
          setCustomersExists(false);
        }

        // デバッグ情報の取得
        const debugResult = [];
        
        // RLSポリシーの確認
        try {
          const { data: policies, error: policiesError } = await supabase
            .rpc('get_policies_for_table', { table_name: 'customers' });
          
          if (policiesError) {
            debugResult.push(`RLSポリシー確認エラー: ${JSON.stringify(policiesError)}`);
          } else {
            debugResult.push(`RLSポリシー: ${policies ? policies.length : 0}件`);
          }
        } catch (err) {
          debugResult.push(`RLSポリシー確認例外: ${err instanceof Error ? err.message : String(err)}`);
        }
        
        // 単純なクエリを実行してみる（詳細なエラー情報を取得）
        try {
          const response = await supabase
            .from('customers')
            .select('*', { count: 'exact', head: true });
          
          const { data, error, count, status, statusText } = response;
          
          debugResult.push(`ステータス: ${status} ${statusText}`);
          debugResult.push(`カウント: ${count !== null ? count : 'null'}`);
          
          if (error) {
            setConnectionStatus('接続エラー');
            setError(JSON.stringify(error, null, 2));
            debugResult.push(`エラーコード: ${error.code}`);
            debugResult.push(`エラー詳細: ${error.details || 'なし'}`);
            debugResult.push(`エラーヒント: ${error.hint || 'なし'}`);
          } else {
            setConnectionStatus('接続成功');
          }
        } catch (err) {
          setConnectionStatus('接続エラー');
          setError(err instanceof Error ? err.message : '不明なエラー');
          debugResult.push(`例外: ${err instanceof Error ? err.message : String(err)}`);
        }
        
        setDebugInfo(debugResult.join('\n'));
        
      } catch (err) {
        setConnectionStatus('接続エラー');
        setError(err instanceof Error ? err.message : '不明なエラー');
      }
    };

    testConnection();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">環境変数テスト</h1>
      
      <div className="mb-6 p-4 border rounded-md">
        <h2 className="text-lg font-medium mb-2">Supabase URL</h2>
        <code className="block p-2 bg-gray-100 rounded">{supabaseUrl}</code>
      </div>

      <div className="mb-6 p-4 border rounded-md">
        <h2 className="text-lg font-medium mb-2">認証状態</h2>
        <div className={`p-2 rounded ${
          authStatus.includes('認証済み') ? 'bg-green-100 text-green-800' : 
          'bg-yellow-100 text-yellow-800'
        }`}>
          {authStatus}
        </div>
      </div>
      
      <div className="mb-6 p-4 border rounded-md">
        <h2 className="text-lg font-medium mb-2">customersテーブル</h2>
        <div className={`p-2 rounded ${
          customersExists === true ? 'bg-green-100 text-green-800' : 
          customersExists === false ? 'bg-red-100 text-red-800' : 
          'bg-yellow-100 text-yellow-800'
        }`}>
          {customersExists === true ? 'テーブルが存在します' : 
           customersExists === false ? 'テーブルが存在しません' : 
           '確認中...'}
        </div>
      </div>
      
      <div className="mb-6 p-4 border rounded-md">
        <h2 className="text-lg font-medium mb-2">接続ステータス</h2>
        <div className={`p-2 rounded ${
          connectionStatus === '接続成功' ? 'bg-green-100 text-green-800' : 
          connectionStatus === '接続エラー' ? 'bg-red-100 text-red-800' : 
          'bg-yellow-100 text-yellow-800'
        }`}>
          {connectionStatus}
        </div>
        
        {error && (
          <div className="mt-4">
            <h3 className="font-medium mb-1">エラー詳細:</h3>
            <pre className="p-2 bg-red-50 text-red-800 rounded overflow-auto text-sm">
              {error}
            </pre>
          </div>
        )}
      </div>
      
      <div className="mb-6 p-4 border rounded-md">
        <h2 className="text-lg font-medium mb-2">デバッグ情報</h2>
        <pre className="p-2 bg-gray-100 rounded overflow-auto text-sm">
          {debugInfo || 'デバッグ情報がありません'}
        </pre>
      </div>
      
      <div className="p-4 border rounded-md bg-blue-50">
        <h2 className="text-lg font-medium mb-2">トラブルシューティング</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>環境変数が正しく設定されているか確認してください</li>
          <li>サーバーを再起動してみてください（<code>npm run dev</code>）</li>
          <li>Supabaseのダッシュボードでテーブルが作成されているか確認してください</li>
          <li>RLS（行レベルセキュリティ）ポリシーが適切に設定されているか確認してください</li>
          <li>ログインしていない場合は、ログインしてから再試行してください</li>
        </ul>
      </div>
    </div>
  );
}
