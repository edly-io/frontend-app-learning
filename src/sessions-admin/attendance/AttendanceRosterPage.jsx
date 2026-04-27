import React, {
  useEffect, useMemo, useState,
} from 'react';
import PropTypes from 'prop-types';
import { Link, useParams } from 'react-router-dom';
import {
  Alert, Badge, Button, Container, DataTable, Form, Spinner, Toast,
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
const PAGE_SIZE = 25;

const NameCell = ({ value }) => value || '—';
NameCell.propTypes = { value: PropTypes.string };
NameCell.defaultProps = { value: '' };

const EmailCell = ({ value }) => <span className="text-muted">{value || '—'}</span>;
EmailCell.propTypes = { value: PropTypes.string };
EmailCell.defaultProps = { value: '' };

// Extracted to module scope (react/no-unstable-nested-components). Reads the
// current status and onChange callback from row data — see tableData below.
const StatusCell = ({ row }) => (
  <div className="d-flex" style={{ gap: 12 }}>
    {STATUS_OPTIONS.map((opt) => (
      <Form.Check
        key={opt.value}
        type="radio"
        name={`status-${row.original.user_id}`}
        id={`status-${row.original.user_id}-${opt.value}`}
        label={opt.label}
        checked={row.original.currentStatus === opt.value}
        onChange={() => row.original.onStatusChange(opt.value)}
      />
    ))}
  </div>
);
StatusCell.propTypes = {
  row: PropTypes.shape({
    original: PropTypes.shape({
      user_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      currentStatus: PropTypes.string.isRequired,
      onStatusChange: PropTypes.func.isRequired,
    }).isRequired,
  }).isRequired,
};

const COLUMNS = [
  { Header: 'Name', accessor: 'full_name', Cell: NameCell },
  { Header: 'Email', accessor: 'email', Cell: EmailCell },
  { Header: 'Status', id: 'status', Cell: StatusCell },
];

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

  // Augment each learner row with its current status and a per-row change
  // handler so the module-scope StatusCell can re-render when the Map changes
  // without nesting a component inside the parent's render.
  const tableData = useMemo(() => (
    learners.map((l) => ({
      ...l,
      currentStatus: statusByUserId.get(l.user_id) ?? DEFAULT_STATUS,
      onStatusChange: (value) => setStatusFor(l.user_id, value),
    }))
  ), [learners, statusByUserId]);

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
        <div className="d-flex" style={{ gap: 6 }}>
          <Badge variant="success">{counts.present} present</Badge>
          <Badge variant="danger">{counts.absent} absent</Badge>
          <Badge variant="warning">{counts.late} late</Badge>
        </div>
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

          <DataTable
            isPaginated={learners.length > PAGE_SIZE}
            data={tableData}
            columns={COLUMNS}
            itemCount={tableData.length}
            initialState={{ pageSize: PAGE_SIZE }}
          >
            <DataTable.Table />
            <DataTable.EmptyTable content="No learners" />
            {learners.length > PAGE_SIZE && <DataTable.TableFooter />}
          </DataTable>

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
