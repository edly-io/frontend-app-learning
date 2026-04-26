import React from 'react';
import { Route, Navigate } from 'react-router-dom';
import { PageWrap } from '@edx/frontend-platform/react';

import { CalendarPage } from '../course-home/sessions-tab';
import SessionsAdminLayout from './SessionsAdminLayout';
import SessionsLanding from './SessionsLanding';
import RequestsPage from './RequestsPage';
import AttendancePage from './AttendancePage';

/**
 * Route paths owned by the sessions-admin area. Importing from here keeps
 * top-level `src/constants.ts` and `src/index.jsx` free of sessions-admin
 * specifics — the area owns its own paths.
 */
// Deprecated alias — old `/sessions/calendar` bookmarks redirect into the
// landing resolver below.
export const LEGACY_CALENDAR_PATH = '/sessions/calendar';
// Bare entry: silent resolver picks the first program and forwards to its
// calendar.
export const SESSIONS_ROOT_PATH = '/sessions';
// Program-scoped sections.
export const SESSIONS_CALENDAR_PATH = '/sessions/:programId/calendar';
export const SESSIONS_REQUESTS_PATH = '/sessions/:programId/requests';
export const SESSIONS_ATTENDANCE_PATH = '/sessions/:programId/attendance';

const wrapInShell = (Component: React.ComponentType) => (
  <PageWrap>
    <SessionsAdminLayout>
      <Component />
    </SessionsAdminLayout>
  </PageWrap>
);

// Fragment children render correctly as direct children of `<Routes>` in
// React Router 6 — the router walks through the fragment when collecting
// route definitions.
export const sessionsAdminRoutes = (
  <>
    <Route
      path={LEGACY_CALENDAR_PATH}
      element={<Navigate to={SESSIONS_ROOT_PATH} replace />}
    />
    <Route
      path={SESSIONS_ROOT_PATH}
      element={<PageWrap><SessionsLanding /></PageWrap>}
    />
    <Route path={SESSIONS_CALENDAR_PATH} element={wrapInShell(CalendarPage)} />
    <Route path={SESSIONS_REQUESTS_PATH} element={wrapInShell(RequestsPage)} />
    <Route path={SESSIONS_ATTENDANCE_PATH} element={wrapInShell(AttendancePage)} />
  </>
);
