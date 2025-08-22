import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store/store';
import { createInvestor, updateInvestor, Investor } from '../../store/slices/investorSlice';
import { investorSchema, validateForm, formatDateForBackend, formatDateForInput } from '../../utils/validation';
import { InvestorFormData } from '../../types/api';

interface InvestorFormProps {
  investor?: Investor;
  onSubmit?: (investor: Investor) => void;
  onCancel?: () => void;
}

const InvestorForm: React.FC<InvestorFormProps> = ({ investor, onSubmit, onCancel }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [formData, setFormData] = useState<InvestorFormData>({
    name: '',
    legalName: '',
    type: 'institution',
    entityType: '',
    taxId: '',
    registrationNumber: '',
    domicile: 'US',
    taxResidence: '',
    accreditedInvestor: false,
    qualifiedPurchaser: false,
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    primaryContact: '',
    primaryEmail: '',
    primaryPhone: '',
    kycStatus: 'pending',
    kycDate: undefined,
    amlStatus: 'pending',
    amlDate: undefined,
    notes: '',
    metadata: {}
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (investor) {
      setFormData(investor);
    }
  }, [investor]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate form
    const { errors: validationErrors, isValid } = await validateForm(investorSchema, formData);
    if (!isValid) {
      setErrors(validationErrors);
      setIsLoading(false);
      return;
    }

    try {
      // Format dates for backend and ensure required fields
      const submissionData: InvestorFormData = {
        name: formData.name || '',
        legalName: formData.legalName || '',
        type: formData.type || 'institution',
        domicile: formData.domicile || 'US',
        accreditedInvestor: formData.accreditedInvestor || false,
        qualifiedPurchaser: formData.qualifiedPurchaser || false,
        kycStatus: formData.kycStatus || 'pending',
        amlStatus: formData.amlStatus || 'pending',
        entityType: formData.entityType,
        taxId: formData.taxId,
        registrationNumber: formData.registrationNumber,
        taxResidence: formData.taxResidence,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        postalCode: formData.postalCode,
        country: formData.country,
        primaryContact: formData.primaryContact,
        primaryEmail: formData.primaryEmail,
        primaryPhone: formData.primaryPhone,
        kycDate: formatDateForBackend(formData.kycDate),
        amlDate: formatDateForBackend(formData.amlDate),
        notes: formData.notes,
        metadata: formData.metadata || {}
      };

      let result;
      if (investor?.id) {
        result = await dispatch(updateInvestor({ id: investor.id, data: submissionData })).unwrap();
      } else {
        result = await dispatch(createInvestor(submissionData)).unwrap();
      }

      if (onSubmit) {
        onSubmit(result.data);
      }
    } catch (error) {
      console.error('Failed to save investor:', error);
      setErrors({ general: 'Failed to save investor. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {investor ? 'Edit Investor' : 'Create New Investor'}
      </h2>
      
      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-red-800">{errors.general}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Legal Name *</label>
              <input
                type="text"
                name="legalName"
                value={formData.legalName || ''}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.legalName ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              />
              {errors.legalName && <p className="mt-1 text-sm text-red-600">{errors.legalName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <select
                name="type"
                value={formData.type || 'institution'}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.type ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              >
                <option value="individual">Individual</option>
                <option value="institution">Institution</option>
                <option value="fund">Fund</option>
                <option value="trust">Trust</option>
                <option value="other">Other</option>
              </select>
              {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
              <input
                type="text"
                name="entityType"
                value={formData.entityType || ''}
                onChange={handleChange}
                placeholder="e.g., Pension Fund, Endowment"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID</label>
              <input
                type="text"
                name="taxId"
                value={formData.taxId || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
              <input
                type="text"
                name="registrationNumber"
                value={formData.registrationNumber || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Location Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Location Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Domicile (Country Code) *</label>
              <input
                type="text"
                name="domicile"
                value={formData.domicile || ''}
                onChange={handleChange}
                maxLength={2}
                placeholder="US"
                className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.domicile ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              />
              {errors.domicile && <p className="mt-1 text-sm text-red-600">{errors.domicile}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tax Residence</label>
              <input
                type="text"
                name="taxResidence"
                value={formData.taxResidence || ''}
                onChange={handleChange}
                maxLength={2}
                placeholder="US"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                name="city"
                value={formData.city || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input
                type="text"
                name="state"
                value={formData.state || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
              <input
                type="text"
                name="postalCode"
                value={formData.postalCode || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input
                type="text"
                name="country"
                value={formData.country || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Primary Contact</label>
              <input
                type="text"
                name="primaryContact"
                value={formData.primaryContact || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Primary Email</label>
              <input
                type="email"
                name="primaryEmail"
                value={formData.primaryEmail || ''}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.primaryEmail ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.primaryEmail && <p className="mt-1 text-sm text-red-600">{errors.primaryEmail}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Primary Phone</label>
              <input
                type="tel"
                name="primaryPhone"
                value={formData.primaryPhone || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Qualification Status */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Qualification Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="accreditedInvestor"
                name="accreditedInvestor"
                checked={formData.accreditedInvestor || false}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="accreditedInvestor" className="ml-2 block text-sm text-gray-900">
                Accredited Investor
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="qualifiedPurchaser"
                name="qualifiedPurchaser"
                checked={formData.qualifiedPurchaser || false}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="qualifiedPurchaser" className="ml-2 block text-sm text-gray-900">
                Qualified Purchaser
              </label>
            </div>
          </div>
        </div>

        {/* Compliance Status */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Compliance Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">KYC Status</label>
              <select
                name="kycStatus"
                value={formData.kycStatus || 'pending'}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">KYC Date</label>
              <input
                type="date"
                name="kycDate"
                value={formatDateForInput(formData.kycDate)}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">AML Status</label>
              <select
                name="amlStatus"
                value={formData.amlStatus || 'pending'}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">AML Date</label>
              <input
                type="date"
                name="amlDate"
                value={formatDateForInput(formData.amlDate)}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            name="notes"
            value={formData.notes || ''}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Additional notes or comments..."
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : investor ? 'Update Investor' : 'Create Investor'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InvestorForm;
