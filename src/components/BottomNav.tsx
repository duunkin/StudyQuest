import React from 'react';
import { LayoutDashboard, CheckSquare, Sparkles, Calendar } from 'lucide-react';
import { useData } from '../context/DataContext';
import { getTodayDateVN } from '../lib/dateUtils';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const { tasks } = useData();
  const today = getTodayDateVN();

  const pendingTodayCount = tasks.filter(
    (t) => t.plannedDate === today && t.status === 'pending'
  ).length;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Tổng quan',
      icon: LayoutDashboard,
    },
    {
      id: 'tasks',
      label: 'Nhiệm vụ',
      icon: CheckSquare,
      badge: pendingTodayCount > 0 ? pendingTodayCount : null,
    },
    {
      id: 'ai-sync',
      label: 'AI Sync',
      icon: Sparkles,
      highlight: true,
    },
    {
      id: 'milestones',
      label: 'Mốc thi',
      icon: Calendar,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-zinc-200/90 bg-white/95 px-2 py-1.5 backdrop-blur-lg dark:border-zinc-800/90 dark:bg-zinc-950/95 md:hidden">
      <div className="mx-auto flex max-w-md items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`h-5 w-5 transition-transform ${
                    isActive ? 'scale-110' : ''
                  } ${item.highlight && isActive ? 'text-indigo-500' : ''}`}
                />
                {item.badge !== null && item.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="mt-1 text-[11px] leading-tight tracking-tight">
                {item.label}
              </span>
              {isActive && (
                <span className="absolute -bottom-1 h-1 w-5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
