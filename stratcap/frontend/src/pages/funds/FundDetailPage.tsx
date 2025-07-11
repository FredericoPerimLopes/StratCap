import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { fetchFundById, clearCurrentFund } from '../../store/slices/fundSlice';
import {
  ArrowLeftIcon,
  PencilIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ChartBarIcon,
  UsersIcon,
  DocumentTextIcon,
  BanknotesIcon,
  TrendingUpIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const FundDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { currentFund, isLoading, error } = useSelector((state: RootState) => state.fund);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (id) {
      dispatch(fetchFundById(parseInt(id)));
    }
    return () => {
      dispatch(clearCurrentFund());
    };
  }, [dispatch, id]);

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  const formatPercent = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return `${num.toFixed(1)}%`;
  };

  // Sample data for charts
  const performanceData = [
    { quarter: 'Q1 2023', nav: 1.05, irr: 12.5, dpi: 0.85, tvpi: 1.45 },
    { quarter: 'Q2 2023', nav: 1.08, irr: 14.2, dpi: 0.92, tvpi: 1.52 },
    { quarter: 'Q3 2023', nav: 1.12, irr: 16.8, dpi: 1.05, tvpi: 1.68 },
    { quarter: 'Q4 2023', nav: 1.15, irr: 18.3, dpi: 1.12, tvpi: 1.75 },
    { quarter: 'Q1 2024', nav: 1.18, irr: 19.7, dpi: 1.25, tvpi: 1.88 },
    { quarter: 'Q2 2024', nav: 1.22, irr: 21.2, dpi: 1.35, tvpi: 1.95 }
  ];

  const capitalCallData = [
    { month: 'Jan', called: 15000000, committed: 100000000 },
    { month: 'Feb', called: 12000000, committed: 100000000 },
    { month: 'Mar', called: 18000000, committed: 100000000 },
    { month: 'Apr', called: 8000000, committed: 100000000 },
    { month: 'May', called: 22000000, committed: 100000000 },
    { month: 'Jun', called: 14000000, committed: 100000000 }
  ];

  const portfolioData = [
    { name: 'Technology', value: 35, color: '#3B82F6' },
    { name: 'Healthcare', value: 25, color: '#10B981' },
    { name: 'Financial Services', value: 20, color: '#8B5CF6' },
    { name: 'Consumer', value: 15, color: '#F59E0B' },
    { name: 'Other', value: 5, color: '#EF4444' }
  ];

  const waterfallData = [
    { category: 'Committed Capital', amount: 100000000, cumulative: 100000000 },
    { category: 'Management Fees', amount: -4000000, cumulative: 96000000 },
    { category: 'Investment Returns', amount: 35000000, cumulative: 131000000 },
    { category: 'Preferred Return', amount: -8000000, cumulative: 123000000 },
    { category: 'Carried Interest', amount: -6150000, cumulative: 116850000 },
    { category: 'LP Distribution', amount: 116850000, cumulative: 116850000 }
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !currentFund) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <h3 className="text-sm font-medium text-red-800">Error</h3>
        <div className="mt-2 text-sm text-red-700">
          <p>{error || 'Fund not found'}</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'performance', name: 'Performance', icon: TrendingUpIcon },
    { id: 'capital', name: 'Capital Activities', icon: BanknotesIcon },
    { id: 'portfolio', name: 'Portfolio', icon: BuildingOfficeIcon },
    { id: 'waterfall', name: 'Waterfall', icon: DocumentTextIcon },
    { id: 'investors', name: 'Investors', icon: UsersIcon }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/funds')}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{currentFund.name}</h1>
            <p className="text-sm text-gray-500">{currentFund.code} • {currentFund.type} • Vintage {currentFund.vintage}</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Link
            to={`/funds/${currentFund.id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit Fund
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Target Size</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(currentFund.targetSize)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <TrendingUpIcon className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">IRR</p>
              <p className="text-2xl font-semibold text-gray-900">21.2%</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">TVPI</p>
              <p className="text-2xl font-semibold text-gray-900">1.95x</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <CalendarIcon className="h-8 w-8 text-orange-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Status</p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <CheckCircleIcon className="h-3 w-3 mr-1" />
                {currentFund.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Fund Details</h3>
                  <dl className="grid grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Management Fee</dt>
                      <dd className="text-sm text-gray-900">{formatPercent(currentFund.managementFeeRate)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Carried Interest</dt>
                      <dd className="text-sm text-gray-900">{formatPercent(currentFund.carriedInterestRate)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Preferred Return</dt>
                      <dd className="text-sm text-gray-900">{formatPercent(currentFund.preferredReturnRate)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Currency</dt>
                      <dd className="text-sm text-gray-900">{currentFund.currency}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Hard Cap</dt>
                      <dd className="text-sm text-gray-900">{currentFund.hardCap ? formatCurrency(currentFund.hardCap) : 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Investment Period End</dt>
                      <dd className="text-sm text-gray-900">
                        {currentFund.investmentPeriodEnd ? new Date(currentFund.investmentPeriodEnd).toLocaleDateString() : 'N/A'}
                      </dd>
                    </div>
                  </dl>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Summary</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={performanceData.slice(-4)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="quarter" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="irr" stroke="#3B82F6" strokeWidth={2} name="IRR (%)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Metrics Over Time</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="quarter" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="irr" stroke="#3B82F6" strokeWidth={2} name="IRR (%)" />
                      <Line type="monotone" dataKey="tvpi" stroke="#10B981" strokeWidth={2} name="TVPI" />
                      <Line type="monotone" dataKey="dpi" stroke="#8B5CF6" strokeWidth={2} name="DPI" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Quarterly Performance</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={performanceData.slice(-4)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="quarter" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="irr" fill="#3B82F6" name="IRR (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Key Performance Indicators</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-500">Internal Rate of Return</p>
                    <p className="text-2xl font-semibold text-gray-900">21.2%</p>
                    <p className="text-sm text-green-600">+2.5% vs benchmark</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-500">Total Value to Paid-in</p>
                    <p className="text-2xl font-semibold text-gray-900">1.95x</p>
                    <p className="text-sm text-green-600">+0.3x vs benchmark</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-500">Distributions to Paid-in</p>
                    <p className="text-2xl font-semibold text-gray-900">1.35x</p>
                    <p className="text-sm text-green-600">+0.2x vs benchmark</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Capital Activities Tab */}
          {activeTab === 'capital' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Capital Calls Timeline</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={capitalCallData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatCurrency(value as number), '']} />
                    <Area type="monotone" dataKey="called" stackId="1" stroke="#3B82F6" fill="#3B82F6" name="Capital Called" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Capital Activities</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">2024-06-15</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Capital Call</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(14000000)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Completed
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">2024-05-20</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Distribution</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(8500000)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Completed
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">2024-05-01</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Capital Call</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(22000000)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Completed
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Portfolio Tab */}
          {activeTab === 'portfolio' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Portfolio Allocation by Sector</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={portfolioData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {portfolioData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Portfolio Summary</h3>
                  <div className="space-y-4">
                    {portfolioData.map((sector, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sector.color }}></div>
                          <span className="text-sm font-medium text-gray-900">{sector.name}</span>
                        </div>
                        <span className="text-sm text-gray-500">{sector.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Waterfall Tab */}
          {activeTab === 'waterfall' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Waterfall Analysis</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={waterfallData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatCurrency(value as number), '']} />
                    <Bar dataKey="amount" fill={(entry) => entry >= 0 ? '#10B981' : '#EF4444'} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Waterfall Details</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cumulative</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {waterfallData.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.category}</td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${
                            item.amount >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(item.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            {formatCurrency(item.cumulative)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Investors Tab */}
          {activeTab === 'investors' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Fund Investors</h3>
                <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                  <UsersIcon className="h-4 w-4 mr-2" />
                  Add Investor
                </button>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-600">Investor management functionality will be integrated with the Investors module.</p>
                <Link to="/investors" className="text-indigo-600 hover:text-indigo-500 font-medium">
                  Go to Investors →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FundDetailPage;