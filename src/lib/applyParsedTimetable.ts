import { useAppStore } from '../store/useAppStore';
import { SUBJECT_COLORS, type ClassType, type DayOfWeek } from '../types';
import type { ParsedTimetable } from './gemini';

const DAY_KEYS: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

/**
 * Replaces the current subjects/timetable with a Gemini-parsed result. Entries that would
 * overlap an already-placed one for the same day (malformed model output) are dropped rather
 * than silently corrupting the grid — the user can fix gaps afterward in the editor.
 */
export function applyParsedTimetable(parsed: ParsedTimetable): { subjectCount: number; entryCount: number } {
  const store = useAppStore.getState();

  for (const entry of [...store.timetable]) store.removeTimetableEntry(entry.id);
  for (const subject of [...store.subjects]) store.removeSubject(subject.id);

  const codeToSubjectId = new Map<string, string>();
  let colorIndex = 0;
  function nextColor(): string {
    const color = SUBJECT_COLORS[colorIndex % SUBJECT_COLORS.length];
    colorIndex += 1;
    return color;
  }

  for (const s of parsed.subjects) {
    const code = s.code?.trim();
    if (!code || codeToSubjectId.has(code)) continue;
    const created = store.addSubject(s.name?.trim() || code, code, nextColor());
    codeToSubjectId.set(code, created.id);
  }

  function resolveSubjectId(rawCode: string): string {
    const code = rawCode.trim();
    const existing = codeToSubjectId.get(code);
    if (existing) return existing;
    const created = store.addSubject(code, code, nextColor());
    codeToSubjectId.set(code, created.id);
    return created.id;
  }

  let entryCount = 0;
  for (const day of DAY_KEYS) {
    const rows = parsed.days[day];
    if (!rows) continue;
    const occupied = new Set<number>();

    for (const row of rows) {
      if (!row.code?.trim()) continue;
      const period = clamp(row.period, 1, 8);
      const requestedSpan = clamp(row.span || 1, 1, 3);
      const span = Math.min(requestedSpan, 8 - period + 1);
      const periods = Array.from({ length: span }, (_, i) => period + i);
      if (periods.some((p) => occupied.has(p))) continue;

      const subjectId = resolveSubjectId(row.code);
      const type: ClassType = row.type === 'lab' || row.type === 'tutorial' ? row.type : 'lecture';
      store.upsertTimetableEntry({ day, startPeriod: period, span, subjectId, type });
      periods.forEach((p) => occupied.add(p));
      entryCount += 1;
    }
  }

  store.updateSettings({ lunchType: parsed.lunchAfterPeriod === 4 ? 'alternate' : 'standard' });

  return { subjectCount: codeToSubjectId.size, entryCount };
}
