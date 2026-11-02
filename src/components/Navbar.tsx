import React from 'react';
import { Sparkles, Moon, Sun, Flame, Award, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { user, darkMode, toggleDarkMode } = useAuth();
  const { stats } = useData();

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/80 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div
          onClick={() => setActiveTab('dashboard')}
          className="flex cursor-pointer items-center space-x-3 transition-opacity hover:opacity-90"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <span className="font-extrabold tracking-tight text-zinc-900 dark:text-white text-lg">
              StudyQuest
            </span>
            <span className="ml-1.5 hidden rounded-md bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 sm:inline-block">
              Học tập & AI
            </span>
          </div>
        </div>

        {/* Quick Gamification Chips & Controls */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {user && (
            <>
              {/* Streak Badge */}
              <div
                title="Chuỗi ngày học liên tục"
                className="flex items-center space-x-1.5 rounded-full bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-600 border border-orange-200/60 dark:bg-orange-500/15 dark:text-orange-400 dark:border-orange-900/40"
              >
                <Flame className="h-4 w-4 fill-orange-500 text-orange-500 animate-pulse" />
                <span>{stats.streakDays} ngày</span>
              </div>

              {/* Level Badge */}
              <div
                title="Cấp độ hiện tại"
                className="flex items-center space-x-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-600 border border-indigo-200/60 dark:bg-indigo-500/15 dark:text-indigo-400 dark:border-indigo-900/40"
              >
                <Award className="h-4 w-4 text-indigo-500" />
                <span>Lv.{stats.level}</span>
              </div>
            </>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggleDarkMode}
            title={darkMode ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Settings button */}
          {user && (
            <button
              onClick={() => setActiveTab('settings')}
              title="Cài đặt & Dữ liệu"
              className={`flex h-9 w-9 items-center justify-center rounded-xl border transition ${
                activeTab === 'settings'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-600 dark:border-indigo-500 dark:bg-indigo-950/50 dark:text-indigo-400'
                  : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'
              }`}
            >
              <SettingsIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
