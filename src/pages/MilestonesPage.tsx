import React, { useState } from 'react';
import { Plus, Calendar, Flag, Edit2, Trash2, Clock, AlertTriangle } from 'lucide-react';
import { useData } from '../context/DataContext';
import { Milestone } from '../lib/schemas';
import { getTodayDateVN, getDaysDifference, formatVNDate } from '../lib/dateUtils';
import { MilestoneModal } from '../components/MilestoneModal';

export const MilestonesPage: React.FC = () => {
  const { milestones, addMilestone, updateMilestone, deleteMilestone } = useData();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);

  const today = getTodayDateVN();

  const sortedMilestones = [...milestones].sort((a, b) => a.date.localeCompare(b.date));

  const handleOpenAdd = () => {
    setEditingMilestone(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (m: Milestone) => {
    setEditingMilestone(m);
    setModalOpen(true);
  };

  const handleSave = async (event: string, date: string) => {
    if (editingMilestone) {
      await updateMilestone(editingMilestone.id, event, date);
    } else {
      await addMilestone(event, date);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa mốc thi / deadline này?')) {
      await deleteMilestone(id);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
            Mốc thi & Deadline
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Theo dõi các kỳ kiểm tra, kỳ thi học sinh giỏi và thời hạn nộp bài
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center space-x-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-600/25 transition hover:bg-indigo-700 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>Thêm mốc thi mới</span>
        </button>
      </div>

      {sortedMilestones.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500 dark:bg-indigo-950/60 dark:text-indigo-400">
            <Flag className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-sm font-bold text-zinc-700 dark:text-zinc-300">
            Chưa có mốc thi hay deadline nào
          </h3>
          <p className="mt-1 text-xs text-zinc-400 max-w-sm mx-auto">
            Ghi chú các kỳ thi giữa kỳ, cuối kỳ, thi HSG hoặc hạn nộp dự án để AI tự động sắp xếp ưu tiên bài học.
          </p>
          <button
            onClick={handleOpenAdd}
            className="mt-4 inline-flex items-center space-x-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            <span>Thêm mốc thi đầu tiên</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedMilestones.map((m) => {
            const daysDiff = getDaysDifference(m.date, today);
            const isToday = daysDiff === 0;
            const isTomorrow = daysDiff === 1;
            const isPast = daysDiff < 0;
            const isUrgent = daysDiff >= 0 && daysDiff <= 3;

            return (
              <div
                key={m.id}
                className={`relative rounded-2xl border p-5 transition-all shadow-sm ${
                  isToday
                    ? 'border-rose-400 bg-rose-50/70 dark:border-rose-900/60 dark:bg-rose-950/20'
                    : isUrgent
                    ? 'border-amber-300 bg-amber-50/60 dark:border-amber-900/60 dark:bg-amber-950/20'
                    : isPast
                    ? 'border-zinc-200 bg-zinc-50/60 opacity-70 dark:border-zinc-800 dark:bg-zinc-950/30'
                    : 'border-zinc-200/90 bg-white hover:border-indigo-200 dark:border-zinc-800 dark:bg-zinc-900'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-black shadow-sm ${
                          isToday
                            ? 'bg-rose-600 text-white animate-pulse'
                            : isTomorrow
                            ? 'bg-amber-500 text-white'
                            : isUrgent
                            ? 'bg-amber-500 text-white'
                            : isPast
                            ? 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                            : 'bg-indigo-600 text-white'
                        }`}
                      >
                        {isToday
                          ? 'DIỄN RA HÔM NAY'
                          : isTomorrow
                          ? 'NGÀY MAI'
                          : isPast
                          ? `Đã qua ${Math.abs(daysDiff)} ngày`
                          : `Còn ${daysDiff} ngày`}
                      </span>

                      {isUrgent && !isPast && !isToday && (
                        <span className="flex items-center text-xs font-bold text-amber-600 dark:text-amber-400">
                          <AlertTriangle className="mr-1 h-3.5 w-3.5" /> Gấp
                        </span>
                      )}
                    </div>

                    <h3 className="mt-2.5 text-base font-extrabold text-zinc-900 dark:text-white leading-tight">
                      {m.event}
                    </h3>

                    <div className="mt-2 flex items-center text-xs text-zinc-500 dark:text-zinc-400">
                      <Calendar className="mr-1.5 h-3.5 w-3.5 text-zinc-400" />
                      <span>{formatVNDate(m.date)}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(m)}
                      title="Chỉnh sửa"
                      className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(m.id)}
                      title="Xóa"
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

      <MilestoneModal
        milestone={editingMilestone}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
};
