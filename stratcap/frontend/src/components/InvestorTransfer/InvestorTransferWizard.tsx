import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserIcon,
  DocumentTextIcon,
  BanknotesIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

interface InvestorTransferData {
  // Step 1: Transfer Details
  transferDetails: {
    transferType: 'full' | 'partial';
    transferorInvestorId: string;
    transfereeInvestorId: string;
    transferAmount: number;
    transferPercentage: number;
    effectiveDate: string;
    transferReason: string;
    referenceNumber: string;
  };
  
  // Step 2: Legal Documentation
  legalDocumentation: {
    transferAgreementSigned: boolean;
    transferAgreementDate: string;
    legalCounselApproval: boolean;
    regulatoryApproval: boolean;
    kycDocumentsUploaded: boolean;
    accreditationVerified: boolean;
    sideLetterRequired: boolean;
    sideLetterDetails?: string;
  };
  
  // Step 3: Financial Impact
  financialImpact: {
    currentCommitment: number;
    transferredCommitment: number;
    remainingCommitment: number;
    capitalContributed: number;
    distributionsReceived: number;
    unrealizedValue: number;
    managementFeesOwed: number;
    carriedInterestImpact: number;
  };
  
  // Step 4: Approval Workflow
  approvalWorkflow: {
    generalPartnerApproval: boolean;
    administratorApproval: boolean;
    auditorsNotified: boolean;
    investorNotification: boolean;
    boardApproval: boolean;
    regulatoryFiling: boolean;
    transferFeeCalculated: boolean;
    transferFeeAmount: number;
  };
  
  // Step 5: Finalization
  finalization: {
    finalApprovalDate: string;
    settlementDate: string;
    capitalizationTableUpdated: boolean;
    investorReportsUpdated: boolean;
    registryUpdated: boolean;
    taxDocumentsGenerated: boolean;
    confirmationSent: boolean;
    notes: string;
  };
}

interface StepProps {
  data: InvestorTransferData;
  updateData: (section: keyof InvestorTransferData, updates: any) => void;
  errors: Record<string, string>;
  setErrors: (errors: Record<string, string>) => void;
}

const InvestorTransferWizard: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<InvestorTransferData>({
    transferDetails: {
      transferType: 'full',
      transferorInvestorId: '',
      transfereeInvestorId: '',
      transferAmount: 0,
      transferPercentage: 0,
      effectiveDate: '',
      transferReason: '',
      referenceNumber: ''
    },
    legalDocumentation: {
      transferAgreementSigned: false,
      transferAgreementDate: '',
      legalCounselApproval: false,
      regulatoryApproval: false,
      kycDocumentsUploaded: false,
      accreditationVerified: false,
      sideLetterRequired: false,
      sideLetterDetails: ''
    },
    financialImpact: {
      currentCommitment: 0,
      transferredCommitment: 0,
      remainingCommitment: 0,
      capitalContributed: 0,
      distributionsReceived: 0,
      unrealizedValue: 0,
      managementFeesOwed: 0,
      carriedInterestImpact: 0
    },
    approvalWorkflow: {
      generalPartnerApproval: false,
      administratorApproval: false,
      auditorsNotified: false,
      investorNotification: false,
      boardApproval: false,
      regulatoryFiling: false,
      transferFeeCalculated: false,
      transferFeeAmount: 0
    },
    finalization: {
      finalApprovalDate: '',
      settlementDate: '',
      capitalizationTableUpdated: false,
      investorReportsUpdated: false,
      registryUpdated: false,
      taxDocumentsGenerated: false,
      confirmationSent: false,
      notes: ''
    }
  });

  const steps = [
    { id: 'details', title: 'Transfer Details', icon: UserIcon },
    { id: 'legal', title: 'Legal Documentation', icon: DocumentTextIcon },
    { id: 'financial', title: 'Financial Impact', icon: BanknotesIcon },
    { id: 'approval', title: 'Approval Workflow', icon: ShieldCheckIcon },
    { id: 'finalization', title: 'Finalization', icon: ArrowPathIcon }
  ];

  useEffect(() => {
    if (isEdit && id) {
      // Load existing transfer data
      // In real app, this would be an API call
    }
  }, [isEdit, id]);

  const updateData = (section: keyof InvestorTransferData, updates: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...updates
      }
    }));
  };

  const validateStep = (stepIndex: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (stepIndex) {
      case 0: // Transfer Details
        if (!formData.transferDetails.transferorInvestorId) {
          newErrors.transferorInvestorId = 'Transferor investor is required';
        }
        if (!formData.transferDetails.transfereeInvestorId) {
          newErrors.transfereeInvestorId = 'Transferee investor is required';
        }
        if (!formData.transferDetails.effectiveDate) {
          newErrors.effectiveDate = 'Effective date is required';
        }
        if (formData.transferDetails.transferType === 'partial' && formData.transferDetails.transferPercentage <= 0) {
          newErrors.transferPercentage = 'Transfer percentage must be greater than 0';
        }
        break;
      case 1: // Legal Documentation
        if (!formData.legalDocumentation.transferAgreementSigned) {
          newErrors.transferAgreementSigned = 'Transfer agreement must be signed';
        }
        if (!formData.legalDocumentation.kycDocumentsUploaded) {
          newErrors.kycDocumentsUploaded = 'KYC documents must be uploaded';
        }
        break;
      case 2: // Financial Impact
        if (formData.financialImpact.transferredCommitment <= 0) {
          newErrors.transferredCommitment = 'Transferred commitment must be greater than 0';
        }
        break;
      case 3: // Approval Workflow
        if (!formData.approvalWorkflow.generalPartnerApproval) {
          newErrors.generalPartnerApproval = 'General Partner approval is required';
        }
        if (!formData.approvalWorkflow.administratorApproval) {
          newErrors.administratorApproval = 'Administrator approval is required';
        }
        break;
      case 4: // Finalization
        if (!formData.finalization.finalApprovalDate) {
          newErrors.finalApprovalDate = 'Final approval date is required';
        }
        if (!formData.finalization.settlementDate) {
          newErrors.settlementDate = 'Settlement date is required';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleComplete = async () => {
    if (!validateStep(currentStep)) return;

    setIsCompleting(true);
    try {
      // In real app, this would submit to API
      console.log('Completing investor transfer:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      navigate('/investors');
    } catch (error) {
      console.error('Error completing transfer:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <TransferDetailsStep data={formData} updateData={updateData} errors={errors} setErrors={setErrors} />;
      case 1:
        return <LegalDocumentationStep data={formData} updateData={updateData} errors={errors} setErrors={setErrors} />;
      case 2:
        return <FinancialImpactStep data={formData} updateData={updateData} errors={errors} setErrors={setErrors} />;
      case 3:
        return <ApprovalWorkflowStep data={formData} updateData={updateData} errors={errors} setErrors={setErrors} />;
      case 4:
        return <FinalizationStep data={formData} updateData={updateData} errors={errors} setErrors={setErrors} />;
      default:
        return null;
    }
  };

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStep) return 'completed';
    if (stepIndex === currentStep) return 'current';
    return 'upcoming';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/investors')}
            className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Investors
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? 'Edit' : 'New'} Investor Transfer
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Complete the investor transfer process through the following steps
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <nav aria-label="Progress">
            <ol className="flex items-center">
              {steps.map((step, index) => {
                const status = getStepStatus(index);
                const IconComponent = step.icon;
                
                return (
                  <li key={step.id} className={`relative ${index !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
                    {/* Connector Line */}
                    {index !== steps.length - 1 && (
                      <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className={`h-0.5 w-full ${
                          status === 'completed' ? 'bg-indigo-600' : 'bg-gray-200'
                        }`} />
                      </div>
                    )}
                    
                    {/* Step */}
                    <div className="relative flex items-center justify-center">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                        status === 'completed'
                          ? 'border-indigo-600 bg-indigo-600'
                          : status === 'current'
                          ? 'border-indigo-600 bg-white'
                          : 'border-gray-300 bg-white'
                      }`}>
                        {status === 'completed' ? (
                          <CheckIcon className="h-6 w-6 text-white" />
                        ) : (
                          <IconComponent className={`h-5 w-5 ${
                            status === 'current' ? 'text-indigo-600' : 'text-gray-500'
                          }`} />
                        )}
                      </div>
                      <span className={`ml-4 text-sm font-medium ${
                        status === 'current' ? 'text-indigo-600' : 'text-gray-500'
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

        {/* Step Content */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-8">
            {renderStepContent()}
          </div>

          {/* Navigation */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-between">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="h-4 w-4 mr-2" />
                Previous
              </button>

              <div className="flex space-x-3">
                {currentStep === steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleComplete}
                    disabled={isCompleting}
                    className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCompleting ? (
                      <>
                        <div className="animate-spin -ml-1 mr-3 h-4 w-4 text-white">
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        </div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckIcon className="h-4 w-4 mr-2" />
                        Complete Transfer
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
                    <ChevronRightIcon className="h-4 w-4 ml-2" />
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

// Step Components
const TransferDetailsStep: React.FC<StepProps> = ({ data, updateData, errors }) => {
  const transferDetails = data.transferDetails;

  const handleInputChange = (field: string, value: any) => {
    updateData('transferDetails', { [field]: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Transfer Details</h3>
        <p className="text-sm text-gray-600 mb-6">
          Specify the basic details of the investor transfer including transferor, transferee, and transfer amount.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Transfer Type
          </label>
          <select
            value={transferDetails.transferType}
            onChange={(e) => handleInputChange('transferType', e.target.value)}
            className="w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="full">Full Transfer</option>
            <option value="partial">Partial Transfer</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reference Number
          </label>
          <input
            type="text"
            value={transferDetails.referenceNumber}
            onChange={(e) => handleInputChange('referenceNumber', e.target.value)}
            className="w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="TR-2024-001"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Transferor Investor *
          </label>
          <select
            value={transferDetails.transferorInvestorId}
            onChange={(e) => handleInputChange('transferorInvestorId', e.target.value)}
            className={`w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.transferorInvestorId ? 'border-red-300' : ''
            }`}
          >
            <option value="">Select transferor...</option>
            <option value="inv-001">ABC Pension Fund</option>
            <option value="inv-002">XYZ Family Office</option>
            <option value="inv-003">DEF Endowment</option>
          </select>
          {errors.transferorInvestorId && (
            <p className="mt-1 text-sm text-red-600">{errors.transferorInvestorId}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Transferee Investor *
          </label>
          <select
            value={transferDetails.transfereeInvestorId}
            onChange={(e) => handleInputChange('transfereeInvestorId', e.target.value)}
            className={`w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.transfereeInvestorId ? 'border-red-300' : ''
            }`}
          >
            <option value="">Select transferee...</option>
            <option value="inv-004">GHI Insurance Company</option>
            <option value="inv-005">JKL Sovereign Fund</option>
            <option value="inv-006">MNO Foundation</option>
          </select>
          {errors.transfereeInvestorId && (
            <p className="mt-1 text-sm text-red-600">{errors.transfereeInvestorId}</p>
          )}
        </div>

        {transferDetails.transferType === 'partial' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transfer Percentage *
            </label>
            <input
              type="number"
              value={transferDetails.transferPercentage}
              onChange={(e) => handleInputChange('transferPercentage', parseFloat(e.target.value))}
              className={`w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.transferPercentage ? 'border-red-300' : ''
              }`}
              placeholder="50"
              min="0"
              max="100"
              step="0.01"
            />
            {errors.transferPercentage && (
              <p className="mt-1 text-sm text-red-600">{errors.transferPercentage}</p>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Effective Date *
          </label>
          <input
            type="date"
            value={transferDetails.effectiveDate}
            onChange={(e) => handleInputChange('effectiveDate', e.target.value)}
            className={`w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.effectiveDate ? 'border-red-300' : ''
            }`}
          />
          {errors.effectiveDate && (
            <p className="mt-1 text-sm text-red-600">{errors.effectiveDate}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Transfer Reason
        </label>
        <textarea
          value={transferDetails.transferReason}
          onChange={(e) => handleInputChange('transferReason', e.target.value)}
          rows={3}
          className="w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Provide reason for the transfer..."
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <InformationCircleIcon className="h-5 w-5 text-blue-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Transfer Information</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>• All transfers must be approved by the General Partner and Administrator</p>
              <p>• KYC/AML documentation will be required for the transferee</p>
              <p>• Transfer fees may apply as per the fund documents</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const LegalDocumentationStep: React.FC<StepProps> = ({ data, updateData, errors }) => {
  const legalDocs = data.legalDocumentation;

  const handleInputChange = (field: string, value: any) => {
    updateData('legalDocumentation', { [field]: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Legal Documentation</h3>
        <p className="text-sm text-gray-600 mb-6">
          Ensure all legal requirements and documentation are completed for the transfer.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Transfer Agreement Signed *</h4>
            <p className="text-sm text-gray-500">Legal transfer agreement executed by all parties</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={legalDocs.transferAgreementSigned}
              onChange={(e) => handleInputChange('transferAgreementSigned', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>
        {errors.transferAgreementSigned && (
          <p className="text-sm text-red-600">{errors.transferAgreementSigned}</p>
        )}

        {legalDocs.transferAgreementSigned && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Agreement Date
            </label>
            <input
              type="date"
              value={legalDocs.transferAgreementDate}
              onChange={(e) => handleInputChange('transferAgreementDate', e.target.value)}
              className="w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        )}

        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Legal Counsel Approval</h4>
            <p className="text-sm text-gray-500">Fund's legal counsel has reviewed and approved</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={legalDocs.legalCounselApproval}
              onChange={(e) => handleInputChange('legalCounselApproval', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h4 className="text-sm font-medium text-gray-900">KYC Documents Uploaded *</h4>
            <p className="text-sm text-gray-500">Transferee KYC/AML documentation complete</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={legalDocs.kycDocumentsUploaded}
              onChange={(e) => handleInputChange('kycDocumentsUploaded', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>
        {errors.kycDocumentsUploaded && (
          <p className="text-sm text-red-600">{errors.kycDocumentsUploaded}</p>
        )}

        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Accreditation Verified</h4>
            <p className="text-sm text-gray-500">Transferee accreditation status confirmed</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={legalDocs.accreditationVerified}
              onChange={(e) => handleInputChange('accreditationVerified', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Regulatory Approval</h4>
            <p className="text-sm text-gray-500">Required regulatory approvals obtained</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={legalDocs.regulatoryApproval}
              onChange={(e) => handleInputChange('regulatoryApproval', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Side Letter Required</h4>
            <p className="text-sm text-gray-500">Special terms or conditions needed</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={legalDocs.sideLetterRequired}
              onChange={(e) => handleInputChange('sideLetterRequired', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        {legalDocs.sideLetterRequired && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Side Letter Details
            </label>
            <textarea
              value={legalDocs.sideLetterDetails || ''}
              onChange={(e) => handleInputChange('sideLetterDetails', e.target.value)}
              rows={3}
              className="w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Describe special terms or conditions..."
            />
          </div>
        )}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Legal Requirements</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>• Transfer agreement must be executed before proceeding</p>
              <p>• All KYC/AML requirements must be satisfied</p>
              <p>• Regulatory approval may be required based on jurisdiction</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FinancialImpactStep: React.FC<StepProps> = ({ data, updateData, errors }) => {
  const financial = data.financialImpact;

  const handleInputChange = (field: string, value: any) => {
    updateData('financialImpact', { [field]: value });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Impact</h3>
        <p className="text-sm text-gray-600 mb-6">
          Review and confirm the financial implications of the transfer.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Commitment
          </label>
          <input
            type="number"
            value={financial.currentCommitment}
            onChange={(e) => handleInputChange('currentCommitment', parseFloat(e.target.value) || 0)}
            className="w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="10000000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Transferred Commitment *
          </label>
          <input
            type="number"
            value={financial.transferredCommitment}
            onChange={(e) => handleInputChange('transferredCommitment', parseFloat(e.target.value) || 0)}
            className={`w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.transferredCommitment ? 'border-red-300' : ''
            }`}
            placeholder="5000000"
          />
          {errors.transferredCommitment && (
            <p className="mt-1 text-sm text-red-600">{errors.transferredCommitment}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Remaining Commitment
          </label>
          <input
            type="number"
            value={financial.remainingCommitment}
            onChange={(e) => handleInputChange('remainingCommitment', parseFloat(e.target.value) || 0)}
            className="w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="5000000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Capital Contributed
          </label>
          <input
            type="number"
            value={financial.capitalContributed}
            onChange={(e) => handleInputChange('capitalContributed', parseFloat(e.target.value) || 0)}
            className="w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="3000000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Distributions Received
          </label>
          <input
            type="number"
            value={financial.distributionsReceived}
            onChange={(e) => handleInputChange('distributionsReceived', parseFloat(e.target.value) || 0)}
            className="w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="500000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Unrealized Value
          </label>
          <input
            type="number"
            value={financial.unrealizedValue}
            onChange={(e) => handleInputChange('unrealizedValue', parseFloat(e.target.value) || 0)}
            className="w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="3500000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Management Fees Owed
          </label>
          <input
            type="number"
            value={financial.managementFeesOwed}
            onChange={(e) => handleInputChange('managementFeesOwed', parseFloat(e.target.value) || 0)}
            className="w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="100000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Carried Interest Impact
          </label>
          <input
            type="number"
            value={financial.carriedInterestImpact}
            onChange={(e) => handleInputChange('carriedInterestImpact', parseFloat(e.target.value) || 0)}
            className="w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="200000"
          />
        </div>
      </div>

      {/* Financial Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Transfer Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg">
            <div className="text-sm font-medium text-gray-500">Transfer Value</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(financial.transferredCommitment)}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <div className="text-sm font-medium text-gray-500">Net Asset Value</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(financial.unrealizedValue)}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <div className="text-sm font-medium text-gray-500">Total Fees</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(financial.managementFeesOwed + financial.carriedInterestImpact)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ApprovalWorkflowStep: React.FC<StepProps> = ({ data, updateData, errors }) => {
  const approval = data.approvalWorkflow;

  const handleInputChange = (field: string, value: any) => {
    updateData('approvalWorkflow', { [field]: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Approval Workflow</h3>
        <p className="text-sm text-gray-600 mb-6">
          Obtain all required approvals and complete necessary notifications.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h4 className="text-sm font-medium text-gray-900">General Partner Approval *</h4>
            <p className="text-sm text-gray-500">GP has approved the transfer</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={approval.generalPartnerApproval}
              onChange={(e) => handleInputChange('generalPartnerApproval', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>
        {errors.generalPartnerApproval && (
          <p className="text-sm text-red-600">{errors.generalPartnerApproval}</p>
        )}

        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Administrator Approval *</h4>
            <p className="text-sm text-gray-500">Fund administrator has approved</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={approval.administratorApproval}
              onChange={(e) => handleInputChange('administratorApproval', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>
        {errors.administratorApproval && (
          <p className="text-sm text-red-600">{errors.administratorApproval}</p>
        )}

        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Auditors Notified</h4>
            <p className="text-sm text-gray-500">Auditors have been informed of transfer</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={approval.auditorsNotified}
              onChange={(e) => handleInputChange('auditorsNotified', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Investor Notification</h4>
            <p className="text-sm text-gray-500">All investors have been notified</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={approval.investorNotification}
              onChange={(e) => handleInputChange('investorNotification', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Board Approval</h4>
            <p className="text-sm text-gray-500">Board of directors approval if required</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={approval.boardApproval}
              onChange={(e) => handleInputChange('boardApproval', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Regulatory Filing</h4>
            <p className="text-sm text-gray-500">Required regulatory filings completed</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={approval.regulatoryFiling}
              onChange={(e) => handleInputChange('regulatoryFiling', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Transfer Fee Calculated</h4>
            <p className="text-sm text-gray-500">Transfer fees calculated and documented</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={approval.transferFeeCalculated}
              onChange={(e) => handleInputChange('transferFeeCalculated', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        {approval.transferFeeCalculated && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transfer Fee Amount
            </label>
            <input
              type="number"
              value={approval.transferFeeAmount}
              onChange={(e) => handleInputChange('transferFeeAmount', parseFloat(e.target.value) || 0)}
              className="w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="25000"
            />
          </div>
        )}
      </div>
    </div>
  );
};

const FinalizationStep: React.FC<StepProps> = ({ data, updateData, errors }) => {
  const finalization = data.finalization;

  const handleInputChange = (field: string, value: any) => {
    updateData('finalization', { [field]: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Finalization</h3>
        <p className="text-sm text-gray-600 mb-6">
          Complete the final steps to execute the investor transfer.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Final Approval Date *
          </label>
          <input
            type="date"
            value={finalization.finalApprovalDate}
            onChange={(e) => handleInputChange('finalApprovalDate', e.target.value)}
            className={`w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.finalApprovalDate ? 'border-red-300' : ''
            }`}
          />
          {errors.finalApprovalDate && (
            <p className="mt-1 text-sm text-red-600">{errors.finalApprovalDate}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Settlement Date *
          </label>
          <input
            type="date"
            value={finalization.settlementDate}
            onChange={(e) => handleInputChange('settlementDate', e.target.value)}
            className={`w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.settlementDate ? 'border-red-300' : ''
            }`}
          />
          {errors.settlementDate && (
            <p className="mt-1 text-sm text-red-600">{errors.settlementDate}</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Capitalization Table Updated</h4>
            <p className="text-sm text-gray-500">Cap table reflects new ownership structure</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={finalization.capitalizationTableUpdated}
              onChange={(e) => handleInputChange('capitalizationTableUpdated', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Investor Reports Updated</h4>
            <p className="text-sm text-gray-500">All investor reports reflect transfer</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={finalization.investorReportsUpdated}
              onChange={(e) => handleInputChange('investorReportsUpdated', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Registry Updated</h4>
            <p className="text-sm text-gray-500">Fund registry and records updated</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={finalization.registryUpdated}
              onChange={(e) => handleInputChange('registryUpdated', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Tax Documents Generated</h4>
            <p className="text-sm text-gray-500">Required tax documentation prepared</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={finalization.taxDocumentsGenerated}
              onChange={(e) => handleInputChange('taxDocumentsGenerated', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Confirmation Sent</h4>
            <p className="text-sm text-gray-500">Transfer confirmation sent to all parties</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={finalization.confirmationSent}
              onChange={(e) => handleInputChange('confirmationSent', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Final Notes
        </label>
        <textarea
          value={finalization.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          rows={4}
          className="w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Add any final notes or comments about the transfer..."
        />
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex">
          <CheckIcon className="h-5 w-5 text-green-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">Ready to Complete</h3>
            <div className="mt-2 text-sm text-green-700">
              <p>• All required documentation has been completed</p>
              <p>• Approvals have been obtained from all necessary parties</p>
              <p>• Financial calculations have been verified</p>
              <p>• System updates will be processed upon completion</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestorTransferWizard;