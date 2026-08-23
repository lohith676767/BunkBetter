import type { AttendanceStatus } from '../types';

const OPTIONS: { status: AttendanceStatus; label: string; activeClass: string }[] = [
  { status: 'present', label: 'Present', activeClass: 'bg-emerald-600 text-white' },
  { status: 'absent', label: 'Absent', activeClass: 'bg-rose-600 text-white' },
  { status: 'cancelled', label: 'Cancelled', activeClass: 'bg-amber-500 text-white' },
];

export function AttendanceButtons({
  current,
  onSet,
  onClear,
  disablePresentAbsent,
}: {
  current?: AttendanceStatus;
  onSet: (status: AttendanceStatus) => void;
  onClear: () => void;
  disablePresentAbsent?: boolean;
}) {
  return (
    <div className="flex gap-1.5">
      {OPTIONS.map((opt) => {
        const isActive = current === opt.status;
        const disabled = Boolean(disablePresentAbsent) && opt.status !== 'cancelled' && !isActive;
        return (
          <button
            key={opt.status}
            type="button"
            disabled={disabled}
            onClick={() => (isActive ? onClear() : onSet(opt.status))}
            title={disabled ? "Class hasn't started yet" : undefined}
            className={`flex-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              isActive
                ? opt.activeClass
                : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700'
            }`}
          >
            {isActive ? `✓ ${opt.label}` : opt.label}
          </button>
        );
      })}
    </div>
  );
}
