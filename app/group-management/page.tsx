'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layouts/MainLayout';
import { getUser } from '@/lib/supabase/client';
import { 
  getDepartments, 
  getSalesRepsByDepartment, 
  getDepartmentGroups,
  getSalesRepGroup,
  assignSalesRepToGroup,
  removeSalesRepFromGroup,
  getSalesRepsByDepartmentWithGroup
} from '@/lib/supabase/api';
import { Department, DepartmentGroup, SalesRep, SalesRepWithGroup } from '@/types';

export default function GroupManagementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [departmentGroups, setDepartmentGroups] = useState<DepartmentGroup[]>([]);
  const [salesReps, setSalesReps] = useState<SalesRepWithGroup[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 初期データの読み込み
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

        // 部署一覧を取得
        const departmentsData = await getDepartments();
        setDepartments(departmentsData);
        
        // 第一営業部を探す
        const firstSalesDept = departmentsData.find(dept => dept.name === '第一営業部');
        if (firstSalesDept) {
          setSelectedDepartment(firstSalesDept.id);
        }
      } catch (error) {
        console.error('データ取得エラー:', error);
        setError('データの取得中にエラーが発生しました');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [router]);

  // 部署選択時の処理
  useEffect(() => {
    async function fetchDepartmentData() {
      if (!selectedDepartment) return;
      
      try {
        setLoading(true);
        
        // 部署のグループ一覧を取得
        const groupsData = await getDepartmentGroups(selectedDepartment);
        setDepartmentGroups(groupsData);
        
        // 部署の営業担当者一覧をグループ情報付きで取得
        const repsData = await getSalesRepsByDepartmentWithGroup(selectedDepartment);
        setSalesReps(repsData);
      } catch (error) {
        console.error('部署データ取得エラー:', error);
        setError('部署データの取得中にエラーが発生しました');
      } finally {
        setLoading(false);
      }
    }
    
    fetchDepartmentData();
  }, [selectedDepartment]);

  // グループ割り当て処理
  const handleGroupAssignment = async (salesRepId: string, groupId: string) => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);
      
      let success;
      if (groupId === 'none') {
        // グループから削除（無所属にする）
        success = await removeSalesRepFromGroup(salesRepId);
      } else {
        // グループに割り当て
        success = await assignSalesRepToGroup(salesRepId, groupId);
      }
      
      if (success) {
        setSuccessMessage('グループ割り当てが更新されました');
        
        // データを再取得
        const repsData = await getSalesRepsByDepartmentWithGroup(selectedDepartment);
        setSalesReps(repsData);
      } else {
        setError('グループ割り当ての更新に失敗しました');
      }
    } catch (error) {
      console.error('グループ割り当てエラー:', error);
      setError('グループ割り当て処理中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !salesReps.length) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">グループ管理</h1>
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <p className="text-muted-foreground">データを読み込み中...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">グループ管理</h1>
        
        {error && (
          <div className="rounded-lg border bg-destructive/10 p-4 shadow-sm">
            <p className="text-destructive">{error}</p>
          </div>
        )}
        
        {successMessage && (
          <div className="rounded-lg border bg-green-100 p-4 shadow-sm">
            <p className="text-green-800">{successMessage}</p>
          </div>
        )}
        
        {/* 部署選択 */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">部署選択</label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
                disabled={loading}
              >
                <option value="">部署を選択してください</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {/* 営業担当者一覧とグループ割り当て */}
        {selectedDepartment && (
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">
              {departments.find(d => d.id === selectedDepartment)?.name || ''} - グループ割り当て
            </h2>
            
            {salesReps.length === 0 ? (
              <p className="text-muted-foreground">この部署に所属する営業担当者はいません</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="px-4 py-2 text-left border">担当者名</th>
                      <th className="px-4 py-2 text-left border">メールアドレス</th>
                      <th className="px-4 py-2 text-left border">現在のグループ</th>
                      <th className="px-4 py-2 text-left border">グループ割り当て</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesReps.map((rep) => (
                      <tr key={rep.id} className="border-t">
                        <td className="px-4 py-2 border">{rep.name}</td>
                        <td className="px-4 py-2 border">{rep.email}</td>
                        <td className="px-4 py-2 border">
                          {rep.group ? rep.group.name : '無所属'}
                        </td>
                        <td className="px-4 py-2 border">
                          <select
                            className="w-full px-2 py-1 border rounded-md bg-background text-sm"
                            value={rep.group?.id || 'none'}
                            onChange={(e) => handleGroupAssignment(rep.id, e.target.value)}
                            disabled={loading}
                          >
                            <option value="none">無所属</option>
                            {departmentGroups.map((group) => (
                              <option key={group.id} value={group.id}>
                                {group.name}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
