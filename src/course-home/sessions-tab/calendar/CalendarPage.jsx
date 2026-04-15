import React, {
  useState, useEffect, useMemo, useCallback,
} from 'react';
import {
  Container, Spinner, Alert, Toast, StandardModal, Button,
} from '@openedx/paragon';
import { FooterSlot } from '@edx/frontend-component-footer';
import { getCalendarSessions, deleteSession } from '../api';
import { extractApiError } from '../utils';
import ScheduleMeetingModal from '../ScheduleMeetingModal';
import HeaderSlot from '../../../plugin-slots/HeaderSlot';
import CalendarView, { getMonthGridDays, getWeekDays } from './CalendarView';

const VIEWS = { MONTH: 'month', WEEK: 'week', DAY: 'day' };

/**
 * Compute the [start, end) date window the calendar currently shows.
 * Month → full 6-week grid (Sunday before the 1st → Saturday after the last day)
 * Week  → Sunday → following Sunday
 * Day   → start of day → start of next day
 */
const computeFetchWindow = (view, currentDate) => {
  if (view === VIEWS.MONTH) {
    const days = getMonthGridDays(currentDate);
    const start = new Date(days[0]);
    start.setHours(0, 0, 0, 0);
    const end = new Date(days[days.length - 1]);
    end.setDate(end.getDate() + 1);
    end.setHours(0, 0, 0, 0);
    return { start, end };
  }
  if (view === VIEWS.WEEK) {
    const days = getWeekDays(currentDate);
    const start = new Date(days[0]);
    start.setHours(0, 0, 0, 0);
    const end = new Date(days[6]);
    end.setDate(end.getDate() + 1);
    end.setHours(0, 0, 0, 0);
    return { start, end };
  }
  // Day view
  const start = new Date(currentDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

const CalendarPage = () => {
  const [sessions, setSessions] = useState([]);
  const [userRole, setUserRole] = useState('learner');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const canManageSessions = userRole === 'admin';
  const [refreshKey, setRefreshKey] = useState(0);

  // Calendar navigation state — lifted here because it drives the fetch window.
  const [view, setView] = useState(VIEWS.MONTH);
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  // modalSession: undefined = closed | null = create | Session object = edit
  const [modalSession, setModalSession] = useState(undefined);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const { start, end } = useMemo(
    () => computeFetchWindow(view, currentDate),
    [view, currentDate],
  );

  // Re-fetch whenever the visible window changes or a mutation triggers a refresh.
  // The backend requires start_date + end_date and enforces a 45-day max window.
  useEffect(() => {
    let cancelled = false;
    const fetchSessions = async () => {
      setLoading(true);
      try {
        const { sessions: data, userRole: role } = await getCalendarSessions(start.toISOString(), end.toISOString());
        if (!cancelled) {
          setSessions(data);
          setUserRole(role || 'learner');
          setError('');
        }
      } catch (err) {
        if (!cancelled) {
          setError('Failed to load sessions. Please try again later.');
        }
      } finally {
        if (!cancelled) { setLoading(false); }
      }
    };
    fetchSessions();
    return () => { cancelled = true; };
  }, [start, end, refreshKey]);

  const showSuccess = (message) => {
    setToastMessage(message);
    setShowToast(true);
  };

  const handleScheduleNew = () => setModalSession(null);
  const handleEditSession = (session) => setModalSession(session);
  const handleDeleteSession = (session) => {
    setDeleteError('');
    setSessionToDelete(session);
  };

  const handleSessionSuccess = () => {
    const wasEdit = Boolean(modalSession);
    setModalSession(undefined);
    setRefreshKey((prev) => prev + 1);
    showSuccess(wasEdit ? 'Session updated successfully!' : 'Session created successfully!');
  };

  const handleDeleteConfirm = async () => {
    if (!sessionToDelete) { return; }
    try {
      await deleteSession(sessionToDelete.course_id, sessionToDelete.id);
      setSessionToDelete(null);
      setRefreshKey((prev) => prev + 1);
      showSuccess('Session deleted successfully!');
    } catch (err) {
      setDeleteError(extractApiError(err, 'Failed to delete session'));
    }
  };

  const handleDeleteCancel = () => {
    setSessionToDelete(null);
    setDeleteError('');
  };

  // ── Calendar navigation handlers passed down to CalendarView ──
  const handleNavigate = useCallback((direction) => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (view === VIEWS.MONTH) {
        d.setMonth(d.getMonth() + direction);
      } else if (view === VIEWS.WEEK) {
        d.setDate(d.getDate() + direction * 7);
      } else {
        d.setDate(d.getDate() + direction);
      }
      return d;
    });
  }, [view]);

  const handleGoToToday = useCallback(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    setCurrentDate(d);
  }, []);

  const handleViewChange = useCallback((nextView) => {
    setView(nextView);
  }, []);

  const renderContent = () => {
    // Initial load — show full-page spinner. Subsequent navigations use the
    // inline loading opacity inside CalendarView instead so the grid stays visible.
    if (loading && sessions.length === 0 && !error) {
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
        <CalendarView
          sessions={sessions}
          view={view}
          currentDate={currentDate}
          onViewChange={handleViewChange}
          onNavigate={handleNavigate}
          onGoToToday={handleGoToToday}
          onScheduleNew={handleScheduleNew}
          onEditSession={handleEditSession}
          onDeleteSession={handleDeleteSession}
          loading={loading}
          canManageSessions={canManageSessions}
        />
      </Container>
    );
  };

  return (
    <>
      <HeaderSlot />
      <main id="main-content" className="d-flex flex-column flex-grow-1">
        {renderContent()}
      </main>
      <FooterSlot />

      {/* Create / Edit modal — only for admins */}
      {canManageSessions && (
        <ScheduleMeetingModal
          isOpen={modalSession !== undefined}
          onClose={() => setModalSession(undefined)}
          courseId={modalSession?.course_id || ''}
          session={modalSession}
          onSuccess={handleSessionSuccess}
        />
      )}

      {/* Delete confirmation — only for admins */}
      {canManageSessions && sessionToDelete && (
        <StandardModal
          isOpen
          onClose={handleDeleteCancel}
          title="Delete Session"
          footerNode={(
            <>
              <Button variant="tertiary" onClick={handleDeleteCancel}>Cancel</Button>
              <Button variant="danger" onClick={handleDeleteConfirm} className="ml-2">
                Delete
              </Button>
            </>
          )}
        >
          {deleteError && <Alert variant="danger" className="mb-3">{deleteError}</Alert>}
          <p>
            Are you sure you want to delete the session <strong>{sessionToDelete.title}</strong>?
            This action cannot be undone.
          </p>
        </StandardModal>
      )}

      {/* Toast — persists across view transitions */}
      <div
        style={{
          position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9999,
        }}
        aria-live="polite"
        aria-atomic="true"
      >
        <Toast show={showToast} onClose={() => setShowToast(false)} delay={4000} autohide>
          {toastMessage}
        </Toast>
      </div>
    </>
  );
};

export default CalendarPage;
