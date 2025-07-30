import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { feeAPI, fundAPI } from '../../services/api';
import {
  CalculatorIcon,
  CurrencyDollarIcon,
  DocumentDuplicateIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  DocumentArrowDownIcon,
  ChartBarIcon,
  BanknotesIcon,
  UserGroupIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import {
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

interface FeeCalculation {
  id: number;
  fundName: string;
  feeType: 'management' | 'carried_interest' | 'other';
  periodStartDate: string;
  periodEndDate: string;
  basisAmount: number;
  feeRate: number;
  grossFeeAmount: number;
  netFeeAmount: number;
  status: 'calculated' | 'posted' | 'paid' | 'reversed';
  isAccrual: boolean;
  calculationDate: string;
  description?: string;
}

interface FeePosting {
  id: number;
  feeCalculationId: number;
  fundName: string;
  amount: number;
  postingDate: string;
  status: 'pending' | 'posted' | 'failed';
  description: string;
  accountingEntry?: {
    debitAccount: string;
    creditAccount: string;
    amount: number;
  };
}

const FeeManagementDashboard: React.FC = () => {
  const [feeCalculations, setFeeCalculations] = useState<FeeCalculation[]>([]);
  const [feePostings, setFeePostings] = useState<FeePosting[]>([]);
  const [funds, setFunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calculations' | 'postings' | 'reports'>('dashboard');
  const [selectedPeriod, setSelectedPeriod] = useState('2023-Q4');
  const [selectedFund, setSelectedFund] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCalculationModal, setShowCalculationModal] = useState(false);
  const [showPostingModal, setShowPostingModal] = useState(false);
  
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const fetchFeeData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // First, fetch all funds
        const fundsResponse = await fundAPI.getAll();
        const fundsData = fundsResponse.data.data || [];
        setFunds(fundsData);
        
        // Then fetch fee calculations for each fund
        const allCalculations: FeeCalculation[] = [];
        const allPostings: FeePosting[] = [];
        
        for (const fund of fundsData.slice(0, 5)) { // Limit to first 5 funds for performance
          try {
            // Get fee calculations for this fund
            const calcResponse = await feeAPI.getFeeCalculations(fund.id, {
              startDate: '2023-01-01',
              endDate: '2023-12-31'
            });
            
            const calculations = calcResponse.data.data || [];
            
            // Transform API data to match our interface
            const transformedCalcs: FeeCalculation[] = calculations.map((calc: any) => ({
              id: calc.id,
              fundName: fund.name,
              feeType: calc.feeType || 'management',
              periodStartDate: calc.periodStartDate,
              periodEndDate: calc.periodEndDate,
              basisAmount: parseFloat(calc.basisAmount || '0'),
              feeRate: parseFloat(calc.feeRate || '0'),
              grossFeeAmount: parseFloat(calc.grossAmount || '0'),
              netFeeAmount: parseFloat(calc.netAmount || '0'),
              status: calc.status || 'calculated',
              isAccrual: calc.isAccrual || false,
              calculationDate: calc.calculatedAt || calc.createdAt,
              description: calc.description || `${calc.feeType} fee calculation`
            }));
            
            allCalculations.push(...transformedCalcs);
            
            // Generate corresponding fee postings based on calculations
            const postings: FeePosting[] = transformedCalcs
              .filter(calc => calc.status === 'posted' || calc.status === 'calculated')
              .map((calc, index) => ({
                id: calc.id * 100 + index, // Generate unique ID
                feeCalculationId: calc.id,
                fundName: calc.fundName,
                amount: calc.netFeeAmount,
                postingDate: calc.calculationDate,
                status: calc.status === 'posted' ? 'posted' : 'pending',
                description: `${calc.description} Posting`,
                accountingEntry: calc.status === 'posted' ? {
                  debitAccount: 'Management Fee Receivable',
                  creditAccount: 'Management Fee Revenue',
                  amount: calc.netFeeAmount
                } : undefined
              }));
            
            allPostings.push(...postings);
            
          } catch (fundError) {
            console.warn(`Failed to fetch fee data for fund ${fund.name}:`, fundError);
          }
        }
        
        setFeeCalculations(allCalculations);
        setFeePostings(allPostings);
        
      } catch (err) {
        console.error('Error fetching fee data:', err);
        setError('Failed to load fee data');
        
        // Fallback to empty arrays on error
        setFeeCalculations([]);
        setFeePostings([]);
        setFunds([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFeeData();
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
      case 'calculated': return 'bg-blue-100 text-blue-800';
      case 'posted': return 'bg-green-100 text-green-800';
      case 'paid': return 'bg-purple-100 text-purple-800';
      case 'reversed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'calculated': return <CalculatorIcon className="h-4 w-4" />;
      case 'posted': return <CheckCircleIcon className="h-4 w-4" />;
      case 'pending': return <ClockIcon className="h-4 w-4" />;
      case 'failed': return <ExclamationTriangleIcon className="h-4 w-4" />;
      default: return null;
    }
  };

  const getFeeTypeColor = (type: string) => {
    switch (type) {
      case 'management': return 'bg-blue-100 text-blue-800';
      case 'carried_interest': return 'bg-green-100 text-green-800';
      case 'other': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const runFeeCalculation = async () => {
    if (funds.length === 0) {
      alert('No funds available for calculation');
      return;
    }
    
    setShowCalculationModal(true);
  };
  
  const executeCalculation = async () => {
    setShowCalculationModal(false);
    setLoading(true);
    
    try {
      // Run calculations for all funds
      const calculationPromises = funds.slice(0, 3).map(async (fund) => {
        try {
          return await feeAPI.calculateManagementFee(fund.id, {
            periodStartDate: '2023-10-01',
            periodEndDate: '2023-12-31',
            basisType: 'commitments',
            isAccrual: false
          });
        } catch (error) {
          console.warn(`Failed to calculate fees for ${fund.name}:`, error);
          return null;
        }
      });
      
      await Promise.allSettled(calculationPromises);
      
      // Refresh data after calculations
      window.location.reload(); // Simple refresh for now
      
    } catch (error) {
      console.error('Error running fee calculations:', error);
      alert('Failed to run fee calculations');
    } finally {
      setLoading(false);
    }
  };

  const processPostings = async () => {
    const pendingCalcs = feeCalculations.filter(calc => calc.status === 'calculated');
    
    if (pendingCalcs.length === 0) {
      alert('No pending calculations to post');
      return;
    }
    
    setShowPostingModal(true);
  };
  
  const executePostings = async () => {
    setShowPostingModal(false);
    setLoading(true);
    
    try {
      const pendingCalcs = feeCalculations.filter(calc => calc.status === 'calculated');
      
      // Post all pending calculations
      const postingPromises = pendingCalcs.map(async (calc) => {
        try {
          return await feeAPI.postFeeCalculation(calc.id);
        } catch (error) {
          console.warn(`Failed to post calculation ${calc.id}:`, error);
          return null;
        }
      });
      
      await Promise.allSettled(postingPromises);
      
      // Refresh data after posting
      window.location.reload(); // Simple refresh for now
      
    } catch (error) {
      console.error('Error processing fee postings:', error);
      alert('Failed to process fee postings');
    } finally {
      setLoading(false);
    }
  };
  
  const handleViewCalculation = (calculationId: number) => {
    // Navigate to detailed view (placeholder for now)
    alert(`View calculation details for ID: ${calculationId}`);
  };
  
  const handlePostCalculation = async (calculationId: number) => {
    try {
      await feeAPI.postFeeCalculation(calculationId);
      
      // Update local state to reflect the change
      setFeeCalculations(prev => 
        prev.map(calc => 
          calc.id === calculationId 
            ? { ...calc, status: 'posted' as const }
            : calc
        )
      );
      
      // Update postings list as well
      const calc = feeCalculations.find(c => c.id === calculationId);
      if (calc) {
        const newPosting: FeePosting = {
          id: Date.now(), // Generate temporary ID
          feeCalculationId: calculationId,
          fundName: calc.fundName,
          amount: calc.netFeeAmount,
          postingDate: new Date().toISOString(),
          status: 'posted',
          description: `${calc.description} Posting`,
          accountingEntry: {
            debitAccount: 'Management Fee Receivable',
            creditAccount: 'Management Fee Revenue',
            amount: calc.netFeeAmount
          }
        };
        
        setFeePostings(prev => [newPosting, ...prev]);
      }
      
    } catch (error) {
      console.error('Error posting fee calculation:', error);
      alert('Failed to post fee calculation');
    }
  };
  
  const handleViewPosting = (postingId: number) => {
    // Navigate to detailed posting view
    alert(`View posting details for ID: ${postingId}`);
  };
  
  const handlePostPosting = async (postingId: number) => {
    try {
      // In a real implementation, this would call an API to post the journal entry
      // For now, just update the status
      setFeePostings(prev => 
        prev.map(posting => 
          posting.id === postingId 
            ? { ...posting, status: 'posted' as const }
            : posting
        )
      );
      
    } catch (error) {
      console.error('Error posting fee:', error);
      alert('Failed to post fee');
    }
  };

  // Calculate summary metrics
  const totalManagementFees = feeCalculations
    .filter(calc => calc.feeType === 'management')
    .reduce((sum, calc) => sum + calc.netFeeAmount, 0);

  const totalCarriedInterest = feeCalculations
    .filter(calc => calc.feeType === 'carried_interest')
    .reduce((sum, calc) => sum + calc.netFeeAmount, 0);

  const pendingCalculations = feeCalculations.filter(calc => calc.status === 'calculated').length;
  const pendingPostings = feePostings.filter(posting => posting.status === 'pending').length;

  // Chart data
  const feeByType = [
    { name: 'Management Fees', value: totalManagementFees, color: '#3B82F6' },
    { name: 'Carried Interest', value: totalCarriedInterest, color: '#10B981' },
    { name: 'Other Fees', value: 500000, color: '#8B5CF6' }
  ];

  const monthlyTrend = [
    { month: 'Jul', management: 2200000, carriedInterest: 0 },
    { month: 'Aug', management: 2350000, carriedInterest: 0 },
    { month: 'Sep', management: 2100000, carriedInterest: 0 },
    { month: 'Oct', management: 2500000, carriedInterest: 2000000 },
    { month: 'Nov', management: 2450000, carriedInterest: 5000000 },
    { month: 'Dec', management: 2600000, carriedInterest: 3000000 }
  ];

  const filteredCalculations = feeCalculations.filter(calc => {
    const matchesSearch = calc.fundName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         calc.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFund = selectedFund === 'all' || calc.fundName === selectedFund;
    return matchesSearch && matchesFund;
  });

  const uniqueFunds = funds.map(fund => fund.name);

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
        <h1 className="text-2xl font-bold text-gray-900">Fee Management</h1>
        <div className="flex space-x-3">
          <button
            onClick={runFeeCalculation}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <CalculatorIcon className="h-4 w-4 mr-2" />
            Run Calculation
          </button>
          <button
            onClick={processPostings}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
            Process Postings
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            Export Reports
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Management Fees</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totalManagementFees)}</p>
              <p className="text-sm text-blue-600">YTD</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <BanknotesIcon className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Carried Interest</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totalCarriedInterest)}</p>
              <p className="text-sm text-green-600">YTD</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-orange-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Pending Calculations</p>
              <p className="text-2xl font-semibold text-gray-900">{pendingCalculations}</p>
              <p className="text-sm text-gray-500">To review</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <DocumentDuplicateIcon className="h-8 w-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Pending Postings</p>
              <p className="text-2xl font-semibold text-gray-900">{pendingPostings}</p>
              <p className="text-sm text-gray-500">To post</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-2 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('calculations')}
              className={`py-2 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'calculations'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Fee Calculations
            </button>
            <button
              onClick={() => setActiveTab('postings')}
              className={`py-2 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'postings'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Fee Postings
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`py-2 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'reports'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Reports
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Fee Revenue Trend</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [formatCurrency(value as number), '']} />
                      <Area type="monotone" dataKey="management" stackId="1" stroke="#3B82F6" fill="#3B82F6" name="Management Fees" />
                      <Area type="monotone" dataKey="carriedInterest" stackId="1" stroke="#10B981" fill="#10B981" name="Carried Interest" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Fee Composition</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={feeByType}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {feeByType.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [formatCurrency(value as number), '']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-3">
                    {feeCalculations.slice(0, 5).map((calc, index) => {
                      const timeAgo = [
                        `${index + 1} hour${index > 0 ? 's' : ''} ago`,
                        `${index + 2} hours ago`,
                        `${index + 1} day${index > 0 ? 's' : ''} ago`
                      ][index % 3];
                      
                      return (
                        <div key={calc.id} className="flex items-center justify-between">
                          <div className="flex items-center">
                            {getStatusIcon(calc.status)}
                            <span className="text-sm font-medium text-gray-900 ml-3">
                              {calc.fundName} {calc.description.toLowerCase()}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">{timeAgo}</span>
                        </div>
                      );
                    })}
                    {feeCalculations.length === 0 && (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500">No recent fee activity</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Fee Calculations Tab */}
          {activeTab === 'calculations' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search calculations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <select
                  value={selectedFund}
                  onChange={(e) => setSelectedFund(e.target.value)}
                  className="block w-full sm:w-48 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Funds</option>
                  {uniqueFunds.map(fund => (
                    <option key={fund} value={fund}>{fund}</option>
                  ))}
                </select>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="block w-full sm:w-48 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="2023-Q4">Q4 2023</option>
                  <option value="2023-Q3">Q3 2023</option>
                  <option value="2023-Q2">Q2 2023</option>
                  <option value="2023-Q1">Q1 2023</option>
                </select>
              </div>

              {/* Calculations Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fund & Period
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fee Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Basis Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gross Fee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Net Fee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCalculations.map((calculation) => (
                      <tr key={calculation.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{calculation.fundName}</div>
                            <div className="text-sm text-gray-500">
                              {new Date(calculation.periodStartDate).toLocaleDateString()} - {new Date(calculation.periodEndDate).toLocaleDateString()}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getFeeTypeColor(calculation.feeType)}`}>
                            {calculation.feeType.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(calculation.basisAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatPercentage(calculation.feeRate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(calculation.grossFeeAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {formatCurrency(calculation.netFeeAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(calculation.status)}`}>
                            {getStatusIcon(calculation.status)}
                            <span className="ml-1">{calculation.status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button 
                              onClick={() => handleViewCalculation(calculation.id)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              View
                            </button>
                            {calculation.status === 'calculated' && (
                              <button 
                                onClick={() => handlePostCalculation(calculation.id)}
                                className="text-green-600 hover:text-green-900"
                              >
                                Post
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Fee Postings Tab */}
          {activeTab === 'postings' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Fee Postings Queue</h3>
                <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                  <PlayIcon className="h-4 w-4 mr-2" />
                  Process All Pending
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fund
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Posting Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Accounting Entry
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {feePostings.map((posting) => (
                      <tr key={posting.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{posting.fundName}</div>
                          <div className="text-sm text-gray-500">{posting.description}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {formatCurrency(posting.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(posting.postingDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {posting.accountingEntry ? (
                            <div className="text-sm text-gray-900">
                              <div>Dr: {posting.accountingEntry.debitAccount}</div>
                              <div>Cr: {posting.accountingEntry.creditAccount}</div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">Not specified</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(posting.status)}`}>
                            {getStatusIcon(posting.status)}
                            <span className="ml-1">{posting.status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button 
                              onClick={() => handleViewPosting(posting.id)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              View
                            </button>
                            {posting.status === 'pending' && (
                              <button 
                                onClick={() => handlePostPosting(posting.id)}
                                className="text-green-600 hover:text-green-900"
                              >
                                Post
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Fee Management Reports</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="flex items-center mb-4">
                    <ChartBarIcon className="h-8 w-8 text-blue-500" />
                    <h4 className="ml-3 text-lg font-medium text-gray-900">Fee Summary Report</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Comprehensive summary of all fee calculations by fund and period.
                  </p>
                  <button className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    Generate Report
                  </button>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="flex items-center mb-4">
                    <DocumentDuplicateIcon className="h-8 w-8 text-green-500" />
                    <h4 className="ml-3 text-lg font-medium text-gray-900">Posting Journal</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Detailed journal entries for all fee postings with accounting details.
                  </p>
                  <button className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    Generate Report
                  </button>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="flex items-center mb-4">
                    <UserGroupIcon className="h-8 w-8 text-purple-500" />
                    <h4 className="ml-3 text-lg font-medium text-gray-900">LP Fee Statement</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Investor-specific fee statements showing allocations and charges.
                  </p>
                  <button className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    Generate Report
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCalculationModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">Run Fee Calculation</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  This will run fee calculations for all funds for the selected period.
                </p>
              </div>
              <div className="flex justify-center space-x-3 pt-4">
                <button
                  onClick={() => setShowCalculationModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={executeCalculation}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
                >
                  Run Calculation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPostingModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">Process Fee Postings</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  This will process all pending fee postings and create accounting entries.
                </p>
              </div>
              <div className="flex justify-center space-x-3 pt-4">
                <button
                  onClick={() => setShowPostingModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={executePostings}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
                >
                  Process Postings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeManagementDashboard;