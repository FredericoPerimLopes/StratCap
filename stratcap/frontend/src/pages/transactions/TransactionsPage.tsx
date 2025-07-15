import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  EyeIcon,
  FunnelIcon,
  DocumentArrowDownIcon,
  CurrencyDollarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon
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
  Cell
} from 'recharts';

interface Transaction {
  id: number;
  fund: string;
  investor: string;
  type: 'capital_call' | 'distribution' | 'management_fee' | 'carried_interest' | 'other';
  amount: number;
  date: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'reconciled';
  description: string;
  reference: string;
  currency: string;
  exchangeRate?: number;
  bankAccount?: string;
  reconciliationDate?: string;
}

const TransactionsPage: React.FC = () => {
  const [transactions] = useState<Transaction[]>([
    {
      id: 1,
      fund: 'Growth Fund III',
      investor: 'Pension Fund Alpha',
      type: 'capital_call',
      amount: 5000000,
      date: '2024-06-15',
      status: 'completed',
      description: 'Capital call for Q2 2024 investment',
      reference: 'CC-2024-Q2-001',
      currency: 'USD',
      bankAccount: 'Chase ****1234',
      reconciliationDate: '2024-06-16'
    },
    {
      id: 2,
      fund: 'Growth Fund III',
      investor: 'Endowment Beta',
      type: 'distribution',
      amount: 2500000,
      date: '2024-06-10',
      status: 'completed',
      description: 'Distribution from MediCorp exit',
      reference: 'DIST-2024-001',
      currency: 'USD',
      bankAccount: 'Wells Fargo ****5678',
      reconciliationDate: '2024-06-11'
    },
    {
      id: 3,
      fund: 'Venture Fund II',
      investor: 'John Smith Family Trust',
      type: 'management_fee',
      amount: 125000,
      date: '2024-06-01',
      status: 'processing',
      description: 'Q2 2024 management fee',
      reference: 'MGT-2024-Q2-002',
      currency: 'USD',
      bankAccount: 'BoA ****9012'
    },
    {
      id: 4,
      fund: 'Real Estate Fund I',
      investor: 'Insurance Corp',
      type: 'capital_call',
      amount: 3000000,
      date: '2024-07-01',
      status: 'pending',
      description: 'Capital call for new property acquisition',
      reference: 'CC-2024-RE-003',
      currency: 'USD'
    },
    {
      id: 5,
      fund: 'Growth Fund III',
      investor: 'Sovereign Wealth Fund',
      type: 'carried_interest',
      amount: 1200000,
      date: '2024-05-25',
      status: 'completed',
      description: 'Carried interest from TechStart exit',
      reference: 'CARRY-2024-001',
      currency: 'USD',
      bankAccount: 'Citi ****3456',
      reconciliationDate: '2024-05-26'
    },
    {
      id: 6,
      fund: 'Venture Fund II',
      investor: 'Multiple Investors',
      type: 'distribution',
      amount: 850000,
      date: '2024-05-15',
      status: 'failed',
      description: 'Quarterly distribution - payment failed',
      reference: 'DIST-2024-002',
      currency: 'USD'
    }
  ]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFund, setFilterFund] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.investor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFund = !filterFund || transaction.fund === filterFund;
    const matchesType = !filterType || transaction.type === filterType;
    const matchesStatus = !filterStatus || transaction.status === filterStatus;
    const matchesDateFrom = !dateFrom || new Date(transaction.date) >= new Date(dateFrom);
    const matchesDateTo = !dateTo || new Date(transaction.date) <= new Date(dateTo);
    return matchesSearch && matchesFund && matchesType && matchesStatus && matchesDateFrom && matchesDateTo;
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
      case 'reconciled': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon className="h-4 w-4" />;
      case 'reconciled': return <CheckCircleIcon className="h-4 w-4" />;
      case 'processing': return <ClockIcon className="h-4 w-4" />;
      case 'pending': return <ClockIcon className="h-4 w-4" />;
      case 'failed': return <ExclamationTriangleIcon className="h-4 w-4" />;
      default: return <ClockIcon className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'capital_call': return <ArrowDownIcon className="h-5 w-5 text-red-500" />;
      case 'distribution': return <ArrowUpIcon className="h-5 w-5 text-green-500" />;
      case 'management_fee': return <CurrencyDollarIcon className="h-5 w-5 text-blue-500" />;
      case 'carried_interest': return <ArrowUpIcon className="h-5 w-5 text-purple-500" />;
      case 'other': return <ArrowRightIcon className="h-5 w-5 text-gray-500" />;
      default: return <CurrencyDollarIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'capital_call': return 'Capital Call';
      case 'distribution': return 'Distribution';
      case 'management_fee': return 'Management Fee';
      case 'carried_interest': return 'Carried Interest';
      case 'other': return 'Other';
      default: return type;
    }
  };

  // Calculate summary metrics
  const totalInflows = transactions
    .filter(t => ['capital_call', 'management_fee'].includes(t.type) && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalOutflows = transactions
    .filter(t => ['distribution', 'carried_interest'].includes(t.type) && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingTransactions = transactions.filter(t => ['pending', 'processing'].includes(t.status)).length;
  const failedTransactions = transactions.filter(t => t.status === 'failed').length;

  // Sample data for charts
  const transactionTrendData = [
    { month: 'Jan', inflows: 8000000, outflows: 3000000 },
    { month: 'Feb', inflows: 6000000, outflows: 4500000 },
    { month: 'Mar', inflows: 12000000, outflows: 2000000 },
    { month: 'Apr', inflows: 4000000, outflows: 6000000 },
    { month: 'May', inflows: 10000000, outflows: 5500000 },
    { month: 'Jun', inflows: 5000000, outflows: 2500000 }
  ];

  const transactionTypeData = [
    { name: 'Capital Calls', value: 45, color: '#EF4444' },
    { name: 'Distributions', value: 25, color: '#10B981' },
    { name: 'Management Fees', value: 20, color: '#3B82F6' },
    { name: 'Carried Interest', value: 8, color: '#8B5CF6' },
    { name: 'Other', value: 2, color: '#6B7280' }
  ];


  const uniqueFunds = [...new Set(transactions.map(t => t.fund))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Transaction Management</h1>
        <div className="flex space-x-3">
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <ArrowDownIcon className="h-8 w-8 text-red-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Inflows</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totalInflows)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <ArrowUpIcon className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Outflows</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totalOutflows)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-yellow-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-2xl font-semibold text-gray-900">{pendingTransactions}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Failed</p>
              <p className="text-2xl font-semibold text-gray-900">{failedTransactions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Transaction Flow Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={transactionTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [formatCurrency(value as number), '']} />
              <Bar dataKey="inflows" fill="#EF4444" name="Inflows" />
              <Bar dataKey="outflows" fill="#10B981" name="Outflows" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Transaction Types</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={transactionTypeData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {transactionTypeData.map((entry, index) => (
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
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search transactions..."
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
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Types</option>
            <option value="capital_call">Capital Call</option>
            <option value="distribution">Distribution</option>
            <option value="management_fee">Management Fee</option>
            <option value="carried_interest">Carried Interest</option>
            <option value="other">Other</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="reconciled">Reconciled</option>
          </select>
          <input
            type="date"
            placeholder="From Date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
          <input
            type="date"
            placeholder="To Date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
          <div className="flex items-center text-sm text-gray-500">
            <FunnelIcon className="h-4 w-4 mr-1" />
            {filteredTransactions.length} of {transactions.length}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fund
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Investor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bank Account
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                    No transactions found
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getTypeIcon(transaction.type)}
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{transaction.description}</div>
                          <div className="text-sm text-gray-500">{transaction.reference}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getTypeLabel(transaction.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.fund}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.investor}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={transaction.type === 'capital_call' || transaction.type === 'management_fee' ? 'text-red-600' : 'text-green-600'}>
                        {transaction.type === 'capital_call' || transaction.type === 'management_fee' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                        {getStatusIcon(transaction.status)}
                        <span className="ml-1">{transaction.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.bankAccount || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/transactions/${transaction.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TransactionsPage;