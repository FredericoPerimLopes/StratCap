import React, { useState, useEffect } from 'react';
import { correctionAPI, investorAPI, fundAPI } from '../../services/api';
import {
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ArrowPathIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

interface Correction {
  id: number;
  type: 'cancel' | 'correct' | 'reverse' | 'adjust';
  originalTransactionId: number;
  originalTransactionType: 'capital_call' | 'distribution' | 'fee_payment' | 'transfer' | 'commitment';
  originalAmount: number;
  correctedAmount?: number;
  reason: string;
  description: string;
  requestedBy: string;
  requestDate: string;
  approvedBy?: string;
  approvalDate?: string;
  processedBy?: string;
  processedDate?: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  affectedInvestors: Array<{
    investorId: number;
    investorName: string;
    originalAmount: number;
    correctedAmount: number;
    impact: number;
  }>;
  impactAnalysis: {
    totalImpact: number;
    cashFlowImpact: number;
    feeImpact: number;
    navImpact: number;
    affectedInvestorCount: number;
    requiresInvestorNotification: boolean;
    requiresRegulatoryFiling: boolean;
    processingComplexity: 'low' | 'medium' | 'high';
  };
  auditTrail: Array<{
    action: string;
    performedBy: string;
    timestamp: string;
    details: string;
    systemGenerated: boolean;
  }>;
  relatedDocuments: Array<{
    id: number;
    name: string;
    type: string;
    uploadedBy: string;
    uploadedDate: string;
  }>;
}

interface CorrectionSummary {
  totalCorrections: number;
  pendingApproval: number;
  processingQueue: number;
  completedThisMonth: number;
  totalImpactAmount: number;
  averageProcessingTime: number;
  byType: Array<{ type: string; count: number; totalImpact: number }>;
  byStatus: Array<{ status: string; count: number }>;
  monthlyTrend: Array<{ month: string; corrections: number; impact: number }>;
}

const CancelCorrectDashboard: React.FC = () => {
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [summary, setSummary] = useState<CorrectionSummary>({
    totalCorrections: 0,
    pendingApproval: 0,
    processingQueue: 0,
    completedThisMonth: 0,
    totalImpactAmount: 0,
    averageProcessingTime: 0,
    byType: [],
    byStatus: [],
    monthlyTrend: []
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCorrection, setSelectedCorrection] = useState<Correction | null>(null);
  const [showCorrectionWizard, setShowCorrectionWizard] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'impact' | 'priority' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchCorrectionData();
  }, []);

  const fetchCorrectionData = async () => {
    setLoading(true);
    try {
      // Fetch corrections summary
      const summaryResponse = await correctionAPI.getCorrectionSummary({
        timeframe: 'ytd',
        includeAnalytics: true
      });
      
      if (summaryResponse.data?.success) {
        setSummary(summaryResponse.data.data);
      }

      // Fetch corrections list
      const correctionsResponse = await correctionAPI.getCorrections({
        includeImpactAnalysis: true,
        includeAuditTrail: true,
        limit: 100
      });
      
      if (correctionsResponse.data?.success) {
        setCorrections(correctionsResponse.data.data);
      }

    } catch (err: any) {
      console.error('Error fetching correction data:', err);
      setError(err.response?.data?.message || 'Failed to load correction data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: Math.abs(amount) >= 1000000 ? 'compact' : 'standard'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-blue-100 text-blue-800 border-blue-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      processed: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      cancel: XMarkIcon,
      correct: PencilIcon,
      reverse: ArrowPathIcon,
      adjust: AdjustmentsHorizontalIcon
    };
    return icons[type as keyof typeof icons] || DocumentTextIcon;
  };

  const getComplexityColor = (complexity: string) => {
    const colors = {
      low: 'text-green-600',
      medium: 'text-yellow-600',
      high: 'text-red-600'
    };
    return colors[complexity as keyof typeof colors] || 'text-gray-600';
  };

  const getFilteredCorrections = () => {
    let data = [...corrections];

    // Apply search filter
    if (searchTerm) {
      data = data.filter(correction =>
        correction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        correction.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        correction.affectedInvestors.some(inv => 
          inv.investorName.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply status filter
    if (selectedStatus !== 'all') {
      data = data.filter(correction => correction.status === selectedStatus);
    }

    // Apply type filter
    if (selectedType !== 'all') {
      data = data.filter(correction => correction.type === selectedType);
    }

    // Apply priority filter
    if (selectedPriority !== 'all') {
      data = data.filter(correction => correction.priority === selectedPriority);
    }

    // Apply sorting
    data.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.requestDate).getTime();
          bValue = new Date(b.requestDate).getTime();
          break;
        case 'impact':
          aValue = Math.abs(a.impactAnalysis.totalImpact);
          bValue = Math.abs(b.impactAnalysis.totalImpact);
          break;
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder];
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder];
          break;
        case 'status':
          const statusOrder = { pending: 4, approved: 3, processed: 2, rejected: 1, cancelled: 0 };
          aValue = statusOrder[a.status as keyof typeof statusOrder];
          bValue = statusOrder[b.status as keyof typeof statusOrder];
          break;
        default:
          aValue = new Date(a.requestDate).getTime();
          bValue = new Date(b.requestDate).getTime();
      }

      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return data;
  };

  const handleApproveCorrection = async (correctionId: number) => {
    try {
      await correctionAPI.approveCorrection(correctionId, {
        approvalNotes: 'Approved for processing'
      });
      await fetchCorrectionData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to approve correction');
    }
  };

  const handleRejectCorrection = async (correctionId: number) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      await correctionAPI.rejectCorrection(correctionId, {
        rejectionReason: reason
      });
      await fetchCorrectionData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reject correction');
    }
  };

  const handleProcessCorrection = async (correctionId: number) => {
    if (!confirm('Are you sure you want to process this correction? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      await correctionAPI.processCorrection(correctionId);
      await fetchCorrectionData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to process correction');
    } finally {
      setLoading(false);
    }
  };

  const renderCorrectionDetails = (correction: Correction) => (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
        
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Correction Details</h3>
              <button
                onClick={() => setSelectedCorrection(null)}
                className="bg-white rounded-md text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="px-6 py-4 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Basic Information</h4>
                <div className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Type</dt>
                    <dd className="mt-1 text-sm text-gray-900 capitalize">{correction.type}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Original Amount</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatCurrency(correction.originalAmount)}</dd>
                  </div>
                  {correction.correctedAmount !== undefined && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Corrected Amount</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formatCurrency(correction.correctedAmount)}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Reason</dt>
                    <dd className="mt-1 text-sm text-gray-900">{correction.reason}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Description</dt>
                    <dd className="mt-1 text-sm text-gray-900">{correction.description}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Priority</dt>
                    <dd className="mt-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(correction.priority)}`}>
                        {correction.priority}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="mt-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(correction.status)}`}>
                        {correction.status}
                      </span>
                    </dd>
                  </div>
                </div>
              </div>

              {/* Impact Analysis */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Impact Analysis</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <dt className="text-xs font-medium text-gray-500">Total Impact</dt>
                      <dd className="mt-1 text-sm font-semibold text-gray-900">
                        {formatCurrency(correction.impactAnalysis.totalImpact)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-gray-500">Cash Flow Impact</dt>
                      <dd className="mt-1 text-sm font-semibold text-gray-900">
                        {formatCurrency(correction.impactAnalysis.cashFlowImpact)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-gray-500">Fee Impact</dt>
                      <dd className="mt-1 text-sm font-semibold text-gray-900">
                        {formatCurrency(correction.impactAnalysis.feeImpact)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-gray-500">NAV Impact</dt>
                      <dd className="mt-1 text-sm font-semibold text-gray-900">
                        {formatCurrency(correction.impactAnalysis.navImpact)}
                      </dd>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500">Affected Investors</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {correction.impactAnalysis.affectedInvestorCount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-medium text-gray-500">Processing Complexity</span>
                      <span className={`text-sm font-semibold ${getComplexityColor(correction.impactAnalysis.processingComplexity)}`}>
                        {correction.impactAnalysis.processingComplexity}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Affected Investors */}
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Affected Investors</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Investor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Original Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Corrected Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Impact
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {correction.affectedInvestors.map((investor) => (
                      <tr key={investor.investorId}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {investor.investorName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(investor.originalAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(investor.correctedAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <span className={investor.impact >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(investor.impact)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Audit Trail */}
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Audit Trail</h4>
              <div className="flow-root">
                <ul className="-mb-8">
                  {correction.auditTrail.map((entry, index) => (
                    <li key={index}>
                      <div className="relative pb-8">
                        {index !== correction.auditTrail.length - 1 && (
                          <span
                            className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                            aria-hidden="true"
                          />
                        )}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                              <ClockIcon className="h-5 w-5 text-white" />
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-500">
                                {entry.action} by <span className="font-medium text-gray-900">{entry.performedBy}</span>
                              </p>
                              <p className="mt-1 text-sm text-gray-500">{entry.details}</p>
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                              {new Date(entry.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-gray-50 px-6 py-3 flex justify-between items-center">
            <div className="flex space-x-3">
              {correction.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleApproveCorrection(correction.id)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleRejectCorrection(correction.id)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <XMarkIcon className="h-4 w-4 mr-2" />
                    Reject
                  </button>
                </>
              )}
              {correction.status === 'approved' && (
                <button
                  onClick={() => handleProcessCorrection(correction.id)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <ArrowPathIcon className="h-4 w-4 mr-2" />
                  Process
                </button>
              )}
            </div>
            <button
              onClick={() => setSelectedCorrection(null)}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cancel & Correct Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage transaction corrections, cancellations, and historical adjustments
          </p>
        </div>
        <button
          onClick={() => setShowCorrectionWizard(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Correction
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DocumentTextIcon className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-500">Total Corrections</p>
              <p className="text-2xl font-semibold text-gray-900">{summary.totalCorrections}</p>
              <p className="text-xs text-gray-500 mt-1">All time</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-500">Pending Approval</p>
              <p className="text-2xl font-semibold text-gray-900">{summary.pendingApproval}</p>
              <p className="text-xs text-gray-500 mt-1">Awaiting review</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ArrowPathIcon className="h-8 w-8 text-purple-500" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-500">Processing Queue</p>
              <p className="text-2xl font-semibold text-gray-900">{summary.processingQueue}</p>
              <p className="text-xs text-gray-500 mt-1">Ready to process</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CurrencyDollarIcon className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-500">Total Impact</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(Math.abs(summary.totalImpactAmount))}
              </p>
              <p className="text-xs text-gray-500 mt-1">YTD</p>
            </div>
          </div>
        </div>
      </div>

      {/* Corrections Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Corrections</h3>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
                Filters
              </button>
            </div>
          </div>

          {showAdvancedFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search corrections..."
                    className="pl-10 block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="processed">Processed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="cancel">Cancel</option>
                  <option value="correct">Correct</option>
                  <option value="reverse">Reverse</option>
                  <option value="adjust">Adjust</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="all">All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="date">Date</option>
                  <option value="impact">Impact</option>
                  <option value="priority">Priority</option>
                  <option value="status">Status</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type & Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Original Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Impact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Affected Investors
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Request Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getFilteredCorrections().map((correction) => {
                const TypeIcon = getTypeIcon(correction.type);
                return (
                  <tr key={correction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <TypeIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900 capitalize">{correction.type}</div>
                          <div className="text-sm text-gray-500 truncate max-w-48">
                            {correction.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatCurrency(correction.originalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">
                        <span className={correction.impactAnalysis.totalImpact >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(correction.impactAnalysis.totalImpact)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <UserGroupIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {correction.impactAnalysis.affectedInvestorCount}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(correction.priority)}`}>
                        {correction.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(correction.status)}`}>
                        {correction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(correction.requestDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => setSelectedCorrection(correction)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        {correction.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproveCorrection(correction.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              <CheckCircleIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleRejectCorrection(correction.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {correction.status === 'approved' && (
                          <button
                            onClick={() => handleProcessCorrection(correction.id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <ArrowPathIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Correction Details Modal */}
      {selectedCorrection && renderCorrectionDetails(selectedCorrection)}
    </div>
  );
};

export default CancelCorrectDashboard;