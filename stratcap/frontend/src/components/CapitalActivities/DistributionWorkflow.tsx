import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { capitalActivityAPI, fundAPI, investorAPI, waterfallAPI } from '../../services/api';
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
  UserGroupIcon,
  ScaleIcon
} from '@heroicons/react/24/outline';

interface DistributionData {
  fundId: number;
  distributionDate: string;
  recordDate: string;
  totalAmount: number;
  distributionType: 'return_of_capital' | 'profit_distribution' | 'liquidation';
  description: string;
  waterfall: {
    useWaterfall: boolean;
    calculationId?: number;
    totalProceeds: number;
    parameters: any;
  };
  allocations: Array<{
    investorId: number;
    investorName: string;
    ownershipPercentage: number;
    distributionAmount: number;
    netAmount: number;
    taxWithholding: number;
    fees: number;
  }>;
  taxHandling: {
    witholdingRequired: boolean;
    taxReportingRequired: boolean;
    k1Required: boolean;
  };
  approvals: {
    requireApproval: boolean;
    approvers: number[];
    notes: string;
  };
}

const STEPS = [
  { id: 1, name: 'Distribution Setup', icon: DocumentTextIcon },
  { id: 2, name: 'Waterfall Analysis', icon: ScaleIcon },
  { id: 3, name: 'Investor Allocations', icon: UserGroupIcon },
  { id: 4, name: 'Tax & Compliance', icon: CalculatorIcon },
  { id: 5, name: 'Review & Approve', icon: CheckCircleIcon }
];

const DistributionWorkflow: React.FC = () => {
  const navigate = useNavigate();
  const { fundId: paramFundId } = useParams<{ fundId: string }>();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [funds, setFunds] = useState<any[]>([]);
  const [investors, setInvestors] = useState<any[]>([]);
  const [selectedFund, setSelectedFund] = useState<any>(null);
  
  const [formData, setFormData] = useState<DistributionData>({
    fundId: paramFundId ? parseInt(paramFundId) : 0,
    distributionDate: new Date().toISOString().split('T')[0],
    recordDate: new Date().toISOString().split('T')[0],
    totalAmount: 0,
    distributionType: 'return_of_capital',
    description: '',
    waterfall: {
      useWaterfall: true,
      totalProceeds: 0,
      parameters: {}
    },
    allocations: [],
    taxHandling: {
      witholdingRequired: false,
      taxReportingRequired: true,
      k1Required: true
    },
    approvals: {
      requireApproval: true,
      approvers: [],
      notes: ''
    }
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (formData.fundId) {
      const fund = funds.find(f => f.id === formData.fundId);
      setSelectedFund(fund);
      fetchFundInvestors(formData.fundId);
    }
  }, [formData.fundId, funds]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [fundsResponse] = await Promise.all([
        fundAPI.getAll()
      ]);
      
      setFunds(fundsResponse.data.data || []);
    } catch (err: any) {
      setError('Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  const fetchFundInvestors = async (fundId: number) => {
    try {
      const response = await investorAPI.getByFund(fundId);
      setInvestors(response.data.data || []);
      
      // Initialize allocations based on current commitments
      const initialAllocations = (response.data.data || []).map((investor: any) => ({
        investorId: investor.id,
        investorName: investor.name,
        ownershipPercentage: investor.ownershipPercentage || 0,
        distributionAmount: 0,
        netAmount: 0,
        taxWithholding: 0,
        fees: 0
      }));
      
      setFormData(prev => ({ ...prev, allocations: initialAllocations }));
    } catch (err: any) {
      console.error('Failed to fetch fund investors:', err);
    }
  };

  const calculateWaterfall = async () => {
    if (!formData.fundId || formData.totalAmount <= 0) return;

    setLoading(true);
    try {
      const response = await waterfallAPI.calculateWaterfall({
        fundId: formData.fundId,
        totalProceedsAmount: formData.totalAmount,
        asOfDate: formData.distributionDate,
        distributionScenario: formData.distributionType
      });

      const calculation = response.data.data;
      
      // Update allocations based on waterfall calculation
      const updatedAllocations = formData.allocations.map(allocation => {
        const waterfallAllocation = calculation.allocations?.find(
          (wa: any) => wa.investorId === allocation.investorId
        );
        
        if (waterfallAllocation) {
          return {
            ...allocation,
            distributionAmount: waterfallAllocation.distributionAmount,
            netAmount: waterfallAllocation.distributionAmount - allocation.taxWithholding - allocation.fees
          };
        }
        
        return allocation;
      });

      setFormData(prev => ({
        ...prev,
        allocations: updatedAllocations,
        waterfall: {
          ...prev.waterfall,
          calculationId: calculation.id
        }
      }));
    } catch (err: any) {
      setError('Failed to calculate waterfall distribution');
    } finally {
      setLoading(false);
    }
  };

  const calculateProRataAllocations = () => {
    const totalOwnership = formData.allocations.reduce((sum, allocation) => sum + allocation.ownershipPercentage, 0);
    
    const updatedAllocations = formData.allocations.map(allocation => {
      const distributionAmount = (allocation.ownershipPercentage / totalOwnership) * formData.totalAmount;
      return {
        ...allocation,
        distributionAmount,
        netAmount: distributionAmount - allocation.taxWithholding - allocation.fees
      };
    });

    setFormData(prev => ({ ...prev, allocations: updatedAllocations }));
  };

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.fundId) {
          errors.fundId = 'Please select a fund';
        }
        if (formData.totalAmount <= 0) {
          errors.totalAmount = 'Distribution amount must be greater than 0';
        }
        if (!formData.description.trim()) {
          errors.description = 'Description is required';
        }
        break;

      case 2:
        if (formData.waterfall.useWaterfall && !formData.waterfall.calculationId) {
          errors.waterfall = 'Please run waterfall calculation';
        }
        break;

      case 3:
        const totalAllocated = formData.allocations.reduce((sum, allocation) => sum + allocation.distributionAmount, 0);
        if (Math.abs(totalAllocated - formData.totalAmount) > 0.01) {
          errors.allocations = 'Total allocations must equal distribution amount';
        }
        break;

      case 4:
        if (formData.taxHandling.witholdingRequired) {
          const hasWithholding = formData.allocations.some(allocation => allocation.taxWithholding > 0);
          if (!hasWithholding) {
            errors.taxWithholding = 'Tax withholding amounts required';
          }
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
    if (!validateStep(5)) return;

    setProcessing(true);
    try {
      await capitalActivityAPI.createDistribution({
        ...formData,
        eventType: 'distribution',
        status: formData.approvals.requireApproval ? 'pending_approval' : 'approved'
      });
      
      navigate('/capital-activities', { 
        state: { message: 'Distribution created successfully' }
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create distribution');
    } finally {
      setProcessing(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Distribution Setup</h3>
              <p className="text-sm text-gray-600 mb-6">
                Configure the basic parameters for this distribution.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Fund *
                </label>
                <select
                  value={formData.fundId}
                  onChange={(e) => setFormData(prev => ({ ...prev, fundId: Number(e.target.value) }))}
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                    validationErrors.fundId ? 'border-red-300' : ''
                  }`}
                >
                  <option value="">Select fund...</option>
                  {funds.map(fund => (
                    <option key={fund.id} value={fund.id}>{fund.name}</option>
                  ))}
                </select>
                {validationErrors.fundId && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.fundId}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Distribution Type *
                </label>
                <select
                  value={formData.distributionType}
                  onChange={(e) => setFormData(prev => ({ ...prev, distributionType: e.target.value as any }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="return_of_capital">Return of Capital</option>
                  <option value="profit_distribution">Profit Distribution</option>
                  <option value="liquidation">Liquidation Distribution</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Total Distribution Amount ($) *
                </label>
                <input
                  type="number"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalAmount: Number(e.target.value) }))}
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                    validationErrors.totalAmount ? 'border-red-300' : ''
                  }`}
                  min="0"
                  step="0.01"
                />
                {validationErrors.totalAmount && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.totalAmount}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Distribution Date *
                </label>
                <input
                  type="date"
                  value={formData.distributionDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, distributionDate: e.target.value }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Record Date *
                </label>
                <input
                  type="date"
                  value={formData.recordDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, recordDate: e.target.value }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                  placeholder="Description of the distribution..."
                />
                {validationErrors.description && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Waterfall Analysis</h3>
              <p className="text-sm text-gray-600 mb-6">
                Determine how to allocate the distribution among investors.
              </p>
            </div>

            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.waterfall.useWaterfall}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    waterfall: { ...prev.waterfall, useWaterfall: e.target.checked }
                  }))}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Use waterfall calculation for allocation</span>
              </label>

              {formData.waterfall.useWaterfall ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex">
                    <InformationCircleIcon className="h-5 w-5 text-blue-400 mt-0.5" />
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-blue-800">Waterfall Calculation</h4>
                      <div className="text-sm text-blue-700 mt-1">
                        The waterfall will determine allocations based on the fund's distribution preferences,
                        preferred returns, and carried interest provisions.
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <button
                      onClick={calculateWaterfall}
                      disabled={loading || !formData.fundId || formData.totalAmount <= 0}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <ClockIcon className="h-4 w-4 mr-1 animate-spin" />
                          Calculating...
                        </>
                      ) : (
                        <>
                          <CalculatorIcon className="h-4 w-4 mr-1" />
                          Calculate Waterfall
                        </>
                      )}
                    </button>
                  </div>

                  {formData.waterfall.calculationId && (
                    <div className="mt-4 text-sm text-green-700">
                      <CheckCircleIcon className="h-4 w-4 inline mr-1" />
                      Waterfall calculation completed
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex">
                    <InformationCircleIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-gray-800">Pro-Rata Allocation</h4>
                      <div className="text-sm text-gray-700 mt-1">
                        Distribution will be allocated pro-rata based on ownership percentages.
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <button
                      onClick={calculateProRataAllocations}
                      disabled={!formData.fundId || formData.totalAmount <= 0}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      <CalculatorIcon className="h-4 w-4 mr-1" />
                      Calculate Pro-Rata
                    </button>
                  </div>
                </div>
              )}
            </div>

            {validationErrors.waterfall && (
              <p className="text-sm text-red-600">{validationErrors.waterfall}</p>
            )}
          </div>
        );

      default:
        return <div>Step {currentStep} content...</div>;
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
    <div className="max-w-6xl mx-auto">
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
          Follow the steps below to set up a new distribution to investors.
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
            disabled={processing}
            className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
          >
            {processing ? (
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