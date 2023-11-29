import React from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';

import { injectIntl, intlShape } from '@edx/frontend-platform/i18n';
import { breakpoints, useWindowSize } from '@edx/paragon';
import { useModel } from '../../../../generic/model-store';

import GradeRangeTooltip from './GradeRangeTooltip';
import { CheckSquareIcon, InfoIcon } from '../../../../Icons';
import messages from '../messages';

const CourseGradeFooter = ({ intl, passingGrade }) => {
  const {
    courseId,
  } = useSelector(state => state.courseHome);

  const {
    courseGrade: {
      isPassing,
      letterGrade,
    },
    gradingPolicy: {
      gradeRange,
    },
  } = useModel('progress', courseId);

  const wideScreen = useWindowSize().width >= breakpoints.medium.minWidth;

  const hasLetterGrades = Object.keys(gradeRange).length > 1; // A pass/fail course will only have one key
  let footerText = intl.formatMessage(messages.courseGradeFooterNonPassing, { passingGrade });

  if (isPassing) {
    if (hasLetterGrades) {
      const minGradeRangeCutoff = gradeRange[letterGrade] * 100;
      const possibleMaxGradeRangeValues = [...Object.values(gradeRange).filter(
        (grade) => (grade * 100 > minGradeRangeCutoff),
      )];
      const maxGradeRangeCutoff = possibleMaxGradeRangeValues.length ? Math.min(...possibleMaxGradeRangeValues) * 100
        : 100;

      footerText = intl.formatMessage(messages.courseGradeFooterPassingWithGrade, {
        letterGrade,
        minGrade: minGradeRangeCutoff.toFixed(0),
        maxGrade: maxGradeRangeCutoff.toFixed(0),
      });
    } else {
      footerText = intl.formatMessage(messages.courseGradeFooterGenericPassing);
    }
  }

  const icon = isPassing ? <CheckSquareIcon className="text-success-500 d-inline-flex" />
    : <InfoIcon className="text-secondary d-inline-flex" />;

  return (
    <div className={`row w-100 m-0 py-3 px-md-5 rounded-bottom course-grade-footer ${isPassing ? 'bg-suces-100' : 'bg-warnings-100'}`}>
      <div className="col-auto p-0">
        {icon}
      </div>
      <div className="col-11 pl-2 px-0">
        {!wideScreen && (
          <span className="h5 font-weight-normal">
            {footerText}
            {hasLetterGrades && (
              <span style={{ whiteSpace: 'nowrap' }}>
                &nbsp;
                <GradeRangeTooltip iconButtonClassName="h4" passingGrade={passingGrade} />
              </span>
            )}
          </span>
        )}
        {wideScreen && (
          <span className="h4 font-weight-normal m-0">
            {footerText}
            {hasLetterGrades && (
              <span style={{ whiteSpace: 'nowrap' }}>
                &nbsp;
                <GradeRangeTooltip iconButtonClassName="h3" passingGrade={passingGrade} />
              </span>
            )}
          </span>
        )}
      </div>
    </div>
  );
};

CourseGradeFooter.propTypes = {
  intl: intlShape.isRequired,
  passingGrade: PropTypes.number.isRequired,
};

export default injectIntl(CourseGradeFooter);
