import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { capitalActivityAPI } from '../../services/api';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  DocumentArrowDownIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

interface CapitalActivity {
  id: number;
  eventNumber: string;
  eventType: 'capital_call' | 'distribution' | 'equalization' | 'reallocation';
  fundName: string;
  totalAmount: number;
  baseAmount: number;
  feeAmount: number;
  expenseAmount: number;
  status: 'draft' | 'pending' | 'approved' | 'completed' | 'cancelled';
  eventDate: string;
  dueDate: string;
  approvedBy?: string;
  approvedAt?: string;
  completedAt?: string;
  investorCount: number;
  description: string;
}

const CapitalActivityList: React.FC = () => {
  
  const [activities, setActivities] = useState<CapitalActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterFund, setFilterFund] = useState('');
  const [sortBy, setSortBy] = useState<'eventNumber' | 'totalAmount' | 'dueDate' | 'eventDate'>('eventNumber');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await capitalActivityAPI.getAll();
      setActivities(response.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch capital activities');
      // Fallback to mock data on error
      setActivities([
        {
          id: 1,
          eventNumber: 'CC-2023-001',
          eventType: 'capital_call',
          fundName: 'Growth Fund III',
          totalAmount: 25000000,
          baseAmount: 23000000,
          feeAmount: 1500000,
          expenseAmount: 500000,
          status: 'completed',
          eventDate: '2023-06-15',
          dueDate: '2023-07-15',
          approvedBy: 'John Smith',
          approvedAt: '2023-06-10',
          completedAt: '2023-07-10',
          investorCount: 45,
          description: 'Capital call for Series C investment in TechCorp'
        },
        {
          id: 2,
          eventNumber: 'DIST-2023-002',
          eventType: 'distribution',
          fundName: 'Growth Fund II',
          totalAmount: 15000000,
          baseAmount: 14000000,
          feeAmount: 800000,
          expenseAmount: 200000,
          status: 'approved',
          eventDate: '2023-07-01',
          dueDate: '2023-07-31',
          approvedBy: 'Jane Doe',
          approvedAt: '2023-06-25',
          investorCount: 38,
          description: 'Distribution from exit of MedDevice Inc'
        },
        {
          id: 3,
          eventNumber: 'CC-2023-003',
          eventType: 'capital_call',
          fundName: 'Venture Fund IV',
          totalAmount: 8000000,
          baseAmount: 7500000,
          feeAmount: 400000,
          expenseAmount: 100000,
          status: 'pending',
          eventDate: '2023-07-20',
          dueDate: '2023-08-20',
          investorCount: 52,
          description: 'Capital call for follow-on investment in AI startup'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedActivities = activities
    .filter(activity => {
      const matchesSearch = activity.eventNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           activity.fundName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           activity.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = !filterType || activity.eventType === filterType;
      const matchesStatus = !filterStatus || activity.status === filterStatus;
      const matchesFund = !filterFund || activity.fundName === filterFund;
      return matchesSearch && matchesType && matchesStatus && matchesFund;
    })
    .sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (sortBy === 'totalAmount') {
        return sortOrder === 'asc' 
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number);
      }
      
      if (sortBy === 'dueDate' || sortBy === 'eventDate') {
        const aDate = new Date(aValue as string).getTime();
        const bDate = new Date(bValue as string).getTime();
        return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
      }
      
      return 0;
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
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <PencilIcon className="h-3 w-3 mr-1" />;
      case 'pending': return <ClockIcon className="h-3 w-3 mr-1" />;
      case 'approved': return <CheckCircleIcon className="h-3 w-3 mr-1" />;
      case 'completed': return <CheckCircleIcon className="h-3 w-3 mr-1" />;
      case 'cancelled': return <ExclamationTriangleIcon className="h-3 w-3 mr-1" />;
      default: return null;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'capital_call': return 'bg-blue-100 text-blue-800';
      case 'distribution': return 'bg-green-100 text-green-800';
      case 'equalization': return 'bg-purple-100 text-purple-800';
      case 'reallocation': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeDisplayName = (type: string) => {
    switch (type) {
      case 'capital_call': return 'Capital Call';
      case 'distribution': return 'Distribution';
      case 'equalization': return 'Equalization';
      case 'reallocation': return 'Reallocation';
      default: return type;
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await capitalActivityAPI.delete(id);
      setActivities(activities.filter(a => a.id !== id));
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      setShowDeleteModal(null);
    } catch (error) {
      console.error('Failed to delete capital activity:', error);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(filteredAndSortedActivities.map(a => a.id)));
    } else {
      setSelectedItems(new Set());
    }
  };
  
  const handleSelectItem = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedItems(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;
    
    setProcessing(true);
    try {
      const deletePromises = Array.from(selectedItems).map(id => 
        capitalActivityAPI.delete(id)
      );
      
      await Promise.all(deletePromises);
      setActivities(activities.filter(a => !selectedItems.has(a.id)));
      setSelectedItems(new Set());
    } catch (error) {
      console.error('Failed to delete capital activities:', error);
    } finally {
      setProcessing(false);
    }
  };
  
  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedItems.size === 0) return;
    
    setProcessing(true);
    try {
      const updatePromises = Array.from(selectedItems).map(id => 
        capitalActivityAPI.update(id, { status: newStatus })
      );
      
      await Promise.all(updatePromises);
      
      setActivities(activities.map(a => 
        selectedItems.has(a.id) ? { ...a, status: newStatus as any } : a
      ));
      setSelectedItems(new Set());
    } catch (error) {
      console.error('Failed to update capital activities:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await capitalActivityAPI.approve(id);
      setActivities(activities.map(a => 
        a.id === id ? { ...a, status: 'approved' as const } : a
      ));
    } catch (error) {
      console.error('Failed to approve capital activity:', error);
    }
  };

  const handleComplete = async (id: number) => {
    try {
      await capitalActivityAPI.complete(id);
      setActivities(activities.map(a => 
        a.id === id ? { ...a, status: 'completed' as const } : a
      ));
    } catch (error) {
      console.error('Failed to complete capital activity:', error);
    }
  };

  const exportActivities = async () => {
    setIsExporting(true);
    try {
      const dataToExport = selectedItems.size > 0 
        ? filteredAndSortedActivities.filter(a => selectedItems.has(a.id))
        : filteredAndSortedActivities;
      
      const csvData = [
        ['Event Number', 'Type', 'Fund', 'Total Amount', 'Base Amount', 'Fee Amount', 'Status', 'Event Date', 'Due Date', 'Investors', 'Description'],
        ...dataToExport.map(a => [
          a.eventNumber,
          getTypeDisplayName(a.eventType),
          a.fundName,
          a.totalAmount.toString(),
          a.baseAmount.toString(),
          a.feeAmount.toString(),
          a.status,
          a.eventDate,
          a.dueDate,
          a.investorCount.toString(),
          a.description
        ])
      ];
      
      const csvContent = csvData.map(row => row.map(field => `"${field}"`).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `capital-activities-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Calculate summary metrics
  const totalCallAmount = activities
    .filter(a => a.eventType === 'capital_call' && a.status === 'completed')
    .reduce((sum, a) => sum + a.totalAmount, 0);
  
  const totalDistributionAmount = activities
    .filter(a => a.eventType === 'distribution' && a.status === 'completed')
    .reduce((sum, a) => sum + a.totalAmount, 0);

  const pendingActivities = activities.filter(a => a.status === 'pending' || a.status === 'approved').length;
  const completedActivities = activities.filter(a => a.status === 'completed').length;

  // Chart data
  const activityTrend = [
    { month: 'Jan', calls: 45000000, distributions: 25000000 },
    { month: 'Feb', calls: 32000000, distributions: 18000000 },
    { month: 'Mar', calls: 58000000, distributions: 35000000 },
    { month: 'Apr', calls: 41000000, distributions: 22000000 },
    { month: 'May', calls: 67000000, distributions: 45000000 },
    { month: 'Jun', calls: 25000000, distributions: 15000000 }
  ];

  const typeDistribution = [
    { name: 'Capital Calls', value: 60, color: '#3B82F6' },
    { name: 'Distributions', value: 30, color: '#10B981' },
    { name: 'Equalizations', value: 8, color: '#8B5CF6' },
    { name: 'Reallocations', value: 2, color: '#F59E0B' }
  ];

  const statusBreakdown = [
    { name: 'Completed', value: completedActivities, color: '#10B981' },
    { name: 'Pending', value: pendingActivities, color: '#F59E0B' },
    { name: 'Draft', value: activities.filter(a => a.status === 'draft').length, color: '#6B7280' }
  ];

  const uniqueFunds = [...new Set(activities.map(a => a.fundName))];

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
        Error loading capital activities: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Capital Activity Management</h1>
        <div className="flex space-x-3">
          <button 
            onClick={exportActivities}
            disabled={isExporting}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
          <Link
            to="/capital-activities/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            New Activity
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Calls</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totalCallAmount)}</p>
              <p className="text-sm text-blue-600">YTD</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <BanknotesIcon className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Distributions</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totalDistributionAmount)}</p>
              <p className="text-sm text-green-600">YTD</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-orange-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-2xl font-semibold text-gray-900">{pendingActivities}</p>
              <p className="text-sm text-gray-500">Activities</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">{completedActivities}</p>
              <p className="text-sm text-gray-500">This quarter</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedItems.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-blue-700">
              {selectedItems.size} activit{selectedItems.size === 1 ? 'y' : 'ies'} selected
            </div>
            <div className="flex space-x-2">
              <select
                onChange={(e) => e.target.value && handleBulkStatusChange(e.target.value)}
                className="text-sm border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                defaultValue=""
                disabled={processing}
              >
                <option value="">Change Status...</option>
                <option value="pending">Set Pending</option>
                <option value="approved">Set Approved</option>
                <option value="completed">Set Completed</option>
                <option value="cancelled">Cancel</option>
              </select>
              <button
                onClick={handleBulkDelete}
                disabled={processing}
                className="px-3 py-1 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
              >
                {processing ? 'Processing...' : 'Delete Selected'}
              </button>
              <button
                onClick={() => setSelectedItems(new Set())}
                className="px-3 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Activity Trend (Millions)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={activityTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [formatCurrency(value as number), '']} />
              <Area type="monotone" dataKey="calls" stackId="1" stroke="#3B82F6" fill="#3B82F6" name="Capital Calls" />
              <Area type="monotone" dataKey="distributions" stackId="1" stroke="#10B981" fill="#10B981" name="Distributions" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Activity Types</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={typeDistribution}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {typeDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Status Breakdown</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={statusBreakdown} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={80} />
            <Tooltip />
            <Bar dataKey="value" fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Types</option>
            <option value="capital_call">Capital Call</option>
            <option value="distribution">Distribution</option>
            <option value="equalization">Equalization</option>
            <option value="reallocation">Reallocation</option>
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
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field as any);
              setSortOrder(order as 'asc' | 'desc');
            }}
            className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="eventNumber-asc">Event Number A-Z</option>
            <option value="eventNumber-desc">Event Number Z-A</option>
            <option value="totalAmount-desc">Amount High-Low</option>
            <option value="totalAmount-asc">Amount Low-High</option>
            <option value="dueDate-asc">Due Date Earliest</option>
            <option value="dueDate-desc">Due Date Latest</option>
            <option value="eventDate-desc">Event Date Latest</option>
            <option value="eventDate-asc">Event Date Earliest</option>
          </select>
          <div className="flex items-center text-sm text-gray-500">
            <FunnelIcon className="h-4 w-4 mr-1" />
            {filteredAndSortedActivities.length} of {activities.length} activities
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
                  <input
                    type="checkbox"
                    checked={filteredAndSortedActivities.length > 0 && selectedItems.size === filteredAndSortedActivities.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => {
                    if (sortBy === 'eventNumber') {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy('eventNumber');
                      setSortOrder('asc');
                    }
                  }}
                >
                  <div className="flex items-center">
                    Event
                    {sortBy === 'eventNumber' && (
                      <span className="ml-1">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fund
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => {
                    if (sortBy === 'totalAmount') {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy('totalAmount');
                      setSortOrder('desc');
                    }
                  }}
                >
                  <div className="flex items-center">
                    Amount
                    {sortBy === 'totalAmount' && (
                      <span className="ml-1">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Investors
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedActivities.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                    No capital activities found
                  </td>
                </tr>
              ) : (
                filteredAndSortedActivities.map((activity) => (
                  <tr key={activity.id} className={`hover:bg-gray-50 ${
                    selectedItems.has(activity.id) ? 'bg-blue-50' : ''
                  }`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(activity.id)}
                        onChange={(e) => handleSelectItem(activity.id, e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{activity.eventNumber}</div>
                        <div className="text-sm text-gray-500">{activity.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(activity.eventType)}`}>
                        {getTypeDisplayName(activity.eventType)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {activity.fundName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatCurrency(activity.totalAmount)}</div>
                      <div className="text-xs text-gray-500">
                        Base: {formatCurrency(activity.baseAmount)}
                        {activity.feeAmount > 0 && <span> | Fees: {formatCurrency(activity.feeAmount)}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {activity.investorCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {getStatusIcon(activity.status)}
                        {activity.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(activity.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {activity.status === 'pending' && (
                          <button
                            onClick={() => handleApprove(activity.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Approve"
                          >
                            <CheckIcon className="h-4 w-4" />
                          </button>
                        )}
                        {activity.status === 'approved' && (
                          <button
                            onClick={() => handleComplete(activity.id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Complete"
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                          </button>
                        )}
                        <Link
                          to={`/capital-activities/${activity.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Link>
                        <Link
                          to={`/capital-activities/${activity.id}/edit`}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => setShowDeleteModal(activity.id)}
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">Delete Capital Activity</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this capital activity? This action cannot be undone.
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

export default CapitalActivityList;