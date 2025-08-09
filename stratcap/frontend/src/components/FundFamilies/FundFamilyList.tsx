import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchFundFamilies, deleteFundFamily, updateFundFamily, FundFamily } from '../../store/slices/fundFamilySlice';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  BuildingOfficeIcon,
  BanknotesIcon,
  ChartBarIcon,
  UsersIcon,
  CurrencyDollarIcon,
  FunnelIcon,
  DocumentArrowDownIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import {
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';

interface FundFamilyMetrics {
  totalAUM: number;
  totalFunds: number;
  totalInvestors: number;
  averagePerformance: number;
}

interface ExtendedFundFamily extends FundFamily {
  totalAUM?: number;
  fundCount?: number;
  investorCount?: number;
  averageIRR?: number;
}

const FundFamilyList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { fundFamilies, isLoading, error } = useSelector((state: RootState) => state.fundFamily);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'totalAUM' | 'fundCount' | 'averageIRR'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [metrics, setMetrics] = useState<FundFamilyMetrics>({
    totalAUM: 0,
    totalFunds: 0,
    totalInvestors: 0,
    averagePerformance: 0
  });

  useEffect(() => {
    dispatch(fetchFundFamilies());
  }, [dispatch]);

  useEffect(() => {
    // Calculate metrics from fund families data
    if (fundFamilies.length > 0) {
      const totalAUM = fundFamilies.reduce((sum: number, ff: ExtendedFundFamily) => sum + (ff.totalAUM || 0), 0);
      const totalFunds = fundFamilies.reduce((sum: number, ff: ExtendedFundFamily) => sum + (ff.fundCount || 0), 0);
      const totalInvestors = fundFamilies.reduce((sum: number, ff: ExtendedFundFamily) => sum + (ff.investorCount || 0), 0);
      const avgPerf = fundFamilies.reduce((sum: number, ff: ExtendedFundFamily) => sum + (ff.averageIRR || 0), 0) / fundFamilies.length;
      
      setMetrics({
        totalAUM,
        totalFunds,
        totalInvestors,
        averagePerformance: avgPerf
      });
    }
  }, [fundFamilies]);

  const handleDelete = async (id: string) => {
    try {
      await dispatch(deleteFundFamily(Number(id))).unwrap();
      setShowDeleteModal(null);
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    } catch (error) {
      console.error('Failed to delete fund family:', error);
    }
  };
  
  const exportFundFamilies = async () => {
    setIsExporting(true);
    try {
      const dataToExport = selectedItems.size > 0 
        ? filteredAndSortedFundFamilies.filter(ff => selectedItems.has(String(ff.id)))
        : filteredAndSortedFundFamilies;
      
      const csvData = [
        ['Name', 'Code', 'Management Company', 'Status', 'Total AUM', 'Fund Count', 'Investor Count', 'Average IRR'],
        ...dataToExport.map(ff => [
          ff.name,
          ff.code,
          ff.managementCompany || '',
          ff.status,
          (ff.totalAUM || 0).toString(),
          (ff.fundCount || 0).toString(),
          (ff.investorCount || 0).toString(),
          (ff.averageIRR || 0).toString()
        ])
      ];
      
      const csvContent = csvData.map(row => row.map(field => `"${field}"`).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `fund-families-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };
  
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(filteredAndSortedFundFamilies.map(ff => String(ff.id))));
    } else {
      setSelectedItems(new Set());
    }
  };
  
  const handleSelectItem = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedItems(newSelected);
  };
  
  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;
    
    try {
      const deletePromises = Array.from(selectedItems).map(id => 
        dispatch(deleteFundFamily(Number(id))).unwrap()
      );
      
      await Promise.all(deletePromises);
      setSelectedItems(new Set());
    } catch (error) {
      console.error('Failed to delete fund families:', error);
    }
  };
  
  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedItems.size === 0) return;
    
    try {
      const updatePromises = Array.from(selectedItems).map(id => 
        dispatch(updateFundFamily({ 
          id: Number(id), 
          data: { status: newStatus as 'active' | 'inactive' | 'archived' } 
        })).unwrap()
      );
      
      await Promise.all(updatePromises);
      setSelectedItems(new Set());
    } catch (error) {
      console.error('Failed to update fund families:', error);
    }
  };

  const filteredAndSortedFundFamilies = fundFamilies
    .filter((ff: ExtendedFundFamily) => {
      const matchesSearch = ff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           ff.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           ff.managementCompany?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !filterStatus || ff.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const aValue = a[sortBy] || 0;
      const bValue = b[sortBy] || 0;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return sortOrder === 'asc' 
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: amount >= 1e9 ? 'compact' : 'standard'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'archived': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Sample data for charts
  const fundFamilyDistribution = [
    { name: 'Private Equity', value: 45, color: '#3B82F6' },
    { name: 'Venture Capital', value: 25, color: '#10B981' },
    { name: 'Real Estate', value: 20, color: '#F59E0B' },
    { name: 'Infrastructure', value: 10, color: '#8B5CF6' }
  ];

  const performanceTrend = [
    { month: 'Jan', performance: 12.5 },
    { month: 'Feb', performance: 13.2 },
    { month: 'Mar', performance: 12.8 },
    { month: 'Apr', performance: 14.1 },
    { month: 'May', performance: 15.3 },
    { month: 'Jun', performance: 14.8 }
  ];

  const aumGrowth = [
    { month: 'Jan', aum: 850 },
    { month: 'Feb', aum: 920 },
    { month: 'Mar', aum: 980 },
    { month: 'Apr', aum: 1050 },
    { month: 'May', aum: 1120 },
    { month: 'Jun', aum: 1250 }
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        Error loading fund families: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Fund Family Management</h1>
        <div className="flex space-x-3">
          <button 
            onClick={exportFundFamilies}
            disabled={isExporting}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
          <Link
            to="/fund-families/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            New Fund Family
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total AUM</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(metrics.totalAUM)}</p>
              <p className="text-sm text-green-600">+12.5% from last month</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <BanknotesIcon className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Funds</p>
              <p className="text-2xl font-semibold text-gray-900">{metrics.totalFunds}</p>
              <p className="text-sm text-gray-500">Across all families</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <UsersIcon className="h-8 w-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Investors</p>
              <p className="text-2xl font-semibold text-gray-900">{metrics.totalInvestors.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Active LPs</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-orange-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Avg Performance</p>
              <p className="text-2xl font-semibold text-gray-900">{metrics.averagePerformance.toFixed(1)}%</p>
              <p className="text-sm text-gray-500">Weighted IRR</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Fund Family Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={fundFamilyDistribution}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {fundFamilyDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={performanceTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value}%`, 'IRR']} />
              <Line type="monotone" dataKey="performance" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">AUM Growth</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={aumGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value}M`, 'AUM']} />
              <Area type="monotone" dataKey="aum" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedItems.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-blue-700">
              {selectedItems.size} fund {selectedItems.size === 1 ? 'family' : 'families'} selected
            </div>
            <div className="flex space-x-2">
              <select
                onChange={(e) => e.target.value && handleBulkStatusChange(e.target.value)}
                className="text-sm border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                defaultValue=""
              >
                <option value="">Change Status...</option>
                <option value="active">Set Active</option>
                <option value="inactive">Set Inactive</option>
                <option value="archived">Archive</option>
              </select>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700"
              >
                Delete Selected
              </button>
              <button
                onClick={() => setSelectedItems(new Set())}
                className="px-3 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative col-span-2">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search fund families..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </select>
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field as any);
              setSortOrder(order as 'asc' | 'desc');
            }}
            className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="totalAUM-desc">AUM High-Low</option>
            <option value="totalAUM-asc">AUM Low-High</option>
            <option value="fundCount-desc">Funds High-Low</option>
            <option value="fundCount-asc">Funds Low-High</option>
            <option value="averageIRR-desc">IRR High-Low</option>
            <option value="averageIRR-asc">IRR Low-High</option>
          </select>
          <div className="flex items-center text-sm text-gray-500">
            <FunnelIcon className="h-4 w-4 mr-1" />
            {filteredAndSortedFundFamilies.length} of {fundFamilies.length} fund families
          </div>
        </div>
      </div>

      {/* Fund Families Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={filteredAndSortedFundFamilies.length > 0 && selectedItems.size === filteredAndSortedFundFamilies.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => {
                    if (sortBy === 'name') {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy('name');
                      setSortOrder('asc');
                    }
                  }}
                >
                  <div className="flex items-center">
                    Fund Family
                    {sortBy === 'name' && (
                      <span className="ml-1">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Management Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Funds
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => {
                    if (sortBy === 'totalAUM') {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy('totalAUM');
                      setSortOrder('desc');
                    }
                  }}
                >
                  <div className="flex items-center">
                    Total AUM
                    {sortBy === 'totalAUM' && (
                      <span className="ml-1">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Investors
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => {
                    if (sortBy === 'averageIRR') {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy('averageIRR');
                      setSortOrder('desc');
                    }
                  }}
                >
                  <div className="flex items-center">
                    Performance
                    {sortBy === 'averageIRR' && (
                      <span className="ml-1">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedFundFamilies.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                    No fund families found
                  </td>
                </tr>
              ) : (
                filteredAndSortedFundFamilies.map((fundFamily: ExtendedFundFamily) => (
                  <tr key={fundFamily.id} className={`hover:bg-gray-50 ${
                    selectedItems.has(String(fundFamily.id)) ? 'bg-blue-50' : ''
                  }`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(String(fundFamily.id))}
                        onChange={(e) => handleSelectItem(String(fundFamily.id), e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{fundFamily.name}</div>
                          <div className="text-sm text-gray-500">{fundFamily.code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {fundFamily.managementCompany || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {fundFamily.fundCount || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(fundFamily.totalAUM || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {fundFamily.investorCount || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">
                          {fundFamily.averageIRR ? `${fundFamily.averageIRR.toFixed(1)}%` : '-'}
                        </span>
                        {fundFamily.averageIRR && fundFamily.averageIRR > 0 && (
                          <svg className="ml-1 w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(fundFamily.status)}`}>
                        {fundFamily.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          to={`/fund-families/${fundFamily.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Link>
                        <Link
                          to={`/fund-families/${fundFamily.id}/edit`}
                          className="text-green-600 hover:text-green-900"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Link>
                        <Link
                          to={`/fund-families/${fundFamily.id}/configuration`}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          <Cog6ToothIcon className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => setShowDeleteModal(String(fundFamily.id))}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">Delete Fund Family</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this fund family? This will also remove all associated funds and data. This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-center space-x-3 pt-4">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => showDeleteModal && handleDelete(showDeleteModal)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FundFamilyList;