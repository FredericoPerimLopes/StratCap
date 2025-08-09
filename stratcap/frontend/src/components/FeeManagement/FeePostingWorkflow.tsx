import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { feeAPI } from '../../services/api';
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  InformationCircleIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CalculatorIcon,
  CreditCardIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';

interface FeePostingData {
  fundId: number;
  calculationId?: number;
  postingDate: string;
  effectiveDate: string;
  feeType: 'management' | 'carried_interest' | 'other';
  amount: number;
  description: string;
  accountingEntries: Array<{
    accountCode: string;
    accountName: string;
    debit: number;
    credit: number;
    description: string;
  }>;
  approvals: {
    requireApproval: boolean;
    approvers: number[];
    notes: string;
  };
  reconciliation: {
    bankAccount: string;
    reference: string;
    expectedAmount: number;
    actualAmount: number;
    variance: number;
  };
}

interface FeeCalculation {
  id: number;
  fundId: number;
  fundName: string;
  feeType: string;
  calculationDate: string;
  periodStart: string;
  periodEnd: string;
  baseAmount: number;
  feeRate: number;
  calculatedAmount: number;
  status: string;
  isPosted: boolean;
}

interface AccountingEntry {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description: string;
}

const STEPS = [
  { id: 1, name: 'Select Calculation', icon: CalculatorIcon },
  { id: 2, name: 'Review Details', icon: DocumentTextIcon },
  { id: 3, name: 'Accounting Entries', icon: BookOpenIcon },
  { id: 4, name: 'Reconciliation', icon: CreditCardIcon },
  { id: 5, name: 'Approval & Post', icon: CheckCircleIcon }
];

const FeePostingWorkflow: React.FC = () => {
  const navigate = useNavigate();
  const { calculationId: paramCalculationId } = useParams<{ calculationId: string }>();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calculations, setCalculations] = useState<FeeCalculation[]>([]);
  const [selectedCalculation, setSelectedCalculation] = useState<FeeCalculation | null>(null);
  
  const [formData, setFormData] = useState<FeePostingData>({
    fundId: 0,
    calculationId: paramCalculationId ? parseInt(paramCalculationId) : undefined,
    postingDate: new Date().toISOString().split('T')[0],
    effectiveDate: new Date().toISOString().split('T')[0],
    feeType: 'management',
    amount: 0,
    description: '',
    accountingEntries: [],
    approvals: {
      requireApproval: true,
      approvers: [],
      notes: ''
    },
    reconciliation: {
      bankAccount: '',
      reference: '',
      expectedAmount: 0,
      actualAmount: 0,
      variance: 0
    }
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (formData.calculationId) {
      const calc = calculations.find(c => c.id === formData.calculationId);
      if (calc) {
        setSelectedCalculation(calc);
        setFormData(prev => ({
          ...prev,
          fundId: calc.fundId,
          feeType: calc.feeType as any,
          amount: calc.calculatedAmount,
          description: `${calc.feeType} fee posting for ${calc.fundName} (${calc.periodStart} to ${calc.periodEnd})`,
          reconciliation: {
            ...prev.reconciliation,
            expectedAmount: calc.calculatedAmount
          }
        }));
        generateAccountingEntries(calc);
      }
    }
  }, [formData.calculationId, calculations]);

  useEffect(() => {
    // Calculate variance when actual amount changes
    const variance = formData.reconciliation.actualAmount - formData.reconciliation.expectedAmount;
    setFormData(prev => ({
      ...prev,
      reconciliation: {
        ...prev.reconciliation,
        variance
      }
    }));
  }, [formData.reconciliation.actualAmount, formData.reconciliation.expectedAmount]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      
      // Fetch pending fee calculations
      await fetchPendingCalculations();
      
      if (paramCalculationId) {
        setFormData(prev => ({ ...prev, calculationId: parseInt(paramCalculationId) }));
      }
    } catch (err: any) {
      setError('Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingCalculations = async () => {
    try {
      // This would typically fetch calculations that haven't been posted yet
      // For now, we'll create some mock data
      const mockCalculations: FeeCalculation[] = [
        {
          id: 1,
          fundId: 1,
          fundName: 'Growth Fund III',
          feeType: 'management',
          calculationDate: '2023-12-31',
          periodStart: '2023-10-01',
          periodEnd: '2023-12-31',
          baseAmount: 50000000,
          feeRate: 2.0,
          calculatedAmount: 250000,
          status: 'calculated',
          isPosted: false
        },
        {
          id: 2,
          fundId: 2,
          fundName: 'Venture Fund IV',
          feeType: 'management',
          calculationDate: '2023-12-31',
          periodStart: '2023-10-01',
          periodEnd: '2023-12-31',
          baseAmount: 30000000,
          feeRate: 2.0,
          calculatedAmount: 150000,
          status: 'calculated',
          isPosted: false
        },
        {
          id: 3,
          fundId: 1,
          fundName: 'Growth Fund III',
          feeType: 'carried_interest',
          calculationDate: '2023-12-31',
          periodStart: '2023-01-01',
          periodEnd: '2023-12-31',
          baseAmount: 5000000,
          feeRate: 20.0,
          calculatedAmount: 1000000,
          status: 'calculated',
          isPosted: false
        }
      ];
      
      setCalculations(mockCalculations);
    } catch (err) {
      console.error('Failed to fetch pending calculations:', err);
    }
  };

  const generateAccountingEntries = (calculation: FeeCalculation) => {
    const entries: AccountingEntry[] = [];
    
    if (calculation.feeType === 'management') {
      entries.push(
        {
          accountCode: '6001',
          accountName: 'Management Fee Expense',
          debit: calculation.calculatedAmount,
          credit: 0,
          description: 'Management fee expense'
        },
        {
          accountCode: '2001',
          accountName: 'Accrued Management Fees',
          debit: 0,
          credit: calculation.calculatedAmount,
          description: 'Accrued management fee liability'
        }
      );
    } else if (calculation.feeType === 'carried_interest') {
      entries.push(
        {
          accountCode: '6002',
          accountName: 'Carried Interest Expense',
          debit: calculation.calculatedAmount,
          credit: 0,
          description: 'Carried interest expense'
        },
        {
          accountCode: '2002',
          accountName: 'Accrued Carried Interest',
          debit: 0,
          credit: calculation.calculatedAmount,
          description: 'Accrued carried interest liability'
        }
      );
    }
    
    setFormData(prev => ({ ...prev, accountingEntries: entries }));
  };

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.calculationId) {
          errors.calculationId = 'Please select a fee calculation';
        }
        break;

      case 2:
        if (!formData.description.trim()) {
          errors.description = 'Description is required';
        }
        if (formData.amount <= 0) {
          errors.amount = 'Amount must be greater than 0';
        }
        break;

      case 3:
        const totalDebits = formData.accountingEntries.reduce((sum, entry) => sum + entry.debit, 0);
        const totalCredits = formData.accountingEntries.reduce((sum, entry) => sum + entry.credit, 0);
        if (Math.abs(totalDebits - totalCredits) > 0.01) {
          errors.entries = 'Total debits must equal total credits';
        }
        break;

      case 4:
        if (!formData.reconciliation.bankAccount.trim()) {
          errors.bankAccount = 'Bank account is required';
        }
        if (Math.abs(formData.reconciliation.variance) > 0.01) {
          errors.variance = 'Variance must be resolved before posting';
        }
        break;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handlePost = async () => {
    if (!validateStep(5)) return;

    setPosting(true);
    try {
      if (formData.calculationId) {
        await feeAPI.postFeeCalculation(formData.calculationId);
        navigate('/fee-management', { 
          state: { message: 'Fee calculation posted successfully' }
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to post fee calculation');
    } finally {
      setPosting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Select Fee Calculation</h3>
              <p className="text-sm text-gray-600 mb-6">
                Choose a calculated fee that is ready to be posted to the general ledger.
              </p>
            </div>

            <div className="space-y-4">
              {calculations.length === 0 ? (
                <div className="text-center py-8">
                  <CalculatorIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No pending calculations</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    There are no fee calculations ready for posting.
                  </p>
                </div>
              ) : (
                calculations.map(calc => (
                  <div
                    key={calc.id}
                    onClick={() => setFormData(prev => ({ ...prev, calculationId: calc.id }))}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.calculationId === calc.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <h4 className="font-medium text-gray-900">{calc.fundName}</h4>
                          <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            calc.feeType === 'management' 
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {calc.feeType.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          <p>Period: {new Date(calc.periodStart).toLocaleDateString()} - {new Date(calc.periodEnd).toLocaleDateString()}</p>
                          <p>Base Amount: ${calc.baseAmount.toLocaleString()}</p>
                          <p>Rate: {calc.feeRate}%</p>
                          <p className="font-medium">Calculated Fee: ${calc.calculatedAmount.toLocaleString()}</p>
                        </div>
                      </div>
                      {formData.calculationId === calc.id && (
                        <CheckIcon className="h-6 w-6 text-indigo-600 ml-4" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {validationErrors.calculationId && (
              <p className="text-sm text-red-600">{validationErrors.calculationId}</p>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Review Posting Details</h3>
              <p className="text-sm text-gray-600 mb-6">
                Review and confirm the details for this fee posting.
              </p>
            </div>

            {selectedCalculation && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Selected Calculation</h4>
                <div className="text-sm text-blue-700">
                  <p><strong>Fund:</strong> {selectedCalculation.fundName}</p>
                  <p><strong>Type:</strong> {selectedCalculation.feeType.replace('_', ' ')}</p>
                  <p><strong>Period:</strong> {new Date(selectedCalculation.periodStart).toLocaleDateString()} - {new Date(selectedCalculation.periodEnd).toLocaleDateString()}</p>
                  <p><strong>Amount:</strong> ${selectedCalculation.calculatedAmount.toLocaleString()}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Posting Date *
                </label>
                <input
                  type="date"
                  value={formData.postingDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, postingDate: e.target.value }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Effective Date *
                </label>
                <input
                  type="date"
                  value={formData.effectiveDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, effectiveDate: e.target.value }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Amount ($) *
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: Number(e.target.value) }))}
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                    validationErrors.amount ? 'border-red-300' : ''
                  }`}
                  min="0"
                  step="0.01"
                />
                {validationErrors.amount && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.amount}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Fee Type
                </label>
                <select
                  value={formData.feeType}
                  onChange={(e) => setFormData(prev => ({ ...prev, feeType: e.target.value as any }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  disabled={!!selectedCalculation}
                >
                  <option value="management">Management Fee</option>
                  <option value="carried_interest">Carried Interest</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Description *
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                    validationErrors.description ? 'border-red-300' : ''
                  }`}
                  placeholder="Description of the fee posting..."
                />
                {validationErrors.description && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Accounting Entries</h3>
              <p className="text-sm text-gray-600 mb-6">
                Review the journal entries that will be posted to the general ledger.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <InformationCircleIcon className="h-5 w-5 text-blue-400 mt-0.5" />
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-800">Auto-Generated Entries</h4>
                  <div className="text-sm text-blue-700 mt-1">
                    These accounting entries have been automatically generated based on the fee type and amount.
                    You can modify them if needed.
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Account
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Debit
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Credit
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {formData.accountingEntries.map((entry, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{entry.accountCode}</div>
                          <div className="text-sm text-gray-500">{entry.accountName}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="text"
                          value={entry.description}
                          onChange={(e) => {
                            const updatedEntries = [...formData.accountingEntries];
                            updatedEntries[index] = { ...updatedEntries[index], description: e.target.value };
                            setFormData(prev => ({ ...prev, accountingEntries: updatedEntries }));
                          }}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <input
                          type="number"
                          value={entry.debit}
                          onChange={(e) => {
                            const newDebit = Number(e.target.value);
                            const updatedEntries = [...formData.accountingEntries];
                            updatedEntries[index] = { ...updatedEntries[index], debit: newDebit };
                            setFormData(prev => ({ ...prev, accountingEntries: updatedEntries }));
                          }}
                          className="w-32 text-right border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          min="0"
                          step="0.01"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <input
                          type="number"
                          value={entry.credit}
                          onChange={(e) => {
                            const newCredit = Number(e.target.value);
                            const updatedEntries = [...formData.accountingEntries];
                            updatedEntries[index] = { ...updatedEntries[index], credit: newCredit };
                            setFormData(prev => ({ ...prev, accountingEntries: updatedEntries }));
                          }}
                          className="w-32 text-right border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          min="0"
                          step="0.01"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr className="font-medium">
                    <td colSpan={2} className="px-6 py-3 text-right text-sm text-gray-900">
                      Totals:
                    </td>
                    <td className="px-6 py-3 text-right text-sm text-gray-900">
                      ${formData.accountingEntries.reduce((sum, entry) => sum + entry.debit, 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-3 text-right text-sm text-gray-900">
                      ${formData.accountingEntries.reduce((sum, entry) => sum + entry.credit, 0).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {validationErrors.entries && (
              <p className="text-sm text-red-600">{validationErrors.entries}</p>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Reconciliation</h3>
              <p className="text-sm text-gray-600 mb-6">
                Reconcile the calculated amount with actual bank records before posting.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Bank Account *
                </label>
                <select
                  value={formData.reconciliation.bankAccount}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    reconciliation: { ...prev.reconciliation, bankAccount: e.target.value }
                  }))}
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                    validationErrors.bankAccount ? 'border-red-300' : ''
                  }`}
                >
                  <option value="">Select bank account...</option>
                  <option value="OPERATING-001">Operating Account - 001</option>
                  <option value="OPERATING-002">Operating Account - 002</option>
                  <option value="MGMT-FEE">Management Fee Account</option>
                </select>
                {validationErrors.bankAccount && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.bankAccount}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Reference Number
                </label>
                <input
                  type="text"
                  value={formData.reconciliation.reference}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    reconciliation: { ...prev.reconciliation, reference: e.target.value }
                  }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Bank transaction reference"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Expected Amount
                </label>
                <input
                  type="number"
                  value={formData.reconciliation.expectedAmount}
                  readOnly
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-50 sm:text-sm"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Actual Amount
                </label>
                <input
                  type="number"
                  value={formData.reconciliation.actualAmount}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    reconciliation: { ...prev.reconciliation, actualAmount: Number(e.target.value) }
                  }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className={`bg-gray-50 p-4 rounded-lg ${
              Math.abs(formData.reconciliation.variance) > 0.01 ? 'border-2 border-yellow-300' : ''
            }`}>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Variance:</span>
                <span className={`text-lg font-semibold ${
                  Math.abs(formData.reconciliation.variance) > 0.01 ? 'text-red-600' : 'text-green-600'
                }`}>
                  ${formData.reconciliation.variance.toLocaleString()}
                </span>
              </div>
              {Math.abs(formData.reconciliation.variance) > 0.01 && (
                <p className="mt-2 text-sm text-yellow-800">
                  <ExclamationTriangleIcon className="h-4 w-4 inline mr-1" />
                  Variance detected. Please review and resolve before posting.
                </p>
              )}
            </div>

            {validationErrors.variance && (
              <p className="text-sm text-red-600">{validationErrors.variance}</p>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Approval & Post</h3>
              <p className="text-sm text-gray-600 mb-6">
                Final review and approval before posting to the general ledger.
              </p>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Fee Posting Summary
                </h3>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Fund</dt>
                    <dd className="mt-1 text-sm text-gray-900">{selectedCalculation?.fundName}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Fee Type</dt>
                    <dd className="mt-1 text-sm text-gray-900 capitalize">{formData.feeType.replace('_', ' ')}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Amount</dt>
                    <dd className="mt-1 text-sm text-gray-900">${formData.amount.toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Posting Date</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(formData.postingDate).toLocaleDateString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Effective Date</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(formData.effectiveDate).toLocaleDateString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Bank Account</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formData.reconciliation.bankAccount}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Description</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formData.description}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">Approval Settings</h4>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.approvals.requireApproval}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    approvals: { ...prev.approvals, requireApproval: e.target.checked }
                  }))}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Require approval before posting</span>
              </label>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Approval Notes
                </label>
                <textarea
                  rows={3}
                  value={formData.approvals.notes}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    approvals: { ...prev.approvals, notes: e.target.value }
                  }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Optional notes for the approver..."
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading && currentStep === 1) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/fee-management')}
          className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ChevronLeftIcon className="h-4 w-4 mr-1" />
          Back to Fee Management
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Post Fee Calculation</h1>
        <p className="mt-1 text-sm text-gray-600">
          Follow the steps below to post a fee calculation to the general ledger.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <nav aria-label="Progress">
          <ol role="list" className="flex items-center">
            {STEPS.map((step, stepIdx) => (
              <li key={step.name} className={`relative ${stepIdx !== STEPS.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  {stepIdx !== STEPS.length - 1 && (
                    <div className={`h-0.5 w-full ${currentStep > step.id ? 'bg-indigo-600' : 'bg-gray-200'}`} />
                  )}
                </div>
                <a
                  className={`relative w-8 h-8 flex items-center justify-center rounded-full ${
                    currentStep > step.id
                      ? 'bg-indigo-600 text-white'
                      : currentStep === step.id
                      ? 'border-2 border-indigo-600 bg-white text-indigo-600'
                      : 'border-2 border-gray-300 bg-white text-gray-400'
                  }`}
                >
                  {currentStep > step.id ? (
                    <CheckIcon className="w-5 h-5" aria-hidden="true" />
                  ) : (
                    <step.icon className="w-5 h-5" aria-hidden="true" />
                  )}
                </a>
                <span className="absolute top-10 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-500 whitespace-nowrap">
                  {step.name}
                </span>
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* Step Content */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 1}
          className="flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeftIcon className="h-4 w-4 mr-1" />
          Previous
        </button>

        {currentStep < STEPS.length ? (
          <button
            onClick={handleNext}
            className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Next
            <ChevronRightIcon className="h-4 w-4 ml-1" />
          </button>
        ) : (
          <button
            onClick={handlePost}
            disabled={posting}
            className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
          >
            {posting ? (
              <>
                <ClockIcon className="h-4 w-4 mr-1 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <CheckIcon className="h-4 w-4 mr-1" />
                Post to General Ledger
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default FeePostingWorkflow;