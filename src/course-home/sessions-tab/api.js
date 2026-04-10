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

// ─── Student Calendar API ─────────────────────────────────────────────────────
// Returns all sessions for the authenticated student across all their courses.
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
  ];
};
