import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CogIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  DocumentDuplicateIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface FundConfiguration {
  id: string;
  fundName: string;
  fundCode: string;
  fundType: 'private_equity' | 'venture_capital' | 'real_estate' | 'hedge_fund' | 'other';
  status: 'draft' | 'configured' | 'active' | 'archived';
  targetSize: number;
  currency: string;
  vintage: number;
  managementFeeRate: number;
  carriedInterestRate: number;
  lastModified: string;
  configurationScore: number; // Percentage of completion
  activeInvestors: number;
  totalCommitments: number;
}

const FundConfigurationList: React.FC = () => {
  const [configurations, setConfigurations] = useState<FundConfiguration[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);

  useEffect(() => {
    // Mock data - in real app, this would come from API
    setConfigurations([
      {
        id: '1',
        fundName: 'Growth Fund IV',
        fundCode: 'GF4',
        fundType: 'private_equity',
        status: 'active',
        targetSize: 1000000000,
        currency: 'USD',
        vintage: 2024,
        managementFeeRate: 0.02,
        carriedInterestRate: 0.20,
        lastModified: '2023-12-15',
        configurationScore: 100,
        activeInvestors: 45,
        totalCommitments: 750000000
      },
      {
        id: '2',
        fundName: 'Venture Fund V',
        fundCode: 'VF5',
        fundType: 'venture_capital',
        status: 'configured',
        targetSize: 500000000,
        currency: 'USD',
        vintage: 2024,
        managementFeeRate: 0.025,
        carriedInterestRate: 0.20,
        lastModified: '2023-12-10',
        configurationScore: 95,
        activeInvestors: 28,
        totalCommitments: 320000000
      },
      {
        id: '3',
        fundName: 'Real Estate Fund II',
        fundCode: 'REF2',
        fundType: 'real_estate',
        status: 'draft',
        targetSize: 750000000,
        currency: 'USD',
        vintage: 2024,
        managementFeeRate: 0.015,
        carriedInterestRate: 0.15,
        lastModified: '2023-12-08',
        configurationScore: 65,
        activeInvestors: 0,
        totalCommitments: 0
      },
      {
        id: '4',
        fundName: 'Growth Fund III',
        fundCode: 'GF3',
        fundType: 'private_equity',
        status: 'archived',
        targetSize: 800000000,
        currency: 'USD',
        vintage: 2021,
        managementFeeRate: 0.02,
        carriedInterestRate: 0.20,
        lastModified: '2023-11-20',
        configurationScore: 100,
        activeInvestors: 52,
        totalCommitments: 800000000
      }
    ]);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: amount >= 1e6 ? 'compact' : 'standard'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'configured': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <PencilIcon className="h-4 w-4" />;
      case 'configured': return <CheckCircleIcon className="h-4 w-4" />;
      case 'active': return <CheckCircleIcon className="h-4 w-4" />;
      case 'archived': return <ClockIcon className="h-4 w-4" />;
      default: return null;
    }
  };

  const getFundTypeColor = (type: string) => {
    switch (type) {
      case 'private_equity': return 'bg-blue-100 text-blue-800';
      case 'venture_capital': return 'bg-green-100 text-green-800';
      case 'real_estate': return 'bg-purple-100 text-purple-800';
      case 'hedge_fund': return 'bg-orange-100 text-orange-800';
      case 'other': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFundTypeDisplayName = (type: string) => {
    switch (type) {
      case 'private_equity': return 'Private Equity';
      case 'venture_capital': return 'Venture Capital';
      case 'real_estate': return 'Real Estate';
      case 'hedge_fund': return 'Hedge Fund';
      case 'other': return 'Other';
      default: return type;
    }
  };

  const getConfigurationScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfigurationScoreIcon = (score: number) => {
    if (score >= 90) return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
    if (score >= 70) return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />;
    return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
  };

  const handleDelete = (id: string) => {
    setConfigurations(configurations.filter(config => config.id !== id));
    setShowDeleteModal(null);
  };

  const duplicateConfiguration = (id: string) => {
    const originalConfig = configurations.find(config => config.id === id);
    if (originalConfig) {
      const duplicatedConfig: FundConfiguration = {
        ...originalConfig,
        id: Date.now().toString(),
        fundName: `${originalConfig.fundName} (Copy)`,
        fundCode: `${originalConfig.fundCode}_COPY`,
        status: 'draft',
        lastModified: new Date().toISOString().split('T')[0],
        activeInvestors: 0,
        totalCommitments: 0,
        configurationScore: originalConfig.configurationScore
      };
      setConfigurations([duplicatedConfig, ...configurations]);
    }
  };

  const filteredConfigurations = configurations.filter(config => {
    const matchesSearch = config.fundName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         config.fundCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || config.status === filterStatus;
    const matchesType = !filterType || config.fundType === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  // Calculate summary metrics
  const totalFunds = configurations.length;
  const activeFunds = configurations.filter(config => config.status === 'active').length;
  const draftFunds = configurations.filter(config => config.status === 'draft').length;
  const totalAUM = configurations
    .filter(config => config.status === 'active')
    .reduce((sum, config) => sum + config.totalCommitments, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Fund Configuration Management</h1>
        <div className="flex space-x-3">
          <Link
            to="/fund-configuration/wizard"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            New Fund Configuration
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <CogIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Funds</p>
              <p className="text-2xl font-semibold text-gray-900">{totalFunds}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active Funds</p>
              <p className="text-2xl font-semibold text-gray-900">{activeFunds}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <PencilIcon className="h-8 w-8 text-orange-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Draft Configurations</p>
              <p className="text-2xl font-semibold text-gray-900">{draftFunds}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total AUM</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totalAUM)}</p>
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
              placeholder="Search funds..."
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
            <option value="draft">Draft</option>
            <option value="configured">Configured</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Types</option>
            <option value="private_equity">Private Equity</option>
            <option value="venture_capital">Venture Capital</option>
            <option value="real_estate">Real Estate</option>
            <option value="hedge_fund">Hedge Fund</option>
            <option value="other">Other</option>
          </select>
          <div className="flex items-center text-sm text-gray-500">
            <FunnelIcon className="h-4 w-4 mr-1" />
            {filteredConfigurations.length} of {configurations.length} funds
          </div>
        </div>
      </div>

      {/* Configuration List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fund
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Target Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fee Structure
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Configuration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Investors
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredConfigurations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    No fund configurations found
                  </td>
                </tr>
              ) : (
                filteredConfigurations.map((config) => (
                  <tr key={config.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{config.fundName}</div>
                        <div className="text-sm text-gray-500">{config.fundCode} • {config.vintage}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getFundTypeColor(config.fundType)}`}>
                        {getFundTypeDisplayName(config.fundType)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatCurrency(config.targetSize)}</div>
                      <div className="text-sm text-gray-500">{config.currency}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        Mgmt: {formatPercentage(config.managementFeeRate)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Carry: {formatPercentage(config.carriedInterestRate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getConfigurationScoreIcon(config.configurationScore)}
                        <span className={`ml-2 text-sm font-medium ${getConfigurationScoreColor(config.configurationScore)}`}>
                          {config.configurationScore}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div 
                          className="bg-indigo-600 h-1.5 rounded-full" 
                          style={{ width: `${config.configurationScore}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(config.status)}`}>
                        {getStatusIcon(config.status)}
                        <span className="ml-1">{config.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{config.activeInvestors}</div>
                      <div className="text-sm text-gray-500">
                        {config.totalCommitments > 0 ? formatCurrency(config.totalCommitments) : 'No commitments'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          to={`/fund-configuration/${config.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="View Configuration"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Link>
                        <Link
                          to={`/fund-configuration/${config.id}/edit`}
                          className="text-green-600 hover:text-green-900"
                          title="Edit Configuration"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => duplicateConfiguration(config.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Duplicate Configuration"
                        >
                          <DocumentDuplicateIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setShowDeleteModal(config.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Configuration"
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

      {/* Configuration Insights */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-4">Configuration Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Avg Configuration Score</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {Math.round(configurations.reduce((sum, config) => sum + config.configurationScore, 0) / configurations.length)}%
                </p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Incomplete Configs</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {configurations.filter(config => config.configurationScore < 100).length}
                </p>
              </div>
              <ExclamationTriangleIcon className="h-8 w-8 text-orange-500" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Most Recent Update</p>
                <p className="text-sm font-semibold text-gray-900">
                  {new Date(Math.max(...configurations.map(config => new Date(config.lastModified).getTime()))).toLocaleDateString()}
                </p>
              </div>
              <ClockIcon className="h-8 w-8 text-green-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">Delete Fund Configuration</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this fund configuration? This action cannot be undone.
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

export default FundConfigurationList;