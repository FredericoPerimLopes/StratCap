# Fund Family Management Components

This documentation covers the comprehensive Fund Family Management interface components built for StratCap.

## Overview

The Fund Family Management interface provides a complete solution for managing fund families, their configurations, and related operations. It includes:

1. **Dashboard Components** - KPI widgets, metrics, and activity feeds
2. **Management Components** - List views, creation wizards, and settings
3. **Configuration Components** - Fund structure, investment classes, and transaction codes

## Component Structure

```
src/components/fund-family/
├── dashboard/
│   ├── FundFamilyDashboard.tsx        # Main dashboard with metrics
│   ├── FundFamilySummary.tsx          # KPI summary cards
│   ├── FundFamilyMetrics.tsx          # Performance charts & metrics
│   └── FundFamilyActivityFeed.tsx     # Recent activity timeline
├── management/
│   ├── FundFamilyCard.tsx             # Individual fund family card
│   ├── FundFamilyCreation.tsx         # Multi-step creation wizard
│   ├── FundFamilySettings.tsx         # Settings management
│   └── EnhancedFundFamilyList.tsx     # Enhanced list with filtering
└── configuration/
    ├── FundConfiguration.tsx          # Main configuration interface
    ├── FundStructure.tsx              # Drag-drop entity structure
    ├── ClassConfiguration.tsx         # Investment class setup
    └── TransactionCodeManager.tsx     # Transaction code management
```

## Dashboard Components

### FundFamilyDashboard

The main dashboard component that provides an overview of all fund families with key metrics and visualizations.

**Features:**
- Portfolio performance trends with interactive charts
- Real-time KPI metrics with progress indicators
- Fund family status distribution
- Recent activity feed
- Period-based filtering (1M, 3M, 6M, 1Y, YTD)

**Usage:**
```tsx
import FundFamilyDashboard from '../components/fund-family/dashboard/FundFamilyDashboard';

// In your route component
<Route path="/fund-families/dashboard" element={<FundFamilyDashboard />} />
```

### FundFamilySummary

Displays key performance indicators as interactive summary cards with trends and progress bars.

**Props:**
```tsx
interface FundFamilySummaryProps {
  metrics: MetricData[];
  loading?: boolean;
}
```

**Usage:**
```tsx
import FundFamilySummary from '../components/fund-family/dashboard/FundFamilySummary';

const metrics = [
  {
    title: 'Total AUM',
    value: '$1.25B',
    trend: { direction: 'up', percentage: 12.5, period: 'vs last quarter' },
    icon: <AccountBalanceIcon />,
    color: 'primary',
    progress: 85,
    target: '$15B',
    benchmark: '$12B'
  }
  // ... more metrics
];

<FundFamilySummary metrics={metrics} loading={false} />
```

### FundFamilyMetrics

Provides detailed performance charts and analytics with multiple visualization options.

**Features:**
- Capital activity trends (combined charts)
- Top performing fund families table
- Quarterly cash flow analysis
- Risk metrics display
- Customizable chart types and periods

### FundFamilyActivityFeed

Real-time activity feed showing recent transactions, updates, and system events.

**Features:**
- Categorized activity items with icons and status
- Filtering by priority, type, and date
- Real-time updates and notifications
- Expandable details for each activity

## Management Components

### FundFamilyCard

A comprehensive card component for displaying fund family information in both compact and detailed modes.

**Props:**
```tsx
interface FundFamilyCardProps {
  fundFamily: FundFamily;
  onEdit?: (fundFamily: FundFamily) => void;
  onDelete?: (id: number) => void;
  onFavorite?: (id: number, favorite: boolean) => void;
  isFavorite?: boolean;
  compact?: boolean;
}
```

**Features:**
- Compact and detailed view modes
- Favorite/unfavorite functionality
- Context menu with actions
- Performance indicators and trends
- Capital deployment progress
- Investment restrictions display

**Usage:**
```tsx
import FundFamilyCard from '../components/fund-family/management/FundFamilyCard';

<FundFamilyCard
  fundFamily={fundFamily}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onFavorite={handleFavorite}
  isFavorite={favorites.includes(fundFamily.id)}
  compact={false}
/>
```

### FundFamilyCreation

A multi-step wizard for creating new fund families with comprehensive validation.

**Features:**
- 3-step creation process (Basic Info, Configuration, Review)
- Form validation with Yup schemas
- Auto-code generation from name
- Default fee structure setup
- Operational settings configuration
- Management company autocomplete

**Usage:**
```tsx
import FundFamilyCreation from '../components/fund-family/management/FundFamilyCreation';

<FundFamilyCreation
  open={dialogOpen}
  onClose={() => setDialogOpen(false)}
  onSuccess={(fundFamily) => {
    console.log('Created:', fundFamily);
    // Handle success
  }}
/>
```

### FundFamilySettings

Comprehensive settings management with tabbed interface for different configuration areas.

**Features:**
- Financial settings (fee structure)
- Operational settings (approval workflows)
- Security settings (authentication, audit)
- Notification settings (channels, frequency)
- User permissions management

**Tabs:**
1. **Financial** - Management fees, carried interest, preferred return
2. **Operations** - Capital call settings, system features
3. **Security** - Access control, password policies, audit trail
4. **Notifications** - Email, SMS, Slack integrations
5. **Permissions** - User access and role management

### EnhancedFundFamilyList

Advanced list view with comprehensive filtering, sorting, and view options.

**Features:**
- Card and table view modes
- Advanced search and filtering
- Multi-column sorting
- Pagination support
- Bulk actions
- Export functionality
- Favorite management

**Filter Options:**
- Text search (name, code, management company)
- Status filtering
- Management company filtering
- Currency filtering
- Custom date ranges

## Configuration Components

### FundConfiguration

The main configuration interface with tabbed navigation for different configuration areas.

**Features:**
- Tabbed interface for organization
- Auto-save with change tracking
- Configuration preview
- Version history
- Unsaved changes alerts

**Usage:**
```tsx
import FundConfiguration from '../components/fund-family/configuration/FundConfiguration';

// Access via route parameter
<Route path="/fund-families/:id/configuration" element={<FundConfiguration />} />
```

### FundStructure

Drag-and-drop interface for configuring fund entity structures and relationships.

**Features:**
- Drag-and-drop entity reordering
- Hierarchical entity organization
- Entity type management (fund, feeder, master, etc.)
- Relationship mapping
- Jurisdiction and currency settings
- Fee structure per entity

**Entity Types Supported:**
- Fund
- Feeder Fund
- Master Fund
- Parallel Fund
- Blocker
- Holding Company

**Usage:**
```tsx
import FundStructure from '../components/fund-family/configuration/FundStructure';

<FundStructure
  configuration={structureConfig}
  onChange={(config) => setStructureConfig(config)}
  fundFamilyId={fundFamilyId}
/>
```

### ClassConfiguration

Investment class setup with waterfall configuration and rules management.

**Features:**
- Investment class creation and management
- Fee structure per class
- Investment limits and restrictions
- Investor type eligibility
- Waterfall tier configuration
- Rule-based automation

**Investment Class Types:**
- Common
- Preferred
- Founder
- Carried Interest

**Settings Available:**
- Management fee rates
- Carried interest rates
- Preferred returns
- Minimum/maximum investments
- Lockup periods
- Redemption notice periods

### TransactionCodeManager

Comprehensive transaction code management with categorization and system mappings.

**Features:**
- Transaction code creation and management
- Category organization with color coding
- System integration mappings
- Validation rule configuration
- GL account integration
- Approval workflow settings

**Transaction Types:**
- Inflow (subscriptions, interest, dividends)
- Outflow (investments, distributions, expenses)
- Internal (transfers, adjustments, allocations)

**Default Categories:**
- Capital Transactions
- Fee Transactions
- Investment Transactions
- Operating Expenses
- Interest & Income

## Integration with Redux Store

All components integrate with the Redux store for state management:

```tsx
// Store slice: fundFamilySlice.ts
export interface FundFamily {
  id: number;
  name: string;
  code: string;
  description?: string;
  managementCompany: string;
  primaryCurrency: string;
  fiscalYearEnd: string;
  status: 'active' | 'inactive' | 'archived';
  settings?: Record<string, any>;
  // Additional computed fields
  totalAUM?: number;
  fundCount?: number;
  investorCount?: number;
  averageIRR?: number;
}

// Available actions
- fetchFundFamilies()
- fetchFundFamilyById(id)
- createFundFamily(data)
- updateFundFamily({id, data})
- deleteFundFamily(id)
- fetchFundFamilySummary(id)
```

## API Integration

Components integrate with the existing API service layer:

```tsx
// API endpoints used
fundFamilyAPI.getAll(params)      // GET /api/fund-families
fundFamilyAPI.getById(id)         // GET /api/fund-families/:id
fundFamilyAPI.getSummary(id)      // GET /api/fund-families/:id/summary
fundFamilyAPI.create(data)        // POST /api/fund-families
fundFamilyAPI.update(id, data)    // PATCH /api/fund-families/:id
fundFamilyAPI.delete(id)          // DELETE /api/fund-families/:id
fundFamilyAPI.addUser(id, userId) // POST /api/fund-families/:id/users
```

## Styling and Theming

Components use Material-UI v5 with consistent styling:

```tsx
// Theme integration
const theme = useTheme();

// Consistent color palette
colors: {
  primary: '#1976d2',
  secondary: '#dc004e',
  success: '#2e7d32',
  warning: '#ed6c02',
  error: '#d32f2f',
  info: '#0288d1'
}

// Responsive breakpoints
breakpoints: {
  xs: 0,
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536
}
```

## Accessibility Features

All components include comprehensive accessibility support:

- ARIA labels and roles
- Keyboard navigation
- Screen reader support
- High contrast mode compatibility
- Focus management
- Semantic HTML structure

## Performance Optimizations

Components are optimized for performance:

- React.memo for component memoization
- useMemo for expensive calculations
- useCallback for event handlers
- Lazy loading for large datasets
- Virtualization for long lists
- Debounced search inputs

## Testing

Components include comprehensive testing:

```bash
# Run tests
npm test

# Test coverage
npm test -- --coverage

# E2E tests
npm run test:e2e
```

## Usage Examples

### Basic Dashboard Usage

```tsx
import { Routes, Route } from 'react-router-dom';
import FundFamilyDashboard from './components/fund-family/dashboard/FundFamilyDashboard';

function App() {
  return (
    <Routes>
      <Route path="/fund-families/dashboard" element={<FundFamilyDashboard />} />
    </Routes>
  );
}
```

### List View with Custom Actions

```tsx
import EnhancedFundFamilyList from './components/fund-family/management/EnhancedFundFamilyList';

function FundFamiliesPage() {
  return (
    <div>
      <EnhancedFundFamilyList />
    </div>
  );
}
```

### Configuration Interface

```tsx
import FundConfiguration from './components/fund-family/configuration/FundConfiguration';

function ConfigurationPage() {
  return (
    <Routes>
      <Route path="/fund-families/:id/configuration" element={<FundConfiguration />} />
    </Routes>
  );
}
```

## Migration from Existing Components

If you have existing fund family components, follow these steps:

1. **Backup existing components**
2. **Update imports** to use new component paths
3. **Update props** to match new interfaces
4. **Test functionality** with new components
5. **Gradually migrate** features to new components

## Best Practices

1. **Use TypeScript interfaces** for all props and data structures
2. **Implement error boundaries** around complex components
3. **Add loading states** for all async operations
4. **Validate user input** with Yup schemas
5. **Follow Material-UI patterns** for consistent UI
6. **Implement proper accessibility** features
7. **Add comprehensive tests** for all functionality

## Support

For questions or issues with these components:

1. Check the component documentation
2. Review the TypeScript interfaces
3. Test with sample data
4. Check browser console for errors
5. Refer to Material-UI documentation for styling issues

## Version History

- **v1.0.0** - Initial release with all components
- All components support Material-UI v5+
- Requires React 18+
- Compatible with TypeScript 4.9+

## Dependencies

Required packages:
```json
{
  "@mui/material": "^5.x",
  "@mui/icons-material": "^5.x",
  "@dnd-kit/core": "^6.x",
  "@dnd-kit/sortable": "^8.x",
  "@dnd-kit/utilities": "^3.x",
  "formik": "^2.x",
  "yup": "^1.x",
  "recharts": "^2.x",
  "react-redux": "^8.x",
  "@reduxjs/toolkit": "^1.x"
}
```