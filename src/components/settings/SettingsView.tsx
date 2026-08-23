import { useRef, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ALL_DAYS, DAY_LABELS, type DayOfWeek } from '../../types';
import { Button } from '../ui/Button';

export function SettingsView() {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const resetAll = useAppStore((s) => s.resetAll);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importedOk, setImportedOk] = useState(false);

  function toggleDay(day: DayOfWeek) {
    const isActive = settings.activeDays.includes(day);
    const next = isActive ? settings.activeDays.filter((d) => d !== day) : [...settings.activeDays, day];
    updateSettings({ activeDays: next });
  }

  function handleExport() {
    const state = useAppStore.getState();
    const data = JSON.stringify(
      {
        settings: state.settings,
        subjects: state.subjects,
        timetable: state.timetable,
        attendance: state.attendance,
        exportedAt: new Date().toISOString(),
      },
      null,
      2,
    );
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bunkbetter-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImportFile(file: File) {
    setImportError(null);
    setImportedOk(false);
    try {
      const parsed = JSON.parse(await file.text());
      if (!parsed.settings || !parsed.subjects || !parsed.timetable || !parsed.attendance) {
        throw new Error('missing fields');
      }
      useAppStore.setState({
        settings: parsed.settings,
        subjects: parsed.subjects,
        timetable: parsed.timetable,
        attendance: parsed.attendance,
      });
      setImportedOk(true);
    } catch {
      setImportError("That file doesn't look like a valid BunkBetter backup.");
    }
  }

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Settings</h1>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Attendance goal</h2>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={50}
            max={100}
            value={settings.targetPercent}
            onChange={(e) => updateSettings({ targetPercent: Number(e.target.value) })}
            className="flex-1 accent-indigo-600"
          />
          <span className="w-14 shrink-0 text-right text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {settings.targetPercent}%
          </span>
        </div>
        <p className="text-xs text-neutral-400">
          Minimum attendance % you need to maintain. Most colleges require 75%.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Lunch schedule</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            onClick={() => updateSettings({ lunchType: 'standard' })}
            className={`rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
              settings.lunchType === 'standard'
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950'
                : 'border-neutral-200 dark:border-neutral-800'
            }`}
          >
            <p className="font-medium text-neutral-900 dark:text-neutral-100">Standard</p>
            <p className="text-xs text-neutral-400">Lunch 12:05–1:05 PM (CSE & most depts)</p>
          </button>
          <button
            onClick={() => updateSettings({ lunchType: 'alternate' })}
            className={`rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
              settings.lunchType === 'alternate'
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950'
                : 'border-neutral-200 dark:border-neutral-800'
            }`}
          >
            <p className="font-medium text-neutral-900 dark:text-neutral-100">Alternate</p>
            <p className="text-xs text-neutral-400">Lunch 11:20 AM–12:20 PM, 4 periods after</p>
          </button>
        </div>
        <p className="text-xs text-neutral-400">
          Both run 8 periods · 45 min each · 8:00 AM–3:40 PM · two 20-min breaks (9:30–9:50, 1:50–2:10).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Class days</h2>
        <div className="flex flex-wrap gap-1.5">
          {ALL_DAYS.map((d) => (
            <button
              key={d}
              onClick={() => toggleDay(d)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                settings.activeDays.includes(d)
                  ? 'bg-indigo-600 text-white'
                  : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
              }`}
            >
              {DAY_LABELS[d].slice(0, 3)}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">AI import</h2>
        <input
          type="password"
          value={settings.geminiApiKey ?? ''}
          onChange={(e) => updateSettings({ geminiApiKey: e.target.value })}
          placeholder="Gemini API key"
          className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-indigo-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
        <p className="text-xs text-neutral-400">
          Used by "Import from photo" in the Timetable tab to read a timetable photo. Free at{' '}
          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="underline decoration-dotted">
            aistudio.google.com/apikey
          </a>
          . Stored only on this device.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Backup</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={handleExport}>
            Export backup
          </Button>
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
            Import backup
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImportFile(f);
              e.target.value = '';
            }}
          />
        </div>
        {importError && <p className="text-xs text-rose-500">{importError}</p>}
        {importedOk && <p className="text-xs text-emerald-600 dark:text-emerald-400">Backup restored.</p>}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-rose-600 dark:text-rose-400">Danger zone</h2>
        <Button
          variant="danger"
          onClick={() => {
            if (confirm('This will erase all subjects, timetable and attendance data. Continue?')) resetAll();
          }}
        >
          Reset all data
        </Button>
      </section>
    </div>
  );
}
