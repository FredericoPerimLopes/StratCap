import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSnackbar } from 'notistack';
import { 
  SessionManager, 
  TokenManager, 
  CSRFProtection, 
  RateLimiter,
  SECURITY_CONFIG 
} from '../../utils/security';

interface SecurityContextType {
  isSessionValid: boolean;
  csrfToken: string | null;
  lastActivity: number;
  sessionTimeRemaining: number;
  extendSession: () => void;
  logSecurityEvent: (event: SecurityEvent) => void;
  checkRateLimit: (endpoint: string) => boolean;
}

interface SecurityEvent {
  type: 'login_attempt' | 'session_expired' | 'suspicious_activity' | 'csp_violation' | 'rate_limit';
  details: Record<string, any>;
  timestamp?: Date;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

interface SecurityProviderProps {
  children: ReactNode;
}

export const SecurityProvider: React.FC<SecurityProviderProps> = ({ children }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [isSessionValid, setIsSessionValid] = useState(true);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(SECURITY_CONFIG.SESSION_TIMEOUT);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);

  useEffect(() => {
    // Initialize security components
    initializeSecurity();
    
    // Set up event listeners
    setupSecurityEventListeners();
    
    // Start session monitoring
    const sessionInterval = startSessionMonitoring();
    
    return () => {
      clearInterval(sessionInterval);
      removeSecurityEventListeners();
    };
  }, []);

  const initializeSecurity = () => {
    // Initialize session management
    SessionManager.initializeSession();
    
    // Generate CSRF token
    const token = CSRFProtection.generateToken();
    setCsrfToken(token);
    
    // Check initial session validity
    setIsSessionValid(SessionManager.isSessionValid());
  };

  const setupSecurityEventListeners = () => {
    // Session expiry warning
    window.addEventListener('session-warning', handleSessionWarning);
    
    // Session expired
    window.addEventListener('session-expired', handleSessionExpired);
    
    // CSP violations
    document.addEventListener('securitypolicyviolation', handleCSPViolation);
    
    // Visibility change (detect tab switching)
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Activity tracking
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach(event => {
      document.addEventListener(event, handleUserActivity, true);
    });
  };

  const removeSecurityEventListeners = () => {
    window.removeEventListener('session-warning', handleSessionWarning);
    window.removeEventListener('session-expired', handleSessionExpired);
    document.removeEventListener('securitypolicyviolation', handleCSPViolation);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach(event => {
      document.removeEventListener(event, handleUserActivity, true);
    });
  };

  const startSessionMonitoring = () => {
    return setInterval(() => {
      const valid = SessionManager.isSessionValid();
      setIsSessionValid(valid);
      
      if (valid) {
        const remaining = SECURITY_CONFIG.SESSION_TIMEOUT - (Date.now() - lastActivity);
        setSessionTimeRemaining(Math.max(0, remaining));
      } else {
        setSessionTimeRemaining(0);
      }
      
      // Auto-refresh tokens if needed
      if (TokenManager.shouldRefreshToken()) {
        refreshTokens();
      }
    }, 1000); // Update every second
  };

  const handleSessionWarning = () => {
    enqueueSnackbar(
      'Your session will expire in 5 minutes. Click here to extend.',
      {
        variant: 'warning',
        persist: true,
        action: (key) => (
          <button
            onClick={() => {
              extendSession();
              // @ts-ignore - closeSnackbar is available in notistack
              closeSnackbar(key);
            }}
            style={{ color: 'white', background: 'none', border: '1px solid white', padding: '4px 8px' }}
          >
            Extend Session
          </button>
        )
      }
    );
    
    logSecurityEvent({
      type: 'session_expired',
      details: { warning: true }
    });
  };

  const handleSessionExpired = () => {
    enqueueSnackbar('Your session has expired. Please log in again.', {
      variant: 'error',
      persist: true
    });
    
    setIsSessionValid(false);
    
    logSecurityEvent({
      type: 'session_expired',
      details: { forced: true }
    });
    
    // Redirect to login after a short delay
    setTimeout(() => {
      window.location.href = '/login';
    }, 2000);
  };

  const handleCSPViolation = (event: SecurityPolicyViolationEvent) => {
    logSecurityEvent({
      type: 'csp_violation',
      details: {
        directive: event.violatedDirective,
        blockedURI: event.blockedURI,
        lineNumber: event.lineNumber,
        sourceFile: event.sourceFile
      }
    });
    
    if (process.env.NODE_ENV === 'development') {
      console.warn('CSP Violation detected:', event);
    }
  };

  const handleVisibilityChange = () => {
    if (document.hidden) {
      // Tab/window became hidden - potential security risk
      logSecurityEvent({
        type: 'suspicious_activity',
        details: { action: 'tab_hidden' }
      });
    } else {
      // Tab/window became visible - update activity
      handleUserActivity();
    }
  };

  const handleUserActivity = () => {
    const now = Date.now();
    setLastActivity(now);
    SessionManager.updateActivity();
  };

  const extendSession = () => {
    SessionManager.updateActivity();
    setLastActivity(Date.now());
    setSessionTimeRemaining(SECURITY_CONFIG.SESSION_TIMEOUT);
    
    enqueueSnackbar('Session extended successfully', {
      variant: 'success'
    });
  };

  const refreshTokens = async () => {
    try {
      const refreshToken = TokenManager.getRefreshToken();
      if (!refreshToken) {
        handleSessionExpired();
        return;
      }

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || ''
        },
        body: JSON.stringify({ refreshToken })
      });

      if (response.ok) {
        const { accessToken, refreshToken: newRefreshToken } = await response.json();
        TokenManager.setTokens(accessToken, newRefreshToken);
        
        // Generate new CSRF token
        const newCsrfToken = CSRFProtection.generateToken();
        setCsrfToken(newCsrfToken);
      } else {
        handleSessionExpired();
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      handleSessionExpired();
    }
  };

  const logSecurityEvent = (event: SecurityEvent) => {
    const eventWithTimestamp = {
      ...event,
      timestamp: event.timestamp || new Date()
    };
    
    setSecurityEvents(prev => [...prev.slice(-99), eventWithTimestamp]); // Keep last 100 events
    
    // Send to backend for monitoring
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/security/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TokenManager.getAccessToken()}`,
          'X-CSRF-Token': csrfToken || ''
        },
        body: JSON.stringify(eventWithTimestamp)
      }).catch(console.error);
    }
  };

  const checkRateLimit = (endpoint: string): boolean => {
    const isAllowed = RateLimiter.isAllowed(endpoint);
    
    if (!isAllowed) {
      logSecurityEvent({
        type: 'rate_limit',
        details: { endpoint }
      });
      
      enqueueSnackbar('Too many requests. Please try again later.', {
        variant: 'warning'
      });
    }
    
    return isAllowed;
  };

  // Security context value
  const contextValue: SecurityContextType = {
    isSessionValid,
    csrfToken,
    lastActivity,
    sessionTimeRemaining,
    extendSession,
    logSecurityEvent,
    checkRateLimit
  };

  return (
    <SecurityContext.Provider value={contextValue}>
      {children}
      <SecurityMonitor events={securityEvents} />
    </SecurityContext.Provider>
  );
};

// Security monitor component for development
const SecurityMonitor: React.FC<{ events: SecurityEvent[] }> = ({ events }) => {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 10,
        right: 10,
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        maxWidth: '300px',
        maxHeight: '200px',
        overflow: 'auto',
        fontSize: '12px',
        zIndex: 9999
      }}
    >
      <h4>Security Monitor</h4>
      {events.slice(-5).map((event, index) => (
        <div key={index} style={{ marginBottom: '5px', borderBottom: '1px solid #333' }}>
          <strong>{event.type}</strong>
          <div>{event.timestamp?.toLocaleTimeString()}</div>
          <pre style={{ fontSize: '10px' }}>
            {JSON.stringify(event.details, null, 1)}
          </pre>
        </div>
      ))}
    </div>
  );
};

// Hook to use security context
export const useSecurity = (): SecurityContextType => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};

// Higher-order component for protected routes
export const withSecurityCheck = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => {
  const WithSecurityCheckComponent = (props: P) => {
    const { isSessionValid, logSecurityEvent } = useSecurity();
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
      if (!isSessionValid) {
        logSecurityEvent({
          type: 'suspicious_activity',
          details: { action: 'accessed_protected_route_without_session' }
        });
        
        enqueueSnackbar('Access denied. Please log in.', {
          variant: 'error'
        });
      }
    }, [isSessionValid, logSecurityEvent, enqueueSnackbar]);

    if (!isSessionValid) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          flexDirection: 'column'
        }}>
          <h2>Access Denied</h2>
          <p>Your session has expired or is invalid.</p>
          <button onClick={() => window.location.href = '/login'}>
            Go to Login
          </button>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };

  WithSecurityCheckComponent.displayName = `withSecurityCheck(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return WithSecurityCheckComponent;
};

// Security audit hook for components
export const useSecurityAudit = () => {
  const { logSecurityEvent } = useSecurity();

  return {
    auditLogin: (success: boolean, details?: Record<string, any>) => {
      logSecurityEvent({
        type: 'login_attempt',
        details: { success, ...details }
      });
    },
    
    auditSuspiciousActivity: (action: string, details?: Record<string, any>) => {
      logSecurityEvent({
        type: 'suspicious_activity',
        details: { action, ...details }
      });
    },
    
    auditDataAccess: (resource: string, action: string, details?: Record<string, any>) => {
      logSecurityEvent({
        type: 'suspicious_activity',
        details: { action: 'data_access', resource, operation: action, ...details }
      });
    }
  };
};