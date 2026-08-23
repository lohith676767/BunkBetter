import { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { bunkVerdict, computeStats, type AttendanceStats, type BunkVerdict } from '../../lib/attendance';

export function DashboardView() {
  const subjects = useAppStore((s) => s.subjects);
  const attendance = useAppStore((s) => s.attendance);
  const targetPercent = useAppStore((s) => s.settings.targetPercent);

  const records = useMemo(() => Object.values(attendance), [attendance]);
  const overallStats = useMemo(() => computeStats(records.map((r) => r.status)), [records]);
  const overallVerdict = useMemo(
    () => bunkVerdict(overallStats.present, overallStats.total, targetPercent),
    [overallStats, targetPercent],
  );

  const perSubject = useMemo(
    () =>
      subjects.map((subject) => {
        const subjectRecords = records.filter((r) => r.subjectId === subject.id);
        const stats = computeStats(subjectRecords.map((r) => r.status));
        const verdict = bunkVerdict(stats.present, stats.total, targetPercent);
        return { subject, stats, verdict };
      }),
    [subjects, records, targetPercent],
  );

  return (
    <div className="space-y-5 p-4">
      <div>
        <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Attendance</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Target: {targetPercent}%</p>
      </div>

      <StatCard title="Overall" stats={overallStats} verdict={overallVerdict} targetPercent={targetPercent} big />

      {subjects.length === 0 ? (
        <p className="rounded-xl bg-neutral-100 px-4 py-3 text-sm text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
          Add subjects and fill in your timetable to see per-subject stats here.
        </p>
      ) : (
        <ul className="space-y-3">
          {perSubject.map(({ subject, stats, verdict }) => (
            <li key={subject.id}>
              <StatCard
                title={subject.name}
                color={subject.color}
                stats={stats}
                verdict={verdict}
                targetPercent={targetPercent}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatCard({
  title,
  color,
  stats,
  verdict,
  targetPercent,
  big,
}: {
  title: string;
  color?: string;
  stats: AttendanceStats;
  verdict: BunkVerdict;
  targetPercent: number;
  big?: boolean;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {color && <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />}
          <p
            className={`truncate font-semibold text-neutral-900 dark:text-neutral-100 ${big ? 'text-base' : 'text-sm'}`}
          >
            {title}
          </p>
        </div>
        <p className={`shrink-0 font-bold text-neutral-900 dark:text-neutral-100 ${big ? 'text-xl' : 'text-sm'}`}>
          {stats.percent === null ? '—' : `${stats.percent.toFixed(1)}%`}
        </p>
      </div>

      <div className="mt-2.5">
        <ProgressBar percent={stats.percent ?? 0} ok={verdict.isAboveTarget} />
      </div>

      <p className="mt-2 text-xs text-neutral-400">
        {stats.present} present · {stats.absent} absent
        {stats.cancelled ? ` · ${stats.cancelled} cancelled` : ''}
      </p>

      <div className="mt-1.5">
        <VerdictLine verdict={verdict} targetPercent={targetPercent} />
      </div>
    </div>
  );
}

function ProgressBar({ percent, ok }: { percent: number; ok: boolean }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
      <div
        className={`h-full rounded-full transition-all ${ok ? 'bg-emerald-500' : 'bg-rose-500'}`}
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  );
}

function VerdictLine({ verdict, targetPercent }: { verdict: BunkVerdict; targetPercent: number }) {
  if (verdict.percent === null) {
    return <p className="text-xs text-neutral-400">No classes recorded yet.</p>;
  }
  if (verdict.isAboveTarget) {
    const n = verdict.safeBunks ?? 0;
    return (
      <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
        {n === 0
          ? `Right at the edge — one more absence drops you below ${targetPercent}%.`
          : `Safe to miss ${n} more class${n === 1 ? '' : 'es'} and stay ≥ ${targetPercent}%.`}
      </p>
    );
  }
  const n = verdict.needToRecover ?? 0;
  return (
    <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
      {Number.isFinite(n)
        ? `Attend the next ${n} class${n === 1 ? '' : 'es'} in a row to reach ${targetPercent}%.`
        : `Can't reach ${targetPercent}% — target may need to be lower than 100%.`}
    </p>
  );
}
