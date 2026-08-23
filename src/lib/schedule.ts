import type { LunchType, StructureSlot } from '../types';

const PERIOD_MINUTES = 45;
const SHORT_BREAK_MINUTES = 20;
const LUNCH_MINUTES = 60;
const DAY_START = '08:00';

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + mins;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export function formatTime12(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

export function minutesSinceMidnight(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Builds the fixed daily structure (periods + breaks + lunch) for a given
 * lunch schedule. Both variants run 8:00-3:40, 8x45min periods, two 20min
 * breaks (9:30-9:50 and 1:50-2:10); only the lunch placement differs.
 */
export function buildDayStructure(lunchType: LunchType): StructureSlot[] {
  const slots: StructureSlot[] = [];
  let cursor = DAY_START;
  let periodIndex = 0;

  const pushPeriod = () => {
    periodIndex += 1;
    const end = addMinutes(cursor, PERIOD_MINUTES);
    slots.push({ period: periodIndex, kind: 'class', time: { start: cursor, end } });
    cursor = end;
  };
  const pushBreak = (mins: number, label: string, kind: 'break' | 'lunch') => {
    const end = addMinutes(cursor, mins);
    slots.push({ period: 0, kind, time: { start: cursor, end }, label });
    cursor = end;
  };

  if (lunchType === 'standard') {
    pushPeriod(); // 1
    pushPeriod(); // 2
    pushBreak(SHORT_BREAK_MINUTES, 'Break', 'break');
    pushPeriod(); // 3
    pushPeriod(); // 4
    pushPeriod(); // 5
    pushBreak(LUNCH_MINUTES, 'Lunch', 'lunch');
    pushPeriod(); // 6
    pushBreak(SHORT_BREAK_MINUTES, 'Break', 'break');
    pushPeriod(); // 7
    pushPeriod(); // 8
  } else {
    pushPeriod(); // 1
    pushPeriod(); // 2
    pushBreak(SHORT_BREAK_MINUTES, 'Break', 'break');
    pushPeriod(); // 3
    pushPeriod(); // 4
    pushBreak(LUNCH_MINUTES, 'Lunch', 'lunch');
    pushPeriod(); // 5
    pushPeriod(); // 6
    pushBreak(SHORT_BREAK_MINUTES, 'Break', 'break');
    pushPeriod(); // 7
    pushPeriod(); // 8
  }

  return slots;
}

export function periodTime(lunchType: LunchType, period: number): TimeRangeResult {
  const slot = buildDayStructure(lunchType).find((s) => s.period === period && s.kind === 'class');
  if (!slot) throw new Error(`Invalid period ${period}`);
  return slot.time;
}

type TimeRangeResult = { start: string; end: string };

export function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function nowHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const ISO_DAY_TO_DOW: Array<import('../types').DayOfWeek> = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export function dowForDate(date: Date): import('../types').DayOfWeek {
  return ISO_DAY_TO_DOW[date.getDay()];
}

export function isoDateFor(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
