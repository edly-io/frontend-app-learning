import React, { useEffect, useState } from 'react';
import { useIntl } from '@edx/frontend-platform/i18n';
import { Collapsible, IconButton } from '@openedx/paragon';
import { Minus, Plus } from '@openedx/paragon/icons';

import { useModel } from '../../../generic/model-store';
import genericMessages from '../../../generic/messages';
import { useContextId } from '../../../data/hooks';
import messages from '../messages';
import SectionTitle from './SectionTitle';
import SequenceLink from './SequenceLink';

interface Props {
  defaultOpen: boolean;
  expand: boolean;
  section: {
    complete: boolean;
    sequenceIds: string[];
    title: string;
    hideFromTOC: boolean;
  };
  sectionId?: string;
  sectionIds?: string[];
  sectionsMap?: { [key: string]: any };
}

const Section: React.FC<Props> = ({
  defaultOpen,
  expand,
  section,
  sectionId,
  sectionIds = [],
  sectionsMap = {},
}) => {
  const intl = useIntl();
  const courseId = useContextId();
  const {
    complete,
    sequenceIds,
    title,
    hideFromTOC,
  } = section;
  const {
    courseBlocks: {
      sequences,
      sections,
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

  return (
    <li>
      <Collapsible
        className="mb-2"
        styling="card-lg"
        title={<SectionTitle {...{ complete, hideFromTOC, title }} />}
        open={open}
        onToggle={() => { setOpen(!open); }}
        iconWhenClosed={(
          <IconButton
            alt={intl.formatMessage(messages.openSection)}
            iconAs={Plus}
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
          {sequenceIds.map((sequenceId, index) => {
            // determine whether the previous sequence (within the section)
            // or the last sequence of the previous section is complete
            let predecessorComplete = false;

            if (index > 0) {
              const prevId = sequenceIds[index - 1];
              predecessorComplete = !!sequences?.[prevId]?.complete;
            } else if (sectionId) {
              const secIndex = sectionIds.indexOf(sectionId);
              if (secIndex > 0) {
                const prevSectionId = sectionIds[secIndex - 1];
                const prevSection = sectionsMap?.[prevSectionId] || sections?.[prevSectionId];
                const prevSeqIds = prevSection?.sequenceIds || [];
                const lastPrevSeq = prevSeqIds[prevSeqIds.length - 1];
                predecessorComplete = !!sequences?.[lastPrevSeq]?.complete;
              }
            }

            const thisComplete = !!sequences?.[sequenceId]?.complete;
            const clickable = thisComplete || predecessorComplete;

            return (
              <SequenceLink
                key={sequenceId}
                id={sequenceId}
                sequence={sequences[sequenceId]}
                first={index === 0}
                clickable={clickable}
              />
            );
          })}
        </ol>
      </Collapsible>
    </li>
  );
};

export default Section;
