import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { StatefulButton } from '@openedx/paragon';
import { FormattedMessage } from '@edx/frontend-platform/i18n';
import { useDispatch } from 'react-redux';
import { removeBookmark, addBookmark } from './data/thunks';

import FilledBookmarkIcon from './icons/bookmarked-filled-icon.svg';
import OutlineBookmarkIcon from './icons/bookmarked-outline-icon.svg';

const addBookmarkLabel = (
  <FormattedMessage
    id="unit.bookmark.button.add.bookmark"
    defaultMessage="Bookmark this page"
    description="The button to bookmark a page"
  />
);

const hasBookmarkLabel = (
  <FormattedMessage
    id="unit.bookmark.button.remove.bookmark"
    defaultMessage="Bookmarked"
    description="The button to show a page is bookmarked and the button to remove that bookmark"
  />
);

const BookmarkButton = ({
  isBookmarked, isProcessing, unitId,
}) => {
  const bookmarkState = isBookmarked ? 'bookmarked' : 'default';
  const state = isProcessing ? `${bookmarkState}Processing` : bookmarkState;

  const dispatch = useDispatch();
  const toggleBookmark = useCallback(() => {
    if (isBookmarked) {
      dispatch(removeBookmark(unitId));
    } else {
      dispatch(addBookmark(unitId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBookmarked, unitId]);

  return (
    <StatefulButton
      variant="link"
      className="px-1 ml-n1 btn-sm "
      onClick={toggleBookmark}
      state={state}
      disabledStates={['defaultProcessing', 'bookmarkedProcessing']}
      labels={{
        default: addBookmarkLabel,
        defaultProcessing: addBookmarkLabel,
        bookmarked: hasBookmarkLabel,
        bookmarkedProcessing: hasBookmarkLabel,
      }}
      icons={{
        default: <img src={OutlineBookmarkIcon} alt="OutlineBookmarkIcon" aria-hidden="true" />,
        defaultProcessing: <img src={OutlineBookmarkIcon} alt="OutlineBookmarkIcon" aria-hidden="true" />,
        bookmarked: <img src={FilledBookmarkIcon} alt="FilledBookmarkIcon" aria-hidden="true" />,
        bookmarkedProcessing: <img src={FilledBookmarkIcon} alt="FilledBookmarkIcon" aria-hidden="true" />,
      }}
    />
  );
};

BookmarkButton.propTypes = {
  unitId: PropTypes.string.isRequired,
  isBookmarked: PropTypes.bool,
  isProcessing: PropTypes.bool.isRequired,
};

BookmarkButton.defaultProps = {
  isBookmarked: false,
};

export default BookmarkButton;
