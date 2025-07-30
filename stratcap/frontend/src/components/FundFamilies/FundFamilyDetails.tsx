import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchFundFamilyById, fetchFundFamilySummary } from '../../store/slices/fundFamilySlice';
import {
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  UsersIcon,
  ChartBarIcon,
  PencilIcon,
  Cog6ToothIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

interface FundData {
  id: number;
  name: string;
  vintage: number;
  targetSize: number;
  committedCapital: number;
  calledCapital: number;
  distributedCapital: number;
  status: 'fundraising' | 'investing' | 'harvesting' | 'closed';
  irr: number;
  multiple: number;
}

const FundFamilyDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  
  const { currentFundFamily, loading, summary, error } = useSelector((state: RootState) => state.fundFamily);
  const [activeTab, setActiveTab] = useState<'overview' | 'funds' | 'performance' | 'settings'>('overview');
  const [funds, setFunds] = useState<FundData[]>([]);

  useEffect(() => {
    if (id) {
      dispatch(fetchFundFamilyById(Number(id)));
      dispatch(fetchFundFamilySummary(Number(id)));
    }
  }, [dispatch, id]);

  useEffect(() => {
    // Fetch funds data from API when fund family is loaded
    const fetchFunds = async () => {
      if (currentFundFamily) {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/funds?fundFamilyId=${currentFundFamily.id}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            const fundsData = data.data || [];
            
            // Transform API data to match our interface
            const transformedFunds: FundData[] = fundsData.map((fund: any) => ({
              id: fund.id,
              name: fund.name,
              vintage: fund.vintage,
              targetSize: parseFloat(fund.targetSize || '0'),
              committedCapital: parseFloat(fund.committedCapital || '0'),
              calledCapital: parseFloat(fund.calledCapital || '0'),
              distributedCapital: parseFloat(fund.distributedCapital || '0'),
              status: fund.status,
              irr: parseFloat(fund.irr || '0'),
              multiple: parseFloat(fund.multiple || '1.0')
            }));
            
            setFunds(transformedFunds);
          } else {
            console.error('Failed to fetch funds:', response.statusText);
            // Fallback to empty array
            setFunds([]);
          }
        } catch (error) {
          console.error('Error fetching funds:', error);
          // Fallback to empty array
          setFunds([]);
        }
      }
    };

    fetchFunds();
  }, [currentFundFamily]);

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

  const getFundStatusColor = (status: string) => {
    switch (status) {
      case 'fundraising': return 'bg-blue-100 text-blue-800';
      case 'investing': return 'bg-green-100 text-green-800';
      case 'harvesting': return 'bg-orange-100 text-orange-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Generate performance data from actual funds
  const performanceData = funds.map(fund => ({
    name: fund.name,
    vintage: fund.vintage,
    irr: fund.irr,
    multiple: fund.multiple,
    status: fund.status
  }));

  // Calculate summary metrics from real data
  const summaryMetrics = {
    totalFunds: funds.length,
    totalTargetSize: funds.reduce((sum, fund) => sum + fund.targetSize, 0),
    totalCommitted: funds.reduce((sum, fund) => sum + fund.committedCapital, 0),
    totalCalled: funds.reduce((sum, fund) => sum + fund.calledCapital, 0),
    totalDistributed: funds.reduce((sum, fund) => sum + fund.distributedCapital, 0),
    averageIRR: funds.length > 0 ? funds.reduce((sum, fund) => sum + fund.irr, 0) / funds.length : 0,
    averageMultiple: funds.length > 0 ? funds.reduce((sum, fund) => sum + fund.multiple, 0) / funds.length : 0
  };

  // Generate status distribution for pie chart
  const statusCounts = funds.reduce((acc, fund) => {
    acc[fund.status] = (acc[fund.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusDistribution = Object.entries(statusCounts).map(([status, count], index) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count,
    color: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'][index] || '#6B7280'
  }));

  // Generate vintage distribution
  const vintageData = funds.reduce((acc, fund) => {
    const vintage = fund.vintage.toString();
    const existing = acc.find(item => item.year === vintage);
    if (existing) {
      existing.count += 1;
      existing.totalSize += fund.targetSize;
    } else {
      acc.push({
        year: vintage,
        count: 1,
        totalSize: fund.targetSize,
        avgIRR: fund.irr
      });
    }
    return acc;
  }, [] as Array<{year: string, count: number, totalSize: number, avgIRR: number}>);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !currentFundFamily) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        Error loading fund family details
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/fund-families')}
              className="mr-4 text-gray-400 hover:text-gray-600"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <BuildingOfficeIcon className="h-8 w-8 text-gray-400 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{currentFundFamily.name}</h1>
              <p className="text-sm text-gray-500">Code: {currentFundFamily.code}</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <Link
              to={`/fund-families/${id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit
            </Link>
            <Link
              to={`/fund-families/${id}/configuration`}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <Cog6ToothIcon className="h-4 w-4 mr-2" />
              Configuration
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="border-l-4 border-blue-500 pl-4">
            <p className="text-sm font-medium text-gray-500">Status</p>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(currentFundFamily.status)}`}>
              {currentFundFamily.status}
            </span>
          </div>
          <div className="border-l-4 border-green-500 pl-4">
            <p className="text-sm font-medium text-gray-500">Management Company</p>
            <p className="text-sm font-semibold text-gray-900">{currentFundFamily.managementCompany}</p>
          </div>
          <div className="border-l-4 border-purple-500 pl-4">
            <p className="text-sm font-medium text-gray-500">Primary Currency</p>
            <p className="text-sm font-semibold text-gray-900">{currentFundFamily.primaryCurrency}</p>
          </div>
          <div className="border-l-4 border-orange-500 pl-4">
            <p className="text-sm font-medium text-gray-500">Fiscal Year End</p>
            <p className="text-sm font-semibold text-gray-900">
              {new Date(currentFundFamily.fiscalYearEnd).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Committed</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(summaryMetrics.totalCommitted)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <BanknotesIcon className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Funds</p>
              <p className="text-2xl font-semibold text-gray-900">{summaryMetrics.totalFunds}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <UsersIcon className="h-8 w-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Called</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(summaryMetrics.totalCalled)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-orange-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Avg IRR</p>
              <p className="text-2xl font-semibold text-gray-900">
                {summaryMetrics.averageIRR.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-8 w-8 text-indigo-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Distributed</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(summaryMetrics.totalDistributed)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-yellow-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Avg Multiple</p>
              <p className="text-2xl font-semibold text-gray-900">
                {summaryMetrics.averageMultiple.toFixed(2)}x
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('funds')}
              className={`py-2 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'funds'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Funds
            </button>
            <button
              onClick={() => setActiveTab('performance')}
              className={`py-2 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'performance'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Performance
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-2 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Settings
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Vintage Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={vintageData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value, name) => [
                          name === 'count' ? value : formatCurrency(value as number),
                          name === 'count' ? 'Funds' : name === 'totalSize' ? 'Total Size' : 'Avg IRR'
                        ]}
                      />
                      <Bar dataKey="count" fill="#3B82F6" name="Number of Funds" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Fund Status Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [value, 'Funds']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {currentFundFamily.description && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700">{currentFundFamily.description}</p>
                </div>
              )}
            </div>
          )}

          {/* Funds Tab */}
          {activeTab === 'funds' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Fund Portfolio</h3>
                <Link
                  to="/funds/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Add Fund
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fund Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vintage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Size
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Called / Committed
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Distributed
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Performance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {funds.map((fund) => (
                      <tr key={fund.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link to={`/funds/${fund.id}`} className="text-indigo-600 hover:text-indigo-900">
                            {fund.name}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {fund.vintage}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(fund.targetSize)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatCurrency(fund.calledCapital)} / {formatCurrency(fund.committedCapital)}
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                            <div 
                              className="bg-blue-600 h-1.5 rounded-full" 
                              style={{ width: `${(fund.calledCapital / fund.committedCapital) * 100}%` }}
                            ></div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(fund.distributedCapital)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getFundStatusColor(fund.status)}`}>
                            {fund.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            IRR: {fund.irr > 0 ? `${fund.irr}%` : '-'}
                          </div>
                          <div className="text-sm text-gray-500">
                            Multiple: {fund.multiple}x
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Historical Performance</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="vintage" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip 
                        formatter={(value, name) => [
                          name === 'irr' ? `${value}%` : `${value}x`,
                          name === 'irr' ? 'IRR' : 'Multiple'
                        ]}
                        labelFormatter={(label) => `Vintage ${label}`}
                      />
                      <Line yAxisId="left" type="monotone" dataKey="irr" stroke="#3B82F6" name="IRR %" />
                      <Line yAxisId="right" type="monotone" dataKey="multiple" stroke="#10B981" name="Multiple" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Key Metrics</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Average IRR</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {summaryMetrics.averageIRR.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Average Multiple</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {summaryMetrics.averageMultiple.toFixed(2)}x
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Total Called</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {formatCurrency(summaryMetrics.totalCalled)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Total Distributed</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {formatCurrency(summaryMetrics.totalDistributed)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-blue-900 mb-2">Performance Note</p>
                    <p className="text-sm text-blue-700">
                      Performance figures are as of last quarter end and subject to change. 
                      Past performance is not indicative of future results.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Fund Family Settings</h3>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-md font-medium text-gray-900 mb-3">Financial Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Management Fee</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {currentFundFamily.settings?.defaultManagementFeeRate || 2}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Carried Interest</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {currentFundFamily.settings?.defaultCarriedInterestRate || 20}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Preferred Return</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {currentFundFamily.settings?.defaultPreferredReturn || 8}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-md font-medium text-gray-900 mb-3">Operational Settings</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Auto-approve capital calls</span>
                    {currentFundFamily.settings?.autoApproveCapitalCalls ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircleIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Require dual approval</span>
                    {currentFundFamily.settings?.requireDualApproval ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircleIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Enable notifications</span>
                    {currentFundFamily.settings?.enableNotifications ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircleIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Link
                  to={`/fund-families/${id}/configuration`}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <Cog6ToothIcon className="h-4 w-4 mr-2" />
                  Advanced Configuration
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FundFamilyDetails;