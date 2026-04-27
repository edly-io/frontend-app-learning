import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Link, useParams } from 'react-router-dom';
import {
  Alert, Badge, Button, Container, DataTable, Form, Icon, Spinner,
} from '@openedx/paragon';
import { People, Search } from '@openedx/paragon/icons';

import { getPastSessionsForAttendance } from '../api';
import { extractApiError, formatDateTime, getStatusVariant } from '../../course-home/sessions-tab/utils';
import { SESSION_STATUS_LABELS } from '../../course-home/sessions-tab/constants';

const PAGE_SIZE = 25;

const TitleCell = ({ row }) => (
  <div>
    <strong>{row.original.title}</strong>
    {row.original.course_name && (
      <div className="small text-muted">{row.original.course_name}</div>
    )}
  </div>
);
TitleCell.propTypes = {
  row: PropTypes.shape({
    original: PropTypes.shape({
      title: PropTypes.string,
      course_name: PropTypes.string,
    }).isRequired,
  }).isRequired,
};

const DateCell = ({ value }) => formatDateTime(value);
DateCell.propTypes = { value: PropTypes.string };
DateCell.defaultProps = { value: '' };

const SyncCell = ({ row }) => {
  const { attendance_synced: synced, attendance_sync_error: syncError } = row.original;
  if (syncError) { return <Badge variant="danger" title={syncError}>Sync error</Badge>; }
  if (synced) { return <Badge variant="success">Synced</Badge>; }
  return <Badge variant="secondary">Not synced</Badge>;
};
SyncCell.propTypes = {
  row: PropTypes.shape({
    original: PropTypes.shape({
      attendance_synced: PropTypes.bool,
      attendance_sync_error: PropTypes.string,
    }).isRequired,
  }).isRequired,
};

const StatusCell = ({ value }) => (
  <Badge variant={getStatusVariant(value)}>{SESSION_STATUS_LABELS[value] || value}</Badge>
);
StatusCell.propTypes = { value: PropTypes.string };
StatusCell.defaultProps = { value: '' };

// Extracted to module scope (react/no-unstable-nested-components) — pulls
// programId from useParams() so the link target stays correct across nav.
const ViewMarkActionCell = ({ row }) => {
  const { programId } = useParams();
  return (
    <Button
      as={Link}
      to={`/sessions/${programId}/attendance/sessions/${row.original.id}`}
      variant="outline-primary"
      size="sm"
      iconBefore={People}
    >
      View / Mark
    </Button>
  );
};
ViewMarkActionCell.propTypes = {
  row: PropTypes.shape({
    original: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    }).isRequired,
  }).isRequired,
};

const COLUMNS = [
  { Header: 'Title', accessor: 'title', Cell: TitleCell },
  { Header: 'Date', accessor: 'scheduled_start_time', Cell: DateCell },
  { Header: 'Status', accessor: 'status', Cell: StatusCell },
  { Header: 'Attendance', accessor: 'attendance_synced', Cell: SyncCell },
  { Header: 'Action', id: 'action', Cell: ViewMarkActionCell },
];

const AdminSessionsList = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getPastSessionsForAttendance({ daysBack: 30 });
        if (cancelled) { return; }
        const results = Array.isArray(data) ? data : data.results ?? [];
        // calendar-sessions returns the entire window; sort desc here.
        results.sort((a, b) => (
          new Date(b.scheduled_start_time) - new Date(a.scheduled_start_time)
        ));
        setSessions(results);
      } catch (err) {
        if (!cancelled) { setError(extractApiError(err, 'Failed to load past sessions')); }
      } finally {
        if (!cancelled) { setLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filteredSessions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) { return sessions; }
    return sessions.filter((s) => (
      (s.title || '').toLowerCase().includes(q)
      || (s.course_name || '').toLowerCase().includes(q)
    ));
  }, [sessions, query]);

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading sessions...</p>
      </Container>
    );
  }

  return (
    <Container className="py-3">
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {sessions.length === 0 ? (
        <Alert variant="info">No past sessions in the last 30 days.</Alert>
      ) : (
        <>
          <Form.Group controlId="sessions-search" className="mb-3" style={{ maxWidth: 320 }}>
            <Form.Control
              type="search"
              placeholder="Search sessions…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              leadingElement={<Icon src={Search} />}
            />
          </Form.Group>
          <DataTable
            // Remount on filter change so pageIndex resets to 0 — react-table does
            // not auto-reset when the data array shrinks beneath the current page.
            key={query}
            isPaginated
            data={filteredSessions}
            columns={COLUMNS}
            itemCount={filteredSessions.length}
            initialState={{ pageSize: PAGE_SIZE }}
          >
            <DataTable.Table />
            <DataTable.EmptyTable content="No sessions match your search" />
            <DataTable.TableFooter />
          </DataTable>
        </>
      )}
    </Container>
  );
};

export default AdminSessionsList;
