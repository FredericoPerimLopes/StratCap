import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CalculatorIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  UsersIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon
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
} from 'recharts';

interface WaterfallTier {
  id: string;
  name: string;
  type: 'return_of_capital' | 'preferred_return' | 'catch_up' | 'carried_interest' | 'split';
  description: string;
  targetAmount: number;
  allocatedAmount: number;
  remainingAmount: number;
  percentage?: number;
  lpPercentage?: number;
  gpPercentage?: number;
  status: 'complete' | 'partial' | 'pending';
  order: number;
}

interface InvestorAllocation {
  investorId: string;
  investorName: string;
  commitmentAmount: number;
  ownershipPercentage: number;
  returnOfCapital: number;
  preferredReturn: number;
  carriedInterest: number;
  totalDistribution: number;
  remainingBalance: number;
}

interface WaterfallScenario {
  id: string;
  name: string;
  totalProceedsAmount: number;
  isActive: boolean;
  calculatedAt: string;
  tiers: WaterfallTier[];
  investorAllocations: InvestorAllocation[];
}

const WaterfallCalculation: React.FC = () => {
  const [scenarios, setScenarios] = useState<WaterfallScenario[]>([]);
  const [activeScenario, setActiveScenario] = useState<WaterfallScenario | null>(null);
  const [expandedTiers, setExpandedTiers] = useState<Set<string>>(new Set());
  const [selectedFund, setSelectedFund] = useState('growth-fund-iii');
  const [proceedsAmount, setProceedsAmount] = useState(100000000);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showInvestorDetails, setShowInvestorDetails] = useState(false);

  useEffect(() => {
    // Initialize with sample scenario
    const initialScenario: WaterfallScenario = {
      id: 'scenario-1',
      name: 'Base Case Scenario',
      totalProceedsAmount: 100000000,
      isActive: true,
      calculatedAt: new Date().toISOString(),
      tiers: [
        {
          id: 'tier-1',
          name: 'Return of Capital',
          type: 'return_of_capital',
          description: 'Return of original invested capital to LPs',
          targetAmount: 50000000,
          allocatedAmount: 50000000,
          remainingAmount: 0,
          status: 'complete',
          order: 1
        },
        {
          id: 'tier-2',
          name: 'Preferred Return (8%)',
          type: 'preferred_return',
          description: 'Cumulative preferred return to LPs',
          targetAmount: 12000000,
          allocatedAmount: 12000000,
          remainingAmount: 0,
          percentage: 8,
          status: 'complete',
          order: 2
        },
        {
          id: 'tier-3',
          name: 'GP Catch-up',
          type: 'catch_up',
          description: 'GP catch-up to achieve 20% carried interest',
          targetAmount: 15500000,
          allocatedAmount: 15500000,
          remainingAmount: 0,
          percentage: 100,
          status: 'complete',
          order: 3
        },
        {
          id: 'tier-4',
          name: 'Carried Interest Split',
          type: 'split',
          description: 'Remaining proceeds split 80/20 LP/GP',
          targetAmount: 22500000,
          allocatedAmount: 22500000,
          remainingAmount: 0,
          lpPercentage: 80,
          gpPercentage: 20,
          status: 'complete',
          order: 4
        }
      ],
      investorAllocations: [
        {
          investorId: 'investor-1',
          investorName: 'Pension Fund A',
          commitmentAmount: 15000000,
          ownershipPercentage: 30,
          returnOfCapital: 15000000,
          preferredReturn: 3600000,
          carriedInterest: 0,
          totalDistribution: 22950000,
          remainingBalance: 0
        },
        {
          investorId: 'investor-2',
          investorName: 'Insurance Co B',
          commitmentAmount: 12500000,
          ownershipPercentage: 25,
          returnOfCapital: 12500000,
          preferredReturn: 3000000,
          carriedInterest: 0,
          totalDistribution: 19125000,
          remainingBalance: 0
        },
        {
          investorId: 'investor-3',
          investorName: 'Endowment C',
          commitmentAmount: 10000000,
          ownershipPercentage: 20,
          returnOfCapital: 10000000,
          preferredReturn: 2400000,
          carriedInterest: 0,
          totalDistribution: 15300000,
          remainingBalance: 0
        },
        {
          investorId: 'investor-4',
          investorName: 'Family Office D',
          commitmentAmount: 7500000,
          ownershipPercentage: 15,
          returnOfCapital: 7500000,
          preferredReturn: 1800000,
          carriedInterest: 0,
          totalDistribution: 11475000,
          remainingBalance: 0
        },
        {
          investorId: 'investor-5',
          investorName: 'HNW Investor E',
          commitmentAmount: 5000000,
          ownershipPercentage: 10,
          returnOfCapital: 5000000,
          preferredReturn: 1200000,
          carriedInterest: 0,
          totalDistribution: 7650000,
          remainingBalance: 0
        }
      ]
    };

    setScenarios([initialScenario]);
    setActiveScenario(initialScenario);
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
    return `${value.toFixed(1)}%`;
  };

  const getTierStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTierStatusIcon = (status: string) => {
    switch (status) {
      case 'complete': return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'partial': return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />;
      case 'pending': return <InformationCircleIcon className="h-4 w-4 text-gray-500" />;
      default: return null;
    }
  };

  const toggleTierExpansion = (tierId: string) => {
    const newExpanded = new Set(expandedTiers);
    if (newExpanded.has(tierId)) {
      newExpanded.delete(tierId);
    } else {
      newExpanded.add(tierId);
    }
    setExpandedTiers(newExpanded);
  };

  const runWaterfallCalculation = async () => {
    setIsCalculating(true);
    
    // Simulate calculation time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In real app, this would call the backend API
    // For now, we'll just update the scenario
    const newScenario: WaterfallScenario = {
      ...activeScenario!,
      id: `scenario-${Date.now()}`,
      name: `Scenario - ${formatCurrency(proceedsAmount)}`,
      totalProceedsAmount: proceedsAmount,
      calculatedAt: new Date().toISOString()
    };

    setScenarios(prev => [newScenario, ...prev]);
    setActiveScenario(newScenario);
    setIsCalculating(false);
  };

  // Chart data
  const waterfallChartData = activeScenario?.tiers.map(tier => ({
    name: tier.name,
    amount: tier.allocatedAmount,
    percentage: (tier.allocatedAmount / activeScenario.totalProceedsAmount) * 100
  })) || [];

  const distributionByInvestor = activeScenario?.investorAllocations.map(investor => ({
    name: investor.investorName,
    amount: investor.totalDistribution,
    percentage: investor.ownershipPercentage
  })) || [];

  const tierColors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];

  const totalLPDistribution = activeScenario?.investorAllocations.reduce((sum, inv) => sum + inv.totalDistribution, 0) || 0;
  const totalGPDistribution = activeScenario ? activeScenario.totalProceedsAmount - totalLPDistribution : 0;
  const gpCarryPercentage = activeScenario ? (totalGPDistribution / activeScenario.totalProceedsAmount) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Waterfall Calculation</h1>
        <div className="flex space-x-3">
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            Export Results
          </button>
          <Link
            to="/waterfall/history"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <EyeIcon className="h-4 w-4 mr-2" />
            View History
          </Link>
        </div>
      </div>

      {/* Calculation Input */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Scenario Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fund Selection
            </label>
            <select
              value={selectedFund}
              onChange={(e) => setSelectedFund(e.target.value)}
              className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="growth-fund-iii">Growth Fund III</option>
              <option value="growth-fund-ii">Growth Fund II</option>
              <option value="venture-fund-iv">Venture Fund IV</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Proceeds ($)
            </label>
            <input
              type="number"
              value={proceedsAmount}
              onChange={(e) => setProceedsAmount(Number(e.target.value))}
              className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              step="1000000"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={runWaterfallCalculation}
              disabled={isCalculating}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              {isCalculating ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  <CalculatorIcon className="h-4 w-4 mr-2" />
                  Run Calculation
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {activeScenario && (
        <>
          {/* Summary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <CurrencyDollarIcon className="h-8 w-8 text-blue-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Total Proceeds</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(activeScenario.totalProceedsAmount)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <UsersIcon className="h-8 w-8 text-green-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">LP Distribution</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(totalLPDistribution)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatPercentage((totalLPDistribution / activeScenario.totalProceedsAmount) * 100)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <BanknotesIcon className="h-8 w-8 text-purple-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">GP Distribution</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(totalGPDistribution)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatPercentage(gpCarryPercentage)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <ChartBarIcon className="h-8 w-8 text-orange-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Effective Carry</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatPercentage(gpCarryPercentage)}
                  </p>
                  <p className="text-sm text-gray-500">Actual realized</p>
                </div>
              </div>
            </div>
          </div>

          {/* Visualization Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Waterfall Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={waterfallChartData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip formatter={(value) => [formatCurrency(value as number), 'Amount']} />
                  <Bar dataKey="amount" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Distribution by Investor</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={distributionByInvestor}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="amount"
                    label={({ name, percentage }) => `${name} ${percentage}%`}
                  >
                    {distributionByInvestor.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={tierColors[index % tierColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [formatCurrency(value as number), 'Distribution']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Waterfall Tiers */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Waterfall Tier Analysis</h3>
              <p className="text-sm text-gray-500 mt-1">
                Detailed breakdown of distribution tiers and allocations
              </p>
            </div>
            <div className="divide-y divide-gray-200">
              {activeScenario.tiers.map((tier, index) => (
                <div key={tier.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <button
                        onClick={() => toggleTierExpansion(tier.id)}
                        className="mr-3 text-gray-400 hover:text-gray-600"
                      >
                        {expandedTiers.has(tier.id) ? (
                          <ChevronDownIcon className="h-5 w-5" />
                        ) : (
                          <ChevronRightIcon className="h-5 w-5" />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className="text-lg font-medium text-gray-900 mr-3">
                            {index + 1}. {tier.name}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTierStatusColor(tier.status)}`}>
                            {getTierStatusIcon(tier.status)}
                            <span className="ml-1">{tier.status}</span>
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{tier.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(tier.allocatedAmount)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatPercentage((tier.allocatedAmount / activeScenario.totalProceedsAmount) * 100)} of total
                      </p>
                    </div>
                  </div>

                  {expandedTiers.has(tier.id) && (
                    <div className="mt-4 pl-8 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-50 p-3 rounded">
                          <p className="text-xs font-medium text-gray-500 uppercase">Target Amount</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {formatCurrency(tier.targetAmount)}
                          </p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <p className="text-xs font-medium text-gray-500 uppercase">Allocated Amount</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {formatCurrency(tier.allocatedAmount)}
                          </p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <p className="text-xs font-medium text-gray-500 uppercase">Remaining</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {formatCurrency(tier.remainingAmount)}
                          </p>
                        </div>
                      </div>

                      {tier.type === 'split' && tier.lpPercentage && tier.gpPercentage && (
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h4 className="text-sm font-medium text-blue-900 mb-2">Split Details</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-blue-700">LP Share ({tier.lpPercentage}%)</p>
                              <p className="text-lg font-semibold text-blue-900">
                                {formatCurrency(tier.allocatedAmount * (tier.lpPercentage / 100))}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-blue-700">GP Share ({tier.gpPercentage}%)</p>
                              <p className="text-lg font-semibold text-blue-900">
                                {formatCurrency(tier.allocatedAmount * (tier.gpPercentage / 100))}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {tier.percentage && tier.type === 'preferred_return' && (
                        <div className="bg-green-50 p-4 rounded-lg">
                          <h4 className="text-sm font-medium text-green-900 mb-2">Preferred Return Details</h4>
                          <p className="text-sm text-green-700">
                            {tier.percentage}% annual preferred return on invested capital
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Investor Allocations */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Investor Allocations</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Individual investor distributions and remaining balances
                  </p>
                </div>
                <button
                  onClick={() => setShowInvestorDetails(!showInvestorDetails)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  {showInvestorDetails ? 'Hide Details' : 'Show Details'}
                  <ChevronDownIcon className={`ml-2 h-4 w-4 transform ${showInvestorDetails ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            {showInvestorDetails && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Investor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Commitment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ownership %
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Return of Capital
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Preferred Return
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Distribution
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Multiple
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {activeScenario.investorAllocations.map((investor) => (
                      <tr key={investor.investorId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{investor.investorName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(investor.commitmentAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatPercentage(investor.ownershipPercentage)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(investor.returnOfCapital)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(investor.preferredReturn)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {formatCurrency(investor.totalDistribution)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {(investor.totalDistribution / investor.commitmentAmount).toFixed(2)}x
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Scenario History */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Scenario History</h3>
              <p className="text-sm text-gray-500 mt-1">
                Previous calculations and scenarios
              </p>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {scenarios.slice(0, 5).map((scenario) => (
                  <div 
                    key={scenario.id}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-gray-50 ${
                      scenario.id === activeScenario.id ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200'
                    }`}
                    onClick={() => setActiveScenario(scenario)}
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{scenario.name}</p>
                      <p className="text-xs text-gray-500">
                        Calculated {new Date(scenario.calculatedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(scenario.totalProceedsAmount)}
                      </p>
                      {scenario.id === activeScenario.id && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {scenarios.length > 5 && (
                <div className="mt-4 text-center">
                  <Link
                    to="/waterfall/history"
                    className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                  >
                    View all scenarios ({scenarios.length})
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WaterfallCalculation;