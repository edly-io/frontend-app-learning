import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';

// Simple countdown timer that starts from `seconds` and ticks down every second.
// Displays MM:SS. If seconds is null/undefined/0, renders nothing.
const UnitNavigationTimer = ({ seconds, className, onExpire, onStart }) => {
  const [remaining, setRemaining] = useState(() => (typeof seconds === 'number' ? seconds : null));
  const intervalRef = useRef(null);

  useEffect(() => {
    // reset when seconds prop changes
    if (typeof seconds !== 'number') {
      setRemaining(null);
      return undefined;
    }

    setRemaining(seconds);

    // Don't start if non-positive
    if (seconds <= 0) {
      // If there is an onExpire callback and seconds is 0, notify immediately
      if (typeof onExpire === 'function') onExpire();
      return undefined;
    }

    // notify parent that timer has started
    if (typeof onStart === 'function') onStart();

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          // notify parent that timer expired
          if (typeof onExpire === 'function') onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [seconds]);

  // Hide timer when remaining is null or 0 (we remove it on expiry)
  if (remaining === null || remaining === 0) return null;

  const minutes = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const padded = `${minutes}:${secs.toString().padStart(2, '0')}`;

  return (
    <div className={className} aria-live="polite">
      <small className="text-muted">{padded}</small>
    </div>
  );
};

UnitNavigationTimer.propTypes = {
  seconds: PropTypes.number,
  className: PropTypes.string,
  onExpire: PropTypes.func,
  onStart: PropTypes.func,
};

UnitNavigationTimer.defaultProps = {
  seconds: null,
  className: null,
  onExpire: null,
  onStart: null,
};

export default UnitNavigationTimer;
