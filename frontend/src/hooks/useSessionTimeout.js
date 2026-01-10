import { useState, useEffect, useCallback } from 'react';
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

  const timeoutMs = timeout * 60 * 1000;
  const warningMs = warningTime * 60 * 1000;

  const resetTimer = useCallback(() => {
    setShowWarning(false);
    setTimeLeft(null);
    localStorage.setItem('lastActivity', Date.now().toString());
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('lastActivity');
    navigate('/login');
  }, [navigate]);

  const extendSession = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Track user activity
    const activities = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const resetOnActivity = () => resetTimer();

    activities.forEach(activity => {
      document.addEventListener(activity, resetOnActivity);
    });

    // Initialize last activity
    if (!localStorage.getItem('lastActivity')) {
      localStorage.setItem('lastActivity', Date.now().toString());
    }

    // Check session timeout
    const checkTimeout = setInterval(() => {
      const lastActivity = parseInt(localStorage.getItem('lastActivity') || '0');
      const now = Date.now();
      const elapsed = now - lastActivity;

      // Show warning
      if (elapsed >= (timeoutMs - warningMs) && elapsed < timeoutMs) {
        setShowWarning(true);
        const remaining = Math.ceil((timeoutMs - elapsed) / 1000 / 60);
        setTimeLeft(remaining);
      }

      // Logout on timeout
      if (elapsed >= timeoutMs) {
        handleLogout();
      }
    }, 1000);

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
