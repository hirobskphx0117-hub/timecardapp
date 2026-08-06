import LoginForm from "./login-form";

export default function AdminLoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-[linear-gradient(180deg,#f5f4f1_0%,#ece9e3_100%)] px-4 py-16 dark:bg-[linear-gradient(180deg,#141417_0%,#0d0d10_100%)]">
      <div className="w-full max-w-sm">
        <header className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-black/90 dark:text-white/90">
            管理者ログイン
          </h1>
        </header>
        <LoginForm />
      </div>
    </div>
  );
}
