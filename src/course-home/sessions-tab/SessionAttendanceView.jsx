import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  DataTable,
  Badge,
  Button,
  Spinner,
  Alert,
  Row,
  Col,
} from '@openedx/paragon';
import { Edit } from '@openedx/paragon/icons';
import { getSession, getAttendanceRecords } from './api';
import { formatDateTime, formatDuration, getStatusVariant, extractApiError } from './utils';
import { ATTENDANCE_STATUS } from './constants';
import AttendanceOverrideModal from './AttendanceOverrideModal';

const SessionAttendanceView = ({ sessionId, courseId, isInstructor, onBack }) => {
  const [session, setSession] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    partial: 0,
    rate: 0,
  });

  useEffect(() => {
    fetchData();
  }, [sessionId]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [sessionData, recordsData] = await Promise.all([
        getSession(courseId, sessionId),
        getAttendanceRecords({ session_id: sessionId, page_size: 500 }),
      ]);

      setSession(sessionData);

      const recordsList = recordsData.results || [];
      setRecords(recordsList);

      // Calculate statistics
      const totalRecords = recordsList.length;
      const presentCount = recordsList.filter((r) => r.status === 'present').length;
      const absentCount = recordsList.filter((r) => r.status === 'absent').length;
      const partialCount = recordsList.filter((r) =>
        ['late', 'left_early', 'partial'].includes(r.status)
      ).length;

      setStats({
        total: totalRecords,
        present: presentCount,
        absent: absentCount,
        partial: partialCount,
        rate: totalRecords > 0 ? ((presentCount / totalRecords) * 100).toFixed(1) : 0,
      });
    } catch (err) {
      setError(extractApiError(err, 'Failed to load attendance data'));
    } finally {
      setLoading(false);
    }
  };

  const handleOverrideClick = (record) => {
    setSelectedRecord(record);
    setShowOverrideModal(true);
  };

  const handleOverrideSuccess = () => {
    setShowOverrideModal(false);
    setSelectedRecord(null);
    fetchData(); // Refresh data
  };

  const columns = isInstructor
    ? [
        {
          Header: 'Student',
          accessor: 'email',
          Cell: ({ row }) => (
            <div>
              <div className="font-weight-bold">{row.original.email}</div>
              {row.original.user_name && (
                <small className="text-muted">{row.original.user_name}</small>
              )}
            </div>
          ),
        },
        {
          Header: 'Join Time',
          accessor: 'first_join_time',
          Cell: ({ value }) => (value ? formatDateTime(value) : '-'),
        },
        {
          Header: 'Leave Time',
          accessor: 'last_leave_time',
          Cell: ({ value }) => (value ? formatDateTime(value) : '-'),
        },
        {
          Header: 'Duration',
          accessor: 'total_duration',
          Cell: ({ value }) => formatDuration(value),
        },
        {
          Header: 'Status',
          accessor: 'status',
          Cell: ({ value, row }) => (
            <div>
              <Badge variant={getStatusVariant(value)}>
                {ATTENDANCE_STATUS[value] || value}
              </Badge>
              {row.original.is_overridden && (
                <Badge variant="warning" className="ml-2">
                  Overridden
                </Badge>
              )}
            </div>
          ),
        },
        {
          Header: 'Actions',
          accessor: 'id',
          Cell: ({ row }) => (
            <Button
              variant="link"
              size="sm"
              iconBefore={Edit}
              onClick={() => handleOverrideClick(row.original)}
            >
              Override
            </Button>
          ),
        },
      ]
    : [
        {
          Header: 'Session',
          accessor: 'session_title',
          Cell: () => session?.title || '-',
        },
        {
          Header: 'Date',
          accessor: 'session_date',
          Cell: () =>
            session?.scheduled_start_time
              ? formatDateTime(session.scheduled_start_time)
              : '-',
        },
        {
          Header: 'Join Time',
          accessor: 'first_join_time',
          Cell: ({ value }) => (value ? formatDateTime(value) : '-'),
        },
        {
          Header: 'Duration',
          accessor: 'total_duration',
          Cell: ({ value }) => formatDuration(value),
        },
        {
          Header: 'Status',
          accessor: 'status',
          Cell: ({ value, row }) => (
            <div>
              <Badge variant={getStatusVariant(value)}>
                {ATTENDANCE_STATUS[value] || value}
              </Badge>
              {row.original.is_overridden && (
                <Badge variant="warning" className="ml-2">
                  Adjusted
                </Badge>
              )}
            </div>
          ),
        },
      ];

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading attendance data...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
        <Button variant="outline-primary" onClick={onBack}>
          Back to Sessions
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Session Attendance</h2>
        <Button variant="outline-primary" onClick={onBack}>
          Back to Sessions
        </Button>
      </div>

      {/* Session Details Card */}
      <Card className="mb-4">
        <Card.Header>
          <h4 className="mb-0">{session?.title}</h4>
        </Card.Header>
        <Card.Body className="p-4">
          <Row>
            <Col md={3}>
              <strong>Start Time:</strong>
              <div>{formatDateTime(session?.scheduled_start_time)}</div>
            </Col>
            <Col md={3}>
              <strong>End Time:</strong>
              <div>{formatDateTime(session?.scheduled_end_time)}</div>
            </Col>
            <Col md={3}>
              <strong>Platform:</strong>
              <div className="text-capitalize">{session?.platform}</div>
            </Col>
            <Col md={3}>
              <strong>Status:</strong>
              <div>
                <Badge variant={getStatusVariant(session?.status)}>
                  {session?.status?.replace('_', ' ')}
                </Badge>
              </div>
            </Col>
          </Row>
          {session?.description && (
            <div className="mt-3">
              <strong>Description:</strong>
              <p className="mb-0 mt-1">{session.description}</p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Attendance Statistics */}
      {isInstructor && (
        <Row className="mb-4">
          <Col md={3}>
            <Card>
              <Card.Body className="text-center">
                <h2 className="mb-0">{stats.total}</h2>
                <small className="text-muted">Total Students</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card>
              <Card.Body className="text-center">
                <h2 className="mb-0 text-success">{stats.present}</h2>
                <small className="text-muted">Present</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card>
              <Card.Body className="text-center">
                <h2 className="mb-0 text-danger">{stats.absent}</h2>
                <small className="text-muted">Absent</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card>
              <Card.Body className="text-center">
                <h2 className="mb-0 text-primary">{stats.rate}%</h2>
                <small className="text-muted">Participation Rate</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Attendance Records Table */}
      <Card>
        <Card.Header>
          <h5 className="mb-0">
            {isInstructor ? 'Student Records' : 'Your Records'}
          </h5>
        </Card.Header>
        <Card.Body>
          {records.length === 0 ? (
            <Alert variant="info">
              No attendance records found for this session.
            </Alert>
          ) : (
            <DataTable
              data={records}
              columns={columns}
              itemCount={records.length}
              pageCount={1}
            >
              <DataTable.Table />
              <DataTable.EmptyTable content="No attendance records found" />
            </DataTable>
          )}
        </Card.Body>
      </Card>

      {/* Override Modal */}
      {showOverrideModal && selectedRecord && (
        <AttendanceOverrideModal
          isOpen={showOverrideModal}
          onClose={() => {
            setShowOverrideModal(false);
            setSelectedRecord(null);
          }}
          record={selectedRecord}
          onSuccess={handleOverrideSuccess}
        />
      )}
    </Container>
  );
};

export default SessionAttendanceView;
