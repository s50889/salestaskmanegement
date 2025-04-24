'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layouts/MainLayout';
import { getUser, updatePassword } from '@/lib/supabase/client';
import { 
  getSalesRepByUserId, 
  updateSalesRep, 
  getDepartments, 
  getDepartmentGroups,
  getSalesRepGroup,
  assignSalesRepToGroup,
  removeSalesRepFromGroup
} from '@/lib/supabase/api';
import { SalesRep, Department, DepartmentGroup, SalesRepGroup } from '@/types';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentGroups, setDepartmentGroups] = useState<DepartmentGroup[]>([]);
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('none');
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [profileData, setProfileData] = useState<{
    id: string;
    name: string;
    email: string;
    department_id: string | undefined;
  }>({
    id: '',
    name: '',
    email: '',
    department_id: undefined,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // パスワード変更関連のステート
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        // ユーザー情報の取得
        const user = await getUser();
        if (!user) {
          // 未ログインの場合はログインページにリダイレクト
          router.push('/');
          return;
        }

        // 部署データの取得
        const departmentsData = await getDepartments();
        setDepartments(departmentsData);

        // ユーザーIDから営業担当者情報を取得
        const salesRep = await getSalesRepByUserId(user.id);
        if (salesRep) {
          setProfileData({
            id: salesRep.id,
            name: salesRep.name,
            email: salesRep.email,
            department_id: salesRep.department_id,
          });
          
          // 営業担当者の所属グループを取得
          if (salesRep.department_id) {
            // 部署のグループ一覧を取得
            const groupsData = await getDepartmentGroups(salesRep.department_id);
            setDepartmentGroups(groupsData);
            
            // 現在のグループ割り当てを取得
            const salesRepGroup = await getSalesRepGroup(salesRep.id);
            if (salesRepGroup) {
              setCurrentGroupId(salesRepGroup.department_group_id);
              setSelectedGroupId(salesRepGroup.department_group_id);
            } else {
              setCurrentGroupId(null);
              setSelectedGroupId('none');
            }
          }
        } else {
          setError('プロフィール情報の取得に失敗しました');
        }
      } catch (err) {
        console.error('プロフィール取得エラー:', err);
        setError('プロフィール情報の取得中にエラーが発生しました');
      } finally {
        setLoading(false);
      }
    }

    fetchUserProfile();
  }, [router]);
  
  // 部署変更時にグループ一覧を更新
  useEffect(() => {
    async function fetchDepartmentGroups() {
      if (!profileData.department_id) {
        setDepartmentGroups([]);
        setCurrentGroupId(null);
        setSelectedGroupId('none');
        return;
      }
      
      try {
        setLoadingGroups(true);
        // 部署のグループ一覧を取得
        const groupsData = await getDepartmentGroups(profileData.department_id);
        setDepartmentGroups(groupsData);
        
        // 現在のグループ割り当てを取得
        const salesRepGroup = await getSalesRepGroup(profileData.id);
        if (salesRepGroup) {
          // 現在の部署のグループかどうかを確認
          const groupExists = groupsData.some(g => g.id === salesRepGroup.department_group_id);
          if (groupExists) {
            setCurrentGroupId(salesRepGroup.department_group_id);
            setSelectedGroupId(salesRepGroup.department_group_id);
          } else {
            // 部署が変わった場合、グループ割り当ては解除
            setCurrentGroupId(null);
            setSelectedGroupId('none');
          }
        } else {
          setCurrentGroupId(null);
          setSelectedGroupId('none');
        }
      } catch (err) {
        console.error('グループデータ取得エラー:', err);
      } finally {
        setLoadingGroups(false);
      }
    }
    
    fetchDepartmentGroups();
  }, [profileData.department_id, profileData.id]);
  
  // グループ割り当て処理
  const handleGroupAssignment = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      let result;
      
      if (selectedGroupId === 'none') {
        // グループから削除（無所属にする）
        result = await removeSalesRepFromGroup(profileData.id);
      } else {
        // グループに割り当て
        result = await assignSalesRepToGroup(profileData.id, selectedGroupId);
      }
      
      if (result) {
        setSuccess('プロフィールとグループ割り当てを更新しました');
        setCurrentGroupId(selectedGroupId === 'none' ? null : selectedGroupId);
      } else {
        setError('グループ割り当ての更新に失敗しました');
      }
    } catch (err) {
      console.error('グループ割り当てエラー:', err);
      setError('グループ割り当て処理中にエラーが発生しました');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // プロフィール情報を更新
      const result = await updateSalesRep(profileData.id, {
        name: profileData.name,
        department_id: profileData.department_id || undefined,
      });

      if (result) {
        setSuccess('プロフィールを更新しました');
      } else {
        setError('プロフィールの更新に失敗しました');
      }
    } catch (err) {
      console.error('プロフィール更新エラー:', err);
      setError('プロフィール更新中にエラーが発生しました');
    } finally {
      setSaving(false);
    }
  };

  // パスワードフォームの入力変更ハンドラ
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // パスワード更新のサブミットハンドラ
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);
    
    // パスワード確認チェック
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('新しいパスワードと確認用パスワードが一致しません');
      return;
    }
    
    // パスワードの複雑さをチェック
    if (passwordData.newPassword.length < 8) {
      setPasswordError('パスワードは8文字以上である必要があります');
      return;
    }
    
    setSavingPassword(true);
    
    try {
      // パスワード更新APIを呼び出す
      const result = await updatePassword(passwordData.newPassword);
      
      if (result.success) {
        setPasswordSuccess('パスワードが正常に更新されました');
        // フォームをリセット
        setPasswordData({
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        setPasswordError(result.error || 'パスワードの更新に失敗しました');
      }
    } catch (err) {
      console.error('パスワード更新エラー:', err);
      setPasswordError('パスワード更新中にエラーが発生しました');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">プロフィール設定</h1>
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <p className="text-muted-foreground">読み込み中...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">プロフィール設定</h1>

        {error && (
          <div className="rounded-lg border bg-destructive/10 p-4 text-destructive">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg border bg-green-100 p-4 text-green-800">
            {success}
          </div>
        )}

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                名前
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={profileData.name}
                onChange={handleChange}
                className="w-full rounded-md border p-2"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                メールアドレス
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={profileData.email}
                className="w-full rounded-md border p-2 bg-gray-50"
                disabled
              />
              <p className="text-xs text-muted-foreground mt-1">
                メールアドレスは認証情報のため変更できません
              </p>
            </div>

            <div>
              <label htmlFor="department_id" className="block text-sm font-medium mb-1">
                部署
              </label>
              <select
                id="department_id"
                name="department_id"
                value={profileData.department_id}
                onChange={handleChange}
                className="w-full rounded-md border p-2"
              >
                <option value="">選択してください</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
            
            {profileData.department_id && profileData.department_id === 'cc22f892-b2e1-425d-8472-385bacbc9da8' && departmentGroups.length > 0 && (
              <div>
                <label htmlFor="group_id" className="block text-sm font-medium mb-1">
                  グループ
                </label>
                <select
                  id="group_id"
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="w-full rounded-md border p-2"
                  disabled={loadingGroups}
                >
                  <option value="none">無所属</option>
                  {departmentGroups.map(group => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
                {currentGroupId !== selectedGroupId && (
                  <div className="mt-2">
                    <button
                      type="button"
                      className="rounded-md bg-blue-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-600"
                      onClick={handleGroupAssignment}
                      disabled={saving || loadingGroups}
                    >
                      {saving ? 'グループ更新中...' : 'グループを更新'}
                    </button>
                  </div>
                )}
              </div>
            )}
            
            <div className="pt-4">
              <button
                type="submit"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                disabled={saving}
              >
                {saving ? '保存中...' : '変更を保存'}
              </button>
            </div>
          </form>
        </div>

        {/* パスワード変更セクション */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">パスワード変更</h2>
          
          {passwordError && (
            <div className="rounded-lg border bg-destructive/10 p-4 mb-4 text-destructive">
              {passwordError}
            </div>
          )}

          {passwordSuccess && (
            <div className="rounded-lg border bg-green-100 p-4 mb-4 text-green-800">
              {passwordSuccess}
            </div>
          )}
          
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium mb-1">
                新しいパスワード
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                className="w-full rounded-md border p-2"
                required
                minLength={8}
              />
              <p className="text-xs text-muted-foreground mt-1">
                パスワードは8文字以上にしてください
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
                新しいパスワード (確認)
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                className="w-full rounded-md border p-2"
                required
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                disabled={savingPassword}
              >
                {savingPassword ? 'パスワード更新中...' : 'パスワードを更新'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}
