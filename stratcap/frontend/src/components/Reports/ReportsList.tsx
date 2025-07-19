import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DocumentChartBarIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  DocumentArrowDownIcon,
  ShareIcon,
  ChartBarIcon,
  CubeIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';

interface Report {
  id: string;
  name: string;
  description: string;
  type: 'performance' | 'cash_flow' | 'investor_summary' | 'fee_calculation' | 'waterfall' | 'compliance';
  status: 'draft' | 'generating' | 'completed' | 'error';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  hasScenarios: boolean;
  scheduledRun?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    nextRun: string;
  };
  fileSize?: string;
  downloadCount: number;
}

const ReportsList: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);

  useEffect(() => {
    // Mock data - in real app, this would come from API
    setReports([
      {
        id: '1',
        name: 'Q4 2023 Performance Report',
        description: 'Comprehensive performance analysis for all funds',
        type: 'performance',
        status: 'completed',
        createdAt: '2023-12-15T10:30:00Z',
        updatedAt: '2023-12-15T11:45:00Z',
        createdBy: 'John Smith',
        hasScenarios: true,
        fileSize: '2.4 MB',
        downloadCount: 15
      },
      {
        id: '2',
        name: 'Investor Summary - Growth Fund IV',
        description: 'Monthly investor statements and portfolio overview',
        type: 'investor_summary',
        status: 'generating',
        createdAt: '2023-12-14T09:15:00Z',
        updatedAt: '2023-12-14T09:15:00Z',
        createdBy: 'Sarah Johnson',
        hasScenarios: false,
        scheduledRun: {
          frequency: 'monthly',
          nextRun: '2024-01-15T09:00:00Z'
        },
        downloadCount: 0
      },
      {
        id: '3',
        name: 'Cash Flow Projection with Scenarios',
        description: 'Forward-looking cash flow analysis with stress testing',
        type: 'cash_flow',
        status: 'completed',
        createdAt: '2023-12-13T14:20:00Z',
        updatedAt: '2023-12-13T16:30:00Z',
        createdBy: 'Michael Chen',
        hasScenarios: true,
        fileSize: '1.8 MB',
        downloadCount: 8
      },
      {
        id: '4',
        name: 'Fee Calculation - Q4 2023',
        description: 'Management fees and carried interest calculations',
        type: 'fee_calculation',
        status: 'draft',
        createdAt: '2023-12-12T11:00:00Z',
        updatedAt: '2023-12-12T11:00:00Z',
        createdBy: 'Lisa Wang',
        hasScenarios: false,
        downloadCount: 0
      },
      {
        id: '5',
        name: 'Waterfall Analysis - Exit Scenarios',
        description: 'Distribution waterfall modeling with exit assumptions',
        type: 'waterfall',
        status: 'error',
        createdAt: '2023-12-11T16:45:00Z',
        updatedAt: '2023-12-11T17:00:00Z',
        createdBy: 'David Brown',
        hasScenarios: true,
        downloadCount: 0
      },
      {
        id: '6',
        name: 'Compliance Report - Annual',
        description: 'Annual regulatory compliance and reporting',
        type: 'compliance',
        status: 'completed',
        createdAt: '2023-12-10T08:30:00Z',
        updatedAt: '2023-12-10T12:15:00Z',
        createdBy: 'Emma Davis',
        hasScenarios: false,
        fileSize: '5.2 MB',
        downloadCount: 25
      }
    ]);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'generating': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <PencilIcon className="h-4 w-4" />;
      case 'generating': return <ClockIcon className="h-4 w-4" />;
      case 'completed': return <CheckCircleIcon className="h-4 w-4" />;
      case 'error': return <ExclamationTriangleIcon className="h-4 w-4" />;
      default: return null;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'performance': return <ChartBarIcon className="h-5 w-5 text-blue-500" />;
      case 'cash_flow': return <DocumentChartBarIcon className="h-5 w-5 text-green-500" />;
      case 'investor_summary': return <DocumentIcon className="h-5 w-5 text-purple-500" />;
      case 'fee_calculation': return <DocumentIcon className="h-5 w-5 text-orange-500" />;
      case 'waterfall': return <CubeIcon className="h-5 w-5 text-indigo-500" />;
      case 'compliance': return <DocumentIcon className="h-5 w-5 text-red-500" />;
      default: return <DocumentIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTypeDisplayName = (type: string) => {
    switch (type) {
      case 'performance': return 'Performance';
      case 'cash_flow': return 'Cash Flow';
      case 'investor_summary': return 'Investor Summary';
      case 'fee_calculation': return 'Fee Calculation';
      case 'waterfall': return 'Waterfall';
      case 'compliance': return 'Compliance';
      default: return type;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDelete = (id: string) => {
    setReports(reports.filter(report => report.id !== id));
    setShowDeleteModal(null);
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || report.type === filterType;
    const matchesStatus = !filterStatus || report.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Calculate summary metrics
  const totalReports = reports.length;
  const completedReports = reports.filter(r => r.status === 'completed').length;
  const reportsWithScenarios = reports.filter(r => r.hasScenarios).length;
  const scheduledReports = reports.filter(r => r.scheduledRun).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <div className="flex space-x-3">
          <Link
            to="/reports/builder"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            New Report
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <DocumentChartBarIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Reports</p>
              <p className="text-2xl font-semibold text-gray-900">{totalReports}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">{completedReports}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <CubeIcon className="h-8 w-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">With Scenarios</p>
              <p className="text-2xl font-semibold text-gray-900">{reportsWithScenarios}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <CalendarIcon className="h-8 w-8 text-orange-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Scheduled</p>
              <p className="text-2xl font-semibold text-gray-900">{scheduledReports}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Types</option>
            <option value="performance">Performance</option>
            <option value="cash_flow">Cash Flow</option>
            <option value="investor_summary">Investor Summary</option>
            <option value="fee_calculation">Fee Calculation</option>
            <option value="waterfall">Waterfall</option>
            <option value="compliance">Compliance</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="generating">Generating</option>
            <option value="completed">Completed</option>
            <option value="error">Error</option>
          </select>
          <div className="flex items-center text-sm text-gray-500">
            <FunnelIcon className="h-4 w-4 mr-1" />
            {filteredReports.length} of {reports.length} reports
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Report
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Features
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Downloads
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No reports found
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getTypeIcon(report.type)}
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{report.name}</div>
                          <div className="text-sm text-gray-500">{report.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        {getTypeDisplayName(report.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                        {getStatusIcon(report.status)}
                        <span className="ml-1">{report.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(report.createdAt)}</div>
                      <div className="text-sm text-gray-500">by {report.createdBy}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        {report.hasScenarios && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">
                            Scenarios
                          </span>
                        )}
                        {report.scheduledRun && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                            Scheduled
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{report.downloadCount}</div>
                      {report.fileSize && (
                        <div className="text-sm text-gray-500">{report.fileSize}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          to={`/reports/${report.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="View Report"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Link>
                        {report.status === 'completed' && (
                          <button
                            className="text-green-600 hover:text-green-900"
                            title="Download Report"
                          >
                            <DocumentArrowDownIcon className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          className="text-blue-600 hover:text-blue-900"
                          title="Share Report"
                        >
                          <ShareIcon className="h-4 w-4" />
                        </button>
                        {report.status === 'draft' && (
                          <Link
                            to={`/reports/builder?edit=${report.id}`}
                            className="text-orange-600 hover:text-orange-900"
                            title="Edit Report"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Link>
                        )}
                        <button
                          onClick={() => setShowDeleteModal(report.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Report"
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

      {/* Scenario Analysis Insights */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-4">Scenario Analysis Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Reports with Scenarios</p>
                <p className="text-2xl font-semibold text-gray-900">{reportsWithScenarios}</p>
              </div>
              <CubeIcon className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Avg Scenario Variance</p>
                <p className="text-2xl font-semibold text-gray-900">±18.5%</p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Most Used Scenario</p>
                <p className="text-lg font-semibold text-gray-900">Optimistic</p>
              </div>
              <DocumentChartBarIcon className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>
        <div className="mt-4 text-sm text-blue-700">
          <p>• Scenario analysis helps model different market conditions and their impact on fund performance</p>
          <p>• Enable scenarios in Report Builder to compare base case vs. optimistic/pessimistic outcomes</p>
          <p>• Use custom scenarios to model specific stress testing or sensitivity analysis</p>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">Delete Report</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this report? This action cannot be undone.
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

export default ReportsList;