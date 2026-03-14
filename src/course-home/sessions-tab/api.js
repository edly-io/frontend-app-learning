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
