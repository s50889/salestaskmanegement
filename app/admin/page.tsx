import { redirect } from 'next/navigation';
import MainLayout from '@/components/layouts/MainLayout';
import PerformanceReport from '@/components/admin/PerformanceReport';
import { checkAdminAccess, getSalesPerformance } from '@/lib/supabase/adminApi';

export default async function AdminReportPage() {
  // 管理者権限チェック
  const isAdmin = await checkAdminAccess();
  
  // 管理者でない場合はダッシュボードにリダイレクト
  if (!isAdmin) {
    redirect('/dashboard');
  }
  
  // 初期データとして1ヶ月間の実績データを取得
  const initialData = await getSalesPerformance('month');
  
  return (
    <MainLayout>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">管理者ページ</h1>
        
        <div className="rounded-lg border bg-card p-6">
          <PerformanceReport initialData={initialData} />
        </div>
      </div>
    </MainLayout>
  );
}
