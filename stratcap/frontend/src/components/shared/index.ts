// Shared Components Export
export { default as Button, type ButtonProps } from './Button';
export { default as Input, type InputProps } from './Input';
export { default as Card, type CardProps } from './Card';
export { default as DataTable, type DataTableProps, type Column } from './DataTable';
export { default as LoadingSpinner, type LoadingSpinnerProps } from './LoadingSpinner';
export { default as Modal, type ModalProps } from './Modal';
export { default as ErrorBoundary, withErrorBoundary } from './ErrorBoundary';
export { default as Form, type FormProps } from './Form';
export { default as Breadcrumbs, type BreadcrumbsProps, type BreadcrumbItem } from './Breadcrumbs';
export { default as PageContainer, type PageContainerProps } from './PageContainer';
export { default as LazyRoute, type LazyRouteProps } from './LazyRoute';
export { default as ProtectedRoute, type ProtectedRouteProps } from './ProtectedRoute';

// Layout Components
export { default as Header } from './Layout';
export { default as Sidebar, type SidebarProps } from './Sidebar';
export { default as DashboardLayout, type DashboardLayoutProps } from './DashboardLayout';

// Re-export commonly used components from Material-UI for convenience
export {
  Alert,
  AlertTitle,
  Autocomplete,
  Avatar,
  Badge,
  Chip,
  Collapse,
  Drawer,
  Fab,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Grid,
  IconButton,
  InputLabel,
  Link,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Popover,
  Radio,
  RadioGroup,
  Select,
  Snackbar,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

// Common layout components
export { Box, Container, Stack, Divider } from '@mui/material';