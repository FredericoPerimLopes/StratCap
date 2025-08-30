import React, { useState, useEffect } from 'react';
import { feeAPI, fundAPI } from '../../services/api';
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  CurrencyDollarIcon,
  DocumentDuplicateIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface FeePostingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

interface PostingData {
  fundIds: number[];
  feeTypes: string[];
  postingDate: string;
  periodStart: string;
  periodEnd: string;
  accountingMethod: 'accrual' | 'cash';
  approvalRequired: boolean;
  notifications: {
    enabled: boolean;
    recipients: string[];
    includeDetails: boolean;
  };
  batchSettings: {
    groupByFund: boolean;
    groupByType: boolean;
    splitLargeAmounts: boolean;
    maxAmountPerPosting: number;
  };
}

interface FeeCalculation {
  id: number;
  fundName: string;
  feeType: string;
  amount: number;
  basisAmount: number;
  rate: number;
  period: string;
  status: 'calculated' | 'approved' | 'pending';
  selected: boolean;
}

interface PostingPreview {
  totalAmount: number;
  postingCount: number;
  byFund: Array<{ fundName: string; amount: number; postings: number }>;
  byType: Array<{ feeType: string; amount: number; postings: number }>;
  accountingEntries: Array<{
    debitAccount: string;
    creditAccount: string;
    amount: number;
    description: string;
  }>;
}

const STEPS = [
  { id: 1, name: 'Selection', description: 'Select fees to post' },
  { id: 2, name: 'Configuration', description: 'Configure posting settings' },
  { id: 3, name: 'Review', description: 'Review and validate' },
  { id: 4, name: 'Confirmation', description: 'Confirm and execute' }
];

const FEE_TYPES = [
  { value: 'management', label: 'Management Fees' },
  { value: 'carried_interest', label: 'Carried Interest' },
  { value: 'performance', label: 'Performance Fees' },
  { value: 'transaction', label: 'Transaction Fees' },
  { value: 'monitoring', label: 'Monitoring Fees' },
  { value: 'other', label: 'Other Fees' }
];

const FeePostingWizard: React.FC<FeePostingWizardProps> = ({ isOpen, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [funds, setFunds] = useState<any[]>([]);
  const [availableCalculations, setAvailableCalculations] = useState<FeeCalculation[]>([]);
  const [postingPreview, setPostingPreview] = useState<PostingPreview | null>(null);
  
  const [formData, setFormData] = useState<PostingData>({
    fundIds: [],
    feeTypes: ['management'],
    postingDate: new Date().toISOString().split('T')[0],
    periodStart: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0],
    periodEnd: new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString().split('T')[0],
    accountingMethod: 'accrual',
    approvalRequired: true,
    notifications: {
      enabled: true,
      recipients: [],
      includeDetails: true
    },
    batchSettings: {
      groupByFund: true,
      groupByType: false,
      splitLargeAmounts: false,
      maxAmountPerPosting: 1000000
    }
  });

  useEffect(() => {
    if (isOpen) {
      fetchInitialData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (currentStep === 3 && formData.fundIds.length > 0) {
      generatePostingPreview();
    }
  }, [currentStep, formData]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // Fetch funds
      const fundsResponse = await fundAPI.getAll();
      setFunds(fundsResponse.data.data || []);

      // Fetch available calculations
      const calculationsResponse = await feeAPI.getAvailableCalculations({
        status: ['calculated', 'approved'],
        includePosted: false
      });
      
      const calculations = calculationsResponse.data.data || [];
      setAvailableCalculations(calculations.map((calc: any) => ({
        ...calc,
        selected: false
      })));

    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const generatePostingPreview = async () => {
    if (availableCalculations.filter(calc => calc.selected).length === 0) return;

    setLoading(true);
    try {
      const selectedCalculations = availableCalculations.filter(calc => calc.selected);
      
      const previewResponse = await feeAPI.generatePostingPreview({
        calculationIds: selectedCalculations.map(calc => calc.id),
        postingSettings: formData
      });

      setPostingPreview(previewResponse.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate preview');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculationToggle = (calculationId: number) => {
    setAvailableCalculations(prev => 
      prev.map(calc => 
        calc.id === calculationId 
          ? { ...calc, selected: !calc.selected }
          : calc
      )
    );
  };

  const handleFundToggle = (fundId: number) => {
    setFormData(prev => ({
      ...prev,
      fundIds: prev.fundIds.includes(fundId)
        ? prev.fundIds.filter(id => id !== fundId)
        : [...prev.fundIds, fundId]
    }));
  };

  const handleFeeTypeToggle = (feeType: string) => {
    setFormData(prev => ({
      ...prev,
      feeTypes: prev.feeTypes.includes(feeType)
        ? prev.feeTypes.filter(type => type !== feeType)
        : [...prev.feeTypes, feeType]
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return availableCalculations.some(calc => calc.selected);
      case 2:
        return formData.fundIds.length > 0 && formData.feeTypes.length > 0;
      case 3:
        return postingPreview !== null;
      default:
        return true;
    }
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
    setLoading(true);
    try {
      const selectedCalculations = availableCalculations.filter(calc => calc.selected);
      
      const response = await feeAPI.processFeePostings({
        calculationIds: selectedCalculations.map(calc => calc.id),
        postingSettings: formData,
        preview: postingPreview
      });

      if (response.data.success) {
        onComplete();
      } else {
        setError('Failed to process fee postings');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to process postings');
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

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select Fee Calculations</h3>
              <p className="text-sm text-gray-600">
                Choose which calculated fees you want to post to the general ledger.
              </p>
            </div>

            {/* Quick Filters */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Filters</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Funds</label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {funds.map(fund => (
                      <label key={fund.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.fundIds.includes(fund.id)}
                          onChange={() => handleFundToggle(fund.id)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">{fund.name}</span>
                      </label>
                    ))}\n                  </div>\n                </div>\n                <div>\n                  <label className=\"text-sm font-medium text-gray-700 mb-2 block\">Fee Types</label>\n                  <div className=\"space-y-2\">\n                    {FEE_TYPES.map(feeType => (\n                      <label key={feeType.value} className=\"flex items-center\">\n                        <input\n                          type=\"checkbox\"\n                          checked={formData.feeTypes.includes(feeType.value)}\n                          onChange={() => handleFeeTypeToggle(feeType.value)}\n                          className=\"h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded\"\n                        />\n                        <span className=\"ml-2 text-sm text-gray-700\">{feeType.label}</span>\n                      </label>\n                    ))}\n                  </div>\n                </div>\n              </div>\n            </div>\n\n            {/* Available Calculations */}\n            <div>\n              <div className=\"flex justify-between items-center mb-4\">\n                <h4 className=\"text-sm font-medium text-gray-900\">Available Calculations</h4>\n                <div className=\"flex space-x-2\">\n                  <button\n                    onClick={() => {\n                      setAvailableCalculations(prev => \n                        prev.map(calc => ({ ...calc, selected: true }))\n                      );\n                    }}\n                    className=\"text-sm text-indigo-600 hover:text-indigo-500\"\n                  >\n                    Select All\n                  </button>\n                  <button\n                    onClick={() => {\n                      setAvailableCalculations(prev => \n                        prev.map(calc => ({ ...calc, selected: false }))\n                      );\n                    }}\n                    className=\"text-sm text-gray-500 hover:text-gray-400\"\n                  >\n                    Clear All\n                  </button>\n                </div>\n              </div>\n\n              <div className=\"border border-gray-200 rounded-lg overflow-hidden\">\n                <table className=\"min-w-full divide-y divide-gray-200\">\n                  <thead className=\"bg-gray-50\">\n                    <tr>\n                      <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">\n                        <input\n                          type=\"checkbox\"\n                          onChange={(e) => {\n                            setAvailableCalculations(prev => \n                              prev.map(calc => ({ ...calc, selected: e.target.checked }))\n                            );\n                          }}\n                          className=\"h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded\"\n                        />\n                      </th>\n                      <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">\n                        Fund & Period\n                      </th>\n                      <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">\n                        Fee Type\n                      </th>\n                      <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">\n                        Amount\n                      </th>\n                      <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">\n                        Status\n                      </th>\n                    </tr>\n                  </thead>\n                  <tbody className=\"bg-white divide-y divide-gray-200\">\n                    {availableCalculations\n                      .filter(calc => \n                        (formData.fundIds.length === 0 || formData.fundIds.some(id => funds.find(f => f.id === id)?.name === calc.fundName)) &&\n                        (formData.feeTypes.length === 0 || formData.feeTypes.includes(calc.feeType))\n                      )\n                      .map((calculation) => (\n                      <tr key={calculation.id} className=\"hover:bg-gray-50\">\n                        <td className=\"px-6 py-4 whitespace-nowrap\">\n                          <input\n                            type=\"checkbox\"\n                            checked={calculation.selected}\n                            onChange={() => handleCalculationToggle(calculation.id)}\n                            className=\"h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded\"\n                          />\n                        </td>\n                        <td className=\"px-6 py-4 whitespace-nowrap\">\n                          <div className=\"text-sm font-medium text-gray-900\">{calculation.fundName}</div>\n                          <div className=\"text-sm text-gray-500\">{calculation.period}</div>\n                        </td>\n                        <td className=\"px-6 py-4 whitespace-nowrap\">\n                          <span className=\"inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800\">\n                            {calculation.feeType.replace('_', ' ')}\n                          </span>\n                        </td>\n                        <td className=\"px-6 py-4 whitespace-nowrap text-sm text-gray-900\">\n                          {formatCurrency(calculation.amount)}\n                        </td>\n                        <td className=\"px-6 py-4 whitespace-nowrap\">\n                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${\n                            calculation.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'\n                          }`}>\n                            {calculation.status}\n                          </span>\n                        </td>\n                      </tr>\n                    ))}\n                  </tbody>\n                </table>\n              </div>\n            </div>\n\n            <div className=\"bg-blue-50 border border-blue-200 rounded-lg p-4\">\n              <div className=\"flex\">\n                <InformationCircleIcon className=\"h-5 w-5 text-blue-400\" />\n                <div className=\"ml-3\">\n                  <h4 className=\"text-sm font-medium text-blue-800\">Selection Summary</h4>\n                  <p className=\"text-sm text-blue-700 mt-1\">\n                    {availableCalculations.filter(calc => calc.selected).length} calculations selected for posting.\n                    Total amount: {formatCurrency(availableCalculations.filter(calc => calc.selected).reduce((sum, calc) => sum + calc.amount, 0))}\n                  </p>\n                </div>\n              </div>\n            </div>\n          </div>\n        );\n\n      case 2:\n        return (\n          <div className=\"space-y-6\">\n            <div>\n              <h3 className=\"text-lg font-medium text-gray-900 mb-2\">Posting Configuration</h3>\n              <p className=\"text-sm text-gray-600\">\n                Configure how the selected fees should be posted to the general ledger.\n              </p>\n            </div>\n\n            <div className=\"grid grid-cols-1 md:grid-cols-2 gap-6\">\n              <div>\n                <label className=\"block text-sm font-medium text-gray-700 mb-2\">\n                  Posting Date\n                </label>\n                <input\n                  type=\"date\"\n                  value={formData.postingDate}\n                  onChange={(e) => setFormData(prev => ({ ...prev, postingDate: e.target.value }))}\n                  className=\"block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm\"\n                />\n              </div>\n\n              <div>\n                <label className=\"block text-sm font-medium text-gray-700 mb-2\">\n                  Accounting Method\n                </label>\n                <select\n                  value={formData.accountingMethod}\n                  onChange={(e) => setFormData(prev => ({ ...prev, accountingMethod: e.target.value as 'accrual' | 'cash' }))}\n                  className=\"block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm\"\n                >\n                  <option value=\"accrual\">Accrual</option>\n                  <option value=\"cash\">Cash</option>\n                </select>\n              </div>\n            </div>\n\n            {/* Batch Settings */}\n            <div className=\"bg-gray-50 rounded-lg p-4\">\n              <h4 className=\"text-sm font-medium text-gray-900 mb-3\">Batch Settings</h4>\n              <div className=\"space-y-3\">\n                <label className=\"flex items-center\">\n                  <input\n                    type=\"checkbox\"\n                    checked={formData.batchSettings.groupByFund}\n                    onChange={(e) => setFormData(prev => ({\n                      ...prev,\n                      batchSettings: { ...prev.batchSettings, groupByFund: e.target.checked }\n                    }))}\n                    className=\"h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded\"\n                  />\n                  <span className=\"ml-2 text-sm text-gray-700\">Group postings by fund</span>\n                </label>\n                <label className=\"flex items-center\">\n                  <input\n                    type=\"checkbox\"\n                    checked={formData.batchSettings.groupByType}\n                    onChange={(e) => setFormData(prev => ({\n                      ...prev,\n                      batchSettings: { ...prev.batchSettings, groupByType: e.target.checked }\n                    }))}\n                    className=\"h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded\"\n                  />\n                  <span className=\"ml-2 text-sm text-gray-700\">Group postings by fee type</span>\n                </label>\n                <label className=\"flex items-center\">\n                  <input\n                    type=\"checkbox\"\n                    checked={formData.batchSettings.splitLargeAmounts}\n                    onChange={(e) => setFormData(prev => ({\n                      ...prev,\n                      batchSettings: { ...prev.batchSettings, splitLargeAmounts: e.target.checked }\n                    }))}\n                    className=\"h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded\"\n                  />\n                  <span className=\"ml-2 text-sm text-gray-700\">Split large amounts</span>\n                </label>\n                {formData.batchSettings.splitLargeAmounts && (\n                  <div className=\"ml-6\">\n                    <label className=\"block text-sm font-medium text-gray-700 mb-1\">\n                      Maximum amount per posting\n                    </label>\n                    <input\n                      type=\"number\"\n                      value={formData.batchSettings.maxAmountPerPosting}\n                      onChange={(e) => setFormData(prev => ({\n                        ...prev,\n                        batchSettings: { ...prev.batchSettings, maxAmountPerPosting: Number(e.target.value) }\n                      }))}\n                      className=\"block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm\"\n                      min=\"1000\"\n                      step=\"1000\"\n                    />\n                  </div>\n                )}\n              </div>\n            </div>\n\n            {/* Approval & Notifications */}\n            <div className=\"bg-gray-50 rounded-lg p-4\">\n              <h4 className=\"text-sm font-medium text-gray-900 mb-3\">Approval & Notifications</h4>\n              <div className=\"space-y-3\">\n                <label className=\"flex items-center\">\n                  <input\n                    type=\"checkbox\"\n                    checked={formData.approvalRequired}\n                    onChange={(e) => setFormData(prev => ({ ...prev, approvalRequired: e.target.checked }))}\n                    className=\"h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded\"\n                  />\n                  <span className=\"ml-2 text-sm text-gray-700\">Require approval before posting</span>\n                </label>\n                <label className=\"flex items-center\">\n                  <input\n                    type=\"checkbox\"\n                    checked={formData.notifications.enabled}\n                    onChange={(e) => setFormData(prev => ({\n                      ...prev,\n                      notifications: { ...prev.notifications, enabled: e.target.checked }\n                    }))}\n                    className=\"h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded\"\n                  />\n                  <span className=\"ml-2 text-sm text-gray-700\">Send notifications</span>\n                </label>\n              </div>\n            </div>\n          </div>\n        );\n\n      case 3:\n        return (\n          <div className=\"space-y-6\">\n            <div>\n              <h3 className=\"text-lg font-medium text-gray-900 mb-2\">Review & Validate</h3>\n              <p className=\"text-sm text-gray-600\">\n                Review the posting preview and validate all entries before processing.\n              </p>\n            </div>\n\n            {postingPreview && (\n              <>\n                {/* Summary Cards */}\n                <div className=\"grid grid-cols-1 md:grid-cols-3 gap-4\">\n                  <div className=\"bg-white border border-gray-200 rounded-lg p-4\">\n                    <div className=\"flex items-center\">\n                      <CurrencyDollarIcon className=\"h-8 w-8 text-green-500\" />\n                      <div className=\"ml-3\">\n                        <p className=\"text-sm font-medium text-gray-500\">Total Amount</p>\n                        <p className=\"text-xl font-semibold text-gray-900\">\n                          {formatCurrency(postingPreview.totalAmount)}\n                        </p>\n                      </div>\n                    </div>\n                  </div>\n                  <div className=\"bg-white border border-gray-200 rounded-lg p-4\">\n                    <div className=\"flex items-center\">\n                      <DocumentDuplicateIcon className=\"h-8 w-8 text-blue-500\" />\n                      <div className=\"ml-3\">\n                        <p className=\"text-sm font-medium text-gray-500\">Postings</p>\n                        <p className=\"text-xl font-semibold text-gray-900\">{postingPreview.postingCount}</p>\n                      </div>\n                    </div>\n                  </div>\n                  <div className=\"bg-white border border-gray-200 rounded-lg p-4\">\n                    <div className=\"flex items-center\">\n                      <CheckCircleIcon className=\"h-8 w-8 text-purple-500\" />\n                      <div className=\"ml-3\">\n                        <p className=\"text-sm font-medium text-gray-500\">Status</p>\n                        <p className=\"text-xl font-semibold text-gray-900\">Ready</p>\n                      </div>\n                    </div>\n                  </div>\n                </div>\n\n                {/* Breakdown Tables */}\n                <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">\n                  <div className=\"bg-white border border-gray-200 rounded-lg overflow-hidden\">\n                    <div className=\"px-4 py-3 border-b border-gray-200\">\n                      <h4 className=\"text-sm font-medium text-gray-900\">By Fund</h4>\n                    </div>\n                    <div className=\"divide-y divide-gray-200\">\n                      {postingPreview.byFund.map((fund, index) => (\n                        <div key={index} className=\"px-4 py-3 flex justify-between items-center\">\n                          <div>\n                            <p className=\"text-sm font-medium text-gray-900\">{fund.fundName}</p>\n                            <p className=\"text-sm text-gray-500\">{fund.postings} postings</p>\n                          </div>\n                          <p className=\"text-sm font-semibold text-gray-900\">\n                            {formatCurrency(fund.amount)}\n                          </p>\n                        </div>\n                      ))}\n                    </div>\n                  </div>\n\n                  <div className=\"bg-white border border-gray-200 rounded-lg overflow-hidden\">\n                    <div className=\"px-4 py-3 border-b border-gray-200\">\n                      <h4 className=\"text-sm font-medium text-gray-900\">By Fee Type</h4>\n                    </div>\n                    <div className=\"divide-y divide-gray-200\">\n                      {postingPreview.byType.map((feeType, index) => (\n                        <div key={index} className=\"px-4 py-3 flex justify-between items-center\">\n                          <div>\n                            <p className=\"text-sm font-medium text-gray-900\">\n                              {feeType.feeType.replace('_', ' ')}\n                            </p>\n                            <p className=\"text-sm text-gray-500\">{feeType.postings} postings</p>\n                          </div>\n                          <p className=\"text-sm font-semibold text-gray-900\">\n                            {formatCurrency(feeType.amount)}\n                          </p>\n                        </div>\n                      ))}\n                    </div>\n                  </div>\n                </div>\n\n                {/* Accounting Entries Preview */}\n                <div className=\"bg-white border border-gray-200 rounded-lg overflow-hidden\">\n                  <div className=\"px-4 py-3 border-b border-gray-200\">\n                    <h4 className=\"text-sm font-medium text-gray-900\">Accounting Entries Preview</h4>\n                  </div>\n                  <div className=\"overflow-x-auto\">\n                    <table className=\"min-w-full divide-y divide-gray-200\">\n                      <thead className=\"bg-gray-50\">\n                        <tr>\n                          <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">\n                            Description\n                          </th>\n                          <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">\n                            Debit Account\n                          </th>\n                          <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">\n                            Credit Account\n                          </th>\n                          <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">\n                            Amount\n                          </th>\n                        </tr>\n                      </thead>\n                      <tbody className=\"bg-white divide-y divide-gray-200\">\n                        {postingPreview.accountingEntries.map((entry, index) => (\n                          <tr key={index}>\n                            <td className=\"px-6 py-4 whitespace-nowrap text-sm text-gray-900\">\n                              {entry.description}\n                            </td>\n                            <td className=\"px-6 py-4 whitespace-nowrap text-sm text-gray-900\">\n                              {entry.debitAccount}\n                            </td>\n                            <td className=\"px-6 py-4 whitespace-nowrap text-sm text-gray-900\">\n                              {entry.creditAccount}\n                            </td>\n                            <td className=\"px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900\">\n                              {formatCurrency(entry.amount)}\n                            </td>\n                          </tr>\n                        ))}\n                      </tbody>\n                    </table>\n                  </div>\n                </div>\n              </>\n            )}\n          </div>\n        );\n\n      case 4:\n        return (\n          <div className=\"space-y-6\">\n            <div>\n              <h3 className=\"text-lg font-medium text-gray-900 mb-2\">Confirm Processing</h3>\n              <p className=\"text-sm text-gray-600\">\n                Please confirm that you want to process these fee postings.\n              </p>\n            </div>\n\n            <div className=\"bg-yellow-50 border border-yellow-200 rounded-lg p-4\">\n              <div className=\"flex\">\n                <ExclamationTriangleIcon className=\"h-5 w-5 text-yellow-400\" />\n                <div className=\"ml-3\">\n                  <h4 className=\"text-sm font-medium text-yellow-800\">Important</h4>\n                  <div className=\"text-sm text-yellow-700 mt-1\">\n                    <p>This action will:</p>\n                    <ul className=\"list-disc list-inside mt-2 space-y-1\">\n                      <li>Create {postingPreview?.postingCount || 0} accounting entries</li>\n                      <li>Post {formatCurrency(postingPreview?.totalAmount || 0)} in fees</li>\n                      <li>Update fee calculation status to \"posted\"</li>\n                      <li>Generate audit trail entries</li>\n                      {formData.notifications.enabled && <li>Send notification emails</li>}\n                    </ul>\n                  </div>\n                </div>\n              </div>\n            </div>\n\n            {formData.approvalRequired && (\n              <div className=\"bg-blue-50 border border-blue-200 rounded-lg p-4\">\n                <div className=\"flex\">\n                  <InformationCircleIcon className=\"h-5 w-5 text-blue-400\" />\n                  <div className=\"ml-3\">\n                    <h4 className=\"text-sm font-medium text-blue-800\">Approval Required</h4>\n                    <p className=\"text-sm text-blue-700 mt-1\">\n                      These postings will be queued for approval and will not be immediately posted to the general ledger.\n                    </p>\n                  </div>\n                </div>\n              </div>\n            )}\n          </div>\n        );\n\n      default:\n        return null;\n    }\n  };\n\n  if (!isOpen) return null;\n\n  return (\n    <div className=\"fixed inset-0 z-50 overflow-y-auto\" aria-labelledby=\"modal-title\" role=\"dialog\" aria-modal=\"true\">\n      <div className=\"flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0\">\n        <div className=\"fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity\" aria-hidden=\"true\"></div>\n        \n        <span className=\"hidden sm:inline-block sm:align-middle sm:h-screen\" aria-hidden=\"true\">&#8203;</span>\n        \n        <div className=\"inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full\">\n          {/* Header */}\n          <div className=\"bg-white px-6 py-4 border-b border-gray-200\">\n            <div className=\"flex items-center justify-between\">\n              <div>\n                <h3 className=\"text-lg font-medium text-gray-900\" id=\"modal-title\">\n                  Fee Posting Wizard\n                </h3>\n                <p className=\"text-sm text-gray-500 mt-1\">\n                  Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].description}\n                </p>\n              </div>\n              <button\n                onClick={onClose}\n                className=\"bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500\"\n              >\n                <XMarkIcon className=\"h-6 w-6\" />\n              </button>\n            </div>\n          </div>\n\n          {/* Progress Bar */}\n          <div className=\"px-6 py-2 bg-gray-50 border-b border-gray-200\">\n            <div className=\"flex items-center\">\n              {STEPS.map((step, index) => (\n                <React.Fragment key={step.id}>\n                  <div className={`flex items-center ${\n                    currentStep > step.id\n                      ? 'text-indigo-600'\n                      : currentStep === step.id\n                      ? 'text-indigo-600'\n                      : 'text-gray-400'\n                  }`}>\n                    <div className={`flex items-center justify-center w-8 h-8 border-2 rounded-full ${\n                      currentStep > step.id\n                        ? 'bg-indigo-600 border-indigo-600 text-white'\n                        : currentStep === step.id\n                        ? 'border-indigo-600 bg-white text-indigo-600'\n                        : 'border-gray-300 bg-white text-gray-400'\n                    }`}>\n                      {currentStep > step.id ? (\n                        <CheckIcon className=\"w-5 h-5\" />\n                      ) : (\n                        <span className=\"text-sm font-medium\">{step.id}</span>\n                      )}\n                    </div>\n                    <span className=\"ml-2 text-sm font-medium\">{step.name}</span>\n                  </div>\n                  {index < STEPS.length - 1 && (\n                    <div className={`flex-1 h-0.5 mx-4 ${\n                      currentStep > step.id ? 'bg-indigo-600' : 'bg-gray-200'\n                    }`} />\n                  )}\n                </React.Fragment>\n              ))}\n            </div>\n          </div>\n\n          {/* Content */}\n          <div className=\"px-6 py-6 max-h-96 overflow-y-auto\">\n            {loading ? (\n              <div className=\"flex justify-center items-center py-12\">\n                <div className=\"animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600\"></div>\n                <span className=\"ml-3 text-sm text-gray-600\">Processing...</span>\n              </div>\n            ) : error ? (\n              <div className=\"bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded\">\n                {error}\n              </div>\n            ) : (\n              renderStepContent()\n            )}\n          </div>\n\n          {/* Footer */}\n          <div className=\"bg-gray-50 px-6 py-3 flex justify-between\">\n            <button\n              onClick={handlePrevious}\n              disabled={currentStep === 1 || loading}\n              className=\"flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed\"\n            >\n              <ChevronLeftIcon className=\"h-4 w-4 mr-1\" />\n              Previous\n            </button>\n\n            {currentStep < STEPS.length ? (\n              <button\n                onClick={handleNext}\n                disabled={!validateStep(currentStep) || loading}\n                className=\"flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed\"\n              >\n                Next\n                <ChevronRightIcon className=\"h-4 w-4 ml-1\" />\n              </button>\n            ) : (\n              <button\n                onClick={handleSubmit}\n                disabled={loading}\n                className=\"flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed\"\n              >\n                {loading ? (\n                  <>\n                    <ClockIcon className=\"h-4 w-4 mr-1 animate-spin\" />\n                    Processing...\n                  </>\n                ) : (\n                  <>\n                    <CheckIcon className=\"h-4 w-4 mr-1\" />\n                    Process Postings\n                  </>\n                )}\n              </button>\n            )}\n          </div>\n        </div>\n      </div>\n    </div>\n  );\n};\n\nexport default FeePostingWizard;\n