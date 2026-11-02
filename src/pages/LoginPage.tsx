import React, { useState } from 'react';
import { Sparkles, Flame, CheckCircle, Shield, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error(err);
      setError('Đăng nhập bằng Google không thành công. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-zinc-200/80 bg-white/90 p-8 shadow-xl backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-900/90">
        {/* Brand Hero */}
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 text-white shadow-lg shadow-indigo-500/25">
            <Sparkles className="h-8 w-8" />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            StudyQuest
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            Ứng dụng theo dõi học tập cá nhân & đồng bộ kế hoạch cùng AI
          </p>
        </div>

        {/* Value props */}
        <div className="mt-6 space-y-3 rounded-2xl bg-zinc-50/80 p-4 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800/60">
          <div className="flex items-center space-x-3 text-xs text-zinc-700 dark:text-zinc-300">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400">
              <Flame className="h-3.5 w-3.5 fill-orange-500" />
            </div>
            <span>Duy trì chuỗi ngày học liên tục và tích lũy EXP lên cấp</span>
          </div>

          <div className="flex items-center space-x-3 text-xs text-zinc-700 dark:text-zinc-300">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <span>Đồng bộ 1 chạm báo cáo ngày & kế hoạch tối ưu cùng Gemini</span>
          </div>

          <div className="flex items-center space-x-3 text-xs text-zinc-700 dark:text-zinc-300">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <Shield className="h-3.5 w-3.5" />
            </div>
            <span>Bảo mật tuyệt đối: Mỗi học sinh chỉ truy cập dữ liệu của chính mình</span>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Google Sign-in button */}
        <div className="mt-8">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex w-full items-center justify-center space-x-3 rounded-2xl border border-zinc-300 bg-white px-5 py-3.5 text-sm font-bold text-zinc-800 shadow-sm transition-all hover:bg-zinc-50 hover:shadow-md active:scale-[0.99] disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-750"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            ) : (
              <>
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Đăng nhập với Google</span>
              </>
            )}
          </button>
        </div>

        <p className="mt-6 text-center text-[11px] text-zinc-400">
          Chỉ cần 1 tài khoản Google cá nhân. Dữ liệu được bảo vệ an toàn bởi Google Firebase Firestore.
        </p>
      </div>
    </div>
  );
};
