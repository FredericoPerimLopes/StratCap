import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fundAPI } from '../../services/api';
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CogIcon,
  BanknotesIcon,
  UsersIcon,
  DocumentTextIcon,
  ChartBarIcon,
  InformationCircleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

interface FundConfigurationData {
  // Basic Information
  basicInfo: {
    fundName: string;
    fundCode: string;
    vintage: number;
    targetSize: number;
    currency: string;
    fiscalYearEnd: string;
    jurisdiction: string;
    fundType: 'private_equity' | 'venture_capital' | 'real_estate' | 'hedge_fund' | 'other';
    investmentStrategy: string;
  };
  
  // Fee Structure
  feeStructure: {
    managementFeeRate: number;
    managementFeeBasis: 'commitments' | 'nav' | 'invested_capital';
    managementFeeStep: boolean;
    managementFeeStepRate?: number;
    managementFeeStepThreshold?: number;
    carriedInterestRate: number;
    preferredReturnRate: number;
    catchUpPercentage: number;
    distributionWaterfall: 'american' | 'european' | 'custom';
    feeFrequency: 'monthly' | 'quarterly' | 'annually';
  };
  
  // Investor Settings
  investorSettings: {
    minimumCommitment: number;
    maxInvestors: number;
    allowTransfers: boolean;
    transferRestrictions: string;
    investorReporting: 'monthly' | 'quarterly' | 'annually';
    investorPortalAccess: boolean;
    kycRequirements: string[];
    accreditationRequired: boolean;
  };
  
  // Operational Settings
  operationalSettings: {
    capitalCallFrequency: 'as_needed' | 'quarterly' | 'monthly';
    capitalCallNotice: number; // days
    distributionFrequency: 'as_available' | 'quarterly' | 'annually';
    distributionNotice: number; // days
    reportingCurrency: string;
    multiCurrencySupport: boolean;
    enableEqualization: boolean;
    enableSideLetters: boolean;
  };
  
  // Compliance & Reporting
  compliance: {
    regulatoryJurisdiction: string[];
    auditFirm: string;
    auditFrequency: 'monthly' | 'quarterly' | 'annually';
    taxAdvisor: string;
    legalCounsel: string;
    administrator: string;
    custodian: string;
    enableRegulatoryReporting: boolean;
    gdprCompliance: boolean;
    socCompliance: boolean;
  };
}

interface StepProps {
  data: FundConfigurationData;
  updateData: (section: keyof FundConfigurationData, updates: any) => void;
  errors: Record<string, string>;
  setErrors: (errors: Record<string, string>) => void;
}

const FundConfigurationWizard: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<FundConfigurationData>({
    basicInfo: {
      fundName: '',
      fundCode: '',
      vintage: new Date().getFullYear(),
      targetSize: 0,
      currency: 'USD',
      fiscalYearEnd: '12-31',
      jurisdiction: 'Delaware',
      fundType: 'private_equity',
      investmentStrategy: ''
    },
    feeStructure: {
      managementFeeRate: 0.02,
      managementFeeBasis: 'commitments',
      managementFeeStep: false,
      carriedInterestRate: 0.20,
      preferredReturnRate: 0.08,
      catchUpPercentage: 100,
      distributionWaterfall: 'american',
      feeFrequency: 'quarterly'
    },
    investorSettings: {
      minimumCommitment: 1000000,
      maxInvestors: 100,
      allowTransfers: true,
      transferRestrictions: 'Board approval required',
      investorReporting: 'quarterly',
      investorPortalAccess: true,
      kycRequirements: ['bank_reference', 'financial_statements'],
      accreditationRequired: true
    },
    operationalSettings: {
      capitalCallFrequency: 'as_needed',
      capitalCallNotice: 30,
      distributionFrequency: 'as_available',
      distributionNotice: 15,
      reportingCurrency: 'USD',
      multiCurrencySupport: false,
      enableEqualization: true,
      enableSideLetters: true
    },
    compliance: {
      regulatoryJurisdiction: ['SEC'],
      auditFirm: '',
      auditFrequency: 'annually',
      taxAdvisor: '',
      legalCounsel: '',
      administrator: '',
      custodian: '',
      enableRegulatoryReporting: true,
      gdprCompliance: false,
      socCompliance: false
    }
  });

  const steps = [
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Fund details and structure',
      icon: DocumentTextIcon,
      component: BasicInfoStep
    },
    {
      id: 'fees',
      title: 'Fee Structure',
      description: 'Management fees and carried interest',
      icon: BanknotesIcon,
      component: FeeStructureStep
    },
    {
      id: 'investors',
      title: 'Investor Settings',
      description: 'Investor requirements and access',
      icon: UsersIcon,
      component: InvestorSettingsStep
    },
    {
      id: 'operations',
      title: 'Operations',
      description: 'Capital calls and distributions',
      icon: CogIcon,
      component: OperationalSettingsStep
    },
    {
      id: 'compliance',
      title: 'Compliance',
      description: 'Regulatory and reporting requirements',
      icon: ChartBarIcon,
      component: ComplianceStep
    }
  ];

  useEffect(() => {
    if (isEdit && id) {
      loadFundConfiguration();
    }
  }, [isEdit, id]);

  const loadFundConfiguration = async () => {
    setLoading(true);
    try {
      const response = await fundAPI.getById(Number(id));
      const fund = response.data;
      
      // Map fund data to form structure
      setFormData(prev => ({
        ...prev,
        basicInfo: {
          fundName: fund.name || '',
          fundCode: fund.code || '',
          vintage: fund.vintage || new Date().getFullYear(),
          targetSize: fund.targetSize || 0,
          currency: fund.currency || 'USD',
          fiscalYearEnd: fund.fiscalYearEnd || '12-31',
          jurisdiction: fund.jurisdiction || 'Delaware',
          fundType: fund.fundType || 'private_equity',
          investmentStrategy: fund.investmentStrategy || ''
        }
      }));
    } catch (error) {
      console.error('Failed to load fund configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateData = (section: keyof FundConfigurationData, updates: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], ...updates }
    }));
    
    // Clear errors for updated fields
    const newErrors = { ...errors };
    Object.keys(updates).forEach(key => {
      delete newErrors[`${section}.${key}`];
    });
    setErrors(newErrors);
  };

  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    const currentStepData = steps[currentStep];

    switch (currentStepData.id) {
      case 'basic':
        if (!formData.basicInfo.fundName) newErrors['basicInfo.fundName'] = 'Fund name is required';
        if (!formData.basicInfo.fundCode) newErrors['basicInfo.fundCode'] = 'Fund code is required';
        if (formData.basicInfo.targetSize <= 0) newErrors['basicInfo.targetSize'] = 'Target size must be greater than 0';
        if (!formData.basicInfo.investmentStrategy) newErrors['basicInfo.investmentStrategy'] = 'Investment strategy is required';
        break;
      case 'fees':
        if (formData.feeStructure.managementFeeRate < 0 || formData.feeStructure.managementFeeRate > 1) {
          newErrors['feeStructure.managementFeeRate'] = 'Management fee rate must be between 0 and 1';
        }
        if (formData.feeStructure.carriedInterestRate < 0 || formData.feeStructure.carriedInterestRate > 1) {
          newErrors['feeStructure.carriedInterestRate'] = 'Carried interest rate must be between 0 and 1';
        }
        if (formData.feeStructure.preferredReturnRate < 0 || formData.feeStructure.preferredReturnRate > 1) {
          newErrors['feeStructure.preferredReturnRate'] = 'Preferred return rate must be between 0 and 1';
        }
        break;
      case 'investors':
        if (formData.investorSettings.minimumCommitment <= 0) {
          newErrors['investorSettings.minimumCommitment'] = 'Minimum commitment must be greater than 0';
        }
        if (formData.investorSettings.maxInvestors <= 0) {
          newErrors['investorSettings.maxInvestors'] = 'Maximum investors must be greater than 0';
        }
        break;
      case 'operations':
        if (formData.operationalSettings.capitalCallNotice <= 0) {
          newErrors['operationalSettings.capitalCallNotice'] = 'Capital call notice period must be greater than 0';
        }
        if (formData.operationalSettings.distributionNotice <= 0) {
          newErrors['operationalSettings.distributionNotice'] = 'Distribution notice period must be greater than 0';
        }
        break;
      case 'compliance':
        if (!formData.compliance.auditFirm) newErrors['compliance.auditFirm'] = 'Audit firm is required';
        if (!formData.compliance.administrator) newErrors['compliance.administrator'] = 'Administrator is required';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        handleComplete();
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!validateCurrentStep()) return;

    setIsCompleting(true);
    try {
      const submitData = {
        ...formData.basicInfo,
        configuration: {
          feeStructure: formData.feeStructure,
          investorSettings: formData.investorSettings,
          operationalSettings: formData.operationalSettings,
          compliance: formData.compliance
        }
      };

      if (isEdit) {
        await fundAPI.update(Number(id), submitData);
      } else {
        await fundAPI.create(submitData);
      }
      
      navigate('/funds', {
        state: { message: `Fund configuration ${isEdit ? 'updated' : 'created'} successfully` }
      });
    } catch (error) {
      console.error('Failed to save configuration:', error);
      setErrors({ general: 'Failed to save configuration. Please try again.' });
    } finally {
      setIsCompleting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: amount >= 1e6 ? 'compact' : 'standard'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const CurrentStepComponent = steps[currentStep].component;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/funds')}
                className="mr-4 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isEdit ? 'Edit Fund Configuration' : 'Fund Configuration Setup'}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {isEdit ? 'Update fund settings and parameters' : 'Set up your fund structure and operational parameters'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <nav aria-label="Progress">
            <ol className="flex items-center justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep;
                
                return (
                  <li key={step.id} className="flex items-center">
                    <div className="flex items-center">
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                          isCompleted
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : isCurrent
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-gray-300 text-gray-500'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckIcon className="w-5 h-5" />
                        ) : (
                          <Icon className="w-5 h-5" />
                        )}
                      </div>
                      <div className="ml-3">
                        <p className={`text-sm font-medium ${isCurrent ? 'text-indigo-600' : 'text-gray-500'}`}>
                          {step.title}
                        </p>
                        <p className="text-xs text-gray-500">{step.description}</p>
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div className="hidden sm:block ml-6 w-20 border-t border-gray-300" />
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>

        {/* Step Content */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">{steps[currentStep].title}</h2>
            <p className="text-sm text-gray-500 mt-1">{steps[currentStep].description}</p>
          </div>
          
          <div className="p-6">
            <CurrentStepComponent
              data={formData}
              updateData={updateData}
              errors={errors}
              setErrors={setErrors}
            />
          </div>

          {/* Navigation */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon className="h-4 w-4 mr-2" />
              Previous
            </button>

            <div className="text-sm text-gray-500">
              Step {currentStep + 1} of {steps.length}
            </div>

            <button
              type="button"
              onClick={handleNext}
              disabled={isCompleting}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              {isCompleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Setting up...
                </>
              ) : currentStep === steps.length - 1 ? (
                <>
                  Complete Setup
                  <CheckIcon className="h-4 w-4 ml-2" />
                </>
              ) : (
                <>
                  Next
                  <ChevronRightIcon className="h-4 w-4 ml-2" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Configuration Summary */}
        {currentStep === steps.length - 1 && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex">
              <InformationCircleIcon className="h-5 w-5 text-blue-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Configuration Summary</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="font-medium">Fund:</p>
                      <p>{formData.basicInfo.fundName}</p>
                    </div>
                    <div>
                      <p className="font-medium">Target Size:</p>
                      <p>{formatCurrency(formData.basicInfo.targetSize)}</p>
                    </div>
                    <div>
                      <p className="font-medium">Management Fee:</p>
                      <p>{formatPercentage(formData.feeStructure.managementFeeRate)}</p>
                    </div>
                    <div>
                      <p className="font-medium">Carried Interest:</p>
                      <p>{formatPercentage(formData.feeStructure.carriedInterestRate)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {errors.general && (
          <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {errors.general}
          </div>
        )}
      </div>
    </div>
  );
};

// Step Components
const BasicInfoStep: React.FC<StepProps> = ({ data, updateData, errors }) => {
  const getError = (field: string) => errors[`basicInfo.${field}`];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fund Name *
          </label>
          <input
            type="text"
            value={data.basicInfo.fundName}
            onChange={(e) => updateData('basicInfo', { fundName: e.target.value })}
            className={`block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
              getError('fundName') ? 'border-red-300' : ''
            }`}
            placeholder="e.g., Growth Fund IV"
          />
          {getError('fundName') && (
            <p className="mt-1 text-sm text-red-600">{getError('fundName')}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fund Code *
          </label>
          <input
            type="text"
            value={data.basicInfo.fundCode}
            onChange={(e) => updateData('basicInfo', { fundCode: e.target.value })}
            className={`block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
              getError('fundCode') ? 'border-red-300' : ''
            }`}
            placeholder="e.g., GF4"
          />
          {getError('fundCode') && (
            <p className="mt-1 text-sm text-red-600">{getError('fundCode')}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vintage Year
          </label>
          <input
            type="number"
            value={data.basicInfo.vintage}
            onChange={(e) => updateData('basicInfo', { vintage: Number(e.target.value) })}
            className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            min="2000"
            max="2050"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Size ($) *
          </label>
          <input
            type="number"
            value={data.basicInfo.targetSize}
            onChange={(e) => updateData('basicInfo', { targetSize: Number(e.target.value) })}
            className={`block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
              getError('targetSize') ? 'border-red-300' : ''
            }`}
            min="0"
            step="1000000"
          />
          {getError('targetSize') && (
            <p className="mt-1 text-sm text-red-600">{getError('targetSize')}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Currency
          </label>
          <select
            value={data.basicInfo.currency}
            onChange={(e) => updateData('basicInfo', { currency: e.target.value })}
            className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="JPY">JPY</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fund Type
          </label>
          <select
            value={data.basicInfo.fundType}
            onChange={(e) => updateData('basicInfo', { fundType: e.target.value as any })}
            className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="private_equity">Private Equity</option>
            <option value="venture_capital">Venture Capital</option>
            <option value="real_estate">Real Estate</option>
            <option value="hedge_fund">Hedge Fund</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Jurisdiction
          </label>
          <select
            value={data.basicInfo.jurisdiction}
            onChange={(e) => updateData('basicInfo', { jurisdiction: e.target.value })}
            className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="Delaware">Delaware</option>
            <option value="Cayman Islands">Cayman Islands</option>
            <option value="Luxembourg">Luxembourg</option>
            <option value="Ireland">Ireland</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fiscal Year End
          </label>
          <input
            type="text"
            value={data.basicInfo.fiscalYearEnd}
            onChange={(e) => updateData('basicInfo', { fiscalYearEnd: e.target.value })}
            className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="MM-DD (e.g., 12-31)"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Investment Strategy *
        </label>
        <textarea
          rows={4}
          value={data.basicInfo.investmentStrategy}
          onChange={(e) => updateData('basicInfo', { investmentStrategy: e.target.value })}
          className={`block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
            getError('investmentStrategy') ? 'border-red-300' : ''
          }`}
          placeholder="Describe the fund's investment strategy and focus..."
        />
        {getError('investmentStrategy') && (
          <p className="mt-1 text-sm text-red-600">{getError('investmentStrategy')}</p>
        )}
      </div>
    </div>
  );
};

const FeeStructureStep: React.FC<StepProps> = ({ data, updateData, errors }) => {
  const getError = (field: string) => errors[`feeStructure.${field}`];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Management Fee Rate (%) *
          </label>
          <input
            type="number"
            value={data.feeStructure.managementFeeRate * 100}
            onChange={(e) => updateData('feeStructure', { managementFeeRate: Number(e.target.value) / 100 })}
            className={`block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
              getError('managementFeeRate') ? 'border-red-300' : ''
            }`}
            min="0"
            max="100"
            step="0.1"
          />
          {getError('managementFeeRate') && (
            <p className="mt-1 text-sm text-red-600">{getError('managementFeeRate')}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Management Fee Basis
          </label>
          <select
            value={data.feeStructure.managementFeeBasis}
            onChange={(e) => updateData('feeStructure', { managementFeeBasis: e.target.value as any })}
            className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="commitments">Commitments</option>
            <option value="nav">Net Asset Value</option>
            <option value="invested_capital">Invested Capital</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Carried Interest Rate (%) *
          </label>
          <input
            type="number"
            value={data.feeStructure.carriedInterestRate * 100}
            onChange={(e) => updateData('feeStructure', { carriedInterestRate: Number(e.target.value) / 100 })}
            className={`block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
              getError('carriedInterestRate') ? 'border-red-300' : ''
            }`}
            min="0"
            max="100"
            step="0.1"
          />
          {getError('carriedInterestRate') && (
            <p className="mt-1 text-sm text-red-600">{getError('carriedInterestRate')}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preferred Return Rate (%) *
          </label>
          <input
            type="number"
            value={data.feeStructure.preferredReturnRate * 100}
            onChange={(e) => updateData('feeStructure', { preferredReturnRate: Number(e.target.value) / 100 })}
            className={`block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
              getError('preferredReturnRate') ? 'border-red-300' : ''
            }`}
            min="0"
            max="100"
            step="0.1"
          />
          {getError('preferredReturnRate') && (
            <p className="mt-1 text-sm text-red-600">{getError('preferredReturnRate')}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Catch-Up Percentage (%)
          </label>
          <input
            type="number"
            value={data.feeStructure.catchUpPercentage}
            onChange={(e) => updateData('feeStructure', { catchUpPercentage: Number(e.target.value) })}
            className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            min="0"
            max="100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Distribution Waterfall
          </label>
          <select
            value={data.feeStructure.distributionWaterfall}
            onChange={(e) => updateData('feeStructure', { distributionWaterfall: e.target.value as any })}
            className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="american">American Waterfall</option>
            <option value="european">European Waterfall</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fee Frequency
          </label>
          <select
            value={data.feeStructure.feeFrequency}
            onChange={(e) => updateData('feeStructure', { feeFrequency: e.target.value as any })}
            className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="annually">Annually</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={data.feeStructure.managementFeeStep}
            onChange={(e) => updateData('feeStructure', { managementFeeStep: e.target.checked })}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">Enable management fee step-down</span>
        </label>

        {data.feeStructure.managementFeeStep && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Step-down Rate (%)
              </label>
              <input
                type="number"
                value={data.feeStructure.managementFeeStepRate || 0}
                onChange={(e) => updateData('feeStructure', { managementFeeStepRate: Number(e.target.value) / 100 })}
                className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                min="0"
                max="100"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Threshold (Years)
              </label>
              <input
                type="number"
                value={data.feeStructure.managementFeeStepThreshold || 0}
                onChange={(e) => updateData('feeStructure', { managementFeeStepThreshold: Number(e.target.value) })}
                className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                min="0"
                max="20"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const InvestorSettingsStep: React.FC<StepProps> = ({ data, updateData, errors }) => {
  const getError = (field: string) => errors[`investorSettings.${field}`];

  const toggleKycRequirement = (requirement: string) => {
    const currentRequirements = data.investorSettings.kycRequirements;
    const updatedRequirements = currentRequirements.includes(requirement)
      ? currentRequirements.filter(r => r !== requirement)
      : [...currentRequirements, requirement];
    
    updateData('investorSettings', { kycRequirements: updatedRequirements });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Minimum Commitment ($) *
          </label>
          <input
            type="number"
            value={data.investorSettings.minimumCommitment}
            onChange={(e) => updateData('investorSettings', { minimumCommitment: Number(e.target.value) })}
            className={`block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
              getError('minimumCommitment') ? 'border-red-300' : ''
            }`}
            min="0"
            step="100000"
          />
          {getError('minimumCommitment') && (
            <p className="mt-1 text-sm text-red-600">{getError('minimumCommitment')}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Maximum Investors *
          </label>
          <input
            type="number"
            value={data.investorSettings.maxInvestors}
            onChange={(e) => updateData('investorSettings', { maxInvestors: Number(e.target.value) })}
            className={`block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
              getError('maxInvestors') ? 'border-red-300' : ''
            }`}
            min="1"
          />
          {getError('maxInvestors') && (
            <p className="mt-1 text-sm text-red-600">{getError('maxInvestors')}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Investor Reporting Frequency
          </label>
          <select
            value={data.investorSettings.investorReporting}
            onChange={(e) => updateData('investorSettings', { investorReporting: e.target.value as any })}
            className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="annually">Annually</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Transfer Restrictions
          </label>
          <input
            type="text"
            value={data.investorSettings.transferRestrictions}
            onChange={(e) => updateData('investorSettings', { transferRestrictions: e.target.value })}
            className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g., Board approval required"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Investor Access</h3>
        
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={data.investorSettings.allowTransfers}
            onChange={(e) => updateData('investorSettings', { allowTransfers: e.target.checked })}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">Allow investor transfers</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={data.investorSettings.investorPortalAccess}
            onChange={(e) => updateData('investorSettings', { investorPortalAccess: e.target.checked })}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">Enable investor portal access</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={data.investorSettings.accreditationRequired}
            onChange={(e) => updateData('investorSettings', { accreditationRequired: e.target.checked })}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">Require accredited investor status</span>
        </label>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">KYC Requirements</h3>
        
        <div className="grid grid-cols-2 gap-4">
          {[
            { id: 'bank_reference', label: 'Bank Reference' },
            { id: 'financial_statements', label: 'Financial Statements' },
            { id: 'proof_of_identity', label: 'Proof of Identity' },
            { id: 'proof_of_address', label: 'Proof of Address' },
            { id: 'source_of_funds', label: 'Source of Funds' },
            { id: 'compliance_certificate', label: 'Compliance Certificate' }
          ].map(requirement => (
            <label key={requirement.id} className="flex items-center">
              <input
                type="checkbox"
                checked={data.investorSettings.kycRequirements.includes(requirement.id)}
                onChange={() => toggleKycRequirement(requirement.id)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">{requirement.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

const OperationalSettingsStep: React.FC<StepProps> = ({ data, updateData, errors }) => {
  const getError = (field: string) => errors[`operationalSettings.${field}`];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Capital Call Frequency
          </label>
          <select
            value={data.operationalSettings.capitalCallFrequency}
            onChange={(e) => updateData('operationalSettings', { capitalCallFrequency: e.target.value as any })}
            className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="as_needed">As Needed</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Capital Call Notice (Days) *
          </label>
          <input
            type="number"
            value={data.operationalSettings.capitalCallNotice}
            onChange={(e) => updateData('operationalSettings', { capitalCallNotice: Number(e.target.value) })}
            className={`block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
              getError('capitalCallNotice') ? 'border-red-300' : ''
            }`}
            min="1"
            max="365"
          />
          {getError('capitalCallNotice') && (
            <p className="mt-1 text-sm text-red-600">{getError('capitalCallNotice')}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Distribution Frequency
          </label>
          <select
            value={data.operationalSettings.distributionFrequency}
            onChange={(e) => updateData('operationalSettings', { distributionFrequency: e.target.value as any })}
            className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="as_available">As Available</option>
            <option value="quarterly">Quarterly</option>
            <option value="annually">Annually</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Distribution Notice (Days) *
          </label>
          <input
            type="number"
            value={data.operationalSettings.distributionNotice}
            onChange={(e) => updateData('operationalSettings', { distributionNotice: Number(e.target.value) })}
            className={`block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
              getError('distributionNotice') ? 'border-red-300' : ''
            }`}
            min="1"
            max="365"
          />
          {getError('distributionNotice') && (
            <p className="mt-1 text-sm text-red-600">{getError('distributionNotice')}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reporting Currency
          </label>
          <select
            value={data.operationalSettings.reportingCurrency}
            onChange={(e) => updateData('operationalSettings', { reportingCurrency: e.target.value })}
            className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="JPY">JPY</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Operational Features</h3>
        
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={data.operationalSettings.multiCurrencySupport}
            onChange={(e) => updateData('operationalSettings', { multiCurrencySupport: e.target.checked })}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">Enable multi-currency support</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={data.operationalSettings.enableEqualization}
            onChange={(e) => updateData('operationalSettings', { enableEqualization: e.target.checked })}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">Enable equalization payments</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={data.operationalSettings.enableSideLetters}
            onChange={(e) => updateData('operationalSettings', { enableSideLetters: e.target.checked })}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">Enable side letter arrangements</span>
        </label>
      </div>
    </div>
  );
};

const ComplianceStep: React.FC<StepProps> = ({ data, updateData, errors }) => {
  const getError = (field: string) => errors[`compliance.${field}`];

  const toggleJurisdiction = (jurisdiction: string) => {
    const currentJurisdictions = data.compliance.regulatoryJurisdiction;
    const updatedJurisdictions = currentJurisdictions.includes(jurisdiction)
      ? currentJurisdictions.filter(j => j !== jurisdiction)
      : [...currentJurisdictions, jurisdiction];
    
    updateData('compliance', { regulatoryJurisdiction: updatedJurisdictions });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Audit Firm *
          </label>
          <input
            type="text"
            value={data.compliance.auditFirm}
            onChange={(e) => updateData('compliance', { auditFirm: e.target.value })}
            className={`block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
              getError('auditFirm') ? 'border-red-300' : ''
            }`}
            placeholder="e.g., Deloitte, PwC, KPMG"
          />
          {getError('auditFirm') && (
            <p className="mt-1 text-sm text-red-600">{getError('auditFirm')}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Audit Frequency
          </label>
          <select
            value={data.compliance.auditFrequency}
            onChange={(e) => updateData('compliance', { auditFrequency: e.target.value as any })}
            className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="annually">Annually</option>
            <option value="quarterly">Quarterly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tax Advisor
          </label>
          <input
            type="text"
            value={data.compliance.taxAdvisor}
            onChange={(e) => updateData('compliance', { taxAdvisor: e.target.value })}
            className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Tax advisory firm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Legal Counsel
          </label>
          <input
            type="text"
            value={data.compliance.legalCounsel}
            onChange={(e) => updateData('compliance', { legalCounsel: e.target.value })}
            className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Legal firm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Administrator *
          </label>
          <input
            type="text"
            value={data.compliance.administrator}
            onChange={(e) => updateData('compliance', { administrator: e.target.value })}
            className={`block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
              getError('administrator') ? 'border-red-300' : ''
            }`}
            placeholder="Fund administrator"
          />
          {getError('administrator') && (
            <p className="mt-1 text-sm text-red-600">{getError('administrator')}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custodian
          </label>
          <input
            type="text"
            value={data.compliance.custodian}
            onChange={(e) => updateData('compliance', { custodian: e.target.value })}
            className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Custodian bank"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Regulatory Jurisdictions</h3>
        
        <div className="grid grid-cols-2 gap-4">
          {[
            { id: 'SEC', label: 'SEC (United States)' },
            { id: 'FCA', label: 'FCA (United Kingdom)' },
            { id: 'ESMA', label: 'ESMA (European Union)' },
            { id: 'CIMA', label: 'CIMA (Cayman Islands)' },
            { id: 'MAS', label: 'MAS (Singapore)' },
            { id: 'CSSF', label: 'CSSF (Luxembourg)' }
          ].map(jurisdiction => (
            <label key={jurisdiction.id} className="flex items-center">
              <input
                type="checkbox"
                checked={data.compliance.regulatoryJurisdiction.includes(jurisdiction.id)}
                onChange={() => toggleJurisdiction(jurisdiction.id)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">{jurisdiction.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Compliance Features</h3>
        
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={data.compliance.enableRegulatoryReporting}
            onChange={(e) => updateData('compliance', { enableRegulatoryReporting: e.target.checked })}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">Enable regulatory reporting</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={data.compliance.gdprCompliance}
            onChange={(e) => updateData('compliance', { gdprCompliance: e.target.checked })}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">GDPR compliance required</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={data.compliance.socCompliance}
            onChange={(e) => updateData('compliance', { socCompliance: e.target.checked })}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">SOC compliance required</span>
        </label>
      </div>
    </div>
  );
};

export default FundConfigurationWizard;