import { useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { buildDayStructure, formatTime12 } from '../../lib/schedule';
import { maxSpanFor } from '../../lib/dayView';
import type { ClassType, DayOfWeek, TimetableEntry } from '../../types';
import { CLASS_TYPE_LABELS } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export function ClassSlotModal({
  day,
  startPeriod,
  existing,
  onClose,
}: {
  day: DayOfWeek;
  startPeriod: number;
  existing?: TimetableEntry;
  onClose: () => void;
}) {
  const subjects = useAppStore((s) => s.subjects);
  const timetable = useAppStore((s) => s.timetable);
  const settings = useAppStore((s) => s.settings);
  const upsertTimetableEntry = useAppStore((s) => s.upsertTimetableEntry);
  const removeTimetableEntry = useAppStore((s) => s.removeTimetableEntry);

  const structure = useMemo(() => buildDayStructure(settings.lunchType), [settings.lunchType]);
  const maxSpan = useMemo(
    () => maxSpanFor(day, startPeriod, structure, timetable, existing?.id),
    [day, startPeriod, structure, timetable, existing],
  );

  const [subjectId, setSubjectId] = useState(existing?.subjectId ?? subjects[0]?.id ?? '');
  const [type, setType] = useState<ClassType>(existing?.type ?? 'lecture');
  const [span, setSpan] = useState(Math.min(existing?.span ?? 1, maxSpan));
  const [room, setRoom] = useState(existing?.room ?? '');

  const slot = structure.find((s) => s.period === startPeriod);
  const endSlot = structure.find((s) => s.period === startPeriod + span - 1);

  function handleSave() {
    if (!subjectId) return;
    upsertTimetableEntry({ id: existing?.id, day, startPeriod, span, subjectId, type, room: room.trim() || undefined });
    onClose();
  }

  function handleDelete() {
    if (existing) removeTimetableEntry(existing.id);
    onClose();
  }

  if (subjects.length === 0) {
    return (
      <Modal open onClose={onClose} title="Add a subject first">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          You need at least one subject before you can fill in the timetable. Add one above, then come back here.
        </p>
        <Button variant="secondary" onClick={onClose} className="mt-4 w-full">
          Got it
        </Button>
      </Modal>
    );
  }

  return (
    <Modal open onClose={onClose} title={existing ? 'Edit class' : 'Add class'}>
      <div className="space-y-4">
        {slot && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Period {startPeriod}
            {span > 1 ? `–${startPeriod + span - 1}` : ''} · {formatTime12(slot.time.start)}–
            {formatTime12(endSlot?.time.end ?? slot.time.end)}
          </p>
        )}

        <div>
          <label className="mb-1.5 block text-xs font-medium text-neutral-500 dark:text-neutral-400">Subject</label>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 focus:border-indigo-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-neutral-500 dark:text-neutral-400">Type</label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(CLASS_TYPE_LABELS) as ClassType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  type === t
                    ? 'bg-indigo-600 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
                }`}
              >
                {CLASS_TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        {maxSpan > 1 && (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-neutral-500 dark:text-neutral-400">
              Periods (back-to-back, e.g. for labs)
            </label>
            <div className="flex gap-2">
              {Array.from({ length: maxSpan }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setSpan(n)}
                  className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                    span === n
                      ? 'bg-indigo-600 text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-xs font-medium text-neutral-500 dark:text-neutral-400">
            Room (optional)
          </label>
          <input
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            placeholder="e.g. Lab 3"
            className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-indigo-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
        </div>

        <div className="flex gap-2 pt-1">
          {existing && (
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          )}
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex-1" disabled={!subjectId}>
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}
