# Sessions Calendar View — Implementation Plan

**Date:** April 10, 2026  
**Approach:** Option A (zero new dependencies — React + Paragon only)

---

## Goal

A standalone read-only calendar page at `/sessions/calendar` showing a student's sessions
across all their courses. Supports Month, Week, and Day views with Prev/Next/Today navigation.
Clicking a day in Month or Week view opens a modal listing that day's sessions.

---

## Directory Structure

```
src/course-home/sessions-tab/
├── calendar/
│   ├── PLAN.md               ← this file
│   ├── CalendarPage.jsx      ← new: page wrapper, data fetching
│   └── CalendarView.jsx      ← new: all calendar UI in one file
├── api.js                    ← add getStudentSessions() with mock data
├── utils.js                  ← add bucketSessionsByDay()
├── index.js                  ← export CalendarPage
...existing files unchanged...
```

---

## Files Changed

| File | Change |
|---|---|
| `calendar/CalendarPage.jsx` | **New** |
| `calendar/CalendarView.jsx` | **New** |
| `src/constants.ts` | Add `CALENDAR` to `ROUTES` |
| `src/index.jsx` | Register `<Route>` for calendar |
| `sessions-tab/api.js` | Add `getStudentSessions()` with mock data |
| `sessions-tab/utils.js` | Add `bucketSessionsByDay()` |
| `sessions-tab/index.js` | Export `CalendarPage` |

---

## Step-by-Step Implementation

### Step 1 — Route constant
Add `CALENDAR: '/sessions/calendar'` to `ROUTES` in `src/constants.ts`.

### Step 2 — Mock data + API stub
Add `getStudentSessions()` to `sessions-tab/api.js` — returns a hardcoded array of mock
sessions across multiple weeks/months and courses. Each object:
- `id`
- `title`
- `course_name`
- `scheduled_start_time` (ISO UTC)
- `scheduled_end_time` (ISO UTC)
- `status` (`scheduled` | `in_progress` | `completed` | `cancelled`)
- `meeting_join_url`

Replace the array inline with a real `GET /fbr/api/attendance/v1/my-sessions/` call later.

### Step 3 — `bucketSessionsByDay` utility
Add to `sessions-tab/utils.js`:
```js
bucketSessionsByDay(sessions) → Map<localDateString, Session[]>
```
Keys each session by `scheduled_start_time` converted to local date string (YYYY-MM-DD).

### Step 4 — `CalendarPage.jsx`
Page wrapper (~40 lines):
- Calls `getStudentSessions()` on mount
- Holds sessions array in state
- Shows `Spinner` while loading, `Alert` on error
- Passes sessions to `<CalendarView />`

### Step 5 — `CalendarView.jsx`
Single file (~300 lines) with all UI as local sub-components:

**State:**
- `view`: `'month' | 'week' | 'day'`
- `currentDate`: `Date` (default: today)
- `selectedDay`: `string | null` (local date string, opens modal when set)

**Toolbar:**
- `ChevronLeft` / `ChevronRight` `IconButton` — Prev/Next (1 month/week/day per view)
- Dynamic label: `"April 2026"` / `"Apr 7–13"` / `"Thu, Apr 9"`
- **Today** `Button` — resets `currentDate` to `new Date()`
- Month / Week / Day toggle `Button`s

**Local components:**
- `DayCell` — day number, up to 2 session chips (color = `getStatusVariant`), "+N more" badge,
  fixed height, today highlight, outside-month grayed; full cell clickable → sets `selectedDay`
- `MonthGrid` — 7-column CSS Grid, Mon–Sun headers, 4–6 rows of `DayCell`
- `WeekGrid` — 7-column CSS Grid, Mon–Sun date headers, `DayCell` per column (`min-height: 200px`)
- `DayView` — inline Paragon `Card` list: title, course, local time range, status `Badge`,
  "Join Meeting" button (new tab); no modal
- Inline `StandardModal` — opens when `selectedDay` set, identical session cards to `DayView`

---

## Design Decisions

| Decision | Choice | Reason |
|---|---|---|
| New dependencies | None | Paragon + CSS Grid sufficient |
| File count | 2 new files | All sub-components local to `CalendarView.jsx` |
| Week start | Monday | ISO week convention |
| Midnight-spanning sessions | Not handled | Won't occur (daytime classes only); avoids complexity |
| Timezone | User's local timezone | `toLocaleDateString()` / `toLocaleTimeString()` |
| Learner dashboard link | Deferred | Separate MFE, out of scope for now |
| Auth guard on `/sessions/calendar` | Deferred | To be decided separately |
| Join Meeting confirm dialog | No (open directly) | Calendar is read-only informational view |
| Today button | Yes | Navigation shortcut, 1 extra Button |

---

## Future / Deferred

- Replace mock data with real `GET /fbr/api/attendance/v1/my-sessions/` API call
- Add "My Calendar" link on learner dashboard MFE
- Auth guard for the `/sessions/calendar` route
- Midnight-spanning sessions (if needed)
