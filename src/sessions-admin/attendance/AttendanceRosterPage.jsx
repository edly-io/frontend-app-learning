import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Alert, Button, ButtonGroup, Container, Form, Spinner, Toast,
} from '@openedx/paragon';
import { ArrowBack, Save } from '@openedx/paragon/icons';

import {
  getEnrolledLearners,
  markAttendance,
} from '../api';
import { getAttendanceRecords } from '../../course-home/sessions-tab/api';
import { extractApiError } from '../../course-home/sessions-tab/utils';

const STATUS_OPTIONS = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'late', label: 'Late' },
];

const DEFAULT_STATUS = 'present';

const AttendanceRosterPage = () => {
  const { programId, sessionId } = useParams();
  const [learners, setLearners] = useState([]);
  // Map<userId, status>. The marking UI is fully controlled — admin toggles
  // dissenters, hits Save, the diff hits the backend.
  const [statusByUserId, setStatusByUserId] = useState(() => new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [rosterData, recordsData] = await Promise.all([
          getEnrolledLearners(sessionId),
          // Pre-load existing records so previously-marked sessions show their
          // current state instead of resetting everyone to "present".
          getAttendanceRecords({ session_id: sessionId, page_size: 500 }),
        ]);
        if (cancelled) { return; }
        const roster = rosterData.results ?? [];
        const existing = recordsData.results ?? [];
        const seeded = new Map();
        roster.forEach((row) => seeded.set(row.user_id, DEFAULT_STATUS));
        existing.forEach((rec) => {
          if (seeded.has(rec.user_id)) {
            seeded.set(rec.user_id, STATUS_OPTIONS.some((s) => s.value === rec.status)
              ? rec.status
              : DEFAULT_STATUS);
          }
        });
        setLearners(roster);
        setStatusByUserId(seeded);
      } catch (err) {
        if (!cancelled) { setError(extractApiError(err, 'Failed to load roster')); }
      } finally {
        if (!cancelled) { setLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [sessionId]);

  const setStatusFor = (userId, value) => {
    setStatusByUserId((prev) => {
      const next = new Map(prev);
      next.set(userId, value);
      return next;
    });
  };

  const setAll = (value) => {
    setStatusByUserId((prev) => {
      const next = new Map(prev);
      prev.forEach((_, userId) => next.set(userId, value));
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const records = Array.from(statusByUserId.entries()).map(([userId, status]) => ({
        user_id: userId,
        status,
      }));
      await markAttendance(sessionId, records);
      setShowToast(true);
    } catch (err) {
      setError(extractApiError(err, 'Failed to save attendance'));
    } finally {
      setSaving(false);
    }
  };

  const counts = useMemo(() => {
    const out = { present: 0, absent: 0, late: 0 };
    statusByUserId.forEach((value) => {
      if (out[value] !== undefined) { out[value] += 1; }
    });
    return out;
  }, [statusByUserId]);

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading roster...</p>
      </Container>
    );
  }

  return (
    <Container className="py-3">
      <div className="d-flex align-items-center mb-3" style={{ gap: 12 }}>
        <Button
          as={Link}
          to={`/sessions/${programId}/attendance/sessions`}
          variant="tertiary"
          size="sm"
          iconBefore={ArrowBack}
        >
          Back to sessions
        </Button>
        <span className="text-muted small">
          {counts.present} present · {counts.absent} absent · {counts.late} late
        </span>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {learners.length === 0 ? (
        <Alert variant="info">No learners are enrolled in this course.</Alert>
      ) : (
        <>
          <div className="mb-3 d-flex" style={{ gap: 8 }}>
            <Button variant="outline-success" size="sm" onClick={() => setAll('present')}>
              Mark all present
            </Button>
            <Button variant="outline-danger" size="sm" onClick={() => setAll('absent')}>
              Mark all absent
            </Button>
          </div>

          <table className="table table-sm" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th style={{ width: 320 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {learners.map((row) => (
                <tr key={row.user_id}>
                  <td>{row.full_name}</td>
                  <td className="text-muted">{row.email}</td>
                  <td>
                    <ButtonGroup>
                      {STATUS_OPTIONS.map((opt) => {
                        const active = statusByUserId.get(row.user_id) === opt.value;
                        return (
                          <Form.Check
                            key={opt.value}
                            type="radio"
                            name={`status-${row.user_id}`}
                            id={`status-${row.user_id}-${opt.value}`}
                            label={opt.label}
                            inline
                            checked={active}
                            onChange={() => setStatusFor(row.user_id, opt.value)}
                          />
                        );
                      })}
                    </ButtonGroup>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-3">
            <Button
              variant="primary"
              iconBefore={Save}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save attendance'}
            </Button>
          </div>
        </>
      )}

      <div
        style={{
          position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9999,
        }}
        aria-live="polite"
      >
        <Toast
          show={showToast}
          onClose={() => setShowToast(false)}
          delay={3500}
          autohide
        >
          Attendance saved.
        </Toast>
      </div>
    </Container>
  );
};

export default AttendanceRosterPage;
