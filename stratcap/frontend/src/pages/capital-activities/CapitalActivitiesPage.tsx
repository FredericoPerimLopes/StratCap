import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  FunnelIcon,
  DocumentArrowDownIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface CapitalActivity {
  id: number;
  fund: string;
  type: 'capital_call' | 'distribution' | 'transfer';
  amount: number;
  callDate: string;
  dueDate: string;
  status: 'draft' | 'pending' | 'approved' | 'completed' | 'cancelled';
  description: string;
  investorCount: number;
  approvedBy?: string;
  completedDate?: string;
}

interface ActivityFormData {
  fund: string;
  type: 'capital_call' | 'distribution' | 'transfer';
  amount: string;
  callDate: string;
  dueDate: string;
  description: string;
}

const CapitalActivitiesPage: React.FC = () => {
  const [activities, setActivities] = useState<CapitalActivity[]>([
    {
      id: 1,
      fund: 'Growth Fund III',
      type: 'capital_call',
      amount: 25000000,
      callDate: '2024-06-15',
      dueDate: '2024-07-15',
      status: 'completed',
      description: 'Investment in TechStart Inc.',
      investorCount: 45,
      completedDate: '2024-07-10'
    },
    {
      id: 2,
      fund: 'Growth Fund III',
      type: 'distribution',
      amount: 15000000,
      callDate: '2024-05-20',
      dueDate: '2024-06-05',
      status: 'completed',
      description: 'Exit proceeds from MediCorp',
      investorCount: 45,
      completedDate: '2024-06-03'
    },
    {
      id: 3,
      fund: 'Venture Fund II',
      type: 'capital_call',
      amount: 18000000,
      callDate: '2024-07-01',
      dueDate: '2024-07-31',
      status: 'pending',
      description: 'Follow-on investment series',
      investorCount: 32,
      approvedBy: 'John Smith'
    },
    {
      id: 4,
      fund: 'Growth Fund III',
      type: 'transfer',
      amount: 5000000,
      callDate: '2024-06-28',
      dueDate: '2024-07-28',
      status: 'draft',
      description: 'Portfolio company transfer',
      investorCount: 45
    }
  ]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterFund, setFilterFund] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState<number | null>(null);
  const [formData, setFormData] = useState<ActivityFormData>({
    fund: '',
    type: 'capital_call',
    amount: '',
    callDate: '',
    dueDate: '',
    description: ''
  });

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    const newActivity: CapitalActivity = {
      id: Date.now(),
      fund: formData.fund,
      type: formData.type,
      amount: parseFloat(formData.amount),
      callDate: formData.callDate,
      dueDate: formData.dueDate,
      status: 'draft',
      description: formData.description,
      investorCount: 45 // Mock data
    };
    setActivities([...activities, newActivity]);
    setShowCreateModal(false);
    setFormData({
      fund: '',
      type: 'capital_call',
      amount: '',
      callDate: '',
      dueDate: '',
      description: ''
    });
  };

  const handleApproval = (id: number, approved: boolean) => {
    setActivities(activities.map(activity => 
      activity.id === id 
        ? { ...activity, status: approved ? 'approved' : 'cancelled', approvedBy: approved ? 'Current User' : undefined }
        : activity
    ));
    setShowApprovalModal(null);
  };

  const handleStatusUpdate = (id: number, newStatus: CapitalActivity['status']) => {
    setActivities(activities.map(activity => 
      activity.id === id 
        ? { 
            ...activity, 
            status: newStatus,
            completedDate: newStatus === 'completed' ? new Date().toISOString().split('T')[0] : undefined
          }
        : activity
    ));
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.fund.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || activity.type === filterType;
    const matchesStatus = !filterStatus || activity.status === filterStatus;
    const matchesFund = !filterFund || activity.fund === filterFund;
    return matchesSearch && matchesType && matchesStatus && matchesFund;
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
      case 'completed': return 'bg-green-100 text-green-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon className="h-4 w-4" />;
      case 'approved': return <CheckIcon className="h-4 w-4" />;
      case 'pending': return <ClockIcon className="h-4 w-4" />;
      case 'draft': return <PencilIcon className="h-4 w-4" />;
      case 'cancelled': return <XMarkIcon className="h-4 w-4" />;
      default: return <ClockIcon className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'capital_call': return <ArrowTrendingDownIcon className="h-5 w-5 text-red-500" />;
      case 'distribution': return <ArrowTrendingUpIcon className="h-5 w-5 text-green-500" />;
      case 'transfer': return <BanknotesIcon className="h-5 w-5 text-blue-500" />;
      default: return <CurrencyDollarIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  // Sample data for charts
  const activityTrendData = [
    { month: 'Jan', capitalCalls: 15000000, distributions: 8000000 },
    { month: 'Feb', capitalCalls: 12000000, distributions: 12000000 },
    { month: 'Mar', capitalCalls: 18000000, distributions: 6000000 },
    { month: 'Apr', capitalCalls: 8000000, distributions: 15000000 },
    { month: 'May', capitalCalls: 22000000, distributions: 10000000 },
    { month: 'Jun', capitalCalls: 25000000, distributions: 15000000 }
  ];

  const activityTypeData = [
    { name: 'Capital Calls', value: 65, color: '#EF4444' },
    { name: 'Distributions', value: 30, color: '#10B981' },
    { name: 'Transfers', value: 5, color: '#3B82F6' }
  ];


  // Calculate summary metrics
  const totalCapitalCalls = activities
    .filter(a => a.type === 'capital_call' && a.status === 'completed')
    .reduce((sum, a) => sum + a.amount, 0);
  
  const totalDistributions = activities
    .filter(a => a.type === 'distribution' && a.status === 'completed')
    .reduce((sum, a) => sum + a.amount, 0);

  const pendingActivities = activities.filter(a => a.status === 'pending' || a.status === 'approved').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Capital Activities</h1>
        <div className="flex space-x-3">
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            Export
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Activity
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <ArrowTrendingDownIcon className="h-8 w-8 text-red-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Capital Calls</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totalCapitalCalls)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <ArrowTrendingUpIcon className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Distributions</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totalDistributions)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-yellow-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Pending Activities</p>
              <p className="text-2xl font-semibold text-gray-900">{pendingActivities}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <CalendarIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">This Month</p>
              <p className="text-2xl font-semibold text-gray-900">6</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Activity Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={activityTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [formatCurrency(value as number), '']} />
              <Area type="monotone" dataKey="capitalCalls" stackId="1" stroke="#EF4444" fill="#EF4444" name="Capital Calls" />
              <Area type="monotone" dataKey="distributions" stackId="1" stroke="#10B981" fill="#10B981" name="Distributions" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Activity Types</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={activityTypeData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {activityTypeData.map((entry, index) => (
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search activities..."
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
            <option value="Growth Fund III">Growth Fund III</option>
            <option value="Venture Fund II">Venture Fund II</option>
            <option value="Real Estate Fund I">Real Estate Fund I</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Types</option>
            <option value="capital_call">Capital Call</option>
            <option value="distribution">Distribution</option>
            <option value="transfer">Transfer</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <div className="flex items-center text-sm text-gray-500">
            <FunnelIcon className="h-4 w-4 mr-1" />
            {filteredActivities.length} of {activities.length} activities
          </div>
        </div>
      </div>

      {/* Activities Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fund
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Call Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
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
              {filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                    No activities found
                  </td>
                </tr>
              ) : (
                filteredActivities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getTypeIcon(activity.type)}
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{activity.description}</div>
                          <div className="text-sm text-gray-500">ID: {activity.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {activity.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {activity.fund}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(activity.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(activity.callDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(activity.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {getStatusIcon(activity.status)}
                        <span className="ml-1">{activity.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {activity.investorCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          to={`/capital-activities/${activity.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Link>
                        {activity.status === 'draft' && (
                          <button
                            onClick={() => handleStatusUpdate(activity.id, 'pending')}
                            className="text-blue-600 hover:text-blue-900"
                            title="Submit for Approval"
                          >
                            <CheckIcon className="h-4 w-4" />
                          </button>
                        )}
                        {activity.status === 'pending' && (
                          <button
                            onClick={() => setShowApprovalModal(activity.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Approve/Reject"
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                          </button>
                        )}
                        {activity.status === 'approved' && (
                          <button
                            onClick={() => handleStatusUpdate(activity.id, 'completed')}
                            className="text-purple-600 hover:text-purple-900"
                            title="Mark Complete"
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Activity Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create Capital Activity</h3>
              <form onSubmit={handleCreateActivity} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fund</label>
                  <select
                    required
                    value={formData.fund}
                    onChange={(e) => setFormData({ ...formData, fund: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select Fund</option>
                    <option value="Growth Fund III">Growth Fund III</option>
                    <option value="Venture Fund II">Venture Fund II</option>
                    <option value="Real Estate Fund I">Real Estate Fund I</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="mt-1 block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="capital_call">Capital Call</option>
                    <option value="distribution">Distribution</option>
                    <option value="transfer">Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount</label>
                  <input
                    type="number"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Call Date</label>
                  <input
                    type="date"
                    required
                    value={formData.callDate}
                    onChange={(e) => setFormData({ ...formData, callDate: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Due Date</label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                    Create Activity
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">Approve Activity</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Do you want to approve or reject this capital activity?
                </p>
              </div>
              <div className="flex justify-center space-x-3 pt-4">
                <button
                  onClick={() => setShowApprovalModal(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => showApprovalModal && handleApproval(showApprovalModal, false)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
                >
                  Reject
                </button>
                <button
                  onClick={() => showApprovalModal && handleApproval(showApprovalModal, true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
                >
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CapitalActivitiesPage;