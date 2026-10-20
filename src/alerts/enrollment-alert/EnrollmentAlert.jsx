import React from 'react';
import { useIntl } from '@edx/frontend-platform/i18n';
import PropTypes from 'prop-types';
import { Alert } from '@openedx/paragon';
import { Info, WarningFilled } from '@openedx/paragon/icons';

import messages from './messages';

const EnrollmentAlert = ({ payload }) => {
  const intl = useIntl();
  const {
    extraText,
    isStaff,
  } = payload;

  let text = intl.formatMessage(messages.alert);
  let type = 'warning';
  let icon = WarningFilled;
  if (isStaff) {
    text = intl.formatMessage(messages.staffAlert);
    type = 'info';
    icon = Info;
  } else if (extraText) {
    text = `${text} ${extraText}`;
  }

  return (
    <Alert variant={type} icon={icon}>
      <div className="d-flex">
        {text}
      </div>
    </Alert>
  );
};

EnrollmentAlert.propTypes = {
  payload: PropTypes.shape({
    extraText: PropTypes.string,
    isStaff: PropTypes.bool,
  }).isRequired,
};

export default EnrollmentAlert;
