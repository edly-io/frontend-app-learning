import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Card,
  DataTable,
  Badge,
  Breadcrumb,
  Spinner,
  Alert,
  Row,
  Col,
} from '@openedx/paragon';
import { getSession } from '../api';
import { formatDateTime, getStatusVariant, extractApiError } from '../utils';
import { SESSION_STATUS_LABELS } from '../constants';

const SessionDetailPage = () => {
  const { courseId, sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSession = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getSession(courseId, sessionId);
        setSession(data);
      } catch (err) {
        setError(extractApiError(err, 'Failed to load session details'));
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [courseId, sessionId]);

  const sessionsListUrl = `/course/${courseId}/sessions`;

  const attendanceColumns = [
    { Header: 'Learner Name', accessor: 'user_name' },
    { Header: 'Email', accessor: 'email' },
    { Header: 'Status', accessor: 'status' },
  ];

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading session details...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger">{error}</Alert>
        <Breadcrumb
          links={[{ label: 'Sessions', url: sessionsListUrl }]}
          activeLabel="Error"
        />
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Breadcrumb
        links={[{ label: 'Sessions', url: sessionsListUrl }]}
        activeLabel={session?.title || 'Session'}
        clickHandler={(e) => {
          e.preventDefault();
          navigate(sessionsListUrl);
        }}
      />

      {/* Session Details */}
      <Card className="mb-4 mt-3">
        <Card.Header>
          <h4 className="mb-0">{session?.title}</h4>
        </Card.Header>
        <Card.Body className="p-4">
          <Row>
            <Col md={3}>
              <strong>Start Time</strong>
              <div>{formatDateTime(session?.scheduled_start_time)}</div>
            </Col>
            <Col md={3}>
              <strong>End Time</strong>
              <div>{formatDateTime(session?.scheduled_end_time)}</div>
            </Col>
            <Col md={3}>
              <strong>Platform</strong>
              <div className="text-capitalize">{session?.platform}</div>
            </Col>
            <Col md={3}>
              <strong>Status</strong>
              <div>
                <Badge variant={getStatusVariant(session?.status)}>
                  {SESSION_STATUS_LABELS[session?.status] || session?.status}
                </Badge>
              </div>
            </Col>
          </Row>
          {session?.description && (
            <div className="mt-3">
              <strong>Description</strong>
              <p className="mb-0 mt-1">{session.description}</p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Attendance Section */}
      <Card>
        <Card.Header>
          <h5 className="mb-0">Attendance</h5>
        </Card.Header>
        <Card.Body>
          <DataTable
            data={[]}
            columns={attendanceColumns}
            itemCount={0}
            pageCount={1}
          >
            <DataTable.Table />
            <DataTable.EmptyTable content="Attendance data coming soon." />
          </DataTable>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default SessionDetailPage;
