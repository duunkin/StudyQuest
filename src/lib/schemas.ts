import { z } from 'zod';

export const SUBJECT_CODES = [
  'tin',
  'su',
  'dia',
  'ly',
  'toan',
  'hoa',
  'sinh',
  'van',
  'anh',
  'khac',
] as const;

export type SubjectCode = (typeof SUBJECT_CODES)[number];

export const SUBJECT_LABELS: Record<SubjectCode, string> = {
  tin: 'Tin học',
  su: 'Lịch sử',
  dia: 'Địa lý',
  ly: 'Vật lí',
  toan: 'Toán',
  hoa: 'Hóa học',
  sinh: 'Sinh học',
  van: 'Ngữ văn',
  anh: 'Tiếng Anh',
  khac: 'Khác',
};

export const SUBJECT_COLORS: Record<SubjectCode, { bg: string; text: string; border: string }> = {
  tin: { bg: 'bg-cyan-500/10 dark:bg-cyan-500/20', text: 'text-cyan-700 dark:text-cyan-300', border: 'border-cyan-200 dark:border-cyan-800' },
  toan: { bg: 'bg-blue-500/10 dark:bg-blue-500/20', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
  ly: { bg: 'bg-indigo-500/10 dark:bg-indigo-500/20', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800' },
  hoa: { bg: 'bg-purple-500/10 dark:bg-purple-500/20', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' },
  sinh: { bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
  van: { bg: 'bg-amber-500/10 dark:bg-amber-500/20', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' },
  su: { bg: 'bg-orange-500/10 dark:bg-orange-500/20', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800' },
  dia: { bg: 'bg-teal-500/10 dark:bg-teal-500/20', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-200 dark:border-teal-800' },
  anh: { bg: 'bg-rose-500/10 dark:bg-rose-500/20', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800' },
  khac: { bg: 'bg-zinc-500/10 dark:bg-zinc-500/20', text: 'text-zinc-700 dark:text-zinc-300', border: 'border-zinc-200 dark:border-zinc-800' },
};

export const LIST_KEYS = ['school', 'hsg_cpp', 'group_project'] as const;
export type ListKey = (typeof LIST_KEYS)[number];

export const LIST_KEY_LABELS: Record<ListKey, string> = {
  school: 'Trường học (Chính khóa)',
  hsg_cpp: 'Đội tuyển HSG Tin C++',
  group_project: 'Dự án nhóm',
};

export const PRIORITIES = ['high', 'medium', 'low'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const PRIORITY_LABELS: Record<Priority, string> = {
  high: 'Cao',
  medium: 'Trung bình',
  low: 'Thấp',
};

// Date regex YYYY-MM-DD
export const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// Zod schema for StudyTask
export const StudyTaskSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Tiêu đề không được để trống').max(200, 'Tiêu đề tối đa 200 ký tự'),
  subjectCode: z.enum(SUBJECT_CODES),
  track: z.string().max(50).optional(),
  status: z.enum(['pending', 'done']),
  plannedDate: z.string().regex(ISO_DATE_REGEX, 'Ngày dự kiến phải có định dạng YYYY-MM-DD'),
  durationMins: z.number().nonnegative().optional(),
  estMins: z.number().nonnegative().optional(),
  priority: z.enum(PRIORITIES),
  listKey: z.enum(LIST_KEYS),
  notes: z.string().max(500).optional(),
  reasonMissed: z.string().max(500).optional(),
  sourceTaskId: z.string().optional(),
  clientId: z.string().optional(),
  origin: z.enum(['manual', 'ai_plan']),
  syncStatus: z.enum(['not_synced', 'synced', 'failed']),
  googleTaskId: z.string().optional(),
  completedAt: z.string().optional(),
  createdAt: z.string(),
});

export type StudyTask = z.infer<typeof StudyTaskSchema>;

// Milestone schema
export const MilestoneSchema = z.object({
  id: z.string(),
  event: z.string().min(1, 'Tên mốc thi / deadline không được để trống').max(200),
  date: z.string().regex(ISO_DATE_REGEX, 'Ngày mốc thi phải có định dạng YYYY-MM-DD'),
});

export type Milestone = z.infer<typeof MilestoneSchema>;

// User Stats schema
export const UserStatsSchema = z.object({
  totalExp: z.number().default(0),
  level: z.number().default(1),
  streakDays: z.number().default(0),
  lastActiveDate: z.string().regex(ISO_DATE_REGEX),
});

export type UserStats = z.infer<typeof UserStatsSchema>;

// Profile schema
export const UserProfileSchema = z.object({
  displayName: z.string(),
  createdAt: z.string(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

// DAILY_REPORT schema (app -> Gemini)
export const DailyReportSchema = z.object({
  schema_version: z.literal(1),
  type: z.literal('DAILY_REPORT'),
  report_id: z.string(),
  current_date: z.string().regex(ISO_DATE_REGEX),
  timezone: z.literal('Asia/Ho_Chi_Minh'),
  gamification: z.object({
    streak_days: z.number().nonnegative(),
    current_level: z.number().positive(),
    exp_gained_today: z.number().nonnegative(),
  }),
  tomorrow_context: z.object({
    date: z.string().regex(ISO_DATE_REGEX),
    available_mins: z.number().positive(),
    fixed_commitments: z.array(z.string()),
  }),
  completed_tasks: z.array(
    z.object({
      id: z.string(),
      subject_code: z.enum(SUBJECT_CODES),
      track: z.string().optional(),
      task: z.string(),
      duration_mins: z.number().nonnegative(),
    })
  ),
  pending_tasks: z.array(
    z.object({
      id: z.string(),
      subject_code: z.enum(SUBJECT_CODES),
      task: z.string(),
      reason_missed: z.string().optional(),
      deadline: z.string().optional(),
      estimated_mins: z.number().nonnegative().optional(),
    })
  ),
  upcoming_milestones: z.array(
    z.object({
      event: z.string(),
      date: z.string().regex(ISO_DATE_REGEX),
    })
  ),
});

export type DailyReport = z.infer<typeof DailyReportSchema>;

// TaskToSync schema inside AI_PLANNING
export const TaskToSyncSchema = z.object({
  client_id: z.string().min(1, 'client_id không được để trống'),
  source_task_id: z.string().nullable().optional(),
  title: z.string().min(1, 'title không được để trống'),
  subject_code: z.enum(SUBJECT_CODES, {
    message: `subject_code phải là một trong các mã: ${SUBJECT_CODES.join(', ')}`,
  }),
  est_mins: z.number().positive('est_mins phải là số phút nguyên dương lớn hơn 0'),
  priority: z.enum(PRIORITIES, {
    message: 'priority phải là high, medium hoặc low',
  }),
  list_key: z.enum(LIST_KEYS, {
    message: `list_key phải là một trong: ${LIST_KEYS.join(', ')}`,
  }),
  notes: z.string().optional().default(''),
});

export type TaskToSync = z.infer<typeof TaskToSyncSchema>;

// AI_PLANNING schema (Gemini -> app)
export const AiPlanningSchema = z.object({
  schema_version: z.literal(1, {
    message: 'schema_version phải là số 1',
  }),
  type: z.literal('AI_PLANNING', {
    message: 'type phải có giá trị "AI_PLANNING"',
  }),
  in_response_to: z.string().min(1, 'in_response_to không được để trống'),
  target_date: z.string().regex(ISO_DATE_REGEX, 'target_date phải có định dạng YYYY-MM-DD'),
  ai_insight: z.string().max(400, 'ai_insight tối đa 400 ký tự'),
  tasks_to_sync: z
    .array(TaskToSyncSchema)
    .max(8, 'tasks_to_sync tối đa 8 nhiệm vụ'),
});

export type AiPlanning = z.infer<typeof AiPlanningSchema>;

/**
 * Format Zod validation errors to readable Vietnamese strings
 */
export function formatZodErrors(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const pathStr = issue.path.length > 0 ? issue.path.join('.') : 'root';
    return `${pathStr}: ${issue.message}`;
  });
}
