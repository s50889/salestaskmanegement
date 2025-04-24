'use client';

import React from 'react';
import ModernLayout from '@/components/layouts/ModernLayout';

export default function ModernTestPage() {
  return (
    <ModernLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">モダンレイアウトのテスト</h1>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <p className="text-muted-foreground">これは新しいモダンレイアウトのテストページです。</p>
        </div>
      </div>
    </ModernLayout>
  );
}
