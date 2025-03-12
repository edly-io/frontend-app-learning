import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Link } from 'react-router-dom';
import {
  FormattedMessage,
  FormattedTime,
  injectIntl,
  intlShape,
} from '@edx/frontend-platform/i18n';

import { Icon } from '@openedx/paragon';
import { Block } from '@openedx/paragon/icons';
import EffortEstimate from '../../shared/effort-estimate';
import { useModel } from '../../generic/model-store';
import messages from './messages';

const SequenceLink = ({
  id,
  intl,
  courseId,
  first,
  sequence,
}) => {
  const {
    complete,
    description,
    due,
    showLink,
    title,
    hideFromTOC,
  } = sequence;
  const {
    userTimezone,
  } = useModel('outline', courseId);

  const timezoneFormatArgs = userTimezone ? { timeZone: userTimezone } : {};

  const coursewareUrl = <Link to={`/course/${courseId}/${id}`}>{title}</Link>;
  const displayTitle = showLink ? coursewareUrl : title;

  const dueDateMessage = (
    <FormattedMessage
      id="learning.outline.sequence-due-date-set"
      defaultMessage="{description} due {assignmentDue}"
      description="Used below an assignment title"
      values={{
        assignmentDue: (
          <FormattedTime
            key={`${id}-due`}
            day="numeric"
            month="short"
            year="numeric"
            timeZoneName="short"
            value={due}
            {...timezoneFormatArgs}
          />
        ),
        description: description || '',
      }}
    />
  );

  const noDueDateMessage = (
    <FormattedMessage
      id="learning.outline.sequence-due-date-not-set"
      defaultMessage="{description}"
      description="Used below an assignment title"
      values={{
        assignmentDue: (
          <FormattedTime
            key={`${id}-due`}
            day="numeric"
            month="short"
            year="numeric"
            timeZoneName="short"
            value={due}
            {...timezoneFormatArgs}
          />
        ),
        description: description || '',
      }}
    />
  );

  return (
    <li className="sub-section-list-item">
      <div className={classNames('', { '': !first })}>
        <div className="row w-100 m-0 sub-section-wrapper">
          <div className="col-auto p-0">
            {complete ? (
              <svg
                width="33"
                aria-hidden={complete}
                title={intl.formatMessage(messages.completedAssignment)}
                className="float-left text-success"
                height="33"
                viewBox="0 0 33 33"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M28.5 16.33C28.5 9.70206 23.1279 4.32996 16.5 4.32996C9.87211 4.32996 4.5 9.70206 4.5 16.33C4.5 22.9565 9.87211 28.33 16.5 28.33C23.1279 28.33 28.5 22.9565 28.5 16.33Z"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M11.8804 16.3304L14.9602 19.4088L21.1171 13.2518"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            ) : (
              <svg
                width="33"
                aria-hidden={complete}
                title={intl.formatMessage(messages.incompleteAssignment)}
                className="float-left inComplete"
                height="33"
                viewBox="0 0 33 33"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M28.5 16.33C28.5 9.70206 23.1279 4.32996 16.5 4.32996C9.87211 4.32996 4.5 9.70206 4.5 16.33C4.5 22.9565 9.87211 28.33 16.5 28.33C23.1279 28.33 28.5 22.9565 28.5 16.33Z"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M11.8804 16.3304L14.9602 19.4088L21.1171 13.2518"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            )}
          </div>
          <div className="col-10 p-0 text-break inner-section-text">
            <span className="align-middle">{displayTitle}</span>
            <span className="sr-only">
              , {intl.formatMessage(complete ? messages.completedAssignment : messages.incompleteAssignment)}
            </span>
            <EffortEstimate className=" align-middle" block={sequence} />
          </div>
        </div>
        {hideFromTOC && (
          <div className="row w-100 my-2 mx-4 pl-3">
            <span className="small d-flex">
              <Icon className="mr-2" src={Block} data-testid="hide-from-toc-sequence-link-icon" />
              <span data-testid="hide-from-toc-sequence-link-text">
                {intl.formatMessage(messages.hiddenSequenceLink)}
              </span>
            </span>
          </div>
        )}
        <div className="row w-100 m-0 ml-3 pl-3">
          <small className="text-body pl-2">
            {due ? dueDateMessage : noDueDateMessage}
          </small>
        </div>
      </div>
    </li>
  );
};

SequenceLink.propTypes = {
  id: PropTypes.string.isRequired,
  intl: intlShape.isRequired,
  courseId: PropTypes.string.isRequired,
  first: PropTypes.bool.isRequired,
  sequence: PropTypes.shape().isRequired,
};

export default injectIntl(SequenceLink);
