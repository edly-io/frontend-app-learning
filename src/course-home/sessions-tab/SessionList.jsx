import React, { useState, useEffect } from 'react';
import {
  DataTable, Badge, IconButton, Spinner, Alert, Button, StandardModal,
} from '@openedx/paragon';
import {
  DeleteOutline, People, EditOutline, Launch, Add,
} from '@openedx/paragon/icons';
import { getAuthenticatedUser } from '@edx/frontend-platform/auth';
import { getSessions, deleteSession } from './api';
import { formatDateTime, getStatusVariant, extractApiError } from './utils';
import { SESSION_STATUS_LABELS } from './constants';

// Defined outside SessionList so React tracks it as a stable component —
// required for hooks (useState) to work inside a DataTable Cell renderer.
const TitleCell = ({ row }) => {
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

const SessionList = ({
  courseId, filter, refreshKey, onViewAttendance, onEditSession, onScheduleNew, onDeleteSuccess, isInstructor,
}) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const currentUser = getAuthenticatedUser();

  useEffect(() => {
    fetchSessions();
  }, [courseId, filter, refreshKey]);

  const fetchSessions = async () => {
    setLoading(true);
    setError('');
    try {
      const filters = {};
      const now = new Date().toISOString();

      if (filter === 'upcoming') {
        filters.start_date = now;
      } else if (filter === 'past') {
        filters.end_date = now;
      }
      // Request enough to cover any realistic course schedule in one page.
      // The backend cap is max_page_size=200 so this never truncates silently.
      filters.page_size = 100;

      const data = await getSessions(courseId, filters);
      setSessions(data.results ?? []);
    } catch (err) {
      // Check if it's a 404 (endpoint not found) or other error
      if (err.response?.status === 404) {
        setError('Attendance API not available. Please ensure the backend attendance app is installed.');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to view attendance sessions.');
      } else {
        setError(extractApiError(err, 'Failed to load sessions'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (session) => {
    setSessionToDelete(session);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!sessionToDelete) { return; }

    try {
      await deleteSession(courseId, sessionToDelete.id);
      setDeleteModalOpen(false);
      setSessionToDelete(null);
      fetchSessions();
      onDeleteSuccess?.();
    } catch (err) {
      setError('Failed to delete session');
      setDeleteModalOpen(false);
      setSessionToDelete(null);
    }
  };

  const getStatusBadge = (status) => {
    // Use constant label map; fall back to title-casing the raw value
    const label = SESSION_STATUS_LABELS[status]
      || status?.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      || status;
    return (
      <Badge variant={getStatusVariant(status)} aria-label={`Status: ${label}`}>
        {label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
        <p className="mt-2">Loading sessions...</p>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (sessions.length === 0) {
    if (filter === 'upcoming' && isInstructor) {
      return (
        <div className="text-center py-5">
          <p className="h4 mb-2">No upcoming sessions</p>
          <p className="text-muted mb-4">
            Schedule a session for your students to join.
          </p>
          <Button variant="primary" iconBefore={Add} onClick={onScheduleNew}>
            Schedule a Session
          </Button>
        </div>
      );
    }
    return (
      <div className="text-center py-5">
        <p className="text-muted">
          {filter === 'upcoming' ? 'No upcoming sessions scheduled.' : 'No past sessions found.'}
        </p>
      </div>
    );
  }

  return (
    <>
      <DataTable
        data={sessions}
        itemCount={sessions.length}
        columns={[
          {
            Header: 'Title',
            accessor: 'title',
            Cell: TitleCell,
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
          // Session lifecycle status (scheduled/in_progress/completed/cancelled).
          // Note: the backend does not auto-transition status, so a past session
          // may still read "Scheduled" if no one updated it. The attendance_synced
          // badge below is the most reliable indicator for past sessions.
            Header: 'Status',
            accessor: 'status',
            Cell: ({ value, row }) => (
              <div>
                {getStatusBadge(value)}
                {filter === 'past' && (
                <Badge
                  variant={row.original.attendance_synced ? 'success' : 'secondary'}
                  className="d-block mt-1"
                  aria-label={row.original.attendance_synced ? 'Attendance synced' : 'Attendance not synced'}
                >
                  {row.original.attendance_synced ? '\u2713 Synced' : 'Not synced'}
                </Badge>
                )}
              </div>
            ),
          },
          ...(filter !== 'past' ? [{
            Header: 'Zoom Meeting',
            accessor: 'meeting_join_url',
            Cell: ({ row }) => {
              const session = row.original;

              // Show error if attendance sync failed
              if (session.attendance_sync_error) {
                return (
                  <Badge variant="danger" title={session.attendance_sync_error}>
                    Sync Error
                  </Badge>
                );
              }

              // If no meeting URL, this is a manual session
              if (!session.meeting_join_url) {
                return (
                  <Badge variant="secondary">
                    Manual Session
                  </Badge>
                );
              }

              // Instructor (host) uses start_url, students use join_url
              const isHost = isInstructor || session.instructor_email === currentUser?.email;
              const meetingUrl = isHost ? session.meeting_start_url : session.meeting_join_url;
              const buttonText = isHost ? 'Start Meeting' : 'Join Meeting';
              const buttonVariant = isHost ? 'success' : 'primary';

              return (
                <div className="d-flex flex-column gap-1">
                  <Button
                    variant={buttonVariant}
                    size="sm"
                    iconAfter={Launch}
                    aria-label={`${buttonText} for ${session.title} (opens in new tab)`}
                    onClick={() => {
                    // eslint-disable-next-line no-alert
                      if (window.confirm(`You are about to leave the course page to ${buttonText.toLowerCase()}. Continue?`)) {
                        window.open(meetingUrl, '_blank', 'noopener,noreferrer');
                      }
                    }}
                    style={{ width: 'fit-content' }}
                  >
                    {buttonText}
                  </Button>
                  {session.meeting_password && (
                  <small className="text-muted">
                    Password: <code>{session.meeting_password}</code>
                  </small>
                  )}
                </div>
              );
            },
          }] : []),
          ...(filter === 'past' ? [{
            Header: 'Attendance',
            accessor: 'attendance_action',
            Cell: ({ row }) => (
              <Button
                variant="outline-primary"
                size="sm"
                iconBefore={People}
                aria-label={`View attendance for ${row.original.title}`}
                onClick={() => onViewAttendance?.(row.original.id)}
              >
                View
              </Button>
            ),
          }] : []),
          ...(filter !== 'past' ? [{
            Header: 'Edit',
            accessor: 'edit_action',
            Cell: ({ row }) => (
              <IconButton
                src={EditOutline}
                iconAs={EditOutline}
                alt="Edit"
                size="sm"
                onClick={() => onEditSession?.(row.original)}
              />
            ),
          }] : []),
          ...(filter !== 'past' ? [{
            Header: 'Delete',
            accessor: 'delete_action',
            Cell: ({ row }) => (
              <IconButton
                src={DeleteOutline}
                iconAs={DeleteOutline}
                alt="Delete"
                size="sm"
                variant="danger"
                onClick={() => handleDeleteClick(row.original)}
              />
            ),
          }] : []),
        ]}
      />

      {deleteModalOpen && sessionToDelete && (
      <StandardModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSessionToDelete(null);
        }}
        title="Delete Session"
        footerNode={(
          <>
            <Button
              variant="tertiary"
              onClick={() => {
                setDeleteModalOpen(false);
                setSessionToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
              className="ml-2"
            >
              Delete
            </Button>
          </>
        )}
      >
        <p>
          Are you sure you want to delete the session <strong>{sessionToDelete.title}</strong>?
          This action cannot be undone.
        </p>
      </StandardModal>
      )}

    </>
  );
};

export default SessionList;
