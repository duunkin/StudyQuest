/**
 * Date and Time utilities for Asia/Ho_Chi_Minh (UTC+7)
 */

export const TIMEZONE = 'Asia/Ho_Chi_Minh';

/**
 * Get current date in Asia/Ho_Chi_Minh as YYYY-MM-DD
 */
export function getTodayDateVN(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date());
}

/**
 * Get tomorrow date in Asia/Ho_Chi_Minh as YYYY-MM-DD
 */
export function getTomorrowDateVN(): string {
  const todayStr = getTodayDateVN();
  const [y, m, d] = todayStr.split('-').map(Number);
  // Calculate next day using UTC to avoid local machine timezone distortion
  const nextDate = new Date(Date.UTC(y, m - 1, d + 1));
  return nextDate.toISOString().slice(0, 10);
}

/**
 * Add or subtract days to an ISO YYYY-MM-DD date
 */
export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

/**
 * Compute difference in calendar days between targetDate and baseDate (target - base).
 * If targetDate is today, returns 0.
 * If targetDate is tomorrow, returns 1.
 * If targetDate has passed, returns negative number.
 */
export function getDaysDifference(targetDateStr: string, baseDateStr = getTodayDateVN()): number {
  const [ty, tm, td] = targetDateStr.split('-').map(Number);
  const [by, bm, bd] = baseDateStr.split('-').map(Number);

  const targetUtc = Date.UTC(ty, tm - 1, td);
  const baseUtc = Date.UTC(by, bm - 1, bd);

  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((targetUtc - baseUtc) / msPerDay);
}

/**
 * Format ISO date string into friendly Vietnamese display
 * e.g., "Thứ Hai, 02/11/2026"
 */
export function formatVNDate(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    return new Intl.DateTimeFormat('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(date);
  } catch {
    return dateStr;
  }
}

/**
 * Check if a date string is today in VN timezone
 */
export function isTodayVN(dateStr: string): boolean {
  return dateStr === getTodayDateVN();
}

/**
 * Check if a date string is tomorrow in VN timezone
 */
export function isTomorrowVN(dateStr: string): boolean {
  return dateStr === getTomorrowDateVN();
}
