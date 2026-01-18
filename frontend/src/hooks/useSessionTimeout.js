import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Hook to manage session timeout with warning
 * @param {number} timeout - Session timeout in minutes (default: 30)
 * @param {number} warningTime - Show warning before timeout in minutes (default: 5)
 */
export const useSessionTimeout = (timeout = 30, warningTime = 5) => {
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const navigate = useNavigate();

  const showWarningRef = useRef(false);

  const timeoutMs = timeout * 60 * 1000;
  const warningMs = warningTime * 60 * 1000;

  const resetTimer = useCallback(() => {
    setShowWarning(false);
    showWarningRef.current = false;
    setTimeLeft(null);
    sessionStorage.setItem('lastActivity', Date.now().toString());
  }, []);

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('lastActivity');

    // Clear grace login backup as well
    localStorage.removeItem('auth_grace');

    navigate('/login', { replace: true });
  }, [navigate]);

  const extendSession = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) return;

    // Track user activity
    const activities = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const resetOnActivity = () => resetTimer();

    activities.forEach(activity => {
      document.addEventListener(activity, resetOnActivity);
    });

    // Initialize last activity
    if (!sessionStorage.getItem('lastActivity')) {
      sessionStorage.setItem('lastActivity', Date.now().toString());
    }

    // Check session timeout
    const checkTimeout = setInterval(() => {
      const lastActivity = Number(sessionStorage.getItem('lastActivity') || 0);
      if(!lastActivity) return;

      const now = Date.now();
      const elapsed = now - lastActivity;

      // Show warning and Logout on timeout
      if (elapsed >= timeoutMs) {
        handleLogout();
        return;
      }

      if (elapsed >= timeoutMs - warningMs) {
        if (!showWarningRef.current) {
          showWarningRef.current = true;
          setShowWarning(true);
        }
        setTimeLeft(Math.ceil((timeoutMs - elapsed) / 60000));
      }

    }, 5000);

    return () => {
      activities.forEach(activity => {
        document.removeEventListener(activity, resetOnActivity);
      });
      clearInterval(checkTimeout);
    };
  }, [timeoutMs, warningMs, resetTimer, handleLogout]);

  return {
    showWarning,
    timeLeft,
    extendSession,
    handleLogout,
  };
};
