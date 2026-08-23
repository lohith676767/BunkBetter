import { useState } from 'react';
import { SubjectManager } from '../SubjectManager';
import { ImportFromPhoto } from '../ImportFromPhoto';
import { DayTimetableEditor } from './DayTimetableEditor';

type Tab = 'timetable' | 'subjects' | 'import';

export function TimetableView() {
  const [tab, setTab] = useState<Tab>('timetable');
  const [importMessage, setImportMessage] = useState<string | null>(null);

  return (
    <div className="space-y-4 p-4">
      <div>
        <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Timetable</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Tap a period to assign a class. Labs can span up to 3 back-to-back periods.
        </p>
      </div>

      <div className="flex gap-1.5 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-900">
        {(
          [
            ['timetable', 'Weekly grid'],
            ['subjects', 'Subjects'],
            ['import', 'Import from photo'],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors ${
              tab === id
                ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-neutral-100'
                : 'text-neutral-500 dark:text-neutral-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'timetable' && (
        <>
          {importMessage && (
            <p className="rounded-xl bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              {importMessage}
            </p>
          )}
          <DayTimetableEditor />
        </>
      )}
      {tab === 'subjects' && <SubjectManager />}
      {tab === 'import' && (
        <div className="space-y-3">
          <p className="rounded-xl bg-amber-50 px-3.5 py-2.5 text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-400">
            Re-importing replaces your current subjects and weekly grid entirely — good for a new semester, not for
            tweaking one class.
          </p>
          <ImportFromPhoto
            onImported={({ subjectCount, entryCount }) => {
              setImportMessage(`Imported ${subjectCount} subjects and ${entryCount} classes. Review the grid below.`);
              setTab('timetable');
            }}
          />
        </div>
      )}
    </div>
  );
}
