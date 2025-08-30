import React, { useState, useEffect } from 'react';
import { investorAPI, fundAPI } from '../../services/api';
import {
  UserGroupIcon,
  CurrencyDollarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ArrowRightIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface InvestorSummary {
  totalInvestors: number;
  totalCommitments: number;
  totalFundedAmount: number;
  totalUnfundedCommitments: number;
  averageCommitmentSize: number;
  newInvestorsThisMonth: number;
  activeInvestors: number;
  atRiskInvestors: number;
}

interface InvestorMetrics {
  byType: Array<{ type: string; count: number; commitments: number; color: string }>;
  byCommitmentSize: Array<{ range: string; count: number; percentage: number }>;
  byGeography: Array<{ region: string; count: number; commitments: number }>;
  monthlyTrend: Array<{ month: string; newInvestors: number; totalCommitments: number }>;
  performanceMetrics: Array<{
    investorId: number;
    investorName: string;
    totalCommitment: number;
    fundedAmount: number;
    unfundedCommitment: number;
    totalFees: number;
    lastActivity: string;
    riskScore: number;
    status: 'active' | 'inactive' | 'at_risk' | 'defaulted';
  }>;
}

interface InvestorActivity {
  id: number;
  investorName: string;
  activityType: 'commitment' | 'drawdown' | 'distribution' | 'transfer' | 'fee_payment' | 'document_update';
  description: string;
  amount?: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  priority: 'low' | 'medium' | 'high';
}

const InvestorDashboard: React.FC = () => {
  const [investorSummary, setInvestorSummary] = useState<InvestorSummary>({
    totalInvestors: 0,
    totalCommitments: 0,
    totalFundedAmount: 0,
    totalUnfundedCommitments: 0,
    averageCommitmentSize: 0,
    newInvestorsThisMonth: 0,
    activeInvestors: 0,
    atRiskInvestors: 0
  });
  
  const [investorMetrics, setInvestorMetrics] = useState<InvestorMetrics>({
    byType: [],
    byCommitmentSize: [],
    byGeography: [],
    monthlyTrend: [],
    performanceMetrics: []
  });
  
  const [recentActivity, setRecentActivity] = useState<InvestorActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('ytd');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'commitment' | 'activity' | 'risk'>('commitment');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchInvestorDashboardData();
  }, [selectedTimeframe]);

  const fetchInvestorDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch investor summary
      const summaryResponse = await investorAPI.getInvestorSummary({
        timeframe: selectedTimeframe,
        includeRiskMetrics: true
      });
      
      if (summaryResponse.data?.success) {
        setInvestorSummary(summaryResponse.data.data);
      }

      // Fetch investor metrics and analytics
      const metricsResponse = await investorAPI.getInvestorMetrics({
        timeframe: selectedTimeframe,
        includeGeography: true,
        includePerformance: true
      });
      
      if (metricsResponse.data?.success) {
        setInvestorMetrics(metricsResponse.data.data);
      }

      // Fetch recent activity
      const activityResponse = await investorAPI.getRecentActivity({
        limit: 20,
        includeAllTypes: true
      });
      
      if (activityResponse.data?.success) {
        setRecentActivity(activityResponse.data.data);
      }

    } catch (err: any) {
      console.error('Error fetching investor dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
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
      notation: amount >= 1000000 ? 'compact' : 'standard',
      compactDisplay: 'short'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getActivityIcon = (type: string) => {
    const icons = {
      commitment: CurrencyDollarIcon,
      drawdown: TrendingDownIcon,
      distribution: TrendingUpIcon,
      transfer: ArrowRightIcon,
      fee_payment: DocumentTextIcon,
      document_update: DocumentTextIcon
    };
    return icons[type as keyof typeof icons] || DocumentTextIcon;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      at_risk: 'bg-yellow-100 text-yellow-800',
      defaulted: 'bg-red-100 text-red-800',
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-blue-600';
    return 'text-green-600';
  };

  const getFilteredInvestors = () => {
    let data = [...investorMetrics.performanceMetrics];

    // Apply search filter
    if (searchTerm) {
      data = data.filter(investor =>
        investor.investorName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (selectedFilter !== 'all') {
      data = data.filter(investor => investor.status === selectedFilter);
    }

    // Apply sorting
    data.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.investorName;
          bValue = b.investorName;
          break;
        case 'commitment':
          aValue = a.totalCommitment;
          bValue = b.totalCommitment;
          break;
        case 'activity':
          aValue = new Date(a.lastActivity).getTime();
          bValue = new Date(b.lastActivity).getTime();
          break;
        case 'risk':
          aValue = a.riskScore;
          bValue = b.riskScore;
          break;
        default:
          aValue = a.totalCommitment;
          bValue = b.totalCommitment;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return data;
  };

  const handleExportData = async () => {
    try {
      const response = await investorAPI.exportInvestorData({
        format: 'xlsx',
        includeMetrics: true,
        timeframe: selectedTimeframe
      });
      
      // Handle file download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `investor-dashboard-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Investor Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Comprehensive view of investor relationships, commitments, and performance
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="mtd">Month to Date</option>
            <option value="qtd">Quarter to Date</option>
            <option value="ytd">Year to Date</option>
            <option value="trailing-12m">Trailing 12M</option>
            <option value="all-time">All Time</option>
          </select>
          <button
            onClick={handleExportData}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserGroupIcon className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-500">Total Investors</p>
              <div className="flex items-baseline">
                <p className="text-2xl font-semibold text-gray-900">
                  {investorSummary.totalInvestors.toLocaleString()}
                </p>
                <div className="ml-2 flex items-baseline text-sm">
                  <TrendingUpIcon className="h-4 w-4 text-green-500" />
                  <span className="text-green-600">+{investorSummary.newInvestorsThisMonth}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">This month</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CurrencyDollarIcon className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-500">Total Commitments</p>
              <div className="flex items-baseline">
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(investorSummary.totalCommitments)}
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Avg: {formatCurrency(investorSummary.averageCommitmentSize)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-purple-500" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-500">Funded Amount</p>
              <div className="flex items-baseline">
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(investorSummary.totalFundedAmount)}
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {formatPercentage((investorSummary.totalFundedAmount / investorSummary.totalCommitments) * 100)} of commitments
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-8 w-8 text-orange-500" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-500">At-Risk Investors</p>
              <div className="flex items-baseline">
                <p className="text-2xl font-semibold text-gray-900">
                  {investorSummary.atRiskInvestors}
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Require attention
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Investor Growth Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={investorMetrics.monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={[
                  (value: any, name: string) => [
                    name === 'totalCommitments' ? formatCurrency(value) : value,
                    name === 'newInvestors' ? 'New Investors' : 'Total Commitments'
                  ]
                ]}
              />
              <Line type="monotone" dataKey="newInvestors" stroke="#3B82F6" strokeWidth={2} yAxisId="left" />
              <Line type="monotone" dataKey="totalCommitments" stroke="#10B981" strokeWidth={2} yAxisId="right" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Investor Composition</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={investorMetrics.byType}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
                label={({ type, count }) => `${type}: ${count}`}
              >
                {investorMetrics.byType.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [value, 'Investors']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Investor Performance Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Investor Performance</h3>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
                Filters
              </button>
            </div>
          </div>

          {showAdvancedFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="at_risk">At Risk</option>
                  <option value="defaulted">Defaulted</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="commitment">Commitment Size</option>
                  <option value="name">Investor Name</option>
                  <option value="activity">Last Activity</option>
                  <option value="risk">Risk Score</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                  className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Investor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commitment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Funded / Unfunded
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Fees
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Score
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
              {getFilteredInvestors().map((investor) => (
                <tr key={investor.investorId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{investor.investorName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {formatCurrency(investor.totalCommitment)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div>Funded: {formatCurrency(investor.fundedAmount)}</div>
                      <div className="text-gray-500">Unfunded: {formatCurrency(investor.unfundedCommitment)}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(investor.totalFees)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(investor.lastActivity).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`text-sm font-medium ${getRiskScoreColor(investor.riskScore)}`}>
                        {investor.riskScore}
                      </div>
                      <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            investor.riskScore >= 80 ? 'bg-red-600' :
                            investor.riskScore >= 60 ? 'bg-yellow-600' :
                            investor.riskScore >= 40 ? 'bg-blue-600' : 'bg-green-600'
                          }`}
                          style={{ width: `${investor.riskScore}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(investor.status)}`}>
                      {investor.status === 'at_risk' ? 'At Risk' : investor.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => window.open(`/investors/${investor.investorId}`, '_blank')}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => window.open(`/investors/${investor.investorId}/edit`, '_blank')}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
          {recentActivity.map((activity) => {
            const ActivityIcon = getActivityIcon(activity.activityType);
            return (
              <div key={activity.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ActivityIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{activity.investorName}</p>
                      <p className="text-sm text-gray-500">{activity.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {activity.amount && (
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(activity.amount)}
                      </span>
                    )}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                      {activity.status}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(activity.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default InvestorDashboard;