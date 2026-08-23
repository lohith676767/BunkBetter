export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export const ALL_DAYS: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export const DAY_LABELS: Record<DayOfWeek, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

export const DAY_SHORT: Record<DayOfWeek, string> = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
};

/** standard = lunch 12:05-1:05 (CSE & most depts). alternate = lunch 11:20-12:20, 4 periods after. */
export type LunchType = 'standard' | 'alternate';

export interface TimeRange {
  start: string; // "HH:MM" 24h
  end: string;
}

export type StructureSlotKind = 'class' | 'break' | 'lunch';

export interface StructureSlot {
  /** 1-based period number; 0 for break/lunch rows */
  period: number;
  kind: StructureSlotKind;
  time: TimeRange;
  label?: string;
}

export const TOTAL_PERIODS = 8;

export type ClassType = 'lecture' | 'lab' | 'tutorial';

export const CLASS_TYPE_LABELS: Record<ClassType, string> = {
  lecture: 'Lecture',
  lab: 'Lab',
  tutorial: 'Tutorial',
};

export interface Subject {
  id: string;
  name: string;
  code?: string;
  /** hex color used as an accent for this subject throughout the UI */
  color: string;
}

export interface TimetableEntry {
  id: string;
  day: DayOfWeek;
  /** first period this entry occupies (1-8) */
  startPeriod: number;
  /** how many consecutive periods this entry spans (1-3), for clumped/lab classes */
  span: number;
  subjectId: string;
  type: ClassType;
  room?: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'cancelled';

export interface AttendanceRecord {
  /** `${date}__${timetableEntryId}` */
  id: string;
  date: string; // ISO yyyy-mm-dd
  timetableEntryId: string;
  subjectId: string;
  status: AttendanceStatus;
  markedAt: string; // ISO timestamp
}

export interface Settings {
  targetPercent: number;
  lunchType: LunchType;
  activeDays: DayOfWeek[];
  onboarded: boolean;
  /** stored locally on-device only; used to call the Gemini API directly from the browser for photo import */
  geminiApiKey?: string;
}

export const DEFAULT_SETTINGS: Settings = {
  targetPercent: 75,
  lunchType: 'standard',
  activeDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
  onboarded: false,
};

export const SUBJECT_COLORS = [
  '#f43f5e', // rose
  '#f97316', // orange
  '#eab308', // yellow
  '#84cc16', // lime
  '#10b981', // emerald
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#a855f7', // purple
  '#ec4899', // pink
  '#78716c', // stone
];
