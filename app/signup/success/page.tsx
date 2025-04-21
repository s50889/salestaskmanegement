import Link from 'next/link';

export default function SignupSuccessPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="mx-auto max-w-md space-y-6 rounded-lg border bg-card p-6 shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">登録完了</h1>
          <p className="text-muted-foreground">アカウントが正常に作成されました</p>
        </div>
        
        <div className="rounded-md bg-green-50 p-4 text-center text-green-800">
          <p className="mb-2">ご登録いただきありがとうございます。</p>
          <p className="text-sm">確認メールをお送りしました。メールのリンクをクリックして登録を完了してください。</p>
        </div>
        
        <div className="flex justify-center">
          <Link 
            href="/"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            ログインページへ
          </Link>
        </div>
      </div>
    </div>
  );
}
