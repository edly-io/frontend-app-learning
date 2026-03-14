import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  DataTable,
  Badge,
  Spinner,
  Alert,
  Tabs,
  Tab,
  Button,
} from '@openedx/paragon';
import { Launch } from '@openedx/paragon/icons';
import { getAttendanceRecords, getSessions } from './api';
import { formatDateTime, extractApiError } from './utils';
import { ATTENDANCE_STATUS } from './constants';

// Defined outside StudentSessionList so hooks (useState) are allowed inside.
const StudentTitleCell = ({ row }) => {
  const [expanded, setExpanded] = useState(false);
  const { title, description } = row.original;
  const MAX_LEN = 120;
  const isLong = description && description.length > MAX_LEN;

  return (
    <div>
      <strong>{title}</strong>
      {description && (
        <p className="small text-muted mb-0 mt-1">
          {(!isLong || expanded) ? description : `${description.slice(0, MAX_LEN)}…`}
          {isLong && (
            <button
              type="button"
              className="btn btn-link btn-sm p-0 ml-1 align-baseline"
              onClick={(e) => { e.stopPropagation(); setExpanded(prev => !prev); }}
            >
              {expanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </p>
      )}
    </div>
  );
};

const StudentSessionList = ({ courseId }) => {
  const [records, setRecords] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [courseId]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const now = new Date().toISOString();
      const [recordsData, sessionsData] = await Promise.all([
        getAttendanceRecords({ course_id: courseId, page_size: 500 }),
        getSessions(courseId, { status: 'scheduled', start_date: now, page_size: 100 }),
      ]);

      setRecords(recordsData.results || []);
      setUpcomingSessions(sessionsData.results || []);
    } catch (err) {
      setError(extractApiError(err, 'Failed to load data'));
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      present: 'success',
      absent: 'danger',
      late: 'warning',
      left_early: 'warning',
      partial: 'info',
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {ATTENDANCE_STATUS[status] || status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" />
          <p className="mt-2">Loading session information...</p>
        </div>
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
      {/* Tabs for Upcoming and Past Sessions */}
      <Card>
        <Tabs
          defaultActiveKey="upcoming"
          id="sessions-tabs"
          className="mb-3"
        >
          <Tab eventKey="upcoming" title="Upcoming Sessions">
            <Card.Body>
              {upcomingSessions.length === 0 ? (
                <div className="text-center py-5">
                  <p className="text-muted">No upcoming sessions scheduled</p>
                </div>
              ) : (
                <DataTable
                  data={upcomingSessions}
                  itemCount={upcomingSessions.length}
                  columns={[
                    {
                      Header: 'Session',
                      accessor: 'title',
                      Cell: StudentTitleCell,
                    },
                    {
                      Header: 'Date & Time',
                      accessor: 'scheduled_start_time',
                      Cell: ({ row }) => {
                        const session = row.original;
                        // Each session row (including recurring occurrences) now has its own
                        // scheduled_start_time set from Zoom's occurrences[].start_time.
                        // next_occurrence_start_time no longer exists on the API response.
                        return (
                          <div>
                            {formatDateTime(session.scheduled_start_time)}
                            {session.is_recurring && (
                              <Badge variant="info" className="ml-2">Recurring</Badge>
                            )}
                          </div>
                        );
                      },
                    },
                    {
                      Header: 'Duration',
                      accessor: 'duration_minutes',
                      Cell: ({ value }) => `${value || 0} min`,
                    },
                    {
                      Header: 'Meeting',
                      accessor: 'meeting_join_url',
                      Cell: ({ row }) => {
                        const session = row.original;
                        
                        if (session.attendance_sync_error) {
                          return (
                            <Badge variant="danger" title={session.attendance_sync_error}>
                              Sync Error
                            </Badge>
                          );
                        }
                        
                        if (!session.meeting_join_url) {
                          return (
                            <Badge variant="secondary">
                              Manual
                            </Badge>
                          );
                        }
                        
                        return (
                          <Button
                            variant="primary"
                            size="sm"
                            iconAfter={Launch}
                            aria-label={`Join meeting for ${session.title} (opens in new tab)`}
                            onClick={() => {
                              // eslint-disable-next-line no-alert
                              if (window.confirm('You are about to leave the course page to join a session. Continue?')) {
                                window.open(session.meeting_join_url, '_blank', 'noopener,noreferrer');
                              }
                            }}
                          >
                            Join Meeting
                          </Button>
                        );
                      },
                    },
                  ]}
                >
                  <DataTable.Table />
                  <DataTable.EmptyTable content="No upcoming sessions" />
                </DataTable>
              )}
            </Card.Body>
          </Tab>

          <Tab eventKey="past" title="Past Sessions Attendance">
            <Card.Body>
              {records.length === 0 ? (
                <div className="text-center py-5">
                  <p className="text-muted">No attendance records found</p>
                </div>
              ) : (
                <DataTable
                  data={records}
                  itemCount={records.length}
                  columns={[
                    {
                      Header: 'Session',
                      accessor: 'session_title',
                      Cell: ({ value }) => value || '-',
                    },
                    {
                      Header: 'Date',
                      accessor: 'session_date',
                      Cell: ({ value }) =>
                        value
                          ? formatDateTime(value)
                          : '-',
                    },
                    {
                      Header: 'Join Time',
                      accessor: 'first_join_time',
                      Cell: ({ value }) => (value ? new Date(value).toLocaleTimeString() : '-'),
                    },
                    {
                      Header: 'Leave Time',
                      accessor: 'last_leave_time',
                      Cell: ({ value }) => (value ? new Date(value).toLocaleTimeString() : '-'),
                    },
                    {
                      Header: 'Status',
                      accessor: 'status',
                      Cell: ({ value, row }) => (
                        <div>
                          {getStatusBadge(value)}
                          {row.original.is_overridden && (
                            <Badge variant="warning" className="ml-2">
                              Overridden
                            </Badge>
                          )}
                        </div>
                      ),
                    },
                  ]}
                >
                  <DataTable.TableControlBar />
                  <DataTable.Table />
                  <DataTable.EmptyTable content="No attendance records found" />
                  <DataTable.TableFooter />
                </DataTable>
              )}
            </Card.Body>
          </Tab>
        </Tabs>
      </Card>
    </Container>
  );
};

export default StudentSessionList;
