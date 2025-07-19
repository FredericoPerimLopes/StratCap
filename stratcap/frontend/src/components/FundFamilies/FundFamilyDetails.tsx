import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchFundFamilyById } from '../../store/slices/fundFamilySlice';
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
      // TODO: Implement fetchFundFamilySummary action
    }
  }, [dispatch, id]);

  useEffect(() => {
    // Mock fund data - in real app, this would come from API
    if (currentFundFamily) {
      setFunds([
        {
          id: 1,
          name: `${currentFundFamily.name} Fund I`,
          vintage: 2019,
          targetSize: 500000000,
          committedCapital: 480000000,
          calledCapital: 320000000,
          distributedCapital: 150000000,
          status: 'harvesting',
          irr: 18.5,
          multiple: 1.8
        },
        {
          id: 2,
          name: `${currentFundFamily.name} Fund II`,
          vintage: 2021,
          targetSize: 750000000,
          committedCapital: 720000000,
          calledCapital: 450000000,
          distributedCapital: 50000000,
          status: 'investing',
          irr: 22.3,
          multiple: 1.4
        },
        {
          id: 3,
          name: `${currentFundFamily.name} Fund III`,
          vintage: 2023,
          targetSize: 1000000000,
          committedCapital: 650000000,
          calledCapital: 120000000,
          distributedCapital: 0,
          status: 'fundraising',
          irr: 0,
          multiple: 1.0
        }
      ]);
    }
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

  // Mock chart data
  const performanceData = [
    { year: '2019', irr: 8.5, multiple: 1.2 },
    { year: '2020', irr: 12.3, multiple: 1.4 },
    { year: '2021', irr: 18.7, multiple: 1.6 },
    { year: '2022', irr: 15.2, multiple: 1.7 },
    { year: '2023', irr: 20.5, multiple: 1.9 }
  ];

  const capitalFlowData = [
    { quarter: 'Q1 2023', calls: 50, distributions: 30 },
    { quarter: 'Q2 2023', calls: 75, distributions: 45 },
    { quarter: 'Q3 2023', calls: 60, distributions: 80 },
    { quarter: 'Q4 2023', calls: 90, distributions: 120 }
  ];

  const assetAllocation = [
    { name: 'Technology', value: 35, color: '#3B82F6' },
    { name: 'Healthcare', value: 25, color: '#10B981' },
    { name: 'Financial Services', value: 20, color: '#F59E0B' },
    { name: 'Consumer', value: 15, color: '#8B5CF6' },
    { name: 'Other', value: 5, color: '#6B7280' }
  ];

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
              <p className="text-sm font-medium text-gray-500">Total AUM</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(summary?.totalAUM || 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <BanknotesIcon className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active Funds</p>
              <p className="text-2xl font-semibold text-gray-900">{summary?.activeFunds || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <UsersIcon className="h-8 w-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Investors</p>
              <p className="text-2xl font-semibold text-gray-900">
                {currentFundFamily?.investorCount || 0}
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
                {currentFundFamily?.averageIRR ? `${currentFundFamily.averageIRR.toFixed(1)}%` : '-'}
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
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Capital Flow (Millions)</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={capitalFlowData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="quarter" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="calls" fill="#3B82F6" name="Capital Calls" />
                      <Bar dataKey="distributions" fill="#10B981" name="Distributions" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Asset Allocation</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={assetAllocation}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {assetAllocation.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
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
                      <XAxis dataKey="year" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
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
                        <p className="text-sm font-medium text-gray-500">Gross IRR</p>
                        <p className="text-2xl font-semibold text-gray-900">18.5%</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Net IRR</p>
                        <p className="text-2xl font-semibold text-gray-900">15.2%</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">TVPI</p>
                        <p className="text-2xl font-semibold text-gray-900">1.85x</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">DPI</p>
                        <p className="text-2xl font-semibold text-gray-900">0.95x</p>
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