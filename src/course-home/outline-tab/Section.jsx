import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { injectIntl, intlShape } from '@edx/frontend-platform/i18n';
import { Collapsible, IconButton, Icon } from '@openedx/paragon';
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';

import { Add, DisabledVisible, Minus } from '@openedx/paragon/icons';
import SequenceLink from './SequenceLink';
import { useModel } from '../../generic/model-store';

import genericMessages from '../../generic/messages';
import messages from './messages';

const Section = ({
  courseId,
  defaultOpen,
  expand,
  intl,
  section,
}) => {
  const {
    complete,
    sequenceIds,
    title,
    hideFromTOC,
  } = section;
  const {
    courseBlocks: {
      sequences,
    },
  } = useModel('outline', courseId);

  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    setOpen(expand);
  }, [expand]);

  useEffect(() => {
    setOpen(defaultOpen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sectionTitle = (
    <div className="d-flex row w-100 m-0 course-section-wrapper">
      <div className="col-auto p-0">
        {complete ? (
          <svg
            width="33"
            title={intl.formatMessage(messages.completedSection)}
            aria-hidden="true"
            className="float-left text-success  "
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
            title={intl.formatMessage(messages.incompleteSection)}
            aria-hidden="true"
            className="float-left inComplete "
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
      <div className="col-7 p-0 font-weight-bold text-dark-500 section-heading">
        <span className="align-middle col-6 p-0">{title}</span>
        <span className="sr-only">
          , {intl.formatMessage(complete ? messages.completedSection : messages.incompleteSection)}
        </span>
      </div>
      {hideFromTOC && (
        <div className="row">
          {hideFromTOC && (
            <span className="small d-flex align-content-end">
              <Icon className="mr-2" src={DisabledVisible} data-testid="hide-from-toc-section-icon" />
              <span data-testid="hide-from-toc-section-text">
                {intl.formatMessage(messages.hiddenSection)}
              </span>
            </span>
          )}
        </div>
      )}
    </div>
  );

  return (
    <li>
      <Collapsible
        className="mb-2"
        styling="card-lg"
        title={sectionTitle}
        open={open}
        onToggle={() => { setOpen(!open); }}
        iconWhenClosed={(
          <IconButton
            alt={intl.formatMessage(messages.openSection)}
            iconAs={Add}
            onClick={() => { setOpen(true); }}
            size="sm"
          />
        )}
        iconWhenOpen={(
          <IconButton
            alt={intl.formatMessage(genericMessages.close)}
            iconAs={Minus}
            onClick={() => { setOpen(false); }}
            size="sm"
          />
        )}
      >
        <ol className="list-unstyled">
          {sequenceIds.map((sequenceId, index) => (
            <SequenceLink
              key={sequenceId}
              id={sequenceId}
              courseId={courseId}
              sequence={sequences[sequenceId]}
              first={index === 0}
            />
          ))}
        </ol>
      </Collapsible>
    </li>
  );
};

Section.propTypes = {
  courseId: PropTypes.string.isRequired,
  defaultOpen: PropTypes.bool.isRequired,
  expand: PropTypes.bool.isRequired,
  intl: intlShape.isRequired,
  section: PropTypes.shape().isRequired,
};

export default injectIntl(Section);
