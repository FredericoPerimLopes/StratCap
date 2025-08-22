import * as yup from 'yup';

// Validation schemas matching backend Joi schemas

export const fundSchema = yup.object().shape({
  fundFamilyId: yup.number().positive().required('Fund family is required'),
  name: yup.string().required('Fund name is required'),
  code: yup.string().required('Fund code is required'),
  type: yup.string().oneOf(['master', 'feeder', 'parallel', 'subsidiary']).required('Fund type is required'),
  vintage: yup.number().integer().min(1900).max(2100).required('Vintage year is required'),
  targetSize: yup.string().required('Target size is required'),
  hardCap: yup.string(),
  managementFeeRate: yup.string().required('Management fee rate is required'),
  carriedInterestRate: yup.string().required('Carried interest rate is required'),
  preferredReturnRate: yup.string().required('Preferred return rate is required'),
  investmentPeriodEnd: yup.date(),
  termEnd: yup.date(),
  extensionPeriods: yup.number().integer().min(0),
  extensionLength: yup.number().integer().min(0),
  currency: yup.string().length(3).default('USD'),
  status: yup.string().oneOf(['fundraising', 'investing', 'harvesting', 'closed']),
  settings: yup.object()
});

export const investorSchema = yup.object().shape({
  name: yup.string().required('Name is required'),
  legalName: yup.string().required('Legal name is required'),
  type: yup.string().oneOf(['individual', 'institution', 'fund', 'trust', 'other']).required('Type is required'),
  entityType: yup.string(),
  taxId: yup.string(),
  registrationNumber: yup.string(),
  domicile: yup.string().length(2).required('Domicile is required'),
  taxResidence: yup.string().length(2),
  accreditedInvestor: yup.boolean().default(false),
  qualifiedPurchaser: yup.boolean().default(false),
  address: yup.string(),
  city: yup.string(),
  state: yup.string(),
  postalCode: yup.string(),
  country: yup.string(),
  primaryContact: yup.string(),
  primaryEmail: yup.string().email('Invalid email format'),
  primaryPhone: yup.string(),
  notes: yup.string(),
  metadata: yup.object()
});

export const commitmentSchema = yup.object().shape({
  fundId: yup.number().positive().required('Fund is required'),
  investorEntityId: yup.number().positive().required('Investor is required'),
  investorClassId: yup.number().positive().required('Investor class is required'),
  commitmentAmount: yup.string().required('Commitment amount is required'),
  commitmentDate: yup.date().required('Commitment date is required'),
  closingId: yup.number().positive(),
  sideLetterTerms: yup.object(),
  feeOverrides: yup.object(),
  notes: yup.string(),
  metadata: yup.object()
});

export const capitalActivitySchema = yup.object().shape({
  fundId: yup.number().positive().required('Fund is required'),
  eventType: yup.string().oneOf(['capital_call', 'distribution', 'equalization', 'reallocation']).required('Event type is required'),
  eventNumber: yup.string().required('Event number is required'),
  eventDate: yup.date().required('Event date is required'),
  dueDate: yup.date(),
  description: yup.string().required('Description is required'),
  totalAmount: yup.string().required('Total amount is required'),
  baseAmount: yup.string(),
  feeAmount: yup.string(),
  expenseAmount: yup.string(),
  currency: yup.string().length(3).default('USD'),
  purpose: yup.string(),
  notices: yup.object(),
  calculations: yup.object(),
  notes: yup.string(),
  metadata: yup.object()
});

export const transactionSchema = yup.object().shape({
  fundId: yup.number().positive().required('Fund is required'),
  commitmentId: yup.number().positive().required('Commitment is required'),
  capitalActivityId: yup.number().positive(),
  transactionDate: yup.date().required('Transaction date is required'),
  effectiveDate: yup.date().required('Effective date is required'),
  transactionType: yup.string().oneOf(['capital_call', 'distribution', 'fee', 'expense', 'equalization', 'transfer', 'adjustment']).required('Transaction type is required'),
  transactionCode: yup.string().required('Transaction code is required'),
  description: yup.string().required('Description is required'),
  amount: yup.string().required('Amount is required'),
  currency: yup.string().length(3).default('USD'),
  baseAmount: yup.string(),
  exchangeRate: yup.string(),
  direction: yup.string().oneOf(['debit', 'credit']).required('Direction is required'),
  category: yup.string(),
  subCategory: yup.string(),
  glAccountCode: yup.string(),
  batchId: yup.string(),
  referenceNumber: yup.string(),
  notes: yup.string(),
  metadata: yup.object()
});

// Date formatting utilities
export const formatDateForBackend = (date: Date | string | undefined): string | undefined => {
  if (!date) return undefined;
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString();
};

export const formatDateForDisplay = (date: Date | string | undefined): string => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString();
};

export const formatDateForInput = (date: Date | string | undefined): string => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString().split('T')[0];
};

// Decimal formatting utilities
export const formatDecimalForBackend = (value: string | number): string => {
  if (typeof value === 'string') return value;
  return value.toString();
};

export const formatDecimalForDisplay = (value: string | number, currency = 'USD'): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
};

export const formatPercentageForDisplay = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return `${num}%`;
};

// Form validation helper
export const validateForm = async <T>(schema: yup.ObjectSchema<any>, data: T): Promise<{ errors: Record<string, string>; isValid: boolean }> => {
  try {
    await schema.validate(data, { abortEarly: false });
    return { errors: {}, isValid: true };
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      const errors: Record<string, string> = {};
      error.inner.forEach((err) => {
        if (err.path) {
          errors[err.path] = err.message;
        }
      });
      return { errors, isValid: false };
    }
    return { errors: { general: 'Validation failed' }, isValid: false };
  }
};