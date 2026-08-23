import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ALL_DAYS, DAY_LABELS, type DayOfWeek } from '../../types';
import { SubjectManager } from '../SubjectManager';
import { DayTimetableEditor } from '../timetable/DayTimetableEditor';
import { ImportFromPhoto } from '../ImportFromPhoto';
import { Button } from '../ui/Button';

const STEP_TITLES = [
  "Let's set your schedule",
  'Import your timetable',
  'Add your subjects',
  'Build your timetable',
  "You're all set",
];

export function OnboardingWizard() {
  const settings = useAppStore((s) => s.settings);
  const subjects = useAppStore((s) => s.subjects);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);

  const [step, setStep] = useState(0);
  const lastStep = STEP_TITLES.length - 1;

  function toggleDay(day: DayOfWeek) {
    const isActive = settings.activeDays.includes(day);
    const next = isActive ? settings.activeDays.filter((d) => d !== day) : [...settings.activeDays, day];
    updateSettings({ activeDays: next });
  }

  const canProceed = step === 2 ? subjects.length > 0 : true;

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col bg-neutral-50 px-5 py-8 dark:bg-neutral-950">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">BunkBetter setup</p>
        <h1 className="mt-1 text-2xl font-bold text-neutral-900 dark:text-neutral-100">{STEP_TITLES[step]}</h1>
        <div className="mt-4 flex gap-1.5">
          {STEP_TITLES.map((title, i) => (
            <div
              key={title}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? 'bg-indigo-600' : 'bg-neutral-200 dark:bg-neutral-800'
              }`}
            />
          ))}
        </div>
      </header>

      <div className="flex-1">
        {step === 0 && (
          <div className="space-y-6">
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                Which lunch schedule do you follow?
              </h2>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => updateSettings({ lunchType: 'standard' })}
                  className={`rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                    settings.lunchType === 'standard'
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950'
                      : 'border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'
                  }`}
                >
                  <p className="font-medium text-neutral-900 dark:text-neutral-100">Standard — Lunch 12:05–1:05 PM</p>
                  <p className="text-xs text-neutral-400">CSE and most other departments</p>
                </button>
                <button
                  onClick={() => updateSettings({ lunchType: 'alternate' })}
                  className={`rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                    settings.lunchType === 'alternate'
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950'
                      : 'border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'
                  }`}
                >
                  <p className="font-medium text-neutral-900 dark:text-neutral-100">
                    Alternate — Lunch 11:20 AM–12:20 PM
                  </p>
                  <p className="text-xs text-neutral-400">4 periods after lunch</p>
                </button>
              </div>
              <p className="text-xs text-neutral-400">
                Both run 8 periods, 45 min each, 8:00 AM–3:40 PM, with two 20-min breaks (9:30–9:50 and 1:50–2:10).
                You can change this later in Settings.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                Which days do you have classes?
              </h2>
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
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Got a photo of your class timetable? Let AI read it and fill in your subjects and weekly grid for you —
              you'll still get to review and edit everything before you're done.
            </p>
            <ImportFromPhoto onImported={() => setStep(2)} />
            <p className="text-center text-xs text-neutral-400">Or just hit Continue to set it up manually instead.</p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Add every subject you attend classes for. You can edit these anytime later.
            </p>
            <SubjectManager />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Tap a period to assign a subject. Labs or clumped classes can span up to 3 back-to-back periods. You
              don't have to finish now — you can keep editing this later from the Timetable tab.
            </p>
            <DayTimetableEditor />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                Minimum attendance you need to maintain
              </h2>
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
                Most colleges require 75%. BunkBetter will tell you exactly how many classes you can safely miss per
                subject.
              </p>
            </section>
            <div className="rounded-xl bg-indigo-50 p-4 text-sm text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              {subjects.length} subject{subjects.length === 1 ? '' : 's'} added. Mark attendance from the Today tab
              as classes happen, and use the Timetable tab whenever you need to add or edit classes.
            </div>
          </div>
        )}
      </div>

      <footer className="mt-8 flex gap-2">
        {step > 0 && (
          <Button variant="secondary" onClick={() => setStep((s) => s - 1)}>
            Back
          </Button>
        )}
        {step < lastStep ? (
          <Button className="flex-1" disabled={!canProceed} onClick={() => setStep((s) => s + 1)}>
            Continue
          </Button>
        ) : (
          <Button className="flex-1" onClick={completeOnboarding}>
            Finish setup
          </Button>
        )}
      </footer>
    </div>
  );
}
