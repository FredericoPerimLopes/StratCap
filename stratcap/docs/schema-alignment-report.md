# Schema Alignment Analysis Report

## Executive Summary

This report analyzes the alignment between frontend form components and backend model schemas in the StratCap application. The analysis identifies discrepancies in field naming conventions, data types, validation rules, and missing mappings that could lead to API communication failures or data inconsistencies.

## Key Findings

### ✅ Well-Aligned Models
- **InvestorEntity**: Nearly perfect alignment with minimal issues
- **Fund**: Good alignment with consistent field mapping
- **API Types**: Well-defined TypeScript interfaces matching backend schemas

### ⚠️ Models with Issues
- **CapitalActivity**: Critical field name mismatch (`type` vs `eventType`)
- **FeeCalculation**: Missing required backend fields in frontend form
- **JournalEntry**: Complex nested structure with potential field mismatches

---

## Detailed Analysis by Model

## 1. InvestorForm ↔ InvestorEntity

### ✅ Alignment Status: **GOOD**

**Correctly Aligned Fields:**
- ✅ `name` (string, required)
- ✅ `legalName` (string, required)
- ✅ `type` (enum: individual|institution|fund|trust|other)
- ✅ `domicile` (string(2), required)
- ✅ `accreditedInvestor` (boolean, default: false)
- ✅ `qualifiedPurchaser` (boolean, default: false)
- ✅ `kycStatus` (enum: pending|approved|rejected|expired)
- ✅ `amlStatus` (enum: pending|approved|rejected|expired)
- ✅ All optional address and contact fields
- ✅ Date handling for `kycDate` and `amlDate`

**Minor Issues:**
- ⚠️ Frontend validation allows any email format, backend uses `isEmail: true` validator
- ⚠️ Frontend has client-side defaults that might not match backend defaults

---

## 2. FundForm ↔ Fund Model

### ✅ Alignment Status: **GOOD**

**Correctly Aligned Fields:**
- ✅ `fundFamilyId` (number, required)
- ✅ `name` (string, required)
- ✅ `code` (string, required)
- ✅ `type` (enum: master|feeder|parallel|subsidiary)
- ✅ `vintage` (number, required)
- ✅ `currency` (string(3), default: USD)
- ✅ `status` (enum: fundraising|investing|harvesting|closed)

**Data Type Consistency:**
- ✅ Financial fields (`targetSize`, `hardCap`, fee rates) handled as strings for Decimal precision
- ✅ Date fields (`investmentPeriodEnd`, `termEnd`) properly formatted

**Minor Issues:**
- ⚠️ Frontend hardcodes `fundFamilyId: 1` as default - should use dropdown
- ⚠️ Fee rate validation could be more strict (backend uses DECIMAL(5,4))

---

## 3. CapitalActivityForm ↔ CapitalActivity Model

### ❌ Alignment Status: **CRITICAL ISSUES**

**Critical Mismatches:**
- 🚨 **Field Name Mismatch**: Frontend uses `type`, Backend expects `eventType`
  ```typescript
  // Frontend
  type: 'capital_call' | 'distribution' | 'equalization' | 'reallocation'
  
  // Backend
  eventType: 'capital_call' | 'distribution' | 'equalization' | 'reallocation'
  ```

**Data Type Issues:**
- 🚨 Frontend uses `number` for amounts, Backend expects `string` (for Decimal)
  ```typescript
  // Frontend
  baseAmount: number
  feeAmount: number
  expenseAmount: number
  
  // Backend
  baseAmount: string  // DECIMAL(20,2)
  feeAmount: string   // DECIMAL(20,2)
  expenseAmount: string // DECIMAL(20,2)
  ```

**Missing Backend Fields in Frontend:**
- ❌ `currency` (string(3), default: USD)
- ❌ `purpose` (TEXT, optional)
- ❌ `notices` (JSONB, optional)
- ❌ `calculations` (JSONB, optional)

**Required Fixes:**
1. Rename `type` → `eventType` in frontend
2. Convert number fields to string before API calls
3. Add missing optional fields
4. Update TypeScript interfaces

---

## 4. Commitment Model Analysis

### ✅ Alignment Status: **GOOD** (No dedicated frontend form found)

**API Type Interface Correctly Defined:**
- ✅ All backend fields properly typed in `/frontend/src/types/api.ts`
- ✅ Decimal fields handled as strings
- ✅ Enum values match backend exactly
- ✅ Optional fields properly marked

---

## 5. Transaction Model Analysis

### ✅ Alignment Status: **GOOD** (No dedicated frontend form found)

**API Type Interface Correctly Defined:**
- ✅ Comprehensive TypeScript interface matching backend
- ✅ All enum values align with backend
- ✅ Decimal precision handled correctly
- ✅ Optional fields properly typed

---

## 6. FeeCalculationForm ↔ FeeCalculation Model

### ⚠️ Alignment Status: **MODERATE ISSUES**

**Missing Required Backend Fields:**
- ❌ `calculationDate` (Date, required, default: NOW)
- ❌ `grossFeeAmount` (string/DECIMAL, required)
- ❌ `netFeeAmount` (string/DECIMAL, required)

**Correctly Aligned Fields:**
- ✅ `fundId` (but frontend uses string, backend uses number)
- ✅ `feeType` (enum alignment)
- ✅ `periodStartDate` / `periodEndDate`
- ✅ `basis` (enum alignment)
- ✅ `basisAmount` and `feeRate`

**Required Fixes:**
1. Add missing required fields to frontend form
2. Convert `fundId` from string to number
3. Implement calculation logic for gross/net amounts
4. Add backend field validation

---

## 7. JournalEntryForm ↔ JournalEntry Model

### ⚠️ Alignment Status: **COMPLEX ISSUES**

**Frontend vs Backend Field Mismatches:**
```typescript
// Frontend Interface (simplified)
interface JournalEntryLineItem {
  glAccountId: string;        // Backend: number
  debitAmount: string;
  creditAmount: string;
}

// Backend Model
interface JournalEntryLineItemAttributes {
  glAccountId: number;        // Frontend: string  
  debitAmount: string;        // ✅ Aligned
  creditAmount: string;       // ✅ Aligned  
}
```

**Missing Backend Fields in Frontend:**
- ❌ `entryNumber` (auto-generated)
- ❌ `createdBy` (should be from auth context)
- ❌ `totalDebitAmount` / `totalCreditAmount` (calculated fields)
- ❌ `status` (defaults to 'draft')

**Complex Nested Structure:**
- ⚠️ Frontend handles line items as array, backend expects proper foreign key relationships
- ⚠️ Frontend validation for balance checking aligns with backend logic

**Required Fixes:**
1. Convert `glAccountId` from string to number
2. Add missing required fields (createdBy from auth)
3. Ensure proper calculation of totals
4. Handle auto-generated fields properly

---

## Naming Convention Analysis

### Database to API Field Mapping Issues

**Snake Case (DB) vs Camel Case (API) Inconsistencies:**

| Frontend Field | Backend DB Column | Status |
|---|---|---|
| `fundFamilyId` | `fund_family_id` | ✅ Converted by Sequelize |
| `investorEntityId` | `investor_entity_id` | ✅ Converted by Sequelize |
| `eventType` | `event_type` | ✅ Converted by Sequelize |
| `primaryEmail` | `primary_email` | ✅ Converted by Sequelize |

**Field Name Mismatches:**
- 🚨 `CapitalActivity.type` (frontend) ≠ `eventType` (backend)

---

## Data Type Consistency Analysis

### Decimal/Monetary Fields

**Correctly Handled (String for Precision):**
- ✅ Fund financial fields (`targetSize`, `hardCap`, fee rates)
- ✅ Commitment amounts (`commitmentAmount`, `capitalCalled`, etc.)
- ✅ Transaction amounts (`amount`, `baseAmount`)
- ✅ Journal entry amounts (`debitAmount`, `creditAmount`)

**Inconsistent Handling:**
- ❌ CapitalActivity amounts (frontend: number, backend: string)
- ❌ FeeCalculation `fundId` (frontend: string, backend: number)

### Date Field Handling

**Correctly Handled:**
- ✅ Date formatting utilities in `/utils/validation.ts`
- ✅ `formatDateForBackend()` converts to ISO string
- ✅ `formatDateForInput()` handles form input format

### Boolean Fields

**Correctly Handled:**
- ✅ All boolean flags properly typed and defaulted
- ✅ Checkbox handling in forms aligns with backend expectations

---

## Validation Schema Alignment

### Frontend Yup Schemas vs Backend Joi/Sequelize

**InvestorEntity Validation:**
- ✅ Required fields match
- ✅ Email validation present in both
- ✅ String length constraints align (domicile: length 2)
- ✅ Enum values exactly match

**Fund Validation:**
- ✅ Required field validation matches
- ✅ Numeric ranges align (vintage: 1900-2100)
- ✅ Currency code length validation (3 chars)

**CapitalActivity Validation:**
- ❌ Frontend validates `type`, backend expects `eventType`
- ❌ Amount validation types don't match (number vs string)

---

## Lookup Field Relationships

### Foreign Key Consistency

**Correctly Handled:**
- ✅ `Fund.fundFamilyId` → `FundFamilies.id`
- ✅ `Commitment.fundId` → `Funds.id`
- ✅ `Commitment.investorEntityId` → `InvestorEntities.id`
- ✅ `Transaction.commitmentId` → `Commitments.id`

**Potential Issues:**
- ⚠️ JournalEntry `glAccountId` type mismatch (string vs number)
- ⚠️ Some forms hardcode IDs instead of using lookups

---

## API Response Structure Analysis

### Consistent API Response Format

```typescript
interface APIResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: PaginationInfo;
}
```

**Correctly Handled:**
- ✅ All frontend code expects this structure
- ✅ Error handling accounts for nested `response.data.data`
- ✅ Pagination structure is consistent

---

## Recommended Fixes by Priority

### 🚨 Critical Fixes (Breaking Issues)

1. **CapitalActivityForm Field Mismatch**
   ```typescript
   // Fix: Rename field
   type: 'capital_call' → eventType: 'capital_call'
   
   // Update form data interface
   interface CapitalActivityFormData {
     eventType: 'capital_call' | 'distribution' | 'equalization' | 'reallocation';
     // ... rest of fields
   }
   ```

2. **CapitalActivity Amount Type Conversion**
   ```typescript
   // Fix: Convert numbers to strings before API calls
   const submitData = {
     ...formData,
     baseAmount: formData.baseAmount.toString(),
     feeAmount: formData.feeAmount.toString(),
     expenseAmount: formData.expenseAmount.toString(),
   };
   ```

3. **JournalEntry glAccountId Type Fix**
   ```typescript
   // Fix: Convert string to number
   glAccountId: parseInt(lineItem.glAccountId)
   ```

### ⚠️ High Priority Fixes

4. **Add Missing FeeCalculation Fields**
   ```typescript
   interface FeeCalculationFormData {
     // Add missing required fields
     calculationDate: Date;
     grossFeeAmount: string;
     netFeeAmount: string;
     // ... existing fields
   }
   ```

5. **FundForm Dynamic FundFamily Dropdown**
   ```typescript
   // Replace hardcoded default with API call
   const [fundFamilies, setFundFamilies] = useState<FundFamily[]>([]);
   ```

6. **Add Missing CapitalActivity Fields**
   ```typescript
   interface CapitalActivityFormData {
     // Add optional backend fields
     currency: string;
     purpose?: string;
     notices?: Record<string, any>;
     calculations?: Record<string, any>;
   }
   ```

### 📋 Medium Priority Fixes

7. **Strengthen Validation Rules**
   - Add more precise decimal validation (match backend precision)
   - Add cross-field validation (date ranges, amount totals)
   - Implement server-side validation error handling

8. **Improve Type Safety**
   - Use branded types for IDs to prevent mixing different entity IDs
   - Add runtime type checking for API responses
   - Implement proper error boundary handling

### 🔧 Low Priority Improvements

9. **Code Quality Improvements**
   - Standardize form component structure
   - Extract common validation patterns
   - Implement consistent error message formatting

10. **Documentation Updates**
    - Update API documentation with field mappings
    - Add validation rule documentation
    - Create field mapping reference guide

---

## Testing Recommendations

### 1. Schema Validation Tests
```typescript
// Test field mapping between frontend forms and backend models
describe('Schema Alignment', () => {
  test('CapitalActivity form maps correctly to backend model', () => {
    const formData = { type: 'capital_call', baseAmount: 100000 };
    const backendData = mapToBackendFormat(formData);
    expect(backendData.eventType).toBe('capital_call');
    expect(backendData.baseAmount).toBe('100000');
  });
});
```

### 2. API Integration Tests
```typescript
// Test actual API calls with form data
describe('API Integration', () => {
  test('InvestorForm creates valid backend entity', async () => {
    const formData = createMockInvestorForm();
    const response = await createInvestor(formData);
    expect(response.success).toBe(true);
  });
});
```

### 3. Type Safety Tests
```typescript
// Compile-time type checking tests
describe('Type Safety', () => {
  test('Form data types match API interfaces', () => {
    const formData: InvestorFormData = createMockForm();
    const apiData: InvestorEntity = mapFormToApi(formData);
    // Should compile without type errors
  });
});
```

---

## Conclusion

The StratCap application has a generally well-structured approach to frontend-backend schema alignment, with comprehensive TypeScript interfaces and consistent API response formats. However, there are critical issues in the CapitalActivity model and several medium-priority issues that need attention.

**Key Success Factors:**
- Strong TypeScript type system
- Consistent API response structure  
- Good separation of concerns between form logic and API calls
- Comprehensive validation schemas

**Priority Actions:**
1. **Immediate**: Fix CapitalActivity field name mismatch and data types
2. **Short-term**: Add missing required fields to FeeCalculation form
3. **Medium-term**: Implement comprehensive schema validation testing
4. **Long-term**: Establish automated schema alignment checking in CI/CD

**Impact Assessment:**
- **High Risk**: CapitalActivity API calls will fail due to field mismatch
- **Medium Risk**: FeeCalculation operations may not save properly 
- **Low Risk**: Minor type inconsistencies may cause data formatting issues

This analysis provides a roadmap for ensuring robust frontend-backend integration and preventing data consistency issues in production.