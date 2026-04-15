import React, {
  useState, useEffect, useMemo,
} from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Container,
  DataTable,
  Badge,
  Spinner,
  Alert,
  Tabs,
  Tab,
} from '@openedx/paragon';

import { getSessions } from '../api';
import { formatDateTime, getStatusVariant, extractApiError } from '../utils';
import { SESSION_STATUS_LABELS } from '../constants';
import StudentRequestsTab from '../StudentRequestsTab';
import { useModel } from '../../../generic/model-store';

const TAB_SESSIONS = 'sessions';
const TAB_REQUESTS = 'requests';

const SessionsListPage = () => {
  const { courseId } = useParams();
  const courseHomeMetadata = useModel('courseHomeMeta', courseId);
  // courseHomeMeta.isStaff is true for both admins and course instructors —
  // matches the set of users allowed to review requests on this course.
  const canReviewRequests = Boolean(courseHomeMetadata?.isStaff);

  const [activeTab, setActiveTab] = useState(TAB_SESSIONS);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const fetchSessions = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getSessions(courseId, { page_size: 500 });
        if (!cancelled) { setSessions(data.results || []); }
      } catch (err) {
        if (!cancelled) { setError(extractApiError(err, 'Failed to load sessions')); }
      } finally {
        if (!cancelled) { setLoading(false); }
      }
    };
    fetchSessions();
    return () => { cancelled = true; };
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

  const renderSessionsBody = () => {
    if (loading) {
      return (
        <div className="py-5 text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading sessions...</p>
        </div>
      );
    }
    if (error) {
      return (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      );
    }
    if (sessions.length === 0) {
      return <Alert variant="info">No sessions found for this course.</Alert>;
    }
    return (
      <DataTable
        data={sessions}
        columns={columns}
        itemCount={sessions.length}
        pageCount={1}
      >
        <DataTable.Table />
        <DataTable.EmptyTable content="No sessions found" />
      </DataTable>
    );
  };

  const requestsTabTitle = pendingRequestCount > 0 ? (
    <span>
      Student Requests{' '}
      <Badge variant="warning" pill>{pendingRequestCount}</Badge>
    </span>
  ) : 'Student Requests';

  return (
    <Container className="py-4">
      <h2 className="mb-4">Sessions</h2>

      <Tabs
        activeKey={activeTab}
        onSelect={(key) => setActiveTab(key)}
        className="mb-3"
      >
        <Tab eventKey={TAB_SESSIONS} title="Sessions">
          <div className="pt-3">{renderSessionsBody()}</div>
        </Tab>
        {canReviewRequests && (
          <Tab eventKey={TAB_REQUESTS} title={requestsTabTitle}>
            <StudentRequestsTab
              courseId={courseId}
              onPendingCountChange={setPendingRequestCount}
            />
          </Tab>
        )}
      </Tabs>
    </Container>
  );
};

export default SessionsListPage;
