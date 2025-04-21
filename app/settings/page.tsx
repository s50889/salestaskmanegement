'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layouts/MainLayout';
import { getUser } from '@/lib/supabase/client';
import { getSalesReps, updateSalesRepRole } from '@/lib/supabase/api';
import { SalesRep } from '@/types';

export default function SettingsPage() {
  const router = useRouter();
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // ユーザー情報の取得
        const user = await getUser();
        if (!user) {
          // 未ログインの場合はログインページにリダイレクト
          router.push('/');
          return;
        }
        setCurrentUser(user);
        
        // 営業担当者の一覧を取得
        const reps = await getSalesReps();
        setSalesReps(reps);
        
        // 現在のユーザーが管理者かどうかを確認
        const currentRep = reps.find(rep => rep.user_id === user.id);
        setIsAdmin(currentRep?.role === 'admin');
      } catch (error) {
        console.error('データ取得エラー:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [router]);

  // 権限を変更する関数
  const handleRoleChange = async (repId: string, newRole: 'sales_rep' | 'manager' | 'admin') => {
    try {
      setLoading(true);
      const success = await updateSalesRepRole(repId, newRole);
      
      if (success) {
        // 成功メッセージを表示
        setMessage({ text: '権限を更新しました', type: 'success' });
        
        // 営業担当者の一覧を再取得
        const updatedReps = await getSalesReps();
        setSalesReps(updatedReps);
      } else {
        setMessage({ text: '権限の更新に失敗しました', type: 'error' });
      }
    } catch (error) {
      console.error('権限更新エラー:', error);
      setMessage({ text: 'エラーが発生しました', type: 'error' });
    } finally {
      setLoading(false);
      
      // 3秒後にメッセージを消す
      setTimeout(() => {
        setMessage(null);
      }, 3000);
    }
  };

  // 権限の日本語表示
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return '管理者';
      case 'manager':
        return 'マネージャー';
      case 'sales_rep':
        return '営業担当';
      default:
        return role;
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">設定</h1>
        
        {message && (
          <div className={`rounded-md p-4 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message.text}
          </div>
        )}
        
        {loading ? (
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <p className="text-muted-foreground">読み込み中...</p>
          </div>
        ) : !isAdmin ? (
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <p className="text-muted-foreground">この機能を使用するには管理者権限が必要です。</p>
          </div>
        ) : (
          <>
            {/* ユーザー管理セクション */}
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">ユーザー管理</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left text-sm font-medium">名前</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">メールアドレス</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">現在の権限</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">権限変更</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesReps.map(rep => (
                      <tr key={rep.id} className="border-b">
                        <td className="px-4 py-3 text-sm">{rep.name}</td>
                        <td className="px-4 py-3 text-sm">{rep.email}</td>
                        <td className="px-4 py-3 text-sm">{getRoleLabel(rep.role)}</td>
                        <td className="px-4 py-3 text-sm">
                          <select
                            className="rounded-md border border-input bg-background px-3 py-1 text-sm"
                            value={rep.role}
                            onChange={(e) => handleRoleChange(rep.id, e.target.value as 'sales_rep' | 'manager' | 'admin')}
                            disabled={loading || rep.user_id === currentUser?.id} // 自分自身の権限は変更できないように
                          >
                            <option value="sales_rep">営業担当</option>
                            <option value="manager">マネージャー</option>
                            <option value="admin">管理者</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* システム設定セクション */}
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">システム設定</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-md font-medium mb-2">アプリケーション情報</h3>
                  <div className="rounded-md bg-muted/30 p-4">
                    <p className="text-sm">アプリケーション名: 営業タスク管理システム</p>
                    <p className="text-sm">バージョン: 1.0.0</p>
                    <p className="text-sm">最終更新日: 2025年4月21日</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-md font-medium mb-2">データベース接続</h3>
                  <div className="rounded-md bg-green-100 p-4">
                    <p className="text-sm text-green-800">接続状態: 正常</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
