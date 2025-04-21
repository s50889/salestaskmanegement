import Link from 'next/link';
import { getCustomerById, getSalesRepById, getDeals } from '@/lib/supabase/api';
import MainLayout from '@/components/layouts/MainLayout';
import { notFound } from 'next/navigation';

type Props = {
  params: {
    id: string;
  };
};

export default async function CustomerDetailPage({ params }: Props) {
  // 顧客データを取得
  const customer = await getCustomerById(params.id);
  
  // 顧客が見つからない場合は404ページを表示
  if (!customer) {
    notFound();
  }
  
  // 担当者と案件のデータを取得
  const [salesRep, allDeals] = await Promise.all([
    getSalesRepById(customer.sales_rep_id),
    getDeals()
  ]);
  
  // この顧客に関連する案件をフィルタリング
  const customerDeals = allDeals.filter(deal => deal.customer_id === customer.id);
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{customer.name}</h1>
          <div className="flex gap-2">
            <Link
              href={`/customers/${customer.id}/edit`}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              編集
            </Link>
            <Link
              href="/customers"
              className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              一覧に戻る
            </Link>
          </div>
        </div>
        
        {/* 顧客情報 */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-xl font-medium">基本情報</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm font-medium text-muted-foreground">業種</div>
                <div className="col-span-2">{customer.industry || '-'}</div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm font-medium text-muted-foreground">電話番号</div>
                <div className="col-span-2">{customer.phone || '-'}</div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm font-medium text-muted-foreground">メールアドレス</div>
                <div className="col-span-2">{customer.email || '-'}</div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm font-medium text-muted-foreground">住所</div>
                <div className="col-span-2">{customer.address || '-'}</div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm font-medium text-muted-foreground">担当者</div>
                <div className="col-span-2">{salesRep?.name || '-'}</div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm font-medium text-muted-foreground">登録日</div>
                <div className="col-span-2">{new Date(customer.created_at).toLocaleDateString('ja-JP')}</div>
              </div>
            </div>
          </div>
          
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-medium">案件</h2>
              <Link
                href={`/deals/new?customer_id=${customer.id}`}
                className="text-sm text-primary hover:underline"
              >
                新規案件を追加
              </Link>
            </div>
            
            {customerDeals.length > 0 ? (
              <div className="space-y-4">
                {customerDeals.map(deal => (
                  <div key={deal.id} className="rounded-md border p-4">
                    <div className="mb-2 flex items-start justify-between">
                      <Link
                        href={`/deals/${deal.id}`}
                        className="text-lg font-medium hover:underline"
                      >
                        {deal.name}
                      </Link>
                      <div className="flex items-center">
                        {deal.status === 'negotiation' && (
                          <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                            商談中
                          </span>
                        )}
                        {deal.status === 'proposal' && (
                          <span className="rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-800">
                            提案中
                          </span>
                        )}
                        {deal.status === 'quotation' && (
                          <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                            見積提出
                          </span>
                        )}
                        {deal.status === 'final_negotiation' && (
                          <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800">
                            最終交渉
                          </span>
                        )}
                        {deal.status === 'won' && (
                          <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                            受注
                          </span>
                        )}
                        {deal.status === 'lost' && (
                          <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                            失注
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mb-2 text-sm">
                      {deal.description ? (
                        <p className="text-muted-foreground">{deal.description}</p>
                      ) : (
                        <p className="text-muted-foreground">詳細情報がありません</p>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="font-medium">
                        {deal.amount.toLocaleString('ja-JP')} 円
                      </div>
                      <div className="text-muted-foreground">
                        最終更新: {new Date(deal.updated_at).toLocaleDateString('ja-JP')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md bg-muted p-4 text-center text-sm text-muted-foreground">
                この顧客に関連する案件はまだありません
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
