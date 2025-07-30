import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { capitalActivityAPI, fundAPI, investorAPI } from '../../services/api';
import {
  CurrencyDollarIcon,
  CalendarIcon,
  BanknotesIcon,
  UsersIcon,
  CheckCircleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

interface CapitalActivityFormData {
  fundId: number | null;
  type: 'capital_call' | 'distribution' | 'equalization' | 'reallocation';
  eventNumber: string;
  eventDate: string;
  dueDate: string;
  baseAmount: number;
  feeAmount: number;
  expenseAmount: number;
  description: string;
  investors: Array<{
    investorId: number;
    amount: number;
    percentage: number;
  }>;
}

const CapitalActivityForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [funds, setFunds] = useState<any[]>([]);
  const [investors, setInvestors] = useState<any[]>([]);
  const [selectedInvestors, setSelectedInvestors] = useState<any[]>([]);
  
  const [formData, setFormData] = useState<CapitalActivityFormData>({
    fundId: null,
    type: 'capital_call',
    eventNumber: '',
    eventDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    baseAmount: 0,
    feeAmount: 0,
    expenseAmount: 0,
    description: '',
    investors: []
  });
  
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        // Fetch funds and investors
        const [fundsRes, investorsRes] = await Promise.all([
          fundAPI.getAll(),
          investorAPI.getAll()
        ]);
        
        setFunds(fundsRes.data.data || []);
        setInvestors(investorsRes.data.data || []);
        
        // If editing, fetch the capital activity
        if (isEdit && id) {
          try {
            const activityRes = await capitalActivityAPI.getById(Number(id));
            const activity = activityRes.data;
            
            setFormData({
              fundId: activity.fundId,
              type: activity.type,
              eventNumber: activity.eventNumber,
              eventDate: activity.eventDate.split('T')[0],
              dueDate: activity.dueDate.split('T')[0],
              baseAmount: activity.baseAmount,
              feeAmount: activity.feeAmount,
              expenseAmount: activity.expenseAmount,
              description: activity.description,
              investors: activity.investors || []
            });
          } catch (editError) {
            setError('Failed to load capital activity data');
          }
        }
        
      } catch (err) {
        setError('Failed to load initial data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, [id, isEdit]);
  
  // Auto-generate event number when type or fund changes
  useEffect(() => {
    if (formData.fundId && formData.type && !isEdit) {
      const fund = funds.find(f => f.id === formData.fundId);
      if (fund) {
        const typePrefix = {
          capital_call: 'CC',
          distribution: 'DIST',
          equalization: 'EQ',
          reallocation: 'REAL'
        }[formData.type];
        
        const year = new Date().getFullYear();
        const eventNumber = `${typePrefix}-${year}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
        
        setFormData(prev => ({ ...prev, eventNumber }));
      }
    }
  }, [formData.fundId, formData.type, funds, isEdit]);
  
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.fundId) {
      errors.fundId = 'Fund selection is required';
    }
    
    if (!formData.eventNumber.trim()) {
      errors.eventNumber = 'Event number is required';
    }
    
    if (!formData.eventDate) {
      errors.eventDate = 'Event date is required';
    }
    
    if (!formData.dueDate) {
      errors.dueDate = 'Due date is required';
    }
    
    if (new Date(formData.dueDate) <= new Date(formData.eventDate)) {
      errors.dueDate = 'Due date must be after event date';
    }
    
    if (formData.baseAmount <= 0) {
      errors.baseAmount = 'Base amount must be greater than 0';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      const submitData = {
        ...formData,
        totalAmount: formData.baseAmount + formData.feeAmount + formData.expenseAmount,
        status: 'draft' as const
      };
      
      if (isEdit) {
        await capitalActivityAPI.update(Number(id), submitData);
      } else {
        await capitalActivityAPI.create(submitData);
      }
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/capital-activities');
      }, 1500);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save capital activity');
    } finally {
      setSaving(false);
    }
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };
  
  const totalAmount = formData.baseAmount + formData.feeAmount + formData.expenseAmount;
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center">
        <button
          onClick={() => navigate('/capital-activities')}
          className="mr-4 text-gray-400 hover:text-gray-600"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Capital Activity' : 'Create New Capital Activity'}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {isEdit ? 'Update the capital activity details.' : 'Set up a new capital call, distribution, or other capital activity.'}
          </p>
        </div>
      </div>
      
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex items-center">
          <CheckCircleIcon className="h-5 w-5 mr-2" />
          Capital activity {isEdit ? 'updated' : 'created'} successfully! Redirecting...
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <BanknotesIcon className="h-6 w-6 text-gray-400 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Basic Information</h2>
          </div>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="fundId" className="block text-sm font-medium text-gray-700">
                Fund *
              </label>
              <select
                id="fundId"
                value={formData.fundId || ''}
                onChange={(e) => setFormData({ ...formData, fundId: e.target.value ? Number(e.target.value) : null })}
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                  validationErrors.fundId ? 'border-red-300' : ''
                }`}
              >
                <option value="">Select a fund...</option>
                {funds.map(fund => (
                  <option key={fund.id} value={fund.id}>{fund.name}</option>
                ))}
              </select>
              {validationErrors.fundId && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.fundId}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Activity Type *
              </label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="capital_call">Capital Call</option>
                <option value="distribution">Distribution</option>
                <option value="equalization">Equalization</option>
                <option value="reallocation">Reallocation</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="eventNumber" className="block text-sm font-medium text-gray-700">
                Event Number *
              </label>
              <input
                type="text"
                id="eventNumber"
                value={formData.eventNumber}
                onChange={(e) => setFormData({ ...formData, eventNumber: e.target.value })}
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                  validationErrors.eventNumber ? 'border-red-300' : ''
                }`}
                placeholder="e.g., CC-2023-001"
              />
              {validationErrors.eventNumber && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.eventNumber}</p>
              )}
            </div>
            
            <div className="sm:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description *
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                  validationErrors.description ? 'border-red-300' : ''
                }`}
                placeholder="Describe the purpose of this capital activity..."
              />
              {validationErrors.description && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Dates */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <CalendarIcon className="h-6 w-6 text-gray-400 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Dates</h2>
          </div>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="eventDate" className="block text-sm font-medium text-gray-700">
                Event Date *
              </label>
              <input
                type="date"
                id="eventDate"
                value={formData.eventDate}
                onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                  validationErrors.eventDate ? 'border-red-300' : ''
                }`}
              />
              {validationErrors.eventDate && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.eventDate}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                Due Date *
              </label>
              <input
                type="date"
                id="dueDate"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                  validationErrors.dueDate ? 'border-red-300' : ''
                }`}
              />
              {validationErrors.dueDate && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.dueDate}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Amounts */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <CurrencyDollarIcon className="h-6 w-6 text-gray-400 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Amounts</h2>
          </div>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <label htmlFor="baseAmount" className="block text-sm font-medium text-gray-700">
                Base Amount *
              </label>
              <input
                type="number"
                id="baseAmount"
                value={formData.baseAmount}
                onChange={(e) => setFormData({ ...formData, baseAmount: Number(e.target.value) })}
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                  validationErrors.baseAmount ? 'border-red-300' : ''
                }`}
                min="0"
                step="0.01"
              />
              {validationErrors.baseAmount && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.baseAmount}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="feeAmount" className="block text-sm font-medium text-gray-700">
                Management Fee
              </label>
              <input
                type="number"
                id="feeAmount"
                value={formData.feeAmount}
                onChange={(e) => setFormData({ ...formData, feeAmount: Number(e.target.value) })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                min="0"
                step="0.01"
              />
            </div>
            
            <div>
              <label htmlFor="expenseAmount" className="block text-sm font-medium text-gray-700">
                Expenses
              </label>
              <input
                type="number"
                id="expenseAmount"
                value={formData.expenseAmount}
                onChange={(e) => setFormData({ ...formData, expenseAmount: Number(e.target.value) })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                min="0"
                step="0.01"
              />
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Total Amount:</span>
              <span className="text-lg font-semibold text-gray-900">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>
        
        {/* Form Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/capital-activities')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {saving ? 'Saving...' : (isEdit ? 'Update Activity' : 'Create Activity')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CapitalActivityForm;
