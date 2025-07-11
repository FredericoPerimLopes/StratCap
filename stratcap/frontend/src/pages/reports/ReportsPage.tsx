import React, { useState } from 'react';
import {
  DocumentTextIcon,
  ChartBarIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  FunnelIcon,
  PrinterIcon,
  ShareIcon,
  CurrencyDollarIcon,
  TrendingUpIcon,
  UsersIcon,
  BuildingOfficeIcon,
  EyeIcon,
  ClockIcon
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
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

interface Report {
  id: number;
  name: string;
  type: 'performance' | 'investor' | 'capital' | 'compliance' | 'tax' | 'financial';
  description: string;
  frequency: 'monthly' | 'quarterly' | 'annual' | 'on-demand';
  lastGenerated: string;
  recipients: number;
  status: 'active' | 'draft' | 'archived';
  fund?: string;
}

const ReportsPage: React.FC = () => {
  const [selectedReportType, setSelectedReportType] = useState('');
  const [selectedFund, setSelectedFund] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');

  const reports: Report[] = [
    {
      id: 1,
      name: 'Fund Performance Report',
      type: 'performance',
      description: 'Comprehensive fund performance analysis including IRR, MOIC, and benchmark comparisons',
      frequency: 'quarterly',
      lastGenerated: '2024-06-30',
      recipients: 45,
      status: 'active',
      fund: 'Growth Fund III'
    },
    {
      id: 2,
      name: 'Investor Statements',
      type: 'investor',
      description: 'Individual investor statements with portfolio positions and performance metrics',
      frequency: 'quarterly',
      lastGenerated: '2024-06-30',
      recipients: 125,
      status: 'active'
    },
    {
      id: 3,
      name: 'Capital Activity Summary',
      type: 'capital',
      description: 'Summary of capital calls, distributions, and commitment utilization',
      frequency: 'monthly',
      lastGenerated: '2024-06-30',
      recipients: 35,
      status: 'active'
    },
    {
      id: 4,
      name: 'Compliance Report',
      type: 'compliance',
      description: 'Regulatory compliance status and required filings tracker',
      frequency: 'monthly',
      lastGenerated: '2024-06-30',
      recipients: 8,
      status: 'active'
    },
    {
      id: 5,
      name: 'Tax Package',
      type: 'tax',
      description: 'Annual tax reporting package including K-1s and supporting schedules',
      frequency: 'annual',
      lastGenerated: '2024-03-15',
      recipients: 125,
      status: 'active'
    },
    {
      id: 6,
      name: 'Financial Statements',
      type: 'financial',
      description: 'Audited financial statements and notes',
      frequency: 'annual',
      lastGenerated: '2024-03-31',
      recipients: 150,
      status: 'active'
    }
  ];

  const filteredReports = reports.filter(report => {
    const matchesType = !selectedReportType || report.type === selectedReportType;
    const matchesFund = !selectedFund || report.fund === selectedFund;
    return matchesType && matchesFund;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'performance': return <TrendingUpIcon className="h-5 w-5 text-green-500" />;
      case 'investor': return <UsersIcon className="h-5 w-5 text-blue-500" />;
      case 'capital': return <CurrencyDollarIcon className="h-5 w-5 text-purple-500" />;
      case 'compliance': return <DocumentTextIcon className="h-5 w-5 text-orange-500" />;
      case 'tax': return <DocumentTextIcon className="h-5 w-5 text-red-500" />;
      case 'financial': return <ChartBarIcon className="h-5 w-5 text-indigo-500" />;
      default: return <DocumentTextIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'performance': return 'bg-green-100 text-green-800';
      case 'investor': return 'bg-blue-100 text-blue-800';
      case 'capital': return 'bg-purple-100 text-purple-800';
      case 'compliance': return 'bg-orange-100 text-orange-800';
      case 'tax': return 'bg-red-100 text-red-800';
      case 'financial': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'monthly': return 'bg-blue-100 text-blue-800';
      case 'quarterly': return 'bg-green-100 text-green-800';
      case 'annual': return 'bg-purple-100 text-purple-800';
      case 'on-demand': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Sample performance data
  const performanceData = [
    { quarter: 'Q1 2023', grossIRR: 18.5, netIRR: 15.2, moic: 1.45, dpi: 0.85 },
    { quarter: 'Q2 2023', grossIRR: 19.8, netIRR: 16.4, moic: 1.52, dpi: 0.92 },
    { quarter: 'Q3 2023', grossIRR: 21.2, netIRR: 17.8, moic: 1.68, dpi: 1.05 },
    { quarter: 'Q4 2023', grossIRR: 22.1, netIRR: 18.7, moic: 1.75, dpi: 1.12 },
    { quarter: 'Q1 2024', grossIRR: 23.4, netIRR: 19.9, moic: 1.88, dpi: 1.25 },
    { quarter: 'Q2 2024', grossIRR: 24.7, netIRR: 21.2, moic: 1.95, dpi: 1.35 }
  ];

  const fundComparisonData = [
    { fund: 'Growth Fund III', irr: 21.2, moic: 1.95, dpi: 1.35 },
    { fund: 'Venture Fund II', irr: 18.7, moic: 1.42, dpi: 0.98 },
    { fund: 'Real Estate Fund I', irr: 15.3, moic: 1.28, dpi: 1.12 }
  ];

  const reportTypeData = [
    { name: 'Performance', count: 25, color: '#10B981' },
    { name: 'Investor', count: 125, color: '#3B82F6' },
    { name: 'Capital', count: 35, color: '#8B5CF6' },
    { name: 'Compliance', count: 15, color: '#F59E0B' },
    { name: 'Tax', count: 125, color: '#EF4444' },
    { name: 'Financial', count: 150, color: '#6366F1' }
  ];

  const uniqueFunds = ['Growth Fund III', 'Venture Fund II', 'Real Estate Fund I'];

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: ChartBarIcon },
    { id: 'reports', name: 'Report Library', icon: DocumentTextIcon },
    { id: 'generator', name: 'Report Generator', icon: PrinterIcon }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <div className="flex space-x-3">
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <ShareIcon className="h-4 w-4 mr-2" />
            Share
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            Generate Report
          </button>
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
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="flex items-center">
                    <TrendingUpIcon className="h-8 w-8 text-green-500" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">Portfolio IRR</p>
                      <p className="text-2xl font-semibold text-gray-900">21.2%</p>
                      <p className="text-sm text-green-600">+2.1% vs last quarter</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="flex items-center">
                    <CurrencyDollarIcon className="h-8 w-8 text-blue-500" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">Total AUM</p>
                      <p className="text-2xl font-semibold text-gray-900">$2.1B</p>
                      <p className="text-sm text-blue-600">+5.2% vs last quarter</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="flex items-center">
                    <DocumentTextIcon className="h-8 w-8 text-purple-500" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">Reports Generated</p>
                      <p className="text-2xl font-semibold text-gray-900">125</p>
                      <p className="text-sm text-purple-600">This quarter</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="flex items-center">
                    <UsersIcon className="h-8 w-8 text-orange-500" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">Active Investors</p>
                      <p className="text-2xl font-semibold text-gray-900">247</p>
                      <p className="text-sm text-orange-600">Across all funds</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Trends</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="quarter" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="netIRR" stroke="#3B82F6" strokeWidth={2} name="Net IRR (%)" />
                      <Line type="monotone" dataKey="moic" stroke="#10B981" strokeWidth={2} name="MOIC" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Fund Comparison</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={fundComparisonData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="fund" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="irr" fill="#3B82F6" name="IRR (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Report Generation Summary */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Report Generation Activity</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={reportTypeData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {reportTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Reports Library Tab */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <select
                    value={selectedReportType}
                    onChange={(e) => setSelectedReportType(e.target.value)}
                    className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">All Report Types</option>
                    <option value="performance">Performance</option>
                    <option value="investor">Investor</option>
                    <option value="capital">Capital</option>
                    <option value="compliance">Compliance</option>
                    <option value="tax">Tax</option>
                    <option value="financial">Financial</option>
                  </select>
                  <select
                    value={selectedFund}
                    onChange={(e) => setSelectedFund(e.target.value)}
                    className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">All Funds</option>
                    {uniqueFunds.map(fund => (
                      <option key={fund} value={fund}>{fund}</option>
                    ))}
                  </select>
                  <div className="flex items-center text-sm text-gray-500">
                    <FunnelIcon className="h-4 w-4 mr-1" />
                    {filteredReports.length} of {reports.length} reports
                  </div>
                </div>
              </div>

              {/* Reports Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredReports.map((report) => (
                  <div key={report.id} className="bg-gray-50 p-6 rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        {getTypeIcon(report.type)}
                        <h3 className="ml-3 text-lg font-medium text-gray-900">{report.name}</h3>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(report.type)}`}>
                        {report.type}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-gray-600">{report.description}</p>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Frequency:</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getFrequencyColor(report.frequency)}`}>
                          {report.frequency}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Last Generated:</span>
                        <span className="text-sm text-gray-900">{new Date(report.lastGenerated).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Recipients:</span>
                        <span className="text-sm text-gray-900">{report.recipients}</span>
                      </div>
                      {report.fund && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Fund:</span>
                          <span className="text-sm text-gray-900">{report.fund}</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-6 flex space-x-2">
                      <button className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View
                      </button>
                      <button className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                        <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                        Generate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Report Generator Tab */}
          {activeTab === 'generator' && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Custom Report Generator</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Report Type</label>
                      <select className="mt-1 block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
                        <option>Performance Report</option>
                        <option>Investor Statement</option>
                        <option>Capital Activity Summary</option>
                        <option>Compliance Report</option>
                        <option>Tax Package</option>
                        <option>Financial Statements</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Fund Selection</label>
                      <select className="mt-1 block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
                        <option>All Funds</option>
                        <option>Growth Fund III</option>
                        <option>Venture Fund II</option>
                        <option>Real Estate Fund I</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Report Period</label>
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="date"
                          value={dateFrom}
                          onChange={(e) => setDateFrom(e.target.value)}
                          className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <input
                          type="date"
                          value={dateTo}
                          onChange={(e) => setDateTo(e.target.value)}
                          className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Output Format</label>
                      <div className="mt-2 space-y-2">
                        <label className="flex items-center">
                          <input type="radio" name="format" value="pdf" className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300" defaultChecked />
                          <span className="ml-2 text-sm text-gray-700">PDF</span>
                        </label>
                        <label className="flex items-center">
                          <input type="radio" name="format" value="excel" className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300" />
                          <span className="ml-2 text-sm text-gray-700">Excel</span>
                        </label>
                        <label className="flex items-center">
                          <input type="radio" name="format" value="both" className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300" />
                          <span className="ml-2 text-sm text-gray-700">Both</span>
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Delivery Method</label>
                      <div className="mt-2 space-y-2">
                        <label className="flex items-center">
                          <input type="checkbox" className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded" defaultChecked />
                          <span className="ml-2 text-sm text-gray-700">Download</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                          <span className="ml-2 text-sm text-gray-700">Email to Recipients</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                          <span className="ml-2 text-sm text-gray-700">Save to Portal</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                    Preview
                  </button>
                  <button className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700">
                    Generate Report
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;