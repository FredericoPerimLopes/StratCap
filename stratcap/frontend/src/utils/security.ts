import CryptoJS from 'crypto-js';

// Security configuration
export const SECURITY_CONFIG = {
  JWT_EXPIRY: 3600000, // 1 hour
  REFRESH_TOKEN_EXPIRY: 86400000, // 24 hours
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_COMPLEXITY: {
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  },
  SESSION_TIMEOUT: 1800000, // 30 minutes
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 900000, // 15 minutes
};

/**
 * Content Security Policy configuration
 */
export const CSP_CONFIG = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
  'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  'font-src': ["'self'", "https://fonts.gstatic.com"],
  'img-src': ["'self'", "data:", "https:"],
  'connect-src': ["'self'", process.env.REACT_APP_API_URL],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
};

/**
 * Input sanitization utilities
 */
export class InputSanitizer {
  private static XSS_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>/gi,
    /<object[^>]*>/gi,
    /<embed[^>]*>/gi,
    /<link[^>]*>/gi,
    /<meta[^>]*>/gi,
  ];

  private static SQL_INJECTION_PATTERNS = [
    /((%3D)|(=))[^\n]*((%27)|(')|(--)|(#)|(%3B)|(;))/i,
    /\w*((%27)|(''))((%6F)|o|(%4F))((%72)|r|(%52))/i,
    /((%27)|(''))union/i,
    /exec(\s|\+)+(s|x)p\w+/i,
    /union([^a-z]|[\s])+select/i,
  ];

  /**
   * Sanitize string input to prevent XSS attacks
   */
  static sanitizeString(input: string): string {
    if (!input || typeof input !== 'string') return '';

    let sanitized = input;

    // Remove dangerous HTML tags and attributes
    this.XSS_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });

    // Encode HTML entities
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');

    return sanitized.trim();
  }

  /**
   * Validate and sanitize email addresses
   */
  static sanitizeEmail(email: string): string | null {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const sanitized = this.sanitizeString(email.toLowerCase());
    
    return emailRegex.test(sanitized) ? sanitized : null;
  }

  /**
   * Sanitize numeric input
   */
  static sanitizeNumber(input: string | number): number | null {
    const num = typeof input === 'string' ? parseFloat(input.replace(/[,$]/g, '')) : input;
    return !isNaN(num) && isFinite(num) ? num : null;
  }

  /**
   * Check for SQL injection patterns
   */
  static containsSQLInjection(input: string): boolean {
    return this.SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
  }

  /**
   * Sanitize object properties recursively
   */
  static sanitizeObject<T extends Record<string, any>>(obj: T): T {
    const sanitized = {} as T;

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key as keyof T] = this.sanitizeString(value) as T[keyof T];
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        sanitized[key as keyof T] = this.sanitizeObject(value) as T[keyof T];
      } else if (Array.isArray(value)) {
        sanitized[key as keyof T] = value.map(item => 
          typeof item === 'string' ? this.sanitizeString(item) :
          typeof item === 'object' ? this.sanitizeObject(item) : item
        ) as T[keyof T];
      } else {
        sanitized[key as keyof T] = value;
      }
    }

    return sanitized;
  }
}

/**
 * Password validation and security
 */
export class PasswordSecurity {
  /**
   * Validate password strength
   */
  static validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < SECURITY_CONFIG.PASSWORD_MIN_LENGTH) {
      errors.push(`Password must be at least ${SECURITY_CONFIG.PASSWORD_MIN_LENGTH} characters long`);
    }

    if (SECURITY_CONFIG.PASSWORD_COMPLEXITY.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (SECURITY_CONFIG.PASSWORD_COMPLEXITY.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (SECURITY_CONFIG.PASSWORD_COMPLEXITY.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (SECURITY_CONFIG.PASSWORD_COMPLEXITY.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Check for common weak passwords
    const weakPasswords = [
      'password', '123456', 'password123', 'admin', 'letmein',
      'welcome', 'monkey', '1234567890', 'qwerty', 'abc123'
    ];

    if (weakPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common and easily guessed');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate secure password hash
   */
  static hashPassword(password: string): string {
    const salt = CryptoJS.lib.WordArray.random(128/8);
    const hash = CryptoJS.PBKDF2(password, salt, {
      keySize: 256/32,
      iterations: 10000
    });

    return salt.toString() + hash.toString();
  }

  /**
   * Verify password against hash
   */
  static verifyPassword(password: string, hashedPassword: string): boolean {
    try {
      const salt = CryptoJS.enc.Hex.parse(hashedPassword.substr(0, 32));
      const hash = hashedPassword.substr(32);
      
      const computed = CryptoJS.PBKDF2(password, salt, {
        keySize: 256/32,
        iterations: 10000
      });

      return computed.toString() === hash;
    } catch (error) {
      return false;
    }
  }
}

/**
 * JWT Token management
 */
export class TokenManager {
  private static readonly ACCESS_TOKEN_KEY = 'stratcap_access_token';
  private static readonly REFRESH_TOKEN_KEY = 'stratcap_refresh_token';
  private static readonly TOKEN_EXPIRY_KEY = 'stratcap_token_expiry';

  /**
   * Store tokens securely
   */
  static setTokens(accessToken: string, refreshToken: string): void {
    const expiryTime = Date.now() + SECURITY_CONFIG.JWT_EXPIRY;
    
    // Encrypt tokens before storage
    const encryptedAccess = this.encryptToken(accessToken);
    const encryptedRefresh = this.encryptToken(refreshToken);

    sessionStorage.setItem(this.ACCESS_TOKEN_KEY, encryptedAccess);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, encryptedRefresh);
    sessionStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
  }

  /**
   * Retrieve access token
   */
  static getAccessToken(): string | null {
    try {
      const encrypted = sessionStorage.getItem(this.ACCESS_TOKEN_KEY);
      const expiry = sessionStorage.getItem(this.TOKEN_EXPIRY_KEY);

      if (!encrypted || !expiry) return null;

      if (Date.now() > parseInt(expiry)) {
        this.clearTokens();
        return null;
      }

      return this.decryptToken(encrypted);
    } catch (error) {
      console.error('Error retrieving access token:', error);
      return null;
    }
  }

  /**
   * Retrieve refresh token
   */
  static getRefreshToken(): string | null {
    try {
      const encrypted = localStorage.getItem(this.REFRESH_TOKEN_KEY);
      return encrypted ? this.decryptToken(encrypted) : null;
    } catch (error) {
      console.error('Error retrieving refresh token:', error);
      return null;
    }
  }

  /**
   * Clear all stored tokens
   */
  static clearTokens(): void {
    sessionStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(this.TOKEN_EXPIRY_KEY);
  }

  /**
   * Check if tokens need refresh
   */
  static shouldRefreshToken(): boolean {
    const expiry = sessionStorage.getItem(this.TOKEN_EXPIRY_KEY);
    if (!expiry) return false;

    const expiryTime = parseInt(expiry);
    const refreshThreshold = 5 * 60 * 1000; // 5 minutes before expiry

    return Date.now() > (expiryTime - refreshThreshold);
  }

  private static encryptToken(token: string): string {
    const key = this.getEncryptionKey();
    return CryptoJS.AES.encrypt(token, key).toString();
  }

  private static decryptToken(encrypted: string): string {
    const key = this.getEncryptionKey();
    const bytes = CryptoJS.AES.decrypt(encrypted, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  private static getEncryptionKey(): string {
    // Generate a key based on browser fingerprinting
    const userAgent = navigator.userAgent;
    const language = navigator.language;
    const platform = navigator.platform;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    return CryptoJS.SHA256(`${userAgent}${language}${platform}${timezone}`).toString();
  }
}

/**
 * Session management
 */
export class SessionManager {
  private static lastActivity = Date.now();
  private static sessionTimer: NodeJS.Timeout | null = null;
  private static warningTimer: NodeJS.Timeout | null = null;

  /**
   * Initialize session monitoring
   */
  static initializeSession(): void {
    this.resetActivityTimer();
    this.setupActivityListeners();
  }

  /**
   * Update last activity timestamp
   */
  static updateActivity(): void {
    this.lastActivity = Date.now();
    this.resetActivityTimer();
  }

  /**
   * Check if session is still valid
   */
  static isSessionValid(): boolean {
    return Date.now() - this.lastActivity < SECURITY_CONFIG.SESSION_TIMEOUT;
  }

  /**
   * Force session expiry
   */
  static expireSession(): void {
    TokenManager.clearTokens();
    this.clearTimers();
    
    // Dispatch custom event for session expiry
    window.dispatchEvent(new CustomEvent('session-expired'));
  }

  private static resetActivityTimer(): void {
    this.clearTimers();

    // Set warning timer (5 minutes before expiry)
    this.warningTimer = setTimeout(() => {
      window.dispatchEvent(new CustomEvent('session-warning'));
    }, SECURITY_CONFIG.SESSION_TIMEOUT - 300000);

    // Set session expiry timer
    this.sessionTimer = setTimeout(() => {
      this.expireSession();
    }, SECURITY_CONFIG.SESSION_TIMEOUT);
  }

  private static setupActivityListeners(): void {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, () => this.updateActivity(), true);
    });
  }

  private static clearTimers(): void {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
  }
}

/**
 * CSRF Protection
 */
export class CSRFProtection {
  private static readonly CSRF_TOKEN_KEY = 'stratcap_csrf_token';

  /**
   * Generate CSRF token
   */
  static generateToken(): string {
    const token = CryptoJS.lib.WordArray.random(256/8).toString();
    sessionStorage.setItem(this.CSRF_TOKEN_KEY, token);
    return token;
  }

  /**
   * Get current CSRF token
   */
  static getToken(): string | null {
    return sessionStorage.getItem(this.CSRF_TOKEN_KEY);
  }

  /**
   * Validate CSRF token
   */
  static validateToken(token: string): boolean {
    const storedToken = this.getToken();
    return storedToken === token;
  }

  /**
   * Clear CSRF token
   */
  static clearToken(): void {
    sessionStorage.removeItem(this.CSRF_TOKEN_KEY);
  }
}

/**
 * Rate limiting for client-side requests
 */
export class RateLimiter {
  private static requests: Map<string, number[]> = new Map();

  /**
   * Check if request is allowed based on rate limits
   */
  static isAllowed(endpoint: string, maxRequests: number = 60, windowMs: number = 60000): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!this.requests.has(endpoint)) {
      this.requests.set(endpoint, []);
    }

    const endpointRequests = this.requests.get(endpoint)!;
    
    // Remove old requests outside the window
    const validRequests = endpointRequests.filter(timestamp => timestamp > windowStart);
    this.requests.set(endpoint, validRequests);

    if (validRequests.length >= maxRequests) {
      return false;
    }

    // Add current request
    validRequests.push(now);
    return true;
  }

  /**
   * Clear rate limit data for endpoint
   */
  static clearEndpoint(endpoint: string): void {
    this.requests.delete(endpoint);
  }

  /**
   * Clear all rate limit data
   */
  static clearAll(): void {
    this.requests.clear();
  }
}

/**
 * Secure data storage utilities
 */
export class SecureStorage {
  /**
   * Encrypt and store sensitive data
   */
  static setSecure(key: string, data: any): void {
    try {
      const jsonString = JSON.stringify(data);
      const encrypted = CryptoJS.AES.encrypt(jsonString, this.getStorageKey()).toString();
      localStorage.setItem(`secure_${key}`, encrypted);
    } catch (error) {
      console.error('Error storing secure data:', error);
    }
  }

  /**
   * Retrieve and decrypt sensitive data
   */
  static getSecure<T>(key: string): T | null {
    try {
      const encrypted = localStorage.getItem(`secure_${key}`);
      if (!encrypted) return null;

      const bytes = CryptoJS.AES.decrypt(encrypted, this.getStorageKey());
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Error retrieving secure data:', error);
      return null;
    }
  }

  /**
   * Remove secure data
   */
  static removeSecure(key: string): void {
    localStorage.removeItem(`secure_${key}`);
  }

  private static getStorageKey(): string {
    // Use a combination of factors for encryption key
    const factors = [
      navigator.userAgent,
      window.location.hostname,
      navigator.language,
      navigator.platform
    ].join('|');

    return CryptoJS.SHA256(factors).toString();
  }
}

/**
 * Content Security Policy enforcement
 */
export class CSPEnforcement {
  /**
   * Initialize CSP headers
   */
  static initialize(): void {
    const csp = this.buildCSPString();
    
    // Create meta tag for CSP
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = csp;
    document.head.appendChild(meta);

    // Listen for CSP violations
    document.addEventListener('securitypolicyviolation', this.handleViolation);
  }

  private static buildCSPString(): string {
    return Object.entries(CSP_CONFIG)
      .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
      .join('; ');
  }

  private static handleViolation(event: SecurityPolicyViolationEvent): void {
    console.warn('CSP Violation:', {
      directive: event.violatedDirective,
      blockedURI: event.blockedURI,
      lineNumber: event.lineNumber,
      sourceFile: event.sourceFile
    });

    // Report violation to security monitoring
    if (process.env.NODE_ENV === 'production') {
      // Send to monitoring service
      fetch('/api/security/csp-violation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          directive: event.violatedDirective,
          blockedURI: event.blockedURI,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        })
      }).catch(console.error);
    }
  }
}

// Initialize security on module load
if (typeof window !== 'undefined') {
  // Initialize session management
  SessionManager.initializeSession();
  
  // Initialize CSP enforcement
  CSPEnforcement.initialize();
  
  // Generate initial CSRF token
  CSRFProtection.generateToken();
}