'use client';

import { useEffect, useState } from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import { getDepartmentPerformance } from '@/lib/supabase/api';
import { DepartmentPerformance } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Link from 'next/link';

// グラフの色設定
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function DepartmentCompare() {
  const [departments, setDepartments] = useState<DepartmentPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartView, setChartView] = useState<'revenue' | 'profit' | 'deals' | 'inprogress_deals' | 'inprogress_amount'>('revenue');

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const departmentData = await getDepartmentPerformance();
        setDepartments(departmentData);
      } catch (error) {
        console.error('部署データ取得エラー:', error);
        setError('データの取得中にエラーが発生しました');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // 円グラフ用データの準備（売上シェア）
  const prepareRevenueShareData = () => {
    // 受注済み案件の売上総額
    return departments.map(dept => ({
      name: dept.name,
      value: dept.wonAmount
    }));
  };

  // 棒グラフ用データの準備（各部署の収益・粗利）
  const prepareBarChartData = () => {
    return departments.map(dept => ({
      name: dept.name,
      売上: dept.wonAmount,
      商談中金額: dept.inProgressAmount,
      粗利: dept.totalProfit,
      案件数: dept.wonDeals,
      商談中: dept.inProgressDeals
    }));
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">部署パフォーマンス比較</h1>
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <p className="text-muted-foreground">データを読み込み中...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">部署パフォーマンス比較</h1>
          <div className="rounded-lg border bg-destructive/10 p-6 shadow-sm">
            <p className="text-destructive">{error}</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const revenueShareData = prepareRevenueShareData();
  const barChartData = prepareBarChartData();

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">部署パフォーマンス比較</h1>
          <div className="flex gap-2">
            <Link 
              href="/departments" 
              className="rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/90"
            >
              一覧に戻る
            </Link>
          </div>
        </div>

        {departments.length === 0 ? (
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <p className="text-muted-foreground">表示するデータがありません</p>
          </div>
        ) : (
          <>
            {/* グラフ表示切替タブ */}
            <div className="flex border-b mb-4">
              <button
                onClick={() => setChartView('revenue')}
                className={`px-4 py-2 ${chartView === 'revenue' ? 'border-b-2 border-primary font-medium' : ''}`}
              >
                売上比較
              </button>
              <button
                onClick={() => setChartView('profit')}
                className={`px-4 py-2 ${chartView === 'profit' ? 'border-b-2 border-primary font-medium' : ''}`}
              >
                粗利比較
              </button>
              <button
                onClick={() => setChartView('deals')}
                className={`px-4 py-2 ${chartView === 'deals' ? 'border-b-2 border-primary font-medium' : ''}`}
              >
                案件数比較
              </button>
              <button
                onClick={() => setChartView('inprogress_deals')}
                className={`px-4 py-2 ${chartView === 'inprogress_deals' ? 'border-b-2 border-primary font-medium' : ''}`}
              >
                商談中案件数比較
              </button>
              <button
                onClick={() => setChartView('inprogress_amount')}
                className={`px-4 py-2 ${chartView === 'inprogress_amount' ? 'border-b-2 border-primary font-medium' : ''}`}
              >
                商談中金額比較
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 棒グラフ */}
              <div className="rounded-lg border bg-card p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4">
                  {chartView === 'revenue' 
                    ? '部署別売上' 
                    : chartView === 'profit' 
                      ? '部署別粗利' 
                      : chartView === 'deals' 
                        ? '部署別案件数' 
                        : chartView === 'inprogress_deals' 
                          ? '部署別商談中案件数' 
                          : '部署別商談中金額'}
                </h2>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={barChartData}
                      margin={{ top: 20, right: 30, left: 30, bottom: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45} 
                        textAnchor="end" 
                        height={60} 
                      />
                      <YAxis
                        tickFormatter={(value) => 
                          chartView === 'deals' || chartView === 'inprogress_deals' 
                            ? value.toString() 
                            : formatCurrency(value).replace('¥', '').replace(',', '')
                        }
                      />
                      <Tooltip
                        formatter={(value) => 
                          chartView === 'deals' || chartView === 'inprogress_deals'
                            ? [value + ' 件', chartView === 'deals' ? '案件数' : '商談中案件数']
                            : [formatCurrency(value as number), chartView === 'revenue' ? '売上' : '粗利']
                        }
                      />
                      <Legend />
                      {chartView === 'revenue' && (
                        <Bar dataKey="売上" fill="#0088FE" />
                      )}
                      {chartView === 'profit' && (
                        <Bar dataKey="粗利" fill="#00C49F" />
                      )}
                      {chartView === 'deals' && (
                        <Bar dataKey="案件数" fill="#FFBB28" />
                      )}
                      {chartView === 'inprogress_deals' && (
                        <Bar dataKey="商談中" fill="#FF8042" />
                      )}
                      {chartView === 'inprogress_amount' && (
                        <Bar dataKey="商談中金額" fill="#8884d8" />
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 円グラフ（シェア） */}
              <div className="rounded-lg border bg-card p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4">
                  {chartView === 'revenue' 
                    ? '売上シェア' 
                    : chartView === 'profit' 
                      ? '粗利シェア' 
                      : chartView === 'deals' 
                        ? '案件数シェア' 
                        : chartView === 'inprogress_deals' 
                          ? '商談中案件数シェア' 
                          : '商談中金額シェア'}
                </h2>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={departments.map(dept => ({
                          name: dept.name,
                          value: chartView === 'revenue' 
                            ? dept.wonAmount 
                            : chartView === 'profit' 
                              ? dept.totalProfit 
                              : chartView === 'deals' 
                                ? dept.wonDeals 
                                : chartView === 'inprogress_deals' 
                                  ? dept.inProgressDeals 
                                  : dept.inProgressAmount
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={150}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={(entry) => `${entry.name} (${chartView === 'deals' || chartView === 'inprogress_deals' ? entry.value + '件' : formatCurrency(entry.value)})`}
                      >
                        {departments.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => 
                          chartView === 'deals' || chartView === 'inprogress_deals'
                            ? [value + ' 件', chartView === 'deals' ? '案件数' : '商談中案件数']
                            : [formatCurrency(value as number), chartView === 'revenue' ? '売上' : '粗利']
                        }
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 詳細データ一覧表 */}
              <div className="col-span-1 lg:col-span-2 rounded-lg border bg-card p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4">部署パフォーマンスデータ</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="py-3 px-2 text-left">部署名</th>
                        <th className="py-3 px-2 text-right">担当者数</th>
                        <th className="py-3 px-2 text-right">総案件数</th>
                        <th className="py-3 px-2 text-right">受注数</th>
                        <th className="py-3 px-2 text-right">商談中</th>
                        <th className="py-3 px-2 text-right">失注数</th>
                        <th className="py-3 px-2 text-right">受注額</th>
                        <th className="py-3 px-2 text-right">商談中金額</th>
                        <th className="py-3 px-2 text-right">粗利</th>
                      </tr>
                    </thead>
                    <tbody>
                      {departments.map((dept) => (
                        <tr key={dept.departmentId} className="border-b hover:bg-muted/50">
                          <td className="py-2 px-2 font-medium">{dept.name}</td>
                          <td className="py-2 px-2 text-right">{dept.memberCount}名</td>
                          <td className="py-2 px-2 text-right">{dept.totalDeals}件</td>
                          <td className="py-2 px-2 text-right">{dept.wonDeals}件</td>
                          <td className="py-2 px-2 text-right">{dept.inProgressDeals}件</td>
                          <td className="py-2 px-2 text-right">{dept.lostDeals}件</td>
                          <td className="py-2 px-2 text-right">{formatCurrency(dept.wonAmount)}</td>
                          <td className="py-2 px-2 text-right">{formatCurrency(dept.inProgressAmount)}</td>
                          <td className="py-2 px-2 text-right">{formatCurrency(dept.totalProfit)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
