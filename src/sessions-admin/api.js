import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { getConfig } from '@edx/frontend-platform';

// TODO(phase-6B): swap this stub for a real GET /fbr/api/programs/v1/programs/
// call once the programs team ships the endpoint. Shape of each item must
// stay `{ id, slug, name }` so callers don't change.
const STUB_PROGRAMS = [
  { id: 1, slug: 'default', name: 'Default Program' },
  { id: 2, slug: 'second', name: 'Second Program' },
];

export const getPrograms = async () => STUB_PROGRAMS;

const getAttendanceBaseUrl = () => `${getConfig().LMS_BASE_URL}/fbr/api/attendance/v1`;

/**
 * Active enrollments for the session's course. Used by the admin roster page
 * to seed the marking UI.
 *
 * GET /fbr/api/attendance/v1/sessions/{session_id}/enrolled-learners/
 */
export const getEnrolledLearners = async (sessionId) => {
  const client = getAuthenticatedHttpClient();
  const { data } = await client.get(
    `${getAttendanceBaseUrl()}/sessions/${sessionId}/enrolled-learners/`,
  );
  return data;
};

/**
 * Bulk-upsert manual attendance for a session. Admin-only on the backend.
 *
 * POST /fbr/api/attendance/v1/sessions/{session_id}/mark-attendance/
 * Body: { records: [{ user_id, status }, ...] }
 */
export const markAttendance = async (sessionId, records) => {
  const client = getAuthenticatedHttpClient();
  const { data } = await client.post(
    `${getAttendanceBaseUrl()}/sessions/${sessionId}/mark-attendance/`,
    { records },
  );
  return data;
};

/**
 * Cross-session attendance history for the authenticated learner.
 *
 * GET /fbr/api/attendance/v1/records/me/
 */
export const getMyAttendanceRecords = async ({ page, pageSize } = {}) => {
  const client = getAuthenticatedHttpClient();
  const params = new URLSearchParams();
  if (page) { params.set('page', String(page)); }
  if (pageSize) { params.set('page_size', String(pageSize)); }
  const qs = params.toString();
  const { data } = await client.get(
    `${getAttendanceBaseUrl()}/records/me/${qs ? `?${qs}` : ''}`,
  );
  return data;
};

/**
 * Past sessions across all courses, used by the admin sessions list. The
 * `programId` is accepted but not yet sent — backend ignores program scoping
 * until the programs feature lands.
 *
 * Calls `GET /fbr/api/attendance/v1/calendar-sessions/` with a date window
 * ending at "now" and starting `daysBack` days ago. Calendar endpoint enforces
 * a 45-day max window, so callers must keep `daysBack <= 45`.
 */
export const getPastSessionsForAttendance = async ({ daysBack = 30 } = {}) => {
  const client = getAuthenticatedHttpClient();
  const end = new Date();
  const start = new Date(end.getTime() - daysBack * 24 * 60 * 60 * 1000);
  const params = new URLSearchParams({
    start_date: start.toISOString(),
    end_date: end.toISOString(),
  });
  const { data } = await client.get(
    `${getAttendanceBaseUrl()}/calendar-sessions/?${params}`,
  );
  return data;
};
