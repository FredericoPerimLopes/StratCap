import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DocumentChartBarIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  TableCellsIcon,
  FunnelIcon,
  PlayIcon,
  EyeIcon,
  DocumentIcon,
  CubeIcon,
  ArrowPathIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ReportConfig {
  id: string;
  name: string;
  description: string;
  type: 'performance' | 'cash_flow' | 'investor_summary' | 'fee_calculation' | 'waterfall' | 'compliance';
  dataSource: string[];
  filters: {
    dateRange: { from: string; to: string };
    funds: string[];
    investors: string[];
    includeScenarios: boolean;
  };
  visualizations: {
    type: 'table' | 'line_chart' | 'bar_chart' | 'pie_chart';
    config: any;
  }[];
  scenarios: {
    enabled: boolean;
    baseCase: any;
    optimistic: any;
    pessimistic: any;
    custom: any[];
  };
}

interface ScenarioConfig {
  name: string;
  description: string;
  adjustments: {
    performanceMultiplier: number;
    feeAdjustment: number;
    exitTimingAdjustment: number; // months earlier/later
    distributionFrequency: number;
  };
}

const ReportBuilder: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    id: '',
    name: '',
    description: '',
    type: 'performance',
    dataSource: [],
    filters: {
      dateRange: { from: '', to: '' },
      funds: [],
      investors: [],
      includeScenarios: false
    },
    visualizations: [],
    scenarios: {
      enabled: false,
      baseCase: {},
      optimistic: {},
      pessimistic: {},
      custom: []
    }
  });

  const [isGenerating, setIsGenerating] = useState(false);

  const reportTypes = [
    {
      id: 'performance',
      name: 'Performance Report',
      description: 'Fund performance metrics, returns, and benchmarking',
      icon: ChartBarIcon,
      color: 'bg-blue-500'
    },
    {
      id: 'cash_flow',
      name: 'Cash Flow Analysis',
      description: 'Capital calls, distributions, and cash flow projections',
      icon: DocumentChartBarIcon,
      color: 'bg-green-500'
    },
    {
      id: 'investor_summary',
      name: 'Investor Summary',
      description: 'Individual investor statements and portfolio summaries',
      icon: DocumentIcon,
      color: 'bg-purple-500'
    },
    {
      id: 'fee_calculation',
      name: 'Fee Calculation',
      description: 'Management fees, carried interest, and expense allocations',
      icon: TableCellsIcon,
      color: 'bg-orange-500'
    },
    {
      id: 'waterfall',
      name: 'Waterfall Analysis',
      description: 'Distribution waterfall calculations and scenarios',
      icon: CubeIcon,
      color: 'bg-indigo-500'
    },
    {
      id: 'compliance',
      name: 'Compliance Report',
      description: 'Regulatory reporting and compliance monitoring',
      icon: Cog6ToothIcon,
      color: 'bg-red-500'
    }
  ];

  const scenarioPresets: Record<string, ScenarioConfig> = {
    optimistic: {
      name: 'Optimistic Scenario',
      description: '25% performance increase, faster exits',
      adjustments: {
        performanceMultiplier: 1.25,
        feeAdjustment: 0,
        exitTimingAdjustment: -6,
        distributionFrequency: 1.2
      }
    },
    pessimistic: {
      name: 'Pessimistic Scenario',
      description: '15% performance decrease, delayed exits',
      adjustments: {
        performanceMultiplier: 0.85,
        feeAdjustment: 0.1,
        exitTimingAdjustment: 12,
        distributionFrequency: 0.8
      }
    },
    conservative: {
      name: 'Conservative Scenario',
      description: '10% performance decrease, stable exits',
      adjustments: {
        performanceMultiplier: 0.90,
        feeAdjustment: 0,
        exitTimingAdjustment: 3,
        distributionFrequency: 0.95
      }
    }
  };

  const mockChartData = {
    performance: [
      { quarter: 'Q1 2023', baseCase: 8.5, optimistic: 10.6, pessimistic: 7.2 },
      { quarter: 'Q2 2023', baseCase: 12.3, optimistic: 15.4, pessimistic: 10.5 },
      { quarter: 'Q3 2023', baseCase: 15.7, optimistic: 19.6, pessimistic: 13.3 },
      { quarter: 'Q4 2023', baseCase: 18.2, optimistic: 22.8, pessimistic: 15.5 }
    ],
    cashFlow: [
      { month: 'Jan', calls: 2500000, distributions: 1800000, net: 700000 },
      { month: 'Feb', calls: 3200000, distributions: 2100000, net: 1100000 },
      { month: 'Mar', calls: 1800000, distributions: 4500000, net: -2700000 },
      { month: 'Apr', calls: 2900000, distributions: 1900000, net: 1000000 }
    ]
  };

  const steps = [
    { id: 1, title: 'Report Type', icon: DocumentChartBarIcon },
    { id: 2, title: 'Data Sources', icon: TableCellsIcon },
    { id: 3, title: 'Filters & Scenarios', icon: FunnelIcon },
    { id: 4, title: 'Visualizations', icon: ChartBarIcon },
    { id: 5, title: 'Preview & Generate', icon: EyeIcon }
  ];

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 3000));
      navigate('/reports/preview');
    } catch (error) {
      console.error('Report generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const updateReportConfig = (section: keyof ReportConfig, updates: any) => {
    setReportConfig(prev => ({
      ...prev,
      [section]: typeof updates === 'object' && updates !== null && prev[section] && typeof prev[section] === 'object' 
        ? { ...(prev[section] as Record<string, any>), ...updates } 
        : updates
    }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Select Report Type</h3>
              <p className="text-sm text-gray-600 mb-6">
                Choose the type of report you want to generate. Each type has specific data sources and visualization options.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reportTypes.map((type) => {
                const IconComponent = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => updateReportConfig('type', type.id)}
                    className={`p-6 border-2 rounded-lg text-left transition-all ${
                      reportConfig.type === type.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-lg ${type.color}`}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-medium text-gray-900">{type.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Name
                </label>
                <input
                  type="text"
                  value={reportConfig.name}
                  onChange={(e) => updateReportConfig('name', e.target.value)}
                  className="w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter report name..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={reportConfig.description}
                  onChange={(e) => updateReportConfig('description', e.target.value)}
                  className="w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Brief description..."
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Data Sources</h3>
              <p className="text-sm text-gray-600 mb-6">
                Select the data sources to include in your report. Available sources depend on the report type.
              </p>
            </div>

            <div className="space-y-4">
              {[
                { id: 'fund_performance', name: 'Fund Performance Data', description: 'NAV, returns, benchmark comparisons' },
                { id: 'capital_activities', name: 'Capital Activities', description: 'Capital calls, distributions, commitments' },
                { id: 'investor_data', name: 'Investor Information', description: 'Investor profiles, commitments, allocations' },
                { id: 'fee_calculations', name: 'Fee Calculations', description: 'Management fees, carried interest, expenses' },
                { id: 'portfolio_companies', name: 'Portfolio Companies', description: 'Valuations, exits, financial metrics' },
                { id: 'cash_balances', name: 'Cash & Banking', description: 'Cash positions, bank statements, reconciliations' }
              ].map((source) => (
                <div key={source.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{source.name}</h4>
                    <p className="text-sm text-gray-500">{source.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reportConfig.dataSource.includes(source.id)}
                      onChange={(e) => {
                        const newSources = e.target.checked
                          ? [...reportConfig.dataSource, source.id]
                          : reportConfig.dataSource.filter(s => s !== source.id);
                        updateReportConfig('dataSource', newSources);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Filters & Scenarios</h3>
              <p className="text-sm text-gray-600 mb-6">
                Configure filters and enable hypothetical scenario analysis for your report.
              </p>
            </div>

            {/* Date Range */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">Date Range</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                  <input
                    type="date"
                    value={reportConfig.filters.dateRange.from}
                    onChange={(e) => updateReportConfig('filters', {
                      ...reportConfig.filters,
                      dateRange: { ...reportConfig.filters.dateRange, from: e.target.value }
                    })}
                    className="w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                  <input
                    type="date"
                    value={reportConfig.filters.dateRange.to}
                    onChange={(e) => updateReportConfig('filters', {
                      ...reportConfig.filters,
                      dateRange: { ...reportConfig.filters.dateRange, to: e.target.value }
                    })}
                    className="w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Fund Selection */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">Fund Selection</h4>
              <select
                multiple
                value={reportConfig.filters.funds}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions, option => option.value);
                  updateReportConfig('filters', { ...reportConfig.filters, funds: values });
                }}
                className="w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                size={4}
              >
                <option value="fund-1">Growth Fund IV</option>
                <option value="fund-2">Venture Fund V</option>
                <option value="fund-3">Real Estate Fund II</option>
                <option value="fund-4">Opportunity Fund I</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple funds</p>
            </div>

            {/* Scenario Analysis */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-md font-medium text-gray-900">Hypothetical Scenario Analysis</h4>
                  <p className="text-sm text-gray-600">Include scenario modeling in your report</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reportConfig.scenarios.enabled}
                    onChange={(e) => updateReportConfig('scenarios', {
                      ...reportConfig.scenarios,
                      enabled: e.target.checked
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {reportConfig.scenarios.enabled && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex">
                      <InformationCircleIcon className="h-5 w-5 text-blue-400" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">Scenario Analysis</h3>
                        <div className="mt-2 text-sm text-blue-700">
                          <p>• Compare actual performance against hypothetical scenarios</p>
                          <p>• Model different market conditions and their impact</p>
                          <p>• Generate stress testing and sensitivity analysis</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(scenarioPresets).map(([key, scenario]) => (
                      <div key={key} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-sm font-medium text-gray-900">{scenario.name}</h5>
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            defaultChecked={key === 'optimistic' || key === 'pessimistic'}
                          />
                        </div>
                        <p className="text-xs text-gray-600 mb-3">{scenario.description}</p>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span>Performance:</span>
                            <span className={scenario.adjustments.performanceMultiplier > 1 ? 'text-green-600' : 'text-red-600'}>
                              {((scenario.adjustments.performanceMultiplier - 1) * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Exit Timing:</span>
                            <span className={scenario.adjustments.exitTimingAdjustment < 0 ? 'text-green-600' : 'text-red-600'}>
                              {scenario.adjustments.exitTimingAdjustment > 0 ? '+' : ''}{scenario.adjustments.exitTimingAdjustment}mo
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Visualizations</h3>
              <p className="text-sm text-gray-600 mb-6">
                Choose how to display your data. You can select multiple visualization types.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  type: 'table',
                  name: 'Data Table',
                  description: 'Detailed tabular view with sorting and filtering',
                  icon: TableCellsIcon
                },
                {
                  type: 'line_chart',
                  name: 'Line Chart',
                  description: 'Time series analysis and trend visualization',
                  icon: ChartBarIcon
                },
                {
                  type: 'bar_chart',
                  name: 'Bar Chart',
                  description: 'Comparative analysis across categories',
                  icon: ChartBarIcon
                },
                {
                  type: 'pie_chart',
                  name: 'Pie Chart',
                  description: 'Portfolio composition and allocation breakdown',
                  icon: ChartBarIcon
                }
              ].map((viz) => {
                const IconComponent = viz.icon;
                const isSelected = reportConfig.visualizations.some(v => v.type === viz.type);
                
                return (
                  <div
                    key={viz.type}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => {
                      const newViz = isSelected
                        ? reportConfig.visualizations.filter(v => v.type !== viz.type)
                        : [...reportConfig.visualizations, { type: viz.type as any, config: {} }];
                      updateReportConfig('visualizations', newViz);
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      <IconComponent className="h-6 w-6 text-gray-600" />
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{viz.name}</h4>
                        <p className="text-sm text-gray-600">{viz.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {reportConfig.scenarios.enabled && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-green-800 mb-2">Scenario Comparison Enabled</h4>
                <p className="text-sm text-green-700">
                  Your visualizations will include scenario comparisons with color-coded series for Base Case, Optimistic, and Pessimistic scenarios.
                </p>
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Preview & Generate</h3>
              <p className="text-sm text-gray-600 mb-6">
                Review your report configuration and preview the output before generating the final report.
              </p>
            </div>

            {/* Configuration Summary */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h4 className="text-md font-medium text-gray-900 mb-4">Report Configuration</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Type:</span>
                  <span className="ml-2 text-gray-600">
                    {reportTypes.find(t => t.id === reportConfig.type)?.name}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Data Sources:</span>
                  <span className="ml-2 text-gray-600">{reportConfig.dataSource.length} selected</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Scenarios:</span>
                  <span className="ml-2 text-gray-600">
                    {reportConfig.scenarios.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Visualizations:</span>
                  <span className="ml-2 text-gray-600">{reportConfig.visualizations.length} types</span>
                </div>
              </div>
            </div>

            {/* Sample Preview */}
            <div className="space-y-6">
              <h4 className="text-md font-medium text-gray-900">Sample Preview</h4>
              
              {reportConfig.scenarios.enabled && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h5 className="text-sm font-medium text-gray-900 mb-4">Performance Comparison with Scenarios</h5>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={mockChartData.performance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="quarter" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="baseCase" stroke="#3B82F6" name="Base Case" strokeWidth={2} />
                      <Line type="monotone" dataKey="optimistic" stroke="#10B981" name="Optimistic" strokeWidth={2} strokeDasharray="5 5" />
                      <Line type="monotone" dataKey="pessimistic" stroke="#EF4444" name="Pessimistic" strokeWidth={2} strokeDasharray="5 5" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h5 className="text-sm font-medium text-gray-900 mb-4">Cash Flow Analysis</h5>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mockChartData.cashFlow}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${(value as number).toLocaleString()}`, '']} />
                    <Legend />
                    <Bar dataKey="calls" fill="#EF4444" name="Capital Calls" />
                    <Bar dataKey="distributions" fill="#10B981" name="Distributions" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Report Builder</h1>
          <p className="mt-2 text-sm text-gray-600">
            Create custom reports with advanced analytics and scenario modeling
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <nav aria-label="Progress">
            <ol className="flex items-center justify-between">
              {steps.map((step, index) => {
                const IconComponent = step.icon;
                const isCompleted = currentStep > step.id;
                const isCurrent = currentStep === step.id;
                
                return (
                  <li key={step.id} className="relative flex-1">
                    {/* Connector Line */}
                    {index !== steps.length - 1 && (
                      <div className="absolute top-5 left-1/2 w-full h-0.5 bg-gray-200 -z-10">
                        <div 
                          className={`h-full bg-indigo-600 transition-all duration-300 ${
                            isCompleted ? 'w-full' : 'w-0'
                          }`}
                        />
                      </div>
                    )}
                    
                    <div className="flex flex-col items-center">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                        isCompleted
                          ? 'border-indigo-600 bg-indigo-600'
                          : isCurrent
                          ? 'border-indigo-600 bg-white'
                          : 'border-gray-300 bg-white'
                      }`}>
                        <IconComponent className={`h-5 w-5 ${
                          isCompleted
                            ? 'text-white'
                            : isCurrent
                            ? 'text-indigo-600'
                            : 'text-gray-500'
                        }`} />
                      </div>
                      <span className={`mt-2 text-xs font-medium ${
                        isCurrent ? 'text-indigo-600' : 'text-gray-500'
                      }`}>
                        {step.title}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>

        {/* Main Content */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-8 py-8">
            {renderStepContent()}
          </div>

          {/* Navigation */}
          <div className="px-8 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-between">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <div className="flex space-x-3">
                {currentStep === 5 ? (
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? (
                      <>
                        <ArrowPathIcon className="animate-spin -ml-1 mr-3 h-4 w-4" />
                        Generating Report...
                      </>
                    ) : (
                      <>
                        <PlayIcon className="h-4 w-4 mr-2" />
                        Generate Report
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportBuilder;
