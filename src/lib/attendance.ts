import type { AttendanceStatus } from '../types';

export interface AttendanceStats {
  present: number;
  absent: number;
  cancelled: number;
  /** counted classes = present + absent (cancelled classes are excluded entirely) */
  total: number;
  /** 0-100, null when no classes have been counted yet */
  percent: number | null;
}

export function computeStats(statuses: AttendanceStatus[]): AttendanceStats {
  let present = 0;
  let absent = 0;
  let cancelled = 0;
  for (const s of statuses) {
    if (s === 'present') present += 1;
    else if (s === 'absent') absent += 1;
    else cancelled += 1;
  }
  const total = present + absent;
  return { present, absent, cancelled, total, percent: total === 0 ? null : (present / total) * 100 };
}

/**
 * How many more classes can be missed in a row while staying at/above the
 * target percentage (present count stays fixed, total grows by the miss).
 */
export function safeBunks(present: number, total: number, targetPercent: number): number {
  const target = targetPercent / 100;
  if (target <= 0) return Infinity;
  if (target >= 1) return present >= total ? 0 : -1;
  const raw = present / target - total;
  return Math.floor(raw + 1e-9);
}

/**
 * How many consecutive future classes must be attended (assuming all are
 * present) to bring the percentage back up to the target.
 */
export function classesNeededToRecover(present: number, total: number, targetPercent: number): number {
  const target = targetPercent / 100;
  if (target >= 1) return present >= total ? 0 : Infinity;
  const raw = (target * total - present) / (1 - target);
  return Math.max(0, Math.ceil(raw - 1e-9));
}

export interface BunkVerdict {
  percent: number | null;
  isAboveTarget: boolean;
  /** positive: classes you can still skip. Present only when at/above target. */
  safeBunks?: number;
  /** classes you must attend in a row to reach the target. Present only when below target. */
  needToRecover?: number;
}

export function bunkVerdict(present: number, total: number, targetPercent: number): BunkVerdict {
  const stats = computeStats([
    ...Array(present).fill('present' as const),
    ...Array(Math.max(0, total - present)).fill('absent' as const),
  ]);
  if (total === 0) {
    return { percent: null, isAboveTarget: true, safeBunks: 0 };
  }
  const percent = stats.percent as number;
  const isAboveTarget = percent >= targetPercent;
  if (isAboveTarget) {
    return { percent, isAboveTarget, safeBunks: Math.max(0, safeBunks(present, total, targetPercent)) };
  }
  return { percent, isAboveTarget, needToRecover: classesNeededToRecover(present, total, targetPercent) };
}
