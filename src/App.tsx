import { useState } from 'react';
import { useAppStore } from './store/useAppStore';
import { OnboardingWizard } from './components/onboarding/OnboardingWizard';
import { TodayView } from './components/today/TodayView';
import { DashboardView } from './components/dashboard/DashboardView';
import { TimetableView } from './components/timetable/TimetableView';
import { HistoryView } from './components/history/HistoryView';
import { SettingsView } from './components/settings/SettingsView';
import { TabBar, type Tab } from './components/TabBar';

function App() {
  const onboarded = useAppStore((s) => s.settings.onboarded);
  const [tab, setTab] = useState<Tab>('today');

  if (!onboarded) return <OnboardingWizard />;

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95">
        <p className="text-base font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          Bunk<span className="text-indigo-600 dark:text-indigo-400">Better</span>
        </p>
      </header>

      <main className="flex-1 overflow-y-auto">
        {tab === 'today' && <TodayView />}
        {tab === 'attendance' && <DashboardView />}
        {tab === 'timetable' && <TimetableView />}
        {tab === 'history' && <HistoryView />}
        {tab === 'settings' && <SettingsView />}
      </main>

      <TabBar tab={tab} setTab={setTab} />
    </div>
  );
}

export default App;
