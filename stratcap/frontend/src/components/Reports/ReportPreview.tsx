import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DocumentChartBarIcon,
  ArrowLeftIcon,
  DocumentArrowDownIcon,
  ShareIcon,
  PrinterIcon,
  Cog6ToothIcon,
  EyeIcon,
  EyeSlashIcon,
  ChartBarIcon,
  TableCellsIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface ScenarioData {
  name: string;
  baseCase: number;
  optimistic: number;
  pessimistic: number;
  conservative?: number;
}

const ReportPreview: React.FC = () => {
  const navigate = useNavigate();
  const [activeScenario, setActiveScenario] = useState<'all' | 'base' | 'optimistic' | 'pessimistic'>('all');
  const [showScenarios, setShowScenarios] = useState(true);
  const [activeSection, setActiveSection] = useState<string>('executive-summary');

  // Mock report data with scenarios
  const reportData = {
    title: 'Q4 2023 Performance Report with Scenario Analysis',
    description: 'Comprehensive performance analysis including hypothetical scenario modeling',
    generatedAt: new Date().toISOString(),
    reportType: 'performance',
    hasScenarios: true,
    dateRange: { from: '2023-01-01', to: '2023-12-31' },
    funds: ['Growth Fund IV', 'Venture Fund V'],
    scenarios: {
      baseCase: {
        name: 'Base Case',
        description: 'Current trajectory with existing assumptions',
        assumptions: {
          marketReturn: '8.5%',
          exitMultiple: '2.8x',
          holdingPeriod: '4.2 years'
        }
      },
      optimistic: {
        name: 'Optimistic',
        description: '25% performance uplift with favorable market conditions',
        assumptions: {
          marketReturn: '12.5%',
          exitMultiple: '3.5x',
          holdingPeriod: '3.6 years'
        }
      },
      pessimistic: {
        name: 'Pessimistic',
        description: '15% performance decline with market stress',
        assumptions: {
          marketReturn: '5.2%',
          exitMultiple: '2.1x',
          holdingPeriod: '5.1 years'
        }
      }
    }
  };

  const performanceData: ScenarioData[] = [
    { name: 'Q1 2023', baseCase: 8.5, optimistic: 10.6, pessimistic: 7.2 },
    { name: 'Q2 2023', baseCase: 12.3, optimistic: 15.4, pessimistic: 10.5 },
    { name: 'Q3 2023', baseCase: 15.7, optimistic: 19.6, pessimistic: 13.3 },
    { name: 'Q4 2023', baseCase: 18.2, optimistic: 22.8, pessimistic: 15.5 },
    { name: 'Q1 2024E', baseCase: 21.5, optimistic: 26.9, pessimistic: 17.8 },
    { name: 'Q2 2024E', baseCase: 24.8, optimistic: 31.0, pessimistic: 20.1 }
  ];

  const cashFlowData: ScenarioData[] = [
    { name: 'Jan', baseCase: 2500000, optimistic: 3125000, pessimistic: 2125000 },
    { name: 'Feb', baseCase: 3200000, optimistic: 4000000, pessimistic: 2720000 },
    { name: 'Mar', baseCase: -2700000, optimistic: -2160000, pessimistic: -3105000 },
    { name: 'Apr', baseCase: 2900000, optimistic: 3625000, pessimistic: 2465000 },
    { name: 'May', baseCase: 4100000, optimistic: 5125000, pessimistic: 3485000 },
    { name: 'Jun', baseCase: -3800000, optimistic: -3040000, pessimistic: -4370000 }
  ];

  const portfolioAllocation = [
    { name: 'Technology', value: 35, baseCase: 35, optimistic: 40, pessimistic: 30 },
    { name: 'Healthcare', value: 25, baseCase: 25, optimistic: 28, pessimistic: 22 },
    { name: 'Financial Services', value: 20, baseCase: 20, optimistic: 18, pessimistic: 22 },
    { name: 'Consumer', value: 15, baseCase: 15, optimistic: 12, pessimistic: 18 },
    { name: 'Other', value: 5, baseCase: 5, optimistic: 2, pessimistic: 8 }
  ];

  const COLORS = {
    baseCase: '#3B82F6',
    optimistic: '#10B981',
    pessimistic: '#EF4444',
    conservative: '#F59E0B'
  };

  const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: Math.abs(value) >= 1e6 ? 'compact' : 'standard'
    }).format(value);
  };


  const sections = [
    { id: 'executive-summary', name: 'Executive Summary', icon: DocumentChartBarIcon },
    { id: 'performance-analysis', name: 'Performance Analysis', icon: ChartBarIcon },
    { id: 'cash-flow', name: 'Cash Flow Analysis', icon: TableCellsIcon },
    { id: 'scenario-comparison', name: 'Scenario Comparison', icon: Cog6ToothIcon },
    { id: 'risk-analysis', name: 'Risk Analysis', icon: ExclamationTriangleIcon }
  ];

  const renderExecutiveSummary = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Key Performance Indicators</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">18.2%</div>
            <div className="text-sm text-gray-600">Net IRR (Base Case)</div>
            {showScenarios && (
              <div className="mt-2 text-xs space-y-1">
                <div className="text-green-600">Optimistic: 22.8%</div>
                <div className="text-red-600">Pessimistic: 15.5%</div>
              </div>
            )}
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">2.8x</div>
            <div className="text-sm text-gray-600">Multiple of Money</div>
            {showScenarios && (
              <div className="mt-2 text-xs space-y-1">
                <div className="text-green-600">Optimistic: 3.5x</div>
                <div className="text-red-600">Pessimistic: 2.1x</div>
              </div>
            )}
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">$2.4B</div>
            <div className="text-sm text-gray-600">Total Value</div>
            {showScenarios && (
              <div className="mt-2 text-xs space-y-1">
                <div className="text-green-600">Optimistic: $3.0B</div>
                <div className="text-red-600">Pessimistic: $1.8B</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Performance vs. Benchmarks</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => [`${value}%`, '']} />
            <Legend />
            {(activeScenario === 'all' || activeScenario === 'base') && (
              <Line type="monotone" dataKey="baseCase" stroke={COLORS.baseCase} name="Base Case" strokeWidth={2} />
            )}
            {(activeScenario === 'all' || activeScenario === 'optimistic') && showScenarios && (
              <Line type="monotone" dataKey="optimistic" stroke={COLORS.optimistic} name="Optimistic" strokeWidth={2} strokeDasharray="5 5" />
            )}
            {(activeScenario === 'all' || activeScenario === 'pessimistic') && showScenarios && (
              <Line type="monotone" dataKey="pessimistic" stroke={COLORS.pessimistic} name="Pessimistic" strokeWidth={2} strokeDasharray="5 5" />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderPerformanceAnalysis = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quarterly Performance Trend</h3>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => [`${value}%`, '']} />
            <Legend />
            {showScenarios && (
              <>
                <Area type="monotone" dataKey="optimistic" stackId="1" stroke={COLORS.optimistic} fill={COLORS.optimistic} fillOpacity={0.2} />
                <Area type="monotone" dataKey="baseCase" stackId="2" stroke={COLORS.baseCase} fill={COLORS.baseCase} fillOpacity={0.4} />
                <Area type="monotone" dataKey="pessimistic" stackId="3" stroke={COLORS.pessimistic} fill={COLORS.pessimistic} fillOpacity={0.2} />
              </>
            )}
            {!showScenarios && (
              <Area type="monotone" dataKey="baseCase" stroke={COLORS.baseCase} fill={COLORS.baseCase} fillOpacity={0.4} />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Portfolio Allocation</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={portfolioAllocation}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={(entry) => `${entry.name}: ${entry.value}%`}
              >
                {portfolioAllocation.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Metrics</h3>
          <div className="space-y-4">
            {[
              { label: 'Sharpe Ratio', base: '1.45', opt: '1.78', pess: '1.12' },
              { label: 'Max Drawdown', base: '-8.2%', opt: '-5.1%', pess: '-12.3%' },
              { label: 'Volatility', base: '12.4%', opt: '14.2%', pess: '15.8%' },
              { label: 'Alpha vs Benchmark', base: '+3.2%', opt: '+5.8%', pess: '+1.1%' }
            ].map((metric) => (
              <div key={metric.label} className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700">{metric.label}</span>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">{metric.base}</div>
                  {showScenarios && (
                    <div className="text-xs space-x-2">
                      <span className="text-green-600">{metric.opt}</span>
                      <span className="text-red-600">{metric.pess}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCashFlowAnalysis = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Cash Flow Projections</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={cashFlowData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={(value) => formatCurrency(value)} />
            <Tooltip formatter={(value) => [formatCurrency(value as number), '']} />
            <Legend />
            {(activeScenario === 'all' || activeScenario === 'base') && (
              <Bar dataKey="baseCase" fill={COLORS.baseCase} name="Base Case" />
            )}
            {(activeScenario === 'all' || activeScenario === 'optimistic') && showScenarios && (
              <Bar dataKey="optimistic" fill={COLORS.optimistic} name="Optimistic" />
            )}
            {(activeScenario === 'all' || activeScenario === 'pessimistic') && showScenarios && (
              <Bar dataKey="pessimistic" fill={COLORS.pessimistic} name="Pessimistic" />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: 'Total Capital Called', base: '$85.2M', opt: '$106.5M', pess: '$72.4M' },
          { title: 'Total Distributions', base: '$124.8M', opt: '$156.0M', pess: '$106.1M' },
          { title: 'Net Cash Flow', base: '$39.6M', opt: '$49.5M', pess: '$33.7M' }
        ].map((item) => (
          <div key={item.title} className="bg-white p-6 rounded-lg border">
            <h4 className="text-sm font-medium text-gray-700 mb-2">{item.title}</h4>
            <div className="text-2xl font-bold text-gray-900">{item.base}</div>
            {showScenarios && (
              <div className="mt-2 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-green-600">Optimistic:</span>
                  <span className="text-green-600 font-medium">{item.opt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-600">Pessimistic:</span>
                  <span className="text-red-600 font-medium">{item.pess}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderScenarioComparison = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Scenario Assumptions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(reportData.scenarios).map(([key, scenario]) => (
            <div key={key} className={`p-4 rounded-lg border-2 ${
              key === 'baseCase' ? 'border-blue-200 bg-blue-50' :
              key === 'optimistic' ? 'border-green-200 bg-green-50' :
              'border-red-200 bg-red-50'
            }`}>
              <h4 className="font-medium text-gray-900 mb-2">{scenario.name}</h4>
              <p className="text-sm text-gray-600 mb-3">{scenario.description}</p>
              <div className="space-y-2 text-sm">
                {Object.entries(scenario.assumptions).map(([assKey, value]) => (
                  <div key={assKey} className="flex justify-between">
                    <span className="text-gray-600">{assKey.replace(/([A-Z])/g, ' $1').toLowerCase()}:</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Scenario Impact Analysis</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metric</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base Case</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Optimistic</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pessimistic</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variance</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[
                { metric: 'Net IRR', base: '18.2%', opt: '22.8%', pess: '15.5%', variance: '±20.1%' },
                { metric: 'Multiple', base: '2.8x', opt: '3.5x', pess: '2.1x', variance: '±25.0%' },
                { metric: 'Total Value', base: '$2.4B', opt: '$3.0B', pess: '$1.8B', variance: '±25.0%' },
                { metric: 'Hold Period', base: '4.2 yrs', opt: '3.6 yrs', pess: '5.1 yrs', variance: '±17.9%' }
              ].map((row) => (
                <tr key={row.metric}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.metric}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.base}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">{row.opt}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">{row.pess}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{row.variance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderRiskAnalysis = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Risk Factors</h3>
          <div className="space-y-4">
            {[
              { risk: 'Market Risk', level: 'Medium', impact: 'High', prob: '35%' },
              { risk: 'Liquidity Risk', level: 'Low', impact: 'Medium', prob: '15%' },
              { risk: 'Credit Risk', level: 'Low', impact: 'Low', prob: '10%' },
              { risk: 'Operational Risk', level: 'Medium', impact: 'Medium', prob: '25%' }
            ].map((risk) => (
              <div key={risk.risk} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{risk.risk}</div>
                  <div className="text-xs text-gray-600">Probability: {risk.prob}</div>
                </div>
                <div className="text-right">
                  <div className={`text-xs px-2 py-1 rounded ${
                    risk.level === 'High' ? 'bg-red-100 text-red-800' :
                    risk.level === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {risk.level}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Stress Testing</h3>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded">
              <h4 className="text-sm font-medium text-red-800 mb-2">Severe Market Downturn</h4>
              <div className="text-sm text-red-700">
                <p>• 40% market decline scenario</p>
                <p>• Estimated IRR: 8.5%</p>
                <p>• Estimated Multiple: 1.6x</p>
              </div>
            </div>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">Extended Hold Periods</h4>
              <div className="text-sm text-yellow-700">
                <p>• +2 year extended holds</p>
                <p>• Estimated IRR: 12.8%</p>
                <p>• Estimated Multiple: 2.4x</p>
              </div>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Interest Rate Sensitivity</h4>
              <div className="text-sm text-blue-700">
                <p>• 300bps rate increase</p>
                <p>• Estimated IRR: 15.1%</p>
                <p>• Estimated Multiple: 2.5x</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'executive-summary': return renderExecutiveSummary();
      case 'performance-analysis': return renderPerformanceAnalysis();
      case 'cash-flow': return renderCashFlowAnalysis();
      case 'scenario-comparison': return renderScenarioComparison();
      case 'risk-analysis': return renderRiskAnalysis();
      default: return renderExecutiveSummary();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/reports')}
                className="flex items-center text-sm text-gray-500 hover:text-gray-700"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Back to Reports
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{reportData.title}</h1>
                <p className="text-sm text-gray-600">Generated on {new Date(reportData.generatedAt).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Scenario Toggle */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Scenarios:</span>
                <button
                  onClick={() => setShowScenarios(!showScenarios)}
                  className="flex items-center text-sm text-indigo-600 hover:text-indigo-500"
                >
                  {showScenarios ? <EyeIcon className="h-4 w-4 mr-1" /> : <EyeSlashIcon className="h-4 w-4 mr-1" />}
                  {showScenarios ? 'Hide' : 'Show'}
                </button>
              </div>
              
              {/* Scenario Filter */}
              {showScenarios && (
                <select
                  value={activeScenario}
                  onChange={(e) => setActiveScenario(e.target.value as any)}
                  className="text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Scenarios</option>
                  <option value="base">Base Case Only</option>
                  <option value="optimistic">Optimistic Only</option>
                  <option value="pessimistic">Pessimistic Only</option>
                </select>
              )}
              
              <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                <ShareIcon className="h-4 w-4 mr-1" />
                Share
              </button>
              <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                <PrinterIcon className="h-4 w-4 mr-1" />
                Print
              </button>
              <button className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                Download
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex space-x-8">
          {/* Sidebar Navigation */}
          <div className="w-64 flex-shrink-0">
            <nav className="space-y-1">
              {sections.map((section) => {
                const IconComponent = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      activeSection === section.id
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <IconComponent className="mr-3 h-5 w-5" />
                    {section.name}
                  </button>
                );
              })}
            </nav>
            
            {/* Scenario Info Panel */}
            {showScenarios && (
              <div className="mt-8 bg-white p-4 rounded-lg border">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Active Scenarios</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span>Base Case</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Optimistic (+25%)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>Pessimistic (-15%)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {renderSectionContent()}
          </div>
        </div>
      </div>

      {/* Scenario Analysis Notice */}
      {showScenarios && (
        <div className="fixed bottom-4 right-4 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-sm shadow-lg">
          <div className="flex">
            <InformationCircleIcon className="h-5 w-5 text-blue-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Scenario Analysis Active</h3>
              <div className="mt-1 text-sm text-blue-700">
                <p>Comparing base case against hypothetical market conditions.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportPreview;