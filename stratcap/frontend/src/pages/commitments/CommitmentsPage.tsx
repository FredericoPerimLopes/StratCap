import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  FunnelIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  UserIcon,
  ChartPieIcon,
  BanknotesIcon,
  CalendarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import {
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

interface Commitment {
  id: number;
  fundId: number;
  investorEntityId: number;
  investorClassId: number;
  commitmentAmount: string;
  commitmentDate: string;
  closingId?: number;
  status: 'pending' | 'active' | 'suspended' | 'terminated';
  sideLetterTerms?: Record<string, any>;
  feeOverrides?: Record<string, any>;
  capitalCalled: string;
  capitalReturned: string;
  unfundedCommitment: string;
  preferredReturn: string;
  carriedInterest: string;
  notes?: string;
  metadata?: Record<string, any>;
  // Display fields populated from relations
  investorName?: string;
  fundName?: string;
  investorType?: string;
}

interface CommitmentFormData {
  fundId: number;
  investorEntityId: number;
  investorClassId: number;
  commitmentAmount: string;
  commitmentDate: string;
  closingId?: number;
  sideLetterTerms?: Record<string, any>;
  feeOverrides?: Record<string, any>;
  notes?: string;
  metadata?: Record<string, any>;
}

const CommitmentsPage: React.FC = () => {
  const [commitments, setCommitments] = useState<Commitment[]>([
    {
      id: 1,
      fundId: 1,
      investorEntityId: 1,
      investorClassId: 1,
      commitmentAmount: '25000000',
      commitmentDate: '2023-01-15',
      status: 'active',
      capitalCalled: '18000000',
      capitalReturned: '5000000',
      unfundedCommitment: '7000000',
      preferredReturn: '0',
      carriedInterest: '0',
      investorName: 'Pension Fund Alpha',
      fundName: 'Growth Fund III',
      investorType: 'institution'
    },
    {
      id: 2,
      fundId: 1,
      investorEntityId: 2,
      investorClassId: 1,
      commitmentAmount: '15000000',
      commitmentDate: '2023-02-20',
      status: 'active',
      capitalCalled: '15000000',
      capitalReturned: '8000000',
      unfundedCommitment: '0',
      preferredReturn: '0',
      carriedInterest: '0',
      investorName: 'Endowment Beta',
      fundName: 'Growth Fund III',
      investorType: 'institution'
    },
    {
      id: 3,
      fundId: 2,
      investorEntityId: 3,
      investorClassId: 1,
      commitmentAmount: '5000000',
      commitmentDate: '2023-03-10',
      status: 'active',
      capitalCalled: '3500000',
      capitalReturned: '1200000',
      unfundedCommitment: '1500000',
      preferredReturn: '0',
      carriedInterest: '0',
      investorName: 'John Smith Family Trust',
      fundName: 'Venture Fund II',
      investorType: 'trust'
    }
  ]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFund, setFilterFund] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterInvestorType, setFilterInvestorType] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null);
  const [formData, setFormData] = useState<CommitmentFormData>({
    fundId: 0,
    investorEntityId: 0,
    investorClassId: 0,
    commitmentAmount: '',
    commitmentDate: '',
    closingId: undefined,
    sideLetterTerms: {},
    feeOverrides: {},
    notes: '',
    metadata: {}
  });

  const handleCreateCommitment = async (e: React.FormEvent) => {
    e.preventDefault();
    const newCommitment: Commitment = {
      id: Date.now(),
      fundId: formData.fundId,
      investorEntityId: formData.investorEntityId,
      investorClassId: formData.investorClassId,
      commitmentAmount: formData.commitmentAmount,
      commitmentDate: formData.commitmentDate,
      closingId: formData.closingId,
      status: 'active',
      sideLetterTerms: formData.sideLetterTerms,
      feeOverrides: formData.feeOverrides,
      capitalCalled: '0',
      capitalReturned: '0',
      unfundedCommitment: formData.commitmentAmount,
      preferredReturn: '0',
      carriedInterest: '0',
      notes: formData.notes,
      metadata: formData.metadata,
      investorName: 'New Investor',
      fundName: 'New Fund',
      investorType: 'institution'
    };
    setCommitments([...commitments, newCommitment]);
    setShowCreateModal(false);
    setFormData({
      fundId: 0,
      investorEntityId: 0,
      investorClassId: 0,
      commitmentAmount: '',
      commitmentDate: '',
      closingId: undefined,
      sideLetterTerms: {},
      feeOverrides: {},
      notes: '',
      metadata: {}
    });
  };

  const handleDeleteCommitment = (id: number) => {
    setCommitments(commitments.filter(c => c.id !== id));
    setShowDeleteModal(null);
  };

  const filteredCommitments = commitments.filter(commitment => {
    const matchesSearch = (commitment.investorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         commitment.fundName?.toLowerCase().includes(searchTerm.toLowerCase())) || false;
    const matchesFund = !filterFund || commitment.fundName === filterFund;
    const matchesStatus = !filterStatus || commitment.status === filterStatus;
    const matchesType = !filterInvestorType || commitment.investorType === filterInvestorType;
    return matchesSearch && matchesFund && matchesStatus && matchesType;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'fulfilled': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInvestorTypeIcon = (type: string) => {
    switch (type) {
      case 'individual': return <UserIcon className="h-5 w-5 text-blue-500" />;
      case 'institution': return <BuildingOfficeIcon className="h-5 w-5 text-green-500" />;
      case 'fund': return <ChartPieIcon className="h-5 w-5 text-purple-500" />;
      case 'trust': return <BanknotesIcon className="h-5 w-5 text-orange-500" />;
      default: return <UserIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getCallPercentage = (called: number, total: number) => {
    return total > 0 ? (called / total) * 100 : 0;
  };

  // Calculate summary metrics
  const totalCommitments = commitments.reduce((sum, c) => sum + parseFloat(c.commitmentAmount || '0'), 0);
  const totalCalled = commitments.reduce((sum, c) => sum + parseFloat(c.capitalCalled || '0'), 0);
  const totalDistributed = commitments.reduce((sum, c) => sum + parseFloat(c.capitalReturned || '0'), 0);
  const totalRemaining = commitments.reduce((sum, c) => sum + parseFloat(c.unfundedCommitment || '0'), 0);

  // Sample data for charts
  const commitmentTrendData = [
    { month: 'Jan', commitments: 45000000, called: 25000000 },
    { month: 'Feb', commitments: 60000000, called: 35000000 },
    { month: 'Mar', commitments: 65000000, called: 40000000 },
    { month: 'Apr', commitments: 95000000, called: 50000000 },
    { month: 'May', commitments: 110000000, called: 65000000 },
    { month: 'Jun', commitments: 125000000, called: 83000000 }
  ];

  const investorTypeData = [
    { name: 'Institution', value: 70, color: '#10B981' },
    { name: 'Trust', value: 15, color: '#F59E0B' },
    { name: 'Fund', value: 10, color: '#8B5CF6' },
    { name: 'Individual', value: 5, color: '#3B82F6' }
  ];

  const fundCommitmentData = [
    { fund: 'Growth Fund III', commitments: 90000000, called: 68000000 },
    { fund: 'Venture Fund II', commitments: 5000000, called: 3500000 },
    { fund: 'Real Estate Fund I', commitments: 30000000, called: 12000000 }
  ];

  const uniqueFunds = [...new Set(commitments.map(c => `Fund ${c.fundId}`))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Commitment Management</h1>
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
            Add Commitment
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Commitments</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totalCommitments)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <BanknotesIcon className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Called Capital</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totalCalled)}</p>
              <p className="text-sm text-gray-500">{((totalCalled / totalCommitments) * 100).toFixed(1)}% of total</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <ChartPieIcon className="h-8 w-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Distributed</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totalDistributed)}</p>
              <p className="text-sm text-gray-500">{((totalDistributed / totalCalled) * 100).toFixed(1)}% of called</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <CalendarIcon className="h-8 w-8 text-orange-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Remaining</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totalRemaining)}</p>
              <p className="text-sm text-gray-500">{((totalRemaining / totalCommitments) * 100).toFixed(1)}% available</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Commitment vs Called Capital Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={commitmentTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [formatCurrency(value as number), '']} />
              <Area type="monotone" dataKey="commitments" stackId="1" stroke="#3B82F6" fill="#3B82F6" name="Commitments" />
              <Area type="monotone" dataKey="called" stackId="2" stroke="#10B981" fill="#10B981" name="Called" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Investor Types</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={investorTypeData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {investorTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Fund Breakdown */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Commitments by Fund</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={fundCommitmentData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="fund" />
            <YAxis />
            <Tooltip formatter={(value) => [formatCurrency(value as number), '']} />
            <Bar dataKey="commitments" fill="#3B82F6" name="Total Commitments" />
            <Bar dataKey="called" fill="#10B981" name="Called Capital" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search commitments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <select
            value={filterFund}
            onChange={(e) => setFilterFund(e.target.value)}
            className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Funds</option>
            {uniqueFunds.map(fund => (
              <option key={fund} value={fund}>{fund}</option>
            ))}
          </select>
          <select
            value={filterInvestorType}
            onChange={(e) => setFilterInvestorType(e.target.value)}
            className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Investor Types</option>
            <option value="individual">Individual</option>
            <option value="institution">Institution</option>
            <option value="fund">Fund</option>
            <option value="trust">Trust</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="fulfilled">Fulfilled</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <div className="flex items-center text-sm text-gray-500">
            <FunnelIcon className="h-4 w-4 mr-1" />
            {filteredCommitments.length} of {commitments.length} commitments
          </div>
        </div>
      </div>

      {/* Commitments Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Investor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fund
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Commitment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Called
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Distributed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Remaining
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCommitments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                    No commitments found
                  </td>
                </tr>
              ) : (
                filteredCommitments.map((commitment) => (
                  <tr key={commitment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getInvestorTypeIcon('institution')}
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">Investor #{commitment.investorEntityId}</div>
                          <div className="text-sm text-gray-500">Institution</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Fund #{commitment.fundId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(parseFloat(commitment.commitmentAmount) || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatCurrency(parseFloat(commitment.capitalCalled) || 0)}</div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-blue-600 h-1.5 rounded-full" 
                          style={{ width: `${getCallPercentage(parseFloat(commitment.capitalCalled) || 0, parseFloat(commitment.commitmentAmount) || 0)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {getCallPercentage(parseFloat(commitment.capitalCalled) || 0, parseFloat(commitment.commitmentAmount) || 0).toFixed(1)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(parseFloat(commitment.capitalReturned) || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(parseFloat(commitment.unfundedCommitment) || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(commitment.status)}`}>
                        {commitment.status === 'active' && <CheckCircleIcon className="h-3 w-3 mr-1" />}
                        {commitment.status === 'active' && <CheckCircleIcon className="h-3 w-3 mr-1" />}
                        {commitment.status === 'terminated' && <ExclamationTriangleIcon className="h-3 w-3 mr-1" />}
                        {commitment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(commitment.commitmentDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          to={`/commitments/${commitment.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Link>
                        <Link
                          to={`/commitments/${commitment.id}/edit`}
                          className="text-green-600 hover:text-green-900"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => setShowDeleteModal(commitment.id)}
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

      {/* Create Commitment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Commitment</h3>
              <form onSubmit={handleCreateCommitment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Investor</label>
                  <input
                    type="text"
                    required
                    value={formData.investorEntityId}
                    onChange={(e) => setFormData({ ...formData, investorEntityId: parseInt(e.target.value) })}
                    className="mt-1 block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fund</label>
                  <select
                    required
                    value={formData.fundId}
                    onChange={(e) => setFormData({ ...formData, fundId: parseInt(e.target.value) })}
                    className="mt-1 block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select Fund</option>
                    <option value="1">Fund 1</option>
                    <option value="2">Fund 2</option>
                    <option value="3">Fund 3</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Commitment</label>
                  <input
                    type="number"
                    required
                    value={formData.commitmentAmount}
                    onChange={(e) => setFormData({ ...formData, commitmentAmount: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Commitment Date</label>
                  <input
                    type="date"
                    required
                    value={formData.commitmentDate}
                    onChange={(e) => setFormData({ ...formData, commitmentDate: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Terms</label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
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
                    Add Commitment
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
              <h3 className="text-lg font-medium text-gray-900">Delete Commitment</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this commitment? This action cannot be undone.
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
                  onClick={() => showDeleteModal && handleDeleteCommitment(showDeleteModal)}
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

export default CommitmentsPage;