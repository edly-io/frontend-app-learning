import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Alert, Toast } from '@openedx/paragon';
import { InfoOutline } from '@openedx/paragon/icons';
import { useModel } from '../../generic/model-store';
import ScheduleMeetingButton from './ScheduleMeetingButton';
import ScheduleMeetingModal from './ScheduleMeetingModal';
import SessionTabs from './SessionTabs';
import SessionAttendanceView from './SessionAttendanceView';
import StudentSessionList from './StudentSessionList';

// View identifiers — one place to add new views (e.g. recordings)
const VIEWS = {
  INSTRUCTOR: 'instructor',
  STUDENT: 'student',
  ATTENDANCE: 'attendance',
};

const SessionsApp = () => {
  const { courseId } = useParams();
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  // 3-state: undefined = modal closed, null = create new, Session object = edit existing
  const [modalSession, setModalSession] = useState(undefined);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const courseHomeMetadata = useModel('courseHomeMeta', courseId);
  const isInstructor = courseHomeMetadata?.isStaff || false;

  const showSuccess = (message) => {
    setToastMessage(message);
    setShowToast(true);
  };

  const handleSessionCreated = () => {
    setModalSession(undefined);
    setRefreshKey(prev => prev + 1);
    showSuccess('Session created successfully!');
  };

  const handleSessionUpdated = () => {
    setModalSession(undefined);
    setRefreshKey(prev => prev + 1);
    showSuccess('Session updated successfully!');
  };

  const handleDeleteSuccess = () => showSuccess('Session deleted successfully!');

  const handleViewAttendance = (sessionId) => setSelectedSessionId(sessionId);

  const handleBackToSessions = () => {
    setSelectedSessionId(null);
    setRefreshKey(prev => prev + 1);
  };

  const currentView = selectedSessionId ? VIEWS.ATTENDANCE
    : !isInstructor ? VIEWS.STUDENT
      : VIEWS.INSTRUCTOR;

  return (
    <>
      {/* Toast — outside view conditionals so it persists across view transitions */}
      <div
        style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9999 }}
        aria-live="polite"
        aria-atomic="true"
      >
        <Toast show={showToast} onClose={() => setShowToast(false)} delay={4000} autohide>
          {toastMessage}
        </Toast>
      </div>

      {/*
        Single modal instance for BOTH create and edit — completely decoupled from
        ScheduleMeetingButton so that button's label/icon never changes.
        modalSession: undefined = closed | null = create | Session object = edit
      */}
      <ScheduleMeetingModal
        isOpen={modalSession !== undefined}
        onClose={() => setModalSession(undefined)}
        courseId={courseId}
        session={modalSession}
        onSuccess={modalSession ? handleSessionUpdated : handleSessionCreated}
      />

      {currentView === VIEWS.ATTENDANCE && (
        <SessionAttendanceView
          sessionId={selectedSessionId}
          courseId={courseId}
          isInstructor={isInstructor}
          onBack={handleBackToSessions}
        />
      )}

      {currentView === VIEWS.STUDENT && (
        <StudentSessionList courseId={courseId} />
      )}

      {currentView === VIEWS.INSTRUCTOR && (
        <Container className="py-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Sessions</h2>
            <ScheduleMeetingButton onClick={() => setModalSession(null)} />
          </div>

          <Alert variant="info" icon={InfoOutline} className="mb-4">
            <strong>Session Management:</strong> Create and manage sessions for your course.
            Students will be tracked automatically when they join sessions.
          </Alert>

          <SessionTabs
            courseId={courseId}
            refreshKey={refreshKey}
            onViewAttendance={handleViewAttendance}
            onEditSession={(session) => setModalSession(session)}
            onScheduleNew={() => setModalSession(null)}
            onDeleteSuccess={handleDeleteSuccess}
          />
        </Container>
      )}
    </>
  );
};

export default SessionsApp;
