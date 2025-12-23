import React from 'react';
import { Link, useLocation } from 'react-router-dom';

import { useCourseOutlineSidebar } from '../hooks';

interface Props {
  courseId: string;
  sequenceId: string;
  activeUnitId: string;
  id: string;
  children?: React.ReactNode;
}

/*
 * UnitLinkWrapper is necessary for unit navigation within the OutlineTrayPlugin.
 * import { Link } from 'react-router-dom' throws errors inside the plugin
 * because the package tries to load two versions of 'react-router-dom' or a
 * route can not be found. This component abstracts the import into a wrapper
 * component that can be imported into plugins without a render error.
 */

const UnitLinkWrapper: React.FC<Props> = ({
  sequenceId,
  activeUnitId,
  id,
  courseId,
  children,
}) => {
  const { handleUnitClick, sections, sequences, units } = useCourseOutlineSidebar();
  const { pathname } = useLocation();
  const isPreview = pathname.startsWith('/preview');
  const baseUrl = `/course/${courseId}/${sequenceId}/${id}`;
  const link = isPreview ? `/preview${baseUrl}` : baseUrl;

  // Determine the actual predecessor within the sequence's unitIds array.
  const unitIds = sequences?.[sequenceId]?.unitIds || [];
  const index = unitIds.indexOf(id);
  let prevId: string | null = null;
  if (index > 0) {
    prevId = unitIds[index - 1];
  } else {
    // If this is the first unit in the sequence, find the previous sequence
    // in the same section and use its last unit as the predecessor.
    const section = Object.values(sections || {}).find((s: any) => (s.sequenceIds || []).includes(sequenceId));
    if (section) {
      const seqIndex = (((section as any).sequenceIds) || []).indexOf(sequenceId);
      if (seqIndex > 0) {
        const prevSeqId = (section as any).sequenceIds[seqIndex - 1];
        const prevSeqUnitIds = sequences?.[prevSeqId]?.unitIds || [];
        if (prevSeqUnitIds.length > 0) {
          prevId = prevSeqUnitIds[prevSeqUnitIds.length - 1];
        }
      }
    }
  }
  const prevCompleted = prevId ? Boolean(units?.[prevId]?.complete) : false;
  const isDisabled = !(units?.[id]?.complete || prevCompleted) || false;

  return (
    <Link
      to={link}
      className="row w-100 m-0 d-flex align-items-center text-gray-700"
      onClick={(e) => {
        if (isDisabled) {
          e.preventDefault();
          return;
        }
        handleUnitClick({ sequenceId, activeUnitId, id });
      }}
      aria-disabled={isDisabled}
      tabIndex={isDisabled ? -1 : undefined}
    >
      {children}
    </Link>
  );
};

export default UnitLinkWrapper;
