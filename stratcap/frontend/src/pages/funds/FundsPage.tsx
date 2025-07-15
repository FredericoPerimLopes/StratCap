import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { RootState, AppDispatch } from '../../store/store';
import {
  fetchFunds,
  createFund,
  deleteFund,
  clearError
} from '../../store/slices/fundSlice';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  FunnelIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface FundFormData {
  name: string;
  code: string;
  type: 'master' | 'feeder' | 'parallel' | 'subsidiary';
  vintage: number;
  targetSize: string;
  currency: string;
  managementFeeRate: string;
  carriedInterestRate: string;
  preferredReturnRate: string;
}

const FundsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { funds, isLoading, error } = useSelector((state: RootState) => state.fund);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null);
  const [formData, setFormData] = useState<FundFormData>({
    name: '',
    code: '',
    type: 'master',
    vintage: new Date().getFullYear(),
    targetSize: '',
    currency: 'USD',
    managementFeeRate: '2.0',
    carriedInterestRate: '20.0',
    preferredReturnRate: '8.0'
  });

  useEffect(() => {
    dispatch(fetchFunds());
  }, [dispatch]);

  const handleCreateFund = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dispatch(createFund(formData)).unwrap();
      setShowCreateModal(false);
      setFormData({
        name: '',
        code: '',
        type: 'master',
        vintage: new Date().getFullYear(),
        targetSize: '',
        currency: 'USD',
        managementFeeRate: '2.0',
        carriedInterestRate: '20.0',
        preferredReturnRate: '8.0'
      });
    } catch (error) {
      console.error('Failed to create fund:', error);
    }
  };

  const handleDeleteFund = async (id: number) => {
    try {
      await dispatch(deleteFund(id)).unwrap();
      setShowDeleteModal(null);
    } catch (error) {
      console.error('Failed to delete fund:', error);
    }
  };

  const filteredFunds = funds.filter(fund => {
    const matchesSearch = fund.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fund.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || fund.type === filterType;
    const matchesStatus = !filterStatus || fund.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'fundraising': return 'bg-blue-100 text-blue-800';
      case 'investing': return 'bg-green-100 text-green-800';
      case 'harvesting': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'master': return <BuildingOfficeIcon className="h-5 w-5 text-blue-500" />;
      case 'feeder': return <ChartBarIcon className="h-5 w-5 text-green-500" />;
      case 'parallel': return <CurrencyDollarIcon className="h-5 w-5 text-purple-500" />;
      case 'subsidiary': return <CalendarIcon className="h-5 w-5 text-orange-500" />;
      default: return <BuildingOfficeIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  // Sample chart data
  const performanceData = [
    { month: 'Jan', nav: 1.05, irr: 12.5 },
    { month: 'Feb', nav: 1.08, irr: 14.2 },
    { month: 'Mar', nav: 1.12, irr: 16.8 },
    { month: 'Apr', nav: 1.15, irr: 18.3 },
    { month: 'May', nav: 1.18, irr: 19.7 },
    { month: 'Jun', nav: 1.22, irr: 21.2 }
  ];

  const fundTypeData = [
    { name: 'Master', value: 45, color: '#3B82F6' },
    { name: 'Feeder', value: 30, color: '#10B981' },
    { name: 'Parallel', value: 20, color: '#8B5CF6' },
    { name: 'Subsidiary', value: 5, color: '#F59E0B' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Funds Management</h1>
        <div className="flex space-x-3">
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <DocumentArrowUpIcon className="h-4 w-4 mr-2" />
            Import
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            Export
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Fund
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => dispatch(clearError())}
                  className="text-red-800 bg-red-50 hover:bg-red-100 focus:ring-2 focus:ring-red-500 font-medium rounded-lg text-sm px-3 py-1.5"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Fund Performance Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="irr" stroke="#3B82F6" strokeWidth={2} name="IRR (%)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Fund Type Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={fundTypeData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {fundTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
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
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Types</option>
            <option value="master">Master</option>
            <option value="feeder">Feeder</option>
            <option value="parallel">Parallel</option>
            <option value="subsidiary">Subsidiary</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Status</option>
            <option value="fundraising">Fundraising</option>
            <option value="investing">Investing</option>
            <option value="harvesting">Harvesting</option>
            <option value="closed">Closed</option>
          </select>
          <div className="flex items-center text-sm text-gray-500">
            <FunnelIcon className="h-4 w-4 mr-1" />
            {filteredFunds.length} of {funds.length} funds
          </div>
        </div>
      </div>

      {/* Funds Table */}
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
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vintage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Target Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Management Fee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Carry
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredFunds.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    No funds found
                  </td>
                </tr>
              ) : (
                filteredFunds.map((fund) => (
                  <tr key={fund.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getTypeIcon(fund.type)}
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{fund.name}</div>
                          <div className="text-sm text-gray-500">{fund.code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {fund.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(fund.status)}`}>
                        {fund.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {fund.vintage}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(fund.targetSize)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {fund.managementFeeRate}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {fund.carriedInterestRate}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          to={`/funds/${fund.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Link>
                        <Link
                          to={`/funds/${fund.id}/edit`}
                          className="text-green-600 hover:text-green-900"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => setShowDeleteModal(fund.id)}
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

      {/* Create Fund Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Fund</h3>
              <form onSubmit={handleCreateFund} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fund Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fund Code</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="mt-1 block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="master">Master</option>
                    <option value="feeder">Feeder</option>
                    <option value="parallel">Parallel</option>
                    <option value="subsidiary">Subsidiary</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Vintage Year</label>
                  <input
                    type="number"
                    required
                    value={formData.vintage}
                    onChange={(e) => setFormData({ ...formData, vintage: parseInt(e.target.value) })}
                    className="mt-1 block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Target Size</label>
                  <input
                    type="number"
                    required
                    value={formData.targetSize}
                    onChange={(e) => setFormData({ ...formData, targetSize: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Mgmt Fee (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.managementFeeRate}
                      onChange={(e) => setFormData({ ...formData, managementFeeRate: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Carry (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.carriedInterestRate}
                      onChange={(e) => setFormData({ ...formData, carriedInterestRate: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
                  >
                    Create Fund
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">Delete Fund</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this fund? This action cannot be undone.
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
                  onClick={() => showDeleteModal && handleDeleteFund(showDeleteModal)}
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

export default FundsPage;