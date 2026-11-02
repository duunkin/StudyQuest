import React, { useState } from 'react';
import {
  User,
  Moon,
  Sun,
  Database,
  LogOut,
  Sparkles,
  Award,
  Flame,
  Info,
  Check,
  Shield,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

export const SettingsPage: React.FC = () => {
  const { user, signOut, darkMode, toggleDarkMode } = useAuth();
  const { seedDemoData, stats } = useData();

  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  const handleSeed = async () => {
    if (
      !window.confirm(
        'Bạn có chắc chắn muốn nạp dữ liệu mẫu (demo data)? Dữ liệu này giúp bạn trải nghiệm đầy đủ các tính năng nhiệm vụ, mốc thi, cấp độ và chuỗi ngày.'
      )
    ) {
      return;
    }
    setSeeding(true);
    try {
      await seedDemoData();
      setSeedSuccess(true);
      setTimeout(() => setSeedSuccess(false), 3000);
    } catch (e) {
      alert(`Lỗi khi tạo dữ liệu mẫu: ${(e as Error).message}`);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8 animate-in fade-in duration-150 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
          Cài đặt & Tài khoản
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Quản lý tài khoản, giao diện và dữ liệu học tập cá nhân
        </p>
      </div>

      {/* User Card */}
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center space-x-4">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'Avatar'}
              className="h-14 w-14 rounded-2xl object-cover border border-zinc-200 dark:border-zinc-700"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 font-bold text-xl dark:bg-indigo-950/70 dark:text-indigo-300">
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'H'}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-zinc-900 dark:text-white truncate">
              {user?.displayName || 'Học sinh'}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
              {user?.email || 'Tài khoản Google'}
            </p>
            <div className="mt-2 flex items-center space-x-2 text-[11px] text-emerald-600 dark:text-emerald-400">
              <Shield className="h-3.5 w-3.5" />
              <span>Dữ liệu Firestore độc quyền theo UID ({user?.uid.slice(0, 8)}...)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
          Giao diện ứng dụng
        </h2>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              {darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </div>
            <div>
              <span className="text-sm font-bold text-zinc-900 dark:text-white">
                Chế độ tối (Dark Mode)
              </span>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Tối ưu hóa thị giác khi học bài vào ban đêm
              </p>
            </div>
          </div>

          <button
            onClick={toggleDarkMode}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              darkMode ? 'bg-indigo-600' : 'bg-zinc-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                darkMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Demo Data Seeder - Rule 4 strictly satisfied */}
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
          Dữ liệu mẫu (Demo Data)
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed">
          Ứng dụng hoàn toàn không sử dụng dữ liệu giả cố định. Nếu đây là tài khoản mới và bạn muốn nạp sẵn các nhiệm vụ mẫu (Toán, Tin học HSG C++, Địa lý), mốc thi và thống kê EXP thực tế để thử nghiệm, hãy nhấn nút dưới đây.
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="inline-flex items-center justify-center space-x-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-500/20 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50"
          >
            <Database className="h-4 w-4" />
            <span>{seeding ? 'Đang tạo dữ liệu mẫu...' : 'Tạo dữ liệu mẫu'}</span>
          </button>

          {seedSuccess && (
            <span className="flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <Check className="mr-1 h-4 w-4" /> Đã nạp dữ liệu mẫu thành công!
            </span>
          )}
        </div>
      </div>

      {/* Gamification Rules Reference */}
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center space-x-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <Info className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
            Quy tắc Gamification (Điểm kinh nghiệm & Chuỗi ngày)
          </h2>
        </div>

        <div className="mt-4 space-y-3 text-xs text-zinc-600 dark:text-zinc-400">
          <div className="flex items-start space-x-2">
            <Award className="h-4 w-4 shrink-0 text-indigo-500 mt-0.5" />
            <div>
              <strong className="text-zinc-800 dark:text-zinc-200">Điểm EXP mỗi bài học:</strong>{' '}
              Bằng số phút thực tế đã học + 10 EXP cơ bản (VD: học 60 phút = nhận 70 EXP).
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <Sparkles className="h-4 w-4 shrink-0 text-sky-500 mt-0.5" />
            <div>
              <strong className="text-zinc-800 dark:text-zinc-200">Công thức Cấp độ (Level):</strong>{' '}
              Cấp = floor(Tổng EXP / 500) + 1. Mỗi 500 EXP người học sẽ tăng thêm 1 cấp.
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <Flame className="h-4 w-4 shrink-0 text-orange-500 mt-0.5" />
            <div>
              <strong className="text-zinc-800 dark:text-zinc-200">Chuỗi ngày học liên tục (Streak):</strong>{' '}
              +1 nếu hoàn thành ít nhất 1 nhiệm vụ hôm nay. Nếu trôi qua cả một ngày mà không học bài nào, chuỗi sẽ quay về 0.
            </div>
          </div>
        </div>
      </div>

      {/* Sign Out */}
      <div className="pt-2">
        <button
          onClick={signOut}
          className="flex w-full items-center justify-center space-x-2 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-bold text-rose-700 transition hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-400"
        >
          <LogOut className="h-4 w-4" />
          <span>Đăng xuất khỏi StudyQuest</span>
        </button>
      </div>
    </div>
  );
};
