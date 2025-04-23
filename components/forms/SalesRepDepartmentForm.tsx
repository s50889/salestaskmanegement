'use client';

import { useState, useEffect } from 'react';
import { SalesRep, Department } from '@/types';
import { getDepartments, updateSalesRepDepartment } from '@/lib/supabase/api';

interface SalesRepDepartmentFormProps {
  salesRep: SalesRep;
  onUpdate?: () => void;
}

export default function SalesRepDepartmentForm({ salesRep, onUpdate }: SalesRepDepartmentFormProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>(salesRep.department_id || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 部署データの取得
  useEffect(() => {
    async function fetchDepartments() {
      try {
        const deptData = await getDepartments();
        setDepartments(deptData);
      } catch (err) {
        console.error('部署データ取得エラー:', err);
        setError('部署データの取得に失敗しました');
      }
    }

    fetchDepartments();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDepartmentId) {
      setError('部署を選択してください');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // 営業担当者の部署を更新
      const updated = await updateSalesRepDepartment(salesRep.id, selectedDepartmentId);
      
      if (updated) {
        setSuccess(true);
        // 成功メッセージを数秒後に消す
        setTimeout(() => setSuccess(false), 3000);
        
        // 親コンポーネントの更新関数を呼び出し
        if (onUpdate) onUpdate();
      } else {
        throw new Error('部署の更新に失敗しました');
      }
    } catch (err) {
      console.error('部署更新エラー:', err);
      setError('部署の更新中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-md bg-card">
      <h3 className="text-lg font-medium">部署設定</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="department" className="block text-sm font-medium mb-1">
            部署
          </label>
          <select
            id="department"
            className="w-full p-2 border rounded-md"
            value={selectedDepartmentId}
            onChange={(e) => setSelectedDepartmentId(e.target.value)}
            disabled={loading}
          >
            <option value="">-- 部署を選択 --</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
            disabled={loading}
          >
            {loading ? '更新中...' : '保存する'}
          </button>
        </div>
        
        {error && (
          <div className="p-3 bg-destructive/10 border-destructive/20 border rounded-md text-destructive text-sm">
            {error}
          </div>
        )}
        
        {success && (
          <div className="p-3 bg-green-100 border-green-200 border rounded-md text-green-800 text-sm">
            部署情報が正常に更新されました
          </div>
        )}
      </form>
    </div>
  );
}
