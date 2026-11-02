import React, { useState } from 'react';
import {
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  Calendar,
  Sparkles,
  Edit2,
  Trash2,
  AlertCircle,
  Tag,
  Check,
  Search,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import {
  SUBJECT_CODES,
  SUBJECT_LABELS,
  SUBJECT_COLORS,
  PRIORITY_LABELS,
  LIST_KEY_LABELS,
  StudyTask,
  SubjectCode,
} from '../lib/schemas';
import {
  getTodayDateVN,
  getTomorrowDateVN,
  formatVNDate,
  getDaysDifference,
} from '../lib/dateUtils';
import { CompleteTaskModal } from '../components/CompleteTaskModal';
import { ReasonMissedModal } from '../components/ReasonMissedModal';

interface TasksPageProps {
  onOpenAddTask: () => void;
  onEditTask: (task: StudyTask) => void;
}

type DateFilter = 'all' | 'today' | 'tomorrow' | 'overdue' | 'custom';

export const TasksPage: React.FC<TasksPageProps> = ({
  onOpenAddTask,
  onEditTask,
}) => {
  const { tasks, deleteTask, completeTask, recordReasonMissed } = useData();

  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [customDate, setCustomDate] = useState<string>(getTodayDateVN());
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [completingTask, setCompletingTask] = useState<StudyTask | null>(null);
  const [reasonTask, setReasonTask] = useState<StudyTask | null>(null);

  const today = getTodayDateVN();
  const tomorrow = getTomorrowDateVN();

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    // 1. Date filter
    if (dateFilter === 'today' && t.plannedDate !== today) return false;
    if (dateFilter === 'tomorrow' && t.plannedDate !== tomorrow) return false;
    if (dateFilter === 'overdue') {
      const diff = getDaysDifference(t.plannedDate, today);
      if (!(diff < 0 && t.status === 'pending')) return false;
    }
    if (dateFilter === 'custom' && t.plannedDate !== customDate) return false;

    // 2. Subject filter
    if (subjectFilter !== 'all' && t.subjectCode !== subjectFilter) return false;

    // 3. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchNotes = t.notes?.toLowerCase().includes(q);
      const matchTrack = t.track?.toLowerCase().includes(q);
      if (!matchTitle && !matchNotes && !matchTrack) return false;
    }

    return true;
  });

  const handleDelete = async (taskId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa nhiệm vụ này?')) {
      await deleteTask(taskId);
    }
  };

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
    <div className="space-y-5 pb-20 md:pb-8 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
            Nhiệm vụ học tập
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Quản lý, phân loại theo môn học và theo dõi tiến độ từng ngày
          </p>
        </div>

        <button
          onClick={onOpenAddTask}
          className="inline-flex items-center justify-center space-x-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-600/25 transition hover:bg-indigo-700 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>Thêm nhiệm vụ</span>
        </button>
      </div>

      {/* Date Filters Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-zinc-200/90 bg-white p-1.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <button
          onClick={() => setDateFilter('today')}
          className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
            dateFilter === 'today'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
          }`}
        >
          Hôm nay
        </button>

        <button
          onClick={() => setDateFilter('tomorrow')}
          className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
            dateFilter === 'tomorrow'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
          }`}
        >
          Ngày mai
        </button>

        <button
          onClick={() => setDateFilter('overdue')}
          className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
            dateFilter === 'overdue'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
          }`}
        >
          Chưa xong / Quá hạn
        </button>

        <button
          onClick={() => setDateFilter('all')}
          className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
            dateFilter === 'all'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
          }`}
        >
          Tất cả
        </button>

        <div className="flex items-center ml-auto pl-2">
          <input
            type="date"
            value={customDate}
            onChange={(e) => {
              setCustomDate(e.target.value);
              setDateFilter('custom');
            }}
            className={`rounded-xl border px-2.5 py-1 text-xs focus:outline-none ${
              dateFilter === 'custom'
                ? 'border-indigo-500 bg-indigo-50 font-bold text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/60 dark:text-indigo-300'
                : 'border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400'
            }`}
          />
        </div>
      </div>

      {/* Subject Filter & Search Bar */}
      <div className="space-y-2">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm nhiệm vụ theo tên, ghi chú, nhánh học..."
            className="w-full rounded-2xl border border-zinc-200 bg-white pl-10 pr-4 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
          />
        </div>

        {/* Horizontal scrollable subjects */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
          <button
            onClick={() => setSubjectFilter('all')}
            className={`shrink-0 rounded-xl px-3 py-1 font-semibold transition ${
              subjectFilter === 'all'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400'
            }`}
          >
            Tất cả môn
          </button>
          {SUBJECT_CODES.map((code) => {
            const isSelected = subjectFilter === code;
            return (
              <button
                key={code}
                onClick={() => setSubjectFilter(code)}
                className={`shrink-0 rounded-xl px-2.5 py-1 font-semibold transition border ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-600 text-white'
                    : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400'
                }`}
              >
                {SUBJECT_LABELS[code]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-sm font-bold text-zinc-700 dark:text-zinc-300">
            Không có nhiệm vụ nào
          </h3>
          <p className="mt-1 text-xs text-zinc-400 max-w-sm mx-auto">
            Không tìm thấy nhiệm vụ phù hợp với bộ lọc hiện tại. Hãy tạo nhiệm vụ mới hoặc đồng bộ kế hoạch từ Gemini.
          </p>
          <button
            onClick={onOpenAddTask}
            className="mt-4 inline-flex items-center space-x-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            <span>Thêm nhiệm vụ ngay</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const isDone = task.status === 'done';
            const subjectColor = SUBJECT_COLORS[task.subjectCode];
            const isOverdue =
              getDaysDifference(task.plannedDate, today) < 0 && !isDone;

            return (
              <div
                key={task.id}
                className={`group relative rounded-2xl border p-4 transition-all ${
                  isDone
                    ? 'border-zinc-200/80 bg-zinc-50/70 opacity-80 dark:border-zinc-800/60 dark:bg-zinc-950/40'
                    : isOverdue
                    ? 'border-rose-200 bg-white shadow-sm dark:border-rose-900/40 dark:bg-zinc-900'
                    : 'border-zinc-200/90 bg-white shadow-sm hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left check and info */}
                  <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                    <button
                      onClick={() => !isDone && setCompletingTask(task)}
                      disabled={isDone}
                      title={isDone ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-xl border transition ${
                        isDone
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-zinc-300 hover:border-emerald-500 hover:bg-emerald-50/50 dark:border-zinc-700 dark:hover:border-emerald-400'
                      }`}
                    >
                      {isDone && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      {/* Badges row */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold border ${subjectColor.bg} ${subjectColor.text} ${subjectColor.border}`}
                        >
                          {SUBJECT_LABELS[task.subjectCode]}
                        </span>

                        {task.track && (
                          <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                            {task.track}
                          </span>
                        )}

                        <span
                          className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                            task.priority === 'high'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                              : task.priority === 'medium'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                              : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                          }`}
                        >
                          Ưu tiên {PRIORITY_LABELS[task.priority]}
                        </span>

                        <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                          {LIST_KEY_LABELS[task.listKey]}
                        </span>

                        {task.origin === 'ai_plan' && (
                          <span className="flex items-center space-x-1 rounded-md bg-purple-100 px-1.5 py-0.5 text-[10px] font-bold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                            <Sparkles className="h-2.5 w-2.5" />
                            <span>Kế hoạch AI</span>
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3
                        className={`text-sm font-bold leading-snug ${
                          isDone
                            ? 'line-through text-zinc-400 dark:text-zinc-500'
                            : 'text-zinc-900 dark:text-white'
                        }`}
                      >
                        {task.title}
                      </h3>

                      {/* Notes if any */}
                      {task.notes && (
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 whitespace-pre-wrap">
                          {task.notes}
                        </p>
                      )}

                      {/* Reason missed badge if recorded */}
                      {task.reasonMissed && (
                        <div className="mt-2 flex items-start space-x-1.5 rounded-xl bg-amber-50 p-2 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60">
                          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                          <div>
                            <span className="font-bold">Lý do chưa xong:</span> {task.reasonMissed}
                          </div>
                        </div>
                      )}

                      {/* Metadata footer */}
                      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-zinc-400">
                        <span className="flex items-center">
                          <Calendar className="mr-1 h-3 w-3" />
                          {formatVNDate(task.plannedDate)}
                          {task.plannedDate === today && (
                            <span className="ml-1 text-indigo-600 font-bold dark:text-indigo-400">(Hôm nay)</span>
                          )}
                          {isOverdue && (
                            <span className="ml-1 text-rose-500 font-bold">(Quá hạn)</span>
                          )}
                        </span>

                        {task.estMins && (
                          <span className="flex items-center">
                            <Clock className="mr-1 h-3 w-3" />
                            Dự tính: {task.estMins} phút
                          </span>
                        )}

                        {isDone && task.durationMins !== undefined && (
                          <span className="flex items-center text-emerald-600 dark:text-emerald-400 font-semibold">
                            Đã học: {task.durationMins} phút (+{task.durationMins + 10} EXP)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Right */}
                  <div className="flex items-center space-x-1 shrink-0">
                    {!isDone ? (
                      <>
                        <button
                          onClick={() => setReasonTask(task)}
                          title="Ghi nhận lý do chưa xong"
                          className="rounded-xl p-2 text-zinc-400 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-zinc-800 dark:hover:text-amber-400"
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
                    ) : null}

                    <button
                      onClick={() => onEditTask(task)}
                      title="Chỉnh sửa"
                      className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(task.id)}
                      title="Xóa nhiệm vụ"
                      className="rounded-xl p-2 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-zinc-800 dark:hover:text-rose-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
