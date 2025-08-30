import React, { useState, useEffect } from 'react';
import { feeAPI, fundAPI } from '../../services/api';
import {
  XMarkIcon,
  CalculatorIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface FeeCalculationPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  onCalculate: () => void;
}

interface CalculationParameters {
  fundIds: number[];
  feeTypes: string[];
  periodStart: string;
  periodEnd: string;
  basisType: 'nav' | 'commitments' | 'invested_capital' | 'cost_basis';
  calculationDate: string;
  includeAccruals: boolean;
  applyDiscounts: boolean;
  applyWaivers: boolean;
  previewMode: boolean;
}

interface FeePreview {
  fundId: number;
  fundName: string;
  calculations: Array<{
    feeType: string;
    basisAmount: number;
    feeRate: number;
    grossAmount: number;
    adjustments: Array<{ type: string; amount: number; reason: string }>;
    netAmount: number;
    accrualAmount?: number;
  }>;
  totalGross: number;
  totalAdjustments: number;
  totalNet: number;
  warnings: string[];
  errors: string[];
}

interface CalculationSummary {
  totalFunds: number;
  totalCalculations: number;
  totalGrossAmount: number;
  totalAdjustments: number;
  totalNetAmount: number;
  estimatedProcessingTime: number;
  previews: FeePreview[];
}

const FeeCalculationPreview: React.FC<FeeCalculationPreviewProps> = ({ isOpen, onClose, onCalculate }) => {
  const [funds, setFunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calculationSummary, setCalculationSummary] = useState<CalculationSummary | null>(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  
  const [parameters, setParameters] = useState<CalculationParameters>({
    fundIds: [],
    feeTypes: ['management'],
    periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    periodEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
    basisType: 'nav',
    calculationDate: new Date().toISOString().split('T')[0],
    includeAccruals: false,
    applyDiscounts: true,
    applyWaivers: true,
    previewMode: true
  });

  useEffect(() => {
    if (isOpen) {
      fetchFunds();
    }
  }, [isOpen]);

  useEffect(() => {
    if (parameters.fundIds.length > 0 && parameters.feeTypes.length > 0) {
      generatePreview();
    }
  }, [parameters]);

  const fetchFunds = async () => {
    try {
      const response = await fundAPI.getAll();
      setFunds(response.data.data || []);
      
      // Auto-select first fund
      if (response.data.data?.length > 0) {
        setParameters(prev => ({
          ...prev,
          fundIds: [response.data.data[0].id]
        }));
      }
    } catch (err: any) {
      setError('Failed to load funds');
    }
  };

  const generatePreview = async () => {
    if (parameters.fundIds.length === 0 || parameters.feeTypes.length === 0) return;
    
    setLoading(true);
    try {
      const response = await feeAPI.generateCalculationPreview({
        ...parameters,
        previewMode: true
      });
      
      if (response.data.success) {
        setCalculationSummary(response.data.data);
        setError(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate preview');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteCalculation = async () => {
    setLoading(true);
    try {
      const response = await feeAPI.executeCalculations({
        ...parameters,
        previewMode: false
      });
      
      if (response.data.success) {
        onCalculate();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to execute calculations');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: amount >= 1000000 ? 'compact' : 'standard'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(3)}%`;
  };

  const handleFundToggle = (fundId: number) => {
    setParameters(prev => ({
      ...prev,
      fundIds: prev.fundIds.includes(fundId)
        ? prev.fundIds.filter(id => id !== fundId)
        : [...prev.fundIds, fundId]
    }));
  };

  const handleFeeTypeToggle = (feeType: string) => {
    setParameters(prev => ({
      ...prev,
      feeTypes: prev.feeTypes.includes(feeType)
        ? prev.feeTypes.filter(type => type !== feeType)
        : [...prev.feeTypes, feeType]
    }));
  };

  const getPreviewChart = () => {
    if (!calculationSummary) return [];
    
    return calculationSummary.previews.map(preview => ({
      fundName: preview.fundName.length > 15 ? preview.fundName.substring(0, 15) + '...' : preview.fundName,
      grossAmount: preview.totalGross,
      netAmount: preview.totalNet,
      adjustments: Math.abs(preview.totalAdjustments)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
        
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CalculatorIcon className="h-6 w-6 text-indigo-600 mr-3" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900" id="modal-title">
                    Fee Calculation Preview
                  </h3>
                  <p className="text-sm text-gray-500">
                    Preview and configure fee calculations before execution
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Configuration Panel */}
              <div className="lg:col-span-1 space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Calculation Parameters</h4>
                  
                  {/* Fund Selection */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Funds</label>
                    <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                      {funds.map(fund => (
                        <label key={fund.id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={parameters.fundIds.includes(fund.id)}
                            onChange={() => handleFundToggle(fund.id)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">{fund.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Fee Types */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fee Types</label>
                    <div className="space-y-2">
                      {[
                        { value: 'management', label: 'Management Fees' },
                        { value: 'carried_interest', label: 'Carried Interest' },
                        { value: 'performance', label: 'Performance Fees' },
                        { value: 'transaction', label: 'Transaction Fees' }
                      ].map(feeType => (
                        <label key={feeType.value} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={parameters.feeTypes.includes(feeType.value)}
                            onChange={() => handleFeeTypeToggle(feeType.value)}\n                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"\n                          />\n                          <span className="ml-2 text-sm text-gray-700">{feeType.label}</span>\n                        </label>\n                      ))}\n                    </div>\n                  </div>\n\n                  {/* Period Selection */}\n                  <div className="grid grid-cols-2 gap-3 mb-4">}\n                    <div>\n                      <label className="block text-sm font-medium text-gray-700 mb-1">Period Start</label>\n                      <input\n                        type="date"\n                        value={parameters.periodStart}\n                        onChange={(e) => setParameters(prev => ({ ...prev, periodStart: e.target.value }))}\n                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"\n                      />\n                    </div>\n                    <div>\n                      <label className="block text-sm font-medium text-gray-700 mb-1">Period End</label>\n                      <input\n                        type="date"\n                        value={parameters.periodEnd}\n                        onChange={(e) => setParameters(prev => ({ ...prev, periodEnd: e.target.value }))}\n                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"\n                      />\n                    </div>\n                  </div>\n\n                  {/* Basis Type */}\n                  <div className="mb-4">\n                    <label className="block text-sm font-medium text-gray-700 mb-2">Calculation Basis</label>\n                    <select\n                      value={parameters.basisType}\n                      onChange={(e) => setParameters(prev => ({ ...prev, basisType: e.target.value as any }))}\n                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"\n                    >\n                      <option value="nav">Net Asset Value</option>\n                      <option value="commitments">Commitments</option>\n                      <option value="invested_capital">Invested Capital</option>\n                      <option value="cost_basis">Cost Basis</option>\n                    </select>\n                  </div>\n\n                  {/* Advanced Options Toggle */}\n                  <button\n                    onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}\n                    className="flex items-center text-sm text-indigo-600 hover:text-indigo-500 mb-2"\n                  >\n                    <AdjustmentsHorizontalIcon className="h-4 w-4 mr-1" />\n                    Advanced Options\n                  </button>\n\n                  {showAdvancedOptions && (\n                    <div className="bg-gray-50 rounded-lg p-3 space-y-3">\n                      <label className="flex items-center">\n                        <input\n                          type="checkbox"\n                          checked={parameters.includeAccruals}\n                          onChange={(e) => setParameters(prev => ({ ...prev, includeAccruals: e.target.checked }))}\n                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"\n                        />\n                        <span className="ml-2 text-sm text-gray-700">Include Accruals</span>\n                      </label>\n                      <label className="flex items-center">\n                        <input\n                          type="checkbox"\n                          checked={parameters.applyDiscounts}\n                          onChange={(e) => setParameters(prev => ({ ...prev, applyDiscounts: e.target.checked }))}\n                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"\n                        />\n                        <span className="ml-2 text-sm text-gray-700">Apply Discounts</span>\n                      </label>\n                      <label className="flex items-center">\n                        <input\n                          type="checkbox"\n                          checked={parameters.applyWaivers}\n                          onChange={(e) => setParameters(prev => ({ ...prev, applyWaivers: e.target.checked }))}\n                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"\n                        />\n                        <span className="ml-2 text-sm text-gray-700">Apply Waivers</span>\n                      </label>\n                      <div>\n                        <label className="block text-sm font-medium text-gray-700 mb-1">Calculation Date</label>\n                        <input\n                          type="date"\n                          value={parameters.calculationDate}\n                          onChange={(e) => setParameters(prev => ({ ...prev, calculationDate: e.target.value }))}\n                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"\n                        />\n                      </div>\n                    </div>\n                  )}\n                </div>\n              </div>\n\n              {/* Preview Panel */}\n              <div className="lg:col-span-2 space-y-6">\n                {loading ? (\n                  <div className="flex justify-center items-center py-12">\n                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>\n                    <span className="ml-3 text-sm text-gray-600">Generating preview...</span>\n                  </div>\n                ) : error ? (\n                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">\n                    {error}\n                  </div>\n                ) : calculationSummary ? (\n                  <>\n                    {/* Summary Cards */}\n                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">\n                      <div className="bg-white border border-gray-200 rounded-lg p-4">\n                        <div className="flex items-center">\n                          <CurrencyDollarIcon className="h-6 w-6 text-green-500" />\n                          <div className="ml-3">\n                            <p className="text-xs font-medium text-gray-500">Gross Amount</p>\n                            <p className="text-lg font-semibold text-gray-900\">\n                              {formatCurrency(calculationSummary.totalGrossAmount)}\n                            </p>\n                          </div>\n                        </div>\n                      </div>\n                      <div className="bg-white border border-gray-200 rounded-lg p-4">\n                        <div className="flex items-center">\n                          <AdjustmentsHorizontalIcon className="h-6 w-6 text-orange-500" />\n                          <div className="ml-3">\n                            <p className="text-xs font-medium text-gray-500">Adjustments</p>\n                            <p className="text-lg font-semibold text-gray-900">\n                              {formatCurrency(Math.abs(calculationSummary.totalAdjustments))}\n                            </p>\n                          </div>\n                        </div>\n                      </div>\n                      <div className="bg-white border border-gray-200 rounded-lg p-4">\n                        <div className="flex items-center">\n                          <CheckCircleIcon className="h-6 w-6 text-blue-500" />\n                          <div className="ml-3">\n                            <p className="text-xs font-medium text-gray-500">Net Amount</p>\n                            <p className="text-lg font-semibold text-gray-900">\n                              {formatCurrency(calculationSummary.totalNetAmount)}\n                            </p>\n                          </div>\n                        </div>\n                      </div>\n                      <div className="bg-white border border-gray-200 rounded-lg p-4">\n                        <div className="flex items-center">\n                          <ClockIcon className="h-6 w-6 text-purple-500" />\n                          <div className="ml-3">\n                            <p className="text-xs font-medium text-gray-500">Est. Time</p>\n                            <p className="text-lg font-semibold text-gray-900">\n                              {calculationSummary.estimatedProcessingTime}s\n                            </p>\n                          </div>\n                        </div>\n                      </div>\n                    </div>\n\n                    {/* Chart */}\n                    <div className="bg-white border border-gray-200 rounded-lg p-6">\n                      <h4 className="text-lg font-medium text-gray-900 mb-4">Fee Preview by Fund</h4>\n                      <ResponsiveContainer width="100%" height={200}>\n                        <LineChart data={getPreviewChart()}>\n                          <CartesianGrid strokeDasharray="3 3" />\n                          <XAxis dataKey="fundName" />\n                          <YAxis />\n                          <Tooltip formatter={(value) => [formatCurrency(value as number), '']} />\n                          <Line type="monotone" dataKey="grossAmount" stroke="#10B981" strokeWidth={2} name="Gross" />\n                          <Line type="monotone" dataKey="netAmount" stroke="#3B82F6" strokeWidth={2} name="Net" />\n                        </LineChart>\n                      </ResponsiveContainer>\n                    </div>\n\n                    {/* Detailed Preview */}\n                    <div className="space-y-4">\n                      {calculationSummary.previews.map((preview) => (\n                        <div key={preview.fundId} className="bg-white border border-gray-200 rounded-lg overflow-hidden">\n                          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">\n                            <div className="flex justify-between items-center">\n                              <h5 className="text-sm font-medium text-gray-900">{preview.fundName}</h5>\n                              <div className="text-right">\n                                <p className="text-sm font-semibold text-gray-900\">\n                                  {formatCurrency(preview.totalNet)}\n                                </p>\n                                <p className="text-xs text-gray-500\">Net Total</p>\n                              </div>\n                            </div>\n                          </div>\n                          <div className="px-4 py-3">\n                            <div className="space-y-2">\n                              {preview.calculations.map((calc, index) => (\n                                <div key={index} className="flex justify-between items-center">\n                                  <div>\n                                    <p className="text-sm font-medium text-gray-900\">\n                                      {calc.feeType.replace('_', ' ').toUpperCase()}\n                                    </p>\n                                    <p className="text-xs text-gray-500">\n                                      {formatCurrency(calc.basisAmount)} @ {formatPercentage(calc.feeRate)}\n                                    </p>\n                                  </div>\n                                  <div className="text-right">\n                                    <p className="text-sm font-medium text-gray-900\">\n                                      {formatCurrency(calc.netAmount)}\n                                    </p>\n                                    {calc.adjustments.length > 0 && (\n                                      <p className="text-xs text-orange-600\">\n                                        {calc.adjustments.length} adjustments\n                                      </p>\n                                    )}\n                                  </div>\n                                </div>\n                              ))}\n                            </div>\n                            \n                            {/* Warnings and Errors */}\n                            {preview.warnings.length > 0 && (\n                              <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-md p-3">\n                                <div className="flex">\n                                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />\n                                  <div className="ml-3">\n                                    <h6 className="text-sm font-medium text-yellow-800\">Warnings</h6>\n                                    <ul className="text-sm text-yellow-700 mt-1\">\n                                      {preview.warnings.map((warning, index) => (\n                                        <li key={index}>• {warning}</li>\n                                      ))}\n                                    </ul>\n                                  </div>\n                                </div>\n                              </div>\n                            )}\n                            \n                            {preview.errors.length > 0 && (\n                              <div className="mt-3 bg-red-50 border border-red-200 rounded-md p-3">\n                                <div className="flex">\n                                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />\n                                  <div className="ml-3">\n                                    <h6 className="text-sm font-medium text-red-800\">Errors</h6>\n                                    <ul className="text-sm text-red-700 mt-1\">\n                                      {preview.errors.map((error, index) => (\n                                        <li key={index}>• {error}</li>\n                                      ))}\n                                    </ul>\n                                  </div>\n                                </div>\n                              </div>\n                            )}\n                          </div>\n                        </div>\n                      ))}\n                    </div>\n                  </>\n                ) : (\n                  <div className="flex justify-center items-center py-12">\n                    <div className="text-center">\n                      <CalculatorIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />\n                      <p className="text-sm text-gray-500\">\n                        Select funds and fee types to generate preview\n                      </p>\n                    </div>\n                  </div>\n                )}\n              </div>\n            </div>\n          </div>\n\n          {/* Footer */}\n          <div className="bg-gray-50 px-6 py-3 flex justify-between items-center\">\n            <div className="flex items-center text-sm text-gray-500">\n              <InformationCircleIcon className="h-5 w-5 mr-2" />\n              Preview calculations are estimates and may differ from actual results\n            </div>\n            <div className="flex space-x-3">\n              <button\n                onClick={onClose}\n                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50\"\n              >\n                Cancel\n              </button>\n              <button\n                onClick={handleExecuteCalculation}\n                disabled={!calculationSummary || calculationSummary.previews.some(p => p.errors.length > 0) || loading}\n                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed\"\n              >\n                {loading ? (\n                  <>\n                    <ClockIcon className="h-4 w-4 mr-2 inline animate-spin" />\n                    Calculating...\n                  </>\n                ) : (\n                  <>\n                    <CalculatorIcon className="h-4 w-4 mr-2 inline" />\n                    Execute Calculations\n                  </>\n                )}\n              </button>\n            </div>\n          </div>\n        </div>\n      </div>\n    </div>\n  );\n};\n\nexport default FeeCalculationPreview;