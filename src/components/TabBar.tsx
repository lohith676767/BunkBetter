export type Tab = 'today' | 'attendance' | 'timetable' | 'history' | 'settings';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'today', label: 'Today', icon: '📅' },
  { id: 'attendance', label: 'Attendance', icon: '📊' },
  { id: 'timetable', label: 'Timetable', icon: '🗓️' },
  { id: 'history', label: 'History', icon: '🕓' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

export function TabBar({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  return (
    <nav className="sticky bottom-0 z-30 border-t border-neutral-200 bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)] dark:border-neutral-800 dark:bg-neutral-950/95">
      <div className="mx-auto flex max-w-lg">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors ${
              tab === t.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-neutral-400 dark:text-neutral-500'
            }`}
          >
            <span className="text-base leading-none" aria-hidden>
              {t.icon}
            </span>
            {t.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
