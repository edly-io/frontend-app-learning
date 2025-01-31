import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useModel } from '../../../../generic/model-store';

import GradeSummaryHeader from './GradeSummaryHeader';
import GradeSummaryTable from './GradeSummaryTable';

const GradeSummary = () => {
  const {
    courseId,
  } = useSelector(state => state.courseHome);

  const {
    gradingPolicy: {
      assignmentPolicies,
    },
  } = useModel('progress', courseId);

  const [allOfSomeAssignmentTypeIsLocked, setAllOfSomeAssignmentTypeIsLocked] = useState(false);

  if (assignmentPolicies.length === 0) {
    return null;
  }

  return (
    <>
      <GradeSummaryHeader allOfSomeAssignmentTypeIsLocked={allOfSomeAssignmentTypeIsLocked} />
    <div className="rounded raised-card w-100">
      <GradeSummaryTable setAllOfSomeAssignmentTypeIsLocked={setAllOfSomeAssignmentTypeIsLocked} />
    </div>
    </>

  );
};

export default GradeSummary;
