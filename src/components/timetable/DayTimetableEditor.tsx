import { useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { buildDayStructure, formatTime12 } from '../../lib/schedule';
import { buildDayView } from '../../lib/dayView';
import { DAY_SHORT, type DayOfWeek } from '../../types';
import { ClassSlotModal } from './ClassSlotModal';

export function DayTimetableEditor() {
  const settings = useAppStore((s) => s.settings);
  const timetable = useAppStore((s) => s.timetable);
  const subjects = useAppStore((s) => s.subjects);

  const [day, setDay] = useState<DayOfWeek>(settings.activeDays[0] ?? 'mon');
  const [modalPeriod, setModalPeriod] = useState<number | null>(null);

  const structure = useMemo(() => buildDayStructure(settings.lunchType), [settings.lunchType]);
  const rows = useMemo(() => buildDayView(day, structure, timetable), [day, structure, timetable]);
  const subjectById = useMemo(() => Object.fromEntries(subjects.map((s) => [s.id, s])), [subjects]);

  const editingEntry = rows.find((r) => r.kind === 'entry' && r.entry?.startPeriod === modalPeriod)?.entry;

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {settings.activeDays.map((d) => (
          <button
            key={d}
            onClick={() => setDay(d)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              day === d
                ? 'bg-indigo-600 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
            }`}
          >
            {DAY_SHORT[d]}
          </button>
        ))}
      </div>

      <ul className="space-y-1.5">
        {rows.map((row) => {
          if (row.kind === 'break' || row.kind === 'lunch') {
            return (
              <li
                key={row.key}
                className="flex items-center justify-center gap-2 rounded-lg bg-neutral-100/70 px-3 py-1.5 text-xs font-medium text-neutral-400 dark:bg-neutral-900/60 dark:text-neutral-500"
              >
                {row.label} · {formatTime12(row.time.start)}–{formatTime12(row.time.end)}
              </li>
            );
          }
          if (row.kind === 'empty') {
            return (
              <li key={row.key}>
                <button
                  onClick={() => setModalPeriod(row.period ?? null)}
                  className="flex w-full items-center justify-between rounded-xl border border-dashed border-neutral-300 px-4 py-3 text-left text-sm text-neutral-400 hover:border-indigo-400 hover:text-indigo-500 dark:border-neutral-700 dark:hover:border-indigo-500"
                >
                  <span>
                    P{row.period} · {formatTime12(row.time.start)}–{formatTime12(row.time.end)}
                  </span>
                  <span className="font-medium">+ Add</span>
                </button>
              </li>
            );
          }
          const entry = row.entry!;
          const subject = subjectById[entry.subjectId];
          return (
            <li key={row.key}>
              <button
                onClick={() => setModalPeriod(entry.startPeriod)}
                className="flex w-full items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-left shadow-sm hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
              >
                <span
                  className="h-9 w-1.5 shrink-0 rounded-full"
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
                    {entry.room ? ` · ${entry.room}` : ''}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-medium capitalize text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                  {entry.type}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {modalPeriod !== null && (
        <ClassSlotModal day={day} startPeriod={modalPeriod} existing={editingEntry} onClose={() => setModalPeriod(null)} />
      )}
    </div>
  );
}
