import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { checkKYCStatus } from '../../services/apiService';

interface KYCStatusCheckProps {
  walletAddress: string;
  onKYCComplete: (status: any) => void;
  onKYCRequired: () => void;
}

interface KYCData {
  verified: boolean;
  status?: string;
  userId?: string;
  submittedAt?: string;
  approvedAt?: string;
}

const KYCStatusCheck: React.FC<KYCStatusCheckProps> = ({
  walletAddress,
  onKYCComplete,
  onKYCRequired
}) => {
  const [kycStatus, setKycStatus] = useState<'checking' | 'verified' | 'pending' | 'required'>('checking');
  const [kycData, setKycData] = useState<KYCData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (walletAddress) {
      checkKYCStatusAsync();
    }
  }, [walletAddress]);

  const checkKYCStatusAsync = async () => {
    try {
      setIsChecking(true);
      setKycStatus('checking');
      setError(null);

      console.log('Checking KYC status for wallet:', walletAddress);

      // Call the API directly to get more detailed response
      const BRIDGE_URL = (process.env.REACT_APP_BRIDGE_URL || 'http://localhost:3002').replace(/\/$/, '');
      const apiResponse = await fetch(`${BRIDGE_URL}/api/kyc/status/${walletAddress}`);

      console.log('KYC API Response status:', apiResponse.status);

      if (apiResponse.status === 404) {
        console.log('KYC not found for wallet, setting as required');
        setKycStatus('required');
        setIsChecking(false);
        return;
      }

      if (!apiResponse.ok) {
        throw new Error('KYC API error: ' + apiResponse.status);
      }

      const result = await apiResponse.json();
      console.log('KYC API Response data:', result);

      // Check various possible response formats
      const isVerified = result?.status === 'approved' ||
                        result?.kycVerified === true ||
                        result?.verified === true ||
                        result?.status === 'verified';

      const isPending = result?.status === 'pending' ||
                       result?.status === 'submitted' ||
                       result?.status === 'under_review';

      if (isVerified) {
        console.log('KYC is verified, proceeding to next step');
        setKycStatus('verified');
        setKycData(result as KYCData);

        // Automatically proceed to next step
        setTimeout(() => {
          onKYCComplete(result);
        }, 1500);
      } else if (isPending) {
        console.log('KYC is pending');
        setKycStatus('pending');
        setKycData(result as KYCData);
      } else {
        console.log('KYC is required, response:', result);
        setKycStatus('required');
      }

      setIsChecking(false);

    } catch (error: any) {
      console.error('KYC check error:', error);
      setError('Failed to check KYC status: ' + (error.message || 'Unknown error'));
      setKycStatus('required');
      setIsChecking(false);
    }
  };

  const handleRetryCheck = () => {
    checkKYCStatusAsync();
  };

  const handleCompleteKYC = () => {
    onKYCRequired();
  };

  // Loading Skeleton
  const LoadingSkeleton = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <div className="flex justify-center mb-6">
        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.1, 1],
          }}
          transition={{
            rotate: { duration: 2, repeat: Infinity, ease: "linear" },
            scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
          }}
          className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center"
        >
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </motion.div>
      </div>
      <div className="h-6 bg-gray-200 rounded-lg w-3/4 mx-auto animate-pulse" />
      <div className="h-4 bg-gray-100 rounded w-5/6 mx-auto animate-pulse" />
    </motion.div>
  );

  // Status Content
  const renderStatusContent = () => {
    if (kycStatus === 'checking' || isChecking) {
      return <LoadingSkeleton />;
    }

    switch (kycStatus) {
      case 'verified':
        return (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mb-6 relative inline-block"
            >
              <div className="absolute inset-0 bg-green-500/20 blur-2xl rounded-full animate-pulse" />
              <div className="relative w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-2xl">
                <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </motion.div>

            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              KYC Verified ✓
            </h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Your identity has been successfully verified. You can now proceed with instant transfers.
            </p>
            {kycData?.userId && (
              <div className="inline-block px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs text-gray-600">User ID</p>
                <p className="text-sm font-mono text-green-700">{kycData.userId}</p>
              </div>
            )}
          </motion.div>
        );

      case 'pending':
        return (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            {/* Pending Icon with Animation */}
            <motion.div
              className="mb-6 relative inline-block"
            >
              <div className="absolute inset-0 bg-orange-500/20 blur-2xl rounded-full" />
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 10, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="relative w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-2xl"
              >
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </motion.div>
              {/* Pulse rings */}
              <motion.div
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeOut"
                }}
                className="absolute inset-0 border-4 border-orange-400 rounded-full"
              />
            </motion.div>

            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              KYC Under Review
            </h3>
            <p className="text-gray-600 mb-6 leading-relaxed max-w-md mx-auto">
              Your KYC submission is being processed. Our team typically completes verification within 24-48 hours.
            </p>

            {/* Check Status Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRetryCheck}
              disabled={isChecking}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isChecking ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Checking...
                </span>
              ) : (
                'Check Status Again'
              )}
            </motion.button>

            {/* What Happens Next */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100"
            >
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                What Happens Next
              </h4>
              <div className="space-y-2 text-left">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">Our team is reviewing your submitted documents</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">You'll receive an email notification once approved</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">After approval, you can initiate transfers instantly to verified bank accounts</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        );

      case 'required':
        return (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            {/* Warning Icon */}
            <motion.div
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="mb-6 relative inline-block"
            >
              <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full" />
              <div className="relative w-24 h-24 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center shadow-2xl">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </motion.div>

            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              KYC Verification Required
            </h3>
            <p className="text-gray-600 mb-6 leading-relaxed max-w-md mx-auto">
              To send money transfers, you need to complete KYC verification first. This ensures compliance with financial regulations and protects your account.
            </p>

            {/* Required Documents */}
            <div className="mb-6 p-6 bg-gray-50 rounded-xl border border-gray-200 text-left max-w-md mx-auto">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Required Documents:</h4>
              <div className="space-y-3">
                {[
                  { icon: (
                      <svg className="w-5 h-5 text-gray-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                      </svg>
                    ), text: 'Government-issued Photo ID (Passport, Driver\'s License)' },
                  { icon: (
                      <svg className="w-5 h-5 text-gray-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    ), text: 'Proof of Address (Utility Bill, Bank Statement)' },
                  { icon: (
                      <svg className="w-5 h-5 text-gray-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    ), text: 'Selfie for identity verification' }
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <span className="flex-shrink-0">{item.icon}</span>
                    <p className="text-sm text-gray-700">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCompleteKYC}
              className="w-full max-w-md mx-auto bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Complete KYC Verification
            </motion.button>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50 rounded-3xl -z-10" />

      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-100 p-8 md:p-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            KYC Verification Status
          </h2>
          <div className="inline-block px-4 py-1.5 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
            Step 1 of 5
          </div>
        </div>

        {/* Status Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={kycStatus}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderStatusContent()}
          </motion.div>
        </AnimatePresence>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3 max-w-md mx-auto"
            >
              <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">{error}</p>
                <button
                  onClick={handleRetryCheck}
                  className="text-sm text-red-700 underline hover:text-red-900 mt-1"
                >
                  Try Again
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Security Badge */}
        {kycStatus === 'verified' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 flex items-center gap-3"
          >
            <svg className="w-6 h-6 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <p className="text-sm text-gray-700">
              Your transfers are protected by blockchain technology and regulatory compliance.
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default KYCStatusCheck;
