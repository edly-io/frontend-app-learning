import React, { useCallback } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { connect, useSelector } from 'react-redux';
import classNames from 'classnames';
import { Button } from '@openedx/paragon';

import UnitIcon from './UnitIcon';
import CompleteIcon from './CompleteIcon';

import BookmarkFilledIcon from '../../bookmark/icons/bookmarked-filled-icon.svg';

import YoutubeIcon from './youtube-icon.svg';

const UnitButton = ({
  onClick,
  title,
  contentType,
  isActive,
  bookmarked,
  complete,
  showCompletion,
  unitId,
  className,
  showTitle,
}) => {
  const { courseId, sequenceId } = useSelector(state => state.courseware);

  const handleClick = useCallback(() => {
    onClick(unitId);
  }, [onClick, unitId]);

  return (
    <Button
      className={classNames({
        active: isActive,
        complete: showCompletion && complete,
      }, className)}
      variant="link"
      onClick={handleClick}
      title={title}
      as={Link}
      to={`/course/${courseId}/${sequenceId}/${unitId}`}
    >
      <UnitIcon type={contentType} />
      {contentType === 'video' && <img src={YoutubeIcon} alt="YoutubeIcon" aria-hidden="true" />}
      {showTitle && <span className="unit-title">{title}</span>}
      {showCompletion && complete ? <CompleteIcon size="sm" className="text-success ml-2" /> : null}
      {bookmarked ? (
        <img
          src={BookmarkFilledIcon}
          alt="BookmarkFilledIcon"
          aria-hidden="true"
          className="text-primary small position-absolute"
          style={{ top: '-3px', right: '5px' }}
        />
      ) : null}
    </Button>
  );
};

UnitButton.propTypes = {
  bookmarked: PropTypes.bool,
  className: PropTypes.string,
  complete: PropTypes.bool,
  contentType: PropTypes.string.isRequired,
  isActive: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  showCompletion: PropTypes.bool,
  showTitle: PropTypes.bool,
  title: PropTypes.string.isRequired,
  unitId: PropTypes.string.isRequired,
};

UnitButton.defaultProps = {
  className: undefined,
  isActive: false,
  bookmarked: false,
  complete: false,
  showTitle: false,
  showCompletion: true,
};

const mapStateToProps = (state, props) => {
  if (props.unitId) {
    return {
      ...state.models.units[props.unitId],
    };
  }
  return {};
};

export default connect(mapStateToProps)(UnitButton);
