import React, { useState } from 'react';
import { X, CheckCircle2, Clock, Zap } from 'lucide-react';
import { StudyTask } from '../lib/schemas';
import { calculateExpForTask } from '../lib/gamification';

interface CompleteTaskModalProps {
  task: StudyTask | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (durationMins: number) => Promise<void>;
}

export const CompleteTaskModal: React.FC<CompleteTaskModalProps> = ({
  task,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [durationMins, setDurationMins] = useState<number>(task?.estMins || 30);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !task) return null;

  const expGained = calculateExpForTask(durationMins);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onConfirm(durationMins);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
              Hoàn thành nhiệm vụ
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4">
          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 line-clamp-2">
            {task.title}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              <Clock className="mr-1 inline h-3.5 w-3.5" />
              Thời gian thực tế đã học (phút)
            </label>
            <input
              type="number"
              min="1"
              max="600"
              required
              value={durationMins}
              onChange={(e) => setDurationMins(Math.max(1, Number(e.target.value)))}
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-base font-bold text-zinc-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
            />
          </div>

          {/* Gamification reward preview */}
          <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 p-4 border border-emerald-200/80 dark:from-emerald-950/40 dark:to-teal-950/30 dark:border-emerald-800/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-300">
                <Zap className="h-5 w-5 text-amber-500 fill-amber-500" />
                <span className="text-sm font-semibold">Phần thưởng kinh nghiệm:</span>
              </div>
              <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                +{expGained} EXP
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Công thức: {durationMins} phút + 10 EXP cơ bản
            </p>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting ? 'Đang cập nhật...' : 'Xác nhận & Nhận EXP'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
