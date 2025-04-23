'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layouts/MainLayout';
import { getUser } from '@/lib/supabase/client';
import { getSalesReps, deleteUser } from '@/lib/supabase/api';
import { SalesRep } from '@/types';
import Link from 'next/link';

export default function UserManagementPage() {
  const [users, setUsers] = useState<SalesRep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const router = useRouter();

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
        
        // 営業担当者の一覧を取得
        const reps = await getSalesReps();
        
        // 現在のユーザーが管理者かどうかを確認
        const currentRep = reps.find(rep => rep.user_id === user.id);
        
        if (currentRep?.role !== 'admin') {
          setError('管理者のみがアクセスできるページです');
          setIsAdmin(false);
          setLoading(false);
          return;
        }
        
        setIsAdmin(true);
        setUsers(reps);
      } catch (error) {
        console.error('データ取得エラー:', error);
        setError('データの取得中にエラーが発生しました');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [router]);

  const handleDeleteConfirm = (userId: string) => {
    setDeleteConfirm(userId);
  };

  const handleCancelDelete = () => {
    setDeleteConfirm(null);
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      setDeleteLoading(true);
      const result = await deleteUser(userId);
      
      if (result) {
        // ユーザーリストを更新
        setUsers((prevUsers) => prevUsers.filter(user => user.id !== userId));
        setDeleteConfirm(null);
      } else {
        setError('ユーザーの削除に失敗しました');
      }
    } catch (error) {
      console.error('ユーザー削除エラー:', error);
      setError('ユーザーの削除中にエラーが発生しました');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">ユーザー管理</h1>
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <p className="text-muted-foreground">データを読み込み中...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !isAdmin) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">ユーザー管理</h1>
          <div className="rounded-lg border bg-destructive/10 p-6 shadow-sm">
            <p className="text-destructive">{error || '権限エラー: このページにアクセスする権限がありません'}</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">ユーザー管理</h1>
          <Link
            href="/signup"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            新規ユーザー登録
          </Link>
        </div>
        
        {users.length === 0 ? (
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <p className="text-muted-foreground">ユーザーが登録されていません</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border bg-card shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="py-3 px-4 text-left font-medium">名前</th>
                  <th className="py-3 px-4 text-left font-medium">メールアドレス</th>
                  <th className="py-3 px-4 text-left font-medium">役割</th>
                  <th className="py-3 px-4 text-center font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-muted/30">
                    <td className="py-3 px-4">
                      <Link href={`/sales-reps/${user.id}`} className="font-medium hover:text-primary">
                        {user.name}
                      </Link>
                    </td>
                    <td className="py-3 px-4">{user.email}</td>
                    <td className="py-3 px-4">
                      {user.role === 'admin' 
                        ? '管理者' 
                        : user.role === 'manager' 
                          ? 'マネージャー' 
                          : '営業担当者'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {deleteConfirm === user.id ? (
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-xs bg-destructive px-2 py-1 rounded text-destructive-foreground"
                            disabled={deleteLoading}
                          >
                            {deleteLoading ? '削除中...' : '確定'}
                          </button>
                          <button
                            onClick={handleCancelDelete}
                            className="text-xs bg-secondary px-2 py-1 rounded text-secondary-foreground"
                            disabled={deleteLoading}
                          >
                            キャンセル
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <Link
                            href={`/sales-reps/${user.id}`}
                            className="text-xs bg-primary/10 px-2 py-1 rounded text-primary hover:bg-primary/20"
                          >
                            詳細
                          </Link>
                          <button
                            onClick={() => handleDeleteConfirm(user.id)}
                            className="text-xs bg-destructive/10 px-2 py-1 rounded text-destructive hover:bg-destructive/20"
                          >
                            削除
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="rounded-lg border bg-amber-50 p-4 shadow-sm">
          <h2 className="text-lg font-medium text-amber-800 mb-2">注意事項</h2>
          <p className="text-sm text-amber-700">
            ユーザーを削除すると、そのユーザーに紐づくすべての情報（顧客、案件、活動ログなど）も削除されます。
            この操作は元に戻すことができません。
          </p>
          <p className="text-sm text-amber-700 mt-2">
            <strong>注意:</strong> Supabaseの認証ユーザー自体は管理画面から削除する必要があります。
            このページでの削除はアプリケーションデータのみを対象としています。
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
