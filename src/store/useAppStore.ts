import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AttendanceRecord,
  AttendanceStatus,
  ClassType,
  DayOfWeek,
  Settings,
  Subject,
  TimetableEntry,
} from '../types';
import { DEFAULT_SETTINGS } from '../types';

function makeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function recordId(date: string, timetableEntryId: string): string {
  return `${date}__${timetableEntryId}`;
}

interface AppState {
  settings: Settings;
  subjects: Subject[];
  timetable: TimetableEntry[];
  attendance: Record<string, AttendanceRecord>;

  // subjects
  addSubject: (name: string, code: string | undefined, color: string) => Subject;
  updateSubject: (id: string, patch: Partial<Omit<Subject, 'id'>>) => void;
  removeSubject: (id: string) => void;

  // timetable
  upsertTimetableEntry: (entry: {
    id?: string;
    day: DayOfWeek;
    startPeriod: number;
    span: number;
    subjectId: string;
    type: ClassType;
    room?: string;
  }) => void;
  removeTimetableEntry: (id: string) => void;
  entriesForDay: (day: DayOfWeek) => TimetableEntry[];

  // attendance
  markAttendance: (date: string, timetableEntryId: string, subjectId: string, status: AttendanceStatus) => void;
  clearAttendance: (date: string, timetableEntryId: string) => void;
  getAttendance: (date: string, timetableEntryId: string) => AttendanceRecord | undefined;

  // settings / lifecycle
  updateSettings: (patch: Partial<Settings>) => void;
  completeOnboarding: () => void;
  resetAll: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,
      subjects: [],
      timetable: [],
      attendance: {},

      addSubject: (name, code, color) => {
        const subject: Subject = { id: makeId(), name, code, color };
        set((s) => ({ subjects: [...s.subjects, subject] }));
        return subject;
      },
      updateSubject: (id, patch) => {
        set((s) => ({ subjects: s.subjects.map((sub) => (sub.id === id ? { ...sub, ...patch } : sub)) }));
      },
      removeSubject: (id) => {
        set((s) => ({
          subjects: s.subjects.filter((sub) => sub.id !== id),
          timetable: s.timetable.filter((e) => e.subjectId !== id),
        }));
      },

      upsertTimetableEntry: (entry) => {
        set((s) => {
          if (entry.id) {
            return {
              timetable: s.timetable.map((e) =>
                e.id === entry.id
                  ? {
                      ...e,
                      day: entry.day,
                      startPeriod: entry.startPeriod,
                      span: entry.span,
                      subjectId: entry.subjectId,
                      type: entry.type,
                      room: entry.room,
                    }
                  : e,
              ),
            };
          }
          const newEntry: TimetableEntry = {
            id: makeId(),
            day: entry.day,
            startPeriod: entry.startPeriod,
            span: entry.span,
            subjectId: entry.subjectId,
            type: entry.type,
            room: entry.room,
          };
          return { timetable: [...s.timetable, newEntry] };
        });
      },
      removeTimetableEntry: (id) => {
        set((s) => ({ timetable: s.timetable.filter((e) => e.id !== id) }));
      },
      entriesForDay: (day) => get().timetable.filter((e) => e.day === day),

      markAttendance: (date, timetableEntryId, subjectId, status) => {
        const id = recordId(date, timetableEntryId);
        const record: AttendanceRecord = {
          id,
          date,
          timetableEntryId,
          subjectId,
          status,
          markedAt: new Date().toISOString(),
        };
        set((s) => ({ attendance: { ...s.attendance, [id]: record } }));
      },
      clearAttendance: (date, timetableEntryId) => {
        const id = recordId(date, timetableEntryId);
        set((s) => {
          const next = { ...s.attendance };
          delete next[id];
          return { attendance: next };
        });
      },
      getAttendance: (date, timetableEntryId) => get().attendance[recordId(date, timetableEntryId)],

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      completeOnboarding: () => set((s) => ({ settings: { ...s.settings, onboarded: true } })),
      resetAll: () =>
        set({
          settings: DEFAULT_SETTINGS,
          subjects: [],
          timetable: [],
          attendance: {},
        }),
    }),
    { name: 'bunkbetter-store' },
  ),
);
