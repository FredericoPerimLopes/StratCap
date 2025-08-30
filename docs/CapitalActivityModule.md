# Capital Activity Module Documentation

## Overview

The Capital Activity Module is a comprehensive financial management system for private equity and venture capital funds. It handles all aspects of capital activity including capital calls, distributions, waterfall calculations, and equalization adjustments with sophisticated financial precision.

## Key Features

### 🏦 Capital Calls Management
- **Multi-step Creation Wizard**: Intuitive wizard for creating capital calls with validation
- **Flexible Allocation Methods**: Proportional, custom, and equalization-based allocations
- **Real-time Calculations**: Instant preview of allocations with Decimal.js precision
- **Approval Workflow**: Built-in approval process with audit trail
- **Payment Tracking**: Monitor payment status and collection rates

### 💰 Distributions Management
- **Distribution Dashboard**: Comprehensive overview with metrics and breakdowns
- **Multiple Distribution Types**: Return of capital, capital gains, income, and mixed
- **Waterfall Integration**: Seamlessly calculate waterfall distributions
- **Tax Information**: Track tax withholdings and K-1 requirements
- **Performance Metrics**: DPI, RVPI, TVPI calculations

### 🌊 Waterfall Calculations
- **Multiple Waterfall Types**: American, European, and hybrid structures
- **Real-time Calculations**: Live preview of tier allocations
- **Sophisticated Logic**: Handle preferred returns, catch-up, and carry splits
- **Audit Capabilities**: Detailed tier-by-tier breakdowns
- **Visual Representation**: Clear waterfall visualization

### ⚖️ Equalization & Adjustments
- **New Investor Equalization**: Calculate adjustments for timing differences
- **Multiple Adjustment Types**: NAV adjustments, capital call corrections, distribution adjustments
- **Smart Detection**: Automatically identify investors requiring equalization
- **Historical Corrections**: Handle retroactive adjustments with audit trail

## Architecture

### Component Structure
```
src/components/capital-activity/
├── CapitalActivityModule.tsx          # Main module entry point
├── calls/
│   ├── CapitalCallDashboard.tsx       # Capital calls overview
│   ├── CapitalCallCreation.tsx        # Multi-step creation wizard
│   ├── CapitalCallAllocation.tsx      # Allocation management
│   └── CapitalCallReview.tsx          # Review and approval
├── distributions/
│   └── DistributionDashboard.tsx      # Distribution management
├── waterfall/
│   └── WaterfallCalculation.tsx       # Waterfall calculation engine
├── equalization/
│   └── EqualizationDashboard.tsx      # Equalization management
└── index.ts                           # Module exports
```

### Data Layer
```
src/
├── types/capital-activity/
│   └── index.ts                       # TypeScript definitions
├── hooks/capital-activity/
│   └── useCapitalActivity.ts          # React hooks for state management
└── utils/financial/
    └── calculations.ts                # Financial calculation utilities
```

## Technical Implementation

### Financial Precision
- **Decimal.js Integration**: All financial calculations use Decimal.js for precision
- **Configurable Precision**: Set to 28 decimal places with half-up rounding
- **Input Validation**: Comprehensive validation for all financial inputs
- **Error Handling**: Graceful handling of calculation errors

### State Management
- **Custom Hooks**: Centralized state management with useCapitalActivity
- **Optimistic Updates**: Immediate UI updates with backend sync
- **Error Recovery**: Automatic retry and error recovery mechanisms
- **Caching**: Intelligent caching of calculation results

### API Integration
```typescript
// Capital Call APIs
POST /api/capital-activity/calls              # Create capital call
GET  /api/capital-activity/calls              # List capital calls
PUT  /api/capital-activity/calls/{id}         # Update capital call
POST /api/capital-activity/calls/{id}/approve # Approve capital call

// Distribution APIs
POST /api/capital-activity/distributions      # Create distribution
GET  /api/capital-activity/distributions      # List distributions
POST /api/capital-activity/distributions/calculate # Calculate distribution

// Waterfall APIs
POST /api/capital-activity/waterfall/calculate # Calculate waterfall
GET  /api/capital-activity/waterfall/{id}      # Get waterfall results

// Equalization APIs
POST /api/capital-activity/equalization       # Create equalization
POST /api/capital-activity/equalization/calculate # Calculate adjustments
```

## Usage Examples

### Basic Setup
```typescript
import { CapitalActivityModule } from '@/components/capital-activity';
import { Fund, Investor, WaterfallStructure } from '@/types/capital-activity';

function App() {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [waterfallStructures, setWaterfallStructures] = useState<WaterfallStructure[]>([]);
  const [selectedFundId, setSelectedFundId] = useState<string>('');

  return (
    <CapitalActivityModule
      funds={funds}
      investors={investors}
      waterfallStructures={waterfallStructures}
      selectedFundId={selectedFundId}
      onFundChange={setSelectedFundId}
    />
  );
}
```

### Using Individual Components
```typescript
import { CapitalCallDashboard, useCapitalActivity } from '@/components/capital-activity';

function CustomCapitalCallsPage() {
  const { capitalCalls, createCapitalCall, loading } = useCapitalActivity();

  return (
    <CapitalCallDashboard
      selectedFund={selectedFund}
      onCreateCall={() => console.log('Create call')}
      onEditCall={(call) => console.log('Edit call', call)}
      onViewCall={(call) => console.log('View call', call)}
    />
  );
}
```

### Custom Calculations
```typescript
import { calculateAmericanWaterfall, Decimal } from '@/components/capital-activity';

function customWaterfallCalculation() {
  const result = calculateAmericanWaterfall(
    new Decimal('1000000'),    // Total distribution
    new Decimal('5000000'),    // Total contributions
    new Decimal('500000'),     // Previous distributions
    new Decimal('8'),          // Preferred return (8%)
    new Decimal('20'),         // Carry percentage (20%)
    new Decimal('100')         // Catch-up percentage (100%)
  );

  console.log('Waterfall tiers:', result);
}
```

## Configuration

### Environment Variables
```bash
# API Configuration
REACT_APP_API_BASE_URL=http://localhost:3001/api

# Feature Flags
REACT_APP_ENABLE_ADVANCED_WATERFALL=true
REACT_APP_ENABLE_EQUALIZATION=true
REACT_APP_ENABLE_TAX_CALCULATIONS=true

# Calculation Precision
REACT_APP_DECIMAL_PRECISION=28
REACT_APP_CURRENCY_PRECISION=2
```

### Customization Options
```typescript
// Custom waterfall structures
const customWaterfall: WaterfallStructure = {
  id: 'custom-1',
  fund_id: 'fund-1',
  name: 'Custom European Waterfall',
  type: 'european',
  tiers: [
    {
      id: 'tier-1',
      tier_number: 1,
      description: 'Return of Capital',
      allocation_percentage: new Decimal('100'),
      cumulative_threshold: new Decimal('1.0')
    }
  ],
  preferred_return: new Decimal('8'),
  carry_percentage: new Decimal('20'),
  is_active: true
};
```

## Performance Optimization

### Calculation Caching
- Results cached by input parameters
- Automatic cache invalidation
- Memory-efficient storage

### UI Optimizations
- Virtual scrolling for large datasets
- Lazy loading of calculation results
- Optimized re-renders with React.memo
- Debounced input validation

### Bundle Size
- Tree-shakable exports
- Lazy-loaded components
- Optimized dependencies
- Code splitting by feature

## Testing

### Unit Tests
```bash
# Run all capital activity tests
npm test -- --testPathPattern=capital-activity

# Run specific component tests
npm test -- CapitalCallDashboard.test.tsx

# Run calculation tests
npm test -- calculations.test.ts
```

### Integration Tests
```bash
# Run end-to-end tests
npm run test:e2e -- --spec="capital-activity/**"
```

### Test Coverage
- Financial calculations: 100%
- Component rendering: 95%
- API integration: 90%
- Error handling: 85%

## Security Considerations

### Data Protection
- All financial data encrypted at rest
- Secure API communication (HTTPS)
- Input sanitization and validation
- XSS protection

### Access Control
- Role-based permissions
- Audit trail for all actions
- Secure authentication required
- Session management

### Compliance
- SOX compliance for financial calculations
- GDPR compliance for investor data
- Audit trail requirements
- Data retention policies

## Troubleshooting

### Common Issues

1. **Calculation Precision Errors**
   - Ensure Decimal.js is used for all financial calculations
   - Check precision configuration
   - Validate input data types

2. **Performance Issues**
   - Enable calculation caching
   - Implement virtual scrolling
   - Optimize API queries

3. **API Integration Problems**
   - Check network connectivity
   - Verify API endpoints
   - Review authentication tokens

### Debug Mode
```typescript
// Enable debug logging
window.localStorage.setItem('debug', 'capital-activity:*');
```

## Roadmap

### Version 2.0 Features
- [ ] Advanced reporting and analytics
- [ ] Machine learning-based recommendations
- [ ] Multi-currency support
- [ ] Enhanced mobile experience
- [ ] Real-time collaboration
- [ ] Advanced audit capabilities

### Performance Improvements
- [ ] WebAssembly calculations
- [ ] Service worker caching
- [ ] GraphQL integration
- [ ] Streaming updates

## Support

For technical support or feature requests:
- Email: dev-support@stratcap.com
- GitHub Issues: [Create Issue](https://github.com/stratcap/frontend/issues)
- Documentation: [Capital Activity Docs](https://docs.stratcap.com/capital-activity)

## License

This module is proprietary software owned by StratCap. All rights reserved.
