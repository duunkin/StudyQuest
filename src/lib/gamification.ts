import { getDaysDifference, getTodayDateVN } from './dateUtils';
import type { UserStats } from './schemas';

// Easy-to-edit Gamification Constants
export const EXP_BASE_PER_TASK = 10;
export const EXP_PER_LEVEL = 500;

/**
 * Compute EXP gained for completing a task
 * Formula: durationMins + 10 (or 10 if durationMins is not specified)
 */
export function calculateExpForTask(durationMins?: number): number {
  const mins = Math.max(0, Math.floor(durationMins || 0));
  return mins + EXP_BASE_PER_TASK;
}

/**
 * Compute current Level based on total EXP
 * Formula: floor(totalExp / 500) + 1
 */
export function calculateLevel(totalExp: number): number {
  if (totalExp < 0) return 1;
  return Math.floor(totalExp / EXP_PER_LEVEL) + 1;
}

/**
 * Compute Level progress details for the progress bar
 */
export function getLevelProgress(totalExp: number) {
  const currentLevel = calculateLevel(totalExp);
  const expInCurrentLevel = totalExp % EXP_PER_LEVEL;
  const progressPercent = Math.min(100, Math.max(0, Math.round((expInCurrentLevel / EXP_PER_LEVEL) * 100)));
  const expRemaining = EXP_PER_LEVEL - expInCurrentLevel;

  return {
    currentLevel,
    expInCurrentLevel,
    expForNextLevel: EXP_PER_LEVEL,
    progressPercent,
    expRemaining,
  };
}

/**
 * Check and sanitize streak state upon reading stats (e.g., if a full day has passed without activity)
 */
export function sanitizeStatsStreak(stats: UserStats, today = getTodayDateVN()): UserStats {
  if (!stats.lastActiveDate) {
    return { ...stats, streakDays: 0 };
  }
  const diffDays = getDaysDifference(today, stats.lastActiveDate);
  // diffDays = 0: active today
  // diffDays = 1: active yesterday (streak still intact, waiting for today's task)
  // diffDays > 1: missed a full day, streak is 0
  if (diffDays > 1) {
    return {
      ...stats,
      streakDays: 0,
    };
  }
  return stats;
}

/**
 * Compute updated UserStats when a task is marked completed
 */
export function computeStatsAfterCompletion(
  prevStats: UserStats,
  durationMins: number | undefined,
  completedDate = getTodayDateVN()
): { nextStats: UserStats; expGained: number } {
  const expGained = calculateExpForTask(durationMins);
  const newTotalExp = prevStats.totalExp + expGained;
  const newLevel = calculateLevel(newTotalExp);

  let newStreak = prevStats.streakDays;
  const lastDate = prevStats.lastActiveDate;

  if (!lastDate) {
    // First time active
    newStreak = 1;
  } else {
    const diff = getDaysDifference(completedDate, lastDate);
    if (diff === 0) {
      // Already active today, streak doesn't increment again today
      newStreak = Math.max(1, prevStats.streakDays);
    } else if (diff === 1) {
      // Active yesterday, streak continues!
      newStreak = prevStats.streakDays + 1;
    } else {
      // Missed one or more full days, reset to 1
      newStreak = 1;
    }
  }

  const nextStats: UserStats = {
    totalExp: newTotalExp,
    level: newLevel,
    streakDays: newStreak,
    lastActiveDate: completedDate,
  };

  return { nextStats, expGained };
}
