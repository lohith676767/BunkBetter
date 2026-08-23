import type { ClassType, DayOfWeek } from '../types';
import type { PreparedImage } from './imagePrep';

export interface ParsedSubject {
  code: string;
  name: string;
  faculty?: string;
}

export interface ParsedEntry {
  period: number;
  span: number;
  code: string;
  type: ClassType;
}

export interface ParsedTimetable {
  lunchAfterPeriod?: number;
  subjects: ParsedSubject[];
  days: Partial<Record<DayOfWeek, ParsedEntry[]>>;
}

const DAY_KEYS: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const DAY_ENTRY_SCHEMA = {
  type: 'ARRAY',
  items: {
    type: 'OBJECT',
    properties: {
      period: { type: 'INTEGER', description: 'starting period number, 1-8' },
      span: { type: 'INTEGER', description: 'consecutive periods this cell occupies, usually 1' },
      code: { type: 'STRING' },
      type: { type: 'STRING', enum: ['lecture', 'lab', 'tutorial'] },
    },
    required: ['period', 'span', 'code', 'type'],
  },
};

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    lunchAfterPeriod: { type: 'INTEGER', description: 'which period (1-8) lunch immediately follows, typically 4 or 5' },
    subjects: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          code: { type: 'STRING' },
          name: { type: 'STRING' },
          faculty: { type: 'STRING' },
        },
        required: ['code', 'name'],
      },
    },
    days: {
      type: 'OBJECT',
      properties: Object.fromEntries(DAY_KEYS.map((d) => [d, DAY_ENTRY_SCHEMA])),
    },
  },
  required: ['subjects', 'days'],
};

const PROMPT = `You are reading a college class timetable from one or more photos of the same timetable (e.g. a legend table that continues on a second photo).

The target schedule always has exactly 8 numbered periods per day (1-8), 45 minutes each, starting 8:00 AM, Monday through Saturday, with two short breaks and one lunch break between periods. Do not report break/lunch clock times — instead report which period lunch comes right after, as "lunchAfterPeriod".

Read the grid and the legend/key table (mapping short codes to full course titles and faculty), and extract:

1. "subjects": every distinct subject or activity that appears anywhere in the grid. "code" is the short code exactly as shown in the grid cell. "name" is the full title from the legend table. If a cell has no legend entry (e.g. "LIBRARY", "MENTOR", a free/self-study period), still include it, using the same text for both code and name. Do not duplicate a subject that already appears.

2. "days": one array per day present in the image, keyed "mon","tue","wed","thu","fri","sat" (omit a day entirely if it isn't shown). Each array holds one entry per grid cell that contains a class:
   - "period": which numbered period column it starts in (1-8), counting only real class periods left to right and skipping any break/lunch columns.
   - "span": how many consecutive period columns this one cell visually merges across (1 unless the cell is clearly merged, in which case usually 2 or 3).
   - "code": the code exactly as it appears in that cell. If a cell shows two codes together (e.g. the class is split into two batches doing different labs at the same time), join them with " / ", e.g. "UCS3211 / UCS3281".
   - "type": "lab" if it's a practical/lab session (often merged across periods, or the legend's credit column shows practical/P hours > 0), "tutorial" if it's tutorial-only, otherwise "lecture".

Be careful to place each entry under the correct day and the correct starting period. Output only the JSON — no commentary.`;

/**
 * Google renames/retires dated Gemini model IDs fairly often, so instead of pinning one exact
 * version we try their self-updating aliases first (always the current default flash model),
 * then fall back through a few recent dated names in case an alias isn't resolving.
 */
const MODEL_CANDIDATES = ['gemini-flash-latest', 'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-2.5-flash'];

class ModelNotFoundError extends Error {}

async function requestModel(model: string, images: PreparedImage[], apiKey: string): Promise<ParsedTimetable> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;

  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: PROMPT }, ...images.map((img) => ({ inlineData: { mimeType: img.mimeType, data: img.base64 } }))],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
    },
  };

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('Could not reach Gemini — check your internet connection.');
  }

  if (!res.ok) {
    let detail = '';
    try {
      const errBody = await res.json();
      detail = errBody?.error?.message ?? '';
    } catch {
      /* ignore */
    }
    if (res.status === 400 && /API key/i.test(detail)) throw new Error('That API key was rejected — double-check it in Settings.');
    if (res.status === 404 || /not found|not supported/i.test(detail)) throw new ModelNotFoundError(detail);
    throw new Error(detail || `Gemini request failed (${res.status}).`);
  }

  const data = await res.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned nothing usable — try a clearer, well-lit photo.');

  let parsed: ParsedTimetable;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Could not understand the response — try again.');
  }
  if (!Array.isArray(parsed.subjects) || typeof parsed.days !== 'object') {
    throw new Error('Incomplete result — try a clearer photo, or set up manually.');
  }
  return parsed;
}

export async function parseTimetableImages(
  images: PreparedImage[],
  apiKey: string,
  model?: string,
): Promise<ParsedTimetable> {
  if (images.length === 0) throw new Error('Add at least one photo first.');
  if (!apiKey.trim()) throw new Error('Add your Gemini API key first.');

  const candidates = model ? [model] : MODEL_CANDIDATES;
  let lastError: Error = new Error('No Gemini model in the candidate list is available.');
  for (const candidate of candidates) {
    try {
      return await requestModel(candidate, images, apiKey);
    } catch (err) {
      if (err instanceof ModelNotFoundError) {
        lastError = err;
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}
