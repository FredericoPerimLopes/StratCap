# StratCap Backend Testing Documentation

## Overview

This document provides comprehensive information about the testing strategy, setup, and execution for the StratCap backend application.

## Test Coverage Summary

### Backend Test Coverage

#### Unit Tests
- **Waterfall Calculation Service** - `tests/waterfall.test.ts`
  - Basic waterfall distribution calculations
  - Preferred return calculations
  - Carried interest calculations
  - Catch-up provisions
  - Tier validation and audit trails
  - Edge cases and error handling
  - Performance tests with large datasets

- **Capital Activity Management** - `tests/capitalActivity.test.ts`
  - Capital call creation and processing
  - Distribution creation and allocation
  - Activity status management
  - Pro-rata allocation calculations
  - Error handling and validation

- **Fee Management** - `tests/feeManagement.test.ts`
  - Management fee calculations (quarterly, annual)
  - Carried interest fee calculations
  - Fee offset creation and application
  - Fee approval workflows
  - Decimal precision handling

- **Fund Management** - `tests/funds.test.ts`
  - Fund creation and validation
  - Fund performance metrics
  - Fund analytics (IRR, multiple, DPI, TVPI)
  - Fund lifecycle management
  - Error handling

- **Investor Management** - `tests/investors.test.ts`
  - Investor entity creation
  - Commitment management
  - Portfolio performance tracking
  - Distribution history
  - Investor analytics

#### Integration Tests
- **API Integration** - `tests/integration.test.ts`
  - Complete fund lifecycle workflow
  - Fee calculation and approval process
  - Investor portfolio management
  - End-to-end data consistency
  - Error handling across modules

#### Performance Tests
- **Load Testing** - `tests/performance.test.ts`
  - Waterfall calculations with 100-1000 investors
  - Concurrent calculation processing
  - Memory usage optimization
  - Decimal precision performance
  - Database query simulation

### Frontend Test Coverage

#### Component Tests
- **Layout Components** - `src/__tests__/components/layout.test.tsx`
  - Header functionality and user display
  - Sidebar navigation and menu items
  - Layout responsiveness
  - Accessibility features

- **Common Components** - `src/__tests__/components/common.test.tsx`
  - Loading spinner variations
  - Button interactions and states
  - Modal functionality
  - Data table with pagination
  - Form field validation

## Test Architecture

### Test Structure
```
stratcap/backend/tests/
├── setup.ts                 # Global test configuration
├── waterfall.test.ts        # Waterfall calculation tests
├── capitalActivity.test.ts  # Capital activity tests
├── feeManagement.test.ts    # Fee management tests
├── funds.test.ts           # Fund management tests
├── investors.test.ts       # Investor management tests
├── integration.test.ts     # Integration tests
└── performance.test.ts     # Performance and load tests

stratcap/frontend/src/__tests__/
├── components/
│   ├── layout.test.tsx     # Layout component tests
│   └── common.test.tsx     # Common component tests
├── pages/                  # Page component tests
└── services/               # Service layer tests
```

### Test Configuration

#### Backend Configuration
- **Framework**: Jest with ts-jest
- **Mocking**: Extensive model and service mocking
- **Coverage**: Line, branch, and function coverage
- **Timeout**: 30 seconds for database operations

#### Frontend Configuration
- **Framework**: Jest with React Testing Library
- **Environment**: jsdom for DOM simulation
- **Mocking**: Browser APIs and external dependencies

## Test Categories

### 1. Unit Tests
Focus on individual functions and methods in isolation.

**Key Areas Tested:**
- Mathematical calculations (waterfall, fees)
- Business logic validation
- Data transformation
- Error handling

**Coverage Target**: 85%+ for core business logic

### 2. Integration Tests
Test complete workflows and module interactions.

**Key Scenarios:**
- Fund creation → Investor onboarding → Capital calls → Distributions
- Fee calculation → Approval → Application
- Waterfall calculation → Distribution allocation

**Coverage Target**: 75%+ for critical paths

### 3. Performance Tests
Ensure system performance under load.

**Key Metrics:**
- Waterfall calculation: <2s for 100 investors, <5s for 500 investors
- Fee calculations: <100ms per calculation
- Concurrent operations: 10 parallel calculations <3s
- Memory usage: <50MB increase for large datasets

### 4. Component Tests
Test React components in isolation and integration.

**Key Areas:**
- User interactions (clicks, form submissions)
- State management
- Props handling
- Error boundaries
- Accessibility

## Test Data Management

### Mock Data Strategy
- **Deterministic**: Consistent test data for reliable results
- **Realistic**: Data that mirrors production scenarios
- **Scalable**: Easy generation of large datasets for performance tests

### Test Database
- In-memory SQLite for fast test execution
- Fresh database for each test suite
- Transaction rollback for test isolation

## Running Tests

### Backend Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- waterfall.test.ts

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm run test:watch

# Run specific test pattern
npm test -- --testNamePattern="waterfall"

# Run integration tests only
npm test -- integration.test.ts

# Run performance tests
npm test -- performance.test.ts
```

### Frontend Tests

```bash
# Run all frontend tests
cd frontend && npm test

# Run specific component tests
npm test -- layout.test.tsx

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e
```

## Coverage Reports

### Backend Coverage Targets
- **Statements**: 80%+
- **Branches**: 75%+
- **Functions**: 85%+
- **Lines**: 80%+

### Critical Components (90%+ coverage required)
- WaterfallCalculationService
- FeeService and related services
- Fund and Investor controllers
- Capital activity processing

### Coverage Exclusions
- Database migration files
- Configuration files
- Type definitions
- Development utilities

## Test Best Practices

### 1. Test Naming
```typescript
describe('WaterfallCalculationService', () => {
  describe('calculateWaterfall', () => {
    it('should calculate basic waterfall distribution correctly', () => {
      // Test implementation
    });
    
    it('should handle fund not found error', () => {
      // Error case test
    });
  });
});
```

### 2. Arrange-Act-Assert Pattern
```typescript
it('should calculate management fee correctly', async () => {
  // Arrange
  const baseAmount = new Decimal('1000000');
  const rate = new Decimal('2.0');
  
  // Act
  const result = await service.calculateQuarterlyFee(baseAmount, rate, startDate, endDate);
  
  // Assert
  expect(result.feeAmount.toString()).toBe('5000');
});
```

### 3. Comprehensive Error Testing
```typescript
it('should handle database connection errors gracefully', async () => {
  MockedModel.findByPk.mockRejectedValue(new Error('Database connection failed'));
  
  await expect(service.someMethod()).rejects.toThrow('Database connection failed');
});
```

### 4. Performance Testing
```typescript
it('should complete calculation within time limit', async () => {
  const startTime = performance.now();
  
  await service.calculateWaterfall(largeDataset);
  
  const endTime = performance.now();
  expect(endTime - startTime).toBeLessThan(2000); // 2 seconds
});
```

## Continuous Integration

### Test Pipeline
1. **Lint and Type Check**: ESLint and TypeScript checks
2. **Unit Tests**: Fast feedback on individual components
3. **Integration Tests**: Verify module interactions
4. **Performance Tests**: Ensure no regression in performance
5. **Coverage Report**: Generate and upload coverage reports

### Quality Gates
- All tests must pass
- Coverage thresholds must be met
- No critical performance regressions
- Security scan passes

## Debugging Tests

### Common Issues and Solutions

#### 1. Database Connection Issues
```typescript
// Solution: Ensure proper test database setup
beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});
```

#### 2. Mock Not Working
```typescript
// Solution: Reset mocks between tests
afterEach(() => {
  jest.clearAllMocks();
});
```

#### 3. Async Test Issues
```typescript
// Solution: Proper async/await usage
it('should handle async operation', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});
```

#### 4. Precision Issues with Decimal
```typescript
// Solution: Use string comparison for exact matches
expect(result.toString()).toBe('123.45');
// Or use approximate comparison
expect(result.toNumber()).toBeCloseTo(123.45, 2);
```

## Test Maintenance

### Regular Tasks
1. **Update test data** when business rules change
2. **Review coverage reports** monthly
3. **Performance benchmark updates** quarterly
4. **Mock maintenance** when APIs change

### Refactoring Guidelines
- Keep tests independent and isolated
- Update tests when refactoring production code
- Maintain test documentation
- Remove obsolete tests promptly

## Reporting

### Coverage Reports
Generated automatically and stored in `coverage/` directory:
- HTML report: `coverage/lcov-report/index.html`
- LCOV data: `coverage/lcov.info`
- JSON report: `coverage/coverage-final.json`

### Performance Reports
Logged to console and can be collected for analysis:
```
Waterfall calculation for 100 investors took: 1250.42ms
10 concurrent waterfall calculations took: 2850.67ms
Memory increase after 10 large calculations: 12.34MB
```

## Future Enhancements

### Planned Test Improvements
1. **Visual Regression Tests** for frontend components
2. **API Contract Testing** with tools like Pact
3. **Load Testing** with realistic production data
4. **Security Testing** for authentication and authorization
5. **Accessibility Testing** automation

### Test Infrastructure
1. **Parallel Test Execution** for faster CI/CD
2. **Test Data Factories** for better data management
3. **Snapshot Testing** for complex objects
4. **Mutation Testing** for test quality assessment

---

*This testing documentation is maintained alongside the codebase and should be updated when test strategies or infrastructure changes.*