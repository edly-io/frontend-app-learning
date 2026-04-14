import React, { useState, useEffect } from 'react';
import {
  Container, Spinner, Alert, Toast, StandardModal, Button,
} from '@openedx/paragon';
import { FooterSlot } from '@edx/frontend-component-footer';
import { getStudentSessions, deleteSession } from '../api';
import { extractApiError } from '../utils';
import ScheduleMeetingModal from '../ScheduleMeetingModal';
import HeaderSlot from '../../../plugin-slots/HeaderSlot';
import CalendarView from './CalendarView';

const CalendarPage = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // modalSession: undefined = closed | null = create | Session object = edit
  const [modalSession, setModalSession] = useState(undefined);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true);
      try {
        const data = await getStudentSessions();
        setSessions(data);
        setError('');
      } catch (err) {
        setError('Failed to load sessions. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, [refreshKey]);

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

  const renderContent = () => {
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
        <CalendarView
          sessions={sessions}
          onScheduleNew={handleScheduleNew}
          onEditSession={handleEditSession}
          onDeleteSession={handleDeleteSession}
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

      {/* Create / Edit modal — reuses existing ScheduleMeetingModal.
          In create mode (modalSession === null) the user picks the course inside the modal. */}
      <ScheduleMeetingModal
        isOpen={modalSession !== undefined}
        onClose={() => setModalSession(undefined)}
        courseId={modalSession?.course_id || ''}
        session={modalSession}
        onSuccess={handleSessionSuccess}
      />

      {/* Delete confirmation */}
      {sessionToDelete && (
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
