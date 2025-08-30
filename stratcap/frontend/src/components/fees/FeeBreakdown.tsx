import React, { useState, useEffect } from 'react';
import { feeAPI, investorAPI } from '../../services/api';
import {
  UserGroupIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface FeeBreakdownData {
  byInvestor: Array<{
    investorId: number;
    investorName: string;
    investorType: string;
    totalFees: number;
    managementFees: number;
    carriedInterest: number;
    otherFees: number;
    feeRate: number;
    commitment: number;
  }>;
  byFeeType: Array<{
    feeType: string;
    totalAmount: number;
    investorCount: number;
    averageAmount: number;
    percentage: number;
  }>;
  byFund: Array<{
    fundId: number;
    fundName: string;
    totalFees: number;
    investorCount: number;
    feeTypes: Array<{ type: string; amount: number }>;
  }>;
  summary: {
    totalFees: number;
    totalInvestors: number;
    averageFeePerInvestor: number;
    highestFeeInvestor: { name: string; amount: number };
    lowestFeeInvestor: { name: string; amount: number };
  };
}

const FeeBreakdown: React.FC = () => {
  const [breakdownData, setBreakdownData] = useState<FeeBreakdownData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<'investor' | 'type' | 'fund'>('investor');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOptions, setFilterOptions] = useState({
    feeType: 'all',
    investorType: 'all',
    minAmount: '',
    maxAmount: ''
  });
  const [sortBy, setSortBy] = useState<'name' | 'amount' | 'rate'>('amount');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchFeeBreakdown();
  }, []);

  const fetchFeeBreakdown = async () => {
    setLoading(true);
    try {
      const response = await feeAPI.getFeeBreakdown({
        period: 'ytd',
        includeInvestorDetails: true,
        includeFundBreakdown: true,
        includeTypeBreakdown: true
      });
      
      if (response.data.success) {
        setBreakdownData(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load fee breakdown');
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
    return `${(value * 100).toFixed(2)}%`;
  };

  const getFilteredAndSortedData = () => {
    if (!breakdownData) return [];

    let data = [...breakdownData.byInvestor];

    // Apply filters
    if (searchTerm) {
      data = data.filter(item =>
        item.investorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.investorType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterOptions.investorType !== 'all') {
      data = data.filter(item => item.investorType === filterOptions.investorType);
    }

    if (filterOptions.minAmount) {
      data = data.filter(item => item.totalFees >= Number(filterOptions.minAmount));
    }

    if (filterOptions.maxAmount) {
      data = data.filter(item => item.totalFees <= Number(filterOptions.maxAmount));
    }

    // Apply sorting
    data.sort((a, b) => {
      let aValue: number | string, bValue: number | string;
      
      switch (sortBy) {
        case 'name':
          aValue = a.investorName;
          bValue = b.investorName;
          break;
        case 'amount':
          aValue = a.totalFees;
          bValue = b.totalFees;
          break;
        case 'rate':
          aValue = a.feeRate;
          bValue = b.feeRate;
          break;
        default:
          aValue = a.totalFees;
          bValue = b.totalFees;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      
      return sortOrder === 'asc' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
    });

    return data;
  };

  const handleExport = async () => {
    try {
      const response = await feeAPI.exportFeeBreakdown({
        format: 'xlsx',
        includeCharts: true,
        filters: filterOptions
      });
      
      // Handle file download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `fee-breakdown-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleViewInvestorDetails = (investorId: number) => {
    // Navigate to investor detail view with fee focus
    window.open(`/investors/${investorId}?tab=fees`, '_blank');
  };

  const renderInvestorView = () => {
    const filteredData = getFilteredAndSortedData();

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-8 w-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Fees</p>
                <p className="text-xl font-semibold text-gray-900">
                  {formatCurrency(breakdownData?.summary.totalFees || 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center">
              <UserGroupIcon className="h-8 w-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Investors</p>
                <p className="text-xl font-semibold text-gray-900">
                  {breakdownData?.summary.totalInvestors || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-purple-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Average Fee</p>
                <p className="text-xl font-semibold text-gray-900">
                  {formatCurrency(breakdownData?.summary.averageFeePerInvestor || 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-8 w-8 text-orange-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Highest Fee</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(breakdownData?.summary.highestFeeInvestor.amount || 0)}
                </p>
                <p className="text-xs text-gray-500">
                  {breakdownData?.summary.highestFeeInvestor.name}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search investors..."
                  className="pl-10 block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Investor Type</label>
              <select
                value={filterOptions.investorType}
                onChange={(e) => setFilterOptions(prev => ({ ...prev, investorType: e.target.value }))}
                className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="all">All Types</option>
                <option value="institutional">Institutional</option>
                <option value="individual">Individual</option>
                <option value="corporate">Corporate</option>
                <option value="government">Government</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Amount</label>
              <input
                type="number"
                value={filterOptions.minAmount}
                onChange={(e) => setFilterOptions(prev => ({ ...prev, minAmount: e.target.value }))}
                placeholder="0"
                className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="amount">Fee Amount</option>
                <option value="name">Investor Name</option>
                <option value="rate">Fee Rate</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
              </button>
            </div>
          </div>
        </div>

        {/* Investor Breakdown Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Fee Breakdown by Investor</h3>
            <div className="flex space-x-2">
              <button
                onClick={handleExport}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Export
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Investor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Fees
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Management
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Carried Interest
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fee Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commitment
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((investor) => (
                  <tr key={investor.investorId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{investor.investorName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {investor.investorType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatCurrency(investor.totalFees)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(investor.managementFees)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(investor.carriedInterest)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPercentage(investor.feeRate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(investor.commitment)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewInvestorDetails(investor.investorId)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderTypeView = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Fee Distribution by Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={breakdownData?.byFeeType || []}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="totalAmount"
                label={({ feeType, percentage }) => `${feeType} ${(percentage * 100).toFixed(1)}%`}
              >
                {breakdownData?.byFeeType.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B'][index % 4]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [formatCurrency(value as number), 'Amount']} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Fee Amount by Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={breakdownData?.byFeeType || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="feeType" />
              <YAxis />
              <Tooltip formatter={(value) => [formatCurrency(value as number), 'Amount']} />
              <Bar dataKey="totalAmount" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Fee Type Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fee Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Investor Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Average Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Percentage
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {breakdownData?.byFeeType.map((feeType) => (
                <tr key={feeType.feeType}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {feeType.feeType.replace('_', ' ').toUpperCase()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {formatCurrency(feeType.totalAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {feeType.investorCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(feeType.averageAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatPercentage(feeType.percentage)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderFundView = () => (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Fee Revenue by Fund</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={breakdownData?.byFund || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="fundName" />
            <YAxis />
            <Tooltip formatter={(value) => [formatCurrency(value as number), 'Total Fees']} />
            <Bar dataKey="totalFees" fill="#10B981" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Fund Fee Details</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {breakdownData?.byFund.map((fund) => (
            <div key={fund.fundId} className="px-6 py-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{fund.fundName}</h4>
                  <p className="text-sm text-gray-500">{fund.investorCount} investors</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(fund.totalFees)}</p>
                  <p className="text-xs text-gray-500">Total Fees</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {fund.feeTypes.map((feeType) => (
                  <div key={feeType.type} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-500 uppercase">{feeType.type}</p>
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(feeType.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Selector */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        {[
          { key: 'investor', label: 'By Investor', icon: UserGroupIcon },
          { key: 'type', label: 'By Fee Type', icon: ChartBarIcon },
          { key: 'fund', label: 'By Fund', icon: CurrencyDollarIcon }
        ].map((view) => (
          <button
            key={view.key}
            onClick={() => setSelectedView(view.key as any)}
            className={`flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              selectedView === view.key
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <view.icon className="h-4 w-4 mr-2" />
            {view.label}
          </button>
        ))}
      </div>

      {/* View Content */}
      {selectedView === 'investor' && renderInvestorView()}
      {selectedView === 'type' && renderTypeView()}
      {selectedView === 'fund' && renderFundView()}
    </div>
  );
};

export default FeeBreakdown;