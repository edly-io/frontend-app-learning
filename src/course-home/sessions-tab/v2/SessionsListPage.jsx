import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Container,
  DataTable,
  Badge,
  Spinner,
  Alert,
} from '@openedx/paragon';
import { getSessions } from '../api';
import { formatDateTime, getStatusVariant, extractApiError } from '../utils';
import { SESSION_STATUS_LABELS } from '../constants';

const SessionsListPage = () => {
  const { courseId } = useParams();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getSessions(courseId, { page_size: 500 });
        setSessions(data.results || []);
      } catch (err) {
        setError(extractApiError(err, 'Failed to load sessions'));
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, [courseId]);

  /* eslint-disable react/no-unstable-nested-components, react/prop-types */
  const columns = useMemo(() => [
    {
      Header: 'Title',
      accessor: 'title',
      Cell: ({ value, row }) => (
        <Link to={`/course/${courseId}/sessions/${row.original.id}`}>
          {value}
        </Link>
      ),
    },
    {
      Header: 'Date & Time',
      accessor: 'scheduled_start_time',
      Cell: ({ value }) => formatDateTime(value),
    },
    {
      Header: 'Duration',
      accessor: 'duration_minutes',
      Cell: ({ value }) => (value ? `${value} min` : '-'),
    },
    {
      Header: 'Status',
      accessor: 'status',
      Cell: ({ value }) => (
        <Badge variant={getStatusVariant(value)}>
          {SESSION_STATUS_LABELS[value] || value}
        </Badge>
      ),
    },
  ], [courseId]);
  /* eslint-enable react/no-unstable-nested-components, react/prop-types */

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading sessions...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h2 className="mb-4">Sessions</h2>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {sessions.length === 0 ? (
        <Alert variant="info">No sessions found for this course.</Alert>
      ) : (
        <DataTable
          data={sessions}
          columns={columns}
          itemCount={sessions.length}
          pageCount={1}

        >
          <DataTable.Table />
          <DataTable.EmptyTable content="No sessions found" />
        </DataTable>
      )}
    </Container>
  );
};

export default SessionsListPage;
