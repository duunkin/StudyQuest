import React, { useState } from 'react';
import {
  Flame,
  Award,
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  AlertCircle,
  Check,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { getTodayDateVN, getTomorrowDateVN, getDaysDifference, formatVNDate } from '../lib/dateUtils';
import { getLevelProgress } from '../lib/gamification';
import { SUBJECT_LABELS, SUBJECT_COLORS, StudyTask } from '../lib/schemas';
import { CompleteTaskModal } from '../components/CompleteTaskModal';
import { ReasonMissedModal } from '../components/ReasonMissedModal';

interface DashboardPageProps {
  setActiveTab: (tab: string) => void;
  onOpenAddTask: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  setActiveTab,
  onOpenAddTask,
}) => {
  const { tasks, milestones, stats, latestAiInsight, completeTask, recordReasonMissed } = useData();

  const [completingTask, setCompletingTask] = useState<StudyTask | null>(null);
  const [reasonTask, setReasonTask] = useState<StudyTask | null>(null);

  const today = getTodayDateVN();
  const tomorrow = getTomorrowDateVN();

  const todayTasks = tasks.filter((t) => t.plannedDate === today);
  const tomorrowTasks = tasks.filter((t) => t.plannedDate === tomorrow);

  const todayDoneCount = todayTasks.filter((t) => t.status === 'done').length;
  const todayTotalCount = todayTasks.length;
  const todayProgressPercent =
    todayTotalCount > 0 ? Math.round((todayDoneCount / todayTotalCount) * 100) : 0;

  const levelProgress = getLevelProgress(stats.totalExp);

  // Upcoming milestones (sorted by date)
  const upcomingMilestones = [...milestones]
    .map((m) => ({
      ...m,
      daysLeft: getDaysDifference(m.date, today),
    }))
    .filter((m) => m.daysLeft >= 0)
    .slice(0, 3);

  const handleConfirmComplete = async (durationMins: number) => {
    if (!completingTask) return;
    await completeTask(completingTask.id, durationMins);
    setCompletingTask(null);
  };

  const handleSaveReason = async (reason: string) => {
    if (!reasonTask) return;
    await recordReasonMissed(reasonTask.id, reason);
    setReasonTask(null);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8 animate-in fade-in duration-150">
      {/* 1. Gamification Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 p-6 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 h-48 w-48 rounded-full bg-sky-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Level and EXP status */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center rounded-lg bg-indigo-500/30 px-2.5 py-1 text-xs font-bold text-indigo-200 border border-indigo-400/30 backdrop-blur-sm">
                <Award className="mr-1 h-3.5 w-3.5 text-indigo-300" /> Cấp độ {levelProgress.currentLevel}
              </span>
              <span className="text-xs text-indigo-200/80">
                Tổng tích lũy: {stats.totalExp.toLocaleString()} EXP
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-indigo-100">
                <span>Tiến độ lên Cấp {levelProgress.currentLevel + 1}</span>
                <span>
                  {levelProgress.expInCurrentLevel} / {levelProgress.expForNextLevel} EXP ({levelProgress.progressPercent}%)
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-indigo-950/60 p-0.5 border border-indigo-700/50">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-400 via-indigo-400 to-emerald-400 transition-all duration-500 ease-out shadow-sm"
                  style={{ width: `${levelProgress.progressPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-indigo-300/80">
                Chỉ còn {levelProgress.expRemaining} EXP nữa để thăng cấp tiếp theo!
              </p>
            </div>
          </div>

          {/* Streak Card */}
          <div className="flex items-center justify-between rounded-2xl bg-white/10 p-4 backdrop-blur-md border border-white/10 md:justify-center md:flex-col md:text-center md:space-y-1">
            <div className="flex items-center space-x-3 md:flex-col md:space-x-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 text-white shadow-lg shadow-orange-500/30">
                <Flame className="h-7 w-7 fill-white" />
              </div>
              <div className="md:mt-2">
                <div className="text-2xl font-black tracking-tight">{stats.streakDays} Ngày</div>
                <div className="text-xs text-orange-200 font-medium">Chuỗi học tập liên tục</div>
              </div>
            </div>
            <div className="text-right text-[11px] text-indigo-200 md:text-center md:mt-2">
              {stats.streakDays > 0 ? 'Tuyệt vời! Tiếp tục giữ lửa nhé!' : 'Hoàn thành 1 bài học hôm nay để bắt đầu chuỗi!'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Latest AI Insight (if available) */}
      {latestAiInsight ? (
        <div className="relative rounded-2xl border border-indigo-200/80 bg-gradient-to-r from-indigo-50/70 via-sky-50/50 to-white p-5 shadow-sm dark:border-indigo-900/40 dark:from-indigo-950/30 dark:via-zinc-900 dark:to-zinc-900">
          <div className="flex items-start space-x-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Phân tích học tập từ Gemini
                </h3>
                <button
                  onClick={() => setActiveTab('ai-sync')}
                  className="flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                >
                  <span>AI Sync</span>
                  <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                </button>
              </div>
              <p className="mt-1 text-sm font-medium leading-relaxed text-zinc-800 dark:text-zinc-200">
                "{latestAiInsight}"
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/30">
          <div className="flex items-center space-x-3">
            <Sparkles className="h-5 w-5 text-indigo-500" />
            <div className="text-xs text-zinc-600 dark:text-zinc-400">
              Chưa có phân tích AI. Hãy xuất báo cáo và dán kế hoạch từ Gemini để nhận gợi ý tối ưu.
            </div>
          </div>
          <button
            onClick={() => setActiveTab('ai-sync')}
            className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700"
          >
            Mở AI Sync
          </button>
        </div>
      )}

      {/* 3. Upcoming Milestones Countdown Widget */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
              Mốc thi & Deadline sắp tới
            </h3>
          </div>
          <button
            onClick={() => setActiveTab('milestones')}
            className="flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
          >
            <span>Tất cả</span>
            <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
          </button>
        </div>

        {upcomingMilestones.length === 0 ? (
          <div className="py-6 text-center text-xs text-zinc-400">
            Chưa có mốc thi nào sắp tới.{' '}
            <button
              onClick={() => setActiveTab('milestones')}
              className="text-indigo-600 dark:text-indigo-400 underline font-semibold"
            >
              Thêm mốc thi ngay
            </button>
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {upcomingMilestones.map((m) => {
              const isUrgent = m.daysLeft <= 3;
              const isToday = m.daysLeft === 0;

              return (
                <div
                  key={m.id}
                  className={`flex flex-col justify-between rounded-xl p-3 border transition-all ${
                    isToday
                      ? 'border-rose-300 bg-rose-50/70 dark:border-rose-900/60 dark:bg-rose-950/20'
                      : isUrgent
                      ? 'border-amber-300 bg-amber-50/60 dark:border-amber-900/60 dark:bg-amber-950/20'
                      : 'border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-950/40'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {formatVNDate(m.date)}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                          isToday
                            ? 'bg-rose-500 text-white animate-pulse'
                            : isUrgent
                            ? 'bg-amber-500 text-white'
                            : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                        }`}
                      >
                        {isToday ? 'HÔM NAY' : m.daysLeft === 1 ? 'NGÀY MAI' : `Còn ${m.daysLeft} ngày`}
                      </span>
                    </div>
                    <div className="mt-1.5 text-xs font-bold text-zinc-800 dark:text-zinc-200 line-clamp-2">
                      {m.event}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Today's Tasks */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                Nhiệm vụ hôm nay ({formatVNDate(today)})
              </h3>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Đã hoàn thành {todayDoneCount}/{todayTotalCount} ({todayProgressPercent}%)
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenAddTask}
              className="flex items-center space-x-1.5 rounded-xl bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-400"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Thêm nhiệm vụ</span>
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className="flex items-center text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:text-zinc-400"
            >
              <span>Xem tất cả</span>
              <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
            </button>
          </div>
        </div>

        {todayTasks.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Chưa có nhiệm vụ nào cho ngày hôm nay.
            </p>
            <button
              onClick={onOpenAddTask}
              className="mt-3 inline-flex items-center space-x-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              <span>Tạo nhiệm vụ đầu tiên</span>
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-2.5">
            {todayTasks.map((task) => {
              const isDone = task.status === 'done';
              const subjectColor = SUBJECT_COLORS[task.subjectCode];

              return (
                <div
                  key={task.id}
                  className={`flex items-center justify-between rounded-xl p-3.5 border transition-all ${
                    isDone
                      ? 'bg-zinc-50/70 opacity-75 border-zinc-200 dark:bg-zinc-950/30 dark:border-zinc-800/60'
                      : 'bg-white border-zinc-200/90 shadow-sm dark:bg-zinc-900 dark:border-zinc-800'
                  }`}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0 pr-2">
                    {/* Done check button */}
                    <button
                      onClick={() => !isDone && setCompletingTask(task)}
                      disabled={isDone}
                      title={isDone ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition ${
                        isDone
                          ? 'border-emerald-500 bg-emerald-500 text-white cursor-default'
                          : 'border-zinc-300 hover:border-emerald-500 dark:border-zinc-700 dark:hover:border-emerald-400'
                      }`}
                    >
                      {isDone && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold border ${subjectColor.bg} ${subjectColor.text} ${subjectColor.border}`}
                        >
                          {SUBJECT_LABELS[task.subjectCode]}
                        </span>
                        {task.track && (
                          <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                            {task.track}
                          </span>
                        )}
                        {task.estMins && (
                          <span className="flex items-center text-[11px] text-zinc-400">
                            <Clock className="mr-0.5 h-3 w-3" />
                            {task.estMins}p
                          </span>
                        )}
                      </div>
                      <p
                        className={`mt-1 text-sm font-semibold truncate ${
                          isDone
                            ? 'line-through text-zinc-400 dark:text-zinc-500'
                            : 'text-zinc-900 dark:text-white'
                        }`}
                      >
                        {task.title}
                      </p>
                      {task.reasonMissed && !isDone && (
                        <p className="mt-0.5 text-[11px] text-amber-600 dark:text-amber-400">
                          Lý do: {task.reasonMissed}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 shrink-0">
                    {!isDone ? (
                      <>
                        <button
                          onClick={() => setReasonTask(task)}
                          title="Ghi nhận lý do chưa xong"
                          className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-amber-600 dark:hover:bg-zinc-800 dark:hover:text-amber-400"
                        >
                          <AlertCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setCompletingTask(task)}
                          className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
                        >
                          Xong
                        </button>
                      </>
                    ) : (
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                        +{task.durationMins ? task.durationMins + 10 : 10} EXP
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Tomorrow's Planned Tasks */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">
              Kế hoạch ngày mai ({formatVNDate(tomorrow)})
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {tomorrowTasks.length} nhiệm vụ đã lên lịch
            </p>
          </div>
          <button
            onClick={() => setActiveTab('ai-sync')}
            className="flex items-center space-x-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Lập kế hoạch</span>
          </button>
        </div>

        {tomorrowTasks.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Chưa có nhiệm vụ nào cho ngày mai. Sử dụng AI Sync để nhận kế hoạch tối ưu từ Gemini!
            </p>
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {tomorrowTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/60 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-950/40"
              >
                <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold border ${
                      SUBJECT_COLORS[task.subjectCode].bg
                    } ${SUBJECT_COLORS[task.subjectCode].text} ${SUBJECT_COLORS[task.subjectCode].border}`}
                  >
                    {SUBJECT_LABELS[task.subjectCode]}
                  </span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                    {task.title}
                  </span>
                </div>
                {task.estMins && (
                  <span className="shrink-0 text-zinc-400 font-medium">
                    {task.estMins} phút
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <CompleteTaskModal
        task={completingTask}
        isOpen={!!completingTask}
        onClose={() => setCompletingTask(null)}
        onConfirm={handleConfirmComplete}
      />

      <ReasonMissedModal
        task={reasonTask}
        isOpen={!!reasonTask}
        onClose={() => setReasonTask(null)}
        onSave={handleSaveReason}
      />
    </div>
  );
};
