import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { capitalActivityAPI, fundAPI, investorAPI, waterfallAPI } from '../../services/api';
import {
  CheckIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  InformationCircleIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ChartBarIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';

interface DistributionData {
  fundId: number;
  eventNumber: string;
  eventDate: string;
  dueDate: string;
  totalProceedsAmount: number;
  returnOfCapital: number;
  capitalGain: number;
  feeAmount: number;
  expenseAmount: number;
  description: string;
  exitDetails: {
    portfolioCompany: string;
    exitType: 'ipo' | 'acquisition' | 'secondary' | 'other';
    exitDate: string;
    exitValue: number;
    costBasis: number;
    multiple: number;
    irr: number;
  };
  investors: Array<{
    investorId: number;
    returnOfCapital: number;
    capitalGain: number;
    carriedInterest: number;
    totalDistribution: number;
    taxWithholding: number;
  }>;
  waterfallCalculation: {
    useWaterfall: boolean;
    waterfallId?: number;
    calculationResults?: any;
  };
  notifications: {
    sendEmail: boolean;
    sendSMS: boolean;
    customMessage: string;
  };
  approvals: {
    requireDualApproval: boolean;
    approvers: number[];
  };
}

interface Fund {
  id: number;
  name: string;
  totalCommitments: number;
  totalDrawdowns: number;
  totalDistributions: number;
  netAssetValue: number;
  investors: number[];
}

interface Investor {
  id: number;
  name: string;
  email: string;
  phone: string;
  commitment: number;
  calledCapital: number;
  distributedCapital: number;
  currentInvestment: number;
  percentage: number;
}

const STEPS = [
  { id: 1, name: 'Fund Selection', icon: DocumentTextIcon },
  { id: 2, name: 'Exit Details', icon: ChartBarIcon },
  { id: 3, name: 'Distribution Details', icon: CurrencyDollarIcon },
  { id: 4, name: 'Waterfall Calculation', icon: BanknotesIcon },
  { id: 5, name: 'Investor Allocation', icon: UserGroupIcon },
  { id: 6, name: 'Schedule & Approvals', icon: CalendarIcon },
  { id: 7, name: 'Review & Submit', icon: CheckCircleIcon }
];

const DistributionWorkflow: React.FC = () => {
  const navigate = useNavigate();
  const { fundId: paramFundId } = useParams<{ fundId: string }>();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [selectedFund, setSelectedFund] = useState<Fund | null>(null);
  
  const [formData, setFormData] = useState<DistributionData>({
    fundId: paramFundId ? parseInt(paramFundId) : 0,
    eventNumber: '',
    eventDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    totalProceedsAmount: 0,
    returnOfCapital: 0,
    capitalGain: 0,
    feeAmount: 0,
    expenseAmount: 0,
    description: '',
    exitDetails: {
      portfolioCompany: '',
      exitType: 'acquisition',
      exitDate: new Date().toISOString().split('T')[0],
      exitValue: 0,
      costBasis: 0,
      multiple: 0,
      irr: 0
    },
    investors: [],
    waterfallCalculation: {
      useWaterfall: true,
      waterfallId: undefined,
      calculationResults: null
    },
    notifications: {
      sendEmail: true,
      sendSMS: false,
      customMessage: ''
    },
    approvals: {
      requireDualApproval: true,
      approvers: []
    }
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (formData.fundId && formData.fundId > 0) {
      const fund = funds.find(f => f.id === formData.fundId);
      setSelectedFund(fund || null);
      if (fund) {
        fetchFundInvestors(fund.id);
        generateEventNumber(fund);
      }
    }
  }, [formData.fundId, funds]);

  useEffect(() => {
    // Auto-calculate IRR and multiple when exit details change
    if (formData.exitDetails.exitValue > 0 && formData.exitDetails.costBasis > 0) {
      const multiple = formData.exitDetails.exitValue / formData.exitDetails.costBasis;
      setFormData(prev => ({
        ...prev,
        exitDetails: {
          ...prev.exitDetails,
          multiple: Number(multiple.toFixed(2))
        }
      }));
    }
  }, [formData.exitDetails.exitValue, formData.exitDetails.costBasis]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const fundsResponse = await fundAPI.getAll();
      setFunds(fundsResponse.data.data || []);
      
      if (paramFundId) {
        const fundId = parseInt(paramFundId);
        setFormData(prev => ({ ...prev, fundId }));
      }
    } catch (err: any) {
      setError('Failed to load funds data');
    } finally {
      setLoading(false);
    }
  };

  const fetchFundInvestors = async (fundId: number) => {
    try {
      const response = await investorAPI.getByFund(fundId);
      const investorData = response.data.data || [];
      
      setInvestors(investorData);
      
      // Initialize investor allocations
      const investorAllocations = investorData.map((investor: Investor) => ({
        investorId: investor.id,
        returnOfCapital: 0,
        capitalGain: 0,
        carriedInterest: 0,
        totalDistribution: 0,
        taxWithholding: 0
      }));
      
      setFormData(prev => ({
        ...prev,
        investors: investorAllocations
      }));
    } catch (err) {
      console.error('Failed to fetch fund investors:', err);
    }
  };

  const generateEventNumber = (fund: Fund) => {
    const year = new Date().getFullYear();
    const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    const eventNumber = `DIST-${fund.name.replace(/\s+/g, '').toUpperCase()}-${year}-${random}`;
    
    setFormData(prev => ({ ...prev, eventNumber }));
  };

  const calculateTotalDistribution = () => {
    return formData.returnOfCapital + formData.capitalGain - formData.feeAmount - formData.expenseAmount;
  };

  const runWaterfallCalculation = async () => {
    if (!selectedFund || formData.totalProceedsAmount <= 0) return;

    setLoading(true);
    try {
      const waterfallResponse = await waterfallAPI.calculateWaterfall({
        fundId: formData.fundId,
        totalProceedsAmount: formData.totalProceedsAmount,
        asOfDate: formData.eventDate,
        distributionScenario: 'standard'
      });

      const waterfallResults = waterfallResponse.data;
      
      setFormData(prev => ({
        ...prev,
        waterfallCalculation: {
          ...prev.waterfallCalculation,
          calculationResults: waterfallResults
        }
      }));

      // Auto-populate investor allocations from waterfall
      if (waterfallResults && waterfallResults.investorDistributions) {
        const updatedInvestors = prev.investors.map(investor => {
          const waterfallInvestor = waterfallResults.investorDistributions.find(
            (wi: any) => wi.investorId === investor.investorId
          );
          
          if (waterfallInvestor) {
            return {
              ...investor,
              returnOfCapital: waterfallInvestor.returnOfCapital || 0,
              capitalGain: waterfallInvestor.capitalGain || 0,
              carriedInterest: waterfallInvestor.carriedInterest || 0,
              totalDistribution: waterfallInvestor.totalDistribution || 0
            };
          }
          return investor;
        });

        setFormData(prev => ({
          ...prev,
          investors: updatedInvestors
        }));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to calculate waterfall');
    } finally {
      setLoading(false);
    }
  };

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.fundId) {
          errors.fundId = 'Please select a fund';
        }
        break;

      case 2:
        if (!formData.exitDetails.portfolioCompany.trim()) {
          errors.portfolioCompany = 'Portfolio company is required';
        }
        if (formData.exitDetails.exitValue <= 0) {
          errors.exitValue = 'Exit value must be greater than 0';
        }
        if (formData.exitDetails.costBasis <= 0) {
          errors.costBasis = 'Cost basis must be greater than 0';
        }
        break;

      case 3:
        if (!formData.eventNumber.trim()) {
          errors.eventNumber = 'Event number is required';
        }
        if (!formData.description.trim()) {
          errors.description = 'Description is required';
        }
        if (formData.totalProceedsAmount <= 0) {
          errors.totalProceedsAmount = 'Total proceeds must be greater than 0';
        }
        break;

      case 4:
        if (formData.waterfallCalculation.useWaterfall && !formData.waterfallCalculation.calculationResults) {
          errors.waterfall = 'Please run the waterfall calculation';
        }
        break;

      case 5:
        const totalDistribution = formData.investors.reduce((sum, inv) => sum + inv.totalDistribution, 0);
        const expectedTotal = calculateTotalDistribution();
        if (Math.abs(totalDistribution - expectedTotal) > 1) {
          errors.allocation = 'Investor distributions must equal total distribution amount';
        }
        break;

      case 6:
        if (!formData.eventDate) {
          errors.eventDate = 'Event date is required';
        }
        if (!formData.dueDate) {
          errors.dueDate = 'Due date is required';
        }
        if (new Date(formData.dueDate) <= new Date(formData.eventDate)) {
          errors.dueDate = 'Due date must be after event date';
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

  const handleSubmit = async () => {
    if (!validateStep(7)) return;

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        type: 'distribution' as const,
        totalAmount: calculateTotalDistribution(),
        status: 'draft' as const
      };

      await capitalActivityAPI.createDistribution(submitData);
      navigate('/capital-activities', { 
        state: { message: 'Distribution created successfully' }
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create distribution');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Select Fund</h3>
              <p className="text-sm text-gray-600 mb-6">
                Choose the fund from which you want to make a distribution.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {funds.map(fund => (
                <div
                  key={fund.id}
                  onClick={() => setFormData(prev => ({ ...prev, fundId: fund.id }))}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.fundId === fund.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{fund.name}</h4>
                      <div className="mt-2 text-sm text-gray-600">
                        <p>Total Drawdowns: ${fund.totalDrawdowns?.toLocaleString() || 0}</p>
                        <p>Previous Distributions: ${fund.totalDistributions?.toLocaleString() || 0}</p>
                        <p>Net Asset Value: ${fund.netAssetValue?.toLocaleString() || 0}</p>
                        <p>Investors: {fund.investors?.length || 0}</p>
                      </div>
                    </div>
                    {formData.fundId === fund.id && (
                      <CheckIcon className="h-6 w-6 text-indigo-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {validationErrors.fundId && (
              <p className="text-sm text-red-600">{validationErrors.fundId}</p>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Exit Details</h3>
              <p className="text-sm text-gray-600 mb-6">
                Enter the details of the exit that is generating this distribution.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Portfolio Company *
                </label>
                <input
                  type="text"
                  value={formData.exitDetails.portfolioCompany}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    exitDetails: { ...prev.exitDetails, portfolioCompany: e.target.value }
                  }))}
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                    validationErrors.portfolioCompany ? 'border-red-300' : ''
                  }`}
                  placeholder="e.g., TechCorp Inc."
                />
                {validationErrors.portfolioCompany && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.portfolioCompany}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Exit Type
                </label>
                <select
                  value={formData.exitDetails.exitType}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    exitDetails: { ...prev.exitDetails, exitType: e.target.value as any }
                  }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="acquisition">Acquisition</option>
                  <option value="ipo">IPO</option>
                  <option value="secondary">Secondary Sale</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Exit Date
                </label>
                <input
                  type="date"
                  value={formData.exitDetails.exitDate}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    exitDetails: { ...prev.exitDetails, exitDate: e.target.value }
                  }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Exit Value ($) *
                </label>
                <input
                  type="number"
                  value={formData.exitDetails.exitValue}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    exitDetails: { ...prev.exitDetails, exitValue: Number(e.target.value) }
                  }))}
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                    validationErrors.exitValue ? 'border-red-300' : ''
                  }`}
                  min="0"
                  step="0.01"
                />
                {validationErrors.exitValue && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.exitValue}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Cost Basis ($) *
                </label>
                <input
                  type="number"
                  value={formData.exitDetails.costBasis}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    exitDetails: { ...prev.exitDetails, costBasis: Number(e.target.value) }
                  }))}
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                    validationErrors.costBasis ? 'border-red-300' : ''
                  }`}
                  min="0"
                  step="0.01"
                />
                {validationErrors.costBasis && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.costBasis}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Multiple
                </label>
                <input
                  type="number"
                  value={formData.exitDetails.multiple}
                  readOnly
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-50 sm:text-sm"
                  step="0.01"
                />
                <p className="mt-1 text-xs text-gray-500">Auto-calculated from exit value and cost basis</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <InformationCircleIcon className="h-5 w-5 text-blue-400 mt-0.5" />
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-800">Performance Summary</h4>
                  <div className="text-sm text-blue-700 mt-1">
                    <p>Gross Proceeds: ${formData.exitDetails.exitValue.toLocaleString()}</p>
                    <p>Total Investment: ${formData.exitDetails.costBasis.toLocaleString()}</p>
                    <p>Gross Gain: ${(formData.exitDetails.exitValue - formData.exitDetails.costBasis).toLocaleString()}</p>
                    <p>Multiple: {formData.exitDetails.multiple}x</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Distribution Details</h3>
              <p className="text-sm text-gray-600 mb-6">
                Enter the details for this distribution.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Event Number *
                </label>
                <input
                  type="text"
                  value={formData.eventNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, eventNumber: e.target.value }))}
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                    validationErrors.eventNumber ? 'border-red-300' : ''
                  }`}
                  placeholder="e.g., DIST-FUND-2023-001"
                />
                {validationErrors.eventNumber && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.eventNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Total Proceeds ($) *
                </label>
                <input
                  type="number"
                  value={formData.totalProceedsAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalProceedsAmount: Number(e.target.value) }))}
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                    validationErrors.totalProceedsAmount ? 'border-red-300' : ''
                  }`}
                  min="0"
                  step="0.01"
                />
                {validationErrors.totalProceedsAmount && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.totalProceedsAmount}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Return of Capital ($)
                </label>
                <input
                  type="number"
                  value={formData.returnOfCapital}
                  onChange={(e) => setFormData(prev => ({ ...prev, returnOfCapital: Number(e.target.value) }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Capital Gain ($)
                </label>
                <input
                  type="number"
                  value={formData.capitalGain}
                  onChange={(e) => setFormData(prev => ({ ...prev, capitalGain: Number(e.target.value) }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Management Fee ($)
                </label>
                <input
                  type="number"
                  value={formData.feeAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, feeAmount: Number(e.target.value) }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Expenses ($)
                </label>
                <input
                  type="number"
                  value={formData.expenseAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, expenseAmount: Number(e.target.value) }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  min="0"
                  step="0.01"
                />
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
                  placeholder="Brief description of the distribution..."
                />
                {validationErrors.description && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Net Distribution:</span>
                <span className="text-lg font-semibold text-gray-900">
                  ${calculateTotalDistribution().toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Waterfall Calculation</h3>
              <p className="text-sm text-gray-600 mb-6">
                Configure and run the waterfall calculation to determine investor distributions.
              </p>
            </div>

            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.waterfallCalculation.useWaterfall}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    waterfallCalculation: { ...prev.waterfallCalculation, useWaterfall: e.target.checked }
                  }))}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Use waterfall calculation</span>
              </label>

              {formData.waterfallCalculation.useWaterfall && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-blue-800">Waterfall Parameters</h4>
                      <div className="text-sm text-blue-700 mt-1">
                        <p>Fund: {selectedFund?.name}</p>
                        <p>Total Proceeds: ${formData.totalProceedsAmount.toLocaleString()}</p>
                        <p>Distribution Date: {new Date(formData.eventDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <button
                      onClick={runWaterfallCalculation}
                      disabled={loading || formData.totalProceedsAmount <= 0}
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {loading ? 'Calculating...' : 'Run Calculation'}
                    </button>
                  </div>
                </div>
              )}

              {formData.waterfallCalculation.calculationResults && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-green-800 mb-2">Calculation Results</h4>
                  <div className="text-sm text-green-700">
                    <p>Return of Capital: ${formData.waterfallCalculation.calculationResults.totalReturnOfCapital?.toLocaleString() || 0}</p>
                    <p>Preferred Return: ${formData.waterfallCalculation.calculationResults.totalPreferredReturn?.toLocaleString() || 0}</p>
                    <p>Carried Interest: ${formData.waterfallCalculation.calculationResults.totalCarriedInterest?.toLocaleString() || 0}</p>
                    <p>LP Distribution: ${formData.waterfallCalculation.calculationResults.totalLPDistribution?.toLocaleString() || 0}</p>
                  </div>
                </div>
              )}

              {validationErrors.waterfall && (
                <p className="text-sm text-red-600">{validationErrors.waterfall}</p>
              )}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Investor Allocation</h3>
              <p className="text-sm text-gray-600 mb-6">
                Review and adjust individual investor distributions.
              </p>
            </div>

            {formData.waterfallCalculation.useWaterfall && formData.waterfallCalculation.calculationResults && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex">
                  <InformationCircleIcon className="h-5 w-5 text-blue-400 mt-0.5" />
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-blue-800">Waterfall-Based Allocations</h4>
                    <div className="text-sm text-blue-700 mt-1">
                      Distributions have been calculated using the fund's waterfall structure.
                      You can manually adjust individual amounts if needed.
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Investor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Return of Capital
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Capital Gain
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Carried Interest
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Distribution
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {formData.investors.map((investorAllocation, index) => {
                    const investor = investors.find(inv => inv.id === investorAllocation.investorId);
                    return (
                      <tr key={investorAllocation.investorId}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {investor?.name || 'Unknown Investor'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            value={investorAllocation.returnOfCapital}
                            onChange={(e) => {
                              const newAmount = Number(e.target.value);
                              const updatedInvestors = [...formData.investors];
                              updatedInvestors[index] = { 
                                ...updatedInvestors[index], 
                                returnOfCapital: newAmount,
                                totalDistribution: newAmount + updatedInvestors[index].capitalGain + updatedInvestors[index].carriedInterest
                              };
                              setFormData(prev => ({ ...prev, investors: updatedInvestors }));
                            }}
                            className="w-32 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            value={investorAllocation.capitalGain}
                            onChange={(e) => {
                              const newAmount = Number(e.target.value);
                              const updatedInvestors = [...formData.investors];
                              updatedInvestors[index] = { 
                                ...updatedInvestors[index], 
                                capitalGain: newAmount,
                                totalDistribution: updatedInvestors[index].returnOfCapital + newAmount + updatedInvestors[index].carriedInterest
                              };
                              setFormData(prev => ({ ...prev, investors: updatedInvestors }));
                            }}
                            className="w-32 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            value={investorAllocation.carriedInterest}
                            onChange={(e) => {
                              const newAmount = Number(e.target.value);
                              const updatedInvestors = [...formData.investors];
                              updatedInvestors[index] = { 
                                ...updatedInvestors[index], 
                                carriedInterest: newAmount,
                                totalDistribution: updatedInvestors[index].returnOfCapital + updatedInvestors[index].capitalGain + newAmount
                              };
                              setFormData(prev => ({ ...prev, investors: updatedInvestors }));
                            }}
                            className="w-32 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ${investorAllocation.totalDistribution.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Total Distributed:</span>
                <span className="text-lg font-semibold text-gray-900">
                  ${formData.investors.reduce((sum, inv) => sum + inv.totalDistribution, 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm font-medium text-gray-700">Expected Total:</span>
                <span className="text-lg font-semibold text-gray-900">
                  ${calculateTotalDistribution().toLocaleString()}
                </span>
              </div>
            </div>

            {validationErrors.allocation && (
              <p className="text-sm text-red-600">{validationErrors.allocation}</p>
            )}
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Schedule & Approvals</h3>
              <p className="text-sm text-gray-600 mb-6">
                Set dates and configure approval requirements.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Event Date *
                </label>
                <input
                  type="date"
                  value={formData.eventDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, eventDate: e.target.value }))}
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                    validationErrors.eventDate ? 'border-red-300' : ''
                  }`}
                />
                {validationErrors.eventDate && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.eventDate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Payment Date *
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                    validationErrors.dueDate ? 'border-red-300' : ''
                  }`}
                />
                {validationErrors.dueDate && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.dueDate}</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">Notifications</h4>
              
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.notifications.sendEmail}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, sendEmail: e.target.checked }
                    }))}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Send email notifications</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.notifications.sendSMS}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, sendSMS: e.target.checked }
                    }))}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Send SMS notifications</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Custom Message (Optional)
                </label>
                <textarea
                  rows={3}
                  value={formData.notifications.customMessage}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, customMessage: e.target.value }
                  }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Optional custom message for investors..."
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">Approval Settings</h4>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.approvals.requireDualApproval}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    approvals: { ...prev.approvals, requireDualApproval: e.target.checked }
                  }))}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Require dual approval</span>
              </label>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Review & Submit</h3>
              <p className="text-sm text-gray-600 mb-6">
                Review all details before submitting the distribution.
              </p>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Distribution Summary
                </h3>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Fund</dt>
                    <dd className="mt-1 text-sm text-gray-900">{selectedFund?.name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Event Number</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formData.eventNumber}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Portfolio Company</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formData.exitDetails.portfolioCompany}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Exit Type</dt>
                    <dd className="mt-1 text-sm text-gray-900 capitalize">{formData.exitDetails.exitType}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Exit Value</dt>
                    <dd className="mt-1 text-sm text-gray-900">${formData.exitDetails.exitValue.toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Multiple</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formData.exitDetails.multiple}x</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Net Distribution</dt>
                    <dd className="mt-1 text-sm text-gray-900">${calculateTotalDistribution().toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Investors</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formData.investors.length}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Event Date</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(formData.eventDate).toLocaleDateString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Payment Date</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(formData.dueDate).toLocaleDateString()}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Description</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formData.description}</dd>
                  </div>
                </dl>
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
          onClick={() => navigate('/capital-activities')}
          className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ChevronLeftIcon className="h-4 w-4 mr-1" />
          Back to Capital Activities
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Create Distribution</h1>
        <p className="mt-1 text-sm text-gray-600">
          Follow the steps below to create a new distribution for your investors.
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
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <ClockIcon className="h-4 w-4 mr-1 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <CheckIcon className="h-4 w-4 mr-1" />
                Create Distribution
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default DistributionWorkflow;