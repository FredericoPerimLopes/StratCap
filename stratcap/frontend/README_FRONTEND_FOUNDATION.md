# StratCap Frontend Foundation

## Overview

This document describes the comprehensive frontend foundation created for StratCap's fund administration platform. The foundation provides a solid, scalable base for all frontend development with shared components, API integration, routing, and state management.

## Architecture

### 🏗️ Core Structure

```
src/
├── api/                    # RTK Query API integration
│   ├── baseApi.ts         # Base API configuration
│   ├── fundApi.ts         # Fund-related endpoints
│   ├── investorApi.ts     # Investor-related endpoints
│   ├── capitalActivityApi.ts  # Capital activity endpoints
│   └── index.ts           # API exports
├── components/
│   └── shared/            # Shared component library
│       ├── Button.tsx     # Enhanced button component
│       ├── Input.tsx      # Form input with validation
│       ├── Card.tsx       # Styled card component
│       ├── DataTable.tsx  # Advanced data table
│       ├── Modal.tsx      # Enhanced modal component
│       ├── Form.tsx       # Form wrapper with validation
│       ├── LoadingSpinner.tsx  # Loading states
│       ├── ErrorBoundary.tsx   # Error handling
│       ├── Breadcrumbs.tsx     # Navigation breadcrumbs
│       ├── PageContainer.tsx   # Page layout wrapper
│       ├── Layout.tsx     # Header component
│       ├── Sidebar.tsx    # Navigation sidebar
│       ├── DashboardLayout.tsx # Main layout
│       ├── LazyRoute.tsx  # Lazy loading wrapper
│       ├── ProtectedRoute.tsx  # Auth-protected routes
│       └── index.ts       # Component exports
├── store/                 # Redux state management
│   ├── store.ts          # Store configuration with persistence
│   └── slices/           # Redux slices
├── types/                # TypeScript definitions
│   └── api.ts           # API response types
├── utils/               # Utility functions
│   ├── constants.ts     # Application constants
│   └── helpers.ts       # Helper functions
└── theme/               # Material-UI theme
    └── enhanced-theme.ts
```

## 🎨 Shared Component Library

### Core Components

#### Button
Enhanced Material-UI button with loading states and consistent styling:
```tsx
<Button loading={isLoading} loadingText="Saving...">
  Save Fund
</Button>
```

#### Input
Form input with React Hook Form integration and validation:
```tsx
<Input
  name="fundName"
  control={control}
  label="Fund Name"
  rules={{ required: 'Fund name is required' }}
/>
```

#### Card
Styled card component with hover effects and actions:
```tsx
<Card
  title="Fund Overview"
  subtitle="Key metrics and performance"
  actions={<Button>Edit</Button>}
>
  {/* Card content */}
</Card>
```

#### DataTable
Advanced data table with sorting, filtering, and pagination:
```tsx
<DataTable
  data={funds}
  columns={columns}
  title="Funds"
  selectable
  onRowClick={handleRowClick}
  onExport={handleExport}
/>
```

#### Form
Form wrapper with validation schema support:
```tsx
<Form
  title="Create Fund"
  onSubmit={handleSubmit}
  schema={fundSchema}
  loading={isLoading}
  actions={<Button type="submit">Create</Button>}
>
  {/* Form fields */}
</Form>
```

### Layout Components

#### DashboardLayout
Main application layout with responsive sidebar and header:
```tsx
<DashboardLayout>
  <PageContainer title="Funds" actions={<Button>Add Fund</Button>}>
    {/* Page content */}
  </PageContainer>
</DashboardLayout>
```

#### PageContainer
Page wrapper with breadcrumbs, title, and actions:
```tsx
<PageContainer
  title="Fund Details"
  breadcrumbs={breadcrumbs}
  actions={<Button>Edit</Button>}
  showFab
  onFabClick={handleAddNew}
>
  {/* Page content */}
</PageContainer>
```

## 🔌 API Integration

### RTK Query Setup

The API layer uses RTK Query for efficient data fetching and caching:

```tsx
// Using API hooks in components
const { data: funds, isLoading, error } = useGetFundsQuery({
  page: 0,
  limit: 25,
  fundFamilyId: 1,
});

const [createFund, { isLoading: isCreating }] = useCreateFundMutation();
```

### Available API Endpoints

#### Fund API
- `useGetFundsQuery` - Get funds with pagination and filtering
- `useGetFundQuery` - Get single fund by ID
- `useCreateFundMutation` - Create new fund
- `useUpdateFundMutation` - Update existing fund
- `useDeleteFundMutation` - Delete fund

#### Investor API
- `useGetInvestorsQuery` - Get investors with filtering
- `useGetInvestorQuery` - Get single investor
- `useCreateInvestorMutation` - Create new investor
- `useUpdateKycStatusMutation` - Update KYC status

#### Capital Activity API
- `useGetCapitalActivitiesQuery` - Get capital activities
- `useCreateCapitalActivityMutation` - Create capital activity
- `useApproveCapitalActivityMutation` - Approve activity

### Error Handling

Centralized error handling with user-friendly messages:
```tsx
import { getErrorMessage } from '../api';

// In components
if (error) {
  const errorMessage = getErrorMessage(error);
  // Display error message
}
```

## 🗃️ State Management

### Redux Store Configuration

Enhanced Redux store with persistence and API integration:
- **Persistence**: Auth and UI state persisted to localStorage
- **API Caching**: RTK Query handles data caching automatically
- **Middleware**: Redux DevTools in development

### Store Structure
```typescript
{
  auth: AuthState,          // Authentication state
  ui: UIState,              // UI preferences and sidebar state
  fund: FundState,          // Fund-related state
  fundFamily: FundFamilyState,  // Fund family state
  investor: InvestorState,  // Investor state
  api: ApiState,            // RTK Query cache
}
```

## 🎨 Theme and Styling

### Material-UI Theme

Professional theme with StratCap branding:
- **Primary Colors**: Navy gradient (#1e3a8a to #3b82f6)
- **Typography**: Inter font family with enhanced hierarchy
- **Components**: Consistent styling for buttons, cards, tables
- **Responsive**: Mobile-first responsive design

### Theme Usage
```tsx
import { useTheme } from '@mui/material/styles';

const theme = useTheme();
// Access theme colors, spacing, breakpoints
```

## 🛡️ Error Handling

### Error Boundary
Global error boundary catches and displays user-friendly error messages:
```tsx
<ErrorBoundary fallback={<CustomErrorPage />}>
  <App />
</ErrorBoundary>
```

### Loading States
Comprehensive loading state management:
- **Skeleton Loading**: For content placeholders
- **Spinner Loading**: For actions and data fetching
- **Full Screen Loading**: For initial app load

## 🧭 Routing and Navigation

### Enhanced Routing
- **Lazy Loading**: Code splitting for better performance
- **Protected Routes**: Authentication-based route protection
- **Breadcrumbs**: Automatic breadcrumb generation
- **Navigation**: Responsive sidebar with nested menus

### Route Protection
```tsx
<ProtectedRoute requireAuth roles={['admin']}>
  <AdminPanel />
</ProtectedRoute>
```

## 🛠️ Development Tools

### Code Quality
- **ESLint**: Enhanced configuration with TypeScript support
- **Prettier**: Consistent code formatting
- **TypeScript**: Strict type checking for better development experience

### Build Configuration
- **Vite**: Fast development and build tool
- **Bundle Analysis**: Optimize bundle size
- **Environment Variables**: Secure configuration management

## 📊 Type Safety

### Comprehensive TypeScript Types

All components and APIs are fully typed:
```typescript
interface Fund {
  id: number;
  name: string;
  type: FundType;
  status: FundStatus;
  // ... more fields
}

interface APIResponse<T> {
  success: boolean;
  data: T;
  pagination?: PaginationInfo;
}
```

### Form Validation
Type-safe form validation with Yup schemas:
```typescript
const fundSchema = yup.object({
  name: yup.string().required(),
  type: yup.string().oneOf(['master', 'feeder']).required(),
  targetSize: yup.string().required(),
});
```

## 🚀 Usage Examples

### Creating a New Page
```tsx
import React from 'react';
import { PageContainer, DataTable, Button } from '../components/shared';
import { useGetFundsQuery } from '../api';

const FundsPage = () => {
  const { data: funds, isLoading } = useGetFundsQuery();

  return (
    <PageContainer
      title="Funds"
      actions={<Button href="/funds/new">Add Fund</Button>}
    >
      <DataTable
        data={funds?.data || []}
        columns={columns}
        loading={isLoading}
      />
    </PageContainer>
  );
};
```

### Creating a Form
```tsx
import React from 'react';
import { Form, Input, Button, Grid } from '../components/shared';
import { useCreateFundMutation } from '../api';

const FundForm = () => {
  const [createFund, { isLoading }] = useCreateFundMutation();

  const handleSubmit = async (data) => {
    await createFund(data);
  };

  return (
    <Form
      title="Create Fund"
      onSubmit={handleSubmit}
      loading={isLoading}
      actions={
        <>
          <Button variant="outlined">Cancel</Button>
          <Button type="submit" loading={isLoading}>
            Create Fund
          </Button>
        </>
      }
    >
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Input name="name" label="Fund Name" />
        </Grid>
        <Grid item xs={12} md={6}>
          <Input name="type" label="Fund Type" select />
        </Grid>
      </Grid>
    </Form>
  );
};
```

## 📈 Performance Optimizations

### Code Splitting
- Lazy loading for route components
- Dynamic imports for large components
- Bundle analysis and optimization

### API Optimization
- RTK Query automatic caching
- Background refetching
- Optimistic updates

### Rendering Optimization
- React.memo for expensive components
- useMemo and useCallback where appropriate
- Virtualization for large lists

## 🔧 Customization

### Theme Customization
```tsx
// Extend the theme
const customTheme = createTheme({
  ...enhancedTheme,
  palette: {
    ...enhancedTheme.palette,
    // Custom colors
  },
});
```

### Component Extension
```tsx
// Extend shared components
const CustomButton = styled(Button)(({ theme }) => ({
  // Custom styles
}));
```

## 📝 Best Practices

1. **Component Design**: Use shared components consistently
2. **State Management**: Keep state as close to usage as possible
3. **API Integration**: Use RTK Query hooks for all API calls
4. **Error Handling**: Always handle errors gracefully
5. **Performance**: Implement lazy loading and memoization
6. **Accessibility**: Follow WCAG guidelines
7. **Testing**: Write unit tests for shared components
8. **Documentation**: Document custom components and utilities

This frontend foundation provides a robust, scalable, and maintainable base for building StratCap's fund administration platform.