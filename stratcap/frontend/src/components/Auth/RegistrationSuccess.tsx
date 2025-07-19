import React from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircleIcon,
  EnvelopeIcon,
  ClockIcon,
  ShieldCheckIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const RegistrationSuccess: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <CheckCircleIcon className="h-16 w-16 text-green-500" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Registration Successful!
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Your account request has been submitted
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            {/* Success Message */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex">
                <CheckCircleIcon className="h-5 w-5 text-green-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Account Created Successfully
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>Thank you for registering with StratCap Fund Administration Platform.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">What happens next?</h3>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100">
                      <EnvelopeIcon className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">Email Confirmation</h4>
                    <p className="text-sm text-gray-500">
                      Check your inbox for a confirmation email. Click the link to verify your email address.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-yellow-100">
                      <ClockIcon className="h-5 w-5 text-yellow-600" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">Administrator Review</h4>
                    <p className="text-sm text-gray-500">
                      Your account will be reviewed by our administrators. This typically takes 1-2 business days.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-100">
                      <ShieldCheckIcon className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">Account Activation</h4>
                    <p className="text-sm text-gray-500">
                      Once approved, you'll receive an activation email with instructions to complete your setup.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Important Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Important Information</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Your temporary account ID will be sent via email</li>
                      <li>Multi-factor authentication will be required upon first login</li>
                      <li>Contact support if you don't receive confirmation within 24 hours</li>
                      <li>Account approval notifications are sent to your registered email</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Support */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Need Help?</h4>
              <p className="text-sm text-gray-600 mb-4">
                If you have any questions or issues with your registration, please contact our support team.
              </p>
              <div className="space-y-2 text-sm">
                <p className="text-gray-600">
                  <span className="font-medium">Email:</span>{' '}
                  <a href="mailto:support@stratcap.com" className="text-indigo-600 hover:text-indigo-500">
                    support@stratcap.com
                  </a>
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Phone:</span>{' '}
                  <a href="tel:+1-555-0123" className="text-indigo-600 hover:text-indigo-500">
                    +1 (555) 012-3456
                  </a>
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Hours:</span> Monday - Friday, 9:00 AM - 6:00 PM EST
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col space-y-3">
              <Link
                to="/auth/login"
                className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Return to Login
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
              
              <Link
                to="/contact"
                className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationSuccess;