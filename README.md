# BunkBetter

A better attendance tracker for classes with a fixed period timetable. Set
up your subjects and weekly timetable once, mark attendance as classes
happen, and always know exactly how many classes you can safely miss (or
how many you need to attend) to stay above your target percentage.

## Schedule model

Built around an 8-period day, 8:00 AM–3:40 PM, 45 minutes per period, with
two 20-minute breaks and a lunch break. Two lunch layouts are supported:

- **Standard** (CSE & most departments): breaks 9:30–9:50 AM and
  1:50–2:10 PM, lunch 12:05–1:05 PM.
- **Alternate** (some other departments): breaks 9:30–9:50 AM and
  1:50–2:10 PM, lunch 11:20 AM–12:20 PM, with 4 periods after lunch.

Classes can span 1-3 consecutive periods within the same break-free run,
for labs or other clumped/back-to-back classes.

## Features

- **Setup wizard** — pick your lunch schedule and class days, add
  subjects, and build your weekly timetable up front.
- **Today** — mark each period Present / Absent / Cancelled as it
  happens; present/absent are disabled until a period actually starts,
  cancelled can be marked anytime.
- **Attendance** — per-subject and overall percentage, with a bunk
  calculator: how many more classes you can safely skip, or how many you
  need to attend in a row to hit your target.
- **Timetable** — edit subjects and the weekly grid anytime after setup.
- **History** — go back to any past date to fix a missed entry.
- **Settings** — change your attendance target, lunch schedule, active
  days, export/import a JSON backup, or reset all data.

Cancelled classes are excluded entirely from attendance percentages (they
don't count as present or absent).

## Tech

React + TypeScript + Vite + Tailwind CSS v4, with Zustand
(`persist` middleware) for state, backed by `localStorage`. No backend —
all data lives in your browser.

## Development

```bash
npm install
npm run dev      # start the dev server
npm run build    # typecheck + production build
npm run lint     # oxlint
```
