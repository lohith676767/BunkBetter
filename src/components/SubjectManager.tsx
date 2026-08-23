import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { SUBJECT_COLORS } from '../types';
import { Button } from './ui/Button';

export function SubjectManager() {
  const subjects = useAppStore((s) => s.subjects);
  const addSubject = useAppStore((s) => s.addSubject);
  const removeSubject = useAppStore((s) => s.removeSubject);
  const timetable = useAppStore((s) => s.timetable);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  const nextColor = SUBJECT_COLORS[subjects.length % SUBJECT_COLORS.length];

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    addSubject(trimmed, code.trim() || undefined, nextColor);
    setName('');
    setCode('');
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleAdd} className="flex flex-col gap-2 sm:flex-row">
        <span
          className="mt-2.5 hidden h-3 w-3 shrink-0 rounded-full sm:block"
          style={{ backgroundColor: nextColor }}
          aria-hidden
        />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Subject name (e.g. Data Structures)"
          className="flex-1 rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-indigo-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Code (optional)"
          className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-indigo-500 focus:outline-none sm:w-28 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
        <Button type="submit" disabled={!name.trim()}>
          Add
        </Button>
      </form>

      {subjects.length === 0 ? (
        <p className="rounded-xl bg-neutral-100 px-4 py-3 text-sm text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
          No subjects yet. Add the subjects you have classes in first.
        </p>
      ) : (
        <ul className="divide-y divide-neutral-200 overflow-hidden rounded-xl border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
          {subjects.map((subject) => {
            const usedIn = timetable.filter((e) => e.subjectId === subject.id).length;
            return (
              <li key={subject.id} className="flex items-center gap-3 bg-white px-4 py-2.5 dark:bg-neutral-900">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: subject.color }}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {subject.name}
                    {subject.code ? (
                      <span className="ml-1.5 text-xs font-normal text-neutral-400">{subject.code}</span>
                    ) : null}
                  </p>
                  {usedIn > 0 && (
                    <p className="text-xs text-neutral-400">
                      {usedIn} slot{usedIn === 1 ? '' : 's'} in timetable
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    if (usedIn > 0 && !confirm(`Remove "${subject.name}"? This also removes it from ${usedIn} timetable slot(s).`)) return;
                    removeSubject(subject.id);
                  }}
                  className="rounded-lg px-2 py-1 text-xs font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950"
                >
                  Remove
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
