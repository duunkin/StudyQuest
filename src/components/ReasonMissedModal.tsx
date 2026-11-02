import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { StudyTask } from '../lib/schemas';

interface ReasonMissedModalProps {
  task: StudyTask | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (reason: string) => Promise<void>;
}

export const ReasonMissedModal: React.FC<ReasonMissedModalProps> = ({
  task,
  isOpen,
  onClose,
  onSave,
}) => {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (task) {
      setReason(task.reasonMissed || '');
    }
  }, [task, isOpen]);

  if (!isOpen || !task) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    setSubmitting(true);
    try {
      await onSave(reason.trim());
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const sampleReasons = [
    'Bài tập trên lớp quá nhiều',
    'Bận ôn thi đột xuất môn khác',
    'Chưa hiểu kỹ lý thuyết cần xem lại',
    'Mệt / Cần nghỉ ngơi sớm',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400">
            <AlertCircle className="h-5 w-5" />
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
              Ghi nhận lý do chưa xong
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
          Ghi nhận lý do để Gemini phân tích và sắp xếp lại kế hoạch học tập hợp lý hơn vào ngày mai.
        </p>

        <div className="mt-2 rounded-xl bg-zinc-50 p-3 text-sm font-semibold text-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-200">
          {task.title}
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Lý do chưa hoàn thành *
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="VD: Mất nhiều thời gian giải đề Toán nên chưa kịp làm..."
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm text-zinc-900 focus:border-amber-500 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
            />
          </div>

          {/* Quick chips */}
          <div>
            <span className="text-[11px] font-medium text-zinc-400">Gợi ý nhanh:</span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {sampleReasons.map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setReason(r)}
                  className="rounded-lg bg-zinc-100 px-2.5 py-1 text-xs text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  {r}
                </button>
              ))}
            </div>
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
              disabled={submitting || !reason.trim()}
              className="rounded-xl bg-amber-600 px-5 py-2 text-sm font-bold text-white shadow-md shadow-amber-600/20 hover:bg-amber-700 disabled:opacity-50"
            >
              {submitting ? 'Đang lưu...' : 'Lưu lý do'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
