import React from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';

import { sendTrackEvent } from '@edx/frontend-platform/analytics';
import { getAuthenticatedUser } from '@edx/frontend-platform/auth';
import { injectIntl, intlShape } from '@edx/frontend-platform/i18n';
import { Button } from '@openedx/paragon';

import { useModel } from '../../generic/model-store';
import { launchCourseHomeTour } from '../data/slice';
import messages from '../messages';

const LaunchCourseHomeTourButton = ({ intl, srOnly }) => {
  const {
    courseId,
  } = useSelector(state => state.courseHome);

  const {
    org,
  } = useModel('courseHomeMeta', courseId);

  const {
    toursEnabled,
  } = useSelector(state => state.tours);

  const dispatch = useDispatch();

  const handleClick = () => {
    const { administrator } = getAuthenticatedUser();
    sendTrackEvent('edx.ui.lms.launch_tour.clicked', {
      org_key: org,
      courserun_key: courseId,
      is_staff: administrator,
      tour_variant: 'course_home',
    });

    dispatch(launchCourseHomeTour());
  };

  return (
    // eslint-disable-next-line react/jsx-no-useless-fragment
    <>
      {toursEnabled && (
        <Button variant="link" size="inline" className={`p-0 ${srOnly && 'sr-only sr-only-focusable'}`} onClick={handleClick}>
          {!srOnly && (
            <svg width="18" height="19" viewBox="0 0 18 19" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M6.20264 11.7141L7.39714 7.89714L11.2141 6.70264L10.0196 10.5196L6.20264 11.7141Z" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M8.70824 16.4165C12.6892 16.4165 15.9165 13.1892 15.9165 9.20824C15.9165 5.22724 12.6892 2 8.70824 2C4.72724 2 1.5 5.22724 1.5 9.20824C1.5 13.1892 4.72724 16.4165 8.70824 16.4165Z" stroke-linecap="round" stroke-linejoin="round" />
            </svg>

          )}
          {intl.formatMessage(messages.launchTour)}
        </Button>
      )}
    </>
  );
};

LaunchCourseHomeTourButton.defaultProps = {
  srOnly: false,
};

LaunchCourseHomeTourButton.propTypes = {
  intl: intlShape.isRequired,
  srOnly: PropTypes.bool,
};

export default injectIntl(LaunchCourseHomeTourButton);
