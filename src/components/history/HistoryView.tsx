import { useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { buildDayStructure, dowForDate, formatTime12, isoDateFor } from '../../lib/schedule';
import { buildDayView } from '../../lib/dayView';
import { AttendanceButtons } from '../AttendanceButtons';

export function HistoryView() {
  const settings = useAppStore((s) => s.settings);
  const timetable = useAppStore((s) => s.timetable);
  const subjects = useAppStore((s) => s.subjects);
  const attendance = useAppStore((s) => s.attendance);
  const markAttendance = useAppStore((s) => s.markAttendance);
  const clearAttendance = useAppStore((s) => s.clearAttendance);

  const todayIsoStr = useMemo(() => isoDateFor(new Date()), []);
  const [selected, setSelected] = useState(todayIsoStr);

  const selectedDateObj = useMemo(() => {
    const [y, m, d] = selected.split('-').map(Number);
    return new Date(y, m - 1, d);
  }, [selected]);
  const day = dowForDate(selectedDateObj);
  const isActiveDay = settings.activeDays.includes(day);

  const structure = useMemo(() => buildDayStructure(settings.lunchType), [settings.lunchType]);
  const rows = useMemo(
    () => buildDayView(day, structure, timetable).filter((r) => r.kind === 'entry'),
    [day, structure, timetable],
  );
  const subjectById = useMemo(() => Object.fromEntries(subjects.map((s) => [s.id, s])), [subjects]);

  function shiftDay(delta: number) {
    const d = new Date(selectedDateObj);
    d.setDate(d.getDate() + delta);
    const iso = isoDateFor(d);
    if (iso > todayIsoStr) return;
    setSelected(iso);
  }

  return (
    <div className="space-y-4 p-4">
      <div>
        <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">History</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Review or fix attendance for any past day.</p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => shiftDay(-1)}
          className="rounded-lg bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
          aria-label="Previous day"
        >
          ←
        </button>
        <input
          type="date"
          value={selected}
          max={todayIsoStr}
          onChange={(e) => e.target.value && setSelected(e.target.value)}
          className="flex-1 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
        <button
          onClick={() => shiftDay(1)}
          disabled={selected >= todayIsoStr}
          className="rounded-lg bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200 disabled:opacity-40 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
          aria-label="Next day"
        >
          →
        </button>
      </div>

      {!isActiveDay ? (
        <EmptyState message="No classes scheduled on this day." />
      ) : rows.length === 0 ? (
        <EmptyState message="No classes set up for this day." />
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => {
            const entry = row.entry!;
            const subject = subjectById[entry.subjectId];
            const record = attendance[`${selected}__${entry.id}`];
            return (
              <li
                key={row.key}
                className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div className="flex items-start gap-3">
                  <span
                    className="mt-1 h-9 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: subject?.color ?? '#a3a3a3' }}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      {subject?.name ?? 'Unknown subject'}
                    </p>
                    <p className="text-xs text-neutral-400">
                      P{row.periods?.[0]}
                      {row.periods && row.periods.length > 1 ? `–${row.periods[row.periods.length - 1]}` : ''} ·{' '}
                      {formatTime12(row.time.start)}–{formatTime12(row.time.end)}
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <AttendanceButtons
                    current={record?.status}
                    onSet={(status) => markAttendance(selected, entry.id, entry.subjectId, status)}
                    onClear={() => clearAttendance(selected, entry.id)}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-neutral-300 px-4 py-8 text-center text-sm text-neutral-400 dark:border-neutral-700">
      {message}
    </div>
  );
}
