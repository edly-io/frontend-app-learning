import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { injectIntl, intlShape } from '@edx/frontend-platform/i18n';
import { Collapsible, IconButton, Icon } from '@openedx/paragon';

import { Add, DisabledVisible, Minus } from '@openedx/paragon/icons';
import SequenceLink from './SequenceLink';
import { useModel } from '../../generic/model-store';

import genericMessages from '../../generic/messages';
import messages from './messages';
import { ReactComponent as CheckCircleIcon } from './check-circle.svg';

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
        <CheckCircleIcon style={{ color: complete ? 'green' : 'gray' }} />
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
