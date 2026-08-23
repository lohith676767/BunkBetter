import type { DayOfWeek, StructureSlot, TimeRange, TimetableEntry } from '../types';

export interface DayViewRow {
  key: string;
  kind: 'break' | 'lunch' | 'empty' | 'entry';
  time: TimeRange;
  label?: string;
  period?: number;
  entry?: TimetableEntry;
  periods?: number[];
}

/** Merges the fixed daily structure with a day's timetable entries into a flat list of rows for rendering. */
export function buildDayView(day: DayOfWeek, structure: StructureSlot[], entries: TimetableEntry[]): DayViewRow[] {
  const dayEntries = entries.filter((e) => e.day === day);
  const rows: DayViewRow[] = [];
  let skipUntil = 0;

  for (const slot of structure) {
    if (slot.kind !== 'class') {
      rows.push({ key: `${slot.kind}-${slot.time.start}`, kind: slot.kind, time: slot.time, label: slot.label });
      continue;
    }
    if (slot.period <= skipUntil) continue;

    const entry = dayEntries.find((e) => e.startPeriod === slot.period);
    if (entry) {
      const periods = Array.from({ length: entry.span }, (_, i) => entry.startPeriod + i);
      const lastPeriod = periods[periods.length - 1];
      const endSlot = structure.find((s) => s.period === lastPeriod && s.kind === 'class');
      rows.push({
        key: entry.id,
        kind: 'entry',
        time: { start: slot.time.start, end: endSlot?.time.end ?? slot.time.end },
        entry,
        periods,
      });
      skipUntil = lastPeriod;
    } else {
      rows.push({ key: `empty-${slot.period}`, kind: 'empty', time: slot.time, period: slot.period });
    }
  }
  return rows;
}

/** Groups consecutive class periods that aren't separated by a break/lunch. */
export function classRuns(structure: StructureSlot[]): number[][] {
  const runs: number[][] = [];
  let current: number[] = [];
  for (const slot of structure) {
    if (slot.kind === 'class') {
      current.push(slot.period);
    } else if (current.length) {
      runs.push(current);
      current = [];
    }
  }
  if (current.length) runs.push(current);
  return runs;
}

/** Max consecutive periods (capped at 3) a new/edited entry can span starting at startPeriod without crossing a break or an already-occupied period. */
export function maxSpanFor(
  day: DayOfWeek,
  startPeriod: number,
  structure: StructureSlot[],
  entries: TimetableEntry[],
  excludeEntryId?: string,
): number {
  const runs = classRuns(structure);
  const run = runs.find((r) => r.includes(startPeriod));
  if (!run) return 1;
  const runEnd = run[run.length - 1];

  const dayEntries = entries.filter((e) => e.day === day && e.id !== excludeEntryId);
  let nextOccupied = runEnd + 1;
  for (const e of dayEntries) {
    for (let p = e.startPeriod; p < e.startPeriod + e.span; p++) {
      if (p > startPeriod && p < nextOccupied) nextOccupied = p;
    }
  }
  return Math.max(1, Math.min(3, nextOccupied - startPeriod, runEnd - startPeriod + 1));
}
