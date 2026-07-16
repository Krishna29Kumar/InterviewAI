/**
 * NEW FILE
 * SAVE AT: InterviewAI/client/src/hooks/useFullscreenEnforcer.js
 * ================================================================
 * Enforces fullscreen mode during the Company DSA strict session.
 * If the user exits fullscreen (Esc key etc.) and doesn't return
 * within `graceMs`, the `onExitTooLong` callback fires (used to
 * terminate the session, same pattern as copy-paste violations).
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export function useFullscreenEnforcer({ isActive, onExitTooLong, graceMs = 5000 }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const exitTimerRef = useRef(null);
  const onExitTooLongRef = useRef(onExitTooLong);

  useEffect(() => {
    onExitTooLongRef.current = onExitTooLong;
  }, [onExitTooLong]);

  const enterFullscreen = useCallback(async () => {
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
      setIsFullscreen(true);
      setShowWarning(false);
    } catch (e) {
      console.warn('[Fullscreen] request fail:', e.message);
    }
  }, []);

  useEffect(() => {
    if (!isActive) return;

    const handleChange = () => {
      const fsNow = !!document.fullscreenElement;
      setIsFullscreen(fsNow);

      if (!fsNow) {
        setShowWarning(true);
        exitTimerRef.current = setTimeout(() => onExitTooLongRef.current?.(), graceMs);  // 👈 CHANGED
      } else {
        setShowWarning(false);
        clearTimeout(exitTimerRef.current);
      }
    };

    document.addEventListener('fullscreenchange', handleChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleChange);
      clearTimeout(exitTimerRef.current);
    };
  }, [isActive, graceMs]);   // 👈 onExitTooLong yahan se HATA DIYA

  return { isFullscreen, showWarning, enterFullscreen };
}