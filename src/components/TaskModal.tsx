import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Tag, Bookmark, AlertCircle } from 'lucide-react';
import {
  SUBJECT_CODES,
  SUBJECT_LABELS,
  LIST_KEYS,
  LIST_KEY_LABELS,
  PRIORITIES,
  PRIORITY_LABELS,
  SubjectCode,
  ListKey,
  Priority,
  StudyTask,
} from '../lib/schemas';
import { getTodayDateVN } from '../lib/dateUtils';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<StudyTask, 'id' | 'createdAt' | 'syncStatus'>) => Promise<void>;
  initialTask?: StudyTask | null;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTask,
}) => {
  const [title, setTitle] = useState('');
  const [subjectCode, setSubjectCode] = useState<SubjectCode>('toan');
  const [track, setTrack] = useState('');
  const [plannedDate, setPlannedDate] = useState(getTodayDateVN());
  const [estMins, setEstMins] = useState<number | ''>(30);
  const [priority, setPriority] = useState<Priority>('medium');
  const [listKey, setListKey] = useState<ListKey>('school');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setSubjectCode(initialTask.subjectCode);
      setTrack(initialTask.track || '');
      setPlannedDate(initialTask.plannedDate);
      setEstMins(initialTask.estMins ?? 30);
      setPriority(initialTask.priority);
      setListKey(initialTask.listKey);
      setNotes(initialTask.notes || '');
    } else {
      setTitle('');
      setSubjectCode('toan');
      setTrack('');
      setPlannedDate(getTodayDateVN());
      setEstMins(30);
      setPriority('medium');
      setListKey('school');
      setNotes('');
    }
    setError(null);
  }, [initialTask, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Vui lòng nhập tiêu đề nhiệm vụ');
      return;
    }
    if (!plannedDate) {
      setError('Vui lòng chọn ngày dự kiến');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await onSave({
        title: title.trim(),
        subjectCode,
        track: track.trim() ? track.trim() : undefined,
        status: initialTask?.status || 'pending',
        plannedDate,
        estMins: estMins === '' ? undefined : Number(estMins),
        priority,
        listKey,
        notes: notes.trim() ? notes.trim() : undefined,
        origin: initialTask?.origin || 'manual',
        durationMins: initialTask?.durationMins,
        completedAt: initialTask?.completedAt,
        reasonMissed: initialTask?.reasonMissed,
        sourceTaskId: initialTask?.sourceTaskId,
        clientId: initialTask?.clientId,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi lưu nhiệm vụ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
            {initialTask ? 'Chỉnh sửa nhiệm vụ' : 'Thêm nhiệm vụ mới'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Tiêu đề nhiệm vụ *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Làm 5 bài tập Hình học không gian"
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
            />
          </div>

          {/* Subject & Track */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Môn học *
              </label>
              <select
                value={subjectCode}
                onChange={(e) => setSubjectCode(e.target.value as SubjectCode)}
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
              >
                {SUBJECT_CODES.map((code) => (
                  <option key={code} value={code}>
                    {SUBJECT_LABELS[code]} ({code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Nhánh / Định hướng (tuỳ chọn)
              </label>
              <input
                type="text"
                value={track}
                onChange={(e) => setTrack(e.target.value)}
                placeholder="VD: HSG C++, Chuyên đề"
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
              />
            </div>
          </div>

          {/* Planned Date & Estimated Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <Calendar className="mr-1 inline h-3.5 w-3.5" />
                Ngày dự kiến *
              </label>
              <input
                type="date"
                required
                value={plannedDate}
                onChange={(e) => setPlannedDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <Clock className="mr-1 inline h-3.5 w-3.5" />
                Dự tính (phút)
              </label>
              <input
                type="number"
                min="5"
                step="5"
                value={estMins}
                onChange={(e) => setEstMins(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="30"
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
              />
            </div>
          </div>

          {/* Priority & ListKey */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <Tag className="mr-1 inline h-3.5 w-3.5" />
                Độ ưu tiên *
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABELS[p]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <Bookmark className="mr-1 inline h-3.5 w-3.5" />
                Danh mục *
              </label>
              <select
                value={listKey}
                onChange={(e) => setListKey(e.target.value as ListKey)}
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
              >
                {LIST_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {LIST_KEY_LABELS[k]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Ghi chú thêm
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú chi tiết, tài liệu tham khảo..."
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Đang lưu...' : initialTask ? 'Cập nhật' : 'Thêm nhiệm vụ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
