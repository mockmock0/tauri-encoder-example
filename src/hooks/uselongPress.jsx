import { useState, useCallback } from "react";

export const useLongPress = (callback = () => {}, ms = 500) => {
  const [startTime, setStartTime] = useState(null);
  const [timeoutId, setTimeoutId] = useState(null);

  const start = useCallback(
    (e) => {
      e.preventDefault();
      setStartTime(Date.now());
      const id = setTimeout(() => {
        callback(e);
      }, ms);
      setTimeoutId(id);
    },
    [callback, ms]
  );

  const stop = useCallback(
    (e) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      setStartTime(null);
      setTimeoutId(null);
    },
    [timeoutId]
  );

  return {
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    onTouchStart: start,
    onTouchEnd: stop,
  };
};
