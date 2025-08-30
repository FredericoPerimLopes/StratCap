import React, { useState, useEffect } from 'react';
import { feeAPI, fundAPI } from '../../services/api';
import {
  PlusIcon,
  TrashIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  DocumentDuplicateIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

interface FeeStructure {
  id: number;
  fundId: number;
  fundName: string;
  feeType: 'management' | 'performance' | 'transaction' | 'carried_interest' | 'other';
  name: string;
  description: string;
  structure: 'flat' | 'tiered' | 'stepped' | 'sliding' | 'hurdle_based';
  baseCurrency: string;
  applicableFrom: string;
  applicableTo?: string;
  isActive: boolean;
  tiers: Array<{
    id: string;
    minAmount: number;
    maxAmount?: number;
    rate: number;
    description: string;
  }>;
  conditions: {
    minimumCommitment?: number;
    investorTypes?: string[];
    geographicRestrictions?: string[];
    lockupPeriod?: number;
    performanceThreshold?: number;
    hurdleRate?: number;
  };
  discounts: Array<{
    id: string;
    name: string;
    description: string;
    type: 'percentage' | 'amount' | 'rate_reduction';
    value: number;
    conditions: {
      minimumCommitment?: number;
      investorType?: string;
      commitmentDate?: string;
      loyaltyPeriod?: number;
    };
    validFrom: string;
    validTo?: string;
    isActive: boolean;
  }>;
  waivers: Array<{
    id: string;
    name: string;
    description: string;
    type: 'full' | 'partial' | 'conditional';
    amount?: number;
    percentage?: number;
    conditions: {
      investorIds?: number[];
      reason: string;
      approvedBy: string;
      approvalDate: string;
    };
    validFrom: string;
    validTo?: string;
    isActive: boolean;
  }>;
}

const FeeStructureConfiguration: React.FC = () => {
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [funds, setFunds] = useState<any[]>([]);
  const [selectedStructure, setSelectedStructure] = useState<FeeStructure | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewStructure, setShowNewStructure] = useState(false);
  const [activeTab, setActiveTab] = useState<'structure' | 'discounts' | 'waivers'>('structure');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [structuresResponse, fundsResponse] = await Promise.all([
        feeAPI.getFeeStructures(),
        fundAPI.getAll()
      ]);
      
      setFeeStructures(structuresResponse.data.data || []);
      setFunds(fundsResponse.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load fee structures');
    } finally {
      setLoading(false);
    }
  };

  const createNewStructure = (): FeeStructure => ({
    id: 0,
    fundId: 0,
    fundName: '',
    feeType: 'management',
    name: '',
    description: '',
    structure: 'flat',
    baseCurrency: 'USD',
    applicableFrom: new Date().toISOString().split('T')[0],
    isActive: true,
    tiers: [{ id: '1', minAmount: 0, rate: 0.02, description: 'Base management fee' }],
    conditions: {},
    discounts: [],
    waivers: []
  });

  const handleStructureSelect = (structure: FeeStructure) => {
    setSelectedStructure({ ...structure });
    setShowNewStructure(false);
  };

  const handleNewStructure = () => {
    setSelectedStructure(createNewStructure());
    setShowNewStructure(true);
  };

  const validateStructure = (structure: FeeStructure): boolean => {
    const errors: Record<string, string> = {};
    
    if (!structure.name?.trim()) {
      errors.name = 'Structure name is required';
    }
    
    if (!structure.fundId || structure.fundId === 0) {
      errors.fundId = 'Please select a fund';
    }
    
    if (!structure.applicableFrom) {
      errors.applicableFrom = 'Applicable from date is required';
    }
    
    if (structure.tiers.length === 0) {
      errors.tiers = 'At least one tier is required';
    }
    
    structure.tiers.forEach((tier, index) => {
      if (tier.rate <= 0) {
        errors[`tier_${index}_rate`] = 'Tier rate must be greater than 0';
      }
      if (tier.minAmount < 0) {
        errors[`tier_${index}_min`] = 'Minimum amount cannot be negative';
      }
    });
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveStructure = async () => {
    if (!selectedStructure || !validateStructure(selectedStructure)) return;
    
    setLoading(true);
    try {
      let response;
      if (showNewStructure) {
        response = await feeAPI.createFeeStructure(selectedStructure);
      } else {
        response = await feeAPI.updateFeeStructure(selectedStructure.id, selectedStructure);
      }
      
      if (response.data.success) {
        await fetchData();
        setSelectedStructure(null);
        setShowNewStructure(false);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save fee structure');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStructure = async (structureId: number) => {
    if (!confirm('Are you sure you want to delete this fee structure?')) return;
    
    try {
      await feeAPI.deleteFeeStructure(structureId);
      await fetchData();
      if (selectedStructure?.id === structureId) {
        setSelectedStructure(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete fee structure');
    }
  };

  const handleAddTier = () => {
    if (!selectedStructure) return;
    
    const newTier = {
      id: Date.now().toString(),
      minAmount: selectedStructure.tiers.length > 0 ? 
        Math.max(...selectedStructure.tiers.map(t => t.maxAmount || 0)) : 0,
      rate: 0.015,
      description: `Tier ${selectedStructure.tiers.length + 1}`
    };
    
    setSelectedStructure({
      ...selectedStructure,
      tiers: [...selectedStructure.tiers, newTier]
    });
  };

  const handleRemoveTier = (tierId: string) => {
    if (!selectedStructure) return;
    
    setSelectedStructure({
      ...selectedStructure,
      tiers: selectedStructure.tiers.filter(t => t.id !== tierId)
    });
  };

  const handleTierChange = (tierId: string, field: string, value: any) => {
    if (!selectedStructure) return;
    
    setSelectedStructure({
      ...selectedStructure,
      tiers: selectedStructure.tiers.map(tier =>
        tier.id === tierId ? { ...tier, [field]: value } : tier
      )
    });
  };

  const handleAddDiscount = () => {
    if (!selectedStructure) return;
    
    const newDiscount = {
      id: Date.now().toString(),
      name: '',
      description: '',
      type: 'percentage' as const,
      value: 0,
      conditions: {},
      validFrom: new Date().toISOString().split('T')[0],
      isActive: true
    };
    
    setSelectedStructure({
      ...selectedStructure,
      discounts: [...selectedStructure.discounts, newDiscount]
    });
  };

  const handleAddWaiver = () => {
    if (!selectedStructure) return;
    
    const newWaiver = {
      id: Date.now().toString(),
      name: '',
      description: '',
      type: 'partial' as const,
      percentage: 0,
      conditions: {
        reason: '',
        approvedBy: '',
        approvalDate: new Date().toISOString().split('T')[0]
      },
      validFrom: new Date().toISOString().split('T')[0],
      isActive: true
    };
    
    setSelectedStructure({
      ...selectedStructure,
      waivers: [...selectedStructure.waivers, newWaiver]
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(3)}%`;
  };

  const renderStructureEditor = () => {
    if (!selectedStructure) return null;

    return (
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              {showNewStructure ? 'New Fee Structure' : 'Edit Fee Structure'}
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setSelectedStructure(null);
                  setShowNewStructure(false);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStructure}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { key: 'structure', label: 'Structure & Tiers', icon: Cog6ToothIcon },
              { key: 'discounts', label: 'Discounts', icon: CurrencyDollarIcon },
              { key: 'waivers', label: 'Waivers', icon: DocumentDuplicateIcon }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'structure' && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Structure Name *
                  </label>
                  <input
                    type="text"
                    value={selectedStructure.name}
                    onChange={(e) => setSelectedStructure({ ...selectedStructure, name: e.target.value })}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="e.g., Standard Management Fee"
                  />
                  {validationErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fund *
                  </label>
                  <select
                    value={selectedStructure.fundId}
                    onChange={(e) => {
                      const fundId = Number(e.target.value);
                      const fund = funds.find(f => f.id === fundId);
                      setSelectedStructure({
                        ...selectedStructure,
                        fundId,
                        fundName: fund?.name || ''
                      });
                    }}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value={0}>Select a fund...</option>
                    {funds.map(fund => (
                      <option key={fund.id} value={fund.id}>{fund.name}</option>
                    ))}
                  </select>
                  {validationErrors.fundId && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.fundId}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fee Type
                  </label>
                  <select
                    value={selectedStructure.feeType}
                    onChange={(e) => setSelectedStructure({ ...selectedStructure, feeType: e.target.value as any })}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="management">Management Fee</option>
                    <option value="performance">Performance Fee</option>
                    <option value="carried_interest">Carried Interest</option>
                    <option value="transaction">Transaction Fee</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Structure Type
                  </label>
                  <select
                    value={selectedStructure.structure}
                    onChange={(e) => setSelectedStructure({ ...selectedStructure, structure: e.target.value as any })}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="flat">Flat Rate</option>
                    <option value="tiered">Tiered</option>
                    <option value="stepped">Stepped</option>
                    <option value="sliding">Sliding Scale</option>
                    <option value="hurdle_based">Hurdle-Based</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={selectedStructure.description}
                  onChange={(e) => setSelectedStructure({ ...selectedStructure, description: e.target.value })}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Describe this fee structure..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Applicable From *
                  </label>
                  <input
                    type="date"
                    value={selectedStructure.applicableFrom}
                    onChange={(e) => setSelectedStructure({ ...selectedStructure, applicableFrom: e.target.value })}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Applicable To
                  </label>
                  <input
                    type="date"
                    value={selectedStructure.applicableTo || ''}
                    onChange={(e) => setSelectedStructure({ ...selectedStructure, applicableTo: e.target.value || undefined })}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={selectedStructure.isActive ? 'active' : 'inactive'}
                    onChange={(e) => setSelectedStructure({ ...selectedStructure, isActive: e.target.value === 'active' })}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Tiers */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-medium text-gray-900">Fee Tiers</h4>
                  <button
                    onClick={handleAddTier}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Tier
                  </button>
                </div>

                <div className="space-y-4">
                  {selectedStructure.tiers.map((tier, index) => (
                    <div key={tier.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-4">
                        <h5 className="text-sm font-medium text-gray-900">Tier {index + 1}</h5>
                        {selectedStructure.tiers.length > 1 && (
                          <button
                            onClick={() => handleRemoveTier(tier.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Min Amount ($)
                          </label>
                          <input
                            type="number"
                            value={tier.minAmount}
                            onChange={(e) => handleTierChange(tier.id, 'minAmount', Number(e.target.value))}
                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            min="0"
                            step="1000"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Max Amount ($)
                          </label>
                          <input
                            type="number"
                            value={tier.maxAmount || ''}
                            onChange={(e) => handleTierChange(tier.id, 'maxAmount', e.target.value ? Number(e.target.value) : undefined)}
                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            min={tier.minAmount}
                            step="1000"
                            placeholder="Unlimited"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Rate (%)
                          </label>
                          <input
                            type="number"
                            value={tier.rate * 100}
                            onChange={(e) => handleTierChange(tier.id, 'rate', Number(e.target.value) / 100)}
                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            min="0"
                            step="0.001"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                          </label>
                          <input
                            type="text"
                            value={tier.description}
                            onChange={(e) => handleTierChange(tier.id, 'description', e.target.value)}
                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Tier description"
                          />
                        </div>
                      </div>
                      {validationErrors[`tier_${index}_rate`] && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors[`tier_${index}_rate`]}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'discounts' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-lg font-medium text-gray-900">Fee Discounts</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Configure automatic discounts based on commitment size, investor type, or other criteria.
                  </p>
                </div>
                <button
                  onClick={handleAddDiscount}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Discount
                </button>
              </div>

              <div className="space-y-4">
                {selectedStructure.discounts.map((discount, index) => (
                  <div key={discount.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <h5 className="text-sm font-medium text-gray-900">Discount {index + 1}</h5>
                      <button
                        onClick={() => setSelectedStructure({
                          ...selectedStructure,
                          discounts: selectedStructure.discounts.filter(d => d.id !== discount.id)
                        })}
                        className="text-red-600 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input
                          type="text"
                          value={discount.name}
                          onChange={(e) => {
                            const updatedDiscounts = [...selectedStructure.discounts];
                            updatedDiscounts[index] = { ...discount, name: e.target.value };
                            setSelectedStructure({ ...selectedStructure, discounts: updatedDiscounts });
                          }}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="Discount name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select
                          value={discount.type}
                          onChange={(e) => {
                            const updatedDiscounts = [...selectedStructure.discounts];
                            updatedDiscounts[index] = { ...discount, type: e.target.value as any };
                            setSelectedStructure({ ...selectedStructure, discounts: updatedDiscounts });
                          }}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                          <option value="percentage">Percentage</option>
                          <option value="amount">Fixed Amount</option>
                          <option value="rate_reduction">Rate Reduction</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Value {discount.type === 'percentage' ? '(%)' : discount.type === 'amount' ? '($)' : '(% points)'}
                        </label>
                        <input
                          type="number"
                          value={discount.type === 'percentage' ? discount.value * 100 : discount.value}
                          onChange={(e) => {
                            const value = discount.type === 'percentage' ? Number(e.target.value) / 100 : Number(e.target.value);
                            const updatedDiscounts = [...selectedStructure.discounts];
                            updatedDiscounts[index] = { ...discount, value };
                            setSelectedStructure({ ...selectedStructure, discounts: updatedDiscounts });
                          }}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          min="0"
                          step={discount.type === 'percentage' ? '0.1' : '1000'}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'waivers' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-lg font-medium text-gray-900">Fee Waivers</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Manage special fee waivers for specific investors or circumstances.
                  </p>
                </div>
                <button
                  onClick={handleAddWaiver}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Waiver
                </button>
              </div>

              <div className="space-y-4">
                {selectedStructure.waivers.map((waiver, index) => (
                  <div key={waiver.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <h5 className="text-sm font-medium text-gray-900">Waiver {index + 1}</h5>
                      <button
                        onClick={() => setSelectedStructure({
                          ...selectedStructure,
                          waivers: selectedStructure.waivers.filter(w => w.id !== waiver.id)
                        })}
                        className="text-red-600 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input
                          type="text"
                          value={waiver.name}
                          onChange={(e) => {
                            const updatedWaivers = [...selectedStructure.waivers];
                            updatedWaivers[index] = { ...waiver, name: e.target.value };
                            setSelectedStructure({ ...selectedStructure, waivers: updatedWaivers });
                          }}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="Waiver name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select
                          value={waiver.type}
                          onChange={(e) => {
                            const updatedWaivers = [...selectedStructure.waivers];
                            updatedWaivers[index] = { ...waiver, type: e.target.value as any };
                            setSelectedStructure({ ...selectedStructure, waivers: updatedWaivers });
                          }}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                          <option value="full">Full Waiver</option>
                          <option value="partial">Partial Waiver</option>
                          <option value="conditional">Conditional Waiver</option>
                        </select>
                      </div>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                      <div className="flex">
                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                        <div className="ml-3">
                          <h6 className="text-sm font-medium text-yellow-800">Approval Required</h6>
                          <p className="text-sm text-yellow-700 mt-1">
                            Fee waivers require management approval and proper documentation.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading && feeStructures.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Fee Structure Configuration</h2>
          <p className="text-sm text-gray-600 mt-1">
            Configure fee structures, tiers, discounts, and waivers for your funds.
          </p>
        </div>
        <button
          onClick={handleNewStructure}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Structure
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Structure List */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-900">Fee Structures</h3>
            </div>
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {feeStructures.map((structure) => (
                <div
                  key={structure.id}
                  onClick={() => handleStructureSelect(structure)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 ${
                    selectedStructure?.id === structure.id ? 'bg-indigo-50 border-r-2 border-indigo-500' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{structure.name}</p>
                      <p className="text-sm text-gray-500 truncate">{structure.fundName}</p>
                      <div className="flex items-center mt-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          structure.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {structure.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                          {structure.tiers.length} tier{structure.tiers.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteStructure(structure.id);
                      }}
                      className="ml-2 text-red-600 hover:text-red-700"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              {feeStructures.length === 0 && (
                <div className="p-4 text-center text-gray-500">
                  <Cog6ToothIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No fee structures configured</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Structure Editor */}
        <div className="lg:col-span-2">
          {selectedStructure ? (
            renderStructureEditor()
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
              <Cog6ToothIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Fee Structure Configuration</h3>
              <p className="text-gray-600 mb-6">
                Select a fee structure to edit or create a new one to get started.
              </p>
              <button
                onClick={handleNewStructure}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Create New Structure
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeeStructureConfiguration;