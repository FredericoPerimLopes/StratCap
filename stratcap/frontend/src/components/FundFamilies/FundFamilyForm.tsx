import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { createFundFamily, updateFundFamily, fetchFundFamilyById } from '../../store/slices/fundFamilySlice';
import {
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  GlobeAltIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface FundFamilyFormData {
  name: string;
  code: string;
  description: string;
  managementCompany: string;
  primaryCurrency: string;
  fiscalYearEnd: string;
  status: 'active' | 'inactive' | 'archived';
  settings: {
    autoApproveCapitalCalls: boolean;
    requireDualApproval: boolean;
    enableNotifications: boolean;
    defaultManagementFeeRate: number;
    defaultCarriedInterestRate: number;
    defaultPreferredReturn: number;
  };
}

const FundFamilyForm: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  
  const { currentFundFamily, isLoading, error } = useSelector((state: RootState) => state.fundFamily);
  
  const [formData, setFormData] = useState<FundFamilyFormData>({
    name: '',
    code: '',
    description: '',
    managementCompany: '',
    primaryCurrency: 'USD',
    fiscalYearEnd: '',
    status: 'active',
    settings: {
      autoApproveCapitalCalls: false,
      requireDualApproval: true,
      enableNotifications: true,
      defaultManagementFeeRate: 2.0,
      defaultCarriedInterestRate: 20.0,
      defaultPreferredReturn: 8.0
    }
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isEdit && id) {
      dispatch(fetchFundFamilyById(Number(id)));
    }
  }, [dispatch, id, isEdit]);

  useEffect(() => {
    if (isEdit && currentFundFamily) {
      setFormData({
        name: currentFundFamily.name || '',
        code: currentFundFamily.code || '',
        description: currentFundFamily.description || '',
        managementCompany: currentFundFamily.managementCompany || '',
        primaryCurrency: currentFundFamily.primaryCurrency || 'USD',
        fiscalYearEnd: currentFundFamily.fiscalYearEnd || '',
        status: currentFundFamily.status || 'active',
        settings: (currentFundFamily.settings && typeof currentFundFamily.settings === 'object' && 'autoApproveCapitalCalls' in currentFundFamily.settings) ? currentFundFamily.settings as typeof formData.settings : formData.settings
      });
    }
  }, [currentFundFamily, isEdit]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Fund family name is required';
    }

    if (!formData.code.trim()) {
      errors.code = 'Fund family code is required';
    } else if (!/^[A-Z0-9_-]+$/i.test(formData.code)) {
      errors.code = 'Code must contain only letters, numbers, hyphens, and underscores';
    }

    if (!formData.managementCompany.trim()) {
      errors.managementCompany = 'Management company is required';
    }

    if (!formData.fiscalYearEnd) {
      errors.fiscalYearEnd = 'Fiscal year end is required';
    }

    if (formData.settings.defaultManagementFeeRate < 0 || formData.settings.defaultManagementFeeRate > 10) {
      errors.managementFee = 'Management fee must be between 0% and 10%';
    }

    if (formData.settings.defaultCarriedInterestRate < 0 || formData.settings.defaultCarriedInterestRate > 50) {
      errors.carriedInterest = 'Carried interest must be between 0% and 50%';
    }

    if (formData.settings.defaultPreferredReturn < 0 || formData.settings.defaultPreferredReturn > 20) {
      errors.preferredReturn = 'Preferred return must be between 0% and 20%';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      if (isEdit && id) {
        await dispatch(updateFundFamily({ id: Number(id), data: formData })).unwrap();
      } else {
        await dispatch(createFundFamily(formData)).unwrap();
      }
      
      setShowSuccess(true);
      setTimeout(() => {
        navigate('/fund-families');
      }, 1500);
    } catch (error) {
      console.error('Failed to save fund family:', error);
    }
  };

  const handleSettingChange = (key: keyof typeof formData.settings, value: any) => {
    setFormData({
      ...formData,
      settings: {
        ...formData.settings,
        [key]: value
      }
    });
  };

  const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'SGD', 'HKD'];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Fund Family' : 'Create New Fund Family'}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          {isEdit ? 'Update the fund family information and settings.' : 'Set up a new fund family with its configuration and default settings.'}
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {showSuccess && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex items-center">
          <CheckCircleIcon className="h-5 w-5 mr-2" />
          Fund family {isEdit ? 'updated' : 'created'} successfully! Redirecting...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <BuildingOfficeIcon className="h-6 w-6 text-gray-400 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Basic Information</h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Fund Family Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                  validationErrors.name ? 'border-red-300' : ''
                }`}
                placeholder="e.g., Growth Equity Fund Family"
              />
              {validationErrors.name && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                Fund Family Code *
              </label>
              <input
                type="text"
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                  validationErrors.code ? 'border-red-300' : ''
                }`}
                placeholder="e.g., GEF"
              />
              {validationErrors.code && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.code}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Provide a brief description of this fund family..."
              />
            </div>

            <div>
              <label htmlFor="managementCompany" className="block text-sm font-medium text-gray-700">
                Management Company *
              </label>
              <input
                type="text"
                id="managementCompany"
                value={formData.managementCompany}
                onChange={(e) => setFormData({ ...formData, managementCompany: e.target.value })}
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                  validationErrors.managementCompany ? 'border-red-300' : ''
                }`}
                placeholder="e.g., ABC Capital Management LLC"
              />
              {validationErrors.managementCompany && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.managementCompany}</p>
              )}
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </div>

        {/* Financial Settings */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <CurrencyDollarIcon className="h-6 w-6 text-gray-400 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Financial Settings</h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="primaryCurrency" className="block text-sm font-medium text-gray-700">
                Primary Currency
              </label>
              <select
                id="primaryCurrency"
                value={formData.primaryCurrency}
                onChange={(e) => setFormData({ ...formData, primaryCurrency: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                {currencies.map(currency => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="fiscalYearEnd" className="block text-sm font-medium text-gray-700">
                Fiscal Year End *
              </label>
              <input
                type="date"
                id="fiscalYearEnd"
                value={formData.fiscalYearEnd}
                onChange={(e) => setFormData({ ...formData, fiscalYearEnd: e.target.value })}
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                  validationErrors.fiscalYearEnd ? 'border-red-300' : ''
                }`}
              />
              {validationErrors.fiscalYearEnd && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.fiscalYearEnd}</p>
              )}
            </div>

            <div>
              <label htmlFor="managementFee" className="block text-sm font-medium text-gray-700">
                Default Management Fee (%)
              </label>
              <input
                type="number"
                id="managementFee"
                min="0"
                max="10"
                step="0.1"
                value={formData.settings.defaultManagementFeeRate}
                onChange={(e) => handleSettingChange('defaultManagementFeeRate', parseFloat(e.target.value))}
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                  validationErrors.managementFee ? 'border-red-300' : ''
                }`}
              />
              {validationErrors.managementFee && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.managementFee}</p>
              )}
            </div>

            <div>
              <label htmlFor="carriedInterest" className="block text-sm font-medium text-gray-700">
                Default Carried Interest (%)
              </label>
              <input
                type="number"
                id="carriedInterest"
                min="0"
                max="50"
                step="0.1"
                value={formData.settings.defaultCarriedInterestRate}
                onChange={(e) => handleSettingChange('defaultCarriedInterestRate', parseFloat(e.target.value))}
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                  validationErrors.carriedInterest ? 'border-red-300' : ''
                }`}
              />
              {validationErrors.carriedInterest && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.carriedInterest}</p>
              )}
            </div>

            <div>
              <label htmlFor="preferredReturn" className="block text-sm font-medium text-gray-700">
                Default Preferred Return (%)
              </label>
              <input
                type="number"
                id="preferredReturn"
                min="0"
                max="20"
                step="0.1"
                value={formData.settings.defaultPreferredReturn}
                onChange={(e) => handleSettingChange('defaultPreferredReturn', parseFloat(e.target.value))}
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                  validationErrors.preferredReturn ? 'border-red-300' : ''
                }`}
              />
              {validationErrors.preferredReturn && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.preferredReturn}</p>
              )}
            </div>
          </div>
        </div>

        {/* Operational Settings */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <GlobeAltIcon className="h-6 w-6 text-gray-400 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Operational Settings</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="autoApprove"
                  type="checkbox"
                  checked={formData.settings.autoApproveCapitalCalls}
                  onChange={(e) => handleSettingChange('autoApproveCapitalCalls', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3">
                <label htmlFor="autoApprove" className="text-sm font-medium text-gray-700">
                  Auto-approve capital calls
                </label>
                <p className="text-sm text-gray-500">
                  Automatically approve capital calls below a certain threshold
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="dualApproval"
                  type="checkbox"
                  checked={formData.settings.requireDualApproval}
                  onChange={(e) => handleSettingChange('requireDualApproval', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3">
                <label htmlFor="dualApproval" className="text-sm font-medium text-gray-700">
                  Require dual approval
                </label>
                <p className="text-sm text-gray-500">
                  Require two approvers for distributions and large capital calls
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="notifications"
                  type="checkbox"
                  checked={formData.settings.enableNotifications}
                  onChange={(e) => handleSettingChange('enableNotifications', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3">
                <label htmlFor="notifications" className="text-sm font-medium text-gray-700">
                  Enable notifications
                </label>
                <p className="text-sm text-gray-500">
                  Send email notifications for important events and approvals
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/fund-families')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {isEdit ? 'Update Fund Family' : 'Create Fund Family'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FundFamilyForm;