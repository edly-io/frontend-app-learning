import classNames from 'classnames';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { useIntl } from '@edx/frontend-platform/i18n';

import { GetCourseExitNavigation } from '../../course-exit';

import { useSequenceNavigationMetadata } from './hooks';
import { useCourseOutlineSidebar } from '../../sidebar/sidebars/course-outline/hooks';
import messages from './messages';
import PreviousButton from './generic/PreviousButton';
import NextButton from './generic/NextButton';
import { NextUnitTopNavTriggerSlot } from '../../../../plugin-slots/NextUnitTopNavTriggerSlot';
import { useEffect, useState } from 'react';
import { checkBlockCompletion } from '../../../data/thunks';
import UnitNavigationTimer from './UnitNavigationTimer';
import { getConfig } from '@edx/frontend-platform';

const UnitNavigation = ({
  sequenceId,
  unitId,
  onClickPrevious,
  onClickNext,
  isAtTop,
  courseId,
}) => {
  const {
    units,
  } = useCourseOutlineSidebar();
  // Compute total effort (seconds) from the course outline `sequences` data.
  // sequences is expected to be an array of block objects that may include
  // an `effort_time` field (in seconds). Sum those values, ignoring nulls.
  // `sequences` may be either an array or an object mapping ids -> block data.
  // Normalize both shapes and sum effort_time for unfinished blocks only.
  // Compute effort for the current sequence starting from the current unit
  // If unit-level data is available in `units`, sum unfinished units from the
  // current unit onward. Fallback to the sequence's overall effort_time.
  const [unitCompleted, setUnitCompleted] = useState(units[unitId]?.complete);
  const effort_time = !unitCompleted && units[unitId]?.effort_time || 0;

  // Use the computed total effort for the timer. If there is no effort data,
  // show nothing (null) so the timer does not render.
  const [effortSeconds, setEffortSeconds] = useState(null);
  // Tick increments every 10s to force a refresh/re-evaluation of effort
  // (this causes the effect below to re-run and update `effortSeconds`).
  const [tick, setTick] = useState(0);
  const dispatch = useDispatch();

  // When the course outline loads the `units` map may be initially empty.
  // Ensure we set the visual timer as soon as the unit metadata becomes
  // available (so the timer appears immediately once `effort_time` is known).
  useEffect(() => {
    const unitMeta = units && units[unitId];
    if (unitMeta && !unitMeta.complete && unitMeta.effort_time > 0) {
      setEffortSeconds(unitMeta.effort_time);
    }
  }, [units, unitId]);

  useEffect(() => {
    dispatch(checkBlockCompletion(courseId, sequenceId, unitId)).then((isComplete) => {
      setUnitCompleted(isComplete);
    }).catch(() => {
      // ignore errors for initial check
    });
    if (effort_time > 0) {
      setEffortSeconds(effort_time);
    } else {
      setEffortSeconds(null);
    }
  }, [effort_time, tick, unitCompleted]);

  useEffect(() => {
    let interval = effort_time ? effort_time * 1000 : 10000;
    const id = setInterval(() => setTick((t) => t + 1), interval);
    return () => clearInterval(id);
  }, [effort_time]);
  
  const intl = useIntl();
  const {
    isFirstUnit, isLastUnit, nextLink, previousLink,
  } = useSequenceNavigationMetadata(sequenceId, unitId);
  
  // Timer active state — true while countdown is running
  const [timerActive, setTimerActive] = useState(false);

  const handleTimerStart = () => setTimerActive(true);
  const handleTimerExpire = () => {
    setTimerActive(false);
    setEffortSeconds(null);
  };

  const renderPreviousButton = () => {
    const buttonStyle = `previous-button ${isAtTop ? 'text-dark mr-3' : 'justify-content-center'}`;
    return (
      <PreviousButton
        isFirstUnit={isFirstUnit}
        variant="outline-secondary"
        buttonLabel={intl.formatMessage(messages.previousButton)}
        buttonStyle={buttonStyle}
        onClick={onClickPrevious}
        previousLink={previousLink}
        isAtTop={isAtTop}
      />
    );
  };

  const renderNextButton = () => {
    const { exitActive, exitText } = GetCourseExitNavigation(courseId, intl);
    const buttonText = (isLastUnit && exitText) ? exitText : intl.formatMessage(messages.nextButton);
    // Disable next if platform conditions require it OR while timer is active
    const disabled = (effortSeconds === null && !unitCompleted) || (isLastUnit && !exitActive) || (timerActive && !unitCompleted);
    // debugger;
    const variant = 'outline-primary';
    const buttonStyle = `next-button ${isAtTop ? 'text-dark' : 'justify-content-center'}`;

    if (isAtTop) {
      return (
        <NextUnitTopNavTriggerSlot
          {...{
            variant,
            buttonStyle,
            buttonText,
            disabled,
            sequenceId,
            nextLink,
            onClickHandler: onClickNext,
            isAtTop,
          }}
        />
      );
    }

    return (
      <NextButton
        variant={variant}
        buttonStyle={buttonStyle}
        onClickHandler={onClickNext}
        disabled={disabled}
        buttonText={buttonText}
        nextLink={nextLink}
        hasEffortEstimate
      />
    );
  };

  return (
    <div className={classNames('d-flex', {
      'unit-navigation': !isAtTop,
      'top-unit-navigation': isAtTop,
    })}
    >
      {renderPreviousButton()}
      {/* Timer for this unit (fetched from /api/courseware/effort/{unitId}) */}
      {effortSeconds !== null ? (
        <div className="d-flex align-items-center mx-2">
          <UnitNavigationTimer
            seconds={effortSeconds}
            className="mr-3"
            onStart={handleTimerStart}
            onExpire={handleTimerExpire}
          />
        </div>
      ) : null}
      {renderNextButton()}
    </div>
  );
};

UnitNavigation.propTypes = {
  courseId: PropTypes.string.isRequired,
  sequenceId: PropTypes.string.isRequired,
  unitId: PropTypes.string,
  onClickPrevious: PropTypes.func.isRequired,
  onClickNext: PropTypes.func.isRequired,
  isAtTop: PropTypes.bool,
};

UnitNavigation.defaultProps = {
  unitId: null,
  isAtTop: false,
};

export default UnitNavigation;
