import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateExpForTask,
  calculateLevel,
  getLevelProgress,
  sanitizeStatsStreak,
  computeStatsAfterCompletion,
} from './gamification.ts';
import { getDaysDifference, addDays } from './dateUtils.ts';
import {
  AiPlanningSchema,
  DailyReportSchema,
  formatZodErrors,
} from './schemas.ts';

test('gamification: calculateExpForTask computes durationMins + 10', () => {
  assert.equal(calculateExpForTask(0), 10);
  assert.equal(calculateExpForTask(45), 55);
  assert.equal(calculateExpForTask(90), 100);
  assert.equal(calculateExpForTask(undefined), 10);
});

test('gamification: calculateLevel correctly tiers by 500 EXP', () => {
  assert.equal(calculateLevel(0), 1);
  assert.equal(calculateLevel(499), 1);
  assert.equal(calculateLevel(500), 2);
  assert.equal(calculateLevel(1450), 3);
  assert.equal(calculateLevel(5000), 11);
});

test('gamification: getLevelProgress returns accurate percent and remaining EXP', () => {
  const p1 = getLevelProgress(250);
  assert.equal(p1.currentLevel, 1);
  assert.equal(p1.expInCurrentLevel, 250);
  assert.equal(p1.progressPercent, 50);
  assert.equal(p1.expRemaining, 250);

  const p2 = getLevelProgress(550);
  assert.equal(p2.currentLevel, 2);
  assert.equal(p2.expInCurrentLevel, 50);
  assert.equal(p2.progressPercent, 10);
  assert.equal(p2.expRemaining, 450);
});

test('gamification: streak increment and reset logic', () => {
  const baseStats = {
    totalExp: 100,
    level: 1,
    streakDays: 3,
    lastActiveDate: '2026-11-01',
  };

  // Same day completion does not increase streak again
  const sameDay = computeStatsAfterCompletion(baseStats, 30, '2026-11-01');
  assert.equal(sameDay.nextStats.streakDays, 3);
  assert.equal(sameDay.nextStats.totalExp, 140);

  // Consecutive day (next day) increments streak
  const nextDay = computeStatsAfterCompletion(baseStats, 30, '2026-11-02');
  assert.equal(nextDay.nextStats.streakDays, 4);
  assert.equal(nextDay.nextStats.lastActiveDate, '2026-11-02');

  // Skipped full day resets streak to 1
  const skippedDay = computeStatsAfterCompletion(baseStats, 30, '2026-11-05');
  assert.equal(skippedDay.nextStats.streakDays, 1);
});

test('dateUtils: getDaysDifference and addDays', () => {
  assert.equal(getDaysDifference('2026-11-06', '2026-11-02'), 4);
  assert.equal(getDaysDifference('2026-11-02', '2026-11-02'), 0);
  assert.equal(getDaysDifference('2026-10-31', '2026-11-02'), -2);
  assert.equal(addDays('2026-11-02', 3), '2026-11-05');
});

test('schemas: DailyReportSchema validates valid contract', () => {
  const validReport = {
    schema_version: 1,
    type: 'DAILY_REPORT',
    report_id: 'rpt_20261102',
    current_date: '2026-11-02',
    timezone: 'Asia/Ho_Chi_Minh',
    gamification: {
      streak_days: 14,
      current_level: 8,
      exp_gained_today: 350,
    },
    tomorrow_context: {
      date: '2026-11-03',
      available_mins: 150,
      fixed_commitments: ['Học chính khóa 7h-11h30'],
    },
    completed_tasks: [
      {
        id: 't_101',
        subject_code: 'tin',
        track: 'HSG C++',
        task: 'Luyện 3 bài DP',
        duration_mins: 90,
      },
    ],
    pending_tasks: [
      {
        id: 't_103',
        subject_code: 'dia',
        task: 'Học địa lý',
        reason_missed: 'Chưa kịp',
        deadline: '2026-11-06',
        estimated_mins: 30,
      },
    ],
    upcoming_milestones: [{ event: 'KTGK 1 Địa Lý', date: '2026-11-06' }],
  };

  const result = DailyReportSchema.safeParse(validReport);
  assert.equal(result.success, true);
});

test('schemas: AiPlanningSchema validates valid and rejects invalid payloads', () => {
  const validPlan = {
    schema_version: 1,
    type: 'AI_PLANNING',
    in_response_to: 'rpt_20261102',
    target_date: '2026-11-03',
    ai_insight: 'Bạn đã hoàn thành tốt môn Tin học hôm nay, hãy tập trung môn Địa lý vào ngày mai.',
    tasks_to_sync: [
      {
        client_id: 'p_20261103_01',
        source_task_id: 't_103',
        title: 'Ôn tập trắc nghiệm Địa lý chương 1',
        subject_code: 'dia',
        est_mins: 30,
        priority: 'high',
        list_key: 'school',
        notes: 'Xem lại bài 4',
      },
    ],
  };

  const validRes = AiPlanningSchema.safeParse(validPlan);
  assert.equal(validRes.success, true);

  // Reject invalid subject_code
  const invalidSubject = {
    ...validPlan,
    tasks_to_sync: [
      {
        ...validPlan.tasks_to_sync[0],
        subject_code: 'unknown_subject',
      },
    ],
  };
  const invalidRes = AiPlanningSchema.safeParse(invalidSubject);
  assert.equal(invalidRes.success, false);
  if (!invalidRes.success) {
    const errors = formatZodErrors(invalidRes.error);
    assert.match(errors[0], /subject_code/);
  }
});
