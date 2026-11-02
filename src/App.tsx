/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { TasksPage } from './pages/TasksPage';
import { MilestonesPage } from './pages/MilestonesPage';
import { AiSyncPage } from './pages/AiSyncPage';
import { SettingsPage } from './pages/SettingsPage';
import { TaskModal } from './components/TaskModal';
import { StudyTask } from './lib/schemas';
import { LayoutDashboard, CheckSquare, Sparkles, Calendar, Plus } from 'lucide-react';

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const { addTask, updateTask } = useData();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<StudyTask | null>(null);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent shadow-md" />
          <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
            Đang khởi động StudyQuest...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900 text-zinc-900 dark:text-zinc-100">
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
        <LoginPage />
      </div>
    );
  }

  const handleOpenAddTask = () => {
    setEditingTask(null);
    setTaskModalOpen(true);
  };

  const handleEditTask = (task: StudyTask) => {
    setEditingTask(task);
    setTaskModalOpen(true);
  };

  const handleSaveTask = async (
    taskData: Omit<StudyTask, 'id' | 'createdAt' | 'syncStatus'>
  ) => {
    if (editingTask) {
      await updateTask(editingTask.id, taskData);
    } else {
      await addTask(taskData);
    }
  };

  const desktopTabs = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'tasks', label: 'Nhiệm vụ', icon: CheckSquare },
    { id: 'ai-sync', label: 'AI Sync', icon: Sparkles, highlight: true },
    { id: 'milestones', label: 'Mốc thi', icon: Calendar },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Desktop Navigation Tabs */}
      <div className="hidden md:block border-b border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-6xl items-center space-x-2 px-6">
          {desktopTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center space-x-2 border-b-2 py-3.5 px-3 text-sm font-bold transition ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                    : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                <Icon className={`h-4 w-4 ${tab.highlight ? 'text-indigo-500' : ''}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 pt-5 sm:px-6">
        {activeTab === 'dashboard' && (
          <DashboardPage
            setActiveTab={setActiveTab}
            onOpenAddTask={handleOpenAddTask}
          />
        )}
        {activeTab === 'tasks' && (
          <TasksPage
            onOpenAddTask={handleOpenAddTask}
            onEditTask={handleEditTask}
          />
        )}
        {activeTab === 'ai-sync' && <AiSyncPage setActiveTab={setActiveTab} />}
        {activeTab === 'milestones' && <MilestonesPage />}
        {activeTab === 'settings' && <SettingsPage />}
      </main>

      {/* Mobile Floating Add Task Button (when on tasks or dashboard) */}
      {(activeTab === 'tasks' || activeTab === 'dashboard') && (
        <button
          onClick={handleOpenAddTask}
          title="Thêm nhiệm vụ mới"
          className="md:hidden fixed bottom-18 right-4 z-40 flex h-13 w-13 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xl shadow-indigo-600/40 active:scale-95 transition-transform"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      {/* Mobile Sticky Bottom Nav */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Shared Task Modal */}
      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onSave={handleSaveTask}
        initialTask={editingTask}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  );
}
