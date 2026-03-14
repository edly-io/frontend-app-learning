import React, { useState, useEffect } from 'react';
import {
  StandardModal,
  Button,
  Form,
  Alert,
  Spinner,
} from '@openedx/paragon';
import { updateAttendanceRecord } from './api';
import { ATTENDANCE_STATUS } from './constants';

const AttendanceOverrideModal = ({ isOpen, onClose, record, onSuccess }) => {
  const [formData, setFormData] = useState({
    status: record.status,
    override_reason: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset form when record changes
  useEffect(() => {
    if (record) {
      setFormData({
        status: record.status,
        override_reason: '',
      });
      setError('');
      setLoading(false);
    }
  }, [record, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.override_reason.trim()) {
      setError('Override reason is required');
      return;
    }

    if (formData.status === record.status) {
      setError('Please select a different status to override');
      return;
    }

    setLoading(true);

    try {
      await updateAttendanceRecord(record.id, {
        status: formData.status,
        override_reason: formData.override_reason,
        is_overridden: true,
      });

      onSuccess();
    } catch (err) {
      const errorMessage = err.response?.data?.detail 
        || err.response?.data?.error 
        || err.message 
        || 'Failed to update attendance record';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onClose}
      title="Override Attendance Status"
      size="md"
      footerNode={(
        <>
          <Button variant="tertiary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="override-form"
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="mr-2" />
                Saving...
              </>
            ) : 'Save Override'}
          </Button>
        </>
      )}
    >
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Form id="override-form" onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Student Email</Form.Label>
          <Form.Control
            type="text"
            value={record.email || ''}
            disabled
            readOnly
          />
        </Form.Group>

        {record.user_name && (
          <Form.Group className="mb-3">
            <Form.Label>Student Name</Form.Label>
            <Form.Control
              type="text"
              value={record.user_name}
              disabled
              readOnly
            />
          </Form.Group>
        )}

        <Form.Group className="mb-3">
          <Form.Label>Current Status</Form.Label>
          <Form.Control
            type="text"
            value={ATTENDANCE_STATUS[record.status] || record.status}
            disabled
            readOnly
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>
            New Status <span className="text-danger">*</span>
          </Form.Label>
          <Form.Control
            as="select"
            name="status"
            value={formData.status}
            onChange={handleChange}
            required
          >
            <option value="">Select Status</option>
            {Object.entries(ATTENDANCE_STATUS).map(([value, label]) => (
              <option
                key={value}
                value={value}
                disabled={value === record.status}
              >
                {label}
                {value === record.status ? ' (Current)' : ''}
              </option>
            ))}
          </Form.Control>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>
            Override Reason <span className="text-danger">*</span>
          </Form.Label>
          <Form.Control
            as="textarea"
            name="override_reason"
            rows={3}
            value={formData.override_reason}
            onChange={handleChange}
            placeholder="Enter the reason for overriding the attendance status..."
            required
          />
          <Form.Text>
            This reason will be recorded for audit purposes.
          </Form.Text>
        </Form.Group>

        {record.is_overridden && record.override_reason && (
          <Alert variant="info">
            <strong>Previous Override Reason:</strong>
            <p className="mb-0 mt-1">{record.override_reason}</p>
          </Alert>
        )}
      </Form>
    </StandardModal>
  );
};

export default AttendanceOverrideModal;
