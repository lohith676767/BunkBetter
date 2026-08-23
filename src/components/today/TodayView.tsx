import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { buildDayStructure, dowForDate, formatTime12, isoDateFor, minutesSinceMidnight, nowHHMM } from '../../lib/schedule';
import { buildDayView } from '../../lib/dayView';
import { AttendanceButtons } from '../AttendanceButtons';

export function TodayView() {
  const settings = useAppStore((s) => s.settings);
  const timetable = useAppStore((s) => s.timetable);
  const subjects = useAppStore((s) => s.subjects);
  const attendance = useAppStore((s) => s.attendance);
  const markAttendance = useAppStore((s) => s.markAttendance);
  const clearAttendance = useAppStore((s) => s.clearAttendance);

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const date = isoDateFor(now);
  const day = dowForDate(now);
  const nowMinutes = minutesSinceMidnight(nowHHMM());
  const isActiveDay = settings.activeDays.includes(day);

  const structure = useMemo(() => buildDayStructure(settings.lunchType), [settings.lunchType]);
  const rows = useMemo(() => buildDayView(day, structure, timetable), [day, structure, timetable]);
  const subjectById = useMemo(() => Object.fromEntries(subjects.map((s) => [s.id, s])), [subjects]);

  const entryRows = rows.filter((r) => r.kind === 'entry');

  return (
    <div className="space-y-4 p-4">
      <div>
        <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Today</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {!isActiveDay ? (
        <EmptyState message="No classes scheduled today. Enjoy the day off." />
      ) : entryRows.length === 0 ? (
        <EmptyState message="No classes set up for today yet. Add them in the Timetable tab." />
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => {
            if (row.kind !== 'entry') {
              return (
                <li
                  key={row.key}
                  className="flex items-center justify-center gap-2 rounded-lg bg-neutral-100/70 px-3 py-1.5 text-xs font-medium text-neutral-400 dark:bg-neutral-900/60 dark:text-neutral-500"
                >
                  {row.label} · {formatTime12(row.time.start)}–{formatTime12(row.time.end)}
                </li>
              );
            }

            const entry = row.entry!;
            const subject = subjectById[entry.subjectId];
            const record = attendance[`${date}__${entry.id}`];
            const startMinutes = minutesSinceMidnight(row.time.start);
            const endMinutes = minutesSinceMidnight(row.time.end);
            const hasStarted = nowMinutes >= startMinutes;
            const isCurrent = hasStarted && nowMinutes < endMinutes;

            return (
              <li
                key={row.key}
                className={`rounded-xl border bg-white p-4 shadow-sm dark:bg-neutral-900 ${
                  isCurrent
                    ? 'border-indigo-400 ring-1 ring-indigo-400 dark:border-indigo-500'
                    : 'border-neutral-200 dark:border-neutral-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span
                      className="mt-1 h-9 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: subject?.color ?? '#a3a3a3' }}
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {subject?.name ?? 'Unknown subject'}
                      </p>
                      <p className="text-xs text-neutral-400">
                        P{row.periods?.[0]}
                        {row.periods && row.periods.length > 1 ? `–${row.periods[row.periods.length - 1]}` : ''} ·{' '}
                        {formatTime12(row.time.start)}–{formatTime12(row.time.end)}
                        {entry.room ? ` · ${entry.room}` : ''}
                      </p>
                    </div>
                  </div>
                  {isCurrent && (
                    <span className="shrink-0 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300">
                      NOW
                    </span>
                  )}
                </div>
                <div className="mt-3">
                  <AttendanceButtons
                    current={record?.status}
                    disablePresentAbsent={!hasStarted}
                    onSet={(status) => markAttendance(date, entry.id, entry.subjectId, status)}
                    onClear={() => clearAttendance(date, entry.id)}
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
