import React, { useState, useEffect } from 'react';
import {
  CurrencyDollarIcon,
  CalculatorIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
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
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';

interface WaterfallTier {
  id: number;
  name: string;
  type: 'preferred_return' | 'return_of_capital' | 'catch_up' | 'carried_interest' | 'distribution';
  lpPercentage: number;
  gpPercentage: number;
  threshold?: number;
  cumulative: boolean;
}

interface WaterfallResult {
  tier: string;
  lpAmount: number;
  gpAmount: number;
  totalAmount: number;
  cumulativeLp: number;
  cumulativeGp: number;
}

interface WaterfallCalculatorProps {
  fundId?: string;
  initialDistribution?: number;
}

const WaterfallCalculator: React.FC<WaterfallCalculatorProps> = ({ 
  fundId, 
  initialDistribution = 10000000 
}) => {
  const [distributionAmount, setDistributionAmount] = useState(initialDistribution);
  const [investmentAmount, setInvestmentAmount] = useState(50000000);
  const [preferredReturn, setPreferredReturn] = useState(8.0);
  const [carryRate, setCarryRate] = useState(20.0);
  const [catchUpRate, setCatchUpRate] = useState(100.0);
  const [results, setResults] = useState<WaterfallResult[]>([]);
  const [scenarioMode, setScenarioMode] = useState(false);

  const defaultTiers: WaterfallTier[] = [
    {
      id: 1,
      name: 'Return of Capital',
      type: 'return_of_capital',
      lpPercentage: 100,
      gpPercentage: 0,
      threshold: 0,
      cumulative: true
    },
    {
      id: 2,
      name: 'Preferred Return',
      type: 'preferred_return',
      lpPercentage: 100,
      gpPercentage: 0,
      threshold: preferredReturn,
      cumulative: true
    },
    {
      id: 3,
      name: 'GP Catch-Up',
      type: 'catch_up',
      lpPercentage: 100 - catchUpRate,
      gpPercentage: catchUpRate,
      cumulative: false
    },
    {
      id: 4,
      name: 'Carried Interest Split',
      type: 'carried_interest',
      lpPercentage: 100 - carryRate,
      gpPercentage: carryRate,
      cumulative: false
    }
  ];

  const calculateWaterfall = () => {
    const tiers = defaultTiers;
    const results: WaterfallResult[] = [];
    let remainingDistribution = distributionAmount;
    let totalLpDistributed = 0;
    let totalGpDistributed = 0;

    // Step 1: Return of Capital
    const returnOfCapital = Math.min(remainingDistribution, investmentAmount);
    results.push({
      tier: 'Return of Capital',
      lpAmount: returnOfCapital,
      gpAmount: 0,
      totalAmount: returnOfCapital,
      cumulativeLp: returnOfCapital,
      cumulativeGp: 0
    });
    remainingDistribution -= returnOfCapital;
    totalLpDistributed += returnOfCapital;

    if (remainingDistribution > 0) {
      // Step 2: Preferred Return
      const preferredReturnAmount = Math.min(
        remainingDistribution,
        (investmentAmount * preferredReturn) / 100
      );
      results.push({
        tier: 'Preferred Return (8%)',
        lpAmount: preferredReturnAmount,
        gpAmount: 0,
        totalAmount: preferredReturnAmount,
        cumulativeLp: totalLpDistributed + preferredReturnAmount,
        cumulativeGp: 0
      });
      remainingDistribution -= preferredReturnAmount;
      totalLpDistributed += preferredReturnAmount;

      if (remainingDistribution > 0) {
        // Step 3: GP Catch-Up
        const gpCatchUpTarget = (totalLpDistributed * carryRate) / (100 - carryRate);
        const catchUpAmount = Math.min(remainingDistribution, gpCatchUpTarget);
        results.push({
          tier: 'GP Catch-Up',
          lpAmount: 0,
          gpAmount: catchUpAmount,
          totalAmount: catchUpAmount,
          cumulativeLp: totalLpDistributed,
          cumulativeGp: catchUpAmount
        });
        remainingDistribution -= catchUpAmount;
        totalGpDistributed += catchUpAmount;

        if (remainingDistribution > 0) {
          // Step 4: Carried Interest Split
          const lpShare = (remainingDistribution * (100 - carryRate)) / 100;
          const gpShare = (remainingDistribution * carryRate) / 100;
          results.push({
            tier: 'Carried Interest Split',
            lpAmount: lpShare,
            gpAmount: gpShare,
            totalAmount: remainingDistribution,
            cumulativeLp: totalLpDistributed + lpShare,
            cumulativeGp: totalGpDistributed + gpShare
          });
        }
      }
    }

    setResults(results);
  };

  useEffect(() => {
    calculateWaterfall();
  }, [distributionAmount, investmentAmount, preferredReturn, carryRate, catchUpRate]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const totalLp = results.reduce((sum, r) => sum + r.lpAmount, 0);
  const totalGp = results.reduce((sum, r) => sum + r.gpAmount, 0);
  const totalDistributed = totalLp + totalGp;

  // Sample scenario data
  const scenarioData = [
    { amount: 50000000, lpTotal: 50000000, gpTotal: 0, irr: 0, moic: 1.0 },
    { amount: 60000000, lpTotal: 58000000, gpTotal: 2000000, irr: 8, moic: 1.2 },
    { amount: 80000000, lpTotal: 70000000, gpTotal: 10000000, irr: 15, moic: 1.6 },
    { amount: 100000000, lpTotal: 78000000, gpTotal: 22000000, irr: 22, moic: 2.0 },
    { amount: 120000000, lpTotal: 86000000, gpTotal: 34000000, irr: 28, moic: 2.4 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <CalculatorIcon className="h-6 w-6 mr-2" />
          Waterfall Calculator
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setScenarioMode(!scenarioMode)}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              scenarioMode 
                ? 'bg-indigo-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            Scenario Analysis
          </button>
        </div>
      </div>

      {!scenarioMode ? (
        <>
          {/* Input Parameters */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Parameters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Distribution Amount</label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    value={distributionAmount}
                    onChange={(e) => setDistributionAmount(Number(e.target.value))}
                    className="pl-10 block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Investment Amount</label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(Number(e.target.value))}
                    className="pl-10 block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Preferred Return (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={preferredReturn}
                  onChange={(e) => setPreferredReturn(Number(e.target.value))}
                  className="mt-1 block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Carry Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={carryRate}
                  onChange={(e) => setCarryRate(Number(e.target.value))}
                  className="mt-1 block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <ChartBarIcon className="h-8 w-8 text-blue-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Total to LPs</p>
                  <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totalLp)}</p>
                  <p className="text-sm text-gray-500">
                    {formatPercent((totalLp / totalDistributed) * 100)} of total
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <CurrencyDollarIcon className="h-8 w-8 text-green-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Total to GP</p>
                  <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totalGp)}</p>
                  <p className="text-sm text-gray-500">
                    {formatPercent((totalGp / totalDistributed) * 100)} of total
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <DocumentTextIcon className="h-8 w-8 text-purple-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">MOIC</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {(distributionAmount / investmentAmount).toFixed(2)}x
                  </p>
                  <p className="text-sm text-gray-500">
                    {distributionAmount > investmentAmount ? 'Profitable' : 'Below Cost'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Waterfall Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Waterfall Visualization</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={results} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="tier" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip formatter={(value) => [formatCurrency(value as number), '']} />
                <Bar dataKey="lpAmount" stackId="a" fill="#3B82F6" name="LP Amount" />
                <Bar dataKey="gpAmount" stackId="a" fill="#10B981" name="GP Amount" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Detailed Results Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Waterfall Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tier
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      LP Amount
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      GP Amount
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Amount
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cumulative LP
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cumulative GP
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.map((result, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {result.tier}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatCurrency(result.lpAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatCurrency(result.gpAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatCurrency(result.totalAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatCurrency(result.cumulativeLp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatCurrency(result.cumulativeGp)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-medium">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Total
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(totalLp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(totalGp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(totalDistributed)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(totalLp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(totalGp)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Scenario Analysis Mode */
        <div className="space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <InformationCircleIcon className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Scenario Analysis Mode</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>This mode shows waterfall outcomes across different distribution amounts to help with decision making.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Scenario Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">LP vs GP Distribution by Exit Amount</h3>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={scenarioData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="amount" tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`} />
                <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`} />
                <Tooltip 
                  formatter={(value) => [formatCurrency(value as number), '']}
                  labelFormatter={(value) => `Exit Amount: ${formatCurrency(value as number)}`}
                />
                <Area type="monotone" dataKey="lpTotal" stackId="1" stroke="#3B82F6" fill="#3B82F6" name="LP Total" />
                <Area type="monotone" dataKey="gpTotal" stackId="1" stroke="#10B981" fill="#10B981" name="GP Total" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Scenario Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Scenario Analysis</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Exit Amount
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      LP Total
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      GP Total
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      LP %
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      GP %
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      MOIC
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IRR
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {scenarioData.map((scenario, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(scenario.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatCurrency(scenario.lpTotal)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatCurrency(scenario.gpTotal)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatPercent((scenario.lpTotal / scenario.amount) * 100)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatPercent((scenario.gpTotal / scenario.amount) * 100)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {scenario.moic.toFixed(2)}x
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatPercent(scenario.irr)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaterfallCalculator;