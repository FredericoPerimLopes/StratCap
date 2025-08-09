import { createTheme } from '@mui/material/styles';

// Enhanced Professional Theme for StratCap
export const enhancedTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1e3a8a',        // StratCap Navy
      light: '#3b82f6',       // StratCap Blue  
      dark: '#1e40af',        // Deep Navy
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#64748b',        // Professional Gray
      light: '#94a3b8',       // Light Gray
      dark: '#475569',        // Dark Gray
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8fafc',     // Clean Background
      paper: '#ffffff',       // Card Background
    },
    text: {
      primary: '#0f172a',     // Dark Slate
      secondary: '#64748b',   // Medium Gray
      disabled: '#94a3b8',    // Light Gray
    },
    error: {
      main: '#dc2626',
      light: '#fca5a5', 
      dark: '#991b1b',
    },
    warning: {
      main: '#d97706',
      light: '#fcd34d',
      dark: '#92400e', 
    },
    success: {
      main: '#059669',
      light: '#6ee7b7',
      dark: '#047857',
    },
    info: {
      main: '#0ea5e9',
      light: '#7dd3fc',
      dark: '#0284c7',
    },
  },
  typography: {
    fontFamily: "'Inter', 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    // Enhanced typography scale
    h1: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.025em',
    },
    h2: {
      fontSize: '1.5rem', 
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: '-0.025em',
    },
    h3: {
      fontSize: '1.25rem',
      fontWeight: 600, 
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.125rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    h5: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      letterSpacing: '0.015em',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      letterSpacing: '0.01em',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
      letterSpacing: '0.025em',
    },
  },
  spacing: 8, // 8px base unit
  shape: {
    borderRadius: 8,
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
  components: {
    // Enhanced component overrides
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
          border: '1px solid rgba(30, 58, 138, 0.08)',
          background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 8,
          fontSize: '0.875rem',
          minHeight: 36,
          paddingLeft: 16,
          paddingRight: 16,
        },
        contained: {
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
          boxShadow: '0 2px 8px rgba(30, 58, 138, 0.25)',
          '&:hover': {
            background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
            boxShadow: '0 4px 12px rgba(30, 58, 138, 0.35)',
          },
        },
        outlined: {
          borderColor: '#e2e8f0',
          color: '#64748b',
          '&:hover': {
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.04)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            backgroundColor: '#ffffff',
            fontSize: '0.875rem',
            '& fieldset': {
              borderColor: '#e2e8f0',
              borderWidth: 1,
            },
            '&:hover fieldset': {
              borderColor: '#3b82f6',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#1e3a8a',
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: '#f8fafc',
            fontWeight: 600,
            fontSize: '0.875rem',
            color: '#374151',
            borderBottom: '2px solid #e5e7eb',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #f3f4f6',
          padding: '12px 16px',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontSize: '0.875rem',
        },
        standardError: {
          backgroundColor: '#fef2f2',
          color: '#991b1b',
          border: '1px solid #fecaca',
        },
        standardWarning: {
          backgroundColor: '#fffbeb',
          color: '#92400e',
          border: '1px solid #fed7aa',
        },
        standardSuccess: {
          backgroundColor: '#f0fdf4',
          color: '#166534',
          border: '1px solid #bbf7d0',
        },
        standardInfo: {
          backgroundColor: '#eff6ff',
          color: '#1e40af',
          border: '1px solid #bfdbfe',
        },
      },
    },
  },
});

export default enhancedTheme;