import { useSessionTimeout } from "../../hooks/useSessionTimeout";
import { useAuth } from "../../contexts/AuthContext";
import SessionTimeoutWarning from "./SessionTimeoutWarning";

function SessionManager() {
  const { isAuthenticated, loading } = useAuth();

  const { showWarning, timeLeft, extendSession, handleLogout } =
    useSessionTimeout(30, 5);

if (!isAuthenticated || loading) return null;

  return (
    <SessionTimeoutWarning
      open={showWarning}
      timeLeft={timeLeft}
      onExtend={extendSession}
      onLogout={handleLogout}
    />
  );
}

export default SessionManager;
