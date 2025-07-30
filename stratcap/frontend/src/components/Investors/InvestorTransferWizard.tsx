import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { investorTransferAPI, fundAPI, investorAPI } from '../../services/api';
import {
  CheckIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  InformationCircleIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  DocumentArrowUpIcon,
  PaperClipIcon
} from '@heroicons/react/24/outline';

interface TransferData {
  fundId: number;
  fromInvestorId: number;
  toInvestorId: number;
  transferType: string;
  interestAmount: number;
  effectiveDate: string;
  reason: string;
  restrictions: {
    lockupPeriod?: number;
    rightsOfFirstRefusal?: boolean;
    tagAlongRights?: boolean;
    dragAlongRights?: boolean;
    additionalRestrictions?: string;
  };
  legalDocuments: Array<{
    type: string;
    required: boolean;
    uploaded: boolean;
    file?: File;
    description?: string;
  }>;
  complianceChecks: {
    amlCheck: boolean;
    kycCheck: boolean;
    accreditationCheck: boolean;
    jurisdictionCheck: boolean;
  };
  notifications: {
    notifyParties: boolean;
    notifyFundManager: boolean;
    customRecipients: string[];
    template: string;
    customMessage: string;
  };
}

interface Fund {
  id: number;
  name: string;
  code: string;
  totalCommitments: number;
  status: string;
}

interface Investor {
  id: number;
  name: string;
  email: string;
  type: string;
  commitment: number;
  unfundedCommitment: number;
  status: string;
}

const STEPS = [
  { id: 1, name: 'Fund & Parties', icon: UserGroupIcon },
  { id: 2, name: 'Transfer Details', icon: CurrencyDollarIcon },
  { id: 3, name: 'Legal & Restrictions', icon: ShieldCheckIcon },
  { id: 4, name: 'Documentation', icon: DocumentTextIcon },
  { id: 5, name: 'Compliance', icon: CheckCircleIcon },
  { id: 6, name: 'Review & Submit', icon: CheckIcon }
];

const TRANSFER_TYPES = [
  { value: 'full', label: 'Full Interest Transfer', description: 'Transfer entire interest to new investor' },
  { value: 'partial', label: 'Partial Interest Transfer', description: 'Transfer portion of interest' },
  { value: 'assignment', label: 'Assignment of Rights', description: 'Assign specific rights without ownership change' },
  { value: 'inheritance', label: 'Inheritance Transfer', description: 'Transfer due to inheritance or succession' },
  { value: 'corporate_restructure', label: 'Corporate Restructuring', description: 'Transfer due to entity restructuring' }
];

const DOCUMENT_TYPES = [
  { type: 'transfer_agreement', label: 'Transfer Agreement', required: true },
  { type: 'consent_letter', label: 'Fund Consent Letter', required: true },
  { type: 'assignor_certificate', label: 'Assignor Certificate', required: true },
  { type: 'assignee_certificate', label: 'Assignee Certificate', required: true },
  { type: 'kyc_documentation', label: 'KYC Documentation', required: true },
  { type: 'legal_opinion', label: 'Legal Opinion', required: false },
  { type: 'board_resolution', label: 'Board Resolution', required: false },
  { type: 'power_of_attorney', label: 'Power of Attorney', required: false }
];

const InvestorTransferWizard: React.FC = () => {
  const navigate = useNavigate();
  const { fundId: paramFundId } = useParams<{ fundId: string }>();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [selectedFund, setSelectedFund] = useState<Fund | null>(null);
  const [fromInvestor, setFromInvestor] = useState<Investor | null>(null);
  const [toInvestor, setToInvestor] = useState<Investor | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [complianceResults, setComplianceResults] = useState<any>({});
  
  const [formData, setFormData] = useState<TransferData>({
    fundId: paramFundId ? parseInt(paramFundId) : 0,
    fromInvestorId: 0,
    toInvestorId: 0,
    transferType: '',
    interestAmount: 0,
    effectiveDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    reason: '',
    restrictions: {
      lockupPeriod: 0,
      rightsOfFirstRefusal: true,
      tagAlongRights: true,
      dragAlongRights: true,
      additionalRestrictions: ''
    },
    legalDocuments: DOCUMENT_TYPES.map(doc => ({
      type: doc.type,
      required: doc.required,
      uploaded: false,
      description: doc.label
    })),
    complianceChecks: {
      amlCheck: false,
      kycCheck: false,
      accreditationCheck: false,
      jurisdictionCheck: false
    },
    notifications: {
      notifyParties: true,
      notifyFundManager: true,
      customRecipients: [],
      template: 'standard_transfer',
      customMessage: ''
    }
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (formData.fundId && formData.fundId > 0) {
      const fund = funds.find(f => f.id === formData.fundId);
      setSelectedFund(fund || null);
      if (fund) {
        fetchFundInvestors(fund.id);
      }
    }
  }, [formData.fundId, funds]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const fundsResponse = await fundAPI.getAll();
      setFunds(fundsResponse.data.data || []);
      
      if (paramFundId) {
        const fundId = parseInt(paramFundId);
        setFormData(prev => ({ ...prev, fundId }));
      }
    } catch (err: any) {
      setError('Failed to load funds data');
    } finally {
      setLoading(false);
    }
  };

  const fetchFundInvestors = async (fundId: number) => {
    try {
      const response = await investorAPI.getByFund(fundId);
      setInvestors(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch fund investors:', err);
    }
  };

  const validateTransfer = async () => {
    if (!formData.fromInvestorId || !formData.toInvestorId || !formData.fundId || !formData.interestAmount) {
      return;
    }

    try {
      const response = await investorTransferAPI.validateTransfer({
        fromInvestorId: formData.fromInvestorId,
        toInvestorId: formData.toInvestorId,
        fundId: formData.fundId,
        interestAmount: formData.interestAmount
      });
      setValidationResult(response.data.data);
    } catch (err: any) {
      setError('Transfer validation failed: ' + (err.response?.data?.message || 'Unknown error'));
    }
  };

  const runComplianceChecks = async () => {
    if (!formData.fundId || !formData.fromInvestorId || !formData.toInvestorId) return;

    setLoading(true);
    try {
      // Create a temporary transfer to run compliance checks
      const tempTransfer = await investorTransferAPI.create({
        ...formData,
        status: 'draft'
      });

      const transferId = tempTransfer.data.data.id;

      // Run all compliance checks
      const checkTypes = ['aml', 'kyc', 'accreditation', 'jurisdiction'];
      const checkResults: any = {};

      for (const checkType of checkTypes) {
        try {
          const result = await investorTransferAPI.runComplianceCheck(transferId, checkType);
          checkResults[checkType] = result.data.data;
        } catch (err) {
          checkResults[checkType] = { passed: false, errors: ['Check failed'] };
        }
      }

      setComplianceResults(checkResults);
      
      // Update form data with results
      setFormData(prev => ({
        ...prev,
        complianceChecks: {
          amlCheck: checkResults.aml?.passed || false,
          kycCheck: checkResults.kyc?.passed || false,
          accreditationCheck: checkResults.accreditation?.passed || false,
          jurisdictionCheck: checkResults.jurisdiction?.passed || false
        }
      }));

      // Clean up temporary transfer
      await investorTransferAPI.delete(transferId);
    } catch (err: any) {
      setError('Compliance checks failed: ' + (err.response?.data?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (documentType: string, file: File) => {
    setFormData(prev => ({
      ...prev,
      legalDocuments: prev.legalDocuments.map(doc =>
        doc.type === documentType
          ? { ...doc, file, uploaded: true }
          : doc
      )
    }));
  };

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.fundId) errors.fundId = 'Please select a fund';
        if (!formData.fromInvestorId) errors.fromInvestorId = 'Please select transferring investor';
        if (!formData.toInvestorId) errors.toInvestorId = 'Please select receiving investor';
        if (formData.fromInvestorId === formData.toInvestorId) {
          errors.sameInvestor = 'Transferring and receiving investors must be different';
        }
        break;

      case 2:
        if (!formData.transferType) errors.transferType = 'Please select transfer type';
        if (formData.interestAmount <= 0) errors.interestAmount = 'Interest amount must be greater than 0';
        if (!formData.reason.trim()) errors.reason = 'Reason for transfer is required';
        if (!formData.effectiveDate) errors.effectiveDate = 'Effective date is required';
        break;

      case 4:
        const requiredDocs = formData.legalDocuments.filter(doc => doc.required && !doc.uploaded);
        if (requiredDocs.length > 0) {
          errors.documents = `Missing required documents: ${requiredDocs.map(d => d.description).join(', ')}`;
        }
        break;

      case 5:
        const failedChecks = Object.entries(formData.complianceChecks)
          .filter(([_, passed]) => !passed)
          .map(([check, _]) => check);
        if (failedChecks.length > 0) {
          errors.compliance = `Failed compliance checks: ${failedChecks.join(', ')}`;
        }
        break;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 2) {
        validateTransfer();
      }
      if (currentStep === 4) {
        runComplianceChecks();
      }
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(6)) return;

    setLoading(true);
    try {
      // Upload documents first
      const uploadedDocuments = [];
      for (const doc of formData.legalDocuments) {
        if (doc.file) {
          const formDataDoc = new FormData();
          formDataDoc.append('file', doc.file);
          formDataDoc.append('type', doc.type);
          formDataDoc.append('description', doc.description || '');
          uploadedDocuments.push({
            type: doc.type,
            description: doc.description,
            required: doc.required
          });
        }
      }

      const submitData = {
        ...formData,
        documents: uploadedDocuments,
        status: 'pending_approval' as const
      };

      const response = await investorTransferAPI.create(submitData);
      const transferId = response.data.data.id;

      // Send notifications if configured
      if (formData.notifications.notifyParties || formData.notifications.notifyFundManager) {
        const recipients = [];
        if (formData.notifications.notifyParties && fromInvestor && toInvestor) {
          recipients.push(fromInvestor.email, toInvestor.email);
        }
        if (formData.notifications.notifyFundManager && selectedFund) {
          recipients.push('fundmanager@example.com'); // Should come from fund data
        }
        recipients.push(...formData.notifications.customRecipients);

        if (recipients.length > 0) {
          await investorTransferAPI.sendNotification(transferId, {
            recipients,
            template: formData.notifications.template,
            customMessage: formData.notifications.customMessage
          });
        }
      }

      navigate('/investors/transfers', { 
        state: { message: 'Transfer created successfully and submitted for approval' }
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create transfer');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Fund & Parties Selection</h3>
              <p className="text-sm text-gray-600 mb-6">
                Select the fund and identify the transferring and receiving parties.
              </p>
            </div>

            {/* Fund Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Fund *
              </label>
              <div className="grid grid-cols-1 gap-3">
                {funds.map(fund => (
                  <div
                    key={fund.id}
                    onClick={() => setFormData(prev => ({ ...prev, fundId: fund.id }))}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.fundId === fund.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{fund.name}</h4>
                        <p className="text-sm text-gray-600">{fund.code}</p>
                        <p className="text-sm text-gray-500">
                          Total Commitments: ${fund.totalCommitments?.toLocaleString() || 0}
                        </p>
                      </div>
                      {formData.fundId === fund.id && (
                        <CheckIcon className="h-6 w-6 text-indigo-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {validationErrors.fundId && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.fundId}</p>
              )}
            </div>

            {/* Investor Selection */}
            {selectedFund && (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Transferring Investor *
                  </label>
                  <select
                    value={formData.fromInvestorId}
                    onChange={(e) => {
                      const investorId = parseInt(e.target.value);
                      setFormData(prev => ({ ...prev, fromInvestorId: investorId }));
                      setFromInvestor(investors.find(inv => inv.id === investorId) || null);
                    }}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="">Select investor...</option>
                    {investors.map(investor => (
                      <option key={investor.id} value={investor.id}>
                        {investor.name} - ${investor.commitment?.toLocaleString() || 0}
                      </option>
                    ))}
                  </select>
                  {validationErrors.fromInvestorId && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.fromInvestorId}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Receiving Investor *
                  </label>
                  <select
                    value={formData.toInvestorId}
                    onChange={(e) => {
                      const investorId = parseInt(e.target.value);
                      setFormData(prev => ({ ...prev, toInvestorId: investorId }));
                      setToInvestor(investors.find(inv => inv.id === investorId) || null);
                    }}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="">Select investor...</option>
                    {investors.filter(inv => inv.id !== formData.fromInvestorId).map(investor => (
                      <option key={investor.id} value={investor.id}>
                        {investor.name} - {investor.type}
                      </option>
                    ))}
                  </select>
                  {validationErrors.toInvestorId && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.toInvestorId}</p>
                  )}
                </div>
              </div>
            )}

            {validationErrors.sameInvestor && (
              <p className="text-sm text-red-600">{validationErrors.sameInvestor}</p>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Transfer Details</h3>
              <p className="text-sm text-gray-600 mb-6">
                Specify the type and amount of the transfer.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Transfer Type *
              </label>
              <div className="space-y-3">
                {TRANSFER_TYPES.map(type => (
                  <div key={type.value} className="relative">
                    <label className="flex items-start">
                      <input
                        type="radio"
                        name="transferType"
                        value={type.value}
                        checked={formData.transferType === type.value}
                        onChange={(e) => setFormData(prev => ({ ...prev, transferType: e.target.value }))}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 mt-1"
                      />
                      <div className="ml-3">
                        <span className="text-sm font-medium text-gray-900">{type.label}</span>
                        <p className="text-sm text-gray-500">{type.description}</p>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
              {validationErrors.transferType && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.transferType}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Interest Amount ($) *
                </label>
                <input
                  type="number"
                  value={formData.interestAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, interestAmount: Number(e.target.value) }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  min="0"
                  step="0.01"
                />
                {validationErrors.interestAmount && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.interestAmount}</p>
                )}
                {fromInvestor && (
                  <p className="mt-1 text-sm text-gray-500">
                    Available: ${fromInvestor.unfundedCommitment?.toLocaleString() || 0}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Effective Date *
                </label>
                <input
                  type="date"
                  value={formData.effectiveDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, effectiveDate: e.target.value }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                {validationErrors.effectiveDate && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.effectiveDate}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Reason for Transfer *
              </label>
              <textarea
                rows={4}
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Provide a detailed explanation for this transfer..."
              />
              {validationErrors.reason && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.reason}</p>
              )}
            </div>

            {validationResult && (
              <div className={`p-4 rounded-lg ${
                validationResult.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex">
                  {validationResult.valid ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-400" />
                  ) : (
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                  )}
                  <div className="ml-3">
                    <h4 className={`text-sm font-medium ${
                      validationResult.valid ? 'text-green-800' : 'text-red-800'
                    }`}>
                      Transfer Validation {validationResult.valid ? 'Passed' : 'Failed'}
                    </h4>
                    {validationResult.warnings?.length > 0 && (
                      <ul className="mt-2 text-sm text-orange-700">
                        {validationResult.warnings.map((warning: string, index: number) => (
                          <li key={index}>• {warning}</li>
                        ))}
                      </ul>
                    )}
                    {validationResult.errors?.length > 0 && (
                      <ul className="mt-2 text-sm text-red-700">
                        {validationResult.errors.map((error: string, index: number) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Legal & Restrictions</h3>
              <p className="text-sm text-gray-600 mb-6">
                Configure legal restrictions and rights that apply to this transfer.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Lockup Period (months)
                </label>
                <input
                  type="number"
                  value={formData.restrictions.lockupPeriod || 0}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    restrictions: { ...prev.restrictions, lockupPeriod: Number(e.target.value) }
                  }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  min="0"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">Transfer Rights</h4>
              
              <div className="space-y-3">
                {[
                  { key: 'rightsOfFirstRefusal', label: 'Rights of First Refusal' },
                  { key: 'tagAlongRights', label: 'Tag-Along Rights' },
                  { key: 'dragAlongRights', label: 'Drag-Along Rights' }
                ].map(right => (
                  <label key={right.key} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.restrictions[right.key as keyof typeof formData.restrictions] as boolean}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        restrictions: { ...prev.restrictions, [right.key]: e.target.checked }
                      }))}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{right.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Additional Restrictions
              </label>
              <textarea
                rows={3}
                value={formData.restrictions.additionalRestrictions || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  restrictions: { ...prev.restrictions, additionalRestrictions: e.target.value }
                }))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Any additional transfer restrictions..."
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Documentation</h3>
              <p className="text-sm text-gray-600 mb-6">
                Upload required legal documents for the transfer.
              </p>
            </div>

            <div className="space-y-4">
              {formData.legalDocuments.map((doc, index) => (
                <div key={doc.type} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">
                        {doc.description}
                        {doc.required && <span className="text-red-500 ml-1">*</span>}
                      </span>
                    </div>
                    {doc.uploaded ? (
                      <div className="flex items-center text-green-600">
                        <CheckIcon className="h-4 w-4 mr-1" />
                        <span className="text-sm">Uploaded</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">
                        {doc.required ? 'Required' : 'Optional'}
                      </span>
                    )}
                  </div>
                  
                  {!doc.uploaded ? (
                    <div className="mt-2">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(doc.type, file);
                          }
                        }}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                      />
                    </div>
                  ) : (
                    <div className="mt-2 flex items-center text-sm text-gray-600">
                      <PaperClipIcon className="h-4 w-4 mr-1" />
                      {doc.file?.name}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {validationErrors.documents && (
              <p className="text-sm text-red-600">{validationErrors.documents}</p>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Compliance Checks</h3>
              <p className="text-sm text-gray-600 mb-6">
                Automated compliance verification for the transfer.
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <span className="ml-3 text-sm text-gray-600">Running compliance checks...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(formData.complianceChecks).map(([check, passed]) => (
                  <div key={check} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <ShieldCheckIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-sm font-medium text-gray-900">
                        {check.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} Check
                      </span>
                    </div>
                    <div className={`flex items-center ${passed ? 'text-green-600' : 'text-red-600'}`}>
                      {passed ? (
                        <>
                          <CheckIcon className="h-4 w-4 mr-1" />
                          <span className="text-sm">Passed</span>
                        </>
                      ) : (
                        <>
                          <XMarkIcon className="h-4 w-4 mr-1" />
                          <span className="text-sm">Failed</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {validationErrors.compliance && (
              <p className="text-sm text-red-600">{validationErrors.compliance}</p>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <InformationCircleIcon className="h-5 w-5 text-blue-400 mt-0.5" />
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-800">Compliance Information</h4>
                  <div className="text-sm text-blue-700 mt-1">
                    All compliance checks must pass before the transfer can be submitted for approval.
                    Failed checks will need to be resolved manually.
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Review & Submit</h3>
              <p className="text-sm text-gray-600 mb-6">
                Review all transfer details before submitting for approval.
              </p>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Transfer Summary
                </h3>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Fund</dt>
                    <dd className="mt-1 text-sm text-gray-900">{selectedFund?.name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Transfer Type</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {TRANSFER_TYPES.find(t => t.value === formData.transferType)?.label}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">From Investor</dt>
                    <dd className="mt-1 text-sm text-gray-900">{fromInvestor?.name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">To Investor</dt>
                    <dd className="mt-1 text-sm text-gray-900">{toInvestor?.name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Interest Amount</dt>
                    <dd className="mt-1 text-sm text-gray-900">${formData.interestAmount.toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Effective Date</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(formData.effectiveDate).toLocaleDateString()}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Reason</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formData.reason}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Notification Settings</h4>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.notifications.notifyParties}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, notifyParties: e.target.checked }
                    }))}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Notify transfer parties</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.notifications.notifyFundManager}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, notifyFundManager: e.target.checked }
                    }))}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Notify fund manager</span>
                </label>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading && currentStep === 1) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/investors/transfers')}
          className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ChevronLeftIcon className="h-4 w-4 mr-1" />
          Back to Transfers
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Investor Transfer Wizard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Follow the steps below to create a new investor interest transfer.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <nav aria-label="Progress">
          <ol role="list" className="flex items-center">
            {STEPS.map((step, stepIdx) => (
              <li key={step.name} className={`relative ${stepIdx !== STEPS.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  {stepIdx !== STEPS.length - 1 && (
                    <div className={`h-0.5 w-full ${currentStep > step.id ? 'bg-indigo-600' : 'bg-gray-200'}`} />
                  )}
                </div>
                <a
                  className={`relative w-8 h-8 flex items-center justify-center rounded-full ${
                    currentStep > step.id
                      ? 'bg-indigo-600 text-white'
                      : currentStep === step.id
                      ? 'border-2 border-indigo-600 bg-white text-indigo-600'
                      : 'border-2 border-gray-300 bg-white text-gray-400'
                  }`}
                >
                  {currentStep > step.id ? (
                    <CheckIcon className="w-5 h-5" aria-hidden="true" />
                  ) : (
                    <step.icon className="w-5 h-5" aria-hidden="true" />
                  )}
                </a>
                <span className="absolute top-10 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-500 whitespace-nowrap">
                  {step.name}
                </span>
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* Step Content */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 1}
          className="flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeftIcon className="h-4 w-4 mr-1" />
          Previous
        </button>

        {currentStep < STEPS.length ? (
          <button
            onClick={handleNext}
            className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Next
            <ChevronRightIcon className="h-4 w-4 ml-1" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <ClockIcon className="h-4 w-4 mr-1 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckIcon className="h-4 w-4 mr-1" />
                Submit Transfer
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default InvestorTransferWizard;