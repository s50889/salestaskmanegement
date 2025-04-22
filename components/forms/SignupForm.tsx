"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

export default function SignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // パスワードの確認
    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      setLoading(false);
      return;
    }

    try {
      // Supabaseでユーザー登録
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
          data: {
            name: name,
            full_name: name, // 代替フィールドとして追加
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      // ユーザーが作成されたらサインアップ成功ページにリダイレクト
      if (data.user) {
        // 明示的にユーザーメタデータを更新
        try {
          const { error: updateError } = await supabase.auth.updateUser({
            data: { 
              name: name,
              full_name: name,
            }
          });
          
          if (updateError) {
            console.error('ユーザーメタデータ更新エラー:', updateError);
          }
        } catch (err) {
          console.error('ユーザーメタデータ更新中にエラーが発生しました:', err);
        }
        
        // 営業担当者情報を登録（本来はトリガーで行うか管理者が行う）
        try {
          const { error: profileError } = await supabase
            .from('sales_reps')
            .insert([
              {
                user_id: data.user.id,
                name: name,
                email: email,
                role: 'sales_rep'
              }
            ]);
          
          if (profileError) {
            console.error('プロフィール作成エラー:', profileError);
          }
        } catch (err) {
          console.error('プロフィール作成中にエラーが発生しました:', err);
        }
        
        router.push('/signup/success');
      }
    } catch (error: any) {
      let errorMessage = 'サインアップに失敗しました。';
      
      if (error.message) {
        // エラーメッセージの日本語化
        if (error.message.includes('Email already registered')) {
          errorMessage = 'このメールアドレスは既に登録されています。';
        } else if (error.message.includes('Password should be at least')) {
          errorMessage = 'パスワードは最低8文字以上必要です。';
        } else if (error.message.includes('Unable to validate email address')) {
          errorMessage = 'メールアドレスの形式が正しくありません。';
        } else {
          errorMessage = `${errorMessage} ${error.message}`;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6 rounded-lg border bg-card p-6 shadow-sm">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">アカウント作成</h1>
        <p className="text-muted-foreground">営業タスク管理システムへようこそ</p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSignup} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">
            氏名
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="山田 太郎"
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            メールアドレス
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="example@company.com"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            パスワード
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="••••••••"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium">
            パスワード（確認）
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:pointer-events-none disabled:opacity-50"
        >
          {loading ? '処理中...' : 'アカウント作成'}
        </button>
      </form>

      <div className="text-center text-sm">
        <p>
          すでにアカウントをお持ちの方は{' '}
          <Link href="/" className="text-primary hover:underline">
            ログイン
          </Link>
          {' '}してください
        </p>
      </div>
    </div>
  );
}
