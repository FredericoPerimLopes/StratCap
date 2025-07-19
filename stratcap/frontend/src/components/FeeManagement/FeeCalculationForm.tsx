import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  CalculatorIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface FeeCalculationFormData {
  fundId: string;
  feeType: 'management' | 'carried_interest' | 'other';
  periodStartDate: string;
  periodEndDate: string;
  basis: 'nav' | 'commitments' | 'invested_capital' | 'distributions';
  basisAmount: string;
  feeRate: string;
  description: string;
  calculationMethod: string;
  isAccrual: boolean;
}

interface Fund {
  id: string;
  name: string;
  managementFeeRate?: number;
  carriedInterestRate?: number;
}

interface ValidationError {
  field: string;
  message: string;
}

const FeeCalculationForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<FeeCalculationFormData>({
    fundId: '',
    feeType: 'management',
    periodStartDate: '',
    periodEndDate: '',
    basis: 'nav',
    basisAmount: '',
    feeRate: '',
    description: '',
    calculationMethod: 'standard',
    isAccrual: false
  });

  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [calculatedFee, setCalculatedFee] = useState<number | null>(null);
  const [showCalculation, setShowCalculation] = useState(false);

  useEffect(() => {
    // Mock fund data - in real app, this would come from API
    setFunds([
      { id: '1', name: 'Growth Fund III', managementFeeRate: 0.02, carriedInterestRate: 0.20 },
      { id: '2', name: 'Venture Fund IV', managementFeeRate: 0.025, carriedInterestRate: 0.20 },
      { id: '3', name: 'Growth Fund II', managementFeeRate: 0.02, carriedInterestRate: 0.20 },
      { id: '4', name: 'Real Estate Fund I', managementFeeRate: 0.015, carriedInterestRate: 0.15 }
    ]);

    if (isEdit && id) {
      // Mock loading existing calculation data
      setFormData({
        fundId: '1',
        feeType: 'management',
        periodStartDate: '2023-10-01',
        periodEndDate: '2023-12-31',
        basis: 'nav',
        basisAmount: '500000000',
        feeRate: '0.02',
        description: 'Q4 2023 Management Fee Calculation',
        calculationMethod: 'standard',
        isAccrual: false
      });
    }
  }, [isEdit, id]);

  const validateForm = (): ValidationError[] => {
    const newErrors: ValidationError[] = [];

    if (!formData.fundId) {
      newErrors.push({ field: 'fundId', message: 'Fund selection is required' });
    }

    if (!formData.periodStartDate) {
      newErrors.push({ field: 'periodStartDate', message: 'Period start date is required' });
    }

    if (!formData.periodEndDate) {
      newErrors.push({ field: 'periodEndDate', message: 'Period end date is required' });
    }

    if (formData.periodStartDate && formData.periodEndDate) {
      const startDate = new Date(formData.periodStartDate);
      const endDate = new Date(formData.periodEndDate);
      if (startDate >= endDate) {
        newErrors.push({ field: 'periodEndDate', message: 'End date must be after start date' });
      }
    }

    if (!formData.basisAmount || parseFloat(formData.basisAmount) <= 0) {
      newErrors.push({ field: 'basisAmount', message: 'Valid basis amount is required' });
    }

    if (!formData.feeRate || parseFloat(formData.feeRate) <= 0) {
      newErrors.push({ field: 'feeRate', message: 'Valid fee rate is required' });
    }

    if (parseFloat(formData.feeRate) > 1) {
      newErrors.push({ field: 'feeRate', message: 'Fee rate should be entered as decimal (e.g., 0.02 for 2%)' });
    }

    return newErrors;
  };

  const handleInputChange = (field: keyof FeeCalculationFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-populate fee rate when fund is selected
    if (field === 'fundId' && typeof value === 'string') {
      const selectedFund = funds.find(f => f.id === value);
      if (selectedFund) {
        const rate = formData.feeType === 'management' 
          ? selectedFund.managementFeeRate 
          : formData.feeType === 'carried_interest'
          ? selectedFund.carriedInterestRate
          : undefined;
        
        if (rate !== undefined) {
          setFormData(prev => ({
            ...prev,
            feeRate: rate.toString()
          }));
        }
      }
    }

    // Auto-populate fee rate when fee type changes
    if (field === 'feeType' && formData.fundId) {
      const selectedFund = funds.find(f => f.id === formData.fundId);
      if (selectedFund) {
        const rate = value === 'management' 
          ? selectedFund.managementFeeRate 
          : value === 'carried_interest'
          ? selectedFund.carriedInterestRate
          : undefined;
        
        if (rate !== undefined) {
          setFormData(prev => ({
            ...prev,
            feeRate: rate.toString()
          }));
        }
      }
    }

    // Clear errors for the field being edited
    setErrors(prev => prev.filter(error => error.field !== field));
  };

  const calculateFee = () => {
    const basisAmount = parseFloat(formData.basisAmount);
    const feeRate = parseFloat(formData.feeRate);
    
    if (basisAmount && feeRate) {
      const calculated = basisAmount * feeRate;
      setCalculatedFee(calculated);
      setShowCalculation(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors([]);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In real app, this would be an API call
      console.log('Fee calculation data:', formData);
      
      navigate('/fee-management');
    } catch (error) {
      setErrors([{ field: 'general', message: 'Failed to save fee calculation. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getErrorForField = (field: string) => {
    return errors.find(error => error.field === field)?.message;
  };

  const selectedFund = funds.find(f => f.id === formData.fundId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/fee-management')}
            className="mr-4 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'Edit Fee Calculation' : 'New Fee Calculation'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {isEdit ? 'Update existing fee calculation details' : 'Create a new fee calculation for a fund'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Calculation Details</h3>
              </div>
              <div className="px-6 py-4 space-y-6">
                {/* General Errors */}
                {errors.some(error => error.field === 'general') && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Error</h3>
                        <div className="mt-2 text-sm text-red-700">
                          {getErrorForField('general')}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Fund Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fund *
                  </label>
                  <select
                    value={formData.fundId}
                    onChange={(e) => handleInputChange('fundId', e.target.value)}
                    className={`block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                      getErrorForField('fundId') ? 'border-red-300' : ''
                    }`}
                  >
                    <option value="">Select a fund...</option>
                    {funds.map(fund => (
                      <option key={fund.id} value={fund.id}>{fund.name}</option>
                    ))}
                  </select>
                  {getErrorForField('fundId') && (
                    <p className="mt-1 text-sm text-red-600">{getErrorForField('fundId')}</p>
                  )}
                </div>

                {/* Fee Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fee Type *
                  </label>
                  <select
                    value={formData.feeType}
                    onChange={(e) => handleInputChange('feeType', e.target.value)}
                    className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="management">Management Fee</option>
                    <option value="carried_interest">Carried Interest</option>
                    <option value="other">Other Fee</option>
                  </select>
                </div>

                {/* Period Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Period Start Date *
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={formData.periodStartDate}
                        onChange={(e) => handleInputChange('periodStartDate', e.target.value)}
                        className={`block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                          getErrorForField('periodStartDate') ? 'border-red-300' : ''
                        }`}
                      />
                      <CalendarIcon className="h-5 w-5 text-gray-400 absolute right-3 top-3 pointer-events-none" />
                    </div>
                    {getErrorForField('periodStartDate') && (
                      <p className="mt-1 text-sm text-red-600">{getErrorForField('periodStartDate')}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Period End Date *
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={formData.periodEndDate}
                        onChange={(e) => handleInputChange('periodEndDate', e.target.value)}
                        className={`block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                          getErrorForField('periodEndDate') ? 'border-red-300' : ''
                        }`}
                      />
                      <CalendarIcon className="h-5 w-5 text-gray-400 absolute right-3 top-3 pointer-events-none" />
                    </div>
                    {getErrorForField('periodEndDate') && (
                      <p className="mt-1 text-sm text-red-600">{getErrorForField('periodEndDate')}</p>
                    )}
                  </div>
                </div>

                {/* Fee Basis */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fee Basis
                  </label>
                  <select
                    value={formData.basis}
                    onChange={(e) => handleInputChange('basis', e.target.value)}
                    className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="nav">Net Asset Value (NAV)</option>
                    <option value="commitments">Committed Capital</option>
                    <option value="invested_capital">Invested Capital</option>
                    <option value="distributions">Distributions</option>
                  </select>
                </div>

                {/* Basis Amount and Fee Rate */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Basis Amount ($) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        value={formData.basisAmount}
                        onChange={(e) => handleInputChange('basisAmount', e.target.value)}
                        className={`block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                          getErrorForField('basisAmount') ? 'border-red-300' : ''
                        }`}
                        placeholder="0.00"
                      />
                      <CurrencyDollarIcon className="h-5 w-5 text-gray-400 absolute right-3 top-3 pointer-events-none" />
                    </div>
                    {getErrorForField('basisAmount') && (
                      <p className="mt-1 text-sm text-red-600">{getErrorForField('basisAmount')}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fee Rate (decimal) *
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      min="0"
                      max="1"
                      value={formData.feeRate}
                      onChange={(e) => handleInputChange('feeRate', e.target.value)}
                      className={`block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                        getErrorForField('feeRate') ? 'border-red-300' : ''
                      }`}
                      placeholder="0.02"
                    />
                    {getErrorForField('feeRate') && (
                      <p className="mt-1 text-sm text-red-600">{getErrorForField('feeRate')}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Enter as decimal (e.g., 0.02 for 2%)
                    </p>
                  </div>
                </div>

                {/* Calculation Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Calculation Method
                  </label>
                  <select
                    value={formData.calculationMethod}
                    onChange={(e) => handleInputChange('calculationMethod', e.target.value)}
                    className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="standard">Standard</option>
                    <option value="pro_rata">Pro Rata</option>
                    <option value="daily_accrual">Daily Accrual</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <div className="relative">
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter a description for this fee calculation..."
                    />
                    <DocumentTextIcon className="h-5 w-5 text-gray-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>

                {/* Accrual Flag */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isAccrual"
                    checked={formData.isAccrual}
                    onChange={(e) => handleInputChange('isAccrual', e.target.checked)}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="isAccrual" className="ml-2 text-sm font-medium text-gray-700">
                    This is an accrual calculation
                  </label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate('/fee-management')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={calculateFee}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <CalculatorIcon className="h-4 w-4 mr-2" />
                Calculate
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    {isEdit ? 'Update Calculation' : 'Save Calculation'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Fund Information */}
          {selectedFund && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Fund Information</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Fund Name</p>
                  <p className="text-sm text-gray-900">{selectedFund.name}</p>
                </div>
                {selectedFund.managementFeeRate && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Standard Management Fee</p>
                    <p className="text-sm text-gray-900">{(selectedFund.managementFeeRate * 100).toFixed(2)}%</p>
                  </div>
                )}
                {selectedFund.carriedInterestRate && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Carried Interest Rate</p>
                    <p className="text-sm text-gray-900">{(selectedFund.carriedInterestRate * 100).toFixed(2)}%</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Calculation Preview */}
          {showCalculation && calculatedFee !== null && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Fee Calculation Preview</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">Basis Amount:</span>
                  <span className="text-sm text-gray-900">{formatCurrency(parseFloat(formData.basisAmount) || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">Fee Rate:</span>
                  <span className="text-sm text-gray-900">{(parseFloat(formData.feeRate) * 100).toFixed(4)}%</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-medium text-gray-900">Calculated Fee:</span>
                    <span className="text-lg font-semibold text-indigo-600">{formatCurrency(calculatedFee)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Calculation Notes */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <InformationCircleIcon className="h-5 w-5 text-blue-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Calculation Notes</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Fee rates should be entered as decimals (e.g., 0.02 for 2%)</li>
                    <li>Management fees are typically calculated quarterly</li>
                    <li>Carried interest is usually calculated annually</li>
                    <li>Basis amounts should reflect the calculation period</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeeCalculationForm;