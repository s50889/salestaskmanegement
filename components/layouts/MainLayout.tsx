"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

type MainLayoutProps = {
  children: React.ReactNode;
};

export default function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showSidebar, setShowSidebar] = useState<boolean>(false);
  
  // ユーザー情報を取得
  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // ユーザーメタデータから名前を取得、なければメールアドレスを表示
        setUserName(user.user_metadata?.name || user.email || 'ユーザー');
      } else {
        // 未ログインの場合はログインページにリダイレクト
        router.push('/');
      }
    };
    
    fetchUserData();
  }, [router]);
  
  // ログアウト処理
  const handleLogout = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      // ログアウト成功後、ログインページにリダイレクト
      router.push('/');
    } catch (error) {
      console.error('ログアウトエラー:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // ナビゲーションリンクのアクティブ状態を確認するヘルパー関数
  const isActive = (path: string) => {
    return pathname?.startsWith(path) ? 'bg-primary/10 text-primary' : 'text-muted-foreground';
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* サイド領域のトリガーエリア - マウスが入ると表示 */}
      <div 
        className="fixed left-0 top-0 z-30 h-full w-5 cursor-pointer" 
        onMouseEnter={() => setShowSidebar(true)}
      />

      {/* サイドナビゲーション */}
      <aside 
        className={`fixed left-0 top-0 z-20 h-full w-64 transform border-r bg-card px-4 py-6 transition-transform duration-300 ease-in-out ${
          showSidebar ? 'translate-x-0' : '-translate-x-full'
        }`}
        onMouseLeave={() => setShowSidebar(false)}
      >
        <div className="mb-6">
          <h1 className="text-2xl font-bold">営業タスク管理</h1>
        </div>
        
        <nav className="space-y-1">
          <Link 
            href="/dashboard" 
            className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${isActive('/dashboard')}`}
          >
            <span className="mr-2">📊</span>
            ダッシュボード
          </Link>
          
          <Link 
            href="/customers" 
            className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${isActive('/customers')}`}
          >
            <span className="mr-2">👥</span>
            顧客管理
          </Link>
          
          <Link 
            href="/deals" 
            className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${isActive('/deals')}`}
          >
            <span className="mr-2">💼</span>
            案件管理
          </Link>
          
          <Link 
            href="/activities" 
            className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${isActive('/activities')}`}
          >
            <span className="mr-2">📝</span>
            活動ログ
          </Link>
          
          <Link 
            href="/settings" 
            className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${isActive('/settings')}`}
          >
            <span className="mr-2">⚙️</span>
            設定
          </Link>
          
          <Link 
            href="/sales-reps" 
            className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${isActive('/sales-reps')}`}
          >
            <span className="mr-2">👨‍💼</span>
            担当者別案件状況
          </Link>
          
          <Link 
            href="/departments" 
            className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${isActive('/departments')}`}
          >
            <span className="mr-2">🏢</span>
            部署別案件状況
          </Link>

          <Link 
            href="/performance" 
            className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${isActive('/performance')}`}
          >
            <span className="mr-2">📈</span>
            営業成績一覧
          </Link>

          <Link 
            href="/profile" 
            className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${isActive('/profile')}`}
          >
            <span className="mr-2">👤</span>
            プロフィール
          </Link>
        </nav>
      </aside>
      
      {/* メインコンテンツ */}
      <main className="flex flex-1 flex-col">
        {/* ヘッダー */}
        <header className="sticky top-0 z-10 border-b bg-card px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">営業タスク管理</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                ログイン中: <span className="font-medium">{userName}</span>
              </div>
              <button 
                onClick={handleLogout}
                disabled={loading}
                className="rounded-md bg-primary px-3 py-1 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? 'ログアウト中...' : 'ログアウト'}
              </button>
            </div>
          </div>
        </header>
        
        {/* コンテンツエリア */}
        <div className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
