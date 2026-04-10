import React, { useState, useEffect } from 'react';
import { Container, Spinner, Alert } from '@openedx/paragon';
import { getStudentSessions } from '../api';
import CalendarView from './CalendarView';

const CalendarPage = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const data = await getStudentSessions();
        setSessions(data);
      } catch (err) {
        setError('Failed to load sessions. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" />
        <p className="mt-2">Loading your sessions...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h2 className="mb-4">My Sessions Calendar</h2>
      <CalendarView sessions={sessions} />
    </Container>
  );
};

export default CalendarPage;
