import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Link, useParams } from 'react-router-dom';
import {
  Alert, Badge, Button, Container, DataTable, Spinner,
} from '@openedx/paragon';
import { People } from '@openedx/paragon/icons';

import { getPastSessionsForAttendance } from '../api';
import { extractApiError, formatDateTime, getStatusVariant } from '../../course-home/sessions-tab/utils';
import { SESSION_STATUS_LABELS } from '../../course-home/sessions-tab/constants';

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

const COLUMNS = [
  { Header: 'Title', accessor: 'title', Cell: TitleCell },
  { Header: 'Date', accessor: 'scheduled_start_time', Cell: DateCell },
  { Header: 'Status', accessor: 'status', Cell: StatusCell },
  { Header: 'Attendance', accessor: 'attendance_synced', Cell: SyncCell },
];

const AdminSessionsList = () => {
  const { programId } = useParams();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  // Augment columns with the action — needs programId from URL, hence inline here.
  const columnsWithAction = [
    ...COLUMNS,
    {
      Header: 'Action',
      id: 'action',
      Cell: ({ row }) => (
        <Button
          as={Link}
          to={`/sessions/${programId}/attendance/sessions/${row.original.id}`}
          variant="outline-primary"
          size="sm"
          iconBefore={People}
        >
          View / Mark
        </Button>
      ),
    },
  ];

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
        <DataTable
          data={sessions}
          columns={columnsWithAction}
          itemCount={sessions.length}
        >
          <DataTable.Table />
          <DataTable.EmptyTable content="No sessions" />
        </DataTable>
      )}
    </Container>
  );
};

export default AdminSessionsList;
