import React from 'react';
import { Button } from '@openedx/paragon';
import { Add } from '@openedx/paragon/icons';

/**
 * A simple "Schedule Meeting" trigger button.
 * All modal state (create AND edit) is owned by SessionsApp to keep
 * both flows decoupled from this button's label/icon.
 */
const ScheduleMeetingButton = ({ onClick }) => (
  <Button
    variant="primary"
    iconBefore={Add}
    aria-label="Schedule a new meeting"
    onClick={onClick}
  >
    Schedule Meeting
  </Button>
);

export default ScheduleMeetingButton;
