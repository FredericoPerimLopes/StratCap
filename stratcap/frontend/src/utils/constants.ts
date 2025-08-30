// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
} as const;

// Application Constants
export const APP_CONFIG = {
  NAME: 'StratCap',
  VERSION: '1.0.0',
  DESCRIPTION: 'Fund Administration Platform',
  SUPPORT_EMAIL: 'support@stratcap.com',
  COMPANY: 'StratCap Solutions',
} as const;

// UI Constants
export const UI_CONFIG = {
  SIDEBAR_WIDTH: 280,
  HEADER_HEIGHT: 64,
  DEFAULT_PAGE_SIZE: 25,
  MAX_UPLOAD_SIZE: 10 * 1024 * 1024, // 10MB
  DEBOUNCE_DELAY: 300,
} as const;

// Form Validation
export const VALIDATION_CONFIG = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FILE_TYPES: ['pdf', 'doc', 'docx', 'xlsx', 'csv'],
  MAX_TEXT_LENGTH: 1000,
} as const;

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MM/dd/yyyy',
  API: 'yyyy-MM-dd',
  DATETIME: 'MM/dd/yyyy HH:mm',
  TIME: 'HH:mm',
} as const;

// Currency Formats
export const CURRENCY_CONFIG = {
  DEFAULT_CURRENCY: 'USD',
  DISPLAY_FORMAT: 'en-US',
  DECIMAL_PLACES: 2,
} as const;

// Status Options
export const FUND_STATUSES = [
  { value: 'fundraising', label: 'Fundraising', color: 'info' },
  { value: 'investing', label: 'Investing', color: 'primary' },
  { value: 'harvesting', label: 'Harvesting', color: 'warning' },
  { value: 'closed', label: 'Closed', color: 'default' },
] as const;

export const INVESTOR_TYPES = [
  { value: 'individual', label: 'Individual' },
  { value: 'institution', label: 'Institution' },
  { value: 'fund', label: 'Fund' },
  { value: 'trust', label: 'Trust' },
  { value: 'other', label: 'Other' },
] as const;

export const KYC_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'warning' },
  { value: 'approved', label: 'Approved', color: 'success' },
  { value: 'rejected', label: 'Rejected', color: 'error' },
  { value: 'expired', label: 'Expired', color: 'default' },
] as const;

export const COMMITMENT_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'warning' },
  { value: 'active', label: 'Active', color: 'success' },
  { value: 'suspended', label: 'Suspended', color: 'error' },
  { value: 'terminated', label: 'Terminated', color: 'default' },
] as const;

export const ACTIVITY_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'default' },
  { value: 'pending', label: 'Pending', color: 'warning' },
  { value: 'approved', label: 'Approved', color: 'info' },
  { value: 'completed', label: 'Completed', color: 'success' },
  { value: 'cancelled', label: 'Cancelled', color: 'error' },
] as const;

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  FUND_FAMILIES: '/fund-families',
  FUNDS: '/funds',
  INVESTORS: '/investors',
  CAPITAL_ACTIVITIES: '/capital-activities',
  REPORTS: '/reports',
  SETTINGS: '/settings',
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_PREFERENCES: 'user_preferences',
  SIDEBAR_STATE: 'sidebar_state',
  THEME_MODE: 'theme_mode',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error - please check your connection',
  UNAUTHORIZED: 'You are not authorized to perform this action',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'The requested resource was not found',
  SERVER_ERROR: 'Server error - please try again later',
  VALIDATION_ERROR: 'Please check your input and try again',
  GENERIC_ERROR: 'An unexpected error occurred',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  CREATED: 'Created successfully',
  UPDATED: 'Updated successfully',
  DELETED: 'Deleted successfully',
  SAVED: 'Saved successfully',
  SUBMITTED: 'Submitted successfully',
} as const;