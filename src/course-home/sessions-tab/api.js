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
  const { data} = await client.get(`${getBaseUrl()}/courses/${courseId}/sessions/${sessionId}/`);
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

// ─── Student Calendar API ─────────────────────────────────────────────────────// Returns all sessions for the authenticated student across all their courses.
// TODO: Replace mock data with real API call:
//   GET /fbr/api/attendance/v1/my-sessions/
export const getStudentSessions = async () => {
  // Build a date anchored to a specific weekday of a given week offset.
  // weekOffset: 0=this week, -1=last week, 1=next week, etc.
  // dayOfWeek:  1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri  (weekdays only)
  const weekday = (weekOffset, dayOfWeek, hour = 10, minute = 0) => {
    const now = new Date();
    const todayDow = now.getDay(); // 0=Sun … 6=Sat
    const diffToMonday = todayDow === 0 ? -6 : 1 - todayDow;
    const dt = new Date(now);
    dt.setDate(now.getDate() + diffToMonday + weekOffset * 7 + (dayOfWeek - 1));
    dt.setHours(hour, minute, 0, 0);
    return dt.toISOString();
  };

  return [
    // ── 2 weeks ago ──────────────────────────────────────────────────────────
    {
      id: 1,
      title: 'Introduction to Python',
      course_name: 'Python for Beginners',
      scheduled_start_time: weekday(-2, 1, 10, 0),
      scheduled_end_time: weekday(-2, 1, 11, 30),
      status: 'completed',
      meeting_join_url: 'https://zoom.us/j/mock-1',
    },
    {
      id: 2,
      title: 'Tax Filing Basics',
      course_name: 'FBR Tax Course',
      scheduled_start_time: weekday(-2, 3, 14, 0),
      scheduled_end_time: weekday(-2, 3, 15, 30),
      status: 'completed',
      meeting_join_url: 'https://zoom.us/j/mock-2',
    },
    {
      id: 3,
      title: 'Data Types & Variables',
      course_name: 'Python for Beginners',
      scheduled_start_time: weekday(-2, 5, 10, 0),
      scheduled_end_time: weekday(-2, 5, 11, 30),
      status: 'completed',
      meeting_join_url: 'https://zoom.us/j/mock-3',
    },

    // ── Last week ─────────────────────────────────────────────────────────────
    {
      id: 4,
      title: 'Control Flow & Loops',
      course_name: 'Python for Beginners',
      scheduled_start_time: weekday(-1, 2, 10, 0),
      scheduled_end_time: weekday(-1, 2, 11, 30),
      status: 'completed',
      meeting_join_url: 'https://zoom.us/j/mock-4',
    },
    {
      id: 5,
      title: 'Income Tax Returns',
      course_name: 'FBR Tax Course',
      scheduled_start_time: weekday(-1, 2, 14, 0),
      scheduled_end_time: weekday(-1, 2, 15, 30),
      status: 'completed',
      meeting_join_url: 'https://zoom.us/j/mock-5',
    },
    {
      id: 6,
      title: 'Sales Tax Workshop',
      course_name: 'FBR Tax Course',
      scheduled_start_time: weekday(-1, 2, 16, 0),
      scheduled_end_time: weekday(-1, 2, 17, 0),
      status: 'completed',
      meeting_join_url: 'https://zoom.us/j/mock-6',
    },
    // ^ ids 4, 5, 6 are all on the same day (Tuesday last week) → triggers "+1 more" chip

    {
      id: 7,
      title: 'Tax Audit Procedures',
      course_name: 'FBR Tax Course',
      scheduled_start_time: weekday(-1, 4, 10, 0),
      scheduled_end_time: weekday(-1, 4, 11, 30),
      status: 'completed',
      meeting_join_url: 'https://zoom.us/j/mock-7',
    },

    // ── This week ─────────────────────────────────────────────────────────────
    {
      id: 8,
      title: 'Functions & Modules',
      course_name: 'Python for Beginners',
      scheduled_start_time: weekday(0, 1, 10, 0),
      scheduled_end_time: weekday(0, 1, 11, 30),
      status: 'scheduled',
      meeting_join_url: 'https://zoom.us/j/mock-8',
    },
    {
      id: 9,
      title: 'Customs Duty Overview',
      course_name: 'FBR Tax Course',
      scheduled_start_time: weekday(0, 3, 10, 0),
      scheduled_end_time: weekday(0, 3, 12, 0),
      status: 'scheduled',
      meeting_join_url: 'https://zoom.us/j/mock-9',
    },
    {
      id: 10,
      title: 'File Handling in Python',
      course_name: 'Python for Beginners',
      scheduled_start_time: weekday(0, 5, 10, 0),
      scheduled_end_time: weekday(0, 5, 11, 30),
      status: 'scheduled',
      meeting_join_url: '',
    },

    // ── Next week ─────────────────────────────────────────────────────────────
    {
      id: 11,
      title: 'Object-Oriented Programming',
      course_name: 'Python for Beginners',
      scheduled_start_time: weekday(1, 1, 10, 0),
      scheduled_end_time: weekday(1, 1, 11, 30),
      status: 'scheduled',
      meeting_join_url: 'https://zoom.us/j/mock-11',
    },
    {
      id: 12,
      title: 'Advanced Python Topics',
      course_name: 'Python for Beginners',
      scheduled_start_time: weekday(1, 3, 14, 0),
      scheduled_end_time: weekday(1, 3, 15, 30),
      status: 'scheduled',
      meeting_join_url: 'https://zoom.us/j/mock-12',
    },
    {
      id: 13,
      title: 'Cancelled: Guest Lecture',
      course_name: 'FBR Tax Course',
      scheduled_start_time: weekday(1, 3, 10, 0),
      scheduled_end_time: weekday(1, 3, 11, 30),
      status: 'cancelled',
      meeting_join_url: '',
    },
    // ^ ids 12 and 13 are on the same day (Wednesday next week)

    {
      id: 14,
      title: 'Final Review Session',
      course_name: 'Python for Beginners',
      scheduled_start_time: weekday(1, 5, 10, 0),
      scheduled_end_time: weekday(1, 5, 12, 0),
      status: 'scheduled',
      meeting_join_url: 'https://zoom.us/j/mock-14',
    },

    // ── 2 weeks ahead ─────────────────────────────────────────────────────────
    {
      id: 15,
      title: 'Capstone Project Discussion',
      course_name: 'Python for Beginners',
      scheduled_start_time: weekday(2, 2, 10, 0),
      scheduled_end_time: weekday(2, 2, 11, 30),
      status: 'scheduled',
      meeting_join_url: 'https://zoom.us/j/mock-15',
    },
    {
      id: 16,
      title: 'Tax Compliance Review',
      course_name: 'FBR Tax Course',
      scheduled_start_time: weekday(2, 4, 14, 0),
      scheduled_end_time: weekday(2, 4, 15, 30),
      status: 'scheduled',
      meeting_join_url: 'https://zoom.us/j/mock-16',
    },

    // ── This week – extra sessions (varied times + overlaps) ──────────────────
    // Monday: 2 extra → total 3 on Monday → triggers "+1 more" in month view
    {
      id: 17,
      title: 'Morning Briefing',
      course_name: 'FBR Tax Course',
      scheduled_start_time: weekday(0, 1, 8, 0),
      scheduled_end_time: weekday(0, 1, 8, 45),
      status: 'completed',
      meeting_join_url: 'https://zoom.us/j/mock-17',
    },
    {
      id: 18,
      title: 'Afternoon Tax Review',
      course_name: 'FBR Tax Course',
      scheduled_start_time: weekday(0, 1, 14, 0),
      scheduled_end_time: weekday(0, 1, 15, 30),
      status: 'scheduled',
      meeting_join_url: 'https://zoom.us/j/mock-18',
    },
    // ^ Monday now has ids 8, 17, 18 → 3 sessions → "+1 more"

    // Tuesday: 3 sessions — ids 19 & 20 overlap (9:00–10:30 and 10:00–11:30)
    {
      id: 19,
      title: 'Python Data Structures',
      course_name: 'Python for Beginners',
      scheduled_start_time: weekday(0, 2, 9, 0),
      scheduled_end_time: weekday(0, 2, 10, 30),
      status: 'scheduled',
      meeting_join_url: 'https://zoom.us/j/mock-19',
    },
    {
      id: 20,
      title: 'Tax Forms Deep Dive',
      course_name: 'FBR Tax Course',
      scheduled_start_time: weekday(0, 2, 10, 0),
      scheduled_end_time: weekday(0, 2, 11, 30),
      status: 'scheduled',
      meeting_join_url: 'https://zoom.us/j/mock-20',
    },
    {
      id: 21,
      title: 'Afternoon Lab Session',
      course_name: 'Python for Beginners',
      scheduled_start_time: weekday(0, 2, 13, 0),
      scheduled_end_time: weekday(0, 2, 14, 30),
      status: 'scheduled',
      meeting_join_url: 'https://zoom.us/j/mock-21',
    },

    // Wednesday: id 22 overlaps with existing id 9 (10:00–12:00)
    {
      id: 22,
      title: 'Import Procedures Q&A',
      course_name: 'FBR Tax Course',
      scheduled_start_time: weekday(0, 3, 11, 0),
      scheduled_end_time: weekday(0, 3, 12, 30),
      status: 'scheduled',
      meeting_join_url: 'https://zoom.us/j/mock-22',
    },

    // Thursday: ids 23 & 24 overlap (9:00–10:30 and 9:30–11:00), id 25 separate
    {
      id: 23,
      title: 'Algorithms Workshop',
      course_name: 'Python for Beginners',
      scheduled_start_time: weekday(0, 4, 9, 0),
      scheduled_end_time: weekday(0, 4, 10, 30),
      status: 'scheduled',
      meeting_join_url: 'https://zoom.us/j/mock-23',
    },
    {
      id: 24,
      title: 'Tax Exemptions Seminar',
      course_name: 'FBR Tax Course',
      scheduled_start_time: weekday(0, 4, 9, 30),
      scheduled_end_time: weekday(0, 4, 11, 0),
      status: 'scheduled',
      meeting_join_url: 'https://zoom.us/j/mock-24',
    },
    {
      id: 25,
      title: 'Code Review Session',
      course_name: 'Python for Beginners',
      scheduled_start_time: weekday(0, 4, 15, 0),
      scheduled_end_time: weekday(0, 4, 16, 30),
      status: 'scheduled',
      meeting_join_url: 'https://zoom.us/j/mock-25',
    },

    // Friday (today): id 26 overlaps with existing id 10 (10:00–11:30)
    {
      id: 26,
      title: 'FBR Compliance Check',
      course_name: 'FBR Tax Course',
      scheduled_start_time: weekday(0, 5, 10, 0),
      scheduled_end_time: weekday(0, 5, 11, 0),
      status: 'in_progress',
      meeting_join_url: 'https://zoom.us/j/mock-26',
    },
    {
      id: 27,
      title: 'Wrap-up Discussion',
      course_name: 'Python for Beginners',
      scheduled_start_time: weekday(0, 5, 13, 30),
      scheduled_end_time: weekday(0, 5, 15, 0),
      status: 'scheduled',
      meeting_join_url: 'https://zoom.us/j/mock-27',
    },

    // ── Next week – more sessions for month "+N more" ─────────────────────────
    // Monday next week: 2 extra → total 3 (ids 11, 28, 29) → "+1 more"
    {
      id: 28,
      title: 'OOP Design Patterns',
      course_name: 'Python for Beginners',
      scheduled_start_time: weekday(1, 1, 8, 30),
      scheduled_end_time: weekday(1, 1, 9, 30),
      status: 'scheduled',
      meeting_join_url: 'https://zoom.us/j/mock-28',
    },
    {
      id: 29,
      title: 'Tax Refund Workshop',
      course_name: 'FBR Tax Course',
      scheduled_start_time: weekday(1, 1, 14, 0),
      scheduled_end_time: weekday(1, 1, 15, 30),
      status: 'scheduled',
      meeting_join_url: 'https://zoom.us/j/mock-29',
    },

    // Tuesday next week: 3 sessions — ids 30 & 31 overlap → "+1 more"
    {
      id: 30,
      title: 'REST API Development',
      course_name: 'Python for Beginners',
      scheduled_start_time: weekday(1, 2, 10, 0),
      scheduled_end_time: weekday(1, 2, 11, 30),
      status: 'scheduled',
      meeting_join_url: 'https://zoom.us/j/mock-30',
    },
    {
      id: 31,
      title: 'Withholding Tax Rules',
      course_name: 'FBR Tax Course',
      scheduled_start_time: weekday(1, 2, 10, 30),
      scheduled_end_time: weekday(1, 2, 12, 0),
      status: 'scheduled',
      meeting_join_url: 'https://zoom.us/j/mock-31',
    },
    {
      id: 32,
      title: 'Database Integration',
      course_name: 'Python for Beginners',
      scheduled_start_time: weekday(1, 2, 14, 0),
      scheduled_end_time: weekday(1, 2, 15, 30),
      status: 'scheduled',
      meeting_join_url: 'https://zoom.us/j/mock-32',
    },

    // ── 2 weeks out – 4 sessions on Monday → "+2 more" in month view ──────────
    {
      id: 33,
      title: 'Python Testing & CI',
      course_name: 'Python for Beginners',
      scheduled_start_time: weekday(2, 1, 9, 0),
      scheduled_end_time: weekday(2, 1, 10, 0),
      status: 'scheduled',
      meeting_join_url: 'https://zoom.us/j/mock-33',
    },
    {
      id: 34,
      title: 'Tax Appeals Process',
      course_name: 'FBR Tax Course',
      scheduled_start_time: weekday(2, 1, 10, 0),
      scheduled_end_time: weekday(2, 1, 11, 30),
      status: 'scheduled',
      meeting_join_url: 'https://zoom.us/j/mock-34',
    },
    {
      id: 35,
      title: 'Package Management',
      course_name: 'Python for Beginners',
      scheduled_start_time: weekday(2, 1, 11, 30),
      scheduled_end_time: weekday(2, 1, 13, 0),
      status: 'scheduled',
      meeting_join_url: 'https://zoom.us/j/mock-35',
    },
    {
      id: 36,
      title: 'Tax Authority Interface',
      course_name: 'FBR Tax Course',
      scheduled_start_time: weekday(2, 1, 14, 0),
      scheduled_end_time: weekday(2, 1, 15, 30),
      status: 'scheduled',
      meeting_join_url: 'https://zoom.us/j/mock-36',
    },
    // ^ ids 33–36 all on Monday 2 weeks out → 4 sessions → "+2 more"

    // Wednesday 2 weeks out: ids 37 & 38 overlap (10:00–11:30 and 10:30–12:00)
    {
      id: 37,
      title: 'Django Fundamentals',
      course_name: 'Python for Beginners',
      scheduled_start_time: weekday(2, 3, 10, 0),
      scheduled_end_time: weekday(2, 3, 11, 30),
      status: 'scheduled',
      meeting_join_url: 'https://zoom.us/j/mock-37',
    },
    {
      id: 38,
      title: 'E-Filing Workshop',
      course_name: 'FBR Tax Course',
      scheduled_start_time: weekday(2, 3, 10, 30),
      scheduled_end_time: weekday(2, 3, 12, 0),
      status: 'scheduled',
      meeting_join_url: 'https://zoom.us/j/mock-38',
    },
  ];
};
