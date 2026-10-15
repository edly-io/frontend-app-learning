import React from 'react';
import PropTypes from 'prop-types';
import { getConfig } from '@edx/frontend-platform';
import { useIntl, FormattedMessage } from '@edx/frontend-platform/i18n';
import { getLoginRedirectUrl } from '@edx/frontend-platform/auth';
import { Alert, Hyperlink } from '@openedx/paragon';

import enrollmentMessages from '../../../../alerts/enrollment-alert/messages';
import genericMessages from '../../../../generic/messages';
import outlineMessages from '../../messages';
import { useModel } from '../../../../generic/model-store';

const PrivateCourseAlert = ({ payload }) => {
  const intl = useIntl();
  const {
    anonymousUser,
    courseId,
  } = payload;

  const { title } = useModel('courseHomeMeta', courseId);

  const register = (
    <Hyperlink
      style={{ textDecoration: 'underline' }}
      destination={`${getConfig().LMS_BASE_URL}/register?next=${encodeURIComponent(global.location.href)}`}
    >
      {intl.formatMessage(genericMessages.registerLowercase)}
    </Hyperlink>
  );

  const signIn = (
    <Hyperlink
      style={{ textDecoration: 'underline' }}
      destination={`${getLoginRedirectUrl(global.location.href)}`}
    >
      {intl.formatMessage(genericMessages.signInSentenceCase)}
    </Hyperlink>
  );

  return (
    <Alert variant="light" data-testid="private-course-alert">
      {anonymousUser && (
        <>
          <p className="font-weight-bold">
            {intl.formatMessage(enrollmentMessages.alert)}
          </p>
          <FormattedMessage
            id="learning.privateCourse.signInOrRegister"
            description="Prompts the user to sign in or register to see course content."
            defaultMessage="{signIn} or {register} and then enroll in this course."
            values={{
              signIn,
              register,
            }}
          />
        </>
      )}
      {!anonymousUser && (
        <>
          <p className="font-weight-bold">{intl.formatMessage(outlineMessages.welcomeTo)} {title}</p>
          {intl.formatMessage(enrollmentMessages.alert)}
        </>
      )}
    </Alert>
  );
};

PrivateCourseAlert.propTypes = {
  payload: PropTypes.shape({
    anonymousUser: PropTypes.bool,
    courseId: PropTypes.string,
  }).isRequired,
};

export default PrivateCourseAlert;
