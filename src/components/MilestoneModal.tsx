import React, { useState, useEffect } from 'react';
import { X, Calendar, Flag } from 'lucide-react';
import { Milestone } from '../lib/schemas';
import { getTodayDateVN, addDays } from '../lib/dateUtils';

interface MilestoneModalProps {
  milestone: Milestone | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: string, date: string) => Promise<void>;
}

export const MilestoneModal: React.FC<MilestoneModalProps> = ({
  milestone,
  isOpen,
  onClose,
  onSave,
}) => {
  const [event, setEvent] = useState('');
  const [date, setDate] = useState(addDays(getTodayDateVN(), 7));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (milestone) {
      setEvent(milestone.event);
      setDate(milestone.date);
    } else {
      setEvent('');
      setDate(addDays(getTodayDateVN(), 7));
    }
  }, [milestone, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event.trim() || !date) return;
    setSubmitting(true);
    try {
      await onSave(event.trim(), date);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400">
            <Flag className="h-5 w-5" />
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
              {milestone ? 'Chỉnh sửa mốc thi' : 'Thêm mốc thi / Deadline'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Tên sự kiện / Bài thi / Deadline *
            </label>
            <input
              type="text"
              required
              value={event}
              onChange={(e) => setEvent(e.target.value)}
              placeholder="VD: Kiểm tra giữa kỳ 1 Địa lý"
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              <Calendar className="mr-1 inline h-3.5 w-3.5" />
              Ngày diễn ra *
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
            />
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
              disabled={submitting || !event.trim() || !date}
              className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? 'Đang lưu...' : milestone ? 'Cập nhật' : 'Thêm mốc thi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
