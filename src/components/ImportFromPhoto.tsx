import { useRef, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { prepareImage } from '../lib/imagePrep';
import { parseTimetableImages } from '../lib/gemini';
import { applyParsedTimetable } from '../lib/applyParsedTimetable';
import { Button } from './ui/Button';

interface PickedImage {
  id: string;
  file: File;
  previewUrl: string;
}

export function ImportFromPhoto({ onImported }: { onImported: (summary: { subjectCount: number; entryCount: number }) => void }) {
  const geminiApiKey = useAppStore((s) => s.settings.geminiApiKey ?? '');
  const updateSettings = useAppStore((s) => s.updateSettings);

  const [images, setImages] = useState<PickedImage[]>([]);
  const [showKey, setShowKey] = useState(false);
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function addFiles(files: FileList | null) {
    if (!files) return;
    const picked = Array.from(files).map((file) => ({
      id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...picked]);
  }

  function removeImage(id: string) {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((img) => img.id !== id);
    });
  }

  async function handleAnalyze() {
    setError(null);
    setStatus('analyzing');
    try {
      const prepared = await Promise.all(images.map((img) => prepareImage(img.file)));
      const parsed = await parseTimetableImages(prepared, geminiApiKey);
      const summary = applyParsedTimetable(parsed);
      setStatus('idle');
      onImported(summary);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Something went wrong — try again.');
    }
  }

  const canAnalyze = images.length > 0 && geminiApiKey.trim().length > 0 && status !== 'analyzing';

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-neutral-500 dark:text-neutral-400">
          Gemini API key
        </label>
        <div className="flex gap-2">
          <input
            type={showKey ? 'text' : 'password'}
            value={geminiApiKey}
            onChange={(e) => updateSettings({ geminiApiKey: e.target.value })}
            placeholder="Paste your key"
            className="flex-1 rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-indigo-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
          <Button type="button" variant="secondary" onClick={() => setShowKey((v) => !v)}>
            {showKey ? 'Hide' : 'Show'}
          </Button>
        </div>
        <p className="mt-1.5 text-xs text-neutral-400">
          Free at{' '}
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noreferrer"
            className="underline decoration-dotted"
          >
            aistudio.google.com/apikey
          </a>
          . Stored only on this device.
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-neutral-500 dark:text-neutral-400">
          Timetable photo{images.length !== 1 ? 's' : ''}
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = '';
          }}
        />
        {images.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {images.map((img) => (
              <div key={img.id} className="group relative h-20 w-20 overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700">
                <img src={img.previewUrl} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(img.id)}
                  className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs leading-none text-white"
                  aria-label="Remove photo"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>
          + Add photo{images.length > 0 ? '' : ' of your timetable'}
        </Button>
        <p className="mt-1.5 text-xs text-neutral-400">
          Add more than one if the legend/key table continues on a second photo.
        </p>
      </div>

      {error && (
        <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs text-rose-600 dark:bg-rose-950 dark:text-rose-400">
          {error}
        </p>
      )}

      <Button type="button" onClick={handleAnalyze} disabled={!canAnalyze} className="w-full">
        {status === 'analyzing' ? 'Reading your timetable…' : 'Analyze & fill in timetable'}
      </Button>
    </div>
  );
}
