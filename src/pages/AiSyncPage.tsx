import React, { useState } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  Calendar,
  Clock,
  Plus,
  X,
  AlertCircle,
  FileCode,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import {
  DailyReport,
  DailyReportSchema,
  AiPlanning,
  AiPlanningSchema,
  formatZodErrors,
  SUBJECT_LABELS,
  SUBJECT_COLORS,
  PRIORITY_LABELS,
} from '../lib/schemas';
import {
  getTodayDateVN,
  getTomorrowDateVN,
  formatVNDate,
  getDaysDifference,
} from '../lib/dateUtils';
import { calculateExpForTask } from '../lib/gamification';

const FIXED_GEMINI_PROMPT =
  'Read the DAILY_REPORT JSON below and reply with ONLY one JSON code block of type AI_PLANNING, following exactly the schema I gave you. No explanation outside the JSON. Total est_mins must not exceed tomorrow_context.available_mins. Maximum 8 tasks. ai_insight at most 400 characters, in Vietnamese.';

interface AiSyncPageProps {
  setActiveTab: (tab: string) => void;
}

export const AiSyncPage: React.FC<AiSyncPageProps> = ({ setActiveTab }) => {
  const {
    tasks,
    milestones,
    stats,
    latestReport,
    saveDailyReport,
    applyAiPlan,
  } = useData();

  const today = getTodayDateVN();
  const defaultTomorrow = getTomorrowDateVN();

  // Context Form State
  const [targetDate, setTargetDate] = useState<string>(defaultTomorrow);
  const [availableMins, setAvailableMins] = useState<number>(150);
  const [commitmentInput, setCommitmentInput] = useState<string>('');
  const [fixedCommitments, setFixedCommitments] = useState<string[]>([
    'Học chính khóa 7h00 - 11h30',
  ]);

  // Copy states
  const [copiedReport, setCopiedReport] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedError, setCopiedError] = useState(false);

  // Paste & Validate State
  const [pastedJson, setPastedJson] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validatedPlan, setValidatedPlan] = useState<AiPlanning | null>(null);
  const [appliedCount, setAppliedCount] = useState<number | null>(null);
  const [applying, setApplying] = useState(false);

  // Add commitment chip
  const handleAddCommitment = () => {
    if (!commitmentInput.trim()) return;
    setFixedCommitments((prev) => [...prev, commitmentInput.trim()]);
    setCommitmentInput('');
  };

  const handleRemoveCommitment = (index: number) => {
    setFixedCommitments((prev) => prev.filter((_, i) => i !== index));
  };

  // Build DAILY_REPORT JSON
  const buildDailyReport = (): DailyReport => {
    const reportId = `rpt_${today.replace(/-/g, '')}`;

    // Completed tasks today
    const completedTasksToday = tasks.filter(
      (t) => t.status === 'done' && (t.plannedDate === today || t.completedAt?.startsWith(today))
    );

    const expGainedToday = completedTasksToday.reduce(
      (sum, t) => sum + calculateExpForTask(t.durationMins),
      0
    );

    // Pending tasks (today or overdue)
    const pendingTasks = tasks.filter(
      (t) => t.status === 'pending' && getDaysDifference(t.plannedDate, today) <= 0
    );

    // Upcoming milestones (today onwards)
    const upcomingMs = milestones
      .filter((m) => getDaysDifference(m.date, today) >= 0)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((m) => ({
        event: m.event,
        date: m.date,
      }));

    return {
      schema_version: 1,
      type: 'DAILY_REPORT',
      report_id: reportId,
      current_date: today,
      timezone: 'Asia/Ho_Chi_Minh',
      gamification: {
        streak_days: stats.streakDays,
        current_level: stats.level,
        exp_gained_today: expGainedToday,
      },
      tomorrow_context: {
        date: targetDate,
        available_mins: availableMins,
        fixed_commitments: fixedCommitments,
      },
      completed_tasks: completedTasksToday.map((t) => ({
        id: t.id,
        subject_code: t.subjectCode,
        track: t.track,
        task: t.title,
        duration_mins: t.durationMins || 0,
      })),
      pending_tasks: pendingTasks.map((t) => ({
        id: t.id,
        subject_code: t.subjectCode,
        task: t.title,
        reason_missed: t.reasonMissed,
        deadline: t.plannedDate,
        estimated_mins: t.estMins,
      })),
      upcoming_milestones: upcomingMs,
    };
  };

  // Handle Copy Report
  const handleCopyReport = async () => {
    const report = buildDailyReport();
    await saveDailyReport(report);
    const jsonString = JSON.stringify(report, null, 2);

    try {
      await navigator.clipboard.writeText(jsonString);
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 2500);
    } catch {
      // Fallback
      alert('Không thể tự động sao chép. Vui lòng thử lại.');
    }
  };

  // Handle Copy Prompt
  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(FIXED_GEMINI_PROMPT);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2500);
    } catch {
      alert('Không thể tự động sao chép prompt.');
    }
  };

  // Strip markdown fences and extract raw JSON
  const extractJson = (text: string): string => {
    let cleaned = text.trim();
    const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fenceMatch && fenceMatch[1]) {
      cleaned = fenceMatch[1].trim();
    } else {
      const first = cleaned.indexOf('{');
      const last = cleaned.lastIndexOf('}');
      if (first !== -1 && last !== -1 && last > first) {
        cleaned = cleaned.substring(first, last + 1);
      }
    }
    return cleaned;
  };

  // Validate Pasted Plan
  const handleValidatePlan = () => {
    setValidationErrors([]);
    setValidatedPlan(null);
    setAppliedCount(null);

    if (!pastedJson.trim()) {
      setValidationErrors(['Vui lòng dán mã JSON nhận được từ Gemini vào ô bên dưới.']);
      return;
    }

    // 1. Strip markdown fences and parse JSON
    const rawData = extractJson(pastedJson);
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawData);
    } catch (e) {
      setValidationErrors([
        `Cú pháp JSON không hợp lệ: ${(e as Error).message}. Hãy đảm bảo Gemini trả về đúng một khối JSON.`,
      ]);
      return;
    }

    // 2. Validate with Zod
    const zodResult = AiPlanningSchema.safeParse(parsed);
    if (!zodResult.success) {
      const formatted = formatZodErrors(zodResult.error);
      setValidationErrors(formatted);
      return;
    }

    const plan = zodResult.data;
    const errors: string[] = [];

    // 3. Business checks
    // a. in_response_to must equal latest saved report_id
    if (latestReport && plan.in_response_to !== latestReport.report_id) {
      errors.push(
        `Kế hoạch này không khớp với báo cáo gần nhất (kỳ vọng: "${latestReport.report_id}", nhận được: "${plan.in_response_to}"). Hãy xuất lại báo cáo mới nhất và gửi cho Gemini.`
      );
    }

    // b. target_date must equal the date in latest tomorrow_context
    if (latestReport && plan.target_date !== latestReport.tomorrow_context.date) {
      errors.push(
        `target_date ("${plan.target_date}") không khớp với ngày trong ngữ cảnh ("${latestReport.tomorrow_context.date}").`
      );
    }

    // c. Sum of est_mins <= availableMins
    const totalEstMins = plan.tasks_to_sync.reduce((sum, t) => sum + t.est_mins, 0);
    const maxAllowed = latestReport ? latestReport.tomorrow_context.available_mins : availableMins;
    if (totalEstMins > maxAllowed) {
      errors.push(
        `Tổng thời gian ước tính (${totalEstMins} phút) vượt quá thời gian rảnh ngày mai (${maxAllowed} phút).`
      );
    }

    // d. Max 8 tasks
    if (plan.tasks_to_sync.length > 8) {
      errors.push(`Số lượng nhiệm vụ (${plan.tasks_to_sync.length}) vượt quá giới hạn tối đa 8 nhiệm vụ.`);
    }

    // e. Unique client_id within the plan
    const clientIds = plan.tasks_to_sync.map((t) => t.client_id);
    const duplicates = clientIds.filter((item, index) => clientIds.indexOf(item) !== index);
    if (duplicates.length > 0) {
      errors.push(`client_id bị trùng lặp trong danh sách nhiệm vụ: ${Array.from(new Set(duplicates)).join(', ')}.`);
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    // All checks passed!
    setValidatedPlan(plan);
  };

  // Copy errors so user can paste back to Gemini
  const handleCopyErrors = async () => {
    const errorText = `Tôi nhận được các lỗi kiểm tra sau khi dán JSON vào StudyQuest. Hãy sửa lại và trả về duy nhất khối JSON type AI_PLANNING hợp lệ:\n\n${validationErrors.join('\n')}`;
    try {
      await navigator.clipboard.writeText(errorText);
      setCopiedError(true);
      setTimeout(() => setCopiedError(false), 2500);
    } catch {
      alert('Không thể sao chép lỗi.');
    }
  };

  // Apply plan to Firestore
  const handleApplyPlan = async () => {
    if (!validatedPlan) return;
    setApplying(true);
    try {
      const count = await applyAiPlan(validatedPlan, pastedJson);
      setAppliedCount(count);
      setValidatedPlan(null);
      setPastedJson('');
    } catch (e) {
      alert(`Lỗi khi lưu kế hoạch: ${(e as Error).message}`);
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8 animate-in fade-in duration-150">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 text-white shadow-md shadow-indigo-600/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
              AI Sync (Đồng bộ Gemini)
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Quy trình sao chép - dán báo cáo học tập và nhận kế hoạch tối ưu 1 chạm
            </p>
          </div>
        </div>
      </div>

      {/* Workflow Explainer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center space-x-2 text-xs font-bold text-indigo-600 dark:text-indigo-400">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-[11px]">
              1
            </span>
            <span>Thiết lập ngữ cảnh</span>
          </div>
          <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            Điền thời gian rảnh và lịch cố định ngày mai, sau đó bấm <strong>Copy báo cáo</strong>.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center space-x-2 text-xs font-bold text-indigo-600 dark:text-indigo-400">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-[11px]">
              2
            </span>
            <span>Gửi sang Gemini</span>
          </div>
          <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            Dán prompt mẫu cùng báo cáo vào cuộc trò chuyện Gemini của bạn.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center space-x-2 text-xs font-bold text-indigo-600 dark:text-indigo-400">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-[11px]">
              3
            </span>
            <span>Dán & Áp dụng</span>
          </div>
          <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            Dán khối JSON phản hồi từ Gemini vào ô kiểm tra để tự động lên lịch học tập.
          </p>
        </div>
      </div>

      {/* Step 1: Form "Ngữ cảnh ngày mai" */}
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">
              Bước 1: Ngữ cảnh ngày mai
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Cung cấp thời gian thực tế để AI không lập kế hoạch quá tải
            </p>
          </div>
          {latestReport && (
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
              Báo cáo gần nhất: {latestReport.report_id}
            </span>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              <Calendar className="mr-1 inline h-3.5 w-3.5" />
              Ngày áp dụng kế hoạch
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              <Clock className="mr-1 inline h-3.5 w-3.5" />
              Tổng thời gian tự học có thể dành ra (phút)
            </label>
            <input
              type="number"
              min="30"
              max="720"
              step="15"
              value={availableMins}
              onChange={(e) => setAvailableMins(Math.max(1, Number(e.target.value)))}
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
            />
          </div>
        </div>

        {/* Fixed Commitments */}
        <div className="mt-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Lịch bận cố định (Học thêm, chính khóa, ngoại khóa...)
          </label>
          <div className="mt-1.5 flex gap-2">
            <input
              type="text"
              value={commitmentInput}
              onChange={(e) => setCommitmentInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCommitment())}
              placeholder="VD: Học thêm Toán 17h30 - 19h00"
              className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
            />
            <button
              type="button"
              onClick={handleAddCommitment}
              className="rounded-xl bg-zinc-100 px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              Thêm
            </button>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {fixedCommitments.map((c, idx) => (
              <span
                key={idx}
                className="inline-flex items-center space-x-1.5 rounded-lg bg-zinc-100 px-2.5 py-1 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                <span>{c}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveCommitment(idx)}
                  className="text-zinc-400 hover:text-rose-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Action Button: Copy Report */}
        <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            Hệ thống sẽ tổng hợp nhiệm vụ đã xong hôm nay, nhiệm vụ tồn đọng và mốc thi sắp tới.
          </div>
          <button
            onClick={handleCopyReport}
            className={`inline-flex items-center justify-center space-x-2 rounded-2xl px-5 py-2.5 text-sm font-bold shadow-md transition active:scale-95 ${
              copiedReport
                ? 'bg-emerald-600 text-white shadow-emerald-600/25'
                : 'bg-indigo-600 text-white shadow-indigo-600/25 hover:bg-indigo-700'
            }`}
          >
            {copiedReport ? (
              <>
                <Check className="h-4 w-4" />
                <span>Đã copy báo cáo!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Copy báo cáo (DAILY_REPORT)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Step 2: Fixed Prompt Box */}
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">
              Bước 2: Prompt chuẩn gửi Gemini
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Dán đoạn chỉ dẫn này trước nội dung báo cáo trong khung chat Gemini
            </p>
          </div>
          <button
            onClick={handleCopyPrompt}
            className={`inline-flex items-center space-x-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
              copiedPrompt
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
            }`}
          >
            {copiedPrompt ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copiedPrompt ? 'Đã copy prompt' : 'Copy prompt'}</span>
          </button>
        </div>

        <div className="mt-3 relative rounded-2xl bg-zinc-950 p-4 text-xs font-mono text-zinc-300 border border-zinc-800 overflow-x-auto leading-relaxed">
          {FIXED_GEMINI_PROMPT}
        </div>
      </div>

      {/* Step 3: Paste & Validate Gemini Response */}
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">
              Bước 3: Dán kế hoạch từ Gemini & Kiểm tra
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Hệ thống tự động loại bỏ markdown (```json), kiểm tra schema Zod và logic phân bổ thời gian
            </p>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
            Dán kế hoạch từ Gemini (AI_PLANNING) *
          </label>
          <textarea
            rows={7}
            value={pastedJson}
            onChange={(e) => setPastedJson(e.target.value)}
            placeholder={`Dán toàn bộ câu trả lời của Gemini vào đây (kể cả có chứa \`\`\`json ... \`\`\`)\n{\n  "schema_version": 1,\n  "type": "AI_PLANNING",\n  "in_response_to": "${latestReport?.report_id || 'rpt_YYYYMMDD'}",\n  ...\n}`}
            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 p-3.5 font-mono text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
          />
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px] text-zinc-400">
            Dữ liệu dán vào được xử lý bảo mật trực tiếp trên trình duyệt của bạn.
          </span>
          <button
            onClick={handleValidatePlan}
            className="inline-flex items-center space-x-2 rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-600/25 transition hover:bg-indigo-700 active:scale-95"
          >
            <Check className="h-4 w-4" />
            <span>Kiểm tra</span>
          </button>
        </div>

        {/* Validation Errors Box */}
        {validationErrors.length > 0 && (
          <div className="mt-5 rounded-2xl bg-rose-50 p-4 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-900/60 animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-rose-200/80 dark:border-rose-900/60">
              <div className="flex items-center space-x-2 text-rose-700 dark:text-rose-300 font-bold text-xs uppercase tracking-wider">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Phát hiện {validationErrors.length} lỗi trong kế hoạch</span>
              </div>
              <button
                onClick={handleCopyErrors}
                className={`inline-flex items-center space-x-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  copiedError
                    ? 'bg-rose-700 text-white'
                    : 'bg-rose-100 text-rose-800 hover:bg-rose-200 dark:bg-rose-900/60 dark:text-rose-200'
                }`}
              >
                {copiedError ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                <span>{copiedError ? 'Đã copy lỗi' : 'Copy lỗi'}</span>
              </button>
            </div>

            <ul className="mt-3 space-y-1.5 text-xs text-rose-800 dark:text-rose-200 font-mono">
              {validationErrors.map((err, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <span className="text-rose-400">•</span>
                  <span>{err}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] text-rose-600 dark:text-rose-400">
              Mẹo: Bấm <strong>Copy lỗi</strong> ở trên và dán lại cho Gemini để nó tự điều chỉnh ngay lập tức!
            </p>
          </div>
        )}

        {/* Applied Success Notification */}
        {appliedCount !== null && (
          <div className="mt-5 rounded-2xl bg-emerald-50 p-4 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900/60 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5 text-emerald-800 dark:text-emerald-200">
                <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-bold">
                  Đã áp dụng thành công {appliedCount} nhiệm vụ vào kế hoạch!
                </span>
              </div>
              <button
                onClick={() => setActiveTab('dashboard')}
                className="rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
              >
                Về Tổng quan
              </button>
            </div>
          </div>
        )}

        {/* Validated Plan Preview */}
        {validatedPlan && (
          <div className="mt-6 rounded-2xl border border-indigo-200/90 bg-indigo-50/40 p-5 dark:border-indigo-900/60 dark:bg-indigo-950/20 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-indigo-200/60 dark:border-indigo-900/60">
              <div>
                <span className="inline-flex items-center rounded-md bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                  Kế hoạch hợp lệ
                </span>
                <h3 className="mt-1 text-sm font-bold text-zinc-900 dark:text-white">
                  Xem trước {validatedPlan.tasks_to_sync.length} nhiệm vụ cho ngày {formatVNDate(validatedPlan.target_date)}
                </h3>
              </div>

              <button
                onClick={handleApplyPlan}
                disabled={applying}
                className="inline-flex items-center justify-center space-x-2 rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 disabled:opacity-50"
              >
                {applying ? (
                  <span>Đang áp dụng...</span>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Áp dụng kế hoạch</span>
                  </>
                )}
              </button>
            </div>

            {/* AI Insight preview */}
            <div className="mt-3 rounded-xl bg-white/80 p-3.5 border border-indigo-100 dark:bg-zinc-900 dark:border-zinc-800">
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                Nhận định từ Gemini:
              </span>
              <p className="mt-1 text-xs text-zinc-700 dark:text-zinc-300 italic leading-relaxed">
                "{validatedPlan.ai_insight}"
              </p>
            </div>

            {/* Tasks list preview */}
            <div className="mt-3 space-y-2">
              {validatedPlan.tasks_to_sync.map((item, idx) => (
                <div
                  key={item.client_id || idx}
                  className="flex items-center justify-between rounded-xl bg-white p-3 border border-zinc-200/80 text-xs dark:bg-zinc-900 dark:border-zinc-800"
                >
                  <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold border ${
                        SUBJECT_COLORS[item.subject_code].bg
                      } ${SUBJECT_COLORS[item.subject_code].text} ${
                        SUBJECT_COLORS[item.subject_code].border
                      }`}
                    >
                      {SUBJECT_LABELS[item.subject_code]}
                    </span>
                    <span className="font-bold text-zinc-900 dark:text-white truncate">
                      {item.title}
                    </span>
                    {item.source_task_id && (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 shrink-0">
                        Chuyển tiếp từ {item.source_task_id}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-3 shrink-0 text-zinc-500 text-[11px]">
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      {item.est_mins} phút
                    </span>
                    <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] dark:bg-zinc-800">
                      {PRIORITY_LABELS[item.priority]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Google Tasks Future Sync Section */}
      <div className="rounded-3xl border border-zinc-200 bg-zinc-50/70 p-6 dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
              Đồng bộ Google Tasks
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Tự động gửi danh sách bài học lên ứng dụng Google Tasks trên điện thoại của bạn
            </p>
          </div>

          <button
            disabled
            title="Tính năng sắp ra mắt trong phiên bản tiếp theo"
            className="cursor-not-allowed rounded-2xl border border-zinc-200 bg-zinc-100 px-4 py-2 text-xs font-bold text-zinc-400 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-500"
          >
            Đồng bộ Google Tasks (sắp có)
          </button>
        </div>
      </div>
    </div>
  );
};
