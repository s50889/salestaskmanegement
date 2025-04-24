"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Home, 
  Users, 
  Briefcase, 
  FileText, 
  Settings, 
  User, 
  LogOut, 
  Menu, 
  ChevronRight, 
  BarChart3, 
  Building2,
  PanelLeft
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

type ModernLayoutProps = {
  children: React.ReactNode;
};

// ナビゲーションアイテムの型定義
type NavItem = {
  href: string;
  icon: React.ReactNode;
  label: string;
};

// ナビゲーションアイテムコンポーネント
const NavItem = ({ 
  href, 
  icon, 
  label, 
  isActive, 
  isCollapsed 
}: { 
  href: string; 
  icon: React.ReactNode; 
  label: string; 
  isActive: boolean; 
  isCollapsed: boolean;
}) => {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      )}
    >
      <div className="flex h-5 w-5 items-center justify-center">
        {icon}
      </div>
      {!isCollapsed && <span>{label}</span>}
    </Link>
  );
};

export default function ModernLayout({ children }: ModernLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // レスポンシブ対応
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

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

  // ナビゲーションアイテムの定義
  const navItems: NavItem[] = [
    {
      href: "/dashboard",
      icon: <Home className="h-4 w-4" />,
      label: "ダッシュボード",
    },
    {
      href: "/customers",
      icon: <Users className="h-4 w-4" />,
      label: "顧客管理",
    },
    {
      href: "/deals",
      icon: <Briefcase className="h-4 w-4" />,
      label: "案件管理",
    },
    {
      href: "/activities",
      icon: <FileText className="h-4 w-4" />,
      label: "活動ログ",
    },
    {
      href: "/sales-reps",
      icon: <User className="h-4 w-4" />,
      label: "担当者別案件状況",
    },
    {
      href: "/departments",
      icon: <Building2 className="h-4 w-4" />,
      label: "部署別案件状況",
    },
    {
      href: "/performance",
      icon: <BarChart3 className="h-4 w-4" />,
      label: "営業成績一覧",
    },
    {
      href: "/settings",
      icon: <Settings className="h-4 w-4" />,
      label: "設定",
    },
    {
      href: "/profile",
      icon: <User className="h-4 w-4" />,
      label: "プロフィール",
    },
  ];

  // ナビゲーションリンクのアクティブ状態を確認するヘルパー関数
  const isActive = (path: string) => {
    return pathname?.startsWith(path);
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* モバイル用サイドバー */}
      {isMobile && (
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="fixed left-4 top-4 z-50 md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">メニューを開く</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[240px] p-0">
            <div className="flex h-full flex-col">
              <div className="flex h-14 items-center border-b px-4">
                <h2 className="text-lg font-semibold">営業タスク管理</h2>
              </div>
              <nav className="flex-1 space-y-1 overflow-auto p-2">
                {navItems.map((item) => (
                  <NavItem
                    key={item.href}
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                    isActive={isActive(item.href)}
                    isCollapsed={false}
                  />
                ))}
              </nav>
              <div className="border-t p-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="flex-1 truncate">
                    <p className="text-sm font-medium">{userName}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex h-auto items-center gap-1 p-0 text-xs text-muted-foreground hover:text-destructive"
                      onClick={handleLogout}
                      disabled={loading}
                    >
                      <LogOut className="h-3 w-3" />
                      {loading ? 'ログアウト中...' : 'ログアウト'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* デスクトップ用サイドバー */}
      {!isMobile && (
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-20 flex flex-col border-r bg-card transition-all duration-300",
            isCollapsed ? "w-[70px]" : "w-[240px]"
          )}
        >
          <div className="flex h-14 items-center justify-between border-b px-4">
            {!isCollapsed && (
              <h2 className="text-lg font-semibold">営業タスク管理</h2>
            )}
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8", isCollapsed && "mx-auto")}
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              <PanelLeft className="h-4 w-4" />
              <span className="sr-only">
                {isCollapsed ? "メニューを展開" : "メニューを折りたたむ"}
              </span>
            </Button>
          </div>
          <nav className="flex-1 space-y-1 overflow-auto p-2">
            {navItems.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                isActive={isActive(item.href)}
                isCollapsed={isCollapsed}
              />
            ))}
          </nav>
          <div className="border-t p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User className="h-4 w-4" />
              </div>
              {!isCollapsed && (
                <div className="flex-1 truncate">
                  <p className="text-sm font-medium">{userName}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex h-auto items-center gap-1 p-0 text-xs text-muted-foreground hover:text-destructive"
                    onClick={handleLogout}
                    disabled={loading}
                  >
                    <LogOut className="h-3 w-3" />
                    {loading ? 'ログアウト中...' : 'ログアウト'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* メインコンテンツ */}
      <div
        className={cn(
          "flex flex-1 flex-col",
          isMobile ? "ml-0" : isCollapsed ? "ml-[70px]" : "ml-[240px]"
        )}
      >
        {/* ヘッダー */}
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-card px-4 shadow-sm">
          <div className="flex items-center gap-2">
            {isMobile ? (
              <h1 className="text-lg font-semibold">営業タスク管理</h1>
            ) : (
              <h1 className="text-lg font-semibold">
                {navItems.find((item) => isActive(item.href))?.label || "営業タスク管理"}
              </h1>
            )}
          </div>

          {/* ユーザーメニュー */}
          <div className="flex items-center gap-2">
            <div className="hidden md:flex md:items-center md:gap-2">
              <span className="text-sm text-muted-foreground">{userName}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={handleLogout}
              disabled={loading}
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {loading ? 'ログアウト中...' : 'ログアウト'}
              </span>
            </Button>
          </div>
        </header>

        {/* メインコンテンツエリア */}
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
