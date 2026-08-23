import { useState } from 'react';
import { SubjectManager } from '../SubjectManager';
import { DayTimetableEditor } from './DayTimetableEditor';

export function TimetableView() {
  const [tab, setTab] = useState<'timetable' | 'subjects'>('timetable');

  return (
    <div className="space-y-4 p-4">
      <div>
        <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Timetable</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Tap a period to assign a class. Labs can span up to 3 back-to-back periods.
        </p>
      </div>

      <div className="flex gap-1.5 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-900">
        <button
          onClick={() => setTab('timetable')}
          className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors ${
            tab === 'timetable'
              ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-neutral-100'
              : 'text-neutral-500 dark:text-neutral-400'
          }`}
        >
          Weekly grid
        </button>
        <button
          onClick={() => setTab('subjects')}
          className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors ${
            tab === 'subjects'
              ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-neutral-100'
              : 'text-neutral-500 dark:text-neutral-400'
          }`}
        >
          Subjects
        </button>
      </div>

      {tab === 'timetable' ? <DayTimetableEditor /> : <SubjectManager />}
    </div>
  );
}
