import React, { useState, useEffect } from 'react';
import { feeAPI, fundAPI } from '../../services/api';
import {
  CurrencyDollarIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  Cog6ToothIcon,
  DocumentArrowDownIcon,
  BanknotesIcon,
  UserGroupIcon,
  TrendingUpIcon
} from '@heroicons/react/24/outline';
import FeePostingWizard from './FeePostingWizard';
import FeeBreakdown from './FeeBreakdown';
import FeeCalculationPreview from './FeeCalculationPreview';
import FeeStructureConfiguration from './FeeStructureConfiguration';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface FeeSummary {
  totalManagementFees: number;
  totalCarriedInterest: number;
  totalOtherFees: number;
  pendingCalculations: number;
  pendingPostings: number;
  thisMonthFees: number;
  lastMonthFees: number;
  ytdFees: number;
}

interface FeeMetrics {
  byFeeType: Array<{ name: string; value: number; color: string }>;
  monthlyTrend: Array<{ month: string; management: number; carriedInterest: number; other: number }>;
  topFunds: Array<{ fundName: string; fees: number; percentage: number }>;
  recentActivity: Array<{ id: number; description: string; amount: number; timestamp: string; status: string }>;
}

const FeeDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'calculations' | 'postings' | 'breakdown' | 'configuration'>('overview');
  const [feeSummary, setFeeSummary] = useState<FeeSummary>({
    totalManagementFees: 0,
    totalCarriedInterest: 0,
    totalOtherFees: 0,
    pendingCalculations: 0,
    pendingPostings: 0,
    thisMonthFees: 0,
    lastMonthFees: 0,
    ytdFees: 0
  });
  const [feeMetrics, setFeeMetrics] = useState<FeeMetrics>({
    byFeeType: [],
    monthlyTrend: [],
    topFunds: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPostingWizard, setShowPostingWizard] = useState(false);
  const [showCalculationPreview, setShowCalculationPreview] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('current-quarter');

  useEffect(() => {
    fetchFeeDashboardData();
  }, [selectedPeriod]);

  const fetchFeeDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch fee summary data
      const summaryResponse = await feeAPI.getFeeSummary({
        period: selectedPeriod,
        includeProjections: true
      });
      
      if (summaryResponse.data?.success) {
        setFeeSummary(summaryResponse.data.data);
      }

      // Fetch fee metrics
      const metricsResponse = await feeAPI.getFeeMetrics({
        period: selectedPeriod,
        breakdown: ['type', 'fund', 'time']
      });
      
      if (metricsResponse.data?.success) {
        setFeeMetrics(metricsResponse.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching fee dashboard data:', err);
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

  const calculateGrowthRate = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      calculated: 'bg-blue-100 text-blue-800',
      posted: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      processing: 'bg-purple-100 text-purple-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CurrencyDollarIcon className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-500">Management Fees</p>
              <div className="flex items-baseline">
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(feeSummary.totalManagementFees)}
                </p>
                <div className="ml-2 flex items-baseline text-sm">
                  <TrendingUpIcon className="h-4 w-4 text-green-500" />
                  <span className="text-green-600">+12.3%</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">YTD</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BanknotesIcon className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-500">Carried Interest</p>
              <div className="flex items-baseline">
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(feeSummary.totalCarriedInterest)}
                </p>
                <div className="ml-2 flex items-baseline text-sm">
                  <TrendingUpIcon className="h-4 w-4 text-green-500" />
                  <span className="text-green-600">+25.8%</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">YTD</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-orange-500" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-500">Pending Calculations</p>
              <p className="text-2xl font-semibold text-gray-900">{feeSummary.pendingCalculations}</p>
              <p className="text-xs text-gray-500 mt-1">Awaiting review</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-8 w-8 text-purple-500" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-500">Ready to Post</p>
              <p className="text-2xl font-semibold text-gray-900">{feeSummary.pendingPostings}</p>
              <p className="text-xs text-gray-500 mt-1">Approved calculations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Fee Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={feeMetrics.monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [formatCurrency(value as number), '']} />
              <Line type="monotone" dataKey="management" stroke="#3B82F6" strokeWidth={2} name="Management" />
              <Line type="monotone" dataKey="carriedInterest" stroke="#10B981" strokeWidth={2} name="Carried Interest" />
              <Line type="monotone" dataKey="other" stroke="#8B5CF6" strokeWidth={2} name="Other" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Fee Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={feeMetrics.byFeeType}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {feeMetrics.byFeeType.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [formatCurrency(value as number), '']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {feeMetrics.recentActivity.slice(0, 5).map((activity) => (
            <div key={activity.id} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {activity.status === 'posted' ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  ) : activity.status === 'pending' ? (
                    <ClockIcon className="h-5 w-5 text-orange-500" />
                  ) : (
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                  <p className="text-sm text-gray-500">{formatCurrency(activity.amount)}</p>
                </div>
              </div>
              <div className="flex items-center">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                  {activity.status}
                </span>
                <p className="text-sm text-gray-500 ml-3">
                  {new Date(activity.timestamp).toLocaleTimeString()}
                </p>
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fee Management Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Comprehensive fee calculation, posting, and management system
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="current-quarter">Current Quarter</option>
            <option value="last-quarter">Last Quarter</option>
            <option value="ytd">Year to Date</option>
            <option value="last-year">Last Year</option>
          </select>
          <button
            onClick={() => setShowCalculationPreview(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ChartBarIcon className="h-4 w-4 mr-2" />
            Calculate Fees
          </button>
          <button
            onClick={() => setShowPostingWizard(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Post Fees
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'overview', label: 'Overview', icon: ChartBarIcon },
              { key: 'calculations', label: 'Fee Calculations', icon: CurrencyDollarIcon },
              { key: 'postings', label: 'Fee Postings', icon: DocumentArrowDownIcon },
              { key: 'breakdown', label: 'Fee Breakdown', icon: UserGroupIcon },
              { key: 'configuration', label: 'Configuration', icon: Cog6ToothIcon }
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
                <tab.icon
                  className={`-ml-0.5 mr-2 h-5 w-5 ${
                    activeTab === tab.key ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'calculations' && <div>Fee Calculations Content</div>}
          {activeTab === 'postings' && <div>Fee Postings Content</div>}
          {activeTab === 'breakdown' && <FeeBreakdown />}
          {activeTab === 'configuration' && <FeeStructureConfiguration />}
        </div>
      </div>

      {/* Modals */}
      {showPostingWizard && (
        <FeePostingWizard
          isOpen={showPostingWizard}
          onClose={() => setShowPostingWizard(false)}
          onComplete={() => {
            setShowPostingWizard(false);
            fetchFeeDashboardData();
          }}
        />
      )}

      {showCalculationPreview && (
        <FeeCalculationPreview
          isOpen={showCalculationPreview}
          onClose={() => setShowCalculationPreview(false)}
          onCalculate={() => {
            setShowCalculationPreview(false);
            fetchFeeDashboardData();
          }}
        />
      )}
    </div>
  );
};

export default FeeDashboard;