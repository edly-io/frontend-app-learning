import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { getConfig } from '@edx/frontend-platform';

const getBaseUrl = () => `${getConfig().LMS_BASE_URL}/fbr/api/attendance/v1`;

export const getSessions = async (courseId, filters = {}) => {
  const client = getAuthenticatedHttpClient();
  const params = new URLSearchParams(filters);
  const { data } = await client.get(`${getBaseUrl()}/courses/${courseId}/sessions/?${params}`);
  return data;
};

export const createSession = async (courseId, sessionData) => {
  const client = getAuthenticatedHttpClient();
  const { data } = await client.post(`${getBaseUrl()}/courses/${courseId}/sessions/`, sessionData);
  return data;
};

export const updateSession = async (courseId, sessionId, sessionData) => {
  const client = getAuthenticatedHttpClient();
  const { data } = await client.patch(`${getBaseUrl()}/courses/${courseId}/sessions/${sessionId}/`, sessionData);
  return data;
};

export const deleteSession = async (courseId, sessionId) => {
  const client = getAuthenticatedHttpClient();
  await client.delete(`${getBaseUrl()}/courses/${courseId}/sessions/${sessionId}/`);
};

export const getSession = async (courseId, sessionId) => {
  const client = getAuthenticatedHttpClient();
  const { data } = await client.get(`${getBaseUrl()}/courses/${courseId}/sessions/${sessionId}/`);
  return data;
};

export const getAttendanceRecords = async (filters = {}) => {
  const client = getAuthenticatedHttpClient();
  const params = new URLSearchParams(filters);
  const { data } = await client.get(`${getBaseUrl()}/records/?${params}`);
  return data;
};

export const updateAttendanceRecord = async (recordId, recordData) => {
  const client = getAuthenticatedHttpClient();
  const { data } = await client.patch(`${getBaseUrl()}/records/${recordId}/`, recordData);
  return data;
};

// ─── Course Run & Instructor lookup APIs ──────────────────────────────────────
// Used to populate the searchable autocomplete fields in ScheduleMeetingModal.

/**
 * Fetch all course runs accessible to the requesting instructor.
 * Searched by `title` in the frontend autocomplete.
 *
 * GET /fbr/api/attendance/v1/course-runs/
 * Returns: [{ id: "course-v1:Org+Course+Run", title: "..." }, ...]
 */
export const fetchCourseRuns = async () => {
  const client = getAuthenticatedHttpClient();
  const { data } = await client.get(`${getBaseUrl()}/course-runs/`);
  return data;
};

/**
 * Fetch instructors / course-team members for a specific course run.
 * Called after the user selects a course run in ScheduleMeetingModal.
 * Searched by `name` in the frontend autocomplete.
 *
 * GET /fbr/api/attendance/v1/courses/{courseId}/instructors/
 * Returns: [{ user_id, email, name }, ...]
 *
 * @param {string} courseId - Course key string, e.g. "course-v1:Org+Course+Run"
 */
export const fetchInstructors = async (courseId) => {
  const client = getAuthenticatedHttpClient();
  const { data } = await client.get(`${getBaseUrl()}/courses/${courseId}/instructors/`);
  return data;
};

// ─── Calendar API ─────────────────────────────────────────────────────────────
//
// Returns sessions within a date window for the calendar UI. Visibility is
// role-based on the backend (admins see all; instructors see their courses;
// learners see enrolled courses). The window is required and must be
// <= 45 days — the calendar re-fetches on navigation, so one month/week/day
// at a time is all we ever load.
export const getCalendarSessions = async (startDate, endDate) => {
  const client = getAuthenticatedHttpClient();
  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
  });
  const { data } = await client.get(`${getBaseUrl()}/calendar-sessions/?${params}`);
  return { sessions: data.results, userRole: data.user_role };
};
